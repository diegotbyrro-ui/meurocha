'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
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
import AjudaPagina from '../ajuda/AjudaPagina';
import Termo from '../ajuda/Termo';

type Sistema = 'PRICE' | 'SAC';
type CampoRecalc = 'ato' | 'atoParcelado' | 'mensal' | 'intercalada' | 'entrega';
type Tentativa<T> = { ok: true; valor: T } | { ok: false; erro: string };
type Passo = 1 | 2 | 3 | 4;
type Tom = 'ok' | 'warn' | 'err';

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

const PASSOS_NOME = ['Unidade e cliente', 'Financiamento', 'Plano da entrada', 'Revisar e imprimir'] as const;

const PASSOS_AJUDA = [
  'Preencha a unidade e o cliente. Só o valor da unidade é obrigatório para continuar.',
  'Informe a renda e o financiamento. A parcela e o comprometimento da renda aparecem na hora.',
  'Divida a entrada em ato, parcelas e entrega. A caixa de status mostra se o plano fecha.',
  'Confira os dados e clique em Imprimir proposta. Use Editar para voltar a qualquer bloco.',
] as const;

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

function mesCorrenteIso(): string {
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
    mesAssinatura: mesCorrenteIso(),
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
  titulo: ReactNode;
  valor: string;
  aoMudar: (v: string) => void;
  tipo?: 'text' | 'number' | 'month';
  placeholder?: string;
  ajuda?: ReactNode;
}) {
  const base = useId();
  const idRotulo = `${base}-rotulo`;
  const idAjuda = `${base}-ajuda`;
  return (
    <div className="r82s-field">
      <span className="r82s-field-label" id={idRotulo}>
        {titulo}
      </span>
      <input
        type={tipo}
        aria-labelledby={idRotulo}
        aria-describedby={ajuda ? idAjuda : undefined}
        inputMode={tipo === 'text' ? 'decimal' : undefined}
        value={valor}
        placeholder={placeholder}
        min={tipo === 'number' ? 0 : undefined}
        step={tipo === 'number' ? 1 : undefined}
        onChange={(e) => aoMudar(e.target.value)}
      />
      {ajuda && (
        <p className="r82s-help" id={idAjuda}>
          {ajuda}
        </p>
      )}
    </div>
  );
}

function SelectCampo({
  titulo,
  valor,
  aoMudar,
  opcoes,
  ajuda,
}: {
  titulo: ReactNode;
  valor: string;
  aoMudar: (v: string) => void;
  opcoes: { valor: string; rotulo: string }[];
  ajuda?: ReactNode;
}) {
  const base = useId();
  const idRotulo = `${base}-rotulo`;
  const idAjuda = `${base}-ajuda`;
  return (
    <div className="r82s-field">
      <span className="r82s-field-label" id={idRotulo}>
        {titulo}
      </span>
      <select
        aria-labelledby={idRotulo}
        aria-describedby={ajuda ? idAjuda : undefined}
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
      >
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
      {ajuda && (
        <p className="r82s-help" id={idAjuda}>
          {ajuda}
        </p>
      )}
    </div>
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
        aria-label={`Calcular o que falta em ${ROTULO_RECALC[campo]}`}
        title="Recalcular este valor pelo plano"
        onClick={() => aoClicar(campo)}
        disabled={desabilitado}
      >
        <span aria-hidden="true">↻ </span>
        Calcular o que falta
      </button>
    </div>
  );
}

function Resultado({ titulo, valor, detalhe }: { titulo: ReactNode; valor: string; detalhe?: string }) {
  return (
    <div className="r82s-result">
      <span>{titulo}</span>
      <strong>{valor}</strong>
      {detalhe && <small>{detalhe}</small>}
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: ReactNode; valor: ReactNode }) {
  return (
    <div>
      <dt>{rotulo}</dt>
      <dd>{valor}</dd>
    </div>
  );
}

