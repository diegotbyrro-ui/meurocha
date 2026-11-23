import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { criarFakeSupabase } from './helpers/fake-supabase.mjs';
import { listarEquipe, adicionarPessoa, editarPessoa, trocarSenha, erroSenha } from '../lib/portal-equipe-repo.mjs';
import { listarCorretores, mudarStatusCorretor, editarCorretor, resumoCorretores, montarCsvCorretores } from '../lib/portal-corretores-repo.mjs';

const read = (f) => readFileSync(join(process.cwd(), f), 'utf8');
const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

const pessoa = (n, nome, setor, ativo = true) => ({
  id: uuid(n), nome, email: `${nome.split(' ')[0].toLowerCase()}@rocha.com.br`, setor, ativo, criado_em: '2026-01-01T00:00:00Z',
});
const equipeBase = () => [
  pessoa(1, 'Diego Taketomi', 'diretoria'),
  pessoa(2, 'Ana Lima', 'marketing'),
  pessoa(3, 'Bruno Melo', 'equipe', false),
];

const corretor = (n, o = {}) => ({
  id: uuid(100 + n), creci: String(1000 + n), uf: 'AL', nome: `Corretor ${n}`, whatsapp: '82999990000',
  imobiliaria: null, email: null, status: 'ativo', acessos: 0, ultimo_acesso: null, criado_em: '2026-01-01T00:00:00Z', ...o,
});
const SEEDS = [
  corretor(1, { nome: 'Mariana Souza', creci: '12345F', imobiliaria: 'Imobiliária Coral', ultimo_acesso: '2026-11-20T10:00:00Z', criado_em: '2026-11-01T00:00:00Z' }),
  corretor(2, { nome: 'Carlos Lima', creci: '777', imobiliaria: 'Alagoas Imóveis', status: 'bloqueado', ultimo_acesso: '2026-11-10T10:00:00Z', criado_em: '2026-11-18T00:00:00Z' }),
  corretor(3, { nome: 'Joana Dias', creci: '5555J', criado_em: '2026-10-01T00:00:00Z' }),
  corretor(4, { nome: 'Pedro Alves', creci: '9000', imobiliaria: 'Coral Negócios', ultimo_acesso: '2026-11-22T10:00:00Z', criado_em: '2026-11-18T00:00:00Z' }),
  corretor(5, { nome: 'Lúcia Prado', creci: '4321', ultimo_acesso: '2026-11-16T11:00:00Z', criado_em: '2025-01-01T00:00:00Z' }),
  corretor(6, { nome: 'Rafael Gomes', creci: '6600', status: 'bloqueado', criado_em: '2026-11-23T00:00:00Z' }),
  corretor(7, { nome: 'Sueli Nunes', creci: '7001', ultimo_acesso: '2026-11-23T08:00:00Z', criado_em: '2026-11-17T00:00:00Z' }),
  corretor(8, { nome: 'Tiago Rocha', creci: '8008', ultimo_acesso: '2026-11-16T12:00:00Z', criado_em: '2026-05-05T00:00:00Z' }),
];
const AGORA = Date.parse('2026-11-23T12:00:00Z');

// ---------- Equipe ----------

test('R85 equipe: lista as pessoas em ordem de nome', async () => {
  const db = criarFakeSupabase({ portal_equipe: equipeBase() });
  const r = await listarEquipe(db);
  assert.equal(r.ok, true);
  assert.deepEqual(r.equipe.map((p) => p.nome), ['Ana Lima', 'Bruno Melo', 'Diego Taketomi']);
});

test('R85 equipe: cria o login já confirmado e a linha da equipe', async () => {
  const db = criarFakeSupabase({ portal_equipe: [] });
  const r = await adicionarPessoa(db, { nome: '  Carla   Souza ', email: 'Carla@Rocha.com.br', setor: 'marketing', senha: 'Senha12345' });
  assert.equal(r.ok, true);
  assert.equal(r.pessoa.nome, 'Carla Souza');
  assert.equal(r.pessoa.email, 'carla@rocha.com.br');
  assert.equal(r.pessoa.ativo, true);
  assert.equal(db.usuarios.length, 1);
  assert.equal(db.usuarios[0].id, r.pessoa.id);
  assert.equal(db.usuarios[0].password, 'Senha12345');
});

