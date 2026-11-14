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
  for (const s of ['erm20-sidebar','erm20-sideNav','erm20-panel','erm20-bottomTabs','platformMenu.map','globalTabs.map','openLightbox','toggleMusic']) assert.ok(client.includes(s),s);
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
  assert.match(client, /<span>VIVA ALÉM DO COMUM<\/span><span>AMBIENTE DE HOMOLOGAÇÃO<\/span>/);
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
test('R27: neon animado acompanha a curva vetorial sem invadir o menu', () => {
  const splash = client.slice(client.indexOf('{!started &&'), client.indexOf('{started &&'));
  assert.match(splash,/className="erm23-waveTop erm27-neonLine"/);
  assert.match(splash,/className="erm27-neonBase"/);
  assert.match(splash,/className="erm27-neonRunner"/);
  assert.match(css,/stroke-dasharray:66 934/);
  assert.match(css,/@keyframes erm27-neonTravel/);
  assert.match(css,/-1000/);
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
test('R28: neon extremamente sutil com traco fino, brilho contido e passagem lenta', () => {
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
