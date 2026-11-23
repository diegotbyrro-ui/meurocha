import './ajuda.css';
import Link from 'next/link';
import AjudaPagina from './AjudaPagina';
import BuscaAjuda from './BuscaAjuda';
import Icone, {type NomeIcone} from '../ui/Icone';
import CabecalhoPagina from '../ui/CabecalhoPagina';
import {GLOSSARIO} from '@/lib/portal-glossario.mjs';

export const dynamic = 'force-dynamic';

type AreaAjuda = {href: string; area: string; icone: NomeIcone; nome: string; uso: string};

const areas: AreaAjuda[] = [
  {
    href: '/portal',
    area: 'inicio',
    icone: 'inicio',
    nome: 'Início',
    uso: 'Use quando quiser começar pelo painel geral e chegar às demais áreas.',
  },
  {
    href: '/portal/central',
    area: 'central',
    icone: 'predio',
    nome: 'Central dos empreendimentos',
    uso: 'Use quando precisar do CNPJ, da chave PIX, dos materiais ou dos vídeos e postagens prontos para as redes sociais.',
  },
  {
    href: '/portal/simulador',
    area: 'simulador',
    icone: 'calculadora',
    nome: 'Simulador de entrada',
    uso: 'Use quando precisar calcular a entrada e as parcelas para um cliente.',
  },
  {
    href: '/portal/atualizar',
    area: 'atualizar',
    icone: 'editar',
    nome: 'Atualizar conteúdo',
    uso: 'Use quando precisar cadastrar ou trocar o CNPJ, a chave PIX ou os links de um empreendimento.',
  },
  {
    href: '/portal/biblioteca',
    area: 'biblioteca',
    icone: 'pasta',
    nome: 'Biblioteca de arquivos',
    uso: 'Use quando quiser organizar ou abrir arquivos. Eles ficam guardados só neste navegador.',
  },
  {
    href: '/portal/tarefas',
    area: 'tarefas',
    icone: 'tarefas',
    nome: 'Tarefas da equipe',
    uso: 'Use quando precisar ver o que a equipe tem para fazer e quem está responsável por cada item. As tarefas são compartilhadas pelo portal, então a equipe vê as mesmas.',
  },
  {
    href: '/portal/gestao',
    area: 'cadastro',
    icone: 'cadastro',
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
    pergunta: 'Como o corretor entra no portal?',
    resposta: 'Digite o número do seu CRECI, escolha a UF em que ele está registrado e clique em Entrar. O corretor não usa senha. Na primeira vez, o portal pede seu nome e WhatsApp uma única vez. Se o CRECI aparecer como bloqueado, fale com a equipe Rocha.',
  },
  {
    pergunta: 'Como cadastro alguém da equipe?',
    resposta: 'Abra a tela Equipe Rocha no menu e cadastre a pessoa com o e-mail dela. Ela entra com e-mail e senha. Quem estiver inativo não pode receber tarefas.',
  },
  {
    pergunta: 'Como bloqueio um corretor?',
    resposta: 'Abra a tela Corretores, encontre o corretor pelo nome ou pelo CRECI e escolha Bloquear. Um corretor bloqueado não consegue entrar no portal. Para liberar o acesso de novo, abra o mesmo cadastro e escolha Desbloquear.',
  },
  {
    pergunta: 'Como crio ou excluo colunas no quadro de tarefas?',
    resposta: 'As colunas são as etapas do quadro, como A fazer, Em andamento e Concluída. Quem faz parte da equipe Rocha pode criar, editar ou excluir colunas. Ao criar uma coluna, marque se ela conta como concluída: as tarefas nela deixam de aparecer em Minhas tarefas.',
  },
  {
    pergunta: 'Como peço acesso ao portal?',
    resposta: 'Corretores entram com o CRECI e a UF, sem senha. Para a equipe Rocha, o acesso é criado por quem administra o portal, com e-mail e senha. Se você ainda não tem acesso, peça ao seu contato na Rocha.',
  },
  {
    pergunta: 'Posso ver a ajuda de novo depois de escondê-la?',
    resposta: 'Sim. Quando a ajuda estiver escondida, clique em "Mostrar ajuda desta página", no topo da página.',
  },
];

const glossarioOrdenado = Object.entries(GLOSSARIO)
  .map(([id, entrada]) => ({id, termo: entrada.termo, definicao: entrada.definicao}))
  .sort((a, b) => a.termo.localeCompare(b.termo, 'pt-BR'));

/** Cada pergunta vira um details pronto; a busca so esconde ou mostra, sem refazer o texto. */
const itensFaq = perguntas.map((item) => ({
  chave: item.pergunta,
  busca: `${item.pergunta} ${item.resposta}`,
  node: (
    <details className="r83a-faq-item">
      <summary className="r83a-faq-pergunta">
        <span>{item.pergunta}</span>
        <Icone nome="chevron" tamanho={18} className="r83a-chevron" />
      </summary>
      <p className="r83a-faq-resposta">{item.resposta}</p>
    </details>
  ),
}));

export default function AjudaPaginaRota() {
  return (
    <main className="r83a-pagina">
      <CabecalhoPagina
        area="ajuda"
        icone="ajuda"
        titulo="Ajuda do portal"
        descricao="Explica cada área do portal, responde às dúvidas mais comuns e define os termos usados nas telas."
      />

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
              <Link href={area.href} className="r84-cartao r83a-area" data-area={area.area}>
                <span className="r84-icone-bloco r84-icone-bloco-lg" aria-hidden="true">
                  <Icone nome={area.icone} tamanho={26} />
                </span>
                <span className="r83a-cartao-titulo">{area.nome}</span>
                <span className="r83a-cartao-texto">{area.uso}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <BuscaAjuda
        faq={itensFaq}
        glossario={glossarioOrdenado}
        tituloFaq="Perguntas frequentes"
        tituloGlossario="Glossário"
      />
    </main>
  );
}
