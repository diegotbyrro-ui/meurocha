// Simulador de entrada: calculos aritmeticos verificaveis.
// NAO implementa tabela comercial, condicoes aprovadas, CAIXA nem financiamento oficial.
// Sem DOM e sem rede: funcoes puras.
import { moedaEntrada as moedaEntradaBase } from './calculo-preliminar-r6.mjs';

/** Reexporta o parser de moeda do calculo preliminar (R6). */
export { moedaEntradaBase as moedaEntrada };

/**
 * Arredonda para centavos.
 * @param {number} v
 * @returns {number}
 */
export const cent = v => Math.round((v + Number.EPSILON) * 100) / 100;

/** Limite de comprometimento de renda, em percentual. */
export const LIMITE_COMPROMETIMENTO = 30;

const MSG_VALORES = 'Confira os valores informados. Use apenas números não negativos.';
const MSG_QUANTIDADE = 'A quantidade de parcelas deve ser um número inteiro entre 0 e 480.';
const MSG_MES = 'Mês inválido. Use o formato AAAA-MM.';
const MSG_MESES_INT = 'O número de meses deve ser inteiro.';
const MSG_INCC = 'O INCC mensal deve estar entre 0% e 5%.';
const MSG_FINANCIAMENTO_VALOR = 'O valor financiado deve ser um número não negativo.';
const MSG_FINANCIAMENTO_PRAZO = 'O prazo deve ser um número inteiro de 1 a 420 meses.';
const MSG_FINANCIAMENTO_TAXA = 'A taxa anual deve estar entre 0% e 30%.';

/**
 * @param {unknown} v
 * @returns {boolean}
 */
const isNum = v => typeof v === 'number' && Number.isFinite(v);

/**
 * Exige que todos os valores sejam numeros finitos e nao negativos.
 * @param {Record<string, unknown>} obj
 * @returns {void}
 */
function exigirNaoNegativos(obj) {
  for (const v of Object.values(obj)) {
    if (!isNum(v) || v < 0) throw new Error(MSG_VALORES);
  }
}

/**
 * @param {unknown} q
 * @returns {void}
 */
function exigirQuantidade(q) {
  if (!Number.isInteger(q) || q < 0 || q > 480) throw new Error(MSG_QUANTIDADE);
}

/**
 * Converte 'AAAA-MM' em indice mensal absoluto.
 * @param {unknown} yyyyMm
 * @returns {number}
 */
function indiceMes(yyyyMm) {
  const m = typeof yyyyMm === 'string' ? /^(\d{4})-(0[1-9]|1[0-2])$/.exec(yyyyMm) : null;
  if (!m) throw new Error(MSG_MES);
  return Number(m[1]) * 12 + (Number(m[2]) - 1);
}

/**
 * Soma rendas formal e informal, em centavos.
 * @param {number} formal
 * @param {number} informal
 * @returns {number}
 */
export function rendaTotal(formal, informal) {
  if (!isNum(formal) || !isNum(informal) || formal < 0 || informal < 0) {
    throw new Error('Informe rendas válidas.');
  }
  return cent(formal + informal);
}

/**
 * @typedef {object} EntradaInput
 * @property {number} valorImovel
 * @property {number} [desconto]
 * @property {number} [financiamento]
 * @property {number} [fgts]
 * @property {number} [subsidio]
 */

/**
 * @typedef {object} EntradaResultado
 * @property {number} valorLiquido
 * @property {number} entradaTotal
 */

/**
 * Calcula o valor liquido do imovel e a entrada necessaria.
 * @param {EntradaInput} params
 * @returns {EntradaResultado}
 */
export function calcularEntrada({ valorImovel, desconto = 0, financiamento = 0, fgts = 0, subsidio = 0 }) {
  exigirNaoNegativos({ valorImovel, desconto, financiamento, fgts, subsidio });
  if (valorImovel <= 0) throw new Error('O valor do imóvel deve ser maior que zero.');
  if (desconto > valorImovel) throw new Error('O desconto não pode ser maior que o valor do imóvel.');
  const valorLiquido = cent(valorImovel - desconto);
  const entradaTotal = cent(valorLiquido - financiamento - fgts - subsidio);
  if (entradaTotal < 0) throw new Error('Financiamento, FGTS e subsídio superam o valor da unidade.');
  return { valorLiquido, entradaTotal };
}

