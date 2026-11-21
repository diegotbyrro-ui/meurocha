/**
 * R81 - Contrato do protótipo local de tarefas do Portal Rocha.
 * Nenhuma leitura/escrita em banco remoto. Identidade individual e permissões
 * continuam pendentes de autenticação validada no servidor.
 */
export const TASK_STORAGE_KEY = 'rocha-portal-tarefas-r81';
export const TASK_EVENT = 'rocha-portal-tarefas-atualizadas';
export const TASK_STAGES = Object.freeze([
  { id: 'pendente', label: 'A fazer' },
  { id: 'andamento', label: 'Em andamento' },
  { id: 'revisao', label: 'Em revisão' },
  { id: 'concluida', label: 'Concluído' },
]);
export const TASK_PRIORITIES = Object.freeze([
  { id: 'baixa', label: 'Baixa' },
  { id: 'media', label: 'Média' },
  { id: 'alta', label: 'Alta' },
]);
export const TASK_MAX = 250;
const STAGES = new Set(TASK_STAGES.map((s) => s.id));
const PRIORITIES = new Set(TASK_PRIORITIES.map((s) => s.id));
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
function clean(value, max = 160) { return typeof value === 'string' ? value.trim().replace(/[\u0000-\u001f]/g, ' ').slice(0, max) : ''; }
export function validDate(value) {
  if (value === '') return true;
  if (typeof value !== 'string' || !DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 2000 || year > 2100) return false;
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}
export function normalizeTask(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const id = clean(value.id, 90);
  const titulo = clean(value.titulo, 120);
  const descricao = clean(value.descricao, 1200);
  const responsavel = clean(value.responsavel, 80);
  const projeto = clean(value.projeto, 90);
  const prazo = clean(value.prazo, 10);
  const etapa = clean(value.etapa, 30);
  const prioridade = clean(value.prioridade, 20);
  const criadoEm = clean(value.criadoEm, 40);
  const atualizadoEm = clean(value.atualizadoEm, 40);
  if (id.length < 4 || titulo.length < 3 || !STAGES.has(etapa) || !PRIORITIES.has(prioridade) || !validDate(prazo)) return null;
  if (!criadoEm || !atualizadoEm || !Number.isFinite(Date.parse(criadoEm)) || !Number.isFinite(Date.parse(atualizadoEm))) return null;
  return { id, titulo, descricao, responsavel, projeto, prazo, etapa, prioridade, criadoEm, atualizadoEm };
}
export function normalizeTasks(input) {
  const candidate = Array.isArray(input) ? input : (input && typeof input === 'object' && Array.isArray(input.tasks) ? input.tasks : []);
  const ids = new Set();
  return candidate.slice(0, TASK_MAX).map(normalizeTask).filter((x) => { if (!x || ids.has(x.id)) return false; ids.add(x.id); return true; });
}
export function countTasks(tasks) {
  const list = normalizeTasks(tasks);
  const byStage = Object.fromEntries(TASK_STAGES.map(({ id }) => [id, 0]));
  for (const t of list) byStage[t.etapa]++;
  return { total: list.length, abertas: list.length - byStage.concluida, concluidas: byStage.concluida, porEtapa: byStage };
}
export function dueTasks(tasks, today) {
  if (!validDate(today) || !today) return [];
  return normalizeTasks(tasks)
    .filter((t) => t.etapa !== 'concluida' && t.prazo && t.prazo <= today)
    .sort((a, b) => a.prazo.localeCompare(b.prazo) || a.titulo.localeCompare(b.titulo));
}
export function nextTasks(tasks, today, limit = 5) {
  if (!validDate(today) || !today) return [];
  return normalizeTasks(tasks)
    .filter((t) => t.etapa !== 'concluida')
    .sort((a, b) => (a.prazo || '9999-12-31').localeCompare(b.prazo || '9999-12-31') || b.atualizadoEm.localeCompare(a.atualizadoEm))
    .slice(0, Math.max(0, Math.min(30, limit)));
}
