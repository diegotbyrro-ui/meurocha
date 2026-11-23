import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {empreendimentos} from '../lib/catalog.mjs';
import {bibliotecaCategorias} from '../lib/biblioteca.mjs';
import {
  MESES, TIPOS_PIX, SECOES_MATERIAIS, ITENS_MATERIAIS, MAX_LINKS_POR_ITEM, DADOS_EMPREENDIMENTOS,
  somenteDigitos, cnpjValido, formatarCnpj, linkSeguro, pixValido,
  normalizarEmpreendimento, listarEmpreendimentos, obterEmpreendimento, statusDados,
} from '../lib/empreendimentos-central.mjs';

const read = (p) => readFileSync(join(process.cwd(), p), 'utf8');
const libSource = read('lib/empreendimentos-central.mjs');
const linkOk = (titulo, url) => ({titulo, url});

test('R82: meses, tipos PIX e secoes seguem a ordem aprovada', () => {
  assert.equal(MESES.length, 12);
  assert.deepEqual(MESES.map((m) => m.id), ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']);
  assert.equal(MESES[0].nome, 'Janeiro');
  assert.equal(MESES[11].nome, 'Dezembro');
  assert.deepEqual([...TIPOS_PIX], ['CNPJ', 'E-mail', 'Telefone', 'Chave aleatória']);
  assert.deepEqual(SECOES_MATERIAIS.map((s) => s.id), ['perspectivas', 'comercial', 'videos', 'identidade', 'projetos', 'documentacao']);
  assert.deepEqual(SECOES_MATERIAIS[0].itens.map((i) => i.id), ['perspectivas-internas', 'perspectivas-externas', 'plantas']);
  assert.equal(Object.isFrozen(MESES), true);
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
    assert.deepEqual(d.postagens, {});
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
    postagens: {'03': [linkOk('', 'https://x.com/p')]},
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
  assert.deepEqual(emp.postagens['03'], [linkOk('Arquivo', 'https://x.com/p')]);
});

test('R82: normalizarEmpreendimento aceita CNPJ valido e formata', () => {
  const emp = normalizarEmpreendimento({id: 'eco-vitta', cnpj: '11222333000181'});
  assert.equal(emp.cnpj, '11.222.333/0001-81');
});

test('R82: normalizarEmpreendimento limita a 20 links por item', () => {
  const links = Array.from({length: 25}, (_, i) => linkOk(`Arquivo ${i}`, `https://x.com/${i}`));
  const emp = normalizarEmpreendimento({id: 'eco-vitta', materiais: {plantas: links}, postagens: {'01': links}});
  assert.equal(emp.materiais.plantas.length, MAX_LINKS_POR_ITEM);
  assert.equal(emp.postagens['01'].length, MAX_LINKS_POR_ITEM);
  assert.equal(emp.materiais.plantas[19].titulo, 'Arquivo 19');
});

test('R82: normalizarEmpreendimento sempre devolve todos os itens e os 12 meses', () => {
  const emp = normalizarEmpreendimento({id: 'vistas-do-sino'});
  assert.deepEqual(Object.keys(emp.materiais).sort(), [...ITENS_MATERIAIS].sort());
  assert.deepEqual(Object.keys(emp.postagens).sort(), MESES.map((m) => m.id));
  for (const lista of Object.values(emp.materiais)) assert.deepEqual(lista, []);
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
  assert.deepEqual(vazio, {cnpj: false, pix: false, materiais: 0, postagens: 0, mesesComPostagem: 0});
  const emp = normalizarEmpreendimento({
    id: 'eco-vitta',
    cnpj: '11222333000181',
    pix: {tipo: 'Telefone', chave: '+55 82 99999-9999'},
    materiais: {plantas: [linkOk('a', 'https://a.com'), linkOk('b', 'https://b.com')]},
    postagens: {'01': [linkOk('c', 'https://c.com')], '02': [linkOk('d', 'https://d.com'), linkOk('e', 'https://e.com')]},
  });
  assert.deepEqual(statusDados(emp), {cnpj: true, pix: true, materiais: 2, postagens: 3, mesesComPostagem: 2});
  assert.deepEqual(statusDados(null), {cnpj: false, pix: false, materiais: 0, postagens: 0, mesesComPostagem: 0});
});

test('R82: biblioteca lib nao faz chamadas de rede nem cria clientes', () => {
  assert.equal(libSource.includes('fetch('), false);
  assert.equal(libSource.includes('createClient('), false);
});
