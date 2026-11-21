'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { bibliotecaCategorias } from '@/lib/biblioteca.mjs';
import { empreendimentos } from '@/lib/catalog.mjs';
import { TASK_EVENT, countTasks, dueTasks, nextTasks } from '@/lib/portal-tarefas.mjs';
import { humanDate, readTasks, todayLocal, type RochaTask } from './tarefas/task-store';

function Icon({ type, size = 22 }: { type:'building'|'folder'|'calendar'|'check'|'users'|'clock'|'arrow'|'alert'|'tasks'|'chart', size?: number }) {
  const d: Record<typeof type, React.ReactNode> = {
    building:<><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h2m4 0h2M8 11h2m4 0h2M8 15h2m4 0h2M10 21v-4h4v4"/></>,
    folder:<><path d="M3 6h7l2 2h9v11H3z" strokeLinejoin="round"/><path d="M3 6V5h7l2 3"/></>,
    calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/></>,
    check:<><path d="m4 12 5 5L20 6"/></>,
    users:<><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2m2-12a3 3 0 0 1 0 6m2 6a5 5 0 0 0-4-5"/></>,
    clock:<><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></>,
    arrow:<><path d="M4 12h16m-6-6 6 6-6 6"/></>,
    alert:<><path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5m0 3v.3"/></>,
    tasks:<><rect x="4" y="4" width="16" height="16" rx="2"/><path d="m8 10 2 2 4-4m-6 9h8"/></>,
    chart:<><path d="M4 20V4m0 16h16M8 15l4-4 3 2 5-7"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d[type]}</svg>;
}

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
function Calendar({ tasks }: { tasks: RochaTask[] }) {
  const [offset, setOffset] = useState(0);
  const monthBase = new Date();
  monthBase.setDate(1);
  monthBase.setMonth(monthBase.getMonth() + offset);
  const year = monthBase.getFullYear(), month = monthBase.getMonth();
  const first = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({length: Math.ceil((first + totalDays) / 7)*7}, (_,i) => i-first+1);
  const dateNow = todayLocal();
  const dueMap = new Map<string,number>();
  for (const t of tasks) if (t.prazo && t.etapa !== 'concluida') dueMap.set(t.prazo, (dueMap.get(t.prazo)||0)+1);
  const monthTitle = monthBase.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
  return <section className="r81-panel r81-calendar" aria-label="Calendário de prazos das tarefas"><div className="r81-panel-heading"><div><Icon type="calendar"/><h2>Calendário de entregas</h2></div><Link href="/portal/tarefas">Ver tarefas</Link></div>
    <div className="r81-month-nav"><strong>{monthTitle}</strong><div><button type="button" aria-label="Mês anterior" onClick={()=>setOffset(o=>o-1)}>‹</button><button type="button" aria-label="Mês atual" onClick={()=>setOffset(0)}>Hoje</button><button type="button" aria-label="Próximo mês" onClick={()=>setOffset(o=>o+1)}>›</button></div></div>
    <div className="r81-calendar-grid">{WEEK_DAYS.map((d,i)=><span className="r81-weekday" key={i}>{d}</span>)}{cells.map((day,i)=>{
      const valid=day>=1 && day<=totalDays;
      const date = valid ? `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` : '';
      const due=dueMap.get(date) || 0;
      return <div key={i} className={`r81-cal-day${!valid?' is-outside':''}${date===dateNow?' is-today':''}${due?' has-events':''}`} title={due ? `${due} tarefa(s) com prazo neste dia` : undefined}>{valid?day:''}{due>0?<i title={`${due} tarefa(s)`}/>:null}</div>;
    })}</div><p className="r81-calendar-foot">Os pontos sinalizam prazos das tarefas cadastradas neste navegador.</p>
  </section>;
}

