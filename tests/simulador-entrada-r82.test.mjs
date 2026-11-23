import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as s from '../lib/simulador-entrada.mjs';

const fonte = readFileSync(fileURLToPath(new URL('../lib/simulador-entrada.mjs', import.meta.url)), 'utf8');

describe('exports e reexport', () => {
  it('expoe exatamente os simbolos previstos', () => {
    assert.deepEqual(Object.keys(s).sort(), [
      'LIMITE_COMPROMETIMENTO',
      'addMeses',
      'calcularEntrada',
      'cent',
      'comprometimento',
      'cronograma',
      'mesesEntre',
      'moedaEntrada',
      'parcelaPrice',
      'parcelasSac',
      'planoEntrada',
      'recalcular',
      'rendaTotal',
      'taxaMensal',
    ]);
  });

  it('reexporta moedaEntrada do calculo preliminar R6', () => {
    assert.equal(s.moedaEntrada('330.000,50'), 330000.5);
    assert.equal(s.moedaEntrada(''), 0);
    assert.ok(Number.isNaN(s.moedaEntrada('abc')));
  });

  it('cent arredonda para centavos e LIMITE_COMPROMETIMENTO vale 30', () => {
    assert.equal(s.cent(0.1 + 0.2), 0.3);
    assert.equal(s.cent(1234.5678), 1234.57);
    assert.equal(s.LIMITE_COMPROMETIMENTO, 30);
  });
});

describe('rendaTotal', () => {
  it('soma renda formal e informal', () => {
    assert.equal(s.rendaTotal(4000, 1500.5), 5500.5);
    assert.equal(s.rendaTotal(0, 0), 0);
  });

  it('lanca erro para renda negativa ou nao finita', () => {
    assert.throws(() => s.rendaTotal(-1, 0), { message: 'Informe rendas válidas.' });
    assert.throws(() => s.rendaTotal(1000, -0.01), { message: 'Informe rendas válidas.' });
    assert.throws(() => s.rendaTotal(NaN, 100), { message: 'Informe rendas válidas.' });
    assert.throws(() => s.rendaTotal(Infinity, 100), { message: 'Informe rendas válidas.' });
  });
});

describe('calcularEntrada', () => {
  it('calcula valor liquido e entrada total do exemplo', () => {
    const r = s.calcularEntrada({ valorImovel: 300000, desconto: 10000, financiamento: 200000, fgts: 20000, subsidio: 5000 });
    assert.deepEqual(r, { valorLiquido: 290000, entradaTotal: 65000 });
  });

  it('usa zero como padrao para desconto, financiamento, fgts e subsidio', () => {
    assert.deepEqual(s.calcularEntrada({ valorImovel: 100000 }), { valorLiquido: 100000, entradaTotal: 100000 });
  });

  it('lanca erro para valores negativos ou nao finitos', () => {
    assert.throws(() => s.calcularEntrada({ valorImovel: 100000, fgts: -1 }));
    assert.throws(() => s.calcularEntrada({ valorImovel: NaN }));
  });

  it('lanca erro para valor do imovel zero', () => {
    assert.throws(() => s.calcularEntrada({ valorImovel: 0 }), { message: 'O valor do imóvel deve ser maior que zero.' });
  });

  it('lanca erro quando o desconto supera o valor do imovel', () => {
    assert.throws(() => s.calcularEntrada({ valorImovel: 100000, desconto: 100001 }), {
      message: 'O desconto não pode ser maior que o valor do imóvel.',
    });
  });

  it('lanca erro quando financiamento, FGTS e subsidio superam a unidade', () => {
    assert.throws(() => s.calcularEntrada({ valorImovel: 100000, financiamento: 90000, fgts: 15000 }), {
      message: 'Financiamento, FGTS e subsídio superam o valor da unidade.',
    });
  });
});

