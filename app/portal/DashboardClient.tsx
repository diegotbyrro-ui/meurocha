'use client';

import './r84-inicio.css';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { bibliotecaCategorias } from '@/lib/biblioteca.mjs';
import { empreendimentos } from '@/lib/catalog.mjs';
import AjudaPagina from './ajuda/AjudaPagina';
import CabecalhoPagina from './ui/CabecalhoPagina';
import Icone from './ui/Icone';

// R85: dados da equipe vêm das APIs do portal (tarefas e corretores). Este painel não guarda nada no navegador.
type ColunaTarefa = { id: string; nome: string; cor: string; ordem: number; conta_como_concluida: boolean };
type TarefaPortal = {
  id: string;
  titulo: string;
  empreendimento: string | null;
  prazo: string | null;
  coluna_id: string;
  prioridade: 'baixa' | 'media' | 'alta';
  responsavel_id: string | null;
  atualizado_em: string;
};
type MembroEquipe = { id: string; nome: string; setor: string };
type DadosTarefas = { colunas: ColunaTarefa[]; tarefas: TarefaPortal[]; equipe: MembroEquipe[] };
type ResumoCorretores = { total: number; ativos: number; bloqueados: number; novos7dias: number; acessaram7dias: number };
type Carga<T> = { status: 'carregando' } | { status: 'ok'; dados: T } | { status: 'erro' };

const CORES_CAPA: readonly string[] = ['#a51c2c', '#3d1219', '#1f5fae', '#1b7a4a'];
const VAZIO_COLUNAS: ColunaTarefa[] = [];
const VAZIO_TAREFAS: TarefaPortal[] = [];
const VAZIO_EQUIPE: MembroEquipe[] = [];
const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function hojeLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dataCurta(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number);
  if (!ano || !mes || !dia) return 'Sem prazo';
  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

async function pedir(url: string): Promise<unknown> {
  const resposta = await fetch(url, { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
  if (!resposta.ok) throw new Error(`Resposta ${resposta.status}`);
  return resposta.json();
}

function lerTarefas(json: unknown): DadosTarefas | null {
  const o = json as Partial<DadosTarefas & { ok: boolean }> | null;
  if (!o || o.ok === false || !Array.isArray(o.colunas) || !Array.isArray(o.tarefas)) return null;
  return { colunas: o.colunas, tarefas: o.tarefas, equipe: Array.isArray(o.equipe) ? o.equipe : [] };
}

function lerCorretores(json: unknown): ResumoCorretores | null {
  const r = (json as { resumo?: Partial<ResumoCorretores> } | null)?.resumo;
  if (!r || typeof r.total !== 'number' || typeof r.ativos !== 'number') return null;
  return {
    total: r.total,
    ativos: r.ativos,
    bloqueados: r.bloqueados ?? 0,
    novos7dias: r.novos7dias ?? 0,
    acessaram7dias: r.acessaram7dias ?? 0,
  };
}

/** Prazo mais próximo primeiro; sem prazo vai para o fim. */
function porPrazo(a: TarefaPortal, b: TarefaPortal): number {
  return (a.prazo ?? '9999-12-31').localeCompare(b.prazo ?? '9999-12-31') || a.titulo.localeCompare(b.titulo, 'pt-BR');
}

function Calendar({ tarefas }: { tarefas: TarefaPortal[] }) {
  const [offset, setOffset] = useState(0);
  const monthBase = new Date();
  monthBase.setDate(1);
  monthBase.setMonth(monthBase.getMonth() + offset);
  const year = monthBase.getFullYear(), month = monthBase.getMonth();
  const first = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((first + totalDays) / 7) * 7 }, (_, i) => i - first + 1);
  const dateNow = hojeLocal();
  const dueMap = new Map<string, number>();
  for (const t of tarefas) if (t.prazo) dueMap.set(t.prazo, (dueMap.get(t.prazo) || 0) + 1);
  const monthTitle = monthBase.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return <section className="r81-panel r81-calendar" aria-label="Calendário de prazos das tarefas"><div className="r81-panel-heading"><div><span className="r84-icone-bloco" data-area="tarefas" aria-hidden="true"><Icone nome="calendario" tamanho={20} /></span><h2>Calendário de entregas</h2></div><Link href="/portal/tarefas">Ver tarefas</Link></div>
    <div className="r81-month-nav"><strong>{monthTitle}</strong><div><button type="button" aria-label="Mês anterior" onClick={() => setOffset((o) => o - 1)}>‹</button><button type="button" aria-label="Mês atual" onClick={() => setOffset(0)}>Hoje</button><button type="button" aria-label="Próximo mês" onClick={() => setOffset((o) => o + 1)}>›</button></div></div>
    <div className="r81-calendar-grid">{WEEK_DAYS.map((d, i) => <span className="r81-weekday" key={i}>{d}</span>)}{cells.map((day, i) => {
      const valid = day >= 1 && day <= totalDays;
      const date = valid ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
      const due = dueMap.get(date) || 0;
      return <div key={i} className={`r81-cal-day${!valid ? ' is-outside' : ''}${date === dateNow ? ' is-today' : ''}${due ? ' has-events' : ''}`} title={due ? `${due} tarefa(s) com prazo neste dia` : undefined}>{valid ? day : ''}{due > 0 ? <i title={`${due} tarefa(s)`} /> : null}</div>;
    })}</div><p className="r81-calendar-foot">Os pontos marcam os prazos das tarefas em aberto da equipe.</p>
  </section>;
}

