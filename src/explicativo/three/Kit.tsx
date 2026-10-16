import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { interpolate } from "remotion";
import { C } from "../theme";
import { clamp, easeOut, lerp, pop } from "../anim";
import { Mat, RoundBox } from "./Objetos";

/**
 * Peças recorrentes no estilo Ludificando (aparecem em quase todo vídeo de notícia/lei):
 * plenário que acende até o quórum, balança "os dois lados", celular com mensagem (golpe/fake),
 * anel de prazo em volta de um objeto e bonequinhos simples para pôr em pratos/filas.
 */
type V3 = [number, number, number];

/* ───────────── Plenário: N cadeiras em semicírculo, acendem até `acesas` ───────────── */
export const Hemiciclo: React.FC<{
  f: number;
  /** total de cadeiras (513 Câmara, 81 Senado) */
  total: number;
  /** quantas acendem (ex.: 257, 49) */
  acesas: number;
  /** frame em que começam a acender */
  at: number;
  /** quantos frames leva para acender todas */
  duracao?: number;
  position?: V3;
  scale?: number;
  raio?: number;
}> = ({ f, total, acesas, at, duracao = 40, position, scale = 1, raio = 1.6 }) => {
  const fileiras = total > 200 ? 9 : 5;
  const lugares = useMemo(() => {
    const out: { x: number; z: number; ang: number }[] = [];
    const perFila = (k: number) => Math.round((total * (0.6 + k * 0.4 / (fileiras - 1))) / (fileiras * 0.8));
    let n = 0;
    for (let k = 0; k < fileiras && n < total; k++) {
      const r = raio * (0.45 + (0.55 * k) / (fileiras - 1));
      const m = Math.min(perFila(k), total - n);
      for (let i = 0; i < m; i++, n++) {
        const ang = Math.PI * (0.06 + (0.88 * i) / Math.max(1, m - 1));
        out.push({ x: Math.cos(ang) * r, z: -Math.sin(ang) * r, ang });
      }
    }
    while (out.length < total) out.push(out[out.length - 1]);
    // acende do centro para as pontas (fica mais bonito)
    return out.sort((a, b) => Math.abs(a.ang - Math.PI / 2) - Math.abs(b.ang - Math.PI / 2));
  }, [total, fileiras, raio]);
  const acesasAgora = Math.round(interpolate(f, [at, at + duracao], [0, acesas], clamp));
  const tam = total > 200 ? 0.07 : 0.12;
  const off = useRef<THREE.InstancedMesh>(null);
  const on = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.CapsuleGeometry(tam * 0.5, tam * 0.9, 4, 8), [tam]);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => {
    let a = 0;
    let b = 0;
    lugares.forEach((l, i) => {
      tmp.position.set(l.x, tam, l.z);
      tmp.scale.setScalar(1);
      tmp.updateMatrix();
      if (i < acesasAgora) on.current?.setMatrixAt(a++, tmp.matrix);
      else off.current?.setMatrixAt(b++, tmp.matrix);
    });
    if (on.current) {
      on.current.count = a;
      on.current.instanceMatrix.needsUpdate = true;
    }
    if (off.current) {
      off.current.count = b;
      off.current.instanceMatrix.needsUpdate = true;
    }
  }, [lugares, acesasAgora, tmp, tam]);
  return (
    <group position={position} scale={scale}>
      <instancedMesh ref={off} args={[geo, undefined, total]} castShadow>
        <meshStandardMaterial color={C.dark} roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={on} args={[geo, undefined, total]} castShadow>
        <meshStandardMaterial color={C.accent} emissive={C.accent} emissiveIntensity={0.45} />
      </instancedMesh>
    </group>
  );
};

