import type { ReactNode } from 'react';
import Icone, { type NomeIcone } from './Icone';

export type AreaPortal = 'inicio' | 'central' | 'simulador' | 'tarefas' | 'atualizar' | 'biblioteca' | 'cadastro' | 'ajuda';

// R84: cabeçalho padrão de página. Faixa escura da marca com a diagonal do "R" da Rocha,
// ícone na cor da área e espaço para ações à direita.
export default function CabecalhoPagina({ area, icone, titulo, descricao, children, antes }: {
  area: AreaPortal;
  icone: NomeIcone;
  titulo: string;
  descricao?: ReactNode;
  children?: ReactNode;
  antes?: ReactNode;
}) {
  return <header className="r84-cabecalho" data-area={area}>
    <div className="r84-cabecalho-texto">
      {antes ? <div className="r84-cabecalho-antes">{antes}</div> : null}
      <div className="r84-cabecalho-titulo">
        <span className="r84-icone-bloco r84-icone-bloco-lg" aria-hidden="true"><Icone nome={icone} tamanho={26} /></span>
        <h1>{titulo}</h1>
      </div>
      {descricao ? <p>{descricao}</p> : null}
    </div>
    {children ? <div className="r84-cabecalho-acoes">{children}</div> : null}
  </header>;
}
