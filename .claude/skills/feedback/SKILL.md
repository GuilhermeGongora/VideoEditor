---
name: feedback
description: Aplica o feedback do usuário sobre um vídeo de ranking já renderizado (sons, labels, cortes, ritmo), renderiza de novo e grava a lição em notas-do-editor.md para os próximos vídeos. Use quando o usuário comentar o resultado de um vídeo ou disser "/feedback".
---

# Feedback do usuário → correção + aprendizado

1. **Entenda cada ponto** do feedback. Para cada um, localize no vídeo: `npm run qa` e olhe
   `out/qa/frames.jpg`, `out/qa/events.txt` e os `beats.md` dos clipes. Confirme que você vê o
   mesmo problema que o usuário viu. Se não estiver claro qual trecho ele quer dizer, pergunte.
2. **Corrija** no `ranking.json` (labels, `start`/`end`, `sounds`, `sfx`, volumes). Siga a skill
   `novo-ranking` e as referências dela.
3. **Sons que o usuário comentou**: atualize `public/soundeffects/preferences.json`
   - gostou → `favorites`; não quer mais → `banned`;
   - disse o que o som é ("isso é um tapa, não soco") → `notes[<caminho original>]`.
   Depois rode `npm run sfx:index` para o catálogo refletir.
4. `npm run render` e `npm run qa` (sem [ALTO]).
5. **Grave a lição** em `notas-do-editor.md`, seção "Lições", com a data:
   - Escreva a regra geral, não só o caso. Ex.: "Antes de nomear um clipe de briga, confirmar com
     frames a 8 fps; batidas no áudio sincronizadas com golpes = soco (caso: 'dance battle')".
   - Se o usuário expressou gosto (tamanho de texto, tipo de som, ritmo), registre em "Gosto do usuário".
   - Atualize "Sons usados recentemente" com os acentos deste vídeo (mantenha só os 3 últimos vídeos).
6. Responda curto: o que mudou e a lição registrada.
