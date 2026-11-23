import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';

const read = (p) => readFileSync(join(process.cwd(), p), 'utf8');

test('R83: menu com todas as áreas, descrição e página atual marcada', () => {
  const layout = read('app/portal/layout.tsx');
  for (const href of ['/portal/central', '/portal/simulador', '/portal/tarefas', '/portal/atualizar', '/portal/biblioteca', '/portal/gestao', '/portal/ajuda']) {
    assert.equal((layout.match(new RegExp(`href="${href}"`, 'g')) || []).length >= 2, true, href);
  }
  assert.match(layout, /<NavAtivo \/>/);
  assert.match(layout, /r83-tema\.css/);
  assert.match(layout, /r83-shell\.css/);
  assert.match(layout, /Pular para o conteúdo/);
  assert.match(layout, /rocha-logo-escuro\.png/);
  assert.ok(existsSync('public/rocha-logo-escuro.png'));
  assert.match(read('app/portal/NavAtivo.tsx'), /aria-current/);
});

test('R83: tokens de contraste e regras sem cara de IA na estrutura', () => {
  const css = read('app/portal/r83-shell.css');
  assert.match(css, /--r-ink:#1c1c1e/);
  assert.match(css, /--r-ink-3:#5d6066/);
  assert.match(css, /--r-focus:/);
  assert.doesNotMatch(css, /gradient\(/);
  assert.doesNotMatch(css, /text-transform:uppercase/);
  assert.doesNotMatch(css, /^(?:\s*)(?:body|html|:root)\s*[{,]/m);
});

test('R83: início explica por onde começar e as telas usam a ajuda', () => {
  assert.match(read('app/portal/DashboardClient.tsx'), /O que você quer fazer\?/);
  for (const p of ['app/portal/DashboardClient.tsx', 'app/portal/central/page.tsx', 'app/portal/simulador/SimuladorEntradaClient.tsx', 'app/portal/atualizar/AtualizarClient.tsx', 'app/portal/ajuda/page.tsx']) {
    assert.match(read(p), /<AjudaPagina/, p);
  }
  for (const p of ['app/portal/central/CentralEmpreendimentoClient.tsx', 'app/portal/simulador/SimuladorEntradaClient.tsx', 'app/portal/atualizar/AtualizarClient.tsx']) {
    assert.match(read(p), /import Termo from '\.\.\/ajuda\/Termo'/, p);
  }
  for (const p of ['app/portal/biblioteca/BibliotecaClient.tsx', 'app/portal/tarefas/TarefasClient.tsx', 'app/plataforma/gestao/GestaoClient.tsx']) {
    assert.doesNotMatch(read(p), /ACERVO DIGITAL|WORKSPACE ROCHA|CADASTRO INTERNO|toUpperCase\(\) ·/, p);
  }
});
