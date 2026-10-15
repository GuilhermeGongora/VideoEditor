---
name: novo-explicativo
description: Cria um vídeo educativo vertical (Shorts/TikTok/Reels) no estilo 3D clean do canal — pesquisa o assunto, escreve o roteiro, gera a narração, monta as cenas 3D com Remotion + Three.js, renderiza e revisa. Use quando o usuário pedir um vídeo explicando um assunto ("explica a 6x1", "faz um vídeo sobre…") ou disser "/novo-explicativo".
---

# Vídeo explicativo 3D

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
- 45–60 s, 5–7 cenas, UMA ideia por cena. `chip` = nome curto do capítulo em maiúsculas.
- 1ª frase = o gancho (a notícia ou o número mais forte). Nada de "olá, hoje vamos falar".
- Frases curtas, como se falasse com um amigo. Número escrito com dígitos ("75 votos").
- `pronuncia` para o que a voz pode ler errado (siglas, "6x1", decimais "26,8").
- Última cena: o que acontece agora / o que a pessoa deve saber. Sem pedir like.
- `composicao` = nome do componente (ex.: `Escala6x1`).

## 3. Narração
`npm run narrar -- <slug>` → `public/explicativo/<slug>/narracao.wav` + `tempos.json` (tempo de cada
palavra). Usa a voz neural do edge-tts (precisa de internet) e cai para a voz local Kokoro se não der.
Se o usuário quiser outra voz, troque `voz.edge` (ex.: `pt-BR-FranciscaNeural`, `pt-BR-ThalitaMultilingualNeural`).

## 4. Cenas → `src/explicativo/videos/<Nome>.tsx`
- Copie a estrutura do `Escala6x1.tsx`: um componente por cena, exporte `CENAS_<NOME>` e registre em
  `src/explicativo/Composicoes.tsx` (import do roteiro + cenas).
- Para cada cena, escolha UMA metáfora visual do dado (ver `references/estilo.md`):
  votos → cadeiras acendendo; horas → cubos sumindo; pessoas → bonecos (1 boneco = X); dinheiro →
  moedas/holerite; prazo → placas numa linha do tempo; regra/lei → papel + checklist.
- Sincronize com a fala: `w("palavra")` devolve o frame em que a palavra é dita. O visual muda NA
  palavra (ex.: o número do cartão troca quando a voz diz o número).
- Câmera: `cam(pos, look)` interpolando posição inicial → final durante a cena (`ease(f, 0, dur)`).
- Conteúdo na faixa central da tela (y ≈ 450–1250 px). Topo = marca/chip/cartão; 1300+ = legenda e
  botões do TikTok. Nada importante na borda direita (ícones do app).
- Anote fontes de números em `Callout` (`sub="FONTE: …"`).

## 5. Conferir quadros
`npm run quadros -- <slug>` → `out/quadros/<slug>/grade.jpg` (um quadro do fim de cada cena).
OLHE a grade. Confira: nada cortado ou atrás da legenda; texto legível; objeto principal grande o
bastante; nada sobreposto ao cartão/chip; o visual bate com a frase. Ajuste câmera/escala e repita.

## 6. Renderizar e entregar
`npm run explicar -- <slug>` → `out/<slug>.mp4` (3D renderiza sem GPU: ~6–10 min por minuto de vídeo
no Codespace). Assista 3–4 quadros do mp4 final, confira o fim do áudio, e entregue com as fontes.
Peça a opinião do usuário e registre o que ele achar em `notas-do-editor.md` (seção "Explicativos").
