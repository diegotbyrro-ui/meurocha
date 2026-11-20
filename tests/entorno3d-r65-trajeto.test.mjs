import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const base = join(process.cwd(), 'public/experiencia/easy-rota-do-mar/entorno3d');
const html = readFileSync(join(base, 'index.html'), 'utf8');
const poi = readFileSync(join(base, 'rocha-r63-poi.js'), 'utf8');
const css = readFileSync(join(base, 'rocha-r63-poi.css'), 'utf8');
const trajeto = readFileSync(join(base, 'rocha-r65-trajeto.js'), 'utf8');

const ORIGEM = { lat: -9.6016, lng: -35.7173 };
const DESTINO = { lat: -9.5951, lng: -35.7102 };

// Carrega o modulo de trajeto num contexto isolado, com uma Routes API falsa.
function carregar({ falhar = false, semBiblioteca = false, vazio = false } = {}) {
  const pedidos = [];
  const anexados = [];
  const voos = [];
  class LinhaFalsa {
    constructor(opcoes) { Object.assign(this, opcoes); this.removida = false; }
    remove() { this.removida = true; }
  }
  const google = {
    maps: {
      importLibrary: async (nome) => {
        assert.equal(nome, 'routes');
        if (semBiblioteca) return {};
        return {
          Route: {
            computeRoutes: async (pedido) => {
              pedidos.push(pedido);
              if (falhar) throw new Error('PERMISSION_DENIED: Routes API has not been used in project');
              if (vazio) return { routes: [] };
              const carro = pedido.travelMode === 'DRIVING';
              return {
                routes: [{
                  distanceMeters: carro ? 1834 : 1412,
                  durationMillis: carro ? 5.2 * 60000 : 18.4 * 60000,
                  path: carro ? [{ lat: ORIGEM.lat, lng: ORIGEM.lng, altitude: 0 }, { lat: -9.598, lng: -35.713, altitude: 0 }, { lat: DESTINO.lat, lng: DESTINO.lng, altitude: 0 }] : undefined
                }]
              };
            }
          }
        };
      }
    }
  };
  const window = { innerWidth: 1280, innerHeight: 720 };
  const avisos = [];
  vm.runInNewContext(trajeto, { window, google, console: { warn: (...a) => avisos.push(a.join(' ')), info() {}, log() {} } });
  const api = window.rochaR65Trajeto;
  const mapa = {
    heading: 25,
    center: { lat: ORIGEM.lat, lng: ORIGEM.lng, altitude: 60 },
    append(el) { anexados.push(el); },
    flyCameraTo(o) { voos.push(o); }
  };
  api.configurar(mapa, { Polyline3DElement: LinhaFalsa });
  return { api, pedidos, anexados, voos, avisos };
}

test('R65: pagina carrega o trajeto depois dos pontos, com versao nova (sem cache antigo)', () => {
  // R66 trocou a versao dos arquivos dos pontos; o trajeto continua logo depois deles.
  assert.match(html, /<script src="rocha-r63-poi\.js\?v=r6\d"><\/script><script src="rocha-r65-trajeto\.js\?v=r65"><\/script>/);
  assert.match(html, /<link rel="stylesheet" href="rocha-r63-poi\.css\?v=r6\d">/);
  assert.ok(html.indexOf('rocha-r65-trajeto.js') < html.indexOf('const rochaIntro='));
});

