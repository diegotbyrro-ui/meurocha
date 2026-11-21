import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {bibliotecaCategorias} from '../lib/biblioteca.mjs';
const read=p=>readFileSync(join(process.cwd(),p),'utf8');
const layout=read('app/portal/layout.tsx');
const css=read('app/portal/portal.css');
const page=read('app/portal/biblioteca/page.tsx');
const client=read('app/portal/biblioteca/BibliotecaClient.tsx');
test('R79: menu lateral com quatro modulos e versao mobile',()=>{
  assert.match(layout,/r79-sidebar/);
  assert.match(layout,/r79-mobile-menu/);
  for(const path of ['/portal/gestao','/portal/biblioteca','/portal/simulador']) assert.ok(layout.includes(path));
});
test('R79: logo oficial tem fundo escuro no login e menu',()=>{
  assert.match(layout,/r79-login-logo/);
  assert.match(layout,/r79-logo-dark/);
  assert.match(css,/\.r79-logo-dark.*background:/);
});
test('R79: 16 categorias do catalogo original preservadas',()=>{
  assert.equal(bibliotecaCategorias.length,16);
  assert.match(page,/bibliotecaCategorias/);
  assert.match(client,/categorias\.filter/);
});
test('R79: upload em armazenamento local IndexedDB sem publicar dados',()=>{
  assert.match(client,/indexedDB\.open/);
  assert.match(client,/type="file"/);
  assert.match(client,/blob: f/);
  assert.doesNotMatch(client,/fetch\(|supabase\.storage|createClient\(/);
});
test('R79: acesso ao portal preserva a verificacao no servidor',()=>{
  assert.match(layout,/if\(!portalCookieValid\(cookie\)\)/);
  assert.doesNotMatch(layout,/localStorage|mockAdmin/);
});