/**
 * @typedef {object} PlanoInput
 * @property {number} [entradaTotal]
 * @property {number} [ato]
 * @property {number} [atoParceladoValor]
 * @property {number} [atoParceladoQtd]
 * @property {number} [mensalValor]
 * @property {number} [mensalQtd]
 * @property {number} [intercaladaValor]
 * @property {number} [intercaladaQtd]
 * @property {number} [entrega]
 */

/**
 * @typedef {object} PlanoResultado
 * @property {number} totalAto
 * @property {number} totalAtoParcelado
 * @property {number} totalMensais
 * @property {number} totalIntercaladas
 * @property {number} totalEntrega
 * @property {number} totalPlano
 * @property {number} diferenca Positivo = ainda falta; negativo = excede.
 * @property {boolean} conciliado
 */

/**
 * Soma os componentes do plano de pagamento da entrada e compara com a entrada total.
 * @param {PlanoInput} params
 * @returns {PlanoResultado}
 */
export function planoEntrada({
  entradaTotal = 0,
  ato = 0,
  atoParceladoValor = 0,
  atoParceladoQtd = 0,
  mensalValor = 0,
  mensalQtd = 0,
  intercaladaValor = 0,
  intercaladaQtd = 0,
  entrega = 0,
}) {
  exigirNaoNegativos({ entradaTotal, ato, atoParceladoValor, mensalValor, intercaladaValor, entrega });
  exigirQuantidade(atoParceladoQtd);
  exigirQuantidade(mensalQtd);
  exigirQuantidade(intercaladaQtd);
  const totalAto = cent(ato);
  const totalAtoParcelado = cent(atoParceladoValor * atoParceladoQtd);
  const totalMensais = cent(mensalValor * mensalQtd);
  const totalIntercaladas = cent(intercaladaValor * intercaladaQtd);
  const totalEntrega = cent(entrega);
  const totalPlano = cent(totalAto + totalAtoParcelado + totalMensais + totalIntercaladas + totalEntrega);
  const diferenca = cent(entradaTotal - totalPlano);
  return {
    totalAto,
    totalAtoParcelado,
    totalMensais,
    totalIntercaladas,
    totalEntrega,
    totalPlano,
    diferenca,
    conciliado: Math.abs(diferenca) < 0.01,
  };
}

const COMPONENTE_TOTAL = {
  ato: 'totalAto',
  atoParcelado: 'totalAtoParcelado',
  mensal: 'totalMensais',
  intercalada: 'totalIntercaladas',
  entrega: 'totalEntrega',
};

const CAMPO_QUANTIDADE = {
  atoParcelado: 'atoParceladoQtd',
  mensal: 'mensalQtd',
  intercalada: 'intercaladaQtd',
};

/**
 * @typedef {object} RecalculoResultado
 * @property {number} valor
 * @property {string} aviso
 */

/**
 * Calcula o valor que falta em um campo do plano para fechar a entrada.
 * @param {'ato' | 'atoParcelado' | 'mensal' | 'intercalada' | 'entrega'} campo
 * @param {PlanoInput} dados
 * @returns {RecalculoResultado}
 */
export function recalcular(campo, dados) {
  if (!Object.prototype.hasOwnProperty.call(COMPONENTE_TOTAL, campo)) {
    throw new Error(`Campo desconhecido para recálculo: ${campo}.`);
  }
  const plano = planoEntrada(dados);
  const entradaTotal = dados.entradaTotal ?? 0;
  const outros = cent(
    Object.entries(COMPONENTE_TOTAL)
      .filter(([k]) => k !== campo)
      .reduce((soma, [, prop]) => soma + plano[prop], 0),
  );
  const restante = cent(entradaTotal - outros);
  if (restante <= 0) return { valor: 0, aviso: 'Os demais pagamentos já cobrem a entrada.' };
  if (campo === 'ato' || campo === 'entrega') return { valor: cent(restante), aviso: '' };

  const qtd = dados[CAMPO_QUANTIDADE[campo]] ?? 0;
  if (qtd === 0) return { valor: 0, aviso: 'Informe a quantidade de parcelas antes de recalcular.' };

  const centavosRestantes = Math.round(restante * 100);
  const centavosPorParcela = Math.floor(centavosRestantes / qtd);
  const residuo = centavosRestantes - centavosPorParcela * qtd;
  const aviso = residuo > 0
    ? `Resíduo de ${formatarBRL(residuo / 100)} por arredondamento — ajuste no ato.`
    : '';
  return { valor: centavosPorParcela / 100, aviso };
}

