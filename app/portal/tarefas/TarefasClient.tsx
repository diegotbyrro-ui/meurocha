'use client';

import { useEffect, useMemo, useState } from 'react';
import { empreendimentos } from '@/lib/catalog.mjs';
import { TASK_EVENT, TASK_PRIORITIES, TASK_STAGES, countTasks, dueTasks, normalizeTask } from '@/lib/portal-tarefas.mjs';
import { humanDate, readTasks, todayLocal, writeTasks, type RochaTask, type TaskPriority, type TaskStage } from './task-store';

type FormState = Pick<RochaTask, 'titulo' | 'descricao' | 'responsavel' | 'projeto' | 'prazo' | 'etapa' | 'prioridade'>;
const INITIAL: FormState = { titulo: '', descricao: '', responsavel: '', projeto: '', prazo: '', etapa: 'pendente', prioridade: 'media' };
const stageName = (s: string) => TASK_STAGES.find((x: {id:string; label:string}) => x.id === s)?.label || s;
const priorityName = (s: string) => TASK_PRIORITIES.find((x: {id:string; label:string}) => x.id === s)?.label || s;

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
      className="r81-task-card"
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', task.id); setDragId(task.id); }}
      onDragEnd={() => setDragId('')}
    >
      <div className="r81-task-card-top"><span className={`r81-priority is-${task.prioridade}`}>{priorityName(task.prioridade)}</span><button type="button" aria-label={`Editar tarefa ${task.titulo}`} onClick={() => openEdit(task)}>Editar</button></div>
      <strong>{task.titulo}</strong>
      {task.descricao ? <p>{task.descricao}</p> : null}
      <div className="r81-task-meta">{task.projeto ? <span>{task.projeto}</span> : <span>Geral</span>}<span className={over ? 'is-overdue' : ''}>{humanDate(task.prazo)}</span></div>
      {task.responsavel ? <small>Responsável: {task.responsavel}</small> : null}
      <div className="r81-task-card-foot"><label>
        <span>Mover para</span>
        <select aria-label={`Mudar situação de ${task.titulo}`} value={task.etapa} onChange={e => moveTask(task, e.target.value as TaskStage)}>
          {TASK_STAGES.map((s: {id:string; label:string}) => <option value={s.id} key={s.id}>{s.label}</option>)}
        </select>
      </label><button type="button" className="r81-delete" onClick={() => removeTask(task)}>Excluir</button></div>
    </article>;
  }

  return <section className="r81-tasks-page" aria-label="Gestão local de tarefas Rocha">
    <header className="r81-page-head"><div><h1>Tarefas da equipe</h1><p>Crie uma tarefa, defina prazo e responsável, e arraste o cartão entre as colunas conforme avança. As tarefas ficam salvas só neste navegador.</p></div><button className="r81-primary-btn" type="button" onClick={openCreate}>+ Nova tarefa</button></header>
    <div className="r81-local-alert"><strong>Modo local de demonstração.</strong> As tarefas ficam somente neste navegador. Responsáveis digitados aqui não recebem notificações, e nenhuma tarefa é compartilhada ou enviada aos funcionários.</div>
    <div className="r81-task-summary"><div><span>Tarefas</span><strong>{counts.total}</strong></div><div><span>Em aberto</span><strong>{counts.abertas}</strong></div><div><span>Concluídas</span><strong>{counts.concluidas}</strong></div><div><span>Vencidas</span><strong>{vencidas.filter((t: RochaTask) => t.prazo < todayLocal()).length}</strong></div></div>
    <div className="r81-tasks-tools"><div className="r81-task-filters"><input type="search" aria-label="Buscar tarefas" placeholder="Buscar tarefas..." value={search} onChange={e=>setSearch(e.target.value)} />
      <select aria-label="Filtrar por empreendimento" value={projectFilter} onChange={e=>setProjectFilter(e.target.value)}><option value="todos">Todos os empreendimentos</option><option value="">Sem empreendimento</option>{empreendimentos.map(e => <option key={e.id} value={e.nome}>{e.nome}</option>)}</select></div>
      <div className="r81-view-switch" role="group" aria-label="Modo de visualização"><button type="button" aria-pressed={view==='quadro'} onClick={()=>setView('quadro')}>Quadro</button><button type="button" aria-pressed={view==='lista'} onClick={()=>setView('lista')}>Lista</button></div></div>
    {message ? <p className="r81-message" role="status">{message}</p> : null}
    {view==='quadro' ? <div className="r81-board">
      {TASK_STAGES.map((s: {id:string; label:string}) => {
        const cards = filtered.filter(t => t.etapa===s.id);
        return <section key={s.id} className={`r81-board-column r81-stage-${s.id}`} aria-label={s.label}
          onDragOver={event => event.preventDefault()}
          onDrop={event => { event.preventDefault(); const id = event.dataTransfer.getData('text/plain') || dragId; const task = tasks.find(t=>t.id===id); if(task) moveTask(task, s.id as TaskStage); setDragId(''); }}>
          <header><span className="r81-status-dot"/><h2>{s.label}</h2><b>{cards.length}</b></header>
          <div className="r81-board-cards">{cards.length ? cards.map(t => <TaskCard task={t} key={t.id}/>) : <div className="r81-empty-column">Arraste tarefas para cá ou adicione uma nova.</div>}</div>
        </section>;
      })}
    </div> : <div className="r81-tasks-list">{filtered.length ? filtered.map(t=><TaskCard key={t.id} task={t}/>) : <div className="r81-empty-list">Nenhuma tarefa encontrada. Crie sua primeira tarefa.</div>}</div>}
    {ready && tasks.length===0 ? <div className="r81-starter"><strong>Comece organizando sua operação.</strong><span>Crie uma tarefa, selecione o empreendimento e acompanhe seu andamento.</span><button type="button" onClick={openCreate}>Criar primeira tarefa</button></div> : null}
    {showEditor ? <div className="r81-modal-backdrop" onMouseDown={e=>{ if(e.target===e.currentTarget)setShowEditor(false); }}><div className="r81-task-modal" role="dialog" aria-modal="true" aria-labelledby="r81-modal-title"><header><h2 id="r81-modal-title">{editId?'Editar tarefa':'Nova tarefa'}</h2><button type="button" aria-label="Fechar" onClick={()=>setShowEditor(false)}>×</button></header>
      <form onSubmit={submit} className="r81-task-form"><label>Título da tarefa *<input autoFocus required minLength={3} maxLength={120} value={form.titulo} onChange={e=>setForm(f=>({...f,titulo:e.target.value}))} placeholder="Ex.: Revisar o book comercial" /></label>
      <label>Descrição<textarea value={form.descricao} maxLength={1200} rows={3} onChange={e=>setForm(f=>({...f,descricao:e.target.value}))} placeholder="Detalhes, entregáveis e orientações" /></label>
      <div className="r81-form-grid"><label>Empreendimento<select value={form.projeto} onChange={e=>setForm(f=>({...f,projeto:e.target.value}))}><option value="">Geral / sem empreendimento</option>{empreendimentos.map(e=><option key={e.id} value={e.nome}>{e.nome}</option>)}</select></label>
      <label>Responsável (texto local)<input value={form.responsavel} maxLength={80} onChange={e=>setForm(f=>({...f,responsavel:e.target.value}))} placeholder="Ex.: Equipe comercial" /></label>
      <label>Prazo<input type="date" value={form.prazo} onChange={e=>setForm(f=>({...f,prazo:e.target.value}))}/></label>
      <label>Prioridade<select value={form.prioridade} onChange={e=>setForm(f=>({...f,prioridade:e.target.value as TaskPriority}))}>{TASK_PRIORITIES.map((p: {id:string;label:string})=><option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
      <label>Situação<select value={form.etapa} onChange={e=>setForm(f=>({...f,etapa:e.target.value as TaskStage}))}>{TASK_STAGES.map((s: {id:string;label:string})=><option key={s.id} value={s.id}>{s.label}</option>)}</select></label></div>
      <footer><button type="button" onClick={()=>setShowEditor(false)}>Cancelar</button><button className="r81-primary-btn" type="submit">{editId?'Salvar alterações':'Criar tarefa'}</button></footer></form></div></div> : null}
  </section>;
}
