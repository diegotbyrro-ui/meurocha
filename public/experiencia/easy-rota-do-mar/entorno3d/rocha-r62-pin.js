/* Rocha R62 R2: pin georreferenciado do empreendimento, usando a marca oficial.
   A maquete R61 permanece arquivada, mas nao e exibida nesta versao.
   O SITE e recebido do Next.js e nao e inferido dos pontos de captura do drone. */
(function () {
  'use strict';

  const BRAND_URL = '/experiencia/easy-rota-do-mar/erm-logo-transparente.png';
  const STORAGE_KEY = 'rocha-r62-pin-offset-v4';
  const DEFAULT_OFFSET = { north: -235, east: -118 };
  const MAX_OFFSET_METERS = 350;
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

  function roundedRect(ctx, x, y, w, h, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.closePath();
  }

    async function brandedPinImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 340;
    canvas.height = 460;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D indisponivel');

    const centerX = 170;
    const tipY = 410;
    const radius = 94;
    const centerY = 148;

    function drawPinBody() {
      ctx.beginPath();
      ctx.moveTo(centerX, tipY);
      ctx.bezierCurveTo(235, 312, 282, 246, 282, 167);
      ctx.arc(centerX, centerY, radius, 0.2, Math.PI - 0.2, true);
      ctx.bezierCurveTo(58, 246, 105, 312, centerX, tipY);
      ctx.closePath();
    }

    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#00d7ff';
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.ellipse(centerX, 426, 92 + i * 18, 18 + i * 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.shadowColor = 'rgba(0, 24, 34, 0.45)';
    ctx.shadowBlur = 26;
    ctx.shadowOffsetY = 12;
    drawPinBody();
    const grad = ctx.createLinearGradient(70, 56, 278, 320);
    grad.addColorStop(0, '#083654');
    grad.addColorStop(0.65, '#085b84');
    grad.addColorStop(1, '#0aa6c0');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#31e8ff';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 66, 0, Math.PI * 2);
    const innerGrad = ctx.createRadialGradient(centerX, centerY - 10, 12, centerX, centerY, 70);
    innerGrad.addColorStop(0, '#0b6fa4');
    innerGrad.addColorStop(1, '#072742');
    ctx.fillStyle = innerGrad;
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(96, 244, 255, 0.9)';
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
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, 58, 0, Math.PI * 2);
        ctx.clip();
        const scale = Math.min(106 / logo.naturalWidth, 70 / logo.naturalHeight);
        const width = logo.naturalWidth * scale;
        const height = logo.naturalHeight * scale;
        ctx.drawImage(logo, centerX - width / 2, centerY - height / 2, width, height);
        ctx.restore();
        hasLogo = true;
      }
    } catch (_) { /* contingencia */ }

    if (!hasLogo) {
      ctx.fillStyle = '#eafcff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 17px Arial';
      ctx.fillText('EASY', centerX, centerY - 10);
      ctx.font = 'bold 21px Arial';
      ctx.fillText('ROTA DO MAR', centerX, centerY + 18);
    }

    const image = document.createElement('img');
    image.src = canvas.toDataURL('image/png');
    image.width = 126;
    image.height = 170;
    image.alt = 'Easy Rota do Mar — empreendimento Rocha';
    image.className = 'rocha62-brand-pin';
    return image;
  }

  function showPanel(site, map, offset) {
    if (!isAdjustMode() || document.getElementById('rocha62-adjust-panel')) return;
    const panel = document.createElement('section');
    panel.id = 'rocha62-adjust-panel';
    panel.innerHTML = '<strong>Posicionar pino</strong>' +
      '<p>Calibracao local. As setas deslocam o marcador no terreno; nada muda no servidor.</p>' +
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
      marker.position = { ...pos, altitude: 0 };
      label.textContent = 'Norte: ' + offset.north.toFixed(1) + ' m | Leste: ' + offset.east.toFixed(1) + ' m';
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(offset)); } catch (_) { /* opcional */ }
      return pos;
    }
    panel.addEventListener('click', async (event) => {
      const button = event.target.closest('button[data-dir]');
      if (!button) return;
      const action = button.getAttribute('data-dir');
      const step = 1;
      if (action === 'north') offset.north = clamp(offset.north + step);
      if (action === 'south') offset.north = clamp(offset.north - step);
      if (action === 'east') offset.east = clamp(offset.east + step);
      if (action === 'west') offset.east = clamp(offset.east - step);
      if (action === 'reset') { offset.north = 0; offset.east = 0; }
      const pos = refresh();
      if (action === 'copy') {
        const data = JSON.stringify({ lat: Number(pos.lat.toFixed(7)), lng: Number(pos.lng.toFixed(7)) });
        try {
          await navigator.clipboard.writeText(data);
          status.textContent = 'Coordenadas copiadas: ' + data;
        } catch (_) {
          status.textContent = 'Copie os dados: ' + data;
        }
      }
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
        position: { ...coordinates(site, offset), altitude: 0 },
        altitudeMode: 'CLAMP_TO_GROUND',
        extruded: true,
        sizePreserved: true,
        collisionBehavior: 'REQUIRED'
      });
      marker.id = 'rocha62-pin';
      marker.setAttribute('aria-label', 'Localizacao do Easy Rota do Mar');
      marker.append(template);
      map.append(marker);
      showPanel(site, map, offset);
      console.info('[Rocha R62] Pino com marca oficial ancorado ao mapa 3D.');
    } catch (error) {
      console.error('[Rocha R62] Falha ao adicionar pino, mapa e fotos permanecem operantes:', error);
    }
  };
})();
