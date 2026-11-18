// R21: identidade visual Modelo 3, preservando as funcionalidades da plataforma R20.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
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
  for(const n of ['erm20-shell','erm20-sidebar','erm20-main','erm20-panel']) assert.match(client,new RegExp(n));
});
test('R36: menu lateral reduzido a sete opcoes como no Park Plaza', () => {
  for(const id of ['localizacao','lazer','plantas','imagens','videos','ficha','institucional'])
    assert.match(client,new RegExp(`id: '${id}'`));
  assert.match(client,/platformMenu\.map/);
  assert.match(client,/selectedNav === n\.id/);
});
test('R36: nao renderiza a barra inferior de cinco modulos', () => {
  assert.doesNotMatch(client,/erm20-bottomTabs|globalTabs\.map|goGlobal\(n\)/);
});
test('R21: identidade azul marinho e ciano, isolada no escopo erm21', () => {
  assert.match(client,/className="erm20 erm21 erm22 erm23"/);
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
  assert.match(client,/não disponibilidade de unidades/);
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
test('R23: splash tem apenas um botao iniciar e nao revela os modulos', () => {
  const splash=client.slice(client.indexOf('{!started &&'), client.indexOf('{started &&'));
  assert.match(splash, /className="erm20-splash erm23-splash"/);
  assert.match(splash, /<Brand \/>/);
  assert.match(splash, /onClick=\{\(\) => start\('localizacao'\)\}/);
  assert.match(splash, /TOQUE PARA INICIAR A EXPERIÊNCIA/);
  assert.doesNotMatch(splash, /sections\.map|platformMenu\.map|erm22-splashSelection/);
  assert.equal((splash.match(/<button /g) || []).length, 1, 'Um botao so na abertura');
});
test('R23: assinatura Rocha discreta e transparente no topo direito', () => {
  const file=join(assetDir, 'erm-rocha-assinatura.png');
  assert.ok(existsSync(file));
  const png=readFileSync(file);
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(png[25],6,'Logo em PNG com alfa');
  assert.match(client,/erm23-splashHeader/);
  assert.match(client,/erm23-rochaSignature/);
  assert.match(client,/erm-rocha-assinatura\.png/);
  assert.match(css,/\.erm23-rochaSignature/);
});
test('R23: modal abre apos CTA e nao permite autoplay', () => {
  assert.match(client,/const start = \(chosen: Section\) => \{/);
  assert.match(client,/setPendingSection\(chosen\); setSoundPrompt\(true\)/);
  assert.match(client,/Deseja iniciar com música\?/);
  assert.match(client,/ENTRAR COM MÚSICA/);
  assert.match(client,/ENTRAR SEM MÚSICA/);
  assert.match(client,/setStarted\(true\)/);
  assert.doesNotMatch(client,/<audio[^>]*autoPlay/i);
});
test('R23: os modulos internos de R22 permanecem completos', () => {
  for (const s of ['erm20-sidebar','erm20-sideNav','erm20-panel','platformMenu.map','openLightbox','toggleMusic']) assert.ok(client.includes(s),s);
  assert.match(css,/\.erm23 \.erm20-splash\.erm23-splash/);
  assert.match(css,/@media\(max-width:740px\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
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

test('R23: splash nao usa mapa de icones de modulo e preserva tipagem', () => {
  assert.doesNotMatch(client, /splashIcons\[item\.id\]/);
  assert.match(client,/type Section =/);
  assert.match(client,/const sections:/);
  assert.match(client,/const start = \(chosen: Section\)/);
});

// R24: escopo estrito - somente posicao da logo e consistencia tipografica.
test('R24: cabecalho ocupa largura total e ancora marca Rocha no canto direito', () => {
  assert.match(css, /\.erm23 \.erm20-splash\.erm23-splash\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  assert.match(css, /\.erm23 \.erm23-splashHeader\s*\{[^}]*justify-content:\s*flex-end/s);
  assert.match(css, /\.erm23 \.erm23-rochaSignature\s*\{[^}]*margin-left:\s*auto/s);
  assert.match(client, /<header className="erm23-splashHeader">/);
  assert.match(client, /erm-rocha-assinatura\.png/);
});
test('R24: somente duas familias de tipografia e rodape coerente', () => {
  assert.match(css, /--erm24-type-ui:\s*'Segoe UI',\s*sans-serif/);
  assert.match(css, /--erm24-type-editorial:\s*Georgia,\s*serif/);
  assert.match(css, /\.erm23 \.erm23-splashFooter\s*\{[^}]*font-size:\s*clamp/s);
  assert.match(css, /\.erm23 \.erm23-splashFooter > span\s*\{[^}]*font-family:\s*inherit/s);
  assert.doesNotMatch(css, /Century Gothic|Times New Roman|Arial/);
  assert.match(client, /className="erm30-centralSlogan">VIVA ALÉM DO COMUM<\/p>/);
});

// R25: menu central após a escolha da trilha, sem modificar os módulos internos.
test('R25: fluxo em quatro etapas (splash, áudio, menu central, módulo)', () => {
  assert.match(client, /const \[centralMenuOpen, setCentralMenuOpen\] = useState\(false\)/);
  assert.match(client, /setSoundOn\(enabled\); setSoundPrompt\(false\); setStarted\(true\); setCentralMenuOpen\(true\)/);
  assert.match(client, /\{started && centralMenuOpen && <section className="erm25-centralMenu"/);
  assert.match(client, /\{started && !centralMenuOpen && <div className="erm20-shell"/);
  assert.match(client, /const openCentralSection = \(chosen: Section\) => \{/);
  assert.match(client, /setCentralMenuOpen\(false\)/);
});
test('R25: a segunda tela tem logo e somente sete opções centrais', () => {
  const menu=client.slice(client.indexOf('{started && centralMenuOpen &&'), client.indexOf('{started && !centralMenuOpen &&'));
  assert.match(menu, /<Brand \/>/);
  assert.match(menu, /sections\.map\(\(item, index\)/);
  assert.match(menu, /onClick=\{\(\) => openCentralSection\(item\.id\)\}/);
  assert.match(menu, /<nav className="erm25-options"/);
  assert.match(menu, /erm25-optionIcon/);
  assert.match(menu, /erm25-optionLabel/);
  assert.doesNotMatch(menu, /platformMenu\.map|globalTabs\.map|erm20-panel/);
  const sectionList = client.slice(client.indexOf('const sections:'), client.indexOf('const centralMenuIcons:'));
  const matched = [...sectionList.matchAll(/\{ id: '(localizacao|lazer|plantas|imagens|videos|ficha|institucional)', label:/g)];
  assert.equal(matched.length,7);
});
test('R25: a tela central tem botões reais de voltar, música e informações', () => {
  assert.match(client, /const backToSplash = \(\) => \{/);
  assert.match(client, /onClick=\{backToSplash\}/);
  assert.match(client, /onClick=\{toggleMusic\}/);
  assert.match(client, /onClick=\{\(\) => setHelp\(true\)\}/);
  assert.match(client, /aria-pressed=\{soundOn\}/);
  assert.match(client, /aria-label="Voltar ao menu principal"/);
});
test('R25: tipografia, cores, responsividade e redução de movimento', () => {
  assert.match(css, /ROCHA R25/);
  assert.match(css, /\.erm23 \.erm25-centralMenu/);
  assert.match(css, /\.erm23 \.erm25-optionIcon/);
  assert.match(css, /var\(--erm24-type-ui\)/);
  assert.match(css, /#00bcd6|#00dafa/i);
  assert.match(css, /@media\(max-width:740px\)/);
  assert.match(css, /@media\(max-width:390px\)/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
});

test('R26: elimina somente a frase experiência imobiliária da tela inicial', () => {
  const splash = client.slice(client.indexOf('{!started &&'), client.indexOf('{started &&'));
  assert.doesNotMatch(splash, /UMA EXPERIÊNCIA IMOBILIÁRIA INTERATIVA/);
  assert.match(splash, /O caminho mais curto entre a Serraria e o mar/);
  assert.match(splash, /TOQUE PARA INICIAR A EXPERIÊNCIA/);
  assert.match(client, /erm25-centralMenu/);
});
test('R26: aplica o pattern geométrico autêntico do book nas duas telas, sem novos menus', () => {
  assert.match(css, /ROCHA R26/);
  assert.match(css, /\.erm23 \.erm20-splash\.erm23-splash::after/);
  assert.match(css, /\.erm23 \.erm25-pattern/);
  assert.match(css, /erm-pattern-book\.png/g);
  assert.match(css, /mask-image:linear-gradient/);
  assert.match(css, /@media\(max-width:740px\)/);
  const menu=client.slice(client.indexOf('{started && centralMenuOpen &&'),client.indexOf('{started && !centralMenuOpen &&'));
  assert.match(menu, /sections\.map\(\(item, index\)/);
});


// R27: neón no traço, pulso de onda e feedback sonoro apenas após clique.
test('R27: abertura limpa sem APRESENTA, mantendo CTA, slogan e marca', () => {
  const splash = client.slice(client.indexOf('{!started &&'), client.indexOf('{started &&'));
  assert.doesNotMatch(splash,/APRESENTA/);
  assert.match(splash,/TOQUE PARA INICIAR A EXPERIÊNCIA/);
  assert.match(splash,/O caminho mais curto entre a Serraria e o mar/);
  assert.match(splash,/erm-rocha-assinatura\.png/);
  assert.match(splash,/erm23-brandFrame/);
});
test('R29: nenhum elemento de linha curva ou neon permanece no DOM das duas telas', () => {
  const splash = client.slice(client.indexOf('{!started &&'), client.indexOf('{started &&'));
  const menu = client.slice(client.indexOf('{started && centralMenuOpen &&'), client.indexOf('{started && !centralMenuOpen &&'));
  assert.doesNotMatch(splash,/erm23-waveTop|erm27-neonLine|erm27-neonBase|erm27-neonRunner/);
  assert.doesNotMatch(menu,/erm25-ambientWave/);
  assert.match(css,/\.erm23 \.erm23-waveTop,[\s\S]*?\.erm23 \.erm25-ambientWave \{ display:none!important; \}/);
});
test('R27: play com ondas e som original disparado pelo clique, sem autoplay', () => {
  const mp3=readFileSync(join(assetDir,'erm-onda-clique-original.mp3'));
  assert.ok(mp3.length>12000);
  assert.ok(mp3.subarray(0,3).toString('ascii')==='ID3' || mp3[0]===0xff,'MP3 real');
  assert.match(client,/ref=\{waveClick\} src=\{`\$\{BRAND_ASSETS\}erm-onda-natural-r28\.mp3`\}/);
  assert.match(client,/waveClick\.current\.play\(\)\.catch/);
  assert.match(client,/onClick=\{\(\) => start\('localizacao'\)\}/);
  assert.match(client,/erm28-waveIcon/);
  assert.match(css,/@keyframes erm27-wavePulse/);
  assert.doesNotMatch(client,/<audio[^>]*autoPlay/i);
});
test('R27: pattern mais discreto e movimentos opcionais respeitados', () => {
  assert.match(css,/ROCHA R27/);
  assert.match(css,/opacity:\.19;height:45%/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/\.erm23 \.erm25-pattern \{opacity:\.22;/);
  assert.match(client,/erm25-centralMenu/);
});


// R28: regressao visual e sonora baseada no mockup reenviado pelo usuario.
test('R28: configuracao historica do neon preservada, mas escondida pela R29', () => {
  const scope=css.slice(css.indexOf('ROCHA R28'));
  assert.match(scope,/\.erm23 \.erm27-neonRunner \{[\s\S]*?stroke-width:\.75;opacity:\.28;/);
  assert.match(scope,/stroke-dasharray:24 976/);
  assert.match(scope,/animation:erm27-neonTravel 17s linear infinite/);
  assert.doesNotMatch(scope,/drop-shadow\(0 0 9px/);
  assert.match(scope,/prefers-reduced-motion:reduce/);
});
test('R28: icone do CTA foi substituido por desenho de onda em movimento, sem play', () => {
  const splash=client.slice(client.indexOf('{!started &&'),client.indexOf('{started &&'));
  assert.match(splash,/className="erm28-waveIcon"/);
  assert.match(splash,/erm23-startIcon/);
  assert.doesNotMatch(splash,/<UiIcon name="play"/);
  assert.doesNotMatch(splash,/erm27-ripple/);
  assert.match(css,/@keyframes erm28-waveSway/);
});
test('R28: som de agua original substitui efeito sintetico sem autoplay', () => {
  const mp3=readFileSync(join(assetDir,'erm-onda-natural-r28.mp3'));
  assert.ok(mp3.length>30000);
  assert.equal(mp3.subarray(0,3).toString('ascii'),'ID3');
  assert.match(client,/erm-onda-natural-r28\.mp3/);
  assert.match(client,/waveClick\.current\.volume = 0\.23/);
  assert.match(client,/waveClick\.current\.play\(\)\.catch/);
  assert.doesNotMatch(client,/<audio[^>]*autoPlay/i);
});
test('R28: centro livre e pattern no rodape e laterais; menu central intacto', () => {
  const scope=css.slice(css.indexOf('ROCHA R28'));
  assert.match(scope,/mask-image:radial-gradient/);
  assert.match(scope,/height:75%;opacity:\.15/);
  assert.match(scope,/\.erm23 \.erm23-backgroundGrid \{opacity:\.055;\}/);
  assert.match(client,/erm25-centralMenu/);
  assert.match(client,/erm-rocha-assinatura\.png/);
});


// R29 — verificações da correção solicitada após inspeção dos screenshots.
test('R29: tile do book contém somente glifos completos, com dimensão e transparência auditadas', () => {
  const tile = readFileSync(join(assetDir,'erm-pattern-book-r29.png'));
  assert.equal(tile.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(tile.readUInt32BE(16),520);
  assert.equal(tile.readUInt32BE(20),108);
  assert.equal(tile[25],6,'O tile deve ter canal alfa para evitar caixa colorida');
  assert.ok(tile.length>1000 && tile.length<150000);
  const r29=css.slice(css.lastIndexOf('ROCHA R29'));
  assert.ok((r29.match(/erm-pattern-book-r29\.png/g)||[]).length===3);
  assert.match(r29,/background-repeat:repeat/);
  assert.match(r29,/background-size:520px 108px/);
  assert.match(r29,/background-position:center bottom/);
});
test('R29: preserva CTA de onda, escolha de som, menu de sete módulos e interior da R28', () => {
  const splash=client.slice(client.indexOf('{!started &&'),client.indexOf('{started &&'));
  const menu=client.slice(client.indexOf('{started && centralMenuOpen &&'),client.indexOf('{started && !centralMenuOpen &&'));
  assert.match(splash,/erm28-waveIcon/);
  assert.match(splash,/TOQUE PARA INICIAR A EXPERIÊNCIA/);
  assert.match(menu,/sections\.map\(\(item, index\)/);
  assert.match(client,/Deseja iniciar com música\?/);
  assert.match(client,/erm-onda-natural-r28\.mp3/);
  assert.match(client,/erm20-sidebar/);
  assert.doesNotMatch(client,/erm20-bottomTabs/);
  const r29=css.slice(css.indexOf('ROCHA R29'),css.indexOf('ROCHA R30'));
  assert.match(r29,/Apenas splash e menu central/);
  assert.doesNotMatch(r29,/erm20-panel|erm20-sidebar|erm20-bottomTabs/);
});


// R30 — ajuste final da abertura solicitado nos prints.
test('R30: slogan central imediatamente abaixo do texto do empreendimento', () => {
  const splash=client.slice(client.indexOf('{!started &&'),client.indexOf('{started && centralMenuOpen &&'));
  assert.match(splash,/<h1 className="erm23-headline">O caminho mais curto entre a Serraria e o mar\.<\/h1>\s*<p className="erm30-centralSlogan">VIVA ALÉM DO COMUM<\/p>/);
  assert.equal((splash.match(/VIVA ALÉM DO COMUM/g)||[]).length,1);
  assert.doesNotMatch(splash,/className="erm23-splashFooter"/);
});
test('R30: remove qualquer texto de homologação na abertura e mantém menu', () => {
  const splash=client.slice(client.indexOf('{!started &&'),client.indexOf('{started && centralMenuOpen &&'));
  const menu=client.slice(client.indexOf('{started && centralMenuOpen &&'),client.indexOf('{started && !centralMenuOpen &&'));
  assert.doesNotMatch(splash,/AMBIENTE DE HOMOLOGAÇÃO/);
  assert.match(splash,/erm-rocha-assinatura\.png/);
  assert.match(splash,/TOQUE PARA INICIAR A EXPERIÊNCIA/);
  assert.match(menu,/sections\.map\(\(item, index\)/);
});
test('R30: nova imagem anti-recorte é usada nas duas telas com transparência', () => {
  const png=readFileSync(join(assetDir,'erm-pattern-book-r30.png'));
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16),520);
  assert.equal(png.readUInt32BE(20),108);
  assert.equal(png[25],6,'A nova textura deve manter o canal alfa');
  assert.ok(png.length>1000);
  const r30=css.slice(css.indexOf('ROCHA R30'),css.indexOf('ROCHA R31'));
  assert.equal((r30.match(/erm-pattern-book-r30\.png/g)||[]).length,2,'Uma entrada para splash e uma regra compartilhada das duas camadas do menu');
  assert.match(r30,/font-family:var\(--erm24-type-ui\)/);
  assert.doesNotMatch(r30,/erm20-sidebar|erm20-panel|erm20-bottomTabs/);
});


// R31 — importação inicial das imagens fornecidas para o masterplan/ambientes.
test('R31: planta de pavimento tipo é mostrada sem corte, com opção de consultar implantação original', () => {
  assert.match(client,/r32Asset\('pavimento-interativo'\)/);
  assert.match(client,/masterImage === 'pavimento'/);
  assert.match(client,/masterImage === 'implantacao'/);
  assert.match(client,/erm-implantacao\.webp/);
  assert.match(css,/\.erm31-realPlan>img\.erm31-planImage\{[^}]*object-fit:contain/);
});
test('R31: os dez ambientes têm imagem individual corretamente associada, sem reutilizar fotografia de outro ambiente', () => {
  const exact = new Map([
    [6,'piscina-adulto'],[9,'espaco-grill'],[10,'espaco-gourmet'],[11,'espaco-fitness'],
    [12,'easy-play'],[14,'espaco-beleza'],[17,'bicicletarios'],[22,'easy-wash'],
    [30,'pista-de-cooper'],[31,'recarga-veiculos-eletricos'],
  ]);
  const block = client.slice(client.indexOf('const facilityImages:'),client.indexOf('const gallery ='));
  const entries = [...block.matchAll(/(\d+): 'erm-amb-\d+-([^']+)'/g)].map(x=>[Number(x[1]),x[2]]);
  assert.equal(entries.length,10);
  assert.deepEqual(new Map(entries),exact);
  for(const [num,suffix] of exact){
    const p=`erm-amb-${String(num).padStart(2,'0')}-${suffix}`;
    for(const f of [`${p}.webp`,`${p}-thumb.webp`]){
      const buf=readFileSync(join(assetDir,f));
      assert.equal(buf.subarray(0,4).toString('ascii'),'RIFF');
      assert.equal(buf.subarray(8,12).toString('ascii'),'WEBP');
      assert.ok(buf.length>1000);
    }
  }
});
test('R31: quadro superior usa imagem inteira fornecida e não perde nenhuma parte desenhada', () => {
  const buf=readFileSync(join(assetDir,'erm-pavimento-tipo-r31.webp'));
  assert.equal(buf.subarray(0,4).toString('ascii'),'RIFF');
  assert.equal(buf.subarray(8,12).toString('ascii'),'WEBP');
  assert.match(client,/Planta completa do pavimento tipo Easy Rota do Mar/);
  assert.match(css,/\.erm31-realPlan>img\.erm31-planImage/);
  assert.match(css,/object-fit:contain/);
});
test('R31: fotos individuais permanecem preservadas para futura seção de áreas comuns', () => {
  assert.match(client,/const facilityImages:/);
  assert.match(client,/const facilityImages:/);
  assert.match(css,/erm31-masterPreview/);
  assert.match(css,/\.erm31-masterPreview>img\{[^}]*object-fit:contain/);
});
test('R31: preserva as 33 identificações e demais telas da R30 sem afetar música, logo ou navegação', () => {
  assert.equal([...client.matchAll(/number: (\d+), name:/g)].length,33);
  for(const term of ['erm28-waveIcon','setSoundPrompt(true)','erm25-centralMenu','erm30-centralSlogan','erm-rocha-assinatura.png']) {
    assert.ok(client.includes(term),term);
  }
});


test('R31: a implantação é o padrão; a planta do pavimento tipo não é rotulada como implantação', () => {
  assert.match(client,/useState<'implantacao' \| 'pavimento'>\('implantacao'\)/);
  assert.match(client,/Implantação geral/);
  assert.match(client,/Pavimento tipo/);
  assert.match(client,/const currentMasterSource/);
});
test('R31: imagem principal tem zoom, arraste, ajuste e ampliação sem cortes', () => {
  for(const x of ['masterZoom','setMasterOffset','onPointerMove={moveMaster}','setPointerCapture','setMasterExpanded','erm31-imageOverlay']) assert.ok(client.includes(x),x);
  assert.match(css,/\.erm31-realPlan>img\.erm31-planImage\{[^}]*object-fit:contain/);
  assert.match(css,/\.erm31-imageOverlay>img\{[^}]*object-fit:contain/);
});
test('R31: base de imagens e dados permanece disponível para realocação futura', () => {
  for(const token of ['const facilities:', 'const facilityImages:', 'erm31-facilityPhotoButton'])
    assert.ok(client.includes(token) || css.includes(token), token);
  assert.match(css,/\.erm31-facilityPhotoButton>img\{[^}]*object-fit:contain/);
});


// R32: navegação fiel à referência gravada com as informações oficiais das plantas.
test('R32: pavimento tipo contém 8 terminações corretas, uma de cada posição fotografada', () => {
  const block=client.slice(client.indexOf('const r32UnitPoints'),client.indexOf('const r32Asset'));
  const found=[...block.matchAll(/ending:(\d+),x:/g)].map(x=>Number(x[1]));
  assert.deepEqual([...found].sort((a,b)=>a-b),[1,2,3,4,5,6,7,8]);
  assert.match(client,/endingToType: Record<number, TypeKey>/);
  assert.match(client,/4: 'spazzio', 5: 'spazzio'/);
});
test('R32: associação Slim Premium Master Spazzio é a do livro nas páginas 13 e 14',()=>{
  const typesBlock=client.slice(client.indexOf('const types:'),client.indexOf('const typeKeys:'));
  for(const term of ["endings: [1, 8]","endings: [2, 3]","endings: [6, 7]","endings: [4, 5]"])
    assert.ok(typesBlock.includes(term),term);
  for(const k of ['slim','premium','master','spazzio'])assert.ok(client.includes(`'planta-${k}`) || client.includes(`planta-${k}`),k);
});
test('R38: Spazzio mostra planta baixa do pavimento original e nao screenshot do book',()=>{
  assert.doesNotMatch(client,/planta-spazzio-book-3d|Perspectiva do book|Perspectiva 3D oficial do book/);
  assert.match(client,/erm38-spazzio-\$\{selectedEnding === 5 \? '05' : '04'\}-planta-baixa\.webp/);
  assert.match(client,/selectedType === 'spazzio' \? <p className="erm38-sourceNote"/);
  assert.match(client,/sem uma prancha individual com cotas/);
});
test('R32: todas as plantas WebP oficiais e pavimento completo estão no pacote',()=>{
  for(const p of ['erm32-pavimento-interativo.webp', 'erm32-planta-slim.webp', 'erm32-planta-premium.webp','erm32-planta-master.webp','erm32-planta-spazzio-book-3d.webp']){
    const buf=readFileSync(join(assetDir,p));
    assert.ok(buf.length>30000,p);
    assert.equal(buf.subarray(0,4).toString('ascii'),'RIFF');
    assert.equal(buf.subarray(8,12).toString('ascii'),'WEBP');
  }
});
test('R32: planta clicável e seletores abrem tipologia correta e possuem controles de retorno',()=>{
  for(const x of ['erm32-building','erm32-unit','setSelectedEnding(p.ending)',"chooseTab(\'plantas\')", 'erm32-back','erm32-navArrow','erm32-endingPicker','erm32-lightbox'])
    assert.ok(client.includes(x),x);
  assert.match(css,/\.erm21 \.erm32-building>img\{[^}]*object-fit:contain/);
  assert.match(css,/\.erm21 \.erm32-planPhoto img\{[^}]*object-fit:contain/);
});
test('R32: área comum retirada desta seção, materiais e mapa original preservados',()=>{
  const master=client.slice(client.indexOf("{section === 'lazer'"),client.indexOf("{section === 'plantas'"));
  assert.doesNotMatch(master,/erm20-masterLower|erm31-facilityThumb|erm31-masterPreview/);
  assert.match(master,/erm32-masterMoved/);
  assert.match(client,/erm-implantacao\.webp/);
});
test('R32: responsividade, acessibilidade e sem inventar estoque ou preços',()=>{
  assert.match(css,/@media\(max-width:600px\)/);
  assert.match(client,/aria-label=\{`Ver planta/);
  assert.match(client,/não disponibilidade de unidades/);
  assert.doesNotMatch(client,/R32_ESTOQUE_INVENTADO/);
});


// R33 — cartoes 3D ilustrativos, quatro cores, pavimento inteiro e planta oficial no detalhe.
test('R33 R2: imagens dos 3 tipos derivadas da planta original em TIFF, sem geometria inventada',()=>{
  for (const type of ['slim','premium','master']) {
    const f=`erm33r2-${type}-oficial-perspectiva.webp`;
    const buf=readFileSync(join(assetDir,f));
    assert.ok(buf.length > 30000,f);
    assert.equal(buf.subarray(0,4).toString('ascii'),'RIFF');
    assert.equal(buf.subarray(8,12).toString('ascii'),'WEBP');
    assert.ok(client.includes(f),f);
  }
  assert.match(client,/sem modificar a distribuição dos ambientes/);
  assert.match(client,/não são maquetes executivas 3D/);
  assert.ok(client.includes('erm38-spazzio-04-planta-baixa.webp'));
});
test('R33: imagens técnicas 2D ainda são mostradas ao abrir tipologia',()=>{
  assert.ok(client.includes('r32Asset(r32PlanFile[selectedType])'));
  assert.ok(client.includes('setTypeAndShow(k)'));
  assert.match(client,/erm32-planFocus/);
});
test('R34: oito zonas por tipologia com contornos restritos e sem circulacao central',()=>{
  const block=client.slice(client.indexOf('const r35Zones:'),client.indexOf('const r32PlanFile'));
  const found=[...block.matchAll(/ending:(\d+),points:'([^']+)'/g)].map(m=>({ending:Number(m[1]),points:m[2]}));
  assert.deepEqual(found.map(v=>v.ending).sort((a,b)=>a-b),[1,2,3,4,5,6,7,8]);
  for(const zone of found){
    const pts=zone.points.split(' ').map(t=>t.split(',').map(Number));
    assert.ok(pts.length>=4 && pts.every(p=>p.length===2 && p[0]>=0 && p[0]<=2500 && p[1]>=0 && p[1]<=957));
    // A circulacao central deve ficar sempre fora, sem impedir os quartos nas extremidades.
    const pointInside=(x,y)=>{ let inside=false; for(let i=0,j=pts.length-1;i<pts.length;j=i++){
      const a=pts[i],b=pts[j]; if((a[1]>y)!==(b[1]>y) && x < (b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]) inside=!inside;
    } return inside; };
    for(const x of [350,650,900,1450,1700,1850]) for(const y of [445,470,490,505])
      assert.equal(pointInside(x,y),false,`Corredor ${x},${y} invadido pela unidade ${zone.ending}`);
  }
  assert.match(client,/className=\{`erm34-zone erm33-\$\{key\}/);
  assert.match(css,/\.erm21 \.erm34-zone\.isSelected/);
  assert.match(css,/fill-opacity:\.15/);
});
test('R33: cores por tipologia mantêm o mesmo mapeamento dos marcadores aos cards',()=>{
  for(const key of ['slim','premium','master','spazzio']){
    assert.match(css,new RegExp('\\.erm21 \\.erm33-'+key+'\\{'));
    assert.ok(client.includes('erm33-${type}'));
    assert.ok(client.includes('erm33-${key}'));
  }
  assert.match(client,/erm33-unitLabel/);
});
test('R33: pavimento transparente e vistas sem corte',()=>{
  const buf=readFileSync(join(assetDir,'erm33-pavimento-transparente.webp'));
  assert.equal(buf.subarray(0,4).toString('ascii'),'RIFF');
  assert.equal(buf.subarray(8,12).toString('ascii'),'WEBP');
  assert.match(css,/\.erm21 \.erm33-building>img\{[^}]*object-fit:contain/);
  assert.match(css,/\.erm21 \.erm33-perspective img\{[^}]*object-fit:contain/);
});
test('R33: nao altera dados de tipologia nem disponibilidade',()=>{
  for(const term of ["endings: [1, 8]","endings: [2, 3]","endings: [6, 7]","endings: [4, 5]"]){assert.ok(client.includes(term));}
  assert.match(client,/não disponibilidade de unidades/);
});

// R33 R2 — comparação possível entre vista oficial ortogonal e a projeção baseada na mesma imagem.
test('R33 R2: detalhe alterna Planta técnica ou Perspectiva sem perder a imagem oficial',()=>{
  assert.match(client,/erm33-viewSwitch/);
  assert.match(client,/setPlant3D\(false\)/);
  assert.match(client,/setPlant3D\(true\)/);
  assert.match(client,/plant3D && selectedType !== 'spazzio' \? r33CardAsset\[selectedType\] : selectedPlanSource/);
  assert.match(client,/aria-pressed=\{plant3D\}/);
  assert.match(css,/\.erm21 \.erm33-viewSwitch button\.active/);
});
test('R33 R2: todas as associações de tipologia e fonte oficial preservadas',()=>{
  const names=['PlantaTipo1_EasyRMTEXTOS','PlantaTipo2_EasyRMTEXTOS','PlantaTipo3_EasyRM'];
  for (const n of ['Slim','Premium','Master','Spazzio']) assert.ok(client.includes(n));
  for (const k of ['slim','premium','master']) {
    assert.match(client,new RegExp(`erm33r2-${k}-oficial-perspectiva\\.webp`));
  }
  assert.ok(client.includes('erm38-spazzio-04-planta-baixa.webp'));
  assert.ok(client.includes('Planta técnica'));
});

// R34: eliminacao da duplicacao de badges e realce sem areas retangulares gigantes.
test('R34: planta original sem etiquetas embutidas e somente oito marcadores HTML',()=>{
  const name='erm34-pavimento-limpo.webp';
  const buf=readFileSync(join(assetDir,name));
  assert.equal(buf.subarray(0,4).toString('ascii'),'RIFF');
  assert.equal(buf.subarray(8,12).toString('ascii'),'WEBP');
  assert.equal(createHash('sha256').update(buf).digest('hex'), '36933ce62a5c7caa45cd59bfddb9e5e8a094673212db2b649b184d9bb1c6480a');
  assert.match(client,/erm34-pavimento-limpo\.webp/);
  const plan=client.slice(client.indexOf('className="erm32-building erm33-building"'),client.indexOf('className="erm36-typesRow"'));
  assert.doesNotMatch(plan,/erm33-pavimento-transparente/);
  assert.doesNotMatch(plan,/r33Zones|erm33-zones|erm33-zone erm33/);
  assert.match(plan,/r32UnitPoints\.map/);
  assert.match(plan,/key=\{p\.ending\}/);
  assert.match(plan,/erm33-unitLabel/);
  assert.match(css,/\.erm21 \.erm34-zones\{/);
  assert.match(css,/mask-image:url\('/);
});

test('R34: sobreposicoes e etiquetas usam o mesmo palco proporcional ao quadro, sem alterar seu tamanho',()=>{
  assert.match(client,/className="erm34-planStage"/);
  assert.match(client,/preserveAspectRatio="xMidYMid meet"/);
  assert.match(css,/\.erm21 \.erm33-building\{display:flex;align-items:center;justify-content:center\}/);
  assert.match(css,/\.erm21 \.erm34-planStage\{[^}]*aspect-ratio:2500\/957/);
  assert.match(css,/\.erm21 \.erm34-planStage>img\{[^}]*object-fit:contain/);
});

// R35 - limites das oito unidades sem invadir circulacao, escadas ou outro apartamento.
test('R35: oito recortes independentes respeitam as divisas indicadas e nao se sobrepoem',()=>{
  const block=client.slice(client.indexOf('const r35Zones:'),client.indexOf('const r32PlanFile'));
  const polygons=[...block.matchAll(/ending:(\d+),points:'([^']+)'/g)].map(m=>({n:Number(m[1]),p:m[2].split(' ').map(x=>x.split(',').map(Number))}));
  assert.equal(polygons.length,8);
  const contains=(pts,x,y)=>{let inside=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){
    const a=pts[i],b=pts[j]; if((a[1]>y)!==(b[1]>y) && x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }return inside};
  for(let x=0;x<2500;x+=10)for(let y=0;y<957;y+=10){
    const found=polygons.filter(p=>contains(p.p,x,y)).map(p=>p.n);
    assert.ok(found.length<=1,`Apartamentos sobrepostos em ${x},${y}: ${found}`);
    if(x>=290&&x<=1905&&y>=438&&y<=512)assert.equal(found.length,0,`Corredor colorido em ${x},${y}`);
    if(x>=1139&&x<=1310&&y>=120&&y<=843)assert.equal(found.length,0,`Escada ou elevador colorido em ${x},${y}`);
  }
  assert.equal(polygons.find(p=>p.n===8).p.length,6);
  assert.equal(polygons.find(p=>p.n===4).p.length,6);
});
test('R35: cores seguem unidade com hover/foco e clique preserva a planta tecnica',()=>{
  assert.match(client,/r35Zones\.map/);
  assert.match(client,/hoveredEnding===zone\.ending\?'isHovered'/);
  assert.match(client,/onMouseEnter=\{\(\) => setHoveredEnding\(p\.ending\)\}/);
  assert.match(client,/onFocus=\{\(\) => setHoveredEnding\(p\.ending\)\}/);
  assert.match(client,/setHoveredEnding\(null\);setHighlightedType\(type\);setSelectedType\(type\);setSelectedEnding\(p\.ending\)/);
  assert.match(css,/\.erm21 \.erm34-zone\.isHovered\{/);
  assert.match(css,/\.erm21 \.erm34-zone\.isSelected\{/);
  assert.match(css,/stroke-width:1\.5/);
  assert.match(client,/erm34-pavimento-limpo\.webp/);
  assert.match(client,/r32UnitPoints\.map/);
});

// R36 — interface aprovada: menu de sete itens, sem barra inferior e sem imagens nos resumos.
test('R36: sete itens laterais na ordem do Park Plaza com seus modulos reais',()=>{
  const block=client.slice(client.indexOf('const platformMenu:'),client.indexOf('function UiIcon'));
  const labels=[...block.matchAll(/label: '([^']+)'/g)].map(m=>m[1]);
  assert.deepEqual(labels,['Localização','Lazer','Plantas','Imagens','Vídeos','Ficha Técnica','Institucional']);
  for(const id of ['localizacao','lazer','plantas','imagens','videos','ficha','institucional'])assert.ok(block.includes(`id: '${id}'`));
  assert.doesNotMatch(block,/Visão Geral|Entorno'|Empreendimento'|Masterplan'|Galeria de Imagens|Diferenciais|Simulação/);
  assert.match(client,/platformMenu\.map/);
});
test('R36: navegacao inferior removida do DOM; conteudo preenche a tela',()=>{
  assert.doesNotMatch(client,/globalTabs|goGlobal|erm20-bottomTabs|erm32-detailBottom/);
  assert.match(css,/R36 - Plataforma ERM/);
  assert.match(css,/--erm-bottom:0px/);
  assert.match(client,/section !== 'plantas' &&/);
});
test('R36: quatro legendas de dados reais sem perspectivas no quadro inicial',()=>{
  const overview=client.slice(client.indexOf("{tab === 'tipologias' && <>"), client.indexOf("{tab === 'plantas' && <>"));
  assert.match(overview,/erm36-typesRow/);
  assert.match(overview,/erm36-typeLegend/);
  assert.match(overview,/r32PlanDetails\[key\]/);
  assert.match(overview,/types\[key\]\.area/);
  assert.match(overview,/types\[key\]\.endings/);
  assert.doesNotMatch(overview,/erm33-perspective|erm32-typeCard|r33CardAsset\[key\]|setTypeAndShow\(key\)/);
  assert.match(css,/\.erm21 \.erm36-typesRow/);
  for(const k of ['slim','premium','master','spazzio']) assert.ok(client.includes(`name: '${k[0].toUpperCase()+k.slice(1)}'`));
});
test('R36: detalhes surgem ao clicar em uma das oito unidades, com retorno funcional',()=>{
  const overview=client.slice(client.indexOf('className="erm34-planStage"'),client.indexOf('className="erm36-typesRow"'));
  assert.match(overview,/r32UnitPoints\.map/);
  assert.match(overview,/onClick=\{\(\) => \{setHoveredEnding\(null\);setHighlightedType\(type\);setSelectedType\(type\);setSelectedEnding\(p\.ending\);setPlant3D\(false\);chooseTab\('plantas'\);\}\}/);
  assert.match(client,/VOLTAR AO PAVIMENTO TIPO/);
  assert.match(client,/r32Asset\(r32PlanFile\[selectedType\]\)/);
  assert.match(client,/erm33-viewSwitch/);
});


// R38 - tipologias destacadas com selecao acessivel, origem ortogonal do Spazzio.
test('R38: selecao de tipologia ressalta as duas unidades sem abrir automaticamente a planta',()=>{
  const overview=client.slice(client.indexOf("{tab === 'tipologias' && <>"),client.indexOf("{tab === 'plantas' && <>"));
  assert.match(client,/const \[highlightedType, setHighlightedType\] = useState<TypeKey \| null>\(null\)/);
  assert.match(client,/const activeHighlightType = hoveredEnding !== null \? endingToType\[hoveredEnding\] : \(hoveredLegend \?\? highlightedType\)/);
  assert.match(overview,/aria-pressed=\{highlightedType===key\}/);
  assert.match(overview,/setHighlightedType\(prev => prev === key \? null : key\)/);
  assert.match(overview,/activeHighlightType===key\?'isTypeHighlighted'/);
  assert.match(overview,/activeHighlightType!==null&&activeHighlightType!==key\?'isTypeMuted'/);
  assert.match(css,/\.erm21 \.erm34-zone\.isTypeHighlighted\{fill-opacity:\.28/);
  assert.match(css,/\.erm21 \.erm34-zone\.isTypeMuted\{/);
});
test('R38: planta Spazzio tem imagem de cima distinta nas terminacoes 04 e 05',()=>{
  for (const n of ['04','05']) {
    const name=`erm38-spazzio-${n}-planta-baixa.webp`;
    const data=readFileSync(join(assetDir,name));
    assert.ok(data.length>80000,`${name} demasiado pequeno`);
    assert.equal(data.subarray(0,4).toString('ascii'),'RIFF');
    assert.equal(data.subarray(8,12).toString('ascii'),'WEBP');
  }
  assert.match(client,/selectedEnding === 5 \? '05' : '04'/);
  assert.match(client,/selectedPlanSource/);
  assert.match(client,/selectedType === 'spazzio' \? `Planta baixa Spazzio/);
});
test('R38: nao altera sete menus, oito marcadores, nem a descricao comercial',()=>{
  const block=client.slice(client.indexOf('const platformMenu:'),client.indexOf('function UiIcon'));
  assert.equal([...block.matchAll(/label: '/g)].length,7);
  const dots=client.slice(client.indexOf('const r32UnitPoints'),client.indexOf('const r33CardAsset'));
  assert.equal([...dots.matchAll(/ending:\d+,x:/g)].length,8);
  for(const s of ['39,19 m²','45,21 m²','47,91 m²','58,60 m²']) assert.ok(client.includes(s));
});

// R39 - mapa real, imagens enviadas e interacao no painel lateral.
test('R39/R42: 16 pontos no mapa sem distorcer a imagem',()=>{
  const block=client.slice(client.indexOf('const r39Places:'),client.indexOf('// Os nomes R31'));
  const selected=[...block.matchAll(/facilityId:(\d+),mapLabel:'([^']+)',name:'([^']+)',x:([\d.]+),y:([\d.]+)/g)];
  assert.equal(selected.length,16);
  assert.equal(new Set(selected.map(a=>a[1])).size,16);
  for(const v of selected){assert.ok(Number(v[4])>=2&&Number(v[4])<=98);assert.ok(Number(v[5])>=2&&Number(v[5])<=98)}
  assert.match(client,/erm52-implantacao-pavimentos\.png/);
  assert.match(client,/r39Places\.map/);
  assert.match(client,/aria-pressed=\{facility===point\.facilityId\}/);
  assert.match(client,/setFacility\(point\.facilityId\)/);
  assert.match(client,/erm39-photoPanel/);
  assert.match(client,/facilityImages\[r39ChosenPlace\.facilityId\]/);
  assert.match(css,/\.erm21 \.erm39-layout/);
  assert.match(css,/object-fit:contain/);
  const fs=readFileSync(join(assetDir,'erm39-implantacao-recortada.webp'));
  assert.ok(fs.length>150000);
  assert.equal(fs.subarray(0,4).toString('ascii'),'RIFF');
  assert.equal(fs.subarray(8,12).toString('ascii'),'WEBP');
});
test('R39: mantem modulos existentes, zoom e modal com fotografia de ambiente',()=>{
  assert.match(client,/masterImage === 'implantacao' \? <div className="erm39-layout"/);
  assert.match(client,/masterZoom>1/);
  assert.match(client,/facilityExpanded && <div className="erm31-imageOverlay"/);
  assert.match(client,/setFacilityExpanded\(true\)/);
  assert.match(client,/setFacilityExpanded\(false\)/);
  assert.match(client,/r32Asset\('pavimento-interativo'\)/);
});

// R40: fotografias verdadeiras do decorado, selecionadas sem fotos iguais ou plantas na aba Apartamentos.
test('R40: onze fotografias distintas do decorado substituem plantas na galeria Apartamentos', () => {
  const records=[...client.matchAll(/\{ id: '(erm40-decor-[^']+)', name: '([^']+)', category: 'apartamentos' \}/g)];
  assert.equal(records.length,11);
  assert.equal(new Set(records.map(x=>x[1])).size,11);
  assert.ok(!/\{ id: '(?:slim|premium|master|spazzio)', name: 'Planta/.test(client.slice(client.indexOf('const gallery ='),client.indexOf('const mediaList'))));
  for (const record of records) for (const suffix of ['', '-thumb']) {
    const path=join(assetDir,record[1]+suffix+'.webp');
    assert.ok(existsSync(path),'Foto do decorado ausente: '+path);
    const b=readFileSync(path);
    assert.equal(b.toString('ascii',0,4),'RIFF');
    assert.equal(b.toString('ascii',8,12),'WEBP');
  }
});
test('R40: galeria com conteudo real, fotos sem corte e lightbox preservado', () => {
  assert.match(client,/FOTOGRAFIAS REAIS DO APARTAMENTO DECORADO/);
  assert.match(client,/id\.startsWith\('erm40-decor-'\)/);
  assert.match(client,/p\.id}-thumb/);
  assert.match(client,/setOpenLightbox\(true\)/);
  assert.match(css,/\.erm21 \.erm40-decorGallery \.erm20-galleryPhoto>img\{[^}]+object-fit:contain!important/);
  assert.match(css,/\.erm21 \.erm40-decorGallery \.erm20-galleryThumbs img\{[^}]+object-fit:contain!important/);
});

// R41: imagem transparente fornecida pelo usuario; pinagem R39 inalterada; N a direita.
test('R41: mapa novo, pinos preservados e rosa dos ventos', () => {
  const filename = join(assetDir,'erm41-implantacao-limpa.webp');
  assert.ok(existsSync(filename), 'Asset R41 nao encontrado');
  const image = readFileSync(filename);
  assert.equal(image.toString('ascii',0,4),'RIFF');
  assert.equal(image.toString('ascii',8,12),'WEBP');
  assert.equal((client.match(/erm52-implantacao-pavimentos\.png/g)||[]).length,2);
  const start = client.indexOf('const r39Places:');
  const end = client.indexOf('];', start);
  assert.ok(start>0 && end>start);
  assert.equal((client.slice(start,end).match(/\{facilityId:/g)||[]).length,16);
  assert.match(client,/erm41-compass/);
  assert.match(client,/Rosa dos ventos: norte a esquerda/);
  assert.match(css,/\.erm21 \.erm39-mapCanvas\{width:min\(100%,49\.9vh,545px\);height:auto;max-width:100%;aspect-ratio:1350\/1461\}/);
  assert.match(css,/\.erm21 \.erm41-compass/);
});
// R42: numeros vindos do mapa anotado, com seis fotografias originais sem recompresao.
test('R42: seis fotos de lazer, portaria e lixeira nos pontos numerados', () => {
  const added = [
    [3,'01','Portaria',29.2,49.4,'erm42-ponto-01-portaria.jpg'],
    [7,'03','Piscina infantil',25.3,79.8,'erm42-ponto-03-piscina-infantil.jpg'],
    [8,'04','Area de lazer da piscina',27.3,85.1,'erm42-ponto-04-lazer-piscina.jpg'],
    [25,'12','Pet Place',88.6,50.9,'erm42-ponto-19-pet-place.jpg'],
    [29,'14','Playground',69.2,12.2,'erm42-ponto-21-playground.jpg'],
    [33,'15','Lixeira',26.6,2.9,'erm42-ponto-23-lixeira.jpg'],
  ];
  for (const [id,num,name,x,y,file] of added) {
    assert.ok(client.includes(`{facilityId:${id},mapLabel:'${num}',name:'${name}',x:${x},y:${y}}`),`Pino ${num} posicionado incorretamente`);
    assert.ok(client.includes(`${id}: '${file}'`),`Fotografia nao ligada ao ponto ${num}`);
    const bytes=readFileSync(join(assetDir,file));
    assert.ok(bytes.length>100000,`Imagem ${file} muito pequena`);
    assert.equal(bytes[0],255); assert.equal(bytes[1],216); assert.equal(bytes[2],255);
  }
  const previous=[
    [6,'02','Piscina adulto',26.7,68.9],[9,'05','Espaco Grill',33.7,81.2],
    [10,'06','Espaco Gourmet',39.4,78.3],[11,'07','Espaco Fitness',38.1,72.5],
    [12,'08','Easy Play / Sala Gamer',38.1,68.4],[14,'09','Espaco Beleza',38.4,64.5],
    [22,'10','Easy Wash / Lavanderia',80.8,60.5],[17,'11','Bicicletarios',83.3,75.4],
    [30,'13','Pista de Cooper',68.1,5.8],[31,'16','Recarga de veiculos eletricos',38.1,42.8],
  ];
  for(const [id,num,name,x,y] of previous) {
    assert.ok(client.includes(`{facilityId:${id},mapLabel:'${num}',name:'${name}',x:${x},y:${y}}`),`Pino anterior ${num} alterado`);
  }
  assert.match(client,/Rosa dos ventos: norte a esquerda, leste acima, sul a direita e oeste abaixo/);
  assert.ok(client.includes('<text x="12" y="84" fill="#f4d48f">N</text>'));
  assert.match(client,/const r42ChosenPhoto = r42PointPhotos\[r39ChosenPlace\.facilityId\]/);
  assert.equal((client.match(/src=\{`\$\{BRAND_ASSETS\}\$\{r42ChosenPhoto\}`\}/g)||[]).length,2);
  assert.match(css,/\/\* R42 - Rosa dos ventos sem aro/);
});
// R43: numeros apresentados na ordem 01-16 sem mudar as posicoes ou fotos.
test('R43: sequencia continua 01-16 e rosa dos ventos premium', () => {
  const start=client.indexOf('const r39Places:');
  const end=client.indexOf('];',start);
  const points=client.slice(start,end);
  const matches=[...points.matchAll(/\{facilityId:(\d+),mapLabel:'([^']+)',name:'([^']+)',x:([\d.]+),y:([\d.]+)/g)];
  assert.equal(matches.length,16);
  assert.deepEqual(matches.map(m=>m[2]),Array.from({length:16},(_,i)=>String(i+1).padStart(2,'0')));
  assert.equal(new Set(matches.map(m=>m[1])).size,16);
  assert.ok(client.includes('Rosa dos ventos: norte a esquerda, leste acima, sul a direita e oeste abaixo; acabamento premium'));
  assert.match(client,/id="erm43NorthGold"/);
  assert.match(client,/id="erm43Aqua"/);
  assert.match(css,/\/\* R43 - rosa dos ventos premium/);
  const expectedIds=[3,6,7,8,9,10,11,12,14,22,17,25,30,29,33,31];
  assert.deepEqual(matches.map(m=>Number(m[1])),expectedIds);
  for(const file of ['erm42-ponto-01-portaria.jpg','erm42-ponto-03-piscina-infantil.jpg','erm42-ponto-04-lazer-piscina.jpg','erm42-ponto-19-pet-place.jpg','erm42-ponto-21-playground.jpg','erm42-ponto-23-lixeira.jpg']){
    assert.ok(existsSync(join(assetDir,file)));
  }
});
// R44: somente a Ficha Tecnica recebe o layout premium; navegacao real das plantas preservada.
test('R44: ficha tecnica premium em azul e ciano, imagens reais, vegetacao e links funcionais', () => {
  const start = client.indexOf("{section === 'ficha' &&");
  const end = client.indexOf("{section === 'simulacao' &&", start);
  assert.ok(start > 0 && end > start, 'Secao de Ficha Tecnica nao encontrada');
  const spec = client.slice(start,end);
  for (const marker of ['erm44-spec','erm44-sheet','erm44-heroVisual','erm44-overview','erm44-typeGrid','erm44-typeCard','erm44-cardAction','erm44-foliagePanel','erm44-foliageCorner']) assert.ok(spec.includes(marker), `Layout R44 ausente: ${marker}`);
  for (const name of ['erm44-fachada-bloco.webp','erm44-folhagem-painel.webp','erm44-folhagem-canto.webp']) {
    assert.ok(spec.includes(name), `Asset nao referenciado: ${name}`);
    const path = join(assetDir,name);
    assert.ok(existsSync(path), `Asset ausente: ${name}`);
    const bytes=readFileSync(path);
    assert.ok(bytes.length>3000,`Asset incompleto: ${name}`);
    assert.equal(bytes.toString('ascii',0,4),'RIFF');
    assert.equal(bytes.toString('ascii',8,12),'WEBP');
  }
  assert.match(spec,/typeKeys\.map\(\(k\)=>/);
  assert.match(spec,/goto\('plantas','plantas'\);setTypeAndShow\(k\)/);
  assert.match(spec,/types\[k\]\.name/);
  assert.match(spec,/types\[k\]\.area/);
  assert.match(spec,/types\[k\]\.rooms/);
  assert.match(spec,/types\[k\]\.parking/);
  assert.match(spec,/types\[k\]\.endings/);
  assert.match(spec,/208/);
  assert.match(spec,/04/);
  assert.match(spec,/FICHA TÉCNICA/);
  assert.match(css,/\/\* R44 - ficha tecnica premium, azul-marinho e ciano/);
  assert.match(css,/\.erm21 \.erm44-hero/);
  assert.match(css,/\.erm21 \.erm44-cardAction:focus-visible/);
  assert.match(css,/@media\(max-width:560px\).*?\.erm44-typeGrid\{grid-template-columns:1fr/s);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\).*?\.erm44-typeCard/s);
});
// R45: correcao fina para aproximar a Ficha Tecnica do mockup aprovado, sem mudar a navegacao.
test('R45: ficha tecnica ajusta enquadramento, folhagens e proporcao premium dos cards', () => {
  assert.ok(css.includes('/* R45 - correcao fina da ficha tecnica premium para aproximar da referencia aprovada. */'), 'CSS R45 ausente');
  for (const marker of [
    '.erm21 .erm44-hero{grid-template-columns:minmax(0,1.11fr) minmax(0,.89fr);height:clamp(305px,38vh,410px);border-radius:20px}',
    '.erm21 .erm44-heroVisual img{object-position:52% 58%;filter:saturate(1.055) contrast(1.015)}',
    '.erm21 .erm44-foliagePanel{right:-4px;bottom:-12px;width:clamp(185px,24vw,335px);opacity:.9;filter:blur(2.2px)}',
    '.erm21 .erm44-typeCard{min-height:290px;padding:clamp(18px,1.65vw,26px);border-radius:18px}',
    '.erm21 .erm44-foliageCorner{right:-14px;bottom:-42px;width:clamp(240px,34vw,480px);opacity:.88;filter:blur(1.25px)}'
  ]) {
    assert.ok(css.includes(marker), `Marcador CSS R45 ausente: ${marker}`);
  }
});
// R46: corrige o recorte da fachada e impede corte do titulo e das tres metricas.
test('R46: fachada integral com laterais harmonizadas e altura guiada pelo conteudo', () => {
  const r46 = css.slice(css.indexOf('/* R46 - Ficha Tecnica:'));
  assert.ok(r46.startsWith('/* R46 - Ficha Tecnica:'), 'CSS de correcao R46 nao encontrado');
  assert.match(r46,/\.erm21 \.erm44-hero\{[^}]*height:auto;[^}]*min-height:350px;/);
  assert.match(r46,/\.erm21 \.erm44-heroVisual::before\{[^}]*background-image:url\('\/experiencia\/easy-rota-do-mar\/erm44-fachada-bloco\.webp'\)/);
  assert.match(r46,/\.erm21 \.erm44-heroVisual img\{[^}]*object-fit:contain;[^}]*object-position:center center;/);
  assert.match(r46,/\.erm21 \.erm44-overview\{[^}]*height:auto;[^}]*overflow:hidden;/);
});

test('R46: folhagens permanecem visiveis e os dados dos quatro cards nao mudam', () => {
  const r46 = css.slice(css.indexOf('/* R46 - Ficha Tecnica:'));
  assert.match(r46,/\.erm21 \.erm44-foliagePanel\{[^}]*opacity:\.86;/);
  assert.match(r46,/\.erm21 \.erm44-foliageCorner\{[^}]*bottom:-2px;[^}]*opacity:\.8;/);
  const start = client.indexOf("{section === 'ficha' &&");
  const end = client.indexOf("{section === 'simulacao' &&", start);
  const ficha = client.slice(start,end);
  assert.match(ficha,/goto\('plantas','plantas'\);setTypeAndShow\(k\)/);
  assert.match(ficha,/erm44-fachada-bloco\.webp/);
  for (const label of ["'Slim'", "'Premium'", "'Master'", "'Spazzio'"]) assert.ok(client.includes(label));
});

test('R46: layouts responsivos mantem altura fluida, sem esconder o painel informativo', () => {
  const r46 = css.slice(css.indexOf('/* R46 - Ficha Tecnica:'));
  assert.match(r46,/@media\(min-width:901px\) and \(max-width:1450px\)/);
  assert.match(r46,/@media\(max-width:900px\)/);
  assert.match(r46,/@media\(max-width:560px\)/);
  assert.doesNotMatch(r46,/\.erm21 \.erm44-hero\{[^}]*height:clamp\(/);
  assert.match(r46,/\.erm21 \.erm44-typeGrid\{[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
});
// R47: acabamento final para alinhar as folhagens com os limites corretos da composicao.
test('R47: ficha tecnica alinha folhagens ao limite do painel e da secao', () => {
  assert.ok(css.includes('/* R47 - acabamento final da ficha tecnica: reposicionar folhagens e alinhar com os limites da estrutura. */'), 'CSS R47 ausente');
  const start = client.indexOf("{section === 'ficha' &&");
  const end = client.indexOf("{section === 'simulacao' &&", start);
  const spec = client.slice(start,end);
  assert.ok(spec.replace(/\r\n/g, '\n').includes('            </div>\n            <img className="erm44-foliageCorner"'), 'Folhagem inferior nao foi movida para fora do painel interno');
  assert.ok(spec.includes("goto('plantas','plantas');setTypeAndShow(k);"), 'Navegacao das plantas deve permanecer');
  for (const marker of [
    '.erm21 .erm44-overview{overflow:hidden}',
    '.erm21 .erm44-foliagePanel{right:0;bottom:0;width:clamp(168px,20vw,290px);max-width:50%;opacity:.88;filter:blur(1.8px)}',
    '.erm21 .erm44-sheet{overflow:hidden}',
    '.erm21 .erm44-spec>.erm44-foliageCorner{position:absolute;right:0;bottom:0;width:clamp(250px,27vw,405px);height:auto;z-index:4;opacity:.86;filter:blur(1.15px);pointer-events:none;user-select:none;mask-image:linear-gradient(to bottom,transparent 0%,#000 48%);-webkit-mask-image:linear-gradient(to bottom,transparent 0%,#000 48%)}'
  ]) {
    assert.ok(css.includes(marker), `Marcador CSS R47 ausente: ${marker}`);
  }
});
// R48: ajuste final para aproximar a folhagem superior da borda direita do painel, mantendo o restante da ficha.
test('R48: ficha tecnica aproxima a folhagem superior da borda direita do painel', () => {
  assert.ok(css.includes('/* R48 - ajuste final: aproximar a folhagem superior da borda direita do painel. */'), 'CSS R48 ausente');
  for (const marker of [
    '.erm21 .erm44-foliagePanel{right:-12px;bottom:0;width:clamp(170px,21vw,304px);opacity:.86;filter:blur(1.85px);transform:none}',
    '@media(max-width:900px){.erm21 .erm44-foliagePanel{right:-8px;bottom:0;width:198px;opacity:.82}}',
    '@media(max-width:560px){.erm21 .erm44-foliagePanel{right:-10px;bottom:-2px;width:156px;opacity:.72}}'
  ]) {
    assert.ok(css.includes(marker), `Marcador CSS R48 ausente: ${marker}`);
  }
});

// R49: tela de implantacao ampliada sem alterar o asset original nem o mapeamento de pinos.
test('R49: remove barras redundantes apenas do masterplan e preserva navegacao principal', () => {
  assert.match(client, /section !== 'plantas' && section !== 'lazer'/);
  assert.match(css, /\.erm21 \.erm20-leisure>\.erm20-sectionBanner\{display:none\}/);
  assert.match(css, /\.erm21 \.erm20-leisure \.erm31-planModeButtons\{display:none\}/);
  assert.match(css, /\.erm21 \.erm20-leisure>\.erm32-masterMoved\{display:none\}/);
  assert.match(client, /section === 'plantas' &&/);
});
test('R49: imagem oficial inteira ampliada e 16 pinos sem mudar suas coordenadas', () => {
  assert.match(css, /\.erm21 \.erm20-leisure \.erm39-mapCanvas\{width:min\(100%,75svh,710px\)/);
  assert.match(css, /\.erm21 \.erm20-leisure\{height:100%;min-height:0;overflow:hidden/);
  assert.match(client, /erm52-implantacao-pavimentos\.png/);
  const start = client.indexOf('const r39Places:');
  const end = client.indexOf('];', start);
  const spots = [...client.slice(start, end).matchAll(/\{facilityId:\d+,mapLabel:'\d+',name:'[^']+',x:[\d.]+,y:[\d.]+\}/g)];
  assert.equal(spots.length, 16);
  assert.match(client, /style=\{\{left:`\$\{point.x\}%`,top:`\$\{point.y\}%`\}\}/);
});
test('R49: rosa deslocada ao canto esquerdo e inclinada conforme referencia do book', () => {
  assert.match(css, /\.erm21 \.erm20-leisure \.erm41-compass\{left:8px;right:auto/);
  assert.match(css, /\.erm21 \.erm20-leisure \.erm41-compass>svg\{transform:rotate\(14deg\)/);
  assert.match(css, /\.erm21 \.erm20-leisure \.erm41-compass svg text\{transform:rotate\(-14deg\)/);
  for (const c of ['N','L','S','O']) assert.ok(client.includes(`>${c}</text>`));
});

// R49 R2: institucional conforme mockup aprovado, com logo PNG ORIGINAL e foto oficial intacta.
test('R49 R2: institucional premium usa marca Rocha original e fotografia oficial', () => {
  const start = client.indexOf("{section === 'institucional' &&");
  const end = client.indexOf("\n        </div>", start);
  const fragment = client.slice(start,end);
  assert.ok(start > 0 && end > start, 'Institucional nao encontrado');
  for (const marker of ['erm50-institutional','erm50-stage','erm50-photoFrame','erm50-facade','erm50-brandLogo','erm50-fachada-oficial.jpg','erm50-rocha-logo-original.png']) assert.ok(fragment.includes(marker), `Falta elemento institucional ${marker}`);
  assert.match(fragment,/href="https:\/\/meurocha\.com\.br\/rocha"/);
  assert.ok(!fragment.includes('DESDE 2009'), 'Ano antigo nao pode aparecer');
  assert.ok(fragment.includes('DESDE 2010'), 'Fundacao institucional conforme site oficial');
  for(const name of ['erm50-fachada-oficial.jpg','erm50-rocha-logo-original.png']) {
    const file = readFileSync(join(assetDir,name));
    assert.ok(file.length > 15000, 'Asset incompleto: ' + name);
    if(name.endsWith('.png')) assert.equal(file.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    else { assert.equal(file[0],255);assert.equal(file[1],216);assert.equal(file[2],255); }
  }
  assert.match(css,/\/\* R49 R2 - INSTITUCIONAL PREMIUM APROVADO/);
});

test('R49 R2: missao visao e valores oficiais e acessibilidade', () => {
  const fragment = client.slice(client.indexOf("{section === 'institucional' &&"), client.indexOf("\n        </div>",client.indexOf("{section === 'institucional' &&")));
  for(const s of ['Construímos histórias.','Entregamos novos começos.','Construir com qualidade e entregar experiências além do comum.','VISÃO','MISSÃO','VALORES','ISO 9001:2015','PBQP-H','Satisfação do time','Viva além do comum.']) assert.ok(fragment.toLocaleLowerCase('pt-BR').includes(s.toLocaleLowerCase('pt-BR')), 'Texto institucional ausente: '+s);
  assert.match(fragment,/aria-labelledby="erm50-title"/);
  assert.match(fragment,/alt="Logomarca original da Rocha Empreendimentos"/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.erm21 \.erm50-photoFrame/);
});

// ROCHA R50 R1: perspectiva calculada sobre o canvas inteiro, sem desacoplar os 16 pinos.
test('R50: masterplan aplica profundidade sem substituir o original nem deslocar os pinos', () => {
  const first = client.indexOf("{section === 'lazer' &&");
  const last = client.indexOf("{section === 'plantas' &&", first);
  const master = client.slice(first,last);
  assert.ok(first >= 0 && last > first,'Masterplan nao localizado');
  assert.ok(master.includes('erm52-implantacao-pavimentos.png'), 'Implantacao original nao foi preservada');
  assert.ok(master.includes('r39Places.map'), 'Pinos interativos foram removidos');
  assert.ok(master.includes('perspective(1400px) rotateX(var(--erm50-map-tilt, 9deg)) rotateZ(var(--erm50-map-roll, -0.8deg))'), 'Transform de profundidade nao encontrado');
  assert.ok(master.includes('left:`${point.x}%`,top:`${point.y}%`'), 'Coordenadas de pinos modificadas');
  assert.ok(css.includes('ROCHA R50 R1 — MASTERPLAN'), 'CSS R50 ausente');
  assert.ok(css.includes('--erm50-map-tilt:9deg'), 'Profundidade desktop ausente');
  assert.ok(css.includes('--erm50-map-tilt:0deg'), 'Retorno plano no mobile ausente');
});

// ROCHA R50 R1: refinamento institucional sobre as duas artes ORIGINAIS sem regeneracao.
test('R50: institucional reforca fachada oficial em perspectiva e preserva marca original', () => {
  const first = client.indexOf("{section === 'institucional' &&");
  const fragment = client.slice(first);
  assert.ok(first >= 0,'Institucional nao localizado');
  assert.ok(fragment.includes('erm50-fachada-oficial.jpg'),'Fachada original ausente');
  assert.ok(fragment.includes('erm50-rocha-logo-original.png'),'Logo original ausente');
  assert.ok(css.includes('ROCHA R50 R1 — INSTITUCIONAL'),'Refinamento institucional R50 ausente');
  assert.ok(css.includes('width:calc(100% + 55px)'), 'Fachada nao avanca no layout');
  assert.ok(css.includes('rotateY(-6.5deg)'), 'Perspectiva institucional nao encontrada');
  assert.ok(css.includes('@media(prefers-reduced-motion:reduce)'), 'Respeito a reducao de movimento ausente');
});

// R51: correcoes do layout aprovado sem alterar implantacao, marca ou fachada.
test('R51: institucional impede sobreposicao da fachada e elimina overflow horizontal', () => {
  assert.ok(css.includes('/* R51 R1 — ACABAMENTO FINAL FIEL AOS MOCKUPS APROVADOS.'), 'Bloco de correcoes R51 nao encontrado');
  assert.match(css, /\.erm21 \.erm50-stage \{[\s\S]*?grid-template-columns:minmax\(0,43%\) minmax\(0,57%\)/);
  assert.match(css, /\.erm21 \.erm50-visual \{[\s\S]*?overflow:hidden/);
  assert.match(css, /\.erm21 \.erm50-photoFrame \{[\s\S]*?width:100%;[\s\S]*?max-width:100%;[\s\S]*?transform:none/);
  assert.match(css, /\.erm21 \.erm50-story \{[\s\S]*?min-width:0;[\s\S]*?overflow-x:hidden/);
  assert.match(css, /\.erm21 \.erm50-visual:hover \.erm50-photoFrame \{[\s\S]*?transform:none/);
  assert.match(css, /\.erm21 \.erm50-story::after \{[\s\S]*?right:0;[\s\S]*?bottom:0;/);
});

test('R51: masterplan e institucional preservam fontes oficiais e interacoes', () => {
  const start = client.indexOf('<div className="erm39-mapCanvas"');
  const end = client.indexOf('</div>', start);
  const map = client.slice(start, end);
  assert.ok(map.includes('erm52-implantacao-pavimentos.png'), 'Imagem oficial da implantacao precisa permanecer');
  assert.ok(map.includes('r39Places.map'), 'Pinos interativos precisam permanecer no mesmo mapa');
  assert.match(css, /\.erm21 \.erm20-leisure \.erm39-photoOpen img \{[\s\S]*?height:clamp\(250px,35vh,370px\)/);
  assert.ok(client.includes('erm50-rocha-logo-original.png'), 'Logo original Rocha ausente');
  assert.ok(client.includes('erm50-fachada-oficial.jpg'), 'Fachada original ausente');
  assert.ok(client.includes('erm41-compass'), 'Rosa dos ventos deve permanecer');
});

// R52: implantacao do arquivo ORIGINAL do cliente, com os mesmos 16 pinos.
test('R52: implantacao original com interiores, imagem fiel e 16 pinos intactos', () => {
  const assetName='erm52-implantacao-pavimentos.png';
  const asset=readFileSync(join(assetDir,assetName));
  assert.equal(asset.subarray(0,8).toString('hex'),'89504e470d0a1a0a','Assinatura PNG incorreta');
  assert.equal(asset.readUInt32BE(16),1350,'Largura util nao corresponde ao arquivo original');
  assert.equal(asset.readUInt32BE(20),1461,'Altura util nao corresponde ao arquivo original');
  assert.equal(createHash('sha256').update(asset).digest('hex'),'e7a27ee6882fcc0f3cd6c918537b507eafc03a9b0be3a3e51192ef9d1d817b12');
  const start=client.indexOf('<div className="erm39-mapCanvas"');
  const end=client.indexOf('</div>',start);
  const map=client.slice(start,end);
  assert.ok(map.includes(assetName),'A imagem nova nao esta no mapa interativo');
  assert.ok(map.includes('r39Places.map'),'Os pinos foram removidos do mapa');
  const list=client.slice(client.indexOf('const r39Places:'),client.indexOf('// Os nomes R31'));
  assert.equal((list.match(/\{facilityId:/g)||[]).length,16,'A quantidade de pinos mudou');
  assert.equal((client.match(/erm52-implantacao-pavimentos\.png/g)||[]).length,2,'Preview e mapa devem mostrar a mesma implantacao');
  assert.match(css,/\/\* R52 R1 — FIDELIDADE AO MATERIAL APROVADO/);
  assert.match(css,/--erm50-map-tilt:0deg;/);
  assert.match(css,/--erm50-map-roll:0deg;/);
  assert.match(css,/\.erm21 \.erm20-leisure \.erm39-mapCanvas>img\s*\{\s*filter:none/);
  assert.match(client,/erm41-compass/);
});

test('R52: institucional premium preserva marca e fachada e evita texto encoberto', () => {
  assert.ok(client.includes('erm50-fachada-oficial.jpg'));
  assert.ok(client.includes('erm50-rocha-logo-original.png'));
  assert.match(css,/\.erm21 \.erm50-stage\s*\{[\s\S]*?grid-template-columns:minmax\(0,43%\) minmax\(0,57%\)/);
  assert.match(css,/\.erm21 \.erm50-visual\s*\{[\s\S]*?mask-image:linear-gradient/);
  assert.match(css,/\.erm21 \.erm50-story\s*\{[\s\S]*?justify-content:flex-start/);
  assert.match(css,/\.erm21 \.erm50-photoFrame,[\s\S]*?\.erm21 \.erm50-visual:hover \.erm50-photoFrame \{[\s\S]*?width:100%;[\s\S]*?transform:none/);
  assert.match(css,/\.erm21 \.erm50-story h1\s*\{/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/\.erm21 \.erm20-leisure \.erm39-photoOpen img\s*\{[\s\S]*?max-height:none/);
});

// ROCHA R53 R1: a imagem aprovada entra somente na area visual, nunca como screenshot da pagina inteira.
test('R53: aspecto aprovado e usado apenas na fachada com conteudo HTML preservado', () => {
  const name = 'erm53-fachada-conceito-aprovado.jpg';
  const asset = readFileSync(join(assetDir,name));
  assert.equal(createHash('sha256').update(asset).digest('hex'),'4fa61e5fe57c470f17a265422efee900129c8023918f60ce238dba82974357ba');
  assert.equal(asset.subarray(0,2).toString('hex'),'ffd8','Arquivo da perspectiva deve ser JPEG');
  assert.ok(css.includes('ROCHA R53 R1 - INSTITUCIONAL FIEL A ARTE ESTATICA APROVADA'));
  const r53 = css.slice(css.indexOf('/* ROCHA R53 R1'));
  assert.ok(r53.includes("background-image:url('/experiencia/easy-rota-do-mar/"+name+"')"));
  assert.match(r53,/\.erm21 \.erm50-photoFrame > \.erm50-facade \{[\s\S]*?opacity:0!important/);
  assert.match(r53,/@media\(max-width:680px\)/);
  assert.match(r53,/@media\(prefers-reduced-motion:reduce\)/);
  const institutional = client.slice(client.indexOf("{section === 'institucional' &&"));
  for(const text of ['Construímos histórias.','Entregamos novos começos.','MISSÃO','VISÃO','VALORES','2010','ISO 9001:2015','PBQP-H','CONHEÇA A ROCHA']) {
    assert.ok(institutional.includes(text),'Conteudo editavel/informativo ausente: '+text);
  }
  assert.ok(institutional.includes('erm50-rocha-logo-original.png'));
  assert.ok(institutional.includes('erm50-fachada-oficial.jpg'));
  assert.ok(institutional.includes('erm50-footer'));
});

// ROCHA R54: ultima arte aprovada sem legenda; icones premium permanecem SVG reais.
test('R54: iconografia premium e botao Conheca a Rocha editaveis; legenda retirada', () => {
  const institutional=client.slice(client.indexOf("{section === 'institucional' &&"));
  assert.ok(!institutional.includes('erm50-photoCaption'), 'Legenda HTML da fachada deve sair da tela');
  assert.ok(!institutional.includes('EASY ROTA DO MAR · PERSPECTIVA ILUSTRATIVA'), 'Texto da legenda nao pode reaparecer');
  assert.equal((institutional.match(/erm54-cardIcon/g)||[]).length,3, 'Missao/visao/valores exigem 3 icones SVG premium');
  assert.equal((institutional.match(/erm54-qualityIcon/g)||[]).length,3, 'Fundacao e selos exigem 3 icones SVG premium');
  assert.ok(institutional.includes('erm54-ctaLabel'), 'CTA da Rocha precisa ser HTML editavel');
  assert.ok(institutional.includes('erm54-ctaArrow'), 'CTA deve manter seta vetorial');
  assert.ok(institutional.includes('href="https://meurocha.com.br/rocha"'), 'Link externo oficial da Rocha deve continuar funcional');
  assert.ok(institutional.includes('erm50-rocha-logo-original.png'), 'Marca oficial Rocha intacta');
  assert.ok(institutional.includes('erm50-fachada-oficial.jpg'), 'Foto oficial preservada para telas pequenas');
  assert.match(css,/ROCHA R54 R1 - ACABAMENTO PREMIUM DO INSTITUCIONAL APROVADO/);
  assert.match(css,/erm54-fachada-conceito-sem-legenda\.jpg/);
  assert.match(css,/\.erm21 \.erm50-photoCaption \{display:none!important\}/);
  assert.match(css,/\.erm21 \.erm50-footer a:focus-visible/);
  assert.match(css,/@media\(max-width:680px\)/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  const asset=readFileSync(join(assetDir,'erm54-fachada-conceito-sem-legenda.jpg'));
  assert.equal(asset.subarray(0,2).toString('hex'),'ffd8');
  assert.equal(createHash('sha256').update(asset).digest('hex'),'c4475ff94944193ca366c7391a3b79874ee359b620f32e4348902d90d0c388ff');
});
