/* Rocha R63: pontos de interesse do entorno (Google Places API New).
   Busca ao vivo colegios, restaurantes, clinicas, mecanicas, igrejas, mercados,
   farmacias e postos em volta do pino do empreendimento. Ao clicar num pino,
   abre um painel com nome, endereco, avaliacao e fotos do Google (com a
   atribuicao exigida pelo Google). Nenhuma chave nova: usa a mesma chave do
   mapa 3D, que precisa ter a "Places API (New)" habilitada.
   R65: rotulos Colegios e Clinicas; as 5 categorias principais carregam ao
   pousar e mercados, farmacias e postos so quando o visitante toca nelas
   (menos consultas pagas); a nota do Google e buscada so ao abrir o ponto;
   o filtro tira e recoloca os marcadores no mapa 3D; e o painel mostra km e
   tempo de carro e a pe saindo do empreendimento (rocha-r65-trajeto.js). */
(function () {
  'use strict';

  const RADIUS_METERS = 2000;
  const PER_CATEGORY = 6;
  const CATEGORIES = [
    { key: 'escolas', label: 'Col\u00e9gios', color: '#2f7df6', glyph: 'C', types: ['school', 'primary_school', 'secondary_school', 'preschool'] },
    { key: 'restaurantes', label: 'Restaurantes', color: '#f97316', glyph: 'R', types: ['restaurant'] },
    { key: 'saude', label: 'Cl\u00ednicas', color: '#ef4444', glyph: '+', types: ['hospital', 'doctor', 'dental_clinic', 'medical_lab'] },
    { key: 'mecanicas', label: 'Mec\u00e2nicas', color: '#64748b', glyph: 'O', types: ['car_repair'] },
    { key: 'igrejas', label: 'Igrejas', color: '#8b5cf6', glyph: 'I', types: ['church', 'place_of_worship'] },
    { key: 'mercados', label: 'Mercados', color: '#eab308', glyph: 'M', types: ['supermarket', 'grocery_store'], onDemand: true },
    { key: 'farmacias', label: 'Farm\u00e1cias', color: '#10b981', glyph: 'F', types: ['pharmacy', 'drugstore'], onDemand: true },
    { key: 'postos', label: 'Postos', color: '#0ea5e9', glyph: 'P', types: ['gas_station'], onDemand: true }
  ];
  // Somente campos do nivel "Nearby Search Pro" (cota gratuita maior).
  // A nota (rating) e o numero de avaliacoes vem so quando o ponto e aberto.
  const FIELDS = ['id', 'displayName', 'location', 'formattedAddress', 'photos', 'googleMapsURI', 'primaryTypeDisplayName'];
  const RATING_FIELDS = ['rating', 'userRatingCount'];

  const state = {
    started: false, map: null, maps3d: null, origin: null, Place: null,
    markers: [], seen: new Set(), counts: {}, loaded: new Set(), loading: new Map(),
    active: new Set(CATEGORIES.filter((c) => !c.onDemand).map((c) => c.key)),
    panel: null, legend: null, current: null, ratings: new Map()
  };

  function esc(text) {
    return String(text == null ? '' : text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function distanceMeters(a, b) {
    const R = 6371000;
    const toRad = (d) => d * Math.PI / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  // Reserva caso o modulo de trajeto (R65) nao carregue.
  function formatDistance(m) {
    const txt = m < 1000 ? Math.round(m / 10) * 10 + ' m' : (m / 1000).toFixed(1).replace('.', ',') + ' km';
    return txt + ' em linha reta';
  }

  function badgeImage(category) {
    const size = 30;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size + 8;
    const ctx = canvas.getContext('2d');
    const c = size / 2;
    ctx.beginPath();
    ctx.moveTo(c - 6, size - 4);
    ctx.lineTo(c, size + 7);
    ctx.lineTo(c + 6, size - 4);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(c, c, c - 1, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(c, c, c - 3.5, 0, Math.PI * 2);
    ctx.fillStyle = category.color;
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(category.glyph, c, c + 1);
    const img = document.createElement('img');
    img.src = canvas.toDataURL('image/png');
    img.width = canvas.width;
    img.height = canvas.height;
    img.alt = category.label;
    return img;
  }

  function route() {
    const r = window.rochaR65Trajeto;
    return r && typeof r.mostrar === 'function' ? r : null;
  }

  function setPanelOpen(open) {
    const main = document.getElementById('main');
    if (main) main.classList.toggle('rocha63-aberto', open);
  }

  function closePanel() {
    if (state.panel) state.panel.hidden = true;
    setPanelOpen(false);
    state.current = null;
    const r = route();
    if (r) r.limpar();
  }

  function ensurePanel() {
    if (state.panel) return state.panel;
    const panel = document.createElement('aside');
    panel.id = 'rocha63-poi-panel';
    panel.hidden = true;
    panel.setAttribute('aria-live', 'polite');
    document.getElementById('main').appendChild(panel);
    panel.addEventListener('click', (event) => {
      if (event.target.closest('[data-close]')) { closePanel(); return; }
      const thumb = event.target.closest('button[data-photo]');
      if (thumb) {
        const big = panel.querySelector('.rocha63-photo-main img');
        if (big) big.src = thumb.getAttribute('data-photo');
        panel.querySelectorAll('button[data-photo]').forEach((b) => b.classList.toggle('on', b === thumb));
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !panel.hidden) closePanel();
    });
    state.panel = panel;
    return panel;
  }

  function photoUri(photo, width) {
    try { return photo.getURI({ maxWidth: width }); } catch (_) { return ''; }
  }

  function plain(text) {
    return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/s$/, '');
  }

  function metaText(place, category) {
    const type = place.primaryTypeDisplayName && plain(place.primaryTypeDisplayName) !== plain(category.label) ? place.primaryTypeDisplayName : '';
    const rating = Number.isFinite(place.rating)
      ? '\u2605 ' + place.rating.toFixed(1).replace('.', ',') + (place.userRatingCount ? ' (' + place.userRatingCount + ' avalia\u00e7\u00f5es)' : '')
      : '';
    return [type, rating].filter(Boolean).join(' \u00b7 ');
  }

  // Nota do Google buscada so quando o ponto e aberto (uma vez por local).
  function loadRating(place) {
    if (Number.isFinite(place.rating) || typeof place.fetchFields !== 'function') return Promise.resolve(place);
    if (!state.ratings.has(place.id)) {
      state.ratings.set(place.id, place.fetchFields({ fields: RATING_FIELDS })
        .then((res) => (res && res.place) || place)
        .catch((error) => { console.warn('[Rocha R63] Nota indisponivel:', error); return place; }));
    }
    return state.ratings.get(place.id);
  }

  function openPlace(place, category) {
    const panel = ensurePanel();
    const origin = state.origin;
    const r = route();
    const photos = (place.photos || []).slice(0, 5);
    const pos = place.location ? { lat: place.location.lat(), lng: place.location.lng() } : null;
    const meta = metaText(place, category);
    const directions = pos && r && typeof r.linkGoogleMaps === 'function' ? r.linkGoogleMaps(origin, pos, place.id) : '';
    const first = photos[0];
    const credits = photos.length ? (photos[0].authorAttributions || []).map((a) => a.uri
      ? '<a href="' + esc(a.uri) + '" target="_blank" rel="noopener">' + esc(a.displayName) + '</a>'
      : esc(a.displayName)).join(', ') : '';
    state.current = { id: place.id, cat: category.key };
    panel.innerHTML =
      '<button type="button" class="rocha63-close" data-close aria-label="Fechar">\u00d7</button>' +
      '<span class="rocha63-chip" style="--c:' + category.color + '">' + esc(category.label) + '</span>' +
      '<h3>' + esc(place.displayName || 'Local') + '</h3>' +
      '<p class="rocha63-meta" data-meta' + (meta ? '' : ' hidden') + '>' + esc(meta) + '</p>' +
      (place.formattedAddress ? '<p class="rocha63-addr">' + esc(place.formattedAddress) + '</p>' : '') +
      (pos ? (r ? r.html() : '<p class="rocha63-meta">' + esc(formatDistance(distanceMeters(origin, pos))) + '</p>') : '') +
      (first
        ? '<div class="rocha63-photo-main"><img alt="Foto de ' + esc(place.displayName) + '" src="' + esc(photoUri(first, 900)) + '"></div>' +
          (photos.length > 1 ? '<div class="rocha63-thumbs">' + photos.map((p, i) =>
            '<button type="button" class="' + (i === 0 ? 'on' : '') + '" data-photo="' + esc(photoUri(p, 900)) + '"><img alt="" loading="lazy" src="' + esc(photoUri(p, 160)) + '"></button>').join('') + '</div>' : '') +
          '<p class="rocha63-credit">Fotos: Google' + (credits ? ' \u00b7 ' + credits : '') + '</p>'
        : '<p class="rocha63-nophoto">O Google ainda n\u00e3o tem fotos deste local.</p>') +
      '<div class="rocha63-links">' +
        (place.googleMapsURI ? '<a class="rocha63-maps" href="' + esc(place.googleMapsURI) + '" target="_blank" rel="noopener">Ver no Google Maps</a>' : '') +
        (directions ? '<a class="rocha63-maps rocha65-rota" href="' + esc(directions) + '" target="_blank" rel="noopener">Rota no Google Maps</a>' : '') +
      '</div>';
    panel.hidden = false;
    setPanelOpen(true);
    panel.scrollTop = 0;
    if (pos && r) r.mostrar(panel, origin, pos, place.id);
    loadRating(place).then((full) => {
      if (!state.current || state.current.id !== place.id) return;
      const el = panel.querySelector('[data-meta]');
      const text = metaText(full, category);
      if (el && text) { el.textContent = text; el.hidden = false; }
    });
  }

  function addMarker(place, category) {
    if (!place || !place.location || state.seen.has(place.id)) return false;
    state.seen.add(place.id);
    try {
      const marker = new state.maps3d.Marker3DInteractiveElement({
        position: { lat: place.location.lat(), lng: place.location.lng(), altitude: 12 },
        altitudeMode: 'RELATIVE_TO_GROUND',
        extruded: true,
        drawsWhenOccluded: true,
        sizePreserved: true,
        collisionBehavior: 'OPTIONAL_AND_HIDES_LOWER_PRIORITY'
      });
      const template = document.createElement('template');
      template.content.append(badgeImage(category));
      marker.append(template);
      marker.setAttribute('aria-label', category.label + ': ' + (place.displayName || ''));
      marker.addEventListener('gmp-click', (event) => {
        if (event && event.stopPropagation) event.stopPropagation();
        openPlace(place, category);
      });
      if (state.active.has(category.key)) state.map.append(marker);
      state.markers.push({ marker, cat: category.key });
      return true;
    } catch (error) {
      console.warn('[Rocha R63] Marcador falhou:', error);
      return false;
    }
  }

  function search(types) {
    return state.Place.searchNearby({
      fields: FIELDS,
      locationRestriction: { center: { lat: state.origin.lat, lng: state.origin.lng }, radius: RADIUS_METERS },
      includedTypes: types,
      maxResultCount: PER_CATEGORY,
      rankPreference: 'DISTANCE',
      language: 'pt-BR',
      region: 'br'
    });
  }

  async function fetchCategory(category) {
    let result;
    try { result = await search(category.types); } catch (_) { result = await search(category.types.slice(0, 1)); }
    return (result && result.places) || [];
  }

  function addCategory(category, places) {
    let added = 0;
    for (const place of places) { if (addMarker(place, category)) added += 1; }
    state.counts[category.key] = added;
    state.loaded.add(category.key);
    return added;
  }

  // Categoria sob demanda (ou que falhou ao pousar): busca uma unica vez.
  function loadCategory(category) {
    if (state.loaded.has(category.key)) return Promise.resolve(state.counts[category.key] || 0);
    if (!state.loading.has(category.key)) {
      const job = fetchCategory(category).then((places) => addCategory(category, places));
      state.loading.set(category.key, job);
      job.then(() => state.loading.delete(category.key), () => state.loading.delete(category.key));
    }
    return state.loading.get(category.key);
  }

  function setCategoryVisible(key, on) {
    state.markers.forEach((m) => {
      if (m.cat !== key) return;
      if (on && m.marker.parentNode !== state.map) state.map.append(m.marker);
      if (!on && m.marker.parentNode) m.marker.remove();
    });
    if (!on && state.current && state.current.cat === key) closePanel();
  }

  function chip(category) {
    const on = state.active.has(category.key);
    const count = state.loaded.has(category.key) ? state.counts[category.key] : null;
    return '<button type="button" class="' + (on ? 'on' : '') + '" aria-pressed="' + on + '" data-cat="' + category.key + '" style="--c:' + category.color + '">' +
      '<i>' + esc(category.glyph) + '</i>' + esc(category.label) + ' <small>' + (count == null ? '+' : count) + '</small></button>';
  }

  async function onLegendClick(event) {
    const btn = event.target.closest('button[data-cat]');
    if (!btn || btn.disabled) return;
    const category = CATEGORIES.find((c) => c.key === btn.getAttribute('data-cat'));
    if (!category) return;
    const on = !state.active.has(category.key);
    if (on) state.active.add(category.key); else state.active.delete(category.key);
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-pressed', String(on));
    if (on && !state.loaded.has(category.key)) {
      btn.disabled = true;
      btn.classList.add('loading');
      try {
        await loadCategory(category);
      } catch (error) {
        console.warn('[Rocha R63] Busca falhou para', category.key, error);
        state.active.delete(category.key);
      }
      btn.disabled = false;
      btn.classList.remove('loading');
      const small = btn.querySelector('small');
      if (state.loaded.has(category.key)) {
        if (small) small.textContent = String(state.counts[category.key]);
        if (!state.counts[category.key]) {
          state.active.delete(category.key);
          btn.disabled = true;
          btn.title = 'Nenhum encontrado num raio de 2 km';
        }
      }
      const stillOn = state.active.has(category.key);
      btn.classList.toggle('on', stillOn);
      btn.setAttribute('aria-pressed', String(stillOn));
    }
    setCategoryVisible(category.key, state.active.has(category.key));
  }

  function buildLegend() {
    if (state.legend) state.legend.remove();
    const legend = document.createElement('nav');
    legend.id = 'rocha63-poi-legend';
    legend.setAttribute('aria-label', 'Filtrar pontos de interesse');
    legend.innerHTML = '<div class="rocha63-chips"><strong>No entorno</strong>' +
      CATEGORIES.filter((c) => !state.loaded.has(c.key) || state.counts[c.key]).map(chip).join('') + '</div>' +
      '<span class="rocha63-hint">Toque em um ponto para ver fotos, dist\u00e2ncia e tempo de trajeto.</span>';
    legend.addEventListener('click', onLegendClick);
    document.getElementById('main').appendChild(legend);
    state.legend = legend;
  }

  function notice(text) {
    const el = document.createElement('div');
    el.id = 'rocha63-poi-notice';
    el.textContent = text;
    document.getElementById('main').appendChild(el);
    setTimeout(() => el.remove(), 9000);
  }

  window.rochaR63InitPois = async function (map, maps3d, origin) {
    if (!map || !maps3d || !origin || !Number.isFinite(origin.lat) || !Number.isFinite(origin.lng)) return;
    if (state.started) return;
    if (typeof maps3d.Marker3DInteractiveElement !== 'function') return;
    state.started = true;
    try {
      ({ Place: state.Place } = await google.maps.importLibrary('places'));
    } catch (error) {
      state.started = false;
      console.warn('[Rocha R63] Biblioteca places indisponivel:', error);
      notice('Pontos do entorno indispon\u00edveis: habilite a Places API (New) na chave do Google.');
      return;
    }
    state.map = map;
    state.maps3d = maps3d;
    state.origin = { lat: origin.lat, lng: origin.lng };
    const r = route();
    if (r && typeof r.configurar === 'function') r.configurar(map, maps3d);
    const main = CATEGORIES.filter((c) => !c.onDemand);
    const results = await Promise.allSettled(main.map(fetchCategory));
    let failures = 0;
    results.forEach((res, i) => {
      if (res.status === 'fulfilled') { addCategory(main[i], res.value); return; }
      failures += 1;
      state.active.delete(main[i].key);
      console.warn('[Rocha R63] Busca falhou para', main[i].key, res.reason);
    });
    if (state.markers.length) buildLegend();
    else if (failures) notice('Pontos do entorno indispon\u00edveis: habilite a Places API (New) na chave do Google.');
    console.info('[Rocha R63] Pontos de interesse adicionados:', state.markers.length);
  };
})();
