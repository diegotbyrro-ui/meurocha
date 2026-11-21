import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {empreendimentos} from '../lib/catalog.mjs';
import {bibliotecaCategorias} from '../lib/biblioteca.mjs';
import {TASK_STAGES, TASK_PRIORITIES, TASK_STORAGE_KEY, TASK_MAX, countTasks, dueTasks, nextTasks, normalizeTask, normalizeTasks, validDate} from '../lib/portal-tarefas.mjs';
const read=(p)=>readFileSync(join(process.cwd(),p),'utf8');
const layout=read('app/portal/layout.tsx');
const page=read('app/portal/page.tsx');
const board=read('app/portal/tarefas/TarefasClient.tsx');
const dash=read('app/portal/DashboardClient.tsx');
const css=read('app/portal/portal.css');
const base={id:'abc-1234',titulo:'Revisar material do empreendimento',descricao:'Revisar slides',responsavel:'Equipe',projeto:'Eco Vittá',prazo:'2026-11-21',etapa:'pendente',prioridade:'alta',criadoEm:'2026-11-20T10:00:00.000Z',atualizadoEm:'2026-11-20T12:00:00.000Z'};
test('R81: menu lateral e mobile com quadro de tarefas, preservando gate servidor',()=>{
  assert.match(layout,/if\(!portalCookieValid\(cookie\)\)/);
  assert.equal((layout.match(/href="\/portal\/tarefas"/g)||[]).length,2);
  assert.match(layout,/r79-logo-dark/);
  assert.match(layout,/Poppins\(/);
});
test('R81: 3 visoes reunidas na home sem indicadores ficticios',()=>{
  assert.match(page,/DashboardClient/);
  for(const token of ['Calendário de entregas','Empreendimentos','Prioridades da equipe','Atividade recente','Ferramentas rápidas']) assert.match(dash,new RegExp(token));
  assert.match(dash,/countTasks\(tasks\)/);
  assert.match(dash,/bibliotecaCategorias\.length/);
  assert.match(dash,/empreendimentos\.length/);
  assert.match(page,/sem publicação automática/);
  assert.doesNotMatch(dash,/vendas reais|250 propostas|80 corretores/i);
  assert.equal(empreendimentos.length,4);
  assert.equal(bibliotecaCategorias.length,16);
});
test('R81: quadro tipo Kanban com etapas, filtros, prioridades e drag/drop',()=>{
  assert.equal(TASK_STAGES.length,4);
  assert.equal(TASK_PRIORITIES.length,3);
  assert.match(board,/onDragStart/);
  assert.match(board,/onDrop/);
  assert.match(board,/Lista/);
  assert.match(board,/Quadro/);
  assert.match(board,/Nova tarefa/);
  assert.match(board,/writeTasks\(next\)/);
});
test('R81: contratos validam nomes, prioridades, estados e datas reais',()=>{
  assert.equal(validDate('2026-02-29'),false);
  assert.equal(validDate('2028-02-29'),true);
  assert.equal(validDate('2026-13-01'),false);
  assert.deepEqual(normalizeTask(base),base);
  assert.equal(normalizeTask({...base,titulo:'x'}),null);
  assert.equal(normalizeTask({...base,etapa:'owner'}),null);
  assert.equal(normalizeTask({...base,prazo:'2026-11-99'}),null);
});
test('R81: contagens e vencimentos sao calculados apenas das tarefas reais',()=>{
  const tasks=[base,{...base,id:'abc-5678',etapa:'concluida',titulo:'Finalizado',prazo:'2026-11-20'}];
  assert.deepEqual(countTasks(tasks).total,2);
  assert.deepEqual(countTasks(tasks).abertas,1);
  assert.deepEqual(countTasks(tasks).concluidas,1);
  assert.deepEqual(dueTasks(tasks,'2026-11-21').map(t=>t.id),['abc-1234']);
  assert.deepEqual(nextTasks(tasks,'2026-11-20',1).map(t=>t.id),['abc-1234']);
});
test('R81: dados invalidos, duplicados e excesso sao descartados',()=>{
  assert.equal(normalizeTasks([base,base,{...base,id:'',titulo:'falha'}]).length,1);
  assert.equal(normalizeTasks(Array.from({length:TASK_MAX+10},(_,i)=>({...base,id:`id-${i}`}))).length,TASK_MAX);
});
test('R81: localStorage da equipe permanece isolado, sem APIs de tarefa e sem login ficticio',()=>{
  assert.match(read('app/portal/tarefas/task-store.ts'),/window\.localStorage\.setItem/);
  assert.match(board,/somente neste navegador/);
  assert.match(dash,/navegador/);
  assert.match(TASK_STORAGE_KEY,/r81/);
  assert.doesNotMatch(board,/fetch\(|createClient\(|service_role/);
  assert.doesNotMatch(layout,/localStorage|mockAdmin/);
  assert.equal(existsSync(join(process.cwd(),'app/portal/tarefas/page.tsx')),true);
});
test('R81: CSS estiliza apenas classes R81 e nao modifica o Easy Rota do Mar',()=>{
  for(const token of ['r81-dashboard','r81-task-summary','r81-board','r81-project-grid','r81-modal-backdrop']) assert.match(css,new RegExp(token));
  assert.match(css,/\.rocha-portal\s+\.r81-dashboard/);
  assert.doesNotMatch(read('app/portal/tarefas/TarefasClient.tsx'),/easy-rota-do-mar\/entorno3d/);
});

test('R81 R2: callback da lista de prioridades declara RochaTask e evita TS7006',()=>{
  assert.match(dash,/upcoming\.map\(\(t: RochaTask\)\s*=>/);
});
