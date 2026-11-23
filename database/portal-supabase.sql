-- =====================================================================
-- PORTAL COMERCIAL ROCHA - tabelas no Supabase (projeto Convite Rocha)
-- Como usar: Supabase > SQL Editor > New query > cole TUDO > Run.
-- Pode rodar mais de uma vez: só cria o que ainda não existe.
-- NÃO altera as tabelas do sistema de convites (salao_*).
--
-- Segurança: RLS ligado em todas as tabelas e SEM políticas públicas.
-- Só o servidor do portal (com a chave service_role, guardada nas
-- variáveis de ambiente da hospedagem) consegue ler e gravar.
-- =====================================================================

-- 1) Equipe Rocha (diretoria, marketing e equipe). Cada pessoa tem login
--    de e-mail e senha no Supabase Auth; esta tabela guarda nome e setor.
create table if not exists public.portal_equipe (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null check (char_length(nome) between 2 and 80),
  email text not null unique,
  setor text not null default 'equipe' check (setor in ('diretoria', 'marketing', 'equipe')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- 2) Corretores: entram só com CRECI + UF. Cadastro feito no primeiro acesso.
create table if not exists public.portal_corretores (
  id uuid primary key default gen_random_uuid(),
  creci text not null check (creci ~ '^[0-9]{1,7}[FJ]?$'),
  uf char(2) not null check (uf ~ '^[A-Z]{2}$'),
  nome text not null check (char_length(nome) between 3 and 100),
  whatsapp text check (whatsapp is null or whatsapp ~ '^[0-9]{10,13}$'),
  imobiliaria text check (imobiliaria is null or char_length(imobiliaria) <= 100),
  email text check (email is null or char_length(email) <= 120),
  status text not null default 'ativo' check (status in ('ativo', 'bloqueado')),
  acessos integer not null default 0,
  ultimo_acesso timestamptz,
  criado_em timestamptz not null default now(),
  unique (creci, uf)
);

-- 3) Quadro de tarefas da equipe. As colunas são criadas, renomeadas e
--    excluídas pela própria equipe. "conta_como_concluida" marca as colunas
--    de tarefas finalizadas (usadas nos números do painel).
create table if not exists public.portal_tarefas_colunas (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 1 and 40),
  cor text not null default '#45474c' check (cor ~ '^#[0-9a-fA-F]{6}$'),
  ordem integer not null default 0,
  conta_como_concluida boolean not null default false,
  criado_em timestamptz not null default now()
);
insert into public.portal_tarefas_colunas (nome, cor, ordem, conta_como_concluida)
select * from (values
  ('A fazer', '#45474c', 1, false),
  ('Em andamento', '#1f5fae', 2, false),
  ('Em revisão', '#6b3fb8', 3, false),
  ('Concluído', '#1b7a4a', 4, true)
) as v(nome, cor, ordem, conta_como_concluida)
where not exists (select 1 from public.portal_tarefas_colunas);

-- Tarefas. Só pessoas da equipe criam, recebem e mudam tarefas.
create table if not exists public.portal_tarefas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(titulo) between 3 and 120),
  descricao text not null default '' check (char_length(descricao) <= 1000),
  empreendimento text not null default '' check (char_length(empreendimento) <= 80),
  prazo date,
  coluna_id uuid not null references public.portal_tarefas_colunas (id) on delete restrict,
  ordem integer not null default 0,
  prioridade text not null default 'media' check (prioridade in ('baixa', 'media', 'alta')),
  responsavel_id uuid references public.portal_equipe (id) on delete set null,
  criado_por uuid references public.portal_equipe (id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists portal_tarefas_responsavel_idx on public.portal_tarefas (responsavel_id);
create index if not exists portal_tarefas_coluna_idx on public.portal_tarefas (coluna_id);

-- 4) Conteúdo da Central (CNPJ, PIX, materiais, postagens) por empreendimento.
create table if not exists public.portal_conteudo (
  empreendimento_id text primary key check (empreendimento_id ~ '^[a-z0-9-]{3,60}$'),
  dados jsonb not null,
  atualizado_por uuid references public.portal_equipe (id) on delete set null,
  atualizado_em timestamptz not null default now()
);

-- 5) Registro simples de entradas no portal (para a equipe acompanhar).
create table if not exists public.portal_acessos (
  id bigint generated always as identity primary key,
  tipo text not null check (tipo in ('equipe', 'corretor')),
  pessoa_id uuid not null,
  em timestamptz not null default now()
);
create index if not exists portal_acessos_em_idx on public.portal_acessos (em desc);

-- Atualiza "atualizado_em" das tarefas automaticamente.
create or replace function public.portal_tocar_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em := now();
  return new;
end $$;
drop trigger if exists portal_tarefas_atualizado_em on public.portal_tarefas;
create trigger portal_tarefas_atualizado_em before update on public.portal_tarefas
  for each row execute function public.portal_tocar_atualizado_em();

-- Contador de acessos do corretor (chamado pelo servidor no login).
create or replace function public.portal_registrar_acesso_corretor(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.portal_corretores
     set acessos = acessos + 1, ultimo_acesso = now()
   where id = p_id;
  insert into public.portal_acessos (tipo, pessoa_id) values ('corretor', p_id);
$$;

-- RLS ligado e nenhum acesso para visitantes ou usuários do navegador.
alter table public.portal_equipe enable row level security;
alter table public.portal_corretores enable row level security;
alter table public.portal_tarefas_colunas enable row level security;
alter table public.portal_tarefas enable row level security;
alter table public.portal_conteudo enable row level security;
alter table public.portal_acessos enable row level security;
revoke all on public.portal_equipe, public.portal_corretores, public.portal_tarefas_colunas, public.portal_tarefas,
  public.portal_conteudo, public.portal_acessos from anon, authenticated;
revoke all on function public.portal_registrar_acesso_corretor(uuid) from public, anon, authenticated;
grant execute on function public.portal_registrar_acesso_corretor(uuid) to service_role;

-- =====================================================================
-- PRIMEIRA PESSOA DA EQUIPE (rode depois de criar o usuário):
-- 1. Supabase > Authentication > Users > Add user > Create new user
--    (e-mail e senha; marque "Auto Confirm User").
-- 2. Troque os dados abaixo e rode só este trecho:
--
-- insert into public.portal_equipe (id, nome, email, setor)
-- select id, 'Seu Nome', email, 'diretoria' from auth.users
--  where email = 'seu-email@exemplo.com';
--
-- Depois disso, as próximas pessoas podem ser cadastradas pela tela
-- "Equipe" dentro do portal.
-- =====================================================================
