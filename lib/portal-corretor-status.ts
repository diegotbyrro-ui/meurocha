import { supabaseAdmin, supabaseConfigurado } from '@/lib/portal-supabase';

// R85 - O login fica salvo no navegador (corretor: sem prazo). Para um bloqueio ou desativação
// valer na hora, cada página e cada API conferem no banco se a pessoa continua ativa.
// A resposta fica guardada por 2 minutos para não consultar o banco a cada clique.
const cache = new Map<string, { ativo: boolean; ate: number }>();
const VALIDADE_MS = 2 * 60 * 1000;

export async function pessoaAtiva(tipo: 'equipe' | 'corretor', id: string): Promise<boolean> {
  const chave = `${tipo}:${id}`;
  const agora = Date.now();
  const item = cache.get(chave);
  if (item && item.ate > agora) return item.ativo;
  if (!supabaseConfigurado()) return true;
  try {
    const db = supabaseAdmin();
    const { data, error } = tipo === 'corretor'
      ? await db.from('portal_corretores').select('status').eq('id', id).maybeSingle()
      : await db.from('portal_equipe').select('ativo').eq('id', id).maybeSingle();
    if (error) return item?.ativo ?? true;
    const linha = data as { status?: string; ativo?: boolean } | null;
    const ativo = Boolean(linha && (tipo === 'corretor' ? linha.status === 'ativo' : linha.ativo === true));
    cache.set(chave, { ativo, ate: agora + VALIDADE_MS });
    if (cache.size > 5000) cache.clear();
    return ativo;
  } catch {
    return item?.ativo ?? true;
  }
}

export async function corretorAtivo(id: string): Promise<boolean> {
  return pessoaAtiva('corretor', id);
}

/** Chame depois de bloquear/desbloquear ou ativar/desativar alguém (vale para este servidor). */
export function esquecerStatus(tipo: 'equipe' | 'corretor', id: string) {
  cache.delete(`${tipo}:${id}`);
}
