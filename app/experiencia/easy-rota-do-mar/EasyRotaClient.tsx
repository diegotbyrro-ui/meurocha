'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ChangeEvent, type PointerEvent } from 'react';

type Section = 'localizacao' | 'lazer' | 'plantas' | 'imagens' | 'videos' | 'ficha' | 'institucional' | 'simulacao';
type TypeKey = 'slim' | 'premium' | 'master' | 'spazzio';
type Look = 'diurna' | 'entardecer' | 'noturna';
type Group = 'todos' | 'acessos' | 'lazer' | 'conveniencia' | 'estrutura';

type Facility = { number: number; name: string; category: Exclude<Group, 'todos'>; image?: string };
const media = (id: string) => `/api/experiencia/easy-rota-do-mar/media/${id}`;
const official = 'https://meurocha.com.br/imoveis/easy-rota-do-mar';
const palette = { dark: '#003D66', deep: '#00213D', accent: '#00DAF4', light: '#EDF9FF' };
const BRAND_ASSETS = '/experiencia/easy-rota-do-mar/';
const sections: { id: Section; label: string; glyph: string }[] = [
  { id: 'localizacao', label: 'Localização', glyph: '⌖' },
  { id: 'lazer', label: 'Lazer', glyph: '▦' },
  { id: 'plantas', label: 'Plantas', glyph: '▧' },
  { id: 'imagens', label: 'Imagens', glyph: '▣' },
  { id: 'videos', label: 'Vídeos', glyph: '▤' },
  { id: 'ficha', label: 'Ficha Técnica', glyph: '▤' },
  { id: 'institucional', label: 'Institucional', glyph: '♙' },
];
const centralMenuIcons: Record<Section, string> = {
  localizacao: 'pin', lazer: 'waves', plantas: 'floor', imagens: 'image',
  videos: 'play', ficha: 'file', institucional: 'building', simulacao: 'calculator',
};
const centralMenuTabs: Partial<Record<Section, string>> = {
  localizacao: 'ultratour', lazer: 'implantacao', plantas: 'tipologias',
  imagens: 'apartamentos', videos: 'perspectivas', ficha: 'ficha', institucional: 'historia',
};
// R36: menu lateral com as mesmas sete entradas da referencia Park Plaza.
// Os conteudos anteriores sao preservados e acessados pelas secoes correspondentes.
type MenuKey = 'localizacao' | 'lazer' | 'plantas' | 'imagens' | 'videos' | 'ficha' | 'institucional';
const platformMenu: { id: MenuKey; label: string; icon: string; section: Section; sub: string }[] = [
  { id: 'localizacao', label: 'Localização', icon: 'pin', section: 'localizacao', sub: 'ultratour' },
  { id: 'lazer', label: 'Lazer', icon: 'waves', section: 'lazer', sub: 'implantacao' },
  { id: 'plantas', label: 'Plantas', icon: 'floor', section: 'plantas', sub: 'tipologias' },
  { id: 'imagens', label: 'Imagens', icon: 'image', section: 'imagens', sub: 'apartamentos' },
  { id: 'videos', label: 'Vídeos', icon: 'play', section: 'videos', sub: 'perspectivas' },
  { id: 'ficha', label: 'Ficha Técnica', icon: 'file', section: 'ficha', sub: 'ficha' },
  { id: 'institucional', label: 'Institucional', icon: 'building', section: 'institucional', sub: 'historia' },
];
function UiIcon({ name, size = 20 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const };
  if (name === 'home') return <svg {...common}><path d="m3 10 9-7 9 7v10h-6v-6H9v6H3z"/></svg>;
  if (name === 'pin') return <svg {...common}><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>;
  if (name === 'building') return <svg {...common}><path d="M4 21V6l8-3v18M12 9h8v12M2 21h20M7 9h2m-2 4h2m-2 4h2m6-4h2m-2 4h2"/></svg>;
  if (name === 'layers') return <svg {...common}><path d="m12 2 9 5-9 5-9-5 9-5Zm-9 10 9 5 9-5M3 17l9 5 9-5"/></svg>;
  if (name === 'floor') return <svg {...common}><rect x="2" y="2" width="20" height="20" rx="1"/><path d="M10 2v9h12M2 12h8v10M10 17h7m0-6v11"/></svg>;
  if (name === 'image') return <svg {...common}><rect x="2" y="3" width="20" height="18" rx="2"/><circle cx="8" cy="9" r="2"/><path d="m3 19 6-6 4 4 3-3 6 5"/></svg>;
  if (name === 'play') return <svg {...common}><circle cx="12" cy="12" r="10"/><path d="m10 7 7 5-7 5z"/></svg>;
  if (name === 'star') return <svg {...common}><path d="m12 2 3.1 6.3 7 1-5 4.8 1.2 7-6.3-3.3-6.3 3.3 1.2-7-5-4.8 7-1z"/></svg>;
  if (name === 'music') return <svg {...common}><path d="M8 18V5l12-3v13"/><circle cx="5" cy="18" r="3"/><circle cx="17" cy="15" r="3"/></svg>;
  if (name === 'mute') return <svg {...common}><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="m16 9 5 6m0-6-5 6"/></svg>;
  if (name === 'waves') return <svg {...common}><path d="M2 8c3-3 5 3 8 0s5 3 8 0 3 0 4-1M2 14c3-3 5 3 8 0s5 3 8 0 3 0 4-1M2 20c3-3 5 3 8 0s5 3 8 0 3 0 4-1"/></svg>;
  if (name === 'shield') return <svg {...common}><path d="m12 22 1-.4C19 19 21 15 21 9V5L12 2 3 5v4c0 6 2 10 8 12.6z"/><path d="m8 12 3 3 5-6"/></svg>;
  if (name === 'sparkle') return <svg {...common}><path d="m12 2 2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z"/></svg>;
  if (name === 'arrow') return <svg {...common}><path d="M4 12h16m-6-6 6 6-6 6"/></svg>;
  if (name === 'calculator') return <svg {...common}><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h2m4 0h2m-8 4h2m4 0h2m-8 4h8"/></svg>;
  if (name === 'file') return <svg {...common}><path d="M6 2h9l4 4v16H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M14 2v5h5M8 12h8M8 16h8"/></svg>;
  if (name === 'key') return <svg {...common}><circle cx="8" cy="15" r="4"/><path d="M11.3 12.3 21 3v5l-3 2-2-1-3 3"/></svg>;
  if (name === 'bed') return <svg {...common}><path d="M3 19V7m18 12V7M3 16h18M5 12V6h14v6M7 12V9h4v3m2 0V9h4v3"/></svg>;
  if (name === 'car') return <svg {...common}><path d="m5 11 2-6h10l2 6M4 11h16a2 2 0 0 1 2 2v5H2v-5a2 2 0 0 1 2-2Zm1 7v2h3v-2m8 0v2h3v-2M6 14h2m8 0h2"/></svg>;
  if (name === 'calendar') return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6m10-6v6M3 10h18m-13 4h3m-3 3h3"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
}
const subtabs: Record<Section, { id: string; label: string }[]> = {
  localizacao: [{ id: 'ultratour', label: 'Ultratour' }, { id: 'entorno', label: 'Entorno' }, { id: 'rotas', label: 'Rotas' }, { id: 'mapa', label: 'Mapa' }],
  lazer: [{ id: 'implantacao', label: 'Masterplan' }, { id: 'espacos', label: 'Ambientes' }],
  plantas: [{ id: 'tipologias', label: 'Tipologias' }, { id: 'plantas', label: 'Plantas' }],
  imagens: [{ id: 'apartamentos', label: 'Apartamentos' }, { id: 'areas', label: 'Áreas comuns' }, { id: 'lazer', label: 'Lazer' }],
  videos: [{ id: 'perspectivas', label: 'Perspectivas animadas' }, { id: 'empreendimento', label: 'Empreendimento' }, { id: 'shorts', label: 'Short vídeos' }],
  ficha: [{ id: 'ficha', label: 'Ficha técnica' }],
  institucional: [{ id: 'historia', label: 'Nossa história' }],
  simulacao: [{ id: 'simulacao', label: 'Simulação' }],
};
const types: Record<TypeKey, { name: string; area: string; rooms: string; description: string; parking: string; image: string; endings: number[] }> = {
  slim: { name: 'Slim', area: '39,19 m²', rooms: '2 quartos', description: 'Ambientes funcionais para uma rotina prática.', parking: '1 vaga', image: 'slim', endings: [1, 8] },
  premium: { name: 'Premium', area: '45,21 m²', rooms: '2 quartos com suíte', description: 'Conforto e praticidade em uma planta inteligente.', parking: '1 vaga', image: 'premium', endings: [2, 3] },
  master: { name: 'Master', area: '47,91 m²', rooms: '2 quartos com suíte master', description: 'Mais espaço e privacidade no dia a dia.', parking: '1 vaga', image: 'master', endings: [6, 7] },
  spazzio: { name: 'Spazzio', area: '58,60 m²', rooms: '3 quartos', description: '3 quartos, 2 suítes e varanda, conforme o book oficial.', parking: '2 vagas', image: 'spazzio', endings: [4, 5] },
};
const typeKeys: TypeKey[] = ['slim', 'premium', 'master', 'spazzio'];
// R32: apartamentos do pavimento tipo, conforme etiquetas do TIFF original e quadro
// de tipologias/terminacoes do book (paginas 13 e 14). Pontos de toque sao aproximados
// sobre os identificadores visuais; nao indicam disponibilidade comercial.
const r32UnitPoints: { ending: number; x: number; y: number }[] = [
  {ending:8,x:15.1,y:43.9},{ending:7,x:31.0,y:44.0},
  {ending:6,x:66.9,y:44.0},{ending:5,x:82.0,y:43.9},
  {ending:1,x:15.1,y:59.0},{ending:2,x:31.0,y:59.0},
  {ending:3,x:66.9,y:59.0},{ending:4,x:82.0,y:59.0},
];
// R33 R2: perspectivas projetadas sem inventar plantas, baseadas nos arquivos TIFF oficiais.
// Nao sao maquetes 3D de projeto executivo. As plantas originais permanecem acessiveis.
const r33CardAsset: Record<TypeKey,string> = {
  slim: `${BRAND_ASSETS}erm33r2-slim-oficial-perspectiva.webp`,
  premium: `${BRAND_ASSETS}erm33r2-premium-oficial-perspectiva.webp`,
  master: `${BRAND_ASSETS}erm33r2-master-oficial-perspectiva.webp`,
  spazzio: `${BRAND_ASSETS}erm38-spazzio-04-planta-baixa.webp`,
};
// R35: mascaras precisas por unidade, traçadas sobre o pavimento TIFF sem textos.
// As salas de circulacao, escada e elevadores NAO recebem cor. Em cada extremidade
// a divisao usa o contorno real: quartos avancam alem do corredor central.
// Geometria ilustrativa sobre o quadro original 2500 x 957, nao delimita area privativa legal.
const r32Asset = (name: string) => `${BRAND_ASSETS}erm32-${name}.webp`;
const r35Zones: {ending:number; points:string}[] = [
  {ending:8,points:'32,162 784,162 784,422 280,422 280,470 32,470'},
  {ending:7,points:'787,105 958,105 958,154 1136,154 1136,420 787,420'},
  {ending:6,points:'1320,157 1505,157 1505,105 1662,105 1662,157 1909,157 1909,419 1320,419'},
  {ending:5,points:'1915,58 2465,58 2465,474 2042,474 2042,424 1915,424'},
  {ending:1,points:'32,482 281,482 281,524 784,524 784,777 32,777'},
  {ending:2,points:'787,526 1134,526 1134,781 1101,781 1101,846 787,846'},
  {ending:3,points:'1321,525 1909,525 1909,782 1664,782 1664,845 1321,845'},
  {ending:4,points:'1915,525 2042,525 2042,486 2465,486 2465,897 1915,897'},
];

