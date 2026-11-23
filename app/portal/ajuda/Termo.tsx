'use client';

import './componentes.css';
import type {ReactNode} from 'react';
import {useEffect, useId, useRef, useState} from 'react';
import {obterTermo} from '@/lib/portal-glossario.mjs';

type Props = {
  id: string;
  children?: ReactNode;
};

/**
 * Mostra um termo tecnico seguido de um "?" que abre a explicacao do glossario.
 * Id desconhecido: renderiza apenas o conteudo recebido.
 */
export default function Termo({id, children}: Props) {
  const entrada = obterTermo(id);
  const [aberto, setAberto] = useState(false);
  const reactId = useId();
  const botaoRef = useRef<HTMLButtonElement>(null);
  const raizRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!aberto) return;

    function aoClicarFora(evento: MouseEvent) {
      const raiz = raizRef.current;
      if (raiz && evento.target instanceof Node && !raiz.contains(evento.target)) {
        setAberto(false);
      }
    }

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        setAberto(false);
        botaoRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', aoClicarFora);
    document.addEventListener('keydown', aoTeclar);
    return () => {
      document.removeEventListener('mousedown', aoClicarFora);
      document.removeEventListener('keydown', aoTeclar);
    };
  }, [aberto]);

  if (!entrada) {
    return <>{children}</>;
  }

  const painelId = `r83a-termo-painel-${reactId}`;

  return (
    <span className="r83a-termo" ref={raizRef}>
      {children ?? entrada.termo}
      <button
        ref={botaoRef}
        type="button"
        className="r83a-termo-botao"
        aria-label={`O que é ${entrada.termo}?`}
        aria-expanded={aberto}
        aria-controls={painelId}
        onClick={() => setAberto((valor) => !valor)}
      >
        ?
      </button>
      {aberto ? (
        <span id={painelId} role="dialog" aria-label={entrada.termo} className="r83a-popover">
          <strong className="r83a-popover-titulo">{entrada.termo}</strong>
          <span className="r83a-popover-texto">{entrada.definicao}</span>
          <button
            type="button"
            className="r83a-popover-fechar"
            onClick={() => {
              setAberto(false);
              botaoRef.current?.focus();
            }}
          >
            Fechar
          </button>
        </span>
      ) : null}
    </span>
  );
}
