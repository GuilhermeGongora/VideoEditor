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

const SceneSetup: React.FC = () => {
  const { gl, scene } = useThree();
  useLayoutEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.05;
    scene.background = new THREE.Color(C.bg);
    scene.fog = new THREE.Fog(C.bg, 9, 26);
  }, [gl, scene]);
  return null;
};

/**
 * Palco padrão: fundo escuro, chão com pouca reflexão, luz de cima suave, poeira.
 * Coloque os objetos da cena como filhos.
 */
export const Stage: React.FC<{ cam: Cam; children: React.ReactNode; dust?: boolean }> = ({
  cam,
  children,
  dust = true,
}) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ fov: cam.fov ?? 32, near: 0.1, far: 80, position: cam.pos }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      shadows
    >
      <SceneSetup />
      <CameraRig cam={cam} />
      <hemisphereLight args={["#ffffff", "#1a1a1a", 0.55]} />
      <ambientLight intensity={0.18} />
      <spotLight
        position={[2.5, 11, 6]}
        angle={0.55}
        penumbra={0.9}
        intensity={260}
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
        <meshStandardMaterial color={C.ground} roughness={0.92} metalness={0} />
      </mesh>
      {dust ? <Dust /> : null}
      {children}
    </ThreeCanvas>
  );
};
