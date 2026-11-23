'use client';

import { useEffect, useMemo, useState } from 'react';
import AjudaPagina from '../ajuda/AjudaPagina';
import Termo from '../ajuda/Termo';
import {
  cnpjValido,
  linkSeguro,
  normalizarEmpreendimento,
  paraEdicao,
  pixValido,
} from '@/lib/empreendimentos-central.mjs';
import { gerarArquivoDados, resumoAlteracoes } from '@/lib/central-gerar-arquivo.mjs';

type Link = { titulo: string; url: string };
type Pix = { tipo: string; chave: string; favorecido: string; banco: string };
type Emp = {
  id: string;
  razaoSocial: string;
  cnpj: string;
  pix: Pix;
  materiais: Record<string, Link[]>;
  postagens: Record<string, Link[]>;
};
type Item = { id: string; nome: string };
type Secao = { id: string; titulo: string; itens: readonly Item[] };
type Mes = { id: string; nome: string };
type Status = { ok: boolean; texto: string };

type Props = {
  inicial: Emp[];
  secoes: readonly Secao[];
  meses: readonly Mes[];
  tiposPix: readonly string[];
  empInicial?: string;
  nomes: Record<string, string>;
  githubUrl: string;
};

const CHAVE_RASCUNHO = 'rocha-atualizar-rascunho';
const LIMITE_LINKS = 20;
const MSG_HTTPS = 'O link precisa começar com https://';
const NOMES_PASSOS = ['Empreendimento', 'Pagamento', 'Materiais', 'Redes sociais', 'Publicar'];
const TOTAL_PASSOS = NOMES_PASSOS.length;

const DICAS_PIX: Record<string, string> = {
  CNPJ: 'Use os 14 números do CNPJ. Ex.: 11.222.333/0001-81',
  'E-mail': 'Use o e-mail cadastrado no banco. Ex.: financeiro@empresa.com.br',
  Telefone: 'Use +55, DDD e número. Ex.: +55 82 99999-9999',
  'Chave aleatória': 'Cole a chave completa, no formato 8-4-4-4-12 letras e números.',
};

const MSG_PIX: Record<string, string> = {
  CNPJ: 'Confira o número: dígito verificador não confere',
  'E-mail': 'Confira o e-mail. Ele precisa ter @ e um domínio, como financeiro@empresa.com.br',
  Telefone: 'Confira o telefone. Use +55, DDD e número. Ex.: +55 82 99999-9999',
  'Chave aleatória': 'Confira a chave. Ela tem o formato 8-4-4-4-12 letras e números.',
};

/** Aplica a mascara 00.000.000/0000-00 enquanto o texto e digitado. */
function mascaraCnpj(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 14);
  let s = d.slice(0, 2);
  if (d.length > 2) s += `.${d.slice(2, 5)}`;
  if (d.length > 5) s += `.${d.slice(5, 8)}`;
  if (d.length > 8) s += `/${d.slice(8, 12)}`;
  if (d.length > 12) s += `-${d.slice(12, 14)}`;
  return s;
}

function statusCnpj(cnpj: string): Status | null {
  const d = cnpj.replace(/\D/g, '');
  if (d.length === 0) return null;
  if (d.length < 14) return { ok: false, texto: 'Confira o número: faltam dígitos' };
  if (!cnpjValido(d)) return { ok: false, texto: 'Confira o número: dígito verificador não confere' };
  return { ok: true, texto: 'CNPJ válido' };
}

function statusPix(pix: Pix): Status | null {
  if (pix.chave.trim() === '') return null;
  if (pixValido(pix)) return { ok: true, texto: 'Chave válida' };
  return { ok: false, texto: MSG_PIX[pix.tipo] ?? 'Confira a chave PIX.' };
}

function temLinks(mapa: Record<string, Link[]>): boolean {
  return Object.values(mapa).some((lista) => lista.length > 0);
}

/** Lista o que ainda falta cadastrar para um empreendimento. */
function faltas(e: Emp): string[] {
  const falta: string[] = [];
  if (e.razaoSocial.trim() === '') falta.push('Razão social');
  if (!cnpjValido(e.cnpj)) falta.push('CNPJ');
  if (!pixValido(e.pix)) falta.push('PIX');
  if (!temLinks(e.materiais)) falta.push('Materiais');
  if (!temLinks(e.postagens)) falta.push('Redes sociais');
  return falta;
}

