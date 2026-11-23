import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const base = 'app/experiencia/easy-rota-do-mar/';
const read = path => readFileSync(join(process.cwd(), path),'utf8');
const client = read(base+'EasyRotaClient.tsx');
const page = read(base+'page.tsx');
const editor = read(base+'anotacoes/Integradas.tsx');
const css = read(base+'anotacoes/integradas.css');
test('R88: ferramenta aparece na tela atual sem abrir outra aba', () => {
  assert.match(client, /<AnotacoesIntegradas contexto=\{r88Context\}/);
  assert.match(client, /onClick=\{\(\) => setR88Open\(v => !v\)\}/);
  assert.doesNotMatch(client, /href=\{annotationHref\}/);
  assert.match(page, /import '\.\/anotacoes\/integradas\.css'/);
});
test('R88: sobrepoe SVG ao mesmo palco visual para acompanhar zoom e movimento', () => {
  for(const selector of ['erm39-mapCanvas','erm20-masterVisual','erm34-planStage','erm32-planPhoto','erm20-galleryPhoto'])
    assert.ok(client.includes(selector), `Nao existe selecao ${selector}`);
  assert.match(editor, /createPortal\(/);
  assert.match(editor, /classList\.add\('erm88-ancora'\)/);
  assert.match(editor, /coordinate\(event\)/);
  assert.match(editor, /setPointerCapture\(event\.pointerId\)/);
  assert.match(css, /\.erm88-camada\{position:absolute;inset:0/);
  assert.match(css, /touch-action:none/);
});
test('R88: novas setas, revisao, edicao, exclusao e localizacao por contexto', () => {
  for (const x of ['const guardar','const iniciarSeta','const inicio','const mover','const terminar',
    'const mostrar','const salvarEdicao','const excluir','const exportar','localStorage.setItem',
    'localStorage.getItem','onNavegar(n)','Mover seta']) assert.ok(editor.includes(x), x);
  for (const x of ['setMasterImage(',"goto('plantas'", "goto('imagens'",'setSelectedEnding('])
    assert.ok(client.includes(x), x);
  assert.doesNotMatch(editor,/\bfetch\s*\(|\bsupabase\b|service_role/i);
});
test('R88: 3D sem pontos inventados e anotacoes sem servidor', () => {
  assert.match(client, /: null;\s+const r88Navegar/);
  assert.match(editor, /Não são enviadas à Rocha nem sincronizadas/);
  assert.ok(existsSync(join(process.cwd(),base+'anotacoes/AnotacoesClient.tsx')),'editor R87 preservado');
  assert.doesNotMatch(css, /(^|\})\s*(body|html|:root)\s*\{/m);
});
