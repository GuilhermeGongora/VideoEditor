import { Easing, interpolate, spring } from "remotion";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** 0→1 com mola, começando no frame `at`. */
export const pop = (frame: number, at: number, fps = 30, damping = 14) =>
  spring({ frame: frame - at, fps, config: { damping, stiffness: 140, mass: 0.7 } });

/** 0→1 suave (easeInOut) entre dois frames. */
export const ease = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });

export const easeOut = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const lerp3 = (a: number[], b: number[], t: number): [number, number, number] => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

/** Pseudo-aleatório determinístico (mesmo resultado em todo render). */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
