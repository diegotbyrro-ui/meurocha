import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SECOES_MATERIAIS, obterEmpreendimento } from '@/lib/empreendimentos-central.mjs';
import CabecalhoPagina from '../../ui/CabecalhoPagina';
import Icone from '../../ui/Icone';
import CentralEmpreendimentoClient from '../CentralEmpreendimentoClient';
import '../central.css';

export const dynamic = 'force-dynamic';

export default async function CentralEmpreendimentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const emp = obterEmpreendimento(id);
  if (!emp) return notFound();

  return (
    <section className="r82-central">
      <CabecalhoPagina
        area="central"
        icone="predio"
        titulo={emp.nome}
        descricao={`${emp.bairro} · ${emp.cidade} · ${emp.status}`}
        antes={
          <nav aria-label="Caminho de navegação">
            <Link href="/portal/central" className="r82-crumb">
              <Icone nome="setaEsquerda" tamanho={16} />
              <span>Central dos empreendimentos</span>
            </Link>
          </nav>
        }
      >
        <Link href={`/portal/simulador?emp=${emp.id}`} className="r84-btn-sec">
          <Icone nome="calculadora" tamanho={18} />
          <span>Abrir simulador</span>
        </Link>
      </CabecalhoPagina>

      <CentralEmpreendimentoClient emp={emp} secoes={SECOES_MATERIAIS} />
    </section>
  );
}
