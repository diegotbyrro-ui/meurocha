/* Rocha R62 R2: pin georreferenciado do empreendimento, usando a marca oficial.
   A maquete R61 permanece arquivada, mas nao e exibida nesta versao.
   O SITE e recebido do Next.js e nao e inferido dos pontos de captura do drone. */
(function () {
  'use strict';

  const BRAND_URL = '/experiencia/easy-rota-do-mar/erm-logo-transparente.png';
  const STORAGE_KEY = 'rocha-r62-pin-offset-v3';
  const DEFAULT_OFFSET = { north: -122, east: -86 };
  const MAX_OFFSET_METERS = 180;
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
    canvas.width = 450;
    canvas.height = 310;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D indisponivel');

    ctx.shadowColor = 'rgba(0, 15, 24, 0.45)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 8;
    roundedRect(ctx, 25, 12, 400, 188, 25);
    const background = ctx.createLinearGradient(25, 12, 425, 200);
    background.addColorStop(0, '#062b46');
    background.addColorStop(1, '#004b70');
    ctx.fillStyle = background;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#4ce7f6';
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
        const scale = Math.min(345 / logo.naturalWidth, 148 / logo.naturalHeight);
        const width = logo.naturalWidth * scale;
        const height = logo.naturalHeight * scale;
        ctx.drawImage(logo, (450 - width) / 2, 29 + (146 - height) / 2, width, height);
        hasLogo = true;
      }
    } catch (_) { /* texto de contingencia; nao buscar recursos externos */ }

    if (!hasLogo) {
      ctx.fillStyle = '#eafaff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 31px Arial';
      ctx.fillText('EASY ROTA DO MAR', 225, 104);
      ctx.font = 'bold 15px Arial';
      ctx.fillStyle = '#79eaf9';
      ctx.fillText('ROCHA EMPREENDIMENTOS', 225, 142);
    }

    ctx.beginPath();
    ctx.moveTo(225, 200);
    ctx.lineTo(225, 266);
    ctx.lineWidth = 9;
    ctx.strokeStyle = '#0ae0fa';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(225, 277, 22, 0, Math.PI * 2);
    ctx.fillStyle = '#00ceef';
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    const image = document.createElement('img');
    image.src = canvas.toDataURL('image/png');
    image.width = 170;
    image.height = 117;
    image.alt = 'Easy Rota do Mar — empreendimento Rocha';
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
