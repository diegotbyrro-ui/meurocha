'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type MouseEvent, type CSSProperties } from 'react';

// R87: nenhuma anotação é enviada para APIs, Supabase ou serviços externos.
// Para compartilhar o resultado, use a impressão do navegador (Salvar como PDF).
const RAIZ = '/experiencia/easy-rota-do-mar/';
const INICIO = '/experiencia/easy-rota-do-mar';
const PADRAO = `${RAIZ}erm52-implantacao-pavimentos.png`;
const CHAVE_LOCAL = 'rocha-erm87-anotacoes-v1';
const LIMITE_NOTAS = 40;
const LIMITE_CARACTERES = 500;
const LIMITE_IMAGEM = 15 * 1024 * 1024;

const OPCOES = [
  { titulo: 'Implantação geral', src: PADRAO },
  { titulo: 'Pavimento tipo', src: `${RAIZ}erm34-pavimento-limpo.webp` },
  { titulo: 'Planta 3D Slim', src: `${RAIZ}erm75-slim-planta-3d.webp` },
  { titulo: 'Planta 3D Premium', src: `${RAIZ}erm75-premium-planta-3d.webp` },
  { titulo: 'Planta 3D Master', src: `${RAIZ}erm75-master-planta-3d.webp` },
  { titulo: 'Planta 3D Spazzio', src: `${RAIZ}erm74-spazzio-04-planta-3d-oficial.webp` },
  { titulo: 'Vista aérea', src: `${RAIZ}erm-vista-aerea.webp` },
] as const;

type Ponto = { x: number; y: number };
type Nota = Ponto & { id: string; texto: string };
type Banco = Record<string, Nota[]>;

type Props = {
  imagemInicial: string;
  tituloInicial: string;
  veioDo3D: boolean;
};

// Somente imagens do próprio Easy Rota do Mar. Nada de links arbitrários ou externos.
function imagemPermitida(valor: string): boolean {
  return /^\/experiencia\/easy-rota-do-mar\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(?:png|jpe?g|webp)$/.test(valor) ||
    /^\/api\/experiencia\/easy-rota-do-mar\/media\/[a-zA-Z0-9_-]+$/.test(valor);
}
function limitar(valor: number, inferior = 0, superior = 1): number {
  return Math.max(inferior, Math.min(superior, valor));
}
function validarNotas(bruto: unknown): Nota[] {
  if (!Array.isArray(bruto)) return [];
  return bruto.slice(0, LIMITE_NOTAS).flatMap((item): Nota[] => {
    if (!item || typeof item !== 'object') return [];
    const n = item as Partial<Nota>;
    if (typeof n.id !== 'string' || n.id.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(n.id) ||
        typeof n.texto !== 'string' || !n.texto.trim() ||
        typeof n.x !== 'number' || typeof n.y !== 'number' ||
        !Number.isFinite(n.x) || !Number.isFinite(n.y)) return [];
    return [{ id: n.id, texto: n.texto.trim().slice(0, LIMITE_CARACTERES), x: limitar(n.x), y: limitar(n.y) }];
  });
}
function lerBanco(): Banco {
  try {
    const texto = localStorage.getItem(CHAVE_LOCAL);
    if (!texto || texto.length > 250_000) return {};
    const bruto = JSON.parse(texto) as unknown;
    if (!bruto || typeof bruto !== 'object' || Array.isArray(bruto)) return {};
    const entradas = Object.entries(bruto as Record<string, unknown>)
      .filter(([chave]) => imagemPermitida(chave)).slice(0, 50);
    return Object.fromEntries(entradas.map(([chave, notas]) => [chave, validarNotas(notas)]));
  } catch { return {}; }
}
function limparTitulo(valor: string): string {
  return valor.replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
}

