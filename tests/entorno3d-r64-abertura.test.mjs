import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const base = join(process.cwd(), 'public/experiencia/easy-rota-do-mar/entorno3d');
const html = readFileSync(join(base, 'index.html'), 'utf8');
const intro = readFileSync(join(base, 'rocha-r64-intro.js'), 'utf8');
const css = readFileSync(join(base, 'rocha-r64-intro.css'), 'utf8');

// Largura x altura lidas do cabecalho JPEG (marcadores SOF0/SOF2), sem dependencias.
function jpegSize(file) {
  const b = readFileSync(file);
  assert.equal(b.readUInt16BE(0), 0xffd8, 'Nao e JPEG: ' + file);
  let i = 2;
  while (i < b.length) {
    const marker = b.readUInt16BE(i);
    const len = b.readUInt16BE(i + 2);
    if (marker === 0xffc0 || marker === 0xffc2) return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
    i += 2 + len;
  }
  throw new Error('Sem SOF: ' + file);
}

test('R64: abertura carregada no Entorno 3D sem remover o carregamento original', () => {
  assert.match(html, /rocha-r64-intro\.css/);
  assert.match(html, /rocha-r64-intro\.js/);
  assert.match(html, /window\.rochaR64Intro\.iniciar\(\{raiz:document\.getElementById\('main'\),lat:alvoEmpreendimento\(\)\.lat,lng:alvoEmpreendimento\(\)\.lng\}\)/);
  assert.ok(html.includes('Preparando o mapa 3D'), 'Cartao original deve continuar como contingencia');
  assert.ok(html.indexOf('rocha-r64-intro.js') < html.indexOf('const rochaIntro='), 'Motor precisa carregar antes do uso');
});

test('R64: mapa nasce no espaco somente com a abertura ativa e voa ate a vista de sempre', () => {
  assert.match(html, /cameraNoEspaco=introAtiva\(\);/);
  assert.match(html, /range:3500000,tilt:0,heading:0,mode:MapMode\.SATELLITE/);
  assert.match(html, /\{center:alvoEmpreendimento\(\),range:1250,tilt:65,heading:25,mode:MapMode\.SATELLITE\}/);
  assert.match(html, /const cam=\{center:alvoEmpreendimento\(\),range:1250,tilt:65,heading:25\}/);
  assert.match(html, /map\.flyCameraTo\(\{endCamera:cam,durationMillis:ms\}\)/);
  assert.match(html, /gmp-animationend/);
  assert.match(html, /window\.rochaR64Intro\.pronto\(\(\)=>entrarNoEmpreendimento\(6500\)\)/);
});