/* ───────────── Balança "os dois lados" ───────────── */
export const Balanca: React.FC<{
  /** inclinação: -1 (esquerda desce) … 1 (direita desce) */
  inclina: number;
  esquerda?: React.ReactNode;
  direita?: React.ReactNode;
  position?: V3;
  scale?: number;
}> = ({ inclina, esquerda, direita, position, scale = 1 }) => {
  const ang = -inclina * 0.18;
  const braco = 1.1;
  const yL = Math.sin(ang) * -braco;
  const yR = Math.sin(ang) * braco;
  const Prato: React.FC<{ x: number; y: number; children?: React.ReactNode }> = ({ x, y, children }) => (
    <group position={[x, 1.55 + y, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[Math.cos((i * 2 * Math.PI) / 3) * 0.2, -0.35, Math.sin((i * 2 * Math.PI) / 3) * 0.2]} rotation={[Math.sin((i * 2 * Math.PI) / 3) * 0.5, 0, -Math.cos((i * 2 * Math.PI) / 3) * 0.5]}>
          <cylinderGeometry args={[0.006, 0.006, 0.8, 6]} />
          <meshStandardMaterial color={C.gray} />
        </mesh>
      ))}
      <mesh position={[0, -0.72, 0]}>
        <cylinderGeometry args={[0.45, 0.4, 0.04, 40]} />
        <Mat color={C.white} />
      </mesh>
      <group position={[0, -0.7, 0]}>{children}</group>
    </group>
  );
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.4, 0.45, 0.06, 40]} />
        <Mat color={C.white} />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 1.55, 16]} />
        <Mat color={C.white} glow={0.6} />
      </mesh>
      <group position={[0, 1.58, 0]} rotation={[0, 0, ang]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, braco * 2, 12]} />
          <Mat color={C.white} glow={0.6} />
        </mesh>
      </group>
      <mesh position={[0, 1.66, 0]}>
        <coneGeometry args={[0.07, 0.14, 4]} />
        <Mat color={C.white} />
      </mesh>
      <Prato x={-braco * Math.cos(ang)} y={yL}>
        {esquerda}
      </Prato>
      <Prato x={braco * Math.cos(ang)} y={yR}>
        {direita}
      </Prato>
    </group>
  );
};

/* ───────────── Bonequinho simples (para pratos, filas, multidões leves) ───────────── */
export const Pessoinha: React.FC<{ position?: V3; color?: string; glow?: number; scale?: number }> = ({ position, color = C.white, glow = 0, scale = 1 }) => (
  <group position={position} scale={scale}>
    <mesh position={[0, 0.17, 0]} castShadow>
      <capsuleGeometry args={[0.07, 0.18, 4, 10]} />
      <Mat color={color} glow={glow} />
    </mesh>
    <mesh position={[0, 0.39, 0]} castShadow>
      <sphereGeometry args={[0.065, 16, 16]} />
      <Mat color={color} glow={glow} />
    </mesh>
  </group>
);

/* ───────────── Celular com mensagens (golpe, fake news, notificação) ───────────── */
export const Celular: React.FC<{
  f: number;
  /** frames em que cada balão de mensagem aparece */
  mensagens: number[];
  /** frame em que a tela fica com alerta (borda acesa) */
  alerta?: number;
  position?: V3;
  rotation?: V3;
  scale?: number;
}> = ({ f, mensagens, alerta, position, rotation, scale = 1 }) => {
  const a = alerta !== undefined ? easeOut(f, alerta, alerta + 10) : 0;
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <RoundBox size={[0.82, 1.62, 0.08]} radius={0.1} position={[0, 0.81, 0]} color="#1c1c1b" glow={0} />
      <RoundBox size={[0.74, 1.5, 0.01]} radius={0.06} position={[0, 0.81, 0.045]} color={a > 0.5 ? "#2a2d12" : "#262625"} glow={a * 0.25} />
      {mensagens.map((at, i) => {
        const s = pop(f, at);
        if (s < 0.01) return null;
        const esq = i % 2 === 0;
        return (
          <RoundBox
            key={i}
            size={[0.5, 0.15, 0.012]}
            radius={0.05}
            position={[esq ? -0.08 : 0.08, 1.35 - i * 0.22, 0.055]}
            scale={[s, s, 1]}
            color={esq ? C.white : C.gray}
          />
        );
      })}
      {a > 0.01
        ? ([
            [0, 1.57, 0.78, 0.025],
            [0, 0.05, 0.78, 0.025],
            [-0.39, 0.81, 0.025, 1.54],
            [0.39, 0.81, 0.025, 1.54],
          ] as const).map(([x, y, w, h], i) => (
            <mesh key={i} position={[x, y, 0.05]}>
              <boxGeometry args={[w, h, 0.02]} />
              <meshStandardMaterial color={C.accent} emissive={C.accent} emissiveIntensity={1.2 * a} transparent opacity={a} />
            </mesh>
          ))
        : null}
    </group>
  );
};

/* ───────────── Anel de prazo (contagem em volta de um objeto: "120 dias") ───────────── */
export const AnelPrazo: React.FC<{
  f: number;
  /** frame em que o anel começa a se fechar */
  at: number;
  /** frames até fechar */
  duracao?: number;
  raio?: number;
  position?: V3;
  rotation?: V3;
}> = ({ f, at, duracao = 45, raio = 0.6, position, rotation }) => {
  const p = interpolate(f, [at, at + duracao], [0.001, 1], clamp);
  if (f < at) return null;
  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <torusGeometry args={[raio, 0.018, 8, 64]} />
        <meshStandardMaterial color={C.dark} transparent opacity={0.6} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[raio, 0.035, 10, 96, Math.PI * 2 * p]} />
        <meshStandardMaterial color={C.accent} emissive={C.accent} emissiveIntensity={1.4} />
      </mesh>
    </group>
  );
};

