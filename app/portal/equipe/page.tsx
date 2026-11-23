import type { Metadata } from 'next';
import EquipeClient from './EquipeClient';
import { exigirEquipe } from '@/lib/portal-guard';

export const metadata: Metadata = {
  title: 'Equipe Rocha | Portal Rocha',
  robots: { index: false, follow: false, nocache: true },
};
export const dynamic = 'force-dynamic';

export default async function PortalEquipe() {
  const sessao = await exigirEquipe();
  return <EquipeClient eu={{ id: sessao.id }} />;
}
