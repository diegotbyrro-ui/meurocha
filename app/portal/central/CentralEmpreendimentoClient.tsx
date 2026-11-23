'use client';

import Link from 'next/link';
import Termo from '../ajuda/Termo';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import Icone, { type NomeIcone } from '../ui/Icone';
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

/** Secoes da pagina, na ordem do indice fixo "Nesta página". */
const INDICE_SECOES: readonly { id: string; label: string; icone: NomeIcone }[] = [
  { id: 'dados', label: 'Dados e pagamento', icone: 'cartao' },
  { id: 'materiais', label: 'Materiais', icone: 'imagens' },
  { id: 'videos', label: 'Vídeos', icone: 'video' },
  { id: 'redes', label: 'Redes sociais', icone: 'megafone' },
  { id: 'simulador', label: 'Simulador', icone: 'calculadora' },
];

// Explicacoes dos termos tecnicos, abertas pelo componente Termo.

// Relaciona o id do item de materiais ao termo explicado.
const TERMO_DO_ITEM: Readonly<Record<string, string>> = {
  'book-corretores': 'book',
  memorial: 'memorial',
  'tabela-precos': 'tabela-precos',
};

// Icone que mostra o tipo de cada material.
const ICONE_DO_ITEM: Partial<Record<string, NomeIcone>> = {
  'perspectivas-internas': 'imagem',
  'perspectivas-externas': 'imagem',
  plantas: 'regua',
  'book-corretores': 'livro',
  'tabela-precos': 'tabela',
  logomarca: 'marca',
  'projeto-arquitetonico': 'documento',
  estacionamento: 'carro',
  memorial: 'documento',
  localizacao: 'mapa',
  apresentacao: 'play',
};

// Icone e classe de cor de cada tipo de postagem.
const ICONE_DO_TIPO: Partial<Record<string, NomeIcone>> = {
  'Vídeo': 'play',
  Imagem: 'imagem',
  Carrossel: 'imagens',
  Texto: 'documento',
};

const CLASSE_DO_TIPO: Partial<Record<string, string>> = {
  Todos: 'r82-tipo-todos',
  'Vídeo': 'r82-tipo-video',
  Imagem: 'r82-tipo-imagem',
  Carrossel: 'r82-tipo-carrossel',
  Texto: 'r82-tipo-texto',
};

const MSG_FALHA = 'Não foi possível copiar. Selecione o texto e copie manualmente.';
const MS_BOTAO_COPIADO = 2000;
const MS_AVISO = 2500;

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

function TituloSecao({ id, icone, children }: { id: string; icone: NomeIcone; children: ReactNode }) {
  return (
    <h2 id={id} className="r82-titulo-secao">
      <span className="r84-icone-bloco" aria-hidden="true"><Icone nome={icone} tamanho={20} /></span>
      <span>{children}</span>
    </h2>
  );
}

