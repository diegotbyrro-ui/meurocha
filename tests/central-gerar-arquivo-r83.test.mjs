import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {empreendimentos} from '../lib/catalog.mjs';
import {gerarArquivoDados, resumoAlteracoes} from '../lib/central-gerar-arquivo.mjs';

const vazio = (id) => ({
  id,
  razaoSocial: '',
  cnpj: '',
  pix: {tipo: 'CNPJ', chave: '', favorecido: '', banco: ''},
  materiais: {},
  postagens: [],
});

/** Escreve o arquivo gerado em um diretorio temporario e o importa de volta. */
async function importarGerado(texto) {
  const dir = mkdtempSync(join(tmpdir(), 'r83-central-'));
  try {
    const arquivo = join(dir, 'central-dados.mjs');
    writeFileSync(arquivo, texto, 'utf8');
    const modulo = await import(pathToFileURL(arquivo).href);
    return modulo.default;
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
}

test('R83: arquivo gerado com dados reais e importavel, links invalidos descartados', async () => {
  const entrada = [{
    id: 'easy-serraria',
    razaoSocial: 'Empresa Exemplo LTDA',
    cnpj: '11.222.333/0001-81',
    pix: {tipo: 'E-mail', chave: 'financeiro@rocha.com.br', favorecido: 'Rocha', banco: 'Banco X'},
    materiais: {
      plantas: [
        {titulo: 'Planta 2 quartos', url: 'https://drive.google.com/a'},
        {titulo: 'Ruim', url: 'http://x.com/a'},
      ],
    },
    postagens: [
      {titulo: 'Post março', url: 'https://x.com/post', tipo: 'Carrossel'},
      {titulo: 'Link ruim', url: 'http://x.com/ruim', tipo: 'Texto'},
    ],
  }];

  const texto = gerarArquivoDados(entrada);
  assert.ok(texto.includes('export default Object.freeze('));
  assert.ok(texto.includes('Arquivo gerado pela tela Atualizar conteúdo do portal (/portal/atualizar)'));

  const dados = await importarGerado(texto);
  assert.deepEqual(dados, [
    vazio('easy-rota-do-mar'),
    {
      id: 'easy-serraria',
      razaoSocial: 'Empresa Exemplo LTDA',
      cnpj: '11.222.333/0001-81',
      pix: {tipo: 'E-mail', chave: 'financeiro@rocha.com.br', favorecido: 'Rocha', banco: 'Banco X'},
      materiais: {plantas: [{titulo: 'Planta 2 quartos', url: 'https://drive.google.com/a'}]},
      postagens: [{titulo: 'Post março', url: 'https://x.com/post', tipo: 'Carrossel'}],
    },
    vazio('vistas-do-sino'),
    vazio('eco-vitta'),
  ]);
  assert.equal(dados.length, 4);
  assert.deepEqual(dados.map((d) => d.id), empreendimentos.map((e) => e.id));
});

test('R83: gerarArquivoDados(null) gera arquivo valido com os 4 empreendimentos vazios', async () => {
  const texto = gerarArquivoDados(null);
  assert.ok(texto.startsWith('// Arquivo gerado'));
  assert.ok(texto.includes('export default Object.freeze('));
  const dados = await importarGerado(texto);
  assert.deepEqual(dados, empreendimentos.map((e) => vazio(e.id)));
});

test('R83: gerarArquivoDados nunca lanca com entradas invalidas', async () => {
  for (const entrada of ['texto', 5, [null, 7, 'x', {id: 'nao-existe'}], [{id: 'eco-vitta', pix: 'x', materiais: null}]]) {
    const texto = gerarArquivoDados(entrada);
    const dados = await importarGerado(texto);
    assert.equal(dados.length, 4);
  }
});

test('R83: resumoAlteracoes descreve mudancas em portugues, comparando por id', () => {
  const depois = [{
    id: 'easy-serraria',
    razaoSocial: '',
    cnpj: '11.222.333/0001-81',
    pix: {tipo: 'CNPJ', chave: '', favorecido: '', banco: ''},
    materiais: {plantas: [
      {titulo: 'A', url: 'https://a.com/1'},
      {titulo: 'B', url: 'https://a.com/2'},
    ]},
    postagens: {},
  }];
  const frases = resumoAlteracoes(null, depois);
  assert.ok(frases.includes('Easy Serraria: CNPJ alterado'));
  assert.ok(frases.includes('Easy Serraria: 2 links novos em Plantas'));
  assert.equal(frases.some((f) => f.startsWith('Easy Rota do Mar')), false);
});

test('R83: resumoAlteracoes sem mudancas devolve lista vazia e nunca lanca', () => {
  assert.deepEqual(resumoAlteracoes(null, null), []);
  assert.deepEqual(resumoAlteracoes('x', [null]), []);
});

test('R83: resumoAlteracoes conta postagens novas e removidas, sem meses', () => {
  const antes = [{
    id: 'easy-serraria',
    postagens: [{titulo: 'Velha', url: 'https://a.com/velha', tipo: 'Vídeo'}],
  }];
  const depois = [{
    id: 'easy-serraria',
    postagens: [
      {titulo: 'Nova 1', url: 'https://a.com/1', tipo: 'Imagem'},
      {titulo: 'Nova 2', url: 'https://a.com/2', tipo: 'Texto'},
      {titulo: 'Nova 3', url: 'https://a.com/3', tipo: 'Carrossel'},
    ],
  }];
  const frases = resumoAlteracoes(antes, depois);
  assert.ok(frases.includes('Easy Serraria: 3 postagens novas'));
  assert.ok(frases.includes('Easy Serraria: 1 postagem removida'));
  assert.equal(frases.some((f) => f.includes('mês') || f.includes('Janeiro')), false);
});

test('R83: postagens no formato antigo por mes viram lista unica no arquivo gerado', async () => {
  const entrada = [{
    id: 'eco-vitta',
    postagens: {
      '05': [{titulo: 'Maio', url: 'https://x.com/maio'}],
      '01': [{titulo: 'Janeiro', url: 'https://x.com/jan', tipo: 'Imagem'}],
    },
  }];
  const dados = await importarGerado(gerarArquivoDados(entrada));
  const eco = dados.find((d) => d.id === 'eco-vitta');
  assert.deepEqual(eco.postagens, [
    {titulo: 'Janeiro', url: 'https://x.com/jan', tipo: 'Imagem'},
    {titulo: 'Maio', url: 'https://x.com/maio', tipo: 'Vídeo'},
  ]);
});
