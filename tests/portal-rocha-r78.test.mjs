import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const read=p=>readFileSync(join(process.cwd(),p),'utf8');
const layout=read('app/portal/layout.tsx');
const auth=read('lib/portal-rocha-auth.ts');
const login=read('app/api/portal/login/route.ts');
const gestao=read('app/portal/gestao/page.tsx');
test('R78: portal fechado por cookie servidor, nao por estado do navegador',()=>{
  assert.match(layout,/portalCookieValid\(cookie\)/);
  assert.match(layout,/if\(!portalCookieValid\(cookie\)\)/);
  assert.doesNotMatch(layout,/localStorage|sessionStorage|mockAdmin/);
});
test('R78: login seguro, segredo so no servidor, cookie httpOnly e secure em producao',()=>{
  // R85: a senha única da equipe foi substituída por logins individuais (Supabase Auth) e CRECI.
  assert.doesNotMatch(auth,/ROCHA_PORTAL_PASSWORD/);
  assert.match(auth,/ROCHA_PORTAL_COOKIE_SECRET/);
  assert.match(auth,/createHmac/);
  assert.match(auth,/timingSafeEqual/);
  assert.match(auth,/httpOnly: true/);
  // R85: 'lax' para links do WhatsApp abrirem já logado; POSTs seguem protegidos por originAllowed.
  assert.match(auth,/sameSite: 'lax'/);
  assert.match(login,/originAllowed\(request\)/);
  assert.match(login,/portalLimit\(ip\)/);
  assert.doesNotMatch(layout,/NEXT_PUBLIC_ROCHA_PORTAL_PASSWORD|NEXT_PUBLIC_ROCHA_PORTAL_COOKIE_SECRET/);
});
test('R78: rotas do portal separadas do sistema de convites e do Easy Rota do Mar',()=>{
  for(const p of ['app/portal/page.tsx','app/portal/gestao/page.tsx','app/portal/biblioteca/page.tsx','app/portal/simulador/page.tsx','app/api/portal/logout/route.ts'])assert.ok(existsSync(p));
  assert.match(gestao,/plataforma\/gestao\/GestaoClient/);
  assert.match(read('app/portal/simulador/page.tsx'),/SimuladorNativo/);
  assert.match(read('app/portal/biblioteca/page.tsx'),/bibliotecaCategorias/);
});
test('R78: nao conecta dados reais ou uploads, preserva simulador demonstrativo',()=>{
  for(const p of ['app/portal/page.tsx','app/portal/biblioteca/page.tsx','app/portal/gestao/page.tsx'])assert.doesNotMatch(read(p),/createClient\(|service_role|upload\(/);
  assert.match(read('app/portal/page.tsx'),/sem publicação automática|sem publicação/i);
});
test('R78: CSS isolado',()=>{
  const css=read('app/portal/portal.css');
  assert.match(css,/\.rocha-portal\{/);
  assert.doesNotMatch(css,/^(?:\s*)(?:body|html|:root)\s*\{/m);
});
