import { protegerApi, respostaJson } from '@/lib/portal-guard';
import { supabaseAdmin, supabaseConfigurado } from '@/lib/portal-supabase';
import { ehUuid, editarColuna, excluirColuna, lerCorpoJson } from '@/lib/portal-tarefas-repo.mjs';

// R85 - Uma coluna: renomear, mudar cor, marcar "conta como concluída" ou excluir (?moverPara=ID).
type Resultado = { ok: boolean; erro?: string; status?: number };
type Lido = Resultado & { valor?: Record<string, unknown> };
function responder(r: Resultado) {
  if (!r.ok) return respostaJson({ erro: r.erro }, r.status ?? 400);
  return respostaJson(r);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await protegerApi(request, 'equipe');
  if (s instanceof Response) return s;
  if (!supabaseConfigurado()) return respostaJson({ erro: 'O quadro de tarefas ainda não está configurado no servidor.' }, 503);
  const { id } = await params;
  if (!ehUuid(id)) return respostaJson({ erro: 'Coluna não encontrada.' }, 404);
  const corpo = (await lerCorpoJson(request)) as Lido;
  if (!corpo.ok || !corpo.valor) return responder(corpo);
  return responder(await editarColuna(supabaseAdmin(), id, corpo.valor));
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await protegerApi(request, 'equipe');
  if (s instanceof Response) return s;
  if (!supabaseConfigurado()) return respostaJson({ erro: 'O quadro de tarefas ainda não está configurado no servidor.' }, 503);
  const { id } = await params;
  if (!ehUuid(id)) return respostaJson({ erro: 'Coluna não encontrada.' }, 404);
  const moverPara = new URL(request.url).searchParams.get('moverPara') || undefined;
  return responder(await excluirColuna(supabaseAdmin(), id, moverPara));
}
