# R83 — Guia visual e de usabilidade do Portal Rocha

Objetivo: qualquer pessoa da equipe ou corretor entra no portal e aprende sozinha a usar.
Visual sóbrio, de empresa real, com contraste alto. Nada de "cara de IA".

## Regras "sem cara de IA" (obrigatórias)
- Sem gradientes, brilhos, desfoques (glassmorphism), sombras grandes ou letras gigantes decorativas.
- Sem emoji na interface. Ícones só quando ajudam, em traço simples (SVG 1.75px, currentColor).
- Sem rótulos em CAIXA ALTA com espaçamento de letras ("eyebrow/kicker"). Use frases normais.
- Sem textos de marketing vagos ("experiência premium", "tudo em um só lugar"). Diga o que a tela faz.
- Botões com verbo claro: "Copiar chave PIX", "Salvar e continuar", "Imprimir proposta".
- Cantos 8px (6px em itens pequenos; 999px só em selos de status). Sombra máxima: 0 1px 2px rgba(0,0,0,.06).
- Fundo da página levemente quente (--r-bg), superfícies brancas, bordas de 1px.

## Contraste e leitura
- Texto principal 15px; texto pequeno no mínimo 13px; títulos de página 28px; seções 20px.
- Nunca use cor de texto mais clara que --r-ink-3 (contraste ≥ 6:1 no branco).
- Texto branco só sobre --r-brand ou mais escuro.
- Foco visível em tudo que é clicável: `box-shadow: var(--r-focus)` em :focus-visible.
- Alvos de toque com no mínimo 44px de altura.
- Status nunca só por cor: sempre com texto ("Cadastrado", "Falta cadastrar").

## Tokens (definidos em `.rocha-portal` por app/portal/r83-shell.css)
```
--r-bg:#f3f2ef; --r-surface:#ffffff; --r-surface-2:#f8f7f5;
--r-ink:#1c1c1e; --r-ink-2:#45474c; --r-ink-3:#5d6066;
--r-line:#d6d4cf; --r-line-strong:#b9b6af;
--r-brand:#a51c2c; --r-brand-hover:#8a1624; --r-brand-soft:#f6e8e9;
--r-ok:#146c3c; --r-ok-soft:#e6f4ec;
--r-warn:#7a4b00; --r-warn-soft:#fdf1d8;
--r-err:#b42318; --r-err-soft:#fdeceb;
--r-radius:8px;
--r-focus:0 0 0 2px #ffffff, 0 0 0 4px #a51c2c;
```
Sempre use `var(--r-...)` com o valor como fallback, ex.: `color: var(--r-ink-2, #45474c)`.

## Botões
- Primário: fundo --r-brand, texto branco, hover --r-brand-hover.
- Secundário: fundo branco, borda 1px --r-line-strong, texto --r-ink; hover fundo --r-surface-2.
- Perigo (excluir): texto --r-err, borda --r-err.
- Peso 600, 15px, padding 10px 16px, min-height 44px.

## Aprender sozinho (padrões de interação)
- Toda página: título (h1) + uma frase dizendo para que serve + o painel `AjudaPagina` com 3 a 5 passos.
- Termos técnicos (ato, intercalada, INCC, SAC, PRICE, FGTS…) usam o componente `Termo`, que abre a explicação ao clicar no "?".
- Fluxos longos viram passo a passo numerado com barra de progresso e botões "Voltar" / "Continuar".
- Estados vazios sempre dizem o que fazer a seguir e trazem o botão para isso.
- Mensagens de erro dizem o que corrigir ("CNPJ com dígito errado. Confira o número.").
