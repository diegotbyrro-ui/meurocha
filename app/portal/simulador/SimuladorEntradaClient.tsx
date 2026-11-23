'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { empreendimentos } from '@/lib/catalog.mjs';
import {
  calcularEntrada,
  comprometimento,
  cronograma,
  LIMITE_COMPROMETIMENTO,
  moedaEntrada,
  parcelaPrice,
  parcelasSac,
  planoEntrada,
  recalcular,
  rendaTotal,
} from '@/lib/simulador-entrada.mjs';

type Sistema = 'PRICE' | 'SAC';
type CampoRecalc = 'ato' | 'atoParcelado' | 'mensal' | 'intercalada' | 'entrega';
type Tentativa<T> = { ok: true; valor: T } | { ok: false; erro: string };

type Estado = {
  empreendimentoId: string;
  unidade: string;
  cliente: string;
  corretor: string;
  imobiliaria: string;
  valorUnidade: string;
  desconto: string;
  rendaFormal: string;
  rendaInformal: string;
  valorFinanciado: string;
  sistema: Sistema;
  taxaAnual: string;
  prazo: string;
  fgts: string;
  subsidio: string;
  mesAssinatura: string;
  ato: string;
  atoParceladoValor: string;
  atoParceladoQtd: string;
  mensalValor: string;
  mensalQtd: string;
  primeiraMensal: string;
  intercaladaValor: string;
  intercaladaQtd: string;
  primeiraIntercalada: string;
  entrega: string;
  mesEntrega: string;
  incc: string;
};

type PlanoInput = {
  entradaTotal: number;
  ato: number;
  atoParceladoValor: number;
  atoParceladoQtd: number;
  mensalValor: number;
  mensalQtd: number;
  intercaladaValor: number;
  intercaladaQtd: number;
  entrega: number;
};

type ParcelaBancaria =
  | { tipo: 'PRICE'; parcela: number }
  | { tipo: 'SAC'; primeira: number; ultima: number };

type LinhaMes = { mes: string; nominal: number; corrigido: number };
type AvisoRecalc = { tipo: 'ok' | 'erro'; texto: string };

const CAMPO_ESTADO: Record<CampoRecalc, keyof Estado> = {
  ato: 'ato',
  atoParcelado: 'atoParceladoValor',
  mensal: 'mensalValor',
  intercalada: 'intercaladaValor',
  entrega: 'entrega',
};

const ROTULO_RECALC: Record<CampoRecalc, string> = {
  ato: 'Ato/sinal',
  atoParcelado: 'Ato parcelado',
  mensal: 'Mensais',
  intercalada: 'Intercaladas anuais',
  entrega: 'Entrega das chaves',
};

const LINHAS_INICIAIS = 24;

const formatadorBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatadorNumero = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatadorPct = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

function brl(valor: number): string {
  return formatadorBRL.format(valor);
}

function tentar<T>(fn: () => T): Tentativa<T> {
  try {
    return { ok: true, valor: fn() };
  } catch (erro) {
    return { ok: false, erro: erro instanceof Error ? erro.message : 'Verifique os valores informados.' };
  }
}

function falha(erro: string): { ok: false; erro: string } {
  return { ok: false, erro };
}

function valorMoeda(texto: string, rotulo: string): number {
  if (texto.trim() === '') return 0;
  const valor = moedaEntrada(texto);
  if (!Number.isFinite(valor)) throw new Error(`${rotulo}: informe um valor válido, como 330.000,00.`);
  return valor;
}

function inteiro(texto: string, rotulo: string): number {
  if (texto.trim() === '') return 0;
  const n = Number(texto);
  if (!Number.isInteger(n) || n < 0) throw new Error(`${rotulo}: use um número inteiro igual ou maior que zero.`);
  return n;
}

function percentual(texto: string, rotulo: string): number {
  const limpo = texto.trim().replace(',', '.');
  const n = Number(limpo);
  if (limpo === '' || !Number.isFinite(n)) throw new Error(`${rotulo}: informe um percentual válido, como 10,5.`);
  return n;
}

