import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const base = join(process.cwd(), 'public/experiencia/easy-rota-do-mar/entorno3d');
const html = readFileSync(join(base, 'index.html'), 'utf8');
const poi = readFileSync(join(base, 'rocha-r63-poi.js'), 'utf8');
const css = readFileSync(join(base, 'rocha-r63-poi.css'), 'utf8');

const ORIGEM = { lat: -9.6016, lng: -35.7173 };
// Quantos lugares o Google falso devolve por tipo principal da busca.
const QTD = { supermarket: 9, pharmacy: 8, bakery: 8, restaurant: 8, school: 8, doctor: 8, veterinary_care: 4, gym: 6, gas_station: 3, car_repair: 6, church: 6, bank: 0, hospital: 9, shopping_mall: 4 };

// DOM minimo: o modulo so precisa criar elementos, desenhar no canvas e anexar.
function elemento(tag) {
  const el = {
    tagName: tag, children: [], attrs: {}, listeners: {}, style: {}, hidden: false, innerHTML: '', textContent: '', parentNode: null,
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    append(...xs) { xs.forEach((x) => { if (x && typeof x === 'object') { x.parentNode = el; el.children.push(x); } }); },
    appendChild(x) { el.append(x); return x; },
    remove() { if (el.parentNode) { el.parentNode.children = el.parentNode.children.filter((c) => c !== el); el.parentNode = null; } },
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
  get: (alvo, chave) => (chave in alvo ? alvo[chave] : () => gradiente),
  set: (alvo, chave, valor) => { alvo[chave] = valor; return true; }
});

function carregar(armazem, { invalido = null } = {}) {
  const buscas = [];
  const detalhes = [];
  const avisos = [];
  class Lugar {
    constructor(o) { this.id = o.id; detalhes.push(['novo', o.id, o.requestedLanguage]); }
    static async searchNearby(req) {
      buscas.push(req);
      if (invalido && req.includedTypes.includes(invalido)) throw new Error('INVALID_ARGUMENT');
      const tipos = req.includedTypes.includes('shopping_mall') ? ['hospital', 'shopping_mall'] : [req.includedTypes[0]];
      const lista = [];
      tipos.forEach((t) => { for (let i = 0; i < (QTD[t] || 0); i++) lista.push([t, i]); });
      // Um supermercado que tambem e padaria aparece nas duas buscas.
      if (req.includedTypes[0] === 'bakery') lista.unshift(['supermarket', 0]);
      return {
        places: lista.slice(0, req.maxResultCount).map(([t, i]) => ({
          id: t + '-' + i, displayName: 'Teste ' + t + ' ' + i, primaryType: t, types: [t, 'point_of_interest'],
          location: { lat: () => ORIGEM.lat + (i + 1) * 0.001, lng: () => ORIGEM.lng + (i + 1) * 0.001 }
        }))
      };
    }
  }
  const main = elemento('section');
  const document = { getElementById: () => main, createElement: elemento, addEventListener() {} };
  const localStorage = { getItem: (k) => (armazem.has(k) ? armazem.get(k) : null), setItem: (k, v) => armazem.set(k, String(v)) };
  const window = {};
  const google = { maps: { importLibrary: async (n) => { assert.equal(n, 'places'); return { Place: Lugar }; } } };
  vm.runInNewContext(poi, { window, document, localStorage, google, setTimeout, console: { warn: (...a) => avisos.push(a.join(' ')), info() {}, log() {} } });
  const mapa = elemento('mapa');
  class Marcador {
    constructor(o) { Object.assign(this, elemento('marcador')); this.opts = o; }
  }
  return { window, mapa, maps3d: { Marker3DInteractiveElement: Marcador }, buscas, detalhes, avisos };
}

test('R66: pagina pede os arquivos novos dos pontos (sem cache antigo do navegador)', () => {
  // Versoes seguintes (R67+) trocam o numero de novo.
  assert.match(html, /<script src="rocha-r63-poi\.js\?v=r6[6-9]"><\/script>/);
  assert.match(html, /<link rel="stylesheet" href="rocha-r63-poi\.css\?v=r6[6-9]">/);
});

