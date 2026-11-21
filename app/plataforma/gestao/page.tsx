import type { Metadata } from 'next';
import GestaoClient from './GestaoClient';
import './gestao.css';

export const metadata: Metadata = {
  title: 'Gestão de acervo | Plataforma Rocha',
  robots: { index: false, follow: false, nocache: true },
};
export const dynamic = 'force-dynamic';

export default function GestaoAcervo() {
  // Defesa adicional a do layout: nao montar interface administrativa em producao.
  const modoPrevia = process.env.NODE_ENV !== 'production' && process.env.ROCHA_PREVIEW_MODE === 'true';
  if (!modoPrevia) {
    return <main className="gestao-indisponivel"><h1>Área restrita</h1>
      <p>Esta gestão exige autenticação real e permissões conferidas no servidor. Nenhum cadastro ou upload é aceito neste ambiente.</p></main>;
  }
  return <GestaoClient />;
}
