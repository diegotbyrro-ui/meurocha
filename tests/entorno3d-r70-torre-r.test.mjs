import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const base = join(process.cwd(), 'public/experiencia/easy-rota-do-mar/entorno3d');
const js = readFileSync(join(base, 'rocha-r69-maquete.js'), 'utf8');
const glb = readFileSync(join(base, 'easy-rota-maquete-r71.glb'));

function partes() {
  const jl = glb.readUInt32LE(12);
  const json = JSON.parse(glb.subarray(20, 20 + jl).toString('utf8'));
  const bin = glb.subarray(28 + jl);
  return { json, bin };
}

// Largura e altura de um JPEG (marcador SOF).
function tamanhoJpeg(b) {
  assert.equal(b.readUInt16BE(0), 0xffd8, 'JPEG');
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    const m = b[i + 1];
    if (m === 0xff) { i++; continue; }
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}

test('R70: R do logotipo da Rocha na torre azul do topo, na frente e atras', () => {
  const { json, bin } = partes();
  assert.match(json.asset.generator, /R do logotipo/);
  const iMat = json.materials.findIndex((m) => m.name === 'torre');
  const tex = json.materials[iMat].pbrMetallicRoughness.baseColorTexture;
  assert.ok(tex, 'Torre com textura');
  const img = json.images[json.textures[tex.index].source];
  assert.equal(img.mimeType, 'image/jpeg');
  const v = json.bufferViews[img.bufferView];
  assert.deepEqual(tamanhoJpeg(bin.subarray(v.byteOffset, v.byteOffset + v.byteLength)), [512, 512], 'R nitido (512 px)');
  const prim = json.meshes[0].primitives.find((p) => p.material === iMat);
  assert.equal(json.accessors[prim.indices].count, 24, 'Frente e tras da torre dos 2 blocos');
  const pos = json.accessors[prim.attributes.POSITION];
  assert.ok(Math.abs(pos.min[1] - 42) < 0.01 && Math.abs(pos.max[1] - 46.2) < 0.01, 'Acima da cobertura');
});

test('R70: arquivo novo da maquete (o antigo sai) e dica do R no painel', () => {
  assert.ok(!existsSync(join(base, 'easy-rota-maquete-r69.glb')));
  assert.ok(!existsSync(join(base, 'easy-rota-maquete-r70.glb')));
  assert.match(js, /const ARQUIVO = 'easy-rota-maquete-r71\.glb';/);
  assert.match(js, /com o R virado para a avenida/);
});
