import type { Metadata } from 'next';
import TarefasClient from './TarefasClient';

export const metadata: Metadata = {
  title: 'Tarefas e projetos | Portal Rocha',
  robots: { index: false, follow: false, nocache: true },
};
export const dynamic = 'force-dynamic';

export default function PortalTarefas() { return <TarefasClient />; }
