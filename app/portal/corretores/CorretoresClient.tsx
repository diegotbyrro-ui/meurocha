'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { formatarCreci } from '@/lib/portal-acesso.mjs';
import { montarCsvCorretores } from '@/lib/portal-corretores-repo.mjs';
import AjudaPagina from '../ajuda/AjudaPagina';
import Icone, { type NomeIcone } from '../ui/Icone';
import CabecalhoPagina from '../ui/CabecalhoPagina';
import './corretores.css';

type Status = 'todos' | 'ativo' | 'bloqueado';
type Corretor = {
  id: string; creci: string; uf: string; nome: string; whatsapp: string | null; imobiliaria: string | null;
  email: string | null; status: 'ativo' | 'bloqueado'; acessos: number; ultimo_acesso: string | null; criado_em: string;
};
type Resumo = { total: number; ativos: number; bloqueados: number; novos7dias: number; acessaram7dias: number };
type Lista = { corretores: Corretor[]; total: number; pagina: number; temMais: boolean; resumo: Resumo };
type Resposta<T> = { ok: true; dados: T } | { ok: false; erro: string };

const FILTROS: { id: Status; rotulo: string }[] = [
  { id: 'todos', rotulo: 'Todos' },
  { id: 'ativo', rotulo: 'Ativos' },
  { id: 'bloqueado', rotulo: 'Bloqueados' },
];
const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

