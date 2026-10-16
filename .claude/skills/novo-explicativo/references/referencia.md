# Receita do vídeo de referência: cartão por aproximação

O usuário escolheu este vídeo como o padrão do canal ("design muito bom, voz boa"). Arquivos:
`videos/aproximacao/roteiro.json` e `src/explicativo/videos/Aproximacao.tsx`. Todo vídeo novo deve
parecer da mesma família. Os vídeos de 16/10/2026 no "padrão Ludificando" (cinza com prateleiras,
desfoque, bonecos no centro, 80–90 s) foram reprovados.

## Números medidos no mp4 aprovado
| Medida | Referência (aprovado) | Vídeos reprovados |
|---|---|---|
| Duração | 61 s | 80–91 s |
| Cenas | 7 | 9–12 |
| Palavras | ~170 | ~250 |
| Silêncio na narração | ~15 % (pausas claras) | 4–5 % (corrido) |
| Ritmo | ~4,5 ataques/s (calmo) | ~5,3 (apressado) |
| Volume | −16 LUFS | −14 LUFS |
| Trilha de fundo | nenhuma | sim |
| Fundo | preto com poeira | cinza com prateleiras |

## Roteiro
- 7 cenas, 18–30 palavras cada. Uma ideia por cena, em sequência de causa e efeito:
  gancho (número + pergunta) → como funciona (1) → consequência ("Por isso…") → como funciona (2) →
  "E se…?" (a dúvida/medo comum, respondida) → o caminho até o fim → a informação prática.
- Chips curtos, alguns em forma de pergunta: "3 EM CADA 4", "A ENERGIA", "BEM PERTO", "A CONVERSA",
  "E SE COPIAREM?", "O BANCO", "E A SENHA?".
- Tom de explicação calma, sem gírias de viral, sem pedir nada no fim.

## Cena
- `Stage` padrão (escuro). Sem `cenario="estudio"`, sem `acabamento`.
- Objeto-herói: a maquininha (caixa preta com tela e teclado) e o cartão (placa clara com chip), grandes,
  no centro, presentes em 6 das 7 cenas. Cada cena mostra um estado diferente deles: anéis do campo
  acendendo, bobina dentro do cartão, código "A7·F3·9C" na tela, chave saindo do chip, linha pontilhada
  até o banco.
- Cor de destaque (`C.accent`) só no que importa naquele momento (os cartões "3 de 4", a tela acesa).
- Boneco: no máximo 1, em segundo plano (o "ladrão" escuro, a pessoa no pedestal de moedas).
- Câmera a 6–8 de distância, olhando para y ≈ 1, aproximando 10–15 % durante a cena.

## Texto na tela
- `DataCard` no topo só nas cenas com número (76,2 % · 3 de 4; 13,56 MHz; R$ 200 · menos).
- `Tags` pequenas (1–3) explicando a etapa ("NÚMERO + CHAVE = CÓDIGO", "CÓPIA = INÚTIL", "APROVADO ✓").
- `Callout` com título curto + fonte em MAIÚSCULAS ("Teto da Abecs · FONTE: ABECS (DESDE 2020)").
- Legenda karaokê frase a frase (automática).

## Voz e som
- Antonio (Microsoft), velocidade 1.08, narração frase a frase com pausas fixas — é o estilo padrão do
  `narrar.py` ("referencia"). Volume −16 LUFS.
- Sem trilha. Efeitos leves (transição, pop no cartão, 2–3 acentos) estão liberados porque o usuário
  pediu, mas sempre discretos: nunca por cima de uma palavra importante.
