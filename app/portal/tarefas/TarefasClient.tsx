'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type DragEvent, type FormEvent } from 'react';
import { empreendimentos } from '@/lib/catalog.mjs';
import { CORES_COLUNA } from '@/lib/portal-tarefas-repo.mjs';
import { humanDate, todayLocal, type Coluna, type Quadro, type Tarefa, type TaskPriority } from './task-store';
import Icone from '../ui/Icone';
import CabecalhoPagina from '../ui/CabecalhoPagina';
import './tarefas.css';

// R85 - Quadro de tarefas da equipe, guardado no Supabase. Colunas são da própria equipe:
// criar, renomear, mudar cor, reordenar e excluir (movendo as tarefas para outra coluna).

type FormTarefa = {
  titulo: string;
  descricao: string;
  empreendimento: string;
  prazo: string;
  prioridade: TaskPriority;
  coluna_id: string;
  responsavel_id: string;
};
type Resposta<T> = { ok: true; dados: T } | { ok: false; erro: string };
type Aviso = { texto: string; tipo: 'ok' | 'erro' };

const PRIORIDADES: { id: TaskPriority; nome: string }[] = [
  { id: 'baixa', nome: 'Baixa' },
  { id: 'media', nome: 'Média' },
  { id: 'alta', nome: 'Alta' },
];
const NOME_COR: Record<string, string> = {
  '#45474c': 'Grafite', '#1f5fae': 'Azul', '#6b3fb8': 'Roxo', '#1b7a4a': 'Verde',
  '#b45309': 'Âmbar', '#a51c2c': 'Vinho', '#0e7c78': 'Petróleo', '#3f5468': 'Aço',
};
const MAX_COLUNAS = 12;
const SEM_EMPREENDIMENTO = '__sem__';
const FILTRO_TODOS = 'todos';
const FILTRO_EU = 'eu';
const FILTRO_SEM = 'sem';
const MSG_CONEXAO = 'Sem conexão com o servidor. Verifique a internet e tente de novo.';

