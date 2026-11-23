import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { criarFakeSupabase } from './helpers/fake-supabase.mjs';
import {
  CORES_COLUNA, MAX_COLUNAS, carregarQuadro, criarColuna, editarColuna, reordenarColunas, excluirColuna,
  criarTarefa, editarTarefa, moverTarefa, excluirTarefa, lerCorpoJson, ehUuid,
} from '../lib/portal-tarefas-repo.mjs';

const ler = (p) => readFileSync(fileURLToPath(new URL(`../${p}`, import.meta.url)), 'utf8');
const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const MSG_RESPONSAVEL = 'Só é possível atribuir para alguém ativo da equipe Rocha.';

const E1 = uuid(101); // ativo (diretoria)
const E2 = uuid(102); // ativo (equipe)
const E3 = uuid(103); // inativo, com tarefa atribuída
const E4 = uuid(104); // inativo, sem tarefas
const SESSAO = E1;
const C1 = uuid(1), C2 = uuid(2), C3 = uuid(3), C4 = uuid(4);

function banco() {
  return criarFakeSupabase({
    portal_tarefas_colunas: [
      { id: C1, nome: 'A fazer', cor: '#45474c', ordem: 1, conta_como_concluida: false, criado_em: '2026-01-01T00:00:00Z' },
      { id: C2, nome: 'Em andamento', cor: '#1f5fae', ordem: 2, conta_como_concluida: false, criado_em: '2026-01-02T00:00:00Z' },
      { id: C3, nome: 'Em revisão', cor: '#6b3fb8', ordem: 3, conta_como_concluida: false, criado_em: '2026-01-03T00:00:00Z' },
      { id: C4, nome: 'Concluído', cor: '#1b7a4a', ordem: 4, conta_como_concluida: true, criado_em: '2026-01-04T00:00:00Z' },
    ],
    portal_equipe: [
      { id: E1, nome: 'Diego Taketomi', setor: 'diretoria', ativo: true, email: 'a@x.com' },
      { id: E2, nome: 'Ana Lima', setor: 'equipe', ativo: true, email: 'b@x.com' },
      { id: E3, nome: 'Bruno Ex', setor: 'equipe', ativo: false, email: 'c@x.com' },
      { id: E4, nome: 'Carla Antiga', setor: 'equipe', ativo: false, email: 'd@x.com' },
    ],
    portal_tarefas: [
      { id: uuid(201), titulo: 'Revisar book', descricao: '', empreendimento: 'Eco Vittá', prazo: '2026-11-20', coluna_id: C1, ordem: 1, prioridade: 'alta', responsavel_id: E2, criado_por: E1, criado_em: '2026-02-01T00:00:00Z', atualizado_em: '2026-02-01T00:00:00Z' },
      { id: uuid(202), titulo: 'Fechar proposta', descricao: 'Ver com o corretor', empreendimento: '', prazo: null, coluna_id: C2, ordem: 1, prioridade: 'media', responsavel_id: E3, criado_por: E1, criado_em: '2026-02-02T00:00:00Z', atualizado_em: '2026-02-02T00:00:00Z' },
      { id: uuid(203), titulo: 'Publicar post', descricao: '', empreendimento: 'Maceió Vista', prazo: '2026-11-01', coluna_id: C2, ordem: 2, prioridade: 'baixa', responsavel_id: null, criado_por: E1, criado_em: '2026-02-03T00:00:00Z', atualizado_em: '2026-02-03T00:00:00Z' },
      { id: uuid(204), titulo: 'Entregar contrato', descricao: '', empreendimento: '', prazo: null, coluna_id: C4, ordem: 1, prioridade: 'media', responsavel_id: E1, criado_por: E1, criado_em: '2026-02-04T00:00:00Z', atualizado_em: '2026-02-04T00:00:00Z' },
    ],
  });
}
const colunasDo = (db) => db.tabelas.portal_tarefas_colunas;
const tarefasDo = (db) => db.tabelas.portal_tarefas;
const idsColunas = (db) => colunasDo(db).map((c) => c.id);

