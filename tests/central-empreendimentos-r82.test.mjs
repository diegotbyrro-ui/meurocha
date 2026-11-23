import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {empreendimentos} from '../lib/catalog.mjs';
import {bibliotecaCategorias} from '../lib/biblioteca.mjs';
import {
  TIPOS_PIX, TIPOS_POSTAGEM, SECOES_MATERIAIS, ITENS_MATERIAIS, MAX_LINKS_POR_ITEM, MAX_POSTAGENS, DADOS_EMPREENDIMENTOS,
  somenteDigitos, cnpjValido, formatarCnpj, linkSeguro, pixValido,
  normalizarEmpreendimento, listarEmpreendimentos, obterEmpreendimento, statusDados,
} from '../lib/empreendimentos-central.mjs';

const read = (p) => readFileSync(join(process.cwd(), p), 'utf8');
const libSource = read('lib/empreendimentos-central.mjs');
const linkOk = (titulo, url) => ({titulo, url});

test('R83: postagens sao uma lista unica, sem meses; tipos e limite seguem a regra', () => {
  assert.deepEqual([...TIPOS_POSTAGEM], ['Vídeo', 'Imagem', 'Carrossel', 'Texto']);
  assert.equal(Object.isFrozen(TIPOS_POSTAGEM), true);
  assert.equal(MAX_POSTAGENS, 60);
  assert.equal(libSource.includes('MESES'), false);
});

test('R82: tipos PIX e secoes seguem a ordem aprovada', () => {
  assert.deepEqual([...TIPOS_PIX], ['CNPJ', 'E-mail', 'Telefone', 'Chave aleatória']);
  assert.deepEqual(SECOES_MATERIAIS.map((s) => s.id), ['perspectivas', 'comercial', 'videos', 'identidade', 'projetos', 'documentacao']);
  assert.deepEqual(SECOES_MATERIAIS[0].itens.map((i) => i.id), ['perspectivas-internas', 'perspectivas-externas', 'plantas']);
  assert.equal(Object.isFrozen(TIPOS_PIX), true);
  assert.equal(Object.isFrozen(SECOES_MATERIAIS), true);
});

test('R82: ids de itens de materiais existem na biblioteca', () => {
  const idsBiblioteca = new Set(bibliotecaCategorias.map((c) => c.id));
  for (const id of ITENS_MATERIAIS) assert.ok(idsBiblioteca.has(id), `id ausente na biblioteca: ${id}`);
  assert.equal(new Set(ITENS_MATERIAIS).size, ITENS_MATERIAIS.length);
  assert.equal(ITENS_MATERIAIS.length, 11);
  assert.equal(MAX_LINKS_POR_ITEM, 20);
});

test('R82: dados brutos tem um registro por empreendimento do catalogo, na mesma ordem e vazios', () => {
  assert.deepEqual(DADOS_EMPREENDIMENTOS.map((d) => d.id), empreendimentos.map((e) => e.id));
  for (const d of DADOS_EMPREENDIMENTOS) {
    assert.equal(d.razaoSocial, '');
    assert.equal(d.cnpj, '');
    assert.deepEqual(d.pix, {tipo: 'CNPJ', chave: '', favorecido: '', banco: ''});
    assert.deepEqual(d.materiais, {});
    assert.deepEqual(d.postagens, []);
  }
  assert.equal(Object.isFrozen(DADOS_EMPREENDIMENTOS), true);
});

test('R82: somenteDigitos aceita apenas texto', () => {
  assert.equal(somenteDigitos('11.222.333/0001-81'), '11222333000181');
  assert.equal(somenteDigitos(12345), '');
  assert.equal(somenteDigitos(null), '');
});

