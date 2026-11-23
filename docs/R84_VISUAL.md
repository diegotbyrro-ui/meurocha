# R84 — Portal bonito, colorido e interativo (complementa R83_DESIGN.md)

O cliente pediu mais cor, ícones e interação. Continuam valendo as regras de contraste e
"sem cara de IA" do R83 (nada de gradiente, brilho, emoji, rótulos em CAIXA ALTA espaçada).
A cor vem da **marca Rocha** (vinho e vermelho do logo) e de **uma cor por área**.

## Peças prontas (use sempre, não recrie)
- `import Icone from '<rel>/ui/Icone'` → `<Icone nome="predio" tamanho={20} />` (traço Lucide, herda `color`).
  Nomes: inicio, predio, cartao, copiar, check, checkCirculo, calculadora, tarefas, editar, pasta, cadastro, ajuda,
  pergunta, sair, menu, imagem, imagens, video, megafone, documento, mapa, regua, carro, livro, marca, tabela, baixar,
  abrir, mais, lixeira, setaDireita, setaEsquerda, chevron, info, alerta, busca, carteira, banco, qrcode, imprimir,
  refazer, calendario, relogio, usuarios, link, compartilhar, dica, fechar, filtro, chaves, moedas, grafico, camadas, play, upload.
- `import CabecalhoPagina from '<rel>/ui/CabecalhoPagina'` → cabeçalho de toda página (faixa vinho com a diagonal do "R"):
  `<CabecalhoPagina area="central" icone="predio" titulo="…" descricao="…" antes={migalha opcional}>{botões r84-btn / r84-btn-sec}</CabecalhoPagina>`
  Áreas: inicio, central, simulador, tarefas, atualizar, biblioteca, cadastro, ajuda. Substitui o h1/header antigo da página.
- CSS global já carregado no layout (app/portal/ui/ui.css):
  - `data-area="simulador"` em qualquer elemento define `--a` (cor forte) e `--a-soft` (fundo claro) daquela área.
  - `.r84-icone-bloco` (quadrado 40px com fundo `--a-soft` e ícone `--a`), `.r84-icone-bloco-lg` (52px), `.r84-icone-bloco-cheio` (fundo `--a`, ícone branco).
  - `.r84-btn` (primário vinho), `.r84-btn-sec` (secundário), `.r84-btn.is-feito` (verde, ex.: depois de copiar).
  - `.r84-cartao` (cartão branco 12px), `a.r84-cartao` / `.r84-cartao-clicavel` (sobe 2px e borda na cor da área no hover), `.r84-cartao-topo` (faixa de 4px na cor da área no topo do cartão).
  - `.r84-selo` (pílula na cor da área), `.r84-selo-ok` (verde "Cadastrado"), `.r84-selo-falta` (âmbar "Falta cadastrar").
  - `.r84-toast` (aviso flutuante embaixo; renderize condicionalmente por ~2,5 s com `role="status"`).
- Cores por área (já em ui.css): central/início vinho #a51c2c · simulador azul #1f5fae · tarefas verde #1b7a4a ·
  atualizar âmbar #b45309 · biblioteca roxo #6b3fb8 · cadastro grafite #3f5468 · ajuda petróleo #0e7c78.
  Cor de marca extra: vinho escuro #3d1219 / #2b0f14, vermelho do logo #d22630 (só decorativo, nunca texto pequeno).

## Como deixar bonito sem parecer IA
- Ícone ao lado de todo título de seção e em todo botão de ação principal (copiar, abrir, baixar, imprimir, adicionar).
- Cartões com a faixa colorida no topo ou um `r84-icone-bloco` — não use os dois no mesmo cartão.
- Cor serve para orientar: a área em que a pessoa está, o tipo de material, o estado (ok / falta / erro). Não pinte por pintar.
- Números importantes grandes (28–36px, peso 600) com rótulo pequeno embaixo.
- Estados vazios com um ícone grande (40px) em `r84-icone-bloco-lg`, uma frase e o botão de ação.
- Texto sempre ≥ 13px e com contraste alto; texto branco só sobre vinho/cores fortes.

## Interação esperada
- Hover em cartões clicáveis (já pronto em `.r84-cartao`), foco visível sempre.
- Copiar: o botão vira "Copiado" com ícone check e classe `is-feito` por 2 s + `.r84-toast`.
- Filtros e abas como botões com `aria-pressed`, mostrando contagem.
- Transições de 150 ms; respeitar `prefers-reduced-motion` (já tratado nas classes r84).
- Nada de animação contínua ou chamativa.
