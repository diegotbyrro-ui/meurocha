'use client';

import { TASK_EVENT, TASK_STORAGE_KEY, normalizeTasks, TASK_MAX } from '@/lib/portal-tarefas.mjs';

export type TaskStage = 'pendente' | 'andamento' | 'revisao' | 'concluida';
export type TaskPriority = 'baixa' | 'media' | 'alta';
export type RochaTask = {
  id: string;
  titulo: string;
  descricao: string;
  responsavel: string;
  projeto: string;
  prazo: string;
  etapa: TaskStage;
  prioridade: TaskPriority;
  criadoEm: string;
  atualizadoEm: string;
};

export function readTasks(): RochaTask[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(TASK_STORAGE_KEY);
    return stored ? (normalizeTasks(JSON.parse(stored)) as RochaTask[]) : [];
  } catch {
    return [];
  }
}

export function writeTasks(value: RochaTask[]): RochaTask[] {
  const clean = normalizeTasks(value) as RochaTask[];
  if (value.length > TASK_MAX) throw new Error('Limite de 250 tarefas nesta prévia local.');
  if (clean.length !== value.length) throw new Error('Não foi possível validar todos os dados da tarefa.');
  window.localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify({ versao: 1, tasks: clean }));
  window.dispatchEvent(new Event(TASK_EVENT));
  return clean;
}

export function todayLocal(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function humanDate(input: string): string {
  if (!input) return 'Sem prazo';
  const parts = input.split('-').map(Number);
  if (parts.length !== 3) return input;
  return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}
