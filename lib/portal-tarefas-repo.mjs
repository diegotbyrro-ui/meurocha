// R85 - Repositório do quadro de tarefas da equipe Rocha (tabelas portal_tarefas_colunas,
// portal_tarefas e portal_equipe). Regras e acesso a dados ficam aqui, testáveis com o fake do Supabase.
// Cada função recebe o cliente `db` como 1º parâmetro e nunca lança: retorna
// { ok: true, ... } ou { ok: false, erro, status } com mensagem em português.
import { validDate } from './portal-tarefas.mjs';

export const CORES_COLUNA = Object.freeze(['#45474c', '#1f5fae', '#6b3fb8', '#1b7a4a', '#b45309', '#a51c2c', '#0e7c78', '#3f5468']);
export const PRIORIDADES = Object.freeze(['baixa', 'media', 'alta']);
export const MAX_COLUNAS = 12;
export const MAX_CORPO = 20 * 1024;
const COR_PADRAO = '#45474c';
const MSG_RESPONSAVEL = 'Só é possível atribuir para alguém ativo da equipe Rocha.';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COR = /^#[0-9a-f]{6}$/i;
const COLUNA_CAMPOS = 'id, nome, cor, ordem, conta_como_concluida';
const TAREFA_CAMPOS = 'id, titulo, descricao, empreendimento, prazo, coluna_id, ordem, prioridade, responsavel_id, criado_por, criado_em, atualizado_em';
// Campos que a equipe pode informar. Qualquer outra chave do corpo é ignorada (não há atribuição em massa).
const CAMPOS_TAREFA = ['titulo', 'descricao', 'empreendimento', 'prazo', 'prioridade', 'responsavel_id', 'coluna_id', 'ordem'];
const CAMPOS_CRIAR = CAMPOS_TAREFA.filter((c) => c !== 'ordem');

export function ehUuid(valor) {
  return typeof valor === 'string' && UUID.test(valor);
}

// ---------- respostas e erros internos ----------
const falha = (erro, status = 400) => ({ ok: false, erro, status });
const erroBanco = (acao) => falha(`Não foi possível ${acao}. Tente de novo em instantes.`, 500);
class Recusa extends Error {
  constructor(resposta) { super(resposta.erro); this.resposta = resposta; }
}
const recusar = (erro, status = 400) => { throw new Recusa(falha(erro, status)); };
// Lança a recusa de banco se a consulta falhou; devolve os dados caso contrário.
function confirmar(res, acao) {
  if (res.error) throw new Recusa(erroBanco(acao));
  return res.data;
}
async function executar(acao, fn) {
  try {
    return await fn();
  } catch (erro) {
    if (erro instanceof Recusa) return erro.resposta;
    return erroBanco(acao);
  }
}

// ---------- validação ----------
const ok = (valor) => ({ ok: true, valor });
function textoLimpo(valor, multilinha = false) {
  if (typeof valor !== 'string') return null;
  const padrao = multilinha ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g : /[\u0000-\u001f]/g;
  return valor.replace(padrao, ' ').trim();
}
function validarNomeColuna(valor) {
  const nome = textoLimpo(valor);
  if (nome === null || nome.length < 1 || nome.length > 40) return falha('O nome da coluna precisa ter de 1 a 40 caracteres.');
  return ok(nome);
}
function validarCorColuna(valor) {
  if (typeof valor !== 'string' || !COR.test(valor)) return falha('Escolha uma das cores disponíveis para a coluna.');
  return ok(valor.toLowerCase());
}
function validarCampo(campo, valor) {
  switch (campo) {
    case 'titulo': {
      const t = textoLimpo(valor);
      if (t === null || t.length < 3 || t.length > 120) return falha('O título precisa ter de 3 a 120 caracteres.');
      return ok(t);
    }
    case 'descricao': {
      const t = textoLimpo(valor, true);
      if (t === null || t.length > 1000) return falha('A descrição pode ter até 1000 caracteres.');
      return ok(t);
    }
    case 'empreendimento': {
      const t = textoLimpo(valor);
      if (t === null || t.length > 80) return falha('O empreendimento pode ter até 80 caracteres.');
      return ok(t);
    }
    case 'prazo': {
      if (valor === null || valor === '') return ok(null);
      if (typeof valor !== 'string' || !validDate(valor)) return falha('Confira o prazo. Use uma data real no formato dia/mês/ano.');
      return ok(valor);
    }
    case 'prioridade':
      return PRIORIDADES.includes(valor) ? ok(valor) : falha('Escolha a prioridade: baixa, média ou alta.');
    case 'responsavel_id':
      if (valor === null || valor === '') return ok(null);
      return ehUuid(valor) ? ok(valor) : falha('Pessoa responsável inválida. Escolha alguém da lista.');
    case 'coluna_id':
      return ehUuid(valor) ? ok(valor) : falha('Escolha uma coluna válida.');
    case 'ordem':
      return Number.isInteger(valor) && valor >= 0 && valor <= 100000 ? ok(valor) : falha('Ordem inválida.');
    default:
      return falha('Campo desconhecido.');
  }
}
function validarCampos(dados, campos) {
  const valor = {};
  for (const campo of campos) {
    if (dados[campo] === undefined) continue;
    const r = validarCampo(campo, dados[campo]);
    if (!r.ok) return r;
    valor[campo] = r.valor;
  }
  return ok(valor);
}

