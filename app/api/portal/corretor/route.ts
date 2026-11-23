import { NextResponse } from 'next/server';
import { criarSessao, ipDaRequisicao, origemPortal, originAllowed, portalCookieOptions, PORTAL_COOKIE, portalLimit, portalLoginConfigured } from '@/lib/portal-rocha-auth';
import { supabaseAdmin } from '@/lib/portal-supabase';
import { normalizarCreci, normalizarUf, validarCadastroCorretor } from '@/lib/portal-acesso.mjs';

// R85 - Entrada do corretor só com CRECI + UF, sem senha (decisão do cliente: o portal
// mostra documentos públicos e o simulador). No primeiro acesso pede nome, WhatsApp e imobiliária.
function voltar(request: Request, params: Record<string, string>) {
  const q = new URLSearchParams(params).toString();
  return NextResponse.redirect(`${origemPortal(request)}/portal?${q}`, { status: 303, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  if (!originAllowed(request)) return new NextResponse('Origem invalida.', { status: 403, headers: { 'Cache-Control': 'no-store' } });
  const len = Number(request.headers.get('content-length') || '0');
  if (!Number.isFinite(len) || len > 4096) return new NextResponse('Formulario invalido.', { status: 413 });
  if (!portalLoginConfigured()) return voltar(request, { aviso: 'sem-configuracao' });
  if (!portalLimit(`corretor:${ipDaRequisicao(request)}`, 20, 15)) return voltar(request, { aviso: 'muitas-tentativas' });
  try {
    const form = await request.formData();
    const creci = normalizarCreci(String(form.get('creci') || ''));
    const uf = normalizarUf(String(form.get('uf') || ''));
    if (!creci || !uf) return voltar(request, { aviso: 'creci-invalido' });
    const db = supabaseAdmin();
    let { data: corretor } = await db.from('portal_corretores').select('id, nome, status').eq('creci', creci).eq('uf', uf).maybeSingle();
    if (!corretor) {
      if (form.get('cadastro') !== '1') return voltar(request, { aviso: 'primeiro-acesso', creci, uf });
      const v = validarCadastroCorretor({ creci, uf, nome: form.get('nome'), whatsapp: form.get('whatsapp'), imobiliaria: form.get('imobiliaria'), email: form.get('email') });
      if (!v.ok) return voltar(request, { aviso: 'cadastro-invalido', creci, uf, msg: v.erro });
      const { data: novo, error } = await db.from('portal_corretores').insert(v.valor).select('id, nome, status').single();
      if (error || !novo) {
        // Outra aba pode ter cadastrado o mesmo CRECI ao mesmo tempo: tenta ler de novo.
        const again = await db.from('portal_corretores').select('id, nome, status').eq('creci', creci).eq('uf', uf).maybeSingle();
        if (!again.data) return voltar(request, { aviso: 'erro-servidor' });
        corretor = again.data;
      } else corretor = novo;
    }
    if (corretor.status !== 'ativo') return voltar(request, { aviso: 'corretor-bloqueado' });
    await db.rpc('portal_registrar_acesso_corretor', { p_id: corretor.id });
    const response = NextResponse.redirect(`${origemPortal(request)}/portal`, { status: 303 });
    response.cookies.set(PORTAL_COOKIE, criarSessao({ t: 'corretor', id: corretor.id, nome: corretor.nome, creci, uf }), portalCookieOptions('corretor'));
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch {
    return voltar(request, { aviso: 'erro-servidor' });
  }
}
