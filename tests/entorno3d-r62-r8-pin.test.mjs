import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pin = readFileSync(join(root, 'public/experiencia/easy-rota-do-mar/entorno3d/rocha-r62-pin.js'), 'utf8');
const data = JSON.parse(readFileSync(join(root, 'public/experiencia/easy-rota-do-mar/entorno3d/dados_pontos.json'), 'utf8'));

test('R62 R8: pino reposicionado para a area indicada, com nova chave local', () => {
  assert.match(pin, /rocha-r62-pin-offset-v5/);
  assert.match(pin, /const DEFAULT_OFFSET = \{ north: -264, east: -308 \};/);
  assert.match(pin, /const MAX_OFFSET_METERS = 600;/);
});

test('R62 R8: gota simetrica, sem o recorte lateral da R7, renderizada em 2x', () => {
  assert.match(pin, /Math\.acos\(headRadius \/ \(tipY - centerY\)\)/);
  assert.doesNotMatch(pin, /bezierCurveTo\(235, 312, 282, 246, 282, 167\)/);
  assert.match(pin, /const SCALE = 2;/);
  assert.match(pin, /ctx\.scale\(SCALE, SCALE\)/);
  assert.doesNotMatch(pin, /function roundedRect/);
});

test('R62 R8: logo oficial ampliada dentro do disco', () => {
  assert.match(pin, /erm-logo-transparente\.png/);
  assert.match(pin, /Math\.min\(176 \/ logo\.naturalWidth, 60 \/ logo\.naturalHeight\)/);
});

test('R62 R8: calibracao por clique so no modo ajustepino, sem tocar nos 16 pontos', () => {
  assert.match(pin, /map\.addEventListener\('gmp-click'/);
  assert.match(pin, /const step = 10;/);
  assert.match(pin, /if \(!isAdjustMode\(\)/);
  assert.equal(data.length, 16);
  assert.equal(data.flatMap((p) => p.photos).length, 39);
});