test('R85 equipe: e-mail já usado em um login existente', async () => {
  const db = criarFakeSupabase({ portal_equipe: [] });
  db.usuarios.push({ id: uuid(50), email: 'ana@rocha.com.br', password: 'x' });
  const r = await adicionarPessoa(db, { nome: 'Ana Lima', email: 'ana@rocha.com.br', setor: 'equipe', senha: 'Senha12345' });
  assert.equal(r.ok, false);
  assert.equal(r.status, 409);
  assert.equal(r.erro, 'Já existe um login com este e-mail.');
  assert.equal(db.usuarios.length, 1);
});

test('R85 equipe: senha fraca e dados inválidos não criam login', async () => {
  const db = criarFakeSupabase({ portal_equipe: [] });
  for (const senha of ['curta1', 'somenteletras', '1234567890', 'x'.repeat(73) + '1']) {
    const r = await adicionarPessoa(db, { nome: 'Teste Um', email: 'teste@rocha.com.br', setor: 'equipe', senha });
    assert.equal(r.ok, false, senha);
    assert.equal(r.status, 400);
  }
  assert.equal(erroSenha('Senha12345'), null);
  const sem = await adicionarPessoa(db, { nome: 'A', email: 'teste@rocha.com.br', setor: 'equipe', senha: 'Senha12345' });
  assert.equal(sem.ok, false);
  const email = await adicionarPessoa(db, { nome: 'Teste Um', email: 'nao-e-email', setor: 'equipe', senha: 'Senha12345' });
  assert.equal(email.ok, false);
  const setor = await adicionarPessoa(db, { nome: 'Teste Um', email: 'teste@rocha.com.br', setor: 'chefia', senha: 'Senha12345' });
  assert.equal(setor.ok, false);
  assert.equal(db.usuarios.length, 0);
});

test('R85 equipe: se a linha da equipe falhar, o login criado é desfeito', async () => {
  const db = criarFakeSupabase({ portal_equipe: [] });
  const from = db.from;
  db.from = (nome) => (nome === 'portal_equipe'
    ? { insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: 'falha de rede', code: 'XX000' } }) }) }) }
    : from(nome));
  const r = await adicionarPessoa(db, { nome: 'Carla Souza', email: 'carla@rocha.com.br', setor: 'equipe', senha: 'Senha12345' });
  assert.equal(r.ok, false);
  assert.equal(r.status, 500);
  assert.equal(db.usuarios.length, 0, 'o login temporário precisa ser removido');
});

test('R85 equipe: e-mail repetido na tabela da equipe também é desfeito e explicado', async () => {
  const db = criarFakeSupabase({ portal_equipe: [pessoa(9, 'Carla Antiga', 'equipe')] });
  const from = db.from;
  db.from = (nome) => (nome === 'portal_equipe'
    ? { insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: 'duplicate key', code: '23505' } }) }) }) }
    : from(nome));
  const r = await adicionarPessoa(db, { nome: 'Carla Souza', email: 'carla@rocha.com.br', setor: 'equipe', senha: 'Senha12345' });
  assert.equal(r.ok, false);
  assert.equal(r.erro, 'Já existe uma pessoa cadastrada com este e-mail.');
  assert.equal(db.usuarios.length, 0);
});

test('R85 equipe: ninguém desativa o próprio acesso', async () => {
  const db = criarFakeSupabase({ portal_equipe: equipeBase() });
  const r = await editarPessoa(db, { id: uuid(1) }, uuid(1), { ativo: false });
  assert.equal(r.ok, false);
  assert.equal(r.erro, 'Você não pode desativar o seu próprio acesso.');
  assert.equal(db.tabelas.portal_equipe.find((p) => p.id === uuid(1)).ativo, true);
});

