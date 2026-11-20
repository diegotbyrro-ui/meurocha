import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const base = join(process.cwd(), 'public/experiencia/easy-rota-do-mar/entorno3d');
const html = readFileSync(join(base, 'index.html'), 'utf8');
const poi = readFileSync(join(base, 'rocha-r63-poi.js'), 'utf8');

const ORIGEM = { lat: -9.6016, lng: -35.7173 };
const MIX = 'ChIJT3KG_5dHAQcRKOt_m_3zTTE';
const BUSINESS = 'ChIJzfs2QD5GAQcRg_JIrQhGTxk';
// Posicoes ficticias para o teste (o site pega a posicao real no Google pelo ID).
const POSICAO = { [MIX]: [-9.609, -35.721], [BUSINESS]: [-9.604, -35.723] };

function elemento(tag) {
  const el = {
    tagName: tag, children: [], attrs: {}, listeners: {}, style: {}, hidden: false, innerHTML: '', textContent: '', parentNode: null,
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    append(...xs) { xs.forEach((x) => { if (x && typeof x === 'object') { x.parentNode = el; el.children.push(x); } }); },
    appendChild(x) { el.append(x); return x; },
    remove() {},
    setAttribute(k, v) { el.attrs[k] = String(v); },
    getAttribute(k) { return el.attrs[k]; },
    addEventListener(t, fn) { (el.listeners[t] = el.listeners[t] || []).push(fn); },
    querySelector: () => null,
    querySelectorAll: () => [],
    getContext: () => contexto,
    toDataURL: () => 'data:image/png;base64,AAAA'
  };
  if (tag === 'template') el.content = elemento('#fragmento');
  return el;
}
const gradiente = { addColorStop() {} };
const contexto = new Proxy({}, {
  get: (alvo, chave) => (chave in alvo ? alvo[chave] : chave === 'measureText' ? () => ({ width: 80 }) : () => gradiente),
  set: (alvo, chave, valor) => { alvo[chave] = valor; return true; }
});

function carregar(armazem, { quebrado = null } = {}) {
  const buscas = [];
  const pedidos = [];
  class Lugar {
    constructor(o) { this.id = o.id; pedidos.push(['novo', o.id]); }
    async fetchFields({ fields }) {
      pedidos.push(['campos', this.id, fields.join(',')]);
      if (this.id === quebrado || !POSICAO[this.id]) throw new Error('NOT_FOUND');
      const [lat, lng] = POSICAO[this.id];
      this.location = { lat: () => lat, lng: () => lng };
      return { place: this };
    }
    static async searchNearby(req) {
      buscas.push(req);
      const t = req.includedTypes[0];
      const lista = [];
      // O Mix Mateus tambem aparece na busca de mercados: deve ficar so como destaque.
      if (t === 'supermarket') lista.push({ id: MIX, displayName: 'Mix Mateus Serraria', primaryType: 'supermarket', types: ['supermarket'], location: { lat: () => -9.609, lng: () => -35.721 } });
      for (let i = 0; i < 9; i++) lista.push({ id: t + '-' + i, displayName: 'Teste ' + t + ' ' + i, primaryType: t, types: [t], location: { lat: () => ORIGEM.lat + i * 0.001, lng: () => ORIGEM.lng } });
      return { places: lista.slice(0, req.maxResultCount) };
    }
  }
  const main = elemento('section');
  const document = { getElementById: () => main, createElement: elemento, addEventListener() {} };
  const localStorage = { getItem: (k) => (armazem.has(k) ? armazem.get(k) : null), setItem: (k, v) => armazem.set(k, String(v)) };
  const window = {};
  const google = { maps: { importLibrary: async () => ({ Place: Lugar }) } };
  const avisos = [];
  vm.runInNewContext(poi, { window, document, localStorage, google, setTimeout, console: { warn: (...a) => avisos.push(a.join(' ')), info() {}, log() {} } });
  const mapa = elemento('mapa');
  class Marcador { constructor(o) { Object.assign(this, elemento('marcador')); this.opts = o; } }
  return { window, mapa, maps3d: { Marker3DInteractiveElement: Marcador }, buscas, pedidos, avisos };
}

const rotulos = (mapa) => mapa.children.map((m) => m.attrs['aria-label']);