test('R66: 14 categorias do dia a dia, com clinicas veterinarias e sem tipo proibido', () => {
  const keys = [...poi.matchAll(/\{ key: '([a-z]+)'/g)].map((m) => m[1]);
  // R68 colocou os destaques na frente.
  assert.deepEqual(keys, ['destaques', 'mercados', 'farmacias', 'padarias', 'restaurantes', 'escolas', 'hospitais', 'saude', 'veterinarios', 'academias', 'postos', 'mecanicas', 'igrejas', 'bancos', 'shoppings']);
  for (const t of ['supermarket', 'pharmacy', 'bakery', 'restaurant', 'school', 'hospital', 'doctor', 'veterinary_care', 'gym', 'gas_station', 'car_repair', 'church', 'bank', 'shopping_mall']) {
    assert.match(poi, new RegExp("'" + t + "'"), 'Tipo ausente: ' + t);
  }
  assert.doesNotMatch(poi, /'place_of_worship'/, 'Tabela B do Google nao pode ir na busca');
  assert.match(poi, /label: 'Veterin\\u00e1rios'/);
  assert.doesNotMatch(poi, /onDemand/, 'Tudo carrega ao pousar');
  const cores = [...poi.matchAll(/color: '(#[0-9a-f]{6})'/g)].map((m) => m[1]);
  assert.equal(new Set(cores).size, 15, 'Uma cor por categoria (com os destaques da R68)');
});

test('R66: raio maior; hospitais e shoppings pelos mais relevantes numa busca so', () => {
  assert.match(poi, /const NEAR_RADIUS = 3500;/);
  assert.match(poi, /const FAR_RADIUS = 8000;/);
  assert.match(poi, /referencia: \{ radius: FAR_RADIUS, rank: 'POPULARITY', max: 20 \}/);
  assert.match(poi, /key: 'hospitais', [^\n]*shared: 'referencia' \}/);
  assert.match(poi, /key: 'shoppings', [^\n]*shared: 'referencia' \}/);
});