test('R82: CNPJ valido, invalido e formatado', () => {
  assert.equal(cnpjValido('11.222.333/0001-81'), true);
  assert.equal(cnpjValido('11222333000181'), true);
  assert.equal(cnpjValido('11.222.333/0001-82'), false);
  assert.equal(cnpjValido('00000000000000'), false);
  assert.equal(cnpjValido('11111111111111'), false);
  assert.equal(cnpjValido('1122233300018'), false);
  assert.equal(cnpjValido(undefined), false);
  assert.equal(formatarCnpj('11222333000181'), '11.222.333/0001-81');
  assert.equal(formatarCnpj('11.222.333/0001-81'), '11.222.333/0001-81');
  assert.equal(formatarCnpj('123'), '');
  assert.equal(formatarCnpj(null), '');
});

test('R82: linkSeguro aceita somente https com host', () => {
  assert.equal(linkSeguro('https://drive.google.com/file/d/abc'), 'https://drive.google.com/file/d/abc');
  assert.equal(linkSeguro('https://EXEMPLO.com/a b'), 'https://exemplo.com/a%20b');
  assert.equal(linkSeguro('javascript:alert(1)'), '');
  assert.equal(linkSeguro('http://x.com'), '');
  assert.equal(linkSeguro('data:text/html,<script>alert(1)</script>'), '');
  assert.equal(linkSeguro(''), '');
  assert.equal(linkSeguro('https://'), '');
  assert.equal(linkSeguro('nao e url'), '');
  assert.equal(linkSeguro(null), '');
  assert.equal(linkSeguro(42), '');
  assert.equal(linkSeguro(`https://x.com/${'a'.repeat(2000)}`), '');
});

test('R82: PIX CNPJ valido e invalido', () => {
  assert.equal(pixValido({tipo: 'CNPJ', chave: '11.222.333/0001-81'}), true);
  assert.equal(pixValido({tipo: 'CNPJ', chave: '11.222.333/0001-82'}), false);
});

test('R82: PIX e-mail valido e invalido', () => {
  assert.equal(pixValido({tipo: 'E-mail', chave: 'financeiro@rocha.com.br'}), true);
  assert.equal(pixValido({tipo: 'E-mail', chave: 'sem-arroba.com.br'}), false);
  assert.equal(pixValido({tipo: 'E-mail', chave: 'a@b.c'}), false);
  assert.equal(pixValido({tipo: 'E-mail', chave: 'com espaco@rocha.com.br'}), false);
  assert.equal(pixValido({tipo: 'E-mail', chave: `${'a'.repeat(70)}@rocha.com.br`}), false);
});

test('R82: PIX telefone valido e invalido', () => {
  assert.equal(pixValido({tipo: 'Telefone', chave: '+55 82 99999-9999'}), true);
  assert.equal(pixValido({tipo: 'Telefone', chave: '5582999999999'}), true);
  assert.equal(pixValido({tipo: 'Telefone', chave: '82999999999'}), false);
  assert.equal(pixValido({tipo: 'Telefone', chave: '+1 555 0100'}), false);
});

test('R82: PIX chave aleatoria valida e invalida', () => {
  assert.equal(pixValido({tipo: 'Chave aleatória', chave: '123e4567-e89b-12d3-a456-426614174000'}), true);
  assert.equal(pixValido({tipo: 'Chave aleatória', chave: '123E4567-E89B-12D3-A456-426614174000'}), true);
  assert.equal(pixValido({tipo: 'Chave aleatória', chave: '123e4567e89b12d3a456426614174000'}), false);
  assert.equal(pixValido({tipo: 'Chave aleatória', chave: 'nao-e-uuid'}), false);
});

test('R82: PIX rejeita tipo desconhecido e entradas malformadas', () => {
  assert.equal(pixValido({tipo: 'Boleto', chave: '11222333000181'}), false);
  assert.equal(pixValido(null), false);
  assert.equal(pixValido({tipo: 'CNPJ', chave: 123}), false);
});

