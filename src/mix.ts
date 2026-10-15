import { interpolate } from "remotion";

/** Janela em que o áudio do clipe abaixa para um efeito sonoro "aparecer" (ducking). Frames relativos ao clipe. */
export type DuckWindow = { from: number; to: number; amount: number };

const RAMP = 4; // frames para subir/descer (evita "degrau" no som)

export const duckGain = (f: number, ducks: DuckWindow[]) =>
  ducks.reduce((g, d) => {
    const v = interpolate(f, [d.from - RAMP, d.from, d.to, d.to + RAMP], [1, 1 - d.amount, 1 - d.amount, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return Math.min(g, v);
  }, 1);

/** Micro fade nas pontas de cada clipe para não estalar nos cortes. */
export const edgeFade = (f: number, len: number, frames = 3) => Math.max(0, Math.min(1, (f + 1) / frames, (len - f) / frames));

/** Fade-out geral no fim do vídeo (todos os áudios). */
export const masterFade = (absFrame: number, total: number, fadeFrames: number) =>
  fadeFrames <= 0 ? 1 : Math.max(0, Math.min(1, (total - absFrame) / fadeFrames));

/** Volume de um efeito: corta suave em maxFrames (se houver) e respeita o fade final. */
export const sfxVolume = (base: number, absStart: number, total: number, endFade: number, maxFrames?: number) => (f: number) => {
  const tail = maxFrames ? Math.max(0, Math.min(1, (maxFrames - f) / RAMP)) : 1;
  return base * tail * masterFade(absStart + f, total, endFade);
};
