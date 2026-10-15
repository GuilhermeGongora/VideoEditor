import React, { useLayoutEffect } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { C } from "../theme";
import { rand } from "../anim";

export type Cam = { pos: [number, number, number]; look: [number, number, number]; fov?: number };

/** Posiciona a câmera a cada frame (sem useFrame: tudo vem do frame do Remotion). */
const CameraRig: React.FC<{ cam: Cam }> = ({ cam }) => {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  useLayoutEffect(() => {
    camera.position.set(...cam.pos);
    camera.lookAt(...cam.look);
    if (cam.fov && camera.fov !== cam.fov) {
      camera.fov = cam.fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, cam.pos[0], cam.pos[1], cam.pos[2], cam.look[0], cam.look[1], cam.look[2], cam.fov]);
  return null;
};

/** Poeira flutuando no ar (determinística). */
const Dust: React.FC<{ count?: number }> = ({ count = 70 }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const x = (rand(i) - 0.5) * 16;
        const z = -rand(i + 100) * 18 + 4;
        const y = ((rand(i + 200) * 7 + frame * (0.002 + rand(i + 300) * 0.004)) % 7) + 0.2;
        const s = 0.012 + rand(i + 400) * 0.025;
        return (
          <mesh key={i} position={[x + Math.sin(frame / 60 + i) * 0.15, y, z]}>
            <sphereGeometry args={[s, 6, 6]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.25 + rand(i + 500) * 0.45} fog />
          </mesh>
        );
      })}
    </>
  );
};

const SceneSetup: React.FC<{ claro: boolean }> = ({ claro }) => {
  const { gl, scene } = useThree();
  useLayoutEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = claro ? 1.25 : 1.05;
    const fundo = claro ? FUNDO_CLARO : C.bg;
    scene.background = new THREE.Color(fundo);
    scene.fog = new THREE.Fog(fundo, claro ? 14 : 9, claro ? 36 : 26);
  }, [gl, scene, claro]);
  return null;
};

const FUNDO_CLARO = "#34322E";

/** Cenário de estúdio: parede ao fundo com prateleiras e potes/caixas (dá contexto e profundidade). */
const Estudio: React.FC = () => {
  const props = Array.from({ length: 34 }, (_, i) => {
    const prateleira = i % 2;
    const x = -11 + (i >> 1) * 1.38 + (rand(i + 7) - 0.5) * 0.5;
    const tipo = rand(i + 11);
    const cor = rand(i + 21) < 0.14 ? "#C9A14A" : rand(i + 31) < 0.55 ? "#E6E3DC" : rand(i + 41) < 0.6 ? "#8F8C85" : "#4A4843";
    const h = 0.35 + rand(i + 51) * 0.55;
    return { i, x, y: prateleira ? 4.25 : 2.75, tipo, cor, h, w: 0.32 + rand(i + 61) * 0.3 };
  });
  return (
    <group position={[0, 0, -8]}>
      <mesh position={[0, 8, -0.3]} receiveShadow>
        <planeGeometry args={[70, 18]} />
        <meshStandardMaterial color="#48453F" roughness={0.95} />
      </mesh>
      {[2.75, 4.25].map((y) => (
        <mesh key={y} position={[0, y - 0.06, 0.15]} castShadow receiveShadow>
          <boxGeometry args={[26, 0.12, 0.75]} />
          <meshStandardMaterial color="#5E5A53" roughness={0.85} />
        </mesh>
      ))}
      {props.map((p) =>
        p.tipo < 0.55 ? (
          <group key={p.i} position={[p.x, p.y + p.h / 2, 0.2]}>
            <mesh castShadow>
              <cylinderGeometry args={[p.w / 2, p.w / 2, p.h, 20]} />
              <meshStandardMaterial color={p.cor} roughness={0.5} metalness={p.cor === "#C9A14A" ? 0.45 : 0} />
            </mesh>
            <mesh position={[0, p.h / 2 + 0.03, 0]} castShadow>
              <cylinderGeometry args={[p.w / 2 + 0.02, p.w / 2 + 0.02, 0.07, 20]} />
              <meshStandardMaterial color="#3E3C38" roughness={0.6} />
            </mesh>
          </group>
        ) : (
          <mesh key={p.i} position={[p.x, p.y + p.h / 2, 0.2]} castShadow>
            <boxGeometry args={[p.w * 1.6, p.h, 0.45]} />
            <meshStandardMaterial color={p.cor} roughness={0.7} />
          </mesh>
        ),
      )}
    </group>
  );
};

/**
 * Palco padrão: fundo escuro, chão com pouca reflexão, luz de cima suave, poeira.
 * Coloque os objetos da cena como filhos.
 */
export const Stage: React.FC<{
  cam: Cam;
  children: React.ReactNode;
  dust?: boolean;
  /** "estudio" (padrão): mais claro, parede com prateleiras · "escuro": fundo preto (cenas dramáticas) */
  cenario?: "estudio" | "escuro";
}> = ({ cam, children, dust = true, cenario = "estudio" }) => {
  const claro = cenario === "estudio";
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ fov: cam.fov ?? 32, near: 0.1, far: 80, position: cam.pos }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      shadows
    >
      <SceneSetup claro={claro} />
      <CameraRig cam={cam} />
      <hemisphereLight args={["#fff8ef", claro ? "#3a3733" : "#1a1a1a", claro ? 0.95 : 0.55]} />
      <ambientLight intensity={claro ? 0.32 : 0.18} />
      <spotLight
        position={[2.5, 11, 6]}
        angle={0.55}
        penumbra={0.9}
        intensity={claro ? 330 : 260}
        decay={2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0004}
        shadow-radius={6}
      />
      <directionalLight position={[-6, 4, -4]} intensity={0.35} color="#cfd6ff" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color={claro ? "#5B5852" : C.ground} roughness={0.92} metalness={0} />
      </mesh>
      {claro ? <Estudio /> : null}
      {dust ? <Dust /> : null}
      {children}
    </ThreeCanvas>
  );
};
