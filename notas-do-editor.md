# Notas do editor

Memória do canal: o Claude lê este arquivo antes de editar e escreve aqui o que aprendeu com o
feedback do usuário (skill `/feedback`). Pode editar à vontade.

## Gosto do usuário

- Só texto fixo do ranking na tela (título, subtítulo, @, lista). Nada de legendas extras.
- Textos da lista discretos: labels curtos (1–3 palavras); o título não pode encostar nas bordas.
- Gosta do resultado rápido, mas quer edição com cara de humana, principalmente nos efeitos sonoros.

## Lições

- 2026-10-15 — Vídeo "Instant Karma": o clipe do homem socando o vidro do carro foi rotulado
  "dance battle". Regra: descrever primeiro as ações físicas e a expressão (raiva x diversão),
  conferir batidas no áudio sincronizadas com os golpes e, na dúvida, olhar o trecho a 8 fps.
- 2026-10-15 — No mesmo clipe o áudio original ficou mudo e entraram ~8 efeitos seguidos, com buracos
  de silêncio entre eles. Regra: nunca deixar clipe mudo; no máximo 2 acentos por clipe, no payoff.
- 2026-10-15 — O clipe "red light bike" ficou com 9s e pouca ação. Regra: 3–6s por clipe; cortar o
  começo parado com `start`.
- 2026-10-15 — O vídeo terminou com um som alto até o último quadro. Regra: deixar a reação respirar
  e terminar com fade (automático, `endFadeSeconds`).

## Sons usados recentemente

(o Claude atualiza: últimos 3 vídeos, só os acentos)

## Explicativos
- Estilo de referência do usuário: vídeo da 6x1 (bonecos-manequim, fundo escuro, uma cor de destaque,
  legenda karaokê). Primeiro vídeo: `videos/6x1`.
- 2026-10-15 — Comparação com o Ludificando: o deles tinha 96% do tempo com som (trilha + efeitos +
  voz contínua) e o brilho médio era quase o dobro do nosso (77 x 40). Nosso "milhão x bilhão" tinha
  24% de silêncio digital, 6 pausas acima de 0,5 s e quadros vazios (só uma linha fina, bloco gigante).
  Regra: narração por cena inteira, trilha de fundo sempre, cenário estúdio claro, objeto principal
  grande e com referência de escala.
- 15/10/2026: aprovou sem ressalvas ("todos os vídeos muito bons") aproximação, segundo turno, Pix, Selic e
  imposto de renda. Manter a receita: 7 cenas de ~60 s, uma metáfora por cena, número na tela quando a voz
  fala, fontes em cartão/callout, tom neutro em política (mesma cor para os dois lados).
- Lições técnicas desses vídeos:
  - Câmera a 8,5–10 de distância (vertical mostra só ~0,41 × distância de largura); objetos entre x ±1,2.
  - Sempre `npm run quadros` antes do render: 1ª grade quase sempre tem algo cortado ou atrás da legenda.
  - Rótulo sobre fundo de destaque precisa de cor escura (`C.ink`), senão some.
  - Quadro da thumb: escolher o fim da cena (tudo já aceso), longe de objetos que ficam atrás do título.
