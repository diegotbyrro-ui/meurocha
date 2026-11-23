'use client';

import { TASK_STORAGE_KEY, normalizeTasks } from '@/lib/portal-tarefas.mjs';

// R85 - Tipos e funções compartilhados do quadro de tarefas (dados vêm do Supabase, via /api/portal/tarefas).

export type TaskPriority = 'baixa' | 'media' | 'alta';

export type Coluna = {
  id: string;
  nome: string;
  cor: string;
  ordem: number;
  conta_como_concluida: boolean;
};

export type Tarefa = {
  id: string;
  titulo: string;
  descricao: string;
  empreendimento: string;
  prazo: string;
  coluna_id: string;
  ordem: number;
  prioridade: TaskPriority;
  responsavel_id: string | null;
  criado_por?: string | null;
  criado_em?: string;
  atualizado_em?: string;
};

export type MembroEquipe = { id: string; nome: string; setor: string };

export type Quadro = {
  colunas: Coluna[];
  tarefas: Tarefa[];
  equipe: MembroEquipe[];
  inativos: { id: string; nome: string }[];
};

// Versão local antiga (R81). Só o painel inicial ainda a lê; o quadro de tarefas não usa mais o navegador.
export type TaskStage = 'pendente' | 'andamento' | 'revisao' | 'concluida';
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
