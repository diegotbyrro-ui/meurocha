// R20: mantem o caminho do teste R19 no repositorio; cobre a interface reimplementada.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const root = process.cwd();
const client = readFileSync(join(root, 'app/experiencia/easy-rota-do-mar/EasyRotaClient.tsx'), 'utf8');
const page = readFileSync(join(root, 'app/experiencia/easy-rota-do-mar/page.tsx'), 'utf8');
const css = readFileSync(join(root, 'app/experiencia/easy-rota-do-mar/easy-rota.css'), 'utf8');
const media = readFileSync(join(root, 'app/api/experiencia/easy-rota-do-mar/media/[id]/route.ts'), 'utf8');

test('R20: pagina de homologacao nao indexavel', () => {
  assert.match(page, /index: false, follow: false, nocache: true/);
  assert.match(page, /EasyRotaClient/);
});
test('R20: copia os 7 modulos visiveis da referencia', () => {
  for (const id of ['localizacao','lazer','plantas','imagens','videos','ficha','institucional'])
    assert.match(client, new RegExp(`id: '${id}'`));
  assert.match(client, /erm20-sideNav/);
  assert.match(client, /erm20-bottomTabs/);
});
test('R20: intro e modal de som funcionais', () => {
  assert.match(client, /erm20-splash/);
  assert.match(client, /setSoundPrompt\(true\)/);
  assert.match(client, /setSound\(true\)/);
  assert.match(client, /setSound\(false\)/);
});
test('R20: subnavegacao conforme referencia', () => {
  for (const id of ['ultratour','entorno','rotas','mapa','implantacao','espacos','tipologias','plantas','apartamentos','areas','perspectivas','empreendimento','shorts'])
    assert.match(client, new RegExp(`id: '${id}'`));
});
test('R20: tipologias do Easy Rota do Mar', () => {
  for (const [id,area] of [['slim','39,19'],['premium','45,21'],['master','47,91'],['spazzio','58,60']])
    assert.match(client, new RegExp(`${id}: \\{ name:.*?${area}`));
  assert.match(client, /const endingToType: Record<number, TypeKey>/);
  assert.match(client, /setSelectedEnding\(n\)/);
});
test('R20: 33 ambientes documentados, sem pontos geograficos inventados', () => {
  const ids = [...client.matchAll(/number: (\d+), name:/g)].map((m)=>Number(m[1]));
  assert.deepEqual(ids, Array.from({length:33},(_,i)=>i+1));
  assert.match(client, /NÃO REPRESENTA POSIÇÕES OU DIMENSÕES REAIS/);
  assert.match(client, /360° REAL PENDENTE/);
});
test('R20: galeria acessivel e teclado', () => {
  assert.match(client, /erm20-galleryThumbs/);
  assert.match(client, /aria-pressed=/);
  assert.match(client, /event\.key === 'Escape'/);
  assert.match(client, /event\.key === 'ArrowRight'/);
  assert.match(client, /event\.key === 'ArrowLeft'/);
});
test('R20: a secao institucional e especificacao ligam ao site oficial', () => {
  assert.match(client, /const official = 'https:\/\/meurocha\.com\.br\/imoveis\/easy-rota-do-mar'/);
  assert.match(client, /erm20-spec/);
  assert.match(client, /erm20-institutional/);
});
test('R20: sem cadastro/SQL/estoque inventado', () => {
  assert.doesNotMatch(client, /<form\b|createClient\(|supabase\.from\(|fetch\('/i);
  assert.match(client, /não indica unidade disponível/);
});
test('R20: proxy de imagens R19 preservado e protegido', () => {
  assert.match(media, /Object\.prototype\.hasOwnProperty\.call\(allowed, id\)/);
  assert.match(media, /const MAX_IMAGE_BYTES/);
  assert.match(media, /reader\.read\(\)/);
});
test('R20: CSS isolado sem regras globais body/html', () => {
  assert.match(css, /Deliberadamente isolado em \.erm20/);
  assert.doesNotMatch(css, /(?:^|\n)\s*(?:html|body)\s*\{/);
  for (const name of ['erm20-sidebar','erm20-immersive','erm20-masterVisual','erm20-floorPlan','erm20-galleryStage','erm20-videos','erm20-spec','erm20-institutional'])
    assert.match(css, new RegExp(`\\.${name}`));
});
