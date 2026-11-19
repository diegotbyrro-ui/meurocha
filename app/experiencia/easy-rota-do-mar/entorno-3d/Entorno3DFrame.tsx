'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from './entorno3d.module.css';

type Site = { lat: number; lng: number; altitude: number };
type Props = { apiKey: string; confirmed: boolean; site: Site | null };
const base = '/experiencia/easy-rota-do-mar';
const iframeSource = base + '/entorno3d/index.html';

export default function Entorno3DFrame({ apiKey, confirmed, site }: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [bridgeIssue, setBridgeIssue] = useState(false);
  const [embedded, setEmbedded] = useState(false);
  useEffect(() => { setEmbedded(window.parent !== window); }, []);
  const sendConfig = useCallback(() => {
    // Chave de navegador restrita por referer/API; nunca registrar o valor em logs.
    frameRef.current?.contentWindow?.postMessage({
      type: 'ROCHA_ENTORNO3D_CONFIG', key: apiKey, confirmed, site,
    }, window.location.origin);
  }, [apiKey, confirmed, site]);

  useEffect(() => {
    let acknowledged = false;
    let attempts = 0;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type === 'ROCHA_ENTORNO3D_READY') sendConfig();
      if (event.data?.type === 'ROCHA_ENTORNO3D_CONFIG_ACK') {
        acknowledged = true;
        setBridgeIssue(false);
      }
    };
    window.addEventListener('message', onMessage);
    // READY e onLoad podem acontecer antes da hidratacao React.
    // Repetir ate o iframe CONFIRMAR recebimento; nunca duplicar a API Maps.
    sendConfig();
    const retry = window.setInterval(() => {
      if (acknowledged) { window.clearInterval(retry); return; }
      attempts += 1;
      if (attempts >= 24) {
        window.clearInterval(retry);
        setBridgeIssue(true);
        return;
      }
      sendConfig();
    }, 750);
    return () => {
      window.clearInterval(retry);
      window.removeEventListener('message', onMessage);
    };
  }, [sendConfig]);

  return <div className={`${styles.page} ${embedded ? styles.embedded : ''}`}>
    <header className={styles.toolbar}>
      <Link className={styles.back} href={base} aria-label="Voltar à plataforma Easy Rota do Mar">← Voltar à plataforma</Link>
      <span className={styles.title}>ROCHA EMPREENDIMENTOS <b>· ENTORNO 3D</b></span>
      <span className={styles.note}>16 pontos GPS · 39 fotos do drone</span>
    </header>
    {(!apiKey || !confirmed) && <div className={styles.environmentNotice} role="alert">
      {!apiKey ? 'Chave Google Maps não configurada no ambiente desta implantação. Configure ROCHA_GOOGLE_MAPS_BROWSER_KEY no servidor.' : 'Coordenadas do terreno ainda não confirmadas no ambiente da plataforma.'}
    </div>}
    {bridgeIssue && <div className={styles.bridgeIssue} role="alert">
      O mapa foi aberto, mas o iframe não confirmou a configuração da plataforma.
      Reinicie o Next.js e atualize a página. Nenhuma chave deve ser compartilhada.
      <button type="button" onClick={() => window.location.reload()}>Recarregar mapa 3D</button>
    </div>}
    <iframe ref={frameRef} className={styles.frame} src={iframeSource} onLoad={sendConfig}
      title="Mapa tridimensional Easy Rota do Mar — Google Maps e fotografias reais"
      referrerPolicy="strict-origin-when-cross-origin" allow="fullscreen" />
  </div>;
}