test('R66: pinos no estilo do pino da marca, com icone proprio em cada categoria', () => {
  const icons = poi.slice(poi.indexOf('const ICONS = {'), poi.indexOf('};', poi.indexOf('const ICONS = {')));
  for (const m of poi.matchAll(/icon: '([a-z]+)'/g)) assert.match(icons, new RegExp('\\b' + m[1] + ": '[MmLlHhVvCcSsAaZz0-9 .,-]+'"), 'Icone sem desenho: ' + m[1]);
  assert.match(poi, /function drawPin\(category\)/);
  assert.match(poi, /ctx\.stroke\(new Path2D\(ICONS\[icon\]\)\)/);
  assert.match(poi, /paintPin\(ctx, category\.color, category\.icon\);/);
  assert.match(poi, /canvas\.width = Math\.round\(44 \* S\);/);
  assert.match(css, /\.rocha63-ico \{/);
  assert.match(css, /#rocha63-poi-legend button\.rocha63-all/);
  assert.match(css, /\.rocha63-skel \{/);
  assert.match(poi, /class="rocha63-all on" data-all aria-pressed="true">Todos</);
});

test('R66: primeira visita faz 13 buscas e separa hospitais de shoppings', async () => {
  const armazem = new Map();
  const { window, mapa, maps3d, buscas } = carregar(armazem);
  await window.rochaR63InitPois(mapa, maps3d, ORIGEM);
  assert.equal(buscas.length, 13);
  const compartilhada = buscas.find((b) => b.rankPreference === 'POPULARITY');
  assert.deepEqual([...compartilhada.includedTypes], ['hospital', 'general_hospital', 'shopping_mall']);
  assert.equal(compartilhada.locationRestriction.radius, 8000);
  assert.equal(compartilhada.maxResultCount, 20);
  assert.ok(buscas.filter((b) => b !== compartilhada).every((b) => b.rankPreference === 'DISTANCE' && b.locationRestriction.radius === 3500));
  assert.ok(buscas.every((b) => !b.fields.includes('rating')), 'Nota so ao abrir o ponto');
  const ids = mapa.children.map((m) => m.attrs['aria-label']);
  const por = (rotulo) => ids.filter((t) => t.startsWith(rotulo + ':')).length;
  assert.equal(por('Hospitais'), 6, 'Limite de 6 hospitais');
  assert.equal(por('Shoppings'), 4);
  assert.equal(por('Mercados'), 8, 'Limite de 8 por categoria');
  assert.equal(por('Padarias'), 8, 'Supermercado repetido fica so em Mercados; a sobra da busca repoe a vaga');
  assert.equal(por('Bancos'), 0);
  assert.equal(mapa.children.length, 8 + 8 + 8 + 8 + 8 + 6 + 8 + 4 + 6 + 3 + 6 + 6 + 0 + 4);
  // Cache: somente ID, latitude e longitude, por ate 7 dias.
  const cache = JSON.parse(armazem.get('rocha66-entorno-v1'));
  const itens = Object.values(cache.items).flat();
  assert.equal(itens.length, mapa.children.length);
  assert.ok(itens.every((it) => it.length === 3 && typeof it[0] === 'string' && Number.isFinite(it[1]) && Number.isFinite(it[2])));
  assert.doesNotMatch(JSON.stringify(cache), /Teste|displayName|photo|rating/);
  assert.match(poi, /const CACHE_DAYS = 7;/);
});

test('R66: visitas seguintes usam o cache (nenhuma busca) e o cache vence em 7 dias', async () => {
  const armazem = new Map();
  const primeira = carregar(armazem);
  await primeira.window.rochaR63InitPois(primeira.mapa, primeira.maps3d, ORIGEM);
  const segunda = carregar(armazem);
  await segunda.window.rochaR63InitPois(segunda.mapa, segunda.maps3d, ORIGEM);
  assert.equal(segunda.buscas.length, 0);
  assert.equal(segunda.mapa.children.length, primeira.mapa.children.length);
  assert.ok(segunda.mapa.children.every((m) => /^[A-Z]/.test(m.attrs['aria-label']) && !m.attrs['aria-label'].includes(':')), 'Sem nome guardado');
  const dado = JSON.parse(armazem.get('rocha66-entorno-v1'));
  dado.t -= 8 * 864e5;
  armazem.set('rocha66-entorno-v1', JSON.stringify(dado));
  const terceira = carregar(armazem);
  await terceira.window.rochaR63InitPois(terceira.mapa, terceira.maps3d, ORIGEM);
  assert.equal(terceira.buscas.length, 13, 'Cache vencido: busca de novo');
  const outroLugar = carregar(armazem);
  await outroLugar.window.rochaR63InitPois(outroLugar.mapa, outroLugar.maps3d, { lat: ORIGEM.lat + 0.01, lng: ORIGEM.lng });
  assert.equal(outroLugar.buscas.length, 13, 'Pino em outro lugar: cache nao serve');
});

test('R66: tipo recusado pelo Google cai para o primeiro tipo, e falha nao grava cache', async () => {
  const armazem = new Map();
  const r = carregar(armazem, { invalido: 'medical_clinic' });
  await r.window.rochaR63InitPois(r.mapa, r.maps3d, ORIGEM);
  assert.equal(r.buscas.length, 14);
  assert.deepEqual([...r.buscas[13].includedTypes], ['doctor']);
  assert.ok(r.mapa.children.some((m) => m.attrs['aria-label'].startsWith('Clínicas:')));
  assert.ok(armazem.has('rocha66-entorno-v1'), 'Reserva funcionou: tudo carregado, cache gravado');
  const falha = carregar(new Map(), { invalido: 'gas_station' });
  await falha.window.rochaR63InitPois(falha.mapa, falha.maps3d, ORIGEM);
  assert.ok(falha.avisos.some((t) => t.includes('postos')));
  assert.ok(!falha.mapa.children.some((m) => m.attrs['aria-label'].startsWith('Postos')));
});

test('R66: ponto do cache busca nome, fotos e nota pelo ID ao ser aberto', () => {
  assert.match(poi, /const DETAIL_FIELDS = \['displayName', 'formattedAddress', 'photos', 'googleMapsURI', 'primaryTypeDisplayName', 'rating', 'userRatingCount'\];/);
  assert.match(poi, /new state\.Place\(\{ id: place\.id, requestedLanguage: 'pt-BR', requestedRegion: 'br' \}\)/);
  assert.match(poi, /full\.fetchFields\(\{ fields: DETAIL_FIELDS \}\)/);
  assert.match(poi, /'<h3 class="rocha63-skel">Carregando\\u2026<\/h3>/);
});
