// Central de dados por empreendimento: CNPJ, PIX, materiais e postagens para redes sociais.
// Este modulo e apenas dados e validacoes locais. Nao faz requisicoes de rede
// e nao grava nada: os valores de DADOS_EMPREENDIMENTOS devem ser preenchidos
// pela equipe, e tudo passa por normalizarEmpreendimento antes de ser exibido.
import {empreendimentos as catalogo} from './catalog.mjs';
import dadosBrutos from '../data/central-dados.mjs';

/**
 * Link de material ja validado.
 * @typedef {{ titulo: string, url: string }} MaterialLink
 */

/**
 * Postagem ou video pronto para o corretor baixar e publicar. Ja validado.
 * @typedef {{ titulo: string, url: string, tipo: string }} PostagemLink
 */

/**
 * Empreendimento normalizado e seguro para exibicao.
 * @typedef {object} EmpreendimentoCentral
 * @property {string} id
 * @property {string} nome
 * @property {string} bairro
 * @property {string} cidade
 * @property {string} status
 * @property {string} razaoSocial
 * @property {string} cnpj Formatado como 00.000.000/0000-00 ou vazio quando invalido.
 * @property {{ tipo: string, chave: string, favorecido: string, banco: string }} pix
 * @property {Record<string, MaterialLink[]>} materiais Uma chave por item de ITENS_MATERIAIS.
 * @property {PostagemLink[]} postagens Colecao unica, sem separacao por mes.
 */

/**
 * Resumo de preenchimento de um empreendimento normalizado.
 * @typedef {object} StatusDados
 * @property {boolean} cnpj
 * @property {boolean} pix
 * @property {number} materiais Total de links em materiais.
 * @property {number} postagens Total de postagens.
 */

/** Tipos de postagem aceitos. O padrao, quando ausente ou invalido, e 'Vídeo'. */
export const TIPOS_POSTAGEM = Object.freeze(['Vídeo', 'Imagem', 'Carrossel', 'Texto']);

/** Tipos de chave PIX aceitos. */
export const TIPOS_PIX = Object.freeze(['CNPJ', 'E-mail', 'Telefone', 'Chave aleatória']);

/** Secoes de materiais exibidas na central, na ordem de apresentacao. Os ids dos itens existem em bibliotecaCategorias. */
export const SECOES_MATERIAIS = Object.freeze([
  Object.freeze({
    id: 'perspectivas',
    titulo: 'Perspectivas',
    itens: Object.freeze([
      Object.freeze({id: 'perspectivas-internas', nome: 'Internas'}),
      Object.freeze({id: 'perspectivas-externas', nome: 'Externas'}),
      Object.freeze({id: 'plantas', nome: 'Plantas'}),
    ]),
  }),
  Object.freeze({
    id: 'comercial',
    titulo: 'Comercial',
    itens: Object.freeze([
      Object.freeze({id: 'book-corretores', nome: 'Book dos corretores'}),
      Object.freeze({id: 'tabela-precos', nome: 'Tabela de preços'}),
    ]),
  }),
  Object.freeze({
    id: 'videos',
    titulo: 'Vídeos do empreendimento',
    itens: Object.freeze([
      Object.freeze({id: 'localizacao', nome: 'Localização'}),
      Object.freeze({id: 'apresentacao', nome: 'Empreendimento'}),
    ]),
  }),
  Object.freeze({
    id: 'identidade',
    titulo: 'Logomarca',
    itens: Object.freeze([
      Object.freeze({id: 'logomarca', nome: 'Logomarca'}),
    ]),
  }),
  Object.freeze({
    id: 'projetos',
    titulo: 'Projetos',
    itens: Object.freeze([
      Object.freeze({id: 'projeto-arquitetonico', nome: 'Arquitetônico'}),
      Object.freeze({id: 'estacionamento', nome: 'Vagas de estacionamento'}),
    ]),
  }),
  Object.freeze({
    id: 'documentacao',
    titulo: 'Documentação',
    itens: Object.freeze([
      Object.freeze({id: 'memorial', nome: 'Memorial descritivo'}),
    ]),
  }),
]);

/** Todos os ids de itens de materiais, na ordem das secoes. */
export const ITENS_MATERIAIS = Object.freeze(
  SECOES_MATERIAIS.flatMap((secao) => secao.itens.map((item) => item.id)),
);

/** Limite de links por item de materiais. */
export const MAX_LINKS_POR_ITEM = 20;

/** Limite de postagens por empreendimento. */
export const MAX_POSTAGENS = 60;

export const DADOS_EMPREENDIMENTOS = dadosBrutos;

/** URL da tela de edicao do arquivo de dados no GitHub. */
export const GITHUB_EDITAR_DADOS_URL = 'https://github.com/diegotbyrro-ui/meurocha/edit/main/data/central-dados.mjs';