test('R85 equipe: não deixa a equipe sem nenhuma pessoa ativa', async () => {
  const db = criarFakeSupabase({ portal_equipe: [pessoa(1, 'Diego Taketomi', 'diretoria'), pessoa(3, 'Bruno Melo', 'equipe', false)] });
  const bloqueado = await editarPessoa(db, { id: uuid(9) }, uuid(1), { ativo: false });
  assert.equal(bloqueado.ok, false);
  assert.equal(bloqueado.erro, 'A equipe precisa ter pelo menos uma pessoa ativa.');
  assert.equal(db.tabelas.portal_equipe.find((p) => p.id === uuid(1)).ativo, true);

  const dbDois = criarFakeSupabase({ portal_equipe: [pessoa(1, 'Diego Taketomi', 'diretoria'), pessoa(2, 'Ana Lima', 'marketing')] });
  const ok = await editarPessoa(dbDois, { id: uuid(1) }, uuid(2), { ativo: false });
  assert.equal(ok.ok, true);
  assert.equal(ok.pessoa.ativo, false);
  const reativa = await editarPessoa(dbDois, { id: uuid(1) }, uuid(2), { ativo: true });
  assert.equal(reativa.ok, true);
  assert.equal(reativa.pessoa.ativo, true);
});

test('R85 equipe: edita nome e setor com validação', async () => {
  const db = criarFakeSupabase({ portal_equipe: equipeBase() });
  const ok = await editarPessoa(db, { id: uuid(1) }, uuid(2), { nome: 'Ana Paula Lima', setor: 'diretoria' });
  assert.equal(ok.ok, true);
  assert.equal(ok.pessoa.nome, 'Ana Paula Lima');
  assert.equal(ok.pessoa.setor, 'diretoria');
  assert.equal((await editarPessoa(db, { id: uuid(1) }, uuid(2), { setor: 'chefia' })).ok, false);
  assert.equal((await editarPessoa(db, { id: uuid(1) }, uuid(2), { nome: 'A' })).ok, false);
  assert.equal((await editarPessoa(db, { id: uuid(1) }, uuid(77), { nome: 'Ninguém' })).status, 404);
  assert.equal((await editarPessoa(db, { id: uuid(1) }, 'nao-e-uuid', { nome: 'Ninguém' })).status, 404);
});

test('R85 equipe: troca de senha usa a mesma regra da criação', async () => {
  const db = criarFakeSupabase({ portal_equipe: [] });
  const criada = await adicionarPessoa(db, { nome: 'Carla Souza', email: 'carla@rocha.com.br', setor: 'equipe', senha: 'Senha12345' });
  const fraca = await trocarSenha(db, criada.pessoa.id, 'fraca');
  assert.equal(fraca.ok, false);
  assert.equal(db.usuarios[0].password, 'Senha12345');
  const ok = await trocarSenha(db, criada.pessoa.id, 'Nova123456');
  assert.equal(ok.ok, true);
  assert.equal(db.usuarios[0].password, 'Nova123456');
  assert.equal((await trocarSenha(db, 'nao-uuid', 'Nova123456')).status, 404);
});

// ---------- Corretores ----------

test('R85 corretores: busca por nome, CRECI ou imobiliária, sem diferenciar maiúsculas', async () => {
  const db = criarFakeSupabase({ portal_corretores: SEEDS.map((c) => ({ ...c })) });
  const coral = await listarCorretores(db, { busca: 'CORAL' });
  assert.equal(coral.ok, true);
  assert.deepEqual(coral.corretores.map((c) => c.nome).sort(), ['Mariana Souza', 'Pedro Alves']);
  assert.equal(coral.total, 2);
  const creci = await listarCorretores(db, { busca: '5555' });
  assert.deepEqual(creci.corretores.map((c) => c.nome), ['Joana Dias']);
  const nome = await listarCorretores(db, { busca: 'lúcia' });
  assert.deepEqual(nome.corretores.map((c) => c.nome), ['Lúcia Prado']);
  const nada = await listarCorretores(db, { busca: 'zzz' });
  assert.equal(nada.total, 0);
});

test('R85 corretores: busca com caracteres especiais não quebra o filtro', async () => {
  const db = criarFakeSupabase({ portal_corretores: SEEDS.map((c) => ({ ...c })) });
  const r = await listarCorretores(db, { busca: 'a,b.c%_(d)' });
  assert.equal(r.ok, true);
  assert.equal(r.total, 0);
});