async function api<T>(url: string, metodo: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'GET', corpo?: unknown): Promise<Resposta<T>> {
  try {
    const res = await fetch(url, {
      method: metodo,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: corpo !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
    const dados = await res.json().catch(() => ({}));
    if (!res.ok) {
      const erro = typeof dados?.erro === 'string' ? dados.erro : 'Não foi possível concluir. Tente de novo.';
      return { ok: false, erro };
    }
    return { ok: true, dados: dados as T };
  } catch {
    return { ok: false, erro: MSG_CONEXAO };
  }
}

const iniciais = (nome: string) => {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  const letras = (partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '');
  return letras.toLocaleUpperCase('pt-BR') || '?';
};
const nomePrioridade = (p: TaskPriority) => PRIORIDADES.find((x) => x.id === p)?.nome ?? p;
const plural = (n: number, um: string, varios: string) => (n === 1 ? `1 ${um}` : `${n} ${varios}`);

function SeletorCores({ valor, onEscolher, legenda }: { valor: string; onEscolher: (cor: string) => void; legenda: string }) {
  return <fieldset className="tq-bloco tq-fieldset">
    <legend>{legenda}</legend>
    <div className="tq-cores">
      {CORES_COLUNA.map((cor: string) => <button key={cor} type="button" className="tq-cor" aria-label={`Cor ${NOME_COR[cor] ?? cor}`} aria-pressed={valor.toLowerCase() === cor} onClick={() => onEscolher(cor)}>
        <span style={{ background: cor }} aria-hidden="true" />
      </button>)}
    </div>
  </fieldset>;
}

function CartaoTarefa({ tarefa, colunas, nomeResponsavel, ehEu, atrasada, emArrasto, onEditar, onMover, onArrastar, onFimArrasto }: {
  tarefa: Tarefa;
  colunas: Coluna[];
  nomeResponsavel: string | null;
  ehEu: boolean;
  atrasada: boolean;
  emArrasto: boolean;
  onEditar: () => void;
  onMover: (colunaId: string) => void;
  onArrastar: (e: DragEvent<HTMLElement>) => void;
  onFimArrasto: () => void;
}) {
  return <article className={`r81-task-card r84b-card is-${tarefa.prioridade}${emArrasto ? ' is-arrastando' : ''}`} draggable onDragStart={onArrastar} onDragEnd={onFimArrasto}>
    <div className="r81-task-card-top">
      <span className={`r84b-selo is-${tarefa.prioridade}`} aria-label={`Prioridade ${nomePrioridade(tarefa.prioridade).toLocaleLowerCase('pt-BR')}`}>{nomePrioridade(tarefa.prioridade)}</span>
      <button type="button" className="r84b-acao" aria-label={`Editar tarefa ${tarefa.titulo}`} onClick={onEditar}><Icone nome="editar" tamanho={16} />Editar</button>
    </div>
    <strong className="r84b-card-titulo">{tarefa.titulo}</strong>
    {tarefa.descricao ? <p>{tarefa.descricao}</p> : null}
    <ul className="r84b-card-info">
      <li><Icone nome="predio" tamanho={16} /><span>{tarefa.empreendimento || 'Sem empreendimento'}</span></li>
      <li className={atrasada ? 'is-overdue' : ''}><Icone nome={atrasada ? 'alerta' : 'calendario'} tamanho={16} /><span>{atrasada ? 'Atrasada · ' : ''}{tarefa.prazo ? humanDate(tarefa.prazo) : 'Sem prazo'}</span></li>
      <li className="tq-responsavel">
        {nomeResponsavel
          ? <><span className="tq-avatar" aria-hidden="true">{iniciais(nomeResponsavel)}</span><span>{nomeResponsavel}{ehEu ? ' (você)' : ''}</span></>
          : <><span className="tq-avatar tq-avatar-vazio" aria-hidden="true"><Icone nome="usuarios" tamanho={14} /></span><span className="tq-sem">Sem responsável</span></>}
      </li>
    </ul>
    <div className="r81-task-card-foot">
      <label className="r84b-mover"><span>Coluna</span>
        <select aria-label={`Mudar coluna de ${tarefa.titulo}`} value={tarefa.coluna_id} onChange={(e) => onMover(e.target.value)}>
          {colunas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </label>
    </div>
  </article>;
}

export default function TarefasClient({ eu }: { eu: { id: string; nome: string } }) {
  const [quadro, setQuadro] = useState<Quadro | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState('');
  const [visao, setVisao] = useState<'quadro' | 'lista'>('quadro');
  const [busca, setBusca] = useState('');
  const [filtroEmpreendimento, setFiltroEmpreendimento] = useState(FILTRO_TODOS);
  const [filtroResponsavel, setFiltroResponsavel] = useState(FILTRO_TODOS);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [arrastando, setArrastando] = useState<string | null>(null);
  const [colunaSobre, setColunaSobre] = useState<string | null>(null);
  // editor de tarefa
  const [editor, setEditor] = useState<{ tarefa: Tarefa | null; form: FormTarefa } | null>(null);
  const [salvandoTarefa, setSalvandoTarefa] = useState(false);
  const [erroEditor, setErroEditor] = useState('');
  // menu da coluna
  const [menuColuna, setMenuColuna] = useState<string | null>(null);
  const [rascunhoNome, setRascunhoNome] = useState('');
  const [pedindoExclusao, setPedindoExclusao] = useState(false);
  const [destinoExclusao, setDestinoExclusao] = useState('');
  const [erroMenu, setErroMenu] = useState('');
  const [posicaoMenu, setPosicaoMenu] = useState<{ top: number; left: number; largura: number } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  // nova coluna
  const [novaAberta, setNovaAberta] = useState(false);
  const [novaNome, setNovaNome] = useState('');
  const [novaCor, setNovaCor] = useState<string>(CORES_COLUNA[0]);
  const [erroNova, setErroNova] = useState('');
  const [salvandoColuna, setSalvandoColuna] = useState(false);

  const recarregar = useCallback(async (comEsqueleto = false) => {
    if (comEsqueleto) setCarregando(true);
    const r = await api<Quadro>('/api/portal/tarefas');
    if (r.ok) { setQuadro(r.dados); setErroCarga(''); }
    else setErroCarga(r.erro);
    setCarregando(false);
  }, []);

  useEffect(() => { void recarregar(true); }, [recarregar]);

  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(null), aviso.tipo === 'erro' ? 4000 : 2500);
    return () => window.clearTimeout(t);
  }, [aviso]);

  useEffect(() => {
    if (!menuColuna) return;
    function fora(e: MouseEvent) { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuColuna(null); }
    function tecla(e: KeyboardEvent) { if (e.key === 'Escape') setMenuColuna(null); }
    // O menu tem posição fixa: ao rolar a tela ou o quadro, ele fecha em vez de ficar fora do lugar.
    function rolou() { setMenuColuna(null); }
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', tecla);
    window.addEventListener('scroll', rolou, true);
    return () => {
      document.removeEventListener('mousedown', fora);
      document.removeEventListener('keydown', tecla);
      window.removeEventListener('scroll', rolou, true);
    };
  }, [menuColuna]);

  useEffect(() => {
    if (!editor) return;
    function tecla(e: KeyboardEvent) { if (e.key === 'Escape' && !salvandoTarefa) setEditor(null); }
    document.addEventListener('keydown', tecla);
    return () => document.removeEventListener('keydown', tecla);
  }, [editor, salvandoTarefa]);

  function avisar(texto: string, tipo: Aviso['tipo'] = 'ok') { setAviso({ texto, tipo }); }

  const colunas = useMemo(() => [...(quadro?.colunas ?? [])].sort((a, b) => a.ordem - b.ordem), [quadro]);
  const tarefas = quadro?.tarefas ?? [];
  const equipe = quadro?.equipe ?? [];
  const inativos = quadro?.inativos ?? [];
  const nomes = useMemo(() => new Map<string, string>([...equipe, ...inativos].map((p) => [p.id, p.nome] as [string, string])), [equipe, inativos]);
  const nomeDe = (id: string | null) => (id ? nomes.get(id) ?? null : null);
  const concluida = (colunaId: string) => colunas.find((c) => c.id === colunaId)?.conta_como_concluida ?? false;

  const hoje = todayLocal();
  const abertas = tarefas.filter((t) => !concluida(t.coluna_id)).length;
  const concluidas = tarefas.length - abertas;
  const vencidas = tarefas.filter((t) => t.prazo && t.prazo < hoje && !concluida(t.coluna_id)).length;

  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  const filtradas = tarefas.filter((t) => {
    if (termo && !`${t.titulo} ${t.descricao} ${t.empreendimento} ${nomeDe(t.responsavel_id) ?? ''}`.toLocaleLowerCase('pt-BR').includes(termo)) return false;
    if (filtroEmpreendimento === SEM_EMPREENDIMENTO && t.empreendimento !== '') return false;
    if (filtroEmpreendimento !== FILTRO_TODOS && filtroEmpreendimento !== SEM_EMPREENDIMENTO && t.empreendimento !== filtroEmpreendimento) return false;
    if (filtroResponsavel === FILTRO_EU && t.responsavel_id !== eu.id) return false;
    if (filtroResponsavel === FILTRO_SEM && t.responsavel_id) return false;
    if (![FILTRO_TODOS, FILTRO_EU, FILTRO_SEM].includes(filtroResponsavel) && t.responsavel_id !== filtroResponsavel) return false;
    return true;
  });
  const tarefasDaColuna = (colunaId: string) => filtradas.filter((t) => t.coluna_id === colunaId).sort((a, b) => a.ordem - b.ordem);

  // ----- tarefas -----
  function abrirNova() {
    if (colunas.length === 0) return;
    setErroEditor('');
    setEditor({ tarefa: null, form: { titulo: '', descricao: '', empreendimento: '', prazo: '', prioridade: 'media', coluna_id: colunas[0].id, responsavel_id: '' } });
  }
  function abrirEdicao(t: Tarefa) {
    setErroEditor('');
    setEditor({
      tarefa: t,
      form: { titulo: t.titulo, descricao: t.descricao, empreendimento: t.empreendimento, prazo: t.prazo, prioridade: t.prioridade, coluna_id: t.coluna_id, responsavel_id: t.responsavel_id ?? '' },
    });
  }
  function campo<K extends keyof FormTarefa>(chave: K, valor: FormTarefa[K]) {
    setEditor((e) => (e ? { ...e, form: { ...e.form, [chave]: valor } } : e));
  }
  async function salvarTarefa(e: FormEvent) {
    e.preventDefault();
    if (!editor) return;
    const { tarefa, form } = editor;
    const corpo = {
      titulo: form.titulo.trim(), descricao: form.descricao.trim(), empreendimento: form.empreendimento, prazo: form.prazo,
      prioridade: form.prioridade, coluna_id: form.coluna_id, responsavel_id: form.responsavel_id || null,
    };
    setSalvandoTarefa(true);
    setErroEditor('');
    const r = tarefa
      ? await api<{ tarefa: Tarefa }>(`/api/portal/tarefas/${tarefa.id}`, 'PATCH', corpo)
      : await api<{ tarefa: Tarefa }>('/api/portal/tarefas', 'POST', corpo);
    setSalvandoTarefa(false);
    if (!r.ok) { setErroEditor(r.erro); return; }
    const salva = r.dados.tarefa;
    setQuadro((q) => {
      if (!q) return q;
      const existe = q.tarefas.some((x) => x.id === salva.id);
      return { ...q, tarefas: existe ? q.tarefas.map((x) => (x.id === salva.id ? salva : x)) : [...q.tarefas, salva] };
    });
    setEditor(null);
    avisar(tarefa ? 'Tarefa atualizada.' : 'Tarefa criada.');
  }
  async function excluirTarefaAberta() {
    if (!editor?.tarefa) return;
    const alvo = editor.tarefa;
    if (!window.confirm(`Excluir a tarefa "${alvo.titulo}"? Ela sai do quadro para toda a equipe.`)) return;
    setSalvandoTarefa(true);
    setErroEditor('');
    const r = await api(`/api/portal/tarefas/${alvo.id}`, 'DELETE');
    setSalvandoTarefa(false);
    if (!r.ok) { setErroEditor(r.erro); return; }
    setQuadro((q) => (q ? { ...q, tarefas: q.tarefas.filter((x) => x.id !== alvo.id) } : q));
    setEditor(null);
    avisar('Tarefa excluída.');
  }
  // Move para o fim da coluna escolhida. Atualiza na tela antes e volta se o servidor recusar.
  async function moverTarefa(t: Tarefa, colunaId: string) {
    if (t.coluna_id === colunaId) return;
    const fim = Math.max(0, ...tarefas.filter((x) => x.coluna_id === colunaId).map((x) => x.ordem)) + 1;
    setQuadro((q) => (q ? { ...q, tarefas: q.tarefas.map((x) => (x.id === t.id ? { ...x, coluna_id: colunaId, ordem: fim } : x)) } : q));
    const r = await api<{ tarefa: Tarefa }>(`/api/portal/tarefas/${t.id}`, 'PATCH', { coluna_id: colunaId });
    if (!r.ok) {
      setQuadro((q) => (q ? { ...q, tarefas: q.tarefas.map((x) => (x.id === t.id ? { ...x, coluna_id: t.coluna_id, ordem: t.ordem } : x)) } : q));
      avisar(r.erro, 'erro');
      return;
    }
    const salva = r.dados.tarefa;
    setQuadro((q) => (q ? { ...q, tarefas: q.tarefas.map((x) => (x.id === t.id ? { ...x, ...salva } : x)) } : q));
  }
  function soltar(e: DragEvent<HTMLElement>, colunaId: string) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || arrastando || '';
    setColunaSobre(null);
    setArrastando(null);
    const t = tarefas.find((x) => x.id === id);
    if (t) void moverTarefa(t, colunaId);
  }

  // ----- colunas -----
  function abrirMenu(c: Coluna, botao: HTMLElement) {
    if (menuColuna === c.id) { setMenuColuna(null); return; }
    const r = botao.getBoundingClientRect();
    const largura = Math.min(300, window.innerWidth - 16);
    const alturaMax = Math.min(600, window.innerHeight - 16);
    const top = Math.max(8, Math.min(r.bottom + 8, window.innerHeight - alturaMax - 8));
    setPosicaoMenu({ top, left: Math.max(8, Math.min(r.right - largura, window.innerWidth - largura - 8)), largura });
    setMenuColuna(c.id);
    setRascunhoNome(c.nome);
    setPedindoExclusao(false);
    setErroMenu('');
    setDestinoExclusao(colunas.find((x) => x.id !== c.id)?.id ?? '');
  }
  async function alterarColuna(c: Coluna, mudanca: Partial<Pick<Coluna, 'nome' | 'cor' | 'conta_como_concluida'>>): Promise<boolean> {
    setErroMenu('');
    const r = await api<{ coluna: Coluna }>(`/api/portal/tarefas/colunas/${c.id}`, 'PATCH', mudanca);
    if (!r.ok) { setErroMenu(r.erro); return false; }
    const nova = r.dados.coluna;
    setQuadro((q) => (q ? { ...q, colunas: q.colunas.map((x) => (x.id === c.id ? { ...x, ...nova } : x)) } : q));
    return true;
  }
  async function renomear(e: FormEvent, c: Coluna) {
    e.preventDefault();
    const nome = rascunhoNome.trim();
    if (!nome) { setErroMenu('Dê um nome para a coluna.'); return; }
    if (nome === c.nome) return;
    if (await alterarColuna(c, { nome })) avisar('Nome da coluna salvo.');
  }
  async function moverColuna(c: Coluna, direcao: -1 | 1) {
    const i = colunas.findIndex((x) => x.id === c.id);
    const j = i + direcao;
    if (i < 0 || j < 0 || j >= colunas.length) return;
    const nova = [...colunas];
    [nova[i], nova[j]] = [nova[j], nova[i]];
    setQuadro((q) => (q ? { ...q, colunas: nova.map((x, k) => ({ ...x, ordem: k + 1 })) } : q));
    const r = await api<{ colunas: Coluna[] }>('/api/portal/tarefas/colunas/ordem', 'PUT', { ids: nova.map((x) => x.id) });
    if (!r.ok) { avisar(r.erro, 'erro'); void recarregar(); return; }
    const salvas = r.dados.colunas;
    setQuadro((q) => (q ? { ...q, colunas: salvas } : q));
  }
  async function excluirColuna(c: Coluna) {
    const qtd = tarefas.filter((t) => t.coluna_id === c.id).length;
    if (qtd > 0 && !destinoExclusao) { setErroMenu('Escolha para qual coluna mover as tarefas.'); return; }
    const pedido = qtd > 0 ? `?moverPara=${encodeURIComponent(destinoExclusao)}` : '';
    const r = await api<{ tarefasMovidas: number }>(`/api/portal/tarefas/colunas/${c.id}${pedido}`, 'DELETE');
    if (!r.ok) { setErroMenu(r.erro); return; }
    setMenuColuna(null);
    await recarregar();
    avisar(qtd > 0 ? `Coluna excluída. ${plural(qtd, 'tarefa foi movida', 'tarefas foram movidas')}.` : 'Coluna excluída.');
  }
  async function criarColuna(e: FormEvent) {
    e.preventDefault();
    const nome = novaNome.trim();
    if (!nome) { setErroNova('Dê um nome para a coluna.'); return; }
    setSalvandoColuna(true);
    setErroNova('');
    const r = await api<{ coluna: Coluna }>('/api/portal/tarefas/colunas', 'POST', { nome, cor: novaCor });
    setSalvandoColuna(false);
    if (!r.ok) { setErroNova(r.erro); return; }
    const nova = r.dados.coluna;
    setQuadro((q) => (q ? { ...q, colunas: [...q.colunas, nova] } : q));
    setNovaAberta(false);
    setNovaNome('');
    setNovaCor(CORES_COLUNA[0]);
    avisar('Coluna criada.');
  }

  const erroConteudo = erroCarga && !quadro;

  return <section className="r81-tasks-page r84b-tarefas tq-pagina" data-area="tarefas" aria-label="Quadro de tarefas da equipe Rocha">
    <CabecalhoPagina area="tarefas" icone="tarefas" titulo="Tarefas da equipe"
      descricao="Crie tarefas, atribua a alguém da equipe e arraste os cartões entre as colunas. Todas as tarefas são compartilhadas com a equipe Rocha.">
      <button type="button" className="r84-btn" onClick={abrirNova} disabled={colunas.length === 0}><Icone nome="mais" tamanho={18} />Nova tarefa</button>
    </CabecalhoPagina>

    {quadro ? <div className="r81-task-summary r84b-resumo">
      <div><span className="r84b-ico-resumo"><Icone nome="tarefas" tamanho={18} /></span><strong>{tarefas.length}</strong><span>Tarefas</span></div>
      <div><span className="r84b-ico-resumo"><Icone nome="relogio" tamanho={18} /></span><strong>{abertas}</strong><span>Em aberto</span></div>
      <div><span className="r84b-ico-resumo"><Icone nome="checkCirculo" tamanho={18} /></span><strong>{concluidas}</strong><span>Concluídas</span></div>
      <div className="r84b-resumo-alerta"><span className="r84b-ico-resumo"><Icone nome="alerta" tamanho={18} /></span><strong>{vencidas}</strong><span>Vencidas</span></div>
    </div> : null}

    <div className="r81-tasks-tools">
      <div className="r81-task-filters">
        <input type="search" aria-label="Buscar tarefas" placeholder="Buscar tarefas..." value={busca} onChange={(e) => setBusca(e.target.value)} />
        <select aria-label="Filtrar por empreendimento" value={filtroEmpreendimento} onChange={(e) => setFiltroEmpreendimento(e.target.value)}>
          <option value={FILTRO_TODOS}>Todos os empreendimentos</option>
          <option value={SEM_EMPREENDIMENTO}>Sem empreendimento</option>
          {empreendimentos.map((e: { id: string; nome: string }) => <option key={e.id} value={e.nome}>{e.nome}</option>)}
        </select>
        <select aria-label="Filtrar por responsável" value={filtroResponsavel} onChange={(e) => setFiltroResponsavel(e.target.value)}>
          <option value={FILTRO_TODOS}>Todos os responsáveis</option>
          <option value={FILTRO_EU}>Minhas tarefas</option>
          <option value={FILTRO_SEM}>Sem responsável</option>
          {equipe.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          {inativos.map((p) => <option key={p.id} value={p.id}>{p.nome} (sem acesso ao portal)</option>)}
        </select>
      </div>
      <div className="r81-view-switch r84b-abas" role="group" aria-label="Modo de visualização">
        <button type="button" aria-pressed={visao === 'quadro'} onClick={() => setVisao('quadro')}><Icone nome="camadas" tamanho={18} />Quadro</button>
        <button type="button" aria-pressed={visao === 'lista'} onClick={() => setVisao('lista')}><Icone nome="tabela" tamanho={18} />Lista</button>
      </div>
    </div>

    {quadro && erroCarga ? <div className="tq-aviso-erro" role="alert"><Icone nome="alerta" tamanho={18} /><span>{erroCarga}</span><button type="button" className="r84b-acao" onClick={() => void recarregar()}>Tentar de novo</button></div> : null}

    {carregando && !quadro ? <div className="tq-carregando" aria-busy="true">
      <p>Carregando o quadro de tarefas...</p>
      <div className="tq-esqueleto" aria-hidden="true">{[0, 1, 2, 3].map((i) => <div key={i} className="tq-esqueleto-coluna" />)}</div>
    </div> : null}

    {erroConteudo ? <div className="r84b-vazio" role="alert">
      <span className="r84-icone-bloco r84-icone-bloco-lg" aria-hidden="true"><Icone nome="alerta" tamanho={26} /></span>
      <strong>Não foi possível carregar o quadro.</strong>
      <span className="r84b-vazio-texto">{erroCarga}</span>
      <button type="button" className="r84-btn" onClick={() => void recarregar(true)}><Icone nome="refazer" tamanho={18} />Tentar de novo</button>
    </div> : null}

    {quadro && visao === 'quadro' ? <div className="r81-board tq-board" style={{ '--n': colunas.length + 1 } as CSSProperties}>
      {colunas.map((c) => {
        const cards = tarefasDaColuna(c.id);
        const sobre = colunaSobre === c.id;
        const aberto = menuColuna === c.id;
        const indice = colunas.findIndex((x) => x.id === c.id);
        const qtdTarefas = tarefas.filter((t) => t.coluna_id === c.id).length;
        return <section key={c.id} className={`r81-board-column r84b-coluna tq-coluna${sobre ? ' is-sobre' : ''}`} style={{ '--e': c.cor } as CSSProperties} aria-label={`Coluna ${c.nome}`}
          onDragOver={(e) => { e.preventDefault(); if (colunaSobre !== c.id) setColunaSobre(c.id); }}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setColunaSobre(null); }}
          onDrop={(e) => soltar(e, c.id)}>
          <header className="r84b-coluna-cab">
            <span className="r84b-ponto" aria-hidden="true" />
            <h2>{c.nome}</h2>
            <b className="r84b-pilula" aria-label={plural(cards.length, 'tarefa', 'tarefas')}>{cards.length}</b>
            <div className="tq-menu-wrap" ref={aberto ? menuRef : undefined}>
              <button type="button" className="tq-menu-btn" aria-label={`Opções da coluna ${c.nome}`} aria-haspopup="dialog" aria-expanded={aberto} onClick={(e) => abrirMenu(c, e.currentTarget)}>
                <Icone nome="menu" tamanho={18} />
              </button>
              {aberto && posicaoMenu ? <div className="tq-menu" role="dialog" aria-label={`Opções da coluna ${c.nome}`}
                style={{ top: posicaoMenu.top, left: posicaoMenu.left, width: posicaoMenu.largura, maxHeight: `calc(100vh - ${posicaoMenu.top + 12}px)` }}>
                <form className="tq-bloco" onSubmit={(e) => void renomear(e, c)}>
                  <label className="tq-campo">Renomear coluna
                    <input value={rascunhoNome} maxLength={40} onChange={(e) => setRascunhoNome(e.target.value)} />
                  </label>
                  <button type="submit" className="r84-btn-sec tq-largo"><Icone nome="check" tamanho={16} />Salvar nome</button>
                </form>
                <SeletorCores legenda="Cor" valor={c.cor} onEscolher={(cor) => void alterarColuna(c, { cor })} />
                <div className="tq-bloco">
                  <label className="tq-check"><input type="checkbox" checked={c.conta_como_concluida} onChange={(e) => void alterarColuna(c, { conta_como_concluida: e.target.checked })} /><span>Conta como concluída</span></label>
                  <p className="tq-ajuda">As tarefas desta coluna entram em Concluídas no resumo do topo.</p>
                </div>
                <div className="tq-bloco">
                  <span className="tq-rotulo">Posição</span>
                  <button type="button" className="r84b-acao tq-largo" disabled={indice <= 0} onClick={() => void moverColuna(c, -1)}><Icone nome="setaEsquerda" tamanho={16} />Mover para a esquerda</button>
                  <button type="button" className="r84b-acao tq-largo" disabled={indice >= colunas.length - 1} onClick={() => void moverColuna(c, 1)}><Icone nome="setaDireita" tamanho={16} />Mover para a direita</button>
                </div>
                <div className="tq-bloco tq-zona-perigo">
                  {!pedindoExclusao ? <button type="button" className="r84b-acao r84b-acao-perigo tq-largo" disabled={colunas.length <= 1} onClick={() => setPedindoExclusao(true)}><Icone nome="lixeira" tamanho={16} />Excluir coluna</button> : <div className="tq-confirmar" role="group" aria-label="Confirmar exclusão da coluna">
                    <p>{qtdTarefas === 0 ? `Excluir a coluna "${c.nome}"? Ela não tem tarefas.` : `A coluna "${c.nome}" tem ${plural(qtdTarefas, 'tarefa', 'tarefas')}. Escolha para onde elas vão.`}</p>
                    {qtdTarefas > 0 ? <label className="tq-campo">Mover as tarefas para
                      <select value={destinoExclusao} onChange={(e) => setDestinoExclusao(e.target.value)}>
                        {colunas.filter((x) => x.id !== c.id).map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}
                      </select>
                    </label> : null}
                    <div className="tq-linha">
                      <button type="button" className="r84b-acao r84b-acao-perigo" onClick={() => void excluirColuna(c)}>Excluir coluna</button>
                      <button type="button" className="r84-btn-sec" onClick={() => setPedindoExclusao(false)}>Cancelar</button>
                    </div>
                  </div>}
                  {colunas.length <= 1 ? <p className="tq-ajuda">A última coluna do quadro não pode ser excluída.</p> : null}
                </div>
                {erroMenu ? <p className="tq-erro" role="alert">{erroMenu}</p> : null}
              </div> : null}
            </div>
          </header>
          {c.conta_como_concluida ? <p className="tq-chip">Conta como concluída</p> : null}
          <div className="r81-board-cards">
            {cards.length
              ? cards.map((t) => <CartaoTarefa key={t.id} tarefa={t} colunas={colunas} nomeResponsavel={nomeDe(t.responsavel_id)} ehEu={t.responsavel_id === eu.id}
                  atrasada={Boolean(t.prazo && t.prazo < hoje && !concluida(t.coluna_id))} emArrasto={arrastando === t.id}
                  onEditar={() => abrirEdicao(t)} onMover={(id) => void moverTarefa(t, id)}
                  onArrastar={(e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', t.id); setArrastando(t.id); }}
                  onFimArrasto={() => { setArrastando(null); setColunaSobre(null); }} />)
              : <div className="r81-empty-column">{tarefas.length ? 'Nenhuma tarefa com esses filtros.' : 'Arraste tarefas para cá ou crie uma nova.'}</div>}
          </div>
        </section>;
      })}
      {colunas.length < MAX_COLUNAS ? <div className="tq-nova-coluna">
        {novaAberta ? <form className="tq-bloco tq-nova-form" onSubmit={criarColuna}>
          <label className="tq-campo">Nome da coluna
            <input value={novaNome} maxLength={40} required autoFocus onChange={(e) => setNovaNome(e.target.value)} placeholder="Ex.: Aguardando cliente" />
          </label>
          <SeletorCores legenda="Cor" valor={novaCor} onEscolher={setNovaCor} />
          {erroNova ? <p className="tq-erro" role="alert">{erroNova}</p> : null}
          <div className="tq-linha">
            <button type="submit" className="r84-btn" disabled={salvandoColuna}><Icone nome="check" tamanho={18} />{salvandoColuna ? 'Criando...' : 'Criar coluna'}</button>
            <button type="button" className="r84-btn-sec" onClick={() => { setNovaAberta(false); setErroNova(''); }}>Cancelar</button>
          </div>
        </form> : <button type="button" className="tq-nova-botao" onClick={() => setNovaAberta(true)}><Icone nome="mais" tamanho={18} />Nova coluna</button>}
      </div> : <div className="tq-nova-coluna tq-limite">O quadro aceita até {MAX_COLUNAS} colunas.</div>}
    </div> : null}

    {quadro && visao === 'lista' ? <div className="r81-tasks-list r84b-lista">
      {filtradas.length
        ? colunas.flatMap((c) => tarefasDaColuna(c.id)).map((t) => <CartaoTarefa key={t.id} tarefa={t} colunas={colunas} nomeResponsavel={nomeDe(t.responsavel_id)} ehEu={t.responsavel_id === eu.id}
            atrasada={Boolean(t.prazo && t.prazo < hoje && !concluida(t.coluna_id))} emArrasto={false}
            onEditar={() => abrirEdicao(t)} onMover={(id) => void moverTarefa(t, id)}
            onArrastar={() => undefined} onFimArrasto={() => undefined} />)
        : <div className="r81-empty-list">{tarefas.length ? 'Nenhuma tarefa com esses filtros.' : 'Nenhuma tarefa criada ainda.'}</div>}
    </div> : null}

    {quadro && tarefas.length === 0 && !carregando ? <div className="r84b-vazio">
      <span className="r84-icone-bloco r84-icone-bloco-lg" aria-hidden="true"><Icone nome="tarefas" tamanho={26} /></span>
      <strong>Comece organizando o trabalho da equipe.</strong>
      <span className="r84b-vazio-texto">Crie uma tarefa, escolha a coluna e a pessoa responsável.</span>
      <button type="button" className="r84-btn" onClick={abrirNova} disabled={colunas.length === 0}><Icone nome="mais" tamanho={18} />Criar primeira tarefa</button>
    </div> : null}

    {editor ? <div className="tq-fundo" onMouseDown={(e) => { if (e.target === e.currentTarget && !salvandoTarefa) setEditor(null); }}>
      <div className="tq-modal" role="dialog" aria-modal="true" aria-labelledby="tq-modal-titulo">
        <header className="tq-modal-cab">
          <h2 id="tq-modal-titulo">{editor.tarefa ? 'Editar tarefa' : 'Nova tarefa'}</h2>
          <button type="button" className="tq-fechar" aria-label="Fechar" onClick={() => setEditor(null)}><Icone nome="fechar" tamanho={20} /></button>
        </header>
        <form className="tq-form" onSubmit={salvarTarefa}>
          <label className="tq-campo">Título da tarefa
            <input required minLength={3} maxLength={120} autoFocus value={editor.form.titulo} onChange={(e) => campo('titulo', e.target.value)} placeholder="Ex.: Revisar o book comercial" />
          </label>
          <label className="tq-campo">Descrição
            <textarea rows={3} maxLength={1000} value={editor.form.descricao} onChange={(e) => campo('descricao', e.target.value)} placeholder="Detalhes, entregáveis e orientações" />
          </label>
          <div className="tq-grade">
            <label className="tq-campo">Responsável
              <select value={editor.form.responsavel_id} onChange={(e) => campo('responsavel_id', e.target.value)}>
                <option value="">Sem responsável</option>
                {equipe.map((p) => <option key={p.id} value={p.id}>{p.nome}{p.id === eu.id ? ' (você)' : ''}</option>)}
                {inativos.filter((p) => p.id === editor.form.responsavel_id).map((p) => <option key={p.id} value={p.id}>{p.nome} (sem acesso ao portal)</option>)}
              </select>
            </label>
            <label className="tq-campo">Coluna
              <select value={editor.form.coluna_id} onChange={(e) => campo('coluna_id', e.target.value)}>
                {colunas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </label>
            <label className="tq-campo">Empreendimento
              <select value={editor.form.empreendimento} onChange={(e) => campo('empreendimento', e.target.value)}>
                <option value="">Sem empreendimento</option>
                {empreendimentos.map((x: { id: string; nome: string }) => <option key={x.id} value={x.nome}>{x.nome}</option>)}
              </select>
            </label>
            <label className="tq-campo">Prazo
              <input type="date" value={editor.form.prazo} onChange={(e) => campo('prazo', e.target.value)} />
            </label>
            <label className="tq-campo">Prioridade
              <select value={editor.form.prioridade} onChange={(e) => campo('prioridade', e.target.value as TaskPriority)}>
                {PRIORIDADES.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </label>
          </div>
          {erroEditor ? <p className="tq-erro" role="alert">{erroEditor}</p> : null}
          <footer className="tq-modal-rodape">
            {editor.tarefa ? <button type="button" className="r84b-acao r84b-acao-perigo" disabled={salvandoTarefa} onClick={() => void excluirTarefaAberta()}><Icone nome="lixeira" tamanho={16} />Excluir tarefa</button> : null}
            <span className="tq-espaco" />
            <button type="button" className="r84-btn-sec" onClick={() => setEditor(null)}>Cancelar</button>
            <button type="submit" className="r84-btn" disabled={salvandoTarefa}><Icone nome="check" tamanho={18} />{salvandoTarefa ? 'Salvando...' : editor.tarefa ? 'Salvar alterações' : 'Criar tarefa'}</button>
          </footer>
        </form>
      </div>
    </div> : null}

    {aviso ? <div className={`r84-toast${aviso.tipo === 'erro' ? ' tq-toast-erro' : ''}`} role="status">
      <Icone nome={aviso.tipo === 'erro' ? 'alerta' : 'check'} tamanho={18} />{aviso.texto}
    </div> : null}
  </section>;
}