/**
 * Converte um empreendimento normalizado para o formato editavel do arquivo de dados.
 * Materiais vazios sao omitidos. Postagens vazias viram lista vazia.
 * @param {EmpreendimentoCentral} emp
 * @returns {{ id: string, razaoSocial: string, cnpj: string, pix: { tipo: string, chave: string, favorecido: string, banco: string }, materiais: Record<string, MaterialLink[]>, postagens: PostagemLink[] }}
 */
export function paraEdicao(emp) {
  /** @type {Record<string, MaterialLink[]>} */
  const materiais = {};
  for (const [itemId, lista] of Object.entries(emp.materiais)) {
    if (lista.length > 0) materiais[itemId] = lista.map((l) => ({titulo: l.titulo, url: l.url}));
  }
  return {
    id: emp.id,
    razaoSocial: emp.razaoSocial,
    cnpj: emp.cnpj,
    pix: {tipo: emp.pix.tipo, chave: emp.pix.chave, favorecido: emp.pix.favorecido, banco: emp.pix.banco},
    materiais,
    postagens: emp.postagens.map((p) => ({titulo: p.titulo, url: p.url, tipo: p.tipo})),
  };
}

/**
 * Mantem apenas os digitos de um valor textual.
 * @param {unknown} valor
 * @returns {string} Digitos encontrados, ou '' quando o valor nao for texto.
 */
export function somenteDigitos(valor) {
  if (typeof valor !== 'string') return '';
  return valor.replace(/\D/g, '');
}

/**
 * Valida o CNPJ pelos dois digitos verificadores (modulo 11).
 * Aceita com ou sem mascara. Rejeita sequencias de digitos iguais.
 * @param {unknown} valor
 * @returns {boolean}
 */
