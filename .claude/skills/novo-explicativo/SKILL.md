---
name: novo-explicativo
description: Cria um vídeo educativo vertical (Shorts/TikTok/Reels) no estilo 3D clean do canal Scientia, completo e pronto para postar — pesquisa o assunto, escreve o roteiro, gera a narração, monta as cenas 3D com Remotion + Three.js, gera 2 thumbnails, renderiza e revisa. Use quando o usuário pedir um vídeo explicando um assunto ("explica a 6x1", "faz um vídeo sobre…") ou disser "/novo-explicativo".
---

# Vídeo explicativo 3D

**Entrega completa, sem o usuário pedir:** `out/<slug>.mp4` (já termina com o encerramento da marca) +
`thumbs/<slug>-1.png` e `-2.png` + `out/<slug>-legenda.txt` (legenda do post com fontes e hashtags).
No PC do usuário o `npm run explicar` também copia tudo para o Google Drive
(`G:\Meu Drive\Scientia\Posts\<data> · <slug> · <título>\`: video.mp4, thumb-1/2.png, legenda.txt, fontes.txt).
Se aparecer "Não achei o Drive", mostre ao usuário os comandos de montagem que o script imprime.
O usuário só digita o tema; não pare no meio para perguntar o que dá para decidir sozinho.

**REFERÊNCIA DE QUALIDADE (decisão do usuário, 16/10/2026): o vídeo do cartão por aproximação.**
`videos/aproximacao/roteiro.json` + `src/explicativo/videos/Aproximacao.tsx`. Leia os dois ANTES de
começar e copie a receita de `references/referencia.md`. Os vídeos feitos no "padrão Ludificando"
(fundo cinza com prateleiras, desfoque, muitos bonecos, 80–90 s) foram REPROVADOS — não volte a eles.
Depois leia `references/ganchos.md` (antes do roteiro) e `references/estilo.md` + `references/biblioteca.md`
(antes das cenas). `references/ludificando.md` é só fonte de ideias, não é regra.

## 1. Pesquisar (obrigatório)
- Tudo que é atual (lei, número, cargo, prazo) vem de busca na web feita AGORA, em 2+ fontes
  confiáveis (Agência Brasil, Senado/Câmara, IBGE, g1, Folha…). Nada de número de memória.
- Anote as fontes em `fontes` no roteiro. Se as fontes discordam, use a mais oficial e diga isso.
- Separe o que é fato do que é projeção/opinião ("o Dieese calcula…", "a CNI diz…").

## 2. Roteiro → `videos/<slug>/roteiro.json`
**Receita da aproximação:** ~60 s, **7 cenas**, 18–30 palavras por cena (~170–190 palavras no total),
UMA ideia por cena, explicação em sequência lógica (cada cena puxa a próxima: "Por isso…", "Aí…",
"Se alguém…"). `chip` = nome curto do capítulo em maiúsculas ("A ENERGIA", "BEM PERTO", "E SE COPIAREM?").
- Gancho = número forte + pergunta ("Três em cada quatro compras… Mas como um cartão sem bateria consegue
  pagar alguma coisa?"). Última cena = a informação prática que a pessoa leva (ex.: o limite sem senha).
- "Os dois lados" e "cuidado/golpe" só entram se o tema PEDIR (polêmica real, golpe real) — não são obrigatórios.
- 1ª frase = o gancho, **SEMPRE uma pergunta** (regra do usuário) que a pessoa quer ver respondida, com o
  fato forte dentro ou logo depois. Ex.: "Como um cartão sem bateria consegue pagar?". Nada de "olá".
- Frases curtas, como se falasse com um amigo. Número escrito com dígitos ("75 votos").
- `pronuncia` para o que a voz pode ler errado (siglas, "6x1", decimais "26,8").
- Última cena: **FECHO** — a informação prática final / resposta da pergunta do gancho.
  **Proibido (regra do usuário): pedir comentário, like, "salva", "segue", "comenta X que eu te mando…"**
  — nem na fala nem na tela. As fontes ficam só na descrição do post. Depois da última fala vem só o
  encerramento da marca (automático).
- Frases de 6–14 palavras, ditas com calma (a narração é frase a frase, com pausa em cada vírgula e ponto).
- NÃO existe mais `cta` no roteiro: o encerramento mostra só a marca.
- `sons`: o padrão faz sozinho impacto no 1º frame, swoosh/whoosh nas trocas de cena, "pop" no cartão de
  número, "tick" em anotações/pílulas e uma subida entrando no encerramento. **Sem trilha de fundo** (a
  referência não tem; só ligue com `"musica": "sfx/bed-scientia.mp3"` se o usuário pedir).
  Escreva 2–3 `acentos` nas palavras-chave (com moderação):
  `"sons": {"acentos": [{"palavra": "75", "cena": "aprovado", "som": "sfx/ding.wav", "volume": 0.5},
  {"palavra": "desliga", "cena": "liga", "som": "sfx/boom.wav", "volume": 0.5},
  {"palavra": "relógio", "cena": "agora", "som": "sfx/riser.wav", "pico": 1.49, "volume": 0.35}]}`.
  Sons prontos em `public/sfx/`: boom (choque), ding (número/revelação), pop (estalo), riser (suspense,
  use `pico`), whoosh/swoosh. A palavra é a que está escrita na `fala` (não a da `pronuncia`).
  Pode trocar qualquer som pelo da biblioteca do usuário (`public/soundeffects/catalog.md`) — `musica`,
  `transicao` (lista alterna), `aparecer`, `dado`, `abertura`, `final`; `null` desliga.
- `composicao` = nome do componente (ex.: `Escala6x1`).
- `marca` = `"SCIENTIA · <tema curto>"` (o canal se chama Scientia).
- `voz` = `{ "principal": "masculina", "alternar": "nao" }` — NÃO ponha `velocidade` no roteiro (vem do `voz.json`, hoje 1.08).
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
- **Motor do canal: ElevenLabs** (o usuário assinou o Starter em 16/10/2026; vozes no `voz.json`).
  O narrar manda a CENA INTEIRA por chamada com o texto das cenas vizinhas (previous/next_text), velocidade
  nativa e números por extenso com gênero ("1 folga" → "uma folga", "R$ 50 mil" → "cinquenta mil reais").
  Pode escrever números com dígitos na `fala` (a legenda mostra dígitos; a voz fala por extenso). Quando o
  número se refere a um substantivo que não vem logo depois ("passam a ser 2, e…"), escreva por extenso.
- `"principal": "masculina"` — padrão. Só use feminina se o usuário pedir. Nunca vozes "Multilingual" da Microsoft.
- `"alternar": "cenas"` — as cenas se revezam entre as duas vozes (dupla). Padrão: `"nao"`.
- Se o usuário reclamar da voz: mostre `npm run vozes` (Microsoft) / `npm run vozes -- eleven` e
  `npm run vozes -- usar <id> feminina|masculina`.
- Escreva a fala para o OUVIDO — é o que mais muda a entonação da voz sintética:
  - frases curtas (6–14 palavras), vírgulas onde se respira, nada de parênteses ou siglas sem `pronuncia`;
  - pergunta retórica a cada 2–3 cenas ("E quem já pagou?") — a voz sobe no "?" e ganha vida;
  - contraste e virada: "Só que…", "Mas atenção:", "E tem mais:";
  - número importante sozinho no fim da frase ("Foram 75 votos a 1.") ou repetido ("Onze dias!");
  - evite frases longas cheias de vírgulas e listas de 4+ itens (a voz fica monótona).
- Com a Microsoft (motor edge) a narração é frase a frase como na referência; com o ElevenLabs é por cena
  (mais humano). Em ambos há 0,45 s de respiro entre cenas.
- Para testar a voz local mais expressiva (Chatterbox na GPU do usuário): `npm run vozes -- comparar <slug>`.

## 4. Cenas → `src/explicativo/videos/<Nome>.tsx`
- Copie a estrutura do `Escala6x1.tsx`: um componente por cena, `CENAS_<NOME>` e, no fim do arquivo,
  `export const VIDEO = { id: "<Nome>", roteiro: roteiro as Roteiro, cenas: CENAS_<NOME> };`
  (com `import roteiro from "../../../videos/<slug>/roteiro.json"`). O vídeo se registra sozinho:
  **NÃO edite `Composicoes.tsx`** (editar ele causa conflito no `git pull`).
- Ao terminar o vídeo, salve no GitHub: `git add videos/<slug> src/explicativo/videos/<Nome>.tsx` +
  commit + push (assim o próximo `git pull` do usuário não trava).
- **Objeto-herói (como a maquininha + cartão):** UM ou dois objetos do tema, bem feitos e GRANDES, que
  aparecem em quase todas as cenas; cada cena mostra uma parte/estado deles (campo acendendo, código na
  tela, chave saindo). Boneco só como coadjuvante (0–1 por cena, nunca o centro).
- **Vídeo real** (notícia, lançamento, produto): se houver clipes em `public/explicativo/<slug>/clipes/`,
  abra com `VideoTelaCheia` (2–3 s) ou mostre num `TelaVideo` dentro do 3D, sempre com crédito; depois
  explique em 3D. Liste os clipes usados em `"clipes"` no roteiro. Ver `references/biblioteca.md`.
- O kit (`three/Kit.tsx`, `ui/Kit.tsx`) é opcional: use uma peça só quando a cena pedir (ex.: `Hemiciclo`
  numa votação). Não encha a cena de pílulas/réguas.
- Para cada cena, escolha UMA metáfora visual do dado (ver `references/estilo.md`):
  votos → cadeiras acendendo; horas → cubos sumindo; pessoas → bonecos (1 boneco = X); dinheiro →
  moedas/holerite; prazo → placas numa linha do tempo; regra/lei → papel + checklist.
- Sincronize com a fala: `w("palavra")` devolve o frame em que a palavra é dita. O visual muda NA
  palavra (ex.: o número do cartão troca quando a voz diz o número).
- Câmera: `cam(pos, look)` interpolando posição inicial → final durante a cena (`ease(f, 0, dur)`).
- Cenário: o `Stage` já vem no modo escuro (fundo grafite quente, poeira) com **brilho neon** ligado
  (bloom: branco e cor de destaque soltam halo; `C.accent` sempre acesa). Use `glow` (0.3–0.8) no que é o
  foco da cena para ele brilhar mais. NÃO use `cenario="estudio"` nem `desfoque` sem o usuário pedir.
- Câmera: distância 6–8 do objeto, olhando para y ≈ 1; aproximação lenta de 10–15 % na cena (como na Aproximacao.tsx).
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
