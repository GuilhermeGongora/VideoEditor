import * as THREE from "three";
import type { Cam } from "./three/Stage";

/** Converte um ponto 3D em pixels da tela (para ancorar caixas/setas HTML em objetos 3D). */
export const projetar = (p: [number, number, number], cam: Cam, w = 1080, h = 1920): { x: number; y: number } => {
  const c = new THREE.PerspectiveCamera(cam.fov ?? 32, w / h, 0.1, 80);
  c.position.set(...cam.pos);
  c.lookAt(...cam.look);
  c.updateMatrixWorld();
  c.updateProjectionMatrix();
  const v = new THREE.Vector3(...p).project(c);
  return { x: ((v.x + 1) / 2) * w, y: ((1 - v.y) / 2) * h };
};