/**
 * @param {number} v
 * @returns {string}
 */
function formatarBRL(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

/**
 * Soma n meses a um mes 'AAAA-MM'.
 * @param {string} yyyyMm
 * @param {number} n
 * @returns {string} 'AAAA-MM'
 */
export function addMeses(yyyyMm, n) {
  const base = indiceMes(yyyyMm);
  if (!Number.isInteger(n)) throw new Error(MSG_MESES_INT);
  const idx = base + n;
  const ano = Math.floor(idx / 12);
  const mes = idx - ano * 12 + 1;
  return `${String(ano).padStart(4, '0')}-${String(mes).padStart(2, '0')}`;
}

/**
 * Quantidade de meses de a ate b (b - a).
 * @param {string} a 'AAAA-MM'
 * @param {string} b 'AAAA-MM'
 * @returns {number}
 */
export function mesesEntre(a, b) {
  return indiceMes(b) - indiceMes(a);
}

/**
 * @typedef {object} CronogramaInput
 * @property {string} mesBase 'AAAA-MM'
 * @property {number} [ato]
 * @property {number} [atoParceladoValor]
 * @property {number} [atoParceladoQtd]
 * @property {number} [mensalValor]
 * @property {number} [mensalQtd]
 * @property {string} [primeiraMensal] 'AAAA-MM', padrao mesBase + 1
 * @property {number} [intercaladaValor]
 * @property {number} [intercaladaQtd]
 * @property {string} [primeiraIntercalada] 'AAAA-MM', padrao mesBase + 12
 * @property {number} [entrega]
 * @property {string} [mesEntrega] 'AAAA-MM', padrao mesBase + 36
 * @property {number} [inccMensal] Percentual de 0 a 5.
 */

/**
 * @typedef {object} ItemCronograma
 * @property {string} mes
 * @property {string} descricao
 * @property {number} nominal
 * @property {number} corrigido
 */

/**
 * @typedef {object} CronogramaResultado
 * @property {ItemCronograma[]} itens
 * @property {number} totalNominal
 * @property {number} totalCorrigido
 * @property {{ mes: string, nominal: number, corrigido: number }[]} porMes
 */

/**
 * Gera o cronograma de pagamentos da entrada com correcao mensal (INCC).
 * @param {CronogramaInput} params
 * @returns {CronogramaResultado}
 */
export function cronograma({
  mesBase,
  ato = 0,
  atoParceladoValor = 0,
  atoParceladoQtd = 0,
  mensalValor = 0,
  mensalQtd = 0,
  primeiraMensal = addMeses(mesBase, 1),
  intercaladaValor = 0,
  intercaladaQtd = 0,
  primeiraIntercalada = addMeses(mesBase, 12),
  entrega = 0,
  mesEntrega = addMeses(mesBase, 36),
  inccMensal = 0,
}) {
  indiceMes(mesBase);
  indiceMes(primeiraMensal);
  indiceMes(primeiraIntercalada);
  indiceMes(mesEntrega);
  if (!isNum(inccMensal) || inccMensal < 0 || inccMensal > 5) throw new Error(MSG_INCC);
  exigirNaoNegativos({ ato, atoParceladoValor, mensalValor, intercaladaValor, entrega });
  exigirQuantidade(atoParceladoQtd);
  exigirQuantidade(mensalQtd);
  exigirQuantidade(intercaladaQtd);

  const fator = 1 + inccMensal / 100;
  /** @type {ItemCronograma[]} */
  const itens = [];
  /**
   * @param {string} mes
   * @param {string} descricao
   * @param {number} valor
   */
  const adicionar = (mes, descricao, valor) => {
    const nominal = cent(valor);
    const corrigido = cent(nominal * Math.pow(fator, Math.max(0, mesesEntre(mesBase, mes))));
    itens.push({ mes, descricao, nominal, corrigido });
  };

  if (ato > 0) adicionar(mesBase, 'Ato / sinal', ato);
  if (atoParceladoValor > 0) {
    for (let k = 1; k <= atoParceladoQtd; k++) {
      adicionar(addMeses(mesBase, k), `Ato parcelado ${k}/${atoParceladoQtd}`, atoParceladoValor);
    }
  }
  if (mensalValor > 0) {
    for (let k = 1; k <= mensalQtd; k++) {
      adicionar(addMeses(primeiraMensal, k - 1), `Mensal ${k}/${mensalQtd}`, mensalValor);
    }
  }
  if (intercaladaValor > 0) {
    for (let k = 1; k <= intercaladaQtd; k++) {
      adicionar(
        addMeses(primeiraIntercalada, 12 * (k - 1)),
        `Intercalada anual ${k}/${intercaladaQtd}`,
        intercaladaValor,
      );
    }
  }
  if (entrega > 0) adicionar(mesEntrega, 'Parcela de entrega (chaves)', entrega);

  // Array.prototype.sort e estavel: empates mantem a ordem de insercao.
  itens.sort((x, y) => (x.mes < y.mes ? -1 : x.mes > y.mes ? 1 : 0));

  const totalNominal = cent(itens.reduce((s, it) => s + it.nominal, 0));
  const totalCorrigido = cent(itens.reduce((s, it) => s + it.corrigido, 0));

  /** @type {Map<string, { mes: string, nominal: number, corrigido: number }>} */
  const agregado = new Map();
  for (const it of itens) {
    const atual = agregado.get(it.mes) ?? { mes: it.mes, nominal: 0, corrigido: 0 };
    atual.nominal += it.nominal;
    atual.corrigido += it.corrigido;
    agregado.set(it.mes, atual);
  }
  const porMes = [...agregado.values()]
    .map(m => ({ mes: m.mes, nominal: cent(m.nominal), corrigido: cent(m.corrigido) }))
    .sort((x, y) => (x.mes < y.mes ? -1 : x.mes > y.mes ? 1 : 0));

  return { itens, totalNominal, totalCorrigido, porMes };
}

/**
 * Taxa mensal efetiva equivalente a uma taxa anual (nao arredondada).
 * @param {number} taxaAnualPct
 * @returns {number}
 */
export function taxaMensal(taxaAnualPct) {
  if (!isNum(taxaAnualPct) || taxaAnualPct <= -100) throw new Error(MSG_FINANCIAMENTO_TAXA);
  return Math.pow(1 + taxaAnualPct / 100, 1 / 12) - 1;
}

/**
 * @param {number} principal
 * @param {number} taxaAnualPct
 * @param {number} meses
 * @returns {void}
 */
function validarFinanciamento(principal, taxaAnualPct, meses) {
  if (!isNum(principal) || principal < 0) throw new Error(MSG_FINANCIAMENTO_VALOR);
  if (!Number.isInteger(meses) || meses < 1 || meses > 420) throw new Error(MSG_FINANCIAMENTO_PRAZO);
  if (!isNum(taxaAnualPct) || taxaAnualPct < 0 || taxaAnualPct > 30) throw new Error(MSG_FINANCIAMENTO_TAXA);
}

/**
 * Parcela fixa (sistema Price).
 * @param {number} principal
 * @param {number} taxaAnualPct Entre 0 e 30.
 * @param {number} meses Inteiro de 1 a 420.
 * @returns {number}
 */
export function parcelaPrice(principal, taxaAnualPct, meses) {
  validarFinanciamento(principal, taxaAnualPct, meses);
  if (taxaAnualPct === 0) return cent(principal / meses);
  const i = taxaMensal(taxaAnualPct);
  return cent((principal * i) / (1 - Math.pow(1 + i, -meses)));
}

/**
 * Primeira e ultima parcela (sistema SAC).
 * @param {number} principal
 * @param {number} taxaAnualPct Entre 0 e 30.
 * @param {number} meses Inteiro de 1 a 420.
 * @returns {{ primeira: number, ultima: number }}
 */
export function parcelasSac(principal, taxaAnualPct, meses) {
  validarFinanciamento(principal, taxaAnualPct, meses);
  const i = taxaMensal(taxaAnualPct);
  const amortizacao = principal / meses;
  return {
    primeira: cent(amortizacao + principal * i),
    ultima: cent(amortizacao + amortizacao * i),
  };
}

/**
 * Percentual da renda comprometido pela parcela.
 * @param {number} parcela
 * @param {number} renda
 * @returns {{ percentual: number, dentroDoLimite: boolean }}
 */
export function comprometimento(parcela, renda) {
  if (!(renda > 0)) return { percentual: NaN, dentroDoLimite: false };
  const percentual = cent((parcela / renda) * 100);
  return { percentual, dentroDoLimite: percentual <= LIMITE_COMPROMETIMENTO };
}
