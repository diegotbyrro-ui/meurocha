import type { Metadata } from 'next';
import EasyRotaClient from './EasyRotaClient';
import './easy-rota.css';

export const metadata: Metadata = {
  title: 'Easy Rota do Mar | Experiência Interativa — Modelo 3 | Rocha',
  description: 'Experiência interativa do Easy Rota do Mar no visual Modelo 3, com navegação modular e identidade azul-ciano para homologação da Rocha.',
  robots: { index: false, follow: false, nocache: true },
};

export default function EasyRotaDoMarHomologacao() {
  return <EasyRotaClient />;
}
