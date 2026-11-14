'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ChangeEvent } from 'react';

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
type MenuKey = 'visao' | 'localizacao' | 'entorno' | 'empreendimento' | 'masterplan' | 'plantas' | 'galeria' | 'videos' | 'diferenciais' | 'simulacao';
const platformMenu: { id: MenuKey; label: string; icon: string; section: Section; sub: string }[] = [
  { id: 'visao', label: 'Visão Geral', icon: 'home', section: 'localizacao', sub: 'ultratour' },
  { id: 'localizacao', label: 'Localização', icon: 'pin', section: 'localizacao', sub: 'mapa' },
  { id: 'entorno', label: 'Entorno', icon: 'building', section: 'localizacao', sub: 'entorno' },
  { id: 'empreendimento', label: 'Empreendimento', icon: 'building', section: 'ficha', sub: 'ficha' },
  { id: 'masterplan', label: 'Masterplan', icon: 'layers', section: 'lazer', sub: 'implantacao' },
  { id: 'plantas', label: 'Plantas', icon: 'floor', section: 'plantas', sub: 'tipologias' },
  { id: 'galeria', label: 'Galeria de Imagens', icon: 'image', section: 'imagens', sub: 'apartamentos' },
  { id: 'videos', label: 'Vídeos', icon: 'play', section: 'videos', sub: 'perspectivas' },
  { id: 'diferenciais', label: 'Diferenciais', icon: 'star', section: 'lazer', sub: 'espacos' },
  { id: 'simulacao', label: 'Simulação', icon: 'calculator', section: 'simulacao', sub: 'simulacao' },
];
const globalTabs: { label: string; icon: string; section: Section; sub: string; menu: MenuKey }[] = [
  { label: 'Utilização', icon: 'pin', section: 'localizacao', sub: 'ultratour', menu: 'visao' },
  { label: 'Entorno', icon: 'building', section: 'localizacao', sub: 'entorno', menu: 'entorno' },
  { label: 'Masterplan', icon: 'layers', section: 'lazer', sub: 'implantacao', menu: 'masterplan' },
  { label: 'Plantas', icon: 'floor', section: 'plantas', sub: 'tipologias', menu: 'plantas' },
  { label: 'Mídias', icon: 'play', section: 'imagens', sub: 'apartamentos', menu: 'galeria' },
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
  spazzio: { name: 'Spazzio', area: '58,60 m²', rooms: '3 quartos', description: 'Suíte master, suíte reversível e varanda gourmet.', parking: '2 vagas', image: 'spazzio', endings: [4, 5] },
};
const typeKeys: TypeKey[] = ['slim', 'premium', 'master', 'spazzio'];
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
const gallery = [
  { id: 'hero', name: 'Vista geral', category: 'areas' },
  { id: 'fachada', name: 'Fachada do empreendimento', category: 'areas' },
  { id: 'piscina', name: 'Piscinas', category: 'lazer' },
  { id: 'kids', name: 'Espaço kids', category: 'lazer' },
  { id: 'fitness', name: 'Espaço fitness', category: 'lazer' },
  { id: 'market', name: 'Easy Market', category: 'areas' },
  { id: 'recarga', name: 'Recarga para veículos elétricos', category: 'areas' },
  { id: 'slim', name: 'Planta Slim', category: 'apartamentos' },
  { id: 'premium', name: 'Planta Premium', category: 'apartamentos' },
  { id: 'master', name: 'Planta Master', category: 'apartamentos' },
  { id: 'spazzio', name: 'Planta Spazzio', category: 'apartamentos' },
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
  return <img src={media(id)} alt={alt} className={className} style={{ objectFit: fit }} onError={() => setError(true)} loading="lazy" />;
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
  const [selectedNav, setSelectedNav] = useState<MenuKey>('visao');
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
  const [plant3D, setPlant3D] = useState(false);
  const [facility, setFacility] = useState(6);
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
    const target = platformMenu.find((n) => n.section === s && n.sub === (sub || subtabs[s][0].id));
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
  const goGlobal = (n: typeof globalTabs[number]) => { goto(n.section, n.sub); setSelectedNav(n.menu); };
  const fullScreen = () => {
    if (typeof document === 'undefined') return;
    if (document.fullscreenElement) { void document.exitFullscreen().catch(() => setHelp(true)); return; }
    if (document.documentElement.requestFullscreen) void document.documentElement.requestFullscreen().catch(() => setHelp(true));
  };
  const setSound = (enabled: boolean) => {
    setSoundOn(enabled); setSoundPrompt(false); setStarted(true); setCentralMenuOpen(true);
    setSection(pendingSection); setTab(subtabs[pendingSection][0].id);
    const target = platformMenu.find((n) => n.section === pendingSection && n.sub === subtabs[pendingSection][0].id);
    setSelectedNav(target?.id || 'visao');
    if (enabled) { setAudioError(false); playMusic(); } else { music.current?.pause(); }
  };
  useEffect(() => { if (music.current) music.current.volume = Math.min(1,Math.max(0,volume / 100)); }, [volume]);
  useEffect(() => { if (soundPrompt) soundYesButton.current?.focus(); }, [soundPrompt]);
  useEffect(() => { if (centralMenuOpen && !soundPrompt) { document.getElementById('erm25-menu-first')?.focus(); } }, [centralMenuOpen, soundPrompt]);
  const feature = facilities.find((p) => p.number === facility) || facilities[0];
  const filtered = facilities.filter((p) => amenityGroup === 'todos' || p.category === amenityGroup);
  const images = gallery.filter((p) => p.category === tab);
  const image = images[imageIndex % Math.max(1, images.length)];
  const selected = types[selectedType];
  const setType = (type: TypeKey) => { tone(); setSelectedType(type); setSelectedEnding(types[type].endings[0]); setPlant3D(false); };
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
      </div>
      <div className="erm23-entryArea">
        <button type="button" className="erm23-startButton" onClick={() => start('localizacao')} aria-label="Iniciar experiência Easy Rota do Mar">
          <span className="erm23-startIcon"><svg className="erm28-waveIcon" width="29" height="29" viewBox="0 0 36 36" fill="none" aria-hidden="true" focusable="false"><path d="M4 13.5 C7.5 10.7 11 16.3 14.5 13.5 S21.5 10.7 25 13.5 S31.2 16.3 33 13.5"/><path d="M4 19 C7.5 16.2 11 21.8 14.5 19 S21.5 16.2 25 19 S31.2 21.8 33 19"/><path d="M4 24.5 C7.5 21.7 11 27.3 14.5 24.5 S21.5 21.7 25 24.5 S31.2 27.3 33 24.5"/></svg></span>
          <span>TOQUE PARA INICIAR A EXPERIÊNCIA</span>
          <UiIcon name="arrow" size={21}/>
        </button>
        <p className="erm23-entryNote">Descubra o Easy Rota do Mar em uma apresentação exclusiva.</p>
      </div>
      <footer className="erm23-splashFooter"><span>VIVA ALÉM DO COMUM</span><span>AMBIENTE DE HOMOLOGAÇÃO</span></footer>
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
        {!(section === 'localizacao' && tab === 'ultratour') && <nav className="erm21-subTabs" aria-label="Abas da seção">{subtabs[section].map((t) => <button key={t.id} type="button" className={tab === t.id ? 'active' : ''} onClick={() => chooseTab(t.id)}>{t.label}</button>)}</nav>}
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
              <div className="erm21-shortcuts">{platformMenu.filter((n)=>['localizacao','masterplan','plantas','galeria','videos','diferenciais'].includes(n.id)).map((n)=><button type="button" key={n.id} onClick={()=>goMenu(n)}><UiIcon name={n.icon} size={28}/><span>{n.label === 'Galeria de Imagens' ? 'Galeria' : n.label}</span></button>)}</div>
            </div>}
            {tab === 'entorno' && <div className="erm20-nearby"><SectionBanner title="ENTORNO" caption="Explore o que faz parte do dia a dia"/><div className="erm20-nearbyHero"><Photo id="hero" alt="Visão ilustrativa da região do empreendimento"/><Brand compact /></div><div className="erm20-nearbyLinks">{['Serviços', 'Comércio', 'Educação', 'Mobilidade', 'Bem-estar', 'Lazer', 'Conveniência', 'Gastronomia'].map((x) => <button key={x} onClick={() => { setMapChoice(x); chooseTab('mapa'); }} type="button">{x}</button>)}</div><p className="erm20-disclaimer">Mapa e pontos de interesse serão georreferenciados após conferência do endereço e das coordenadas oficiais.</p></div>}
            {tab === 'rotas' && <div className="erm20-mapFrame"><SectionBanner title="ROTAS" caption="Visualização do entorno"/><div className="erm20-mapGrid"><div className="erm20-mapIllustration"><div className="erm20-road roadA"/><div className="erm20-road roadB"/><div className="erm20-road roadC"/><div className="erm20-mapPin">⌖<span>EASY ROTA DO MAR</span></div></div><div className="erm20-mapDetails"><h2>O caminho que conecta você a novos momentos.</h2><p>Explore a localização na Serraria, em Maceió, e consulte rotas reais no serviço de mapas.</p><a href="https://www.google.com/maps/search/?api=1&query=Easy%20Rota%20do%20Mar%20Macei%C3%B3" target="_blank" rel="noopener noreferrer">ABRIR MAPA EXTERNO ↗</a><small>Não exibimos tempos ou distâncias não verificados.</small></div></div></div>}
            {tab === 'mapa' && <div className="erm20-mapFrame"><SectionBanner title="MAPA" caption="Pontos de interesse próximos"/><div className="erm20-mapGrid"><div className="erm20-mapIllustration"><div className="erm20-road roadA"/><div className="erm20-road roadB"/><div className="erm20-road roadC"/><div className="erm20-mapPin">⌖<span>EASY ROTA DO MAR</span></div></div><div className="erm20-mapDetails"><div className="erm20-mapCats">{['Mobilidade', 'Educação', 'Comércio', 'Serviços'].map((x) => <button key={x} className={mapChoice === x ? 'active' : ''} type="button" onClick={() => setMapChoice(x)}>{x}</button>)}</div><h3>{mapChoice}</h3><p>Os marcadores definitivos serão inseridos após a validação dos endereços e distâncias pela Rocha.</p><a href="https://www.google.com/maps/search/?api=1&query=Easy%20Rota%20do%20Mar%20Macei%C3%B3" target="_blank" rel="noopener noreferrer">CONFERIR NO GOOGLE MAPS ↗</a></div></div></div>}
          </div>}

          {section === 'lazer' && <div className="erm20-content erm20-leisure"><SectionBanner title="MASTERPLAN" caption="Um lugar completo para viver"/><div className="erm20-masterVisual erm21-realMaster"><img src={`${BRAND_ASSETS}erm-implantacao.webp`} alt="Implantação do Easy Rota do Mar extraída do book oficial"/><small>IMPLANTAÇÃO DO BOOK OFICIAL · CLIQUE NOS AMBIENTES ABAIXO PARA CONHECER</small></div><div className="erm20-masterLower"><div className="erm20-masterIndex"><div className="erm20-masterFilters">{(['todos','acessos','lazer','conveniencia','estrutura'] as Group[]).map((g) => <button key={g} type="button" className={amenityGroup === g ? 'active' : ''} onClick={() => setAmenityGroup(g)}>{groupNames[g]}</button>)}</div><div className="erm20-facilities">{filtered.map((p) => <button key={p.number} type="button" className={facility === p.number ? 'active' : ''} onClick={() => setFacility(p.number)}><b>{String(p.number).padStart(2, '0')}</b><span>{p.name}</span></button>)}</div></div><div className="erm20-masterPreview" aria-live="polite"><Photo id={feature.image || 'hero'} alt={`Imagem ilustrativa: ${feature.name}`}/><div><span>{String(feature.number).padStart(2, '0')} · {groupNames[feature.category]}</span><h3>{feature.name}</h3><small>{feature.image ? 'Perspectiva ilustrativa do material oficial' : 'Imagem de referência do empreendimento'}</small></div></div></div><p className="erm20-disclaimer">A implantação georreferenciada e os pontos posicionados exatamente na planta dependem da conversão e revisão do arquivo mestre original.</p></div>}

          {section === 'plantas' && <div className="erm20-content erm20-plans">
            {tab === 'tipologias' && <><div className="erm20-plansTitle"><SectionBanner title="PAVIMENTO TIPO"/><h2>ESCOLHA O ESPAÇO QUE COMBINA COM VOCÊ.</h2></div><div className="erm20-floorPlan"><div className="erm20-planUpper"><div className="erm20-floorBuilding">{Array.from({ length: 8 }, (_, i) => { const t=endingToType[i+1]; return <button type="button" key={i} onClick={() => { setType(t); chooseTab('plantas'); }} title={`Terminação ${i+1}: ${types[t].name}`} className={`unit unit-${t}`}><span>{String(i+1).padStart(2,'0')}</span><b>{types[t].name.toUpperCase()}</b></button>; })}<div className="erm20-floorCore">CIRCULAÇÃO</div></div></div><div className="erm20-floorTypes">{typeKeys.map((t) => <button type="button" key={t} onClick={() => { setType(t); chooseTab('plantas'); }}><span className="erm20-swatch"/><h3>{types[t].name}</h3><strong>{types[t].area}</strong><small>{types[t].rooms}</small></button>)}</div></div></>}
            {tab === 'plantas' && <><div className="erm20-plantDetailHeader"><SectionBanner title="PLANTA TIPO"/><div><h2>{selected.name.toUpperCase()}</h2><span>{selected.area}</span></div></div><div className="erm20-bigPlan"><button type="button" className="erm20-arrow left" onClick={() => stepType(-1)} aria-label="Planta anterior">‹</button><Photo id={selectedType === 'spazzio' && plant3D ? 'spazzio-3d' : selected.image} alt={`Planta ${selected.name} do Easy Rota do Mar`} fit="contain"/><button type="button" className="erm20-arrow right" onClick={() => stepType(1)} aria-label="Próxima planta">›</button></div><div className="erm20-planFooter"><div><p>Os ambientes apresentados correspondem às tipologias documentadas do Easy Rota do Mar. Imagens ilustrativas e sujeitos à confirmação do material comercial.</p><ul><li>{selected.rooms}</li><li>{selected.parking}</li><li>{selected.description}</li></ul></div><div className="erm20-apartmentPicker"><b>TORRE {tower.toUpperCase()} · TERMINAÇÕES</b><div>{Array.from({length:8},(_,i)=>i+1).map((n)=><button type="button" className={selectedEnding===n?'active':''} key={n} onClick={()=>{setSelectedEnding(n);setSelectedType(endingToType[n]);setPlant3D(false);}}>{String(n).padStart(2,'0')}</button>)}</div><small>Referência por tipo; não indica unidade disponível.</small><label><input type="checkbox" checked={plant3D} onChange={(e: ChangeEvent<HTMLInputElement>)=>setPlant3D(e.target.checked)} disabled={selectedType!=='spazzio'}/> Planta 3D (Spazzio)</label></div></div></>}
          </div>}

          {section === 'imagens' && <div className="erm20-content erm20-images"><SectionBanner title={`IMAGENS / ${tab === 'apartamentos' ? 'APARTAMENTOS' : tab === 'areas' ? 'ÁREAS COMUNS' : 'LAZER'}`}/><h2>{image?.name || 'Galeria do Easy Rota do Mar'}</h2><div className="erm20-galleryStage"><button type="button" className="erm20-galleryPrev" aria-label="Imagem anterior" onClick={() => setImageIndex((i)=>(i+images.length-1)%images.length)}>‹</button>{image && <button type="button" className="erm20-galleryPhoto" aria-label="Ampliar imagem" onClick={() => setOpenLightbox(true)}><Photo id={image.id} alt={image.name} fit={tab === 'apartamentos' ? 'contain' : 'cover'}/></button>}<button type="button" className="erm20-galleryNext" aria-label="Próxima imagem" onClick={() => setImageIndex((i)=>(i+1)%images.length)}>›</button></div><div className="erm20-galleryThumbs">{images.map((p,i)=><button type="button" key={p.id} aria-pressed={imageIndex%images.length===i} className={imageIndex%images.length===i?'active':''} onClick={()=>setImageIndex(i)}><Photo id={p.id} alt={p.name}/></button>)}</div><span className="erm20-photoCaption">Perspectivas meramente ilustrativas · {images.length} imagens</span></div>}

          {section === 'videos' && <div className="erm20-content erm20-videos"><SectionBanner title="VÍDEOS"/><div className="erm20-videoGrid"><div className="erm20-videoFocus"><div className="erm20-videoPoster"><Photo id={mediaList[videoIndex].image} alt={mediaList[videoIndex].name}/><span className="erm20-filmStatus">{tab === 'perspectivas' ? 'PERSPECTIVAS ANIMADAS' : tab === 'empreendimento' ? 'EMPREENDIMENTO' : 'SHORT VÍDEOS'}</span></div><h2>{mediaList[videoIndex].name}</h2><p>Prévia visual. O vídeo correspondente será vinculado assim que a Rocha selecionar e aprovar o arquivo original.</p></div><div className="erm20-videoList">{mediaList.map((v,i)=><button key={`${v.name}-${i}`} type="button" className={videoIndex===i?'active':''} onClick={()=>setVideoIndex(i)}><b>{String(i+1).padStart(2,'0')}</b><span>{v.name}</span></button>)}</div></div></div>}

          {section === 'ficha' && <div className="erm20-content erm20-spec"><SectionBanner title="FICHA TÉCNICA"/><div className="erm20-specHero"><Photo id="fachada" alt="Perspectiva da fachada do Easy Rota do Mar"/><div><span>CONHEÇA O PROJETO</span><h2>Um empreendimento pensado para viver <em>além do comum.</em></h2><div><b>02</b><small>Torres</small><b>208</b><small>Unidades</small><b>04</b><small>Tipologias</small></div></div></div><div className="erm20-specColumns">{typeKeys.map((k)=><article key={k}><h3>{types[k].name}</h3><strong>{types[k].area}</strong><p>{types[k].rooms}</p><p>{types[k].parking}</p><p>Terminações {types[k].endings.map((x)=>String(x).padStart(2,'0')).join(' e ')}</p><button type="button" onClick={()=>{setType(k);goto('plantas','plantas');}}>VER PLANTA ↗</button></article>)}</div><p className="erm20-disclaimer">Projeto de referência para homologação: 2 blocos, 208 apartamentos e 4 tipologias. Vagas, dados comerciais e disponibilidade devem ser confirmados com a Rocha.</p></div>}

          {section === 'simulacao' && <div className="erm20-content erm21-simulation">
            <SectionBanner title="SIMULAÇÃO" caption="Apresentação em homologação"/>
            <div className="erm21-simulationBox"><UiIcon name="calculator" size={46}/><h2>Simulação financeira</h2><p>O painel visual está preparado para receber parâmetros comerciais aprovados pela Rocha. Nenhum preço, condição ou disponibilidade foi inventado nesta versão.</p><a href={official} rel="noopener noreferrer" target="_blank">CONHECER O EMPREENDIMENTO NO SITE OFICIAL ↗</a></div>
          </div>}

          {section === 'institucional' && <div className="erm20-content erm20-institutional"><div className="erm20-institutionalHero"><Photo id="fachada" alt="Empreendimento Rocha Empreendimentos"/><div><SectionBanner title="INSTITUCIONAL"/><span className="erm20-overline">ROCHA EMPREENDIMENTOS · DESDE 2009</span><h2>HÁ HISTÓRIAS QUE SÓ O TEMPO CONSEGUE CONSTRUIR.</h2><p>Projetos que acompanham novos capítulos. O Easy Rota do Mar faz parte dessa trajetória de construir possibilidades em Alagoas.</p><div className="erm20-institutionalMetrics"><div><b>2009</b><small>Início da trajetória</small></div><div><b>17</b><small>Anos em 2026</small></div><div><b>208</b><small>Unidades Easy Rota do Mar</small></div></div><h3>Viva além do comum.</h3><p>Conheça os empreendimentos e iniciativas da Rocha.</p><a href="https://meurocha.com.br" target="_blank" rel="noopener noreferrer">SITE OFICIAL ↗</a><div className="erm20-rochaSignature">ROCHA <small>EMPREENDIMENTOS</small></div></div></div></div>}
        </div>
        <nav className="erm20-bottomTabs" aria-label="Módulos principais">{globalTabs.map((n)=><button key={n.label} className={section===n.section && (n.sub===tab || (n.menu==='plantas' && section==='plantas') || (n.menu==='galeria' && section==='imagens') || (n.menu==='masterplan' && section==='lazer')) ? 'active' : ''} type="button" onClick={()=>goGlobal(n)}><UiIcon name={n.icon} size={25}/><span>{n.label}</span></button>)}</nav>
      </section>
    </div>}

    {soundPrompt && <div className="erm20-modalBackdrop erm22-audioBackdrop"><div className="erm20-modal erm22-audioModal" role="dialog" aria-modal="true" aria-labelledby="erm20-soundTitle" aria-describedby="erm22-soundDescription"><button className="erm22-modalBack" type="button" onClick={()=>setSoundPrompt(false)} aria-label="Voltar para a abertura">×</button><div className="erm22-modalIcon"><UiIcon name="music" size={31}/></div><span className="erm22-modalEyebrow">SUA EXPERIÊNCIA, SEU RITMO</span><h2 id="erm20-soundTitle">Deseja iniciar com música?</h2><p id="erm22-soundDescription">Uma trilha instrumental original e discreta pode acompanhar sua visita. Você poderá desligá-la a qualquer momento.</p><button ref={soundYesButton} type="button" className="erm22-modalPrimary" onClick={()=>setSound(true)}><UiIcon name="music" size={19}/> ENTRAR COM MÚSICA <UiIcon name="arrow" size={18}/></button><button type="button" className="erm22-modalSecondary" onClick={()=>setSound(false)}><UiIcon name="mute" size={19}/> ENTRAR SEM MÚSICA <UiIcon name="arrow" size={18}/></button><small>Áudio opcional · Sem reprodução automática · Volume ajustável</small></div></div>}
    {help && <div className="erm20-modalBackdrop"><div className="erm20-modal" role="dialog" aria-modal="true" aria-labelledby="erm20-helpTitle"><span>◇</span><h2 id="erm20-helpTitle">SOBRE ESTA EXPERIÊNCIA</h2><p>Réplica estrutural de homologação baseada na navegação apresentada em vídeo. Cores e empreendimento adaptados para o Easy Rota do Mar. Fotografia 360° real, mapa georreferenciado e vídeos originais serão adicionados após validação dos arquivos.</p><button type="button" onClick={()=>setHelp(false)}>FECHAR</button><a href={official} target="_blank" rel="noopener noreferrer">CONSULTAR MATERIAL OFICIAL ↗</a></div></div>}
    {openLightbox && image && <div className="erm20-lightbox" role="dialog" aria-modal="true" aria-label={`Imagem ampliada ${image.name}`}><button type="button" className="erm20-closeLightbox" onClick={()=>setOpenLightbox(false)} aria-label="Fechar imagem ampliada">×</button><button type="button" aria-label="Imagem anterior" onClick={()=>setImageIndex((i)=>(i+images.length-1)%images.length)}>‹</button><Photo id={image.id} alt={image.name} fit="contain"/><button type="button" aria-label="Próxima imagem" onClick={()=>setImageIndex((i)=>(i+1)%images.length)}>›</button><span>{image.name}</span></div>}
    <span className="erm20-srOnly" aria-live="polite">{started ? `Seção ${sections.find((s)=>s.id===section)?.label}, aba ${subtabs[section].find((t)=>t.id===tab)?.label}` : 'Tela inicial'}</span>
  </main>;
}
