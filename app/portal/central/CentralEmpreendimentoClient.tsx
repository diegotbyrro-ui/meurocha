'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

type ArquivoLink = { titulo: string; url: string };

type EmpreendimentoCentral = {
  id: string;
  nome: string;
  bairro: string;
  cidade: string;
  status: string;
  razaoSocial: string;
  cnpj: string;
  pix: { tipo: string; chave: string; favorecido: string; banco: string };
  materiais: Record<string, ArquivoLink[]>;
  postagens: Record<string, ArquivoLink[]>;
};

type ItemMaterial = { readonly id: string; readonly nome: string };
type SecaoMateriais = { readonly id: string; readonly titulo: string; readonly itens: readonly ItemMaterial[] };
type MesCentral = { readonly id: string; readonly nome: string };

type Props = {
  emp: EmpreendimentoCentral;
  secoes: readonly SecaoMateriais[];
  meses: readonly MesCentral[];
};

type AbaId = 'dados' | 'materiais' | 'videos' | 'redes' | 'simulador';

const ABAS: readonly { id: AbaId; label: string }[] = [
  { id: 'dados', label: 'Dados e pagamento' },
  { id: 'materiais', label: 'Materiais' },
  { id: 'videos', label: 'Vídeos' },
  { id: 'redes', label: 'Redes sociais' },
  { id: 'simulador', label: 'Simulador' },
];

const AGUARDANDO = 'Aguardando cadastro pela equipe Rocha.';
const MSG_COPIADO = 'Copiado!';
const MSG_FALHA = 'Não foi possível copiar. Selecione o texto e copie manualmente.';

function copiarComFallback(texto: string): boolean {
  const area = document.createElement('textarea');
  area.value = texto;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.top = '-1000px';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  } finally {
    area.remove();
  }
  return ok;
}

async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return copiarComFallback(texto);
  }
}

function Campo({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="r82-campo">
      <span className="r82-label">{rotulo}</span>
      {valor ? <p className="r82-value">{valor}</p> : <p className="r82-empty">{AGUARDANDO}</p>}
    </div>
  );
}

