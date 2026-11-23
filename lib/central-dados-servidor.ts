import { DADOS_EMPREENDIMENTOS } from '@/lib/empreendimentos-central.mjs';
import { lerConteudo, mesclarComArquivo } from '@/lib/central-conteudo-repo.mjs';
import { supabaseAdmin, supabaseConfigurado } from '@/lib/portal-supabase';

// R85 - Dados da Central para as telas do servidor. Usa o Supabase quando configurado e
// cai para o arquivo data/central-dados.mjs em qualquer erro. Só importe em páginas e rotas do servidor.

/** Lista bruta da Central: o que está salvo no Supabase por cima do arquivo de dados. */
export async function dadosCentral(): Promise<unknown[]> {
  const arquivo = [...DADOS_EMPREENDIMENTOS];
  if (!supabaseConfigurado()) return arquivo;
  try {
    const lido = await lerConteudo(supabaseAdmin());
    if (!lido.ok) return arquivo;
    return mesclarComArquivo(lido.linhas, arquivo);
  } catch {
    return arquivo;
  }
}

export type UltimaAtualizacao = { em: string; nome: string | null };

/** Quando a Central foi salva pela última vez e quem salvou. Null quando não há registro ou o banco não responde. */
export async function ultimaAtualizacao(): Promise<UltimaAtualizacao | null> {
  if (!supabaseConfigurado()) return null;
  try {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from('portal_conteudo')
      .select('atualizado_em, atualizado_por')
      .order('atualizado_em', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data || typeof data.atualizado_em !== 'string') return null;

    let nome: string | null = null;
    if (typeof data.atualizado_por === 'string') {
      const { data: pessoa } = await db
        .from('portal_equipe')
        .select('nome')
        .eq('id', data.atualizado_por)
        .maybeSingle();
      nome = typeof pessoa?.nome === 'string' ? pessoa.nome : null;
    }
    return { em: data.atualizado_em, nome };
  } catch {
    return null;
  }
}
