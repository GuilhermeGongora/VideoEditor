# Ranking Video — instruções para o Claude

Este projeto gera vídeos verticais (1080x1920, 30fps) no estilo "Ranking Funniest X Moments"
para TikTok/Shorts/Reels, com Remotion. Responda sempre em português do Brasil.

## Antes de qualquer edição
- Para montar um vídeo use a skill **`/novo-ranking`** (fluxo completo de editor: assistir clipes,
  labels, cortes, sons, render e QA). Para comentários do usuário sobre um vídeo, use **`/feedback`**.
- Leia `notas-do-editor.md`: gosto do usuário e lições de vídeos anteriores. Têm prioridade.

## Como o vídeo funciona
- Barra preta no topo com título em 2 linhas (cores via `[texto](cor)`; o tamanho se ajusta sozinho
  para caber), subtítulo e @ do canal.
- Lista de posições na esquerda (1 dourado, 2 azul, 3 vermelho, demais brancos); labels longos encolhem.
- Os clipes passam do último lugar até o #1. Cada item "pula" na lista com `sfx.reveal`; troca de
  clipe tem `sfx.transition`; o #1 entra com `sfx.final`.
- TUDO é controlado pelo `ranking.json` (local, fora do Git; o modelo é `ranking.example.json`).
  Só mexa em `src/` se o usuário pedir mudança de estilo/layout.
- Só texto fixo na tela: `captions: []` em todos os itens, a menos que o usuário peça legenda.

## Campos de som no ranking.json
- `sfx`: `{ reveal, transition, final, volume }` — sons estruturais.
- `items[].sounds`: `[{ src, at, volume, maxSeconds, duck, duckSeconds }]` — acentos dentro do clipe.
  `at` = segundo em que o som começa, contado do início do clipe já cortado (depois do `start`).
  `duck` (0–1) abaixa o áudio do clipe enquanto o som toca.
- `items[].volume`: áudio original do clipe (padrão 1; não deixe mudo).
- `endFadeSeconds` (padrão 0.4): fade de todo o áudio no fim.
- Use sempre o `src` do catálogo (`soundeffects/_norm/...`, versões normalizadas).

## Comandos
| Comando | Para quê |
|---|---|
| `npm run prep -- --reset` | Converte `clips/` e recria a lista do `ranking.json` |
| `npm run analyze [-- clips/x.mp4 --fps 8]` | Folhas de frames com tempo + análise de áudio em `out/analysis/` |
| `npm run sfx:index` | Cataloga e normaliza `public/soundeffects/` → `catalog.md` + `out/sfx-cards/` |
| `npm run sfx:find -- <papel/palavra> [--max 1]` | Busca sons |
| `npm run render` | Renderiza `out/ranking.mp4` |
| `npm run qa` | Revisão automática do vídeo → `out/qa/report.md` |
| `npm run baixar` / `npm run sons` | Painel (porta 8080): baixar vídeos / ouvir e classificar sons |

## Regras técnicas
- Remotion: animações sempre a partir de `useCurrentFrame()`; não use CSS transitions.
  Use as skills `remotion-*` em `.claude/skills/` quando precisar de API do Remotion.
- Clipes horizontais: `"fit": "contain"`.
