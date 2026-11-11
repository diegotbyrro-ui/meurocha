# ROCHA R8 — site institucional + Convites Rocha (homologação)

## Origem, integridade e limites

- `apps/conviterocha/`: cópia dos arquivos **rastreáveis no Git** do projeto original `diegotbyrro-ui/conviterocha`, referência de origem `9b1bd2a7253d57811700a738e74b9b4966114deb`. Código, imagens, APIs, admin, SQL histórico e estilos são preservados, sem alterar banco de dados.
- `public/espelho/`: HTML público **renderizado e capturado** do site `meurocha.com.br`, junto a mídias/CSS/JS públicos em caminhos originais dentro de `public/`. O inventário `site-mirror-manifest.json` documenta páginas capturadas. A rota pública é servida localmente por rewrites `beforeFiles`.
- `app/plataforma`: R6 preservada com bloqueio de produção até implantação de autenticação real.

**Esta é uma cópia técnica para homologação, não homologação funcional 100%.** Os originais poderão exigir formulários, APIs, dados de banco, vídeos, serviços externos e animações que não podem ser reproduzidos fielmente por captura pública. Nenhum cliente deve utilizar os formulários estáticos: eles são interceptados e não enviam dados. O espelho deve ser testado em desktop e mobile antes da liberação pública.

## Como testar localmente

### Aplicação principal (porta 3000)

```powershell
cd "$env:USERPROFILE\ROCHA\meurocha"
npm.cmd run dev
```

- `/`, `/home`: página institucional capturada (sem redirecionamento ao domínio original).
- `/rocha`, `/imoveis`, `/imoveis/...`, `/contato`: páginas capturadas se presentes no inventário.
- `/plataforma`: apenas em ambiente local com `ROCHA_PREVIEW_MODE=true`.
- `/plataforma/convites`: contém link para a aplicação Convites local na porta 3001, por padrão em desenvolvimento.

### Aplicação original de convites (porta 3001)

```powershell
cd "$env:USERPROFILE\ROCHA\meurocha\apps\conviterocha"
npm.cmd run dev -- -p 3001
```

Para **cadastro, login administrativo, exportação e cotas** funcionarem, configure as variáveis de ambiente de `apps/conviterocha/.env.example` em `apps/conviterocha/.env.local` ou na hospedagem. Não comite `.env.local` ou chaves privadas. O banco **CONVITEROCHA** não é modificado por esta instalação.

### Publicação em domínio de testes

São **duas aplicações Next.js independentes dentro de um repositório**. Configure duas Web Apps na hospedagem: a primeira usa a raiz do repositório, a segunda usa `apps/conviterocha` como diretório de aplicação, com domínio/subdomínio próprio. Configure `NEXT_PUBLIC_CONVITES_ROCHA_URL` na aplicação principal com a URL de testes da segunda. Não use a mesma URL sem roteamento de proxy testado.

**A aplicação principal bloqueia o painel interno em produção por segurança** até o sistema de login estar pronto. Não remova o bloqueio somente para testar em domínio público.

## Checklist de homologação antes de divulgar

- Verificar capturas desktop/mobile das rotas essenciais, inclusive menus e imagens.
- Revisar `site-mirror-manifest.json`, erros de captura e URLs externas ainda referenciadas.
- Testar formulários com backend próprio e LGPD; **não coletar dados no espelho estático**.
- Testar cadastro do evento, validação de código, cotas, login, exportações e permissões em ambiente de banco de testes ou com suporte do proprietário do banco.
- Atualizar a campanha do antigo Convites Rocha para um evento novo sem perder dados prévios.
- Executar testes de segurança e atualizar dependências vulneráveis antes de expor a internet.
- Conectar CV CRM/Nekt somente após autorização; simulador R6 ainda não utiliza preços oficiais.
- Conferir cache/headers, mídia, SEO, analytics, scripts terceiros, cookies e política de privacidade.

## O que NÃO foi realizado automaticamente

Nenhum SQL, migração, seed, backup de produção de Supabase, login ativo da nova plataforma, deploy em Hostinger ou troca de DNS foi efetuado. Um push no GitHub **pode** disparar publicação automática se ela tiver sido previamente configurada pelo usuário no provedor de hospedagem.
