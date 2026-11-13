'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ChangeEvent } from 'react';

type Section = 'localizacao' | 'lazer' | 'plantas' | 'imagens' | 'videos' | 'ficha' | 'institucional';
type TypeKey = 'slim' | 'premium' | 'master' | 'spazzio';
type Look = 'diurna' | 'entardecer' | 'noturna';
type Group = 'todos' | 'acessos' | 'lazer' | 'conveniencia' | 'estrutura';

type Facility = { number: number; name: string; category: Exclude<Group, 'todos'>; image?: string };
const media = (id: string) => `/api/experiencia/easy-rota-do-mar/media/${id}`;
const official = 'https://meurocha.com.br/imoveis/easy-rota-do-mar';
const palette = { dark: '#762D39', deep: '#4E202D', accent: '#BE6859', light: '#F8F2E8' };
const sections: { id: Section; label: string; glyph: string }[] = [
  { id: 'localizacao', label: 'Localização', glyph: '⌖' },
  { id: 'lazer', label: 'Lazer', glyph: '▦' },
  { id: 'plantas', label: 'Plantas', glyph: '▧' },
  { id: 'imagens', label: 'Imagens', glyph: '▣' },
  { id: 'videos', label: 'Vídeos', glyph: '▤' },
  { id: 'ficha', label: 'Ficha Técnica', glyph: '▤' },
  { id: 'institucional', label: 'Institucional', glyph: '♙' },
];
const subtabs: Record<Section, { id: string; label: string }[]> = {
  localizacao: [{ id: 'ultratour', label: 'Ultratour' }, { id: 'entorno', label: 'Entorno' }, { id: 'rotas', label: 'Rotas' }, { id: 'mapa', label: 'Mapa' }],
  lazer: [{ id: 'implantacao', label: 'Masterplan' }, { id: 'espacos', label: 'Ambientes' }],
  plantas: [{ id: 'tipologias', label: 'Tipologias' }, { id: 'plantas', label: 'Plantas' }],
  imagens: [{ id: 'apartamentos', label: 'Apartamentos' }, { id: 'areas', label: 'Áreas comuns' }, { id: 'lazer', label: 'Lazer' }],
  videos: [{ id: 'perspectivas', label: 'Perspectivas animadas' }, { id: 'empreendimento', label: 'Empreendimento' }, { id: 'shorts', label: 'Short vídeos' }],
  ficha: [{ id: 'ficha', label: 'Ficha técnica' }],
  institucional: [{ id: 'historia', label: 'Nossa história' }],
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
    {!logoFailed && <img src="/assets/img/logo_easy_rota_mar_r11.webp" alt="Easy Rota do Mar" onError={() => setLogoFailed(true)} />}
    {logoFailed && <span className="erm20-brandFallback"><b>EASY</b><strong>ROTA DO MAR</strong></span>}
    <small>ROCHA EMPREENDIMENTOS</small>
  </div>;
}

function SectionBanner({ title, caption }: { title: string; caption?: string }) {
  return <div className="erm20-sectionBanner"><span>{title}</span>{caption && <small>{caption}</small>}</div>;
}

