import { protegerApi, respostaJson } from '@/lib/portal-guard';
import { supabaseAdmin, supabaseConfigurado } from '@/lib/portal-supabase';
import { criarColuna, lerCorpoJson } from '@/lib/portal-tarefas-repo.mjs';

// R85 - Cria uma coluna do quadro (até 12).
type Resultado = { ok: boolean; erro?: string; status?: number };
type Lido = Resultado & { valor?: Record<string, unknown> };
function responder(r: Resultado) {
  if (!r.ok) return respostaJson({ erro: r.erro }, r.status ?? 400);
  return respostaJson(r);
}

export async function POST(request: Request) {
  const s = await protegerApi(request, 'equipe');
  if (s instanceof Response) return s;
  if (!supabaseConfigurado()) return respostaJson({ erro: 'O quadro de tarefas ainda não está configurado no servidor.' }, 503);
  const corpo = (await lerCorpoJson(request)) as Lido;
  if (!corpo.ok || !corpo.valor) return responder(corpo);
  return responder(await criarColuna(supabaseAdmin(), corpo.valor));
}