const OPCOES_EMPREENDIMENTO = empreendimentos.map((e) => ({ valor: e.id, rotulo: e.nome }));
const OPCOES_SISTEMA: { valor: string; rotulo: string }[] = [
  { valor: 'PRICE', rotulo: 'PRICE' },
  { valor: 'SAC', rotulo: 'SAC' },
];

export default function SimuladorEntradaClient({ empreendimentoInicial }: { empreendimentoInicial?: string }) {
  const [estado, setEstado] = useState<Estado>(() => estadoInicial(empreendimentoInicial));
  const [passo, setPasso] = useState<Passo>(1);
  const [aviso, setAviso] = useState<AvisoRecalc | null>(null);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const [dataImpressao, setDataImpressao] = useState('');
  const progressoRef = useRef<HTMLParagraphElement>(null);
  const idMensagem = useId();
  const idTitulo = useId();

  useEffect(() => {
    setDataImpressao(new Date().toLocaleDateString('pt-BR'));
  }, []);

  const set =
    <K extends keyof Estado>(chave: K) =>
    (valor: Estado[K]) =>
      setEstado((s) => ({ ...s, [chave]: valor }));

  const empreendimento = empreendimentos.find((e) => e.id === estado.empreendimentoId);
  const nomeEmpreendimento = empreendimento ? empreendimento.nome : '';

  const unidade = useMemo(
    () => tentar(() => valorMoeda(estado.valorUnidade, 'Valor da unidade')),
    [estado.valorUnidade],
  );
  const unidadeOk = unidade.ok && unidade.valor > 0;
  const mensagemUnidade = !unidade.ok
    ? unidade.erro
    : unidade.valor > 0
      ? ''
      : estado.valorUnidade.trim() === ''
        ? 'Falta informar o valor da unidade para continuar.'
        : 'O valor da unidade precisa ser maior que zero.';

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
  const limitarLinhas = passo !== 4 && !mostrarTodos;
  const linhasVisiveis = limitarLinhas ? linhas.slice(0, LINHAS_INICIAIS) : linhas;

  // Status ao vivo do plano da entrada (passo 3). Sempre com texto, nunca só cor.
  let tomPlano: Tom = 'err';
  let textoPlano = '';
  if (!entrada.ok) {
    textoPlano = entrada.erro;
  } else if (!plano.ok) {
    textoPlano = plano.erro;
  } else if (plano.valor.conciliado) {
    tomPlano = 'ok';
    textoPlano = 'Tudo certo: o plano fecha a entrada';
  } else if (plano.valor.diferenca > 0) {
    tomPlano = 'warn';
    textoPlano = `Faltam ${brl(plano.valor.diferenca)} — use “Calcular o que falta” em um dos campos`;
  } else {
    textoPlano = `Passou ${brl(Math.abs(plano.valor.diferenca))} do valor da entrada`;
  }

  function irPara(destino: Passo) {
    setPasso(destino > 1 && !unidadeOk ? 1 : destino);
    progressoRef.current?.scrollIntoView({ block: 'start' });
  }

  const proximo: Passo | null = passo < 4 ? ((passo + 1) as Passo) : null;
  const anterior: Passo | null = passo > 1 ? ((passo - 1) as Passo) : null;

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
    setPasso(1);
    progressoRef.current?.scrollIntoView({ block: 'start' });
  }

  function blocoCronograma(modo: 'editar' | 'revisar') {
    const editar = modo === 'editar';
    return (
      <details className="r82s-details" open={!editar}>
        <summary>Ver mês a mês (cronograma)</summary>
        <div className="r82s-details-corpo">
          {editar ? (
            <Campo
              titulo={
                <>
                  INCC mensal estimado (%) <Termo id="incc" />
                </>
              }
              valor={estado.incc}
              aoMudar={set('incc')}
              ajuda="Índice mensal estimado, entre 0 e 5. Use vírgula, como 0,5."
            />
          ) : (
            <p className="r82s-help">{`INCC mensal estimado: ${estado.incc}%`}</p>
          )}
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
              {editar && linhas.length > LINHAS_INICIAIS && (
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
        </div>
      </details>
    );
  }

  function renderPasso1() {
    return (
      <>
        <div className="r82s-grid">
          <SelectCampo
            titulo="Empreendimento"
            valor={estado.empreendimentoId}
            aoMudar={set('empreendimentoId')}
            opcoes={OPCOES_EMPREENDIMENTO}
            ajuda="Escolha o empreendimento da proposta."
          />
          <Campo
            titulo="Unidade"
            valor={estado.unidade}
            aoMudar={set('unidade')}
            placeholder="Ex.: Bloco 02, apto 304"
            ajuda="Bloco, andar e número, como aparecem na tabela."
          />
          <Campo
            titulo="Nome do cliente"
            valor={estado.cliente}
            aoMudar={set('cliente')}
            ajuda="Nome completo de quem vai comprar."
          />
          <Campo
            titulo="Corretor"
            valor={estado.corretor}
            aoMudar={set('corretor')}
            ajuda="Quem atende o cliente nesta simulação."
          />
          <Campo
            titulo="Imobiliária"
            valor={estado.imobiliaria}
            aoMudar={set('imobiliaria')}
            ajuda="Imobiliária responsável pela venda, se houver."
          />
          <Campo
            titulo="Valor da unidade (R$)"
            valor={estado.valorUnidade}
            aoMudar={set('valorUnidade')}
            placeholder="0,00"
            ajuda="Valor de tabela, sem desconto. Obrigatório."
          />
          <Campo
            titulo={
              <>
                Desconto negociado (R$) <Termo id="desconto" />
              </>
            }
            valor={estado.desconto}
            aoMudar={set('desconto')}
            placeholder="0,00"
            ajuda="Quanto foi abatido do valor de tabela. Use 0 se não houve."
          />
        </div>
        {!unidadeOk && (
          <p className="r82s-erro-campo" id={idMensagem}>
            {mensagemUnidade}
          </p>
        )}
      </>
    );
  }

  function renderPasso2() {
    return (
      <>
        <div className="r82s-grid">
          <Campo
            titulo="Renda formal (R$)"
            valor={estado.rendaFormal}
            aoMudar={set('rendaFormal')}
            placeholder="0,00"
            ajuda="Salário registrado em carteira, por mês."
          />
          <Campo
            titulo="Renda informal (R$)"
            valor={estado.rendaInformal}
            aoMudar={set('rendaInformal')}
            placeholder="0,00"
            ajuda="Outras rendas comprovadas, por mês. Use 0 se não houver."
          />
          <Resultado titulo="Renda total" valor={renda.ok ? brl(renda.valor) : '—'} detalhe={renda.ok ? undefined : renda.erro} />
          <Campo
            titulo="Valor financiado (R$)"
            valor={estado.valorFinanciado}
            aoMudar={set('valorFinanciado')}
            placeholder="0,00"
            ajuda={
              <>
                Não passa da <Termo id="avaliacao">avaliação</Termo> do imóvel feita pelo banco.
              </>
            }
          />
          <SelectCampo
            titulo={
              <>
                Sistema (<Termo id="price">PRICE</Termo> ou <Termo id="sac">SAC</Termo>)
              </>
            }
            valor={estado.sistema}
            aoMudar={(v) => set('sistema')(v === 'SAC' ? 'SAC' : 'PRICE')}
            opcoes={OPCOES_SISTEMA}
            ajuda="PRICE: parcelas iguais. SAC: parcelas que diminuem com o tempo."
          />
          <Campo
            titulo="Taxa de juros anual (%)"
            valor={estado.taxaAnual}
            aoMudar={set('taxaAnual')}
            ajuda="Taxa anual cobrada pelo banco. Use vírgula, como 10,5."
          />
          <Campo
            titulo="Prazo (meses)"
            tipo="number"
            valor={estado.prazo}
            aoMudar={set('prazo')}
            ajuda="Quantos meses o banco vai financiar. Ex.: 420."
          />
          <Campo
            titulo={
              <>
                FGTS (R$) <Termo id="fgts" />
              </>
            }
            valor={estado.fgts}
            aoMudar={set('fgts')}
            placeholder="0,00"
            ajuda="Saldo do FGTS usado na compra. Use 0 se não usar."
          />
          <Campo
            titulo={
              <>
                Subsídio (R$) <Termo id="subsidio" />
              </>
            }
            valor={estado.subsidio}
            aoMudar={set('subsidio')}
            placeholder="0,00"
            ajuda="Desconto do programa habitacional, se a unidade tiver. Use 0 se não houver."
          />
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
                titulo={
                  <>
                    Comprometimento de renda <Termo id="comprometimento" />
                  </>
                }
                valor={`${formatadorPct.format(comprometido.valor.percentual)}%`}
                detalhe={`Limite de ${LIMITE_COMPROMETIMENTO}% da renda`}
              />
            ) : (
              <Resultado titulo="Comprometimento de renda" valor="—" detalhe={comprometido.erro} />
            ))}
        </div>

        {comprometido && comprometido.ok && !comprometido.valor.dentroDoLimite && (
          <p className="r82s-alerta" role="alert">
            {`O comprometimento da renda passa de ${LIMITE_COMPROMETIMENTO}%. Revise o valor financiado, o prazo ou a renda informada.`}
          </p>
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
      </>
    );
  }

  function renderPasso3() {
    return (
      <>
        <div className="r82s-destaque">
          <span>
            Entrada a pagar à construtora <Termo id="entrada" />
          </span>
          <strong>{entrada.ok ? brl(entrada.valor.entradaTotal) : '—'}</strong>
          {entrada.ok ? (
            <small>{`Valor líquido após desconto: ${brl(entrada.valor.valorLiquido)}`}</small>
          ) : (
            <small>{entrada.erro}</small>
          )}
        </div>

        <div className={`r82s-status is-${tomPlano}`} role="status" aria-live="polite">
          <p className="r82s-status-linha">
            {`Entrada: ${entrada.ok ? brl(entrada.valor.entradaTotal) : '—'} · No plano: ${plano.ok ? brl(plano.valor.totalPlano) : '—'}`}
          </p>
          <p className="r82s-status-estado">{textoPlano}</p>
        </div>

        <div className="r82s-grid">
          <Campo
            titulo="Mês da assinatura"
            tipo="month"
            valor={estado.mesAssinatura}
            aoMudar={set('mesAssinatura')}
            ajuda="Mês em que o cliente assina o contrato."
          />
          <ComRecalc campo="ato" aoClicar={recalcarCampo} desabilitado={!entrada.ok}>
            <Campo
              titulo={
                <>
                  Ato/sinal (R$) <Termo id="ato" />
                </>
              }
              valor={estado.ato}
              aoMudar={set('ato')}
              placeholder="0,00"
              ajuda="Pago na assinatura."
            />
          </ComRecalc>
          <ComRecalc campo="atoParcelado" aoClicar={recalcarCampo} desabilitado={!entrada.ok}>
            <Campo
              titulo={
                <>
                  Ato parcelado · valor (R$) <Termo id="ato-parcelado" />
                </>
              }
              valor={estado.atoParceladoValor}
              aoMudar={set('atoParceladoValor')}
              placeholder="0,00"
              ajuda="Valor de cada parcela do ato."
            />
          </ComRecalc>
          <Campo
            titulo="Ato parcelado · quantidade"
            tipo="number"
            valor={estado.atoParceladoQtd}
            aoMudar={set('atoParceladoQtd')}
            ajuda="Quantas parcelas do ato."
          />
          <ComRecalc campo="mensal" aoClicar={recalcarCampo} desabilitado={!entrada.ok}>
            <Campo
              titulo={
                <>
                  Mensais · valor (R$) <Termo id="mensais" />
                </>
              }
              valor={estado.mensalValor}
              aoMudar={set('mensalValor')}
              placeholder="0,00"
              ajuda="Valor de cada parcela mensal da entrada."
            />
          </ComRecalc>
          <Campo
            titulo="Mensais · quantidade"
            tipo="number"
            valor={estado.mensalQtd}
            aoMudar={set('mensalQtd')}
            ajuda="Quantas parcelas mensais."
          />
          <Campo
            titulo="Mensais · primeiro mês"
            tipo="month"
            valor={estado.primeiraMensal}
            aoMudar={set('primeiraMensal')}
            ajuda="Mês da primeira parcela mensal."
          />
          <ComRecalc campo="intercalada" aoClicar={recalcarCampo} desabilitado={!entrada.ok}>
            <Campo
              titulo={
                <>
                  Intercaladas anuais · valor (R$) <Termo id="intercaladas" />
                </>
              }
              valor={estado.intercaladaValor}
              aoMudar={set('intercaladaValor')}
              placeholder="0,00"
              ajuda="Valor de cada parcela intercalada, paga uma vez por ano."
            />
          </ComRecalc>
          <Campo
            titulo="Intercaladas anuais · quantidade"
            tipo="number"
            valor={estado.intercaladaQtd}
            aoMudar={set('intercaladaQtd')}
            ajuda="Quantas parcelas intercaladas."
          />
          <Campo
            titulo="Intercaladas anuais · mês da primeira"
            tipo="month"
            valor={estado.primeiraIntercalada}
            aoMudar={set('primeiraIntercalada')}
            ajuda="Mês do primeiro pagamento intercalado."
          />
          <ComRecalc campo="entrega" aoClicar={recalcarCampo} desabilitado={!entrada.ok}>
            <Campo
              titulo={
                <>
                  Entrega das chaves (R$) <Termo id="entrega-chaves" />
                </>
              }
              valor={estado.entrega}
              aoMudar={set('entrega')}
              placeholder="0,00"
              ajuda="Pago na entrega das chaves."
            />
          </ComRecalc>
          <Campo
            titulo="Entrega das chaves · mês"
            tipo="month"
            valor={estado.mesEntrega}
            aoMudar={set('mesEntrega')}
            ajuda="Mês previsto para a entrega."
          />
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

        {blocoCronograma('editar')}
      </>
    );
  }

  function renderPasso4() {
    const plan = plano.ok ? plano.valor : null;
    return (
      <>
        <div className="r82s-revisao">
          <section className="r82s-bloco" aria-labelledby={`${idTitulo}-b1`}>
            <div className="r82s-bloco-cabeca">
              <h3 id={`${idTitulo}-b1`}>Unidade e cliente</h3>
              <button type="button" className="r82s-editar" onClick={() => irPara(1)}>
                Editar<span className="r82s-sr"> unidade e cliente</span>
              </button>
            </div>
            <dl className="r82s-dl">
              <Linha rotulo="Empreendimento" valor={nomeEmpreendimento || '—'} />
              <Linha rotulo="Unidade" valor={estado.unidade || '—'} />
              <Linha rotulo="Cliente" valor={estado.cliente || '—'} />
              <Linha rotulo="Corretor" valor={estado.corretor || '—'} />
              <Linha rotulo="Imobiliária" valor={estado.imobiliaria || '—'} />
              <Linha rotulo="Valor da unidade" valor={valores.ok ? brl(valores.valor.valorImovel) : '—'} />
              <Linha rotulo="Desconto negociado" valor={valores.ok ? brl(valores.valor.desconto) : '—'} />
            </dl>
          </section>

          <section className="r82s-bloco" aria-labelledby={`${idTitulo}-b2`}>
            <div className="r82s-bloco-cabeca">
              <h3 id={`${idTitulo}-b2`}>Financiamento</h3>
              <button type="button" className="r82s-editar" onClick={() => irPara(2)}>
                Editar<span className="r82s-sr"> financiamento</span>
              </button>
            </div>
            <dl className="r82s-dl">
              <Linha rotulo="Renda total" valor={renda.ok ? brl(renda.valor) : '—'} />
              <Linha rotulo="Valor financiado" valor={valores.ok ? brl(valores.valor.financiamento) : '—'} />
              <Linha rotulo="Sistema" valor={estado.sistema} />
              <Linha rotulo="Taxa de juros anual" valor={`${estado.taxaAnual}%`} />
              <Linha rotulo="Prazo" valor={`${estado.prazo} meses`} />
              <Linha rotulo="FGTS" valor={valores.ok ? brl(valores.valor.fgts) : '—'} />
              <Linha rotulo="Subsídio" valor={valores.ok ? brl(valores.valor.subsidio) : '—'} />
              <Linha
                rotulo="Parcela bancária estimada"
                valor={
                  parcela.ok
                    ? parcela.valor.tipo === 'PRICE'
                      ? brl(parcela.valor.parcela)
                      : `1ª: ${brl(parcela.valor.primeira)} · última: ${brl(parcela.valor.ultima)}`
                    : '—'
                }
              />
              <Linha
                rotulo="Comprometimento de renda"
                valor={comprometido && comprometido.ok ? `${formatadorPct.format(comprometido.valor.percentual)}%` : '—'}
              />
            </dl>
          </section>

          <section className="r82s-bloco" aria-labelledby={`${idTitulo}-b3`}>
            <div className="r82s-bloco-cabeca">
              <h3 id={`${idTitulo}-b3`}>Entrada e plano</h3>
              <button type="button" className="r82s-editar" onClick={() => irPara(3)}>
                Editar<span className="r82s-sr"> entrada e plano</span>
              </button>
            </div>
            <dl className="r82s-dl">
              <Linha rotulo="Valor líquido após desconto" valor={entrada.ok ? brl(entrada.valor.valorLiquido) : '—'} />
              <Linha rotulo="Entrada a pagar à construtora" valor={entrada.ok ? brl(entrada.valor.entradaTotal) : '—'} />
              <Linha rotulo="Mês da assinatura" valor={formatarMes(estado.mesAssinatura) || '—'} />
              <Linha rotulo="Ato/sinal" valor={plan ? brl(plan.totalAto) : '—'} />
              <Linha rotulo="Ato parcelado" valor={plan ? brl(plan.totalAtoParcelado) : '—'} />
              <Linha rotulo="Mensais" valor={plan ? brl(plan.totalMensais) : '—'} />
              <Linha rotulo="Intercaladas anuais" valor={plan ? brl(plan.totalIntercaladas) : '—'} />
              <Linha rotulo="Entrega das chaves" valor={plan ? brl(plan.totalEntrega) : '—'} />
              <Linha rotulo="Total do plano" valor={plan ? brl(plan.totalPlano) : '—'} />
              <Linha rotulo="Situação do plano" valor={textoPlano} />
            </dl>
            {blocoCronograma('revisar')}
          </section>
        </div>

        <div className="r82s-acoes-finais">
          <button type="button" className="r82s-btn-grande" onClick={() => window.print()}>
            Imprimir proposta
          </button>
          <button type="button" className="r82s-btn-sec-grande" onClick={limpar}>
            Começar nova simulação
          </button>
        </div>
      </>
    );
  }

  const bloqueiaContinuar = passo === 1 && !unidadeOk;

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
        <h1>Simulador de entrada</h1>
        <p>Calcule a entrada de uma unidade e monte o plano de pagamento, passo a passo.</p>
      </header>

      <div className="r82s-ajuda">
        <AjudaPagina id="simulador" passos={PASSOS_AJUDA} />
      </div>

      <div className="r82s-layout">
        <div className="r82s-main">
          <nav aria-label="Passos da simulação">
            <ol className="r82s-steps">
              {PASSOS_NOME.map((nome, i) => {
                const numero = (i + 1) as Passo;
                const ativo = numero === passo;
                const concluido = numero < passo;
                const bloqueado = numero > 1 && !unidadeOk;
                return (
                  <li key={nome}>
                    <button
                      type="button"
                      className="r82s-step"
                      aria-current={ativo ? 'step' : undefined}
                      disabled={bloqueado}
                      onClick={() => irPara(numero)}
                    >
                      <span className="r82s-step-num" aria-hidden="true">
                        {numero}
                      </span>
                      <span className="r82s-step-nome">{nome}</span>
                      {concluido && <span className="r82s-step-ok">Concluído</span>}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          <p className="r82s-progresso" ref={progressoRef}>
            {`Passo ${passo} de 4`}
          </p>

          <section className="r82s-card" aria-labelledby={idTitulo}>
            <h2 id={idTitulo}>{PASSOS_NOME[passo - 1]}</h2>
            {passo === 1 && renderPasso1()}
            {passo === 2 && renderPasso2()}
            {passo === 3 && renderPasso3()}
            {passo === 4 && renderPasso4()}

            {passo < 4 && (
              <div className="r82s-nav">
                {anterior && (
                  <button type="button" className="r82s-btn-sec" onClick={() => irPara(anterior)}>
                    Voltar
                  </button>
                )}
                {proximo && (
                  <button
                    type="button"
                    className="r82s-btn"
                    disabled={bloqueiaContinuar}
                    aria-describedby={bloqueiaContinuar ? idMensagem : undefined}
                    onClick={() => irPara(proximo)}
                  >
                    Continuar
                  </button>
                )}
              </div>
            )}
            {passo === 4 && (
              <div className="r82s-nav">
                {anterior && (
                  <button type="button" className="r82s-btn-sec" onClick={() => irPara(anterior)}>
                    Voltar
                  </button>
                )}
              </div>
            )}
          </section>
        </div>

        <aside className="r82s-summary" aria-label="Resumo da simulação">
          <h2 className="r82s-summary-title">Resumo</h2>
          <dl className="r82s-dl">
            <Linha rotulo="Valor da unidade" valor={valores.ok ? brl(valores.valor.valorImovel) : '—'} />
            <Linha rotulo="Desconto" valor={valores.ok ? brl(valores.valor.desconto) : '—'} />
            <Linha rotulo="Valor líquido" valor={entrada.ok ? brl(entrada.valor.valorLiquido) : '—'} />
            <Linha rotulo="Financiamento" valor={valores.ok ? brl(valores.valor.financiamento) : '—'} />
            <Linha
              rotulo="FGTS + subsídio"
              valor={valores.ok ? brl(valores.valor.fgts + valores.valor.subsidio) : '—'}
            />
            <Linha rotulo="Entrada" valor={entrada.ok ? brl(entrada.valor.entradaTotal) : '—'} />
            <Linha rotulo="Total do plano" valor={plano.ok ? brl(plano.valor.totalPlano) : '—'} />
            <Linha rotulo="Diferença" valor={plano.ok ? brl(plano.valor.diferenca) : '—'} />
            <Linha
              rotulo="Parcela bancária estimada"
              valor={
                parcela.ok
                  ? parcela.valor.tipo === 'PRICE'
                    ? brl(parcela.valor.parcela)
                    : `1ª: ${brl(parcela.valor.primeira)} · última: ${brl(parcela.valor.ultima)}`
                  : '—'
              }
            />
          </dl>
        </aside>
      </div>

      <p className="r82s-print-only r82s-print-foot">
        Simulação sem valor de proposta oficial. Valores sujeitos à tabela vigente, análise de crédito e aprovação da Rocha.
      </p>
    </section>
  );
}
