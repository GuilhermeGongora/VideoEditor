---
name: novo-explicativo
description: Cria um vídeo educativo vertical (Shorts/TikTok/Reels) no estilo 3D clean do canal Scientia, completo e pronto para postar — pesquisa o assunto, escreve o roteiro, gera a narração, monta as cenas 3D com Remotion + Three.js, gera 2 thumbnails, renderiza e revisa. Use quando o usuário pedir um vídeo explicando um assunto ("explica a 6x1", "faz um vídeo sobre…") ou disser "/novo-explicativo".
---

# Vídeo explicativo 3D

**Entrega completa, sem o usuário pedir:** `out/<slug>.mp4` (já termina com o encerramento da marca) +
`thumbs/<slug>-1.png` e `-2.png` + `out/<slug>-legenda.txt` (legenda do post com fontes e hashtags).
O usuário só digita o tema; não pare no meio para perguntar o que dá para decidir sozinho.

Estilo: fundo escuro, bonecos-manequim e objetos simples em 3D, tudo cinza/branco com UMA cor de
destaque (`C.accent`), poeira no ar, câmera sempre se mexendo devagar, legenda karaokê, cartões de
dado e anotações com fonte. Exemplo pronto: `videos/6x1/roteiro.json` + `src/explicativo/videos/Escala6x1.tsx`.
Leia `references/estilo.md` e `references/biblioteca.md` antes de montar as cenas.

## 1. Pesquisar (obrigatório)
- Tudo que é atual (lei, número, cargo, prazo) vem de busca na web feita AGORA, em 2+ fontes
  confiáveis (Agência Brasil, Senado/Câmara, IBGE, g1, Folha…). Nada de número de memória.
- Anote as fontes em `fontes` no roteiro. Se as fontes discordam, use a mais oficial e diga isso.
- Separe o que é fato do que é projeção/opinião ("o Dieese calcula…", "a CNI diz…").

## 2. Roteiro → `videos/<slug>/roteiro.json`
**Ritmo de vídeo viral (referência: Ludificando):** a voz quase nunca para (≥ 90% do tempo com fala ou
som), o gancho vem nos 2 primeiros segundos e a resposta da pergunta do título só no fim.
- 45–60 s, 5–7 cenas, UMA ideia por cena. `chip` = nome curto do capítulo em maiúsculas.
- 1ª frase = o gancho (a notícia ou o número mais forte). Nada de "olá, hoje vamos falar".
- Frases curtas, como se falasse com um amigo. Número escrito com dígitos ("75 votos").
- `pronuncia` para o que a voz pode ler errado (siglas, "6x1", decimais "26,8").
- Última cena: o que acontece agora / o que a pessoa deve saber. Sem pedir like.
- 1ª cena com no máximo ~3 s de fala. Cenas de 4–8 s. Frases de 6–14 palavras, emendadas
  ("Mas calma:", "E tem mais:", "Só que…") para a narração fluir sem pausas longas.
- `cta` = chamada curta que aparece no encerramento, de preferência pedindo COMENTÁRIO
  (ex.: "comenta PIX que eu te mando as fontes", "segue pra saber quando muda").
- `sons` (opcional, recomendado se o usuário tem biblioteca): escolha no `public/soundeffects/catalog.md`
  `{"musica": "<src papel music, calmo e contínuo>", "musicaVolume": 0.5, "aparecer": "<src papel pop/click curto>",
  "transicao": "<src papel whoosh suave>"}`. Sem isso, usa a trilha e os efeitos padrão do Scientia.
  A trilha abaixa sozinha enquanto a voz fala; cartões, anotações e pílulas fazem "tick" ao aparecer.
- `composicao` = nome do componente (ex.: `Escala6x1`).
- `marca` = `"SCIENTIA · <tema curto>"` (o canal se chama Scientia).
- `voz` = `{ "principal": "...", "alternar": "nao", "velocidade": 1.05 }` (ver passo 3).
- `post` = legenda do Instagram/TikTok (vira `out/<slug>-legenda.txt`):
  `{ "gancho": "<fato forte + pergunta> 📌", "pontos": [3 frases curtas, sem ponto final, com números],
  "fontes": ["Agência Senado", "IBGE", …só os nomes], "hashtags": ["tema", "assunto", …até 5, sem #] }`
  (`#scientia` entra sozinha). Mesmo tom do vídeo: o que muda pra pessoa, sem opinião. Um emoji no máximo.
- `thumb` = capa do vídeo (ver passo 6): `{ "titulos": [2 opções], "cena": "<id da cena de fundo>", "quadro": <frame da cena>, "descer": 330, "zoom": 1.45 }`.

