import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pin = readFileSync(join(root, 'public/experiencia/easy-rota-do-mar/entorno3d/rocha-r62-pin.js'), 'utf8');

test('R62 R7: pino principal usa nova chave local e novo offset padrao', () => {
  assert.match(pin, /rocha-r62-pin-offset-v4/);
  assert.match(pin, /const DEFAULT_OFFSET = \{ north: -235, east: -118 \};/);
  assert.match(pin, /const MAX_OFFSET_METERS = 350;/);
});

test('R62 R7: pino adota visual gota azul em vez da placa retangular', () => {
  assert.match(pin, /ctx\.ellipse\(centerX, 426, 92 \+ i \* 18, 18 \+ i \* 4/);
  assert.match(pin, /function drawPinBody\(\)/);
  assert.match(pin, /image\.width = 126;/);
  assert.match(pin, /image\.height = 170;/);
});