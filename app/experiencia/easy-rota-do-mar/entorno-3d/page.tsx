import type { Metadata } from 'next';
import Entorno3DFrame from './Entorno3DFrame';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Entorno 3D | Easy Rota do Mar — Rocha Empreendimentos',
  description: 'Entorno tridimensional interativo, pontos GPS e fotos reais do drone.',
  robots: { index: false, follow: false, nocache: true },
};

type Site = { lat: number; lng: number; altitude: number };
function validCoordinate(value: string | undefined, min: number, max: number): number | null {
  if (!value || !/^-?\d+(?:\.\d+)?$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

export default function Entorno3DPage() {
  // Uma chave do navegador e publica por natureza. Restrinja-a por referer/domino
  // e exclusivamente a Maps JavaScript API no Google Cloud Console.
  const key = process.env.ROCHA_GOOGLE_MAPS_BROWSER_KEY?.trim() ?? '';
  const lat = validCoordinate(process.env.ROCHA_ENTORNO3D_SITE_LAT, -9.8, -9.3);
  const lng = validCoordinate(process.env.ROCHA_ENTORNO3D_SITE_LNG, -36, -35.4);
  const altitude = validCoordinate(process.env.ROCHA_ENTORNO3D_SITE_ALTITUDE, -100, 1000) ?? 60;
  const confirmed = process.env.ROCHA_ENTORNO3D_SITE_CONFIRMED === 'true' && lat !== null && lng !== null;
  const site: Site | null = confirmed ? { lat: lat!, lng: lng!, altitude } : null;
  return <Entorno3DFrame apiKey={key} confirmed={confirmed} site={site} />;
}
