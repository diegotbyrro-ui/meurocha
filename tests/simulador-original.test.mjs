import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const page = readFileSync(new URL('../app/plataforma/simulador/page.tsx', import.meta.url),'utf8');
const legacy = readFileSync(new URL('../app/plataforma/simulador/SimuladorRochaIncorporado.tsx', import.meta.url),'utf8');
test('R6: rota principal utiliza componente nativo',()=>{
 assert.match(page,/SimuladorNativo/);
 assert.doesNotMatch(page,/iframe|SimuladorRochaIncorporado|https?:\/\//);
});
test('R6: componente antigo nao incorpora mais o simulador externo',()=>{
 assert.doesNotMatch(legacy,/<iframe|src=|chatgpt\.site/);
});
