# Ranking Video — instruções para o Claude

Este projeto gera vídeos verticais (1080x1920, 30fps) no estilo "Ranking Funniest X Moments"
para TikTok/Shorts/Reels, com Remotion. Responda sempre em português do Brasil.

## Como o vídeo funciona
- Barra preta no topo com título em 2 linhas (cores via `[texto](cor)`), subtítulo e @ do canal.
- Lista fixa de posições na esquerda (1 dourado, 2 azul, 3 vermelho, demais brancos).
- Os clipes passam do último lugar até o #1. Quando cada clipe começa, o texto dele
  "pula" na lista com som de pop; troca de clipe tem whoosh; o #1 entra com boom.
- Legendas opcionais por clipe (`captions`) com estilos `box` (caixa preta tipo
  máquina de escrever, "Wait for it… 😏"), `whitebox`, `pop` (texto grande vermelho,
  "-$5,300") e `plain`.
- TUDO é controlado pelo `ranking.json`. Para mudar um vídeo, edite o JSON; só mexa em
  `src/` se o usuário pedir mudança de estilo/layout.

## Fluxo padrão quando o usuário manda clipes novos
1. Clipes brutos ficam em `clips/`. Nome recomendado: `<posição>-<texto>.mp4`
   (ex.: `6-nice-grandma.mp4`, `1-fbi-robot.mp4`). Se os nomes não tiverem posição,
   pergunte a ordem ou renomeie conforme o usuário disser.
2. Rode `npm run prep -- --reset` para um vídeo novo (ou `npm run prep` para só adicionar
   clipes). Isso converte para `public/clips/` e preenche `ranking.json` com rank, label e duração.
3. Ajuste o `ranking.json`: título, subtítulo, @, labels com emoji, cortes (`start`/`end`),
   legendas e sons. Para saber o que acontece num clipe, extraia frames com ffmpeg
   (`ffmpeg -ss 2 -i public/clips/x.mp4 -frames:v 1 /tmp/f.jpg`) e olhe a imagem antes de
   decidir onde cortar ou onde colocar legenda.
4. Confira com um frame: `npx remotion still Ranking out/check.png --frame=60`.
5. Renderize: `npm run render` → `out/ranking.mp4`.

## Regras
- Duração ideal: 25–40s no total. Sugira cortes (`start`/`end`) se passar disso.
- O #1 deve ser o melhor momento; o subtítulo costuma provocar ("Last one is amazing 😂😂").
- Legendas: coordenadas `x`,`y` são o centro do texto em px (1080x1920). A lista ocupa
  a faixa x 50–600, y 576–1330; evite cobrir a lista e o rosto/ação do clipe.
- `from`/`to` das legendas são segundos a partir do início DAQUELE clipe (depois do `start`).
- Sons disponíveis em `public/sfx/`: pop, whoosh, ding, boom, riser (.wav).
  Para sons novos com IA: `npm run sfx:ai -- <nome> "<descrição em inglês>" <segundos>`
  (precisa de `ELEVENLABS_API_KEY`). Depois referencie `sfx/<nome>.mp3`.
- Clipes horizontais: use `"fit": "contain"` (mostra inteiro com fundo desfocado).
- Remotion: animações sempre a partir de `useCurrentFrame()`; não use CSS transitions.
  Use as skills `remotion-*` em `.claude/skills/` quando precisar de API do Remotion.
