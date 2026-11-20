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
  assert.match(html, /window\.rochaR64Intro\.iniciar\(\{raiz:document\.getElementById\('main'\),lat:SITE\.lat,lng:SITE\.lng\}\)/);
  assert.ok(html.includes('Preparando o mapa 3D'), 'Cartao original deve continuar como contingencia');
  assert.ok(html.indexOf('rocha-r64-intro.js') < html.indexOf('const rochaIntro='), 'Motor precisa carregar antes do uso');
});

test('R64: mapa nasce no espaco somente com a abertura ativa e voa ate a vista de sempre', () => {
  assert.match(html, /cameraNoEspaco=introAtiva\(\);/);
  assert.match(html, /range:3500000,tilt:0,heading:0,mode:MapMode\.SATELLITE/);
  assert.match(html, /\{center:\{\.\.\.SITE\},range:1250,tilt:65,heading:25,mode:MapMode\.SATELLITE\}/);
  assert.match(html, /const cam=\{center:\{\.\.\.SITE\},range:1250,tilt:65,heading:25\}/);
  assert.match(html, /map\.flyCameraTo\(\{endCamera:cam,durationMillis:ms\}\)/);
  assert.match(html, /gmp-animationend/);
  assert.match(html, /window\.rochaR64Intro\.pronto\(\(\)=>entrarNoEmpreendimento\(6500\)\)/);
});

test('R64: pino e entorno aparecem ao pousar; erro devolve a tela original', () => {
  assert.match(html, /if\(cameraNoEspaco\)aoChegar\.push\(iniciarPino\);else iniciarPino\(\);/);
  assert.match(html, /rochaR62InitPin\(map,result,SITE\)/);
  assert.match(html, /function showError\(m\)\{if\(window\.rochaR64Intro\)window\.rochaR64Intro\.cancelar\(\);/);
  assert.match(html, /if\(window\.rochaR64Intro\)window\.rochaR64Intro\.alvo\(SITE\.lat,SITE\.lng\)/);
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
  const files = ['terra-dia-4k.jpg', 'terra-noite-4k.jpg', 'terra-nuvens-4k.jpg', 'terra-dia-2k.jpg',
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
