import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const assetDir = join(root, 'public/experiencia/easy-rota-do-mar');
const client = readFileSync(join(root, 'app/experiencia/easy-rota-do-mar/EasyRotaClient.tsx'), 'utf8');
const css = readFileSync(join(root, 'app/experiencia/easy-rota-do-mar/easy-rota.css'), 'utf8');

// Largura e altura de um WebP (VP8X, VP8L ou VP8) e se tem transparencia.
function webp(nome) {
  const b = readFileSync(join(assetDir, nome));
  assert.equal(b.subarray(0, 4).toString('ascii'), 'RIFF', nome);
  assert.equal(b.subarray(8, 12).toString('ascii'), 'WEBP', nome);
  const tipo = b.subarray(12, 16).toString('ascii');
  if (tipo === 'VP8X') {
    return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3), alfa: (b[20] & 0x10) !== 0, bytes: b.length };
  }
  if (tipo === 'VP8L') {
    const v = b.readUInt32LE(21);
    return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1, alfa: ((v >> 28) & 1) === 1, bytes: b.length };
  }
  return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff, alfa: false, bytes: b.length };
}

test('R74: planta 3D para as quatro tipologias, com fundo transparente', () => {
  const nomes = ['erm75-slim-planta-3d.webp', 'erm75-premium-planta-3d.webp', 'erm75-master-planta-3d.webp',
    'erm74-spazzio-04-planta-3d-oficial.webp', 'erm74-spazzio-05-planta-3d-oficial.webp'];
  for (const n of nomes) {
    const i = webp(n);
    assert.ok(i.alfa, n + ' transparente');
    assert.ok(i.w >= 1600 && i.w <= 2000 && i.h >= 1200, n + ' ' + i.w + 'x' + i.h);
    assert.ok(i.bytes > 100000 && i.bytes < 600000, n + ' ' + i.bytes);
  }
  for (const k of ['slim', 'premium', 'master']) assert.ok(client.includes(`erm75-${k}-planta-3d.webp`), k);
  assert.match(client, /erm74-spazzio-\$\{selectedEnding === 5 \? '05' : '04'\}-planta-3d-oficial\.webp/);
});

test('R74: Spazzio 05 e a isometrica oficial espelhada, como a planta 05 e espelhada da 04', () => {
  const a = webp('erm74-spazzio-04-planta-3d-oficial.webp');
  const b = webp('erm74-spazzio-05-planta-3d-oficial.webp');
  assert.deepEqual([a.w, a.h], [b.w, b.h]);
  assert.match(client, /na terminação 05 ela aparece espelhada, como a planta/);
});

test('R74: seletor Planta tecnica / Planta 3D em todas as tipologias, inclusive Spazzio', () => {
  const det = client.slice(client.indexOf("{tab === 'plantas' && <>"), client.indexOf('erm32-planInfo'));
  assert.match(det, /<div className="erm33-viewSwitch" role="group" aria-label="Modo de visualização da planta">/);
  assert.doesNotMatch(det, /selectedType === 'spazzio' \? <p className="erm38-sourceNote"/, 'Spazzio tambem tem o seletor');
  assert.match(det, />Planta técnica</);
  assert.match(det, />Planta 3D</);
  assert.doesNotMatch(client, /Perspectiva da planta|r33CardAsset/);
  assert.match(client, /const r88Context: ContextoR88/, 'R88 seleciona o palco visual ativo');
  assert.equal([...client.matchAll(/plant3D \? selected3DSource : selectedPlanSource/g)].length, 2, 'Foto e ampliada seguem usando a mesma fonte 2D ou 3D');
  assert.match(css, /\.erm21 \.erm33-viewSwitch\+\.erm38-sourceNote\{margin:-4px auto 8px\}/);
});

test('R74: texto honesto: montada sobre a planta oficial, sem mudar ambientes, nao e maquete executiva', () => {
  assert.match(client, /As plantas 3D são montadas sobre a própria planta oficial, sem modificar a distribuição dos ambientes; não são maquetes executivas 3D\./);
  assert.match(client, /A planta 3D é a isométrica oficial da Rocha/);
  // A planta tecnica original continua sendo a imagem padrao ao abrir uma tipologia.
  assert.match(client, /const \[plant3D, setPlant3D\] = useState\(false\)/);
  assert.match(client, /setSelectedType\(endingToType\[n\]\);setPlant3D\(false\);/);
});