// ---------- leitura de dados ----------
const pegarColuna = ({ id, nome, cor, ordem, conta_como_concluida }) => ({ id, nome, cor, ordem, conta_como_concluida: Boolean(conta_como_concluida) });
const pegarTarefa = (t) => ({
  id: t.id, titulo: t.titulo, descricao: t.descricao ?? '', empreendimento: t.empreendimento ?? '', prazo: t.prazo ?? '',
  coluna_id: t.coluna_id, ordem: t.ordem, prioridade: t.prioridade, responsavel_id: t.responsavel_id ?? null,
  criado_por: t.criado_por ?? null, criado_em: t.criado_em, atualizado_em: t.atualizado_em,
});

async function listarColunas(db) {
  const dados = confirmar(await db.from('portal_tarefas_colunas').select(COLUNA_CAMPOS).order('ordem').order('criado_em'), 'carregar as colunas');
  return (dados || []).map(pegarColuna);
}
async function pessoaAtiva(db, id) {
  const linha = confirmar(await db.from('portal_equipe').select('id').eq('id', id).eq('ativo', true).maybeSingle(), 'verificar a responsável');
  return Boolean(linha);
}
async function colunaExiste(db, id) {
  const linha = confirmar(await db.from('portal_tarefas_colunas').select('id').eq('id', id).maybeSingle(), 'localizar a coluna');
  return Boolean(linha);
}
async function ultimaOrdem(db, colunaId) {
  const linha = confirmar(await db.from('portal_tarefas').select('ordem').eq('coluna_id', colunaId).order('ordem', { ascending: false }).limit(1).maybeSingle(), 'calcular a posição da tarefa');
  return linha ? Number(linha.ordem) || 0 : 0;
}

/** Lê o quadro inteiro: colunas, tarefas e a equipe ativa (para atribuir tarefas). */
export function carregarQuadro(db) {
  return executar('carregar o quadro de tarefas', async () => {
    const colunas = await listarColunas(db);
    const tarefas = (confirmar(await db.from('portal_tarefas').select(TAREFA_CAMPOS).order('ordem').order('criado_em'), 'carregar as tarefas') || []).map(pegarTarefa);
    const equipe = confirmar(await db.from('portal_equipe').select('id, nome, setor, ativo').order('nome'), 'carregar a equipe') || [];
    // Quem saiu da equipe mas ainda aparece como responsável recebe o nome, sem entrar na lista de atribuição.
    const inativos = equipe
      .filter((p) => !p.ativo && tarefas.some((t) => t.responsavel_id === p.id))
      .map((p) => ({ id: p.id, nome: p.nome }));
    return {
      ok: true,
      colunas,
      tarefas,
      equipe: equipe.filter((p) => p.ativo).map(({ id, nome, setor }) => ({ id, nome, setor })),
      inativos,
    };
  });
}

// ---------- colunas ----------
export function criarColuna(db, dados = {}) {
  return executar('criar a coluna', async () => {
    const nome = validarNomeColuna(dados.nome);
    if (!nome.ok) return nome;
    let cor = ok(COR_PADRAO);
    if (dados.cor !== undefined && dados.cor !== null && dados.cor !== '') cor = validarCorColuna(dados.cor);
    if (!cor.ok) return cor;
    const atuais = await listarColunas(db);
    if (atuais.length >= MAX_COLUNAS) return falha(`O quadro aceita no máximo ${MAX_COLUNAS} colunas. Exclua uma coluna para criar outra.`);
    const ordem = atuais.reduce((maior, c) => Math.max(maior, Number(c.ordem) || 0), 0) + 1;
    const criada = confirmar(await db.from('portal_tarefas_colunas')
      .insert({ nome: nome.valor, cor: cor.valor, ordem, conta_como_concluida: false })
      .select(COLUNA_CAMPOS).single(), 'criar a coluna');
    return { ok: true, coluna: pegarColuna(criada) };
  });
}