export default function AnotacoesClient({ imagemInicial, tituloInicial, veioDo3D }: Props) {
  const fonteInicial = imagemPermitida(imagemInicial) ? imagemInicial : PADRAO;
  const tituloFonte = limparTitulo(tituloInicial) || 'Implantação geral';
  const [fonte, setFonte] = useState(fonteInicial);
  const [titulo, setTitulo] = useState(tituloFonte);
  const [banco, setBanco] = useState<Banco>({});
  const [carregado, setCarregado] = useState(false);
  const [ponto, setPonto] = useState<Ponto | null>(null);
  const [texto, setTexto] = useState('');
  const [editando, setEditando] = useState<string | null>(null);
  const [moverSeta, setMoverSeta] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [imagemFalhou, setImagemFalhou] = useState(false);
  const [imagemCarregou, setImagemCarregou] = useState(false);
  const [aspecto, setAspecto] = useState(1.7);
  const inputArquivo = useRef<HTMLInputElement | null>(null);
  const campoTexto = useRef<HTMLTextAreaElement | null>(null);
  const urlLocal = useRef<string | null>(null);
  const lista = useMemo(() => banco[fonte] || [], [banco, fonte]);
  const imagemPersonalizada = fonte.startsWith('blob:');

  useEffect(() => { setBanco(lerBanco()); setCarregado(true); }, []);
  useEffect(() => {
    if (!carregado) return;
    try {
      // Capturas locais em blob: não sobrevivem ao fechamento do navegador.
      const persistir = Object.fromEntries(Object.entries(banco)
        .filter(([caminho]) => imagemPermitida(caminho)).slice(0, 50));
      localStorage.setItem(CHAVE_LOCAL, JSON.stringify(persistir));
    } catch { /* Modo privado / armazenamento cheio: exportação PDF segue disponível. */ }
  }, [banco, carregado]);
  useEffect(() => () => { if (urlLocal.current) URL.revokeObjectURL(urlLocal.current); }, []);

  const trocar = useCallback((novaFonte: string, novoTitulo: string) => {
    if (urlLocal.current && novaFonte !== urlLocal.current) {
      URL.revokeObjectURL(urlLocal.current);
      urlLocal.current = null;
    }
    const mudou = novaFonte !== fonte;
    setFonte(novaFonte);
    setTitulo(limparTitulo(novoTitulo) || 'Imagem selecionada');
    setPonto(null); setTexto(''); setEditando(null); setMoverSeta(false);
    setErro(''); setSucesso('');
    if (mudou) { setImagemFalhou(false); setImagemCarregou(false); }
  }, [fonte]);

  const carregarArquivo = useCallback((arquivo: File | undefined) => {
    if (!arquivo) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(arquivo.type) || arquivo.size <= 0 || arquivo.size > LIMITE_IMAGEM) {
      setErro('Use uma imagem PNG, JPG ou WebP de até 15 MB.');
      return;
    }
    const novaUrl = URL.createObjectURL(arquivo);
    if (urlLocal.current) URL.revokeObjectURL(urlLocal.current);
    urlLocal.current = novaUrl;
    trocar(novaUrl, arquivo.name.replace(/\.[^.]+$/, '').slice(0, 100));
    setSucesso('Captura carregada. Clique na imagem para apontar sua primeira seta.');
  }, [trocar]);

  useEffect(() => {
    const colar = (evento: ClipboardEvent) => {
      const item = Array.from(evento.clipboardData?.items || []).find((i) => i.type.startsWith('image/'));
      if (!item) return;
      const arquivo = item.getAsFile();
      if (arquivo) { evento.preventDefault(); carregarArquivo(arquivo); }
    };
    window.addEventListener('paste', colar);
    return () => window.removeEventListener('paste', colar);
  }, [carregarArquivo]);

  const marcar = (evento: MouseEvent<HTMLButtonElement>) => {
    if (!imagemCarregou || imagemFalhou) return;
    if (editando && !moverSeta) { setErro('Para mudar uma seta existente, clique em "Mover esta seta".'); return; }
    const rect = evento.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    setPonto({ x: limitar((evento.clientX - rect.left) / rect.width), y: limitar((evento.clientY - rect.top) / rect.height) });
    setErro(''); setSucesso(''); setMoverSeta(false);
    window.requestAnimationFrame(() => campoTexto.current?.focus());
  };

  const editar = (nota: Nota) => {
    setEditando(nota.id); setTexto(nota.texto); setPonto({ x: nota.x, y: nota.y });
    setMoverSeta(false); setErro(''); setSucesso('');
    campoTexto.current?.focus();
  };
  const cancelar = () => {
    setEditando(null); setPonto(null); setTexto(''); setMoverSeta(false); setErro('');
  };
  const atualizarLista = (novas: Nota[]) => {
    setBanco((atual) => ({ ...atual, [fonte]: novas }));
  };
  const salvar = () => {
    const mensagem = texto.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, LIMITE_CARACTERES);
    if (!ponto) { setErro('Primeiro, clique na imagem para escolher a ponta da seta.'); return; }
    if (!mensagem) { setErro('Escreva sua observação antes de salvar.'); campoTexto.current?.focus(); return; }
    if (!editando && lista.length >= LIMITE_NOTAS) { setErro('Esta imagem chegou ao limite de 40 anotações.'); return; }
    if (editando) {
      atualizarLista(lista.map((n) => n.id === editando ? { ...n, ...ponto, texto: mensagem } : n));
    } else {
      atualizarLista([...lista, { id: crypto.randomUUID(), ...ponto, texto: mensagem }]);
    }
    cancelar(); setSucesso('Anotação salva neste navegador. Use Salvar PDF para compartilhar.');
  };
  const excluir = (id: string) => {
    if (!window.confirm('Excluir esta anotação?')) return;
    atualizarLista(lista.filter((n) => n.id !== id));
    if (editando === id) cancelar();
    setSucesso('Anotação excluída.');
  };
  const copiar = async () => {
    const conteudo = `Easy Rota do Mar — ${titulo}\n` + lista.map((n, i) => `${i + 1}. ${n.texto}`).join('\n');
    try { await navigator.clipboard.writeText(conteudo); setSucesso('Texto das anotações copiado.'); setErro(''); }
    catch { setErro('Não foi possível copiar. Use a opção Salvar PDF.'); }
  };
  const notasNaImagem = lista.map((n, i) => ({ ...n, numero: i + 1 }));
  const tituloCurto = titulo || 'Imagem do empreendimento';
  const selecionarOpcao = (evento: ChangeEvent<HTMLSelectElement>) => {
    const escolha = OPCOES.find((o) => o.src === evento.target.value);
    if (escolha) trocar(escolha.src, escolha.titulo);
  };

  return <main className="erm87">
    <header className="erm87-topo erm87-noPrint">
      <div className="erm87-topoMarca"><img src="/rocha-logo.png" alt="Rocha Empreendimentos" width={128} height={43} /><span>Easy Rota do Mar <b>/ Anotações</b></span></div>
      <Link href={INICIO} className="erm87-voltar">Voltar à experiência</Link>
    </header>
    <div className="erm87-moldura">
      <div className="erm87-cabecalho">
        <div><span className="erm87-etiqueta">FERRAMENTA DE ANOTAÇÕES</span><h1>Marque suas observações</h1><p>Indique o ponto com uma seta e escreva o que deseja destacar.</p></div>
        <div className="erm87-acoes erm87-noPrint">
          <button type="button" className="erm87-btnSec" onClick={() => void copiar()} disabled={!lista.length}>Copiar comentários</button>
          <button type="button" className="erm87-btnPrincipal" onClick={() => window.print()} disabled={!imagemCarregou}>Imprimir / Salvar PDF</button>
        </div>
      </div>
      {veioDo3D && <p className="erm87-3dAviso erm87-noPrint" role="note"><strong>Veio do mapa 3D?</strong> A imagem inicial é apenas uma referência. Para apontar um local no ângulo exato do mapa, faça uma captura de tela e carregue-a abaixo. O mapa continua funcionando normalmente na experiência original.</p>}
      <div className="erm87-escolha erm87-noPrint">
        <label htmlFor="erm87-imagemLista">Imagem para anotar
          <select id="erm87-imagemLista" value={OPCOES.some(o => o.src === fonte) ? fonte : ''} onChange={selecionarOpcao}>
            <option value="" disabled>Imagem atual / personalizada</option>
            {OPCOES.map(o => <option key={o.src} value={o.src}>{o.titulo}</option>)}
          </select>
        </label>
        <button type="button" className="erm87-btnArquivo" onClick={() => inputArquivo.current?.click()}>Carregar imagem ou captura</button>
        <input id="erm87-upload" ref={inputArquivo} tabIndex={-1} type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => { carregarArquivo(e.currentTarget.files?.[0]); e.currentTarget.value = ''; }} />
        <span>Ou cole uma captura com Ctrl+V</span>
      </div>
      <div className="erm87-grid">
        <section className="erm87-painelImagem" aria-label="Imagem para anotação">
          <div className="erm87-nomeImagem"><strong>{tituloCurto}</strong><span>{lista.length} {lista.length === 1 ? 'anotação' : 'anotações'}</span></div>
          <div className="erm87-superficie">
            {imagemFalhou ? <p className="erm87-falha" role="alert">Esta imagem não pôde ser aberta. Selecione outra ou carregue uma captura de tela.</p> : null}
            <div className="erm87-prancha" style={{ '--r87-print-w': `${Math.min(270, Math.max(40, 155 * aspecto)).toFixed(1)}mm` } as CSSProperties}>
              <img src={fonte} alt={`Imagem selecionada: ${tituloCurto}`} onLoad={(e) => { const el = e.currentTarget; setAspecto(el.naturalHeight ? el.naturalWidth / el.naturalHeight : 1.7); setImagemCarregou(true); setImagemFalhou(false); }} onError={() => { setImagemCarregou(false); setImagemFalhou(true); }} draggable={false} />
              {imagemCarregou && <>
                <button type="button" className="erm87-hitZone erm87-noPrint" onClick={marcar} aria-label={editando ? 'Escolher nova posição para a seta selecionada' : 'Marcar ponto na imagem'} />
                {notasNaImagem.map(n => <button type="button" key={n.id} className={`erm87-seta ${editando === n.id ? 'isSelected' : ''}`} style={{ left: `${n.x * 100}%`, top: `${n.y * 100}%` }} onClick={(e) => { e.stopPropagation(); editar(n); }} title={`Anotação ${n.numero}: ${n.texto}`} aria-label={`Editar anotação ${n.numero}: ${n.texto}`}>
                  <svg width="62" height="62" viewBox="0 0 62 62" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#b32638" stroke="#fff" strokeWidth="2"/><path d="M18 20 L50 50 M38 49 L50 50 L49 38" fill="none" stroke="#b32638" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/><path d="M18 20 L50 50 M38 49 L50 50 L49 38" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><text x="12" y="16.5" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">{n.numero}</text></svg>
                </button>)}
                {ponto && <span className="erm87-pontoPendente" style={{ left: `${ponto.x * 100}%`, top: `${ponto.y * 100}%` }} aria-hidden="true" />}
              </>}
            </div>
          </div>
          <p className="erm87-ajudaImagem erm87-noPrint">Toque ou clique no lugar exato para colocar a ponta da seta. As posições acompanham o tamanho da imagem.</p>
        </section>
        <aside className="erm87-lateral erm87-noPrint" aria-label="Editor e lista de anotações">
          <h2>{editando ? 'Editar anotação' : 'Nova anotação'}</h2>
          <p className="erm87-ajuda">{editando ? 'Altere o texto ou reposicione a seta.' : '1. Clique na imagem para marcar o ponto. 2. Escreva a observação. 3. Salve.'}</p>
          {ponto ? <div className="erm87-posicao">Ponto selecionado <strong>{Math.round(ponto.x * 100)}% × {Math.round(ponto.y * 100)}%</strong></div> : <div className="erm87-posicao">Aguardando ponto na imagem</div>}
          <label htmlFor="erm87-texto">Comentário</label>
          <textarea ref={campoTexto} id="erm87-texto" rows={4} maxLength={LIMITE_CARACTERES} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ex.: Gostaria de entender melhor esta área do apartamento." />
          <div className="erm87-contador">{texto.length}/{LIMITE_CARACTERES}</div>
          {editando && <button type="button" className={`erm87-btnSec erm87-mover ${moverSeta ? 'isActive' : ''}`} onClick={() => { setMoverSeta(!moverSeta); setErro(''); }} aria-pressed={moverSeta}>{moverSeta ? 'Agora clique na nova posição' : 'Mover esta seta'}</button>}
          <div className="erm87-formAcoes"><button type="button" className="erm87-btnPrincipal" onClick={salvar}>{editando ? 'Salvar alterações' : 'Salvar anotação'}</button><button type="button" className="erm87-btnSec" onClick={cancelar}>Cancelar</button></div>
          {erro && <p className="erm87-erro" role="alert">{erro}</p>}
          {sucesso && <p className="erm87-sucesso" role="status">{sucesso}</p>}
          <div className="erm87-listaTitulo"><h2>Anotações desta imagem</h2><span>{lista.length}/{LIMITE_NOTAS}</span></div>
          {lista.length ? <ol className="erm87-lista">{lista.map((n, i) => <li key={n.id}><span className="erm87-indice">{i + 1}</span><div><p>{n.texto}</p><div><button type="button" onClick={() => editar(n)}>Editar</button><button type="button" onClick={() => excluir(n.id)}>Excluir</button></div></div></li>)}</ol> : <p className="erm87-vazio">Nenhum comentário ainda. Clique na imagem para começar.</p>}
          <small className="erm87-privacidade">Os comentários das imagens do site ficam salvos somente neste navegador. Capturas carregadas não são enviadas ao servidor e não permanecem após fechar a aba.</small>
          {imagemPersonalizada && <small className="erm87-privacidade">Para guardar ou compartilhar uma captura anotada, salve em PDF antes de sair.</small>}
        </aside>
      </div>
      <section className="erm87-relatorioPrint" aria-label="Comentários no documento impresso"><h2>Observações sobre {tituloCurto}</h2>{lista.length ? <ol>{lista.map((n, i) => <li key={n.id}><strong>Seta {i + 1}</strong> {n.texto}</li>)}</ol> : <p>Nenhuma anotação foi adicionada.</p>}<p className="erm87-impressaoAviso">Easy Rota do Mar — marcações feitas pelo visitante. Não são alterações de projeto, medidas oficiais ou solicitações registradas junto à Rocha.</p></section>
    </div>
  </main>;
}
