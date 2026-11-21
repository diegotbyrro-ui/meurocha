import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bibliotecaCategorias } from '../lib/biblioteca.mjs';
const read = (path) => readFileSync(new URL('../'+path, import.meta.url), 'utf8');
const layout = read('app/portal/layout.tsx');
const client = read('app/portal/biblioteca/BibliotecaClient.tsx');
const css = read('app/portal/portal.css');
test('R80 R2: preserva as 16 pastas oficiais sem operacao para remover pasta', () => {
  assert.equal(bibliotecaCategorias.length,16);
  assert.match(client,/categorias\.filter/);
  assert.match(client,/r80-folder-symbol/);
  assert.doesNotMatch(client,/excluirCategoria|removerCategoria|deleteCategory/);
});
test('R80 R2: limite de 150 MB por arquivo', () => {
  assert.match(client,/MAX_SIZE = 150 \* 1024 \* 1024/);
  assert.match(client,/150 MB por arquivo/);
});
test('R80 R2: conserva os arquivos existentes no IndexedDB da R79', () => {
  assert.match(client,/DB_NAME = 'rocha-portal-r79-local'/);
  assert.match(client,/DB_STORE = 'arquivos'/);
  assert.match(client,/indexedDB\.open/);
  assert.match(client,/blob: f/);
});
test('R80 R2: Poppins e logo contrastante sem mexer na autenticacao', () => {
  assert.match(layout,/from 'next\/font\/google'/);
  assert.match(layout,/Poppins\(/);
  assert.match(layout,/r79-logo-dark/);
  assert.match(layout,/portalCookieValid\(cookie\)/);
});
test('R80 R2: pastas e estilo isolados na plataforma', () => {
  assert.match(css,/r80-folder-symbol/);
  assert.match(css,/rocha-portal/);
  assert.match(css,/r79-library-groups nav/);
});