test('R82: normalizarEmpreendimento sanitiza links, CNPJ, PIX e chaves desconhecidas', () => {
  const raw = {
    id: 'easy-serraria',
    razaoSocial: '  Empresa Exemplo LTDA  ',
    cnpj: '11.222.333/0001-82',
    pix: {tipo: 'CNPJ', chave: '11.222.333/0001-82', favorecido: '  Fulano  ', banco: ' Banco X '},
    materiais: {
      plantas: [linkOk('  Planta 2 quartos ', 'https://drive.google.com/a'), linkOk('ruim', 'http://x.com/a')],
      'chave-inexistente': [linkOk('x', 'https://x.com')],
    },
    postagens: [{titulo: '', url: 'https://x.com/p', tipo: 'Imagem'}, {titulo: 'ruim', url: 'http://x.com/q', tipo: 'Vídeo'}],
  };
  const emp = normalizarEmpreendimento(raw);
  assert.notEqual(emp, null);
  assert.equal(emp.nome, 'Easy Serraria');
  assert.equal(emp.bairro, 'Serraria');
  assert.equal(emp.cidade, 'Maceió/AL');
  assert.equal(emp.status, 'Em obras');
  assert.equal(emp.razaoSocial, 'Empresa Exemplo LTDA');
  assert.equal(emp.cnpj, '');
  assert.deepEqual(emp.pix, {tipo: 'CNPJ', chave: '', favorecido: 'Fulano', banco: 'Banco X'});
  assert.deepEqual(emp.materiais.plantas, [linkOk('Planta 2 quartos', 'https://drive.google.com/a')]);
  assert.equal('chave-inexistente' in emp.materiais, false);
  assert.deepEqual(emp.postagens, [{titulo: 'Postagem', url: 'https://x.com/p', tipo: 'Imagem'}]);
});

test('R83: postagens no formato antigo por mes sao achatadas na ordem das chaves', () => {
  const emp = normalizarEmpreendimento({
    id: 'eco-vitta',
    postagens: {
      '02': [{titulo: 'B1', url: 'https://b.com/1', tipo: 'Carrossel'}],
      '01': [{titulo: 'A1', url: 'https://a.com/1', tipo: 'Vídeo'}, {titulo: 'A2', url: 'https://a.com/2'}],
      '03': 'nao e lista',
    },
  });
  assert.deepEqual(emp.postagens, [
    {titulo: 'A1', url: 'https://a.com/1', tipo: 'Vídeo'},
    {titulo: 'A2', url: 'https://a.com/2', tipo: 'Vídeo'},
    {titulo: 'B1', url: 'https://b.com/1', tipo: 'Carrossel'},
  ]);
});

test('R83: tipo invalido ou ausente vira Vídeo', () => {
  const emp = normalizarEmpreendimento({
    id: 'eco-vitta',
    postagens: [
      {titulo: 'Reels', url: 'https://a.com/1', tipo: 'Reels'},
      {titulo: 'Sem tipo', url: 'https://a.com/2'},
      {titulo: 'Numero', url: 'https://a.com/3', tipo: 7},
      {titulo: 'Texto', url: 'https://a.com/4', tipo: 'Texto'},
    ],
  });
  assert.deepEqual(emp.postagens.map((p) => p.tipo), ['Vídeo', 'Vídeo', 'Vídeo', 'Texto']);
});

test('R83: postagens com link http, sem host ou javascript sao descartadas', () => {
  const emp = normalizarEmpreendimento({
    id: 'eco-vitta',
    postagens: [
      {titulo: 'Http', url: 'http://x.com/a', tipo: 'Imagem'},
      {titulo: 'Js', url: 'javascript:alert(1)', tipo: 'Imagem'},
      {titulo: 'Vazio', url: '', tipo: 'Imagem'},
      null,
      {titulo: 'Ok', url: 'https://x.com/ok', tipo: 'Texto'},
    ],
  });
  assert.deepEqual(emp.postagens, [{titulo: 'Ok', url: 'https://x.com/ok', tipo: 'Texto'}]);
});

