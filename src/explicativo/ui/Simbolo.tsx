import React from "react";
import { C } from "../theme";

/** Símbolo Scientia ("Caminho"): um S de linha contínua que termina no ponto de destaque. */
export const Simbolo: React.FC<{ size: number; cor?: string; ponto?: string; glow?: boolean }> = ({
  size,
  cor = C.white,
  ponto = C.accent,
  glow = true,
}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible", flexShrink: 0 }}>
    <path d="M69 30 A20 17 0 1 0 50 50 A20 17 0 1 1 31 70" fill="none" stroke={cor} strokeWidth={14} strokeLinecap="round" />
    <circle cx={31} cy={70} r={size < 60 ? 9.5 : 7} fill={ponto} style={glow ? { filter: `drop-shadow(0 0 6px ${ponto})` } : undefined} />
  </svg>
);
