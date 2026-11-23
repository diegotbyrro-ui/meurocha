'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { empreendimentos } from '@/lib/catalog.mjs';
import {
  calcularEntrada,
  cent,
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
import CabecalhoPagina from '../ui/CabecalhoPagina';
import Icone, { type NomeIcone } from '../ui/Icone';

type Sistema = 'PRICE' | 'SAC';
type CampoRecalc = 'ato' | 'atoParcelado' | 'mensal' | 'intercalada' | 'entrega';
type Tentativa<T> = { ok: true; valor: T } | { ok: false; erro: string };
type Passo = 1 | 2 | 3 | 4;
type Tom = 'ok' | 'warn' | 'err';
type ChaveSegmento =
  | 'financiamento'
  | 'fgts'
  | 'subsidio'
  | 'ato'
  | 'atoParcelado'
  | 'mensais'
  | 'intercaladas'
  | 'chaves'
  | 'falta';

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
type Segmento = { chave: ChaveSegmento; rotulo: string; cor: string; valor: number; pct: number };

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

// Cores fixas da divisão da entrada (por tipo de pagamento). "Falta definir" usa cinza claro com borda tracejada.
const SEGMENTOS_CONFIG: { chave: ChaveSegmento; rotulo: string; cor: string }[] = [
  { chave: 'financiamento', rotulo: 'Financiamento', cor: '#1f5fae' },
  { chave: 'fgts', rotulo: 'FGTS', cor: '#0e7c78' },
  { chave: 'subsidio', rotulo: 'Subsídio', cor: '#6b3fb8' },
  { chave: 'ato', rotulo: 'Ato', cor: '#a51c2c' },
  { chave: 'atoParcelado', rotulo: 'Ato parcelado', cor: '#d22630' },
  { chave: 'mensais', rotulo: 'Mensais', cor: '#b45309' },
  { chave: 'intercaladas', rotulo: 'Intercaladas', cor: '#1b7a4a' },
  { chave: 'chaves', rotulo: 'Chaves', cor: '#3d1219' },
  { chave: 'falta', rotulo: 'Falta definir', cor: '#e7e5e0' },
];

const LINHAS_INICIAIS = 24;

const PASSOS = [
  { nome: 'Unidade e cliente', icone: 'predio' },
  { nome: 'Financiamento', icone: 'banco' },
  { nome: 'Plano da entrada', icone: 'moedas' },
  { nome: 'Revisar e imprimir', icone: 'imprimir' },
] as const satisfies readonly { nome: string; icone: NomeIcone }[];

const PASSOS_AJUDA = [
  'Preencha a unidade e o cliente. Só o valor da unidade é obrigatório para continuar.',
  'Informe a renda e o financiamento. A parcela e o comprometimento da renda aparecem na hora.',
  'Divida a entrada em ato, parcelas e entrega. A caixa de status mostra se o plano fecha.',
  'Confira os dados e clique em Imprimir proposta. Use Editar para voltar a qualquer bloco.',
] as const;

const formatadorBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatadorNumero = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatadorPct = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const formatadorPct1 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });

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
        <Icone nome="refazer" tamanho={18} />
        Calcular o que falta
      </button>
    </div>
  );
}

