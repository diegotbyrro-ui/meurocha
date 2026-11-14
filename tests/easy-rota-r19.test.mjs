// R21: identidade visual Modelo 3, preservando as funcionalidades da plataforma R20.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const root = process.cwd();
const client = readFileSync(join(root,'app/experiencia/easy-rota-do-mar/EasyRotaClient.tsx'),'utf8');
const css = readFileSync(join(root,'app/experiencia/easy-rota-do-mar/easy-rota.css'),'utf8');
const page = readFileSync(join(root,'app/experiencia/easy-rota-do-mar/page.tsx'),'utf8');
const proxy = readFileSync(join(root,'app/api/experiencia/easy-rota-do-mar/media/[id]/route.ts'),'utf8');
const assetDir = join(root,'public/experiencia/easy-rota-do-mar');

test('R21: pagina nao indexavel, rota e layout originais preservados', () => {
  assert.match(page,/robots: \{ index: false, follow: false, nocache: true \}/);
  assert.match(page,/EasyRotaClient/);
  for(const n of ['erm20-shell','erm20-sidebar','erm20-main','erm20-panel','erm20-bottomTabs']) assert.match(client,new RegExp(n));
});
test('R21: 10 entradas do menu lateral como na arte escolhida', () => {
  for(const id of ['visao','localizacao','entorno','empreendimento','masterplan','plantas','galeria','videos','diferenciais','simulacao'])
    assert.match(client,new RegExp(`id: '${id}'`));
  assert.match(client,/platformMenu\.map/);
  assert.match(client,/selectedNav === n\.id/);
});
test('R21: navegacao inferior com cinco modulos do Modelo 3', () => {
  for (const label of ['Utilização','Entorno','Masterplan','Plantas','Mídias']) assert.match(client,new RegExp(`label: '${label}'`));
  assert.match(client,/globalTabs\.map/);
  assert.match(client,/goGlobal\(n\)/);
});
test('R21: identidade azul marinho e ciano, isolada no escopo erm21', () => {
  assert.match(client,/className="erm20 erm21(?: erm22)?"/);
  assert.match(css,/R21 - MODELO 3/);
  assert.match(css,/\.erm21 \{?/);
  assert.match(css,/#00dafa/i);
  assert.match(css,/\.erm21 \.erm20-sideNav button.active/);
  assert.doesNotMatch(css,/(?:^|\n)\s*(?:html|body)\s*\{/);
});
test('R21: imagens autenticas do book nos quatro modulos visuais', () => {
  for(const f of ['erm-vista-aerea.webp','erm-fachada.webp','erm-praia.webp','erm-implantacao.webp']) {
    assert.ok(existsSync(join(assetDir,f)),`Ausente ${f}`);
    assert.match(client,new RegExp(f));
  }
});
test('R21: controles reais de zoom, pan, som, fullscreen, torres e dia/noite', () => {
  for(const token of ['setZoom','setPan','setSoundOn','requestFullscreen','setTower','setLook','setTilted','setHelp']) assert.match(client,new RegExp(token));
  assert.match(client,/MARCADORES ILUSTRATIVOS/);
  assert.match(client,/360° depende de captura real/);
});
test('R21: mobile segue a arte aprovada e possui navegacao funcional', () => {
  assert.match(client,/erm21-mobileOverview/);
  assert.match(client,/erm21-shortcuts/);
  assert.match(client,/goMenu\(n\)/);
  assert.match(css,/@media\(max-width:560px\)/);
  assert.match(css,/\.erm21 \.erm21-shortcuts/);
});
test('R21: quatro plantas, suas terminacoes e seletor sem inventar estoque', () => {
  for(const [id,area] of [['slim','39,19'],['premium','45,21'],['master','47,91'],['spazzio','58,60']])
    assert.match(client,new RegExp(`${id}: \\{ name:.*?${area}`));
  assert.match(client,/endingToType: Record<number, TypeKey>/);
  assert.match(client,/não indica unidade disponível/);
});
test('R21: 33 ambientes registrados em masterplan real do book', () => {
  const nums=[...client.matchAll(/number: (\d+), name:/g)].map(x=>Number(x[1]));
  assert.deepEqual(nums,Array.from({length:33},(_,i)=>i+1));
  assert.match(client,/erm21-realMaster/);
  assert.match(client,/IMPLANTAÇÃO DO BOOK OFICIAL/);
});
test('R21: galeria com teclado, lightbox e videos sem arquivos falsos', () => {
  assert.match(client,/erm20-galleryThumbs/);
  assert.match(client,/event\.key === 'Escape'/);
  assert.match(client,/event\.key === 'ArrowRight'/);
  assert.match(client,/event\.key === 'ArrowLeft'/);
  assert.match(client,/O vídeo correspondente será vinculado/);
});
test('R21: proxy seguro, pagina institucional e informacoes preservados', () => {
  assert.match(proxy,/Object\.prototype\.hasOwnProperty\.call\(allowed, id\)/);
  assert.match(proxy,/const MAX_IMAGE_BYTES/);
  assert.match(proxy,/reader\.read\(\)/);
  assert.match(client,/https:\/\/meurocha\.com\.br/);
  assert.match(client,/erm20-institutional/);
});
test('R21: sem SQL, login, cotacoes ou API inventados', () => {
  assert.doesNotMatch(client,/<form\b|createClient\(|supabase\.from\(|fetch\('/i);
  assert.doesNotMatch(client,/R\$\s*\d/);
  assert.match(client,/3D NÃO GEORREFERENCIADO/);
});

// R22: somente abertura premium, marca limpa e preferencias de trilha.
test('R22: abertura premium na entrada e modulos originais preservados', () => {
  assert.match(client,/const \[started, setStarted\] = useState\(false\)/);
  for (const key of ['erm22-splashCard','erm22-splashStory','erm22-splashSelection','sections.map((item, index)'])
    assert.ok(client.includes(key), key);
});
test('R22: menus premium animados com icones', () => {
  for (const icon of ['pin','waves','floor','image','play','calculator','building']) assert.ok(client.includes(`'${icon}'`) || client.includes(`${icon}:`),icon);
  assert.match(css,/erm22-menuIn/);
  assert.match(css,/erm22-cardIn/);
  assert.match(css,/#1ee8fb/i);
});
test('R22: marca transparente extraida do book', () => {
  const p=join(assetDir,'erm-logo-transparente.png');
  assert.ok(existsSync(p));
  const png=readFileSync(p);
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(png[25],6,'PNG RGBA com transparencia');
  assert.match(client,/erm-logo-transparente\.png/);
  assert.match(css,/mix-blend-mode:normal!important/);
});
test('R22: opcao de trilha sonora original com consentimento', () => {
  const ogg=readFileSync(join(assetDir,'erm-ambiente-original.mp3'));
  assert.ok(ogg.subarray(0,3).toString('utf8') === 'ID3' || ogg.subarray(0,2).toString('hex') === 'fffb', 'MP3 original valido');
  assert.match(client,/erm-ambiente-original\.mp3/);
  assert.match(client,/ENTRAR COM MÚSICA/);
  assert.match(client,/ENTRAR SEM MÚSICA/);
  assert.match(client,/setPendingSection\(chosen\); setSoundPrompt\(true\)/);
  assert.doesNotMatch(client,/<audio[^>]*autoPlay/i);
});
test('R22: trilha pode ser desligada, volume e erro tratados', () => {
  for (const s of ['playMusic','toggleMusic','music.current?.pause()','erm22-soundToggle','setAudioError(true)']) assert.ok(client.includes(s), s);
  assert.match(client,/aria-pressed=\{soundOn\}/);
  assert.match(client,/volume \/ 100/);
  assert.match(client,/play\(\)\.catch/);
});
test('R22: mobile e animacoes respeitam preferencia de movimento', () => {
  assert.match(css,/@media\(max-width:740px\)/);
  assert.match(css,/@media\(max-width:390px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.doesNotMatch(css,/(?:^|\n)\s*(?:html|body)\s*\{/);
});

// R22 R2: regressao do erro TS2322/TS2339 observado no Windows ao tentar publicar R22 R1.
test('R22 R2: icones de abertura cobrem todas as sections', () => {
  const match = client.match(/const splashIcons: Record<Section, string> = \{([\s\S]*?)\n\};/);
  assert.ok(match, 'O mapa de icones precisa ser tipado como Record<Section, string>');
  for (const section of ['localizacao', 'lazer', 'plantas', 'imagens', 'videos', 'ficha', 'institucional', 'simulacao']) {
    assert.match(match[1], new RegExp(`\\b${section}\\s*:\\s*'`), `Falta icone para ${section}`);
  }
  assert.match(client, /<UiIcon name=\{splashIcons\[item\.id\]\} size=\{22\}\/>/);
  assert.doesNotMatch(client, /<UiIcon name=\{\{localizacao:/);
});