function BotaoCopiar({ rotulo, feito, classe, onClick }: { rotulo: string; feito: boolean; classe: string; onClick: () => void }) {
  return (
    <button type="button" className={feito ? `${classe} is-feito` : classe} onClick={onClick}>
      <Icone nome={feito ? 'check' : 'copiar'} tamanho={18} />
      <span>{feito ? 'Copiado' : rotulo}</span>
    </button>
  );
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
            <span className="r82-open">Abrir (nova aba)<Icone nome="abrir" tamanho={16} /></span>
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function CentralEmpreendimentoClient({ emp, secoes }: Props) {
  const [ativa, setAtiva] = useState<string>('dados');
  const [filtro, setFiltro] = useState<string>('Todos');
  const [copiado, setCopiado] = useState<{ id: string } | null>(null);
  const [aviso, setAviso] = useState<{ texto: string; ok: boolean } | null>(null);

  // O botao mostra "Copiado" por 2 s.
  useEffect(() => {
    if (!copiado) return;
    const timer = window.setTimeout(() => setCopiado(null), MS_BOTAO_COPIADO);
    return () => window.clearTimeout(timer);
  }, [copiado]);

  // O aviso flutuante some depois de 2,5 s.
  useEffect(() => {
    if (!aviso) return;
    const timer = window.setTimeout(() => setAviso(null), MS_AVISO);
    return () => window.clearTimeout(timer);
  }, [aviso]);

  // Destaca no indice a secao que esta na tela.
  useEffect(() => {
    const visiveis = new Set<string>();
    const escolher = () => {
      const noFim = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (noFim) {
        setAtiva('simulador');
        return;
      }
      const primeira = INDICE_SECOES.find((s) => visiveis.has(s.id));
      if (primeira) setAtiva(primeira.id);
    };
    const alvos = INDICE_SECOES
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    const observer = typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver((entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) visiveis.add(entrada.target.id);
          else visiveis.delete(entrada.target.id);
        }
        escolher();
      }, { rootMargin: '-120px 0px -55% 0px' });
    if (observer) alvos.forEach((alvo) => observer.observe(alvo));
    window.addEventListener('scroll', escolher, { passive: true });
    escolher();
    return () => {
      observer?.disconnect();
      window.removeEventListener('scroll', escolher);
    };
  }, []);

  async function copiar(id: string, texto: string, msgOk: string) {
    const ok = await copiarTexto(texto);
    setCopiado(ok ? { id } : null);
    setAviso({ texto: ok ? msgOk : MSG_FALHA, ok });
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
              <div className="r82-item-topo">
                <span className="r84-icone-bloco" aria-hidden="true">
                  <Icone nome={ICONE_DO_ITEM[item.id] ?? 'documento'} tamanho={20} />
                </span>
                <h4>{termo ? <Termo id={termo}>{item.nome}</Termo> : item.nome}</h4>
              </div>
              <ListaLinks itens={emp.materiais[item.id] ?? []} prefixo={item.id} empId={emp.id} />
            </article>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <nav className="r82-index" aria-label="Nesta página">
        <span className="r82-index-label">Nesta página</span>
        {INDICE_SECOES.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="r82-index-link"
            aria-current={ativa === item.id ? 'true' : undefined}
          >
            <Icone nome={item.icone} tamanho={18} />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>

      <section id="dados" className="r82-section" aria-labelledby="r82-h-dados">
        <TituloSecao id="r82-h-dados" icone="cartao">Dados e pagamento</TituloSecao>
        <div className="r82-grid-2">
          <div className="r82-card">
            <div className="r82-card-topo">
              <span className="r84-icone-bloco r84-icone-bloco-lg" aria-hidden="true"><Icone nome="banco" tamanho={26} /></span>
              <h3>CNPJ do empreendimento</h3>
            </div>
            <Campo rotulo="Razão social" valor={emp.razaoSocial} empId={emp.id} />
            {emp.cnpj ? (
              <div className="r82-campo">
                <span className="r82-label"><Termo id="cnpj">CNPJ</Termo></span>
                <p className="r82-big">{emp.cnpj}</p>
                <div>
                  <BotaoCopiar
                    rotulo="Copiar CNPJ"
                    feito={copiado?.id === 'cnpj'}
                    classe="r84-btn"
                    onClick={() => void copiar('cnpj', emp.cnpj, 'CNPJ copiado')}
                  />
                </div>
              </div>
            ) : (
              <Campo rotulo="CNPJ" valor="" empId={emp.id} termo="cnpj" />
            )}
          </div>

          <div className="r82-card">
            <div className="r82-card-topo">
              <span className="r84-icone-bloco r84-icone-bloco-lg" aria-hidden="true"><Icone nome="qrcode" tamanho={26} /></span>
              <h3>PIX do empreendimento</h3>
            </div>
            <Campo rotulo="Tipo de chave" valor={emp.pix.tipo} empId={emp.id} />
            {emp.pix.chave ? (
              <div className="r82-campo">
                <span className="r82-label"><Termo id="pix">Chave PIX</Termo></span>
                <p className="r82-mono">{emp.pix.chave}</p>
                <div>
                  <BotaoCopiar
                    rotulo="Copiar chave PIX"
                    feito={copiado?.id === 'pix'}
                    classe="r84-btn"
                    onClick={() => void copiar('pix', emp.pix.chave, 'Chave PIX copiada')}
                  />
                </div>
              </div>
            ) : (
              <Campo rotulo="Chave PIX" valor="" empId={emp.id} termo="pix" />
            )}
            <Campo rotulo="Favorecido" valor={emp.pix.favorecido} empId={emp.id} />
            <Campo rotulo="Banco" valor={emp.pix.banco} empId={emp.id} />
          </div>
        </div>

        <p className="r82-warning" role="note">
          <Icone nome="alerta" tamanho={20} />
          <span>Antes de enviar o PIX ao cliente, confirme o favorecido com o financeiro.</span>
        </p>
      </section>

      <section id="materiais" className="r82-section" aria-labelledby="r82-h-materiais">
        <TituloSecao id="r82-h-materiais" icone="imagens">Materiais</TituloSecao>
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
          <Link href="/portal/biblioteca" className="r84-btn-sec">
            <Icone nome="pasta" tamanho={18} />
            <span>Biblioteca local de arquivos</span>
          </Link>
        </div>
      </section>

      <section id="videos" className="r82-section" aria-labelledby="r82-h-videos">
        <TituloSecao id="r82-h-videos" icone="video">Vídeos</TituloSecao>
        <p className="r82-muted-line">Vídeos de localização e apresentação do empreendimento. Cada link abre em nova aba.</p>
        {secaoVideos && renderItens(secaoVideos)}
      </section>

      <section id="redes" className="r82-section" aria-labelledby="r82-h-redes">
        <TituloSecao id="r82-h-redes" icone="megafone">Redes sociais</TituloSecao>
        <p className="r82-muted-line">Vídeos e postagens prontos para você baixar e publicar nas suas redes.</p>
        <p className="r82-muted-line">Antes de publicar, confira se a legenda e o contato são os seus.</p>

        {postagens.length === 0 ? (
          <div className="r82-vazio">
            <span className="r84-icone-bloco r84-icone-bloco-lg r82-vazio-bloco" aria-hidden="true">
              <Icone nome="megafone" tamanho={40} />
            </span>
            <p>Ainda não há postagens cadastradas.</p>
            <p className="r82-muted-line">Cadastre os vídeos e as imagens que o corretor vai publicar.</p>
            <Link href={`/portal/atualizar?emp=${emp.id}`} className="r84-btn">
              <Icone nome="mais" tamanho={18} />
              <span>Cadastrar agora</span>
            </Link>
          </div>
        ) : (
          <>
            <div className="r82-filtros" role="group" aria-label="Filtrar postagens por tipo">
              {FILTROS.map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  className={`r82-filtro ${CLASSE_DO_TIPO[tipo] ?? ''}`}
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
                  <li key={`${indice}-${post.url}`} className={`r82-post-card ${CLASSE_DO_TIPO[post.tipo] ?? ''}`}>
                    <div className="r82-post-topo">
                      <span className="r84-icone-bloco" aria-hidden="true">
                        <Icone nome={ICONE_DO_TIPO[post.tipo] ?? 'play'} tamanho={20} />
                      </span>
                      <span className="r82-badge">{post.tipo}</span>
                    </div>
                    <h3 className="r82-post-titulo">{post.titulo}</h3>
                    <div className="r82-post-acoes">
                      <a href={post.url} target="_blank" rel="noopener noreferrer" className="r84-btn-sec">
                        <span>Abrir (nova aba)</span>
                        <Icone nome="abrir" tamanho={18} />
                      </a>
                      <BotaoCopiar
                        rotulo="Copiar link"
                        feito={copiado?.id === `post-${indice}`}
                        classe="r84-btn-sec"
                        onClick={() => void copiar(`post-${indice}`, post.url, 'Link copiado')}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      <section id="simulador" className="r82-section" data-area="simulador" aria-labelledby="r82-h-simulador">
        <TituloSecao id="r82-h-simulador" icone="calculadora">Simulador</TituloSecao>
        <div className="r82-cta">
          <span className="r84-icone-bloco-cheio r84-icone-bloco-lg" aria-hidden="true">
            <Icone nome="calculadora" tamanho={26} />
          </span>
          <div className="r82-cta-texto">
            <p>O simulador de entrada abre já vinculado a este empreendimento, para montar a proposta de entrada.</p>
            <div>
              <Link href={`/portal/simulador?emp=${emp.id}`} className="r84-btn">
                <span>Abrir o simulador com este empreendimento</span>
                <Icone nome="setaDireita" tamanho={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {aviso ? (
        <div className="r84-toast" role="status">
          <Icone nome={aviso.ok ? 'check' : 'alerta'} tamanho={18} />
          <span>{aviso.texto}</span>
        </div>
      ) : null}
    </>
  );
}