export function editarColuna(db, id, dados = {}) {
  return executar('salvar a coluna', async () => {
    if (!ehUuid(id)) return falha('Coluna não encontrada.', 404);
    const patch = {};
    if (dados.nome !== undefined) {
      const nome = validarNomeColuna(dados.nome);
      if (!nome.ok) return nome;
      patch.nome = nome.valor;
    }
    if (dados.cor !== undefined) {
      const cor = validarCorColuna(dados.cor);
      if (!cor.ok) return cor;
      patch.cor = cor.valor;
    }
    if (dados.conta_como_concluida !== undefined) {
      if (typeof dados.conta_como_concluida !== 'boolean') return falha('Use "sim" ou "não" para dizer se a coluna conta como concluída.');
      patch.conta_como_concluida = dados.conta_como_concluida;
    }
    if (Object.keys(patch).length === 0) return falha('Informe o que mudar na coluna.');
    const atualizada = confirmar(await db.from('portal_tarefas_colunas').update(patch).eq('id', id).select(COLUNA_CAMPOS).maybeSingle(), 'salvar a coluna');
    if (!atualizada) return falha('Coluna não encontrada.', 404);
    return { ok: true, coluna: pegarColuna(atualizada) };
  });
}

/** `ids` precisa listar exatamente as colunas existentes, cada uma uma vez. */
export function reordenarColunas(db, ids) {
  return executar('reordenar as colunas', async () => {
    if (!Array.isArray(ids) || !ids.every((id) => ehUuid(id))) return falha('A nova ordem precisa listar as colunas pelo código.');
    const atuais = await listarColunas(db);
    const existentes = new Set(atuais.map((c) => c.id));
    const semRepeticao = new Set(ids).size === ids.length;
    if (ids.length !== atuais.length || !semRepeticao || !ids.every((id) => existentes.has(id))) {
      return falha('A nova ordem precisa incluir todas as colunas, uma única vez.');
    }
    for (const [posicao, id] of ids.entries()) {
      confirmar(await db.from('portal_tarefas_colunas').update({ ordem: posicao + 1 }).eq('id', id).select('id').maybeSingle(), 'reordenar as colunas');
    }
    return { ok: true, colunas: await listarColunas(db) };
  });
}

/**
 * Exclui a coluna. Não pode ser a última. Se tiver tarefas, `moverPara` é obrigatório:
 * as tarefas vão para o fim dessa outra coluna.
 */
export function excluirColuna(db, id, moverPara) {
  return executar('excluir a coluna', async () => {
    if (!ehUuid(id)) return falha('Coluna não encontrada.', 404);
    const colunas = await listarColunas(db);
    if (!colunas.some((c) => c.id === id)) return falha('Coluna não encontrada.', 404);
    if (colunas.length <= 1) return falha('Não é possível excluir a última coluna do quadro. Crie outra coluna antes.');
    const tarefas = confirmar(await db.from('portal_tarefas').select('id, ordem').eq('coluna_id', id).order('ordem'), 'carregar as tarefas da coluna') || [];
    let tarefasMovidas = 0;
    if (tarefas.length > 0) {
      const destinoValido = ehUuid(moverPara) && moverPara !== id && colunas.some((c) => c.id === moverPara);
      if (!destinoValido) return falha('Escolha para qual coluna mover as tarefas antes de excluir esta coluna.');
      const base = await ultimaOrdem(db, moverPara);
      for (const [posicao, tarefa] of tarefas.entries()) {
        confirmar(await db.from('portal_tarefas').update({ coluna_id: moverPara, ordem: base + posicao + 1 }).eq('id', tarefa.id).select('id').maybeSingle(), 'mover as tarefas da coluna');
      }
      tarefasMovidas = tarefas.length;
    }
    const excluida = confirmar(await db.from('portal_tarefas_colunas').delete().eq('id', id).select('id').maybeSingle(), 'excluir a coluna');
    if (!excluida) return falha('Coluna não encontrada.', 404);
    return { ok: true, tarefasMovidas };
  });
}