describe('planoEntrada', () => {
  it('soma os componentes e aponta diferenca positiva quando falta valor', () => {
    const r = s.planoEntrada({ entradaTotal: 65000, ato: 5000, mensalValor: 1000, mensalQtd: 36, entrega: 10000 });
    assert.equal(r.totalAto, 5000);
    assert.equal(r.totalAtoParcelado, 0);
    assert.equal(r.totalMensais, 36000);
    assert.equal(r.totalIntercaladas, 0);
    assert.equal(r.totalEntrega, 10000);
    assert.equal(r.totalPlano, 51000);
    assert.equal(r.diferenca, 14000);
    assert.equal(r.conciliado, false);
  });

  it('aponta diferenca negativa quando o plano excede a entrada', () => {
    const r = s.planoEntrada({
      entradaTotal: 65000,
      ato: 5000,
      atoParceladoValor: 1000,
      atoParceladoQtd: 4,
      mensalValor: 972.22,
      mensalQtd: 36,
      intercaladaValor: 5000,
      intercaladaQtd: 3,
      entrega: 10000,
    });
    assert.equal(r.totalAtoParcelado, 4000);
    assert.equal(r.totalMensais, 34999.92);
    assert.equal(r.totalIntercaladas, 15000);
    assert.equal(r.totalPlano, 68999.92);
    assert.equal(r.diferenca, -3999.92);
    assert.equal(r.conciliado, false);
  });

  it('concilia quando o plano fecha a entrada exatamente', () => {
    const r = s.planoEntrada({
      entradaTotal: 65000,
      ato: 5000,
      mensalValor: 1000,
      mensalQtd: 36,
      intercaladaValor: 4000,
      intercaladaQtd: 3,
      entrega: 12000,
    });
    assert.equal(r.totalPlano, 65000);
    assert.equal(r.diferenca, 0);
    assert.equal(r.conciliado, true);
  });

  it('lanca erro para quantidade fracionaria, negativa ou acima de 480', () => {
    assert.throws(() => s.planoEntrada({ mensalValor: 100, mensalQtd: 1.5 }));
    assert.throws(() => s.planoEntrada({ intercaladaValor: 100, intercaladaQtd: -1 }));
    assert.throws(() => s.planoEntrada({ atoParceladoValor: 100, atoParceladoQtd: 481 }));
  });
});

describe('recalcular', () => {
  const dados = {
    entradaTotal: 65000,
    ato: 5000,
    mensalQtd: 36,
    intercaladaValor: 5000,
    intercaladaQtd: 3,
    entrega: 10000,
  };

  it('recalcula parcela mensal: restante 35000 em 36 parcelas gera 972,22 com aviso de residuo', () => {
    const r = s.recalcular('mensal', dados);
    assert.equal(r.valor, 972.22);
    assert.match(r.aviso, /^Resíduo de R\$\s0,08 por arredondamento — ajuste no ato\.$/);
  });

  it('recalcula ato com o restante exato, sem aviso', () => {
    // Os demais componentes somam 25000 (intercaladas 15000 + entrega 10000).
    assert.deepEqual(s.recalcular('ato', dados), { valor: 40000, aviso: '' });
  });

  it('recalcula entrega com o restante exato, sem aviso', () => {
    // Os demais componentes somam 20000 (ato 5000 + intercaladas 15000).
    assert.deepEqual(s.recalcular('entrega', dados), { valor: 45000, aviso: '' });
  });

  it('recalcula intercalada sem residuo', () => {
    const r = s.recalcular('intercalada', {
      entradaTotal: 65000,
      ato: 5000,
      mensalValor: 1000,
      mensalQtd: 36,
      intercaladaQtd: 3,
    });
    assert.deepEqual(r, { valor: 8000, aviso: '' });
  });

  it('recalcula ato parcelado sem residuo', () => {
    const r = s.recalcular('atoParcelado', { entradaTotal: 65000, ato: 5000, atoParceladoQtd: 4 });
    assert.deepEqual(r, { valor: 15000, aviso: '' });
  });

  it('informa residuo de R$ 0,01 em 100 dividido por 3', () => {
    const r = s.recalcular('mensal', { entradaTotal: 100, mensalQtd: 3 });
    assert.equal(r.valor, 33.33);
    assert.match(r.aviso, /^Resíduo de R\$\s0,01 por arredondamento/);
  });

  it('retorna zero quando os demais pagamentos ja cobrem a entrada', () => {
    const r = s.recalcular('ato', { entradaTotal: 10000, mensalValor: 1000, mensalQtd: 12 });
    assert.deepEqual(r, { valor: 0, aviso: 'Os demais pagamentos já cobrem a entrada.' });
  });

  it('pede a quantidade de parcelas quando ela e zero', () => {
    const r = s.recalcular('atoParcelado', { entradaTotal: 65000, ato: 5000, atoParceladoValor: 1000 });
    assert.deepEqual(r, { valor: 0, aviso: 'Informe a quantidade de parcelas antes de recalcular.' });
  });

  it('lanca erro para campo desconhecido', () => {
    assert.throws(() => s.recalcular('desconhecido', dados));
  });
});

