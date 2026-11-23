// Gera o conteudo completo de data/central-dados.mjs a partir da lista editada na tela
// Atualizar conteudo do portal. Nao faz requisicoes de rede e nao grava nada.
import {empreendimentos as catalogo} from './catalog.mjs';
import {
  SECOES_MATERIAIS, ITENS_MATERIAIS, normalizarEmpreendimento, paraEdicao,
} from './empreendimentos-central.mjs';

/** Cabecalho do arquivo gerado. Deve ser igual ao de data/central-dados.mjs. */
const CABECALHO = '// Arquivo gerado pela tela Atualizar conteúdo do portal (/portal/atualizar). Prefira editar por lá.';

/**
 * Limpa uma entrada bruta para o formato editavel. Entradas invalidas viram vazias.
 * @param {unknown} raw
 * @param {string} id
 * @returns {ReturnType<typeof paraEdicao> | null}
 */
function entradaLimpa(raw, id) {
  try {
    const emp = normalizarEmpreendimento(raw) ?? normalizarEmpreendimento({id});
    return emp ? paraEdicao(emp) : null;
  } catch {
    return null;
  }
}

/**
 * Monta a lista limpa, na ordem do catalogo, com os 4 ids sempre presentes.
 * @param {unknown} lista
 * @returns {Array<ReturnType<typeof paraEdicao>>}
 */
function listaLimpa(lista) {
  const entradas = Array.isArray(lista) ? lista : [];
  /** @type {Array<ReturnType<typeof paraEdicao>>} */
  const saida = [];
  for (const cat of catalogo) {
    try {
      const achado = entradas.find((e) => e && typeof e === 'object' && e.id === cat.id);
      const limpa = entradaLimpa(achado ?? {id: cat.id}, cat.id);
      if (limpa) saida.push(limpa);
    } catch {
      // Uma entrada com problema nao impede as demais.
    }
  }
  return saida;
}

/**
 * Gera o texto completo do arquivo data/central-dados.mjs. Nunca lanca excecao.
 * @param {unknown} lista Lista de empreendimentos no formato editavel.
 * @returns {string}
 */
export function gerarArquivoDados(lista) {
  const corpo = JSON.stringify(listaLimpa(lista), null, 2);
  return `${CABECALHO}\nexport default Object.freeze(${corpo});\n`;
}

/**
 * @param {number} n
 * @param {string} singular
 * @param {string} plural
 * @returns {string}
 */
function contar(n, singular, plural) {
  return `${n} ${n === 1 ? singular : plural}`;
}

/**
 * Compara dois conjuntos de links pela URL e devolve os que entraram e os que sairam.
 * @param {Array<{url: string}>} antes
 * @param {Array<{url: string}>} depois
 */
function diferencaLinks(antes, depois) {
  const urlsAntes = new Set(antes.map((l) => l.url));
  const urlsDepois = new Set(depois.map((l) => l.url));
  return {
    novos: depois.filter((l) => !urlsAntes.has(l.url)).length,
    removidos: antes.filter((l) => !urlsDepois.has(l.url)).length,
  };
}

/**
 * Lista em portugues o que mudou entre a versao publicada e a editada.
 * Compara por id do empreendimento. Nunca lanca excecao.
 * @param {unknown} antes Lista de empreendimentos publicada.
 * @param {unknown} depois Lista de empreendimentos editada.
 * @returns {string[]}
 */
export function resumoAlteracoes(antes, depois) {
  /** @type {string[]} */
  const frases = [];
  try {
    const listaAntes = listaLimpa(antes);
    const listaDepois = listaLimpa(depois);
    for (const cat of catalogo) {
      const a = listaAntes.find((e) => e.id === cat.id);
      const d = listaDepois.find((e) => e.id === cat.id);
      if (!a || !d) continue;
      const prefixo = `${cat.nome}: `;

      if (a.razaoSocial !== d.razaoSocial) frases.push(`${prefixo}razão social alterada`);
      if (a.cnpj !== d.cnpj) frases.push(`${prefixo}CNPJ alterado`);
      const pixMudou = a.pix.tipo !== d.pix.tipo || a.pix.chave !== d.pix.chave
        || a.pix.favorecido !== d.pix.favorecido || a.pix.banco !== d.pix.banco;
      if (pixMudou) frases.push(`${prefixo}PIX alterado`);

      for (const secao of SECOES_MATERIAIS) {
        for (const item of secao.itens) {
          if (!ITENS_MATERIAIS.includes(item.id)) continue;
          const {novos, removidos} = diferencaLinks(a.materiais[item.id] ?? [], d.materiais[item.id] ?? []);
          if (novos > 0) frases.push(`${prefixo}${contar(novos, 'link novo', 'links novos')} em ${item.nome}`);
          if (removidos > 0) frases.push(`${prefixo}${contar(removidos, 'link removido', 'links removidos')} de ${item.nome}`);
        }
      }

      const postagens = diferencaLinks(a.postagens, d.postagens);
      if (postagens.novos > 0) frases.push(`${prefixo}${contar(postagens.novos, 'postagem nova', 'postagens novas')}`);
      if (postagens.removidos > 0) frases.push(`${prefixo}${contar(postagens.removidos, 'postagem removida', 'postagens removidas')}`);
    }
  } catch {
    return frases;
  }
  return frases;
}
