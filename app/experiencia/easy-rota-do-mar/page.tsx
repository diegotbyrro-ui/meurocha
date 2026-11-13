import type { Metadata } from 'next';
import EasyRotaClient from './EasyRotaClient';
import './easy-rota.css';

export const metadata: Metadata = {
  title: 'Easy Rota do Mar | Experiência Imobiliária — Homologação Rocha',
  description: 'Apresentação imobiliária navegável do Easy Rota do Mar, baseada na referência em vídeo para validação da Rocha Empreendimentos.',
  robots: { index: false, follow: false, nocache: true },
};

export default function EasyRotaDoMarHomologacao() {
  return <EasyRotaClient />;
}
