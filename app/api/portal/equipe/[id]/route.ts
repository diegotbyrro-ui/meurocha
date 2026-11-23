import { protegerApi, respostaJson } from '@/lib/portal-guard';
import { supabaseAdmin, supabaseConfigurado } from '@/lib/portal-supabase';
import { editarPessoa, trocarSenha } from '@/lib/portal-equipe-repo.mjs';
import { esquecerStatus } from '@/lib/portal-corretor-status';

// Os repositórios (.mjs) devolvem { ok, erro, status } ou { ok, ...dados }.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResultadoRepo = { ok: boolean; erro?: string; status?: number; [campo: string]: any };

// R85 - Equipe Rocha: editar nome, setor e situação, ou trocar a senha de uma pessoa.
export const dynamic = 'force-dynamic';
const LIMITE_CORPO = 20 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function lerCorpo(request: Request): Promise<Record<string, unknown> | null> {
  const tamanho = Number(request.headers.get('content-length') || '0');
  if (Number.isFinite(tamanho) && tamanho > LIMITE_CORPO) return null;
  const texto = await request.text();
  if (new TextEncoder().encode(texto).length > LIMITE_CORPO) return null;
  try {
    const dados = JSON.parse(texto);
    return dados && typeof dados === 'object' && !Array.isArray(dados) ? dados : {};
  } catch {
    return {};
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await protegerApi(request, 'equipe'); if (s instanceof Response) return s;
  if (!supabaseConfigurado()) return respostaJson({ erro: 'O banco de dados do portal ainda não está conectado.' }, 503);
  const { id } = await params;
  if (!UUID.test(id)) return respostaJson({ erro: 'Pessoa não encontrada.' }, 404);
  const corpo = await lerCorpo(request);
  if (!corpo) return respostaJson({ erro: 'Os dados enviados são grandes demais.' }, 413);
  const db = supabaseAdmin();
  if (corpo.senha !== undefined) {
    const r: ResultadoRepo = await trocarSenha(db, id, corpo.senha);
    if (!r.ok) return respostaJson({ erro: r.erro }, r.status);
    return respostaJson({ ok: true });
  }
  const r: ResultadoRepo = await editarPessoa(db, { id: s.id }, id, { nome: corpo.nome, setor: corpo.setor, ativo: corpo.ativo });
  if (!r.ok) return respostaJson({ erro: r.erro }, r.status);
  esquecerStatus('equipe', id);
  return respostaJson({ pessoa: r.pessoa });
}
