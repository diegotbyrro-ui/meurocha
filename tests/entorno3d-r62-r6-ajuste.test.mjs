import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const index = readFileSync(join(root, 'public/experiencia/easy-rota-do-mar/entorno3d/index.html'), 'utf8');
const pin = readFileSync(join(root, 'public/experiencia/easy-rota-do-mar/entorno3d/rocha-r62-pin.js'), 'utf8');
const data = JSON.parse(readFileSync(join(root, 'public/experiencia/easy-rota-do-mar/entorno3d/dados_pontos.json'), 'utf8'));

test('R62 R6: pinos 01 a 16 ficam ocultos, mas os dados continuam preservados', () => {
  assert.match(index, /const SHOW_CAPTURE_MARKERS=false;/);
  assert.match(index, /if\(Marker3DInteractiveElement && SHOW_CAPTURE_MARKERS\)\{/);
  assert.equal(data.length, 16);
  assert.equal(data.flatMap(item => item.photos).length, 39);
});

test('R62 R6: pino da marca usa novo offset padrao e nova chave local', () => {
  assert.match(pin, /rocha-r62-pin-offset-v5/);
  assert.match(pin, /const DEFAULT_OFFSET = \{ north: -264, east: -308 \};/);
  assert.match(pin, /const MAX_OFFSET_METERS = 600;/);
  assert.match(pin, /window\.rochaR62InitPin/);
});