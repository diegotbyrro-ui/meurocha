import test from 'node:test';
import assert from 'node:assert/strict';
import {calcularRascunho} from '../lib/simulacao.mjs';
test('calculo de teste sem juros',()=>{
 const resultado=calcularRascunho({preco:300000, percentualEntrada:20, desconto:10000});
 assert.equal(resultado.precoLiquido,290000);
 assert.equal(resultado.entrada,58000);
 assert.equal(resultado.saldo,232000);
 assert.match(resultado.aviso,/demonstrativo/i);
});
test('valores invalidos sao rejeitados',()=>{
 for(const v of [-1,0,NaN,Infinity]) assert.throws(()=>calcularRascunho({preco:v,percentualEntrada:10}));
 assert.throws(()=>calcularRascunho({preco:100,percentualEntrada:101}));
 assert.throws(()=>calcularRascunho({preco:100,percentualEntrada:10,desconto:100}));
});