## 3. Narração
`npm run narrar -- <slug>` → `public/explicativo/<slug>/narracao.wav` + `tempos.json` (tempo de cada
palavra, vindo da própria voz). Voz neural do edge-tts (internet); sem internet cai na voz local Kokoro.
A VOZ DO CANAL fica em `voz.json` (motor, vozes escolhidas pelo usuário, velocidade). **Nunca escolha
ou troque vozes, motor ou IDs por conta própria** — isso é gosto do usuário. No roteiro, o campo `voz`
só define:
- `"principal": "feminina" | "masculina"` — **alterne entre vídeos**: olhe o `roteiro.json` mais recente
  em `videos/` e use o gênero oposto ao dele.
- `"alternar": "cenas"` — as cenas se revezam entre as duas vozes (dupla). Padrão: `"nao"`.
- Se o usuário reclamar da voz: mostre `npm run vozes` (Microsoft) / `npm run vozes -- eleven` e
  `npm run vozes -- usar <id> feminina|masculina`.
- Escreva a fala para o OUVIDO: frases curtas, vírgulas onde se respira, nada de parênteses ou siglas
  sem `pronuncia`.

## 4. Cenas → `src/explicativo/videos/<Nome>.tsx`
- Copie a estrutura do `Escala6x1.tsx`: um componente por cena, `CENAS_<NOME>` e, no fim do arquivo,
  `export const VIDEO = { id: "<Nome>", roteiro: roteiro as Roteiro, cenas: CENAS_<NOME> };`
  (com `import roteiro from "../../../videos/<slug>/roteiro.json"`). O vídeo se registra sozinho:
  **NÃO edite `Composicoes.tsx`** (editar ele causa conflito no `git pull`).
- Ao terminar o vídeo, salve no GitHub: `git add videos/<slug> src/explicativo/videos/<Nome>.tsx` +
  commit + push (assim o próximo `git pull` do usuário não trava).
- Para cada cena, escolha UMA metáfora visual do dado (ver `references/estilo.md`):
  votos → cadeiras acendendo; horas → cubos sumindo; pessoas → bonecos (1 boneco = X); dinheiro →
  moedas/holerite; prazo → placas numa linha do tempo; regra/lei → papel + checklist.
- Sincronize com a fala: `w("palavra")` devolve o frame em que a palavra é dita. O visual muda NA
  palavra (ex.: o número do cartão troca quando a voz diz o número).
- Câmera: `cam(pos, look)` interpolando posição inicial → final durante a cena (`ease(f, 0, dur)`).
- Cenário: o `Stage` já vem no modo estúdio (cinza quente, parede com prateleiras). Use
  `cenario="escuro"` só em cena dramática pontual.
- Enquadramento: o objeto principal ocupa 40–70% da largura. **Nunca** quadro vazio, objeto minúsculo
  (linha fina) ou um bloco que toma a tela inteira sem referência. Escala sempre com referência humana
  (boneco ao lado) ou objeto conhecido.
- Monte objetos do tema com formas simples (livro = caixas finas, cofre = caixa + cilindro, celular =
  caixa arredondada com tela escura, balança = cilindros) — contexto concreto prende mais que blocos abstratos.
- Conteúdo na faixa central da tela (y ≈ 450–1250 px). Topo = marca/chip/cartão; 1300+ = legenda e
  botões do TikTok. Nada importante na borda direita (ícones do app).
- Anote fontes de números em `Callout` (`sub="FONTE: …"`).

## 5. Conferir quadros
`npm run quadros -- <slug>` → `out/quadros/<slug>/grade.jpg` (um quadro do fim de cada cena).
OLHE a grade. Confira: nada cortado ou atrás da legenda; texto legível; objeto principal grande o
bastante; nada sobreposto ao cartão/chip; o visual bate com a frase. Ajuste câmera/escala e repita.

## 6. Thumbnail (capa)
Escreva 2 títulos em `thumb.titulos` (linhas com `\n`, destaque entre `*asteriscos*`):
- 3 linhas, no máximo ~16 caracteres por linha; a última linha é a pergunta/curiosidade em destaque.
- Um com o fato/número forte ("75 votos a 1."), outro com a pergunta que a pessoa tem ("*Quando muda?*").
- Verdadeiro: nada de prometer o que o vídeo não mostra.
- Fundo: a cena mais bonita/legível (`cena` + `quadro` em que ela já está montada).
`npm run thumb -- <slug>` → `thumbs/<slug>-1.png`, `-2.png`. OLHE as duas antes de entregar.

## 7. Renderizar e entregar
`npm run explicar -- <slug>` → `out/<slug>.mp4` + thumbs (3D renderiza sem GPU: ~6–10 min por minuto de vídeo
no Codespace). Assista 3–4 quadros do mp4 final, confira o fim do áudio, e entregue com as fontes.
Mostre ao usuário: o vídeo, as 2 thumbs (diga qual você postaria e por quê) e cole a legenda do
`out/<slug>-legenda.txt` pronta para copiar. Peça a opinião e registre o que ele achar em `notas-do-editor.md` (seção "Explicativos").
