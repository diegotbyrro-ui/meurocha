import crypto from 'node:crypto';

const PROD = process.env.NODE_ENV === 'production';
export const PORTAL_COOKIE = PROD ? '__Host-rocha_portal' : 'rocha_portal';
const DURATION_MS = 3 * 60 * 60 * 1000;

function configuredSecret(): string {
  const value = process.env.ROCHA_PORTAL_COOKIE_SECRET?.trim() || '';
  if (value.length < 32) throw new Error('ROCHA_PORTAL_COOKIE_SECRET nao configurado.');
  return value;
}

export function portalLoginConfigured(): boolean {
  return (process.env.ROCHA_PORTAL_PASSWORD?.trim().length || 0) >= 16 &&
    (process.env.ROCHA_PORTAL_COOKIE_SECRET?.trim().length || 0) >= 32;
}

export function validatePortalPassword(password: string): boolean {
  const expected = process.env.ROCHA_PORTAL_PASSWORD?.trim() || '';
  if (expected.length < 16) return false;
  const a = crypto.createHash('sha256').update(password).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function sig(payload: string): string {
  return crypto.createHmac('sha256', configuredSecret()).update(payload).digest('hex');
}

export function createPortalSession(): string {
  const issued = Date.now();
  const random = crypto.randomBytes(16).toString('hex');
  const payload = `${issued}.${random}`;
  return `${payload}.${sig(payload)}`;
}

export function portalCookieValid(header: string | null): boolean {
  if (!header) return false;
  const token = header.split(';').map(x => x.trim()).find(x => x.startsWith(PORTAL_COOKIE + '='))?.slice(PORTAL_COOKIE.length + 1);
  if (!token) return false;
  const m = /^([0-9]{13})\.([a-f0-9]{32})\.([a-f0-9]{64})$/.exec(token);
  if (!m) return false;
  const issued = Number(m[1]);
  if (!Number.isFinite(issued) || issued > Date.now() + 60000 || Date.now() - issued > DURATION_MS) return false;
  try {
    const expected = Buffer.from(sig(`${m[1]}.${m[2]}`), 'hex');
    const received = Buffer.from(m[3], 'hex');
    return crypto.timingSafeEqual(expected, received);
  } catch { return false; }
}

export function portalCookieOptions() {
  return { httpOnly: true, secure: PROD, sameSite: 'strict' as const, path: '/', maxAge: DURATION_MS / 1000 };
}

export function originAllowed(request: Request): boolean {
  const origin = request.headers.get('origin');
  const expected = PROD ? (process.env.ROCHA_PORTAL_ORIGIN?.trim().replace(/\/$/, '') || 'https://conviterocha.com.br') : new URL(request.url).origin;
  return origin === expected;
}

// Esta trava complementar e em memoria; contas individuais e RLS sao pendencias da proxima etapa.
const attempts = new Map<string, {count: number; until: number}>();
export function portalLimit(ip: string): boolean {
  const now = Date.now(), key = ip.slice(0,90), item = attempts.get(key);
  if (!item || now >= item.until) { attempts.set(key, { count: 1, until: now + 15*60000 }); return true; }
  if (item.count >= 6) return false;
  item.count += 1; return true;
}
