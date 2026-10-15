# Linguagem visual

## Paleta (src/explicativo/theme.ts)
- Fundo `C.bg` quase preto, chão cinza escuro, poeira branca flutuando, vinheta nas bordas.
- Objetos: `C.white` (principal), `C.gray`/`C.dark` (secundário, "os outros"), `C.accent` (o que
  importa NAQUELE momento). Destaque é escasso: se tudo brilha, nada brilha.
- Dourado (`C.gold`) só para dinheiro.

## Movimento
- Câmera nunca parada: dolly lento (aproximar 10–20%) ou órbita curta durante a cena.
- Objetos entram com mola (`pop`) em cascata (2–4 frames entre um e outro), nunca todos juntos.
- A mudança principal da cena acontece na palavra-chave da fala (`w("…")`).
- Transição entre cenas: fade de 10 frames (automático).

## Texto na tela
- Marca (símbolo Scientia + texto) e chip do capítulo: automáticos, topo esquerdo. Símbolo: `ui/Simbolo.tsx`; arquivos da marca em `marca/`.
- `DataCard`: o número da cena (grande). O valor troca quando a voz fala o novo número.
- `Tags`: 2–3 pílulas curtas ("+60 DIAS", "+1 ANO"); a ativa fica na cor de destaque.
- `Callout`: anotação presa a um objeto 3D (use `projetar([x,y,z], cam)` para achar o ponto na tela),
  com `sub` = fonte ou detalhe em MAIÚSCULAS.
- `Label`: rótulo pequeno embaixo de objetos (dias da semana, etapas).
- Legenda karaokê: automática, vinda da narração.

## Metáforas que funcionam
| Ideia | Visual |
|---|---|
| votação / apoio | plenário de pílulas acendendo (Escala6x1 → Aprovado) |
| tempo / horas | cubos numa grade; cubos que saem viram destaque e sobem |
| semana / dias | 7 blocos com altura = horas; folga = bloco baixo em destaque |
| pessoas / grupo | bonecos em formação; 1 boneco = N pessoas; anel tracejado em volta do grupo |
| parte de um todo | bonecos destacados x apagados (`look="white"` x `"dark"`) |
| dinheiro / salário | pilha de moedas, holerite (`Paper` com linha destacada) |
| etapas / prazo | placas no chão em linha, a atual em destaque + `Label` |
| comércio / empresa | `Stall` (barraquinha) com bonecos |
| lei / processo | `Paper` + checklist HTML (✓ feito, ◻ pendente pulsando) |
| comparação de valores | barras (`RoundBox` altos) com número em cima |
