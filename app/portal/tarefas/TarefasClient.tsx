'use client';

import { useEffect, useMemo, useState } from 'react';
import { empreendimentos } from '@/lib/catalog.mjs';
import { TASK_EVENT, TASK_PRIORITIES, TASK_STAGES, countTasks, dueTasks, normalizeTask } from '@/lib/portal-tarefas.mjs';
import { humanDate, readTasks, todayLocal, writeTasks, type RochaTask, type TaskPriority, type TaskStage } from './task-store';
import Icone, { type NomeIcone } from '../ui/Icone';
import CabecalhoPagina from '../ui/CabecalhoPagina';

type FormState = Pick<RochaTask, 'titulo' | 'descricao' | 'responsavel' | 'projeto' | 'prazo' | 'etapa' | 'prioridade'>;
const INITIAL: FormState = { titulo: '', descricao: '', responsavel: '', projeto: '', prazo: '', etapa: 'pendente', prioridade: 'media' };
const stageName = (s: string) => TASK_STAGES.find((x: {id:string; label:string}) => x.id === s)?.label || s;
const priorityName = (s: string) => TASK_PRIORITIES.find((x: {id:string; label:string}) => x.id === s)?.label || s;
// R84: icone de cada etapa do quadro (a cor vem da classe r84b-etapa-*).
const ETAPA_ICONE: Record<string, NomeIcone> = { pendente: 'relogio', andamento: 'refazer', revisao: 'busca', concluida: 'checkCirculo' };

