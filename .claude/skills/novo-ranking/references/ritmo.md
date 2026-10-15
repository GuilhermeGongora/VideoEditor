# Ritmo e cortes

## Estrutura de cada clipe
`setup curto → ação → payoff → reação → corte`
- **start**: no máximo 1,5s antes da ação começar. Corte câmera parada, gente andando, espera.
- **end**: 0,5–1,2s depois da reação. Não termine em silêncio nem no meio de uma palavra.
- Duração por clipe: 3–6s (o #1 pode ir até ~8s). Clipe de 9s com 6s de nada = o público rola.

## Vídeo inteiro
- 25–40s no total. Primeiro clipe com ação já no 1º segundo (é o gancho).
- A ordem é a do usuário (o número no nome do arquivo). Se o #1 parecer mais fraco que outro,
  comente com o usuário, mas não troque sem ele concordar.
- Clipes horizontais: `"fit": "contain"`.

## Como achar os tempos
- `out/analysis/<clipe>/frames-*.jpg` tem o tempo em cada quadro (4 por segundo).
- `audio.txt` marca eventos (pancadas, gritos) e silêncios — bons pontos de corte ficam logo
  depois de um evento de reação e antes de um silêncio.
- Lembre: com `start`, os tempos de `sounds[].at` contam a partir do novo início
  (`at = tempo_no_arquivo − start`).
