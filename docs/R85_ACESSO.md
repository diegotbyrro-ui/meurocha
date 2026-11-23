# R85 — Acesso por tipo de pessoa e dados no Supabase

## Quem usa o portal
- **Equipe Rocha** (setores: diretoria, marketing, equipe): entra com e-mail e senha (Supabase Auth). Vê tudo.
  Toda a equipe pode editar conteúdo, criar/editar/excluir colunas e tarefas, cadastrar pessoas da equipe e bloquear corretores.
- **Corretor**: entra só com CRECI + UF, sem senha (cadastro no primeiro acesso: nome, WhatsApp, imobiliária, e-mail opcional).
  Vê Início, Central (CNPJ, PIX, materiais, vídeos, postagens), Simulador e Ajuda. **Nunca** vê Tarefas, Atualizar, Biblioteca, Cadastro, Equipe, Corretores.
- Tarefas só podem ser atribuídas a pessoas **ativas da equipe** (`portal_equipe`). Corretor não recebe tarefa.

## Peças prontas (não reescreva)
- `database/portal-supabase.sql` — tabelas: portal_equipe(id=auth.users.id, nome, email, setor, ativo, criado_em),
  portal_corretores(id, creci, uf, nome, whatsapp, imobiliaria, email, status 'ativo'|'bloqueado', acessos, ultimo_acesso, criado_em),
  portal_tarefas_colunas(id, nome, cor '#rrggbb', ordem, conta_como_concluida, criado_em),
  portal_tarefas(id, titulo, descricao, empreendimento, prazo date|null, coluna_id, ordem, prioridade 'baixa'|'media'|'alta', responsavel_id|null, criado_por|null, criado_em, atualizado_em),
  portal_conteudo(empreendimento_id, dados jsonb, atualizado_por, atualizado_em), portal_acessos(id, tipo, pessoa_id, em).
- `lib/portal-rocha-auth.ts` — `lerSessao(cookieHeader)` → `{ t: 'equipe'|'corretor', id, nome, setor?, creci?, uf? } | null`.
- `lib/portal-guard.ts` — páginas: `await exigirEquipe()` (redireciona corretor) e `await obterSessao()`;
  APIs: `const s = protegerApi(request, 'equipe' | 'qualquer'); if (s instanceof Response) return s;` e `respostaJson(dados, status)`.
- `lib/portal-supabase.ts` — `supabaseAdmin()` (só servidor, depois de protegerApi/exigirEquipe), `supabaseConfigurado()`.
- `lib/portal-acesso.mjs` — SETORES, UFS, ROTAS_SO_EQUIPE, podeAcessar, normalizarCreci, normalizarWhatsapp, validarCadastroCorretor, nomeSetor, formatarCreci.
- `tests/helpers/fake-supabase.mjs` — `criarFakeSupabase({ tabela: [linhas] }, { rpcs, padroes })` imita o cliente (from/select/insert/update/upsert/delete/eq/neq/in/is/ilike/or/order/limit/range/single/maybeSingle, rpc, auth.admin.createUser/updateUserById/deleteUser).

## Padrão de código
- Regras e acesso a dados em **repositórios puros** `lib/portal-*-repo.mjs` que recebem o cliente `db` como 1º parâmetro
  (testáveis com o fake). Retornam `{ ok: true, ... }` ou `{ ok: false, erro: 'mensagem em português', status }`. Nunca lançam para o usuário.
- Rotas de API em `app/api/portal/...` (Next 15: `params` é Promise). Sempre: `protegerApi` → validar entrada → repo → `respostaJson`.
  Corpo JSON limitado (rejeite > 20 KB). IDs validados como UUID quando forem UUID.
- Telas: componentes cliente chamam as APIs com `fetch` (`credentials: 'same-origin'`, cabeçalho `Content-Type: application/json`),
  mostram carregando/erro em português e atualizam a tela sem recarregar. Visual segue docs/R83_DESIGN.md e docs/R84_VISUAL.md
  (CabecalhoPagina, Icone, r84-btn, r84-cartao, r84-toast, cores por área).
- Nunca envie a chave service_role ou dados de outra pessoa para o navegador além do necessário para a tela.

## Preview (prints reais)
`cd /home/claude/preview && ./build.sh NOME && python3 shot.py NOME "/portal/rota,/portal#corretor" 1440`
(sufixo `#corretor` simula corretor; sem sufixo, equipe). No preview o Supabase não existe: para telas que usam `fetch`,
faça um script Playwright (copie shot.py) com `page.route('**/api/portal/**', ...)` devolvendo JSON de exemplo.