// ---------- quadro ----------
test('R85 repo: carregarQuadro devolve colunas em ordem, tarefas e só a equipe ativa', async () => {
  const db = banco();
  const r = await carregarQuadro(db);
  assert.equal(r.ok, true);
  assert.deepEqual(r.colunas.map((c) => c.nome), ['A fazer', 'Em andamento', 'Em revisão', 'Concluído']);
  assert.equal(r.colunas[3].conta_como_concluida, true);
  assert.equal(r.tarefas.length, 4);
  assert.deepEqual(r.equipe.map((p) => p.id).sort(), [E1, E2].sort());
  assert.ok(r.equipe.every((p) => !('email' in p)), 'e-mail da equipe não vai para o navegador');
  // Inativo que ainda é responsável aparece só em "inativos" (para mostrar o nome no cartão)
  assert.deepEqual(r.inativos, [{ id: E3, nome: 'Bruno Ex' }]);
});

test('R85 repo: carregarQuadro nunca lança e devolve erro 500 quando o banco falha', async () => {
  const quebrado = { from() { throw new Error('rede caiu'); } };
  const r = await carregarQuadro(quebrado);
  assert.equal(r.ok, false);
  assert.equal(r.status, 500);
  assert.match(r.erro, /carregar o quadro/);
});

// ---------- colunas ----------
test('R85 repo: criarColuna usa a próxima ordem e cor padrão', async () => {
  const db = banco();
  const r = await criarColuna(db, { nome: '  Aguardando cliente  ' });
  assert.equal(r.ok, true);
  assert.equal(r.coluna.nome, 'Aguardando cliente');
  assert.equal(r.coluna.ordem, 5);
  assert.equal(r.coluna.cor, '#45474c');
  assert.equal(r.coluna.conta_como_concluida, false);
});

test('R85 repo: criarColuna valida nome e cor', async () => {
  const db = banco();
  assert.equal((await criarColuna(db, { nome: '   ' })).ok, false);
  assert.equal((await criarColuna(db, { nome: 'x'.repeat(41) })).ok, false);
  const cor = await criarColuna(db, { nome: 'Teste', cor: 'vermelho' });
  assert.equal(cor.ok, false);
  assert.equal(cor.status, 400);
  assert.equal(colunasDo(db).length, 4);
});

test('R85 repo: a 13a coluna é recusada (máximo de 12)', async () => {
  const db = banco();
  for (let i = 5; i <= MAX_COLUNAS; i++) {
    const r = await criarColuna(db, { nome: `Coluna ${i}`, cor: CORES_COLUNA[i % CORES_COLUNA.length] });
    assert.equal(r.ok, true, `coluna ${i} deveria ser criada`);
  }
  assert.equal(colunasDo(db).length, 12);
  const treze = await criarColuna(db, { nome: 'Coluna 13' });
  assert.equal(treze.ok, false);
  assert.match(treze.erro, /12 colunas/);
  assert.equal(colunasDo(db).length, 12);
});

test('R85 repo: editarColuna renomeia, recolore e marca conta como concluída', async () => {
  const db = banco();
  const r = await editarColuna(db, C2, { nome: 'Fazendo', cor: '#0E7C78', conta_como_concluida: true });
  assert.equal(r.ok, true);
  assert.equal(r.coluna.nome, 'Fazendo');
  assert.equal(r.coluna.cor, '#0e7c78');
  assert.equal(r.coluna.conta_como_concluida, true);
});

test('R85 repo: editarColuna recusa campos inválidos, nada a mudar e coluna inexistente', async () => {
  const db = banco();
  assert.equal((await editarColuna(db, C1, { nome: '' })).ok, false);
  assert.equal((await editarColuna(db, C1, { cor: '#fff' })).ok, false);
  assert.equal((await editarColuna(db, C1, { conta_como_concluida: 'sim' })).ok, false);
  assert.equal((await editarColuna(db, C1, {})).ok, false);
  const inexistente = await editarColuna(db, uuid(999), { nome: 'Nova' });
  assert.equal(inexistente.ok, false);
  assert.equal(inexistente.status, 404);
  assert.equal((await editarColuna(db, 'nao-e-uuid', { nome: 'Nova' })).status, 404);
});

test('R85 repo: reordenarColunas aplica a nova ordem e recusa ids errados', async () => {
  const db = banco();
  const ok = await reordenarColunas(db, [C4, C3, C2, C1]);
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.colunas.map((c) => c.id), [C4, C3, C2, C1]);
  assert.deepEqual(colunasDo(db).map((c) => c.ordem).sort(), [1, 2, 3, 4]);

  const faltando = await reordenarColunas(db, [C1, C2, C3]);
  assert.equal(faltando.ok, false);
  const repetido = await reordenarColunas(db, [C1, C1, C2, C3]);
  assert.equal(repetido.ok, false);
  const desconhecido = await reordenarColunas(db, [C1, C2, C3, uuid(777)]);
  assert.equal(desconhecido.ok, false);
  const nada = await reordenarColunas(db, 'C1,C2');
  assert.equal(nada.ok, false);
});

