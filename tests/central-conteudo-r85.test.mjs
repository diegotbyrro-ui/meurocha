import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {criarFakeSupabase} from './helpers/fake-supabase.mjs';
import {empreendimentos} from '../lib/catalog.mjs';
import {
  DADOS_EMPREENDIMENTOS, listarEmpreendimentos, obterEmpreendimento,
} from '../lib/empreendimentos-central.mjs';
import {
  LIMITE_JSON_BYTES, lerConteudo, mesclarComArquivo, salvarConteudo,
} from '../lib/central-conteudo-repo.mjs';

const read = (p) => readFileSync(join(process.cwd(), p), 'utf8');
const SESSAO = '11111111-1111-4111-8111-111111111111';

const linha = (id, extra = {}) => ({
  id,
  razaoSocial: 'Empresa Exemplo LTDA',
  cnpj: '11.222.333/0001-81',
  pix: {tipo: 'E-mail', chave: 'financeiro@rocha.com.br', favorecido: 'Rocha', banco: 'Banco X'},
  materiais: {plantas: [{titulo: 'Planta 2 quartos', url: 'https://drive.google.com/a'}]},
  postagens: [{titulo: 'Post março', url: 'https://x.com/post', tipo: 'Carrossel'}],
  ...extra,
});

const vazioDe = (id) => ({
  id,
  razaoSocial: '',
  cnpj: '',
  pix: {tipo: 'CNPJ', chave: '', favorecido: '', banco: ''},
  materiais: {},
  postagens: [],
});

test('R85: listar e obter aceitam uma lista bruta e seguem usando o arquivo por padrao', () => {
  const dados = [linha('eco-vitta', {razaoSocial: 'Vinda do banco'})];
  const lista = listarEmpreendimentos(dados);
  assert.equal(lista.length, 1);
  assert.equal(lista[0].razaoSocial, 'Vinda do banco');
  assert.equal(obterEmpreendimento('eco-vitta', dados).razaoSocial, 'Vinda do banco');
  assert.equal(obterEmpreendimento('easy-serraria', dados), null);
  assert.equal(listarEmpreendimentos().length, DADOS_EMPREENDIMENTOS.length);
  assert.equal(listarEmpreendimentos(null).length, 0);
  assert.equal(obterEmpreendimento('eco-vitta', null), null);
});

test('R85 lerConteudo: devolve as linhas da tabela portal_conteudo', async () => {
  const db = criarFakeSupabase({portal_conteudo: [{empreendimento_id: 'eco-vitta', dados: linha('eco-vitta'), atualizado_em: '2026-11-20T10:00:00Z', atualizado_por: SESSAO}]});
  const r = await lerConteudo(db);
  assert.equal(r.ok, true);
  assert.equal(r.linhas.length, 1);
  assert.equal(r.linhas[0].empreendimento_id, 'eco-vitta');
});

test('R85 lerConteudo: erro do banco vira falha em portugues, sem lancar', async () => {
  const db = {from() { throw new Error('rede caiu'); }};
  const r = await lerConteudo(db);
  assert.equal(r.ok, false);
  assert.equal(r.status, 503);
  assert.match(r.erro, /Não foi possível/);
});

test('R85 mesclarComArquivo: linha do banco substitui a entrada do arquivo', () => {
  const arquivo = DADOS_EMPREENDIMENTOS.map((d) => ({...d}));
  const linhas = [{empreendimento_id: 'eco-vitta', dados: linha('eco-vitta', {razaoSocial: 'Do banco'})}];
  const lista = mesclarComArquivo(linhas, arquivo);
  const eco = lista.find((e) => e.id === 'eco-vitta');
  assert.equal(eco.razaoSocial, 'Do banco');
  assert.equal(eco.cnpj, '11.222.333/0001-81');
  assert.deepEqual(eco.materiais, {plantas: [{titulo: 'Planta 2 quartos', url: 'https://drive.google.com/a'}]});
});

