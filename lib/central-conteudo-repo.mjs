// R85 - Conteudo da Central guardado no Supabase (tabela portal_conteudo).
// Repositorio puro: recebe o cliente `db` como 1o parametro e nunca lanca excecao.
// Os dados de data/central-dados.mjs continuam sendo o ponto de partida e o reserva.
import {empreendimentos as catalogo} from './catalog.mjs';
import {
  ITENS_MATERIAIS, SECOES_MATERIAIS, normalizarEmpreendimento, paraEdicao,
} from './empreendimentos-central.mjs';

/** Tamanho maximo do JSON enviado para salvar (200 KB). */
export const LIMITE_JSON_BYTES = 200 * 1024;

const ERRO_LER = 'Não foi possível ler o conteúdo salvo agora. Tente de novo em instantes.';
const ERRO_SALVAR = 'Não foi possível salvar agora. Confira a conexão e tente de novo. Seus dados continuam na tela.';

/**
 * @typedef {{ ok: false, erro: string, status: number }} Falha
 */

/** @param {string} erro @param {number} status @returns {Falha} */
function falha(erro, status) {
  return {ok: false, erro, status};
}

/** Lista limpa de um empreendimento sem dados salvos (so o id do catalogo). */
function vazioDe(id) {
  return paraEdicao(normalizarEmpreendimento({id}));
}

/**
 * Le as linhas salvas da Central. Nunca lanca excecao.
 * @param {any} db Cliente Supabase (servidor).
 * @returns {Promise<{ ok: true, linhas: Array<{empreendimento_id: string, dados: unknown, atualizado_em: string, atualizado_por: string | null}> } | Falha>}
 */
export async function lerConteudo(db) {
  try {
    const {data, error} = await db
      .from('portal_conteudo')
      .select('empreendimento_id, dados, atualizado_em, atualizado_por');
    if (error) return falha(ERRO_LER, 503);
    return {ok: true, linhas: Array.isArray(data) ? data : []};
  } catch {
    return falha(ERRO_LER, 503);
  }
}

/**
 * Monta a lista completa, na ordem do catalogo. Uma linha do banco substitui a entrada do arquivo
 * somente quando os dados normalizam bem e o id confere. Linhas invalidas sao ignoradas.
 * @param {unknown} linhas Linhas de lerConteudo.
 * @param {readonly unknown[]} dadosArquivo Lista do arquivo data/central-dados.mjs.
 * @returns {Array<ReturnType<typeof paraEdicao>>} Lista no formato editavel (paraEdicao).
 */
export function mesclarComArquivo(linhas, dadosArquivo) {
  try {
    /** @type {Map<string, ReturnType<typeof paraEdicao>>} */
    const doBanco = new Map();
    if (Array.isArray(linhas)) {
      for (const linha of linhas) {
        if (!linha || typeof linha !== 'object') continue;
        const reg = /** @type {Record<string, unknown>} */ (linha);
        if (typeof reg.empreendimento_id !== 'string') continue;
        const emp = normalizarEmpreendimento(reg.dados);
        if (!emp || emp.id !== reg.empreendimento_id) continue;
        doBanco.set(emp.id, paraEdicao(emp));
      }
    }

    /** @type {Map<string, ReturnType<typeof paraEdicao>>} */
    const doArquivo = new Map();
    if (Array.isArray(dadosArquivo)) {
      for (const raw of dadosArquivo) {
        const emp = normalizarEmpreendimento(raw);
        if (emp) doArquivo.set(emp.id, paraEdicao(emp));
      }
    }

    return catalogo.map((cat) => doBanco.get(cat.id) ?? doArquivo.get(cat.id) ?? vazioDe(cat.id));
  } catch {
    return catalogo.map((cat) => vazioDe(cat.id));
  }
}

/** @param {number} n @param {string} singular @param {string} plural */
function contar(n, singular, plural) {
  return `${n} ${n === 1 ? singular : plural}`;
}

/** Quantos links brutos existem em postagens (lista nova ou formato antigo por mes). */
function contarPostagensBrutas(bruto) {
  if (Array.isArray(bruto)) return bruto.length;
  if (bruto && typeof bruto === 'object') {
    return Object.values(bruto).reduce((acc, lista) => acc + (Array.isArray(lista) ? lista.length : 0), 0);
  }
  return 0;
}

