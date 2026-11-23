import type { Metadata } from 'next';
import TarefasClient from './TarefasClient';
import { exigirEquipe } from '@/lib/portal-guard';

export const metadata: Metadata = {
  title: 'Tarefas e projetos | Portal Rocha',
  robots: { index: false, follow: false, nocache: true },
};
export const dynamic = 'force-dynamic';

export default async function PortalTarefas() {
  const sessao = await exigirEquipe();
  return <TarefasClient eu={{ id: sessao.id, nome: sessao.nome }} />;
}
