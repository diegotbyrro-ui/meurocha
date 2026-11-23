import { NextResponse } from 'next/server';
import { criarSessao, ipDaRequisicao, origemPortal, originAllowed, portalCookieOptions, PORTAL_COOKIE, portalLimit, portalLoginConfigured } from '@/lib/portal-rocha-auth';
import { supabaseAdmin, supabaseLogin } from '@/lib/portal-supabase';

// R85 - Login da equipe Rocha (diretoria, marketing e equipe) com e-mail e senha do Supabase Auth.
function voltar(request: Request, aviso: string) {
  return NextResponse.redirect(`${origemPortal(request)}/portal?aviso=${aviso}`, { status: 303, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  if (!originAllowed(request)) return new NextResponse('Origem invalida.', { status: 403, headers: { 'Cache-Control': 'no-store' } });
  const len = Number(request.headers.get('content-length') || '0');
  if (!Number.isFinite(len) || len > 4096) return new NextResponse('Formulario invalido.', { status: 413 });
  if (!portalLoginConfigured()) return voltar(request, 'sem-configuracao');
  const ip = ipDaRequisicao(request);
  if (!portalLimit(ip)) return voltar(request, 'muitas-tentativas');
  try {
    const form = await request.formData();
    const email = String(form.get('email') || '').trim().toLowerCase().slice(0, 120);
    const senha = String(form.get('senha') || '').slice(0, 200);
    if (!email || !senha) return voltar(request, 'login-invalido');
    const { data, error } = await supabaseLogin().auth.signInWithPassword({ email, password: senha });
    if (error || !data.user) return voltar(request, 'login-invalido');
    const { data: pessoa } = await supabaseAdmin().from('portal_equipe').select('id, nome, setor, ativo').eq('id', data.user.id).maybeSingle();
    if (!pessoa || !pessoa.ativo) return voltar(request, 'equipe-inativa');
    await supabaseAdmin().from('portal_acessos').insert({ tipo: 'equipe', pessoa_id: pessoa.id });
    const response = NextResponse.redirect(`${origemPortal(request)}/portal`, { status: 303 });
    response.cookies.set(PORTAL_COOKIE, criarSessao({ t: 'equipe', id: pessoa.id, nome: pessoa.nome, setor: pessoa.setor }), portalCookieOptions('equipe'));
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch {
    return voltar(request, 'erro-servidor');
  }
}
