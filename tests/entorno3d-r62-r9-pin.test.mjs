import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pin = readFileSync(join(root, 'public/experiencia/easy-rota-do-mar/entorno3d/rocha-r62-pin.js'), 'utf8');
const data = JSON.parse(readFileSync(join(root, 'public/experiencia/easy-rota-do-mar/entorno3d/dados_pontos.json'), 'utf8'));

test('R62 R9: pino reduzido, imagem natural pequena e atributos coerentes', () => {
  assert.match(pin, /const SCALE = 0\.45;/);
  assert.match(pin, /canvas\.width = W \* SCALE;/);
  assert.match(pin, /image\.width = canvas\.width;/);
  assert.match(pin, /image\.height = canvas\.height;/);
});

test('R62 R9: nova posicao circulada pelo usuario e nova chave local', () => {
  assert.match(pin, /rocha-r62-pin-offset-v7/);
  assert.match(pin, /const DEFAULT_OFFSET = \{ north: -259, east: -395 \};/);
  assert.doesNotMatch(pin, /const left = point\(leftAngle\)/);
});

test('R62 R9: 16 pontos e 39 fotos preservados', () => {
  assert.equal(data.length, 16);
  assert.equal(data.flatMap((p) => p.photos).length, 39);
});
