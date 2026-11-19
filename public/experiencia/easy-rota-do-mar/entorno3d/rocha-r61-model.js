/* Rocha R61 — estudo volumétrico 3D georreferenciado.
   O modelo e um piloto, NAO e a arquitetura aprovada.
   A API 3D do Google prende o GLB as coordenadas e redesenha durante orbita/zoom.
   Dados de calibracao sao locais ao navegador, nao alteram o servidor. */
(function () {
  'use strict';
  const BASE = 'rocha-r61-easy-rota-3d-calibracao';
  const DEFAULT = { east: 0, north: 0, heading: 0, scale: 1, visible: true };
  const LIMITS = { east: [-90, 90], north: [-90, 90], heading: [0, 359], scale: [0.4, 2.6] };

  function clamp(value, key) {
    const range = LIMITS[key];
    const n = Number(value);
    if (!range || !Number.isFinite(n)) return DEFAULT[key];
    return Math.min(range[1], Math.max(range[0], n));
  }
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(BASE) || '{}');
      return {
        east: clamp(saved.east, 'east'), north: clamp(saved.north, 'north'),
        heading: clamp(saved.heading, 'heading'), scale: clamp(saved.scale, 'scale'),
        visible: saved.visible !== false,
      };
    } catch (_) { return { ...DEFAULT }; }
  }
  function save(state) {
    try { localStorage.setItem(BASE, JSON.stringify(state)); } catch (_) { /* privacidade */ }
  }
  function isCalibrating() {
    try {
      if (new URLSearchParams(location.search).get('ajuste3d') === '1') return true;
      if (window.top && window.top !== window) {
        return new URLSearchParams(window.top.location.search).get('ajuste3d') === '1';
      }
    } catch (_) { /* iframe nao confiavel */ }
    return false;
  }
  function numberLabel(v, suffix) { return Number(v).toFixed(suffix === 'm' ? 1 : 2) + ' ' + suffix; }

  window.rochaR61InitModel = function (map, maps3d, site) {
    if (!map || !maps3d || !site || !Number.isFinite(site.lat) || !Number.isFinite(site.lng)) return;
    if (typeof maps3d.Model3DElement !== 'function') {
      console.warn('[Rocha R61] Maps 3D nao liberou Model3DElement; mapa e fotos mantidos.');
      return;
    }
    if (document.getElementById('rocha61-pilot')) return;
    const config = load();
    const model = new maps3d.Model3DElement({
      src: new URL('easy-rota-modelo-provisorio.glb', document.baseURI).href,
      position: { lat: site.lat, lng: site.lng, altitude: 0 },
      altitudeMode: 'CLAMP_TO_GROUND',
      orientation: { heading: 0, tilt: 0, roll: 0 },
      scale: 1,
    });
    function apply() {
      const latitude = site.lat + config.north / 111320;
      const longitude = site.lng + config.east / (111320 * Math.cos(latitude * Math.PI / 180));
      model.position = { lat: latitude, lng: longitude, altitude: 0 };
      model.orientation = { heading: config.heading, tilt: 0, roll: 0 };
      model.scale = config.scale;
      model.style.display = config.visible ? '' : 'none';
      save(config);
    }
    model.addEventListener('gmp-error', event => {
      console.warn('[Rocha R61] O modelo GLB nao pode ser exibido; terreno e fotos seguem disponiveis.', event?.message || '');
    });
    map.append(model);
    apply();

    const root = document.createElement('section');
    root.id = 'rocha61-pilot';
    root.className = 'rocha61-pilot';
    root.setAttribute('aria-label', 'Modelo conceitual do empreendimento');
    const info = document.createElement('div');
    info.className = 'rocha61-info';
    info.innerHTML = '<strong>Easy Rota do Mar · 3D</strong><small>Estudo volumétrico preliminar · não é o projeto final</small>';
    root.append(info);
    const calibrating = isCalibrating();
    if (calibrating) {
      const openButton = document.createElement('button');
      openButton.type = 'button';
      openButton.textContent = 'Ajustar prédio';
      openButton.className = 'rocha61-toggle';
      openButton.setAttribute('aria-expanded', 'false');
      root.append(openButton);

      const panel = document.createElement('div');
      panel.className = 'rocha61-panel';
      panel.hidden = true;
      const title = document.createElement('p');
      title.textContent = 'CALIBRAÇÃO LOCAL · R61';
      panel.append(title);
      const controlSpec = [
        ['north', 'Norte / sul', '-90', '90', '0.5', 'm'],
        ['east', 'Leste / oeste', '-90', '90', '0.5', 'm'],
        ['heading', 'Rotação', '0', '359', '1', '°'],
        ['scale', 'Escala', '0.4', '2.6', '0.05', '×'],
      ];
      const inputRefs = {};
      controlSpec.forEach(([key, label, min, max, step, unit]) => {
        const group = document.createElement('label');
        const name = document.createElement('span');
        const output = document.createElement('output');
        name.textContent = label;
        output.textContent = numberLabel(config[key], unit);
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min; slider.max = max; slider.step = step;
        slider.value = config[key];
        slider.setAttribute('aria-label', label);
        slider.addEventListener('input', () => {
          config[key] = clamp(slider.value, key);
          output.textContent = numberLabel(config[key], unit);
          apply();
        });
        group.append(name, output, slider);
        panel.append(group);
        inputRefs[key] = { slider, output, unit };
      });
      const visibility = document.createElement('label');
      visibility.className = 'rocha61-check';
      const check = document.createElement('input');
      check.type = 'checkbox'; check.checked = config.visible;
      check.addEventListener('change', () => { config.visible = check.checked; apply(); });
      const visText = document.createElement('span');
      visText.textContent = 'Exibir o modelo no mapa';
      visibility.append(check, visText);
      panel.append(visibility);

      const row = document.createElement('div');
      row.className = 'rocha61-actions';
      const copy = document.createElement('button');
      copy.type = 'button'; copy.textContent = 'Copiar ajustes';
      copy.addEventListener('click', async () => {
        const text = JSON.stringify({ site: { lat: site.lat, lng: site.lng }, ...config }, null, 2);
        try {
          await navigator.clipboard.writeText(text);
          copy.textContent = 'Copiado';
        } catch (_) {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          panel.append(textarea);
          textarea.select();
          copy.textContent = 'Copie os dados abaixo';
        }
      });
      const reset = document.createElement('button');
      reset.type = 'button'; reset.textContent = 'Restaurar';
      reset.addEventListener('click', () => {
        Object.assign(config, DEFAULT);
        Object.keys(inputRefs).forEach(key => {
          const { slider, output, unit } = inputRefs[key];
          slider.value = config[key];
          output.textContent = numberLabel(config[key], unit);
        });
        check.checked = true;
        apply();
      });
      row.append(copy, reset);
      panel.append(row);
      openButton.addEventListener('click', () => {
        panel.hidden = !panel.hidden;
        openButton.setAttribute('aria-expanded', String(!panel.hidden));
      });
      root.append(panel);
    }
    (document.getElementById('main') || document.body).append(root);
    console.info('[Rocha R61] Modelo preliminar ancorado no terreno; rotacao e zoom acompanham o mapa.');
  };
})();
