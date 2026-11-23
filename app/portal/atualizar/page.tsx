import {
  GITHUB_EDITAR_DADOS_URL,
  MESES,
  SECOES_MATERIAIS,
  TIPOS_PIX,
  listarEmpreendimentos,
  paraEdicao,
} from '@/lib/empreendimentos-central.mjs';
import { empreendimentos } from '@/lib/catalog.mjs';
import AtualizarClient from './AtualizarClient';
import './atualizar.css';

export const dynamic = 'force-dynamic';

export default async function AtualizarConteudoPage({
  searchParams,
}: {
  searchParams: Promise<{ emp?: string | string[] }>;
}) {
  const params = await searchParams;
  const bruto = Array.isArray(params.emp) ? params.emp[0] : params.emp;
  const empInicial = empreendimentos.some((e) => e.id === bruto) ? bruto : undefined;

  const nomes: Record<string, string> = Object.fromEntries(empreendimentos.map((e) => [e.id, e.nome]));
  const inicial = listarEmpreendimentos().map(paraEdicao);

  return (
    <AtualizarClient
      inicial={inicial}
      secoes={SECOES_MATERIAIS}
      meses={MESES}
      tiposPix={TIPOS_PIX}
      empInicial={empInicial}
      nomes={nomes}
      githubUrl={GITHUB_EDITAR_DADOS_URL}
    />
  );
}