test('R83: postagens sao limitadas a 60 itens', () => {
  const lista = Array.from({length: 61}, (_, i) => ({titulo: `Post ${i}`, url: `https://x.com/${i}`, tipo: 'Imagem'}));
  const emp = normalizarEmpreendimento({id: 'eco-vitta', postagens: lista});
  assert.equal(emp.postagens.length, MAX_POSTAGENS);
  assert.equal(emp.postagens[59].titulo, 'Post 59');
});

test('R82: normalizarEmpreendimento aceita CNPJ valido e formata', () => {
  const emp = normalizarEmpreendimento({id: 'eco-vitta', cnpj: '11222333000181'});
  assert.equal(emp.cnpj, '11.222.333/0001-81');
});

test('R82: normalizarEmpreendimento limita a 20 links por item', () => {
  const links = Array.from({length: 25}, (_, i) => linkOk(`Arquivo ${i}`, `https://x.com/${i}`));
  const emp = normalizarEmpreendimento({id: 'eco-vitta', materiais: {plantas: links}});
  assert.equal(emp.materiais.plantas.length, MAX_LINKS_POR_ITEM);
  assert.equal(emp.materiais.plantas[19].titulo, 'Arquivo 19');
});

test('R82: normalizarEmpreendimento sempre devolve todos os itens de materiais e postagens como lista', () => {
  const emp = normalizarEmpreendimento({id: 'vistas-do-sino'});
  assert.deepEqual(Object.keys(emp.materiais).sort(), [...ITENS_MATERIAIS].sort());
  for (const lista of Object.values(emp.materiais)) assert.deepEqual(lista, []);
  assert.deepEqual(emp.postagens, []);
});

test('R82: normalizarEmpreendimento nunca lanca e rejeita ids fora do catalogo', () => {
  assert.equal(normalizarEmpreendimento(null), null);
  assert.equal(normalizarEmpreendimento('texto'), null);
  assert.equal(normalizarEmpreendimento({id: 'nao-existe'}), null);
  assert.equal(normalizarEmpreendimento({}), null);
  const emp = normalizarEmpreendimento({id: 'eco-vitta', pix: 'x', materiais: 'x', postagens: null, razaoSocial: 99});
  assert.notEqual(emp, null);
  assert.equal(emp.razaoSocial, '');
  assert.deepEqual(emp.pix, {tipo: 'CNPJ', chave: '', favorecido: '', banco: ''});
});

test('R82: listar e obter usam os dados brutos e tratam id inexistente', () => {
  assert.equal(listarEmpreendimentos().length, empreendimentos.length);
  assert.equal(obterEmpreendimento('nao-existe'), null);
  assert.equal(obterEmpreendimento(undefined), null);
  assert.equal(obterEmpreendimento('eco-vitta').nome, 'Eco Vittá');
});

test('R82: statusDados resume o preenchimento', () => {
  const vazio = statusDados(obterEmpreendimento('eco-vitta'));
  assert.deepEqual(vazio, {cnpj: false, pix: false, materiais: 0, postagens: 0});
  const emp = normalizarEmpreendimento({
    id: 'eco-vitta',
    cnpj: '11222333000181',
    pix: {tipo: 'Telefone', chave: '+55 82 99999-9999'},
    materiais: {plantas: [linkOk('a', 'https://a.com'), linkOk('b', 'https://b.com')]},
    postagens: [
      {titulo: 'c', url: 'https://c.com', tipo: 'Vídeo'},
      {titulo: 'd', url: 'https://d.com', tipo: 'Imagem'},
      {titulo: 'e', url: 'https://e.com', tipo: 'Texto'},
    ],
  });
  assert.deepEqual(statusDados(emp), {cnpj: true, pix: true, materiais: 2, postagens: 3});
  assert.deepEqual(statusDados(null), {cnpj: false, pix: false, materiais: 0, postagens: 0});
});

test('R82: biblioteca lib nao faz chamadas de rede nem cria clientes', () => {
  assert.equal(libSource.includes('fetch('), false);
  assert.equal(libSource.includes('createClient('), false);
});
