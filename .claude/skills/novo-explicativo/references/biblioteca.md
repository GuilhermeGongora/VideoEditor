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

## Overlays — `ui/`
- `DataCard({at, label, value, unit?, rightLabel?, rightValue?, top?, out?})`
- `Tags({items: [{text, at, on?}], top})`
- `Callout({at, x, y, dx, dy, title, sub?, out?})` — x/y = ponto na tela (use `projetar`).
- `Label({x, y, at, text, color?})`
- `Hud` e `Karaoke` já são colocados pela casca (`Explicativo.tsx`).

## Animação — `anim.ts`
`pop(frame, at)` mola 0→1 · `ease(frame, de, até)` · `easeOut` · `lerp`, `lerp3` · `rand(seed)` determinístico.