export default function EasyRotaClient() {
  const [started, setStarted] = useState(false);
  const [soundPrompt, setSoundPrompt] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [volume, setVolume] = useState(35);
  const audio = useRef<AudioContext | null>(null);
  const [section, setSection] = useState<Section>('localizacao');
  const [tab, setTab] = useState('ultratour');
  const [menuOpen, setMenuOpen] = useState(false);
  const [help, setHelp] = useState(false);
  const [tower, setTower] = useState<'norte' | 'sul'>('norte');
  const [look, setLook] = useState<Look>('diurna');
  const [height, setHeight] = useState(12);
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
  };
  const start = () => { setStarted(true); setSoundPrompt(true); };
  const setSound = (enabled: boolean) => { setSoundOn(enabled); setSoundPrompt(false); };
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

  const changeTab = (idx: number) => { const tabs = subtabs[section]; chooseTab(tabs[(idx + tabs.length) % tabs.length].id); };
  const currentTabIndex = subtabs[section].findIndex((t) => t.id === tab);
  const heroPhoto = look === 'diurna' ? 'hero' : look === 'entardecer' ? 'fachada' : 'hero';
  const showLiveMarker = 'Reprodução visual baseada no vídeo. Imagem 360° e orientação geográfica real exigem arquivos próprios de captura.';

  return <main className="erm20" style={{ '--erm-dark': palette.dark, '--erm-deep': palette.deep, '--erm-accent': palette.accent, '--erm-cream': palette.light } as CSSProperties}>
    {!started && <div className="erm20-splash">
      <Brand /><div className="erm20-splashLinks" aria-label="Acesso aos módulos">
        {sections.map((s) => <button key={s.id} onClick={() => { setSection(s.id); setTab(subtabs[s.id][0].id); start(); }} type="button"><span className="erm20-splashGlyph">{s.glyph}</span>{s.label}</button>)}
      </div>
      <div className="erm20-splashFooter"><span>✧</span><span>ROCHA</span><span>◇</span></div>
      <div className="erm20-splashLabel">Experiência imobiliária · Ambiente de homologação</div>
    </div>}

    {started && <div className="erm20-shell">
      <button className="erm20-mobileMenu" type="button" aria-label="Abrir ou fechar menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>☰ <span>Easy Rota do Mar</span></button>
      {menuOpen && <button className="erm20-shade" type="button" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}
      <aside className={`erm20-sidebar ${menuOpen ? 'isOpen' : ''}`}>
        <button type="button" className="erm20-brandLink" onClick={() => { setStarted(false); setMenuOpen(false); }} aria-label="Voltar à entrada"><Brand /></button>
        <nav className="erm20-sideNav" aria-label="Menu principal da plataforma">
          {sections.map((s) => <button type="button" key={s.id} onClick={() => goto(s.id)} className={section === s.id ? 'active' : ''} aria-current={section === s.id ? 'page' : undefined}><span>{s.glyph}</span>{s.label}</button>)}
        </nav>
        <div className="erm20-sideTools">
          <label className="erm20-volume"><span className="erm20-srOnly">Volume do áudio de interface</span><input type="range" min="0" max="100" value={volume} onChange={(e: ChangeEvent<HTMLInputElement>) => setVolume(Number(e.target.value))} /></label>
          <div className="erm20-toolIcons"><button onClick={() => { setStarted(false); setMenuOpen(false); }} aria-label="Página inicial" type="button">⌂</button><button onClick={() => setSoundOn((s) => !s)} aria-label={soundOn ? 'Desligar som' : 'Ligar som'} title="Som de interface" type="button">{soundOn ? '◖))' : '◖×'}</button><button type="button" aria-label="Ajuda" onClick={() => setHelp(true)}>◇</button></div>
        </div>
      </aside>

      <section className="erm20-main">
        <div className="erm20-panel" key={section}>
          {section === 'localizacao' && <div className="erm20-content erm20-location">
            {tab === 'ultratour' && <div className="erm20-immersive" role="region" aria-label="Visão aérea de referência do empreendimento">
              <div className={`erm20-immersivePhoto look-${look}`} style={{ transform: `scale(${zoom})`, '--pan': `${pan}%` } as CSSProperties}><Photo id={heroPhoto} alt="Imagem geral ilustrativa do Easy Rota do Mar" className="erm20-immersiveImage" /></div>
              <div className="erm20-immersiveTint" /><Brand compact />
              <div className="erm20-viewControls"><strong>Vista Geral {look === 'diurna' ? 'Diurna' : look === 'entardecer' ? 'Entardecer' : 'Noturna'}</strong><div><button className={tower === 'norte' ? 'active' : ''} onClick={() => setTower('norte')} type="button">Torre Norte</button><button className={tower === 'sul' ? 'active' : ''} onClick={() => setTower('sul')} type="button">Torre Sul</button></div></div>
              <div className="erm20-categoryList">{['Principais', 'Gastronomia', 'Educação', 'Compras', 'Serviços', 'Saúde', 'Esporte'].map((c) => <button type="button" onClick={() => setPoiGroup(c)} className={poiGroup === c ? 'active' : ''} key={c}><span>•</span>{c}</button>)}</div>
              <div className="erm20-sceneLabel"><span>⌖</span><b>Easy Rota do Mar</b><small>Região da Serraria · Maceió</small></div>
              <div className="erm20-height">{[16, 14, 12, 10].map((h) => <button key={h} type="button" className={height === h ? 'active' : ''} onClick={() => setHeight(h)} title="Nível de navegação visual de referência">{h}°</button>)}</div>
              <div className="erm20-miniPlan"><div className="erm20-miniPlanHead">N <span>TORRE {tower === 'norte' ? 'NORTE' : 'SUL'}</span></div><div className="erm20-miniPlanCells">{Array.from({ length: 8 }, (_, i) => <button key={i} type="button" className={selectedEnding === i + 1 ? 'active' : ''} title={`Terminação ${String(i+1).padStart(2, '0')}: ${types[endingToType[i+1]].name}`} onClick={() => { setSelectedEnding(i+1); setSelectedType(endingToType[i+1]); goto('plantas', 'plantas'); }}>{String(i+1).padStart(2, '0')}<span>{types[endingToType[i+1]].name}</span></button>)}</div></div>
              <div className="erm20-dayControls"><button type="button" className={look === 'diurna' ? 'active' : ''} onClick={() => setLook('diurna')} title="Dia">☼</button><button type="button" className={look === 'entardecer' ? 'active' : ''} onClick={() => setLook('entardecer')} title="Fim de tarde">◕</button><button type="button" className={look === 'noturna' ? 'active' : ''} onClick={() => setLook('noturna')} title="Noite">☾</button></div>
              <div className="erm20-zoom"><button type="button" aria-label="Aumentar zoom" onClick={() => setZoom((z) => Math.min(1.7, +(z+.1).toFixed(2)))}>+</button><button type="button" aria-label="Diminuir zoom" onClick={() => setZoom((z) => Math.max(1, +(z-.1).toFixed(2)))}>−</button></div>
              <input className="erm20-pan" aria-label="Explorar horizontalmente a imagem" type="range" min="0" max="100" value={pan} onChange={(e: ChangeEvent<HTMLInputElement>) => setPan(Number(e.target.value))} />
              <span className="erm20-sceneDisclaimer" title={showLiveMarker}>VISÃO ILUSTRATIVA · 360° REAL PENDENTE</span>
            </div>}
            {tab === 'entorno' && <div className="erm20-nearby"><SectionBanner title="ENTORNO" caption="Explore o que faz parte do dia a dia"/><div className="erm20-nearbyHero"><Photo id="hero" alt="Visão ilustrativa da região do empreendimento"/><Brand compact /></div><div className="erm20-nearbyLinks">{['Serviços', 'Comércio', 'Educação', 'Mobilidade', 'Bem-estar', 'Lazer', 'Conveniência', 'Gastronomia'].map((x) => <button key={x} onClick={() => { setMapChoice(x); chooseTab('mapa'); }} type="button">{x}</button>)}</div><p className="erm20-disclaimer">Mapa e pontos de interesse serão georreferenciados após conferência do endereço e das coordenadas oficiais.</p></div>}
            {tab === 'rotas' && <div className="erm20-mapFrame"><SectionBanner title="ROTAS" caption="Visualização do entorno"/><div className="erm20-mapGrid"><div className="erm20-mapIllustration"><div className="erm20-road roadA"/><div className="erm20-road roadB"/><div className="erm20-road roadC"/><div className="erm20-mapPin">⌖<span>EASY ROTA DO MAR</span></div></div><div className="erm20-mapDetails"><h2>O caminho que conecta você a novos momentos.</h2><p>Explore a localização na Serraria, em Maceió, e consulte rotas reais no serviço de mapas.</p><a href="https://www.google.com/maps/search/?api=1&query=Easy%20Rota%20do%20Mar%20Macei%C3%B3" target="_blank" rel="noopener noreferrer">ABRIR MAPA EXTERNO ↗</a><small>Não exibimos tempos ou distâncias não verificados.</small></div></div></div>}
            {tab === 'mapa' && <div className="erm20-mapFrame"><SectionBanner title="MAPA" caption="Pontos de interesse próximos"/><div className="erm20-mapGrid"><div className="erm20-mapIllustration"><div className="erm20-road roadA"/><div className="erm20-road roadB"/><div className="erm20-road roadC"/><div className="erm20-mapPin">⌖<span>EASY ROTA DO MAR</span></div></div><div className="erm20-mapDetails"><div className="erm20-mapCats">{['Mobilidade', 'Educação', 'Comércio', 'Serviços'].map((x) => <button key={x} className={mapChoice === x ? 'active' : ''} type="button" onClick={() => setMapChoice(x)}>{x}</button>)}</div><h3>{mapChoice}</h3><p>Os marcadores definitivos serão inseridos após a validação dos endereços e distâncias pela Rocha.</p><a href="https://www.google.com/maps/search/?api=1&query=Easy%20Rota%20do%20Mar%20Macei%C3%B3" target="_blank" rel="noopener noreferrer">CONFERIR NO GOOGLE MAPS ↗</a></div></div></div>}
          </div>}

          {section === 'lazer' && <div className="erm20-content erm20-leisure"><SectionBanner title="MASTERPLAN" caption="Um lugar completo para viver"/><div className="erm20-masterVisual"><div className="erm20-masterRing"><div className="erm20-towerIllustration one">TORRE NORTE</div><div className="erm20-facilityIllustration"><span>LAZER</span><span>CONVIVÊNCIA</span><span>ESTRUTURA</span><span>SERVIÇOS</span></div><div className="erm20-towerIllustration two">TORRE SUL</div></div><small>ILUSTRAÇÃO DE ORGANIZAÇÃO · NÃO REPRESENTA POSIÇÕES OU DIMENSÕES REAIS</small></div><div className="erm20-masterLower"><div className="erm20-masterIndex"><div className="erm20-masterFilters">{(['todos','acessos','lazer','conveniencia','estrutura'] as Group[]).map((g) => <button key={g} type="button" className={amenityGroup === g ? 'active' : ''} onClick={() => setAmenityGroup(g)}>{groupNames[g]}</button>)}</div><div className="erm20-facilities">{filtered.map((p) => <button key={p.number} type="button" className={facility === p.number ? 'active' : ''} onClick={() => setFacility(p.number)}><b>{String(p.number).padStart(2, '0')}</b><span>{p.name}</span></button>)}</div></div><div className="erm20-masterPreview" aria-live="polite"><Photo id={feature.image || 'hero'} alt={`Imagem ilustrativa: ${feature.name}`}/><div><span>{String(feature.number).padStart(2, '0')} · {groupNames[feature.category]}</span><h3>{feature.name}</h3><small>{feature.image ? 'Perspectiva ilustrativa do material oficial' : 'Imagem de referência do empreendimento'}</small></div></div></div><p className="erm20-disclaimer">A implantação georreferenciada e os pontos posicionados exatamente na planta dependem da conversão e revisão do arquivo mestre original.</p></div>}

          {section === 'plantas' && <div className="erm20-content erm20-plans">
            {tab === 'tipologias' && <><div className="erm20-plansTitle"><SectionBanner title="PAVIMENTO TIPO"/><h2>ESCOLHA O ESPAÇO QUE COMBINA COM VOCÊ.</h2></div><div className="erm20-floorPlan"><div className="erm20-planUpper"><div className="erm20-floorBuilding">{Array.from({ length: 8 }, (_, i) => { const t=endingToType[i+1]; return <button type="button" key={i} onClick={() => { setType(t); chooseTab('plantas'); }} title={`Terminação ${i+1}: ${types[t].name}`} className={`unit unit-${t}`}><span>{String(i+1).padStart(2,'0')}</span><b>{types[t].name.toUpperCase()}</b></button>; })}<div className="erm20-floorCore">CIRCULAÇÃO</div></div></div><div className="erm20-floorTypes">{typeKeys.map((t) => <button type="button" key={t} onClick={() => { setType(t); chooseTab('plantas'); }}><span className="erm20-swatch"/><h3>{types[t].name}</h3><strong>{types[t].area}</strong><small>{types[t].rooms}</small></button>)}</div></div></>}
            {tab === 'plantas' && <><div className="erm20-plantDetailHeader"><SectionBanner title="PLANTA TIPO"/><div><h2>{selected.name.toUpperCase()}</h2><span>{selected.area}</span></div></div><div className="erm20-bigPlan"><button type="button" className="erm20-arrow left" onClick={() => stepType(-1)} aria-label="Planta anterior">‹</button><Photo id={selectedType === 'spazzio' && plant3D ? 'spazzio-3d' : selected.image} alt={`Planta ${selected.name} do Easy Rota do Mar`} fit="contain"/><button type="button" className="erm20-arrow right" onClick={() => stepType(1)} aria-label="Próxima planta">›</button></div><div className="erm20-planFooter"><div><p>Os ambientes apresentados correspondem às tipologias documentadas do Easy Rota do Mar. Imagens ilustrativas e sujeitos à confirmação do material comercial.</p><ul><li>{selected.rooms}</li><li>{selected.parking}</li><li>{selected.description}</li></ul></div><div className="erm20-apartmentPicker"><b>TORRE {tower.toUpperCase()} · TERMINAÇÕES</b><div>{Array.from({length:8},(_,i)=>i+1).map((n)=><button type="button" className={selectedEnding===n?'active':''} key={n} onClick={()=>{setSelectedEnding(n);setSelectedType(endingToType[n]);setPlant3D(false);}}>{String(n).padStart(2,'0')}</button>)}</div><small>Referência por tipo; não indica unidade disponível.</small><label><input type="checkbox" checked={plant3D} onChange={(e: ChangeEvent<HTMLInputElement>)=>setPlant3D(e.target.checked)} disabled={selectedType!=='spazzio'}/> Planta 3D (Spazzio)</label></div></div></>}
          </div>}

          {section === 'imagens' && <div className="erm20-content erm20-images"><SectionBanner title={`IMAGENS / ${tab === 'apartamentos' ? 'APARTAMENTOS' : tab === 'areas' ? 'ÁREAS COMUNS' : 'LAZER'}`}/><h2>{image?.name || 'Galeria do Easy Rota do Mar'}</h2><div className="erm20-galleryStage"><button type="button" className="erm20-galleryPrev" aria-label="Imagem anterior" onClick={() => setImageIndex((i)=>(i+images.length-1)%images.length)}>‹</button>{image && <button type="button" className="erm20-galleryPhoto" aria-label="Ampliar imagem" onClick={() => setOpenLightbox(true)}><Photo id={image.id} alt={image.name} fit={tab === 'apartamentos' ? 'contain' : 'cover'}/></button>}<button type="button" className="erm20-galleryNext" aria-label="Próxima imagem" onClick={() => setImageIndex((i)=>(i+1)%images.length)}>›</button></div><div className="erm20-galleryThumbs">{images.map((p,i)=><button type="button" key={p.id} aria-pressed={imageIndex%images.length===i} className={imageIndex%images.length===i?'active':''} onClick={()=>setImageIndex(i)}><Photo id={p.id} alt={p.name}/></button>)}</div><span className="erm20-photoCaption">Perspectivas meramente ilustrativas · {images.length} imagens</span></div>}

          {section === 'videos' && <div className="erm20-content erm20-videos"><SectionBanner title="VÍDEOS"/><div className="erm20-videoGrid"><div className="erm20-videoFocus"><div className="erm20-videoPoster"><Photo id={mediaList[videoIndex].image} alt={mediaList[videoIndex].name}/><span className="erm20-filmStatus">{tab === 'perspectivas' ? 'PERSPECTIVAS ANIMADAS' : tab === 'empreendimento' ? 'EMPREENDIMENTO' : 'SHORT VÍDEOS'}</span></div><h2>{mediaList[videoIndex].name}</h2><p>Prévia visual. O vídeo correspondente será vinculado assim que a Rocha selecionar e aprovar o arquivo original.</p></div><div className="erm20-videoList">{mediaList.map((v,i)=><button key={`${v.name}-${i}`} type="button" className={videoIndex===i?'active':''} onClick={()=>setVideoIndex(i)}><b>{String(i+1).padStart(2,'0')}</b><span>{v.name}</span></button>)}</div></div></div>}

          {section === 'ficha' && <div className="erm20-content erm20-spec"><SectionBanner title="FICHA TÉCNICA"/><div className="erm20-specHero"><Photo id="fachada" alt="Perspectiva da fachada do Easy Rota do Mar"/><div><span>CONHEÇA O PROJETO</span><h2>Um empreendimento pensado para viver <em>além do comum.</em></h2><div><b>02</b><small>Torres</small><b>208</b><small>Unidades</small><b>04</b><small>Tipologias</small></div></div></div><div className="erm20-specColumns">{typeKeys.map((k)=><article key={k}><h3>{types[k].name}</h3><strong>{types[k].area}</strong><p>{types[k].rooms}</p><p>{types[k].parking}</p><p>Terminações {types[k].endings.map((x)=>String(x).padStart(2,'0')).join(' e ')}</p><button type="button" onClick={()=>{setType(k);goto('plantas','plantas');}}>VER PLANTA ↗</button></article>)}</div><p className="erm20-disclaimer">Projeto de referência para homologação: 2 blocos, 208 apartamentos e 4 tipologias. Vagas, dados comerciais e disponibilidade devem ser confirmados com a Rocha.</p></div>}

          {section === 'institucional' && <div className="erm20-content erm20-institutional"><div className="erm20-institutionalHero"><Photo id="fachada" alt="Empreendimento Rocha Empreendimentos"/><div><SectionBanner title="INSTITUCIONAL"/><span className="erm20-overline">ROCHA EMPREENDIMENTOS · DESDE 2009</span><h2>HÁ HISTÓRIAS QUE SÓ O TEMPO CONSEGUE CONSTRUIR.</h2><p>Projetos que acompanham novos capítulos. O Easy Rota do Mar faz parte dessa trajetória de construir possibilidades em Alagoas.</p><div className="erm20-institutionalMetrics"><div><b>2009</b><small>Início da trajetória</small></div><div><b>17</b><small>Anos em 2026</small></div><div><b>208</b><small>Unidades Easy Rota do Mar</small></div></div><h3>Viva além do comum.</h3><p>Conheça os empreendimentos e iniciativas da Rocha.</p><a href="https://meurocha.com.br" target="_blank" rel="noopener noreferrer">SITE OFICIAL ↗</a><div className="erm20-rochaSignature">ROCHA <small>EMPREENDIMENTOS</small></div></div></div></div>}
        </div>
        <nav className="erm20-bottomTabs" aria-label="Navegação da seção">{subtabs[section].map((t,i)=><button type="button" key={t.id} className={tab===t.id?'active':''} aria-current={tab===t.id?'page':undefined} onClick={()=>chooseTab(t.id)}>{t.label}</button>)}{subtabs[section].length>1&&<div className="erm20-bottomArrows"><button type="button" onClick={()=>changeTab(currentTabIndex-1)} aria-label="Aba anterior">‹</button><button type="button" onClick={()=>changeTab(currentTabIndex+1)} aria-label="Próxima aba">›</button></div>}</nav>
      </section>
    </div>}

    {soundPrompt && <div className="erm20-modalBackdrop"><div className="erm20-modal" role="dialog" aria-modal="true" aria-labelledby="erm20-soundTitle"><span>✦</span><h2 id="erm20-soundTitle">EXPERIÊNCIA COM SOM</h2><p>Esta apresentação oferece sons discretos de navegação. Como prefere continuar?</p><button type="button" onClick={()=>setSound(true)}>ATIVAR O SOM</button><button type="button" onClick={()=>setSound(false)}>CONTINUAR SEM SOM</button></div></div>}
    {help && <div className="erm20-modalBackdrop"><div className="erm20-modal" role="dialog" aria-modal="true" aria-labelledby="erm20-helpTitle"><span>◇</span><h2 id="erm20-helpTitle">SOBRE ESTA EXPERIÊNCIA</h2><p>Réplica estrutural de homologação baseada na navegação apresentada em vídeo. Cores e empreendimento adaptados para o Easy Rota do Mar. Fotografia 360° real, mapa georreferenciado e vídeos originais serão adicionados após validação dos arquivos.</p><button type="button" onClick={()=>setHelp(false)}>FECHAR</button><a href={official} target="_blank" rel="noopener noreferrer">CONSULTAR MATERIAL OFICIAL ↗</a></div></div>}
    {openLightbox && image && <div className="erm20-lightbox" role="dialog" aria-modal="true" aria-label={`Imagem ampliada ${image.name}`}><button type="button" className="erm20-closeLightbox" onClick={()=>setOpenLightbox(false)} aria-label="Fechar imagem ampliada">×</button><button type="button" aria-label="Imagem anterior" onClick={()=>setImageIndex((i)=>(i+images.length-1)%images.length)}>‹</button><Photo id={image.id} alt={image.name} fit="contain"/><button type="button" aria-label="Próxima imagem" onClick={()=>setImageIndex((i)=>(i+1)%images.length)}>›</button><span>{image.name}</span></div>}
    <span className="erm20-srOnly" aria-live="polite">{started ? `Seção ${sections.find((s)=>s.id===section)?.label}, aba ${subtabs[section].find((t)=>t.id===tab)?.label}` : 'Tela inicial'}</span>
  </main>;
}
