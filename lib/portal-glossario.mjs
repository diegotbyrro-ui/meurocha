// Glossario do portal: termos tecnicos explicados em linguagem simples.
// Usado pelo componente Termo (app/portal/ajuda) e pela pagina de ajuda.

/**
 * @typedef {Object} EntradaGlossario
 * @property {string} termo Nome do termo, como aparece na tela.
 * @property {string} definicao Explicacao curta em 1 a 2 frases.
 */

export const GLOSSARIO = Object.freeze({
  'ato': Object.freeze({
    termo: 'Ato',
    definicao: 'Pagamento feito pelo cliente ao assinar o contrato de compra. Garante a reserva da unidade escolhida.',
  }),
  'ato-parcelado': Object.freeze({
    termo: 'Ato parcelado',
    definicao: 'Parte do ato dividida em parcelas, pagas antes da entrega do imóvel. Cada pagamento inicial fica menor.',
  }),
  'mensais': Object.freeze({
    termo: 'Mensais',
    definicao: 'Parcelas pagas todo mês durante a obra, até a entrega das chaves. O valor de cada uma consta na tabela de pagamento.',
  }),
  'intercaladas': Object.freeze({
    termo: 'Intercaladas',
    definicao: 'Parcelas de valor maior, pagas em meses marcados durante a obra, além das mensais. Costumam ser semestrais ou anuais.',
  }),
  'entrega-chaves': Object.freeze({
    termo: 'Entrega das chaves',
    definicao: 'Data em que o imóvel fica pronto e o cliente recebe as chaves. Depois dela, o saldo restante costuma ser pago com financiamento.',
  }),
  'incc': Object.freeze({
    termo: 'INCC',
    definicao: 'Índice que mede a alta dos custos da construção civil. Muitas tabelas de obra reajustam as parcelas por ele.',
  }),
  'fgts': Object.freeze({
    termo: 'FGTS',
    definicao: 'Fundo de Garantia do Tempo de Serviço, dinheiro guardado pelo trabalhador com carteira assinada. Pode ser usado na entrada ou para abater a dívida, conforme as regras da Caixa.',
  }),
  'subsidio': Object.freeze({
    termo: 'Subsídio',
    definicao: 'Desconto do governo, em alguns programas, para ajudar a pagar a entrada ou as parcelas. Vale só para quem se encaixa nas faixas de renda do programa.',
  }),
  'price': Object.freeze({
    termo: 'PRICE',
    definicao: 'Forma de pagar o financiamento em parcelas iguais do início ao fim. No começo, grande parte de cada parcela é juros.',
  }),
  'sac': Object.freeze({
    termo: 'SAC',
    definicao: 'Forma de pagar o financiamento em que a parte que abate a dívida é igual todo mês. A primeira parcela é mais alta, e as seguintes caem, com menos juros no total.',
  }),
  'comprometimento': Object.freeze({
    termo: 'Comprometimento de renda',
    definicao: 'Percentual da renda mensal que vai para a parcela do imóvel. Os bancos costumam limitar esse percentual para aprovar o financiamento.',
  }),
  'financiamento': Object.freeze({
    termo: 'Financiamento',
    definicao: 'Empréstimo do banco para pagar o imóvel. O cliente devolve o valor em parcelas, com juros, por muitos anos.',
  }),
  'desconto': Object.freeze({
    termo: 'Desconto',
    definicao: 'Valor abatido do preço ou de uma parcela, por negociação ou condição de campanha. Confirme na tabela de preços antes de prometer ao cliente.',
  }),
  'avaliacao': Object.freeze({
    termo: 'Avaliação',
    definicao: 'Estimativa do valor do imóvel feita pelo banco ou por um profissional. O financiamento costuma cobrir só uma parte desse valor.',
  }),
  'entrada': Object.freeze({
    termo: 'Entrada',
    definicao: 'Valor pago antes do financiamento, à vista ou em poucas parcelas. Completa a diferença entre o preço do imóvel e o valor financiado.',
  }),
  'pix': Object.freeze({
    termo: 'PIX',
    definicao: 'Forma de pagamento e transferência instantânea entre contas bancárias. A chave PIX é o código que o cliente usa para pagar.',
  }),
  'cnpj': Object.freeze({
    termo: 'CNPJ',
    definicao: 'Número que identifica a empresa na Receita Federal. Consta em contratos, notas e na identificação de cada empreendimento.',
  }),
  'book': Object.freeze({
    termo: 'Book',
    definicao: 'Apresentação comercial do empreendimento, com plantas, fotos e condições. O corretor mostra o book ao cliente.',
  }),
  'memorial': Object.freeze({
    termo: 'Memorial descritivo',
    definicao: 'Documento que descreve materiais e acabamentos da obra, como piso, louças e esquadrias. Ajuda a explicar o que o cliente vai receber.',
  }),
  'perspectivas': Object.freeze({
    termo: 'Perspectivas',
    definicao: 'Imagens em 3D que mostram como o prédio e os ambientes vão ficar. São ilustrações, não fotos do imóvel pronto.',
  }),
  'tabela-precos': Object.freeze({
    termo: 'Tabela de preços',
    definicao: 'Lista de preços, condições e parcelas de cada unidade. Use sempre a versão mais recente antes de passar valores ao cliente.',
  }),
  'link-https': Object.freeze({
    termo: 'Link https',
    definicao: 'Endereço da internet que começa com https://, o que indica conexão segura. Ao colar links de materiais, confira se eles começam assim.',
  }),
});

/**
 * Busca a entrada do glossario pelo id.
 * @param {string} id Identificador do termo, por exemplo 'ato' ou 'pix'.
 * @returns {Readonly<EntradaGlossario> | null} Entrada encontrada ou null.
 */
export function obterTermo(id) {
  if (typeof id !== 'string') return null;
  return Object.prototype.hasOwnProperty.call(GLOSSARIO, id) ? GLOSSARIO[id] : null;
}
