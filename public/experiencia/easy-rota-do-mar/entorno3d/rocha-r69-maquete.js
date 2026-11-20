/* Rocha R69: maquete 3D do Easy Rota do Mar no mapa (2 blocos de 13 andares
   mais o terreo), montada a partir da fachada oficial e da implantacao.
   R70: o R do logotipo da Rocha na torre azul do topo (frente e tras).
   R71: calibrada pela fotomontagem oficial (blocos paralelos a rua da frente,
   lado do R virado para ela) e visivel para todos; o pino fica sobre os predios.
   Usa o Model3DElement do Google (glTF puro, sem extensoes, como o Google exige).
   Enquanto a posicao nao for calibrada, a maquete so aparece no modo de ajuste:
   ?ajustepredio=1 mostra a maquete e um painel para alinhar no terreno (setas,
   giro, altura, tamanho e clique no mapa). "Copiar ajustes" gera os numeros que
   depois ficam fixos no codigo (FIXO) e ligam a maquete para todos. */
(function () {
  'use strict';

  const ARQUIVO = 'easy-rota-maquete-r71.glb';
  const CHAVE = 'rocha69-maquete-ajuste-v1';
  // Ajuste fixo para todos os visitantes (R71). publica: false = so no modo de ajuste.
  const FIXO = { norte: 39.2, leste: 20.8, giro: 38, altura: 0, escala: 1, eixo: 270, publica: true };
  // Com a maquete, o pino da marca sobe acima dos predios (42 m + torre do R).
  const ALTURA_PINO = 58;
  const LIMITES = { norte: [-200, 200], leste: [-200, 200], giro: [0, 359], altura: [-20, 20], escala: [0.8, 1.2] };
  // Casas decimais guardadas (10 cm, 1 grau, 1%): numeros curtos para copiar.
  const CASAS = { norte: 1, leste: 1, giro: 0, altura: 1, escala: 2 };
  const EIXOS = [[270, 'Em p\u00e9 (padr\u00e3o)'], [90, 'Alternativo 1'], [0, 'Alternativo 2'], [180, 'Alternativo 3']];
  const M_GRAU = 111320;

  const estado = { mapa: null, modelo: null, centro: null, ajuste: null };

  function parametro(nome) {
    try {
      const proprio = new URLSearchParams(location.search).get(nome);
      if (proprio) return proprio;
      if (window.top && window.top !== window) return new URLSearchParams(window.top.location.search).get(nome);
    } catch (_) { /* frame com restricao */ }
    return null;
  }

  function limitar(chave, valor) {
    const n = Number(valor);
    const faixa = LIMITES[chave];
    if (!Number.isFinite(n)) return FIXO[chave];
    const v = faixa ? Math.min(faixa[1], Math.max(faixa[0], n)) : n;
    const f = Math.pow(10, CASAS[chave] || 0);
    return Math.round(v * f) / f;
  }

  function lerAjuste() {
    const base = Object.assign({}, FIXO);
    try {
      const salvo = JSON.parse(localStorage.getItem(CHAVE) || 'null');
      if (salvo) {
        Object.keys(LIMITES).forEach((k) => { if (k in salvo) base[k] = limitar(k, salvo[k]); });
        if (EIXOS.some(([e]) => e === Number(salvo.eixo))) base.eixo = Number(salvo.eixo);
      }
    } catch (_) { /* armazenamento desativado */ }
    return base;
  }

  function salvarAjuste() {
    try { localStorage.setItem(CHAVE, JSON.stringify(estado.ajuste)); } catch (_) { /* opcional */ }
  }

  function posicao() {
    const a = estado.ajuste;
    const lat = estado.centro.lat + a.norte / M_GRAU;
    const lng = estado.centro.lng + a.leste / (M_GRAU * Math.cos(lat * Math.PI / 180));
    return { lat, lng, altitude: a.altura };
  }

  function moverPino() {
    if (typeof window.rochaR62PinPosicao === 'function') window.rochaR62PinPosicao(posicao());
  }

  function aplicar() {
    const m = estado.modelo;
    if (!m) return;
    const a = estado.ajuste;
    m.position = posicao();
    m.orientation = { heading: a.giro, tilt: a.eixo, roll: 0 };
    m.scale = a.escala;
    moverPino();
  }

  function texto(a) {
    return JSON.stringify({ norte: a.norte, leste: a.leste, giro: a.giro, altura: a.altura, escala: a.escala, eixo: a.eixo });
  }

  function painel() {
    if (document.getElementById('rocha69-painel')) return;
    const a = estado.ajuste;
    const el = document.createElement('section');
    el.id = 'rocha69-painel';
    el.innerHTML = '<strong>Ajustar pr\u00e9dio (maquete)</strong>' +
      '<p>Alinhe os dois blocos no terreno, com o R virado para a avenida: clique no mapa para levar o centro at\u00e9 l\u00e1 ou use os controles. S\u00f3 voc\u00ea v\u00ea esta tela.</p>' +
      '<div class="rocha69-setas">' +
        '<button type="button" data-mover="norte" data-passo="2">\u2191 Norte</button>' +
        '<button type="button" data-mover="norte" data-passo="-2">\u2193 Sul</button>' +
        '<button type="button" data-mover="leste" data-passo="-2">\u2190 Oeste</button>' +
        '<button type="button" data-mover="leste" data-passo="2">\u2192 Leste</button>' +
      '</div>' +
      '<label>Giro <output data-saida="giro"></output><input type="range" data-campo="giro" min="0" max="359" step="1"></label>' +
      '<label>Altura da base <output data-saida="altura"></output><input type="range" data-campo="altura" min="-20" max="20" step="0.5"></label>' +
      '<label>Tamanho <output data-saida="escala"></output><input type="range" data-campo="escala" min="0.8" max="1.2" step="0.01"></label>' +
      '<label class="rocha69-eixo">Se n\u00e3o aparecer em p\u00e9, troque: <select data-campo="eixo">' +
        EIXOS.map(([v, n]) => '<option value="' + v + '">' + n + '</option>').join('') + '</select></label>' +
      '<div class="rocha69-acoes"><button type="button" data-acao="copiar">Copiar ajustes</button><button type="button" data-acao="restaurar">Restaurar</button></div>' +
      '<output class="rocha69-status" aria-live="polite"></output>';
    (document.getElementById('main') || document.body).appendChild(el);
    const status = el.querySelector('.rocha69-status');
    const unidades = { giro: '\u00b0', altura: ' m', escala: '\u00d7' };
    function mostrar() {
      el.querySelectorAll('[data-campo]').forEach((c) => { c.value = String(a[c.getAttribute('data-campo')]); });
      el.querySelectorAll('[data-saida]').forEach((o) => {
        const k = o.getAttribute('data-saida');
        o.textContent = (k === 'escala' ? a[k].toFixed(2) : String(a[k])) + unidades[k];
      });
      status.textContent = 'Norte ' + a.norte.toFixed(1) + ' m \u00b7 Leste ' + a.leste.toFixed(1) + ' m';
    }
    function mudou() { aplicar(); salvarAjuste(); mostrar(); }
    el.addEventListener('input', (ev) => {
      const c = ev.target.closest('[data-campo]');
      if (!c) return;
      const k = c.getAttribute('data-campo');
      a[k] = k === 'eixo' ? Number(c.value) : limitar(k, c.value);
      mudou();
    });
    el.addEventListener('change', (ev) => {
      if (ev.target.matches('select[data-campo]')) { a.eixo = Number(ev.target.value); mudou(); }
    });
    el.addEventListener('click', async (ev) => {
      const seta = ev.target.closest('[data-mover]');
      if (seta) {
        const k = seta.getAttribute('data-mover');
        a[k] = limitar(k, a[k] + Number(seta.getAttribute('data-passo')));
        mudou();
        return;
      }
      const acao = ev.target.closest('[data-acao]');
      if (!acao) return;
      if (acao.getAttribute('data-acao') === 'restaurar') {
        Object.assign(a, FIXO);
        mudou();
        return;
      }
      const dados = texto(a);
      try {
        await navigator.clipboard.writeText(dados);
        status.textContent = 'Ajustes copiados. Cole na conversa: ' + dados;
      } catch (_) {
        status.textContent = 'Copie e mande na conversa: ' + dados;
      }
    });
    estado.mapa.addEventListener('gmp-click', (ev) => {
      // Clique em um pino do entorno nao move a maquete: so clique no chao do mapa.
      if (ev && ev.target && ev.target !== estado.mapa) return;
      const p = ev && ev.position;
      if (!p || !Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return;
      a.norte = limitar('norte', (p.lat - estado.centro.lat) * M_GRAU);
      a.leste = limitar('leste', (p.lng - estado.centro.lng) * M_GRAU * Math.cos(p.lat * Math.PI / 180));
      mudou();
    });
    mostrar();
  }

  function iniciar(mapa, maps3d, centro) {
    if (!mapa || !maps3d || !centro || !Number.isFinite(centro.lat) || !Number.isFinite(centro.lng)) return null;
    if (estado.modelo) return estado.modelo;
    const ajustando = parametro('ajustepredio') === '1';
    if (!FIXO.publica && !ajustando) return null;
    if (typeof maps3d.Model3DElement !== 'function') {
      console.warn('[Rocha R69] Model3DElement indisponivel; o mapa segue sem a maquete.');
      return null;
    }
    estado.mapa = mapa;
    estado.centro = { lat: centro.lat, lng: centro.lng };
    estado.ajuste = ajustando ? lerAjuste() : Object.assign({}, FIXO);
    const a = estado.ajuste;
    let src = ARQUIVO;
    try { src = new URL(ARQUIVO, document.baseURI).href; } catch (_) { /* caminho relativo */ }
    const modelo = new maps3d.Model3DElement({
      src,
      position: posicao(),
      altitudeMode: 'RELATIVE_TO_GROUND',
      orientation: { heading: a.giro, tilt: a.eixo, roll: 0 },
      scale: a.escala
    });
    modelo.id = 'rocha69-maquete';
    modelo.addEventListener('gmp-error', () => console.warn('[Rocha R69] A maquete nao carregou; o mapa segue normal.'));
    mapa.append(modelo);
    estado.modelo = modelo;
    if (typeof window.rochaR62PinAltitude === 'function') window.rochaR62PinAltitude(ALTURA_PINO);
    moverPino();
    if (ajustando) painel();
    console.info('[Rocha R69] Maquete do Easy Rota do Mar no mapa' + (ajustando ? ' (modo de ajuste).' : '.'));
    return modelo;
  }

  window.rochaR69Maquete = { iniciar, FIXO, ALTURA_PINO };
})();
