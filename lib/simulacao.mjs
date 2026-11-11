// Modelo DIDATICO, sem juros, taxas, politica de credito ou precos comerciais.
// O valor de entrada e digitado pelo operador e nao consulta qualquer base real.
export function calcularRascunho({ preco, percentualEntrada, desconto=0 }) {
  if (![preco, percentualEntrada, desconto].every(x=>typeof x==='number' && Number.isFinite(x))) {
    throw new Error('Valores numericos invalidos');
  }
  if (preco <= 0 || preco > 100000000 || percentualEntrada < 0 || percentualEntrada > 100 || desconto < 0 || desconto >= preco) {
    throw new Error('Valores fora dos limites permitidos');
  }
  const precoLiquido = Math.round((preco - desconto)*100)/100;
  const entrada = Math.round(precoLiquido*(percentualEntrada/100)*100)/100;
  const saldo = Math.round((precoLiquido-entrada)*100)/100;
  return { precoLiquido, entrada, saldo, aviso: 'Exercicio demonstrativo. Nao e proposta, financiamento nem tabela oficial.' };
}