export default function DashboardClient({ eu }: { eu: { id: string; nome: string } }) {
  const [tarefas, setTarefas] = useState<Carga<DadosTarefas>>({ status: 'carregando' });
  const [corretores, setCorretores] = useState<Carga<ResumoCorretores>>({ status: 'carregando' });
  const [filter, setFilter] = useState('');

  useEffect(() => {
    let ativo = true;
    pedir('/api/portal/tarefas')
      .then(lerTarefas)
      .then((dados) => { if (ativo) setTarefas(dados ? { status: 'ok', dados } : { status: 'erro' }); })
      .catch(() => { if (ativo) setTarefas({ status: 'erro' }); });
    pedir('/api/portal/corretores')
      .then(lerCorretores)
      .then((dados) => { if (ativo) setCorretores(dados ? { status: 'ok', dados } : { status: 'erro' }); })
      .catch(() => { if (ativo) setCorretores({ status: 'erro' }); });
    return () => { ativo = false; };
  }, []);

  const hoje = hojeLocal();
  const dados = tarefas.status === 'ok' ? tarefas.dados : null;
  const colunas = dados?.colunas ?? VAZIO_COLUNAS;
  const todas = dados?.tarefas ?? VAZIO_TAREFAS;
  const equipe = dados?.equipe ?? VAZIO_EQUIPE;

  const modelo = useMemo(() => {
    const concluidas = new Set(colunas.filter((c) => c.conta_como_concluida).map((c) => c.id));
    const abertas = todas.filter((t) => !concluidas.has(t.coluna_id));
    return {
      abertas,
      minhas: abertas.filter((t) => t.responsavel_id === eu.id).sort(porPrazo),
      atrasadasOuHoje: abertas.filter((t) => t.prazo !== null && t.prazo <= hoje).length,
      recentes: todas.slice().sort((a, b) => b.atualizado_em.localeCompare(a.atualizado_em)).slice(0, 4),
      nomesColuna: new Map(colunas.map((c) => [c.id, c.nome])),
      nomesEquipe: new Map(equipe.map((m) => [m.id, m.nome])),
    };
  }, [colunas, todas, equipe, eu.id, hoje]);

  const numero = (valor: number) => (tarefas.status === 'ok' ? String(valor) : tarefas.status === 'erro' ? '—' : '…');
  const projects = empreendimentos.filter((p) => `${p.nome} ${p.bairro} ${p.cidade}`.toLocaleLowerCase('pt-BR').includes(filter.trim().toLocaleLowerCase('pt-BR')));
  const primeiroNome = eu.nome.trim().split(/\s+/)[0] || eu.nome;

  return <section className="r81-dashboard r84i-inicio" aria-label="Visão geral da operação comercial Rocha">
    <CabecalhoPagina area="inicio" icone="inicio" titulo={`Olá, ${primeiroNome}!`} descricao="Veja o que é seu para hoje, os prazos da equipe e os empreendimentos."><Link href="/portal/ajuda" className="r84-btn-sec"><Icone nome="pergunta" tamanho={18} /> Abrir a ajuda</Link></CabecalhoPagina>
    <AjudaPagina id="inicio" titulo="Primeira vez no portal?" passos={['Use o menu à esquerda (no celular, o botão Menu no topo). Cada item diz para que serve.','Na Central dos empreendimentos você copia o CNPJ e o PIX e abre os materiais de venda.','No Simulador de entrada você monta a proposta em 4 passos e imprime para o cliente.','Viu um termo que não conhece? Clique no ponto de interrogação ao lado dele.']} />
    <section className="r83-comece" aria-labelledby="r83-comece-titulo">
      <h2 id="r83-comece-titulo">O que você quer fazer?</h2>
      <div className="r83-comece-grid">
        <Link href="/portal/central" className="r84-cartao r84-comece-cartao" data-area="central"><span className="r84-icone-bloco r84-icone-bloco-lg" aria-hidden="true"><Icone nome="cartao" tamanho={26} /></span><strong>Passar CNPJ ou PIX para um cliente</strong><small>Abra a Central, escolha o empreendimento e clique em copiar.</small><span className="r84-comece-cta">Ir para a Central <Icone nome="setaDireita" tamanho={18} /></span></Link>
        <Link href="/portal/simulador" className="r84-cartao r84-comece-cartao" data-area="simulador"><span className="r84-icone-bloco r84-icone-bloco-lg" aria-hidden="true"><Icone nome="calculadora" tamanho={26} /></span><strong>Simular a entrada de uma unidade</strong><small>Informe valor, financiamento e parcelas. O portal faz as contas.</small><span className="r84-comece-cta">Abrir o simulador <Icone nome="setaDireita" tamanho={18} /></span></Link>
        <Link href="/portal/central" className="r84-cartao r84-comece-cartao" data-area="central"><span className="r84-icone-bloco r84-icone-bloco-lg" aria-hidden="true"><Icone nome="imagens" tamanho={26} /></span><strong>Enviar material de venda</strong><small>Plantas, book, vídeos e tabela de preços ficam na Central.</small><span className="r84-comece-cta">Ver materiais <Icone nome="setaDireita" tamanho={18} /></span></Link>
        <Link href="/portal/atualizar" className="r84-cartao r84-comece-cartao" data-area="atualizar"><span className="r84-icone-bloco r84-icone-bloco-lg" aria-hidden="true"><Icone nome="editar" tamanho={26} /></span><strong>Cadastrar ou corrigir dados</strong><small>Para quem cuida do portal: CNPJ, PIX, links e postagens.</small><span className="r84-comece-cta">Atualizar conteúdo <Icone nome="setaDireita" tamanho={18} /></span></Link>
      </div>
    </section>
    <div className="r81-kpis">
      <div className="r81-kpi" data-area="central"><div className="r84-icone-bloco r84i-kpi-icone" aria-hidden="true"><Icone nome="predio" tamanho={22} /></div><div><small>Empreendimentos de referência</small><strong>{empreendimentos.length}</strong><span>Catálogo preliminar</span></div></div>
      <div className="r81-kpi" data-area="biblioteca"><div className="r84-icone-bloco r84i-kpi-icone" aria-hidden="true"><Icone nome="pasta" tamanho={22} /></div><div><small>Categorias da biblioteca</small><strong>{bibliotecaCategorias.length}</strong><span>Pastas fixas</span></div></div>
      <div className="r81-kpi" data-area="tarefas"><div className="r84-icone-bloco r84i-kpi-icone" aria-hidden="true"><Icone nome="tarefas" tamanho={22} /></div><div><small>Tarefas em aberto</small><strong>{numero(modelo.abertas.length)}</strong><span>{tarefas.status === 'erro' ? 'Não foi possível carregar' : 'Da equipe, em todas as colunas'}</span></div></div>
      <div className="r81-kpi" data-area="atualizar"><div className="r84-icone-bloco r84i-kpi-icone" aria-hidden="true"><Icone nome="alerta" tamanho={22} /></div><div><small>Prazos até hoje</small><strong>{numero(modelo.atrasadasOuHoje)}</strong><span>Tarefas abertas com prazo vencido ou hoje</span></div></div>
      {corretores.status !== 'erro' ? <div className="r81-kpi" data-area="central"><div className="r84-icone-bloco r84i-kpi-icone" aria-hidden="true"><Icone nome="usuarios" tamanho={22} /></div><div><small>Corretores ativos</small><strong>{corretores.status === 'ok' ? corretores.dados.ativos : '…'}</strong><span>{corretores.status === 'ok' ? `${corretores.dados.total} cadastrados · ${corretores.dados.bloqueados} bloqueados` : 'Carregando'}</span></div></div> : null}
    </div>

    <div className="r81-content-grid">
      <section className="r81-panel r81-attention" aria-labelledby="r84i-minhas"><div className="r81-panel-heading"><div><span className="r84-icone-bloco" data-area="tarefas" aria-hidden="true"><Icone nome="tarefas" tamanho={20} /></span><h2 id="r84i-minhas">Minhas tarefas</h2></div><Link href="/portal/tarefas">Ver todas <Icone nome="setaDireita" tamanho={16} /></Link></div>
        {tarefas.status === 'carregando' ? <p className="r84i-aviso">Carregando tarefas…</p>
          : tarefas.status === 'erro' ? <div className="r81-empty-state"><strong>Não foi possível carregar as tarefas agora.</strong><p>Atualize a página em alguns instantes.</p></div>
          : modelo.minhas.length ? <div className="r81-task-lines">{modelo.minhas.slice(0, 6).map((t) => {
            const coluna = modelo.nomesColuna.get(t.coluna_id);
            const detalhes = [t.empreendimento, coluna, t.prioridade === 'alta' ? 'Prioridade alta' : null].filter(Boolean).join(' · ');
            return <div key={t.id} className="r81-task-line"><span className="r81-task-check" aria-hidden="true" /><div><strong>{t.titulo}</strong><small>{detalhes || 'Geral'}</small></div><span className={t.prazo && t.prazo < hoje ? 'is-late' : ''}>{t.prazo ? dataCurta(t.prazo) : 'Sem prazo'}</span></div>;
          })}</div>
          : <div className="r81-empty-state"><span className="r84-icone-bloco r84-icone-bloco-lg" data-area="tarefas" aria-hidden="true"><Icone nome="checkCirculo" tamanho={26} /></span><strong>Nenhuma tarefa sua em aberto.</strong><p>Quando alguém da equipe passar uma tarefa para você, ela aparece aqui.</p><Link href="/portal/tarefas">Ver o quadro de tarefas</Link></div>}
      </section>
      <section className="r81-panel r81-activity" aria-labelledby="r84i-atividade"><div className="r81-panel-heading"><div><span className="r84-icone-bloco" data-area="atualizar" aria-hidden="true"><Icone nome="relogio" tamanho={20} /></span><h2 id="r84i-atividade">Atividade recente</h2></div><span>Da equipe</span></div>
        {tarefas.status === 'carregando' ? <p className="r84i-aviso">Carregando atividade…</p>
          : tarefas.status === 'erro' ? <div className="r81-empty-state"><strong>Não foi possível carregar a atividade agora.</strong><p>Atualize a página em alguns instantes.</p></div>
          : modelo.recentes.length ? <div className="r81-activity-list">{modelo.recentes.map((t) => {
            const coluna = modelo.nomesColuna.get(t.coluna_id) || 'Sem coluna';
            const responsavel = t.responsavel_id ? modelo.nomesEquipe.get(t.responsavel_id) || 'Sem responsável' : 'Sem responsável';
            return <div key={t.id} className="r81-activity-line"><span className="r81-activity-mark" /><div><strong>{t.titulo}</strong><small>{coluna} · {responsavel} · {new Date(t.atualizado_em).toLocaleDateString('pt-BR')}</small></div></div>;
          })}</div>
          : <div className="r81-empty-state"><span className="r84-icone-bloco r84-icone-bloco-lg" data-area="atualizar" aria-hidden="true"><Icone nome="relogio" tamanho={26} /></span><strong>Sem movimentações ainda.</strong><p>As tarefas criadas e atualizadas pela equipe aparecerão aqui.</p></div>}
      </section>
    </div>

    <div className="r81-section-heading"><div><h2>Empreendimentos</h2><p>Clique em um empreendimento para ver CNPJ, PIX e materiais.</p></div><Link href="/portal/central">Abrir a Central <Icone nome="setaDireita" tamanho={17} /></Link></div>
    <div className="r81-project-search"><Icone nome="predio" tamanho={18} /><input type="search" aria-label="Buscar empreendimentos" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar empreendimento, bairro ou cidade..." /></div>
    <div className="r81-project-grid">{projects.map((p, i) => <Link key={p.id} href={`/portal/central/${p.id}`} className="r84-cartao r84-cartao-clicavel r81-project r84i-projeto" data-area="central"><div className="r81-project-image" style={{ backgroundColor: CORES_CAPA[i % CORES_CAPA.length] }}><span className="r84i-capa-status">{p.status}</span><Icone nome="predio" tamanho={56} /></div><div className="r81-project-body"><h3>{p.nome}</h3><p>{p.bairro} · {p.cidade}</p><span className="r84i-projeto-cta">Abrir na Central <Icone nome="setaDireita" tamanho={16} /></span></div></Link>)}{projects.length === 0 ? <div className="r81-empty-project">Nenhum empreendimento encontrado.</div> : null}</div>

    <div className="r81-lower-grid"><Calendar tarefas={modelo.abertas} /><section className="r81-panel r81-shortcuts"><div className="r81-panel-heading"><div><span className="r84-icone-bloco" data-area="simulador" aria-hidden="true"><Icone nome="grafico" tamanho={20} /></span><h2>Ferramentas rápidas</h2></div></div><div className="r81-shortcut-items">
        <Link href="/portal/central" data-area="central"><span className="r84-icone-bloco" aria-hidden="true"><Icone nome="predio" tamanho={20} /></span><div><strong>Central dos empreendimentos</strong><small>CNPJ, PIX, materiais e postagens</small></div><Icone nome="setaDireita" tamanho={17} /></Link>
        <Link href="/portal/biblioteca" data-area="biblioteca"><span className="r84-icone-bloco" aria-hidden="true"><Icone nome="pasta" tamanho={20} /></span><div><strong>Biblioteca digital</strong><small>Pastas e arquivos deste navegador</small></div><Icone nome="setaDireita" tamanho={17} /></Link>
        <Link href="/portal/simulador" data-area="simulador"><span className="r84-icone-bloco" aria-hidden="true"><Icone nome="grafico" tamanho={20} /></span><div><strong>Simulador de entrada</strong><small>Entrada, parcelas, INCC e proposta impressa</small></div><Icone nome="setaDireita" tamanho={17} /></Link>
        <Link href="/portal/gestao" data-area="cadastro"><span className="r84-icone-bloco" aria-hidden="true"><Icone nome="predio" tamanho={20} /></span><div><strong>Cadastro de empreendimentos</strong><small>Rascunhos e fotos nesta máquina</small></div><Icone nome="setaDireita" tamanho={17} /></Link>
        <Link href="/portal/tarefas" data-area="tarefas"><span className="r84-icone-bloco" aria-hidden="true"><Icone nome="tarefas" tamanho={20} /></span><div><strong>Quadro de tarefas</strong><small>Prioridades, prazos e andamento</small></div><Icone nome="setaDireita" tamanho={17} /></Link>
      </div><div className="r81-access-note"><Icone nome="usuarios" tamanho={21} /><p><strong>Acessos:</strong> a equipe Rocha entra com e-mail e senha. Corretores entram só com o CRECI e a UF, sem senha.</p></div></section></div>
  </section>;
}