function ListaLinks({ itens, prefixo }: { itens: ArquivoLink[]; prefixo: string }) {
  if (itens.length === 0) return <p className="r82-empty">Nenhum arquivo publicado ainda.</p>;
  return (
    <ul className="r82-links">
      {itens.map((arquivo, indice) => (
        <li key={`${prefixo}-${indice}`}>
          <a href={arquivo.url} target="_blank" rel="noopener noreferrer">
            <span>{arquivo.titulo}</span>
            <span className="r82-open">Abrir</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function CentralEmpreendimentoClient({ emp, secoes, meses }: Props) {
  const [aba, setAba] = useState<AbaId>('dados');
  const [feedback, setFeedback] = useState<{ texto: string } | null>(null);
  const [mesAtual, setMesAtual] = useState(-1);
  const abaRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    setMesAtual(new Date().getMonth());
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 2000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  async function copiar(texto: string) {
    const ok = await copiarTexto(texto);
    setFeedback({ texto: ok ? MSG_COPIADO : MSG_FALHA });
  }

  function onTabKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, indice: number) {
    let proximo = -1;
    if (event.key === 'ArrowRight') proximo = (indice + 1) % ABAS.length;
    else if (event.key === 'ArrowLeft') proximo = (indice - 1 + ABAS.length) % ABAS.length;
    else if (event.key === 'Home') proximo = 0;
    else if (event.key === 'End') proximo = ABAS.length - 1;
    if (proximo < 0) return;
    event.preventDefault();
    setAba(ABAS[proximo].id);
    abaRefs.current[proximo]?.focus();
  }

  const secoesMateriais = secoes.filter((secao) => secao.id !== 'videos');
  const secaoVideos = secoes.find((secao) => secao.id === 'videos');

  function renderSecao(secao: SecaoMateriais) {
    return (
      <section key={secao.id} className="r82-block" aria-labelledby={`r82-secao-${secao.id}`}>
        <h2 className="r82-section-title" id={`r82-secao-${secao.id}`}>{secao.titulo}</h2>
        <div className="r82-items">
          {secao.itens.map((item) => (
            <article key={item.id} className="r82-item">
              <h3>{item.nome}</h3>
              <ListaLinks itens={emp.materiais[item.id] ?? []} prefixo={item.id} />
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="r82-central">
      <nav className="r82-crumbs" aria-label="Caminho de navegação">
        <Link href="/portal/central">Central dos empreendimentos</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{emp.nome}</span>
      </nav>

      <header className="r82-hero">
        <h1>{emp.nome}</h1>
        <p>{emp.bairro} · {emp.cidade}</p>
        <span className="r82-chip">{emp.status}</span>
      </header>

      <div className="r82-tabs" role="tablist" aria-label="Seções do empreendimento">
        {ABAS.map((item, indice) => (
          <button
            key={item.id}
            ref={(el) => { abaRefs.current[indice] = el; }}
            type="button"
            role="tab"
            id={`r82-tab-${item.id}`}
            aria-selected={aba === item.id}
            aria-controls="r82-tabpanel"
            tabIndex={aba === item.id ? 0 : -1}
            className="r82-tab"
            onClick={() => setAba(item.id)}
            onKeyDown={(event) => onTabKeyDown(event, indice)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="r82-tabpanel" aria-labelledby={`r82-tab-${aba}`} className="r82-panel">
        {aba === 'dados' && (
          <>
            <div className="r82-grid r82-grid-2">
              <section className="r82-card" aria-labelledby="r82-cnpj-titulo">
                <h2 id="r82-cnpj-titulo">CNPJ do empreendimento</h2>
                <Campo rotulo="Razão social" valor={emp.razaoSocial} />
                {emp.cnpj ? (
                  <>
                    <div className="r82-campo">
                      <span className="r82-label">CNPJ</span>
                      <p className="r82-big">{emp.cnpj}</p>
                    </div>
                    <button type="button" className="r82-btn" onClick={() => void copiar(emp.cnpj)}>Copiar CNPJ</button>
                  </>
                ) : (
                  <Campo rotulo="CNPJ" valor="" />
                )}
              </section>

              <section className="r82-card" aria-labelledby="r82-pix-titulo">
                <h2 id="r82-pix-titulo">PIX do empreendimento</h2>
                <Campo rotulo="Tipo de chave" valor={emp.pix.tipo} />
                {emp.pix.chave ? (
                  <>
                    <div className="r82-campo">
                      <span className="r82-label">Chave PIX</span>
                      <p className="r82-mono">{emp.pix.chave}</p>
                    </div>
                    <button type="button" className="r82-btn" onClick={() => void copiar(emp.pix.chave)}>Copiar chave PIX</button>
                  </>
                ) : (
                  <Campo rotulo="Chave PIX" valor="" />
                )}
                <Campo rotulo="Favorecido" valor={emp.pix.favorecido} />
                <Campo rotulo="Banco" valor={emp.pix.banco} />
              </section>
            </div>

            <p className="r82-warning" role="note">Antes de enviar o PIX ao cliente, confirme o favorecido com o financeiro.</p>
            <p className="r82-status" role="status">{feedback?.texto ?? ''}</p>
          </>
        )}

        {aba === 'materiais' && (
          <>
            <div className="r82-blocks">
              {secoesMateriais.map((secao) => renderSecao(secao))}
            </div>
            <div>
              <Link href="/portal/biblioteca" className="r82-btn-ghost">Biblioteca local de arquivos</Link>
            </div>
          </>
        )}

        {aba === 'videos' && (
          <div className="r82-blocks">
            {secaoVideos && renderSecao(secaoVideos)}
          </div>
        )}

        {aba === 'redes' && (
          <>
            <p className="r82-muted-line">Postagens mensais para redes sociais. O mês atual aparece destacado.</p>
            <div className="r82-months">
              {meses.map((mes, indice) => {
                const postagens = emp.postagens[mes.id] ?? [];
                const atual = indice === mesAtual;
                return (
                  <article
                    key={mes.id}
                    className={`r82-month${atual ? ' is-current' : ''}`}
                    aria-current={atual ? 'date' : undefined}
                  >
                    <div className="r82-month-head">
                      <h3>{mes.nome}</h3>
                      <span className="r82-month-count">
                        {postagens.length} {postagens.length === 1 ? 'postagem' : 'postagens'}
                      </span>
                    </div>
                    {atual && <span className="r82-now">Mês atual</span>}
                    {postagens.length === 0 ? (
                      <p className="r82-empty">Nenhuma postagem publicada.</p>
                    ) : (
                      <ListaLinks itens={postagens} prefixo={mes.id} />
                    )}
                  </article>
                );
              })}
            </div>
          </>
        )}

        {aba === 'simulador' && (
          <section className="r82-card">
            <h2>Simulador de entrada</h2>
            <p className="r82-muted-line">Abra o simulador comercial já vinculado a este empreendimento para montar a proposta de entrada.</p>
            <Link href={`/portal/simulador?emp=${emp.id}`} className="r82-btn">Abrir simulador de entrada</Link>
          </section>
        )}
      </div>
    </div>
  );
}