async function chamar<T>(url: string, metodo: 'GET' | 'PATCH', corpo?: unknown): Promise<Resposta<T>> {
  try {
    const r = await fetch(url, {
      method: metodo,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: corpo !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
    const dados = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, erro: dados.erro || 'Algo deu errado. Tente de novo.' };
    return { ok: true, dados: dados as T };
  } catch {
    return { ok: false, erro: 'Sem conexão com o servidor. Confira a internet e tente de novo.' };
  }
}

/** "há 3 dias", "ontem", "há 2 horas"; depois de 30 dias, a data. */
function tempoRelativo(iso: string | null): string {
  if (!iso) return 'Ainda não entrou';
  const minutos = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  if (Math.abs(minutos) < 60) return rtf.format(minutos, 'minute');
  const horas = Math.round(minutos / 60);
  if (Math.abs(horas) < 24) return rtf.format(horas, 'hour');
  const dias = Math.round(horas / 24);
  if (Math.abs(dias) < 30) return rtf.format(dias, 'day');
  return new Date(iso).toLocaleDateString('pt-BR');
}

/** Link do WhatsApp: acrescenta 55 quando o número vem só com DDD. */
function linkWhatsapp(numero: string) {
  const digitos = numero.replace(/\D/g, '');
  return `https://wa.me/${digitos.length === 10 || digitos.length === 11 ? `55${digitos}` : digitos}`;
}

/** Mostra o WhatsApp como (82) 99999-9999. */
function formatarWhatsapp(numero: string | null) {
  let d = (numero || '').replace(/\D/g, '');
  if (d.length === 12 || d.length === 13) d = d.slice(2);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return numero || '';
}

export default function CorretoresClient() {
  const [lista, setLista] = useState<Corretor[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [temMais, setTemMais] = useState(false);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [buscaDigitada, setBuscaDigitada] = useState('');
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState<Status>('todos');
  const [carregando, setCarregando] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState('');
  const [editando, setEditando] = useState<Corretor | null>(null);
  const [confirmar, setConfirmar] = useState<Corretor | null>(null);
  const [aviso, setAviso] = useState('');
  const sequencia = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setBusca(buscaDigitada.trim()), 300);
    return () => clearTimeout(t);
  }, [buscaDigitada]);
  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(''), 2500);
    return () => clearTimeout(t);
  }, [aviso]);

  const carregarPagina = useCallback(async (pag: number, filtro: { busca: string; status: Status }, anexar: boolean) => {
    const id = ++sequencia.current;
    if (anexar) setCarregandoMais(true);
    else { setCarregando(true); setErro(''); }
    const qs = new URLSearchParams({ busca: filtro.busca, status: filtro.status, pagina: String(pag) });
    const r = await chamar<Lista>(`/api/portal/corretores?${qs.toString()}`, 'GET');
    if (id !== sequencia.current) return;
    if (r.ok) {
      setLista((antes) => (anexar ? [...antes, ...r.dados.corretores] : r.dados.corretores));
      setTotal(r.dados.total);
      setPagina(r.dados.pagina);
      setTemMais(r.dados.temMais);
      setResumo(r.dados.resumo);
    } else {
      setErro(r.erro);
    }
    setCarregando(false);
    setCarregandoMais(false);
  }, []);

  useEffect(() => { carregarPagina(1, { busca, status }, false); }, [busca, status, carregarPagina]);

  function trocarNaLista(corretor: Corretor) {
    setLista((antes) => antes.map((c) => (c.id === corretor.id ? { ...c, ...corretor } : c)));
  }

  function ajustarResumo(de: Corretor['status'], para: Corretor['status']) {
    setResumo((r) => r && ({
      ...r,
      ativos: r.ativos + (para === 'ativo' ? 1 : 0) - (de === 'ativo' ? 1 : 0),
      bloqueados: r.bloqueados + (para === 'bloqueado' ? 1 : 0) - (de === 'bloqueado' ? 1 : 0),
    }));
  }

  // Mostra a mudança na hora. Se der erro, recarrega a lista para voltar ao que está gravado.
  async function mudarStatus(c: Corretor) {
    const novo: Corretor['status'] = c.status === 'ativo' ? 'bloqueado' : 'ativo';
    setConfirmar(null);
    setLista((antes) => {
      const ajustada = antes.map((x) => (x.id === c.id ? { ...x, status: novo } : x));
      return status !== 'todos' && status !== novo ? ajustada.filter((x) => x.id !== c.id) : ajustada;
    });
    if (status !== 'todos' && status !== novo) setTotal((t) => Math.max(0, t - 1));
    ajustarResumo(c.status, novo);
    const r = await chamar<{ corretor: Corretor }>(`/api/portal/corretores/${c.id}`, 'PATCH', { status: novo });
    if (r.ok) {
      setAviso(novo === 'bloqueado' ? `${c.nome} foi bloqueado.` : `${c.nome} foi liberado.`);
    } else {
      setAviso(r.erro);
      carregarPagina(1, { busca, status }, false);
    }
  }

  function exportarCsv() {
    const csv = montarCsvCorretores(lista);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `corretores-rocha-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const filtrando = busca !== '' || status !== 'todos';
  const contagem = (id: Status) => {
    if (!resumo) return '';
    const n = id === 'todos' ? resumo.total : id === 'ativo' ? resumo.ativos : resumo.bloqueados;
    return ` (${n})`;
  };

  return <div className="r85c">
    <CabecalhoPagina
      area="central"
      icone="usuarios"
      titulo="Corretores"
      descricao="Corretores entram só com o CRECI. Aqui você vê quem se cadastrou e pode bloquear um acesso."
    >
      <button type="button" className="r84-btn-sec" onClick={exportarCsv} disabled={carregando || lista.length === 0}>
        <Icone nome="baixar" tamanho={18} /> Exportar planilha (CSV)
      </button>
    </CabecalhoPagina>

    <AjudaPagina
      id="corretores"
      passos={[
        'Os números do topo mostram quantos corretores há, quantos estão bloqueados e quem entrou ou se cadastrou nos últimos 7 dias.',
        'Busque por nome, CRECI ou imobiliária. Os botões de situação mostram só os ativos ou só os bloqueados.',
        'Bloquear tira o acesso do corretor na hora, mesmo que ele já esteja dentro do portal. Liberar desfaz isso. Nada é apagado.',
        'Use Editar para corrigir nome, WhatsApp, imobiliária ou e-mail. O CRECI não muda por aqui.',
      ]}
    />

    <section className="r85c-numeros" aria-label="Resumo dos corretores">
      <Numero icone="usuarios" area="central" valor={resumo?.total} rotulo="Corretores cadastrados" />
      <Numero icone="checkCirculo" area="tarefas" valor={resumo?.ativos} rotulo="Com acesso ativo" />
      <Numero icone="alerta" area="atualizar" valor={resumo?.bloqueados} rotulo="Bloqueados" />
      <Numero icone="mais" area="simulador" valor={resumo?.novos7dias} rotulo="Cadastrados nos últimos 7 dias" />
      <Numero icone="relogio" area="ajuda" valor={resumo?.acessaram7dias} rotulo="Entraram nos últimos 7 dias" />
    </section>

    <section className="r84-cartao r85c-lista-cartao" aria-labelledby="lista-titulo">
      <div className="r85c-barra">
        <h2 id="lista-titulo">Lista de corretores</h2>
        <div className="r85c-filtros">
          <label className="r85c-busca">
            <span className="r85c-sr">Buscar por nome, CRECI ou imobiliária</span>
            <Icone nome="busca" tamanho={18} />
            <input
              type="search"
              value={buscaDigitada}
              onChange={(e) => setBuscaDigitada(e.target.value)}
              placeholder="Nome, CRECI ou imobiliária"
              autoComplete="off"
              maxLength={80}
            />
          </label>
          <div className="r85c-pilulas" role="group" aria-label="Filtrar por situação">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={status === f.id}
                className="r85c-pilula"
                onClick={() => setStatus(f.id)}
              >
                {f.rotulo}{contagem(f.id)}
              </button>
            ))}
          </div>
        </div>
        <p className="r85c-nota">A planilha traz os corretores desta lista{temMais ? ' já carregados. Use Carregar mais para incluir todos.' : '.'}</p>
      </div>

      {erro ? <div className="r85c-erro" role="alert">
        <p><Icone nome="alerta" tamanho={18} /> {erro}</p>
        <button type="button" className="r84-btn-sec" onClick={() => carregarPagina(1, { busca, status }, false)}>Tentar de novo</button>
      </div> : null}

      {carregando && lista.length === 0 && !erro ? <div className="r85c-skeleton" aria-live="polite" aria-label="Carregando corretores">
        <span /><span /><span /><span />
      </div> : null}

      {!carregando && !erro && lista.length === 0 ? <div className="r85c-vazio">
        <span className="r84-icone-bloco r84-icone-bloco-lg" aria-hidden="true"><Icone nome="usuarios" tamanho={26} /></span>
        <p>{filtrando ? 'Nenhum corretor encontrado com este filtro.' : 'Nenhum corretor se cadastrou ainda. Quando alguém entrar com o CRECI, aparece aqui.'}</p>
        {filtrando ? <button type="button" className="r84-btn-sec" onClick={() => { setBuscaDigitada(''); setStatus('todos'); }}>Limpar busca e filtro</button> : null}
      </div> : null}

      {lista.length > 0 ? <ul className="r85c-lista">
        <li className="r85c-cabecalho-lista" aria-hidden="true"><span>Corretor</span><span>Contato</span><span>Acessos</span><span>Situação</span><span>Ações</span></li>
        {lista.map((c) => {
          const bloqueado = c.status === 'bloqueado';
          return <li key={c.id} className={`r85c-item${bloqueado ? ' is-bloqueado' : ''}`}>
            <div className="r85c-corretor">
              <strong>{c.nome}</strong>
              <small>{formatarCreci(c.creci, c.uf)}</small>
              {c.imobiliaria ? <small>{c.imobiliaria}</small> : null}
            </div>
            <div className="r85c-campo">
              <span className="r85c-rotulo">WhatsApp</span>
              {c.whatsapp ? <a className="r85c-whats" href={linkWhatsapp(c.whatsapp)} target="_blank" rel="noopener noreferrer">
                {formatarWhatsapp(c.whatsapp)} <Icone nome="abrir" tamanho={14} />
                <span className="r85c-sr"> (abre em nova aba)</span>
              </a> : <span className="r85c-muted">Sem WhatsApp</span>}
            </div>
            <div className="r85c-campo">
              <span className="r85c-rotulo">Acessos</span>
              <span className="r85c-acessos"><strong>{c.acessos}</strong> {c.acessos === 1 ? 'acesso' : 'acessos'}</span>
              <small className="r85c-muted">{c.ultimo_acesso ? `Último: ${tempoRelativo(c.ultimo_acesso)}` : 'Nunca entrou'}</small>
            </div>
            <div className="r85c-campo">
              <span className="r85c-rotulo">Situação</span>
              {bloqueado
                ? <span className="r85c-selo-bloq">Bloqueado</span>
                : <span className="r84-selo-ok r84-selo">Ativo</span>}
            </div>
            <div className="r85c-acoes">
              <button type="button" className="r84-btn-sec" onClick={() => setEditando(c)} aria-label={`Editar ${c.nome}`}>
                <Icone nome="editar" tamanho={16} /> Editar
              </button>
              {bloqueado
                ? <button type="button" className="r84-btn-sec" onClick={() => setConfirmar(c)} aria-label={`Liberar acesso de ${c.nome}`}>
                    <Icone nome="check" tamanho={16} /> Liberar
                  </button>
                : <button type="button" className="r85c-perigo" onClick={() => setConfirmar(c)} aria-label={`Bloquear ${c.nome}`}>
                    <Icone nome="fechar" tamanho={16} /> Bloquear
                  </button>}
            </div>
          </li>;
        })}
      </ul> : null}

      {temMais ? <div className="r85c-mais">
        <p>Mostrando {lista.length} de {total}</p>
        <button type="button" className="r84-btn-sec" onClick={() => carregarPagina(pagina + 1, { busca, status }, true)} disabled={carregandoMais}>
          {carregandoMais ? 'Carregando...' : 'Carregar mais'}
        </button>
      </div> : null}
    </section>

    {editando ? <FormEditarCorretor
      corretor={editando}
      onFechar={() => setEditando(null)}
      onSalvo={(c) => { setEditando(null); trocarNaLista(c); setAviso('Dados salvos.'); }}
    /> : null}

    {confirmar ? <Dialogo
      titulo={confirmar.status === 'ativo' ? `Bloquear ${confirmar.nome}?` : `Liberar ${confirmar.nome}?`}
      descricao={confirmar.status === 'ativo'
        ? 'O corretor perde o acesso em até 2 minutos, mesmo que já esteja dentro do portal, até você liberar de novo. Nada é apagado.'
        : 'Essa pessoa volta a entrar no portal com o CRECI.'}
      onFechar={() => setConfirmar(null)}
    >
      <div className="r85c-acoes-grupo r85c-fim">
        <button type="button" className="r84-btn-sec" onClick={() => setConfirmar(null)} autoFocus>Cancelar</button>
        <button
          type="button"
          className={confirmar.status === 'ativo' ? 'r85c-perigo-cheio' : 'r84-btn'}
          onClick={() => mudarStatus(confirmar)}
        >
          {confirmar.status === 'ativo' ? 'Bloquear acesso' : 'Liberar acesso'}
        </button>
      </div>
    </Dialogo> : null}

    {aviso ? <div className="r84-toast" role="status"><Icone nome="check" tamanho={18} /> {aviso}</div> : null}
  </div>;
}

function Numero({ icone, area, valor, rotulo }: { icone: NomeIcone; area: string; valor: number | undefined; rotulo: string }) {
  return <div className="r84-cartao r85c-numero" data-area={area}>
    <span className="r84-icone-bloco" aria-hidden="true"><Icone nome={icone} tamanho={20} /></span>
    <strong>{valor === undefined ? '—' : valor}</strong>
    <span>{rotulo}</span>
  </div>;
}

function Dialogo({ titulo, descricao, onFechar, children }: { titulo: string; descricao?: string; onFechar: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const aoApertar = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar(); };
    window.addEventListener('keydown', aoApertar);
    return () => window.removeEventListener('keydown', aoApertar);
  }, [onFechar]);
  return <div className="r85c-fundo" onMouseDown={(e) => { if (e.target === e.currentTarget) onFechar(); }}>
    <div className="r85c-dialogo" role="dialog" aria-modal="true" aria-labelledby="dialogo-titulo">
      <div className="r85c-dialogo-topo">
        <h2 id="dialogo-titulo">{titulo}</h2>
        <button type="button" className="r85c-fechar" onClick={onFechar} aria-label="Fechar">
          <Icone nome="fechar" tamanho={20} />
        </button>
      </div>
      {descricao ? <p className="r85c-dialogo-texto">{descricao}</p> : null}
      {children}
    </div>
  </div>;
}

function FormEditarCorretor({ corretor, onFechar, onSalvo }: { corretor: Corretor; onFechar: () => void; onSalvo: (c: Corretor) => void }) {
  const [nome, setNome] = useState(corretor.nome);
  const [whatsapp, setWhatsapp] = useState(formatarWhatsapp(corretor.whatsapp));
  const [imobiliaria, setImobiliaria] = useState(corretor.imobiliaria || '');
  const [email, setEmail] = useState(corretor.email || '');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro('');
    const r = await chamar<{ corretor: Corretor }>(`/api/portal/corretores/${corretor.id}`, 'PATCH', { nome, whatsapp, imobiliaria, email });
    setEnviando(false);
    if (r.ok) onSalvo(r.dados.corretor);
    else setErro(r.erro);
  }

  return <Dialogo titulo="Editar corretor" descricao={`${formatarCreci(corretor.creci, corretor.uf)}. O CRECI não muda por aqui.`} onFechar={onFechar}>
    <form className="r85c-form" onSubmit={enviar}>
      <label className="r85c-label">Nome completo
        <input className="r85c-input" type="text" value={nome} onChange={(e) => setNome(e.target.value)} required maxLength={100} autoFocus autoComplete="off" />
      </label>
      <label className="r85c-label">WhatsApp com DDD
        <input className="r85c-input" type="tel" inputMode="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required autoComplete="off" />
      </label>
      <label className="r85c-label">Imobiliária <span className="r85c-opcional">(opcional)</span>
        <input className="r85c-input" type="text" value={imobiliaria} onChange={(e) => setImobiliaria(e.target.value)} maxLength={100} autoComplete="off" />
      </label>
      <label className="r85c-label">E-mail <span className="r85c-opcional">(opcional)</span>
        <input className="r85c-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} autoComplete="off" />
      </label>
      {erro ? <p className="r85c-aviso-erro" role="alert"><Icone nome="alerta" tamanho={18} /> {erro}</p> : null}
      <div className="r85c-acoes-grupo r85c-fim">
        <button type="button" className="r84-btn-sec" onClick={onFechar}>Cancelar</button>
        <button type="submit" className="r84-btn" disabled={enviando}>{enviando ? 'Salvando...' : 'Salvar'}</button>
      </div>
    </form>
  </Dialogo>;
}