test('R85 repo: não exclui a última coluna do quadro', async () => {
  const db = criarFakeSupabase({
    portal_tarefas_colunas: [{ id: C1, nome: 'Única', cor: '#45474c', ordem: 1, conta_como_concluida: false }],
    portal_tarefas: [],
  });
  const r = await excluirColuna(db, C1);
  assert.equal(r.ok, false);
  assert.match(r.erro, /última coluna/);
  assert.equal(colunasDo(db).length, 1);
});

test('R85 repo: excluir coluna com tarefas exige moverPara e move as tarefas para o fim do destino', async () => {
  const db = banco();
  const semDestino = await excluirColuna(db, C2);
  assert.equal(semDestino.ok, false);
  assert.match(semDestino.erro, /mover as tarefas/);
  assert.equal(colunasDo(db).some((c) => c.id === C2), true, 'coluna não foi apagada');

  const mesmoDestino = await excluirColuna(db, C2, C2);
  assert.equal(mesmoDestino.ok, false);
  const destinoInvalido = await excluirColuna(db, C2, uuid(888));
  assert.equal(destinoInvalido.ok, false);

  // C4 já tem uma tarefa com ordem 1: as duas tarefas de C2 entram depois dela
  const r = await excluirColuna(db, C2, C4);
  assert.equal(r.ok, true);
  assert.equal(r.tarefasMovidas, 2);
  assert.equal(colunasDo(db).some((c) => c.id === C2), false);
  const movidas = tarefasDo(db).filter((t) => t.coluna_id === C4).map((t) => t.ordem).sort((a, b) => a - b);
  assert.deepEqual(movidas, [1, 2, 3]);
  assert.equal(tarefasDo(db).filter((t) => t.coluna_id === C2).length, 0);
});

test('R85 repo: excluir coluna vazia não pede destino', async () => {
  const db = banco();
  const r = await excluirColuna(db, C3);
  assert.equal(r.ok, true);
  assert.equal(r.tarefasMovidas, 0);
  assert.equal(colunasDo(db).length, 3);
});

// ---------- tarefas ----------
test('R85 repo: criarTarefa cria no fim da coluna, com criado_por da sessão e padrões', async () => {
  const db = banco();
  const r = await criarTarefa(db, SESSAO, { titulo: 'Montar apresentação', coluna_id: C1 });
  assert.equal(r.ok, true);
  assert.equal(r.tarefa.titulo, 'Montar apresentação');
  assert.equal(r.tarefa.prioridade, 'media');
  assert.equal(r.tarefa.prazo, '', 'sem prazo volta como texto vazio');
  assert.equal(r.tarefa.responsavel_id, null);
  assert.equal(r.tarefa.criado_por, SESSAO);
  assert.equal(r.tarefa.ordem, 2);
});

test('R85 repo: criarTarefa atribui a pessoa ativa da equipe', async () => {
  const db = banco();
  const r = await criarTarefa(db, SESSAO, { titulo: 'Conferir CNPJ', coluna_id: C1, responsavel_id: E2, prazo: '2026-12-10', prioridade: 'alta', empreendimento: 'Eco Vittá' });
  assert.equal(r.ok, true);
  assert.equal(r.tarefa.responsavel_id, E2);
  assert.equal(r.tarefa.prazo, '2026-12-10');
});

test('R85 repo: criarTarefa recusa atribuir a quem está inativo, desconhecido ou fora da equipe', async () => {
  const db = banco();
  for (const responsavel of [E3, E4, uuid(555)]) {
    const r = await criarTarefa(db, SESSAO, { titulo: 'Tarefa teste', coluna_id: C1, responsavel_id: responsavel });
    assert.equal(r.ok, false, `não deveria atribuir a ${responsavel}`);
    assert.equal(r.erro, MSG_RESPONSAVEL);
  }
  assert.equal(tarefasDo(db).length, 4);
});

