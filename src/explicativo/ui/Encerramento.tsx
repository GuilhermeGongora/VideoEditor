import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, MONO, SANS } from "../theme";
import { clamp, ease, easeOut, pop } from "../anim";

/** Duração do encerramento (frames, 30 fps). */
export const ENCERRAMENTO = 96;

/**
 * Fechamento do vídeo: escurece a última cena, o S se desenha, o ponto limão acende,
 * "scientia" + @ aparecem e tudo some num fade para preto.
 */
export const Encerramento: React.FC<{ handle?: string; cta?: string }> = ({ handle = "@scientia.ia", cta }) => {
  const f = useCurrentFrame();
  const fundo = interpolate(f, [0, 14], [0, 1], clamp);
  const traco = ease(f, 8, 34);
  const ponto = pop(f, 32, 30, 9);
  const texto = easeOut(f, 38, 54);
  const zoom = interpolate(f, [8, ENCERRAMENTO], [0.92, 1.0], clamp);
  const saida = interpolate(f, [ENCERRAMENTO - 16, ENCERRAMENTO - 2], [1, 0], clamp);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: C.bg, opacity: fundo }} />
      <AbsoluteFill
        style={{
          opacity: saida,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 26,
          transform: `scale(${zoom})`,
          background: `radial-gradient(circle at 50% 46%, rgba(220,255,60,${0.07 * ponto}) 0%, rgba(0,0,0,0) 40%)`,
        }}
      >
        <svg width={300} height={300} viewBox="0 0 100 100" style={{ overflow: "visible" }}>
          <path
            d="M69 30 A20 17 0 1 0 50 50 A20 17 0 1 1 31 70"
            fill="none"
            stroke={C.white}
            strokeWidth={14}
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - traco}
            opacity={traco > 0.001 ? 1 : 0}
          />
          <circle
            cx={31}
            cy={70}
            r={7 * ponto}
            fill={C.accent}
            style={{ filter: `drop-shadow(0 0 ${10 * ponto}px ${C.accent})` }}
          />
        </svg>
        <div style={{ opacity: texto, transform: `translateY(${(1 - texto) * 24}px)`, textAlign: "center" }}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 110, letterSpacing: -5, color: C.text, lineHeight: 1 }}>
            scientia
          </div>
          <div style={{ marginTop: 18, fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: 5, color: C.textDim }}>
            {handle.toUpperCase()}
          </div>
          {cta ? (
            <div
              style={{
                marginTop: 34,
                display: "inline-block",
                padding: "14px 28px",
                borderRadius: 999,
                background: C.accent,
                color: C.ink,
                fontFamily: MONO,
                fontWeight: 700,
                fontSize: 30,
                letterSpacing: 3,
                opacity: easeOut(f, 46, 58),
                transform: `scale(${0.85 + 0.15 * pop(f, 46)})`,
              }}
            >
              {cta.toUpperCase()}
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#000", opacity: interpolate(f, [ENCERRAMENTO - 10, ENCERRAMENTO - 1], [0, 1], clamp) }} />
      <Sequence from={32} durationInFrames={40} layout="none">
        <Audio src={staticFile("sfx/ding.wav")} volume={0.28} />
      </Sequence>
    </AbsoluteFill>
  );
};
