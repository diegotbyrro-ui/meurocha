import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pasta = join(root, 'public/experiencia/easy-rota-do-mar/videos');
const client = readFileSync(join(root, 'app/experiencia/easy-rota-do-mar/EasyRotaClient.tsx'), 'utf8');
const css = readFileSync(join(root, 'app/experiencia/easy-rota-do-mar/easy-rota.css'), 'utf8');

// Listas R76 lidas do proprio componente (aba -> arquivos e nomes, na ordem da tela).
function listas() {
  const bloco = client.slice(client.indexOf('const r76Videos'), client.indexOf('const r76Rotulo'));
  const abas = {};
  for (const aba of ['perspectivas', 'empreendimento', 'shorts']) {
    const ini = bloco.indexOf(`  ${aba}: [`);
    const fim = bloco.indexOf('  ],', ini);
    assert.ok(ini > 0 && fim > ini, 'aba ' + aba);
    abas[aba] = [...bloco.slice(ini, fim).matchAll(/\{ arquivo: '([a-z0-9-]+)', nome: '([^']+)'/g)].map((m) => ({ arquivo: m[1], nome: m[2] }));
  }
  return abas;
}

// Caixas (atoms) de um MP4: tamanho de 32 bits ou 64 bits.
function caixas(b, ini, fim) {
  const out = [];
  let p = ini;
  while (p + 8 <= fim) {
    let tam = b.readUInt32BE(p);
    const tipo = b.toString('latin1', p + 4, p + 8);
    if (tam === 1) tam = Number(b.readBigUInt64BE(p + 8));
    if (tam === 0) tam = fim - p;
    assert.ok(tam >= 8 && p + tam <= fim, 'caixa ' + tipo);
    out.push({ tipo, ini: p, fim: p + tam });
    p += tam;
  }
  return out;
}

function mp4(arquivo) {
  const b = readFileSync(join(pasta, arquivo));
  const topo = caixas(b, 0, b.length);
  const moov = topo.find((c) => c.tipo === 'moov');
  assert.ok(moov, arquivo + ' sem moov');
  const filhos = caixas(b, moov.ini + 8, moov.fim);
  const mvhd = filhos.find((c) => c.tipo === 'mvhd');
  const v1 = b[mvhd.ini + 8] === 1;
  const escala = b.readUInt32BE(mvhd.ini + (v1 ? 28 : 20));
  const duracao = v1 ? Number(b.readBigUInt64BE(mvhd.ini + 32)) : b.readUInt32BE(mvhd.ini + 24);
  const trilhas = filhos.filter((c) => c.tipo === 'trak').map((t) => {
    const tkhd = caixas(b, t.ini + 8, t.fim).find((c) => c.tipo === 'tkhd');
    return [b.readUInt32BE(tkhd.fim - 8) / 65536, b.readUInt32BE(tkhd.fim - 4) / 65536];
  });
  const cab = b.subarray(moov.ini, moov.fim);
  return {
    tipos: topo.map((c) => c.tipo), segundos: duracao / escala, trilhas, bytes: b.length,
    h264: cab.includes(Buffer.from('avc1')), som: cab.includes(Buffer.from('soun')),
  };
}

function webp(arquivo) {
  const b = readFileSync(join(pasta, arquivo));
  assert.equal(b.subarray(0, 4).toString('ascii'), 'RIFF', arquivo);
  assert.equal(b.subarray(8, 12).toString('ascii'), 'WEBP', arquivo);
  const tipo = b.subarray(12, 16).toString('ascii');
  if (tipo === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3), bytes: b.length };
  if (tipo === 'VP8L') { const v = b.readUInt32LE(21); return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1, bytes: b.length }; }
  return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff, bytes: b.length };
}

test('R76: Perspectivas animadas na ordem e com os nomes de ESCOLHA UM AMBIENTE (Lazer)', () => {
  const lazer = [...client.matchAll(/\{facilityId:\d+,mapLabel:'(\d\d)',name:'([^']+)'/g)].map((m) => ({ n: m[1], nome: m[2] }));
  assert.equal(lazer.length, 16);
  const { perspectivas } = listas();
  assert.equal(perspectivas.length, 16);
  const semAcento = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '');
  perspectivas.forEach((v, i) => {
    assert.equal(semAcento(v.nome), lazer[i].nome, 'item ' + (i + 1));
    assert.ok(v.arquivo.startsWith(`perspectiva-${lazer[i].n}-`), v.arquivo);
  });
});