const r32PlanFile: Record<TypeKey, string> = {
  slim:'planta-slim', premium:'planta-premium', master:'planta-master', spazzio:'planta-spazzio-04',
};
const r32PlanDetails: Record<TypeKey,string> = {
  slim:'2 quartos · 1 vaga', premium:'2 quartos · 1 suíte · 1 vaga',
  master:'2 quartos · 1 suíte master · 1 vaga', spazzio:'3 quartos · 2 suítes · varanda · 2 vagas',
};

const endingToType: Record<number, TypeKey> = { 1: 'slim', 2: 'premium', 3: 'premium', 4: 'spazzio', 5: 'spazzio', 6: 'master', 7: 'master', 8: 'slim' };
const facilities: Facility[] = [
  { number: 1, name: 'Rua de acesso', category: 'acessos' },
  { number: 2, name: 'Calçada com gramado', category: 'acessos' },
  { number: 3, name: 'Guarita', category: 'acessos' },
  { number: 4, name: 'Acesso de pedestres', category: 'acessos' },
  { number: 5, name: 'Acesso de veículos', category: 'acessos' },
  { number: 6, name: 'Piscina adulto', category: 'lazer', image: 'piscina' },
  { number: 7, name: 'Piscina infantil', category: 'lazer', image: 'piscina' },
  { number: 8, name: 'Gazebo', category: 'lazer' },
  { number: 9, name: 'Espaço Grill', category: 'lazer' },
  { number: 10, name: 'Espaço Gourmet', category: 'lazer' },
  { number: 11, name: 'Espaço Fitness', category: 'lazer', image: 'fitness' },
  { number: 12, name: 'Easy Play', category: 'lazer', image: 'kids' },
  { number: 13, name: 'Easy Market', category: 'conveniencia', image: 'market' },
  { number: 14, name: 'Espaço Beleza', category: 'conveniencia' },
  { number: 15, name: 'Easy Work', category: 'conveniencia' },
  { number: 16, name: 'Rampas do edifício garagem', category: 'estrutura' },
  { number: 17, name: 'Bicicletários', category: 'estrutura' },
  { number: 18, name: 'Escadas do edifício garagem', category: 'estrutura' },
  { number: 19, name: 'Depósito', category: 'estrutura' },
  { number: 20, name: 'Restaurante colaboradores', category: 'estrutura' },
  { number: 21, name: 'Banheiros colaboradores', category: 'estrutura' },
  { number: 22, name: 'Easy Wash', category: 'conveniencia' },
  { number: 23, name: 'Espaço Ecumênico', category: 'lazer' },
  { number: 24, name: 'Recepção', category: 'acessos' },
  { number: 25, name: 'Espaço Pet', category: 'lazer' },
  { number: 26, name: 'Redário', category: 'lazer' },
  { number: 27, name: 'Boulevard Rota do Mar', category: 'lazer' },
  { number: 28, name: 'Praça', category: 'lazer' },
  { number: 29, name: 'Espaço Kids', category: 'lazer', image: 'kids' },
  { number: 30, name: 'Pista de Cooper', category: 'lazer' },
  { number: 31, name: 'Recarga de veículos elétricos', category: 'estrutura', image: 'recarga' },
  { number: 32, name: 'Vagas PNE', category: 'estrutura' },
  { number: 33, name: 'Lixo seco e molhado', category: 'estrutura' },
];
// R31 — associação EXATA das perspectivas recebidas aos números da lista do masterplan.
// Para os demais ambientes, nenhum arquivo é inventado ou reaproveitado indevidamente.
const facilityImages: Partial<Record<number, string>> = {
  6: 'erm-amb-06-piscina-adulto',
  9: 'erm-amb-09-espaco-grill',
  10: 'erm-amb-10-espaco-gourmet',
  11: 'erm-amb-11-espaco-fitness',
  12: 'erm-amb-12-easy-play',
  14: 'erm-amb-14-espaco-beleza',
  17: 'erm-amb-17-bicicletarios',
  22: 'erm-amb-22-easy-wash',
  30: 'erm-amb-30-pista-de-cooper',
  31: 'erm-amb-31-recarga-veiculos-eletricos',
};
// R39: associacao com os numerais VISIVEIS na implantacao oficial do TIFF.
// facilityId corresponde ao cadastro de imagens R31; mapLabel ao identificador no desenho.
// EV nao tem circulo numerado na imagem original, usa a indicacao textual ELETRICO.
const r39Places: { facilityId:number; mapLabel:string; name:string; x:number; y:number }[] = [
  {facilityId:3,mapLabel:'01',name:'Portaria',x:29.2,y:49.4},
  {facilityId:6,mapLabel:'02',name:'Piscina adulto',x:26.7,y:68.9},
  {facilityId:7,mapLabel:'03',name:'Piscina infantil',x:25.3,y:79.8},
  {facilityId:8,mapLabel:'04',name:'Area de lazer da piscina',x:27.3,y:85.1},
  {facilityId:9,mapLabel:'05',name:'Espaco Grill',x:33.7,y:81.2},
  {facilityId:10,mapLabel:'06',name:'Espaco Gourmet',x:39.4,y:78.3},
  {facilityId:11,mapLabel:'07',name:'Espaco Fitness',x:38.1,y:72.5},
  {facilityId:12,mapLabel:'08',name:'Easy Play / Sala Gamer',x:38.1,y:68.4},
  {facilityId:14,mapLabel:'09',name:'Espaco Beleza',x:38.4,y:64.5},
  {facilityId:22,mapLabel:'10',name:'Easy Wash / Lavanderia',x:80.8,y:60.5},
  {facilityId:17,mapLabel:'11',name:'Bicicletarios',x:83.3,y:75.4},
  {facilityId:25,mapLabel:'12',name:'Pet Place',x:88.6,y:50.9},
  {facilityId:30,mapLabel:'13',name:'Pista de Cooper',x:68.1,y:5.8},
  {facilityId:29,mapLabel:'14',name:'Playground',x:69.2,y:12.2},
  {facilityId:33,mapLabel:'15',name:'Lixeira',x:26.6,y:2.9},
  {facilityId:31,mapLabel:'16',name:'Recarga de veiculos eletricos',x:38.1,y:42.8},
];
// R42: seis fotos numeradas EXATAMENTE segundo a implantacao conferida pelo cliente.
// Sem alterar a associacao das dez perspectivas ja existentes (R39/R41).
const r42PointPhotos: Partial<Record<number,string>> = {
  3: 'erm42-ponto-01-portaria.jpg',
  7: 'erm42-ponto-03-piscina-infantil.jpg',
  8: 'erm42-ponto-04-lazer-piscina.jpg',
  25: 'erm42-ponto-19-pet-place.jpg',
  29: 'erm42-ponto-21-playground.jpg',
  33: 'erm42-ponto-23-lixeira.jpg',
};
// Os nomes R31 sao mantidos nos detalhes: fotografia original em cada ponto.
const gallery = [
  { id: 'hero', name: 'Vista geral', category: 'areas' },
  { id: 'fachada', name: 'Fachada do empreendimento', category: 'areas' },
  { id: 'piscina', name: 'Piscinas', category: 'lazer' },
  { id: 'kids', name: 'Espaço kids', category: 'lazer' },
  { id: 'fitness', name: 'Espaço fitness', category: 'lazer' },
  { id: 'market', name: 'Easy Market', category: 'areas' },
  { id: 'recarga', name: 'Recarga para veículos elétricos', category: 'areas' },
  // R40: onze fotografias distintas do apartamento decorado, selecionadas
  // entre as 60 fotos originais enviadas. Plantas ficam apenas na secao Plantas.
  { id: 'erm40-decor-sala-integrada', name: 'Sala integrada com cozinha e jantar', category: 'apartamentos' },
  { id: 'erm40-decor-jantar', name: 'Mesa de jantar do apartamento decorado', category: 'apartamentos' },
  { id: 'erm40-decor-cozinha', name: 'Cozinha planejada', category: 'apartamentos' },
  { id: 'erm40-decor-painel-tv', name: 'Painel de TV da sala', category: 'apartamentos' },
  { id: 'erm40-decor-sala-outro-angulo', name: 'Sala de estar — outra perspectiva', category: 'apartamentos' },
  { id: 'erm40-decor-quarto-casal', name: 'Dormitório principal', category: 'apartamentos' },
  { id: 'erm40-decor-segundo-quarto', name: 'Segundo dormitório', category: 'apartamentos' },
  { id: 'erm40-decor-bancada-estudo', name: 'Bancada de estudo e TV', category: 'apartamentos' },
  { id: 'erm40-decor-armarios', name: 'Armários e marcenaria', category: 'apartamentos' },
  { id: 'erm40-decor-banheiro', name: 'Banheiro do apartamento decorado', category: 'apartamentos' },
  { id: 'erm40-decor-circulacao', name: 'Circulação e acabamento', category: 'apartamentos' },
];
const mediaList = [
  { name: 'Vista geral do empreendimento', image: 'hero' },
  { name: 'Fachada', image: 'fachada' },
  ...facilities.map((p) => ({ name: p.name, image: p.image || 'hero' })),
];
const groupNames: Record<Group, string> = { todos: 'Todos', acessos: 'Acessos', lazer: 'Lazer', conveniencia: 'Conveniência', estrutura: 'Estrutura' };

