import test from 'node:test';
import assert from 'node:assert/strict';
import { temPermissao, acessoMaterial } from '../lib/autorizacao.mjs';
test('nega perfis e recursos desconhecidos',()=>{
 assert.equal(temPermissao('desconhecido','site:publicar'),false);
 assert.equal(temPermissao('corretor','site:publicar'),false);
 assert.equal(temPermissao('corretor','convite:gerir'),false);
 assert.equal(acessoMaterial('corretor','interno',true),false);
 assert.equal(acessoMaterial('administrador','desconhecido',true),false);
 assert.equal(acessoMaterial('administrador','corretor',false),false);
});
test('liberacao minima para material publicado',()=>{
 assert.equal(acessoMaterial('corretor','corretor',true),true);
 assert.equal(acessoMaterial('administrador','interno',true),true);
 assert.equal(acessoMaterial('visitante','corretor',true),false);
});
