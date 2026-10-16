import React, { useContext } from "react";
import { interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { C, MONO, SANS } from "../theme";
import { clamp, pop } from "../anim";
import { SemOverlays } from "./Overlays";
import { SomAparecer } from "./Sons";

/**
 * Overlays do estilo Ludificando:
 * - Pergunta: a pílula grande do gancho ("QUANTO O PRESIDENTE MANDA?") no 1º segundo.
 * - Etapas: régua de passos fixa no topo (1 LEI · 2 VETO · 3 MP…, ou 2024 → MAI → SET) que acompanha o vídeo.
 * - Contexto: pílulas pequenas que vão se EMPILHANDO no topo (cada fato novo vira uma pílula).
 */

/** Pílula grande da pergunta do gancho (fundo de destaque, texto escuro). */
export const Pergunta: React.FC<{ texto: string; at?: number; top?: number; out?: number }> = ({ texto, at = 0, top = 300, out }) => {
  if (useContext(SemOverlays)) return null;
  const f = useCurrentFrame();
  const s = pop(f, at, 30, 12);
  const o = out !== undefined ? interpolate(f, [out, out + 8], [1, 0], clamp) : 1;
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: s * o }}>
      <div
        style={{
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 34,
          letterSpacing: 3,
          padding: "14px 30px",
          borderRadius: 999,
          background: C.accent,
          color: C.ink,
          boxShadow: `0 0 40px rgba(220,255,60,0.35)`,
          transform: `scale(${0.6 + 0.4 * s})`,
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        {texto}
      </div>
    </div>
  );
};

/** Régua de etapas: use a MESMA em todas as cenas (com `ativa` mudando) para dar fio condutor. */
export const Etapas: React.FC<{
  itens: { n?: string; texto: string }[];
  /** índice da etapa atual (as anteriores ficam "feitas") */
  ativa: number;
  /** frame em que ela entra (0 = já está na tela — use quando vem da cena anterior) */
  at?: number;
  /** frame em que a etapa ativa acende (toca o som) */
  acende?: number;
  top?: number;
}> = ({ itens, ativa, at = 0, acende, top = 270 }) => {
  if (useContext(SemOverlays)) return null;
  const f = useCurrentFrame();
  const s = at <= 0 ? 1 : pop(f, at);
  const luz = acende === undefined ? 1 : interpolate(f, [acende, acende + 8], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 64,
        right: 64,
        padding: "16px 10px 14px",
        borderRadius: 20,
        border: `1.5px solid ${C.border}`,
        background: C.panel,
        display: "flex",
        justifyContent: "space-around",
        opacity: s,
      }}
    >
      {acende !== undefined ? <SomAparecer at={acende} mult={0.7} /> : null}
      {itens.map((it, i) => {
        const on = i === ativa;
        const feito = i < ativa;
        const k = on ? luz : feito ? 1 : 0;
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 0 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 99,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: SANS,
                fontWeight: 800,
                fontSize: 20,
                background: on ? `rgba(220,255,60,${k})` : feito ? "rgba(220,255,60,0.25)" : "#2b2b2a",
                color: on && k > 0.5 ? C.ink : C.text,
                boxShadow: on ? `0 0 ${18 * k}px ${C.accent}` : "none",
              }}
            >
              {it.n ?? i + 1}
            </div>
            <div style={{ fontFamily: MONO, fontSize: 17, letterSpacing: 2, color: on ? C.text : C.textDim, whiteSpace: "nowrap" }}>{it.texto}</div>
          </div>
        );
      })}
    </div>
  );
};

/** Pílulas de contexto que se empilham no topo, centralizadas (cada uma entra no seu `at`). */
export const Contexto: React.FC<{ itens: { texto: string; at: number; on?: boolean }[]; top?: number }> = ({ itens, top = 300 }) => {
  if (useContext(SemOverlays)) return null;
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      {itens.map((it, i) => {
        const s = pop(f, it.at);
        if (s < 0.01) return null;
        return (
          <div
            key={i}
            style={{
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: 2,
              padding: "8px 18px",
              borderRadius: 999,
              background: it.on ? C.accent : "rgba(40,40,38,0.92)",
              color: it.on ? C.ink : C.text,
              border: `1.5px solid ${it.on ? C.accent : C.border}`,
              opacity: s,
              transform: `translateY(${(1 - s) * -12}px)`,
              textTransform: "uppercase",
            }}
          >
            <SomAparecer at={it.at} mult={0.6} />
            {it.texto}
          </div>
        );
      })}
    </div>
  );
};

/**
 * Vídeo real em TELA CHEIA por alguns segundos (passagem rápida, como abrir com a imagem da notícia),
 * com fade de entrada/saída e crédito. Mudo por padrão (a narração fala por cima).
 *   <VideoTelaCheia src="explicativo/roadster/clipes/demo.mp4" at={0} dur={75} inicio={3} credito="IMAGENS: TESLA" />
 */
export const VideoTelaCheia: React.FC<{
  src: string;
  at: number;
  dur: number;
  inicio?: number;
  credito?: string;
  volume?: number;
}> = ({ src, at, dur, inicio = 0, credito, volume = 0 }) => {
  if (useContext(SemOverlays)) return null;
  const f = useCurrentFrame();
  if (f < at || f > at + dur) return null;
  const o = interpolate(f, [at, at + 8, at + dur - 8, at + dur], [0, 1, 1, 0], clamp);
  const zoom = interpolate(f, [at, at + dur], [1.04, 1.12], clamp);
  return (
    <Sequence from={at} durationInFrames={dur} layout="none">
      <div style={{ position: "absolute", inset: 0, opacity: o, background: "#000", overflow: "hidden" }}>
        <OffthreadVideo
          src={staticFile(src)}
          startFrom={Math.round(inicio * 30)}
          volume={volume}
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})` }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.7) 100%)" }} />
        {credito ? (
          <div style={{ position: "absolute", right: 64, top: 1180, fontFamily: MONO, fontWeight: 700, fontSize: 20, letterSpacing: 2, color: C.text, padding: "6px 14px", borderRadius: 999, background: "rgba(20,20,20,0.85)" }}>
            {credito.toUpperCase()}
          </div>
        ) : null}
      </div>
    </Sequence>
  );
};
