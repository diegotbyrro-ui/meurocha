'use client';

import { createPortal } from 'react-dom';
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';

// R88 — ferramenta in-page. Não altera geometria, mapa 3D, login ou banco.
// As coordenadas são relativas ao próprio palco visual, que recebe as mesmas
// transformações CSS (pan/zoom) do mapa/plantas quando a camada é portaled.
export type ContextoR88 = { id: string; titulo: string; seletor: string; transformacao?: string };
export type PontoR88 = { x: number; y: number };
export type MarcacaoR88 = {
  id: string;
  contexto: string;
  titulo: string;
  texto: string;
  origem: PontoR88;
  destino: PontoR88;
  criado: string;
};

type Props = {
  contexto: ContextoR88 | null;
  aberto: boolean;
  onAbrirChange: (aberto: boolean) => void;
  onNavegar: (nota: MarcacaoR88) => void;
};
const CHAVE = 'meurocha-r88-setas-v1';
const LIMITE = 120;
const LIMITE_TEXTO = 400;
const validId = /^(?:lazer:(?:implantacao|pavimento)|plantas:tipologias|plantas:detalhe:[1-8]:(?:3d|tecnica)|imagens:(?:areas|lazer|apartamentos):[a-z0-9-]+)$/;

function limite(v: number) { return Math.max(0, Math.min(1, v)); }
function pontoSeguro(value: unknown): PontoR88 | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Partial<PontoR88>;
  if (typeof v.x !== 'number' || typeof v.y !== 'number' || !Number.isFinite(v.x) || !Number.isFinite(v.y)) return null;
  return { x: limite(v.x), y: limite(v.y) };
}
function validar(value: unknown): MarcacaoR88[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, LIMITE).flatMap((n): MarcacaoR88[] => {
    if (!n || typeof n !== 'object') return [];
    const m = n as Partial<MarcacaoR88>;
    if (typeof m.id !== 'string' || !/^[a-zA-Z0-9_-]{6,100}$/.test(m.id) ||
      typeof m.contexto !== 'string' || !validId.test(m.contexto) ||
      !m.texto || typeof m.texto !== 'string' ||
      typeof m.titulo !== 'string' || typeof m.criado !== 'string') return [];
    const origem = pontoSeguro(m.origem); const destino = pontoSeguro(m.destino);
    if (!origem || !destino) return [];
    return [{ id: m.id, contexto: m.contexto, titulo: m.titulo.slice(0, 90),
      texto: m.texto.trim().slice(0, LIMITE_TEXTO), origem, destino, criado: m.criado.slice(0, 40) }];
  });
}
function ler() {
  try {
    const raw = localStorage.getItem(CHAVE);
    return raw && raw.length < 110_000 ? validar(JSON.parse(raw) as unknown) : [];
  } catch { return []; }
}
function coordinate(e: PointerEvent<SVGSVGElement>): PontoR88 {
  const r = e.currentTarget.getBoundingClientRect();
  return { x: limite((e.clientX - r.left) / Math.max(1, r.width)), y: limite((e.clientY - r.top) / Math.max(1, r.height)) };
}
function distance(a: PontoR88, b: PontoR88) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export default function AnotacoesIntegradas({ contexto, aberto, onAbrirChange, onNavegar }: Props) {
  const [notas, setNotas] = useState<MarcacaoR88[]>([]);
  const [pronto, setPronto] = useState(false);
  const [alvo, setAlvo] = useState<HTMLElement | null>(null);
  const [modo, setModo] = useState<'ver' | 'seta'>('ver');
  const [rascunho, setRascunho] = useState<{ origem: PontoR88; destino: PontoR88 } | null>(null);
  const [campo, setCampo] = useState('');
  const [formulario, setFormulario] = useState(false);
  const [reposicionar, setReposicionar] = useState<string | null>(null);
  const [editar, setEditar] = useState<string | null>(null);
  const [destaque, setDestaque] = useState<string | null>(null);
  const [aviso, setAviso] = useState('');
  const desenhando = useRef(false);
  const areaTexto = useRef<HTMLTextAreaElement | null>(null);
  const atuais = useMemo(() => notas.filter(n => n.contexto === contexto?.id), [notas, contexto?.id]);

  useEffect(() => { setNotas(ler()); setPronto(true); }, []);
  useEffect(() => {
    if (!pronto) return;
    try { localStorage.setItem(CHAVE, JSON.stringify(notas)); }
    catch { setAviso('Sem espaço para salvar neste navegador. Exporte suas observações antes de sair.'); }
  }, [notas, pronto]);

  useEffect(() => {
    setModo('ver'); setRascunho(null); setFormulario(false); setReposicionar(null); setEditar(null);
    if (!contexto) { setAlvo(null); return; }
    let current: HTMLElement | null = null;
    const raf = window.requestAnimationFrame(() => {
      current = document.querySelector<HTMLElement>(contexto.seletor);
      current?.classList.add('erm88-ancora');
      setAlvo(current);
    });
    return () => {
      window.cancelAnimationFrame(raf);
      current?.classList.remove('erm88-ancora');
    };
  }, [contexto?.id, contexto?.seletor]); // A troca de imagem desmonta a camada antiga.

  useEffect(() => {
    if (!formulario) return;
    const raf = window.requestAnimationFrame(() => areaTexto.current?.focus());
    return () => window.cancelAnimationFrame(raf);
  }, [formulario]);
  useEffect(() => {
    if (!aberto) { setModo('ver'); setRascunho(null); setFormulario(false); setReposicionar(null); }
  }, [aberto]);
  useEffect(() => {
    if (!aberto) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (formulario || modo === 'seta') { setFormulario(false); setModo('ver'); setRascunho(null); setReposicionar(null); }
      else onAbrirChange(false);
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [aberto, formulario, modo, onAbrirChange]);

  const guardar = useCallback(() => {
    if (!contexto || !rascunho || !campo.trim()) return;
    const texto = campo.trim().slice(0, LIMITE_TEXTO);
    if (reposicionar) {
      setNotas(prev => prev.map(n => n.id === reposicionar
        ? { ...n, origem: rascunho.origem, destino: rascunho.destino, texto } : n));
    } else {
      if (notas.length >= LIMITE) { setAviso('Limite de 120 observações atingido. Exclua algumas antes de adicionar.'); return; }
      const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID() : `nota_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
      setNotas(prev => [...prev, { id, contexto: contexto.id, titulo: contexto.titulo, texto,
        origem: rascunho.origem, destino: rascunho.destino, criado: new Date().toISOString() }]);
      setDestaque(id);
    }
    setCampo(''); setRascunho(null); setFormulario(false); setReposicionar(null); setModo('ver');
    setAviso('Observação salva neste navegador.');
  }, [contexto, rascunho, campo, reposicionar, notas.length]);

  const iniciarSeta = (id?: string) => {
    setReposicionar(id || null);
    const existente = notas.find(n => n.id === id);
    setCampo(existente?.texto ?? ''); setRascunho(null); setFormulario(false); setModo('seta');
    setAviso(id ? 'Arraste para redesenhar a seta desta observação.' : 'Clique e arraste sobre a imagem para desenhar a seta.');
  };
  const inicio = (event: PointerEvent<SVGSVGElement>) => {
    if (modo !== 'seta' || !contexto) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault(); event.stopPropagation(); desenhando.current = true;
    const p = coordinate(event);
    setRascunho({ origem: p, destino: p });
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const mover = (event: PointerEvent<SVGSVGElement>) => {
    if (!desenhando.current) return;
    event.preventDefault(); event.stopPropagation(); const p = coordinate(event);
    setRascunho(prev => prev ? { ...prev, destino: p } : null);
  };
  const terminar = (event: PointerEvent<SVGSVGElement>) => {
    if (!desenhando.current) return;
    event.preventDefault(); event.stopPropagation(); desenhando.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const p = coordinate(event);
    if (!rascunho || distance(rascunho.origem, p) < 0.025) {
      setAviso('Arraste um pouco mais para indicar o sentido da seta.');
      setRascunho(null);
      return;
    }
    setRascunho({ ...rascunho, destino: p });
    setFormulario(true);
  };
  const cancelarArraste = (event: PointerEvent<SVGSVGElement>) => {
    event.stopPropagation();
    desenhando.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setRascunho(null);
  };
  const mostrar = (n: MarcacaoR88) => {
    setDestaque(n.id); setEditar(null); setModo('ver');
    if (n.contexto !== contexto?.id) onNavegar(n);
    else alvo?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };
  const salvarEdicao = (id: string) => {
    if (!campo.trim()) return;
    setNotas(prev => prev.map(n => n.id === id ? { ...n, texto: campo.trim().slice(0, LIMITE_TEXTO) } : n));
    setEditar(null); setCampo(''); setAviso('Observação atualizada.');
  };
  const excluir = (id: string) => {
    if (!window.confirm('Excluir esta anotação?')) return;
    setNotas(prev => prev.filter(n => n.id !== id)); setEditar(null);
    if (destaque === id) setDestaque(null);
  };
  const exportar = () => {
    const blob = new Blob([JSON.stringify({ versao: 1, projeto: 'Easy Rota do Mar', anotacoes: notas }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'easy-rota-do-mar-anotacoes.json';
    document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <>
    {alvo && contexto && createPortal(
      <svg className={`erm88-camada ${aberto && modo === 'seta' ? 'erm88-desenhar' : ''}`}
        viewBox="0 0 1000 1000" preserveAspectRatio="none" style={contexto.transformacao ? { transform: contexto.transformacao } : undefined} aria-label="Setas e anotações sobre a imagem"
        onPointerDown={inicio} onPointerMove={mover} onPointerUp={terminar} onPointerCancel={cancelarArraste}
        onClick={event => { if (modo === 'seta') { event.preventDefault(); event.stopPropagation(); } }}>
        <defs><marker id="erm88-ponta" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto" markerUnits="strokeWidth">
          <path d="M0 0 L5 2.5 L0 5 Z" fill="#f43948" />
        </marker></defs>
        {atuais.map((n,i) => <g key={n.id} className={destaque === n.id ? 'erm88-destaque' : ''}>
          <line className="erm88-seta" x1={n.origem.x*1000} y1={n.origem.y*1000}
            x2={n.destino.x*1000} y2={n.destino.y*1000} markerEnd="url(#erm88-ponta)" />
          <circle cx={n.origem.x*1000} cy={n.origem.y*1000} r="17" fill="#f43948" stroke="white" strokeWidth="3"/>
          <text x={n.origem.x*1000} y={n.origem.y*1000+6} textAnchor="middle" fontSize="19" fontWeight="bold" fill="white">{i+1}</text>
        </g>)}
        {rascunho && <line className="erm88-seta erm88-previa" x1={rascunho.origem.x*1000} y1={rascunho.origem.y*1000}
          x2={rascunho.destino.x*1000} y2={rascunho.destino.y*1000} markerEnd="url(#erm88-ponta)" />}
      </svg>, alvo)}

    {aberto && <div className="erm88-controles" role="region" aria-label="Ferramentas de anotação">
      <div className="erm88-barra">
        <strong>ANOTAÇÕES</strong>
        <button type="button" onClick={() => iniciarSeta()} disabled={!contexto || !alvo} className={modo==='seta'?'ativo':''} aria-pressed={modo==='seta'}>↗ Desenhar seta</button>
        <button type="button" onClick={() => { setModo('ver'); setRascunho(null); setFormulario(false); setReposicionar(null); }} disabled={modo==='ver'&&!formulario}>↖ Cursor</button>
        <button type="button" className="erm88-fechar" onClick={() => onAbrirChange(false)} aria-label="Fechar ferramenta">✕</button>
      </div>
      <div className="erm88-painel">
        <div className="erm88-intro"><b>{contexto?.titulo || 'Selecione uma planta ou imagem'}</b>
          <span>{contexto ? `${atuais.length} observação(ões) nesta imagem` : 'Este módulo não permite anotações nesta etapa.'}</span></div>
        {formulario && <div className="erm88-formulario">
          <label htmlFor="erm88-texto">{reposicionar ? 'Atualizar observação e seta' : 'O que deseja apontar?'}</label>
          <textarea ref={areaTexto} id="erm88-texto" rows={3} maxLength={LIMITE_TEXTO} value={campo} onChange={e => setCampo(e.target.value)} placeholder="Ex.: Verificar acesso da portaria..." />
          <div className="erm88-formBotoes"><button type="button" onClick={() => {setFormulario(false);setRascunho(null);setModo('ver');setReposicionar(null);}}>Cancelar</button><button type="button" disabled={!campo.trim()} onClick={guardar}>Salvar observação</button></div>
        </div>}
        {aviso && <p className="erm88-aviso" role="status">{aviso}</p>}
        <strong className="erm88-listaTitulo">Observações salvas · {notas.length}</strong>
        <div className="erm88-lista">
          {notas.length === 0 && <p className="erm88-vazio">Clique em “Desenhar seta” e arraste sobre a planta para começar.</p>}
          {notas.map(n => <div className={`erm88-item ${destaque===n.id?'selecionado':''}`} key={n.id}>
            <button type="button" className="erm88-localizar" onClick={() => mostrar(n)}>
              <span className="erm88-itemTitulo">↗ {n.titulo}</span><span>{n.texto}</span>
            </button>
            {editar === n.id ? <div className="erm88-edicao">
              <textarea rows={3} maxLength={LIMITE_TEXTO} value={campo} onChange={e=>setCampo(e.target.value)} aria-label="Editar observação" />
              <button type="button" onClick={() => salvarEdicao(n.id)} disabled={!campo.trim()}>Salvar texto</button>
              <button type="button" onClick={() => setEditar(null)}>Cancelar</button>
            </div> : <div className="erm88-itemAcoes">
              <button type="button" onClick={() => { setEditar(n.id); setCampo(n.texto); }}>Editar</button>
              <button type="button" disabled={n.contexto !== contexto?.id} onClick={() => iniciarSeta(n.id)}>Mover seta</button>
              <button type="button" onClick={() => excluir(n.id)}>Excluir</button>
            </div>}
          </div>)}
        </div>
        <button type="button" className="erm88-exportar" onClick={exportar} disabled={!notas.length}>↓ Exportar observações (.json)</button>
        <p className="erm88-privacidade">Salvas neste navegador. Não são enviadas à Rocha nem sincronizadas com outros aparelhos. Use “Exportar” para guardar uma cópia.</p>
      </div>
    </div>}
  </>;
}
