// Central de dados por empreendimento: CNPJ, PIX, materiais e postagens mensais.
// Este modulo e apenas dados e validacoes locais. Nao faz requisicoes de rede
// e nao grava nada: os valores de DADOS_EMPREENDIMENTOS devem ser preenchidos
// pela equipe, e tudo passa por normalizarEmpreendimento antes de ser exibido.
import {empreendimentos as catalogo} from './catalog.mjs';

/**
 * Link de material ou postagem ja validado.
 * @typedef {{ titulo: string, url: string }} MaterialLink
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
 * @property {Record<string, MaterialLink[]>} postagens Chaves '01' a '12'.
 */

/**
 * Resumo de preenchimento de um empreendimento normalizado.
 * @typedef {object} StatusDados
 * @property {boolean} cnpj
 * @property {boolean} pix
 * @property {number} materiais Total de links em materiais.
 * @property {number} postagens Total de links em postagens.
 * @property {number} mesesComPostagem Quantidade de meses com ao menos um link.
 */

/** Meses do ano, usados como chaves de postagens. */
export const MESES = Object.freeze([
  {id: '01', nome: 'Janeiro'},
  {id: '02', nome: 'Fevereiro'},
  {id: '03', nome: 'Março'},
  {id: '04', nome: 'Abril'},
  {id: '05', nome: 'Maio'},
  {id: '06', nome: 'Junho'},
  {id: '07', nome: 'Julho'},
  {id: '08', nome: 'Agosto'},
  {id: '09', nome: 'Setembro'},
  {id: '10', nome: 'Outubro'},
  {id: '11', nome: 'Novembro'},
  {id: '12', nome: 'Dezembro'},
]);

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

/** Limite de links por item de materiais e por mes de postagens. */
export const MAX_LINKS_POR_ITEM = 20;

/*
 * DADOS EMPREENDIMENTOS: dados brutos e editaveis pela equipe.
 * Todos os valores estao vazios de proposito. Preencha somente com dados reais.
 *
 * Como preencher cada entrada:
 * - razaoSocial: razao social completa do titular do empreendimento.
 * - cnpj: aceita com ou sem mascara (ex.: '11.222.333/0001-81' ou '11222333000181').
 *   CNPJ com digitos verificadores invalidos e exibido vazio.
 * - pix.tipo: um dos valores de TIPOS_PIX ('CNPJ', 'E-mail', 'Telefone', 'Chave aleatória').
 * - pix.chave: CNPJ valido; e-mail; telefone com DDI 55 (ex.: '+55 82 99999-9999');
 *   ou chave aleatoria no formato UUID.
 * - pix.favorecido e pix.banco: texto livre (limites de 120 e 80 caracteres).
 * - materiais: objeto cuja chave e um id de ITENS_MATERIAIS (ex.: 'plantas'), e cujo valor
 *   e uma lista de links:
 *   materiais: {
 *     'plantas': [{ titulo: 'Planta 2 quartos', url: 'https://drive.google.com/...' }],
 *     'tabela-precos': [{ titulo: 'Tabela de preços jan/2027', url: 'https://...' }],
 *   }
 * - postagens: objeto com chaves '01' a '12' (meses de MESES), cada uma com a lista de links:
 *   postagens: {
 *     '01': [{ titulo: 'Post janeiro - fachada', url: 'https://...' }],
 *     '02': [],
 *   }
 * - Somente links https sao aceitos. Links http, javascript: ou data: sao descartados.
 * - Cada item aceita no maximo MAX_LINKS_POR_ITEM links; o excedente e ignorado.
 * - Chaves desconhecidas em materiais ou postagens sao descartadas na normalizacao.
 */
export const DADOS_EMPREENDIMENTOS = Object.freeze([
  {
    id: 'easy-rota-do-mar',
    razaoSocial: '',
    cnpj: '',
    pix: {tipo: 'CNPJ', chave: '', favorecido: '', banco: ''},
    materiais: {},
    postagens: {},
  },
  {
    id: 'easy-serraria',
    razaoSocial: '',
    cnpj: '',
    pix: {tipo: 'CNPJ', chave: '', favorecido: '', banco: ''},
    materiais: {},
    postagens: {},
  },
  {
    id: 'vistas-do-sino',
    razaoSocial: '',
    cnpj: '',
    pix: {tipo: 'CNPJ', chave: '', favorecido: '', banco: ''},
    materiais: {},
    postagens: {},
  },
  {
    id: 'eco-vitta',
    razaoSocial: '',
    cnpj: '',
    pix: {tipo: 'CNPJ', chave: '', favorecido: '', banco: ''},
    materiais: {},
    postagens: {},
  },
]);

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

    const postagensRaw = r.postagens && typeof r.postagens === 'object' ? r.postagens : {};
    /** @type {Record<string, MaterialLink[]>} */
    const postagens = {};
    for (const mes of MESES) {
      postagens[mes.id] = normalizarLinks(postagensRaw[mes.id]);
    }

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
 * @returns {EmpreendimentoCentral[]}
 */
export function listarEmpreendimentos() {
  /** @type {EmpreendimentoCentral[]} */
  const saida = [];
  for (const raw of DADOS_EMPREENDIMENTOS) {
    const emp = normalizarEmpreendimento(raw);
    if (emp) saida.push(emp);
  }
  return saida;
}

/**
 * Busca um empreendimento normalizado pelo id.
 * @param {unknown} id
 * @returns {EmpreendimentoCentral | null}
 */
export function obterEmpreendimento(id) {
  if (typeof id !== 'string') return null;
  const raw = DADOS_EMPREENDIMENTOS.find((e) => e.id === id);
  return normalizarEmpreendimento(raw);
}

/**
 * Resume o preenchimento de um empreendimento normalizado.
 * @param {EmpreendimentoCentral | null | undefined} emp
 * @returns {StatusDados}
 */
export function statusDados(emp) {
  if (!emp) return {cnpj: false, pix: false, materiais: 0, postagens: 0, mesesComPostagem: 0};
  const materiais = Object.values(emp.materiais).reduce((acc, lista) => acc + lista.length, 0);
  const postagens = Object.values(emp.postagens).reduce((acc, lista) => acc + lista.length, 0);
  const mesesComPostagem = Object.values(emp.postagens).filter((lista) => lista.length > 0).length;
  return {
    cnpj: emp.cnpj !== '',
    pix: pixValido({tipo: emp.pix.tipo, chave: emp.pix.chave}),
    materiais,
    postagens,
    mesesComPostagem,
  };
}