function Grupo({
  icone,
  titulo,
  children,
  emGrade = true,
}: {
  icone: NomeIcone;
  titulo: string;
  children: ReactNode;
  emGrade?: boolean;
}) {
  const idGrupo = useId();
  return (
    <section className="r82s-grupo" aria-labelledby={idGrupo}>
      <div className="r82s-grupo-titulo">
        <span className="r84-icone-bloco r82s-grupo-icone" aria-hidden="true">
          <Icone nome={icone} tamanho={18} />
        </span>
        <h3 id={idGrupo}>{titulo}</h3>
      </div>
      {emGrade ? <div className="r82s-grid">{children}</div> : children}
    </section>
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
  const [destaque, setDestaque] = useState<ChaveSegmento | null>(null);
  const [fixado, setFixado] = useState<ChaveSegmento | null>(null);
  const progressoRef = useRef<HTMLParagraphElement>(null);
  const idMensagem = useId();
  const idTitulo = useId();
  const idDivisao = useId();

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

  // Divisão da unidade por tipo de pagamento. Larguras = valor / valor líquido (ou soma, se exceder).
  const distribuicao = useMemo(() => {
    if (!entrada.ok || entrada.valor.valorLiquido <= 0) return null;
    const liquido = entrada.valor.valorLiquido;
    const v = valores.ok ? valores.valor : null;
    const p = plano.ok ? plano.valor : null;
    const valorPorChave: Record<ChaveSegmento, number> = {
      financiamento: v?.financiamento ?? 0,
      fgts: v?.fgts ?? 0,
      subsidio: v?.subsidio ?? 0,
      ato: p?.totalAto ?? 0,
      atoParcelado: p?.totalAtoParcelado ?? 0,
      mensais: p?.totalMensais ?? 0,
      intercaladas: p?.totalIntercaladas ?? 0,
      chaves: p?.totalEntrega ?? 0,
      falta: 0,
    };
    const usado = cent(
      SEGMENTOS_CONFIG.filter((s) => s.chave !== 'falta').reduce((soma, s) => soma + valorPorChave[s.chave], 0),
    );
    valorPorChave.falta = cent(Math.max(0, liquido - usado));
    const total = cent(usado + valorPorChave.falta);
    const segmentos: Segmento[] = SEGMENTOS_CONFIG.map((s) => ({
      ...s,
      valor: valorPorChave[s.chave],
      pct: total > 0 ? (valorPorChave[s.chave] / total) * 100 : 0,
    }));
    return { segmentos, liquido, excede: usado > liquido };
  }, [entrada, valores, plano]);

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

  // Pílula de status do resumo: ok (verde), falta (âmbar), excede ou erro (vermelho). Sempre com texto.
  const pilula: { classe: string; icone: NomeIcone; texto: string } =
    tomPlano === 'ok'
      ? { classe: 'r84-selo r84-selo-ok', icone: 'checkCirculo', texto: 'Plano fecha a entrada' }
      : tomPlano === 'warn' && plano.ok
        ? { classe: 'r84-selo r84-selo-falta', icone: 'alerta', texto: `Falta ${brl(plano.valor.diferenca)}` }
        : entrada.ok && plano.ok
          ? { classe: 'r82s-selo-err', icone: 'alerta', texto: `Excede ${brl(Math.abs(plano.valor.diferenca))}` }
          : { classe: 'r82s-selo-err', icone: 'alerta', texto: 'Confira os valores' };

  const ativo = destaque ?? fixado;

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
    setDestaque(null);
    setFixado(null);
    setPasso(1);
    progressoRef.current?.scrollIntoView({ block: 'start' });
  }

  function blocoCronograma(modo: 'editar' | 'revisar') {
    const editar = modo === 'editar';
    return (
      <details className="r82s-details" open={!editar}>
        <summary>
          <span className="r84-icone-bloco r82s-grupo-icone" aria-hidden="true">
            <Icone nome="calendario" tamanho={18} />
          </span>
          Ver mês a mês (cronograma)
        </summary>
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
                        <td className="r82s-mes">{formatarMes(linha.mes)}</td>
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
        <Grupo icone="predio" titulo="Empreendimento e unidade">
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
        </Grupo>
        {!unidadeOk && (
          <p className="r82s-erro-campo" id={idMensagem}>
            {mensagemUnidade}
          </p>
        )}
        <Grupo icone="usuarios" titulo="Cliente e atendimento">
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
        </Grupo>
      </>
    );
  }

  function renderPasso2() {
    return (
      <>
        <Grupo icone="carteira" titulo="Renda">
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
        </Grupo>

        <Grupo icone="banco" titulo="Financiamento, FGTS e subsídio">
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
        </Grupo>

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
          <p className="r82s-status-estado">
            <Icone nome={tomPlano === 'ok' ? 'checkCirculo' : 'alerta'} tamanho={20} />
            <span>{textoPlano}</span>
          </p>
        </div>

        <Grupo icone="moedas" titulo="Pagamentos da entrada">
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
        </Grupo>

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
              <div className="r82s-bloco-titulo">
                <span className="r84-icone-bloco r82s-grupo-icone" aria-hidden="true">
                  <Icone nome="predio" tamanho={18} />
                </span>
                <h3 id={`${idTitulo}-b1`}>Unidade e cliente</h3>
              </div>
              <button type="button" className="r82s-editar" onClick={() => irPara(1)}>
                <Icone nome="editar" tamanho={18} />
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
              <div className="r82s-bloco-titulo">
                <span className="r84-icone-bloco r82s-grupo-icone" aria-hidden="true">
                  <Icone nome="banco" tamanho={18} />
                </span>
                <h3 id={`${idTitulo}-b2`}>Financiamento</h3>
              </div>
              <button type="button" className="r82s-editar" onClick={() => irPara(2)}>
                <Icone nome="editar" tamanho={18} />
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
              <div className="r82s-bloco-titulo">
                <span className="r84-icone-bloco r82s-grupo-icone" aria-hidden="true">
                  <Icone nome="moedas" tamanho={18} />
                </span>
                <h3 id={`${idTitulo}-b3`}>Entrada e plano</h3>
              </div>
              <button type="button" className="r82s-editar" onClick={() => irPara(3)}>
                <Icone nome="editar" tamanho={18} />
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
          <button type="button" className="r84-btn r82s-btn-grande" onClick={() => window.print()}>
            <Icone nome="imprimir" tamanho={20} />
            Imprimir proposta
          </button>
        </div>
      </>
    );
  }

  const bloqueiaContinuar = passo === 1 && !unidadeOk;
  const percentualPasso = (passo / 4) * 100;

  return (
    <section className="r82s" data-area="simulador" aria-label="Simulador de entrada">
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

      <CabecalhoPagina
        area="simulador"
        icone="calculadora"
        titulo="Simulador de entrada"
        descricao="Calcule a entrada de uma unidade e monte o plano de pagamento, passo a passo."
      >
        <button type="button" className="r84-btn-sec" onClick={limpar}>
          <Icone nome="refazer" tamanho={18} />
          Começar nova simulação
        </button>
      </CabecalhoPagina>

      <div className="r82s-ajuda">
        <AjudaPagina id="simulador" passos={PASSOS_AJUDA} />
      </div>

      <div className="r82s-layout">
        <div className="r82s-main">
          <nav aria-label="Passos da simulação">
            <ol className="r82s-steps">
              {PASSOS.map((passoInfo, i) => {
                const numero = (i + 1) as Passo;
                const atual = numero === passo;
                const concluido = numero < passo;
                const bloqueado = numero > 1 && !unidadeOk;
                const classes = ['r82s-step', atual && 'is-atual', concluido && 'is-feito', bloqueado && 'is-bloqueado']
                  .filter(Boolean)
                  .join(' ');
                return (
                  <li key={passoInfo.nome}>
                    <button
                      type="button"
                      className={classes}
                      aria-current={atual ? 'step' : undefined}
                      disabled={bloqueado}
                      title={bloqueado ? 'Informe o valor da unidade para liberar este passo' : undefined}
                      onClick={() => irPara(numero)}
                    >
                      <span className="r82s-step-icone" aria-hidden="true">
                        <Icone nome={passoInfo.icone} tamanho={22} />
                      </span>
                      <span className="r82s-step-texto">
                        <span className="r82s-step-pre">{`Passo ${numero}`}</span>
                        <span className="r82s-step-nome">{passoInfo.nome}</span>
                        {concluido && (
                          <span className="r82s-step-ok">
                            <Icone nome="checkCirculo" tamanho={16} />
                            Concluído
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <div
              className="r82s-barra"
              role="progressbar"
              aria-label="Progresso da simulação"
              aria-valuemin={1}
              aria-valuemax={4}
              aria-valuenow={passo}
              aria-valuetext={`Passo ${passo} de 4`}
            >
              <span className="r82s-barra-preench" style={{ width: `${percentualPasso}%` }} />
            </div>
          </nav>

          <p className="r82s-progresso" ref={progressoRef}>
            {`Passo ${passo} de 4`}
          </p>

          <section className="r82s-card" aria-labelledby={idTitulo}>
            <header className="r82s-card-titulo">
              <span className="r84-icone-bloco" aria-hidden="true">
                <Icone nome={PASSOS[passo - 1].icone} tamanho={20} />
              </span>
              <h2 id={idTitulo}>{PASSOS[passo - 1].nome}</h2>
            </header>
            {passo === 1 && renderPasso1()}
            {passo === 2 && renderPasso2()}
            {passo === 3 && renderPasso3()}
            {passo === 4 && renderPasso4()}

            {passo < 4 && (
              <div className="r82s-nav">
                {anterior && (
                  <button type="button" className="r82s-btn-sec" onClick={() => irPara(anterior)}>
                    <Icone nome="setaEsquerda" tamanho={18} />
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
                    <Icone nome="setaDireita" tamanho={18} />
                  </button>
                )}
              </div>
            )}
            {passo === 4 && (
              <div className="r82s-nav">
                {anterior && (
                  <button type="button" className="r82s-btn-sec" onClick={() => irPara(anterior)}>
                    <Icone nome="setaEsquerda" tamanho={18} />
                    Voltar
                  </button>
                )}
              </div>
            )}
          </section>
        </div>

        <aside className="r82s-summary r84-cartao" aria-label="Resumo da simulação">
          <div className="r84-cartao-topo" aria-hidden="true" />
          <h2 className="r82s-summary-title">Resumo</h2>

          <div className="r82s-entrada">
            <span>Entrada</span>
            <strong>{entrada.ok ? brl(entrada.valor.entradaTotal) : '—'}</strong>
          </div>
          <p className={`r82s-pilula ${pilula.classe}`} role="status">
            <Icone nome={pilula.icone} tamanho={16} />
            {pilula.texto}
          </p>

          <section className="r82s-divisao" aria-labelledby={idDivisao}>
            <h3 id={idDivisao}>Como a unidade será paga</h3>
            {distribuicao ? (
              <>
                <div className="r82s-pilha" onMouseLeave={() => setDestaque(null)}>
                  {distribuicao.segmentos
                    .filter((s) => s.valor > 0)
                    .map((s) => {
                      const apagado = ativo !== null && ativo !== s.chave;
                      const textoPct = `${formatadorPct1.format(s.pct)}%`;
                      return (
                        <span
                          key={s.chave}
                          role="img"
                          className={`r82s-seg${s.chave === 'falta' ? ' is-falta' : ''}${apagado ? ' is-apagado' : ''}`}
                          style={{ width: `${s.pct}%`, background: s.cor }}
                          title={`${s.rotulo}: ${brl(s.valor)} (${textoPct})`}
                          aria-label={`${s.rotulo}: ${brl(s.valor)}, ${textoPct}`}
                          onMouseEnter={() => setDestaque(s.chave)}
                        />
                      );
                    })}
                </div>
                <ul className="r82s-legenda">
                  {distribuicao.segmentos.map((s) => {
                    const pressionado = fixado === s.chave;
                    const destacado = ativo === s.chave;
                    return (
                      <li key={s.chave}>
                        <button
                          type="button"
                          className={`r82s-legenda-item${destacado ? ' is-destacado' : ''}`}
                          aria-pressed={pressionado}
                          onMouseEnter={() => setDestaque(s.chave)}
                          onMouseLeave={() => setDestaque(null)}
                          onFocus={() => setDestaque(s.chave)}
                          onBlur={() => setDestaque(null)}
                          onClick={() => setFixado((f) => (f === s.chave ? null : s.chave))}
                        >
                          <span
                            className={`r82s-cor${s.chave === 'falta' ? ' is-falta' : ''}`}
                            style={{ background: s.cor }}
                            aria-hidden="true"
                          />
                          <span className="r82s-legenda-rotulo">{s.rotulo}</span>
                          <span className="r82s-legenda-valor">{brl(s.valor)}</span>
                          <span className="r82s-legenda-pct">{`${formatadorPct1.format(s.pct)}%`}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p className="r82s-help">
                  {`Base: valor líquido de ${brl(distribuicao.liquido)}.${distribuicao.excede ? ' Os pagamentos passam desse valor.' : ''}`}
                </p>
              </>
            ) : (
              <p className="r82s-help">Informe o valor da unidade para ver a divisão.</p>
            )}
          </section>

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
