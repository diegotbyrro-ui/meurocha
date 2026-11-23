// R85 - Equipe Rocha: quem entra no portal com e-mail e senha (Supabase Auth + tabela portal_equipe).
// Funções puras: recebem o cliente `db` como 1º parâmetro e nunca lançam para quem chama.
// Retornam { ok: true, ... } ou { ok: false, erro, status }.
import { SETORES } from './portal-acesso.mjs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const COLUNAS = 'id, nome, email, setor, ativo, criado_em';
const MENSAGEM_ERRO = 'Não foi possível concluir agora. Tente de novo em instantes.';

const falha = (erro, status = 400) => ({ ok: false, erro, status });

/** @param {unknown} v @param {number} max */
function texto(v, max) {
  return typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '';
}

/** Senha da equipe: 10 a 72 caracteres, com pelo menos uma letra e um número. Retorna mensagem ou null. */
export function erroSenha(senha) {
  if (typeof senha !== 'string' || senha.length < 10) return 'A senha precisa ter pelo menos 10 caracteres.';
  if (senha.length > 72) return 'A senha pode ter no máximo 72 caracteres.';
  if (!/\p{L}/u.test(senha) || !/[0-9]/.test(senha)) return 'A senha precisa ter pelo menos uma letra e um número.';
  return null;
}

/** Dados de uma pessoa da equipe (nome 2 a 80, e-mail válido, setor da lista). */
export function validarPessoa({ nome, email, setor } = {}) {
  const n = texto(nome, 80);
  const e = texto(email, 120).toLowerCase();
  if (n.length < 2) return { ok: false, erro: 'Informe o nome (de 2 a 80 letras).' };
  if (!EMAIL.test(e)) return { ok: false, erro: 'Informe um e-mail válido, por exemplo nome@rocha.com.br.' };
  if (!SETORES.some((s) => s.id === setor)) return { ok: false, erro: 'Escolha o setor da pessoa.' };
  return { ok: true, valor: { nome: n, email: e, setor } };
}

/** Lista a equipe em ordem de nome. */
export async function listarEquipe(db) {
  try {
    const { data, error } = await db.from('portal_equipe').select(COLUNAS).order('nome', { ascending: true });
    if (error) return falha(MENSAGEM_ERRO, 500);
    return { ok: true, equipe: data || [] };
  } catch {
    return falha(MENSAGEM_ERRO, 500);
  }
}

/** Cria o login (e-mail e senha já confirmados) e a linha em portal_equipe. Se a linha falhar, desfaz o login. */
export async function adicionarPessoa(db, dados = {}) {
  try {
    const v = validarPessoa(dados);
    if (!v.ok) return falha(v.erro);
    const erro = erroSenha(dados.senha);
    if (erro) return falha(erro);

    const { data, error } = await db.auth.admin.createUser({ email: v.valor.email, password: dados.senha, email_confirm: true });
    if (error) {
      if (String(error.message || '').toLowerCase().includes('already')) return falha('Já existe um login com este e-mail.', 409);
      return falha(MENSAGEM_ERRO, 500);
    }
    const id = data?.user?.id;
    if (!id) return falha(MENSAGEM_ERRO, 500);

    const { data: pessoa, error: erroLinha } = await db
      .from('portal_equipe')
      .insert({ id, ...v.valor, ativo: true })
      .select(COLUNAS)
      .single();
    if (erroLinha || !pessoa) {
      await db.auth.admin.deleteUser(id);
      if (erroLinha?.code === '23505') return falha('Já existe uma pessoa cadastrada com este e-mail.', 409);
      return falha(MENSAGEM_ERRO, 500);
    }
    return { ok: true, pessoa };
  } catch {
    return falha(MENSAGEM_ERRO, 500);
  }
}

/**
 * Altera nome, setor ou ativo. Ninguém desativa o próprio acesso e a equipe nunca fica sem pessoa ativa.
 * @param {{ id: string }} eu  quem está fazendo a alteração (sessão)
 */
export async function editarPessoa(db, eu, id, dados = {}) {
  try {
    if (typeof id !== 'string' || !UUID.test(id)) return falha('Pessoa não encontrada.', 404);
    const patch = {};
    if (dados.nome !== undefined) {
      const nome = texto(dados.nome, 80);
      if (nome.length < 2) return falha('Informe o nome (de 2 a 80 letras).');
      patch.nome = nome;
    }
    if (dados.setor !== undefined) {
      if (!SETORES.some((s) => s.id === dados.setor)) return falha('Escolha o setor da pessoa.');
      patch.setor = dados.setor;
    }
    if (dados.ativo !== undefined) {
      if (typeof dados.ativo !== 'boolean') return falha('Situação inválida.');
      patch.ativo = dados.ativo;
    }
    if (Object.keys(patch).length === 0) return falha('Nada para alterar.');

    if (patch.ativo === false && eu?.id === id) return falha('Você não pode desativar o seu próprio acesso.');

    const { data: atual, error: erroBusca } = await db.from('portal_equipe').select(COLUNAS).eq('id', id).maybeSingle();
    if (erroBusca) return falha(MENSAGEM_ERRO, 500);
    if (!atual) return falha('Pessoa não encontrada.', 404);

    if (patch.ativo === false && atual.ativo) {
      const { data: outras, error: erroOutras } = await db.from('portal_equipe').select('id').eq('ativo', true).neq('id', id);
      if (erroOutras) return falha(MENSAGEM_ERRO, 500);
      if ((outras || []).length === 0) return falha('A equipe precisa ter pelo menos uma pessoa ativa.', 409);
    }

    const { data, error } = await db.from('portal_equipe').update(patch).eq('id', id).select(COLUNAS).maybeSingle();
    if (error) return falha(MENSAGEM_ERRO, 500);
    if (!data) return falha('Pessoa não encontrada.', 404);
    return { ok: true, pessoa: data };
  } catch {
    return falha(MENSAGEM_ERRO, 500);
  }
}

/** Troca a senha de login de uma pessoa da equipe. */
export async function trocarSenha(db, id, senha) {
  try {
    if (typeof id !== 'string' || !UUID.test(id)) return falha('Pessoa não encontrada.', 404);
    const erro = erroSenha(senha);
    if (erro) return falha(erro);
    const { error } = await db.auth.admin.updateUserById(id, { password: senha });
    if (error) {
      if (String(error.message || '').toLowerCase().includes('not found')) return falha('Pessoa não encontrada.', 404);
      return falha(MENSAGEM_ERRO, 500);
    }
    return { ok: true };
  } catch {
    return falha(MENSAGEM_ERRO, 500);
  }
}