test('R85 mesclarComArquivo: linha invalida e ignorada e o arquivo continua valendo', () => {
  const arquivo = [linha('vistas-do-sino', {razaoSocial: 'Do arquivo'})];
  const linhas = [
    {empreendimento_id: 'vistas-do-sino', dados: {id: 'nao-existe', razaoSocial: 'Lixo'}},
    {empreendimento_id: 'eco-vitta', dados: 'texto solto'},
    {empreendimento_id: 'easy-serraria', dados: {id: 'eco-vitta', razaoSocial: 'Trocado'}},
    {empreendimento_id: 'easy-rota-do-mar', dados: null},
  ];
  const lista = mesclarComArquivo(linhas, arquivo);
  assert.equal(lista.find((e) => e.id === 'vistas-do-sino').razaoSocial, 'Do arquivo');
  assert.deepEqual(lista.find((e) => e.id === 'eco-vitta'), vazioDe('eco-vitta'));
  assert.deepEqual(lista.find((e) => e.id === 'easy-serraria'), vazioDe('easy-serraria'));
  assert.ok(lista.every((e) => e.razaoSocial !== 'Lixo' && e.razaoSocial !== 'Trocado'));
});

test('R85 mesclarComArquivo: sempre na ordem do catalogo, com os 4 empreendimentos', () => {
  const lista = mesclarComArquivo([{empreendimento_id: 'eco-vitta', dados: linha('eco-vitta')}], []);
  assert.deepEqual(lista.map((e) => e.id), empreendimentos.map((e) => e.id));
  assert.equal(mesclarComArquivo(null, null).length, empreendimentos.length);
});

