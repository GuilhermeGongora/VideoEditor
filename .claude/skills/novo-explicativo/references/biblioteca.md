# Biblioteca (src/explicativo/)

## 3D — `three/`
- `Stage({cam, children, dust?})`: palco com luz, chão, sombra, névoa e poeira. Um por cena.
- `Cam = {pos, look, fov?}` (fov padrão 40 nas cenas). Vertical: largura visível ≈ 0,41 × distância.
- `Mannequin({pose, look, position, rotationY, scale, opacity})` — altura 1,75, origem nos pés,
  olha para +Z (câmera fica em +Z). `look`: "white" | "gray" | "dark" | "accent".
  Poses: `idlePose(frame, seed)`, `walkPose(fase)` ou um objeto `Pose` (ombros, cotovelos, quadril,
  joelhos, cabeça, inclinação — em radianos).
- `RoundBox({size, radius, position, rotation, scale, color, glow, opacity})` — cubos, blocos, barras, placas.
- `Pill`, `DashedRing({radius, progress})`, `Coins({count})`, `Paper({lines, highlight, highlightGlow})`, `Stall`.
- Formas novas: use malhas do Three (`boxGeometry`, `cylinderGeometry`, `torusGeometry`…) com o
  material `Mat`. Animação SÓ via `useCurrentFrame()` (nunca `useFrame`).

## Kit estilo Ludificando — `three/Kit.tsx`
- `Hemiciclo({f, total, acesas, at, duracao?, position?, scale?, raio?})` — plenário (513 Câmara / 81 Senado)
  que acende do centro para as pontas até `acesas`. Fica melhor com câmera alta e `cenario="escuro"`.
- `Balanca({inclina, esquerda, direita, position?, scale?})` — "os dois lados"; `inclina` −1…1
  (use `pender(f, de, ate, alvo)` para pender aos poucos); `esquerda`/`direita` = o que vai no prato.
- `Pessoinha({position, color?, glow?, scale?})` — bonequinho leve (pratos, filas, famílias).
- `PilhaMoedas({n, position?})` — peso do "custo".
- `Celular({f, mensagens: [frames], alerta?, position?, rotation?, scale?})` — balões de conversa e borda
  acesa (golpe, fake news, notificação).
- `AnelPrazo({f, at, duracao?, raio?, position?, rotation?})` — anel que se fecha em volta de um objeto (prazo).

## Vídeo real dentro do 3D — `three/TelaVideo.tsx` e `ui/Kit.tsx`
- `TelaVideo({src, at?, inicio?, position?, rotation?, largura?, proporcao?, credito?, escala?})` — monitor
  flutuante com moldura escura passando um clipe REAL (mudo) e o crédito no canto ("IMAGENS: TESLA").
  `at` = frame da cena em que começa; `inicio` = segundo do clipe. Use `escala={pop(f, at)}` para entrar.
- `VideoTelaCheia({src, at, dur, inicio?, credito?, volume?})` (overlay) — o clipe ocupa a tela por
  `dur` frames com fade e zoom lento; bom para abrir o vídeo com a imagem da notícia (2–3 s).
- Os clipes ficam em `public/explicativo/<slug>/clipes/*.mp4` (fora do Git; o USUÁRIO coloca). Se a
  pasta estiver vazia, NÃO invente: faça a cena só em 3D e avise o usuário de quais clipes faltaram.
- Sempre com crédito da fonte. Prefira material oficial de imprensa (site/canal da empresa ou órgão);
  imagem de agência (AFP, Reuters, Getty) é paga — só se o usuário disser que tem direito.
- No Studio (prévia) a tela fica escura; a imagem real aparece no `npm run quadros` e no render.

## Acabamento do `Stage`
Brilho neon (bloom) LIGADO por padrão; desfoque DESLIGADO (`desfoque` > 0 só se o usuário pedir).
`brilho` (padrão 0.95) controla o halo; `acabamento={false}` desliga tudo. A cor `C.accent` é sempre
emissiva (acesa); `glow` aumenta. Máquina sem GPU lenta demais: `REMOTION_SEM_BRILHO=1` no `.env`.

## Overlays — `ui/`
- `DataCard({at, label, value, unit?, rightLabel?, rightValue?, top?, out?, fixo?})` — `fixo` = já vem da
  cena anterior (sem pular nem som): placar que atravessa o vídeo.
- `ui/Kit.tsx`: `Pergunta({texto, at?, top?, out?})` (pílula grande do gancho) ·
  `Etapas({itens: [{texto, n?}], ativa, at?, acende?, top?})` (régua de passos/linha do tempo) ·
  `Contexto({itens: [{texto, at, on?}], top?})` (pílulas que empilham).
- `Tags({items: [{text, at, on?}], top})`
- `Callout({at, x, y, dx, dy, title, sub?, out?})` — x/y = ponto na tela (use `projetar`).
- `Label({x, y, at, text, color?})`
- `Hud` e `Karaoke` já são colocados pela casca (`Explicativo.tsx`).

## Animação — `anim.ts`
`pop(frame, at)` mola 0→1 · `ease(frame, de, até)` · `easeOut` · `lerp`, `lerp3` · `rand(seed)` determinístico.
