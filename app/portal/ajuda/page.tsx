import './ajuda.css';
import Link from 'next/link';
import AjudaPagina from './AjudaPagina';
import {GLOSSARIO} from '@/lib/portal-glossario.mjs';

export const dynamic = 'force-dynamic';

const areas = [
  {
    href: '/portal',
    nome: 'Início',
    uso: 'Use quando quiser começar pelo painel geral e chegar às demais áreas.',
  },
  {
    href: '/portal/central',
    nome: 'Central dos empreendimentos',
    uso: 'Use quando precisar do CNPJ, da chave PIX, dos materiais ou dos vídeos e postagens prontos para as redes sociais.',
  },
  {
    href: '/portal/simulador',
    nome: 'Simulador de entrada',
    uso: 'Use quando precisar calcular a entrada e as parcelas para um cliente.',
  },
  {
    href: '/portal/atualizar',
    nome: 'Atualizar conteúdo',
    uso: 'Use quando precisar cadastrar ou trocar o CNPJ, a chave PIX ou os links de um empreendimento.',
  },
  {
    href: '/portal/biblioteca',
    nome: 'Biblioteca de arquivos',
    uso: 'Use quando quiser organizar ou abrir arquivos. Eles ficam guardados só neste navegador.',
  },
  {
    href: '/portal/tarefas',
    nome: 'Tarefas da equipe',
    uso: 'Use quando precisar ver o que a equipe tem para fazer e quem está responsável por cada item.',
  },
  {
    href: '/portal/gestao',
    nome: 'Cadastro de empreendimentos',
    uso: 'Use quando precisar cadastrar um empreendimento novo ou deixar um rascunho para terminar depois.',
  },
];

const perguntas = [
  {
    pergunta: 'Como copio a chave PIX de um empreendimento?',
    resposta: 'Abra a Central dos empreendimentos, escolha o empreendimento e clique em Copiar chave PIX. Depois, cole a chave no app do banco ou envie ao cliente.',
  },
  {
    pergunta: 'Por que um material não aparece?',
    resposta: 'Confira se o arquivo está na categoria certa da Biblioteca e se o link foi salvo em Atualizar conteúdo. Categorias de uso interno não aparecem para corretores. Se mesmo assim o material não aparecer, avise a equipe.',
  },
  {
    pergunta: 'Como monto uma proposta no simulador?',
    resposta: 'Abra o Simulador de entrada e escolha o empreendimento. Informe o valor da entrada e as condições de pagamento, confira o resumo do plano e só então imprima ou envie a proposta.',
  },
  {
    pergunta: 'O que significam "Plano conciliado", "Faltam" e "Excede"?',
    resposta: '"Plano conciliado" quer dizer que a soma das parcelas bate exatamente com o valor da entrada. "Faltam" mostra quanto ainda precisa entrar no plano. "Excede" indica que o plano passou do valor da entrada e precisa de ajuste.',
  },
  {
    pergunta: 'Quem pode ver os arquivos da Biblioteca?',
    resposta: 'Os arquivos ficam guardados apenas no navegador onde foram enviados, então outras pessoas e outros computadores não os veem. Cada categoria mostra se é "Interno Rocha" ou "Previsto para corretor".',
  },
  {
    pergunta: 'Como baixo uma postagem ou vídeo para publicar nas minhas redes?',
    resposta: 'Abra a Central dos empreendimentos e escolha o empreendimento. Em Redes sociais, todas as postagens ficam em uma lista só. Use os filtros por tipo, clique em Abrir (nova aba) e baixe o arquivo, ou clique em Copiar link. Antes de publicar, confira se a legenda e o contato são os seus.',
  },
  {
    pergunta: 'Como peço acesso ao portal?',
    resposta: 'A equipe entra com a senha de acesso da equipe, que é repassada pelo responsável pelo portal. Quem ainda não tem a senha deve pedi-la ao seu contato na Rocha.',
  },
  {
    pergunta: 'Posso ver a ajuda de novo depois de escondê-la?',
    resposta: 'Sim. Quando a ajuda estiver escondida, clique em "Mostrar ajuda desta página", no topo da página.',
  },
];

const glossarioOrdenado = Object.entries(GLOSSARIO).sort(([, a], [, b]) =>
  a.termo.localeCompare(b.termo, 'pt-BR'),
);

export default function AjudaPaginaRota() {
  return (
    <main className="r83a-pagina">
      <header className="r83a-cabecalho">
        <h1 className="r83a-titulo">Ajuda do portal</h1>
        <p className="r83a-intro">
          Explica cada área do portal, responde às dúvidas mais comuns e define os termos usados nas telas.
        </p>
      </header>

      <AjudaPagina
        id="ajuda"
        passos={[
          'Escolha uma área na lista abaixo ou no menu lateral.',
          'Leia a frase "Use quando" para confirmar se é a tela que você precisa.',
          'Clique no "?" ao lado de um termo para ver a explicação. Use "Entendi, esconder ajuda" para fechar este painel.',
        ]}
      />

      <section className="r83a-secao" aria-labelledby="r83a-secao-areas">
        <h2 id="r83a-secao-areas" className="r83a-secao-titulo">Para que serve cada área</h2>
        <ul className="r83a-cartoes">
          {areas.map((area) => (
            <li key={area.href}>
              <Link href={area.href} className="r83a-cartao">
                <span className="r83a-cartao-titulo">{area.nome}</span>
                <span className="r83a-cartao-texto">{area.uso}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="r83a-secao" aria-labelledby="r83a-secao-faq">
        <h2 id="r83a-secao-faq" className="r83a-secao-titulo">Perguntas frequentes</h2>
        <div className="r83a-faq">
          {perguntas.map((item) => (
            <details key={item.pergunta} className="r83a-faq-item">
              <summary className="r83a-faq-pergunta">{item.pergunta}</summary>
              <p className="r83a-faq-resposta">{item.resposta}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="r83a-secao" aria-labelledby="r83a-secao-glossario">
        <h2 id="r83a-secao-glossario" className="r83a-secao-titulo">Glossário</h2>
        <dl className="r83a-glossario">
          {glossarioOrdenado.map(([id, entrada]) => (
            <div key={id} className="r83a-glossario-item">
              <dt className="r83a-glossario-termo">{entrada.termo}</dt>
              <dd className="r83a-glossario-definicao">{entrada.definicao}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