test('R85 salvarConteudo: faz upsert por empreendimento com quem salvou e quando', async () => {
  const db = criarFakeSupabase({portal_conteudo: [{empreendimento_id: 'eco-vitta', dados: vazioDe('eco-vitta'), atualizado_por: null}]});
  const r = await salvarConteudo(db, SESSAO, [linha('eco-vitta', {razaoSocial: 'Nova'}), linha('easy-serraria')]);
  assert.equal(r.ok, true);
  assert.equal(r.salvos, 2);
  assert.deepEqual(r.descartados, []);
  const linhas = db.tabelas.portal_conteudo;
  assert.equal(linhas.length, 2, 'upsert nao duplica a linha existente');
  const eco = linhas.find((l) => l.empreendimento_id === 'eco-vitta');
  assert.equal(eco.dados.razaoSocial, 'Nova');
  assert.equal(eco.atualizado_por, SESSAO);
  assert.match(eco.atualizado_em, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(eco.dados.id, 'eco-vitta');
});

test('R85 salvarConteudo: CNPJ e PIX invalidos sao descartados e informados', async () => {
  const db = criarFakeSupabase({});
  const r = await salvarConteudo(db, SESSAO, [linha('eco-vitta', {
    cnpj: '11.222.333/0001-82',
    pix: {tipo: 'CNPJ', chave: '11.222.333/0001-82', favorecido: '', banco: ''},
  })]);
  assert.equal(r.ok, true);
  assert.ok(r.descartados.some((m) => m.startsWith('Eco Vittá: CNPJ inválido')), r.descartados.join(' | '));
  assert.ok(r.descartados.some((m) => m.includes('chave PIX inválida')), r.descartados.join(' | '));
  const gravado = db.tabelas.portal_conteudo[0].dados;
  assert.equal(gravado.cnpj, '');
  assert.equal(gravado.pix.chave, '');
});

test('R85 salvarConteudo: links sem https sao descartados e contados', async () => {
  const db = criarFakeSupabase({});
  const r = await salvarConteudo(db, SESSAO, [linha('eco-vitta', {
    materiais: {plantas: [{titulo: 'Boa', url: 'https://a.com/x'}, {titulo: 'Ruim', url: 'http://a.com/y'}]},
    postagens: [{titulo: 'Ruim', url: 'javascript:alert(1)', tipo: 'Texto'}],
  })]);
  assert.equal(r.ok, true);
  assert.ok(r.descartados.some((m) => m.includes('1 link não foi salvo em Plantas')), r.descartados.join(' | '));
  assert.ok(r.descartados.some((m) => m.includes('1 postagem não foi salva')), r.descartados.join(' | '));
  assert.equal(db.tabelas.portal_conteudo[0].dados.materiais.plantas.length, 1);
});

test('R85 salvarConteudo: id fora do catalogo e repetido sao recusados sem gravar nada', async () => {
  const db = criarFakeSupabase({});
  const desconhecido = await salvarConteudo(db, SESSAO, [linha('nao-existe')]);
  assert.equal(desconhecido.ok, false);
  assert.equal(desconhecido.status, 400);
  const repetido = await salvarConteudo(db, SESSAO, [linha('eco-vitta'), linha('eco-vitta')]);
  assert.equal(repetido.ok, false);
  assert.equal(repetido.status, 400);
  assert.equal(db.tabelas.portal_conteudo, undefined);
});

test('R85 salvarConteudo: mais de 4 empreendimentos, lista vazia ou nao-lista sao recusados', async () => {
  const db = criarFakeSupabase({});
  const cinco = [...empreendimentos.map((e) => linha(e.id)), linha('eco-vitta')];
  assert.equal((await salvarConteudo(db, SESSAO, cinco)).ok, false);
  assert.equal((await salvarConteudo(db, SESSAO, [])).ok, false);
  assert.equal((await salvarConteudo(db, SESSAO, 'texto')).ok, false);
  assert.equal(db.tabelas.portal_conteudo, undefined);
});

test('R85 salvarConteudo: lista acima de 200 KB e recusada com 413', async () => {
  const db = criarFakeSupabase({});
  const grande = [linha('eco-vitta', {razaoSocial: 'x'.repeat(LIMITE_JSON_BYTES + 1024)})];
  const r = await salvarConteudo(db, SESSAO, grande);
  assert.equal(r.ok, false);
  assert.equal(r.status, 413);
  assert.equal(db.tabelas.portal_conteudo, undefined);
});

test('R85 salvarConteudo: falha do banco vira erro em portugues e nunca lanca', async () => {
  const db = {from() { return {upsert: async () => ({data: null, error: {message: 'x'}})}; }};
  const r = await salvarConteudo(db, SESSAO, [linha('eco-vitta')]);
  assert.equal(r.ok, false);
  assert.equal(r.status, 500);
  assert.match(r.erro, /Não foi possível salvar/);
});

test('R85 rota: GET e PUT exigem a equipe com protegerApi e limitam o corpo', () => {
  const rota = read('app/api/portal/conteudo/route.ts');
  assert.equal(rota.split("protegerApi(request, 'equipe')").length - 1, 2);
  assert.match(rota, /export async function GET/);
  assert.match(rota, /export async function PUT/);
  assert.match(rota, /LIMITE_JSON_BYTES/);
  assert.ok(rota.includes('503'));
});

test('R85 telas: Atualizar nao mostra mais o GitHub e salva direto no portal', () => {
  const client = read('app/portal/atualizar/AtualizarClient.tsx');
  assert.equal(client.includes('Commit changes'), false);
  assert.equal(client.includes('GitHub'), false);
  assert.equal(client.includes('githubUrl'), false);
  assert.match(client, /\/api\/portal\/conteudo/);
  assert.match(client, /Salvar e publicar no portal/);
  assert.match(client, /Salvando…/);
  assert.match(client, /Pronto! Corretores e equipe já veem as mudanças\./);
  assert.match(client, /Cópia de segurança/);
  assert.match(client, /Baixar cópia de segurança/);
  assert.match(client, /<AjudaPagina/);
});

test('R85 pagina Atualizar carrega os dados mesclados do servidor', () => {
  const page = read('app/portal/atualizar/page.tsx');
  assert.match(page, /dadosCentral\(\)/);
  assert.equal(page.includes('GITHUB_EDITAR_DADOS_URL'), false);
});

test('R85 central: listagem e detalhe usam os dados mesclados e mostram a ultima atualizacao', () => {
  const lista = read('app/portal/central/page.tsx');
  assert.match(lista, /listarEmpreendimentos\(dados\)/);
  assert.match(lista, /ultimaAtualizacao\(\)/);
  assert.match(lista, /Atualizado em/);
  const detalhe = read('app/portal/central/[id]/page.tsx');
  assert.match(detalhe, /obterEmpreendimento\(id, dados\)/);
});
