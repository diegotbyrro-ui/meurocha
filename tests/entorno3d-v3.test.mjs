import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';

const root = process.cwd();
const assetDir = join(root, 'public/experiencia/easy-rota-do-mar/entorno3d');
const html = readFileSync(join(assetDir, 'index.html'), 'utf8');
const stations = JSON.parse(readFileSync(join(assetDir, 'dados_pontos.json'), 'utf8'));
const filesHash = JSON.parse(readFileSync(join(root, 'tests/fixtures/entorno3d-v3-originais.json'), 'utf8'));
const nextPage = readFileSync(join(root, 'app/experiencia/easy-rota-do-mar/entorno-3d/page.tsx'), 'utf8');
const nextFrame = readFileSync(join(root, 'app/experiencia/easy-rota-do-mar/entorno-3d/Entorno3DFrame.tsx'), 'utf8');
const menu = readFileSync(join(root, 'app/experiencia/easy-rota-do-mar/EasyRotaClient.tsx'), 'utf8');

const embedded = html.match(/const STATIONS=(.*?);\s*let SITE=/s);
test('R56: V3 GPS preserva 16 estacoes, 39 fotos e correspondencia exata', () => {
  assert.ok(embedded, 'Array de dados V3 nao localizado no index adaptado');
  assert.deepEqual(JSON.parse(embedded[1]), stations, 'Dados V3 alterados');
  assert.equal(stations.length, 16);
  assert.deepEqual(stations.map(s => s.id), Array.from({length:16}, (_,i)=>i+1));
  const photos = stations.flatMap(s => s.photos);
  assert.equal(photos.length, 39);
  assert.equal(new Set(photos.map(p=>p.file)).size, 39);
  for (const s of stations) {
    assert.ok(s.lat < -9.3 && s.lat > -9.8 && s.lng > -36 && s.lng < -35.4);
    for(const p of s.photos) {
      assert.ok(existsSync(join(assetDir, p.file)), 'Foto ausente: '+p.file);
      assert.equal(typeof p.lat, 'number');
      assert.equal(typeof p.lng, 'number');
    }
  }
});

test('R56: 39 fotos e duas imagens auxiliares mantem bytes ORIGINAIS do ZIP', () => {
  assert.equal(Object.keys(filesHash).length, 41);
  for(const [rel, expected] of Object.entries(filesHash)) {
    const actual = createHash('sha256').update(readFileSync(join(assetDir,rel))).digest('hex');
    assert.equal(actual, expected, 'Imagem V3 mudou: '+rel);
  }
});

test('R56: Next fornece a chave do ambiente sem exigir digitacao de visitantes', () => {
  assert.ok(nextPage.includes('ROCHA_GOOGLE_MAPS_BROWSER_KEY'));
  assert.ok(nextPage.includes('ROCHA_ENTORNO3D_SITE_CONFIRMED'));
  assert.ok(nextPage.includes("export const dynamic = 'force-dynamic'"));
  assert.ok(nextPage.includes('validCoordinate('));
  assert.ok(nextFrame.includes('ROCHA_ENTORNO3D_CONFIG'));
  assert.ok(nextFrame.includes('ROCHA_ENTORNO3D_READY'));
  assert.ok(nextFrame.includes('event.origin !== window.location.origin'));
  assert.ok(html.includes('event.origin!==window.location.origin'));
  assert.ok(html.includes('rochaConfigReceived=true'));
  assert.ok(html.includes('loadGoogle(data.key)'));
  assert.ok(html.includes('type="hidden" readonly'));
  assert.ok(!html.includes('type="password"'));
  assert.ok(!html.includes('http://localhost:8000'));
});

test('R56: Google maps3d V3 mantem navegacao, marcadores e fluxo corrigido V3', () => {
  for(const token of ["google.maps.importLibrary('maps3d')",'Map3DElement','MapMode.SATELLITE',
    'Marker3DInteractiveElement',"marker.addEventListener('gmp-click'",'gmp-steadychange',
    'gmp-steadystate','gmp-error','easyRotaGoogleReady','createEasyRota3DScene()',
    'map.heading','map.tilt','map.range','goHome()','openStation(s)',
    "$('#prev').onclick", "$('#next').onclick",'data-filter="28/08"','data-filter="29/08"']) {
    assert.ok(html.includes(token), 'Funcionalidade V3 ausente: '+token);
  }
  assert.ok(html.includes('if(window.google?.maps?.importLibrary)'));
  assert.ok(html.includes('if(!apiScript){document.head.append(script);apiScript=script;}'));
  assert.ok(html.includes("background-image") || html.includes('insercao_empreendimento.jpg'));
});

test('R56: link do entorno e independente, sete modulos originais preservados', () => {
  const nav = menu.slice(menu.indexOf('const platformMenu:'), menu.indexOf('function UiIcon('));
  const originalIds = ['localizacao','lazer','plantas','imagens','videos','ficha','institucional'];
  for (const id of originalIds) assert.ok(nav.includes("id: '"+id+"'"),'Menu existente ausente: '+id);
  assert.ok(menu.includes('Explorar entorno 3D'));
  assert.ok(menu.includes("window.location.assign('/experiencia/easy-rota-do-mar/entorno-3d')"));
  assert.ok(nextFrame.includes("const iframeSource = base + '/entorno3d/index.html'"));
  assert.ok(nextFrame.includes("import styles from './entorno3d.module.css'"));
});
