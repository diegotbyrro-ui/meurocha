import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {moedaEntrada,resumirProposta,saldoRecursosCaixa} from '../lib/calculo-preliminar-r6.mjs';
const src=readFileSync(new URL('../app/plataforma/simulador/SimuladorNativo.tsx',import.meta.url),'utf8');
test('R6 analisa valor brasileiro com virgula e milhar',()=>{
 assert.equal(moedaEntrada('330.000,00'),330000);assert.equal(moedaEntrada('1.970,35'),1970.35);
 assert.equal(moedaEntrada('330.000'),330000);assert.equal(moedaEntrada(''),0);
 assert.ok(Number.isNaN(moedaEntrada('10e10')));
});
test('R6 confere somente soma aritmetica sem regras comerciais',()=>{
 const r=resumirProposta({preco:300000,desconto:10000,ato:20000,mensal:1000,quantidadeMensal:10,financiamento:260000});
 assert.equal(r.liquido,290000);assert.equal(r.pagamentos,290000);assert.equal(r.diferenca,0);assert.equal(r.conferido,true);
 assert.match(r.aviso,/Nao representa tabela comercial/);
});
test('R6 impede rascunho com valores invalidos',()=>{
 assert.throws(()=>resumirProposta({preco:0}),/invalidos/);
 assert.throws(()=>resumirProposta({preco:100,desconto:200}),/invalidos/);
 assert.throws(()=>resumirProposta({preco:100,mensal:-2}),/Confira/);
});
test('R6 calcula principal sem apresentar prestacao oficial CAIXA',()=>{
 const r=saldoRecursosCaixa({valorImovel:330000,recursos:30000,fgts:20000,subsidio:0});
 assert.equal(r.principal,280000);assert.match(r.aviso,/sem juros/);
 assert.throws(()=>saldoRecursosCaixa({valorImovel:100,recursos:200}));
});
test('R6 nao depende de iframe, Nekt, CV CRM ou credenciais no navegador',()=>{
 assert.doesNotMatch(src,/<iframe|chatgpt\.site|NEXT_PUBLIC_SUPABASE|service_role|process\.env/);
 assert.match(src,/Sem conexão com tabelas oficiais/);
});
