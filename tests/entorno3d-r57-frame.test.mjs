import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import config from '../next.config.mjs';

const iframePath = '/experiencia/easy-rota-do-mar/entorno3d/index.html';

test('R57: iframe original do V3 continua no dominio atual e com config postMessage', () => {
  const file = readFileSync(join(process.cwd(), 'app/experiencia/easy-rota-do-mar/entorno-3d/Entorno3DFrame.tsx'),'utf8');
  assert.ok(file.includes("const iframeSource = base + '/entorno3d/index.html'"));
  assert.ok(file.includes('ROCHA_ENTORNO3D_CONFIG'));
  assert.ok(file.includes('ROCHA_ENTORNO3D_READY'));
  const html = readFileSync(join(process.cwd(), 'public'+iframePath),'utf8');
  assert.ok(html.includes('maps.googleapis.com/maps/api/js'));
  assert.ok(html.includes("importLibrary('maps3d')"));
});

test('R57: protege outras rotas com DENY e permite SAMEORIGIN so para V3', async () => {
  const rules = await config.headers();
  const global = rules.find(rule => rule.source === '/:path*');
  assert.ok(global, 'Protecao geral da plataforma ausente');
  assert.ok(global.headers.some(header => header.key === 'X-Frame-Options' && header.value === 'DENY'));
  const exception = rules.filter(rule => rule.source === iframePath);
  assert.equal(exception.length,1,'Somente uma excecao para o HTML V3');
  assert.ok(exception[0].headers.some(header => header.key === 'X-Frame-Options' && header.value === 'SAMEORIGIN'));
  assert.ok(exception[0].headers.some(header => header.key === 'Content-Security-Policy' && header.value === "frame-ancestors 'self'"));
  assert.ok(rules.indexOf(global) < rules.indexOf(exception[0]),'Regra especifica deve sobrescrever DENY');
  assert.equal(rules.filter(rule => rule !== global && rule.headers.some(header => header.key === 'X-Frame-Options' && header.value === 'SAMEORIGIN')).length,2);
  assert.ok(rules.some(rule => rule.source === '/experiencia/easy-rota-do-mar/entorno-3d' && rule.headers.some(h => h.key === 'X-Frame-Options' && h.value === 'SAMEORIGIN')));
});