export default function DashboardClient() {
  const [tasks,setTasks]=useState<RochaTask[]>([]);
  const [loaded,setLoaded]=useState(false);
  const [filter,setFilter]=useState('');
  useEffect(()=>{
    const update=()=>{setTasks(readTasks());setLoaded(true);};
    update(); window.addEventListener('storage',update);window.addEventListener(TASK_EVENT,update);
    return ()=>{window.removeEventListener('storage',update);window.removeEventListener(TASK_EVENT,update);};
  },[]);
  const today = todayLocal();
  const counts = countTasks(tasks);
  const due = dueTasks(tasks,today);
  const upcoming = nextTasks(tasks,today,5);
  const recent = useMemo(()=>tasks.slice().sort((a,b)=>b.atualizadoEm.localeCompare(a.atualizadoEm)).slice(0,4),[tasks]);
  const projects = empreendimentos.filter(p=>`${p.nome} ${p.bairro} ${p.cidade}`.toLocaleLowerCase('pt-BR').includes(filter.trim().toLocaleLowerCase('pt-BR')));

  return <section className="r81-dashboard" aria-label="Visão geral da operação comercial Rocha">
    <header className="r81-dashboard-head"><div><span className="r81-eyebrow">PORTAL COMERCIAL ROCHA · ÁREA DE TRABALHO</span><h1>Visão geral</h1><p>Empreendimentos, rotina da equipe e ferramentas em um único lugar.</p></div><Link href="/portal/tarefas" className="r81-primary-btn"><Icon type="tasks" size={18}/> Gerenciar tarefas</Link></header>
    <div className="r81-local-alert"><strong>Prévia local.</strong> Os indicadores de tarefas usam apenas este navegador. Empreendimentos são referências do catálogo; não há sincronização com CRM, estoque, vendas ou dados de outras pessoas.</div>
    <div className="r81-kpis">
      <div className="r81-kpi"><div className="r81-kpi-icon"><Icon type="building"/></div><div><small>Empreendimentos de referência</small><strong>{empreendimentos.length}</strong><span>Catálogo preliminar</span></div></div>
      <div className="r81-kpi"><div className="r81-kpi-icon"><Icon type="folder"/></div><div><small>Categorias da biblioteca</small><strong>{bibliotecaCategorias.length}</strong><span>Pastas fixas</span></div></div>
      <div className="r81-kpi"><div className="r81-kpi-icon"><Icon type="tasks"/></div><div><small>Tarefas em aberto</small><strong>{loaded?counts.abertas:'—'}</strong><span>Somente neste navegador</span></div></div>
      <div className="r81-kpi"><div className="r81-kpi-icon"><Icon type="alert"/></div><div><small>Prazos até hoje</small><strong>{loaded?due.length:'—'}</strong><span>Tarefas locais não concluídas</span></div></div>
    </div>

    <div className="r81-content-grid">
      <section className="r81-panel r81-attention"><div className="r81-panel-heading"><div><Icon type="tasks"/><h2>Prioridades da equipe</h2></div><Link href="/portal/tarefas">Abrir quadro <Icon type="arrow" size={16}/></Link></div>
        {upcoming.length? <div className="r81-task-lines">{upcoming.map((t: RochaTask)=><div key={t.id} className="r81-task-line"><span className={`r81-task-check ${t.etapa}`}>{t.etapa==='concluida'?'✓':''}</span><div><strong>{t.titulo}</strong><small>{t.projeto||'Geral'}{t.responsavel ? ` · ${t.responsavel}` : ''}</small></div><span className={t.prazo && t.prazo<today?'is-late':''}>{humanDate(t.prazo)}</span></div>)}</div> : <div className="r81-empty-state"><Icon type="check" size={29}/><strong>Seu quadro está pronto.</strong><p>Crie tarefas para acompanhar revisões, materiais e entregas da equipe.</p><Link href="/portal/tarefas">Criar primeira tarefa</Link></div>}
      </section>
      <section className="r81-panel r81-activity"><div className="r81-panel-heading"><div><Icon type="clock"/><h2>Atividade recente</h2></div><span>Este navegador</span></div>
        {recent.length?<div className="r81-activity-list">{recent.map(t=><div key={t.id} className="r81-activity-line"><span className="r81-activity-mark"/><div><strong>{t.titulo}</strong><small>{t.etapa==='concluida'?'Concluída':t.etapa==='revisao'?'Em revisão':t.etapa==='andamento'?'Em andamento':'A fazer'} · {new Date(t.atualizadoEm).toLocaleDateString('pt-BR')}</small></div></div>)}</div> : <div className="r81-empty-state"><Icon type="clock" size={29}/><strong>Sem movimentações ainda.</strong><p>As tarefas que você criar e atualizar aparecerão aqui.</p></div>}
      </section>
    </div>

    <div className="r81-section-heading"><div><span className="r81-eyebrow">CATÁLOGO ROCHA</span><h2>Empreendimentos</h2><p>Visão inicial dos projetos. Fotos, porcentagens e disponibilidade dependem de dados homologados.</p></div><Link href="/portal/gestao">Gerenciar empreendimentos <Icon type="arrow" size={17}/></Link></div>
    <div className="r81-project-search"><Icon type="building" size={17}/><input type="search" aria-label="Buscar empreendimentos" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Buscar empreendimento, bairro ou cidade..."/></div>
    <div className="r81-project-grid">{projects.map((p,i)=><article className="r81-project" key={p.id}><div className={`r81-project-image tone-${i%4}`} aria-hidden="true"><svg viewBox="0 0 260 150" fill="none"><path d="M48 135V52l55-22 54 22v83M157 135V71l54-16v80" stroke="currentColor" strokeWidth="2" opacity=".5"/><path d="M70 66h15m21 0h15M70 87h15m21 0h15M70 109h15m21 0h15M174 89h17m-17 21h17" stroke="currentColor" strokeWidth="3" opacity=".5"/></svg><span>ROCHA</span></div><div className="r81-project-body"><small>EMPREENDIMENTO DE REFERÊNCIA</small><h3>{p.nome}</h3><p>{p.bairro} · {p.cidade}</p><div><Link href="/portal/gestao">Gerenciar projeto <Icon type="arrow" size={16}/></Link></div></div></article>)}{projects.length===0?<div className="r81-empty-project">Nenhum empreendimento encontrado.</div>:null}</div>

    <div className="r81-lower-grid"><Calendar tasks={tasks}/><section className="r81-panel r81-shortcuts"><div className="r81-panel-heading"><div><Icon type="chart"/><h2>Ferramentas rápidas</h2></div></div><div className="r81-shortcut-items">
        <Link href="/portal/biblioteca"><span><Icon type="folder"/></span><div><strong>Biblioteca digital</strong><small>Pastas e arquivos locais</small></div><Icon type="arrow" size={17}/></Link>
        <Link href="/portal/simulador"><span><Icon type="chart"/></span><div><strong>Simulador comercial</strong><small>Cálculos demonstrativos, sem taxas oficiais</small></div><Icon type="arrow" size={17}/></Link>
        <Link href="/portal/gestao"><span><Icon type="building"/></span><div><strong>Cadastro de empreendimentos</strong><small>Rascunhos e fotos nesta máquina</small></div><Icon type="arrow" size={17}/></Link>
        <Link href="/portal/tarefas"><span><Icon type="tasks"/></span><div><strong>Quadro de tarefas</strong><small>Prioridades, prazos e andamento</small></div><Icon type="arrow" size={17}/></Link>
      </div><div className="r81-access-note"><Icon type="users" size={21}/><p><strong>Contas de funcionários:</strong> a administração exclusiva do proprietário será implementada com autenticação individual. Não existe cadastro de usuários liberado nesta versão.</p></div></section></div>
  </section>;
}
