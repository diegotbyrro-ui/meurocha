import { notFound } from 'next/navigation';
import { SECOES_MATERIAIS, obterEmpreendimento } from '@/lib/empreendimentos-central.mjs';
import CentralEmpreendimentoClient from '../CentralEmpreendimentoClient';
import '../central.css';

export const dynamic = 'force-dynamic';

export default async function CentralEmpreendimentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const emp = obterEmpreendimento(id);
  if (!emp) return notFound();

  return <CentralEmpreendimentoClient emp={emp} secoes={SECOES_MATERIAIS} />;
}
