'use client';

import Link from 'next/link';
import Termo from '../ajuda/Termo';
import { useEffect, useState } from 'react';
import { TIPOS_POSTAGEM } from '@/lib/empreendimentos-central.mjs';

type ArquivoLink = { titulo: string; url: string };
type Postagem = { titulo: string; url: string; tipo: string };

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
  postagens: Postagem[];
};

type ItemMaterial = { readonly id: string; readonly nome: string };
type SecaoMateriais = { readonly id: string; readonly titulo: string; readonly itens: readonly ItemMaterial[] };

type Props = {
  emp: EmpreendimentoCentral;
  secoes: readonly SecaoMateriais[];
};

/** Filtro de postagens: 'Todos' ou um dos tipos de TIPOS_POSTAGEM. */
const FILTROS: readonly string[] = ['Todos', ...TIPOS_POSTAGEM];

/** Mensagem de copia, com a secao em que ela aparece. */
type Feedback = { origem: 'dados' | 'redes'; texto: string };

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

export default function CentralEmpreendimentoClient({ emp, secoes }: Props) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [filtro, setFiltro] = useState<string>('Todos');

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 2000);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  async function copiar(texto: string, origem: Feedback['origem']) {
    const ok = await copiarTexto(texto);
    setFeedback({ origem, texto: ok ? MSG_COPIADO : MSG_FALHA });
  }

  const postagens = emp.postagens;
  const visiveis = postagens
    .map((post, indice) => ({ post, indice }))
    .filter(({ post }) => filtro === 'Todos' || post.tipo === filtro);

  function contarTipo(tipo: string): number {
    return tipo === 'Todos' ? postagens.length : postagens.filter((p) => p.tipo === tipo).length;
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
                  <button type="button" className="r82-btn" onClick={() => void copiar(emp.cnpj, 'dados')}>Copiar CNPJ</button>
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
                  <button type="button" className="r82-btn" onClick={() => void copiar(emp.pix.chave, 'dados')}>Copiar chave PIX</button>
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
        <p className="r82-status" role="status">{feedback?.origem === 'dados' ? feedback.texto : ''}</p>
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
        <p className="r82-muted-line">Vídeos e postagens prontos para você baixar e publicar nas suas redes.</p>
        <p className="r82-muted-line">Antes de publicar, confira se a legenda e o contato são os seus.</p>

        {postagens.length === 0 ? (
          <div className="r82-empty">
            <p>Ainda não há postagens cadastradas.</p>
            <Link href={`/portal/atualizar?emp=${emp.id}`} className="r82-link">Cadastrar agora</Link>
          </div>
        ) : (
          <>
            <div className="r82-filtros" role="group" aria-label="Filtrar postagens por tipo">
              {FILTROS.map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  className="r82-filtro"
                  aria-pressed={filtro === tipo}
                  onClick={() => setFiltro(tipo)}
                >
                  {tipo} ({contarTipo(tipo)})
                </button>
              ))}
            </div>

            {visiveis.length === 0 ? (
              <p className="r82-muted-line">Nenhuma postagem deste tipo.</p>
            ) : (
              <ul className="r82-post-grid">
                {visiveis.map(({ post, indice }) => (
                  <li key={`${indice}-${post.url}`} className="r82-post-card">
                    <span className="r82-badge">{post.tipo}</span>
                    <h3 className="r82-post-titulo">{post.titulo}</h3>
                    <div className="r82-post-acoes">
                      <a href={post.url} target="_blank" rel="noopener noreferrer" className="r82-btn-secondary">
                        Abrir (nova aba)
                      </a>
                      <button type="button" className="r82-btn-secondary" onClick={() => void copiar(post.url, 'redes')}>
                        Copiar link
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <p className="r82-status" role="status">{feedback?.origem === 'redes' ? feedback.texto : ''}</p>
          </>
        )}
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
