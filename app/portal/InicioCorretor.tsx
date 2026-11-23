import Link from 'next/link';
import './r84-inicio.css';
import AjudaPagina from './ajuda/AjudaPagina';
import CabecalhoPagina from './ui/CabecalhoPagina';
import Icone, { type NomeIcone } from './ui/Icone';
import { listarEmpreendimentos } from '@/lib/empreendimentos-central.mjs';

// R85: início do corretor. Só mostra o que ele precisa para vender: Central, materiais e simulador.
// Sem tarefas, sem dados da equipe e sem ferramentas internas.

/** Mesmas capas sólidas da lista da Central, pela posição do empreendimento. */
const CORES_CAPA: readonly string[] = ['#a51c2c', '#3d1219', '#1f5fae', '#1b7a4a'];

type AcaoCorretor = { titulo: string; texto: string; href: string; icone: NomeIcone; area: 'central' | 'simulador' };

const ACOES: readonly AcaoCorretor[] = [
  { titulo: 'Copiar PIX ou CNPJ', texto: 'Abra o empreendimento na Central e copie o dado que o cliente pediu.', href: '/portal/central', icone: 'cartao', area: 'central' },
  { titulo: 'Baixar fotos, plantas e vídeos', texto: 'Materiais de venda separados por empreendimento, prontos para enviar.', href: '/portal/central', icone: 'imagens', area: 'central' },
  { titulo: 'Postagens prontas para suas redes', texto: 'Vídeos e textos para publicar nas suas redes sociais, com legenda.', href: '/portal/central', icone: 'megafone', area: 'central' },
  { titulo: 'Simular a entrada do cliente', texto: 'Informe a entrada e as parcelas. O portal faz as contas e imprime a proposta.', href: '/portal/simulador', icone: 'calculadora', area: 'simulador' },
];

const PASSOS_CORRETOR: readonly string[] = [
  'Toque em um dos cartões coloridos abaixo para ir direto ao que você precisa.',
  'Na Central, escolha o empreendimento e use Copiar para passar o CNPJ ou o PIX ao cliente.',
  'Ficou com dúvida? A página de ajuda explica cada área e responde às perguntas mais comuns.',
];

export default function InicioCorretor({ nome }: { nome: string }) {
  const primeiroNome = nome.trim().split(/\s+/)[0] || nome;
  const empreendimentos = listarEmpreendimentos();

  return (
    <section className="r81-dashboard r84i-inicio r84c-inicio" aria-label="Início do corretor">
      <CabecalhoPagina
        area="inicio"
        icone="inicio"
        titulo={`Olá, ${primeiroNome}!`}
        descricao="Tudo o que você precisa para vender os empreendimentos Rocha."
      />

      <AjudaPagina id="inicio-corretor" passos={PASSOS_CORRETOR} />

      <section className="r84c-secao" aria-labelledby="r84c-acoes-titulo">
        <h2 id="r84c-acoes-titulo">O que você quer fazer?</h2>
        <div className="r84c-acoes">
          {ACOES.map((acao) => (
            <Link key={acao.titulo} href={acao.href} className="r84-cartao r84c-acao" data-area={acao.area}>
              <span className="r84-icone-bloco r84-icone-bloco-cheio r84c-acao-icone" aria-hidden="true">
                <Icone nome={acao.icone} tamanho={28} />
              </span>
              <strong>{acao.titulo}</strong>
              <small>{acao.texto}</small>
              <span className="r84c-acao-cta">
                Abrir <Icone nome="setaDireita" tamanho={18} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <div className="r81-section-heading">
        <div>
          <h2>Empreendimentos</h2>
          <p>Escolha um empreendimento para ver CNPJ, PIX e materiais.</p>
        </div>
        <Link href="/portal/central">Abrir a Central <Icone nome="setaDireita" tamanho={17} /></Link>
      </div>

      {empreendimentos.length === 0 ? (
        <div className="r81-empty-project">Ainda não há empreendimentos na Central.</div>
      ) : (
        <div className="r81-project-grid">
          {empreendimentos.map((emp, indice) => (
            <Link key={emp.id} href={`/portal/central/${emp.id}`} className="r84-cartao r84-cartao-clicavel r81-project r84i-projeto" data-area="central">
              <div className="r81-project-image" style={{ backgroundColor: CORES_CAPA[indice % CORES_CAPA.length] }}>
                <span className="r84i-capa-status">{emp.status}</span>
                <Icone nome="predio" tamanho={56} />
              </div>
              <div className="r81-project-body">
                <h3>{emp.nome}</h3>
                <p>{emp.bairro} · {emp.cidade}</p>
                <span className="r84i-projeto-cta">Abrir na Central <Icone nome="setaDireita" tamanho={16} /></span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Link href="/portal/ajuda" className="r84c-ajuda" data-area="ajuda">
        <span className="r84-icone-bloco" aria-hidden="true"><Icone nome="ajuda" tamanho={22} /></span>
        <span className="r84c-ajuda-texto">
          <strong>Ficou com alguma dúvida?</strong>
          <small>A página de ajuda explica cada área e responde às perguntas mais comuns.</small>
        </span>
        <span className="r84c-ajuda-cta">Ir para a ajuda <Icone nome="setaDireita" tamanho={18} /></span>
      </Link>
    </section>
  );
}
