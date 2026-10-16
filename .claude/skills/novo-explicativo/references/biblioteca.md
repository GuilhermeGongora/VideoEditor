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

## Acabamento do `Stage`
Profundidade de campo (foco no ponto `cam.look`) + bloom + tone mapping já vêm ligados. Props:
`foco` (distância), `desfoque` (padrão 5; 0 desliga), `brilho` (padrão 0.8), `acabamento={false}`.
Coisas com `glow`/emissive acendem — use destaque com moderação. Sem GPU e lento demais:
`REMOTION_SEM_ACABAMENTO=1` no `.env`.

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
