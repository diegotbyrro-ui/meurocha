// R85 - Corretores do portal: consulta, bloqueio e edição de quem entrou com CRECI.
// Funções puras: recebem o cliente `db` como 1º parâmetro e nunca lançam para quem chama.
// Retornam { ok: true, ... } ou { ok: false, erro, status }.
import { formatarCreci, normalizarWhatsapp, validarCadastroCorretor } from './portal-acesso.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const POR_PAGINA = 50;
const STATUS_LISTA = ['ativo', 'bloqueado', 'todos'];
const STATUS_CORRETOR = ['ativo', 'bloqueado'];
const COLUNAS = 'id, creci, uf, nome, whatsapp, imobiliaria, email, status, acessos, ultimo_acesso, criado_em';
const MENSAGEM_ERRO = 'Não foi possível concluir agora. Tente de novo em instantes.';
const SETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

const falha = (erro, status = 400) => ({ ok: false, erro, status });

/** Termo de busca sem caracteres que quebram o filtro (vírgula, ponto, %, _, parênteses). */
function termoBusca(v) {
  if (typeof v !== 'string') return '';
  return v.replace(/[^\p{L}\p{N} @-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 80);
}

/**
 * Lista corretores: busca por nome, CRECI ou imobiliária; filtro de situação; 50 por página.
 * Ordem: último acesso mais recente primeiro (quem nunca entrou por último), depois nome.
 */
export async function listarCorretores(db, { busca = '', status = 'todos', pagina = 1 } = {}) {
  try {
    if (!STATUS_LISTA.includes(status)) return falha('Filtro de situação inválido.');
    const pag = Number.isInteger(Number(pagina)) && Number(pagina) >= 1 ? Number(pagina) : 1;
    const termo = termoBusca(busca);
    let consulta = db.from('portal_corretores').select(COLUNAS, { count: 'exact' });
    if (termo) consulta = consulta.or(`nome.ilike.%${termo}%,creci.ilike.%${termo}%,imobiliaria.ilike.%${termo}%`);
    if (status !== 'todos') consulta = consulta.eq('status', status);
    const inicio = (pag - 1) * POR_PAGINA;
    const { data, error, count } = await consulta
      .order('ultimo_acesso', { ascending: false, nullsFirst: false })
      .order('nome', { ascending: true })
      .range(inicio, inicio + POR_PAGINA - 1);
    if (error) return falha(MENSAGEM_ERRO, 500);
    const total = count ?? 0;
    return { ok: true, corretores: data || [], total, pagina: pag, porPagina: POR_PAGINA, temMais: inicio + POR_PAGINA < total };
  } catch {
    return falha(MENSAGEM_ERRO, 500);
  }
}

/** Bloqueia ou libera um corretor. Quem estiver bloqueado não entra de novo com o CRECI. */
export async function mudarStatusCorretor(db, id, status) {
  try {
    if (typeof id !== 'string' || !UUID.test(id)) return falha('Corretor não encontrado.', 404);
    if (!STATUS_CORRETOR.includes(status)) return falha('Situação inválida. Use ativo ou bloqueado.');
    const { data, error } = await db.from('portal_corretores').update({ status }).eq('id', id).select('id, nome, status').maybeSingle();
    if (error) return falha(MENSAGEM_ERRO, 500);
    if (!data) return falha('Corretor não encontrado.', 404);
    return { ok: true, corretor: data };
  } catch {
    return falha(MENSAGEM_ERRO, 500);
  }
}

/**
 * Edita nome, WhatsApp, imobiliária ou e-mail. O CRECI e a UF não mudam por aqui.
 * Usa as mesmas regras do primeiro acesso (validarCadastroCorretor).
 */
export async function editarCorretor(db, id, dados = {}) {
  try {
    if (typeof id !== 'string' || !UUID.test(id)) return falha('Corretor não encontrado.', 404);
    const campos = ['nome', 'whatsapp', 'imobiliaria', 'email'].filter((c) => dados[c] !== undefined);
    if (campos.length === 0) return falha('Nada para alterar.');

    const { data: atual, error: erroBusca } = await db.from('portal_corretores').select(COLUNAS).eq('id', id).maybeSingle();
    if (erroBusca) return falha(MENSAGEM_ERRO, 500);
    if (!atual) return falha('Corretor não encontrado.', 404);

    const junto = {
      creci: atual.creci,
      uf: atual.uf,
      nome: atual.nome,
      whatsapp: atual.whatsapp ?? '',
      imobiliaria: atual.imobiliaria ?? '',
      email: atual.email ?? '',
    };
    for (const c of campos) junto[c] = dados[c] ?? '';
    const v = validarCadastroCorretor(junto);
    if (!v.ok) return falha(v.erro);

    const patch = Object.fromEntries(campos.map((c) => [c, v.valor[c]]));
    const { data, error } = await db.from('portal_corretores').update(patch).eq('id', id).select(COLUNAS).maybeSingle();
    if (error) return falha(MENSAGEM_ERRO, 500);
    if (!data) return falha('Corretor não encontrado.', 404);
    return { ok: true, corretor: data };
  } catch {
    return falha(MENSAGEM_ERRO, 500);
  }
}

/** Números do topo da tela: total, ativos, bloqueados, cadastrados e que acessaram nos últimos 7 dias. */
export async function resumoCorretores(db, agora = Date.now()) {
  try {
    const { data, error } = await db.from('portal_corretores').select('status, criado_em, ultimo_acesso');
    if (error) return falha(MENSAGEM_ERRO, 500);
    const limite = agora - SETE_DIAS_MS;
    const resumo = { total: 0, ativos: 0, bloqueados: 0, novos7dias: 0, acessaram7dias: 0 };
    for (const c of data || []) {
      resumo.total += 1;
      if (c.status === 'ativo') resumo.ativos += 1;
      if (c.status === 'bloqueado') resumo.bloqueados += 1;
      if (c.criado_em && new Date(c.criado_em).getTime() >= limite) resumo.novos7dias += 1;
      if (c.ultimo_acesso && new Date(c.ultimo_acesso).getTime() >= limite) resumo.acessaram7dias += 1;
    }
    return { ok: true, resumo };
  } catch {
    return falha(MENSAGEM_ERRO, 500);
  }
}

/** Planilha CSV (separador ponto e vírgula, UTF-8 com BOM, para o Excel abrir com acentos). */
export function montarCsvCorretores(corretores = []) {
  const celula = (v) => {
    let s = v == null ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const data = (iso) => (iso ? new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '');
  const cabecalho = ['Nome', 'CRECI', 'UF', 'WhatsApp', 'Imobiliária', 'E-mail', 'Situação', 'Acessos', 'Último acesso', 'Cadastrado em'];
  const linhas = corretores.map((c) => [
    c.nome,
    formatarCreci(c.creci),
    c.uf,
    c.whatsapp ? normalizarWhatsapp(c.whatsapp) || c.whatsapp : '',
    c.imobiliaria ?? '',
    c.email ?? '',
    c.status === 'bloqueado' ? 'Bloqueado' : 'Ativo',
    c.acessos ?? 0,
    c.ultimo_acesso ? data(c.ultimo_acesso) : 'Nunca entrou',
    data(c.criado_em),
  ]);
  return '﻿' + [cabecalho, ...linhas].map((l) => l.map(celula).join(';')).join('\r\n');
}
