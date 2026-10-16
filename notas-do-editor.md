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
- 15/10/2026 — VOZ: o usuário aprovou o áudio do 6x1 e da aproximação (Antonio, Microsoft, 1.05, tratamento
  simples: highpass + presença 3,2 kHz + compressor + loudnorm). A urna com a feminina Thalita Multilingual
  "parece português de Portugal" → nunca usar vozes Multilingual; padrão = masculina Antonio. A "melhoria"
  com eco/ambiência e EQ extra foi revertida (piorou).
- 15/10/2026 — Pediu mais efeitos sonoros e ganchos virais: impacto na abertura, pop no cartão de número,
  transições alternadas, riser no encerramento e 2–4 `acentos` por roteiro (ver `references/ganchos.md`).
- 16/10/2026 — Pediu para chegar no nível do Ludificando (analisados 4 vídeos; ver
  `.claude/skills/novo-explicativo/references/ludificando.md`). O que faltava: vídeos de 75–90 s com 9–11
  capítulos, cenário-herói que volta, HUD contínuo (cartão/etapas), "os dois lados" com balança,
  "cuidado" (golpe), fecho que responde o gancho, profundidade de campo + bloom, voz com menos
  respiro (narrar.py encurta pausas > 0,2 s). Regra do usuário: todo vídeo abre com uma pergunta.
- 16/10/2026 — Usuário vai gerar os vídeos no Claude do PC dele; aqui ele só quer o prompt pronto
  ("/novo-explicativo …") quando pedir um vídeo.
- 16/10/2026 — REGRA: nada de "comenta X que eu te mando as fontes", "segue", "salva" ou pedido de like —
  nem na fala nem na tela. O vídeo termina na última fala + encerramento da marca (só o símbolo e o @).
  Fontes ficam na descrição do post. Campo `cta` removido dos roteiros.
- 16/10/2026 — Voz: velocidade 1.08 (mais energia, perto do ritmo do Ludificando); referência do Chatterbox
  agora é um texto expressivo; `npm run vozes -- comparar <slug>` para comparar Microsoft × local.
- 16/10/2026 — REPROVADO o padrão Ludificando (6 vídeos: prospera MEI, lavagem, cripto…): fundo cinza com
  prateleiras, desfoque, bonecos no centro, 80–90 s, narração corrida. **A referência do canal é o vídeo do
  cartão por aproximação** (`references/referencia.md`): fundo escuro, objeto-herói grande e nítido,
  ~60 s / 7 cenas, narração frase a frase com pausas (−16 LUFS), sem trilha. Código voltou a esse padrão
  (Stage escuro, sem acabamento, narrar estilo "referencia", trilha desligada).
- 16/10/2026 — ElevenLabs (Starter) aprovado como "bem melhor", mas soou robótico/engessado e leu "1 folga"
  como "um folga". Causas: narração frase a frase (cada vírgula uma chamada isolada) e speed 1.08. Agora:
  cena inteira por chamada + previous/next_text, speed 1.0, eleven_v4 (reserva multilingual_v2), números por
  extenso com gênero (scripts/numeros_pt.py), masterização leve (só highpass + loudnorm −16).
- 16/10/2026 — Vozes do ElevenLabs aprovadas ("corrigidas com sucesso"). Designers pediram o visual "mais
  chamativo: cor, neon, brilho, luminosidade" (exemplo: Ludificando "folga"). Feito sem mudar a modelagem:
  bloom ligado (limiar 0.55), fundo grafite quente #1c1b19 em vez de preto, chão #3b3935, exposição 1.32,
  luz mais forte, `C.accent` sempre emissiva. Sem desfoque e sem estúdio (continuam reprovados).

