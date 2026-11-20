import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const base = join(process.cwd(), 'public/experiencia/easy-rota-do-mar/entorno3d');
const html = readFileSync(join(base, 'index.html'), 'utf8');
const js = readFileSync(join(base, 'rocha-r69-maquete.js'), 'utf8');
const css = readFileSync(join(base, 'rocha-r69-maquete.css'), 'utf8');
const pino = readFileSync(join(base, 'rocha-r62-pin.js'), 'utf8');
const GLB = join(base, 'easy-rota-maquete-r71.glb');

function lerGlb() {
  const b = readFileSync(GLB);
  assert.equal(b.readUInt32LE(0), 0x46546c67, 'Assinatura glTF');
  assert.equal(b.readUInt32LE(4), 2, 'glTF 2');
  assert.equal(b.readUInt32LE(8), b.length, 'Tamanho declarado');
  const jl = b.readUInt32LE(12);
  assert.equal(b.readUInt32LE(16), 0x4e4f534a, 'Bloco JSON');
  const json = JSON.parse(b.subarray(20, 20 + jl).toString('utf8'));
  const bl = b.readUInt32LE(20 + jl);
  assert.equal(b.readUInt32LE(24 + jl), 0x004e4942, 'Bloco BIN');
  return { json, binLength: bl };
}

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

function carregar(search, armazem = new Map(), codigo = js) {
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
  const localStorage = { getItem: (k) => (armazem.has(k) ? armazem.get(k) : null), setItem: (k, v) => armazem.set(k, v) };
  vm.runInNewContext(codigo, { window, document, localStorage, location: { search }, URLSearchParams, URL, console: { warn() {}, info() {} } });
  const mapa = elemento();
  return { api: window.rochaR69Maquete, mapa, maps3d: { Model3DElement: Modelo }, criados, alturas, pinos, main, armazem };
}

const CENTRO = { lat: -9.6016, lng: -35.7173 };
// R71: ajuste fixo calibrado pela fotomontagem oficial.
const LAT_FIXO = CENTRO.lat + 39.2 / 111320;
const LNG_FIXO = CENTRO.lng + 20.8 / (111320 * Math.cos(LAT_FIXO * Math.PI / 180));

test('R69: maquete em glTF 2.0 puro (sem extensoes), so PBR basico e leve', () => {
  const { json, binLength } = lerGlb();
  assert.equal(json.asset.version, '2.0');
  assert.equal(json.extensionsUsed, undefined, 'O Google nao aceita extensoes');
  assert.equal(json.extensionsRequired, undefined);
  assert.equal(json.buffers[0].byteLength, binLength);
  assert.ok(json.materials.every((m) => Object.keys(m).every((k) => ['name', 'pbrMetallicRoughness', 'emissiveTexture', 'emissiveFactor'].includes(k))), 'So propriedades do nucleo do glTF');
  assert.ok(json.images.every((i) => i.mimeType === 'image/jpeg'));
  assert.ok(json.materials.some((m) => m.name === 'longa' && m.pbrMetallicRoughness.baseColorTexture), 'Fachada oficial como textura');
  assert.ok(statSync(GLB).size < 1.5 * 1024 * 1024, 'GLB abaixo de 1,5 MB');
  // Caixa de todos os vertices: 2 blocos de 19,5 x 43,5 m, 42 m de altura + torre do R.
  const pos = json.meshes[0].primitives.map((p) => json.accessors[p.attributes.POSITION]);
  const min = [0, 1, 2].map((i) => Math.min(...pos.map((a) => a.min[i])));
  const max = [0, 1, 2].map((i) => Math.max(...pos.map((a) => a.max[i])));
  assert.ok(Math.abs(max[1] - 46.2) < 0.01 && min[1] === 0, 'Altura: terreo + 13 andares + torre do R');
  assert.ok(Math.abs(max[0] - min[0] - 43.75) < 0.3, 'Dois blocos lado a lado');
  assert.ok(Math.abs(max[2] - min[2] - 43.5) < 0.01, 'Comprimento do bloco');
});

