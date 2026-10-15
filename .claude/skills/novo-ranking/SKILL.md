---
name: novo-ranking
description: Monta e renderiza um vídeo de ranking a partir dos clipes em clips/. Use quando o usuário pedir um ranking novo, mandar clipes novos ou disser "monta o vídeo".
---

# Novo vídeo de ranking

Siga o CLAUDE.md do projeto. Passo a passo:

1. Liste `clips/`. Se faltar a posição no nome dos arquivos, pergunte a ordem (ou use o que o
   usuário já disse) e renomeie para `<posição>-<texto>.<ext>`.
2. Pergunte só o que não dá para deduzir: tema do título (ex.: "Funniest Robot Moments"),
   idioma e @ do canal. Se o usuário já falou, não pergunte.
3. Rode `npm run prep -- --reset` e `npm run sfx:index`. Leia `public/soundeffects/catalog.json`.
4. Para cada clipe, gere uma folha de frames a 4 fps e olhe. Anote:
   - um label curto e engraçado (2–3 palavras + 1 emoji), no idioma do vídeo;
   - `start`/`end` para cortar enrolação (vídeo total de 25–40s);
   - os segundos exatos das ações (queda, pancada, susto, reação).
5. Escolha os sons da biblioteca do usuário:
   - `sfx.reveal`, `sfx.transition` e `sfx.final` (sons fixos do ranking);
   - 1–3 `sounds` por clipe nos momentos de ação, com `at = momento - peakAt`.
   NÃO adicione legendas (`captions` fica vazio) — o usuário só quer o texto fixo do ranking.
6. Atualize `ranking.json` (título em 2 linhas, palavra-chave em `[x](red)` e `[y](blue)`).
7. `npm run render`. Informe a duração, o ranking final e quais sons usou em cada clipe.
8. Diga para baixar com `npm run baixar` (aba Ports → porta 8080 → globo) ou
   botão direito em `out/ranking.mp4` → Download.
