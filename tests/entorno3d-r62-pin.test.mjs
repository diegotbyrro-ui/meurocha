import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const base = join(process.cwd(), 'public/experiencia/easy-rota-do-mar/entorno3d');
const html = readFileSync(join(base, 'index.html'), 'utf8');
const js = readFileSync(join(base, 'rocha-r62-pin.js'), 'utf8');
const css = readFileSync(join(base, 'rocha-r62-cleanup.css'), 'utf8');
const client = readFileSync(join(process.cwd(), 'app/experiencia/easy-rota-do-mar/EasyRotaClient.tsx'), 'utf8');

test('R62: inicializa marcador da API 3D em vez do GLB anterior', () => {
  assert.match(html, /rochaR62InitPin\(map,result,SITE\)/);
  assert.match(html, /rocha-r62-pin\.js/);
  assert.match(html, /rocha-r62-cleanup\.css/);
  assert.match(html, /rochaR61InitModel\(map,result,SITE\)/); // compatibilidade R61 nos testes antigos
  assert.match(js, /new maps3d\.Marker3DElement/);
  assert.match(js, /'RELATIVE_TO_GROUND'/); // R63: pino elevado (antes CLAMP_TO_GROUND)
  assert.match(js, /map\.append\(marker\)/);
  assert.match(js, /template\.content\.append\(image\)/);
  assert.match(js, /SITE|site/);
});

test('R62: marca autentica ja publicada no repositorio', () => {
  assert.match(js, /erm-logo-transparente\.png/);
  assert.ok(statSync(join(process.cwd(), 'public/experiencia/easy-rota-do-mar/erm-logo-transparente.png')).size > 1000);
});

test('R62: remove duplicacoes visuais sem alterar pontos e fotos do drone', () => {
  assert.match(css, /\.side\s*\{\s*display:\s*none/);
  assert.match(css, /\.header\s*\{\s*display:\s*none/);
  assert.match(css, /\.bottom\s*\{\s*display:\s*none/);
  assert.doesNotMatch(client, /> Ver foto aérea<\/button>/);
  assert.match(html, /let SITE=/);
  const points = JSON.parse(readFileSync(join(base, 'dados_pontos.json'), 'utf8'));
  assert.equal(points.length, 16);
  assert.equal(points.flatMap(p => p.photos).length, 39);
});

test('R62: ajuste apenas local, sem chaves ou alteracao de endereco no servidor', () => {
  assert.match(js, /ajustepino/);
  assert.match(js, /localStorage/);
  assert.match(js, /navigator\.clipboard\.writeText/);
  assert.doesNotMatch(js, /apiKey|ROCHA_GOOGLE_MAPS_BROWSER_KEY|NEXT_PUBLIC_/);
});
