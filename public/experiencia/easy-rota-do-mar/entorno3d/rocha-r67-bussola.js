/* Rocha R67: bussola (rosa dos ventos) no estilo da plataforma.
   Esconde os botoes padrao do Google no mapa 3D (defaultUIHidden: bussola,
   tela cheia e seletor de mapa). O logotipo e a atribuicao do Google NAO sao
   botoes e continuam visiveis, como exigem os termos do Google Maps Platform.
   No lugar da bussola do Google entra uma rosa dos ventos azul-marinho com
   aro ciano e agulha do norte em vermelho, que gira junto com o mapa.
   Tocar nela volta o norte para cima. */
(function () {
  'use strict';

  const estado = { mapa: null, botao: null, cartao: null, ultimo: null, laco: false };

  function rosaSvg() {
    const C = 50;
    const p = (graus, r) => {
      const a = graus * Math.PI / 180;
      return (C + r * Math.sin(a)).toFixed(2) + ' ' + (C - r * Math.cos(a)).toFixed(2);
    };
    const ponta = (graus, r, base, claro, escuro) =>
      '<path d="M50 50L' + p(graus - 45, base) + 'L' + p(graus, r) + 'Z" fill="' + escuro + '"/>' +
      '<path d="M50 50L' + p(graus, r) + 'L' + p(graus + 45, base) + 'Z" fill="' + claro + '"/>';
    let marcas = '';
    for (let g = 0; g < 360; g += 15) {
      if (g % 90 === 0) continue;
      const maior = g % 45 === 0;
      marcas += '<path d="M' + p(g, maior ? 38.8 : 40.2) + 'L' + p(g, 43.6) + '" stroke="' +
        (maior ? '#7fe9f7' : 'rgba(160,236,248,.55)') + '" stroke-width="' + (maior ? 1.6 : 1) + '" stroke-linecap="round"/>';
    }
    const letra = (txt, graus, cor, tam) => {
      const [x, y] = p(graus, 42.4).split(' ');
      return '<text x="' + x + '" y="' + y + '" fill="' + cor + '" font-size="' + tam + '" font-weight="700" text-anchor="middle" dominant-baseline="central" transform="rotate(' + graus + ' ' + x + ' ' + y + ')">' + txt + '</text>';
    };
    const rosa =
      [45, 135, 225, 315].map((g) => ponta(g, 22, 5, '#3ae9ff', '#0b7fa3')).join('') +
      [90, 180, 270].map((g) => ponta(g, 33, 7, '#eafcff', '#86bccd')).join('') +
      ponta(0, 33, 7, '#ff7b7b', '#d3203e');
    return '<svg viewBox="0 0 100 100" aria-hidden="true" font-family="Arial, sans-serif">' +
      '<defs><radialGradient id="rocha67-fundo" cx="38%" cy="30%" r="78%"><stop offset="0" stop-color="#0f6a9a"/><stop offset=".55" stop-color="#062c47"/><stop offset="1" stop-color="#021422"/></radialGradient>' +
      '<linearGradient id="rocha67-brilho" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".32"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
      '<circle cx="50" cy="50" r="47" fill="url(#rocha67-fundo)" stroke="#3ae9ff" stroke-width="2.4"/>' +
      '<circle cx="50" cy="50" r="36.8" fill="none" stroke="rgba(160,248,255,.32)" stroke-width="1"/>' +
      '<g data-cartao>' + marcas + rosa +
        letra('N', 0, '#ff8a8a', 11.5) + letra('L', 90, '#cfeef6', 9) + letra('S', 180, '#cfeef6', 9) + letra('O', 270, '#cfeef6', 9) + '</g>' +
      '<circle cx="50" cy="50" r="3.6" fill="#eafcff" stroke="#062c47" stroke-width="1.4"/>' +
      '<path d="M11 44A39.5 39.5 0 0 1 89 44Q50 30 11 44Z" fill="url(#rocha67-brilho)"/>' +
      '</svg>';
  }

  function rumo() {
    const h = Number(estado.mapa && estado.mapa.heading) || 0;
    return ((h % 360) + 360) % 360;
  }

  // Gira o cartao da rosa ao contrario do rumo da camera: o N aponta para o norte real.
  function aplicar() {
    if (!estado.mapa || !estado.cartao) return;
    const h = rumo();
    if (h === estado.ultimo) return;
    estado.ultimo = h;
    estado.cartao.setAttribute('transform', 'rotate(' + (-h).toFixed(2) + ' 50 50)');
    estado.botao.classList.toggle('rocha67-no-norte', h < 0.5 || h > 359.5);
  }

  function norte() {
    const mapa = estado.mapa;
    if (!mapa) return;
    const h = rumo();
    if (h < 0.5 || h > 359.5) return;
    try {
      if (typeof mapa.flyCameraTo === 'function') {
        mapa.flyCameraTo({ endCamera: { center: mapa.center, range: mapa.range, tilt: mapa.tilt, heading: 0 }, durationMillis: 700 });
        return;
      }
    } catch (erro) {
      console.warn('[Rocha R67] Bussola:', erro);
    }
    mapa.heading = 0;
  }

  function iniciar(mapa) {
    if (!mapa) return null;
    estado.mapa = mapa;
    try { mapa.defaultUIHidden = true; } catch (_) { /* versao sem a opcao: fica a bussola do Google */ }
    if (!estado.botao) {
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.id = 'rocha67-bussola';
      botao.title = 'Apontar o norte para cima';
      botao.setAttribute('aria-label', 'B\u00fassola: apontar o norte para cima');
      botao.innerHTML = rosaSvg();
      botao.addEventListener('click', norte);
      (document.getElementById('main') || document.body).appendChild(botao);
      estado.botao = botao;
      estado.cartao = botao.querySelector('[data-cartao]');
    }
    estado.ultimo = null;
    mapa.addEventListener('gmp-headingchange', aplicar);
    // Reserva: confere o rumo a cada quadro (leitura barata) caso o evento nao chegue.
    if (!estado.laco && typeof requestAnimationFrame === 'function') {
      estado.laco = true;
      const quadro = () => { aplicar(); requestAnimationFrame(quadro); };
      requestAnimationFrame(quadro);
    }
    aplicar();
    return estado.botao;
  }

  window.rochaR67Bussola = { iniciar, norte, rosaSvg };
})();
