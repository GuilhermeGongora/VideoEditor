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
3. Rode `npm run prep -- --reset`.
4. Para cada clipe, extraia 3–4 frames (início, meio, fim) e olhe. Use isso para:
   - escrever um label curto e engraçado (2–3 palavras + 1 emoji), no idioma do vídeo;
   - sugerir `start`/`end` para cortar enrolação (vídeo total de 25–40s);
   - colocar 0–1 legenda por clipe onde ajuda o timing ("Wait for it… 😏" antes do momento
     engraçado, valor/prejuízo em `pop` no impacto), com `sfx` adequado.
5. Atualize `ranking.json` (título em 2 linhas, palavra-chave em `[x](red)` e `[y](blue)`).
6. Gere um still do momento de cada legenda para conferir posição; corrija se cobrir a lista.
7. `npm run render` e informe o caminho `out/ranking.mp4`, a duração e um resumo do ranking.
