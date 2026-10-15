import React from "react";
import { C } from "../theme";

export type Pose = {
  /** rotação [x, z] do ombro (x: frente/trás, z: abrir) */
  lShoulder?: [number, number];
  rShoulder?: [number, number];
  lElbow?: number;
  rElbow?: number;
  lHip?: number;
  rHip?: number;
  lKnee?: number;
  rKnee?: number;
  headTilt?: number;
  headTurn?: number;
  lean?: number;
};

export type Look = "white" | "gray" | "dark" | "accent";

const COLORS: Record<Look, { color: string; emissive: string; ei: number }> = {
  white: { color: C.white, emissive: "#000", ei: 0 },
  gray: { color: C.gray, emissive: "#000", ei: 0 },
  dark: { color: C.dark, emissive: "#000", ei: 0 },
  accent: { color: C.accent, emissive: C.accentDeep, ei: 0.55 },
};

const Mat: React.FC<{ look: Look; opacity?: number }> = ({ look, opacity = 1 }) => {
  const c = COLORS[look];
  return (
    <meshStandardMaterial
      key={opacity < 1 ? "t" : "o"}
      color={c.color}
      emissive={c.emissive}
      emissiveIntensity={c.ei}
      roughness={0.55}
      metalness={0}
      transparent={opacity < 1}
      opacity={opacity}
    />
  );
};

/** Segmento de membro pendurado a partir da junta (aponta para -Y). */
const Seg: React.FC<{ r: number; len: number; look: Look; opacity?: number; children?: React.ReactNode }> = ({
  r,
  len,
  look,
  opacity,
  children,
}) => (
  <>
    <mesh castShadow position={[0, -len / 2, 0]}>
      <capsuleGeometry args={[r, Math.max(0.001, len - r * 2), 6, 14]} />
      <Mat look={look} opacity={opacity} />
    </mesh>
    <group position={[0, -len, 0]}>{children}</group>
  </>
);

const Joint: React.FC<{ r: number; look: Look; opacity?: number }> = ({ r, look, opacity }) => (
  <mesh castShadow>
    <sphereGeometry args={[r, 14, 10]} />
    <Mat look={look} opacity={opacity} />
  </mesh>
);

/**
 * Boneco estilo manequim de madeira (altura ~1,75). Origem nos pés.
 * Tudo vem de formas simples: cápsulas e esferas.
 */
export const Mannequin: React.FC<{
  pose?: Pose;
  look?: Look;
  opacity?: number;
  position?: [number, number, number];
  rotationY?: number;
  scale?: number;
}> = ({ pose = {}, look = "white", opacity = 1, position = [0, 0, 0], rotationY = 0, scale = 1 }) => {
  const p = {
    lShoulder: [0, 0.12],
    rShoulder: [0, -0.12],
    lElbow: 0.08,
    rElbow: 0.08,
    lHip: 0,
    rHip: 0,
    lKnee: 0,
    rKnee: 0,
    headTilt: 0,
    headTurn: 0,
    lean: 0,
    ...pose,
  } as Required<Pose>;
  const hipY = 0.92;
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      {/* pernas */}
      {([
        [-1, p.lHip, p.lKnee],
        [1, p.rHip, p.rKnee],
      ] as const).map(([side, hip, knee]) => (
        <group key={side} position={[side * 0.095, hipY, 0]} rotation={[hip, 0, 0]}>
          <Joint r={0.072} look={look} opacity={opacity} />
          <Seg r={0.068} len={0.43} look={look} opacity={opacity}>
            <group rotation={[knee, 0, 0]}>
              <Joint r={0.058} look={look} opacity={opacity} />
              <Seg r={0.055} len={0.4} look={look} opacity={opacity}>
                <mesh castShadow position={[0, -0.02, 0.05]}>
                  <boxGeometry args={[0.1, 0.07, 0.22]} />
                  <Mat look={look} opacity={opacity} />
                </mesh>
              </Seg>
            </group>
          </Seg>
        </group>
      ))}
      {/* tronco */}
      <group position={[0, hipY, 0]} rotation={[p.lean, 0, 0]}>
        <mesh castShadow position={[0, 0.06, 0]} scale={[1.25, 1, 0.85]}>
          <sphereGeometry args={[0.13, 18, 12]} />
          <Mat look={look} opacity={opacity} />
        </mesh>
        <mesh castShadow position={[0, 0.2, 0]} scale={[1, 1, 0.75]}>
          <capsuleGeometry args={[0.1, 0.12, 6, 16]} />
          <Mat look={look} opacity={opacity} />
        </mesh>
        <mesh castShadow position={[0, 0.39, 0]} scale={[1.3, 1, 0.78]}>
          <capsuleGeometry args={[0.135, 0.12, 6, 18]} />
          <Mat look={look} opacity={opacity} />
        </mesh>
        {/* pescoço + cabeça */}
        <mesh castShadow position={[0, 0.58, 0]}>
          <cylinderGeometry args={[0.04, 0.045, 0.1, 12]} />
          <Mat look={look} opacity={opacity} />
        </mesh>
        <group position={[0, 0.62, 0]} rotation={[p.headTilt, p.headTurn, 0]}>
          <mesh castShadow position={[0, 0.11, 0]} scale={[0.92, 1.15, 1]}>
            <sphereGeometry args={[0.105, 20, 16]} />
            <Mat look={look} opacity={opacity} />
          </mesh>
        </group>
        {/* braços */}
        {([
          [-1, p.lShoulder, p.lElbow],
          [1, p.rShoulder, p.rElbow],
        ] as const).map(([side, sh, el]) => (
          <group key={side} position={[side * 0.215, 0.48, 0]} rotation={[sh[0], 0, -sh[1]]}>
            <Joint r={0.055} look={look} opacity={opacity} />
            <Seg r={0.047} len={0.3} look={look} opacity={opacity}>
              <group rotation={[-el, 0, 0]}>
                <Joint r={0.042} look={look} opacity={opacity} />
                <Seg r={0.04} len={0.27} look={look} opacity={opacity}>
                  <mesh castShadow position={[0, -0.03, 0]} scale={[0.8, 1.2, 0.5]}>
                    <sphereGeometry args={[0.05, 12, 10]} />
                    <Mat look={look} opacity={opacity} />
                  </mesh>
                </Seg>
              </group>
            </Seg>
          </group>
        ))}
      </group>
    </group>
  );
};

/** Pose de "parado respirando" (frame-driven). */
export const idlePose = (frame: number, seed = 0): Pose => {
  const t = (frame + seed * 37) / 30;
  const s = Math.sin(t * 1.6);
  return {
    lShoulder: [0.03 * s, 0.12],
    rShoulder: [-0.03 * s, -0.12],
    lElbow: 0.1 + 0.03 * s,
    rElbow: 0.1 - 0.03 * s,
    headTilt: 0.03 * Math.sin(t * 0.9),
    headTurn: 0.08 * Math.sin(t * 0.5 + seed),
  };
};

/** Ciclo de caminhada. `phase` em radianos. */
export const walkPose = (phase: number): Pose => {
  const s = Math.sin(phase);
  return {
    lHip: 0.45 * s,
    rHip: -0.45 * s,
    lKnee: Math.max(0, -0.7 * Math.sin(phase + 0.9)),
    rKnee: Math.max(0, 0.7 * Math.sin(phase + 0.9)),
    lShoulder: [-0.35 * s, 0.1],
    rShoulder: [0.35 * s, -0.1],
    lElbow: 0.25,
    rElbow: 0.25,
    lean: 0.04,
  };
};
