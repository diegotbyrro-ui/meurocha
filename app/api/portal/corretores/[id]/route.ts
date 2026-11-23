import { protegerApi, respostaJson } from '@/lib/portal-guard';
import { supabaseAdmin, supabaseConfigurado } from '@/lib/portal-supabase';
import { editarCorretor, mudarStatusCorretor } from '@/lib/portal-corretores-repo.mjs';
import { esquecerStatus } from '@/lib/portal-corretor-status';

// Os repositórios (.mjs) devolvem { ok, erro, status } ou { ok, ...dados }.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResultadoRepo = { ok: boolean; erro?: string; status?: number; [campo: string]: any };

// R85 - Corretores: bloquear ou liberar um acesso, ou editar os dados de contato.
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
  if (!UUID.test(id)) return respostaJson({ erro: 'Corretor não encontrado.' }, 404);
  const corpo = await lerCorpo(request);
  if (!corpo) return respostaJson({ erro: 'Os dados enviados são grandes demais.' }, 413);
  const db = supabaseAdmin();
  if (corpo.status !== undefined) {
    const r: ResultadoRepo = await mudarStatusCorretor(db, id, corpo.status);
    if (!r.ok) return respostaJson({ erro: r.erro }, r.status);
    esquecerStatus('corretor', id);
    return respostaJson({ corretor: r.corretor });
  }
  const r: ResultadoRepo = await editarCorretor(db, id, {
    nome: corpo.nome, whatsapp: corpo.whatsapp, imobiliaria: corpo.imobiliaria, email: corpo.email,
  });
  if (!r.ok) return respostaJson({ erro: r.erro }, r.status);
  return respostaJson({ corretor: r.corretor });
}
