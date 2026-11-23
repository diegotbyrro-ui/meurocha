import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {join} from 'node:path';

const read = (p) => readFileSync(join(process.cwd(), p), 'utf8');

test('R82: menu lateral e mobile levam à Central e ao simulador de entrada', () => {
  const layout = read('app/portal/layout.tsx');
  assert.equal((layout.match(/href="\/portal\/central"/g) || []).length, 2);
  assert.equal((layout.match(/href="\/portal\/simulador"/g) || []).length, 2);
  assert.match(layout, /if\(!portalCookieValid\(cookie\)\)/);
  assert.doesNotMatch(layout, /localStorage|mockAdmin/);
});

test('R82: Central dos empreendimentos com abas do quadro do cliente', () => {
  for (const p of ['app/portal/central/page.tsx', 'app/portal/central/[id]/page.tsx', 'app/portal/central/CentralEmpreendimentoClient.tsx', 'app/portal/central/central.css']) assert.ok(existsSync(p), p);
  const client = read('app/portal/central/CentralEmpreendimentoClient.tsx');
  for (const token of ['Dados e pagamento', 'Materiais', 'Vídeos', 'Redes sociais', 'Simulador', 'Copiar CNPJ', 'Copiar chave PIX', 'rel="noopener noreferrer"', '/portal/simulador?emp=']) assert.ok(client.includes(token), token);
  assert.match(read('app/portal/central/[id]/page.tsx'), /notFound\(\)/);
  for (const p of ['app/portal/central/page.tsx', 'app/portal/central/CentralEmpreendimentoClient.tsx']) assert.doesNotMatch(read(p), /fetch\(|createClient\(|service_role|localStorage/);
  const css = read('app/portal/central/central.css');
  assert.doesNotMatch(css, /^(?:\s*)(?:body|html|:root)\s*\{/m);
});

test('R82: simulador de entrada no portal, com o painel R6 preservado', () => {
  const page = read('app/portal/simulador/page.tsx');
  assert.match(page, /SimuladorEntradaClient/);
  assert.match(page, /SimuladorNativo/);
  assert.match(page, /searchParams/);
  const client = read('app/portal/simulador/SimuladorEntradaClient.tsx');
  assert.match(client, /@\/lib\/simulador-entrada\.mjs/);
  for (const token of ['recalcular', 'cronograma', 'planoEntrada', 'calcularEntrada', 'window.print', 'Imprimir proposta']) assert.ok(client.includes(token), token);
  assert.doesNotMatch(client, /fetch\(|createClient\(|localStorage/);
  const css = read('app/portal/simulador/simulador-entrada.css');
  assert.doesNotMatch(css, /^(?:\s*)(?:body|html|:root)\s*\{/m);
});

test('R82: atalhos do painel apontam para a Central', () => {
  const dash = read('app/portal/DashboardClient.tsx');
  assert.match(dash, /href="\/portal\/central"/);
});
