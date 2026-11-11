# PLATAFORMA ROCHA — R1 (homologação local)

**Entrega:** primeira base executável de interface e API de simulação DIDÁTICA. Não é substituto do site público, não contém preços, arquivos ou corretores reais e não está conectada ao projeto CONVITEROCHA.

## Rotas
- `/` e `/home`: redirecionam ao site oficial sem reproduzir ou modificar seu conteúdo.
- `/plataforma`: dashboard DEMONSTRATIVO, apenas no desenvolvimento local com `ROCHA_PREVIEW_MODE=true`.
- `/plataforma/empreendimentos`: quatro nomes públicos de referência, sem dados comerciais.
- `/plataforma/biblioteca`: catálogo de categorias do briefing, sem arquivos.
- `/plataforma/simulador`: protótipo de cálculo didático no servidor, sem preço comercial.
- `/plataforma/convites`: planejamento da incorporação do conviterocha, sem acesso ao banco.
- `/corretor`: fluxo visual futuro, login intencionalmente inativo.
- `/api/status`: estado de funcionalidades (nunca expõe segredos).
- `/api/preview/simulacao`: só funciona em desenvolvimento com flag de homologação; rejeita produção.

## Dependências e execução
Node.js 22.x, npm 10.x. A instalação local criará package-lock.json no primeiro `npm install`. As versões diretas são exatas em package.json. Revise o lockfile e auditoria de dependências antes de qualquer commit.

```powershell
# Executado automaticamente pelo instalador PowerShell quando possível.
Copy-Item .env.example .env.local
# Ajustar apenas ROCHA_PREVIEW_MODE=true para desenvolvimento local.
npm install --no-audit --no-fund
npm run test
npm run typecheck
npm run lint
npm run build
npm run dev
```

Acesse `http://localhost:3000/plataforma` no seu PC. **Nunca use ROCHA_PREVIEW_MODE para abrir dados reais ou autenticar usuários.** Em produção a rota é fechada independentemente da flag.

## Próximas etapas necessárias
1. Capturar/importar fontes autorizadas do site e executar comparação visual para clonagem fiel.
2. Identificar o projeto Supabase CONVITEROCHA (o conector atual lista somente FCAP Jr.).
3. Auditar esquema, índices, RLS, backups e vínculo com inscrições salao_*.
4. Implementar autenticação CRECI+UF com verificação OTP, sessão e RLS.
5. Implementar operações de CRUD, Storage privado, revisão/publicação e convites multi-evento.
6. Subir para o GitHub SOMENTE com aprovação expressa após validações completas; sem deploy automático.

## Regras
Nenhum SQL ou migração foi aplicado. Nenhuma alteração feita ao conviterocha, ao site meurocha.com.br ou ao repositório remoto meurocha. O instalador recusa sobrescrever arquivos já existentes e não realiza commit/push.
