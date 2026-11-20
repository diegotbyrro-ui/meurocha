import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const assetDir = join(root, 'public/experiencia/easy-rota-do-mar');
const client = readFileSync(join(root, 'app/experiencia/easy-rota-do-mar/EasyRotaClient.tsx'), 'utf8');

function webpInfo(nome) {
  const b = readFileSync(join(assetDir, nome));
  assert.equal(b.subarray(0, 4).toString('ascii'), 'RIFF', nome);
  assert.equal(b.subarray(8, 12).toString('ascii'), 'WEBP', nome);
  assert.equal(b.subarray(12, 16).toString('ascii'), 'VP8X', nome + ' com transparencia (VP8X)');
  return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3), alfa: (b[20] & 0x10) !== 0, bytes: b.length };
}

test('R75: Slim, Premium e Master com o acabamento novo, sem as pessoas, em arquivos novos', () => {
  for (const k of ['slim', 'premium', 'master']) {
    const i = webpInfo(`erm75-${k}-planta-3d.webp`);
    assert.ok(i.alfa, k + ' com fundo transparente');
    assert.ok(i.w >= 1700 && i.w <= 2000 && i.h >= 1200 && i.h <= 1500, `${k} ${i.w}x${i.h}`);
    assert.ok(i.bytes > 150000 && i.bytes < 500000, `${k} ${i.bytes} bytes`);
    assert.ok(client.includes(`erm75-${k}-planta-3d.webp`), k);
    // arquivo antigo (com as pessoas) sai do site, para nao ficar imagem velha em cache
    assert.ok(!existsSync(join(assetDir, `erm74-${k}-planta-3d.webp`)), `erm74-${k} removido`);
    assert.doesNotMatch(client, new RegExp(`erm74-${k}-planta-3d`));
  }
});

test('R75: Spazzio continua com a isometrica oficial da Rocha (sem mudanca)', () => {
  assert.match(client, /erm74-spazzio-\$\{selectedEnding === 5 \? '05' : '04'\}-planta-3d-oficial\.webp/);
  for (const n of ['04', '05']) assert.ok(existsSync(join(assetDir, `erm74-spazzio-${n}-planta-3d-oficial.webp`)), n);
});

test('R75: texto do site segue honesto (sem mudar ambientes, nao e maquete executiva)', () => {
  assert.match(client, /R75: Slim, Premium e Master sem as pessoas/);
  assert.match(client, /As plantas 3D são montadas sobre a própria planta oficial, sem modificar a distribuição dos ambientes; não são maquetes executivas 3D\./);
  assert.match(client, /const \[plant3D, setPlant3D\] = useState\(false\)/, 'A planta tecnica continua sendo a imagem padrao');
});
