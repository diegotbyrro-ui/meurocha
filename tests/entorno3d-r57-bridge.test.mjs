import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const frame = readFileSync(join(root, 'app/experiencia/easy-rota-do-mar/entorno-3d/Entorno3DFrame.tsx'), 'utf8');
const html = readFileSync(join(root, 'public/experiencia/easy-rota-do-mar/entorno3d/index.html'), 'utf8');
const css = readFileSync(join(root, 'app/experiencia/easy-rota-do-mar/entorno-3d/entorno3d.module.css'), 'utf8');

test('R57 R2: pai reenvia configuracao ate ACK com tempo limite', () => {
  assert.ok(frame.includes("ROCHA_ENTORNO3D_READY"));
  assert.ok(frame.includes("ROCHA_ENTORNO3D_CONFIG_ACK"));
  assert.match(frame, /window\.setInterval\(\(\) =>/);
  assert.match(frame, /attempts >= 24/);
  assert.match(frame, /if \(acknowledged\)/);
  assert.ok(frame.includes("window.clearInterval(retry)"));
  assert.ok(frame.includes('event.source !== frameRef.current?.contentWindow'));
  assert.ok(frame.includes('onLoad={sendConfig}'));
  assert.ok(css.includes('.bridgeIssue'));
  assert.ok(frame.includes('Recarregar mapa 3D'));
});

test('R57 R2: iframe confirma CONFIG e ignora outra origem antes de carregar API', () => {
  const start = html.indexOf('let rochaConfigReceived=false;');
  const end = html.indexOf('</script>', start);
  assert.ok(start > 0 && end > start);
  const js = html.slice(start, end);
  const messages = [];
  const listeners = {};
  const parent = { postMessage: (data, target) => messages.push({ data, target }) };
  const win = {
    location: { origin: 'http://localhost:3000' },
    parent,
    addEventListener: (event, callback) => { listeners[event] = callback; },
  };
  const errors = [];
  const ctx = {
    window: win,
    document: { createElement: () => ({ getContext: () => null }) },
    SITE: { lat: -9.6002, lng: -35.7173, altitude: 60 },
    showError: (msg) => errors.push(msg),
  };
  vm.runInNewContext(js, ctx);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].data.type, 'ROCHA_ENTORNO3D_READY');
  const valid = { type: 'ROCHA_ENTORNO3D_CONFIG', key: 'TESTE-SEM-SEGREDO-1234567890', confirmed: true, site: { lat: -9.5992951, lng: -35.7137302, altitude: 60 }};
  listeners.message({ origin: 'https://other.example', source: parent, data: valid });
  assert.equal(messages.length, 1, 'Nunca aceitar outra origem');
  listeners.message({ origin: 'http://localhost:3000', source: {}, data: valid });
  assert.equal(messages.length, 1, 'Nunca aceitar outra janela');
  listeners.message({ origin: 'http://localhost:3000', source: parent, data: valid });
  assert.equal(messages.length, 2);
  assert.equal(messages[1].data.type, 'ROCHA_ENTORNO3D_CONFIG_ACK');
  assert.equal(messages[1].target, 'http://localhost:3000');
  assert.equal(errors.length, 1, 'Apos ACK a validacao WebGL gera erro explicito no mock sem WebGL2');
  listeners.message({ origin: 'http://localhost:3000', source: parent, data: valid });
  assert.equal(messages.length, 3, 'Confirmar reenvios sem reinicializar mapa');
  assert.equal(errors.length, 1, 'Nao duplicar inicializacao');
  assert.ok(!JSON.stringify(messages).includes(valid.key));
});