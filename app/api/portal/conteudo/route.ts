import { protegerApi, respostaJson } from '@/lib/portal-guard';
import { supabaseAdmin, supabaseConfigurado } from '@/lib/portal-supabase';
import { DADOS_EMPREENDIMENTOS } from '@/lib/empreendimentos-central.mjs';
import { LIMITE_JSON_BYTES, lerConteudo, mesclarComArquivo, salvarConteudo } from '@/lib/central-conteudo-repo.mjs';

// R85 - Conteúdo da Central (CNPJ, PIX, materiais, postagens) lido e salvo pela equipe Rocha.
// Só a equipe entra aqui. A chave service_role fica no servidor (ver lib/portal-supabase.ts).

export const dynamic = 'force-dynamic';

const SEM_BANCO = 'O banco de dados do portal não está configurado.';

export async function GET(request: Request) {
  const sessao = await protegerApi(request, 'equipe');
  if (sessao instanceof Response) return sessao;
  if (!supabaseConfigurado()) return respostaJson({ erro: SEM_BANCO }, 503);

  const lido = await lerConteudo(supabaseAdmin());
  if (!lido.ok) return respostaJson({ erro: lido.erro }, 503);
  return respostaJson({ lista: mesclarComArquivo(lido.linhas, DADOS_EMPREENDIMENTOS) });
}

export async function PUT(request: Request) {
  const sessao = await protegerApi(request, 'equipe');
  if (sessao instanceof Response) return sessao;
  if (!supabaseConfigurado()) return respostaJson({ erro: SEM_BANCO }, 503);

  const tamanho = Number(request.headers.get('content-length') || '0');
  if (Number.isFinite(tamanho) && tamanho > LIMITE_JSON_BYTES) {
    return respostaJson({ erro: 'Os dados são grandes demais. Remova alguns links e tente de novo.' }, 413);
  }

  const texto = await request.text();
  if (new TextEncoder().encode(texto).length > LIMITE_JSON_BYTES) {
    return respostaJson({ erro: 'Os dados são grandes demais. Remova alguns links e tente de novo.' }, 413);
  }

  let corpo: unknown;
  try {
    corpo = JSON.parse(texto);
  } catch {
    return respostaJson({ erro: 'Não foi possível ler os dados enviados.' }, 400);
  }
  const lista = corpo && typeof corpo === 'object' ? (corpo as { lista?: unknown }).lista : undefined;

  const salvo = await salvarConteudo(supabaseAdmin(), sessao.id, lista);
  if (!salvo.ok) return respostaJson({ erro: salvo.erro }, salvo.status);
  return respostaJson(salvo);
}
