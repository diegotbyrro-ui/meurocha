import { protegerApi, respostaJson } from '@/lib/portal-guard';
import { supabaseAdmin, supabaseConfigurado } from '@/lib/portal-supabase';
import { adicionarPessoa, listarEquipe } from '@/lib/portal-equipe-repo.mjs';

// Os repositórios (.mjs) devolvem { ok, erro, status } ou { ok, ...dados }.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResultadoRepo = { ok: boolean; erro?: string; status?: number; [campo: string]: any };

// R85 - Equipe Rocha: listar e cadastrar pessoas (login de e-mail e senha). Só a equipe acessa.
export const dynamic = 'force-dynamic';
const LIMITE_CORPO = 20 * 1024;

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

export async function GET(request: Request) {
  const s = await protegerApi(request, 'equipe'); if (s instanceof Response) return s;
  if (!supabaseConfigurado()) return respostaJson({ erro: 'O banco de dados do portal ainda não está conectado.' }, 503);
  const r: ResultadoRepo = await listarEquipe(supabaseAdmin());
  if (!r.ok) return respostaJson({ erro: r.erro }, r.status);
  return respostaJson({ equipe: r.equipe });
}

export async function POST(request: Request) {
  const s = await protegerApi(request, 'equipe'); if (s instanceof Response) return s;
  if (!supabaseConfigurado()) return respostaJson({ erro: 'O banco de dados do portal ainda não está conectado.' }, 503);
  const corpo = await lerCorpo(request);
  if (!corpo) return respostaJson({ erro: 'Os dados enviados são grandes demais.' }, 413);
  const r: ResultadoRepo = await adicionarPessoa(supabaseAdmin(), {
    nome: corpo.nome, email: corpo.email, setor: corpo.setor, senha: corpo.senha,
  });
  if (!r.ok) return respostaJson({ erro: r.erro }, r.status);
  return respostaJson({ pessoa: r.pessoa }, 201);
}
