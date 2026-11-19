import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const base = 'public/experiencia/easy-rota-do-mar/entorno3d/';
const read = name => readFileSync(join(process.cwd(),base,name),'utf8');
const html=read('index.html');
const js=read('rocha-r61-model.js');
const model=readFileSync(join(process.cwd(),base,'easy-rota-modelo-provisorio.glb'));

test('R61: GLB com cabeçalho e comprimento válidos',()=>{
  assert.equal(model.toString('ascii',0,4),'glTF');
  assert.equal(model.readUInt32LE(4),2);
  assert.equal(model.readUInt32LE(8),model.length);
  assert.ok(model.length>10000);
});
test('R61: mapa permanece google maps 3d, com modelo georreferenciado',()=>{
  assert.match(html,/importLibrary\('maps3d'\)/);
  assert.match(html,/rochaR61InitModel\(map,result,SITE\)/);
  assert.match(html,/rocha-r61-model\.js/);
  assert.match(html,/rocha-r61-model\.css/);
  assert.match(js,/new maps3d\.Model3DElement/);
  assert.match(js,/CLAMP_TO_GROUND/);
  assert.match(js,/map\.append\(model\)/);
  assert.match(js,/model\.orientation/);
  assert.match(js,/model\.position/);
});
test('R61: ajustes sao exclusivos de modo de calibracao, sem mudar as fotos e GPS',()=>{
  assert.match(js,/ajuste3d/);
  assert.match(js,/localStorage/);
  assert.match(js,/navigator\.clipboard\.writeText/);
  const stations=JSON.parse(read('dados_pontos.json'));
  assert.equal(stations.length,16);
  assert.equal(stations.flatMap(s=>s.photos).length,39);
});
