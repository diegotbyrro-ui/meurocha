import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { temPermissao, acessoMaterial } from '../lib/autorizacao.mjs';
import { validarProjeto, validarFotoPrevia, limparRegistroImportado, MAX_FOTOS_PREVIA } from '../lib/portal-gestao.mjs';
const read = f=>readFileSync(join(process.cwd(),f),'utf8');
const page=read('app/plataforma/gestao/page.tsx');
const ui=read('app/plataforma/gestao/GestaoClient.tsx');
const layout=read('app/plataforma/layout.tsx');
const sidebar=read('app/plataforma/Sidebar.tsx');
const css=read('app/plataforma/gestao/gestao.css');
const dados={nome:'Novo Vista Rocha',bairro:'Centro',cidade:'Maceió',uf:'AL',etapa:'Planejamento',resumo:''};

test('R77: area de gestao continua desligada em producao e depende do modo de previa',()=>{
  assert.match(page,/process\.env\.NODE_ENV !== 'production'/);
  assert.match(page,/process\.env\.ROCHA_PREVIEW_MODE === 'true'/);
  assert.match(layout,/process\.env\.NODE_ENV === 'production'/);
  assert.match(page,/robots: \{ index: false, follow: false, nocache: true \}/);
});
test('R77: corretor nao cria nem publica empreendimento ou midia',()=>{
  for(const a of ['empreendimento:rascunho','empreendimento:publicar','midia:rascunho','midia:publicar','site:publicar'])
    assert.equal(temPermissao('corretor',a),false,a);
  assert.equal(temPermissao('corretor','simulacao:criar'),true);
  assert.equal(temPermissao('corretor','empreendimento:ler-publicado'),true);
  assert.equal(temPermissao('visitante','empreendimento:ler-publicado'),false);
});
test('R77: marketing e comercial podem preparar rascunho; so administrador publica',()=>{
  for(const role of ['marketing','comercial']) {
    assert.equal(temPermissao(role,'empreendimento:rascunho'),true);
    assert.equal(temPermissao(role,'midia:rascunho'),true);
    assert.equal(temPermissao(role,'empreendimento:publicar'),false);
    assert.equal(temPermissao(role,'midia:publicar'),false);
  }
  for(const a of ['empreendimento:publicar','midia:publicar','acessos:gerir'])
    assert.equal(temPermissao('administrador',a),true);
  assert.equal(temPermissao('role-aleatoria','empreendimento:rascunho'),false);
});
test('R77: materiais internos nunca sao oferecidos a corretor',()=>{
  assert.equal(acessoMaterial('corretor','interno',true),false);
  assert.equal(acessoMaterial('corretor','corretor',false),false);
  assert.equal(acessoMaterial('corretor','corretor',true),true);
});
test('R77: valida nome, UF, localidade, etapa e repeticao',()=>{
  assert.equal(validarProjeto(dados).ok,true);
  assert.equal(validarProjeto({...dados,nome:'A'}).ok,false);
  assert.equal(validarProjeto({...dados,uf:'XX3'}).ok,false);
  assert.equal(validarProjeto({...dados,etapa:'Inventado'}).ok,false);
  assert.equal(validarProjeto(dados,[{...dados,id:'a'}]).ok,false);
  assert.equal(validarProjeto(dados,[{...dados,id:'a'}],'a').ok,true);
});
test('R77: apenas fotos pequenas JPG PNG WebP no prototipo local',()=>{
  assert.equal(MAX_FOTOS_PREVIA,3);
  assert.equal(validarFotoPrevia({type:'image/webp',size:20000}),'');
  assert.notEqual(validarFotoPrevia({type:'text/html',size:1000}),'');
  assert.notEqual(validarFotoPrevia({type:'image/jpeg',size:600000}),'');
});
test('R77: sessao local rejeita registro invalido e ignora JS em fotos',()=>{
  assert.equal(limparRegistroImportado(null),null);
  assert.equal(limparRegistroImportado({...dados,nome:'a'}),null);
  const x=limparRegistroImportado({...dados,id:'1',fotos:[{id:'1',nome:'x.svg',dataUrl:'data:image/svg+xml;base64,AA=='}]});
  assert.equal(x.fotos.length,0);
});
test('R77: tela tem CRUD local, fotos e exportacao sem API de escrita',()=>{
  for(const p of ['function salvar(', 'function editar(', 'function excluir(', 'function exportar(', 'function escolheFoto('])assert.ok(ui.includes(p),p);
  assert.match(ui,/localStorage\.setItem\(CHAVE/);
  assert.match(ui,/FileReader/);
  assert.doesNotMatch(ui,/fetch\(|supabase\.from\(|service_role|createClient\(/);
  assert.match(ui,/Nenhum cadastro e enviado|Nada foi publicado|nenhum cadastro|Nenhum cadastro/);
  assert.match(sidebar,/\/plataforma\/gestao/);
  assert.match(css,/\.r77-gestao/);
  assert.doesNotMatch(css,/(?:^|\n)\s*(?:html|body)\s*\{/);
});
