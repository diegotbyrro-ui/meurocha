import { NextResponse } from 'next/server';
import { createPortalSession, portalCookieOptions, PORTAL_COOKIE, originAllowed, portalLimit, portalLoginConfigured, validatePortalPassword } from '@/lib/portal-rocha-auth';

export async function POST(request: Request) {
  if (!originAllowed(request)) return new NextResponse('Origem invalida.', {status:403, headers:{'Cache-Control':'no-store'}});
  const len = Number(request.headers.get('content-length') || '0');
  if (!Number.isFinite(len) || len > 4096) return new NextResponse('Formulario invalido.', {status:413});
  if (!portalLoginConfigured()) return new NextResponse('Portal ainda sem credenciais no servidor.', {status:503});
  const ip = (request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  if (!portalLimit(ip)) return new NextResponse('Tentativas excedidas. Tente mais tarde.', {status:429, headers:{'Cache-Control':'no-store'}});
  try {
    const form = await request.formData();
    const pwd = String(form.get('senha') || '');
    if (!validatePortalPassword(pwd)) return new NextResponse('Senha incorreta.', {status:401, headers:{'Cache-Control':'no-store'}});
    const response = NextResponse.redirect('https://conviterocha.com.br/portal', {status:303});
    response.cookies.set(PORTAL_COOKIE,createPortalSession(),portalCookieOptions());
    response.headers.set('Cache-Control','no-store');
    return response;
  } catch { return new NextResponse('Requisicao invalida.', {status:400}); }
}
