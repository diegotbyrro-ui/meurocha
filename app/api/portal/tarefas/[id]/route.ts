import { protegerApi, respostaJson } from '@/lib/portal-guard';
import { supabaseAdmin, supabaseConfigurado } from '@/lib/portal-supabase';
import { ehUuid, editarTarefa, excluirTarefa, lerCorpoJson, moverTarefa } from '@/lib/portal-tarefas-repo.mjs';

// R85 - Uma tarefa: editar campos, mover de coluna (coluna_id, ordem) ou excluir.
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
  if (!ehUuid(id)) return respostaJson({ erro: 'Tarefa não encontrada.' }, 404);
  const corpo = (await lerCorpoJson(request)) as Lido;
  if (!corpo.ok || !corpo.valor) return responder(corpo);
  const chaves = Object.keys(corpo.valor);
  const soMover = chaves.includes('coluna_id') && chaves.every((c) => c === 'coluna_id' || c === 'ordem');
  const db = supabaseAdmin();
  return responder(soMover
    ? await moverTarefa(db, id, corpo.valor.coluna_id, corpo.valor.ordem)
    : await editarTarefa(db, id, corpo.valor));
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await protegerApi(request, 'equipe');
  if (s instanceof Response) return s;
  if (!supabaseConfigurado()) return respostaJson({ erro: 'O quadro de tarefas ainda não está configurado no servidor.' }, 503);
  const { id } = await params;
  if (!ehUuid(id)) return respostaJson({ erro: 'Tarefa não encontrada.' }, 404);
  return responder(await excluirTarefa(supabaseAdmin(), id));
}
