import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';
import {GLOSSARIO, obterTermo} from '../lib/portal-glossario.mjs';

const read = (p) => readFileSync(join(process.cwd(), p), 'utf8');

const ARQUIVOS = [
  'lib/portal-glossario.mjs',
  'app/portal/ajuda/AjudaPagina.tsx',
  'app/portal/ajuda/Termo.tsx',
  'app/portal/ajuda/page.tsx',
  'app/portal/ajuda/ajuda.css',
  'app/portal/ajuda/componentes.css',
];

const IDS_OBRIGATORIOS = [
  'ato', 'ato-parcelado', 'mensais', 'intercaladas', 'entrega-chaves', 'incc', 'fgts', 'subsidio',
  'price', 'sac', 'comprometimento', 'financiamento', 'desconto', 'avaliacao', 'entrada', 'pix',
  'cnpj', 'book', 'memorial', 'perspectivas', 'tabela-precos', 'link-https',
];

const ROTAS = ['/portal', '/portal/central', '/portal/simulador', '/portal/atualizar', '/portal/biblioteca', '/portal/tarefas', '/portal/gestao'];

test('R83 ajuda: glossario tem todos os ids obrigatorios com definicao curta', () => {
  for (const id of IDS_OBRIGATORIOS) {
    assert.ok(Object.prototype.hasOwnProperty.call(GLOSSARIO, id), `id ausente: ${id}`);
    const entrada = GLOSSARIO[id];
    assert.equal(typeof entrada.termo, 'string', id);
    assert.ok(entrada.termo.trim().length > 0, `termo vazio: ${id}`);
    assert.equal(typeof entrada.definicao, 'string', id);
    assert.ok(entrada.definicao.trim().length > 0, `definicao vazia: ${id}`);
    assert.ok(entrada.definicao.length <= 260, `definicao longa (${entrada.definicao.length}): ${id}`);
  }
});

test('R83 ajuda: obterTermo devolve entrada ou null', () => {
  assert.equal(obterTermo('xyz'), null);
  assert.equal(obterTermo('pix').termo, 'PIX');
  assert.equal(obterTermo('__proto__'), null);
});

test('R83 ajuda: arquivos existem', () => {
  for (const p of ARQUIVOS) assert.ok(existsSync(join(process.cwd(), p)), p);
});

test('R83 ajuda: AjudaPagina acessa localStorage somente dentro de try/catch', () => {
  const src = read('app/portal/ajuda/AjudaPagina.tsx');
  assert.match(src, /'use client'/);
  assert.match(src, /rocha-ajuda-\$\{id\}/);
  const acessos = src.match(/localStorage\.(getItem|setItem|removeItem)/g) || [];
  const blocos = src.match(/try\s*\{/g) || [];
  const catches = src.match(/catch\s*(\(|\{)/g) || [];
  assert.ok(acessos.length >= 3, 'esperava getItem, setItem e removeItem');
  assert.ok(blocos.length >= acessos.length, 'cada acesso precisa de try');
  assert.ok(catches.length >= acessos.length, 'cada acesso precisa de catch');
  // Cada chamada a localStorage deve vir depois de um "try {" ainda sem fechar.
  for (const m of src.matchAll(/localStorage\.(getItem|setItem|removeItem)/g)) {
    const antes = src.slice(0, m.index);
    assert.ok(antes.lastIndexOf('try {') > antes.lastIndexOf('catch'), `localStorage fora de try: ${m[0]}`);
  }
  assert.match(src, /Entendi, esconder ajuda/);
  assert.match(src, /Mostrar ajuda desta página/);
  assert.match(src, /aria-labelledby/);
});

test('R83 ajuda: Termo trata Escape e fecha ao clicar fora', () => {
  const src = read('app/portal/ajuda/Termo.tsx');
  assert.match(src, /'Escape'/);
  assert.match(src, /addEventListener\('mousedown'/);
  assert.match(src, /removeEventListener\('mousedown'/);
  assert.match(src, /removeEventListener\('keydown'/);
  assert.match(src, /role="dialog"/);
  assert.match(src, /aria-expanded/);
  assert.match(src, /aria-controls/);
  assert.match(src, /useId/);
  assert.match(src, /O que é \$\{entrada\.termo\}\?/);
  assert.match(src, /Fechar/);
});

test('R83 ajuda: pagina de ajuda linka para as 7 rotas e usa AjudaPagina', () => {
  const src = read('app/portal/ajuda/page.tsx');
  assert.match(src, /export const dynamic = 'force-dynamic'/);
  assert.match(src, /import '\.\/ajuda\.css'/);
  assert.match(src, /Ajuda do portal/);
  assert.match(src, /Para que serve cada área/);
  assert.match(src, /Perguntas frequentes/);
  assert.match(src, /Glossário/);
  assert.match(src, /<AjudaPagina\s+id="ajuda"/);
  assert.ok((src.match(/pergunta: '/g) || []).length >= 6, 'ao menos 6 perguntas');
  assert.match(src, /<details/);
  for (const rota of ROTAS) {
    assert.ok(src.includes(`href: '${rota}'`), `rota ausente: ${rota}`);
  }
});

test('R83 ajuda: arquivos CSS nao estilizam body, html ou :root', () => {
  for (const p of ['app/portal/ajuda/ajuda.css', 'app/portal/ajuda/componentes.css']) {
    const css = read(p);
    assert.doesNotMatch(css, /^\s*(?:body|html|:root)\b[^{]*\{/m, p);
  }
});

test('R83 ajuda: componentes importam o proprio CSS e nao usam fetch', () => {
  assert.match(read('app/portal/ajuda/AjudaPagina.tsx'), /^import '\.\/componentes\.css';/m);
  assert.match(read('app/portal/ajuda/Termo.tsx'), /^import '\.\/componentes\.css';/m);
  for (const p of ARQUIVOS) {
    if (p.endsWith('.css')) continue;
    assert.doesNotMatch(read(p), /fetch\(/, p);
  }
});