test('R85 repo: criarTarefa valida título, descrição, empreendimento, prazo, prioridade e coluna', async () => {
  const db = banco();
  const base = { titulo: 'Tarefa válida', coluna_id: C1 };
  assert.equal((await criarTarefa(db, SESSAO, { ...base, titulo: 'ab' })).ok, false);
  assert.equal((await criarTarefa(db, SESSAO, { ...base, titulo: 'x'.repeat(121) })).ok, false);
  assert.equal((await criarTarefa(db, SESSAO, { ...base, descricao: 'x'.repeat(1001) })).ok, false);
  assert.equal((await criarTarefa(db, SESSAO, { ...base, empreendimento: 'x'.repeat(81) })).ok, false);
  assert.equal((await criarTarefa(db, SESSAO, { ...base, prioridade: 'urgente' })).ok, false);
  assert.equal((await criarTarefa(db, SESSAO, { ...base, coluna_id: uuid(999) })).ok, false);
  assert.equal((await criarTarefa(db, SESSAO, { titulo: 'Sem coluna' })).ok, false);
  assert.equal((await criarTarefa(db, SESSAO, { ...base, responsavel_id: 'abc' })).ok, false);
  assert.equal(tarefasDo(db).length, 4);
});

test('R85 repo: data de prazo inválida é recusada; vazia vira sem prazo', async () => {
  const db = banco();
  for (const prazo of ['2026-02-29', '2026-13-01', '2026-11-99', '23/11/2026', 20261123]) {
    const r = await criarTarefa(db, SESSAO, { titulo: 'Prazo ruim', coluna_id: C1, prazo });
    assert.equal(r.ok, false, `prazo ${prazo} deveria ser recusado`);
  }
  const semPrazo = await criarTarefa(db, SESSAO, { titulo: 'Sem prazo', coluna_id: C1, prazo: '' });
  assert.equal(semPrazo.ok, true);
  assert.equal(semPrazo.tarefa.prazo, '');
  const bissexto = await criarTarefa(db, SESSAO, { titulo: 'Bissexto', coluna_id: C1, prazo: '2028-02-29' });
  assert.equal(bissexto.ok, true);
});

test('R85 repo: editarTarefa altera só os campos enviados e ignora campos fora da lista', async () => {
  const db = banco();
  const id = uuid(201);
  const r = await editarTarefa(db, id, { titulo: 'Revisar book final', prioridade: 'baixa', criado_por: E3, id: uuid(999) });
  assert.equal(r.ok, true);
  assert.equal(r.tarefa.titulo, 'Revisar book final');
  assert.equal(r.tarefa.prioridade, 'baixa');
  assert.equal(r.tarefa.criado_por, E1, 'criado_por não muda por edição');
  assert.equal(r.tarefa.id, id);
  assert.equal(r.tarefa.responsavel_id, E2, 'responsável mantido quando não enviado');
});

test('R85 repo: editarTarefa recusa corpo vazio, tarefa inexistente e campos inválidos', async () => {
  const db = banco();
  assert.equal((await editarTarefa(db, uuid(201), {})).ok, false);
  const nao = await editarTarefa(db, uuid(999), { titulo: 'Nova' });
  assert.equal(nao.ok, false);
  assert.equal(nao.status, 404);
  assert.equal((await editarTarefa(db, uuid(201), { titulo: 'x' })).ok, false);
  assert.equal((await editarTarefa(db, uuid(201), { prazo: '2026-04-31' })).ok, false);
});

test('R85 repo: editarTarefa atribui e tira responsável; mantém quem saiu da equipe sem mudança', async () => {
  const db = banco();
  // Tarefa 202 já está com E3 (inativo). Mudar só o título não deve barrar.
  const titulo = await editarTarefa(db, uuid(202), { titulo: 'Fechar proposta com o cliente' });
  assert.equal(titulo.ok, true);
  assert.equal(titulo.tarefa.responsavel_id, E3);
  // Trocar para outra pessoa inativa é recusado
  assert.equal((await editarTarefa(db, uuid(202), { responsavel_id: E4 })).erro, MSG_RESPONSAVEL);
  // Atribuir a ativa funciona, e null tira o responsável
  assert.equal((await editarTarefa(db, uuid(202), { responsavel_id: E1 })).tarefa.responsavel_id, E1);
  assert.equal((await editarTarefa(db, uuid(202), { responsavel_id: null })).tarefa.responsavel_id, null);
  assert.equal((await editarTarefa(db, uuid(202), { responsavel_id: uuid(555) })).ok, false);
});

