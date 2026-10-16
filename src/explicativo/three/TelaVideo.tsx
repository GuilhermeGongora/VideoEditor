import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { Sequence, staticFile, useRemotionEnvironment } from "remotion";
import { useOffthreadVideoTexture } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { C, MONO } from "../theme";
import { RoundBox } from "./Objetos";

/**
 * Vídeo REAL dentro da cena 3D, num monitor flutuante (estilo Ludificando: imagens da notícia num
 * telão com moldura escura e o crédito no canto).
 *
 *   <TelaVideo src="explicativo/roadster/clipes/demo.mp4" at={0} inicio={12} credito="IMAGENS: TESLA" />
 *
 * - `src`: arquivo dentro de public/ (coloque os clipes em public/explicativo/<slug>/clipes/).
 * - `at`: frame da cena em que o vídeo começa a rodar; `inicio`: segundo do clipe onde começar.
 * - O vídeo entra mudo (a narração fala por cima). Proporção padrão 16:9 (`proporcao` muda).
 * - No Studio (prévia) mostra uma tela escura com "VÍDEO"; o quadro real aparece no render/quadros.
 */
type V3 = [number, number, number];
/** um pouco abaixo do branco puro: a imagem real não "estoura" com o brilho neon da cena */
const BRILHO_TELA = "#c8c8c8";

const TexturaVideo: React.FC<{ src: string; largura: number; altura: number }> = ({ src, largura, altura }) => {
  const tex = useOffthreadVideoTexture({ src: staticFile(src) });
  const advance = useThree((st) => st.advance);
  if (tex) tex.colorSpace = THREE.SRGBColorSpace;
  // o quadro do vídeo chega depois do desenho da cena: redesenha quando ele chegar
  useLayoutEffect(() => {
    if (tex) advance(performance.now());
  }, [tex, advance]);
  return (
    <mesh position={[0, 0, 0.032]}>
      <planeGeometry args={[largura, altura]} />
      {/* toneMapped=false: a imagem aparece com as cores reais (sem o tom de cinema da cena) */}
      {/* key: recria o material quando a imagem chega (senão o shader fica sem a textura) */}
      <meshBasicMaterial key={tex ? tex.uuid : "vazio"} map={tex ?? undefined} color={tex ? BRILHO_TELA : "#111"} toneMapped={false} />
    </mesh>
  );
};

/** Texto pequeno desenhado numa textura (crédito no canto da moldura). */
const useTextoTextura = (texto: string) =>
  useMemo(() => {
    if (typeof document === "undefined" || !texto) return null;
    const cv = document.createElement("canvas");
    cv.width = 512;
    cv.height = 64;
    const g = cv.getContext("2d")!;
    g.fillStyle = "rgba(20,20,20,0.92)";
    g.beginPath();
    g.roundRect(0, 6, 512, 52, 26);
    g.fill();
    g.fillStyle = "#e8e7e2";
    g.font = `700 26px ${MONO}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(texto.toUpperCase(), 256, 33);
    const t = new THREE.CanvasTexture(cv);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [texto]);

export const TelaVideo: React.FC<{
  src: string;
  at?: number;
  inicio?: number;
  position?: V3;
  rotation?: V3;
  /** largura da imagem em unidades da cena (padrão 2.2) */
  largura?: number;
  proporcao?: number;
  credito?: string;
  /** 0–1: a tela entra crescendo (use pop(f, at)) */
  escala?: number;
}> = ({ src, at = 0, inicio = 0, position, rotation, largura = 2.2, proporcao = 16 / 9, credito, escala = 1 }) => {
  const { isRendering } = useRemotionEnvironment();
  const altura = largura / proporcao;
  const borda = 0.07;
  const cred = useTextoTextura(credito ?? "");
  if (escala < 0.01) return null;
  return (
    <group position={position} rotation={rotation} scale={escala}>
      {/* moldura */}
      <RoundBox size={[largura + borda * 2, altura + borda * 2, 0.06]} radius={0.05} color="#2a2927" />
      <RoundBox size={[largura + borda * 2 + 0.02, 0.012, 0.062]} radius={0.004} position={[0, -(altura / 2 + borda) + 0.006, 0]} color={C.accent} glow={0.4} />
      {isRendering ? (
        // Sequence negativo: o clipe começa no segundo `inicio` quando a cena chega no frame `at`
        <Sequence from={Math.round(at - inicio * 30)} layout="none">
          <TexturaVideo src={src} largura={largura} altura={altura} />
        </Sequence>
      ) : (
        <mesh position={[0, 0, 0.032]}>
          <planeGeometry args={[largura, altura]} />
          <meshBasicMaterial color="#151515" />
        </mesh>
      )}
      {cred ? (
        <mesh position={[largura / 2 - 0.55, -altura / 2 + 0.1, 0.04]}>
          <planeGeometry args={[1.0, 0.125]} />
          <meshBasicMaterial map={cred} transparent toneMapped={false} />
        </mesh>
      ) : null}
    </group>
  );
};
