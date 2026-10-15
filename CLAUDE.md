# Ranking Video — instruções para o Claude

Este projeto gera vídeos verticais (1080x1920, 30fps) no estilo "Ranking Funniest X Moments"
para TikTok/Shorts/Reels, com Remotion. Responda sempre em português do Brasil.

## Como o vídeo funciona
- Barra preta no topo com título em 2 linhas (cores via `[texto](cor)`), subtítulo e @ do canal.
- Lista fixa de posições na esquerda (1 dourado, 2 azul, 3 vermelho, demais brancos).
- Os clipes passam do último lugar até o #1. Quando cada clipe começa, o texto dele
  "pula" na lista com som; troca de clipe tem whoosh; o #1 entra com um som de impacto.
- TUDO é controlado pelo `ranking.json` (local, fora do Git; o modelo é `ranking.example.json`).
  Para mudar um vídeo, edite o JSON; só mexa em
  `src/` se o usuário pedir mudança de estilo/layout.

## Texto na tela: só o fixo
O usuário NÃO quer legendas extras no vídeo. O único texto é o fixo do ranking (título,
subtítulo, @ e a lista). Deixe `captions: []` em todos os itens, a menos que ele peça
explicitamente uma legenda. A "graça" dos momentos vem dos efeitos sonoros (`sounds`).

## Efeitos sonoros (biblioteca do usuário)
- A biblioteca do usuário fica em `public/soundeffects/` (pode ter subpastas por categoria).
  Os sons básicos gerados por código ficam em `public/sfx/` (pop, whoosh, ding, boom, riser) —
  use-os só como reserva.
- Antes de escolher sons, rode `npm run sfx:index` e leia `public/soundeffects/catalog.json`.
  Cada som tem: `src` (caminho para usar no JSON), `name`, `category`, `duration`,
  `peakAt` (segundo do impacto dentro do arquivo) e `loudnessDb`.
- Você não consegue ouvir os sons: escolha pelo nome/categoria e pela duração. Se o nome não
  deixar claro o que é, pergunte ao usuário ou prefira outro.
- Sons fixos do ranking (`ranking.json > sfx`):
  - `reveal`: quando o item entra na lista (curto, < 0.6s: pop, click, swoosh curto).
  - `transition`: na troca de clipe (whoosh/swish, < 1s). Começa 0.18s antes do corte.
  - `final`: revelação do #1 (impacto/boom/tambor).
  - `volume`: 0.5–0.8.
  - Um item pode sobrescrever o som de revelação com `"sfx": "..."` ou silenciar com `null`.
- Sons dentro dos clipes (`items[].sounds`): `{ "src", "at", "volume", "maxSeconds" }`.
  - `at` = segundo em que o som COMEÇA, contado do início daquele clipe (depois do `start`).
  - Para o impacto do som cair no momento certo: `at = momento_da_ação - peakAt`.
  - Assista ao clipe extraindo frames (ver abaixo) para achar o segundo exato da queda,
    pancada, susto etc. Use 1–3 sons por clipe, no máximo; não empilhe sons no mesmo instante.
  - Bons usos: impacto em queda/pancada, "bonk", vidro quebrando, risada/plateia no final de
    uma piada, "record scratch"/silêncio antes do absurdo, "bruh"/"vine boom" na reação.
  - Volume 0.6–0.9; se o clipe já tem áudio forte no momento, prefira 0.9.
  - Use `maxSeconds` para cortar sons longos (música/risada) e não invadir o próximo clipe.

## Fluxo padrão quando o usuário manda clipes novos
1. Clipes brutos ficam em `clips/`. Nome recomendado: `<posição>-<texto>.mp4`
   (ex.: `6-nice-grandma.mp4`, `1-fbi-robot.mp4`). Se os nomes não tiverem posição,
   pergunte a ordem ou renomeie conforme o usuário disser.
2. Rode `npm run prep -- --reset` para um vídeo novo (ou `npm run prep` para só adicionar
   clipes). Isso converte para `public/clips/` e preenche `ranking.json` com rank, label e duração.
3. Para cada clipe, extraia frames e olhe:
   `ffmpeg -v error -i public/clips/x.mp4 -vf "fps=4,scale=270:-1,tile=8x4" -frames:v 1 /tmp/x.jpg`
   (cada quadro = 0,25s). Assim você acha os momentos de ação para cortes e sons.
4. Ajuste o `ranking.json`: título, subtítulo, @, labels com emoji, cortes (`start`/`end`)
   e sons (`sfx` e `sounds`).
5. Confira com um frame: `npx remotion still Ranking out/check.png --frame=60`.
6. Renderize: `npm run render` → `out/ranking.mp4`.
7. Diga ao usuário para baixar com `npm run baixar` (porta 8080 → abrir no navegador)
   ou botão direito em `out/ranking.mp4` → Download.

## Regras
- Duração ideal: 25–40s no total. Sugira cortes (`start`/`end`) se passar disso.
- O #1 deve ser o melhor momento; o subtítulo costuma provocar ("Last one is amazing 😂😂").
- Clipes horizontais: use `"fit": "contain"` (mostra inteiro com fundo desfocado).
- Remotion: animações sempre a partir de `useCurrentFrame()`; não use CSS transitions.
  Use as skills `remotion-*` em `.claude/skills/` quando precisar de API do Remotion.
