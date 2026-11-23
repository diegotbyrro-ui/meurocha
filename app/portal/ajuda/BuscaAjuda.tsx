'use client';

import {Fragment, useId, useMemo, useState, type ReactNode} from 'react';
import Icone from '../ui/Icone';

/** Pergunta do FAQ: o texto de busca e o no ja pronto (details) vindo do servidor. */
export type ItemFaq = {chave: string; busca: string; node: ReactNode};
export type TermoGlossario = {id: string; termo: string; definicao: string};

type Props = {
  faq: readonly ItemFaq[];
  glossario: readonly TermoGlossario[];
  tituloFaq: string;
  tituloGlossario: string;
};

/** Minusculas e sem acento, para a busca achar "conciliação" digitando "conciliacao". */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Primeira letra A-Z do termo; o que nao for letra vai para "#". */
function letraDe(termo: string): string {
  const base = termo.normalize('NFD').replace(/[̀-ͯ]/g, '').charAt(0).toUpperCase();
  return /[A-Z]/.test(base) ? base : '#';
}

/** Busca ao vivo em perguntas frequentes e termos do glossario. */
export default function BuscaAjuda({faq, glossario, tituloFaq, tituloGlossario}: Props) {
  const [texto, setTexto] = useState('');
  const idBusca = useId();
  const busca = normalizar(texto);
  const comBusca = busca !== '';

  const faqFiltrada = useMemo(
    () => (comBusca ? faq.filter((item) => normalizar(item.busca).includes(busca)) : faq),
    [faq, busca, comBusca],
  );

  const glossarioFiltrado = useMemo(
    () =>
      comBusca
        ? glossario.filter((t) => normalizar(`${t.termo} ${t.definicao}`).includes(busca))
        : glossario,
    [glossario, busca, comBusca],
  );

  // Agrupa por letra; so aparecem as letras que tem termo na lista atual.
  const grupos = useMemo(() => {
    const mapa = new Map<string, TermoGlossario[]>();
    for (const t of glossarioFiltrado) {
      const letra = letraDe(t.termo);
      mapa.set(letra, [...(mapa.get(letra) ?? []), t]);
    }
    return [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b, 'pt-BR'));
  }, [glossarioFiltrado]);

  const total = faqFiltrada.length + glossarioFiltrado.length;
  const resumo = !comBusca
    ? ''
    : total === 0
      ? `Nenhum resultado para “${texto.trim()}”. Tente outra palavra ou use o botão Limpar.`
      : `${total} ${total === 1 ? 'resultado' : 'resultados'} para “${texto.trim()}”.`;

  return (
    <div className="r83a-busca-area" data-area="ajuda">
      <div className="r83a-busca">
        <label htmlFor={idBusca} className="r83a-busca-rotulo">Buscar uma dúvida</label>
        <div className="r83a-busca-campo">
          <Icone nome="busca" tamanho={20} className="r83a-busca-icone" />
          <input
            id={idBusca}
            type="search"
            autoComplete="off"
            placeholder="Ex.: PIX, postagem, entrada"
            value={texto}
            onChange={(ev) => setTexto(ev.target.value)}
            aria-describedby={`${idBusca}-resumo`}
          />
          {comBusca && (
            <button type="button" className="r83a-botao-discreto" onClick={() => setTexto('')}>
              <Icone nome="fechar" tamanho={16} />
              Limpar
            </button>
          )}
        </div>
        <p id={`${idBusca}-resumo`} className="r83a-busca-resumo" role="status">{resumo}</p>
      </div>

      <section className="r83a-secao">
        <h2 className="r83a-secao-titulo">{tituloFaq}</h2>
        {faqFiltrada.length > 0 ? (
          <div className="r83a-faq">
            {faqFiltrada.map((item) => (
              <Fragment key={item.chave}>{item.node}</Fragment>
            ))}
          </div>
        ) : (
          <p className="r83a-vazio">Nenhuma pergunta combina com a busca. Tente outra palavra ou fale com a equipe na Rocha.</p>
        )}
      </section>

      <section className="r83a-secao">
        <h2 className="r83a-secao-titulo">{tituloGlossario}</h2>
        {grupos.length > 0 ? (
          <>
            <nav className="r83a-letras" aria-label="Ir para a letra">
              <ul>
                {grupos.map(([letra]) => (
                  <li key={letra}>
                    <a href={`#glossario-${letra}`}>{letra}</a>
                  </li>
                ))}
              </ul>
            </nav>
            {grupos.map(([letra, itens]) => (
              <section key={letra} id={`glossario-${letra}`} className="r83a-letra">
                <h3 className="r83a-letra-titulo">{letra}</h3>
                <dl className="r83a-glossario">
                  {itens.map((t) => (
                    <div key={t.id} className="r83a-glossario-item">
                      <dt className="r83a-glossario-termo">{t.termo}</dt>
                      <dd className="r83a-glossario-definicao">{t.definicao}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </>
        ) : (
          <p className="r83a-vazio">Nenhum termo do glossário combina com a busca.</p>
        )}
      </section>
    </div>
  );
}