// ---------- tarefas ----------
export function criarTarefa(db, sessaoId, dados = {}) {
  return executar('criar a tarefa', async () => {
    const v = validarCampos(dados, CAMPOS_CRIAR);
    if (!v.ok) return v;
    if (v.valor.titulo === undefined) return falha('Informe o título da tarefa.');
    if (v.valor.coluna_id === undefined) return falha('Escolha a coluna da tarefa.');
    if (!(await colunaExiste(db, v.valor.coluna_id))) return falha('A coluna escolhida não existe mais. Atualize a página.');
    const responsavel = v.valor.responsavel_id ?? null;
    if (responsavel && !(await pessoaAtiva(db, responsavel))) return falha(MSG_RESPONSAVEL);
    const registro = {
      descricao: '', empreendimento: '', prazo: null, prioridade: 'media',
      ...v.valor, responsavel_id: responsavel,
      ordem: (await ultimaOrdem(db, v.valor.coluna_id)) + 1,
      criado_por: ehUuid(sessaoId) ? sessaoId : null,
    };
    const criada = confirmar(await db.from('portal_tarefas').insert(registro).select(TAREFA_CAMPOS).single(), 'criar a tarefa');
    return { ok: true, tarefa: pegarTarefa(criada) };
  });
}

/** Altera só os campos enviados. Mudar de coluna sem informar `ordem` coloca a tarefa no fim. */
export function editarTarefa(db, id, dados = {}) {
  return executar('salvar a tarefa', async () => {
    if (!ehUuid(id)) return falha('Tarefa não encontrada.', 404);
    const v = validarCampos(dados, CAMPOS_TAREFA);
    if (!v.ok) return v;
    const patch = v.valor;
    if (Object.keys(patch).length === 0) return falha('Informe o que mudar na tarefa.');
    const atual = confirmar(await db.from('portal_tarefas').select('id, coluna_id, responsavel_id').eq('id', id).maybeSingle(), 'salvar a tarefa');
    if (!atual) return falha('Tarefa não encontrada.', 404);
    if (patch.coluna_id !== undefined) {
      if (!(await colunaExiste(db, patch.coluna_id))) return falha('A coluna escolhida não existe mais. Atualize a página.');
      if (patch.coluna_id !== atual.coluna_id && patch.ordem === undefined) patch.ordem = (await ultimaOrdem(db, patch.coluna_id)) + 1;
    }
    // Só confere a pessoa quando ela muda: quem saiu da equipe continua no cartão até alguém trocar.
    if (patch.responsavel_id && patch.responsavel_id !== atual.responsavel_id && !(await pessoaAtiva(db, patch.responsavel_id))) {
      return falha(MSG_RESPONSAVEL);
    }
    const tarefa = confirmar(await db.from('portal_tarefas').update(patch).eq('id', id).select(TAREFA_CAMPOS).maybeSingle(), 'salvar a tarefa');
    if (!tarefa) return falha('Tarefa não encontrada.', 404);
    return { ok: true, tarefa: pegarTarefa(tarefa) };
  });
}

export function moverTarefa(db, id, colunaId, ordem) {
  const dados = { coluna_id: colunaId };
  if (ordem !== undefined) dados.ordem = ordem;
  return editarTarefa(db, id, dados);
}

export function excluirTarefa(db, id) {
  return executar('excluir a tarefa', async () => {
    if (!ehUuid(id)) return falha('Tarefa não encontrada.', 404);
    const apagada = confirmar(await db.from('portal_tarefas').delete().eq('id', id).select('id').maybeSingle(), 'excluir a tarefa');
    if (!apagada) return falha('Tarefa não encontrada.', 404);
    return { ok: true };
  });
}

// ---------- corpo da requisição ----------
/** Lê o JSON do corpo da requisição, com limite de 20 KB. Nunca lança. */
export async function lerCorpoJson(request) {
  const declarado = Number(request.headers?.get?.('content-length') || 0);
  if (declarado > MAX_CORPO) return falha('Os dados enviados são grandes demais.', 413);
  let texto;
  try {
    texto = await request.text();
  } catch {
    return falha('Não foi possível ler os dados enviados.');
  }
  if (new TextEncoder().encode(texto).length > MAX_CORPO) return falha('Os dados enviados são grandes demais.', 413);
  let valor;
  try {
    valor = JSON.parse(texto || '{}');
  } catch {
    return falha('Os dados enviados não estão em formato JSON válido.');
  }
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return falha('Envie os dados como um objeto JSON.');
  return { ok: true, valor };
}
