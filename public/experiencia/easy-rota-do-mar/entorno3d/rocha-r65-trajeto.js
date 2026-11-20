/* Rocha R65: distancia e tempo do Easy Rota do Mar ate cada ponto do entorno.
   Usa a classe Route da Maps JavaScript API (Routes API) com a mesma chave do
   mapa 3D: trajeto real pelas ruas de carro e a pe, linha do caminho de carro
   desenhada no mapa 3D e camera enquadrando o trajeto fora do painel.
   So calcula quando o visitante abre um ponto (2 consultas por ponto, guardadas
   enquanto a pagina estiver aberta). Sem a Routes API habilitada, mostra apenas
   a distancia em linha reta, calculada no proprio navegador. */
(function () {
  'use strict';

  const ORIGEM = 'Easy Rota do Mar';
  const COR_LINHA = '#3ae9ff';
  const CONTORNO_LINHA = '#04263d';
  const ALTURA_LINHA = 4;
  const METROS_POR_GRAU = 111320;
  const MODOS = [
    { chave: 'carro', modo: 'DRIVING', rotulo: 'De carro', campos: ['distanceMeters', 'durationMillis', 'path'] },
    { chave: 'pe', modo: 'WALKING', rotulo: 'A p\u00e9', campos: ['distanceMeters', 'durationMillis'] }
  ];
  const ICONES = {
    carro: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 16.5H3.8a.8.8 0 0 1-.8-.8v-2.9c0-.6.4-1.1 1-1.3l2.1-.6 1.9-3.3a2 2 0 0 1 1.7-1h4.7a2 2 0 0 1 1.6.8l2.6 3.4 2 .5c.7.2 1.2.8 1.2 1.5v2.9a.8.8 0 0 1-.8.8H19"/><path d="M9 16.5h6"/><path d="M7.4 11.3h11.1"/><circle cx="7" cy="16.5" r="2"/><circle cx="17" cy="16.5" r="2"/></svg>',
    pe: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="13.6" cy="4.3" r="1.8"/><path d="M12.9 14.4l.9-5"/><path d="M13.8 9.4l-3.3 1.7-1.3 3"/><path d="M13.8 9.4l2.1 2.5 2.7.9"/><path d="M12.9 14.4l-2.4 6.6"/><path d="M12.9 14.4l2.8 2.9.6 3.7"/></svg>',
    reta: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6-5.6-6-10.5a6 6 0 0 1 12 0C18 15.4 12 21 12 21z"/><circle cx="12" cy="10.5" r="2.2"/></svg>'
  };

  const estado = { mapa: null, maps3d: null, lib: null, cache: new Map(), falhas: 0, desligado: false, linha: null, vez: 0 };

  function ponto(p) {
    if (!p) return null;
    const lat = typeof p.lat === 'function' ? p.lat() : p.lat;
    const lng = typeof p.lng === 'function' ? p.lng() : p.lng;
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }

  function linhaReta(a, b) {
    const R = 6371000;
    const rad = (d) => d * Math.PI / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function formatarDistancia(m) {
    if (!Number.isFinite(m) || m < 0) return '';
    const arred = Math.max(10, Math.round(m / 10) * 10);
    if (arred < 1000) return arred + ' m';
    const km = m / 1000;
    return (km < 10 ? km.toFixed(1) : String(Math.round(km))).replace('.', ',') + ' km';
  }

  function formatarTempo(ms) {
    if (!Number.isFinite(ms) || ms < 0) return '';
    const min = Math.max(1, Math.round(ms / 60000));
    if (min < 60) return min + ' min';
    const h = Math.floor(min / 60);
    const resto = min % 60;
    return h + ' h' + (resto ? ' ' + String(resto).padStart(2, '0') + ' min' : '');
  }

  function biblioteca() {
    if (!estado.lib) {
      estado.lib = google.maps.importLibrary('routes').then((lib) => {
        if (!lib || !lib.Route || typeof lib.Route.computeRoutes !== 'function') throw new Error('Classe Route indisponivel nesta versao da Maps JavaScript API');
        return lib;
      });
      estado.lib.catch(() => { estado.lib = null; });
    }
    return estado.lib;
  }

  async function rota(Route, origem, destino, modo) {
    const resposta = await Route.computeRoutes({
      origin: { lat: origem.lat, lng: origem.lng },
      destination: { lat: destino.lat, lng: destino.lng },
      travelMode: modo.modo,
      fields: modo.campos,
      language: 'pt-BR',
      region: 'br'
    });
    const r = resposta && resposta.routes && resposta.routes[0];
    if (!r || !Number.isFinite(r.distanceMeters) || !Number.isFinite(r.durationMillis)) {
      const semRota = new Error('Sem trajeto ' + modo.modo);
      semRota.semRota = true;
      throw semRota;
    }
    return { metros: r.distanceMeters, ms: r.durationMillis, caminho: Array.isArray(r.path) ? r.path : [] };
  }

  // Resultado: { estimado:false, reta, carro:{metros,ms,caminho}|null, pe:{...}|null } ou { estimado:true, reta }.
  function calcular(origem, destino, chave) {
    const a = ponto(origem);
    const b = ponto(destino);
    if (!a || !b) return Promise.resolve(null);
    const id = chave || b.lat.toFixed(6) + ',' + b.lng.toFixed(6);
    if (estado.cache.has(id)) return estado.cache.get(id);
    const reta = linhaReta(a, b);
    const tarefa = (async () => {
      if (estado.desligado) return { estimado: true, reta };
      try {
        const { Route } = await biblioteca();
        const res = await Promise.allSettled(MODOS.map((m) => rota(Route, a, b, m)));
        const saida = { estimado: false, reta };
        MODOS.forEach((m, i) => { saida[m.chave] = res[i].status === 'fulfilled' ? res[i].value : null; });
        if (MODOS.every((m) => !saida[m.chave])) {
          // A API respondeu, mas nao ha caminho pelas ruas: nao conta como falha da API.
          if (res.every((x) => x.reason && x.reason.semRota)) { estado.falhas = 0; return { estimado: true, reta, semRota: true }; }
          throw res[0].reason || new Error('Sem trajeto');
        }
        estado.falhas = 0;
        return saida;
      } catch (erro) {
        estado.falhas += 1;
        if (estado.falhas >= 2) estado.desligado = true;
        estado.cache.delete(id);
        console.warn('[Rocha R65] Trajeto indisponivel. Habilite a "Routes API" no Google Cloud e libere-a na mesma chave do mapa:', erro);
        return { estimado: true, reta };
      }
    })();
    estado.cache.set(id, tarefa);
    return tarefa;
  }

  function removerLinha() {
    if (estado.linha) {
      try { estado.linha.remove(); } catch (_) { /* ja removida */ }
    }
    estado.linha = null;
  }

  function desenhar(caminho) {
    removerLinha();
    const Linha = estado.maps3d && estado.maps3d.Polyline3DElement;
    if (!estado.mapa || typeof Linha !== 'function') return false;
    const pontos = (caminho || []).map(ponto).filter(Boolean).map((p) => ({ lat: p.lat, lng: p.lng, altitude: ALTURA_LINHA }));
    if (pontos.length < 2) return false;
    const estilo = { altitudeMode: 'RELATIVE_TO_GROUND', strokeColor: COR_LINHA, outerColor: CONTORNO_LINHA, strokeWidth: 9, outerWidth: 0.45, drawsOccludedSegments: true };
    try {
      let linha;
      try { linha = new Linha(Object.assign({ path: pontos }, estilo)); } catch (_) { linha = new Linha(Object.assign({ coordinates: pontos }, estilo)); }
      if (linha.path == null && 'coordinates' in linha) linha.coordinates = pontos;
      estado.mapa.append(linha);
      estado.linha = linha;
      return true;
    } catch (erro) {
      console.warn('[Rocha R65] Linha do trajeto indisponivel:', erro);
      return false;
    }
  }

  function deslocar(p, metros, rumo) {
    const r = rumo * Math.PI / 180;
    return {
      lat: p.lat + metros * Math.cos(r) / METROS_POR_GRAU,
      lng: p.lng + metros * Math.sin(r) / (METROS_POR_GRAU * Math.cos(p.lat * Math.PI / 180))
    };
  }

  function caixa(el) {
    if (!el || el.hidden || typeof el.getBoundingClientRect !== 'function') return null;
    const r = el.getBoundingClientRect();
    return r && r.width > 0 && r.height > 0 ? r : null;
  }

  // Parte da tela que fica livre: tira o painel (a direita no computador,
  // embaixo no celular) e a legenda do topo, quando ela cobre a area livre.
  function areaLivre(painel, outros) {
    const W = Math.max(1, window.innerWidth || 1);
    const H = Math.max(1, window.innerHeight || 1);
    const a = { x0: 0, x1: W, y0: 0, y1: H, W, H };
    const p = caixa(painel);
    if (p && p.left > W * 0.35) a.x1 = Math.min(a.x1, p.left - 8);
    else if (p && p.top > H * 0.2) a.y1 = Math.min(a.y1, p.top - 8);
    (outros || []).forEach((el) => {
      const r = caixa(el);
      if (!r || r.bottom > H * 0.45) return;
      const cobre = Math.min(r.right, a.x1) - Math.max(r.left, a.x0);
      if (cobre > (a.x1 - a.x0) * 0.4) a.y0 = Math.max(a.y0, r.bottom + 8);
    });
    if (a.x1 - a.x0 < W * 0.3) { a.x0 = 0; a.x1 = W; }
    if (a.y1 - a.y0 < H * 0.3) { a.y0 = 0; a.y1 = H; }
    return a;
  }

  // Camera enquadra o trajeto no meio da area livre da tela.
  function enquadrar(pontos, painel, outros) {
    const mapa = estado.mapa;
    if (!mapa || typeof mapa.flyCameraTo !== 'function') return null;
    const lista = (pontos || []).map(ponto).filter(Boolean);
    if (lista.length < 2) return null;
    let n = -90; let s = 90; let l = -180; let o = 180;
    lista.forEach((p) => { n = Math.max(n, p.lat); s = Math.min(s, p.lat); l = Math.max(l, p.lng); o = Math.min(o, p.lng); });
    const meio = { lat: (n + s) / 2, lng: (l + o) / 2 };
    const extensao = Math.max((n - s) * METROS_POR_GRAU, (l - o) * METROS_POR_GRAU * Math.cos(meio.lat * Math.PI / 180), 150);
    const tilt = 50;
    const t = tilt * Math.PI / 180;
    const heading = Number.isFinite(mapa.heading) ? mapa.heading : 0;
    const a = areaLivre(painel, outros);
    const kv = 0.4;
    const kh = kv * a.W / a.H;
    const fracW = (a.x1 - a.x0) / a.W;
    const fracH = (a.y1 - a.y0) / a.H;
    const range = Math.min(8000, Math.max(500, Math.max(
      extensao / (1.4 * kh * fracW),
      extensao * Math.cos(t) / (1.4 * kv * fracH)
    ) + 150));
    const gx = ((a.x0 + a.x1) / 2 - a.W / 2) / (a.W / 2);
    const fy = (a.H / 2 - (a.y0 + a.y1) / 2) / (a.H / 2);
    let centro = meio;
    if (Math.abs(gx) > 0.01) centro = deslocar(centro, -gx * range * kh, heading + 90);
    if (Math.abs(fy) > 0.01) {
      const f = fy * kv;
      const d = f * range / Math.max(0.2, Math.cos(t) - f * Math.sin(t));
      centro = deslocar(centro, Math.max(-0.8 * range, Math.min(0.8 * range, d)), heading + 180);
    }
    const atual = mapa.center;
    const altitude = atual && Number.isFinite(atual.altitude) ? atual.altitude : 0;
    const camera = { center: { lat: centro.lat, lng: centro.lng, altitude }, range: Math.round(range), tilt, heading };
    try { mapa.flyCameraTo({ endCamera: camera, durationMillis: 1600 }); } catch (erro) { console.warn('[Rocha R65] Enquadramento:', erro); }
    return camera;
  }

  function html() {
    return '<section class="rocha65-trajeto" data-estado="calculando" aria-live="polite" aria-busy="true">' +
      '<h4>Saindo do ' + ORIGEM + '</h4>' +
      '<div class="rocha65-modos">' + MODOS.map((m) =>
        '<div class="rocha65-modo" data-modo="' + m.chave + '"><span class="rocha65-ico">' + ICONES[m.chave] + '</span>' +
        '<span class="rocha65-rot">' + m.rotulo + '</span> <b>00 min</b> <small>0,0 km</small></div>').join('') + '</div>' +
      '<p class="rocha65-nota">Calculando o trajeto pelas ruas\u2026</p></section>';
  }

  function preencher(bloco, r, comLinha) {
    const modos = bloco.querySelector('.rocha65-modos');
    const nota = bloco.querySelector('.rocha65-nota');
    bloco.removeAttribute('aria-busy');
    if (r && !r.estimado) {
      let n = 0;
      MODOS.forEach((m) => {
        const el = modos.querySelector('[data-modo="' + m.chave + '"]');
        const v = r[m.chave];
        if (!el) return;
        if (!v) { el.remove(); return; }
        el.querySelector('b').textContent = formatarTempo(v.ms);
        el.querySelector('small').textContent = formatarDistancia(v.metros);
        n += 1;
      });
      modos.setAttribute('data-n', String(n));
      bloco.setAttribute('data-estado', 'ok');
      nota.textContent = 'Trajeto pelas ruas calculado pelo Google, sem tr\u00e2nsito em tempo real.' +
        (comLinha ? ' A linha no mapa mostra o caminho de carro.' : '');
      return;
    }
    modos.innerHTML = '<div class="rocha65-modo" data-modo="reta"><span class="rocha65-ico">' + ICONES.reta + '</span>' +
      '<span class="rocha65-rot">Em linha reta</span> <b></b> <small>dist\u00e2ncia aproximada</small></div>';
    modos.setAttribute('data-n', '1');
    modos.querySelector('b').textContent = r ? formatarDistancia(r.reta) : '';
    bloco.setAttribute('data-estado', 'reta');
    nota.textContent = 'Tempo de trajeto indispon\u00edvel no momento.';
  }

  function mostrar(painel, origem, destino, chave) {
    removerLinha();
    const vez = ++estado.vez;
    const bloco = painel && painel.querySelector('.rocha65-trajeto');
    const a = ponto(origem);
    const b = ponto(destino);
    if (!bloco || !a || !b) return Promise.resolve(null);
    return calcular(a, b, chave).then((r) => {
      if (vez !== estado.vez || !bloco.isConnected) return null;
      const caminho = r && r.carro && r.carro.caminho;
      const comLinha = !!(caminho && caminho.length > 1 && desenhar(caminho));
      preencher(bloco, r, comLinha);
      if (comLinha) enquadrar(caminho.concat([a, b]), painel, [document.getElementById('rocha63-poi-legend')]);
      return r;
    }).catch((erro) => {
      console.warn('[Rocha R65] Painel de trajeto:', erro);
      return null;
    });
  }

  function linkGoogleMaps(origem, destino, placeId) {
    const a = ponto(origem);
    const b = ponto(destino);
    if (!a || !b) return '';
    return 'https://www.google.com/maps/dir/?api=1&origin=' + a.lat.toFixed(6) + ',' + a.lng.toFixed(6) +
      '&destination=' + b.lat.toFixed(6) + ',' + b.lng.toFixed(6) +
      (placeId ? '&destination_place_id=' + encodeURIComponent(placeId) : '') + '&travelmode=driving';
  }

  window.rochaR65Trajeto = {
    configurar(mapa, maps3d) { estado.mapa = mapa || null; estado.maps3d = maps3d || null; },
    html,
    mostrar,
    limpar() { estado.vez += 1; removerLinha(); },
    linkGoogleMaps,
    calcular,
    desenhar,
    enquadrar,
    formatarDistancia,
    formatarTempo,
    linhaReta
  };
})();
