import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { lerSessao, originAllowed, type SessaoPortal } from '@/lib/portal-rocha-auth';
import { pessoaAtiva } from '@/lib/portal-corretor-status';

// R85 - "Porteiro" do portal: confere no servidor quem está logado antes de mostrar a página
// ou responder a uma API. Corretores não abrem as áreas da equipe (ver lib/portal-acesso.mjs).

export async function obterSessao(): Promise<SessaoPortal | null> {
  return lerSessao((await headers()).get('cookie'));
}

/** Use no topo das páginas que só a equipe Rocha pode abrir. */
export async function exigirEquipe(): Promise<SessaoPortal> {
  const sessao = await obterSessao();
  if (!sessao) redirect('/portal');
  if (sessao.t !== 'equipe') redirect('/portal?aviso=so-equipe');
  if (!(await pessoaAtiva('equipe', sessao.id))) redirect('/portal');
  return sessao;
}

const semCache = { 'Cache-Control': 'no-store' };

export function respostaJson(dados: unknown, status = 200) {
  return NextResponse.json(dados, { status, headers: semCache });
}

/**
 * Use no começo das rotas de API. Confere sessão, tipo de pessoa e, em escritas, a origem.
 * Retorna a sessão ou uma resposta de erro pronta.
 */
export async function protegerApi(request: Request, tipo: 'equipe' | 'qualquer' = 'equipe'): Promise<SessaoPortal | NextResponse> {
  const sessao = lerSessao(request.headers.get('cookie'));
  if (!sessao) return respostaJson({ erro: 'Sua sessão terminou. Entre de novo no portal.' }, 401);
  if (tipo === 'equipe' && sessao.t !== 'equipe') return respostaJson({ erro: 'Esta área é só da equipe Rocha.' }, 403);
  if (request.method !== 'GET' && request.method !== 'HEAD' && !originAllowed(request)) return respostaJson({ erro: 'Origem inválida.' }, 403);
  if (!(await pessoaAtiva(sessao.t, sessao.id))) return respostaJson({ erro: 'Seu acesso foi desativado. Fale com a equipe Rocha.' }, 403);
  return sessao;
}
