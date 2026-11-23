import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const paginas = globSync('public/espelho/**/index.html');

test('R86: todas as páginas do site têm o botão Portal do Corretor (topo e menu do celular)', () => {
  assert.ok(paginas.length >= 80);
  for (const p of paginas) {
    const s = readFileSync(p, 'utf8');
    if (!s.includes('title="Área do Cliente" class="btAro"')) continue;
    assert.match(s, /<a href="\/portal" title="Portal do Corretor" class="btAro btPortalRocha">Portal do Corretor<\/a>/, p);
    assert.match(s, /<a href="\/portal" title="PORTAL DO CORRETOR">PORTAL DO CORRETOR<\/a>/, p);
    assert.equal((s.match(/id="rocha-portal-botao"/g) || []).length, 1, p);
  }
});

test('R86: Easy Rota do Mar no site abre a página-experiência', () => {
  const cfg = readFileSync('next.config.mjs', 'utf8');
  assert.match(cfg, /source: '\/imoveis\/easy-rota-do-mar', destination: '\/experiencia\/easy-rota-do-mar'/);
  assert.match(readFileSync('public/espelho/home/index.html', 'utf8'), /href="\/imoveis\/easy-rota-do-mar" title="Mais Detalhes"/);
});
