import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const raiz = process.cwd();
const ler = (file) => readFileSync(join(raiz, file), 'utf8');
const local = 'app/experiencia/easy-rota-do-mar/';
const cliente = `${local}EasyRotaClient.tsx`;
const pagina = `${local}page.tsx`;
const editor = `${local}anotacoes/AnotacoesClient.tsx`;
const paginaEditor = `${local}anotacoes/page.tsx`;
const css = `${local}anotacoes/anotacoes.css`;

test('R87: a subtela tem rota e não altera a estrutura das seções 3D', () => {
  for (const f of [cliente, pagina, editor, paginaEditor, css]) assert.ok(existsSync(join(raiz, f)), `Ausente: ${f}`);
  const principal = ler(cliente);
  assert.match(principal, /erm59-location3dFrame/);
  assert.match(principal, /<AnotacoesIntegradas/);
  assert.match(principal, /erm87-sideAnnotate/);
  assert.match(principal, /erm87-mobileAnnotate/);
  assert.equal((principal.match(/erm87-sideAnnotate/g) || []).length, 1);
  assert.equal((principal.match(/erm87-mobileAnnotate/g) || []).length, 1);
  assert.match(ler(pagina), /import '\.\/anotacoes\/anotacoes\.css'/);
});

test('R87: notas com coordenadas relativas, edição e exclusão', () => {
  const s = ler(editor);
  assert.match(s, /clientX - rect\.left/);
  assert.match(s, /clientY - rect\.top/);
  assert.match(s, /n\.x \* 100/);
  assert.match(s, /n\.y \* 100/);
  assert.match(s, /atualizarLista\(lista\.map/);
  assert.match(s, /atualizarLista\(lista\.filter/);
  assert.match(s, /LIMITE_NOTAS = 40/);
  assert.match(s, /LIMITE_CARACTERES = 500/);
});

test('R87: imagens locais, captura, PDF e aviso 3D, sem chamadas ao backend', () => {
  const s = ler(editor);
  assert.match(s, /image\/png/);
  assert.match(s, /URL\.createObjectURL/);
  assert.match(s, /URL\.revokeObjectURL/);
  assert.match(s, /window\.print\(\)/);
  assert.match(s, /veioDo3D/);
  assert.match(s, /localStorage/);
  assert.doesNotMatch(s, /\bfetch\s*\(/);
  assert.doesNotMatch(s, /\b(?:supabaseAdmin|createClient|SUPABASE_SERVICE_ROLE_KEY)\b/);
  assert.match(ler(css), /@media print/);
  assert.match(ler(css), /@media\(max-width:900px\)/);
});

test('R87/R88: a selecao do ambiente e da planta fica integrada na mesma tela', () => {
  const s = ler(cliente);
  for (const pedaco of [
    "section === 'plantas'", "section === 'imagens'", "section === 'lazer'",
    'selectedEnding', 'plant3D', 'masterImage', 'image.id', 'r88Context', 'r88Navegar'
  ]) assert.ok(s.includes(pedaco), `Sem selecao para ${pedaco}`);
  assert.doesNotMatch(s, /target="_blank" rel="noopener noreferrer" title="Abrir anotações em nova aba"/);
});
