import React, { useMemo } from "react";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { C } from "../theme";

type V3 = [number, number, number];

export const Mat: React.FC<{ color?: string; glow?: number; opacity?: number; rough?: number }> = ({
  color = C.white,
  glow = 0,
  opacity = 1,
  rough = 0.55,
}) => (
  <meshStandardMaterial
    key={opacity < 1 ? "t" : "o"}
    color={color}
    emissive={glow > 0 ? color : "#000"}
    emissiveIntensity={glow}
    roughness={rough}
    metalness={0}
    transparent={opacity < 1}
    opacity={opacity}
  />
);

/** Caixa com cantos arredondados (uma malha só, leve). */
export const RoundBox: React.FC<{
  size: V3;
  radius?: number;
  position?: V3;
  rotation?: V3;
  scale?: number | V3;
  color?: string;
  glow?: number;
  opacity?: number;
}> = ({ size, radius = 0.06, position, rotation, scale, color, glow, opacity }) => {
  const [w, h, d] = size;
  const geo = useMemo(() => new RoundedBoxGeometry(w, h, d, 3, Math.min(radius, w / 2, h / 2, d / 2)), [w, h, d, radius]);
  return (
    <mesh geometry={geo} position={position} rotation={rotation} scale={scale as any} castShadow receiveShadow>
      <Mat color={color} glow={glow} opacity={opacity} />
    </mesh>
  );
};

/** Pílula (cadeira do plenário, botão, etc.). */
export const Pill: React.FC<{ position?: V3; color?: string; glow?: number; scale?: number; h?: number }> = ({
  position,
  color,
  glow,
  scale = 1,
  h = 0.32,
}) => (
  <mesh position={position} scale={scale} castShadow>
    <capsuleGeometry args={[0.11, h, 6, 14]} />
    <Mat color={color} glow={glow} />
  </mesh>
);

/** Anel tracejado no chão. */
export const DashedRing: React.FC<{ radius: number; position?: V3; color?: string; progress?: number; dashes?: number }> = ({
  radius,
  position = [0, 0.01, 0],
  color = C.accent,
  progress = 1,
  dashes = 48,
}) => (
  <group position={position}>
    {Array.from({ length: Math.floor(dashes * progress) }, (_, i) => {
      const a = (i / dashes) * Math.PI * 2;
      return (
        <mesh key={i} position={[Math.cos(a) * radius, 0, Math.sin(a) * radius]} rotation={[0, -a, 0]}>
          <boxGeometry args={[0.03, 0.012, ((Math.PI * 2 * radius) / dashes) * 0.55]} />
          <meshBasicMaterial color={color} />
        </mesh>
      );
    })}
  </group>
);

/** Pilha de moedas. */
export const Coins: React.FC<{ count: number; position?: V3; scale?: number }> = ({ count, position, scale = 1 }) => (
  <group position={position} scale={scale}>
    {Array.from({ length: count }, (_, i) => (
      <mesh key={i} position={[Math.sin(i * 2.3) * 0.015, 0.035 + i * 0.062, Math.cos(i * 1.7) * 0.015]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.055, 32]} />
        <meshStandardMaterial color={C.gold} roughness={0.35} metalness={0.55} />
      </mesh>
    ))}
  </group>
);

/** Folha de papel (holerite/documento): linhas cinza e uma em destaque. */
export const Paper: React.FC<{
  position?: V3;
  rotation?: V3;
  scale?: number;
  lines?: number;
  highlight?: number;
  highlightGlow?: number;
  header?: boolean;
}> = ({ position, rotation, scale = 1, lines = 6, highlight = -1, highlightGlow = 0.6, header = true }) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh castShadow receiveShadow>
      <boxGeometry args={[1.5, 2, 0.03]} />
      <Mat color="#f2f1ec" rough={0.8} />
    </mesh>
    {header ? (
      <mesh position={[0, 0.78, 0.02]}>
        <boxGeometry args={[1.2, 0.18, 0.01]} />
        <Mat color="#5d5c58" />
      </mesh>
    ) : null}
    {Array.from({ length: lines }, (_, i) => {
      const y = 0.45 - i * 0.22;
      const hi = i === highlight;
      return (
        <group key={i} position={[0, y, 0.02]}>
          <mesh position={[-0.33, 0, 0]}>
            <boxGeometry args={[0.5, 0.06, 0.01]} />
            <Mat color="#b9b7b0" />
          </mesh>
          <mesh position={[0.35, 0, 0]}>
            <boxGeometry args={[0.5, 0.12, hi ? 0.03 : 0.01]} />
            <Mat color={hi ? C.accent : "#e2e0d9"} glow={hi ? highlightGlow : 0} />
          </mesh>
        </group>
      );
    })}
  </group>
);

/** Barraquinha / pequeno comércio com toldo listrado. */
export const Stall: React.FC<{ position?: V3; scale?: number }> = ({ position, scale = 1 }) => (
  <group position={position} scale={scale}>
    <RoundBox size={[2.2, 1, 0.8]} radius={0.05} position={[0, 0.5, 0]} color="#3d3c39" />
    <RoundBox size={[2.3, 0.08, 0.9]} radius={0.03} position={[0, 1.04, 0]} color={C.white} />
    {[-1.05, 1.05].map((x) => (
      <mesh key={x} position={[x, 1.6, -0.3]} castShadow>
        <cylinderGeometry args={[0.035, 0.035, 1.2, 10]} />
        <Mat color={C.white} />
      </mesh>
    ))}
    {Array.from({ length: 7 }, (_, i) => (
      <mesh key={i} position={[-1.08 + i * 0.36, 2.25, 0]} rotation={[0.35, 0, 0]} castShadow>
        <boxGeometry args={[0.36, 0.06, 1.1]} />
        <Mat color={i % 2 ? C.white : C.accent} glow={i % 2 ? 0 : 0.35} />
      </mesh>
    ))}
  </group>
);