export function cnpjValido(valor) {
  const d = somenteDigitos(valor);
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;

  const digitoVerificador = (base, pesos) => {
    const soma = base.reduce((acc, n, i) => acc + n * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const nums = [...d].map(Number);
  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const dv1 = digitoVerificador(nums.slice(0, 12), pesos1);
  if (dv1 !== nums[12]) return false;
  const dv2 = digitoVerificador(nums.slice(0, 13), pesos2);
  return dv2 === nums[13];
}

/**
 * Formata 14 digitos como 00.000.000/0000-00.
 * @param {unknown} valor
 * @returns {string} Texto formatado, ou '' quando nao houver 14 digitos.
 */
export function formatarCnpj(valor) {
  const d = somenteDigitos(valor);
  if (d.length !== 14) return '';
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/**
 * Retorna a URL normalizada somente quando for https com host.
 * @param {unknown} url
 * @returns {string} href normalizado, ou '' quando rejeitado.
 */
export function linkSeguro(url) {
  if (typeof url !== 'string' || url.length === 0 || url.length > 2000) return '';
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' || !u.hostname) return '';
    return u.href;
  } catch {
    return '';
  }
}

/**
 * Valida uma chave PIX conforme o tipo declarado.
 * @param {{ tipo: unknown, chave: unknown }} pix
 * @returns {boolean}
 */
export function pixValido(pix) {
  if (!pix || typeof pix !== 'object') return false;
  const {tipo, chave} = pix;
  if (typeof tipo !== 'string' || !TIPOS_PIX.includes(tipo)) return false;
  if (typeof chave !== 'string') return false;

  switch (tipo) {
    case 'CNPJ':
      return cnpjValido(chave);
    case 'E-mail':
      return chave.length <= 77 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(chave);
    case 'Telefone':
      return /^55\d{10,11}$/.test(somenteDigitos(chave));
    case 'Chave aleatória':
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(chave);
    default:
      return false;
  }
}

/**
 * Converte uma lista bruta em links seguros, com limite por item.
 * @param {unknown} lista
 * @returns {MaterialLink[]}
 */
function normalizarLinks(lista) {
  if (!Array.isArray(lista)) return [];
  /** @type {MaterialLink[]} */
  const saida = [];
  for (const item of lista) {
    if (saida.length >= MAX_LINKS_POR_ITEM) break;
    if (!item || typeof item !== 'object') continue;
    const url = linkSeguro(item.url);
    if (!url) continue;
    const titulo = typeof item.titulo === 'string' ? item.titulo.trim().slice(0, 120) : '';
    saida.push({titulo: titulo || 'Arquivo', url});
  }
  return saida;
}

/**
 * Converte as postagens brutas em uma lista unica e segura, com limite MAX_POSTAGENS.
 * Aceita a lista nova. Tambem aceita o formato antigo por mes ({'01': [...], ...}):
 * nesse caso as listas sao achatadas na ordem das chaves.
 * @param {unknown} bruto
 * @returns {PostagemLink[]}
 */
function normalizarPostagens(bruto) {
  /** @type {unknown[]} */
  let itens = [];
  if (Array.isArray(bruto)) {
    itens = bruto;
  } else if (bruto && typeof bruto === 'object') {
    const mapa = /** @type {Record<string, unknown>} */ (bruto);
    itens = Object.keys(mapa).sort().flatMap((chave) => (Array.isArray(mapa[chave]) ? mapa[chave] : []));
  }
  /** @type {PostagemLink[]} */
  const saida = [];
  for (const item of itens) {
    if (saida.length >= MAX_POSTAGENS) break;
    if (!item || typeof item !== 'object') continue;
    const reg = /** @type {Record<string, unknown>} */ (item);
    const url = linkSeguro(reg.url);
    if (!url) continue;
    const titulo = typeof reg.titulo === 'string' ? reg.titulo.trim().slice(0, 120) : '';
    const tipo = typeof reg.tipo === 'string' && TIPOS_POSTAGEM.includes(reg.tipo) ? reg.tipo : 'Vídeo';
    saida.push({titulo: titulo || 'Postagem', url, tipo});
  }
  return saida;
}

/**
 * Normaliza um empreendimento bruto. Nunca lanca excecao.
 * @param {unknown} raw
 * @returns {EmpreendimentoCentral | null} null quando o id nao existe no catalogo.
 */
export function normalizarEmpreendimento(raw) {
  try {
    if (!raw || typeof raw !== 'object') return null;
    const id = /** @type {{ id?: unknown }} */ (raw).id;
    const base = catalogo.find((e) => e.id === id);
    if (!base) return null;
    const r = /** @type {Record<string, any>} */ (raw);

    const pixRaw = r.pix && typeof r.pix === 'object' ? r.pix : {};
    const tipo = typeof pixRaw.tipo === 'string' && TIPOS_PIX.includes(pixRaw.tipo) ? pixRaw.tipo : 'CNPJ';
    const chaveBruta = typeof pixRaw.chave === 'string' ? pixRaw.chave.trim() : '';
    const chave = pixValido({tipo, chave: chaveBruta}) ? chaveBruta : '';

    const materiaisRaw = r.materiais && typeof r.materiais === 'object' ? r.materiais : {};
    /** @type {Record<string, MaterialLink[]>} */
    const materiais = {};
    for (const itemId of ITENS_MATERIAIS) {
      materiais[itemId] = normalizarLinks(materiaisRaw[itemId]);
    }

    const postagens = normalizarPostagens(r.postagens);

    const razaoSocial = typeof r.razaoSocial === 'string' ? r.razaoSocial.trim().slice(0, 160) : '';
    const cnpj = cnpjValido(r.cnpj) ? formatarCnpj(r.cnpj) : '';
    const favorecido = typeof pixRaw.favorecido === 'string' ? pixRaw.favorecido.trim().slice(0, 120) : '';
    const banco = typeof pixRaw.banco === 'string' ? pixRaw.banco.trim().slice(0, 80) : '';

    return {
      id: base.id,
      nome: base.nome,
      bairro: base.bairro,
      cidade: base.cidade,
      status: base.status,
      razaoSocial,
      cnpj,
      pix: {tipo, chave, favorecido, banco},
      materiais,
      postagens,
    };
  } catch {
    return null;
  }
}

/**
 * Lista todos os empreendimentos normalizados, sem os invalidos.
 * @param {readonly unknown[]} [dados] Lista bruta (ex.: a mesclada do Supabase). Padrao: o arquivo de dados.
 * @returns {EmpreendimentoCentral[]}
 */
export function listarEmpreendimentos(dados = DADOS_EMPREENDIMENTOS) {
  /** @type {EmpreendimentoCentral[]} */
  const saida = [];
  for (const raw of Array.isArray(dados) ? dados : []) {
    const emp = normalizarEmpreendimento(raw);
    if (emp) saida.push(emp);
  }
  return saida;
}

/**
 * Busca um empreendimento normalizado pelo id.
 * @param {unknown} id
 * @param {readonly unknown[]} [dados] Lista bruta. Padrao: o arquivo de dados.
 * @returns {EmpreendimentoCentral | null}
 */
export function obterEmpreendimento(id, dados = DADOS_EMPREENDIMENTOS) {
  if (typeof id !== 'string') return null;
  const lista = Array.isArray(dados) ? dados : [];
  const raw = lista.find((e) => e && typeof e === 'object' && /** @type {{ id?: unknown }} */ (e).id === id);
  return normalizarEmpreendimento(raw);
}

/**
 * Resume o preenchimento de um empreendimento normalizado.
 * @param {EmpreendimentoCentral | null | undefined} emp
 * @returns {StatusDados}
 */
export function statusDados(emp) {
  if (!emp) return {cnpj: false, pix: false, materiais: 0, postagens: 0};
  const materiais = Object.values(emp.materiais).reduce((acc, lista) => acc + lista.length, 0);
  return {
    cnpj: emp.cnpj !== '',
    pix: pixValido({tipo: emp.pix.tipo, chave: emp.pix.chave}),
    materiais,
    postagens: emp.postagens.length,
  };
}
