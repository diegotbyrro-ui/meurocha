import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { normalizarCreci, normalizarUf, normalizarWhatsapp, validarCadastroCorretor, podeAcessar, ROTAS_SO_EQUIPE, formatarCreci, nomeSetor } from '../lib/portal-acesso.mjs';

process.env.ROCHA_PORTAL_COOKIE_SECRET = 'segredo-de-teste-com-mais-de-32-caracteres-123';
const auth = await import('../lib/portal-rocha-auth.ts');
const read = (p) => readFileSync(join(process.cwd(), p), 'utf8');
const cookie = (token) => `outro=1; ${auth.PORTAL_COOKIE}=${token}`;

test('R85: CRECI, UF e WhatsApp normalizados', () => {
  assert.equal(normalizarCreci(' 01.234-f '), '1234F');
  assert.equal(normalizarCreci('12345'), '12345');
  assert.equal(normalizarCreci('12345J'), '12345J');
  assert.equal(normalizarCreci('abc'), '');
  assert.equal(normalizarCreci('12345678'), '');
  assert.equal(normalizarCreci('0000'), '');
  assert.equal(normalizarCreci(123), '');
  assert.equal(normalizarUf('al'), 'AL');
  assert.equal(normalizarUf('XX'), '');
  assert.equal(normalizarWhatsapp('(82) 99999-9999'), '82999999999');
  assert.equal(normalizarWhatsapp('+55 82 3333-4444'), '558233334444');
  assert.equal(normalizarWhatsapp('9999-9999'), '');
  assert.equal(formatarCreci('1234F', 'AL'), 'CRECI 1234-F/AL');
  assert.equal(nomeSetor('marketing'), 'Marketing');
});

test('R85: cadastro do corretor exige nome e WhatsApp, e-mail opcional', () => {
  const ok = validarCadastroCorretor({ creci: '1234', uf: 'AL', nome: '  Ana   Lima ', whatsapp: '(82) 98888-7777', imobiliaria: '', email: '' });
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.valor, { creci: '1234', uf: 'AL', nome: 'Ana Lima', whatsapp: '82988887777', imobiliaria: null, email: null });
  assert.equal(validarCadastroCorretor({ creci: '1234', uf: 'AL', nome: 'An', whatsapp: '82988887777' }).ok, false);
  assert.equal(validarCadastroCorretor({ creci: '1234', uf: 'AL', nome: 'Ana Lima', whatsapp: '123' }).ok, false);
  assert.equal(validarCadastroCorretor({ creci: '1234', uf: 'AL', nome: 'Ana Lima', whatsapp: '82988887777', email: 'x@' }).ok, false);
  assert.equal(validarCadastroCorretor({ creci: '', uf: 'AL', nome: 'Ana Lima', whatsapp: '82988887777' }).ok, false);
});

test('R85: corretor não abre áreas da equipe; equipe abre tudo', () => {
  for (const r of ROTAS_SO_EQUIPE) {
    assert.equal(podeAcessar('corretor', r), false, r);
    assert.equal(podeAcessar('corretor', `${r}/algo?x=1`), false, r);
    assert.equal(podeAcessar('equipe', r), true, r);
  }
  for (const r of ['/portal', '/portal/central', '/portal/central/eco-vitta', '/portal/simulador', '/portal/ajuda']) assert.equal(podeAcessar('corretor', r), true, r);
  assert.equal(podeAcessar('corretor', '/portal/tarefasx'), true);
  assert.equal(podeAcessar(null, '/portal'), false);
  assert.ok(ROTAS_SO_EQUIPE.includes('/portal/tarefas'));
});