test('R85 corretores: filtro por situação', async () => {
  const db = criarFakeSupabase({ portal_corretores: SEEDS.map((c) => ({ ...c })) });
  const bloqueados = await listarCorretores(db, { status: 'bloqueado' });
  assert.deepEqual(bloqueados.corretores.map((c) => c.nome).sort(), ['Carlos Lima', 'Rafael Gomes']);
  const ativos = await listarCorretores(db, { status: 'ativo' });
  assert.equal(ativos.total, 6);
  assert.ok(ativos.corretores.every((c) => c.status === 'ativo'));
  const todos = await listarCorretores(db, { status: 'todos' });
  assert.equal(todos.total, 8);
  assert.equal((await listarCorretores(db, { status: 'qualquer' })).ok, false);
});

test('R85 corretores: 50 por página, mais recente acesso primeiro, com "temMais"', async () => {
  const muitos = Array.from({ length: 60 }, (_, i) => corretor(i + 1, {
    nome: `Corretor ${String(i + 1).padStart(2, '0')}`,
    creci: String(2000 + i),
    ultimo_acesso: new Date(Date.UTC(2026, 0, 1) + i * 3600e3).toISOString(),
  }));
  const db = criarFakeSupabase({ portal_corretores: muitos });
  const p1 = await listarCorretores(db, { pagina: 1 });
  assert.equal(p1.corretores.length, 50);
  assert.equal(p1.total, 60);
  assert.equal(p1.temMais, true);
  assert.equal(p1.corretores[0].nome, 'Corretor 60');
  const p2 = await listarCorretores(db, { pagina: 2 });
  assert.equal(p2.corretores.length, 10);
  assert.equal(p2.temMais, false);
  assert.equal(p2.corretores[9].nome, 'Corretor 01');
  const invalida = await listarCorretores(db, { pagina: 'abc' });
  assert.equal(invalida.pagina, 1);
});

test('R85 corretores: bloquear e liberar', async () => {
  const db = criarFakeSupabase({ portal_corretores: SEEDS.map((c) => ({ ...c })) });
  const bloqueio = await mudarStatusCorretor(db, uuid(101), 'bloqueado');
  assert.equal(bloqueio.ok, true);
  assert.equal(bloqueio.corretor.status, 'bloqueado');
  assert.equal(db.tabelas.portal_corretores.find((c) => c.id === uuid(101)).status, 'bloqueado');
  const liberado = await mudarStatusCorretor(db, uuid(101), 'ativo');
  assert.equal(liberado.corretor.status, 'ativo');
  assert.equal((await mudarStatusCorretor(db, uuid(101), 'excluido')).ok, false);
  assert.equal((await mudarStatusCorretor(db, uuid(999), 'ativo')).status, 404);
});

test('R85 corretores: edita contato com as mesmas regras do cadastro', async () => {
  const db = criarFakeSupabase({ portal_corretores: SEEDS.map((c) => ({ ...c })) });
  const ok = await editarCorretor(db, uuid(101), { whatsapp: '(82) 98888-7777', imobiliaria: '', email: 'Mariana@Exemplo.com' });
  assert.equal(ok.ok, true);
  assert.equal(ok.corretor.whatsapp, '82988887777');
  assert.equal(ok.corretor.imobiliaria, null);
  assert.equal(ok.corretor.email, 'mariana@exemplo.com');
  assert.equal(ok.corretor.creci, '12345F', 'CRECI não muda');
  assert.equal((await editarCorretor(db, uuid(101), { whatsapp: '123' })).ok, false);
  assert.equal((await editarCorretor(db, uuid(101), { email: 'x@' })).ok, false);
  assert.equal((await editarCorretor(db, uuid(101), { nome: 'A' })).ok, false);
  assert.equal((await editarCorretor(db, uuid(101), {})).erro, 'Nada para alterar.');
  assert.equal((await editarCorretor(db, uuid(999), { nome: 'Ninguém' })).status, 404);
});

