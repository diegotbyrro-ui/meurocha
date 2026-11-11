import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const native=readFileSync(new URL('../app/plataforma/simulador/SimuladorNativo.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../app/globals.css',import.meta.url),'utf8');
test('R6 aplica identidade propria, sem aplicar filtro visual ao iframe',()=>{
 assert.match(css,/\.r6-hero\{/);assert.match(css,/\.r6-paper\{/);
 assert.doesNotMatch(native,/<iframe|hue-rotate|filter:/);
});
test('R6 mantem referencias a fontes reais desativadas ate conexao',()=>{
 assert.match(native,/Sem sincronização/);assert.match(native,/Sem API CAIXA/);
 assert.doesNotMatch(native,/27 unidades dispon|181 unidades dispon/);
});
