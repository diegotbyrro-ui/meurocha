import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('../app/plataforma/simulador/page.tsx',import.meta.url),'utf8');
const native=readFileSync(new URL('../app/plataforma/simulador/SimuladorNativo.tsx',import.meta.url),'utf8');
test('R6 elimina o cabecalho ROCHA duplicado ao migrar a tela',()=>{
 assert.doesNotMatch(page,/<iframe|SimuladorRochaIncorporado/);
 assert.doesNotMatch(native,/r5-resource-grid|r5-workspace-top|Fonte: Nekt\/CV|Aplicação original/);
});
test('R6 torna navegacao entre modulos um controle real',()=>{
 for(const nome of ['Disponibilidade','Simulador CAIXA','Simulador ROCHA','Evolução da obra']) assert.ok(native.includes(nome));
 assert.match(native,/onClick=\{\(\)=>setModulo\(m\.id\)\}/);
});
