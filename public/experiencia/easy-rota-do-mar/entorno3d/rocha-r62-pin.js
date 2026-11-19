/* Rocha R63: pin georreferenciado do empreendimento, usando a marca oficial.
   A maquete R61 permanece arquivada, mas nao e exibida nesta versao.
   O SITE e recebido do Next.js e nao e inferido dos pontos de captura do drone. */
(function () {
  'use strict';

  const BRAND_URL = '/experiencia/easy-rota-do-mar/erm-logo-transparente.png';
  const STORAGE_KEY = 'rocha-r62-pin-offset-v7';
  // R63: centralizado no terreno (seta do usuario, ~25 m a oeste da R62 R9).
  const DEFAULT_OFFSET = { north: -259, east: -395 };
  const MAX_OFFSET_METERS = 600;
  const PIN_ALTITUDE = 18;
  let marker = null;

  function clamp(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(-MAX_OFFSET_METERS, Math.min(MAX_OFFSET_METERS, number)) : 0;
  }

  function readOffset() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (value && Number.isFinite(value.north) && Number.isFinite(value.east)) {
        return { north: clamp(value.north), east: clamp(value.east) };
      }
    } catch (_) { /* armazenamento desativado */ }
    return { ...DEFAULT_OFFSET };
  }

  function isAdjustMode() {
    try {
      if (new URLSearchParams(location.search).get('ajustepino') === '1') return true;
      if (window.top && window.top !== window) {
        return new URLSearchParams(window.top.location.search).get('ajustepino') === '1';
      }
    } catch (_) { /* frame com restricao */ }
    return false;
  }

  function coordinates(site, offset) {
    const lat = site.lat + offset.north / 111320;
    return {
      lat,
      lng: site.lng + offset.east / (111320 * Math.cos(lat * Math.PI / 180))
    };
  }

  /* R62 R8: gota azul redesenhada (contorno simetrico, sem o recorte lateral da R7),
     cabeca maior, logo oficial ampliada e renderizacao em 2x para ficar nitida. */
  async function brandedPinImage() {
    const W = 360;
    const H = 480;
    // R63: o Marker3D exibe a imagem no tamanho NATURAL; 0.45 deixa o pino com ~162x216 px.
    const SCALE = 0.45;
    const canvas = document.createElement('canvas');
    canvas.width = W * SCALE;
    canvas.height = H * SCALE;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D indisponivel');
    ctx.scale(SCALE, SCALE);

    const centerX = 180;
    const centerY = 168;
    const headRadius = 122;
    const tipY = 438;
    const discRadius = 98;
    const tangent = Math.acos(headRadius / (tipY - centerY));
    const leftAngle = Math.PI / 2 + tangent;
    const rightAngle = Math.PI / 2 - tangent;
    const point = (angle) => ({ x: centerX + headRadius * Math.cos(angle), y: centerY + headRadius * Math.sin(angle) });

    function drawPinBody() {
      const right = point(rightAngle);
      ctx.beginPath();
      ctx.moveTo(centerX, tipY);
      ctx.quadraticCurveTo(centerX + 18, tipY - 40, right.x, right.y);
      ctx.arc(centerX, centerY, headRadius, rightAngle, leftAngle, true);
      ctx.quadraticCurveTo(centerX - 18, tipY - 40, centerX, tipY);
      ctx.closePath();
    }

    const halo = ctx.createRadialGradient(centerX, 452, 4, centerX, 452, 120);
    halo.addColorStop(0, 'rgba(49, 232, 255, 0.75)');
    halo.addColorStop(0.45, 'rgba(0, 200, 240, 0.28)');
    halo.addColorStop(1, 'rgba(0, 200, 240, 0)');
    ctx.save();
    ctx.translate(centerX, 452);
    ctx.scale(1, 0.2);
    ctx.translate(-centerX, -452);
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(centerX, 452, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.shadowColor = 'rgba(0, 18, 30, 0.55)';
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 10;
    drawPinBody();
    const body = ctx.createLinearGradient(60, 40, 300, 440);
    body.addColorStop(0, '#0a4a72');
    body.addColorStop(0.55, '#06385a');
    body.addColorStop(1, '#0b8fb4');
    ctx.fillStyle = body;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.shadowColor = 'rgba(49, 232, 255, 0.85)';
    ctx.shadowBlur = 18;
    drawPinBody();
    ctx.lineJoin = 'round';
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#3ae9ff';
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(centerX, centerY, discRadius, 0, Math.PI * 2);
    const disc = ctx.createRadialGradient(centerX - 24, centerY - 34, 10, centerX, centerY, discRadius);
    disc.addColorStop(0, '#0d5f8e');
    disc.addColorStop(1, '#031a2e');
    ctx.fillStyle = disc;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(160, 248, 255, 0.95)';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(centerX, centerY, discRadius + 7, 0, Math.PI * 2);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(58, 233, 255, 0.45)';
    ctx.stroke();

    let hasLogo = false;
    try {
      const logo = new Image();
      logo.decoding = 'async';
      logo.src = BRAND_URL;
      await new Promise((resolve, reject) => {
        logo.onload = resolve;
        logo.onerror = reject;
        if (logo.complete && logo.naturalWidth) resolve();
      });
      if (logo.naturalWidth && logo.naturalHeight) {
        const scale = Math.min(176 / logo.naturalWidth, 60 / logo.naturalHeight);
        const width = logo.naturalWidth * scale;
        const height = logo.naturalHeight * scale;
        ctx.save();
        ctx.shadowColor = 'rgba(0, 10, 20, 0.6)';
        ctx.shadowBlur = 6;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(logo, centerX - width / 2, centerY - height / 2, width, height);
        ctx.restore();
        hasLogo = true;
      }
    } catch (_) { /* contingencia */ }

    if (!hasLogo) {
      ctx.fillStyle = '#eafcff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 20px Arial';
      ctx.fillText('EASY', centerX, centerY - 10);
      ctx.font = 'bold 24px Arial';
      ctx.fillText('ROTA DO MAR', centerX, centerY + 20);
    }

    ctx.save();
    drawPinBody();
    ctx.clip();
    const gloss = ctx.createLinearGradient(0, centerY - headRadius, 0, centerY);
    gloss.addColorStop(0, 'rgba(255, 255, 255, 0.30)');
    gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gloss;
    ctx.beginPath();
    ctx.ellipse(centerX - 30, centerY - 78, 82, 36, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const image = document.createElement('img');
    image.src = canvas.toDataURL('image/png');
    image.width = canvas.width;
    image.height = canvas.height;
    image.alt = 'Easy Rota do Mar — empreendimento Rocha';
    image.className = 'rocha62-brand-pin';
    return image;
  }

  function showPanel(site, map, offset) {
    if (!isAdjustMode() || document.getElementById('rocha62-adjust-panel')) return;
    const panel = document.createElement('section');
    panel.id = 'rocha62-adjust-panel';
    panel.innerHTML = '<strong>Posicionar pino</strong>' +
      '<p>Calibracao local. Clique no mapa para colocar o pino ou use as setas (10 m). Nada muda no servidor.</p>' +
      '<div class="rocha62-offsets"></div>' +
      '<div class="rocha62-buttons">' +
        '<button type="button" data-dir="north">↑ Norte</button>' +
        '<button type="button" data-dir="south">↓ Sul</button>' +
        '<button type="button" data-dir="west">← Oeste</button>' +
        '<button type="button" data-dir="east">→ Leste</button>' +
        '<button type="button" data-dir="reset">Restaurar</button>' +
        '<button type="button" data-dir="copy">Copiar coordenadas</button>' +
      '</div><output class="rocha62-copy-status" aria-live="polite"></output>';
    document.getElementById('main').appendChild(panel);
    const label = panel.querySelector('.rocha62-offsets');
    const status = panel.querySelector('output');
    function refresh() {
      const pos = coordinates(site, offset);
      marker.position = { ...pos, altitude: PIN_ALTITUDE };
      label.textContent = 'Norte: ' + offset.north.toFixed(1) + ' m | Leste: ' + offset.east.toFixed(1) + ' m';
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(offset)); } catch (_) { /* opcional */ }
      return pos;
    }
    panel.addEventListener('click', async (event) => {
      const button = event.target.closest('button[data-dir]');
      if (!button) return;
      const action = button.getAttribute('data-dir');
      const step = 10;
      if (action === 'north') offset.north = clamp(offset.north + step);
      if (action === 'south') offset.north = clamp(offset.north - step);
      if (action === 'east') offset.east = clamp(offset.east + step);
      if (action === 'west') offset.east = clamp(offset.east - step);
      if (action === 'reset') { offset.north = 0; offset.east = 0; }
      const pos = refresh();
      if (action === 'copy') {
        const data = JSON.stringify({ north: Number(offset.north.toFixed(1)), east: Number(offset.east.toFixed(1)), lat: Number(pos.lat.toFixed(7)), lng: Number(pos.lng.toFixed(7)) });
        try {
          await navigator.clipboard.writeText(data);
          status.textContent = 'Coordenadas copiadas: ' + data;
        } catch (_) {
          status.textContent = 'Copie os dados: ' + data;
        }
      }
    });
    map.addEventListener('gmp-click', (event) => {
      const position = event && event.position;
      if (!position || !Number.isFinite(position.lat) || !Number.isFinite(position.lng)) return;
      offset.north = clamp((position.lat - site.lat) * 111320);
      offset.east = clamp((position.lng - site.lng) * 111320 * Math.cos(position.lat * Math.PI / 180));
      refresh();
      status.textContent = 'Pino movido pelo clique. Use Copiar coordenadas e envie o resultado.';
    });
    refresh();
  }

  window.rochaR62InitPin = async function (map, maps3d, site) {
    if (!map || !maps3d || !site || !Number.isFinite(site.lat) || !Number.isFinite(site.lng)) return;
    if (marker) return;
    if (typeof maps3d.Marker3DElement !== 'function') {
      console.warn('[Rocha R62] Marker3DElement nao disponivel; mapa e fotos preservados.');
      return;
    }
    try {
      const offset = readOffset();
      const image = await brandedPinImage();
      const template = document.createElement('template');
      template.content.append(image);
      marker = new maps3d.Marker3DElement({
        // R63: acima do solo e desenhado mesmo atras de arvores/predios, para nao sumir no zoom.
        position: { ...coordinates(site, offset), altitude: PIN_ALTITUDE },
        altitudeMode: 'RELATIVE_TO_GROUND',
        extruded: true,
        drawsWhenOccluded: true,
        sizePreserved: true,
        collisionBehavior: 'REQUIRED'
      });
      marker.id = 'rocha62-pin';
      marker.setAttribute('aria-label', 'Localizacao do Easy Rota do Mar');
      marker.append(template);
      map.append(marker);
      showPanel(site, map, offset);
      if (typeof window.rochaR63InitPois === 'function') {
        window.rochaR63InitPois(map, maps3d, coordinates(site, offset)).catch((err) => console.warn('[Rocha R63] Entorno:', err));
      }
      console.info('[Rocha R62] Pino com marca oficial ancorado ao mapa 3D.');
    } catch (error) {
      console.error('[Rocha R62] Falha ao adicionar pino, mapa e fotos permanecem operantes:', error);
    }
  };
})();
