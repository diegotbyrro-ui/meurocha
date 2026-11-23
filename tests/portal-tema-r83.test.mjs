import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const FILE = 'app/portal/r83-tema.css';
const css = readFileSync(join(process.cwd(), FILE), 'utf8');
const semComentarios = css.replace(/\/\*[\s\S]*?\*\//g, '');

// Textos mais claros que --r-ink-3 (#5d6066) sobre fundo claro. Nao podem aparecer como valor de cor.
const CORES_BAIXO_CONTRASTE = [
  '#7f8b99', '#778392', '#8995a0', '#748190', '#adb0ba', '#9aa3ad',
  '#87909e', '#87909c', '#8d98a7', '#929ca9', '#9aa2ad', '#a1aaba',
  '#8993a0', '#8894a0', '#8a97a3', '#8a929d', '#84909b', '#99a1ac',
  '#8c98a7', '#9a868a', '#85818a', '#8e98a3', '#939ea9', '#99a3ad',
  '#a0aab4', '#9aa3af', '#89929f', '#88919d', '#7d8b98', '#7d8794',
];

// Extrai os seletores de cada regra (inclusive regras dentro de @media), ignorando os preludios de @media/@font-face.
function regras(texto) {
  const saida = [];
  let buffer = '';
  for (const ch of texto) {
    if (ch === '{') {
      const previa = buffer.trim();
      buffer = '';
      if (previa && !previa.startsWith('@')) saida.push(previa);
    } else if (ch === '}') {
      buffer = '';
    } else {
      buffer += ch;
    }
  }
  return saida;
}

test('R83: arquivo app/portal/r83-tema.css existe e tem conteudo', () => {
  assert.ok(existsSync(join(process.cwd(), FILE)), FILE);
  assert.ok(css.trim().length > 1000);
});

test('R83: nenhum seletor top-level de body, html ou :root', () => {
  assert.doesNotMatch(css, /^(?:\s*)(?:body|html|:root)\s*[{,]/m);
});

test('R83: todo seletor comeca com .rocha-portal', () => {
  const lista = regras(semComentarios);
  assert.ok(lista.length > 50, 'regras encontradas: ' + lista.length);
  for (const bloco of lista) {
    for (const seletor of bloco.split(',')) {
      const s = seletor.trim();
      assert.ok(s.startsWith('.rocha-portal'), `seletor fora do escopo: "${s}"`);
    }
  }
});

test('R83: sem gradientes (apenas background-image:none e permitido)', () => {
  const semNone = semComentarios.replace(/background-image:\s*none/g, '');
  assert.doesNotMatch(semNone, /gradient\(/);
});

test('R83: caixa alta e espacamento de letras removidos dos rotulos', () => {
  assert.ok(semComentarios.includes('letter-spacing:0'), 'letter-spacing:0');
  assert.ok(semComentarios.includes('text-transform:none'), 'text-transform:none');
});

test('R83: nenhuma cor de texto de baixo contraste', () => {
  const minusculo = semComentarios.toLowerCase();
  for (const cor of CORES_BAIXO_CONTRASTE) {
    assert.ok(!minusculo.includes(cor), `cor de baixo contraste presente: ${cor}`);
  }
});