/**
 * Explica, em portugues, o que foi descartado na normalizacao de um empreendimento.
 * @param {Record<string, any>} raw Entrada enviada pela tela.
 * @param {ReturnType<typeof normalizarEmpreendimento> & object} emp Entrada normalizada.
 * @returns {string[]}
 */
function descartesDe(raw, emp) {
  const nome = catalogo.find((c) => c.id === emp.id)?.nome ?? emp.id;
  /** @type {string[]} */
  const saida = [];

  const cnpjBruto = typeof raw.cnpj === 'string' ? raw.cnpj.trim() : '';
  if (cnpjBruto !== '' && emp.cnpj === '') saida.push(`${nome}: CNPJ inválido, não foi salvo.`);

  const pixBruto = raw.pix && typeof raw.pix === 'object' ? raw.pix : {};
  const chaveBruta = typeof pixBruto.chave === 'string' ? pixBruto.chave.trim() : '';
  if (chaveBruta !== '' && emp.pix.chave === '') saida.push(`${nome}: chave PIX inválida, não foi salva.`);

  const materiaisBrutos = raw.materiais && typeof raw.materiais === 'object' ? raw.materiais : {};
  for (const secao of SECOES_MATERIAIS) {
    for (const item of secao.itens) {
      if (!ITENS_MATERIAIS.includes(item.id)) continue;
      const lista = materiaisBrutos[item.id];
      const perdidos = (Array.isArray(lista) ? lista.length : 0) - emp.materiais[item.id].length;
      if (perdidos > 0) {
        saida.push(`${nome}: ${contar(perdidos, 'link não foi salvo', 'links não foram salvos')} em ${item.nome}.`);
      }
    }
  }

  const perdidasPostagens = contarPostagensBrutas(raw.postagens) - emp.postagens.length;
  if (perdidasPostagens > 0) {
    saida.push(`${nome}: ${contar(perdidasPostagens, 'postagem não foi salva', 'postagens não foram salvas')} em Redes sociais.`);
  }
  return saida;
}

/**
 * Valida a lista enviada pela tela e grava em portal_conteudo (upsert por empreendimento).
 * Ids fora do catalogo, lista grande demais ou repetida sao recusados. Dados invalidos
 * (CNPJ, PIX, links) nao impedem o salvamento: sao descartados e informados em `descartados`.
 * @param {any} db Cliente Supabase (servidor).
 * @param {string} sessaoId Id da pessoa da equipe que salva (portal_equipe.id).
 * @param {unknown} lista Lista de empreendimentos no formato editavel.
 * @returns {Promise<{ ok: true, salvos: number, descartados: string[], lista: Array<ReturnType<typeof paraEdicao>> } | Falha>}
 */
export async function salvarConteudo(db, sessaoId, lista) {
  try {
    if (!Array.isArray(lista) || lista.length === 0) return falha('Envie a lista de empreendimentos.', 400);
    if (lista.length > catalogo.length) return falha('A lista tem mais empreendimentos do que o portal conhece.', 400);

    const bytes = new TextEncoder().encode(JSON.stringify(lista)).length;
    if (bytes > LIMITE_JSON_BYTES) return falha('Os dados são grandes demais. Remova alguns links e tente de novo.', 413);

    const ids = new Set();
    /** @type {string[]} */
    const descartados = [];
    /** @type {Array<{empreendimento_id: string, dados: unknown, atualizado_por: string, atualizado_em: string}>} */
    const linhas = [];
    /** @type {Array<ReturnType<typeof paraEdicao>>} */
    const salvos = [];
    const agora = new Date().toISOString();

    for (const raw of lista) {
      const emp = normalizarEmpreendimento(raw);
      if (!emp) return falha('Um dos empreendimentos não existe no portal. Atualize a página e tente de novo.', 400);
      if (ids.has(emp.id)) return falha('Um empreendimento aparece mais de uma vez na lista.', 400);
      ids.add(emp.id);

      descartados.push(...descartesDe(/** @type {Record<string, any>} */ (raw), emp));
      const edicao = paraEdicao(emp);
      salvos.push(edicao);
      linhas.push({empreendimento_id: emp.id, dados: edicao, atualizado_por: sessaoId, atualizado_em: agora});
    }

    const {error} = await db.from('portal_conteudo').upsert(linhas, {onConflict: 'empreendimento_id'});
    if (error) return falha(ERRO_SALVAR, 500);

    return {ok: true, salvos: linhas.length, descartados, lista: salvos};
  } catch {
    return falha(ERRO_SALVAR, 500);
  }
}