test('R65: Routes API com a mesma chave do mapa, sem chave no codigo e sem recurso pago extra', () => {
  assert.match(trajeto, /importLibrary\('routes'\)/);
  assert.match(trajeto, /Route\.computeRoutes\(/);
  assert.match(trajeto, /modo: 'DRIVING'/);
  assert.match(trajeto, /modo: 'WALKING'/);
  assert.match(trajeto, /language: 'pt-BR'/);
  assert.doesNotMatch(trajeto, /AIza|apiKey|NEXT_PUBLIC_|fetch\(/);
  assert.doesNotMatch(trajeto, /TRAFFIC_AWARE|routingPreference|computeRouteMatrix|'\*'/, 'Somente o nivel Essentials da Routes API');
  assert.match(trajeto, /Polyline3DElement/);
  assert.match(trajeto, /drawsOccludedSegments: true/);
});

test('R65: formata km com virgula e tempo em minutos/horas', () => {
  const { api } = carregar();
  assert.equal(api.formatarDistancia(1834), '1,8 km');
  assert.equal(api.formatarDistancia(845), '850 m');
  assert.equal(api.formatarDistancia(996), '1,0 km');
  assert.equal(api.formatarDistancia(3), '10 m');
  assert.equal(api.formatarDistancia(12600), '13 km');
  assert.equal(api.formatarTempo(5.2 * 60000), '5 min');
  assert.equal(api.formatarTempo(20000), '1 min');
  assert.equal(api.formatarTempo(65 * 60000), '1 h 05 min');
  assert.equal(api.formatarTempo(120 * 60000), '2 h');
  assert.ok(Math.abs(api.linhaReta(ORIGEM, DESTINO) - 1050) < 30, 'Haversine');
});

test('R65: calcula carro e a pe saindo do empreendimento, uma vez por ponto', async () => {
  const { api, pedidos } = carregar();
  const r = await api.calcular(ORIGEM, DESTINO, 'lugar-1');
  assert.equal(r.estimado, false);
  assert.equal(r.carro.metros, 1834);
  assert.equal(r.pe.metros, 1412);
  assert.equal(api.formatarTempo(r.pe.ms), '18 min');
  assert.equal(r.carro.caminho.length, 3);
  assert.equal(pedidos.length, 2);
  const carro = pedidos.find((p) => p.travelMode === 'DRIVING');
  const pe = pedidos.find((p) => p.travelMode === 'WALKING');
  assert.deepEqual({ ...carro.origin }, ORIGEM);
  assert.deepEqual({ ...carro.destination }, DESTINO);
  assert.deepEqual([...carro.fields], ['distanceMeters', 'durationMillis', 'path']);
  assert.deepEqual([...pe.fields], ['distanceMeters', 'durationMillis']);
  assert.equal(carro.region, 'br');
  await api.calcular(ORIGEM, DESTINO, 'lugar-1');
  assert.equal(pedidos.length, 2, 'Segundo clique no mesmo ponto nao consulta de novo');
});

test('R65: sem a Routes API, cai para a linha reta e para de insistir', async () => {
  const { api, pedidos, avisos } = carregar({ falhar: true });
  const a = await api.calcular(ORIGEM, DESTINO, 'a');
  assert.equal(a.estimado, true);
  assert.ok(Math.abs(a.reta - 1050) < 30);
  assert.ok(avisos.some((t) => t.includes('Routes API')), 'Aviso no console explica o que habilitar');
  await api.calcular(ORIGEM, DESTINO, 'b');
  const antes = pedidos.length;
  const c = await api.calcular(ORIGEM, DESTINO, 'c');
  assert.equal(c.estimado, true);
  assert.equal(pedidos.length, antes, 'Depois de 2 falhas seguidas nao chama mais a API');
  // Ponto sem caminho pelas ruas (resposta vazia) nao desliga a Routes API.
  const vazio = carregar({ vazio: true });
  for (const k of ['v1', 'v2', 'v3']) assert.equal((await vazio.api.calcular(ORIGEM, DESTINO, k)).semRota, true);
  assert.equal(vazio.pedidos.length, 6, 'Continua consultando os proximos pontos');
  const semClasse = carregar({ semBiblioteca: true });
  assert.equal((await semClasse.api.calcular(ORIGEM, DESTINO, 'x')).estimado, true);
});

test('R65: linha do trajeto no mapa 3D e camera enquadrando fora do painel', async () => {
  const { api, anexados, voos } = carregar();
  const r = await api.calcular(ORIGEM, DESTINO, 'lugar-2');
  assert.equal(api.desenhar(r.carro.caminho), true);
  assert.equal(anexados.length, 1);
  const linha = anexados[0];
  assert.equal(linha.path.length, 3);
  assert.equal(linha.path[0].altitude, 4);
  assert.equal(linha.altitudeMode, 'RELATIVE_TO_GROUND');
  // Painel a direita (computador): o centro da camera vai para a direita do trajeto,
  // para o caminho aparecer na parte livre, a esquerda do painel.
  const painel = { hidden: false, getBoundingClientRect: () => ({ left: 846, top: 14, width: 360, height: 600 }) };
  const cam = api.enquadrar(r.carro.caminho, painel);
  assert.equal(voos.length, 1);
  assert.equal(cam.tilt, 50);
  assert.equal(cam.heading, 25);
  assert.equal(cam.center.altitude, 60);
  const meio = { lat: (ORIGEM.lat + DESTINO.lat) / 2, lng: (ORIGEM.lng + DESTINO.lng) / 2 };
  const leste = (cam.center.lng - meio.lng) * Math.cos(meio.lat * Math.PI / 180);
  const norte = cam.center.lat - meio.lat;
  const rumo = (Math.atan2(leste, norte) * 180 / Math.PI + 360) % 360;
  assert.ok(Math.abs(rumo - 115) < 2, 'Deslocado para a direita da tela (rumo 25 + 90)');
  assert.ok(cam.range >= 500 && cam.range <= 8000);
  // Painel embaixo (celular): centro vai na direcao da camera (rumo 25 + 180).
  const celular = { hidden: false, getBoundingClientRect: () => ({ left: 8, top: 238, width: 344, height: 314 }) };
  const cam2 = api.enquadrar(r.carro.caminho, celular);
  const leste2 = (cam2.center.lng - meio.lng) * Math.cos(meio.lat * Math.PI / 180);
  const rumo2 = (Math.atan2(leste2, cam2.center.lat - meio.lat) * 180 / Math.PI + 360) % 360;
  assert.ok(Math.abs(rumo2 - 205) < 2, 'Deslocado para baixo da tela');
  // Computador com a legenda no topo: alem de ir para a direita, o centro se afasta
  // da camera para o trajeto descer um pouco e nao ficar atras da legenda.
  const legenda = { hidden: false, getBoundingClientRect: () => ({ left: 14, top: 14, right: 734, bottom: 115, width: 720, height: 101 }) };
  const cam3 = api.enquadrar(r.carro.caminho, painel, [legenda, null]);
  const leste3 = (cam3.center.lng - meio.lng) * Math.cos(meio.lat * Math.PI / 180) * 111320;
  const norte3 = (cam3.center.lat - meio.lat) * 111320;
  const projetar = (rumoGraus) => leste3 * Math.sin(rumoGraus * Math.PI / 180) + norte3 * Math.cos(rumoGraus * Math.PI / 180);
  assert.ok(projetar(115) > 0, 'Continua deslocado para a direita');
  assert.ok(projetar(25) > 0, 'Afastado da camera (trajeto desce na tela)');
  // Sem painel e sem legenda: centraliza no meio do trajeto.
  const cam4 = api.enquadrar(r.carro.caminho, null, []);
  assert.ok(Math.abs(cam4.center.lat - meio.lat) < 1e-9 && Math.abs(cam4.center.lng - meio.lng) < 1e-9);
  api.limpar();
  assert.equal(linha.removida, true, 'Fechar o painel apaga a linha');
});

test('R65: link "Rota no Google Maps" sai do empreendimento ate o local', () => {
  const { api } = carregar();
  const url = api.linkGoogleMaps(ORIGEM, DESTINO, 'ChIJabc');
  assert.equal(url, 'https://www.google.com/maps/dir/?api=1&origin=-9.601600,-35.717300&destination=-9.595100,-35.710200&destination_place_id=ChIJabc&travelmode=driving');
});

test('R65: rotulos Colegios e Clinicas (categorias da R66 em entorno3d-r66-entorno.test.mjs)', () => {
  assert.match(poi, /label: 'Col\\u00e9gios'/);
  assert.match(poi, /label: 'Cl\\u00ednicas'/);
});

test('R65: busca so com campos Pro; nota buscada ao abrir o ponto', () => {
  const fields = poi.match(/const FIELDS = \[([^\]]*)\]/)[1];
  assert.doesNotMatch(fields, /rating|userRatingCount|reviews|regularOpeningHours/, 'Campos Enterprise encarecem cada busca');
  assert.match(poi, /const RATING_FIELDS = \['rating', 'userRatingCount'\];/);
  assert.match(poi, /place\.fetchFields\(\{ fields: RATING_FIELDS \}\)/);
});

test('R65: filtro tira e recoloca os marcadores no mapa; painel mostra o trajeto', () => {
  assert.match(poi, /if \(on && m\.marker\.parentNode !== state\.map\) state\.map\.append\(m\.marker\);/);
  assert.match(poi, /if \(!on && m\.marker\.parentNode\) m\.marker\.remove\(\);/);
  assert.doesNotMatch(poi, /marker\.hidden =/);
  assert.match(poi, /r\.mostrar\(panel, origin, pos, place\.id\)/);
  assert.match(poi, /r\.configurar\(map, maps3d\)/);
  assert.match(poi, /if \(r\) r\.limpar\(\);/);
  assert.match(poi, /main\.classList\.toggle\('rocha63-aberto', open\)/);
  assert.match(css, /#main\.rocha63-aberto #rocha63-poi-legend \{ display: none; \}/, 'No celular a legenda some com o painel aberto');
  assert.match(css, /\.rocha63-chips \{\s*flex-wrap: nowrap; overflow-x: auto;/, 'No celular a legenda vira uma linha que desliza');
  assert.match(css, /\.rocha65-trajeto \{/);
  assert.match(css, /\.rocha65-modos \{ display: grid; grid-template-columns: 1fr 1fr;/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});