test('R85 repo: moverTarefa troca de coluna e vai para o fim quando não há ordem', async () => {
  const db = banco();
  const r = await moverTarefa(db, uuid(201), C3);
  assert.equal(r.ok, true);
  assert.equal(r.tarefa.coluna_id, C3);
  assert.equal(r.tarefa.ordem, 1);
  const outra = await moverTarefa(db, uuid(204), C2, 7);
  assert.equal(outra.tarefa.ordem, 7);
  const destinoInvalido = await moverTarefa(db, uuid(201), uuid(888));
  assert.equal(destinoInvalido.ok, false);
});

test('R85 repo: excluirTarefa apaga a tarefa e recusa a que não existe', async () => {
  const db = banco();
  assert.equal((await excluirTarefa(db, uuid(201))).ok, true);
  assert.equal(tarefasDo(db).some((t) => t.id === uuid(201)), false);
  const de_novo = await excluirTarefa(db, uuid(201));
  assert.equal(de_novo.ok, false);
  assert.equal(de_novo.status, 404);
  assert.equal((await excluirTarefa(db, 'x')).status, 404);
});

// ---------- corpo, ids e constantes ----------
test('R85 repo: lerCorpoJson aceita objeto JSON e recusa corpo grande, inválido ou que não é objeto', async () => {
  const pedido = (texto, cabecalho = null) => ({
    headers: { get: (n) => (n.toLowerCase() === 'content-length' ? cabecalho : null) },
    text: async () => texto,
  });
  assert.deepEqual((await lerCorpoJson(pedido('{"titulo":"Oi"}'))).valor, { titulo: 'Oi' });
  assert.deepEqual((await lerCorpoJson(pedido(''))).valor, {});
  assert.equal((await lerCorpoJson(pedido('{"a":"' + 'x'.repeat(21000) + '"}'))).status, 413);
  assert.equal((await lerCorpoJson(pedido('x'.repeat(10), '99999'))).status, 413);
  assert.equal((await lerCorpoJson(pedido('{nao json'))).ok, false);
  assert.equal((await lerCorpoJson(pedido('[1,2]'))).ok, false);
  assert.equal((await lerCorpoJson(pedido('"texto"'))).ok, false);
});

test('R85 repo: ehUuid e cores disponíveis', () => {
  assert.equal(ehUuid(C1), true);
  assert.equal(ehUuid('C1'), false);
  assert.equal(ehUuid(null), false);
  assert.equal(CORES_COLUNA.length, 8);
  assert.deepEqual(CORES_COLUNA, ['#45474c', '#1f5fae', '#6b3fb8', '#1b7a4a', '#b45309', '#a51c2c', '#0e7c78', '#3f5468']);
  for (const cor of CORES_COLUNA) assert.match(cor, /^#[0-9a-f]{6}$/);
});

// ---------- estáticos: acesso e cliente ----------
const ROTAS = [
  'app/api/portal/tarefas/route.ts',
  'app/api/portal/tarefas/[id]/route.ts',
  'app/api/portal/tarefas/colunas/route.ts',
  'app/api/portal/tarefas/colunas/[id]/route.ts',
  'app/api/portal/tarefas/colunas/ordem/route.ts',
];

test('R85 estático: toda rota de tarefas exige a equipe com protegerApi', () => {
  for (const arquivo of ROTAS) {
    const fonte = ler(arquivo);
    assert.match(fonte, /protegerApi\(request, 'equipe'\)/, `${arquivo} sem protegerApi(request, 'equipe')`);
    assert.match(fonte, /supabaseConfigurado\(\)/, `${arquivo} sem checagem de configuração`);
    assert.doesNotMatch(fonte, /'qualquer'/, `${arquivo} não pode aceitar corretor`);
  }
});

test('R85 estático: o quadro de tarefas não usa localStorage nem chave do servidor', () => {
  const cliente = ler('app/portal/tarefas/TarefasClient.tsx');
  assert.doesNotMatch(cliente, /localStorage/);
  assert.doesNotMatch(cliente, /service_role|SUPABASE_SERVICE_ROLE_KEY|createClient\(/);
  assert.match(cliente, /\/api\/portal\/tarefas/);
  assert.match(cliente, /credentials: 'same-origin'/);
});
