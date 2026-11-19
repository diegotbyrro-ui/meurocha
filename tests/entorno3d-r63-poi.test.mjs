import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const base = join(process.cwd(), 'public/experiencia/easy-rota-do-mar/entorno3d');
const html = readFileSync(join(base, 'index.html'), 'utf8');
const pin = readFileSync(join(base, 'rocha-r62-pin.js'), 'utf8');
const poi = readFileSync(join(base, 'rocha-r63-poi.js'), 'utf8');
const css = readFileSync(join(base, 'rocha-r63-poi.css'), 'utf8');
const data = JSON.parse(readFileSync(join(base, 'dados_pontos.json'), 'utf8'));

test('R63: pino centralizado, menor e visivel no zoom', () => {
  assert.match(pin, /const DEFAULT_OFFSET = \{ north: -259, east: -395 \};/);
  assert.match(pin, /rocha-r62-pin-offset-v7/);
  assert.match(pin, /const SCALE = 0\.45;/);
  assert.match(pin, /drawsWhenOccluded: true/);
  assert.match(pin, /altitudeMode: 'RELATIVE_TO_GROUND'/);
  assert.match(pin, /const PIN_ALTITUDE = 18;/);
});

test('R63: entorno carregado pelo pino, sem chave nova no codigo', () => {
  assert.match(html, /rocha-r63-poi\.js/);
  assert.match(html, /rocha-r63-poi\.css/);
  assert.match(pin, /window\.rochaR63InitPois\(map, maps3d, coordinates\(site, offset\)\)/);
  assert.match(poi, /importLibrary\('places'\)/);
  assert.match(poi, /Place\.searchNearby/);
  assert.doesNotMatch(poi, /AIza|apiKey|NEXT_PUBLIC_/);
});

test('R63: oito categorias pedidas pelo usuario', () => {
  for (const type of ['school', 'church', 'restaurant', 'car_repair', 'gas_station', 'hospital', 'pharmacy', 'supermarket']) {
    assert.match(poi, new RegExp("'" + type + "'"));
  }
});

test('R63: clique abre fotos do Google com atribuicao e link do Maps', () => {
  assert.match(poi, /gmp-click/);
  assert.match(poi, /getURI\(\{ maxWidth: width \}\)/);
  assert.match(poi, /authorAttributions/);
  assert.match(poi, /googleMapsURI/);
  assert.match(poi, /function esc\(/);
  assert.match(css, /#rocha63-poi-panel/);
  assert.match(css, /@media \(max-width: 820px\)/);
});

test('R63: 16 pontos e 39 fotos do drone preservados', () => {
  assert.equal(data.length, 16);
  assert.equal(data.flatMap((p) => p.photos).length, 39);
});
