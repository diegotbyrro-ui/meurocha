import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const base = join(process.cwd(), 'public/experiencia/easy-rota-do-mar/entorno3d');
const html = readFileSync(join(base, 'index.html'), 'utf8');
const js = readFileSync(join(base, 'rocha-r67-bussola.js'), 'utf8');
const css = readFileSync(join(base, 'rocha-r67-bussola.css'), 'utf8');
const poi = readFileSync(join(base, 'rocha-r63-poi.js'), 'utf8');

function carregar({ semVoo = false } = {}) {
  const cartao = { transform: null, setAttribute(k, v) { if (k === 'transform') this.transform = v; } };
  const classes = new Set();
  const botao = {
    attrs: {}, listeners: {}, innerHTML: '',
    classList: { toggle: (c, on) => { if (on) classes.add(c); else classes.delete(c); } },
    setAttribute(k, v) { this.attrs[k] = v; },
    addEventListener(t, fn) { this.listeners[t] = fn; },
    querySelector: (sel) => (sel === '[data-cartao]' ? cartao : null)
  };
  const main = { filhos: [], appendChild(x) { this.filhos.push(x); return x; } };
  const document = { createElement: () => botao, getElementById: () => main, body: main };
  const window = {};
  vm.runInNewContext(js, { window, document, console: { warn() {} } });
  const voos = [];
  const ouvintes = {};
  const mapa = {
    heading: 25, tilt: 65, range: 1250, center: { lat: -9.6, lng: -35.7, altitude: 60 },
    addEventListener(t, fn) { ouvintes[t] = fn; }
  };
  if (!semVoo) mapa.flyCameraTo = (o) => voos.push(o);
  return { api: window.rochaR67Bussola, mapa, botao, cartao, main, voos, ouvintes, classes };
}

test('R67: bussola carregada na pagina e ligada logo que o mapa nasce', () => {
  assert.match(html, /<link rel="stylesheet" href="rocha-r67-bussola\.css\?v=r67">/);
  assert.match(html, /<script src="rocha-r67-bussola\.js\?v=r67"><\/script>/);
  assert.ok(html.indexOf('rocha-r67-bussola.js') < html.indexOf('const rochaIntro='));
  const gancho = html.indexOf('if(window.rochaR67Bussola)window.rochaR67Bussola.iniciar(map);');
  assert.ok(gancho > html.indexOf('map=new Map3DElement('), 'Depois de criar o mapa');
});

test('R67: esconde so os botoes padrao do Google; logotipo e atribuicao continuam', () => {
  assert.match(js, /mapa\.defaultUIHidden = true;/);
  const codigo = (js + css).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.doesNotMatch(codigo, /shadowRoot|::part|attribution|gmp-internal|logo/i, 'Nada mexe no logotipo do Google');
  const { api, mapa } = carregar();
  api.iniciar(mapa);
  assert.equal(mapa.defaultUIHidden, true);
});

test('R67: rosa dos ventos com N, L, S, O e agulha do norte em vermelho', () => {
  const { api } = carregar();
  const svg = api.rosaSvg();
  for (const l of ['N', 'L', 'S', 'O']) assert.match(svg, new RegExp('>' + l + '</text>'));
  assert.match(svg, /fill="#d3203e"/, 'Agulha do norte');
  assert.match(svg, /<g data-cartao>/);
  assert.match(svg, /stroke="#3ae9ff"/, 'Aro ciano da plataforma');
  assert.equal((svg.match(/<path d="M50 50L/g) || []).length, 16, '8 pontas, cada uma em duas metades');
});

test('R67: a rosa gira com o mapa e tocar nela volta o norte para cima', () => {
  const { api, mapa, botao, cartao, main, voos, ouvintes, classes } = carregar();
  api.iniciar(mapa);
  assert.equal(main.filhos[0], botao);
  assert.equal(botao.attrs['aria-label'], 'Bússola: apontar o norte para cima');
  assert.equal(cartao.transform, 'rotate(-25.00 50 50)');
  mapa.heading = -60;
  ouvintes['gmp-headingchange']();
  assert.equal(cartao.transform, 'rotate(-300.00 50 50)', 'Rumo normalizado (0 a 360)');
  botao.listeners.click();
  assert.equal(voos.length, 1);
  assert.equal(voos[0].endCamera.heading, 0);
  assert.equal(voos[0].endCamera.range, 1250);
  assert.equal(voos[0].endCamera.tilt, 65);
  assert.equal(voos[0].endCamera.center, mapa.center);
  assert.equal(voos[0].durationMillis, 700);
  mapa.heading = 0;
  ouvintes['gmp-headingchange']();
  assert.ok(classes.has('rocha67-no-norte'));
  botao.listeners.click();
  assert.equal(voos.length, 1, 'Ja no norte: nao voa');
  const sem = carregar({ semVoo: true });
  sem.api.iniciar(sem.mapa);
  sem.botao.listeners.click();
  assert.equal(sem.mapa.heading, 0, 'Sem flyCameraTo: gira direto');
});

test('R67: no lugar da bussola do Google, alinhada com os botoes, e some durante a abertura', () => {
  assert.match(css, /#rocha67-bussola \{\s*position: absolute; right: 12px; bottom: 26px;/);
  assert.match(css, /html\.r64-espera #rocha67-bussola \{ visibility: hidden; \}/);
  assert.match(css, /@media \(max-width: 820px\) \{\s*#rocha67-bussola \{ right: 6px; bottom: 16px; width: 56px; height: 56px; \}/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test('R67: legenda so com os botoes (sem "No entorno" e sem a frase)', () => {
  assert.doesNotMatch(poi, /<strong>No entorno<\/strong>/);
  assert.doesNotMatch(poi, /rocha63-hint|Toque em um ponto/);
  assert.match(poi, /legend\.innerHTML = '<div class="rocha63-chips">' \+/);
});