function Photo({ id, alt, className = '', fit = 'cover' }: { id: string; alt: string; className?: string; fit?: 'cover' | 'contain' }) {
  const [error, setError] = useState(false);
  useEffect(() => setError(false), [id]);
  if (error) return <div className={`erm20-photoFallback ${className}`} role="img" aria-label={`${alt}. Imagem não carregada.`}><span>✧</span><strong>Imagem do empreendimento</strong><small>Arquivo temporariamente indisponível</small></div>;
  const src = id.startsWith('erm40-decor-') ? `${BRAND_ASSETS}${id}.webp` : media(id);
  return <img src={src} alt={alt} className={className} style={{ objectFit: fit }} onError={() => setError(true)} loading="lazy" decoding="async" />;
}

function Brand({ compact = false }: { compact?: boolean }) {
  const [logoFailed, setLogoFailed] = useState(false);
  return <div className={`erm20-brand ${compact ? 'erm20-brandCompact' : ''}`}>
    {!logoFailed && <img src={`${BRAND_ASSETS}erm-logo-transparente.png`} alt="Easy Rota do Mar" onError={() => setLogoFailed(true)} />}
    {logoFailed && <span className="erm20-brandFallback"><b>EASY</b><strong>ROTA DO MAR</strong></span>}
    <small>ROCHA EMPREENDIMENTOS · VIVA ALÉM DO COMUM</small>
  </div>;
}

function SectionBanner({ title, caption }: { title: string; caption?: string }) {
  return <div className="erm20-sectionBanner"><span>{title}</span>{caption && <small>{caption}</small>}</div>;
}