export default function TarefasClient() {
  const [tasks, setTasks] = useState<RochaTask[]>([]);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<'quadro' | 'lista'>('quadro');
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('todos');
  const [showEditor, setShowEditor] = useState(false);
  const [editId, setEditId] = useState('');
  const [form, setForm] = useState<FormState>(INITIAL);
  const [message, setMessage] = useState('');
  const [dragId, setDragId] = useState('');

  useEffect(() => {
    const update = () => { setTasks(readTasks()); setReady(true); };
    update();
    window.addEventListener('storage', update);
    window.addEventListener(TASK_EVENT, update);
    return () => { window.removeEventListener('storage', update); window.removeEventListener(TASK_EVENT, update); };
  }, []);

  const filtered = useMemo(() => tasks.filter(t =>
    (projectFilter === 'todos' || t.projeto === projectFilter) &&
    (!search.trim() || `${t.titulo} ${t.descricao} ${t.responsavel}`.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR')))
  ), [tasks, projectFilter, search]);
  const counts = countTasks(tasks);
  const vencidas = dueTasks(tasks, todayLocal());

  function persist(next: RochaTask[]) {
    try { setTasks(writeTasks(next)); setMessage('Alterações salvas apenas neste navegador.'); return true; }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível salvar a tarefa.'); return false; }
  }
  function openCreate() { setEditId(''); setForm(INITIAL); setShowEditor(true); setMessage(''); }
  function openEdit(task: RochaTask) {
    setEditId(task.id);
    setForm({ titulo:task.titulo, descricao:task.descricao, responsavel:task.responsavel, projeto:task.projeto, prazo:task.prazo, etapa:task.etapa, prioridade:task.prioridade });
    setShowEditor(true); setMessage('');
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const now = new Date().toISOString();
    const previous = tasks.find(t => t.id === editId);
    const draft: RochaTask = {
      ...form,
      id: editId || crypto.randomUUID(),
      criadoEm: previous?.criadoEm || now,
      atualizadoEm: now,
    };
    const valid = normalizeTask(draft);
    if (!valid) { setMessage('Informe um título válido e confira os dados da tarefa.'); return; }
    const next = editId ? tasks.map(t => t.id === editId ? draft : t) : [draft, ...tasks];
    if (persist(next)) { setShowEditor(false); setEditId(''); setForm(INITIAL); }
  }
  function moveTask(task: RochaTask, etapa: TaskStage) {
    if (task.etapa === etapa) return;
    persist(tasks.map(t => t.id === task.id ? { ...t, etapa, atualizadoEm: new Date().toISOString() } : t));
  }
  function removeTask(task: RochaTask) {
    if (!window.confirm(`Excluir a tarefa "${task.titulo}" deste navegador?`)) return;
    persist(tasks.filter(t => t.id !== task.id));
  }

  function TaskCard({ task }: {task: RochaTask}) {
    const over = task.prazo && task.prazo < todayLocal() && task.etapa !== 'concluida';
    return <article
      className={`r81-task-card r84b-card is-${task.prioridade}`}
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', task.id); setDragId(task.id); }}
      onDragEnd={() => setDragId('')}
    >
      <div className="r81-task-card-top">
        <span className={`r81-priority r84b-selo is-${task.prioridade}`}>{priorityName(task.prioridade)}</span>
        <button type="button" className="r84b-acao" aria-label={`Editar tarefa ${task.titulo}`} onClick={() => openEdit(task)}><Icone nome="editar" tamanho={16} />Editar</button>
      </div>
      <strong className="r84b-card-titulo">{task.titulo}</strong>
      {task.descricao ? <p>{task.descricao}</p> : null}
      <ul className="r84b-card-info r81-task-meta">
        <li><Icone nome="predio" tamanho={16} /><span>{task.projeto || 'Geral'}</span></li>
        <li className={over ? 'is-overdue' : ''}><Icone nome={over ? 'alerta' : 'calendario'} tamanho={16} /><span>{over ? 'Atrasada · ' : ''}{humanDate(task.prazo)}</span></li>
        {task.responsavel ? <li aria-label={`Responsável: ${task.responsavel}`}><Icone nome="usuarios" tamanho={16} /><span>{task.responsavel}</span></li> : null}
      </ul>
      <div className="r81-task-card-foot"><label className="r84b-mover">
        <span>Mover para</span>
        <select aria-label={`Mudar situação de ${task.titulo}`} value={task.etapa} onChange={e => moveTask(task, e.target.value as TaskStage)}>
          {TASK_STAGES.map((s: {id:string; label:string}) => <option value={s.id} key={s.id}>{s.label}</option>)}
        </select>
      </label><button type="button" className="r81-delete r84b-acao r84b-acao-perigo" onClick={() => removeTask(task)}><Icone nome="lixeira" tamanho={16} />Excluir</button></div>
    </article>;
  }

  return <section className="r81-tasks-page r84b-tarefas" data-area="tarefas" aria-label="Gestão local de tarefas Rocha">
    <CabecalhoPagina area="tarefas" icone="tarefas" titulo="Tarefas da equipe"
      descricao="Crie uma tarefa, defina prazo e responsável, e arraste o cartão entre as colunas conforme avança. As tarefas ficam salvas só neste navegador.">
      <button type="button" className="r84-btn" onClick={openCreate}><Icone nome="mais" tamanho={18} />Nova tarefa</button>
    </CabecalhoPagina>
    <div className="r81-local-alert r84b-aviso" role="note"><Icone nome="alerta" tamanho={22} /><div><strong>Modo local de demonstração.</strong> As tarefas ficam somente neste navegador. Responsáveis digitados aqui não recebem notificações, e nenhuma tarefa é compartilhada ou enviada aos funcionários.</div></div>
    <div className="r81-task-summary r84b-resumo">
      <div><span className="r84b-ico-resumo"><Icone nome="tarefas" tamanho={18} /></span><strong>{counts.total}</strong><span>Tarefas</span></div>
      <div><span className="r84b-ico-resumo"><Icone nome="relogio" tamanho={18} /></span><strong>{counts.abertas}</strong><span>Em aberto</span></div>
      <div><span className="r84b-ico-resumo"><Icone nome="checkCirculo" tamanho={18} /></span><strong>{counts.concluidas}</strong><span>Concluídas</span></div>
      <div className="r84b-resumo-alerta"><span className="r84b-ico-resumo"><Icone nome="alerta" tamanho={18} /></span><strong>{vencidas.filter((t: RochaTask) => t.prazo < todayLocal()).length}</strong><span>Vencidas</span></div>
    </div>
    <div className="r81-tasks-tools"><div className="r81-task-filters"><input type="search" aria-label="Buscar tarefas" placeholder="Buscar tarefas..." value={search} onChange={e=>setSearch(e.target.value)} />
      <select aria-label="Filtrar por empreendimento" value={projectFilter} onChange={e=>setProjectFilter(e.target.value)}><option value="todos">Todos os empreendimentos</option><option value="">Sem empreendimento</option>{empreendimentos.map(e => <option key={e.id} value={e.nome}>{e.nome}</option>)}</select></div>
      <div className="r81-view-switch r84b-abas" role="group" aria-label="Modo de visualização">
        <button type="button" aria-pressed={view==='quadro'} onClick={()=>setView('quadro')}><Icone nome="camadas" tamanho={18} />Quadro</button>
        <button type="button" aria-pressed={view==='lista'} onClick={()=>setView('lista')}><Icone nome="tabela" tamanho={18} />Lista</button>
      </div></div>
    {message ? <p className="r81-message r84b-feedback" role="status">{message}</p> : null}
    {view==='quadro' ? <div className="r81-board">
      {TASK_STAGES.map((s: {id:string; label:string}) => {
        const cards = filtered.filter(t => t.etapa===s.id);
        return <section key={s.id} className={`r81-board-column r81-stage-${s.id} r84b-coluna r84b-etapa-${s.id}`} aria-label={s.label}
          onDragOver={event => event.preventDefault()}
          onDrop={event => { event.preventDefault(); const id = event.dataTransfer.getData('text/plain') || dragId; const task = tasks.find(t=>t.id===id); if(task) moveTask(task, s.id as TaskStage); setDragId(''); }}>
          <header className="r84b-coluna-cab"><span className="r81-status-dot r84b-ponto" aria-hidden="true"/><Icone nome={ETAPA_ICONE[s.id] || 'tarefas'} tamanho={18} /><h2>{s.label}</h2><b className="r84b-pilula">{cards.length}</b></header>
          <div className="r81-board-cards">{cards.length ? cards.map(t => <TaskCard task={t} key={t.id}/>) : <div className="r81-empty-column">Arraste tarefas para cá ou adicione uma nova.</div>}</div>
        </section>;
      })}
    </div> : <div className="r81-tasks-list r84b-lista">{filtered.length ? filtered.map(t=><TaskCard key={t.id} task={t}/>) : <div className="r81-empty-list">Nenhuma tarefa encontrada. Crie sua primeira tarefa.</div>}</div>}
    {ready && tasks.length===0 ? <div className="r81-starter r84b-vazio"><span className="r84-icone-bloco r84-icone-bloco-lg" aria-hidden="true"><Icone nome="tarefas" tamanho={26} /></span><strong>Comece organizando sua operação.</strong><span>Crie uma tarefa, selecione o empreendimento e acompanhe seu andamento.</span><button type="button" className="r84-btn" onClick={openCreate}><Icone nome="mais" tamanho={18} />Criar primeira tarefa</button></div> : null}
    {showEditor ? <div className="r81-modal-backdrop" onMouseDown={e=>{ if(e.target===e.currentTarget)setShowEditor(false); }}><div className="r81-task-modal" role="dialog" aria-modal="true" aria-labelledby="r81-modal-title"><header><h2 id="r81-modal-title">{editId?'Editar tarefa':'Nova tarefa'}</h2><button type="button" aria-label="Fechar" className="r84b-fechar" onClick={()=>setShowEditor(false)}><Icone nome="fechar" tamanho={18} /></button></header>
      <form onSubmit={submit} className="r81-task-form"><label>Título da tarefa *<input autoFocus required minLength={3} maxLength={120} value={form.titulo} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))} placeholder="Ex.: Revisar o book comercial" /></label>
      <label>Descrição<textarea value={form.descricao} maxLength={1200} rows={3} onChange={e=>setForm(f=>({...f,descricao:e.target.value}))} placeholder="Detalhes, entregáveis e orientações" /></label>
      <div className="r81-form-grid"><label>Empreendimento<select value={form.projeto} onChange={e=>setForm(f=>({...f,projeto:e.target.value}))}><option value="">Geral / sem empreendimento</option>{empreendimentos.map(e=><option key={e.id} value={e.nome}>{e.nome}</option>)}</select></label>
      <label>Responsável (texto local)<input value={form.responsavel} maxLength={80} onChange={e=>setForm(f=>({...f,responsavel:e.target.value}))} placeholder="Ex.: Equipe comercial" /></label>
      <label>Prazo<input type="date" value={form.prazo} onChange={e=>setForm(f=>({...f,prazo:e.target.value}))}/></label>
      <label>Prioridade<select value={form.prioridade} onChange={e=>setForm(f=>({...f,prioridade:e.target.value as TaskPriority}))}>{TASK_PRIORITIES.map((p: {id:string;label:string})=><option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
      <label>Situação<select value={form.etapa} onChange={e=>setForm(f=>({...f,etapa:e.target.value as TaskStage}))}>{TASK_STAGES.map((s: {id:string;label:string})=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label></div>
      <footer><button type="button" className="r84-btn-sec" onClick={()=>setShowEditor(false)}>Cancelar</button><button className="r84-btn" type="submit"><Icone nome="check" tamanho={18} />{editId?'Salvar alterações':'Criar tarefa'}</button></footer></form></div></div> : null}
  </section>;
}
