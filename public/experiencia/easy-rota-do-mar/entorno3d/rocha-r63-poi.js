/* Rocha R63: pontos de interesse do entorno (Google Places API New).
   Busca ao vivo escolas, igrejas, restaurantes, mecanicas, postos, saude,
   mercados e farmacias em volta do pino do empreendimento. Ao clicar num pino,
   abre um painel com nome, endereco, avaliacao, distancia e fotos do Google
   (com a atribuicao exigida pelo Google). Nenhuma chave nova: usa a mesma
   chave do mapa 3D, que precisa ter a "Places API (New)" habilitada. */
(function () {
  'use strict';

  const RADIUS_METERS = 2000;
  const PER_CATEGORY = 6;
  const CATEGORIES = [
    { key: 'escolas', label: 'Escolas', color: '#2f7df6', glyph: 'E', types: ['school', 'primary_school', 'secondary_school', 'preschool'] },
    { key: 'igrejas', label: 'Igrejas', color: '#8b5cf6', glyph: 'I', types: ['church', 'place_of_worship'] },
    { key: 'restaurantes', label: 'Restaurantes', color: '#f97316', glyph: 'R', types: ['restaurant'] },
    { key: 'saude', label: 'Sa\u00fade', color: '#ef4444', glyph: '+', types: ['hospital', 'doctor', 'dental_clinic', 'medical_lab'] },
    { key: 'farmacias', label: 'Farm\u00e1cias', color: '#10b981', glyph: 'F', types: ['pharmacy', 'drugstore'] },
    { key: 'mercados', label: 'Mercados', color: '#eab308', glyph: 'M', types: ['supermarket', 'grocery_store'] },
    { key: 'postos', label: 'Postos', color: '#0ea5e9', glyph: 'P', types: ['gas_station'] },
    { key: 'mecanicas', label: 'Mec\u00e2nicas', color: '#64748b', glyph: 'O', types: ['car_repair'] }
  ];
  const FIELDS = ['id', 'displayName', 'location', 'formattedAddress', 'rating', 'userRatingCount', 'photos', 'googleMapsURI', 'primaryTypeDisplayName'];

  const state = { markers: [], active: new Set(CATEGORIES.map((c) => c.key)), panel: null, legend: null };

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

  function formatDistance(m) {
    const walk = Math.max(1, Math.round(m / 80));
    const txt = m < 1000 ? Math.round(m / 10) * 10 + ' m' : (m / 1000).toFixed(1).replace('.', ',') + ' km';
    return txt + ' \u00b7 ~' + walk + ' min a p\u00e9';
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

  function ensurePanel() {
    if (state.panel) return state.panel;
    const panel = document.createElement('aside');
    panel.id = 'rocha63-poi-panel';
    panel.hidden = true;
    panel.setAttribute('aria-live', 'polite');
    document.getElementById('main').appendChild(panel);
    panel.addEventListener('click', (event) => {
      if (event.target.closest('[data-close]')) panel.hidden = true;
      const thumb = event.target.closest('button[data-photo]');
      if (thumb) {
        const big = panel.querySelector('.rocha63-photo-main img');
        if (big) big.src = thumb.getAttribute('data-photo');
        panel.querySelectorAll('button[data-photo]').forEach((b) => b.classList.toggle('on', b === thumb));
      }
    });
    state.panel = panel;
    return panel;
  }

  function photoUri(photo, width) {
    try { return photo.getURI({ maxWidth: width }); } catch (_) { return ''; }
  }

  function openPlace(place, category, origin) {
    const panel = ensurePanel();
    const photos = (place.photos || []).slice(0, 6);
    const dist = place.location ? formatDistance(distanceMeters(origin, { lat: place.location.lat(), lng: place.location.lng() })) : '';
    const rating = Number.isFinite(place.rating) ? '\u2605 ' + place.rating.toFixed(1).replace('.', ',') + (place.userRatingCount ? ' (' + place.userRatingCount + ')' : '') : '';
    const first = photos[0];
    const credits = photos.length ? (photos[0].authorAttributions || []).map((a) => a.uri
      ? '<a href="' + esc(a.uri) + '" target="_blank" rel="noopener">' + esc(a.displayName) + '</a>'
      : esc(a.displayName)).join(', ') : '';
    panel.innerHTML =
      '<button type="button" class="rocha63-close" data-close aria-label="Fechar">\u00d7</button>' +
      '<span class="rocha63-chip" style="--c:' + category.color + '">' + esc(category.label) + '</span>' +
      '<h3>' + esc(place.displayName || 'Local') + '</h3>' +
      '<p class="rocha63-meta">' + esc(dist) + (rating ? ' \u00b7 ' + esc(rating) : '') + '</p>' +
      (place.formattedAddress ? '<p class="rocha63-addr">' + esc(place.formattedAddress) + '</p>' : '') +
      (first
        ? '<div class="rocha63-photo-main"><img alt="Foto de ' + esc(place.displayName) + '" src="' + esc(photoUri(first, 900)) + '"></div>' +
          (photos.length > 1 ? '<div class="rocha63-thumbs">' + photos.map((p, i) =>
            '<button type="button" class="' + (i === 0 ? 'on' : '') + '" data-photo="' + esc(photoUri(p, 900)) + '"><img alt="" loading="lazy" src="' + esc(photoUri(p, 160)) + '"></button>').join('') + '</div>' : '') +
          '<p class="rocha63-credit">Fotos: Google' + (credits ? ' \u00b7 ' + credits : '') + '</p>'
        : '<p class="rocha63-nophoto">O Google ainda n\u00e3o tem fotos deste local.</p>') +
      (place.googleMapsURI ? '<a class="rocha63-maps" href="' + esc(place.googleMapsURI) + '" target="_blank" rel="noopener">Ver no Google Maps</a>' : '');
    panel.hidden = false;
  }

  function buildLegend(counts) {
    if (state.legend) state.legend.remove();
    const legend = document.createElement('nav');
    legend.id = 'rocha63-poi-legend';
    legend.setAttribute('aria-label', 'Filtrar pontos de interesse');
    legend.innerHTML = '<strong>No entorno</strong>' + CATEGORIES.filter((c) => counts[c.key]).map((c) =>
      '<button type="button" class="on" data-cat="' + c.key + '" style="--c:' + c.color + '"><i>' + esc(c.glyph) + '</i>' + esc(c.label) + ' <small>' + counts[c.key] + '</small></button>').join('');
    legend.addEventListener('click', (event) => {
      const btn = event.target.closest('button[data-cat]');
      if (!btn) return;
      const key = btn.getAttribute('data-cat');
      if (state.active.has(key)) state.active.delete(key); else state.active.add(key);
      btn.classList.toggle('on', state.active.has(key));
      state.markers.forEach((m) => { if (m.cat === key) m.marker.hidden = !state.active.has(key); });
    });
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
    if (state.markers.length) return;
    const Interactive = maps3d.Marker3DInteractiveElement;
    if (typeof Interactive !== 'function') return;
    let Place;
    try {
      ({ Place } = await google.maps.importLibrary('places'));
    } catch (error) {
      console.warn('[Rocha R63] Biblioteca places indisponivel:', error);
      notice('Pontos do entorno indispon\u00edveis: habilite a Places API (New) na chave do Google.');
      return;
    }
    const seen = new Set();
    const counts = {};
    let failures = 0;
    for (const category of CATEGORIES) {
      let places = [];
      const search = (types) => Place.searchNearby({
        fields: FIELDS,
        locationRestriction: { center: { lat: origin.lat, lng: origin.lng }, radius: RADIUS_METERS },
        includedTypes: types,
        maxResultCount: PER_CATEGORY,
        rankPreference: 'DISTANCE',
        language: 'pt-BR',
        region: 'br'
      });
      try {
        let result;
        try { result = await search(category.types); } catch (_) { result = await search(category.types.slice(0, 1)); }
        places = (result && result.places) || [];
      } catch (error) {
        failures += 1;
        console.warn('[Rocha R63] Busca falhou para', category.key, error);
        continue;
      }
      for (const place of places) {
        if (!place.location || seen.has(place.id)) continue;
        seen.add(place.id);
        try {
          const marker = new Interactive({
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
            openPlace(place, category, origin);
          });
          map.append(marker);
          state.markers.push({ marker, cat: category.key });
          counts[category.key] = (counts[category.key] || 0) + 1;
        } catch (error) {
          console.warn('[Rocha R63] Marcador falhou:', error);
        }
      }
    }
    if (state.markers.length) buildLegend(counts);
    else if (failures) notice('Pontos do entorno indispon\u00edveis: habilite a Places API (New) na chave do Google.');
    console.info('[Rocha R63] Pontos de interesse adicionados:', state.markers.length);
  };
})();