test('R85 corretores: números do topo', async () => {
  const db = criarFakeSupabase({ portal_corretores: SEEDS.map((c) => ({ ...c })) });
  const r = await resumoCorretores(db, AGORA);
  assert.equal(r.ok, true);
  assert.deepEqual(r.resumo, { total: 8, ativos: 6, bloqueados: 2, novos7dias: 4, acessaram7dias: 4 });
});

test('R85 corretores: planilha CSV com ponto e vírgula, BOM e proteção contra fórmulas', () => {
  const csv = montarCsvCorretores([
    { nome: 'Ana; "Teste"', creci: '1234F', uf: 'AL', whatsapp: '82999990000', imobiliaria: '=cmd', email: '', status: 'bloqueado', acessos: 3, ultimo_acesso: null, criado_em: '2026-01-05T12:00:00Z' },
  ]);
  assert.equal(csv.charCodeAt(0), 0xfeff);
  const [cabecalho, linha] = csv.slice(1).split('\r\n');
  assert.equal(cabecalho, 'Nome;CRECI;UF;WhatsApp;Imobiliária;E-mail;Situação;Acessos;Último acesso;Cadastrado em');
  assert.match(linha, /^"Ana; ""Teste""";CRECI 1234-F;AL;82999990000;'=cmd;;Bloqueado;3;Nunca entrou;05\/01\/2026$/);
  assert.equal(montarCsvCorretores([]), '\uFEFFNome;CRECI;UF;WhatsApp;Imobiliária;E-mail;Situação;Acessos;Último acesso;Cadastrado em');
});

// ---------- Estáticos: rotas e páginas protegidas ----------

const ROTAS = [
  'app/api/portal/equipe/route.ts',
  'app/api/portal/equipe/[id]/route.ts',
  'app/api/portal/corretores/route.ts',
  'app/api/portal/corretores/[id]/route.ts',
];

test('R85 equipe e corretores: todas as rotas começam com protegerApi(request, \'equipe\')', () => {
  for (const f of ROTAS) {
    const src = read(f);
    assert.match(src, /const s = await protegerApi\(request, 'equipe'\); if \(s instanceof Response\) return s;/, f);
    assert.match(src, /supabaseConfigurado\(\)/, f);
    assert.match(src, /status: 503|, 503\)/, f);
  }
  assert.match(read('app/api/portal/equipe/[id]/route.ts'), /UUID\.test\(id\)/);
  assert.match(read('app/api/portal/corretores/[id]/route.ts'), /UUID\.test\(id\)/);
});

test('R85 equipe e corretores: as duas páginas chamam exigirEquipe() e são dinâmicas', () => {
  for (const f of ['app/portal/equipe/page.tsx', 'app/portal/corretores/page.tsx']) {
    const src = read(f);
    assert.match(src, /exigirEquipe\(\)/, f);
    assert.match(src, /export const dynamic = 'force-dynamic'/, f);
    assert.match(src, /robots: \{ index: false/, f);
  }
  assert.match(read('app/portal/equipe/page.tsx'), /const sessao = await exigirEquipe\(\);/);
  assert.match(read('app/portal/equipe/page.tsx'), /eu=\{\{ id: sessao\.id \}\}/);
});

test('R85 equipe e corretores: clientes usam as peças do R84 e a mensagem de acesso', () => {
  const equipe = read('app/portal/equipe/EquipeClient.tsx');
  const corretores = read('app/portal/corretores/CorretoresClient.tsx');
  for (const src of [equipe, corretores]) {
    assert.match(src, /CabecalhoPagina/);
    assert.match(src, /credentials: 'same-origin'/);
    assert.match(src, /r84-toast/);
    assert.match(src, /AjudaPagina/);
  }
  assert.match(equipe, /https:\/\/conviterocha\.com\.br\/portal/);
  assert.match(equipe, /Copiar mensagem/);
  assert.match(corretores, /https:\/\/wa\.me\/|linkWhatsapp/);
  assert.match(corretores, /Exportar planilha \(CSV\)/);
  assert.match(corretores, /Carregar mais/);
});