function mesAtualIso(): string {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
}

function formatarMes(mes: string): string {
  const partes = mes.split('-');
  const ano = Number(partes[0]);
  const mesNum = Number(partes[1]);
  if (!Number.isInteger(ano) || !Number.isInteger(mesNum)) return mes;
  const data = new Date(ano, mesNum - 1, 1);
  const abreviado = data.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  return `${abreviado}/${ano}`;
}

function estadoInicial(empreendimentoInicial?: string): Estado {
  const id = empreendimentos.find((e) => e.id === empreendimentoInicial)?.id ?? empreendimentos[0]?.id ?? '';
  return {
    empreendimentoId: id,
    unidade: '',
    cliente: '',
    corretor: '',
    imobiliaria: '',
    valorUnidade: '',
    desconto: '',
    rendaFormal: '',
    rendaInformal: '',
    valorFinanciado: '',
    sistema: 'PRICE',
    taxaAnual: '10,5',
    prazo: '420',
    fgts: '',
    subsidio: '',
    mesAssinatura: mesAtualIso(),
    ato: '',
    atoParceladoValor: '',
    atoParceladoQtd: '0',
    mensalValor: '',
    mensalQtd: '0',
    primeiraMensal: '',
    intercaladaValor: '',
    intercaladaQtd: '0',
    primeiraIntercalada: '',
    entrega: '',
    mesEntrega: '',
    incc: '0,5',
  };
}

function montarPlano(e: Estado, entradaTotal: number): PlanoInput {
  return {
    entradaTotal,
    ato: valorMoeda(e.ato, 'Ato/sinal'),
    atoParceladoValor: valorMoeda(e.atoParceladoValor, 'Ato parcelado'),
    atoParceladoQtd: inteiro(e.atoParceladoQtd, 'Quantidade do ato parcelado'),
    mensalValor: valorMoeda(e.mensalValor, 'Mensais'),
    mensalQtd: inteiro(e.mensalQtd, 'Quantidade de mensais'),
    intercaladaValor: valorMoeda(e.intercaladaValor, 'Intercaladas anuais'),
    intercaladaQtd: inteiro(e.intercaladaQtd, 'Quantidade de intercaladas'),
    entrega: valorMoeda(e.entrega, 'Entrega das chaves'),
  };
}

function Campo({
  titulo,
  valor,
  aoMudar,
  tipo = 'text',
  placeholder,
  ajuda,
}: {
  titulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  tipo?: 'text' | 'number' | 'month';
  placeholder?: string;
  ajuda?: string;
}) {
  return (
    <label className="r82s-field">
      <span className="r82s-field-label">{titulo}</span>
      <input
        type={tipo}
        inputMode={tipo === 'text' ? 'decimal' : undefined}
        value={valor}
        placeholder={placeholder}
        min={tipo === 'number' ? 0 : undefined}
        step={tipo === 'number' ? 1 : undefined}
        onChange={(e) => aoMudar(e.target.value)}
      />
      {ajuda && <small>{ajuda}</small>}
    </label>
  );
}

function SelectCampo({
  titulo,
  valor,
  aoMudar,
  opcoes,
}: {
  titulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  opcoes: { valor: string; rotulo: string }[];
}) {
  return (
    <label className="r82s-field">
      <span className="r82s-field-label">{titulo}</span>
      <select value={valor} onChange={(e) => aoMudar(e.target.value)}>
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
    </label>
  );
}

function ComRecalc({
  campo,
  aoClicar,
  desabilitado,
  children,
}: {
  campo: CampoRecalc;
  aoClicar: (campo: CampoRecalc) => void;
  desabilitado: boolean;
  children: ReactNode;
}) {
  return (
    <div className="r82s-recalc-row">
      {children}
      <button
        type="button"
        className="r82s-recalc"
        aria-label={`Recalcular ${ROTULO_RECALC[campo]}`}
        title="Recalcular este valor pelo plano"
        onClick={() => aoClicar(campo)}
        disabled={desabilitado}
      >
        ↻
      </button>
    </div>
  );
}