test('R68: Mix Mateus e Business Humberto Lobo como destaques, guardados so pelo ID', () => {
  assert.match(poi, new RegExp("\\{ id: '" + MIX + "', label: 'Mix Mateus', icon: 'carrinho' \\}"));
  assert.match(poi, new RegExp("\\{ id: '" + BUSINESS + "', label: 'Business Humberto L\\\\u00f4bo', icon: 'predio' \\}"));
  assert.match(poi, /\{ key: 'destaques', label: 'Destaques', color: '#3ae9ff', icon: 'estrela', featured: true, max: 10 \}/);
  assert.ok(poi.indexOf("key: 'destaques'") < poi.indexOf("key: 'mercados'"), 'Destaques primeiro');
  assert.match(poi, /const FEATURED_FIELDS = \['location'\];/, 'Posicao pelo ID: nivel Essentials');
  assert.match(poi, /collisionBehavior: item \? 'REQUIRED_AND_HIDES_OPTIONAL' : 'OPTIONAL_AND_HIDES_LOWER_PRIORITY'/);
  assert.match(poi, /function drawFeaturedPin\(item, category\)/);
  assert.match(html, /<script src="rocha-r63-poi\.js\?v=r68"><\/script>/);
  assert.doesNotMatch(poi, /-9\.609|-35\.721|-9\.604|-35\.723/, 'Sem coordenadas do Google gravadas no codigo');
});

test('R68: primeira visita busca a posicao dos destaques pelo ID e da prioridade a eles', async () => {
  const armazem = new Map();
  const r = carregar(armazem);
  await r.window.rochaR63InitPois(r.mapa, r.maps3d, ORIGEM);
  assert.deepEqual(r.pedidos.filter((p) => p[0] === 'novo').map((p) => p[1]).sort(), [BUSINESS, MIX].sort());
  assert.ok(r.pedidos.filter((p) => p[0] === 'campos').every((p) => p[2] === 'location'));
  assert.equal(r.buscas.length, 13, 'Destaques nao viram busca');
  const nomes = rotulos(r.mapa);
  assert.ok(nomes.includes('Destaque: Mix Mateus'));
  assert.ok(nomes.includes('Destaque: Business Humberto Lôbo'));
  assert.ok(!nomes.includes('Mercados: Mix Mateus Serraria'), 'Nao aparece duas vezes');
  assert.equal(nomes.filter((t) => t.startsWith('Mercados:')).length, 8);
  const destaque = r.mapa.children.find((m) => m.attrs['aria-label'] === 'Destaque: Mix Mateus');
  assert.equal(destaque.opts.collisionBehavior, 'REQUIRED_AND_HIDES_OPTIONAL');
  assert.equal(destaque.opts.position.altitude, 16);
  const cache = JSON.parse(armazem.get('rocha66-entorno-v1'));
  assert.deepEqual(cache.items.destaques.map((it) => it[0]).sort(), [BUSINESS, MIX].sort());
});

test('R68: visitas seguintes montam os destaques pelo cache, sem consultar o Google', async () => {
  const armazem = new Map();
  const primeira = carregar(armazem);
  await primeira.window.rochaR63InitPois(primeira.mapa, primeira.maps3d, ORIGEM);
  const segunda = carregar(armazem);
  await segunda.window.rochaR63InitPois(segunda.mapa, segunda.maps3d, ORIGEM);
  assert.equal(segunda.buscas.length, 0);
  assert.equal(segunda.pedidos.length, 0);
  assert.ok(rotulos(segunda.mapa).includes('Destaque: Mix Mateus'));
});

test('R68: se um destaque falhar, o outro aparece e o cache continua valendo', async () => {
  const armazem = new Map();
  const r = carregar(armazem, { quebrado: BUSINESS });
  await r.window.rochaR63InitPois(r.mapa, r.maps3d, ORIGEM);
  const nomes = rotulos(r.mapa);
  assert.ok(nomes.includes('Destaque: Mix Mateus'));
  assert.ok(!nomes.some((t) => t.includes('Business')));
  assert.ok(r.avisos.some((t) => t.includes('Destaque indisponivel')));
  assert.ok(armazem.has('rocha66-entorno-v1'));
});