export default function EasyRotaClient() {
  const [started, setStarted] = useState(false);
  const [centralMenuOpen, setCentralMenuOpen] = useState(false);
  const [soundPrompt, setSoundPrompt] = useState(false);
  const [pendingSection, setPendingSection] = useState<Section>('localizacao');
  const [audioError, setAudioError] = useState(false);
  const music = useRef<HTMLAudioElement | null>(null);
  const waveClick = useRef<HTMLAudioElement | null>(null);
  const soundYesButton = useRef<HTMLButtonElement | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const [volume, setVolume] = useState(35);
  const audio = useRef<AudioContext | null>(null);
  const [section, setSection] = useState<Section>('localizacao');
  const [selectedNav, setSelectedNav] = useState<MenuKey>('localizacao');
  const [mobileSlide, setMobileSlide] = useState(0);
  const [tilted, setTilted] = useState(false);
  const [tab, setTab] = useState('ultratour');
  const [menuOpen, setMenuOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [tower, setTower] = useState<'norte' | 'sul'>('norte');
  const [look, setLook] = useState<Look>('diurna');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState(50);
  const [poiGroup, setPoiGroup] = useState('Principais');
  const [selectedType, setSelectedType] = useState<TypeKey>('spazzio');
  const [selectedEnding, setSelectedEnding] = useState(4);
  const [hoveredEnding, setHoveredEnding] = useState<number | null>(null);
  const [highlightedType, setHighlightedType] = useState<TypeKey | null>(null);
  const [hoveredLegend, setHoveredLegend] = useState<TypeKey | null>(null);
  const [plant3D, setPlant3D] = useState(false);
  const [r32Expanded, setR32Expanded] = useState(false);
  const [facility, setFacility] = useState(6);
  const [masterImage, setMasterImage] = useState<'implantacao' | 'pavimento'>('implantacao');
  const [masterZoom, setMasterZoom] = useState(1);
  const [masterOffset, setMasterOffset] = useState({ x: 0, y: 0 });
  const masterPointer = useRef<{ x: number; y: number } | null>(null);
  const [masterExpanded, setMasterExpanded] = useState(false);
  const [facilityExpanded, setFacilityExpanded] = useState(false);

  const [amenityGroup, setAmenityGroup] = useState<Group>('todos');
  const [imageIndex, setImageIndex] = useState(0);
  const [videoIndex, setVideoIndex] = useState(0);
  const [openLightbox, setOpenLightbox] = useState(false);
  const [mapChoice, setMapChoice] = useState('Mobilidade');

  const tone = useCallback(() => {
    if (!soundOn || typeof window === 'undefined') return;
    try {
      const ctx = audio.current || new window.AudioContext();
      audio.current = ctx;
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.type = 'sine'; osc.frequency.setValueAtTime(520, ctx.currentTime);
      gain.gain.setValueAtTime(Math.max(.005, volume / 1000), ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .08);
      osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + .08);
    } catch { /* áudio opcional */ }
  }, [soundOn, volume]);
  const goto = (s: Section, sub?: string) => {
    tone(); setSection(s); setTab(sub || subtabs[s][0].id); setMenuOpen(false); setOpenLightbox(false);
    const target = platformMenu.find((n) => n.section === s);
    if (target) setSelectedNav(target.id);
  };
  const openCentralSection = (chosen: Section) => {
    goto(chosen, centralMenuTabs[chosen] || subtabs[chosen][0].id);
    setCentralMenuOpen(false);
  };
  const backToSplash = () => {
    music.current?.pause(); setSoundOn(false); setAudioError(false);
    setSoundPrompt(false); setCentralMenuOpen(false); setMenuOpen(false); setStarted(false);
  };
  const start = (chosen: Section) => {
    // Efeito curto de mar acionado diretamente pelo clique no CTA, nunca no carregamento.
    if (waveClick.current) {
      waveClick.current.volume = 0.23;
      waveClick.current.currentTime = 0;
      void waveClick.current.play().catch(() => { /* A experiencia continua mesmo com audio bloqueado. */ });
    }
    setPendingSection(chosen); setSoundPrompt(true); setAudioError(false);
  };
  const playMusic = () => {
    if (!music.current) return;
    music.current.volume = Math.min(1, Math.max(0, volume / 100));
    void music.current.play().catch(() => { setAudioError(true); setSoundOn(false); });
  };
  const toggleMusic = () => {
    if (soundOn) { music.current?.pause(); setSoundOn(false); }
    else { setSoundOn(true); setAudioError(false); playMusic(); }
  };
  const goMenu = (n: typeof platformMenu[number]) => { goto(n.section, n.sub); setSelectedNav(n.id); };
  const fullScreen = () => {
    if (typeof document === 'undefined') return;
    if (document.fullscreenElement) { void document.exitFullscreen().catch(() => setHelp(true)); return; }
    if (document.documentElement.requestFullscreen) void document.documentElement.requestFullscreen().catch(() => setHelp(true));
  };
  const setSound = (enabled: boolean) => {
    setSoundOn(enabled); setSoundPrompt(false); setStarted(true); setCentralMenuOpen(true);
    setSection(pendingSection); setTab(subtabs[pendingSection][0].id);
    const target = platformMenu.find((n) => n.section === pendingSection && n.sub === subtabs[pendingSection][0].id);
    setSelectedNav(target?.id || 'localizacao');
    if (enabled) { setAudioError(false); playMusic(); } else { music.current?.pause(); }
  };
  useEffect(() => { if (music.current) music.current.volume = Math.min(1,Math.max(0,volume / 100)); }, [volume]);
  useEffect(() => { if (soundPrompt) soundYesButton.current?.focus(); }, [soundPrompt]);
  useEffect(() => { if (centralMenuOpen && !soundPrompt) { document.getElementById('erm25-menu-first')?.focus(); } }, [centralMenuOpen, soundPrompt]);
  const feature = facilities.find((p) => p.number === facility) || facilities[0];
  const facilityFile = facilityImages[feature.number];
  const currentMasterSource = masterImage === 'implantacao' ? `${BRAND_ASSETS}erm52-implantacao-pavimentos.png` : r32Asset('pavimento-interativo');
  const currentMasterAlt = masterImage === 'implantacao' ? 'Implantação original do Easy Rota do Mar, TIFF oficial recortado sem distorcer ou alterar sua geometria' : 'Planta completa do pavimento tipo Easy Rota do Mar, imagem enviada para a apresentação';
  const r39ChosenPlace = r39Places.find(p => p.facilityId === facility) || r39Places[0];
  const r42ChosenPhoto = r42PointPhotos[r39ChosenPlace.facilityId] || `${facilityImages[r39ChosenPlace.facilityId]}.webp`;
  const changeMaster = (next: 'implantacao' | 'pavimento') => { setMasterImage(next); setMasterZoom(1); setMasterOffset({x:0,y:0}); };
  const changeMasterZoom = (next: number) => { const z = Math.max(1,Math.min(2.5,+next.toFixed(2))); setMasterZoom(z); if (z===1) setMasterOffset({x:0,y:0}); };
  const moveMaster = (event: PointerEvent<HTMLDivElement>) => {
    if (masterZoom <= 1 || !masterPointer.current) return;
    const dx=event.clientX-masterPointer.current.x, dy=event.clientY-masterPointer.current.y;
    const bound=220*(masterZoom-1);
    setMasterOffset(v=>({ x:Math.max(-bound,Math.min(bound,v.x+dx)), y:Math.max(-bound,Math.min(bound,v.y+dy)) }));
    masterPointer.current={x:event.clientX,y:event.clientY};
  };
  useEffect(() => {
    if (!masterExpanded && !facilityExpanded && !r32Expanded) return;
    const close = (event: KeyboardEvent) => { if (event.key==='Escape') { setMasterExpanded(false); setFacilityExpanded(false); setR32Expanded(false); } };
    window.addEventListener('keydown',close);
    return () => window.removeEventListener('keydown',close);
  },[masterExpanded,facilityExpanded,r32Expanded]);

  const filtered = facilities.filter((p) => amenityGroup === 'todos' || p.category === amenityGroup);
  const images = gallery.filter((p) => p.category === tab);
  const image = images[imageIndex % Math.max(1, images.length)];
  const selected = types[selectedType];
  const activeHighlightType = hoveredEnding !== null ? endingToType[hoveredEnding] : (hoveredLegend ?? highlightedType);
  // R38: para Spazzio, vista de cima EXTRAIDA do TIFF original, sem recorte de pagina do book.
  // 04 e 05 possuem orientacoes distintas no pavimento tipo; nao inventar planta independente.
  const selectedPlanSource = selectedType === 'spazzio'
    ? `${BRAND_ASSETS}erm38-spazzio-${selectedEnding === 5 ? '05' : '04'}-planta-baixa.webp`
    : r32Asset(r32PlanFile[selectedType]);
  const setType = (type: TypeKey) => { tone(); setSelectedType(type); setSelectedEnding(types[type].endings[0]); setPlant3D(false); };
  const setTypeAndShow = (type: TypeKey) => { setType(type); setTab('plantas'); };
  const stepType = (dir: number) => setType(typeKeys[(typeKeys.indexOf(selectedType) + dir + typeKeys.length) % typeKeys.length]);
  const chooseTab = (newTab: string) => { tone(); setTab(newTab); setImageIndex(0); };

  useEffect(() => {
    if (!openLightbox) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenLightbox(false);
      if (event.key === 'ArrowRight') setImageIndex((x) => x + 1);
      if (event.key === 'ArrowLeft') setImageIndex((x) => (x + Math.max(1, images.length) - 1) % Math.max(1, images.length));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openLightbox, images.length]);

  const heroPhoto = `${BRAND_ASSETS}erm-vista-aerea.webp`;
  const showLiveMarker = 'Reprodução visual baseada no vídeo. Imagem 360° e orientação geográfica real exigem arquivos próprios de captura.';

  return <main className="erm20 erm21 erm22 erm23" style={{ '--erm-dark': palette.dark, '--erm-deep': palette.deep, '--erm-accent': palette.accent, '--erm-cream': palette.light } as CSSProperties}>
    <audio ref={music} src={`${BRAND_ASSETS}erm-ambiente-original.mp3`} loop preload="none" aria-hidden="true" />
    <audio ref={waveClick} src={`${BRAND_ASSETS}erm-onda-natural-r28.mp3`} preload="auto" aria-hidden="true" />
    {!started && <section className="erm20-splash erm23-splash" aria-label="Abertura Easy Rota do Mar">
      <div className="erm23-backgroundGrid" aria-hidden="true" />
      <div className="erm23-backgroundGlow" aria-hidden="true" />
      <header className="erm23-splashHeader">
        <a className="erm23-rochaSignature" href="https://meurocha.com.br" target="_blank" rel="noopener noreferrer" aria-label="Conheça a Rocha Empreendimentos no site oficial">
          <img src={`${BRAND_ASSETS}erm-rocha-assinatura.png`} alt="Rocha Empreendimentos" width={198} height={78} />
        </a>
      </header>
      <div className="erm23-centerStage">
        <div className="erm23-brandFrame"><Brand /></div>
        <div className="erm23-waveDivider" aria-hidden="true" />
        <h1 className="erm23-headline">O caminho mais curto entre a Serraria e o mar.</h1>
        <p className="erm30-centralSlogan">VIVA ALÉM DO COMUM</p>
      </div>
      <div className="erm23-entryArea">
        <button type="button" className="erm23-startButton" onClick={() => start('localizacao')} aria-label="Iniciar experiência Easy Rota do Mar">
          <span className="erm23-startIcon"><svg className="erm28-waveIcon" width="29" height="29" viewBox="0 0 36 36" fill="none" aria-hidden="true" focusable="false"><path d="M4 13.5 C7.5 10.7 11 16.3 14.5 13.5 S21.5 10.7 25 13.5 S31.2 16.3 33 13.5"/><path d="M4 19 C7.5 16.2 11 21.8 14.5 19 S21.5 16.2 25 19 S31.2 21.8 33 19"/><path d="M4 24.5 C7.5 21.7 11 27.3 14.5 24.5 S21.5 21.7 25 24.5 S31.2 27.3 33 24.5"/></svg></span>
          <span>TOQUE PARA INICIAR A EXPERIÊNCIA</span>
          <UiIcon name="arrow" size={21}/>
        </button>
        <p className="erm23-entryNote">Descubra o Easy Rota do Mar em uma apresentação exclusiva.</p>
      </div>

    </section>}

    {started && centralMenuOpen && <section className="erm25-centralMenu" aria-label="Menu principal da experiência Easy Rota do Mar">
      <div className="erm25-pattern" aria-hidden="true" />
      <div className="erm25-centralContent">
        <div className="erm25-brand" aria-label="Easy Rota do Mar"><Brand /></div>
        <nav className="erm25-options" aria-label="Escolha um módulo da plataforma">
          {sections.map((item, index) => <button
            key={item.id}
            id={index === 0 ? 'erm25-menu-first' : undefined}
            type="button"
            className="erm25-option"
            onClick={() => openCentralSection(item.id)}
            style={{ animationDelay: `${0.14 + index * 0.065}s` }}
          >
            <span className="erm25-optionIcon"><UiIcon name={centralMenuIcons[item.id]} size={23}/></span>
            <span className="erm25-optionLabel">{item.label}</span>
            <span className="erm25-optionArrow" aria-hidden="true"><UiIcon name="arrow" size={17}/></span>
          </button>)}
        </nav>
        <div className="erm25-footerTools" aria-label="Controles da experiência">
          <button type="button" onClick={backToSplash} title="Voltar à abertura" aria-label="Voltar à tela inicial"><UiIcon name="home" size={23}/></button>
          <button type="button" onClick={toggleMusic} aria-label={soundOn ? 'Desativar música' : 'Ativar música'} aria-pressed={soundOn} title={soundOn ? 'Desativar música' : 'Ativar música'}><UiIcon name={soundOn ? 'music' : 'mute'} size={23}/></button>
          <button type="button" onClick={() => setHelp(true)} title="Informações sobre a experiência" aria-label="Informações sobre a experiência"><span aria-hidden="true">ⓘ</span></button>
        </div>
      </div>
      <span className="erm25-menuCredit">ROCHA EMPREENDIMENTOS · VIVA ALÉM DO COMUM</span>
    </section>}

    {started && !centralMenuOpen && <div className="erm20-shell">
      <button className="erm20-mobileMenu" type="button" aria-label="Abrir ou fechar menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}><span className="erm21-menuGlyph">☰</span><Brand compact /></button>
      {menuOpen && <button className="erm20-shade" type="button" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}
      <aside className={`erm20-sidebar ${menuOpen ? 'isOpen' : ''}`}>
        <button type="button" className="erm20-brandLink" onClick={() => { music.current?.pause(); setSoundOn(false); setStarted(false); setMenuOpen(false); }} aria-label="Voltar à entrada"><Brand /></button>
        <nav className="erm20-sideNav" aria-label="Menu principal da plataforma">
          {platformMenu.map((n) => <button type="button" key={n.id} onClick={() => goMenu(n)} className={selectedNav === n.id ? 'active' : ''} aria-current={selectedNav === n.id ? 'page' : undefined}><span><UiIcon name={n.icon} size={17}/></span>{n.label}</button>)}
        </nav>
        <div className="erm20-sideTools">
          <div className="erm22-soundTools"><button type="button" className="erm22-soundToggle" onClick={toggleMusic} aria-label={soundOn ? "Desativar música ambiente" : "Ativar música ambiente"} aria-pressed={soundOn}><UiIcon name={soundOn ? "music" : "mute"} size={19}/><span>{soundOn ? "Trilha ligada" : "Trilha desligada"}</span></button><label className="erm20-volume"><span className="erm20-srOnly">Volume da trilha sonora</span><input type="range" min="0" max="100" value={volume} onChange={(e: ChangeEvent<HTMLInputElement>) => setVolume(Number(e.target.value))} aria-label="Volume da trilha sonora" /></label>{audioError && <small role="status">Seu navegador bloqueou o áudio. Toque novamente para ativar.</small>}</div>
          <div className="erm20-toolIcons"><button onClick={() => { setCentralMenuOpen(true); setMenuOpen(false); }} aria-label="Voltar ao menu principal" type="button"><UiIcon name="home" size={20}/></button><button onClick={fullScreen} aria-label="Tela cheia" type="button">⛶</button><button type="button" aria-label="Ajuda" onClick={() => setHelp(true)}>ⓘ</button></div>
        </div>
      </aside>

      <section className="erm20-main">
        {section !== 'plantas' && section !== 'lazer' && section !== 'institucional' && !(section === 'localizacao' && tab === 'ultratour') && <nav className="erm21-subTabs" aria-label="Abas da seção">{subtabs[section].map((t) => <button key={t.id} type="button" className={tab === t.id ? 'active' : ''} onClick={() => chooseTab(t.id)}>{t.label}</button>)}</nav>}
        <div className="erm20-panel" key={section}>
          {section === 'localizacao' && <div className="erm20-content erm20-location">
            {tab === 'ultratour' && <div className="erm20-immersive" role="region" aria-label="Visão aérea de referência do empreendimento">
              <div className={`erm20-immersivePhoto look-${look} ${tilted ? 'erm21-tilted' : ''}`} style={{ transform: `scale(${zoom}) ${tilted ? 'perspective(850px) rotateX(7deg)' : ''}`, '--pan': `${pan}%` } as CSSProperties}><img src={heroPhoto} alt="Vista aérea da região do Easy Rota do Mar, extraída do book oficial" className="erm20-immersiveImage" /></div>
              <div className="erm20-immersiveTint" /><div className="erm21-geoCaption">REGIÃO DA SERRARIA • MACEIÓ/AL</div>
              <div className="erm20-viewControls"><strong>Visão Geral do Entorno</strong><div><button className={tower === 'norte' ? 'active' : ''} onClick={() => setTower('norte')} type="button">Torre Norte</button><button className={tower === 'sul' ? 'active' : ''} onClick={() => setTower('sul')} type="button">Torre Sul</button></div></div>
              <div className="erm20-categoryList">{['Principais', 'Gastronomia', 'Educação', 'Compras', 'Serviços', 'Saúde', 'Esporte'].map((c) => <button type="button" onClick={() => setPoiGroup(c)} className={poiGroup === c ? 'active' : ''} key={c}><span>•</span>{c}</button>)}</div>
              <div className="erm20-sceneLabel"><span>⌖</span><b>easy <em>ROTA DO MAR</em></b><small>EMPREENDIMENTO ROCHA</small></div>
              <div className="erm20-height"><span className="erm21-north">N ↑</span><button type="button" aria-label="Ampliar vista" onClick={() => setZoom((z) => Math.min(1.7, +(z+.1).toFixed(2)))}>+</button><button type="button" aria-label="Reduzir vista" onClick={() => setZoom((z) => Math.max(1, +(z-.1).toFixed(2)))}>−</button><button type="button" onClick={() => setTilted((v)=>!v)} className={tilted ? 'active' : ''} aria-pressed={tilted} title="Inclinar fotografia para visualização ilustrativa, sem modelo 3D">3D*</button></div>
              <div className="erm20-miniPlan"><div className="erm20-miniPlanHead">N <span>TORRE {tower === 'norte' ? 'NORTE' : 'SUL'}</span></div><div className="erm20-miniPlanCells">{Array.from({ length: 8 }, (_, i) => <button key={i} type="button" className={selectedEnding === i + 1 ? 'active' : ''} title={`Terminação ${String(i+1).padStart(2, '0')}: ${types[endingToType[i+1]].name}`} onClick={() => { setSelectedEnding(i+1); setSelectedType(endingToType[i+1]); goto('plantas', 'plantas'); }}>{String(i+1).padStart(2, '0')}<span>{types[endingToType[i+1]].name}</span></button>)}</div></div>
              <div className="erm20-dayControls"><button type="button" className={look === 'diurna' ? 'active' : ''} onClick={() => setLook('diurna')} title="Filtro de dia">☼</button><button type="button" className={look === 'entardecer' ? 'active' : ''} onClick={() => setLook('entardecer')} title="Filtro de entardecer">◕</button><button type="button" className={look === 'noturna' ? 'active' : ''} onClick={() => setLook('noturna')} title="Filtro de noite">☾</button><button type="button" onClick={fullScreen} title="Tela cheia">⛶</button></div>
              <div className="erm21-viewModes"><button type="button" className="active" aria-pressed="true" title="Foto aérea do book oficial"><UiIcon name="image" size={20}/>Aérea</button><button type="button" onClick={() => setHelp(true)} title="Tour 360° depende de captura real"><span>360°</span><small>Em breve</small></button><button type="button" onClick={() => goto('localizacao','mapa')}><UiIcon name="pin" size={20}/>Mapa</button></div>
              <input className="erm20-pan" aria-label="Explorar horizontalmente a imagem" type="range" min="0" max="100" value={pan} onChange={(e: ChangeEvent<HTMLInputElement>) => setPan(Number(e.target.value))} />
              <span className="erm20-sceneDisclaimer" title={showLiveMarker}>FOTO DO BOOK OFICIAL • MARCADORES ILUSTRATIVOS • 3D NÃO GEORREFERENCIADO</span>
            </div>}
            {tab === 'ultratour' && <div className="erm21-mobileOverview" aria-label="Visão geral do empreendimento no celular">
              <div className="erm21-mobileHero">
                <img src={`${BRAND_ASSETS}${mobileSlide === 0 ? 'erm-fachada.webp' : 'erm-praia.webp'}`} alt={mobileSlide === 0 ? 'Fachada do Easy Rota do Mar no book oficial' : 'Foto de praia do book oficial'}/>
                <button type="button" className="erm21-mobilePrev" aria-label="Foto anterior" onClick={() => setMobileSlide((i)=>(i+1)%2)}>‹</button>
                <button type="button" className="erm21-mobileNext" aria-label="Próxima foto" onClick={() => setMobileSlide((i)=>(i+1)%2)}>›</button>
              </div>
              <h1>O CAMINHO MAIS CURTO<br/>ENTRE A SERRARIA E O MAR</h1>
              <div className="erm21-mobileDots" aria-label="Selecionar imagem">{[0,1].map((i)=><button type="button" key={i} aria-label={`Imagem ${i+1}`} aria-pressed={mobileSlide===i} className={mobileSlide===i?'active':''} onClick={()=>setMobileSlide(i)}/>)}</div>
              <div className="erm21-shortcuts">{platformMenu.filter((n)=>['localizacao','lazer','plantas','imagens','videos','ficha'].includes(n.id)).map((n)=><button type="button" key={n.id} onClick={()=>goMenu(n)}><UiIcon name={n.icon} size={28}/><span>{n.label}</span></button>)}</div>
            </div>}
            {tab === 'entorno' && <div className="erm20-nearby"><SectionBanner title="ENTORNO" caption="Explore o que faz parte do dia a dia"/><div className="erm20-nearbyHero"><Photo id="hero" alt="Visão ilustrativa da região do empreendimento"/><Brand compact /></div><div className="erm20-nearbyLinks">{['Serviços', 'Comércio', 'Educação', 'Mobilidade', 'Bem-estar', 'Lazer', 'Conveniência', 'Gastronomia'].map((x) => <button key={x} onClick={() => { setMapChoice(x); chooseTab('mapa'); }} type="button">{x}</button>)}</div><p className="erm20-disclaimer">Mapa e pontos de interesse serão georreferenciados após conferência do endereço e das coordenadas oficiais.</p></div>}
            {tab === 'rotas' && <div className="erm20-mapFrame"><SectionBanner title="ROTAS" caption="Visualização do entorno"/><div className="erm20-mapGrid"><div className="erm20-mapIllustration"><div className="erm20-road roadA"/><div className="erm20-road roadB"/><div className="erm20-road roadC"/><div className="erm20-mapPin">⌖<span>EASY ROTA DO MAR</span></div></div><div className="erm20-mapDetails"><h2>O caminho que conecta você a novos momentos.</h2><p>Explore a localização na Serraria, em Maceió, e consulte rotas reais no serviço de mapas.</p><a href="https://www.google.com/maps/search/?api=1&query=Easy%20Rota%20do%20Mar%20Macei%C3%B3" target="_blank" rel="noopener noreferrer">ABRIR MAPA EXTERNO ↗</a><small>Não exibimos tempos ou distâncias não verificados.</small></div></div></div>}
            {tab === 'mapa' && <div className="erm20-mapFrame"><SectionBanner title="MAPA" caption="Pontos de interesse próximos"/><div className="erm20-mapGrid"><div className="erm20-mapIllustration"><div className="erm20-road roadA"/><div className="erm20-road roadB"/><div className="erm20-road roadC"/><div className="erm20-mapPin">⌖<span>EASY ROTA DO MAR</span></div></div><div className="erm20-mapDetails"><div className="erm20-mapCats">{['Mobilidade', 'Educação', 'Comércio', 'Serviços'].map((x) => <button key={x} className={mapChoice === x ? 'active' : ''} type="button" onClick={() => setMapChoice(x)}>{x}</button>)}</div><h3>{mapChoice}</h3><p>Os marcadores definitivos serão inseridos após a validação dos endereços e distâncias pela Rocha.</p><a href="https://www.google.com/maps/search/?api=1&query=Easy%20Rota%20do%20Mar%20Macei%C3%B3" target="_blank" rel="noopener noreferrer">CONFERIR NO GOOGLE MAPS ↗</a></div></div></div>}
          </div>}

          {section === 'lazer' && <div className="erm20-content erm20-leisure">
            <SectionBanner title="MASTERPLAN" caption="Explore as perspectivas e os ambientes do Easy Rota do Mar" />
            <div className="erm31-planControls" role="group" aria-label="Escolher imagem e ampliar a planta">
              <div className="erm31-planModeButtons">
                <button type="button" className={masterImage === 'implantacao' ? 'active' : ''} aria-pressed={masterImage === 'implantacao'} onClick={() => changeMaster('implantacao')}>Implantação geral</button>
                <button type="button" className={masterImage === 'pavimento' ? 'active' : ''} aria-pressed={masterImage === 'pavimento'} onClick={() => changeMaster('pavimento')}>Pavimento tipo</button>
              </div>
              <div className="erm31-planZoomButtons">
                <button type="button" aria-label="Reduzir imagem" disabled={masterZoom<=1} onClick={() => changeMasterZoom(masterZoom-.25)}>−</button>
                <output aria-label="Zoom atual">{Math.round(masterZoom*100)}%</output>
                <button type="button" aria-label="Ampliar imagem" disabled={masterZoom>=2.5} onClick={() => changeMasterZoom(masterZoom+.25)}>+</button>
                <button type="button" aria-label="Restaurar enquadramento" onClick={() => {changeMasterZoom(1);setMasterOffset({x:0,y:0});}}>Ajustar</button>
                <button type="button" aria-label="Abrir imagem em tela ampliada" onClick={() => setMasterExpanded(true)}>⛶ Ampliar</button>
              </div>
            </div>
            {masterImage === 'implantacao' ? <div className="erm39-layout" aria-label="Implantacao oficial e visita interativa dos ambientes">
              <nav className="erm39-placeList" aria-label="Escolher ambiente do condominio">
                <strong>ESCOLHA UM AMBIENTE</strong>
                <small>Selecione um ponto na implantacao para ver a fotografia ao lado.</small>
                <div className="erm39-placeButtons">
                  {r39Places.map((point) => <button key={point.facilityId} type="button" className={facility===point.facilityId?'active':''}
                    aria-pressed={facility===point.facilityId} onClick={()=>{setFacility(point.facilityId);tone();}}>
                    <span>{point.mapLabel}</span>{point.name}
                  </button>)}
                </div>
              </nav>
              <div className="erm39-mapFrame" aria-label="Implantacao original com pontos interativos"
                onPointerDown={event => {if(masterZoom>1 && !(event.target as HTMLElement).closest('button')){masterPointer.current={x:event.clientX,y:event.clientY};event.currentTarget.setPointerCapture(event.pointerId);}}}
                onPointerMove={moveMaster}
                onPointerUp={event => {masterPointer.current=null;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);}}
                onPointerCancel={()=>{masterPointer.current=null;}}>
                <div className="erm39-mapCanvas" style={{transform:`translate(${masterOffset.x}px,${masterOffset.y}px) scale(${masterZoom}) perspective(1400px) rotateX(var(--erm50-map-tilt, 9deg)) rotateZ(var(--erm50-map-roll, -0.8deg))`}}>
                  <img src={`${BRAND_ASSETS}erm52-implantacao-pavimentos.png`} alt="Implantacao atualizada sem numeracao impressa, com pontos interativos sobrepostos" draggable={false} loading="lazy" decoding="async" />
                  {r39Places.map((point) => <button key={point.facilityId} type="button" className={`erm39-mapPin ${facility===point.facilityId?'active':''}`}
                    style={{left:`${point.x}%`,top:`${point.y}%`}} title={`Visualizar ${point.name}`} aria-label={`Selecionar ${point.name} na implantacao`}
                    aria-pressed={facility===point.facilityId} onClick={()=>{setFacility(point.facilityId);tone();}}><span>{point.mapLabel}</span></button>)}
                </div>
                <div className="erm41-compass" role="img" aria-label="Rosa dos ventos: norte a esquerda, leste acima, sul a direita e oeste abaixo; acabamento premium">
                  <svg viewBox="0 0 160 160" aria-hidden="true" focusable="false">
                    <defs>
                      <linearGradient id="erm43NorthGold" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fff8d5"/>
                        <stop offset="48%" stopColor="#e8cc80"/>
                        <stop offset="100%" stopColor="#ae8b45"/>
                      </linearGradient>
                      <linearGradient id="erm43Aqua" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ecffff"/>
                        <stop offset="45%" stopColor="#83dce7"/>
                        <stop offset="100%" stopColor="#1e768e"/>
                      </linearGradient>
                    </defs>
                    <circle cx="80" cy="80" r="56" fill="#06283b" fillOpacity="0.55" stroke="#afcbd2" strokeOpacity="0.33" strokeWidth="1" />
                    <circle cx="80" cy="80" r="50" fill="none" stroke="#c0a56c" strokeOpacity="0.55" strokeWidth="0.8" />
                    <circle cx="80" cy="80" r="45" fill="none" stroke="#8abecb" strokeOpacity="0.28" strokeWidth="0.7" />
                    <g stroke="#93c6d1" strokeOpacity="0.68" strokeLinecap="round">
                      <path d="M80 28 V33 M132 80 H127 M80 132 V127 M28 80 H33" strokeWidth="1.7"/>
                      <path d="M44 44 L48 48 M116 44 L112 48 M116 116 L112 112 M44 116 L48 112" strokeWidth="0.9" />
                    </g>
                    <path d="M80 80 L27 80 L76 67 Z" fill="url(#erm43NorthGold)" />
                    <path d="M80 80 L27 80 L76 93 Z" fill="#d0a552" />
                    <path d="M80 80 L80 32 L70 76 Z" fill="url(#erm43Aqua)" />
                    <path d="M80 80 L80 32 L90 76 Z" fill="#76ccdc" />
                    <path d="M80 80 L133 80 L84 67 Z" fill="#45738a" />
                    <path d="M80 80 L133 80 L84 93 Z" fill="#24556e" />
                    <path d="M80 80 L80 128 L70 84 Z" fill="#2a6279" />
                    <path d="M80 80 L80 128 L90 84 Z" fill="#153f54" />
                    <path d="M80 80 L49 49 L76 70 Z" fill="#b0e2e6" fillOpacity="0.78" />
                    <path d="M80 80 L111 49 L84 70 Z" fill="#719fb2" fillOpacity="0.70" />
                    <path d="M80 80 L111 111 L84 90 Z" fill="#49748a" fillOpacity="0.70" />
                    <path d="M80 80 L49 111 L76 90 Z" fill="#d0e5e6" fillOpacity="0.70" />
                    <circle cx="80" cy="80" r="7.2" fill="#f7fcf6" stroke="#ab8e54" strokeWidth="1.3" />
                    <circle cx="80" cy="80" r="2.4" fill="#207a91" />
                    <g fontFamily="Arial, sans-serif" fontSize="13" fontWeight="700" letterSpacing="1.2" textAnchor="middle">
                      <text x="12" y="84" fill="#f4d48f">N</text>
                      <text x="80" y="16" fill="#c9eef3">L</text>
                      <text x="148" y="84" fill="#c9eef3">S</text>
                      <text x="80" y="157" fill="#c9eef3">O</text>
                    </g>
                  </svg>
                </div>
                <small>IMPLANTAÇÃO DO BOOK OFICIAL · posições aproximadas · use + para explorar</small>
              </div>
              <aside className="erm39-photoPanel" aria-live="polite">
                <button type="button" className="erm39-photoOpen" onClick={()=>setFacilityExpanded(true)} aria-label={`Ampliar fotografia de ${r39ChosenPlace.name}`}>
                  <img key={r39ChosenPlace.facilityId} src={`${BRAND_ASSETS}${r42ChosenPhoto}`} alt={`Imagem oficial do ambiente ${r39ChosenPlace.name}`} loading="lazy" decoding="async" />
                  <span><UiIcon name="image" size={17}/> Ampliar fotografia</span>
                </button>
                <div className="erm39-photoDescription">
                  <span className="erm39-eyebrow">AMBIENTE SELECIONADO · {r39ChosenPlace.mapLabel}</span>
                  <h2>{r39ChosenPlace.name}</h2>
                  <p>Imagem do material fornecido pela Rocha. Escolha outro ponto no mapa ou na lista para conhecer os ambientes.</p>
                  <small>Perspectiva ilustrativa do empreendimento. A localização dos pontos no desenho é aproximada.</small>
                  <a className="erm39-originalLink" href={`${BRAND_ASSETS}erm-implantacao.webp`} target="_blank" rel="noopener noreferrer">Consultar a imagem original do book ↗</a>
                </div>
              </aside>
            </div> : <div className="erm20-masterVisual erm21-realMaster erm31-realPlan" aria-label={currentMasterAlt}
              onPointerDown={event => { if(masterZoom>1){masterPointer.current={x:event.clientX,y:event.clientY};event.currentTarget.setPointerCapture(event.pointerId);} }}
              onPointerMove={moveMaster}
              onPointerUp={event => {masterPointer.current=null;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);}}
              onPointerCancel={()=>{masterPointer.current=null;}}>
              <img className="erm31-planImage" src={currentMasterSource} alt={currentMasterAlt} draggable={false} loading="lazy" decoding="async" style={{transform:`translate(${masterOffset.x}px,${masterOffset.y}px) scale(${masterZoom})`}} />
              <small>PAVIMENTO TIPO · IMAGEM INTEIRA SEM CORTES · {masterZoom>1?'Arraste para explorar':'Use + para explorar detalhes'}</small>
            </div>}
            {masterExpanded && <div className="erm31-imageOverlay" role="dialog" aria-modal="true" aria-label="Visualização ampliada da imagem principal">
              <div className="erm31-overlayTop"><strong>{masterImage === 'implantacao' ? 'Implantação geral' : 'Planta do pavimento tipo'}</strong><button type="button" onClick={() => setMasterExpanded(false)} aria-label="Fechar imagem ampliada">✕ Fechar</button></div>
              <img src={currentMasterSource} alt={currentMasterAlt} draggable={false} />
            </div>}
            {facilityExpanded && <div className="erm31-imageOverlay" role="dialog" aria-modal="true" aria-label={`Fotografia ampliada: ${r39ChosenPlace.name}`}>
              <div className="erm31-overlayTop"><strong>{r39ChosenPlace.name} · Perspectiva ilustrativa</strong><button type="button" onClick={() => setFacilityExpanded(false)}>✕ Fechar</button></div>
              <img src={`${BRAND_ASSETS}${r42ChosenPhoto}`} alt={`Fotografia ampliada de ${r39ChosenPlace.name}`} />
            </div>}
            <div className="erm32-masterMoved">
              <UiIcon name="floor" size={24}/>
              <p>Conheça os ambientes na implantação interativa acima. Os pontos apresentados utilizam fotografias do material enviado; novos ambientes poderão ser incluídos após conferência.</p>
              <button type="button" onClick={() => { goto('plantas','tipologias'); setSelectedNav('plantas'); }}>EXPLORAR PAVIMENTO TIPO <UiIcon name="arrow" size={16}/></button>
            </div>
          </div>}
          {section === 'plantas' && <div className="erm20-content erm20-plans erm32-plans erm33-plans">
            {tab === 'tipologias' && <>
              <div className="erm32-head">
                <SectionBanner title="PAVIMENTO TIPO" caption="08 terminações · 04 opções de planta" />
                <h1>ESCOLHA A PLANTA QUE COMBINA COM VOCÊ</h1>
              </div>
              <p className="erm32-hint">Selecione uma tipologia abaixo para destacar suas duas terminações. Toque no número de um apartamento para abrir a planta baixa.</p>
              <div className="erm32-building erm33-building" aria-label="Pavimento tipo com oito terminações interativas e cores por tipologia">
                <div className="erm34-planStage">
                  <img src={`${BRAND_ASSETS}erm34-pavimento-limpo.webp`} alt="Pavimento tipo oficial sem rotulos impressos, com oito unidades e circulacao preservada" draggable={false} />
                  <svg className="erm34-zones" viewBox="0 0 2500 957" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
                    {r35Zones.map((zone) => {
                      const key = endingToType[zone.ending];
                      return <polygon key={zone.ending} points={zone.points}
                        className={`erm34-zone erm33-${key} ${activeHighlightType===key?'isTypeHighlighted':''} ${activeHighlightType!==null&&activeHighlightType!==key?'isTypeMuted':''} ${hoveredEnding===zone.ending?'isHovered':''}`} />;
                    })}
                  </svg>
                  {r32UnitPoints.map((p) => {
                    const type = endingToType[p.ending];
                    return <button key={p.ending} type="button" className={`erm32-unit erm33-unit erm33-${type} ${activeHighlightType===type?'isSelected':''} ${activeHighlightType!==null&&activeHighlightType!==type?'isTypeMuted':''}`} style={{left:`${p.x}%`,top:`${p.y}%`}}
                      aria-label={`Ver planta ${types[type].name}, terminação ${String(p.ending).padStart(2,'0')}`} title={`${String(p.ending).padStart(2,'0')} · ${types[type].name}`}
                      onMouseEnter={() => setHoveredEnding(p.ending)} onMouseLeave={() => setHoveredEnding(null)}
                      onFocus={() => setHoveredEnding(p.ending)} onBlur={() => setHoveredEnding(null)}
                      onClick={() => {setHoveredEnding(null);setHighlightedType(type);setSelectedType(type);setSelectedEnding(p.ending);setPlant3D(false);chooseTab('plantas');}}>
                      <span className="erm33-unitLabel"><b>{String(p.ending).padStart(2,'0')}</b><span>{types[type].name.toUpperCase()}</span></span>
                    </button>;
                  })}
                </div>
              </div>
                             {/* R36: sem imagens nos resumos; especificacoes no mesmo formato editorial do Plaza. */}
               <div className="erm36-typesRow" aria-label="Resumo de tipologias do Easy Rota do Mar">
                 {typeKeys.map((key) => <button type="button" key={key}
                   className={`erm36-typeLegend erm38-typeButton erm33-${key} ${highlightedType===key?'isChosen':''}`}
                   aria-pressed={highlightedType===key}
                   aria-label={`Destacar as terminações ${types[key].endings.map(n=>String(n).padStart(2,'0')).join(' e ')} da tipologia ${types[key].name}`}
                   onClick={() => setHighlightedType(prev => prev === key ? null : key)}
                   onMouseEnter={() => setHoveredLegend(key)} onMouseLeave={() => setHoveredLegend(null)}
                   onFocus={() => setHoveredLegend(key)} onBlur={() => setHoveredLegend(null)}>
                   <h2><span className="erm36-typeSwatch" aria-hidden="true" />{types[key].name.toUpperCase()}</h2>
                   <div className="erm36-typeMetric"><strong>{types[key].area}</strong><span>TERMINAÇÕES {types[key].endings.map(n=>String(n).padStart(2,'0')).join(', ')}</span></div>
                   <p>{r32PlanDetails[key]}</p>
                 </button>)}
               </div>
               <p className="erm36-note">Selecione a identificação de um dos oito apartamentos no pavimento para consultar sua planta. As cores indicam tipologias, não disponibilidade de unidades.</p>
            </>}
            {tab === 'plantas' && <>
              <div className="erm32-detailTop">
                <button type="button" className="erm32-back" onClick={() => chooseTab('tipologias')}>‹ VOLTAR AO PAVIMENTO TIPO</button>
                <div><small>PLANTA SELECIONADA · TERMINAÇÃO {String(selectedEnding).padStart(2,'0')}</small><h1>{selected.name.toUpperCase()}</h1><strong>{selected.area}</strong></div>
              </div>
              {selectedType === 'spazzio' ? <p className="erm38-sourceNote">PLANTA BAIXA · VISTA SUPERIOR DO PAVIMENTO TIPO ORIGINAL</p> :
                <div className="erm33-viewSwitch" role="group" aria-label="Modo de visualização da planta">
                  <button type="button" className={!plant3D ? 'active' : ''} aria-pressed={!plant3D} onClick={() => setPlant3D(false)}>Planta técnica</button>
                  <button type="button" className={plant3D ? 'active' : ''} aria-pressed={plant3D} onClick={() => setPlant3D(true)}>Perspectiva da planta</button>
                </div>}
              <div className="erm32-planFocus">
                <button type="button" aria-label="Ver tipologia anterior" className="erm32-navArrow" onClick={() => stepType(-1)}>‹</button>
                <button type="button" className="erm32-planPhoto" onClick={() => setR32Expanded(true)} aria-label={`Ampliar a planta ${selected.name}`}>
                  <img src={plant3D && selectedType !== 'spazzio' ? r33CardAsset[selectedType] : selectedPlanSource} alt={selectedType === 'spazzio' ? `Planta baixa Spazzio ${String(selectedEnding).padStart(2,'0')} extraída do pavimento tipo original` : plant3D ? `Perspectiva da planta ${selected.name}, imagem inteira sem cortes` : `Planta original ${selected.name} do Easy Rota do Mar, sem cortes`} draggable={false}/>
                  <span>⛶ AMPLIAR PLANTA</span>
                </button>
                <button type="button" aria-label="Ver próxima tipologia" className="erm32-navArrow" onClick={() => stepType(1)}>›</button>
              </div>
              <div className="erm32-planInfo">
                <div><h2>{selected.name}</h2><p>{r32PlanDetails[selectedType]}</p><p>{selected.description}</p><small>{selectedType==='spazzio'?'Planta baixa extraída do pavimento tipo original da Rocha, sem uma prancha individual com cotas. A geometria foi preservada.':'A planta técnica original é a referência de geometria. As perspectivas são projeções visuais, sem modificar a distribuição dos ambientes; não são maquetes executivas 3D.'}</small></div>
                <div className="erm32-endingPicker"><strong>ESCOLHA A TERMINAÇÃO</strong><div>{Array.from({length:8},(_,i)=>i+1).map(n=><button key={n} type="button" className={selectedEnding===n?'active':''} aria-pressed={selectedEnding===n} onClick={() => {setSelectedEnding(n);setSelectedType(endingToType[n]);setPlant3D(false);}} title={`Terminação ${n}: ${types[endingToType[n]].name}`}>{String(n).padStart(2,'0')}</button>)}</div><small>Representação das tipologias, sem informação de estoque.</small></div>
              </div>
              {r32Expanded && <div className="erm32-lightbox" role="dialog" aria-modal="true" aria-label={`Planta ampliada ${selected.name}`}>
                <div><strong>{selected.name} · {selected.area}</strong><button type="button" onClick={() => setR32Expanded(false)} aria-label="Fechar planta ampliada">✕ FECHAR</button></div>
                <img src={plant3D && selectedType !== 'spazzio' ? r33CardAsset[selectedType] : selectedPlanSource} alt={selectedType === 'spazzio' ? `Planta baixa Spazzio ${String(selectedEnding).padStart(2,'0')} ampliada` : plant3D ? `Perspectiva ampliada ${selected.name}` : `Planta original ampliada ${selected.name}`} />
              </div>}
            </>}
          </div>}

          {section === 'imagens' && <div className={`erm20-content erm20-images ${tab === 'apartamentos' ? 'erm40-decorGallery' : ''}`}><SectionBanner title={`IMAGENS / ${tab === 'apartamentos' ? 'APARTAMENTO DECORADO' : tab === 'areas' ? 'ÁREAS COMUNS' : 'LAZER'}`}/>
            {tab === 'apartamentos' && <div className="erm40-decorMeta"><span>FOTOGRAFIAS REAIS DO APARTAMENTO DECORADO</span><span>{String(imageIndex%Math.max(1,images.length)+1).padStart(2,'0')} / {String(images.length).padStart(2,'0')}</span></div>}
            <h2>{image?.name || 'Galeria do Easy Rota do Mar'}</h2>
            <div className="erm20-galleryStage"><button type="button" className="erm20-galleryPrev" aria-label="Imagem anterior" onClick={() => setImageIndex((i)=>(i+images.length-1)%images.length)}>‹</button>{image && <button type="button" className="erm20-galleryPhoto" aria-label="Ampliar imagem" onClick={() => setOpenLightbox(true)}><Photo id={image.id} alt={image.name} fit={tab === 'apartamentos' ? 'contain' : 'cover'}/></button>}<button type="button" className="erm20-galleryNext" aria-label="Próxima imagem" onClick={() => setImageIndex((i)=>(i+1)%images.length)}>›</button></div>
            <div className="erm20-galleryThumbs">{images.map((p,i)=><button type="button" key={p.id} aria-label={`Ver ${p.name}`} aria-pressed={imageIndex%images.length===i} className={imageIndex%images.length===i?'active':''} onClick={()=>setImageIndex(i)}><Photo id={tab === 'apartamentos' ? `${p.id}-thumb` : p.id} alt={p.name} fit={tab === 'apartamentos' ? 'contain' : 'cover'}/></button>)}</div>
            <span className="erm20-photoCaption">{tab === 'apartamentos' ? `Fotografias do decorado · ${images.length} ângulos selecionados · Clique para ampliar` : `Perspectivas meramente ilustrativas · ${images.length} imagens`}</span>
          </div>}

          {section === 'videos' && <div className="erm20-content erm20-videos"><SectionBanner title="VÍDEOS"/><div className="erm20-videoGrid"><div className="erm20-videoFocus"><div className="erm20-videoPoster"><Photo id={mediaList[videoIndex].image} alt={mediaList[videoIndex].name}/><span className="erm20-filmStatus">{tab === 'perspectivas' ? 'PERSPECTIVAS ANIMADAS' : tab === 'empreendimento' ? 'EMPREENDIMENTO' : 'SHORT VÍDEOS'}</span></div><h2>{mediaList[videoIndex].name}</h2><p>Prévia visual. O vídeo correspondente será vinculado assim que a Rocha selecionar e aprovar o arquivo original.</p></div><div className="erm20-videoList">{mediaList.map((v,i)=><button key={`${v.name}-${i}`} type="button" className={videoIndex===i?'active':''} onClick={()=>setVideoIndex(i)}><b>{String(i+1).padStart(2,'0')}</b><span>{v.name}</span></button>)}</div></div></div>}

          {section === 'ficha' && <div className="erm20-content erm20-spec erm44-spec">
            <div className="erm44-sheet">
              <SectionBanner title="FICHA TÉCNICA"/>
              <div className="erm44-hero">
                <div className="erm44-heroVisual">
                  <img src={`${BRAND_ASSETS}erm44-fachada-bloco.webp`} alt="Fachada oficial do Easy Rota do Mar ao entardecer" loading="lazy" decoding="async"/>
                </div>
                <div className="erm44-overview">
                  <div className="erm44-overviewContent">
                    <span className="erm44-eyebrow">CONHEÇA O PROJETO</span>
                    <h2>Um empreendimento pensado para viver <em>além do comum.</em></h2>
                    <div className="erm44-metrics" aria-label="Dados gerais do empreendimento">
                      <div className="erm44-metric"><span className="erm44-metricIcon"><UiIcon name="building" size={22}/></span><b>02</b><span>Torres</span></div>
                      <div className="erm44-metric"><span className="erm44-metricIcon"><UiIcon name="key" size={22}/></span><b>208</b><span>Unidades</span></div>
                      <div className="erm44-metric"><span className="erm44-metricIcon"><UiIcon name="layers" size={22}/></span><b>04</b><span>Tipologias</span></div>
                    </div>
                  </div>
                  <img className="erm44-foliagePanel" src={`${BRAND_ASSETS}erm44-folhagem-painel.webp`} alt="" aria-hidden="true" loading="lazy" decoding="async"/>
                </div>
              </div>
              <div className="erm44-typeGrid" aria-label="Tipologias do Easy Rota do Mar">
                {typeKeys.map((k)=><article className="erm44-typeCard" key={k}>
                  <div className="erm44-cardHead"><h3>{types[k].name}</h3><strong>{types[k].area}</strong></div>
                  <div className="erm44-cardDetails">
                    <p><UiIcon name="bed" size={18}/><span>{types[k].rooms}</span></p>
                    <p><UiIcon name="car" size={18}/><span>{types[k].parking}</span></p>
                    <p><UiIcon name="calendar" size={18}/><span>Terminações {types[k].endings.map((x)=>String(x).padStart(2,'0')).join(' e ')}</span></p>
                  </div>
                  <button className="erm44-cardAction" type="button" onClick={()=>{goto('plantas','plantas');setTypeAndShow(k);}}>VER PLANTA <UiIcon name="arrow" size={17}/></button>
                </article>)}
              </div>
              <p className="erm20-disclaimer erm44-disclaimer">Projeto de referência para homologação: 2 blocos, 208 apartamentos e 4 tipologias. Vagas, dados comerciais e disponibilidade devem ser confirmados com a Rocha.</p>
            </div>
            <img className="erm44-foliageCorner" src={`${BRAND_ASSETS}erm44-folhagem-canto.webp`} alt="" aria-hidden="true" loading="lazy" decoding="async"/>
          </div>}          {section === 'simulacao' && <div className="erm20-content erm21-simulation">
            <SectionBanner title="SIMULAÇÃO" caption="Apresentação em homologação"/>
            <div className="erm21-simulationBox"><UiIcon name="calculator" size={46}/><h2>Simulação financeira</h2><p>O painel visual está preparado para receber parâmetros comerciais aprovados pela Rocha. Nenhum preço, condição ou disponibilidade foi inventado nesta versão.</p><a href={official} rel="noopener noreferrer" target="_blank">CONHECER O EMPREENDIMENTO NO SITE OFICIAL ↗</a></div>
          </div>}

          {section === 'institucional' && <div className="erm20-content erm20-institutional erm50-institutional">
            <div className="erm50-stage">
              <div className="erm50-visual" aria-label="Fachada oficial do empreendimento Easy Rota do Mar">
                <div className="erm50-photoFrame">
                  <img className="erm50-facade" src={`${BRAND_ASSETS}erm50-fachada-oficial.jpg`} alt="Fachada ilustrativa oficial do Easy Rota do Mar, preservada do material do empreendimento" loading="lazy" decoding="async" />
                </div>

              </div>
              <article className="erm50-story" aria-labelledby="erm50-title">
                <div className="erm50-kicker">ROCHA EMPREENDIMENTOS <span>·</span> DESDE 2010</div>
                <h1 id="erm50-title">Construímos histórias.<br/>Entregamos novos começos.</h1>
                <p className="erm50-intro">Qualidade, confiança e inovação para viver além do comum.</p>
                <p className="erm50-slogan">Viva além do comum.</p>
                <div className="erm50-valuesGrid" aria-label="Missão, visão e valores da Rocha">
                  <section className="erm50-valueCard">
                    <span className="erm50-cardIcon erm54-cardIcon" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="M24 4 43 14 24 24 5 14 24 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M5 23 24 33 43 23M5 32 24 42 43 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="m24 9 10 5-10 5-10-5 10-5Z" fill="currentColor" fillOpacity=".12"/></svg></span>
                    <h2>MISSÃO</h2><p>Construir com qualidade e entregar experiências além do comum.</p>
                  </section>
                  <section className="erm50-valueCard">
                    <span className="erm50-cardIcon erm54-cardIcon" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="M6 42V29h9v13M20 42V23h9v19M34 42V17h8v25" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/><path d="M6 21 17 13l10 3L41 4M33 4h8v8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 42h36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg></span>
                    <h2>VISÃO</h2><p>Ser referência em Alagoas na construção de lares, com tecnologia e sustentabilidade.</p>
                  </section>
                  <section className="erm50-valueCard">
                    <span className="erm50-cardIcon erm54-cardIcon" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="m24 4 17 6v12c0 11-6.6 18.1-17 22C13.6 40.1 7 33 7 22V10L24 4Z" stroke="currentColor" strokeWidth="2.1" strokeLinejoin="round"/><path d="m15 23 6.5 6.5L34 17" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/><path d="m24 9 12 4v9c0 8-4.3 13.1-12 16" stroke="currentColor" strokeWidth="1" strokeOpacity=".42"/></svg></span>
                    <h2>VALORES</h2><p>Segurança, qualidade, transparência, foco no cliente, satisfação do time e inovação.</p>
                  </section>
                </div>
                <div className="erm50-quality" aria-label="Fundação e certificações da construtora">
                  <div><span className="erm50-qualityIcon erm54-qualityIcon" aria-hidden="true"><svg viewBox="0 0 36 36" fill="none"><rect x="5" y="8" width="26" height="23" rx="3.2" stroke="currentColor" strokeWidth="2"/><path d="M5 15h26M12 4v8M24 4v8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/><path d="M12 21h2M21 21h2M12 26h2M21 26h2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg></span><span><strong>2010</strong><small>Fundação</small></span></div>
                  <div><span className="erm50-qualityIcon erm54-qualityIcon" aria-hidden="true"><svg viewBox="0 0 36 36" fill="none"><circle cx="18" cy="14.5" r="9.5" stroke="currentColor" strokeWidth="2"/><path d="m18 7 2.3 4.7 5.2.8-3.75 3.7.9 5.1L18 18.9l-4.65 2.4.9-5.1-3.75-3.7 5.2-.8L18 7Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/><path d="m11 23-3 10 7-4 3 3 3-8M25 23l3 10-7-4-2.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg></span><span><strong>ISO 9001:2015</strong><small>Certificação</small></span></div>
                  <div><span className="erm50-qualityIcon erm54-qualityIcon" aria-hidden="true"><svg viewBox="0 0 36 36" fill="none"><path d="M6 31V12l10-5v24M16 31V4l13 5v22M3 31h30" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round"/><path d="M11 14h2M11 19h2M11 24h2M21 12h3M21 17h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="28" cy="26" r="6" fill="#eafbff" stroke="currentColor" strokeWidth="1.6"/><path d="m25.5 26 1.8 1.8 3.2-3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></span><span><strong>PBQP-H</strong><small>Nível A (SiAC)</small></span></div>
                </div>
                <footer className="erm50-footer">
                  <a href="https://meurocha.com.br/rocha" target="_blank" rel="noopener noreferrer"><span className="erm54-ctaLabel">CONHEÇA A ROCHA</span><span className="erm54-ctaArrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"/></svg></span></a>
                  <img className="erm50-brandLogo" src={`${BRAND_ASSETS}erm50-rocha-logo-original.png`} alt="Logomarca original da Rocha Empreendimentos" loading="lazy" decoding="async" />
                </footer>
                <div className="erm50-strapline">INCORPORAÇÃO <span>·</span> CONSTRUÇÃO <span>·</span> QUALIDADE <span>·</span> SUSTENTABILIDADE</div>
              </article>
            </div>
          </div>}
        </div>
              </section>
    </div>}

    {soundPrompt && <div className="erm20-modalBackdrop erm22-audioBackdrop"><div className="erm20-modal erm22-audioModal" role="dialog" aria-modal="true" aria-labelledby="erm20-soundTitle" aria-describedby="erm22-soundDescription"><button className="erm22-modalBack" type="button" onClick={()=>setSoundPrompt(false)} aria-label="Voltar para a abertura">×</button><div className="erm22-modalIcon"><UiIcon name="music" size={31}/></div><span className="erm22-modalEyebrow">SUA EXPERIÊNCIA, SEU RITMO</span><h2 id="erm20-soundTitle">Deseja iniciar com música?</h2><p id="erm22-soundDescription">Uma trilha instrumental original e discreta pode acompanhar sua visita. Você poderá desligá-la a qualquer momento.</p><button ref={soundYesButton} type="button" className="erm22-modalPrimary" onClick={()=>setSound(true)}><UiIcon name="music" size={19}/> ENTRAR COM MÚSICA <UiIcon name="arrow" size={18}/></button><button type="button" className="erm22-modalSecondary" onClick={()=>setSound(false)}><UiIcon name="mute" size={19}/> ENTRAR SEM MÚSICA <UiIcon name="arrow" size={18}/></button><small>Áudio opcional · Sem reprodução automática · Volume ajustável</small></div></div>}
    {help && <div className="erm20-modalBackdrop"><div className="erm20-modal" role="dialog" aria-modal="true" aria-labelledby="erm20-helpTitle"><span>◇</span><h2 id="erm20-helpTitle">SOBRE ESTA EXPERIÊNCIA</h2><p>Réplica estrutural de homologação baseada na navegação apresentada em vídeo. Cores e empreendimento adaptados para o Easy Rota do Mar. Fotografia 360° real, mapa georreferenciado e vídeos originais serão adicionados após validação dos arquivos.</p><button type="button" onClick={()=>setHelp(false)}>FECHAR</button><a href={official} target="_blank" rel="noopener noreferrer">CONSULTAR MATERIAL OFICIAL ↗</a></div></div>}
    {openLightbox && image && <div className="erm20-lightbox" role="dialog" aria-modal="true" aria-label={`Imagem ampliada ${image.name}`}><button type="button" className="erm20-closeLightbox" onClick={()=>setOpenLightbox(false)} aria-label="Fechar imagem ampliada">×</button><button type="button" aria-label="Imagem anterior" onClick={()=>setImageIndex((i)=>(i+images.length-1)%images.length)}>‹</button><Photo id={image.id} alt={image.name} fit="contain"/><button type="button" aria-label="Próxima imagem" onClick={()=>setImageIndex((i)=>(i+1)%images.length)}>›</button><span>{image.name}</span></div>}
    <span className="erm20-srOnly" aria-live="polite">{started ? `Seção ${sections.find((s)=>s.id===section)?.label}, aba ${subtabs[section].find((t)=>t.id===tab)?.label}` : 'Tela inicial'}</span>
  </main>;
}
