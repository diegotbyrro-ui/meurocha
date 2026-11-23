import type { Metadata } from 'next';
import CorretoresClient from './CorretoresClient';
import { exigirEquipe } from '@/lib/portal-guard';

export const metadata: Metadata = {
  title: 'Corretores | Portal Rocha',
  robots: { index: false, follow: false, nocache: true },
};
export const dynamic = 'force-dynamic';

export default async function PortalCorretores() {
  await exigirEquipe();
  return <CorretoresClient />;
}
