import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { C, SANS } from "../theme";

export type Palavra = { w: string; start: number; end: number; fimFrase?: boolean };

/** Agrupa as palavras em linhas curtas (quebra no fim da frase ou a cada ~5 palavras). */
const grupos = (ps: Palavra[], max = 5) => {
  const out: Palavra[][] = [];
  let cur: Palavra[] = [];
  ps.forEach((p, i) => {
    cur.push(p);
    const restoDaFrase = ps.slice(i + 1).findIndex((q) => q.fimFrase) + 1;
    const quebra = p.fimFrase || (cur.length >= max && restoDaFrase > 1);
    if (quebra) {
      out.push(cur);
      cur = [];
    }
  });
  if (cur.length) out.push(cur);
  return out;
};

/**
 * Legenda karaokê: mostra o trecho atual; palavra já falada fica branca,
 * a próxima fica apagada. `palavras` com tempo ABSOLUTO (segundos do vídeo).
 */
export const Karaoke: React.FC<{ palavras: Palavra[]; top?: number }> = ({ palavras, top = 1330 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const gs = grupos(palavras);
  const g = gs.find((g, i) => t < (gs[i + 1]?.[0].start ?? Infinity) - 0.05 && t >= g[0].start - 0.15);
  if (!g) return null;
  const fim = g[g.length - 1].end;
  if (t > fim + 0.7) return null;
  return (
    <div style={{ position: "absolute", left: 70, right: 70, top, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          padding: "14px 26px",
          borderRadius: 18,
          background: "rgba(14,14,14,0.55)",
          textAlign: "center",
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 50,
          lineHeight: 1.22,
          letterSpacing: -0.5,
        }}
      >
        {g.map((p, i) => {
          const dita = t >= p.start;
          return (
            <span key={i} style={{ color: dita ? C.text : C.textDim }}>
              {p.w}
              {i < g.length - 1 ? " " : ""}
            </span>
          );
        })}
      </div>
    </div>
  );
};
