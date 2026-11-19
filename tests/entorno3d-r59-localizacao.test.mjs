import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import config from '../next.config.mjs';

const read = p => readFileSync(join(process.cwd(), p), 'utf8');
const client = read('app/experiencia/easy-rota-do-mar/EasyRotaClient.tsx');
const css = read('app/experiencia/easy-rota-do-mar/easy-rota.css');
const frame = read('app/experiencia/easy-rota-do-mar/entorno-3d/Entorno3DFrame.tsx');
const frameCss = read('app/experiencia/easy-rota-do-mar/entorno-3d/entorno3d.module.css');
const data = JSON.parse(read('public/experiencia/easy-rota-do-mar/entorno3d/dados_pontos.json'));

test('R59: Entorno 3D ocupa area da Localizacao sem nova aba lateral', () => {
  const menu = client.slice(client.indexOf('const platformMenu:'), client.indexOf('function UiIcon('));
  const ids = [...menu.matchAll(/\{ id: '(localizacao|lazer|plantas|imagens|videos|ficha|institucional)'/g)].map(x=>x[1]);
  assert.deepEqual(ids,['localizacao','lazer','plantas','imagens','videos','ficha','institucional']);
  assert.doesNotMatch(client,/window\.location\.assign\('\/experiencia\/easy-rota-do-mar\/entorno-3d'\)/);
  assert.match(client,/erm59-location3dStage/);
  assert.match(client,/erm59-location3dOn/);
  assert.match(client,/tab === 'ultratour' && location3dEnabled/);
  assert.match(client,/src="\/experiencia\/easy-rota-do-mar\/entorno-3d"/);
  assert.doesNotMatch(client,/className="erm59-locationAerial"/);
  assert.match(client,/Explorar entorno 3D/);
  assert.match(css,/erm59-location3dOn/);
  assert.match(css,/erm59-location3dStage/);
});

test('R59: iframe interno mantem V3 e nao duplica a barra da plataforma', () => {
  assert.match(frame,/window\.parent !== window/);
  assert.match(frame,/styles\.embedded/);
  assert.match(frameCss,/\.embedded \.toolbar\{display:none\}/);
  assert.match(frame,/ROCHA_ENTORNO3D_CONFIG_ACK/);
  assert.match(frame,/onLoad=\{sendConfig\}/);
});

test('R59: global DENY preservado, SAMEORIGIN apenas no wrapper e HTML V3', async () => {
  const rules = await config.headers();
  const global = rules.find(r => r.source === '/:path*');
  assert.ok(global && global.headers.some(h=>h.key==='X-Frame-Options'&&h.value==='DENY'));
  const exceptions=rules.filter(r=>r!==global && r.headers.some(h=>h.key==='X-Frame-Options'&&h.value==='SAMEORIGIN'));
  assert.deepEqual(exceptions.map(x=>x.source).sort(),[
    '/experiencia/easy-rota-do-mar/entorno-3d',
    '/experiencia/easy-rota-do-mar/entorno3d/index.html'
  ].sort());
  exceptions.forEach(e=>assert.ok(e.headers.some(h=>h.key==='Content-Security-Policy'&&h.value==="frame-ancestors 'self'")));
});

test('R59: GPS e 39 imagens da V3 intactas; configuracao ausente tem aviso', () => {
  assert.equal(data.length,16);
  assert.equal(data.flatMap(x=>x.photos).length,39);
  assert.match(frame,/ROCHA_GOOGLE_MAPS_BROWSER_KEY/);
  assert.match(frame,/environmentNotice/);
});