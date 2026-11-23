'use client';

import Link from 'next/link';
import Termo from '../ajuda/Termo';
import { useEffect, useState } from 'react';

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

const INDICE_SECOES: readonly { id: string; label: string }[] = [
  { id: 'dados', label: 'Dados e pagamento' },
  { id: 'materiais', label: 'Materiais' },
  { id: 'videos', label: 'Vídeos' },
  { id: 'redes', label: 'Redes sociais' },
  { id: 'simulador', label: 'Simulador' },
];

// Explicacoes dos termos tecnicos, abertas pelo componente Termo.


// Relaciona o id do item de materiais ao termo explicado.
const TERMO_DO_ITEM: Readonly<Record<string, string>> = {
  'book-corretores': 'book',
  memorial: 'memorial',
  'tabela-precos': 'tabela-precos',
};

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

function NaoCadastrado({ empId }: { empId: string }) {
  return (
    <div className="r82-empty">
      <p>Ainda não cadastrado.</p>
      <Link href={`/portal/atualizar?emp=${empId}`} className="r82-link">Cadastrar agora</Link>
    </div>
  );
}

function Campo({ rotulo, valor, empId, termo }: { rotulo: string; valor: string; empId: string; termo?: string }) {
  return (
    <div className="r82-campo">
      <span className="r82-label">{termo ? <Termo id={termo}>{rotulo}</Termo> : rotulo}</span>
      {valor ? <p className="r82-value">{valor}</p> : <NaoCadastrado empId={empId} />}
    </div>
  );
}