test('R69: pagina carrega a maquete antes do pino e o pino sobe acima dos predios', () => {
  assert.match(html, /<link rel="stylesheet" href="rocha-r69-maquete\.css\?v=r69">/);
  assert.match(html, /<script src="rocha-r69-maquete\.js\?v=r71"><\/script>/);
  assert.match(html, /<script src="rocha-r62-pin\.js\?v=r71"><\/script>/);
  const gancho = html.indexOf('window.rochaR69Maquete.iniciar(map,result,alvoEmpreendimento());');
  assert.ok(gancho > 0 && gancho < html.indexOf('if(cameraNoEspaco)aoChegar.push(iniciarPino);'));
  assert.match(pino, /window\.rochaR62PinAltitude = function \(altitude\) \{/);
  assert.match(pino, /position: \{ \.\.\.\(pinPosicao \|\| coordinates\(site, offset\)\), altitude: pinAltitude \}/);
  assert.match(js, /const ALTURA_PINO = 58;/);
});

test('R69: com publica false, escondida para os visitantes (so no modo de ajuste)', () => {
  const escondida = js.replace('publica: true };', 'publica: false };');
  assert.notEqual(escondida, js);
  const r = carregar('', new Map(), escondida);
  assert.equal(r.api.iniciar(r.mapa, r.maps3d, CENTRO), null);
  assert.equal(r.criados.length, 0);
  assert.equal(r.alturas.length, 0, 'Sem maquete, o pino continua na altura de sempre');
});

test('R69: modo de ajuste mostra a maquete em pe, na posicao calibrada, com painel', () => {
  const r = carregar('?ajustepredio=1');
  const m = r.api.iniciar(r.mapa, r.maps3d, CENTRO);
  assert.ok(m && r.criados.length === 1);
  assert.match(m.src, /\/entorno3d\/easy-rota-maquete-r71\.glb$/);
  assert.equal(m.altitudeMode, 'RELATIVE_TO_GROUND');
  assert.deepEqual({ ...m.orientation }, { heading: 38, tilt: 270, roll: 0 }, 'glTF Y-up em pe, como no exemplo do Google');
  assert.ok(Math.abs(m.position.lat - LAT_FIXO) < 1e-9 && Math.abs(m.position.lng - LNG_FIXO) < 1e-9 && m.position.altitude === 0);
  assert.equal(m.scale, 1);
  assert.equal(r.mapa.filhos[0], m);
  assert.deepEqual(r.alturas, [58]);
  assert.ok(r.main.filhos.some((x) => x.id === 'rocha69-painel'), 'Painel de ajuste');
  // Clique no mapa leva o centro da maquete ate o ponto clicado (aprox. 100 m ao norte e 50 m a leste).
  r.mapa.listeners['gmp-click']({ position: { lat: CENTRO.lat + 100 / 111320, lng: CENTRO.lng + 50 / (111320 * Math.cos(CENTRO.lat * Math.PI / 180)) } });
  assert.ok(Math.abs(m.position.lat - (CENTRO.lat + 100 / 111320)) < 1e-6);
  const salvo = JSON.parse(r.armazem.get('rocha69-maquete-ajuste-v1'));
  assert.ok(Math.abs(salvo.norte - 100) < 0.5 && Math.abs(salvo.leste - 50) < 0.5, 'Ajuste guardado so neste navegador');
  assert.equal(salvo.norte, Math.round(salvo.norte * 10) / 10, 'Numeros curtos (10 cm)');
  // Clique em um pino do entorno (o evento vem do pino) nao move a maquete.
  r.mapa.listeners['gmp-click']({ target: { id: 'pino-do-entorno' }, position: { lat: CENTRO.lat - 0.002, lng: CENTRO.lng } });
  assert.ok(Math.abs(m.position.lat - (CENTRO.lat + 100 / 111320)) < 1e-6);
  // Outra visita no modo de ajuste reaproveita o ajuste salvo.
  const de_novo = carregar('?ajustepredio=1', r.armazem);
  const m2 = de_novo.api.iniciar(de_novo.mapa, de_novo.maps3d, CENTRO);
  assert.ok(Math.abs(m2.position.lat - (CENTRO.lat + 100 / 111320)) < 1e-6);
});

test('R69: painel acima do logotipo do Google, sem cobri-lo', () => {
  assert.match(css, /#rocha69-painel \{\s*position: absolute; left: 14px; bottom: 56px;/);
  assert.match(css, /@media \(max-width: 820px\) \{ #rocha69-painel \{ left: 8px; bottom: 50px;/);
  assert.doesNotMatch(js + css, /shadowRoot|::part|attribution/);
});
