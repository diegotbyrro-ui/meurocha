import crypto from 'node:crypto';

// R85 - Sessão do portal guardada em cookie httpOnly assinado com HMAC no servidor.
// Dois tipos de pessoa: equipe Rocha (e-mail e senha no Supabase Auth) e corretor (CRECI + UF).
// O conteúdo do cookie é lido só no servidor; o navegador não consegue alterar sem invalidar a assinatura.

const PROD = process.env.NODE_ENV === 'production';
export const PORTAL_COOKIE = PROD ? '__Host-rocha_portal' : 'rocha_portal';
// Corretor: login sem prazo (decisão do cliente). O cookie dura o máximo aceito pelos navegadores
// (400 dias) e é renovado automaticamente a cada uso; o bloqueio pela equipe é conferido no banco.
const DURACAO_MS = { equipe: 12 * 60 * 60 * 1000, corretor: 400 * 24 * 60 * 60 * 1000 } as const;
const VALIDADE_SESSAO_MS = { equipe: DURACAO_MS.equipe, corretor: 100 * 365 * 24 * 60 * 60 * 1000 } as const;
const RENOVAR_CORRETOR_APOS_MS = 7 * 24 * 60 * 60 * 1000;

export type TipoSessao = 'equipe' | 'corretor';
export type SessaoPortal = {
  t: TipoSessao;
  id: string;
  nome: string;
  setor?: string;
  creci?: string;
  uf?: string;
  iat: number;
  exp: number;
};

function segredo(): string {
  const value = process.env.ROCHA_PORTAL_COOKIE_SECRET?.trim() || '';
  if (value.length < 32) throw new Error('ROCHA_PORTAL_COOKIE_SECRET nao configurado.');
  return value;
}

function assinar(payload: string): string {
  return crypto.createHmac('sha256', segredo()).update(payload).digest('hex');
}

/** O portal só abre quando o segredo do cookie e o Supabase estão configurados no servidor. */
export function portalLoginConfigured(): boolean {
  return (process.env.ROCHA_PORTAL_COOKIE_SECRET?.trim().length || 0) >= 32 &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim());
}

export function criarSessao(dados: Omit<SessaoPortal, 'iat' | 'exp'>): string {
  const iat = Date.now();
  const sessao: SessaoPortal = { ...dados, nome: dados.nome.slice(0, 100), iat, exp: iat + VALIDADE_SESSAO_MS[dados.t] };
  const payload = Buffer.from(JSON.stringify(sessao), 'utf8').toString('base64url');
  return `${payload}.${assinar(payload)}`;
}

/** Lê e confere a sessão a partir do cabeçalho Cookie. Retorna null se ausente, adulterada ou vencida. */
export function lerSessao(header: string | null): SessaoPortal | null {
  if (!header) return null;
  const token = header.split(';').map((x) => x.trim()).find((x) => x.startsWith(PORTAL_COOKIE + '='))?.slice(PORTAL_COOKIE.length + 1);
  if (!token || token.length > 2000) return null;
  const m = /^([A-Za-z0-9_-]+)\.([a-f0-9]{64})$/.exec(token);
  if (!m) return null;
  try {
    const esperado = Buffer.from(assinar(m[1]), 'hex');
    const recebido = Buffer.from(m[2], 'hex');
    if (esperado.length !== recebido.length || !crypto.timingSafeEqual(esperado, recebido)) return null;
    const s = JSON.parse(Buffer.from(m[1], 'base64url').toString('utf8')) as SessaoPortal;
    if ((s.t !== 'equipe' && s.t !== 'corretor') || typeof s.id !== 'string' || typeof s.nome !== 'string') return null;
    if (!Number.isFinite(s.exp) || !Number.isFinite(s.iat) || s.iat > Date.now() + 60000 || Date.now() > s.exp) return null;
    return s;
  } catch {
    return null;
  }
}

/** Corretor com login emitido há mais de 7 dias: hora de renovar o cookie (login permanente). */
export function precisaRenovar(sessao: SessaoPortal): boolean {
  return sessao.t === 'corretor' && Date.now() - sessao.iat > RENOVAR_CORRETOR_APOS_MS;
}

export function portalCookieValid(header: string | null): boolean {
  return lerSessao(header) !== null;
}

// sameSite 'lax' para o corretor que abre o portal por um link do WhatsApp já entrar logado.
// Envios de formulário continuam protegidos por originAllowed() em todas as rotas POST.
export function portalCookieOptions(tipo: TipoSessao = 'equipe') {
  return { httpOnly: true, secure: PROD, sameSite: 'lax' as const, path: '/', maxAge: DURACAO_MS[tipo] / 1000 };
}

export function origemPortal(request?: Request): string {
  if (!PROD && request) return new URL(request.url).origin;
  return process.env.ROCHA_PORTAL_ORIGIN?.trim().replace(/\/$/, '') || 'https://conviterocha.com.br';
}

export function originAllowed(request: Request): boolean {
  return request.headers.get('origin') === origemPortal(request);
}

export function ipDaRequisicao(request: Request): string {
  return (request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim().slice(0, 90);
}

// Trava de tentativas em memória (por IP e por tipo de login).
const attempts = new Map<string, { count: number; until: number }>();
export function portalLimit(ip: string, limite = 6, janelaMin = 15): boolean {
  const now = Date.now(), key = ip.slice(0, 120), item = attempts.get(key);
  if (!item || now >= item.until) { attempts.set(key, { count: 1, until: now + janelaMin * 60000 }); return true; }
  if (item.count >= limite) return false;
  item.count += 1; return true;
}