function ListaLinks({ itens, prefixo, empId }: { itens: ArquivoLink[]; prefixo: string; empId: string }) {
  if (itens.length === 0) return <NaoCadastrado empId={empId} />;
  return (
    <ul className="r82-links">
      {itens.map((arquivo, indice) => (
        <li key={`${prefixo}-${indice}`}>
          <a href={arquivo.url} target="_blank" rel="noopener noreferrer">
            <span>{arquivo.titulo}</span>
            <span className="r82-open">Abrir (nova aba)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function CentralEmpreendimentoClient({ emp, secoes, meses }: Props) {
  const [feedback, setFeedback] = useState<string>('');
  const [mesAtual, setMesAtual] = useState(-1);

  useEffect(() => {
    setMesAtual(new Date().getMonth());
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(''), 2000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  async function copiar(texto: string) {
    const ok = await copiarTexto(texto);
    setFeedback(ok ? MSG_COPIADO : MSG_FALHA);
  }

  const secoesMateriais = secoes.filter((secao) => secao.id !== 'videos');
  const secaoVideos = secoes.find((secao) => secao.id === 'videos');

  function renderItens(secao: SecaoMateriais) {
    return (
      <div className="r82-items">
        {secao.itens.map((item) => {
          const termo: string | undefined = TERMO_DO_ITEM[item.id];
          return (
            <article key={item.id} className="r82-item">
              <h4>{termo ? <Termo id={termo}>{item.nome}</Termo> : item.nome}</h4>
              <ListaLinks itens={emp.materiais[item.id] ?? []} prefixo={item.id} empId={emp.id} />
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <div className="r82-central">
      <nav className="r82-crumbs" aria-label="Caminho de navegação">
        <Link href="/portal/central">Central dos empreendimentos</Link>
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{emp.nome}</span>
      </nav>

      <header className="r82-head">
        <h1>{emp.nome}</h1>
        <p>{emp.bairro} · {emp.cidade}</p>
        <p className="r82-status-text">Status: {emp.status}</p>
      </header>

      <nav className="r82-index" aria-label="Nesta página">
        <span className="r82-index-label">Nesta página</span>
        {INDICE_SECOES.map((item) => (
          <a key={item.id} href={`#${item.id}`} className="r82-index-link">{item.label}</a>
        ))}
      </nav>

      <section id="dados" className="r82-section" aria-labelledby="r82-h-dados">
        <h2 id="r82-h-dados">Dados e pagamento</h2>
        <div className="r82-grid-2">
          <div className="r82-card">
            <h3>CNPJ do empreendimento</h3>
            <Campo rotulo="Razão social" valor={emp.razaoSocial} empId={emp.id} />
            {emp.cnpj ? (
              <div className="r82-campo">
                <span className="r82-label"><Termo id="cnpj">CNPJ</Termo></span>
                <p className="r82-big">{emp.cnpj}</p>
                <div>
                  <button type="button" className="r82-btn" onClick={() => void copiar(emp.cnpj)}>Copiar CNPJ</button>
                </div>
              </div>
            ) : (
              <Campo rotulo="CNPJ" valor="" empId={emp.id} termo="cnpj" />
            )}
          </div>

          <div className="r82-card">
            <h3>PIX do empreendimento</h3>
            <Campo rotulo="Tipo de chave" valor={emp.pix.tipo} empId={emp.id} />
            {emp.pix.chave ? (
              <div className="r82-campo">
                <span className="r82-label"><Termo id="pix">Chave PIX</Termo></span>
                <p className="r82-mono">{emp.pix.chave}</p>
                <div>
                  <button type="button" className="r82-btn" onClick={() => void copiar(emp.pix.chave)}>Copiar chave PIX</button>
                </div>
              </div>
            ) : (
              <Campo rotulo="Chave PIX" valor="" empId={emp.id} termo="pix" />
            )}
            <Campo rotulo="Favorecido" valor={emp.pix.favorecido} empId={emp.id} />
            <Campo rotulo="Banco" valor={emp.pix.banco} empId={emp.id} />
          </div>
        </div>

        <p className="r82-warning" role="note">Antes de enviar o PIX ao cliente, confirme o favorecido com o financeiro.</p>
        <p className="r82-status" role="status">{feedback}</p>
      </section>

      <section id="materiais" className="r82-section" aria-labelledby="r82-h-materiais">
        <h2 id="r82-h-materiais">Materiais</h2>
        <p className="r82-muted-line">Arquivos para venda: plantas, book, tabela de preços e outros. Cada link abre em nova aba.</p>
        {secoesMateriais.map((secao) => {
          const termoSecao: string | undefined = secao.id === 'perspectivas' ? 'perspectivas' : undefined;
          return (
            <div key={secao.id} className="r82-block">
              <h3>{termoSecao ? <Termo id={termoSecao}>{secao.titulo}</Termo> : secao.titulo}</h3>
              {renderItens(secao)}
            </div>
          );
        })}
        <div>
          <Link href="/portal/biblioteca" className="r82-btn-secondary">Biblioteca local de arquivos</Link>
        </div>
      </section>

      <section id="videos" className="r82-section" aria-labelledby="r82-h-videos">
        <h2 id="r82-h-videos">Vídeos</h2>
        <p className="r82-muted-line">Vídeos de localização e apresentação do empreendimento. Cada link abre em nova aba.</p>
        {secaoVideos && renderItens(secaoVideos)}
      </section>

      <section id="redes" className="r82-section" aria-labelledby="r82-h-redes">
        <h2 id="r82-h-redes">Redes sociais</h2>
        <p className="r82-muted-line">Postagens prontas para as redes sociais, separadas por mês. O mês atual aparece marcado com o texto Mês atual.</p>
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
                  {atual && <span className="r82-now">Mês atual</span>}
                </div>
                <p className="r82-muted-line">
                  {postagens.length} {postagens.length === 1 ? 'postagem' : 'postagens'}
                </p>
                <ListaLinks itens={postagens} prefixo={mes.id} empId={emp.id} />
              </article>
            );
          })}
        </div>
      </section>

      <section id="simulador" className="r82-section" aria-labelledby="r82-h-simulador">
        <h2 id="r82-h-simulador">Simulador</h2>
        <p>O simulador de entrada abre já vinculado a este empreendimento, para montar a proposta de entrada.</p>
        <div>
          <Link href={`/portal/simulador?emp=${emp.id}`} className="r82-btn">Abrir o simulador com este empreendimento</Link>
        </div>
      </section>
    </div>
  );
}
