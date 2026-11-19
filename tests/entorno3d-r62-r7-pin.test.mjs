import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pin = readFileSync(join(root, 'public/experiencia/easy-rota-do-mar/entorno3d/rocha-r62-pin.js'), 'utf8');

test('R62 R7: pino principal usa nova chave local e novo offset padrao', () => {
  assert.match(pin, /rocha-r62-pin-offset-v6/);
  assert.match(pin, /const DEFAULT_OFFSET = \{ north: -270, east: -372 \};/);
  assert.match(pin, /const MAX_OFFSET_METERS = 600;/);
});

test('R62 R7: pino adota visual gota azul em vez da placa retangular', () => {
  assert.match(pin, /function drawPinBody\(\)/);
  assert.match(pin, /image\.width = canvas\.width;/);
  assert.match(pin, /image\.height = canvas\.height;/);
});