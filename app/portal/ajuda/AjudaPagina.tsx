'use client';

import './componentes.css';
import {useEffect, useId, useState} from 'react';
import Icone from '../ui/Icone';

type Props = {
  id: string;
  titulo?: string;
  passos: readonly string[];
};

const chaveArmazenamento = (id: string) => `rocha-ajuda-${id}`;

/**
 * Painel "Como usar esta pagina" com passos numerados.
 * Pode ser escondido pelo usuario; a escolha fica salva neste navegador.
 */
export default function AjudaPagina({id, titulo = 'Como usar esta página', passos}: Props) {
  // Comeca visivel no servidor e na primeira renderizacao para evitar diferenca de hidratacao.
  const [visivel, setVisivel] = useState(true);
  const tituloId = useId();

  useEffect(() => {
    try {
      if (window.localStorage.getItem(chaveArmazenamento(id)) === 'oculta') {
        setVisivel(false);
      }
    } catch {
      // Navegador sem acesso ao armazenamento: a ajuda continua visivel.
    }
  }, [id]);

  function esconder() {
    setVisivel(false);
    try {
      window.localStorage.setItem(chaveArmazenamento(id), 'oculta');
    } catch {
      // Sem armazenamento, a escolha vale apenas para esta visita.
    }
  }

  function mostrar() {
    setVisivel(true);
    try {
      window.localStorage.removeItem(chaveArmazenamento(id));
    } catch {
      // Sem armazenamento, nada a remover.
    }
  }

  if (!visivel) {
    return (
      <div className="r83a-ajuda-mini" data-area="ajuda">
        <button type="button" className="r83a-botao-discreto" onClick={mostrar}>
          <Icone nome="dica" tamanho={18} />
          Mostrar ajuda desta página
        </button>
      </div>
    );
  }

  return (
    <section className="r83a-ajuda" aria-labelledby={tituloId} data-area="ajuda">
      <div className="r83a-ajuda-cabecalho">
        <div className="r83a-ajuda-titulo-linha">
          <span className="r84-icone-bloco" aria-hidden="true">
            <Icone nome="dica" tamanho={22} />
          </span>
          <h2 id={tituloId} className="r83a-ajuda-titulo">{titulo}</h2>
        </div>
        <button type="button" className="r83a-botao" onClick={esconder}>
          <Icone nome="fechar" tamanho={18} />
          Entendi, esconder ajuda
        </button>
      </div>
      <ol className="r83a-ajuda-passos">
        {passos.map((passo, indice) => (
          <li key={indice} className="r83a-ajuda-passo">
            <span className="r83a-ajuda-numero" aria-hidden="true">{indice + 1}</span>
            <span>{passo}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