describe('addMeses e mesesEntre', () => {
  it('soma meses ao formato AAAA-MM com virada de ano', () => {
    assert.equal(s.addMeses('2026-11', 3), '2027-02');
    assert.equal(s.addMeses('2026-12', 1), '2027-01');
    assert.equal(s.addMeses('2026-11', 0), '2026-11');
    assert.equal(s.addMeses('2026-11', -11), '2025-12');
  });

  it('calcula a diferenca em meses', () => {
    assert.equal(s.mesesEntre('2026-11', '2027-02'), 3);
    assert.equal(s.mesesEntre('2027-02', '2026-11'), -3);
    assert.equal(s.mesesEntre('2026-01', '2027-01'), 12);
  });

  it('lanca erro para mes invalido', () => {
    assert.throws(() => s.addMeses('2026-1', 1));
    assert.throws(() => s.addMeses('2026-00', 1));
    assert.throws(() => s.addMeses('2026-13', 1));
    assert.throws(() => s.addMeses('abc', 1));
    assert.throws(() => s.mesesEntre('2026-13', '2026-11'));
  });
});

describe('cronograma', () => {
  const r = s.cronograma({
    mesBase: '2026-11',
    ato: 10000,
    mensalValor: 1000,
    mensalQtd: 3,
    intercaladaValor: 5000,
    intercaladaQtd: 3,
    entrega: 20000,
    inccMensal: 0.5,
  });

  it('usa os meses padrao: mensal a partir de +1, intercalada a partir de +12, entrega em +36', () => {
    assert.deepEqual(r.itens.map(i => i.mes), [
      '2026-11',
      '2026-12',
      '2027-01',
      '2027-02',
      '2027-11',
      '2028-11',
      '2029-11',
      '2029-11',
    ]);
    assert.equal(r.itens[0].descricao, 'Ato / sinal');
    assert.equal(r.itens[1].descricao, 'Mensal 1/3');
    assert.equal(r.itens[4].descricao, 'Intercalada anual 1/3');
    assert.equal(r.itens[6].descricao, 'Intercalada anual 3/3');
    assert.equal(r.itens[7].descricao, 'Parcela de entrega (chaves)');
  });

  it('corrige por INCC mensal composto: item 12 meses depois vale nominal x 1,005^12', () => {
    // 1,005^12 = 1,0616778...; 5000 x 1,0616778 = 5308,39
    assert.equal(r.itens[4].nominal, 5000);
    assert.equal(r.itens[4].corrigido, 5308.39);
    // 1,005^36 = 1,19668...; 20000 x 1,19668 = 23933,61
    assert.equal(r.itens[7].corrigido, 23933.61);
  });

  it('espaca as intercaladas em exatamente 12 meses', () => {
    const datas = r.itens.filter(i => i.descricao.startsWith('Intercalada')).map(i => i.mes);
    assert.equal(datas.length, 3);
    assert.equal(s.mesesEntre(datas[0], datas[1]), 12);
    assert.equal(s.mesesEntre(datas[1], datas[2]), 12);
  });

  it('totaliza nominal e corrigido e agrega por mes', () => {
    assert.equal(r.totalNominal, 48000);
    assert.equal(r.totalCorrigido, 53891.3);
    assert.deepEqual(r.porMes[0], { mes: '2026-11', nominal: 10000, corrigido: 10000 });
    assert.deepEqual(r.porMes[r.porMes.length - 1], { mes: '2029-11', nominal: 25000, corrigido: 29917.01 });
    assert.equal(r.porMes.length, 7);
  });

  it('respeita primeiraMensal informada e inccMensal zero', () => {
    const c = s.cronograma({ mesBase: '2026-11', mensalValor: 1000, mensalQtd: 2, primeiraMensal: '2027-06' });
    assert.deepEqual(c.itens.map(i => i.mes), ['2027-06', '2027-07']);
    assert.deepEqual(c.itens.map(i => i.corrigido), [1000, 1000]);
  });

  it('gera ato parcelado nos meses seguintes ao mesBase', () => {
    const c = s.cronograma({ mesBase: '2026-11', atoParceladoValor: 500, atoParceladoQtd: 2 });
    assert.deepEqual(c.itens.map(i => [i.mes, i.descricao]), [
      ['2026-12', 'Ato parcelado 1/2'],
      ['2027-01', 'Ato parcelado 2/2'],
    ]);
  });

  it('ignora componentes com valor zero', () => {
    const c = s.cronograma({ mesBase: '2026-11', mensalValor: 0, mensalQtd: 5 });
    assert.deepEqual(c.itens, []);
    assert.deepEqual(c.porMes, []);
    assert.equal(c.totalNominal, 0);
    assert.equal(c.totalCorrigido, 0);
  });

  it('lanca erro para INCC fora de 0 a 5 e para mes invalido', () => {
    assert.throws(() => s.cronograma({ mesBase: '2026-11', inccMensal: 6 }));
    assert.throws(() => s.cronograma({ mesBase: '2026-11', inccMensal: -1 }));
    assert.throws(() => s.cronograma({ mesBase: '2026-13' }));
  });
});

