'use client';

import './r84-inicio.css';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { bibliotecaCategorias } from '@/lib/biblioteca.mjs';
import { empreendimentos } from '@/lib/catalog.mjs';
import { TASK_EVENT, countTasks, dueTasks, nextTasks } from '@/lib/portal-tarefas.mjs';
import AjudaPagina from './ajuda/AjudaPagina';
import CabecalhoPagina from './ui/CabecalhoPagina';
import Icone from './ui/Icone';
import { humanDate, readTasks, todayLocal, type RochaTask } from './tarefas/task-store';

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
  return <section className="r81-panel r81-calendar" aria-label="Calendário de prazos das tarefas"><div className="r81-panel-heading"><div><span className="r84-icone-bloco" data-area="tarefas" aria-hidden="true"><Icone nome="calendario" tamanho={20} /></span><h2>Calendário de entregas</h2></div><Link href="/portal/tarefas">Ver tarefas</Link></div>
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

  return <section className="r81-dashboard r84i-inicio" aria-label="Visão geral da operação comercial Rocha">
    <CabecalhoPagina area="inicio" icone="inicio" titulo="Olá! O que vamos fazer hoje?" descricao="Escolha uma das tarefas abaixo. Se for a primeira vez, leia os passos de boas-vindas."><Link href="/portal/ajuda" className="r84-btn-sec"><Icone nome="pergunta" tamanho={18} /> Abrir a ajuda</Link></CabecalhoPagina>
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
    <div className="r81-local-alert"><strong>Atenção:</strong> as tarefas abaixo ficam salvas só neste navegador. Outra pessoa, em outro computador, não vê as suas tarefas.</div>
    <div className="r81-kpis">
      <div className="r81-kpi" data-area="central"><div className="r84-icone-bloco r84i-kpi-icone" aria-hidden="true"><Icone nome="predio" tamanho={22} /></div><div><small>Empreendimentos de referência</small><strong>{empreendimentos.length}</strong><span>Catálogo preliminar</span></div></div>
      <div className="r81-kpi" data-area="biblioteca"><div className="r84-icone-bloco r84i-kpi-icone" aria-hidden="true"><Icone nome="pasta" tamanho={22} /></div><div><small>Categorias da biblioteca</small><strong>{bibliotecaCategorias.length}</strong><span>Pastas fixas</span></div></div>
      <div className="r81-kpi" data-area="tarefas"><div className="r84-icone-bloco r84i-kpi-icone" aria-hidden="true"><Icone nome="tarefas" tamanho={22} /></div><div><small>Tarefas em aberto</small><strong>{loaded?counts.abertas:'—'}</strong><span>Somente neste navegador</span></div></div>
      <div className="r81-kpi" data-area="atualizar"><div className="r84-icone-bloco r84i-kpi-icone" aria-hidden="true"><Icone nome="alerta" tamanho={22} /></div><div><small>Prazos até hoje</small><strong>{loaded?due.length:'—'}</strong><span>Tarefas locais não concluídas</span></div></div>
    </div>

    <div className="r81-content-grid">
      <section className="r81-panel r81-attention"><div className="r81-panel-heading"><div><span className="r84-icone-bloco" data-area="tarefas" aria-hidden="true"><Icone nome="tarefas" tamanho={20} /></span><h2>Prioridades da equipe</h2></div><Link href="/portal/tarefas">Abrir quadro <Icone nome="setaDireita" tamanho={16} /></Link></div>
        {upcoming.length? <div className="r81-task-lines">{upcoming.map((t: RochaTask)=><div key={t.id} className="r81-task-line"><span className={`r81-task-check ${t.etapa}`}>{t.etapa==='concluida'?'✓':''}</span><div><strong>{t.titulo}</strong><small>{t.projeto||'Geral'}{t.responsavel ? ` · ${t.responsavel}` : ''}</small></div><span className={t.prazo && t.prazo<today?'is-late':''}>{humanDate(t.prazo)}</span></div>)}</div> : <div className="r81-empty-state"><span className="r84-icone-bloco r84-icone-bloco-lg" data-area="tarefas" aria-hidden="true"><Icone nome="checkCirculo" tamanho={26} /></span><strong>Seu quadro está pronto.</strong><p>Crie tarefas para acompanhar revisões, materiais e entregas da equipe.</p><Link href="/portal/tarefas">Criar primeira tarefa</Link></div>}
      </section>
      <section className="r81-panel r81-activity"><div className="r81-panel-heading"><div><span className="r84-icone-bloco" data-area="atualizar" aria-hidden="true"><Icone nome="relogio" tamanho={20} /></span><h2>Atividade recente</h2></div><span>Este navegador</span></div>
        {recent.length?<div className="r81-activity-list">{recent.map(t=><div key={t.id} className="r81-activity-line"><span className="r81-activity-mark"/><div><strong>{t.titulo}</strong><small>{t.etapa==='concluida'?'Concluída':t.etapa==='revisao'?'Em revisão':t.etapa==='andamento'?'Em andamento':'A fazer'} · {new Date(t.atualizadoEm).toLocaleDateString('pt-BR')}</small></div></div>)}</div> : <div className="r81-empty-state"><span className="r84-icone-bloco r84-icone-bloco-lg" data-area="atualizar" aria-hidden="true"><Icone nome="relogio" tamanho={26} /></span><strong>Sem movimentações ainda.</strong><p>As tarefas que você criar e atualizar aparecerão aqui.</p></div>}
      </section>
    </div>

    <div className="r81-section-heading"><div><h2>Empreendimentos</h2><p>Clique em um empreendimento para ver CNPJ, PIX e materiais.</p></div><Link href="/portal/central">Abrir a Central <Icone nome="setaDireita" tamanho={17} /></Link></div>
    <div className="r81-project-search"><Icone nome="predio" tamanho={18} /><input type="search" aria-label="Buscar empreendimentos" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Buscar empreendimento, bairro ou cidade..."/></div>
    <div className="r81-project-grid">{projects.map((p,i)=><Link key={p.id} href={`/portal/central/${p.id}`} className="r84-cartao r84-cartao-clicavel r81-project r84i-projeto" data-area="central"><div className={`r81-project-image tone-${i%4}`}><span className="r84i-capa-status">{p.status}</span><Icone nome="predio" tamanho={56} /></div><div className="r81-project-body"><h3>{p.nome}</h3><p>{p.bairro} · {p.cidade}</p><span className="r84i-projeto-cta">Abrir na Central <Icone nome="setaDireita" tamanho={16} /></span></div></Link>)}{projects.length===0?<div className="r81-empty-project">Nenhum empreendimento encontrado.</div>:null}</div>

    <div className="r81-lower-grid"><Calendar tasks={tasks}/><section className="r81-panel r81-shortcuts"><div className="r81-panel-heading"><div><span className="r84-icone-bloco" data-area="simulador" aria-hidden="true"><Icone nome="grafico" tamanho={20} /></span><h2>Ferramentas rápidas</h2></div></div><div className="r81-shortcut-items">
        <Link href="/portal/central" data-area="central"><span className="r84-icone-bloco" aria-hidden="true"><Icone nome="predio" tamanho={20} /></span><div><strong>Central dos empreendimentos</strong><small>CNPJ, PIX, materiais e postagens</small></div><Icone nome="setaDireita" tamanho={17} /></Link>
        <Link href="/portal/biblioteca" data-area="biblioteca"><span className="r84-icone-bloco" aria-hidden="true"><Icone nome="pasta" tamanho={20} /></span><div><strong>Biblioteca digital</strong><small>Pastas e arquivos locais</small></div><Icone nome="setaDireita" tamanho={17} /></Link>
        <Link href="/portal/simulador" data-area="simulador"><span className="r84-icone-bloco" aria-hidden="true"><Icone nome="grafico" tamanho={20} /></span><div><strong>Simulador de entrada</strong><small>Entrada, parcelas, INCC e proposta impressa</small></div><Icone nome="setaDireita" tamanho={17} /></Link>
        <Link href="/portal/gestao" data-area="cadastro"><span className="r84-icone-bloco" aria-hidden="true"><Icone nome="predio" tamanho={20} /></span><div><strong>Cadastro de empreendimentos</strong><small>Rascunhos e fotos nesta máquina</small></div><Icone nome="setaDireita" tamanho={17} /></Link>
        <Link href="/portal/tarefas" data-area="tarefas"><span className="r84-icone-bloco" aria-hidden="true"><Icone nome="tarefas" tamanho={20} /></span><div><strong>Quadro de tarefas</strong><small>Prioridades, prazos e andamento</small></div><Icone nome="setaDireita" tamanho={17} /></Link>
      </div><div className="r81-access-note"><Icone nome="usuarios" tamanho={21} /><p><strong>Contas de funcionários:</strong> a administração exclusiva do proprietário será implementada com autenticação individual. Não existe cadastro de usuários liberado nesta versão.</p></div></section></div>
  </section>;
}
