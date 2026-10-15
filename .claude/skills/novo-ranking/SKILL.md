---
name: novo-ranking
description: Edita um vídeo de ranking como um editor humano — assiste cada clipe, entende o que acontece, escreve labels certos, corta no ritmo, escolhe e sincroniza efeitos sonoros da biblioteca do usuário, renderiza e revisa. Use quando o usuário mandar clipes, pedir um ranking novo ou disser "monta o vídeo".
---

# Editor de ranking

Você é o editor do canal. O objetivo não é "montar rápido": é entregar um vídeo que pareça
editado por uma pessoa com timing de comédia. Siga as etapas na ordem. Não pule a etapa 2.

Antes de começar, leia:
- `notas-do-editor.md` (raiz do projeto) — lições de vídeos anteriores e gosto do usuário. Têm prioridade sobre este guia.
- `references/som.md` — como usar efeitos sonoros (leia sempre).
- `references/labels.md` e `references/ritmo.md` — quando for escrever labels e cortar.

## 1. Preparar
1. Liste `clips/`. Nome esperado `<posição>-<texto>.<ext>`. Se faltar a posição, pergunte a ordem.
2. Pergunte só o que não dá para deduzir (tema do título, idioma, @). Não pergunte o que já foi dito.
3. `npm run prep -- --reset` e `npm run sfx:index`.

## 2. Assistir cada clipe (obrigatório)
1. `npm run analyze`. Para cada clipe abra **todas** as folhas `out/analysis/<clipe>/frames-*.jpg`
   (cada quadro tem o tempo escrito em amarelo), o `spectrum.png` e o `audio.txt`.
2. Escreva `out/analysis/<clipe>/beats.md` com:
   - **Literal**: o que se vê, só ações físicas, com tempos. Ex.: "0.0–1.5 homem de camiseta vinho bate
     com os punhos fechados no vidro do carro; rosto com raiva, dentes cerrados".
     Descreva expressões (raiva, susto, riso) e objetos (vidro, copo, carro).
   - **Som original**: grito, fala, batidas, vidro, motor, silêncio — use os eventos do `audio.txt`.
     Batidas no áudio no mesmo tempo dos golpes na imagem = é soco, não dança.
   - **Payoff**: o segundo exato do momento engraçado/karma (o quadro que faz rir).
   - **Reação**: quando a reação acontece e quando acaba.
   - **Corte sugerido**: `start` (≤1,5s antes da ação) e `end` (0,5–1,2s depois da reação).
3. Se duas leituras forem possíveis (dançando x socando, brincando x brigando), gere uma folha mais
   densa só daquele trecho: `npm run analyze -- clips/x.mp4 --fps 8` e olhe de novo.
   Persistindo a dúvida, pergunte ao usuário ou use um label neutro e literal.

## 3. Decidir
1. **Labels** (`references/labels.md`): 1–3 palavras + 1 emoji, nascem do *payoff* literal.
2. **Cortes** (`references/ritmo.md`): `start`/`end` de cada clipe. Total de 25–40s.
3. **Sons** (`references/som.md`):
   - Leia `public/soundeffects/catalog.md`. Na primeira vez (ou se a biblioteca mudou), olhe também
     `out/sfx-cards/*.png` para entender o formato dos sons. Respeite ⭐, ⛔ e 📝.
   - Use `npm run sfx:find -- <papel ou palavra>` para buscar.
   - Defina `sfx.reveal`, `sfx.transition`, `sfx.final` e 0–2 `sounds` por clipe, alinhados ao payoff
     (`at = momento − pico`).
4. Sem legendas na tela (`captions: []`) — o usuário só quer o texto fixo do ranking.

## 4. Renderizar e revisar
1. `npm run render`.
2. `npm run qa` — corrija TODO problema [ALTO] e o que fizer sentido em [MÉDIO]; renderize de novo.
3. Revisão humana: abra `out/qa/frames.jpg` e `out/qa/spectrum.png` e confira, clipe a clipe,
   se o label bate com a imagem e se cada efeito cai na ação (`out/qa/events.txt`).
4. Só entregue com o QA limpo.

## 5. Entregar
- Diga em poucas linhas: duração, o ranking (label de cada posição) e quais sons usou e onde.
- Para baixar: `npm run baixar` → aba Ports → 8080 → globo.
- Peça a opinião. Se o usuário der feedback, use a skill `/feedback`.
