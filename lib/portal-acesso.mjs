// R85 - Regras de acesso do Portal Rocha (funções puras, testáveis sem banco).
// Dois tipos de pessoa:
//  - equipe: diretoria, marketing e equipe Rocha (login com e-mail e senha);
//  - corretor: entra só com CRECI + UF (cadastro no primeiro acesso, sem senha).

export const SETORES = Object.freeze([
  { id: 'diretoria', nome: 'Diretoria' },
  { id: 'marketing', nome: 'Marketing' },
  { id: 'equipe', nome: 'Equipe Rocha' },
]);

export const UFS = Object.freeze(['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']);

// Áreas que só a equipe Rocha pode abrir. Corretores não veem nem acessam.
export const ROTAS_SO_EQUIPE = Object.freeze([
  '/portal/tarefas',
  '/portal/atualizar',
  '/portal/biblioteca',
  '/portal/gestao',
  '/portal/equipe',
  '/portal/corretores',
]);

/** @param {unknown} v @param {number} max */
function texto(v, max) {
  return typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, max) : '';
}

/**
 * Normaliza o número do CRECI: só dígitos, sem zeros à esquerda, com sufixo F ou J opcional.
 * Ex.: ' 01.234-f ' -> '1234F'. Retorna '' quando inválido.
 * @param {unknown} valor
 * @returns {string}
 */
export function normalizarCreci(valor) {
  if (typeof valor !== 'string') return '';
  const limpo = valor.toUpperCase().replace(/[^0-9FJ]/g, '');
  const m = /^0*([1-9][0-9]{0,6})([FJ]?)$/.exec(limpo);
  if (!m) return '';
  return `${m[1]}${m[2]}`;
}

/** @param {unknown} valor @returns {string} */
export function normalizarUf(valor) {
  const uf = typeof valor === 'string' ? valor.trim().toUpperCase() : '';
  return UFS.includes(uf) ? uf : '';
}

/**
 * WhatsApp com DDD (10 ou 11 dígitos) ou com 55 na frente (12 ou 13). Retorna só dígitos ou ''.
 * @param {unknown} valor
 * @returns {string}
 */
export function normalizarWhatsapp(valor) {
  const d = typeof valor === 'string' ? valor.replace(/\D/g, '') : '';
  return /^(55)?[1-9][0-9]{9,10}$/.test(d) ? d : '';
}

/**
 * Valida os dados do primeiro acesso do corretor.
 * @param {{creci?: unknown, uf?: unknown, nome?: unknown, whatsapp?: unknown, imobiliaria?: unknown, email?: unknown}} dados
 * @returns {{ ok: true, valor: { creci: string, uf: string, nome: string, whatsapp: string, imobiliaria: string | null, email: string | null } } | { ok: false, erro: string }}
 */
export function validarCadastroCorretor(dados) {
  const creci = normalizarCreci(dados?.creci);
  const uf = normalizarUf(dados?.uf);
  const nome = texto(dados?.nome, 100);
  const whatsapp = normalizarWhatsapp(dados?.whatsapp);
  const imobiliaria = texto(dados?.imobiliaria, 100);
  const email = texto(dados?.email, 120).toLowerCase();
  if (!creci) return { ok: false, erro: 'Informe o número do CRECI (só números, com F ou J no final se houver).' };
  if (!uf) return { ok: false, erro: 'Escolha a UF do seu CRECI.' };
  if (nome.length < 3) return { ok: false, erro: 'Informe seu nome completo.' };
  if (!whatsapp) return { ok: false, erro: 'Informe o WhatsApp com DDD, por exemplo (82) 99999-9999.' };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, erro: 'O e-mail parece incompleto. Confira ou deixe em branco.' };
  return { ok: true, valor: { creci, uf, nome, whatsapp, imobiliaria: imobiliaria || null, email: email || null } };
}

/**
 * Diz se um tipo de pessoa pode abrir um caminho do portal.
 * @param {'equipe' | 'corretor' | null | undefined} tipo
 * @param {string} caminho
 * @returns {boolean}
 */
export function podeAcessar(tipo, caminho) {
  if (tipo === 'equipe') return true;
  if (tipo !== 'corretor') return false;
  const c = typeof caminho === 'string' ? caminho.split('?')[0].replace(/\/+$/, '') : '';
  return !ROTAS_SO_EQUIPE.some((r) => c === r || c.startsWith(`${r}/`));
}

/** @param {unknown} setor @returns {string} */
export function nomeSetor(setor) {
  return SETORES.find((s) => s.id === setor)?.nome || 'Equipe Rocha';
}

/** Formata o CRECI para exibir: '1234F' + 'AL' -> 'CRECI 1234-F/AL'. */
export function formatarCreci(creci, uf) {
  const c = normalizarCreci(creci);
  if (!c) return '';
  const m = /^([0-9]+)([FJ]?)$/.exec(c);
  return `CRECI ${m?.[1] || c}${m?.[2] ? `-${m[2]}` : ''}${uf ? `/${uf}` : ''}`;
}
