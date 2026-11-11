// Calculos aritmeticos verificaveis. NAO implementam Nekt, CV CRM ou CAIXA.
export function moedaEntrada(valor) {
  if (typeof valor === 'number') return Number.isFinite(valor) && valor >= 0 ? valor : NaN;
  if (typeof valor !== 'string') return NaN;
  let t = valor.trim().replace(/R\$|\s/g, '');
  if (!t) return 0;
  if (!/^[\d.,]+$/.test(t)) return NaN;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  const num = Number(t);
  return Number.isFinite(num) && num >= 0 && num <= 1e10 ? num : NaN;
}
const cent = v => Math.round((v + Number.EPSILON) * 100) / 100;
function exigir(obj) {
  if (!Object.values(obj).every(v => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1e10)) {
    throw new Error('Confira os valores informados. Use apenas numeros nao negativos.');
  }
}
export function resumirProposta({preco,desconto=0,ato=0,atoParcelado=0,fgts=0,mensal=0,quantidadeMensal=0,intercalada=0,quantidadeIntercalada=0,entrega=0,financiamento=0}) {
  const c={preco,desconto,ato,atoParcelado,fgts,mensal,quantidadeMensal,intercalada,quantidadeIntercalada,entrega,financiamento};
  exigir(c);
  if (!preco || desconto > preco || !Number.isInteger(quantidadeMensal) || !Number.isInteger(quantidadeIntercalada)) throw new Error('Preco, desconto ou quantidades invalidos.');
  const liquido=cent(preco-desconto);
  const pagamentos=cent(ato+atoParcelado+fgts+mensal*quantidadeMensal+intercalada*quantidadeIntercalada+entrega+financiamento);
  const diferenca=cent(liquido-pagamentos);
  return {liquido,pagamentos,diferenca,conferido:Math.abs(diferenca)<0.01,aviso:'Conferencia aritmetica apenas. Nao representa tabela comercial, condicoes aprovadas nem financiamento oficial.'};
}
export function saldoRecursosCaixa({valorImovel,recursos,fgts=0,subsidio=0}) {
  const c={valorImovel,recursos,fgts,subsidio}; exigir(c);
  if (!valorImovel || recursos+fgts+subsidio>valorImovel) throw new Error('Recursos superam o valor do imovel.');
  return {principal:cent(valorImovel-recursos-fgts-subsidio),aviso:'Principal estimado sem juros, seguros, taxas, elegibilidade ou aprovacao CAIXA.'};
}
