import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const base = join(process.cwd(), 'public/experiencia/easy-rota-do-mar/entorno3d');
const js = readFileSync(join(base, 'rocha-r69-maquete.js'), 'utf8');
const html = readFileSync(join(base, 'index.html'), 'utf8');
const glb = readFileSync(join(base, 'easy-rota-maquete-r73.glb'));

const CENTRO = { lat: -9.6016217, lng: -35.7173289 };

function gltf() {
  const jl = glb.readUInt32LE(12);
  return JSON.parse(glb.subarray(20, 20 + jl).toString('utf8'));
}
function primitiva(json, nome) {
  const i = json.materials.findIndex((m) => m.name === nome);
  assert.ok(i >= 0, 'Material ' + nome);
  return json.meshes[0].primitives.find((p) => p.material === i);
}

function elemento(tag = 'div') {
  const el = {
    tagName: tag, id: '', attrs: {}, listeners: {}, innerHTML: '', textContent: '', value: '', filhos: [],
    setAttribute(k, v) { el.attrs[k] = String(v); }, getAttribute: (k) => el.attrs[k],
    addEventListener(t, fn) { el.listeners[t] = fn; },
    appendChild(x) { el.filhos.push(x); return x; }, append(x) { el.filhos.push(x); },
    querySelector: () => elemento(), querySelectorAll: () => []
  };
  return el;
}

function carregar({ search = '', comAchatador = true } = {}) {
  const criados = [];
  class Modelo { constructor(o) { Object.assign(this, elemento('gmp-model-3d')); Object.assign(this, o); criados.push(this); } }
  const main = elemento();
  const window = {
    rochaR62PinAltitude() {}, rochaR62PinPosicao() {},
    customElements: { get: (nome) => (comAchatador && nome === 'gmp-flattener' ? function Achatador() {} : undefined) }
  };
  window.top = window;
  const armazem = new Map();
  const document = { getElementById: (id) => (id === 'main' ? main : null), createElement: elemento, body: main, baseURI: 'https://conviterocha.com.br/experiencia/easy-rota-do-mar/entorno3d/index.html' };
  const localStorage = { getItem: (k) => (armazem.has(k) ? armazem.get(k) : null), setItem: (k, v) => armazem.set(k, v) };
  vm.runInNewContext(js, { window, document, localStorage, location: { search }, URLSearchParams, URL, console: { warn() {}, info() {} } });
  const mapa = elemento('gmp-map-3d');
  const modelo = window.rochaR69Maquete.iniciar(mapa, { Model3DElement: Modelo }, CENTRO);
  return { modelo, mapa, criados, main };
}

const pontos = (caminho) => caminho.split(' ').map((t) => t.split(',').map(Number));

test('R72: maquete traz o terreno da implantacao e o predio-garagem, sem extensoes', () => {
  const json = gltf();
  assert.equal(json.extensionsUsed, undefined);
  assert.match(json.asset.generator, /terreno e garagem da implantacao/);
  const nomes = json.materials.map((m) => m.name);
  for (const nome of ['terreno', 'garagem', 'saia']) assert.ok(nomes.includes(nome), nome);
  const terreno = json.accessors[primitiva(json, 'terreno').attributes.POSITION];
  // Placa do lote um pouco acima do chao e teto do predio-garagem (carros da implantacao) a 6,5 m.
  assert.ok(Math.abs(terreno.min[1] - 0.25) < 0.001 && Math.abs(terreno.max[1] - 6.5) < 0.001);
  assert.ok(terreno.max[0] - terreno.min[0] > 65 && terreno.max[2] - terreno.min[2] > 100, 'Lote inteiro (~70 x 105 m)');
  const garagem = json.accessors[primitiva(json, 'garagem').attributes.POSITION];
  assert.ok(garagem.min[1] === 0 && Math.abs(garagem.max[1] - 6.5) < 0.001, 'Predio-garagem com 2 pavimentos');
  const saia = json.accessors[primitiva(json, 'saia').attributes.POSITION];
  assert.ok(Math.abs(saia.min[1] + 8) < 0.001, 'Saia de 8 m para terreno inclinado (R73)');
  const tex = json.materials.find((m) => m.name === 'terreno').pbrMetallicRoughness.baseColorTexture;
  assert.ok(tex && json.images[json.textures[tex.index].source].mimeType === 'image/jpeg', 'Implantacao como textura');
  assert.ok(glb.length < 1.5 * 1024 * 1024);
});

test('R72: o Google achata so o lote (arvores e construcoes), acompanhando a maquete', () => {
  assert.match(js, /const LOTE_ACHATAR = \[\[-45\.08, -27\.98\], \[30\.38, -33\.65\], \[25\.09, 73\.4\], \[-22\.01, 77\.69\], \[-23\.23, 64\.35\], \[-36\.57, 65\.56\]\];/);
  assert.match(js, /const CHAVE = 'rocha69-maquete-ajuste-v3';/, 'Ajustes antigos (giro 38, altura 0) nao valem mais');
  assert.match(html, /<script src="rocha-r69-maquete\.js\?v=r73"><\/script>/);
  const r = carregar();
  const f = r.mapa.filhos.find((x) => x.tagName === 'gmp-flattener');
  assert.ok(f, 'Achatador no mapa');
  assert.equal(f.id, 'rocha72-achatador');
  const p = pontos(f.attrs.path);
  assert.equal(p.length, 6);
  assert.ok(p.every((x) => x[2] === 500));
  // Primeiro canto (frente do lote, junto a rua): conta feita a mao com giro 44 e o centro da maquete.
  const g = 44 * Math.PI / 180;
  const lat0 = r.modelo.position.lat;
  const lng0 = r.modelo.position.lng;
  const leste = -45.08 * Math.cos(g) + 27.98 * Math.sin(g);
  const norte = 45.08 * Math.sin(g) + 27.98 * Math.cos(g);
  const lat = lat0 + norte / 111320;
  const lng = lng0 + leste / (111320 * Math.cos(lat * Math.PI / 180));
  assert.ok(Math.abs(p[0][0] - lat) < 2e-7 && Math.abs(p[0][1] - lng) < 2e-7);
  // Lote com ~70 x 105 m: todos os cantos a menos de 85 m do centro dos predios.
  const dist = p.map(([la, lo]) => Math.hypot((la - lat0) * 111320, (lo - lng0) * 111320 * Math.cos(lat0 * Math.PI / 180)));
  assert.ok(dist.every((d) => d > 30 && d < 85), dist.join(', '));
});

test('R72: sem o achatador do Google (versao antiga da API), a maquete aparece igual', () => {
  const r = carregar({ comAchatador: false });
  assert.ok(r.modelo);
  assert.ok(!r.mapa.filhos.some((x) => x.tagName === 'gmp-flattener'));
});

test('R72: no modo de ajuste, mover ou girar a maquete leva o achatamento junto', () => {
  const r = carregar({ search: '?ajustepredio=1' });
  const f = r.mapa.filhos.find((x) => x.tagName === 'gmp-flattener');
  const antes = f.attrs.path;
  r.mapa.listeners['gmp-click']({ position: { lat: r.modelo.position.lat + 10 / 111320, lng: r.modelo.position.lng } });
  assert.notEqual(f.attrs.path, antes);
  assert.equal(r.mapa.filhos.filter((x) => x.tagName === 'gmp-flattener').length, 1, 'Um achatador so');
  const [la0] = pontos(antes)[0];
  const [la1] = pontos(f.attrs.path)[0];
  assert.ok(Math.abs((la1 - la0) * 111320 - 10) < 0.2, 'Lote andou junto com a maquete');
});