test('R76: tres abas com videos proprios (16 perspectivas, 6 do empreendimento, 5 do apartamento)', () => {
  const l = listas();
  assert.deepEqual([l.perspectivas.length, l.empreendimento.length, l.shorts.length], [16, 6, 5]);
  assert.match(client, /videos: \[\{ id: 'perspectivas', label: 'Perspectivas animadas' \}, \{ id: 'empreendimento', label: 'Empreendimento' \}, \{ id: 'shorts', label: 'Short vídeos' \}\]/);
  for (const [aba, prefixo] of [['empreendimento', 'empreendimento'], ['shorts', 'short']]) {
    l[aba].forEach((v, i) => assert.ok(v.arquivo.startsWith(`${prefixo}-${String(i + 1).padStart(2, '0')}-`), v.arquivo));
  }
  const nomes = Object.values(l).flat().map((v) => v.arquivo);
  assert.equal(new Set(nomes).size, nomes.length, 'sem arquivo repetido');
});

test('R76: cada video e MP4 H.264 1920x1080 sem som, de 8 s (maximo 10 s), pronto para a web', () => {
  for (const v of Object.values(listas()).flat()) {
    const i = mp4(v.arquivo + '.mp4');
    assert.equal(i.tipos[0], 'ftyp', v.arquivo);
    assert.ok(i.tipos.indexOf('moov') < i.tipos.indexOf('mdat'), v.arquivo + ': moov antes do mdat (comeca a tocar antes de baixar tudo)');
    assert.ok(i.segundos >= 7.5 && i.segundos <= 10, v.arquivo + ' ' + i.segundos + ' s');
    assert.deepEqual(i.trilhas, [[1920, 1080]], v.arquivo + ' uma trilha de video 1920x1080');
    assert.ok(i.h264 && !i.som, v.arquivo + ' H.264 sem audio');
    assert.ok(i.bytes > 300000 && i.bytes < 4000000, v.arquivo + ' ' + i.bytes + ' bytes');
  }
});

test('R76: poster de cada video (primeiro quadro) em WebP 1280x720', () => {
  for (const v of Object.values(listas()).flat()) {
    const p = webp(v.arquivo + '.webp');
    assert.deepEqual([p.w, p.h], [1280, 720], v.arquivo);
    assert.ok(p.bytes > 20000 && p.bytes < 400000, v.arquivo + ' ' + p.bytes);
  }
});

test('R76: a pasta de videos tem so os arquivos da lista e o total fica leve para o site', () => {
  const esperados = Object.values(listas()).flat().flatMap((v) => [v.arquivo + '.mp4', v.arquivo + '.webp']).sort();
  assert.deepEqual(readdirSync(pasta).sort(), esperados);
  const total = esperados.reduce((s, f) => s + readFileSync(join(pasta, f)).length, 0);
  assert.ok(total < 70 * 1024 * 1024, 'total ' + total);
});

test('R76: player 16:9 sem cortar o video, mudo, sequencia automatica e aviso de previa removido', () => {
  const sec = client.slice(client.indexOf("{section === 'videos' &&"), client.indexOf("{section === 'ficha' &&"));
  assert.match(sec, /<video key=\{r76Atual\.arquivo\} ref=\{r76VideoRef\} className="erm76-video"/);
  assert.match(sec, /src=\{`\$\{R76_PASTA\}\$\{r76Atual\.arquivo\}\.mp4`\} poster=\{`\$\{R76_PASTA\}\$\{r76Atual\.arquivo\}\.webp`\}/);
  assert.match(sec, /muted playsInline autoPlay=\{!r76SemMovimento\} controls preload="auto"/);
  assert.match(sec, /onEnded=\{\(\) => setVideoIndex\(\(r76Indice \+ 1\) % r76Lista\.length\)\}/);
  assert.match(sec, /onClick=\{\(\) => r76Escolher\(i\)\}/);
  assert.match(client, /const R76_PASTA = `\$\{BRAND_ASSETS\}videos\/`;/);
  assert.match(client, /setImageIndex\(0\); setVideoIndex\(0\); \};/, 'Trocar de aba volta ao primeiro video');
  assert.match(client, /matchMedia\('\(prefers-reduced-motion: reduce\)'\)/);
  assert.doesNotMatch(client, /O vídeo correspondente será vinculado|Prévia visual|const mediaList/);
  assert.match(css, /\.erm21 \.erm76-player\{[^}]*aspect-ratio:16\/9/);
  assert.match(css, /\.erm21 \.erm76-video\{[^}]*object-fit:contain/);
  assert.doesNotMatch(css, /\.erm76-video\{[^}]*object-fit:cover/);
});

test('R76: textos honestos (so movimento de camera sobre a imagem oficial; Lixeira e a vista geral)', () => {
  assert.match(client, /feito com a imagem oficial em alta resolução, só com movimento de câmera\. \{r76Atual\.aviso \|\| 'Perspectiva ilustrativa'\}/);
  assert.match(client, /nome: 'Lixeira', nota: 'Vista geral do condomínio, a mesma imagem do ponto 15 em Lazer\.'/);
  for (const n of ['Vista aérea da região', 'Implantação', 'Planta 3D Spazzio · 3 quartos']) {
    assert.ok(client.includes(`nome: '${n}', aviso: 'Imagem ilustrativa'`), n);
  }
});
