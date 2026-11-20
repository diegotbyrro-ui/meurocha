/* Rocha R64: abertura cinematografica do Entorno 3D.
   Enquanto a Google Maps JavaScript API e o terreno 3D carregam, a camera sai do
   espaco, se aproxima da Terra (fotos reais da NASA: Blue Marble / Black Marble)
   e desce ate a Serraria, em Maceio. Quando o Google fica pronto, a abertura some
   e o mapa 3D comeca na MESMA vista em que ela termina (~3.500 km de altitude,
   olhando para baixo, norte para cima) e voa ate o empreendimento.

   - Nao usa chave e nao acessa servicos externos: so os arquivos de terra/.
   - Respeita prefers-reduced-motion. Sem WebGL ou sem as imagens, sai de cena e o
     carregamento original continua exatamente como antes.
   - "Pular abertura" sempre disponivel. ?abertura=0 desliga; ?abertura=1 forca.
   - Parametros de inspecao (desenvolvimento): ie_t=segundos, ie_fixo, ie_m=0..1. */
(function () {
  'use strict';

  /* ---------------- matematica ---------------- */
  const V = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    len: (a) => Math.hypot(a[0], a[1], a[2]),
    norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
    lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
    rotY: (v, a) => { const c = Math.cos(a), s = Math.sin(a); return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c]; }
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const rad = (d) => d * Math.PI / 180;
  const latLng = (lat, lng) => [Math.cos(rad(lat)) * Math.sin(rad(lng)), Math.sin(rad(lat)), Math.cos(rad(lat)) * Math.cos(rad(lng))];

  /* ---------------- shaders ---------------- */
  const VERT = 'attribute vec2 p; varying vec2 vUv; void main(){ vUv = p*.5+.5; gl_Position = vec4(p,0.,1.); }';

  // Terra com fotos reais + atmosfera com dispersao de Rayleigh/Mie (raio da Terra = 1).
  const FRAG_CENA = `
  precision highp float;
  uniform vec2 uRes, uTexel;
  uniform float uTempo, uFocal, uPix, uRotTerra, uAlt, uFade, uExpo, uLimpo, uLuz, uRelevoForca;
  uniform vec3 uCam, uSol, uAlvo;
  uniform mat3 uCamRot;
  uniform sampler2D uDia, uNoite, uNuvem, uAgua, uRelevo;
  const float PI = 3.14159265;
  const float RA = 1.045, HR = .008, HM = .0016, GM = .76, SOL = 22.;
  const vec3  BR = vec3(5.8, 13.5, 33.1);
  const float BM = 19.;
  const float RC = 1.006;

  float h13(vec3 p){ p = fract(p*.1031); p += dot(p, p.zyx+31.32); return fract((p.x+p.y)*p.z); }
  vec3  h33(vec3 p){ p = fract(p*vec3(.1031,.1030,.0973)); p += dot(p, p.yxz+33.33); return fract((p.xxy+p.yxx)*p.zyx); }
  float ruido(vec3 x){
    vec3 i = floor(x), f = fract(x); f = f*f*(3.-2.*f);
    return mix(mix(mix(h13(i),h13(i+vec3(1,0,0)),f.x), mix(h13(i+vec3(0,1,0)),h13(i+vec3(1,1,0)),f.x), f.y),
               mix(mix(h13(i+vec3(0,0,1)),h13(i+vec3(1,0,1)),f.x), mix(h13(i+vec3(0,1,1)),h13(i+vec3(1,1,1)),f.x), f.y), f.z);
  }
  float fbm4(vec3 p){ float v=0., a=.5; for(int i=0;i<4;i++){ v+=a*ruido(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=.5; } return v; }
  vec3 rotY(vec3 v, float a){ float c=cos(a), s=sin(a); return vec3(v.x*c+v.z*s, v.y, -v.x*s+v.z*c); }
  vec2 uvDe(vec3 n){ return vec2(atan(n.x, n.z)/(2.*PI) + .5, .5 - asin(clamp(n.y,-1.,1.))/PI); }

  vec2 esfera(vec3 ro, vec3 rd, float r){
    float b = dot(ro,rd), c = dot(ro,ro) - r*r, d = b*b - c;
    if (d < 0.) return vec2(1e9, -1e9);
    d = sqrt(d); return vec2(-b-d, -b+d);
  }
  bool naSombra(vec3 p){ vec2 t = esfera(p, uSol, 1.); return t.x > 0. && t.x < t.y; }
  vec2 profLuz(vec3 p){
    float ds = esfera(p, uSol, RA).y/6.;
    vec2 od = vec2(0.);
    for (int j=0; j<6; j++){
      float h = max(length(p + uSol*(float(j)+.5)*ds) - 1., 0.);
      od += vec2(exp(-h/HR), exp(-h/HM))*ds;
    }
    return od;
  }
  vec3 transSol(vec3 p){
    if (naSombra(p)) return vec3(0.);
    vec2 od = profLuz(p);
    return exp(-(BR*od.x + BM*1.1*od.y));
  }
  void atmosfera(vec3 ro, vec3 rd, float tMax, out vec3 luz, out vec3 tr){
    luz = vec3(0.); tr = vec3(1.);
    vec2 ta = esfera(ro, rd, RA);
    float t0 = max(ta.x, 0.), t1 = min(ta.y, tMax);
    if (ta.x > ta.y || t1 <= t0) return;
    float ds = (t1 - t0)/12.;
    float mu = dot(rd, uSol), g2 = GM*GM;
    float fR = 3./(16.*PI)*(1. + mu*mu);
    float fM = 3./(8.*PI)*((1.-g2)*(1.+mu*mu))/((2.+g2)*pow(1.+g2-2.*GM*mu, 1.5));
    vec2 od = vec2(0.); vec3 sR = vec3(0.), sM = vec3(0.);
    for (int i=0; i<12; i++){
      vec3 p = ro + rd*(t0 + (float(i)+.5)*ds);
      float h = max(length(p) - 1., 0.);
      vec2 d = vec2(exp(-h/HR), exp(-h/HM))*ds;
      od += d;
      if (naSombra(p)) continue;
      vec2 ol = profLuz(p);
      vec3 at = exp(-(BR*(od.x + ol.x) + BM*1.1*(od.y + ol.y)));
      sR += d.x*at; sM += d.y*at;
    }
    luz = SOL*(sR*BR*fR + sM*BM*fM);
    tr = exp(-(BR*od.x + BM*1.1*od.y));
  }

  vec3 estrelas(vec3 d, float S, float dens, float forca){
    vec3 p = d*S, c = floor(p), h = h33(c);
    if (h.x > dens) return vec3(0.);
    vec3 sp = normalize(c + .2 + .6*h33(c+17.3));
    float dist = length(sp - d);
    float tam = min(uPix*(.7 + 1.5*pow(h.y,8.)), .07/S);
    float b = exp(-dist*dist/(tam*tam)) * smoothstep(.19/S, .06/S, dist);
    vec3 cor = h.y < .25 ? vec3(.76,.84,1.) : h.y < .7 ? vec3(1.) : h.y < .9 ? vec3(1.,.93,.83) : vec3(1.,.83,.68);
    return cor * b * forca * (.2 + .8*h.z*h.z);
  }
  vec3 ceu(vec3 d){ return (estrelas(d, 55., .03, 1.4) + estrelas(d, 140., .022, .7) + estrelas(d, 320., .012, .4)) / uExpo; }

  vec3 terra(vec3 ro, vec3 rd, float tT){
    vec3 pW = ro + rd*tT, nW = normalize(pW);
    vec3 n = rotY(nW, -uRotTerra), sol = rotY(uSol, -uRotTerra), v = rotY(-rd, -uRotTerra);
    float lat = asin(clamp(n.y,-1.,1.));
    vec2 uv = uvDe(n);
    vec3 alb = pow(texture2D(uDia, uv).rgb, vec3(2.2));
    float agua = texture2D(uAgua, uv).r;
    float luzes = texture2D(uNoite, uv).r;
    float hL = texture2D(uRelevo, uv + vec2(uTexel.x,0.)).r - texture2D(uRelevo, uv - vec2(uTexel.x,0.)).r;
    float hN = texture2D(uRelevo, uv - vec2(0.,uTexel.y)).r - texture2D(uRelevo, uv + vec2(0.,uTexel.y)).r;
    vec3 leste = normalize(vec3(n.z, 0., -n.x) + vec3(1e-5,0.,0.)), norte = cross(n, leste);
    vec3 nb = normalize(n - (leste*hL/max(cos(lat),.2) + norte*hN) * uRelevoForca * (1.-agua));
    float perto = smoothstep(.6, .15, uAlt);
    alb *= 1. + (fbm4(n*240.) - .5)*.16*perto*(1.-agua);

    float Ls = dot(n, sol), L = dot(nb, sol);
    vec3 Ts = transSol(nW*1.0006);

    // nuvens numa camada acima do chao, derivando devagar
    float deriva = uTempo*.004;
    vec2 tc = esfera(ro, rd, RC);
    vec3 pcW = tc.x > 0. ? ro + rd*tc.x : pW;
    vec3 pc = rotY(normalize(pcW), -uRotTerra);
    vec3 qc = rotY(pc, deriva), q = rotY(n, deriva), solQ = rotY(sol, deriva);
    vec3 qs = normalize(q + solQ*(.006/max(Ls,.15)));
    float C = texture2D(uNuvem, uvDe(qc)).r, Cs = texture2D(uNuvem, uvDe(qs)).r;
    float limpo = 1. - uLimpo*exp(-pow(length(n - uAlvo)/.12, 2.));
    C = smoothstep(.03, .9, C)*limpo; Cs *= limpo;

    float E = SOL/PI;
    vec3 col = alb * Ts * max(L, 0.) * E;
    col *= 1. - .5*Cs*smoothstep(0., .15, Ls);                     // sombra das nuvens
    vec3 hv = normalize(sol + v);                                   // reflexo do Sol no mar
    float fres = .02 + .98*pow(1. - max(dot(n, v), 0.), 5.);
    float nh = max(dot(n, hv), 0.);
    float ondas = .55 + .9*fbm4(n*28.);                              // vento irregular quebra o reflexo
    col += Ts * E * (pow(nh, 300.)*.3*ondas + pow(nh, 30.)*.018) * agua * (.3 + fres) * (1. - C);
    float Lc = dot(pc, sol);
    vec3 corN = transSol(pcW) * max(Lc, 0.) * .85 * E;
    col = mix(col, corN, C*.92);
    float noite = smoothstep(.05, -.12, Ls);                        // luzes das cidades
    col += vec3(1., .72, .42) * pow(luzes, 1.25) * uLuz * noite * (1. - .9*C);
    return col;
  }

  void main(){
    vec2 uv = (gl_FragCoord.xy - .5*uRes)/uRes.y;
    vec3 rd = normalize(uCamRot * vec3(uv, uFocal));
    vec3 ro = uCam;
    vec2 tT = esfera(ro, rd, 1.);
    vec3 col, luz, tr;
    if (tT.x > 0. && tT.x < tT.y){
      col = terra(ro, rd, tT.x);
      atmosfera(ro, rd, tT.x, luz, tr);
      col = col*tr + luz;
    } else {
      atmosfera(ro, rd, 1e9, luz, tr);
      float s = max(dot(rd, uSol), 0.);
      vec3 disco = vec3(1.,.96,.9)*smoothstep(.99985,.99993,s)*60. + vec3(1.,.9,.75)*pow(s,900.)*2.;
      col = (ceu(rd) + disco)*tr + luz;
    }
    col *= uFade * uExpo;
    // curva de filme (ACES) misturada com uma versao que preserva o tom: desertos ficam areia, nao brancos
    float lum = dot(col, vec3(.2126, .7152, .0722));
    vec3 porCanal = clamp((col*(2.51*col + .03))/(col*(2.43*col + .59) + .14), 0., 1.);
    float lumT = clamp((lum*(2.51*lum + .03))/(lum*(2.43*lum + .59) + .14), 0., 1.);
    col = mix(porCanal, clamp(col*(lumT/max(lum, 1e-4)), 0., 1.), .55);
    gl_FragColor = vec4(pow(col, vec3(1./2.2)), 1.);
  }`;

  const FRAG_CLARO = `precision mediump float; varying vec2 vUv; uniform sampler2D uImg; uniform vec2 uTexel;
    void main(){
      vec3 c = texture2D(uImg, vUv + uTexel*vec2(-1.,-1.)).rgb + texture2D(uImg, vUv + uTexel*vec2(1.,-1.)).rgb
             + texture2D(uImg, vUv + uTexel*vec2(-1.,1.)).rgb  + texture2D(uImg, vUv + uTexel*vec2(1.,1.)).rgb;
      c *= .25;
      gl_FragColor = vec4(c * smoothstep(.75, 1., max(c.r, max(c.g, c.b))) * 1.3, 1.);
    }`;
  const FRAG_BLUR = `precision mediump float; varying vec2 vUv; uniform sampler2D uImg; uniform vec2 uDir;
    void main(){
      vec3 c = texture2D(uImg, vUv).rgb * .2270270;
      c += (texture2D(uImg, vUv + uDir*1.3846).rgb + texture2D(uImg, vUv - uDir*1.3846).rgb) * .3162162;
      c += (texture2D(uImg, vUv + uDir*3.2308).rgb + texture2D(uImg, vUv - uDir*3.2308).rgb) * .0702703;
      gl_FragColor = vec4(c, 1.);
    }`;
  const FRAG_FINAL = `precision mediump float; varying vec2 vUv; uniform sampler2D uImg, uBrilho; uniform float uTempo; uniform vec2 uRes;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
    void main(){
      vec2 c = vUv - .5;
      vec3 col = texture2D(uImg, vUv).rgb + texture2D(uBrilho, vUv).rgb * .35;
      col *= 1. - dot(c,c)*.35;
      col += (h(vUv*uRes + fract(uTempo)*91.7) - .5) * .008;
      gl_FragColor = vec4(col, 1.);
    }`;

  const MENSAGENS = [[0, 'Conectando ao satélite…'], [4.5, 'Entrando em órbita…'], [9, 'Localizando o empreendimento…'], [12.5, 'Carregando o relevo em 3D…']];

  function parametro(nome) {
    const ler = (w) => { try { return new URLSearchParams(w.location.search).get(nome); } catch (_) { return null; } };
    const proprio = ler(window);
    if (proprio !== null) return proprio;
    try { if (window.top && window.top !== window) return ler(window.top); } catch (_) { /* frame restrito */ }
    return null;
  }

  let atual = null;   // no maximo uma abertura por pagina

  function iniciar(opcoes) {
    if (atual) return window.rochaR64Intro;
    const cfg = Object.assign({
      raiz: null, lat: -9.6002, lng: -35.7173, pasta: 'terra/',
      titulo: 'Easy Rota do Mar', local: 'Serraria · Maceió/AL',
      duracaoMinima: 14000,   // viagem minima (ms), mesmo que o Google fique pronto antes
      tempoLimite: 28000,     // se o Google nao responder, a abertura sai e o aviso original aparece
      esperaTexturas: 9000    // tempo maximo esperando as fotos da Terra
    }, opcoes || {});
    const raiz = cfg.raiz || document.getElementById('main');
    if (!raiz) return null;
    const tTeste = parametro('ie_t') !== null ? (parseFloat(parametro('ie_t')) || 0) : null;
    const fixo = tTeste !== null && parametro('ie_fixo') !== null;
    const mTeste = parametro('ie_m') !== null ? clamp(parseFloat(parametro('ie_m')) || 0, 0, 1) : null;
    const modo = parametro('abertura');
    if (modo === '0') return null;
    if (modo !== '1' && tTeste === null) {
      try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return null; } catch (_) { /* sem matchMedia */ }
    }

    /* ---------- elementos ---------- */
    const el = document.createElement('div');
    el.id = 'rocha64-intro';
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', 'Abertura: viagem do espaço até o ' + cfg.titulo);
    el.innerHTML =
      '<canvas aria-hidden="true"></canvas><div class="r64-vinheta"></div>' +
      '<div class="r64-alvo" aria-hidden="true"><b></b><b></b><i></i><span></span></div>' +
      '<button type="button" class="r64-pular">Pular abertura</button>' +
      '<div class="r64-hud"><div class="r64-tag">Entorno tridimensional da Rocha</div><div class="r64-titulo"></div>' +
      '<div class="r64-local"></div><div class="r64-status" aria-live="polite"></div><div class="r64-coord"></div>' +
      '<div class="r64-barra"><span></span></div></div>' +
      '<div class="r64-credito">Imagens da Terra: NASA · Blue Marble / Black Marble</div>';
    const canvas = el.querySelector('canvas');
    const elAlvo = el.querySelector('.r64-alvo'), elStatus = el.querySelector('.r64-status'), elCoord = el.querySelector('.r64-coord');
    el.querySelector('.r64-titulo').textContent = cfg.titulo;
    el.querySelector('.r64-local').textContent = cfg.local;
    el.querySelector('.r64-alvo span').textContent = cfg.titulo;
    elStatus.textContent = MENSAGENS[0][1];
    const escreveCoord = (lat, lng) => {
      elCoord.textContent = Math.abs(lat).toFixed(4) + '° ' + (lat < 0 ? 'S' : 'N') + ' · ' + Math.abs(lng).toFixed(4) + '° ' + (lng < 0 ? 'O' : 'L');
    };
    escreveCoord(cfg.lat, cfg.lng);

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: tTeste !== null }) ||
               canvas.getContext('experimental-webgl');
    if (!gl) return null;
    const programa = (frag, nomes) => {
      const sh = (tipo, src) => {
        const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
        return s;
      };
      const p = gl.createProgram();
      gl.attachShader(p, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, frag));
      gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link');
      const u = {}; nomes.forEach((n) => { u[n] = gl.getUniformLocation(p, n); }); return { p, u };
    };
    let pCena, pClaro, pBlur, pFinal;
    try {
      pCena = programa(FRAG_CENA, ['uRes', 'uTexel', 'uTempo', 'uFocal', 'uPix', 'uRotTerra', 'uAlt', 'uFade', 'uExpo', 'uLimpo', 'uLuz',
        'uRelevoForca', 'uCam', 'uSol', 'uAlvo', 'uCamRot', 'uDia', 'uNoite', 'uNuvem', 'uAgua', 'uRelevo']);
      pClaro = programa(FRAG_CLARO, ['uImg', 'uTexel']);
      pBlur = programa(FRAG_BLUR, ['uImg', 'uDir']);
      pFinal = programa(FRAG_FINAL, ['uImg', 'uBrilho', 'uTempo', 'uRes']);
    } catch (erro) {
      console.warn('[Rocha R64] Abertura desativada (WebGL):', erro);
      return null;
    }
    raiz.appendChild(el);

    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    /* ---------- estado ---------- */
    const inst = { saindo: false, encerrado: false, callbacks: [], apiPronta: tTeste !== null };
    atual = inst;
    let raf = 0, observador = null;
    const limite = setTimeout(() => { inst.apiPronta = true; }, cfg.tempoLimite);
    let esperaTex = 0;

    function encerrar(chamar, ms) {
      if (inst.saindo) return;
      inst.saindo = true;
      clearTimeout(limite); clearTimeout(esperaTex);
      if (chamar) inst.callbacks.splice(0).forEach((cb) => { try { cb(); } catch (e) { console.warn('[Rocha R64]', e); } });
      inst.callbacks.length = 0;
      el.style.transitionDuration = ms + 'ms';
      el.classList.add('r64-saindo');
      setTimeout(() => {
        inst.encerrado = true;
        cancelAnimationFrame(raf);
        if (observador) observador.disconnect(); else window.removeEventListener('resize', redimensionar);
        try { const perda = gl.getExtension('WEBGL_lose_context'); if (perda) perda.loseContext(); } catch (_) { /* opcional */ }
        el.remove();
        if (atual === inst) atual = null;
      }, ms + 60);
    }
    inst.pronto = (cb) => {
      inst.apiPronta = true;
      if (typeof cb !== 'function') return;
      if (inst.saindo) cb(); else inst.callbacks.push(cb);
    };
    inst.cancelar = () => encerrar(false, 450);
    inst.pular = () => encerrar(true, 700);
    el.querySelector('.r64-pular').addEventListener('click', () => inst.pular());

    /* ---------- alvos de renderizacao ---------- */
    const fbo = (w, h) => {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return { t, f, w, h, ok };
    };
    const fraco = (() => { try { return matchMedia('(pointer:coarse)').matches || (navigator.deviceMemory && navigator.deviceMemory < 4); } catch (_) { return false; } })();
    let alvos = null, escala = fraco ? 0.7 : 1;
    function redimensionar() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(2, Math.round(el.clientWidth * dpr * escala)), h = Math.max(2, Math.round(el.clientHeight * dpr * escala));
      if (alvos && canvas.width === w && canvas.height === h) return;
      canvas.width = w; canvas.height = h;
      if (alvos) [alvos.cena, alvos.a, alvos.b].forEach((x) => { gl.deleteTexture(x.t); gl.deleteFramebuffer(x.f); });
      const qw = Math.max(1, w >> 2), qh = Math.max(1, h >> 2);
      alvos = { cena: fbo(w, h), a: fbo(qw, qh), b: fbo(qw, qh) };
      alvos.ok = alvos.cena.ok && alvos.a.ok && alvos.b.ok;
    }
    redimensionar();
    if (typeof ResizeObserver === 'function') { observador = new ResizeObserver(() => redimensionar()); observador.observe(el); }
    else window.addEventListener('resize', redimensionar);

    /* ---------- fotos da Terra (NASA) ---------- */
    const r = (!fraco && gl.getParameter(gl.MAX_TEXTURE_SIZE) >= 4096) ? '4k' : '2k';
    const arquivos = {
      dia: cfg.pasta + 'terra-dia-' + r + '.jpg', noite: cfg.pasta + 'terra-noite-' + r + '.jpg',
      nuvens: cfg.pasta + 'terra-nuvens-' + r + '.jpg', agua: cfg.pasta + 'terra-agua-2k.jpg', relevo: cfg.pasta + 'terra-relevo-2k.jpg'
    };
    const ordem = ['dia', 'noite', 'nuvens', 'agua', 'relevo'];
    const tex = {};
    const aniso = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
    ordem.forEach((k) => {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      tex[k] = t;
    });
    let texPronta = false, texel = [1 / 2048, 1 / 1024];
    const carrega = (url) => new Promise((ok, falha) => { const i = new Image(); i.decoding = 'async'; i.onload = () => ok(i); i.onerror = () => falha(new Error(url)); i.src = url; });
    Promise.all(ordem.map((k) => carrega(arquivos[k]))).then((imgs) => {
      if (inst.saindo) return;
      imgs.forEach((img, i) => {
        const k = ordem[i];
        gl.bindTexture(gl.TEXTURE_2D, tex[k]);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        const formato = k === 'dia' ? gl.RGB : gl.LUMINANCE;
        gl.texImage2D(gl.TEXTURE_2D, 0, formato, formato, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
        if (k === 'relevo') texel = [1 / img.width, 1 / img.height];
      });
      texPronta = true;
    }).catch((erro) => {
      console.warn('[Rocha R64] Fotos da Terra indisponiveis; carregamento original mantido.', erro);
      inst.cancelar();
    });
    esperaTex = setTimeout(() => { if (!texPronta) inst.cancelar(); }, cfg.esperaTexturas);

    /* ---------- roteiro da camera ---------- */
    let L = latLng(cfg.lat, cfg.lng);
    const D = V.norm(V.add(L, [0, 0.3, 0]));                // olhando o empreendimento levemente do norte
    const S = V.norm(V.cross([0, 1, 0], D)), Up = V.cross(D, S);
    const P = (d, s, u) => V.add(V.add(V.mul(D, d), V.mul(S, s)), V.mul(Up, u));
    const solIni = V.norm(P(0.08, 0.99, 0.12)), solFim = V.norm(P(0.42, 0.9, 0.12)), solPouso = V.norm(P(0.85, 0.45, 0.28));
    const solEm = (t) => V.norm(V.lerp(solIni, solFim, easeIO(clamp((t - 3.5) / 9.5, 0, 1))));
    const CHAVES = [                                         // [segundos, posicao, para onde olha]
      [0, P(4.1, 0.75, 0.42), P(0, -0.95, -0.08)],
      [6.0, P(3.7, 0.5, 0.26), P(0, -0.7, -0.04)],
      [11.0, P(3.25, 0.15, 0.08), P(0, -0.2, 0)],
      [14.0, P(3.0, 0, 0), [0, 0, 0]]
    ];
    const T_VIAGEM = CHAVES[CHAVES.length - 1][0], GIRO0 = -1.25;
    const rotTerra = (t) => GIRO0 * (1 - easeIO(clamp(t / T_VIAGEM, 0, 1)));
    // caminho suave (Catmull-Rom) percorrido com velocidade continua
    const amostras = [], NA = 600, compChave = [0];
    const cr = (p0, p1, p2, p3, t) => { const t2 = t * t, t3 = t2 * t;
      return [0, 1, 2].map((k) => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)); };
    const pts = CHAVES.map((c) => c[1]);
    let comp = 0, ant = null;
    for (let i = 0; i <= NA; i++) {
      const g = i / NA * (pts.length - 1), seg = Math.min(Math.floor(g), pts.length - 2), t = g - seg;
      const p = cr(pts[Math.max(seg - 1, 0)], pts[seg], pts[seg + 1], pts[Math.min(seg + 2, pts.length - 1)], t);
      if (ant) comp += V.len(V.sub(p, ant));
      amostras.push({ p, s: comp, g }); ant = p;
      if (i > 0 && Math.abs(g - Math.round(g)) < 1e-9) compChave[Math.round(g)] = comp;
    }
    const tk = CHAVES.map((c) => c[0]), sk = compChave, sec = [];
    for (let i = 0; i < tk.length - 1; i++) sec.push((sk[i + 1] - sk[i]) / (tk[i + 1] - tk[i]));
    const tg = sk.map((_, i) => (i === 0 ? sec[0] * 0.8 : i === sk.length - 1 ? 0 : (sec[i - 1] * sec[i] <= 0 ? 0 : 2 / (1 / sec[i - 1] + 1 / sec[i]))));
    const distEm = (t) => {
      if (t <= tk[0]) return 0;
      if (t >= tk[tk.length - 1]) return sk[sk.length - 1];
      let i = 0; while (t > tk[i + 1]) i++;
      const h = tk[i + 1] - tk[i], x = (t - tk[i]) / h, x2 = x * x, x3 = x2 * x;
      return (2 * x3 - 3 * x2 + 1) * sk[i] + (x3 - 2 * x2 + x) * h * tg[i] + (-2 * x3 + 3 * x2) * sk[i + 1] + (x3 - x2) * h * tg[i + 1];
    };
    const noCaminho = (s) => {
      let lo = 0, hi = amostras.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (amostras[m].s < s) lo = m; else hi = m; }
      const a = amostras[lo], b = amostras[hi], t = b.s > a.s ? (s - a.s) / (b.s - a.s) : 0;
      const g = a.g + (b.g - a.g) * t, seg = Math.min(Math.floor(g), CHAVES.length - 2), f = easeIO(g - seg);
      return { pos: V.lerp(a.p, b.p, t), olha: V.lerp(CHAVES[seg][2], CHAVES[seg + 1][2], f) };
    };
    inst.alvo = (lat, lng) => {
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      L = latLng(lat, lng);
      escreveCoord(lat, lng);
    };

    /* ---------- desenho ---------- */
    const EXPO = 0.5, LUZ = 1.1;
    const passe = (prog, alvo) => {
      gl.useProgram(prog.p);
      gl.bindFramebuffer(gl.FRAMEBUFFER, alvo ? alvo.f : null);
      gl.viewport(0, 0, alvo ? alvo.w : canvas.width, alvo ? alvo.h : canvas.height);
    };
    let tBase = null, fase = 'viagem', tMerg = 0, posMerg = null, msAnt = performance.now(), fps = 60, quadros = 0, msg = 0;

    function quadro(agora) {
      if (inst.encerrado) return;
      raf = requestAnimationFrame(quadro);
      if (tBase === null && texPronta) tBase = agora - (tTeste || 0) * 1000;
      const dt = Math.max(1e-3, (agora - msAnt) / 1000); msAnt = agora;
      if (!texPronta) return;                                  // tela escura com textos ate as fotos chegarem
      const t = fixo ? tTeste : (agora - tBase) / 1000;

      // resolucao adaptativa para manter a animacao fluida
      fps = fps * 0.95 + (1 / dt) * 0.05; quadros++;
      if (quadros % 90 === 0 && tTeste === null) {
        if (fps < 40 && escala > 0.45) { escala -= 0.12; redimensionar(); }
        else if (fps > 57 && escala < 1) { escala = Math.min(1, escala + 0.08); redimensionar(); }
      }

      let pos, olha, rot = rotTerra(t), fov = 50, m = 0, sol;
      if (mTeste !== null) fase = 'mergulho';
      if (fase === 'viagem') {
        ({ pos, olha } = noCaminho(distEm(Math.min(t, T_VIAGEM))));
        fov = 42 + sstep(9, 14, t) * 8;
        sol = solEm(t);
        if (t > T_VIAGEM) {                                    // em orbita, aguardando o Google
          const e = t - T_VIAGEM;
          pos = V.rotY(P(3.0 - Math.min(e * 0.02, 0.15), 0, 0), Math.sin(e * 0.25) * 0.04);
        }
        if (inst.apiPronta && t * 1000 >= cfg.duracaoMinima && t >= T_VIAGEM) {
          fase = 'mergulho'; tMerg = t; posMerg = pos; el.classList.add('r64-mergulho');
        }
      }
      if (fase === 'mergulho') {
        m = mTeste !== null ? mTeste : clamp((t - tMerg) / 4.2, 0, 1);
        rot = 0;
        const k = easeIO(m), ini = posMerg || P(3.0, 0, 0);
        // parte de onde a camera estiver e termina a ~3.500 km, bem em cima do empreendimento
        pos = V.mul(V.norm(V.lerp(V.norm(ini), L, k)), V.len(ini) + (1.55 - V.len(ini)) * k);
        olha = V.mul(L, 0.98 * k);                               // ... olhando para baixo, norte para cima
        fov = 50 - 6 * k;
        sol = V.norm(V.lerp(solFim, solPouso, k));
        if (m >= 0.97 && mTeste === null) encerrar(true, 1000);
      }

      const f = V.norm(V.sub(olha, pos));
      let rr = V.cross(f, [0, 1, 0]); if (V.len(rr) < 1e-4) rr = [1, 0, 0]; rr = V.norm(rr);
      const u = V.cross(rr, f);
      const focal = 0.5 / Math.tan(rad(fov) / 2);

      const pos2 = alvos.ok;
      passe(pCena, pos2 ? alvos.cena : null);
      const U = pCena.u;
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform2f(U.uTexel, texel[0], texel[1]);
      gl.uniform1f(U.uTempo, t);
      gl.uniform1f(U.uFocal, focal);
      gl.uniform1f(U.uPix, 1 / (canvas.height * focal));
      gl.uniform1f(U.uRotTerra, rot);
      gl.uniform1f(U.uAlt, V.len(pos) - 1);
      gl.uniform1f(U.uFade, sstep(0, 2.4, t));
      gl.uniform1f(U.uExpo, EXPO);
      gl.uniform1f(U.uLimpo, 0.5);
      gl.uniform1f(U.uLuz, LUZ / EXPO);
      gl.uniform1f(U.uRelevoForca, 1.2);
      gl.uniform3fv(U.uCam, pos); gl.uniform3fv(U.uSol, sol); gl.uniform3fv(U.uAlvo, L);
      gl.uniformMatrix3fv(U.uCamRot, false, [...rr, ...u, ...f]);
      [['dia', 'uDia'], ['noite', 'uNoite'], ['nuvens', 'uNuvem'], ['agua', 'uAgua'], ['relevo', 'uRelevo']].forEach(([k, nome], i) => {
        gl.activeTexture(gl.TEXTURE2 + i); gl.bindTexture(gl.TEXTURE_2D, tex[k]); gl.uniform1i(U[nome], 2 + i);
      });
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (pos2) {                                              // brilho suave nas partes claras
        passe(pClaro, alvos.a);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, alvos.cena.t);
        gl.uniform1i(pClaro.u.uImg, 0); gl.uniform2f(pClaro.u.uTexel, 1 / canvas.width, 1 / canvas.height);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        const borra = (de, para, dx, dy) => {
          passe(pBlur, para);
          gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, de.t);
          gl.uniform1i(pBlur.u.uImg, 0); gl.uniform2f(pBlur.u.uDir, dx / de.w, dy / de.h);
          gl.drawArrays(gl.TRIANGLES, 0, 3);
        };
        borra(alvos.a, alvos.b, 1, 0); borra(alvos.b, alvos.a, 0, 1);
        borra(alvos.a, alvos.b, 2.5, 0); borra(alvos.b, alvos.a, 0, 2.5);
        passe(pFinal, null);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, alvos.cena.t);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, alvos.a.t);
        gl.uniform1i(pFinal.u.uImg, 0); gl.uniform1i(pFinal.u.uBrilho, 1);
        gl.uniform1f(pFinal.u.uTempo, t); gl.uniform2f(pFinal.u.uRes, canvas.width, canvas.height);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      // marcador do empreendimento sobre a Terra
      const alvoMundo = V.rotY(V.mul(L, 1.002), rot), rel = V.sub(alvoMundo, pos), z = V.dot(rel, f);
      const deFrente = V.dot(V.norm(alvoMundo), V.norm(V.sub(pos, alvoMundo)));
      const vis = (fase === 'viagem' ? sstep(10.5, 12.5, t) : 1 - sstep(0.8, 0.97, m)) * (deFrente > 0.15 && z > 0 ? 1 : 0);
      if (z > 0) {
        const H = el.clientHeight, W = el.clientWidth;
        elAlvo.style.transform = 'translate(' + (W / 2 + V.dot(rel, rr) / z * focal * H).toFixed(1) + 'px,' + (H / 2 - V.dot(rel, u) / z * focal * H).toFixed(1) + 'px)';
      }
      elAlvo.style.opacity = vis.toFixed(3);

      let k = 0; MENSAGENS.forEach(([tt], i) => { if (t >= tt) k = i; });
      if (k !== msg) {
        msg = k; elStatus.style.opacity = '0';
        setTimeout(() => { elStatus.textContent = MENSAGENS[k][1]; elStatus.style.opacity = '1'; }, 250);
      }
    }
    raf = requestAnimationFrame(quadro);
    return window.rochaR64Intro;
  }

  window.rochaR64Intro = {
    iniciar,
    ativo: () => !!(atual && !atual.saindo),
    pronto: (cb) => { if (atual) atual.pronto(cb); else if (typeof cb === 'function') cb(); },
    alvo: (lat, lng) => { if (atual && atual.alvo) atual.alvo(lat, lng); },
    cancelar: () => { if (atual) atual.cancelar(); },
    pular: () => { if (atual) atual.pular(); }
  };
})();
