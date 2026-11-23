import {
  SECOES_MATERIAIS,
  TIPOS_PIX,
  TIPOS_POSTAGEM,
  listarEmpreendimentos,
  paraEdicao,
} from '@/lib/empreendimentos-central.mjs';
import { empreendimentos } from '@/lib/catalog.mjs';
import AtualizarClient from './AtualizarClient';
import { exigirEquipe } from '@/lib/portal-guard';
import { dadosCentral } from '@/lib/central-dados-servidor';
import './atualizar.css';

export const dynamic = 'force-dynamic';

export default async function AtualizarConteudoPage({
  searchParams,
}: {
  searchParams: Promise<{ emp?: string | string[] }>;
}) {
  await exigirEquipe();
  const params = await searchParams;
  const bruto = Array.isArray(params.emp) ? params.emp[0] : params.emp;
  const empInicial = empreendimentos.some((e) => e.id === bruto) ? bruto : undefined;

  const nomes: Record<string, string> = Object.fromEntries(empreendimentos.map((e) => [e.id, e.nome]));
  const inicial = listarEmpreendimentos(await dadosCentral()).map(paraEdicao);

  return (
    <AtualizarClient
      inicial={inicial}
      secoes={SECOES_MATERIAIS}
      tiposPix={TIPOS_PIX}
      tiposPostagem={TIPOS_POSTAGEM}
      empInicial={empInicial}
      nomes={nomes}
    />
  );
}