/** Problemas que fariam um dado ser descartado na publicacao. */
function problemasDe(lista: Emp[], nomes: Record<string, string>): string[] {
  const saida: string[] = [];
  for (const e of lista) {
    const nome = nomes[e.id] ?? e.id;
    if (statusCnpj(e.cnpj)?.ok === false) saida.push(`${nome}: CNPJ com erro`);
    if (statusPix(e.pix)?.ok === false) saida.push(`${nome}: chave PIX com erro`);
  }
  return saida;
}

/** Usa o rascunho salvo somente para os ids conhecidos; o resto segue a base publicada. */
function sanearRascunho(lido: unknown[], base: Emp[]): Emp[] {
  return base.map((b) => {
    const achado = lido.find((x) => typeof x === 'object' && x !== null && (x as { id?: unknown }).id === b.id);
    const norm = achado ? normalizarEmpreendimento(achado) : null;
    return norm ? (paraEdicao(norm) as Emp) : b;
  });
}

function encurtarUrl(url: string): string {
  const semProtocolo = url.replace(/^https:\/\//, '');
  return semProtocolo.length > 56 ? `${semProtocolo.slice(0, 55)}…` : semProtocolo;
}

function copiarPeloTextarea(texto: string): boolean {
  const area = document.createElement('textarea');
  area.value = texto;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(area);
  return ok;
}

/** Lista de links de um item, com a linha para adicionar novo link. */
function EditorLinks({
  id,
  links,
  onChange,
}: {
  id: string;
  links: Link[];
  onChange: (links: Link[]) => void;
}) {
  const [titulo, setTitulo] = useState('');
  const [url, setUrl] = useState('');
  const [erro, setErro] = useState('');
  const cheio = links.length >= LIMITE_LINKS;

  function adicionar() {
    if (cheio) {
      setErro(`Este item já tem ${LIMITE_LINKS} links. Remova um para adicionar outro.`);
      return;
    }
    const tituloLimpo = titulo.trim();
    if (tituloLimpo === '') {
      setErro('Dê um título ao link. Ex.: Planta 2 quartos');
      return;
    }
    const seguro = linkSeguro(url.trim());
    if (seguro === '') {
      setErro(url.trim() === '' ? 'Cole o link antes de adicionar.' : MSG_HTTPS);
      return;
    }
    onChange([...links, { titulo: tituloLimpo.slice(0, 120), url: seguro }]);
    setTitulo('');
    setUrl('');
    setErro('');
  }

  return (
    <div className="r83u-links">
      {links.length === 0 ? (
        <p className="r83u-vazio">Nenhum link cadastrado ainda.</p>
      ) : (
        <ul className="r83u-lista-links">
          {links.map((link, i) => (
            <li key={`${link.url}-${i}`} className="r83u-link">
              <div className="r83u-link-texto">
                <span className="r83u-link-titulo">{link.titulo}</span>
                <span className="r83u-link-url">{encurtarUrl(link.url)}</span>
              </div>
              <button
                type="button"
                className="r83u-btn r83u-btn-perigo"
                aria-label={`Remover ${link.titulo}`}
                onClick={() => onChange(links.filter((_, j) => j !== i))}
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="r83u-adicionar">
        <div className="r83u-campo">
          <label htmlFor={`${id}-titulo`}>Título</label>
          <input
            id={`${id}-titulo`}
            type="text"
            autoComplete="off"
            maxLength={120}
            value={titulo}
            disabled={cheio}
            onChange={(ev) => setTitulo(ev.target.value)}
          />
        </div>
        <div className="r83u-campo">
          <div className="r83u-rotulo">
            <label htmlFor={`${id}-url`}>Link de compartilhamento</label>
            <Termo id="link-https">https</Termo>
          </div>
          <input
            id={`${id}-url`}
            type="text"
            inputMode="url"
            autoComplete="off"
            placeholder="https://"
            value={url}
            disabled={cheio}
            aria-invalid={erro !== '' && erro === MSG_HTTPS ? true : undefined}
            aria-describedby={erro !== '' ? `${id}-erro` : undefined}
            onChange={(ev) => setUrl(ev.target.value)}
          />
        </div>
        <button type="button" className="r83u-btn r83u-btn-primario" onClick={adicionar} disabled={cheio}>
          Adicionar link
        </button>
      </div>
      {erro !== '' && (
        <p id={`${id}-erro`} role="alert" className="r83u-erro">
          {erro}
        </p>
      )}
      <p className="r83u-contagem">
        {links.length} de {LIMITE_LINKS} links
      </p>
    </div>
  );
}

/** Grupo recolhivel de uma secao de materiais. Abre sozinho quando ja tem links. */
function GrupoMateriais({
  secao,
  materiais,
  onChange,
}: {
  secao: Secao;
  materiais: Record<string, Link[]>;
  onChange: (itemId: string, links: Link[]) => void;
}) {
  const total = secao.itens.reduce((acc, item) => acc + (materiais[item.id]?.length ?? 0), 0);
  const [aberto] = useState(total > 0);

  return (
    <details className="r83u-grupo" open={aberto}>
      <summary>
        {secao.titulo} <span className="r83u-contagem">({total} {total === 1 ? 'link' : 'links'})</span>
      </summary>
      {secao.itens.map((item) => (
        <section key={item.id} className="r83u-item">
          <h3>{item.nome}</h3>
          <EditorLinks
            id={`mat-${item.id}`}
            links={materiais[item.id] ?? []}
            onChange={(links) => onChange(item.id, links)}
          />
        </section>
      ))}
    </details>
  );
}

export default function AtualizarClient({
  inicial,
  secoes,
  meses,
  tiposPix,
  empInicial,
  nomes,
  githubUrl,
}: Props) {
  const [estado, setEstado] = useState<Emp[]>(inicial);
  const [passo, setPasso] = useState(1);
  const [selecionado, setSelecionado] = useState<string>(empInicial ?? '');
  const [mesAtual, setMesAtual] = useState('01');
  const [tocou, setTocou] = useState(false);
  const [rascunho, setRascunho] = useState<Emp[] | null>(null);
  const [copiado, setCopiado] = useState('');

  const arquivoInicial = useMemo(() => gerarArquivoDados(inicial), [inicial]);
  const arquivo = useMemo(() => gerarArquivoDados(estado), [estado]);
  const alteracoes = useMemo(() => resumoAlteracoes(inicial, estado), [inicial, estado]);
  const problemas = useMemo(() => problemasDe(estado, nomes), [estado, nomes]);

  // Procura um rascunho salvo neste navegador. So mostra o aviso se ele for diferente do publicado.
  useEffect(() => {
    try {
      const bruto = window.localStorage.getItem(CHAVE_RASCUNHO);
      if (!bruto) return;
      const lido: unknown = JSON.parse(bruto);
      if (!Array.isArray(lido)) return;
      const limpo = sanearRascunho(lido, inicial);
      if (gerarArquivoDados(limpo) !== arquivoInicial) setRascunho(limpo);
    } catch {
      // Rascunho ilegivel: e ignorado.
    }
  }, [arquivoInicial, inicial]);

  // Salva o rascunho com atraso. So salva depois que a pessoa mexe em algum campo.
  useEffect(() => {
    if (!tocou) return;
    const timer = window.setTimeout(() => {
      try {
        if (arquivo === arquivoInicial) {
          window.localStorage.removeItem(CHAVE_RASCUNHO);
        } else {
          window.localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(estado));
        }
      } catch {
        // Sem armazenamento disponivel: o rascunho nao e salvo.
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [estado, tocou, arquivo, arquivoInicial]);

  const emp = estado.find((e) => e.id === selecionado) ?? null;

  function atualizarEmp(fn: (e: Emp) => Emp) {
    if (selecionado === '') return;
    setTocou(true);
    setEstado((antes) => antes.map((e) => (e.id === selecionado ? fn(e) : e)));
  }

  function alterarMateriais(itemId: string, links: Link[]) {
    atualizarEmp((e) => ({ ...e, materiais: { ...e.materiais, [itemId]: links } }));
  }

  function alterarPostagens(mesId: string, links: Link[]) {
    atualizarEmp((e) => ({ ...e, postagens: { ...e.postagens, [mesId]: links } }));
  }

  function continuarRascunho() {
    if (!rascunho) return;
    setEstado(rascunho);
    setTocou(true);
    setRascunho(null);
  }

  function descartarRascunho() {
    try {
      window.localStorage.removeItem(CHAVE_RASCUNHO);
    } catch {
      // Sem armazenamento disponivel: nada a remover.
    }
    setRascunho(null);
  }

  const statusCnpjAtual = emp ? statusCnpj(emp.cnpj) : null;
  const statusPixAtual = emp ? statusPix(emp.pix) : null;
  const bloqueadoPorPagamento = passo === 2 && (statusCnpjAtual?.ok === false || statusPixAtual?.ok === false);
  const podeContinuar = passo === 1 ? selecionado !== '' : !bloqueadoPorPagamento;

  async function copiar() {
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(arquivo);
        ok = true;
      }
    } catch {
      ok = false;
    }
    if (!ok) ok = copiarPeloTextarea(arquivo);
    setCopiado(ok ? 'Arquivo copiado' : 'Não foi possível copiar sozinho. Use “Baixar arquivo”.');
  }

  function baixar() {
    const blob = new Blob([arquivo], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'central-dados.mjs';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <main className="r83u-pagina">
      <header className="r83u-cabecalho">
        <h1>Atualizar conteúdo do portal</h1>
        <p>Atualize CNPJ, PIX, materiais e postagens dos empreendimentos. Não é preciso saber programar.</p>
      </header>

      <AjudaPagina
        id="atualizar"
        passos={[
          'No passo 1, escolha o empreendimento. Os cards mostram o que ainda falta cadastrar.',
          'No passo 2, preencha CNPJ e chave PIX. Os dados são conferidos enquanto você digita.',
          'Nos passos 3 e 4, cole os links de materiais e das postagens do mês. Só aceitamos links https.',
          'No passo 5, copie o arquivo, cole no GitHub e clique em Commit changes.',
        ]}
      />

      {rascunho && (
        <section className="r83u-aviso-rascunho" aria-labelledby="r83u-rascunho-titulo">
          <h2 id="r83u-rascunho-titulo">Você tem um rascunho não publicado</h2>
          <p>Ele foi salvo neste navegador. Continue de onde parou ou descarte para voltar aos dados publicados.</p>
          <div className="r83u-acoes">
            <button type="button" className="r83u-btn r83u-btn-primario" onClick={continuarRascunho}>
              Continuar rascunho
            </button>
            <button type="button" className="r83u-btn r83u-btn-perigo" onClick={descartarRascunho}>
              Descartar
            </button>
          </div>
        </section>
      )}

      <section className="r83u-assistente" aria-label="Passos do cadastro">
        <div className="r83u-progresso">
          <p className="r83u-passo-titulo" aria-live="polite">
            Passo {passo} de {TOTAL_PASSOS} · {NOMES_PASSOS[passo - 1]}
          </p>
          <div
            className="r83u-barra"
            role="progressbar"
            aria-label="Progresso do cadastro"
            aria-valuemin={1}
            aria-valuemax={TOTAL_PASSOS}
            aria-valuenow={passo}
            aria-valuetext={`Passo ${passo} de ${TOTAL_PASSOS}`}
          >
            <span style={{ width: `${(passo / TOTAL_PASSOS) * 100}%` }} />
          </div>
        </div>

        {passo === 1 && (
          <fieldset className="r83u-fieldset">
            <legend>Qual empreendimento você vai atualizar?</legend>
            <div className="r83u-cards">
              {estado.map((e) => {
                const falta = faltas(e);
                const ativo = selecionado === e.id;
                return (
                  <label key={e.id} className={ativo ? 'r83u-card r83u-card-ativo' : 'r83u-card'}>
                    <input
                      type="radio"
                      name="empreendimento"
                      value={e.id}
                      checked={ativo}
                      className="r83u-radio"
                      onChange={() => setSelecionado(e.id)}
                    />
                    <span className="r83u-card-nome">{nomes[e.id] ?? e.id}</span>
                    <span className="r83u-card-falta">
                      {falta.length > 0 ? `Falta: ${falta.join(', ')}` : 'Tudo cadastrado'}
                    </span>
                  </label>
                );
              })}
            </div>
            {selecionado === '' && <p className="r83u-dica">Escolha um empreendimento para continuar.</p>}
          </fieldset>
        )}

        {passo > 1 && emp === null && (
          <p className="r83u-erro" role="alert">
            Escolha um empreendimento no passo 1 antes de continuar.
          </p>
        )}

        {passo === 2 && emp && (
          <div className="r83u-bloco">
            <p className="r83u-dica">Preencha os dados de pagamento de {nomes[emp.id] ?? emp.id}.</p>

            <div className="r83u-campo">
              <label htmlFor="pag-razao">Razão social</label>
              <input
                id="pag-razao"
                type="text"
                autoComplete="off"
                maxLength={160}
                value={emp.razaoSocial}
                onChange={(ev) => {
                  const valor = ev.target.value;
                  atualizarEmp((e) => ({ ...e, razaoSocial: valor }));
                }}
              />
            </div>

            <div className="r83u-campo">
              <div className="r83u-rotulo">
                <label htmlFor="pag-cnpj">Número do CNPJ</label>
                <Termo id="cnpj">CNPJ</Termo>
              </div>
              <input
                id="pag-cnpj"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="00.000.000/0000-00"
                value={emp.cnpj}
                aria-invalid={statusCnpjAtual?.ok === false ? true : undefined}
                aria-describedby={statusCnpjAtual ? 'pag-cnpj-status' : undefined}
                onChange={(ev) => {
                  const valor = mascaraCnpj(ev.target.value);
                  atualizarEmp((e) => ({ ...e, cnpj: valor }));
                }}
              />
              {statusCnpjAtual && (
                <p
                  id="pag-cnpj-status"
                  className={statusCnpjAtual.ok ? 'r83u-status r83u-status-ok' : 'r83u-status r83u-status-erro'}
                >
                  {statusCnpjAtual.texto}
                </p>
              )}
            </div>

            <div className="r83u-campo">
              <div className="r83u-rotulo">
                <label htmlFor="pag-pix-tipo">Tipo de chave PIX</label>
                <Termo id="pix">PIX</Termo>
              </div>
              <select
                id="pag-pix-tipo"
                value={emp.pix.tipo}
                onChange={(ev) => {
                  const tipo = ev.target.value;
                  atualizarEmp((e) => ({ ...e, pix: { ...e.pix, tipo } }));
                }}
              >
                {tiposPix.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <p className="r83u-dica">{DICAS_PIX[emp.pix.tipo] ?? ''}</p>
            </div>

            <div className="r83u-campo">
              <label htmlFor="pag-pix-chave">Chave PIX</label>
              <input
                id="pag-pix-chave"
                type="text"
                autoComplete="off"
                value={emp.pix.chave}
                aria-invalid={statusPixAtual?.ok === false ? true : undefined}
                aria-describedby={statusPixAtual ? 'pag-pix-status' : undefined}
                onChange={(ev) => {
                  const chave = ev.target.value;
                  atualizarEmp((e) => ({ ...e, pix: { ...e.pix, chave } }));
                }}
              />
              {statusPixAtual && (
                <p
                  id="pag-pix-status"
                  className={statusPixAtual.ok ? 'r83u-status r83u-status-ok' : 'r83u-status r83u-status-erro'}
                >
                  {statusPixAtual.texto}
                </p>
              )}
            </div>

            <div className="r83u-campo">
              <label htmlFor="pag-favorecido">Favorecido</label>
              <input
                id="pag-favorecido"
                type="text"
                autoComplete="off"
                maxLength={120}
                value={emp.pix.favorecido}
                onChange={(ev) => {
                  const favorecido = ev.target.value;
                  atualizarEmp((e) => ({ ...e, pix: { ...e.pix, favorecido } }));
                }}
              />
            </div>

            <div className="r83u-campo">
              <label htmlFor="pag-banco">Banco</label>
              <input
                id="pag-banco"
                type="text"
                autoComplete="off"
                maxLength={80}
                value={emp.pix.banco}
                onChange={(ev) => {
                  const banco = ev.target.value;
                  atualizarEmp((e) => ({ ...e, pix: { ...e.pix, banco } }));
                }}
              />
            </div>

            {bloqueadoPorPagamento && (
              <p className="r83u-erro" role="alert">
                Não dá para continuar com CNPJ ou chave PIX errados. Eles aparecem na conta e no pagamento,
                por isso corrija o campo marcado em vermelho antes de seguir.
              </p>
            )}
          </div>
        )}

        {passo === 3 && emp && (
          <div className="r83u-bloco">
            <p className="r83u-dica">
              Cole o link de compartilhamento do Google Drive (Qualquer pessoa com o link pode ver).
            </p>
            {secoes.map((secao) => (
              <GrupoMateriais
                key={`${emp.id}-${secao.id}`}
                secao={secao}
                materiais={emp.materiais}
                onChange={alterarMateriais}
              />
            ))}
          </div>
        )}

        {passo === 4 && emp && (
          <div className="r83u-bloco">
            <p className="r83u-dica">Escolha o mês e cole os links das postagens desse mês.</p>
            <div className="r83u-meses" role="group" aria-label="Mês das postagens">
              {meses.map((m) => {
                const quantidade = emp.postagens[m.id]?.length ?? 0;
                return (
                  <button
                    key={m.id}
                    type="button"
                    className="r83u-mes"
                    aria-pressed={mesAtual === m.id}
                    onClick={() => setMesAtual(m.id)}
                  >
                    <span className="r83u-mes-nome">{m.nome}</span>
                    <span className="r83u-mes-qtd">
                      {quantidade > 0 ? `${quantidade} ${quantidade === 1 ? 'link' : 'links'}` : 'Sem links'}
                    </span>
                  </button>
                );
              })}
            </div>
            <h3 className="r83u-subtitulo">
              Postagens de {meses.find((m) => m.id === mesAtual)?.nome ?? mesAtual}
            </h3>
            <EditorLinks
              key={`${emp.id}-${mesAtual}`}
              id={`post-${mesAtual}`}
              links={emp.postagens[mesAtual] ?? []}
              onChange={(links) => alterarPostagens(mesAtual, links)}
            />
          </div>
        )}

        {passo === 5 && (
          <div className="r83u-bloco">
            <h2 className="r83u-secao">O que muda</h2>
            {alteracoes.length > 0 ? (
              <ul className="r83u-lista-simples">
                {alteracoes.map((frase) => (
                  <li key={frase}>{frase}</li>
                ))}
              </ul>
            ) : (
              <p className="r83u-dica">Nenhuma alteração ainda.</p>
            )}

            {problemas.length > 0 && (
              <div className="r83u-aviso" role="status">
                <p>Estes dados têm erro e não serão publicados até serem corrigidos:</p>
                <ul className="r83u-lista-simples">
                  {problemas.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            <h2 className="r83u-secao">Como publicar</h2>
            <ol className="r83u-passos">
              <li>Clique em “Copiar arquivo”.</li>
              <li>Clique em “Abrir o arquivo no GitHub”. Ele abre em outra aba.</li>
              <li>No GitHub, clique dentro do texto, aperte Ctrl+A e depois Ctrl+V.</li>
              <li>Clique no botão verde “Commit changes” e confirme.</li>
              <li>Aguarde cerca de 2 minutos e atualize o portal.</li>
            </ol>

            <div className="r83u-acoes">
              <button type="button" className="r83u-btn r83u-btn-primario" onClick={copiar}>
                Copiar arquivo
              </button>
              <a
                className="r83u-btn r83u-btn-secundario"
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir o arquivo no GitHub
              </a>
              <button type="button" className="r83u-btn r83u-btn-secundario" onClick={baixar}>
                Baixar arquivo
              </button>
            </div>
            <p role="status" className="r83u-status-copia">
              {copiado}
            </p>

            <details className="r83u-detalhe">
              <summary>Ver o texto do arquivo</summary>
              <textarea
                className="r83u-texto-arquivo"
                readOnly
                rows={20}
                value={arquivo}
                aria-label="Texto do arquivo central-dados.mjs"
              />
            </details>
          </div>
        )}
      </section>

      <nav className="r83u-nav" aria-label="Navegação dos passos">
        <button
          type="button"
          className="r83u-btn r83u-btn-secundario"
          disabled={passo === 1}
          onClick={() => setPasso((p) => Math.max(1, p - 1))}
        >
          Voltar
        </button>
        {passo < TOTAL_PASSOS && (
          <button
            type="button"
            className="r83u-btn r83u-btn-primario"
            disabled={!podeContinuar}
            onClick={() => setPasso((p) => Math.min(TOTAL_PASSOS, p + 1))}
          >
            Continuar
          </button>
        )}
      </nav>
    </main>
  );
}
