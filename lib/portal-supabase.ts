import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// R85 - Acesso ao Supabase SOMENTE no servidor (rotas de API e páginas do servidor).
// A chave service_role fica nas variáveis de ambiente da hospedagem e nunca vai para o navegador.
// As tabelas portal_* têm RLS ligado e nenhuma política pública (ver database/portal-supabase.sql).

const opcoes = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

export function supabaseConfigurado(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim());
}

/** Cliente com poderes de administrador. Usar só depois de conferir a sessão e a permissão. */
export function supabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !chave) throw new Error('Supabase nao configurado no servidor.');
  return createClient(url, chave, opcoes);
}

/** Cliente público, usado só para conferir e-mail e senha da equipe. */
export function supabaseLogin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !chave) throw new Error('Supabase nao configurado no servidor.');
  return createClient(url, chave, opcoes);
}