function Resultado({ titulo, valor, detalhe }: { titulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="r82s-result">
      <span>{titulo}</span>
      <strong>{valor}</strong>
      {detalhe && <small>{detalhe}</small>}
    </div>
  );
}

function Secao({ numero, titulo, children }: { numero: string; titulo: string; children: ReactNode }) {
  return (
    <section className="r82s-card">
      <header className="r82s-section-head">
        <span className="r82s-badge" aria-hidden="true">
          {numero}
        </span>
        <h2>{titulo}</h2>
      </header>
      {children}
    </section>
  );
}

const OPCOES_EMPREENDIMENTO = empreendimentos.map((e) => ({ valor: e.id, rotulo: e.nome }));
const OPCOES_SISTEMA: { valor: string; rotulo: string }[] = [
  { valor: 'PRICE', rotulo: 'PRICE' },
  { valor: 'SAC', rotulo: 'SAC' },
];

export default function SimuladorEntradaClient({ empreendimentoInicial }: { empreendimentoInicial?: string }) {
  const [estado, setEstado] = useState<Estado>(() => estadoInicial(empreendimentoInicial));
  const [aviso, setAviso] = useState<AvisoRecalc | null>(null);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [dataImpressao, setDataImpressao] = useState('');

  useEffect(() => {
    setDataImpressao(new Date().toLocaleDateString('pt-BR'));
  }, []);

  const set =
    <K extends keyof Estado>(chave: K) =>
    (valor: Estado[K]) =>
      setEstado((s) => ({ ...s, [chave]: valor }));

  const empreendimento = empreendimentos.find((e) => e.id === estado.empreendimentoId);
  const nomeEmpreendimento = empreendimento ? empreendimento.nome : '';

  const valores = useMemo(
    () =>
      tentar(() => ({
        valorImovel: valorMoeda(estado.valorUnidade, 'Valor da unidade'),
        desconto: valorMoeda(estado.desconto, 'Desconto negociado'),
        financiamento: valorMoeda(estado.valorFinanciado, 'Valor financiado'),
        fgts: valorMoeda(estado.fgts, 'FGTS'),
        subsidio: valorMoeda(estado.subsidio, 'Subsídio'),
      })),
    [estado],
  );

  const entrada = useMemo(
    () => (valores.ok ? tentar(() => calcularEntrada(valores.valor)) : falha(valores.erro)),
    [valores],
  );

  const renda = useMemo(
    () =>
      tentar(() =>
        rendaTotal(valorMoeda(estado.rendaFormal, 'Renda formal'), valorMoeda(estado.rendaInformal, 'Renda informal')),
      ),
    [estado],
  );

  const parcela = useMemo(
    (): Tentativa<ParcelaBancaria> =>
      tentar(() => {
        const principal = valorMoeda(estado.valorFinanciado, 'Valor financiado');
        const taxa = percentual(estado.taxaAnual, 'Taxa de juros anual');
        const meses = inteiro(estado.prazo, 'Prazo');
        if (meses <= 0) throw new Error('Prazo: informe ao menos 1 mês.');
        if (estado.sistema === 'SAC') {
          const sac = parcelasSac(principal, taxa, meses);
          return { tipo: 'SAC' as const, primeira: sac.primeira, ultima: sac.ultima };
        }
        return { tipo: 'PRICE' as const, parcela: parcelaPrice(principal, taxa, meses) };
      }),
    [estado],
  );

  const comprometido = useMemo(() => {
    if (!parcela.ok || !renda.ok || renda.valor <= 0) return null;
    const alvo = parcela.valor.tipo === 'PRICE' ? parcela.valor.parcela : parcela.valor.primeira;
    const rendaBase = renda.valor;
    return tentar(() => comprometimento(alvo, rendaBase));
  }, [parcela, renda]);

  const plano = useMemo(() => {
    if (!entrada.ok) return falha(entrada.erro);
    const entradaTotal = entrada.valor.entradaTotal;
    return tentar(() => planoEntrada(montarPlano(estado, entradaTotal)));
  }, [estado, entrada]);

  const cronogramaRes = useMemo(
    () =>
      tentar(() => {
        const inccMensal = percentual(estado.incc, 'INCC mensal');
        if (inccMensal < 0 || inccMensal > 5) throw new Error('INCC mensal: informe um percentual entre 0 e 5.');
        const p = montarPlano(estado, 0);
        return cronograma({
          mesBase: estado.mesAssinatura,
          ato: p.ato,
          atoParceladoValor: p.atoParceladoValor,
          atoParceladoQtd: p.atoParceladoQtd,
          mensalValor: p.mensalValor,
          mensalQtd: p.mensalQtd,
          primeiraMensal: estado.primeiraMensal || undefined,
          intercaladaValor: p.intercaladaValor,
          intercaladaQtd: p.intercaladaQtd,
          primeiraIntercalada: estado.primeiraIntercalada || undefined,
          entrega: p.entrega,
          mesEntrega: estado.mesEntrega || undefined,
          inccMensal,
        });
      }),
    [estado],
  );

  const linhas: LinhaMes[] = cronogramaRes.ok ? cronogramaRes.valor.porMes : [];
  const linhasVisiveis = mostrarTodos ? linhas : linhas.slice(0, LINHAS_INICIAIS);

  function recalcarCampo(campo: CampoRecalc) {
    if (!entrada.ok) {
      setAviso({ tipo: 'erro', texto: entrada.erro });
      return;
    }
    const entradaTotal = entrada.valor.entradaTotal;
    const resultado = tentar(() => recalcular(campo, montarPlano(estado, entradaTotal)));
    if (!resultado.ok) {
      setAviso({ tipo: 'erro', texto: resultado.erro });
      return;
    }
    const res = resultado.valor;
    const chave = CAMPO_ESTADO[campo];
    setEstado((s) => ({ ...s, [chave]: formatadorNumero.format(res.valor) }));
    setAviso({ tipo: 'ok', texto: res.aviso });
  }

  function limpar() {
    setEstado(estadoInicial(empreendimentoInicial));
    setAviso(null);
    setMostrarTodos(false);
  }

  return (
    <section className="r82s" aria-label="Simulador de entrada">
      <div className="r82s-print-only r82s-print-head">
        <strong>Rocha Empreendimentos — Proposta de simulação</strong>
        <p>
          Empreendimento: <b>{nomeEmpreendimento}</b>
        </p>
        <p>
          Unidade: <b>{estado.unidade || '—'}</b>
        </p>
        <p>
          Cliente: <b>{estado.cliente || '—'}</b>
        </p>
        <p>
          Corretor: <b>{estado.corretor || '—'}</b>
        </p>
        <p>
          Data: <b>{dataImpressao}</b>
        </p>
      </div>

      <header className="r82s-head">
        <div>
          <span className="r82s-kicker">SIMULADOR DE ENTRADA</span>
          <h1>Proposta de entrada e financiamento</h1>
          <p>Monte o plano de pagamento da entrada, confira o financiamento e gere o cronograma corrigido pelo INCC.</p>
        </div>
      </header>

      <div className="r82s-layout">
        <div className="r82s-main">
          <Secao numero="01" titulo="Cliente e unidade">
            <div className="r82s-grid">
              <SelectCampo
                titulo="Empreendimento"
                valor={estado.empreendimentoId}
                aoMudar={set('empreendimentoId')}
                opcoes={OPCOES_EMPREENDIMENTO}
              />
              <Campo titulo="Unidade" valor={estado.unidade} aoMudar={set('unidade')} placeholder="Ex.: Bloco 02, apto 304" />
              <Campo titulo="Nome do cliente" valor={estado.cliente} aoMudar={set('cliente')} />
              <Campo titulo="Corretor" valor={estado.corretor} aoMudar={set('corretor')} />
              <Campo titulo="Imobiliária" valor={estado.imobiliaria} aoMudar={set('imobiliaria')} />
              <Campo titulo="Valor da unidade (R$)" valor={estado.valorUnidade} aoMudar={set('valorUnidade')} placeholder="0,00" />
              <Campo titulo="Desconto negociado (R$)" valor={estado.desconto} aoMudar={set('desconto')} placeholder="0,00" />
            </div>
          </Secao>

          <Secao numero="02" titulo="Financiamento bancário">
            <div className="r82s-grid">
              <Campo titulo="Renda formal (R$)" valor={estado.rendaFormal} aoMudar={set('rendaFormal')} placeholder="0,00" />
              <Campo titulo="Renda informal (R$)" valor={estado.rendaInformal} aoMudar={set('rendaInformal')} placeholder="0,00" />
              <Resultado
                titulo="Renda total"
                valor={renda.ok ? brl(renda.valor) : '—'}
                detalhe={renda.ok ? undefined : renda.erro}
              />
              <Campo titulo="Valor financiado (R$)" valor={estado.valorFinanciado} aoMudar={set('valorFinanciado')} placeholder="0,00" />
              <SelectCampo
                titulo="Sistema"
                valor={estado.sistema}
                aoMudar={(v) => set('sistema')(v === 'SAC' ? 'SAC' : 'PRICE')}
                opcoes={OPCOES_SISTEMA}
              />
              <Campo titulo="Taxa de juros anual (%)" valor={estado.taxaAnual} aoMudar={set('taxaAnual')} />
              <Campo titulo="Prazo (meses)" tipo="number" valor={estado.prazo} aoMudar={set('prazo')} />
              <Campo titulo="FGTS (R$)" valor={estado.fgts} aoMudar={set('fgts')} placeholder="0,00" />
              <Campo titulo="Subsídio (R$)" valor={estado.subsidio} aoMudar={set('subsidio')} placeholder="0,00" />
            </div>

            <div className="r82s-results">
              {parcela.ok && parcela.valor.tipo === 'PRICE' && (
                <Resultado titulo="Parcela estimada (PRICE)" valor={brl(parcela.valor.parcela)} />
              )}
              {parcela.ok && parcela.valor.tipo === 'SAC' && (
                <>
                  <Resultado titulo="Primeira parcela (SAC)" valor={brl(parcela.valor.primeira)} />
                  <Resultado titulo="Última parcela (SAC)" valor={brl(parcela.valor.ultima)} />
                </>
              )}
              {!parcela.ok && <Resultado titulo="Parcela estimada" valor="—" detalhe={parcela.erro} />}
              {comprometido &&
                (comprometido.ok ? (
                  <Resultado
                    titulo="Comprometimento de renda"
                    valor={`${formatadorPct.format(comprometido.valor.percentual)}%`}
                    detalhe={`Limite de ${LIMITE_COMPROMETIMENTO}% da renda`}
                  />
                ) : (
                  <Resultado titulo="Comprometimento de renda" valor="—" detalhe={comprometido.erro} />
                ))}
            </div>

            {comprometido && comprometido.ok && !comprometido.valor.dentroDoLimite && (
              <div className="r82s-alerta" role="alert">
                O comprometimento da renda passa de {LIMITE_COMPROMETIMENTO}%. Revise o valor financiado, o prazo ou a renda informada.
              </div>
            )}
            {renda.ok && renda.valor <= 0 && (
              <p className="r82s-nota-simples">Informe a renda para ver o comprometimento.</p>
            )}

            <p className="r82s-note">
              Estimativa sem seguros e tarifas. Confirme no{' '}
              <a href="https://simuladorhabitacao.caixa.gov.br/" target="_blank" rel="noopener noreferrer">
                simulador oficial da CAIXA
              </a>
              .
            </p>
          </Secao>

          <Secao numero="03" titulo="Entrada">
            <div className="r82s-destaque">
              <span>Entrada a pagar à construtora</span>
              <strong>{entrada.ok ? brl(entrada.valor.entradaTotal) : '—'}</strong>
              {entrada.ok ? (
                <small>Valor líquido após desconto: {brl(entrada.valor.valorLiquido)}</small>
              ) : (
                <small>{entrada.erro}</small>
              )}
            </div>
          </Secao>

          <Secao numero="04" titulo="Plano de pagamento da entrada">
            <div className="r82s-grid">
              <Campo titulo="Mês da assinatura" tipo="month" valor={estado.mesAssinatura} aoMudar={set('mesAssinatura')} />
              <ComRecalc campo="ato" aoClicar={recalcarCampo} desabilitado={!entrada.ok}>
                <Campo titulo="Ato/sinal (R$)" valor={estado.ato} aoMudar={set('ato')} placeholder="0,00" />
              </ComRecalc>
              <div className="r82s-vazio" aria-hidden="true" />

              <ComRecalc campo="atoParcelado" aoClicar={recalcarCampo} desabilitado={!entrada.ok}>
                <Campo
                  titulo="Ato parcelado · valor (R$)"
                  valor={estado.atoParceladoValor}
                  aoMudar={set('atoParceladoValor')}
                  placeholder="0,00"
                />
              </ComRecalc>
              <Campo titulo="Ato parcelado · quantidade" tipo="number" valor={estado.atoParceladoQtd} aoMudar={set('atoParceladoQtd')} />
              <div className="r82s-vazio" aria-hidden="true" />

              <ComRecalc campo="mensal" aoClicar={recalcarCampo} desabilitado={!entrada.ok}>
                <Campo titulo="Mensais · valor (R$)" valor={estado.mensalValor} aoMudar={set('mensalValor')} placeholder="0,00" />
              </ComRecalc>
              <Campo titulo="Mensais · quantidade" tipo="number" valor={estado.mensalQtd} aoMudar={set('mensalQtd')} />
              <Campo titulo="Mensais · primeiro mês" tipo="month" valor={estado.primeiraMensal} aoMudar={set('primeiraMensal')} />

              <ComRecalc campo="intercalada" aoClicar={recalcarCampo} desabilitado={!entrada.ok}>
                <Campo
                  titulo="Intercaladas anuais · valor (R$)"
                  valor={estado.intercaladaValor}
                  aoMudar={set('intercaladaValor')}
                  placeholder="0,00"
                />
              </ComRecalc>
              <Campo titulo="Intercaladas anuais · quantidade" tipo="number" valor={estado.intercaladaQtd} aoMudar={set('intercaladaQtd')} />
              <Campo
                titulo="Intercaladas anuais · mês da primeira"
                tipo="month"
                valor={estado.primeiraIntercalada}
                aoMudar={set('primeiraIntercalada')}
              />

              <ComRecalc campo="entrega" aoClicar={recalcarCampo} desabilitado={!entrada.ok}>
                <Campo titulo="Entrega das chaves (R$)" valor={estado.entrega} aoMudar={set('entrega')} placeholder="0,00" />
              </ComRecalc>
              <Campo titulo="Entrega das chaves · mês" tipo="month" valor={estado.mesEntrega} aoMudar={set('mesEntrega')} />
            </div>

            {aviso && (
              <p className={'r82s-aviso' + (aviso.tipo === 'erro' ? ' is-erro' : '')} role="status">
                {aviso.texto}
              </p>
            )}

            <div className="r82s-results">
              <Resultado
                titulo="Total do plano"
                valor={plano.ok ? brl(plano.valor.totalPlano) : '—'}
                detalhe={plano.ok ? undefined : plano.erro}
              />
            </div>

            {plano.ok &&
              (plano.valor.conciliado ? (
                <div className="r82s-status is-ok" role="status">
                  <span>Plano conciliado</span>
                </div>
              ) : plano.valor.diferenca > 0 ? (
                <div className="r82s-status is-falta" role="status">
                  <span>{`Faltam ${brl(plano.valor.diferenca)}`}</span>
                </div>
              ) : (
                <div className="r82s-status is-excede" role="status">
                  <span>{`Excede em ${brl(Math.abs(plano.valor.diferenca))}`}</span>
                </div>
              ))}
          </Secao>

          <Secao numero="05" titulo="Cronograma">
            <div className="r82s-grid">
              <Campo
                titulo="INCC mensal estimado (%)"
                valor={estado.incc}
                aoMudar={set('incc')}
                ajuda="Valor entre 0 e 5. Use vírgula, como 0,5."
              />
            </div>

            {cronogramaRes.ok ? (
              <>
                <div className="r82s-table-wrap">
                  <table className="r82s-table" aria-label="Cronograma de pagamentos da entrada">
                    <thead>
                      <tr>
                        <th scope="col">Mês</th>
                        <th scope="col">Nominal</th>
                        <th scope="col">Corrigido (INCC)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linhasVisiveis.map((linha, i) => (
                        <tr key={`${linha.mes}-${i}`}>
                          <td>{formatarMes(linha.mes)}</td>
                          <td>{brl(linha.nominal)}</td>
                          <td>{brl(linha.corrigido)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td>Total</td>
                        <td>{brl(cronogramaRes.valor.totalNominal)}</td>
                        <td>{brl(cronogramaRes.valor.totalCorrigido)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {linhas.length > LINHAS_INICIAIS && (
                  <button
                    type="button"
                    className="r82s-btn-sec r82s-toggle"
                    aria-expanded={mostrarTodos}
                    onClick={() => setMostrarTodos((v) => !v)}
                  >
                    {mostrarTodos ? `Mostrar primeiras ${LINHAS_INICIAIS}` : 'Mostrar todos'}
                  </button>
                )}
              </>
            ) : (
              <p className="r82s-alerta" role="alert">
                {cronogramaRes.erro}
              </p>
            )}
          </Secao>
        </div>

        <aside className="r82s-summary" aria-label="Resumo da simulação">
          <h2 className="r82s-summary-title">Resumo</h2>
          <dl className="r82s-dl">
            <div>
              <dt>Valor da unidade</dt>
              <dd>{valores.ok ? brl(valores.valor.valorImovel) : '—'}</dd>
            </div>
            <div>
              <dt>Desconto</dt>
              <dd>{valores.ok ? brl(valores.valor.desconto) : '—'}</dd>
            </div>
            <div>
              <dt>Valor líquido</dt>
              <dd>{entrada.ok ? brl(entrada.valor.valorLiquido) : '—'}</dd>
            </div>
            <div>
              <dt>Financiamento</dt>
              <dd>{valores.ok ? brl(valores.valor.financiamento) : '—'}</dd>
            </div>
            <div>
              <dt>FGTS + subsídio</dt>
              <dd>{valores.ok ? brl(valores.valor.fgts + valores.valor.subsidio) : '—'}</dd>
            </div>
            <div>
              <dt>Entrada</dt>
              <dd>{entrada.ok ? brl(entrada.valor.entradaTotal) : '—'}</dd>
            </div>
            <div>
              <dt>Total do plano</dt>
              <dd>{plano.ok ? brl(plano.valor.totalPlano) : '—'}</dd>
            </div>
            <div>
              <dt>Diferença</dt>
              <dd>{plano.ok ? brl(plano.valor.diferenca) : '—'}</dd>
            </div>
            <div>
              <dt>Parcela bancária estimada</dt>
              <dd>
                {parcela.ok
                  ? parcela.valor.tipo === 'PRICE'
                    ? brl(parcela.valor.parcela)
                    : `1ª: ${brl(parcela.valor.primeira)} · última: ${brl(parcela.valor.ultima)}`
                  : '—'}
              </dd>
            </div>
          </dl>
          <div className="r82s-actions">
            <button type="button" className="r82s-btn" onClick={() => window.print()}>
              Imprimir proposta
            </button>
            <button type="button" className="r82s-btn-sec" onClick={limpar}>
              Limpar
            </button>
          </div>
        </aside>
      </div>

      <p className="r82s-print-only r82s-print-foot">
        Simulação sem valor de proposta oficial. Valores sujeitos à tabela vigente, análise de crédito e aprovação da Rocha.
      </p>
    </section>
  );
}
