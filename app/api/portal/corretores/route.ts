import { protegerApi, respostaJson } from '@/lib/portal-guard';
import { supabaseAdmin, supabaseConfigurado } from '@/lib/portal-supabase';
import { listarCorretores, resumoCorretores } from '@/lib/portal-corretores-repo.mjs';

// Os repositórios (.mjs) devolvem { ok, erro, status } ou { ok, ...dados }.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResultadoRepo = { ok: boolean; erro?: string; status?: number; [campo: string]: any };

// R85 - Corretores: lista com busca, filtro e paginação, mais os números do topo da tela.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const s = await protegerApi(request, 'equipe'); if (s instanceof Response) return s;
  if (!supabaseConfigurado()) return respostaJson({ erro: 'O banco de dados do portal ainda não está conectado.' }, 503);
  const url = new URL(request.url);
  const busca = url.searchParams.get('busca') ?? '';
  const status = url.searchParams.get('status') ?? 'todos';
  const pagina = Number(url.searchParams.get('pagina') ?? '1');
  const db = supabaseAdmin();
  const [lista, resumo]: [ResultadoRepo, ResultadoRepo] = await Promise.all([
    listarCorretores(db, { busca, status, pagina }),
    resumoCorretores(db),
  ]);
  if (!lista.ok) return respostaJson({ erro: lista.erro }, lista.status);
  if (!resumo.ok) return respostaJson({ erro: resumo.erro }, resumo.status);
  return respostaJson({
    corretores: lista.corretores,
    total: lista.total,
    pagina: lista.pagina,
    porPagina: lista.porPagina,
    temMais: lista.temMais,
    resumo: resumo.resumo,
  });
}
