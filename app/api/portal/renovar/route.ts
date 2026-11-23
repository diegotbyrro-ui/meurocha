import { NextResponse } from 'next/server';
import { criarSessao, lerSessao, originAllowed, PORTAL_COOKIE, portalCookieOptions } from '@/lib/portal-rocha-auth';
import { corretorAtivo } from '@/lib/portal-corretor-status';

// R85 - Renova o login do corretor (login permanente). Chamado pela própria página, no máximo 1x por visita.
export async function POST(request: Request) {
  if (!originAllowed(request)) return new NextResponse(null, { status: 403 });
  const sessao = lerSessao(request.headers.get('cookie'));
  if (!sessao || sessao.t !== 'corretor') return new NextResponse(null, { status: 204 });
  const response = new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  if (!(await corretorAtivo(sessao.id))) {
    response.cookies.set(PORTAL_COOKIE, '', { ...portalCookieOptions('corretor'), maxAge: 0 });
    return response;
  }
  const { t, id, nome, creci, uf } = sessao;
  response.cookies.set(PORTAL_COOKIE, criarSessao({ t, id, nome, creci, uf }), portalCookieOptions('corretor'));
  return response;
}