describe('taxaMensal, parcelaPrice e parcelasSac', () => {
  it('taxaMensal converte taxa anual efetiva em mensal', () => {
    assert.equal(s.taxaMensal(0), 0);
    assert.ok(Math.abs(s.taxaMensal(12) - 0.009488792934583) < 1e-12);
  });

  it('parcelaPrice com taxa zero divide o principal pelos meses', () => {
    assert.equal(s.parcelaPrice(200000, 0, 100), 2000);
  });

  it('parcelaPrice com taxa positiva segue a formula da Price', () => {
    assert.equal(s.parcelaPrice(100000, 12, 360), 981.64);
    assert.equal(s.parcelaPrice(0, 10, 12), 0);
  });

  it('parcelaPrice lanca erro para entradas invalidas', () => {
    assert.throws(() => s.parcelaPrice(-1, 10, 12));
    assert.throws(() => s.parcelaPrice(NaN, 10, 12));
    assert.throws(() => s.parcelaPrice(100000, 10, 0));
    assert.throws(() => s.parcelaPrice(100000, 10, 421));
    assert.throws(() => s.parcelaPrice(100000, 10, 1.5));
    assert.throws(() => s.parcelaPrice(100000, 31, 12));
    assert.throws(() => s.parcelaPrice(100000, -1, 12));
  });

  it('parcelasSac com taxa zero tem primeira igual a ultima', () => {
    assert.deepEqual(s.parcelasSac(120000, 0, 12), { primeira: 10000, ultima: 10000 });
  });

  it('parcelasSac com taxa positiva: primeira com juros sobre o saldo total, ultima sobre a amortizacao', () => {
    assert.deepEqual(s.parcelasSac(120000, 12, 12), { primeira: 11138.66, ultima: 10094.89 });
  });

  it('parcelasSac lanca erro para prazo invalido', () => {
    assert.throws(() => s.parcelasSac(120000, 12, 0));
    assert.throws(() => s.parcelasSac(120000, 12, 421));
  });
});

describe('comprometimento', () => {
  it('calcula o percentual da renda e compara com o limite de 30%', () => {
    assert.deepEqual(s.comprometimento(3000, 10000), { percentual: 30, dentroDoLimite: true });
    assert.deepEqual(s.comprometimento(3100, 10000), { percentual: 31, dentroDoLimite: false });
  });

  it('retorna NaN e fora do limite quando a renda nao e positiva', () => {
    const zero = s.comprometimento(1000, 0);
    assert.ok(Number.isNaN(zero.percentual));
    assert.equal(zero.dentroDoLimite, false);
    const negativa = s.comprometimento(1000, -5);
    assert.ok(Number.isNaN(negativa.percentual));
    assert.equal(negativa.dentroDoLimite, false);
  });
});

describe('seguranca do modulo', () => {
  it('nao usa fetch nem acessa document', () => {
    assert.equal(fonte.includes('fetch('), false);
    assert.equal(fonte.includes('document.'), false);
  });
});