test('R85: sessão assinada, com tipo, e recusada se adulterada ou vencida', () => {
  const t = auth.criarSessao({ t: 'corretor', id: 'c1', nome: 'Ana Lima', creci: '1234', uf: 'AL' });
  const s = auth.lerSessao(cookie(t));
  assert.equal(s.t, 'corretor');
  assert.equal(s.creci, '1234');
  assert.equal(auth.portalCookieValid(cookie(t)), true);
  const [payload, assinatura] = t.split('.');
  const falso = Buffer.from(JSON.stringify({ ...s, t: 'equipe' })).toString('base64url');
  assert.equal(auth.lerSessao(cookie(`${falso}.${assinatura}`)), null, 'trocar corretor por equipe invalida a assinatura');
  assert.equal(auth.lerSessao(cookie(`${payload}.${'0'.repeat(64)}`)), null);
  assert.equal(auth.lerSessao(cookie('lixo')), null);
  assert.equal(auth.lerSessao(null), null);
  const vencido = Buffer.from(JSON.stringify({ ...s, exp: Date.now() - 1 })).toString('base64url');
  const crypto = await_import_crypto();
  const sig = crypto.createHmac('sha256', process.env.ROCHA_PORTAL_COOKIE_SECRET).update(vencido).digest('hex');
  assert.equal(auth.lerSessao(cookie(`${vencido}.${sig}`)), null, 'sessão vencida');
  assert.equal(auth.portalCookieOptions('corretor').maxAge, 400 * 24 * 3600, 'login do corretor sem prazo (renovado a cada uso)');
  const longa = auth.lerSessao(cookie(auth.criarSessao({ t: 'corretor', id: 'c2', nome: 'Ana' })));
  assert.ok(longa.exp - longa.iat > 50 * 365 * 24 * 3600 * 1000, 'sessão do corretor não vence');
  assert.equal(auth.precisaRenovar(longa), false);
  assert.equal(auth.precisaRenovar({ ...longa, iat: Date.now() - 8 * 24 * 3600 * 1000 }), true);
  assert.equal(auth.portalCookieOptions('equipe').httpOnly, true);
});

import * as nodeCrypto from 'node:crypto';
function await_import_crypto() { return nodeCrypto; }

test('R85: limite de tentativas por chave', () => {
  const ip = `teste-${Math.random()}`;
  for (let i = 0; i < 3; i++) assert.equal(auth.portalLimit(ip, 3), true);
  assert.equal(auth.portalLimit(ip, 3), false);
});

test('R85: rotas de entrada protegidas e banco sem acesso público', () => {
  const login = read('app/api/portal/login/route.ts');
  const corretor = read('app/api/portal/corretor/route.ts');
  for (const r of [login, corretor]) {
    assert.match(r, /originAllowed\(request\)/);
    assert.match(r, /portalLimit\(/);
    assert.match(r, /portalCookieOptions\('(equipe|corretor)'\)/);
  }
  assert.match(login, /signInWithPassword/);
  assert.match(login, /ativo/);
  assert.match(corretor, /status !== 'ativo'/);
  const sql = read('database/portal-supabase.sql');
  for (const t of ['portal_equipe', 'portal_corretores', 'portal_tarefas_colunas', 'portal_tarefas', 'portal_conteudo', 'portal_acessos']) {
    assert.match(sql, new RegExp(`alter table public\\.${t} enable row level security`), t);
  }
  assert.match(sql, /from anon, authenticated/);
  assert.doesNotMatch(sql, /create policy/i, 'nenhuma política pública');
  assert.doesNotMatch(sql, /salao_(leads|brokerages)/, 'não toca no sistema de convites');
  const supa = read('lib/portal-supabase.ts');
  assert.match(supa, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(supa, /NEXT_PUBLIC_SUPABASE_SERVICE/);
});

test('R85: páginas da equipe barram corretor no servidor', () => {
  for (const p of ['tarefas', 'atualizar', 'biblioteca', 'gestao', 'equipe', 'corretores']) {
    const f = `app/portal/${p}/page.tsx`;
    assert.ok(existsSync(f), f);
    assert.match(read(f), /await exigirEquipe\(\)/, f);
  }
  const layout = read('app/portal/layout.tsx');
  assert.match(layout, /equipe \? <>/);
  const guard = read('lib/portal-guard.ts');
  assert.match(guard, /sessao\.t !== 'equipe'/);
  assert.match(guard, /pessoaAtiva\(sessao\.t, sessao\.id\)/, 'bloqueio/desativação vale na hora nas APIs');
  assert.match(layout, /pessoaAtiva\(sessao\.t, sessao\.id\)/, 'e nas páginas');
});
