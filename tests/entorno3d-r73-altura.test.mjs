import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const base = join(process.cwd(), 'public/experiencia/easy-rota-do-mar/entorno3d');
const js = readFileSync(join(base, 'rocha-r69-maquete.js'), 'utf8');
const glb = readFileSync(join(base, 'easy-rota-maquete-r73.glb'));

const CENTRO = { lat: -9.6016217, lng: -35.7173289 };

function caixaDe(nome) {
  const jl = glb.readUInt32LE(12);
  const json = JSON.parse(glb.subarray(20, 20 + jl).toString('utf8'));
  const i = json.materials.findIndex((m) => m.name === nome);
  return json.accessors[json.meshes[0].primitives.find((p) => p.material === i).attributes.POSITION];
}

function elemento(tag = 'div') {
  const el = {
    tagName: tag, id: '', attrs: {}, listeners: {}, filhos: [],
    setAttribute(k, v) { el.attrs[k] = String(v); }, getAttribute: (k) => el.attrs[k],
    addEventListener(t, fn) { el.listeners[t] = fn; },
    appendChild(x) { el.filhos.push(x); return x; }, append(x) { el.filhos.push(x); },
    querySelector: () => elemento(), querySelectorAll: () => []
  };
  return el;
}

function visitante() {
  const alturas = [];
  class Modelo { constructor(o) { Object.assign(this, elemento('gmp-model-3d')); Object.assign(this, o); } }
  const window = {
    rochaR62PinAltitude: (a) => alturas.push(a), rochaR62PinPosicao() {},
    customElements: { get: (n) => (n === 'gmp-flattener' ? function Achatador() {} : undefined) }
  };
  window.top = window;
  const document = { getElementById: () => null, createElement: elemento, body: elemento(), baseURI: 'https://conviterocha.com.br/experiencia/easy-rota-do-mar/entorno3d/index.html' };
  vm.runInNewContext(js, { window, document, localStorage: { getItem: () => null, setItem() {} }, location: { search: '' }, URLSearchParams, URL, console: { warn() {}, info() {} } });
  const mapa = elemento('gmp-map-3d');
  const modelo = window.rochaR69Maquete.iniciar(mapa, { Model3DElement: Modelo }, CENTRO);
  return { modelo, mapa, alturas };
}

test('R73: maquete inteira 3 m acima do chao, por cima do mato que sobra do achatamento', () => {
  const r = visitante();
  assert.equal(r.modelo.position.altitude, 3);
  assert.equal(r.modelo.altitudeMode, 'RELATIVE_TO_GROUND');
  // A placa do terreno fica a 3,25 m e a saia desce ate 5 m abaixo do chao (muro de arrimo no desnivel).
  const saia = caixaDe('saia');
  assert.ok(Math.abs(3 + saia.max[1] - 3.25) < 0.001);
  assert.ok(3 + saia.min[1] <= -5 + 0.001);
});

test('R73: pino continua acima da torre do R e o achatamento nao muda com a altura', () => {
  const r = visitante();
  const topo = 3 + caixaDe('torre').max[1];
  assert.ok(r.alturas.length === 1 && r.alturas[0] > topo + 5, 'Pino a ' + r.alturas[0] + ' m, torre ate ' + topo + ' m');
  const f = r.mapa.filhos.find((x) => x.tagName === 'gmp-flattener');
  assert.ok(f.attrs.path.split(' ').every((t) => t.endsWith(',500')), 'Achatamento ate 500 m, como no exemplo do Google');
});
