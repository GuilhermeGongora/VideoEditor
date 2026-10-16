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

Estilo: fundo escuro, bonecos-manequim e objetos simples em 3D, tudo cinza/branco com UMA cor de
destaque (`C.accent`), poeira no ar, câmera sempre se mexendo devagar, legenda karaokê, cartões de
dado e anotações com fonte. Exemplo pronto: `videos/6x1/roteiro.json` + `src/explicativo/videos/Escala6x1.tsx`.
**Régua de qualidade: `references/ludificando.md`** (estrutura de capítulos, cenário-herói, HUD que
atravessa o vídeo, os dois lados, cuidado/golpe, números medidos). Leia ANTES de tudo.
Depois `references/ganchos.md` (antes do roteiro) e `references/estilo.md` + `references/biblioteca.md`
(antes das cenas).

## 1. Pesquisar (obrigatório)
- Tudo que é atual (lei, número, cargo, prazo) vem de busca na web feita AGORA, em 2+ fontes
  confiáveis (Agência Brasil, Senado/Câmara, IBGE, g1, Folha…). Nada de número de memória.
- Anote as fontes em `fontes` no roteiro. Se as fontes discordam, use a mais oficial e diga isso.
- Separe o que é fato do que é projeção/opinião ("o Dieese calcula…", "a CNI diz…").

## 2. Roteiro → `videos/<slug>/roteiro.json`
**Ritmo de vídeo viral (referência: Ludificando):** a voz quase nunca para (≥ 90% do tempo com fala ou
som), o gancho vem nos 2 primeiros segundos e a resposta da pergunta do título só no fim.
- **75–90 s, 9–11 cenas** (padrão Ludificando), UMA ideia por cena, cenas de 5–9 s. `chip` = nome curto
  do capítulo em maiúsculas. Siga a estrutura de capítulos de `references/ludificando.md`
  (gancho → hoje → o que muda → quando → exceções → os dois lados → o que falta → cuidado → sua vez),
  adaptando ao tema (assunto de ciência/tecnologia troca "os dois lados"/"votação" por "mito × fato",
  "por dentro", "na prática").
- 1ª frase = o gancho, **SEMPRE uma pergunta** (regra do usuário) que a pessoa quer ver respondida, com o
  fato forte dentro ou logo depois. Ex.: "Como um cartão sem bateria consegue pagar?". Nada de "olá".
- Frases curtas, como se falasse com um amigo. Número escrito com dígitos ("75 votos").
- `pronuncia` para o que a voz pode ler errado (siglas, "6x1", decimais "26,8").
- Penúltima cena: **CUIDADO** (golpe, fake news ou erro comum ligado ao tema), quando fizer sentido.
- Última cena: **SUA VEZ** — uma pergunta para o público responder nos comentários + o CTA falado
  ("Comenta X que eu te mando as fontes" / "Salva pra conferir depois").
- 1ª cena com no máximo ~3 s de fala. Pergunta retórica a cada 2–3 cenas ("E quem já pagou?"). Frases de 6–14 palavras, emendadas
  ("Mas calma:", "E tem mais:", "Só que…") para a narração fluir sem pausas longas.
- `cta` = chamada curta que aparece no encerramento, de preferência pedindo COMENTÁRIO
  (ex.: "comenta PIX que eu te mando as fontes", "segue pra saber quando muda").
- `sons`: o padrão já faz sozinho trilha (abaixa sob a voz), impacto no 1º frame, swoosh/whoosh
  alternados nas trocas de cena, "pop" quando o cartão de número aparece, "tick" em anotações/pílulas e
  uma subida (riser) entrando no encerramento. **Sempre escreva 2–4 `acentos`** nas palavras-chave:
  `"sons": {"acentos": [{"palavra": "75", "cena": "aprovado", "som": "sfx/ding.wav", "volume": 0.5},
  {"palavra": "desliga", "cena": "liga", "som": "sfx/boom.wav", "volume": 0.5},
  {"palavra": "relógio", "cena": "agora", "som": "sfx/riser.wav", "pico": 1.49, "volume": 0.35}]}`.
  Sons prontos em `public/sfx/`: boom (choque), ding (número/revelação), pop (estalo), riser (suspense,
  use `pico`), whoosh/swoosh. A palavra é a que está escrita na `fala` (não a da `pronuncia`).
  Pode trocar qualquer som pelo da biblioteca do usuário (`public/soundeffects/catalog.md`) — `musica`,
  `transicao` (lista alterna), `aparecer`, `dado`, `abertura`, `final`; `null` desliga.
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
- `"principal": "masculina"` — **sempre**. A voz aprovada do canal é o Antonio (Microsoft), a dos
  vídeos 6x1 e aproximação. A feminina Thalita Multilingual soou como português de Portugal (vídeo da
  urna) e foi tirada. Nunca use vozes "Multilingual". Só use feminina se o usuário pedir.
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
- **Cenário-herói:** escolha UM conjunto de objetos que representa o tema (a mesa com botões, a esteira,
  o caderninho, a máquina de lavar) e faça a maioria das cenas como variações dele (câmera perto de uma
  parte, um item acende). A última cena volta ao enquadramento da primeira.
- **HUD contínuo:** o cartão de número principal e a régua `<Etapas>` aparecem em várias cenas na MESMA
  posição; a partir da 2ª aparição use `DataCard fixo` / `Etapas at={0}` para não "pular" de novo.
- Use o kit pronto (`three/Kit.tsx`, `ui/Kit.tsx`, ver `references/biblioteca.md`): `Pergunta` no gancho,
  `Contexto` (pílulas empilhando), `Etapas`, `Balanca` nos dois lados, `Hemiciclo` em votação,
  `Celular` no cuidado, `AnelPrazo` em prazos.
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
