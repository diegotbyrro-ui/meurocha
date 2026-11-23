import { NextResponse } from 'next/server';
import { PORTAL_COOKIE, origemPortal, originAllowed, portalCookieOptions } from '@/lib/portal-rocha-auth';
export async function POST(request: Request) {
  if (!originAllowed(request)) return new NextResponse('Origem invalida.', {status:403});
  const response = NextResponse.redirect(`${origemPortal(request)}/portal`, {status:303});
  response.cookies.set(PORTAL_COOKIE,'',{...portalCookieOptions(),maxAge:0});
  response.headers.set('Cache-Control','no-store');
  return response;
}
