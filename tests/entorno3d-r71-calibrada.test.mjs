import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const base = join(process.cwd(), 'public/experiencia/easy-rota-do-mar/entorno3d');
const js = readFileSync(join(base, 'rocha-r69-maquete.js'), 'utf8');
const pino = readFileSync(join(base, 'rocha-r62-pin.js'), 'utf8');
const glb = readFileSync(join(base, 'easy-rota-maquete-r73.glb'));

const CENTRO = { lat: -9.6016217, lng: -35.7173289 };

function elemento() {
  const el = {
    id: '', attrs: {}, listeners: {}, innerHTML: '', textContent: '', value: '', filhos: [],
    setAttribute(k, v) { el.attrs[k] = v; }, getAttribute: (k) => el.attrs[k],
    addEventListener(t, fn) { el.listeners[t] = fn; },
    appendChild(x) { el.filhos.push(x); return x; }, append(x) { el.filhos.push(x); },
    querySelector: () => elemento(), querySelectorAll: () => []
  };
  return el;
}

function visitante() {
  const criados = [];
  const alturas = [];
  const pinos = [];
  class Modelo {
    constructor(o) { Object.assign(this, elemento()); Object.assign(this, o); criados.push(this); }
  }
  const main = elemento();
  const window = { rochaR62PinAltitude: (a) => alturas.push(a), rochaR62PinPosicao: (p) => pinos.push({ ...p }) };
  window.top = window;
  const document = { getElementById: (id) => (id === 'main' ? main : null), createElement: elemento, body: main, baseURI: 'https://conviterocha.com.br/experiencia/easy-rota-do-mar/entorno3d/index.html' };
  const localStorage = { getItem: () => null, setItem() {} };
  vm.runInNewContext(js, { window, document, localStorage, location: { search: '' }, URLSearchParams, URL, console: { warn() {}, info() {} } });
  const mapa = elemento();
  const modelo = window.rochaR69Maquete.iniciar(mapa, { Model3DElement: Modelo }, CENTRO);
  return { modelo, mapa, criados, alturas, pinos, main };
}

test('R71: maquete calibrada pela fotomontagem e ligada para todos', () => {
  assert.match(js, /const FIXO = \{ norte: 39\.2, leste: 20\.8, giro: 44, altura: 3, escala: 1, eixo: 270, publica: true \};/);
  const r = visitante();
  assert.ok(r.modelo, 'Visitante comum ve a maquete');
  assert.equal(r.criados.length, 1);
  assert.deepEqual({ ...r.modelo.orientation }, { heading: 44, tilt: 270, roll: 0 }, 'R virado para a rua da frente (blocos 5,2 graus girados, como na implantacao)');
  const lat = CENTRO.lat + 39.2 / 111320;
  const lng = CENTRO.lng + 20.8 / (111320 * Math.cos(lat * Math.PI / 180));
  assert.ok(Math.abs(r.modelo.position.lat - lat) < 1e-9 && Math.abs(r.modelo.position.lng - lng) < 1e-9);
  assert.equal(r.modelo.position.altitude, 3, 'R73: 3 m acima do chao, por cima do mato do lote');
  assert.equal(r.modelo.altitudeMode, 'RELATIVE_TO_GROUND');
  assert.ok(!r.main.filhos.some((x) => x.id === 'rocha69-painel'), 'Sem painel de ajuste para o visitante');
});

test('R71: pino da marca sobre o centro dos predios, acima da torre do R', () => {
  const r = visitante();
  assert.deepEqual(r.alturas, [58]);
  assert.equal(r.pinos.length, 1);
  assert.ok(Math.abs(r.pinos[0].lat - r.modelo.position.lat) < 1e-12 && Math.abs(r.pinos[0].lng - r.modelo.position.lng) < 1e-12);
  // O pino guarda a posicao mesmo se a maquete chegar antes dele, e o entorno (rotas) continua medindo do terreno.
  assert.match(pino, /let pinPosicao = null;/);
  assert.match(pino, /window\.rochaR62PinPosicao = function \(posicao\) \{/);
  assert.match(pino, /if \(marker\) marker\.position = \{ \.\.\.pinPosicao, altitude: pinAltitude \};/);
  assert.match(pino, /window\.rochaR63InitPois\(map, maps3d, coordinates\(site, offset\)\)/);
});

test('R71: faces vistas de lado nao ficam pretas (emissao do nucleo do glTF, sem extensoes)', () => {
  const jl = glb.readUInt32LE(12);
  const json = JSON.parse(glb.subarray(20, 20 + jl).toString('utf8'));
  assert.equal(json.extensionsUsed, undefined);
  for (const m of json.materials) {
    assert.equal(m.pbrMetallicRoughness.roughnessFactor, 1);
    assert.equal(m.pbrMetallicRoughness.metallicFactor, 0);
    assert.ok(Array.isArray(m.emissiveFactor) && m.emissiveFactor.every((v) => v > 0 && v <= 0.25), m.name);
    const t = m.pbrMetallicRoughness.baseColorTexture;
    if (t) assert.deepEqual(m.emissiveTexture, { index: t.index }, 'Brilho com a propria textura: ' + m.name);
  }
});
