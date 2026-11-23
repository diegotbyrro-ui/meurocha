import type { Metadata } from 'next';
import AnotacoesClient from './AnotacoesClient';
import './anotacoes.css';

export const metadata: Metadata = {
  title: 'Anotações | Easy Rota do Mar | Rocha Empreendimentos',
  description: 'Marque pontos com setas e escreva observações sobre plantas e imagens do Easy Rota do Mar.',
  robots: { index: false, follow: false, nocache: true },
};

type Params = { imagem?: string | string[]; titulo?: string | string[]; modo?: string | string[] };

const primeiro = (valor: string | string[] | undefined): string =>
  typeof valor === 'string' ? valor : (Array.isArray(valor) ? valor[0] || '' : '');

export default async function PaginaAnotacoes({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  return <AnotacoesClient
    imagemInicial={primeiro(params.imagem)}
    tituloInicial={primeiro(params.titulo)}
    veioDo3D={primeiro(params.modo) === '3d'}
  />;
}