/** Moedinhas empilhadas num prato (peso do "custo" na balança). */
export const PilhaMoedas: React.FC<{ n: number; position?: V3 }> = ({ n, position }) => (
  <group position={position}>
    {Array.from({ length: n }, (_, i) => (
      <mesh key={i} position={[(i % 3) * 0.02 - 0.02, 0.03 + i * 0.045, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.04, 28]} />
        <meshStandardMaterial color={C.gold} metalness={0.15} roughness={0.45} />
      </mesh>
    ))}
  </group>
);

/** Interpolação útil para a balança pender aos poucos. */
export const pender = (f: number, de: number, ate: number, alvo: number) => lerp(0, alvo, easeOut(f, de, ate));

/* ───────────── Plenário dividido em blocos (ex.: esquerda / centro / direita, ou partidos) ───────────── */
/**
 * Cadeiras em semicírculo, da esquerda para a direita, na ordem dos `blocos`.
 * Cores NEUTRAS por padrão (branco, cinza, grafite); o bloco em `destaque` acende na cor de destaque.
 * Isso evita associar cor a lado político. `at`/`duracao`: as cadeiras aparecem em onda.
 */
export const HemicicloBlocos: React.FC<{
  f: number;
  blocos: { n: number; cor?: string }[];
  destaque?: number | null;
  at?: number;
  duracao?: number;
  position?: V3;
  scale?: number;
  raio?: number;
}> = ({ f, blocos, destaque = null, at = 0, duracao = 30, position, scale = 1, raio = 1.6 }) => {
  const total = blocos.reduce((s, b) => s + b.n, 0);
  const fileiras = total > 200 ? 9 : 5;
  const tam = total > 200 ? 0.07 : 0.12;
  const NEUTRAS = ["#ecebe6", "#9a9892", "#5f5d58", "#c9c7c0", "#7c7a74"];
  // lugares ordenados por ângulo (esquerda → direita), fila a fila
  const lugares = useMemo(() => {
    const out: { x: number; z: number; ang: number }[] = [];
    let n = 0;
    for (let k = 0; k < fileiras; k++) {
      const r = raio * (0.45 + (0.55 * k) / (fileiras - 1));
      const m = Math.round((total * (0.6 + (k * 0.4) / (fileiras - 1))) / (fileiras * 0.8));
      for (let i = 0; i < m && n < total; i++, n++) {
        const ang = Math.PI * (0.06 + (0.88 * i) / Math.max(1, m - 1));
        out.push({ x: Math.cos(ang) * r, z: -Math.sin(ang) * r, ang });
      }
    }
    while (out.length < total) out.push(out[out.length - 1]);
    return out.sort((a, b) => b.ang - a.ang); // ângulo maior = lado esquerdo da tela
  }, [total, fileiras, raio]);
  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const geo = useMemo(() => new THREE.CapsuleGeometry(tam * 0.5, tam * 0.9, 4, 8), [tam]);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const aparecidas = Math.round(interpolate(f, [at, at + duracao], [0, total], clamp));
  useLayoutEffect(() => {
    let ini = 0;
    blocos.forEach((b, bi) => {
      const m = refs.current[bi];
      if (!m) return;
      let c = 0;
      for (let i = 0; i < b.n; i++) {
        const idx = ini + i;
        if (idx >= aparecidas) break;
        const l = lugares[idx];
        tmp.position.set(l.x, tam, l.z);
        tmp.updateMatrix();
        m.setMatrixAt(c++, tmp.matrix);
      }
      m.count = c;
      m.instanceMatrix.needsUpdate = true;
      ini += b.n;
    });
  }, [blocos, lugares, aparecidas, tmp, tam]);
  return (
    <group position={position} scale={scale}>
      {blocos.map((b, bi) => {
        const aceso = destaque === bi;
        const cor = aceso ? C.accent : b.cor ?? NEUTRAS[bi % NEUTRAS.length];
        return (
          <instancedMesh key={bi} ref={(el) => { refs.current[bi] = el; }} args={[geo, undefined, Math.max(1, b.n)]} castShadow>
            <meshStandardMaterial color={cor} emissive={aceso ? C.accent : "#000"} emissiveIntensity={aceso ? 0.6 : 0} roughness={0.55} />
          </instancedMesh>
        );
      })}
    </group>
  );
};
