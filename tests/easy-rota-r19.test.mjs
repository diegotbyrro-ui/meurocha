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
test('R32: planta 3D Spazzio identificada sem alegar que existe 2D individual',()=>{
  assert.match(client,/planta-spazzio-book-3d/);
  assert.match(client,/planta 2D individual ainda não fornecida/);
  assert.match(client,/Perspectiva 3D oficial do book/);
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
  assert.ok(client.includes('erm33-perspectiva-spazzio-book.webp'));
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
  assert.match(client,/plant3D \? r33CardAsset\[selectedType\] : r32Asset\(r32PlanFile\[selectedType\]\)/);
  assert.match(client,/aria-pressed=\{plant3D\}/);
  assert.match(css,/\.erm21 \.erm33-viewSwitch button\.active/);
});
test('R33 R2: todas as associações de tipologia e fonte oficial preservadas',()=>{
  const names=['PlantaTipo1_EasyRMTEXTOS','PlantaTipo2_EasyRMTEXTOS','PlantaTipo3_EasyRM'];
  for (const n of ['Slim','Premium','Master','Spazzio']) assert.ok(client.includes(n));
  for (const k of ['slim','premium','master']) {
    assert.match(client,new RegExp(`erm33r2-${k}-oficial-perspectiva\\.webp`));
  }
  assert.ok(client.includes('planta-spazzio-book-3d'));
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
  assert.match(client,/setHoveredEnding\(null\);setSelectedType\(type\);setSelectedEnding\(p\.ending\)/);
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
  assert.match(overview,/onClick=\{\(\) => \{setHoveredEnding\(null\);setSelectedType\(type\);setSelectedEnding\(p\.ending\);setPlant3D\(false\);chooseTab\('plantas'\);\}\}/);
  assert.match(client,/VOLTAR AO PAVIMENTO TIPO/);
  assert.match(client,/r32Asset\(r32PlanFile\[selectedType\]\)/);
  assert.match(client,/erm33-viewSwitch/);
});