test('R64: pino e entorno aparecem ao pousar; erro devolve a tela original', () => {
  assert.match(html, /if\(cameraNoEspaco\)aoChegar\.push\(iniciarPino\);else iniciarPino\(\);/);
  assert.match(html, /rochaR62InitPin\(map,result,SITE\)/);
  assert.match(html, /function showError\(m\)\{if\(window\.rochaR64Intro\)window\.rochaR64Intro\.cancelar\(\);/);
  assert.match(html, /if\(window\.rochaR64Intro\)\{const a=alvoEmpreendimento\(\);window\.rochaR64Intro\.alvo\(a\.lat,a\.lng\);\}/);
});

test('R64: motor sem chave, sem servicos externos e com saidas seguras', () => {
  assert.doesNotMatch(intro, /AIza|apiKey|maps\.googleapis|fetch\(/);
  assert.doesNotMatch(intro, /https?:\/\//, 'So arquivos locais da pasta terra/');
  assert.match(intro, /prefers-reduced-motion: reduce/);
  assert.match(intro, /parametro\('abertura'\)/);
  assert.match(intro, /Pular abertura/);
  assert.match(intro, /WEBGL_lose_context/);
  assert.match(intro, /inst\.cancelar\(\)/);
  for (const nome of ['iniciar', 'ativo', 'pronto', 'alvo', 'cancelar', 'pular']) {
    assert.match(intro, new RegExp('\\b' + nome + '[:,]'), 'API ausente: ' + nome);
  }
  assert.match(css, /#rocha64-intro/);
  assert.match(css, /@media \(max-width: 820px\)/);
});

test('R64: fotos da NASA presentes, 2:1 e em potencia de 2 (mipmaps)', () => {
  const files = ['terra-dia-4k.jpg', 'terra-nuvens-4k.jpg', 'terra-dia-2k.jpg',
    'terra-noite-2k.jpg', 'terra-nuvens-2k.jpg', 'terra-agua-2k.jpg', 'terra-relevo-2k.jpg'];
  for (const name of files) {
    const file = join(base, 'terra', name);
    assert.ok(existsSync(file), 'Imagem ausente: ' + name);
    assert.ok(statSync(file).size < 1600 * 1024, 'Imagem grande demais: ' + name);
    const { w, h } = jpegSize(file);
    assert.equal(w, name.includes('4k') ? 4096 : 2048, name);
    assert.equal(w, h * 2, name);
    assert.ok(intro.includes("'terra-" + name.split('-')[1]), 'Motor nao referencia ' + name);
  }
  assert.ok(existsSync(join(base, 'terra', 'CREDITOS.txt')));
});

test('R64.1: fotos enviadas a placa de video de forma robusta e conferidas', () => {
  assert.doesNotMatch(intro, /decoding = 'async'/, 'Decodificacao assincrona gerava textura preta');
  assert.doesNotMatch(intro, /texImage2D\([^)]*(gl\.LUMINANCE|gl\.RGB)\b/, 'Somente RGBA');
  assert.match(intro, /i\.decode\(\)/);
  assert.match(intro, /getImageData\(0, 0, w, h\)/);
  assert.match(intro, /gl\.texImage2D\(gl\.TEXTURE_2D, 0, gl\.RGBA, w, h, 0, gl\.RGBA, gl\.UNSIGNED_BYTE, new Uint8Array\(/);
  assert.match(intro, /gl\.readPixels\(0, 0, 8, 8/);
  assert.match(intro, /info\.mipmaps = false;/);
  assert.match(intro, /if \(!diag\) inst\.cancelar\(\);/);
  assert.match(intro, /parametro\('abertura'\) === 'diag'/);
  assert.match(css, /\.r64-diag/);
});

test('R64.2: tela antiga nao pisca antes da abertura e volta se ela nao rodar', () => {
  const head = html.slice(0, html.indexOf('</head>'));
  assert.match(head, /classList\.add\('r64-espera'\)/, 'Classe precisa entrar antes do primeiro desenho');
  assert.ok(head.indexOf('rocha-r64-intro.css') < head.indexOf("classList.add('r64-espera')"));
  assert.match(head, /m==='0'\|\|\(calmo&&m!=='1'&&m!=='diag'\)/, 'Respeita ?abertura=0 e reduzir movimento');
  assert.match(head, /if\(!r\|\|!r\.ativo\(\)\)h\.classList\.remove\('r64-espera'\)/, 'Rede de seguranca');
  assert.match(html, /if\(!rochaIntro\)document\.documentElement\.classList\.remove\('r64-espera'\)/);
  assert.match(html, /window\.rochaR64Intro\.cancelar\(\);document\.documentElement\.classList\.remove\('r64-espera'\);/);
  assert.match(intro, /inst\.saindo = true;\s*document\.documentElement\.classList\.remove\('r64-espera'\);/);
  assert.match(css, /html\.r64-espera \.hero, html\.r64-espera #setup, html\.r64-espera \.tools \{ visibility: hidden; \}/);
  assert.doesNotMatch(css, /r64-espera[^{]*\{[^}]*display:\s*none/, 'Nao brigar com o display que o mapa controla');
});

test('R64.3: marcador usa a logo oficial, com texto de reserva', () => {
  assert.match(intro, /logo: '\.\.\/erm-logo-transparente\.png'/);
  assert.ok(existsSync(join(base, '..', 'erm-logo-transparente.png')), 'Logo oficial ausente');
  assert.match(intro, /logo\.onerror = \(\) => \{ marca\.classList\.remove\('r64-com-logo'\); marca\.textContent = cfg\.titulo; \};/);
  assert.match(css, /\.r64-alvo \.r64-logo \{ display: block; height: 36px;/);
});

test('R64.4: camera termina centralizada no pino calibrado do empreendimento', async () => {
  const pin = readFileSync(join(base, 'rocha-r62-pin.js'), 'utf8');
  assert.match(pin, /window\.rochaR62PinCoordinates = function \(site\) \{/);
  assert.match(pin, /return coordinates\(site, readOffset\(\)\);/);
  assert.match(html, /function alvoEmpreendimento\(\)\{/);
  assert.match(html, /function goHome\(\)\{if\(map\)\{map\.center=alvoEmpreendimento\(\);map\.tilt=65;map\.range=1250;map\.heading=25;\}\}/);
  assert.match(html, /center:\{lat:alvoEmpreendimento\(\)\.lat,lng:alvoEmpreendimento\(\)\.lng,altitude:0\},range:3500000/);
  assert.match(html, /if\(window\.rochaR64Intro\)\{const a=alvoEmpreendimento\(\);window\.rochaR64Intro\.alvo\(a\.lat,a\.lng\);\}/);
  // R69 trocou a versao do pino (altura acima da maquete).
  assert.match(html, /rocha-r62-pin\.js\?v=(r64-4|r69)/);
  // A funcao do pino aplica o mesmo ajuste que o pino usa no mapa (DEFAULT_OFFSET).
  const vm = await import('node:vm');
  const win = {};
  vm.runInNewContext(pin, { window: win, localStorage: { getItem: () => null }, location: { search: '' }, URLSearchParams, console });
  const site = { lat: -9.5992951, lng: -35.7137302, altitude: 60 };
  const p = win.rochaR62PinCoordinates(site);
  assert.ok(Math.abs((p.lat - site.lat) * 111320 + 259) < 0.5, 'Norte -259 m');
  const east = (p.lng - site.lng) * 111320 * Math.cos(p.lat * Math.PI / 180);
  assert.ok(Math.abs(east + 395) < 0.5, 'Leste -395 m');
  assert.equal(win.rochaR62PinCoordinates(null), null);
});
