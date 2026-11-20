/* Rocha R63: pontos de interesse do entorno (Google Places API New).
   Ao clicar num pino, abre um painel com nome, endereco, avaliacao e fotos do
   Google (com a atribuicao exigida pelo Google). Nenhuma chave nova: usa a
   mesma chave do mapa 3D, que precisa ter a "Places API (New)" habilitada.
   R65: km e tempo de carro e a pe saindo do empreendimento (rocha-r65-trajeto.js),
   filtro que tira e recoloca os marcadores no mapa 3D, nota buscada ao abrir.
   R66: 14 categorias do dia a dia carregadas ao pousar, raio maior (3,5 km;
   hospitais e shoppings pelos mais relevantes em 8 km, numa busca so), pinos
   no estilo do pino da marca com icones proprios, legenda com "Todos" e
   cache so de IDs e coordenadas por 7 dias (o Google permite guardar IDs
   sempre e coordenadas por ate 30 dias). Visitas seguintes nao refazem as
   buscas; nome, fotos e nota vem do Google ao abrir cada ponto.
   R67: legenda so com os botoes (sem o titulo "No entorno" e sem a frase). */
(function () {
  'use strict';

  const NEAR_RADIUS = 3500;
  const FAR_RADIUS = 8000;
  const CACHE_KEY = 'rocha66-entorno-v1';
  const CACHE_DAYS = 7;
  // Icones de linha (grade 24x24) desenhados para a plataforma.
  const ICONS = {
    capelo: 'M2.5 9.5L12 5l9.5 4.5L12 14zM6.5 11.6v4.4c0 1.4 2.5 2.9 5.5 2.9s5.5-1.5 5.5-2.9v-4.4M21.5 9.5v5',
    talheres: 'M6 3v5.5a2.5 2.5 0 0 0 5 0V3M8.5 3v18M17.5 21V3c-2 1-3.2 3.6-3.2 7v3.5h3.2',
    estetoscopio: 'M5.5 3.5h-.7a.8.8 0 0 0-.8.8V9a4.5 4.5 0 0 0 9 0V4.3a.8.8 0 0 0-.8-.8h-.7M8.5 13.5v1a5.5 5.5 0 0 0 11 0V13M21.5 11a2 2 0 1 1-4 0a2 2 0 1 1 4 0',
    hospital: 'M5 3.5h14a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V5A1.5 1.5 0 0 1 5 3.5zM9 8v8M15 8v8M9 12h6',
    pilula: 'M10.6 20.1a4.6 4.6 0 0 1-6.5-6.5l9.6-9.6a4.6 4.6 0 0 1 6.5 6.5zM8.9 8.8l6.4 6.4',
    carrinho: 'M3 4h2.4l2.2 10.3a1.2 1.2 0 0 0 1.2.9h8.4a1.2 1.2 0 0 0 1.2-.9L20.5 8H6.2M11 19a1.5 1.5 0 1 1-3 0a1.5 1.5 0 1 1 3 0M18.5 19a1.5 1.5 0 1 1-3 0a1.5 1.5 0 1 1 3 0',
    pao: 'M4.5 12.5c0-3.6 3.4-6.5 7.5-6.5s7.5 2.9 7.5 6.5c0 .9-.5 1.5-1.2 1.8V19a1 1 0 0 1-1 1H6.7a1 1 0 0 1-1-1v-4.7c-.7-.3-1.2-.9-1.2-1.8zM9.3 9.4l1.3 2.1M12.4 8.9l1.3 2.1M15.4 9.6l1 1.7',
    haltere: 'M7.5 12h9M7.5 6.5v11M16.5 6.5v11M4.5 9v6M19.5 9v6',
    bomba: 'M4.5 20.5V5.5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v15M3 20.5h12M7 7h4v3.5H7zM13.5 11h1.5a1.5 1.5 0 0 1 1.5 1.5v3.5a1.5 1.5 0 0 0 3 0V8.5L17 6',
    chave: 'M19.78 6.41A4.9 4.9 0 0 1 13.26 13.01L7.2 19.07A1.6 1.6 0 0 1 4.93 16.8L10.99 10.74A4.9 4.9 0 0 1 17.59 4.22L14.8 7.01A1.55 1.55 0 0 0 16.99 9.2Z',
    igreja: 'M12 2.5v5M9.8 4.6h4.4M5 21v-8.5L12 7.5l7 5V21M10 21v-3.5a2 2 0 0 1 4 0V21M3.5 21h17',
    banco: 'M3.5 9.5L12 4.5l8.5 5zM6 12v5.5M10 12v5.5M14 12v5.5M18 12v5.5M3.5 20.5h17',
    sacola: 'M5.5 8h13l-1 12.2a1 1 0 0 1-1 .8h-9a1 1 0 0 1-1-.8zM9 10.5V7a3 3 0 0 1 6 0v3.5',
    pata: 'M8.5 15.5c0-2 1.6-3.5 3.5-3.5s3.5 1.5 3.5 3.5c0 1.6-1.2 2.8-2.6 2.8-.4 0-.6-.1-.9-.1s-.5.1-.9.1c-1.4 0-2.6-1.2-2.6-2.8zM7.8 11.2a1.6 1.6 0 1 1-3.2 0a1.6 1.6 0 1 1 3.2 0M11.3 7.6a1.7 1.7 0 1 1-3.4 0a1.7 1.7 0 1 1 3.4 0M16.1 7.6a1.7 1.7 0 1 1-3.4 0a1.7 1.7 0 1 1 3.4 0M19.4 11.2a1.6 1.6 0 1 1-3.2 0a1.6 1.6 0 1 1 3.2 0'
  };
  // Ordem = prioridade (um lugar achado em duas buscas fica na primeira categoria).
  const CATEGORIES = [
    { key: 'mercados', label: 'Mercados', color: '#facc15', icon: 'carrinho', types: ['supermarket', 'grocery_store'], max: 8 },
    { key: 'farmacias', label: 'Farm\u00e1cias', color: '#22c55e', icon: 'pilula', types: ['pharmacy', 'drugstore'], max: 8 },
    { key: 'padarias', label: 'Padarias', color: '#fdba74', icon: 'pao', types: ['bakery'], max: 8 },
    { key: 'restaurantes', label: 'Restaurantes', color: '#f97316', icon: 'talheres', types: ['restaurant'], max: 8 },
    { key: 'escolas', label: 'Col\u00e9gios', color: '#3b82f6', icon: 'capelo', types: ['school', 'primary_school', 'secondary_school', 'preschool'], max: 8 },
    { key: 'hospitais', label: 'Hospitais', color: '#ef4444', icon: 'hospital', types: ['hospital', 'general_hospital'], max: 6, shared: 'referencia' },
    { key: 'saude', label: 'Cl\u00ednicas', color: '#fb7185', icon: 'estetoscopio', types: ['doctor', 'medical_clinic', 'dental_clinic', 'medical_lab'], max: 8 },
    { key: 'veterinarios', label: 'Veterin\u00e1rios', color: '#d6a77a', icon: 'pata', types: ['veterinary_care'], max: 6 },
    { key: 'academias', label: 'Academias', color: '#84cc16', icon: 'haltere', types: ['gym', 'fitness_center'], max: 6 },
    { key: 'postos', label: 'Postos', color: '#38bdf8', icon: 'bomba', types: ['gas_station'], max: 6 },
    { key: 'mecanicas', label: 'Mec\u00e2nicas', color: '#94a3b8', icon: 'chave', types: ['car_repair'], max: 6 },
    { key: 'igrejas', label: 'Igrejas', color: '#a78bfa', icon: 'igreja', types: ['church'], max: 6 },
    { key: 'bancos', label: 'Bancos', color: '#2dd4bf', icon: 'banco', types: ['bank'], max: 6 },
    { key: 'shoppings', label: 'Shoppings', color: '#e879f9', icon: 'sacola', types: ['shopping_mall'], max: 5, shared: 'referencia' }
  ];
  // Hospitais e shoppings: os mais relevantes num raio maior, numa busca so.
  const SHARED = { referencia: { radius: FAR_RADIUS, rank: 'POPULARITY', max: 20 } };
  // Somente campos do nivel "Nearby Search Pro"; a nota vem ao abrir o ponto.
  const FIELDS = ['id', 'displayName', 'location', 'formattedAddress', 'photos', 'googleMapsURI', 'primaryTypeDisplayName', 'primaryType', 'types'];
  const RATING_FIELDS = ['rating', 'userRatingCount'];
  const DETAIL_FIELDS = ['displayName', 'formattedAddress', 'photos', 'googleMapsURI', 'primaryTypeDisplayName', 'rating', 'userRatingCount'];

  const state = {
    started: false, map: null, maps3d: null, origin: null, Place: null,
    markers: [], seen: new Set(), counts: {}, loaded: new Set(), loading: new Map(),
    active: new Set(CATEGORIES.map((c) => c.key)),
    panel: null, legend: null, current: null, details: new Map(), pins: {}
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

  function svgIcon(name) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + ICONS[name] + '"/></svg>';
  }

  // R66: gota no estilo do pino da marca (azul-marinho com brilho), aro e
  // brilho na cor da categoria, icone branco. O mapa 3D mostra a imagem no
  // tamanho natural, entao o desenho ja sai no tamanho final (40x50).
  function drawPin(category) {
    const S = 0.9;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(44 * S);
    canvas.height = Math.round(56 * S);
    const ctx = canvas.getContext('2d');
    ctx.scale(S, S);
    const cx = 22; const cy = 19; const r = 15.5; const tip = 50;
    const color = category.color;
    const tangent = Math.acos(r / (tip - cy));
    const left = Math.PI / 2 + tangent;
    const right = Math.PI / 2 - tangent;
    const body = () => {
      ctx.beginPath();
      ctx.moveTo(cx, tip);
      ctx.quadraticCurveTo(cx + 3, tip - 6, cx + r * Math.cos(right), cy + r * Math.sin(right));
      ctx.arc(cx, cy, r, right, left, true);
      ctx.quadraticCurveTo(cx - 3, tip - 6, cx, tip);
      ctx.closePath();
    };
    const glow = ctx.createRadialGradient(cx, tip + 1, 0, cx, tip + 1, 9);
    glow.addColorStop(0, color + 'cc');
    glow.addColorStop(1, color + '00');
    ctx.save();
    ctx.translate(cx, tip + 1);
    ctx.scale(1, 0.35);
    ctx.translate(-cx, -(tip + 1));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, tip + 1, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.shadowColor = 'rgba(0, 12, 22, 0.6)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    body();
    const fill = ctx.createLinearGradient(8, 2, 36, 46);
    fill.addColorStop(0, '#0c4a70');
    fill.addColorStop(0.6, '#052a45');
    fill.addColorStop(1, '#0a6f94');
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    body();
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, 11.8, 0, Math.PI * 2);
    const disc = ctx.createRadialGradient(cx - 4, cy - 5, 1, cx, cy, 11.8);
    disc.addColorStop(0, '#0f6a9a');
    disc.addColorStop(1, '#03192b');
    ctx.fillStyle = disc;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(190, 245, 255, 0.5)';
    ctx.stroke();
    ctx.save();
    if (typeof Path2D === 'function') {
      const k = 16 / 24;
      ctx.translate(cx - 12 * k, cy - 12 * k);
      ctx.scale(k, k);
      ctx.lineWidth = 2.3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#ffffff';
      ctx.stroke(new Path2D(ICONS[category.icon]));
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(category.label.charAt(0), cx, cy + 1);
    }
    ctx.restore();
    ctx.save();
    body();
    ctx.clip();
    const gloss = ctx.createLinearGradient(0, cy - r, 0, cy);
    gloss.addColorStop(0, 'rgba(255, 255, 255, 0.26)');
    gloss.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gloss;
    ctx.beginPath();
    ctx.ellipse(cx - 4, cy - 9, 10, 5, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return { src: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height };
  }

  function pinImage(category) {
    if (!state.pins[category.key]) state.pins[category.key] = drawPin(category);
    const pin = state.pins[category.key];
    const img = document.createElement('img');
    img.src = pin.src;
    img.width = pin.width;
    img.height = pin.height;
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

  // Detalhes vindos do Google ao abrir o ponto (uma vez por local):
  // so a nota para pontos da busca; tudo para pontos que vieram do cache.
  function loadDetails(place) {
    if (state.details.has(place.id)) return state.details.get(place.id);
    let job;
    if (place.cached) {
      const full = new state.Place({ id: place.id, requestedLanguage: 'pt-BR', requestedRegion: 'br' });
      job = full.fetchFields({ fields: DETAIL_FIELDS }).then((res) => (res && res.place) || full);
    } else if (!Number.isFinite(place.rating) && typeof place.fetchFields === 'function') {
      job = place.fetchFields({ fields: RATING_FIELDS }).then((res) => (res && res.place) || place);
    } else {
      job = Promise.resolve(place);
    }
    job = job.catch((error) => {
      console.warn('[Rocha R66] Detalhes indisponiveis:', error);
      state.details.delete(place.id);
      return null;
    });
    state.details.set(place.id, job);
    return job;
  }

  function headHtml(place, category, waiting) {
    if (waiting) return '<h3 class="rocha63-skel">Carregando\u2026</h3><p class="rocha63-addr rocha63-skel">Endere\u00e7o</p>';
    if (!place || !place.displayName) {
      return '<h3>' + esc(category.label) + '</h3><p class="rocha63-addr">Detalhes indispon\u00edveis no momento. A dist\u00e2ncia e o trajeto continuam abaixo.</p>';
    }
    const meta = metaText(place, category);
    return '<h3>' + esc(place.displayName) + '</h3>' +
      '<p class="rocha63-meta" data-meta' + (meta ? '' : ' hidden') + '>' + esc(meta) + '</p>' +
      (place.formattedAddress ? '<p class="rocha63-addr">' + esc(place.formattedAddress) + '</p>' : '');
  }

  function photosHtml(place, waiting) {
    if (waiting) return '<div class="rocha63-photo-main rocha63-skel"></div>';
    const photos = ((place && place.photos) || []).slice(0, 5);
    const first = photos[0];
    if (!first) return place && place.displayName ? '<p class="rocha63-nophoto">O Google ainda n\u00e3o tem fotos deste local.</p>' : '';
    const credits = (first.authorAttributions || []).map((a) => a.uri
      ? '<a href="' + esc(a.uri) + '" target="_blank" rel="noopener">' + esc(a.displayName) + '</a>'
      : esc(a.displayName)).join(', ');
    return '<div class="rocha63-photo-main"><img alt="Foto de ' + esc(place.displayName) + '" src="' + esc(photoUri(first, 900)) + '"></div>' +
      (photos.length > 1 ? '<div class="rocha63-thumbs">' + photos.map((p, i) =>
        '<button type="button" class="' + (i === 0 ? 'on' : '') + '" data-photo="' + esc(photoUri(p, 900)) + '"><img alt="" loading="lazy" src="' + esc(photoUri(p, 160)) + '"></button>').join('') + '</div>' : '') +
      '<p class="rocha63-credit">Fotos: Google' + (credits ? ' \u00b7 ' + credits : '') + '</p>';
  }

  function linksHtml(place, pos, id) {
    const r = route();
    const maps = place && place.googleMapsURI
      ? place.googleMapsURI
      : 'https://www.google.com/maps/search/?api=1&query=' + pos.lat.toFixed(6) + ',' + pos.lng.toFixed(6) + '&query_place_id=' + encodeURIComponent(id);
    const directions = r && typeof r.linkGoogleMaps === 'function' ? r.linkGoogleMaps(state.origin, pos, id) : '';
    return '<a class="rocha63-maps" href="' + esc(maps) + '" target="_blank" rel="noopener">Ver no Google Maps</a>' +
      (directions ? '<a class="rocha63-maps rocha65-rota" href="' + esc(directions) + '" target="_blank" rel="noopener">Rota no Google Maps</a>' : '');
  }

  function openPlace(place, category) {
    const panel = ensurePanel();
    const origin = state.origin;
    const r = route();
    const pos = { lat: place.location.lat(), lng: place.location.lng() };
    const waiting = !!place.cached;
    state.current = { id: place.id, cat: category.key };
    panel.innerHTML =
      '<button type="button" class="rocha63-close" data-close aria-label="Fechar">\u00d7</button>' +
      '<span class="rocha63-chip" style="--c:' + category.color + '">' + svgIcon(category.icon) + esc(category.label) + '</span>' +
      '<div data-head>' + headHtml(place, category, waiting) + '</div>' +
      (r ? r.html() : '<p class="rocha63-meta">' + esc(formatDistance(distanceMeters(origin, pos))) + '</p>') +
      '<div data-photos>' + photosHtml(place, waiting) + '</div>' +
      '<div class="rocha63-links" data-links>' + linksHtml(place, pos, place.id) + '</div>';
    panel.hidden = false;
    setPanelOpen(true);
    panel.scrollTop = 0;
    if (r) r.mostrar(panel, origin, pos, place.id);
    loadDetails(place).then((full) => {
      if (!state.current || state.current.id !== place.id) return;
      const head = panel.querySelector('[data-head]');
      if (head) head.innerHTML = headHtml(full || (waiting ? null : place), category, false);
      if (waiting) {
        const photos = panel.querySelector('[data-photos]');
        const links = panel.querySelector('[data-links]');
        if (photos) photos.innerHTML = photosHtml(full, false);
        if (links) links.innerHTML = linksHtml(full, pos, place.id);
      }
    });
  }

  function addMarker(place, category) {
    if (!place || !place.location || state.seen.has(place.id)) return false;
    state.seen.add(place.id);
    try {
      const lat = place.location.lat();
      const lng = place.location.lng();
      const marker = new state.maps3d.Marker3DInteractiveElement({
        position: { lat, lng, altitude: 12 },
        altitudeMode: 'RELATIVE_TO_GROUND',
        extruded: true,
        drawsWhenOccluded: true,
        sizePreserved: true,
        collisionBehavior: 'OPTIONAL_AND_HIDES_LOWER_PRIORITY'
      });
      const template = document.createElement('template');
      template.content.append(pinImage(category));
      marker.append(template);
      marker.setAttribute('aria-label', category.label + (place.displayName ? ': ' + place.displayName : ''));
      marker.addEventListener('gmp-click', (event) => {
        if (event && event.stopPropagation) event.stopPropagation();
        openPlace(place, category);
      });
      if (state.active.has(category.key)) state.map.append(marker);
      state.markers.push({ marker, cat: category.key, id: place.id, lat, lng });
      return true;
    } catch (error) {
      console.warn('[Rocha R63] Marcador falhou:', error);
      return false;
    }
  }

  // Buscas: uma por categoria (mais proximos em 3,5 km) e uma compartilhada
  // para hospitais e shoppings (mais relevantes em 8 km).
  function buildSearches() {
    const list = [];
    const shared = {};
    CATEGORIES.forEach((c) => {
      if (c.shared) {
        if (!shared[c.shared]) {
          shared[c.shared] = Object.assign({ cats: [], types: [] }, SHARED[c.shared]);
          list.push(shared[c.shared]);
        }
        shared[c.shared].cats.push(c);
        shared[c.shared].types.push(...c.types);
      } else {
        list.push({ cats: [c], types: c.types.slice(), radius: NEAR_RADIUS, rank: 'DISTANCE', max: c.max });
      }
    });
    return list;
  }
  const SEARCHES = buildSearches();

  function searchOf(category) {
    return SEARCHES.find((s) => s.cats.includes(category));
  }

  async function runSearch(s) {
    const request = (types) => state.Place.searchNearby({
      fields: FIELDS,
      locationRestriction: { center: { lat: state.origin.lat, lng: state.origin.lng }, radius: s.radius },
      includedTypes: types,
      maxResultCount: s.max,
      rankPreference: s.rank,
      language: 'pt-BR',
      region: 'br'
    });
    let result;
    try { result = await request(s.types); } catch (_) { result = await request(s.cats.map((c) => c.types[0])); }
    return (result && result.places) || [];
  }

  function categoryOf(place, cats) {
    if (cats.length === 1) return cats[0];
    const byPrimary = cats.find((c) => c.types.includes(place.primaryType));
    if (byPrimary) return byPrimary;
    const types = place.types || [];
    return cats.find((c) => c.types.some((t) => types.includes(t))) || null;
  }

  function addCategory(category, places) {
    let added = 0;
    for (const place of places) {
      if (added >= category.max) break;
      if (addMarker(place, category)) added += 1;
    }
    state.counts[category.key] = added;
    state.loaded.add(category.key);
    return added;
  }

  // Distribui o resultado de cada busca nas suas categorias, na ordem de prioridade.
  function addResults(results) {
    const buckets = {};
    const done = new Set();
    results.forEach(({ search, places }) => {
      search.cats.forEach((c) => { buckets[c.key] = []; done.add(c.key); });
      places.forEach((place) => {
        const c = categoryOf(place, search.cats);
        if (c) buckets[c.key].push(place);
      });
    });
    CATEGORIES.forEach((c) => { if (done.has(c.key)) addCategory(c, buckets[c.key]); });
  }

  // Categoria que falhou ao pousar: busca de novo quando o visitante toca nela.
  function loadCategory(category) {
    if (state.loaded.has(category.key)) return Promise.resolve(state.counts[category.key] || 0);
    const search = searchOf(category);
    if (!state.loading.has(search)) {
      const job = runSearch(search).then((places) => {
        addResults([{ search: { cats: search.cats.filter((c) => !state.loaded.has(c.key)) }, places }]);
        return state.counts[category.key] || 0;
      });
      state.loading.set(search, job);
      job.then(() => state.loading.delete(search), () => state.loading.delete(search));
    }
    return state.loading.get(search);
  }

  // Cache local: somente IDs e coordenadas, por 7 dias.
  function cacheSignature() {
    return [state.origin.lat.toFixed(5), state.origin.lng.toFixed(5), NEAR_RADIUS, FAR_RADIUS,
      CATEGORIES.map((c) => c.key + ':' + c.types.join('|') + ':' + c.max).join(',')].join(';');
  }

  function cacheRead() {
    try {
      const data = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      const age = data ? Date.now() - data.t : Infinity;
      if (!data || data.sig !== cacheSignature() || !(age >= 0 && age < CACHE_DAYS * 864e5) || !data.items) return null;
      return data.items;
    } catch (_) { return null; }
  }

  function cacheWrite() {
    try {
      const items = {};
      CATEGORIES.forEach((c) => { items[c.key] = []; });
      state.markers.forEach((m) => { items[m.cat].push([m.id, Number(m.lat.toFixed(6)), Number(m.lng.toFixed(6))]); });
      localStorage.setItem(CACHE_KEY, JSON.stringify({ sig: cacheSignature(), t: Date.now(), items }));
    } catch (_) { /* armazenamento desativado */ }
  }

  function loadFromCache(items) {
    CATEGORIES.forEach((c) => {
      const places = (items[c.key] || []).filter((it) => Array.isArray(it) && typeof it[0] === 'string' && Number.isFinite(it[1]) && Number.isFinite(it[2]))
        .map(([id, lat, lng]) => ({ id, cached: true, location: { lat: () => lat, lng: () => lng } }));
      addCategory(c, places);
    });
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
      '<span class="rocha63-ico">' + svgIcon(category.icon) + '</span>' + esc(category.label) + ' <small>' + (count == null ? '+' : count) + '</small></button>';
  }

  function visibleKeys() {
    return CATEGORIES.filter((c) => state.loaded.has(c.key) && state.counts[c.key]).map((c) => c.key);
  }

  function syncLegend() {
    if (!state.legend) return;
    state.legend.querySelectorAll('button[data-cat]').forEach((b) => {
      const on = state.active.has(b.getAttribute('data-cat'));
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    const all = state.legend.querySelector('button[data-all]');
    if (all) {
      const allOn = visibleKeys().every((k) => state.active.has(k));
      all.classList.toggle('on', allOn);
      all.setAttribute('aria-pressed', String(allOn));
    }
  }

  async function onLegendClick(event) {
    const allBtn = event.target.closest('button[data-all]');
    if (allBtn) {
      const keys = visibleKeys();
      const show = !keys.every((k) => state.active.has(k));
      keys.forEach((k) => {
        if (show) state.active.add(k); else state.active.delete(k);
        setCategoryVisible(k, show);
      });
      syncLegend();
      return;
    }
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
          btn.title = 'Nenhum encontrado por perto';
        }
      }
    }
    setCategoryVisible(category.key, state.active.has(category.key));
    syncLegend();
  }

  function buildLegend() {
    if (state.legend) state.legend.remove();
    const legend = document.createElement('nav');
    legend.id = 'rocha63-poi-legend';
    legend.setAttribute('aria-label', 'Filtrar pontos de interesse');
    legend.innerHTML = '<div class="rocha63-chips">' +
      '<button type="button" class="rocha63-all on" data-all aria-pressed="true">Todos</button>' +
      CATEGORIES.filter((c) => !state.loaded.has(c.key) || state.counts[c.key]).map(chip).join('') + '</div>';
    legend.addEventListener('click', onLegendClick);
    document.getElementById('main').appendChild(legend);
    state.legend = legend;
    syncLegend();
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
    let failures = 0;
    const cached = cacheRead();
    if (cached) {
      loadFromCache(cached);
    } else {
      const results = await Promise.allSettled(SEARCHES.map(runSearch));
      const ok = [];
      results.forEach((res, i) => {
        if (res.status === 'fulfilled') { ok.push({ search: SEARCHES[i], places: res.value }); return; }
        failures += 1;
        SEARCHES[i].cats.forEach((c) => state.active.delete(c.key));
        console.warn('[Rocha R63] Busca falhou para', SEARCHES[i].cats.map((c) => c.key).join(', '), res.reason);
      });
      addResults(ok);
      if (!failures && state.markers.length) cacheWrite();
    }
    if (state.markers.length) buildLegend();
    else if (failures) notice('Pontos do entorno indispon\u00edveis: habilite a Places API (New) na chave do Google.');
    console.info('[Rocha R66] Pontos de interesse adicionados:', state.markers.length, cached ? '(cache local, sem buscas)' : '');
  };
})();
