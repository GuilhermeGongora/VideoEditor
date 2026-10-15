import React, { createContext, useContext } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, MONO, SANS } from "../theme";
import { clamp, pop } from "../anim";
import { Simbolo } from "./Simbolo";

/** Na thumbnail os cartões/anotações das cenas somem (só fica o 3D + título). */
export const SemOverlays = createContext(false);

/** Marca no topo + chip do capítulo. */
export const Hud: React.FC<{ marca: string; chip: string; chipAt?: number }> = ({ marca, chip, chipAt = 0 }) => {
  const f = useCurrentFrame();
  const s = pop(f, chipAt);
  return (
    <div style={{ position: "absolute", left: 64, top: 150 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Simbolo size={34} glow={false} />
        <div style={{ fontFamily: MONO, fontSize: 21, letterSpacing: 4, color: "rgba(244,244,240,0.55)", fontWeight: 700 }}>{marca}</div>
      </div>
      <div
        style={{
          marginTop: 16,
          display: "inline-flex",
          alignItems: "center",
          gap: 14,
          padding: "10px 22px 10px 14px",
          borderRadius: 999,
          border: `1.5px solid ${C.border}`,
          background: C.panel,
          transform: `scale(${0.85 + 0.15 * s})`,
          transformOrigin: "left center",
          opacity: s,
        }}
      >
        <div style={{ width: 22, height: 22, borderRadius: 99, background: C.accent, boxShadow: `0 0 18px ${C.accent}` }} />
        <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, letterSpacing: 3, color: C.text }}>{chip}</div>
      </div>
    </div>
  );
};

/** Cartão de dado: rótulo pequeno + número grande (e um segundo número à direita, opcional). */
export const DataCard: React.FC<{
  at: number;
  label: string;
  value: React.ReactNode;
  unit?: string;
  rightLabel?: string;
  rightValue?: React.ReactNode;
  top?: number;
  out?: number;
}> = ({ at, label, value, unit, rightLabel, rightValue, top = 300, out }) => {
  if (useContext(SemOverlays)) return null;
  const f = useCurrentFrame();
  const s = pop(f, at);
  const o = out !== undefined ? interpolate(f, [out, out + 8], [1, 0], clamp) : 1;
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        right: 64,
        top,
        padding: "22px 30px 20px",
        borderRadius: 22,
        border: `1.5px solid ${C.border}`,
        background: C.panel,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        opacity: s * o,
        transform: `translateY(${(1 - s) * 30}px)`,
      }}
    >
      <div>
        <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 3, color: "rgba(244,244,240,0.55)" }}>{label}</div>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 88, color: C.text, lineHeight: 1.05, letterSpacing: -2 }}>
          {value}
          {unit ? <span style={{ fontSize: 40, fontWeight: 700, color: C.textDim, marginLeft: 6 }}>{unit}</span> : null}
        </div>
      </div>
      {rightLabel ? (
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 3, color: "rgba(244,244,240,0.55)" }}>{rightLabel}</div>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 88, color: C.accent, lineHeight: 1.05 }}>{rightValue}</div>
        </div>
      ) : null}
    </div>
  );
};

/** Pílulas pequenas (ex.: "+60 DIAS", "+1 ANO"). */
export const Tags: React.FC<{ items: { text: string; at: number; on?: boolean }[]; top: number }> = ({ items, top }) => {
  if (useContext(SemOverlays)) return null;
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 16 }}>
      {items.map((it, i) => {
        const s = pop(f, it.at);
        return (
          <div
            key={i}
            style={{
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: 24,
              letterSpacing: 2,
              padding: "9px 20px",
              borderRadius: 999,
              background: it.on ? C.accent : C.panel,
              color: it.on ? C.ink : C.text,
              border: `1.5px solid ${it.on ? C.accent : C.border}`,
              opacity: s,
              transform: `scale(${0.7 + 0.3 * s})`,
            }}
          >
            {it.text}
          </div>
        );
      })}
    </div>
  );
};

/** Caixa de anotação ligada a um ponto da tela por uma linha. */
export const Callout: React.FC<{
  at: number;
  x: number;
  y: number;
  dx?: number;
  dy?: number;
  title: string;
  sub?: string;
  out?: number;
}> = ({ at, x, y, dx = -120, dy = -160, title, sub, out }) => {
  if (useContext(SemOverlays)) return null;
  const f = useCurrentFrame();
  const s = pop(f, at, 30, 16);
  const line = interpolate(f, [at, at + 10], [0, 1], clamp);
  const o = out !== undefined ? interpolate(f, [out, out + 8], [1, 0], clamp) : 1;
  const bx = x + dx;
  const by = y + dy;
  const len = Math.hypot(dx, dy);
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o }}>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: len * line,
          height: 2,
          background: "rgba(255,255,255,0.75)",
          transform: `rotate(${ang}deg)`,
          transformOrigin: "0 50%",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - 7,
          top: y - 7,
          width: 14,
          height: 14,
          borderRadius: 99,
          background: C.accent,
          boxShadow: `0 0 14px ${C.accent}`,
          opacity: line,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: bx,
          top: by,
          transform: `translate(${dx < 0 ? "-100%" : "0"}, -50%) scale(${0.8 + 0.2 * s})`,
          transformOrigin: dx < 0 ? "right center" : "left center",
          opacity: s,
          padding: "14px 20px",
          borderRadius: 14,
          background: C.panel,
          border: `1.5px solid ${C.border}`,
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 9, height: 9, borderRadius: 9, background: C.accent }} />
          <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 30, color: C.text }}>{title}</div>
        </div>
        {sub ? (
          <div style={{ fontFamily: MONO, fontSize: 17, letterSpacing: 2, color: C.textDim, marginTop: 4, marginLeft: 19 }}>{sub}</div>
        ) : null}
      </div>
    </div>
  );
};

/** Rótulo pequeno solto (ex.: embaixo de um objeto). */
export const Label: React.FC<{ x: number; y: number; at: number; text: string; color?: string; size?: number }> = ({
  x,
  y,
  at,
  text,
  color = C.textDim,
  size = 20,
}) => {
  if (useContext(SemOverlays)) return null;
  const f = useCurrentFrame();
  const s = pop(f, at);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
        fontFamily: MONO,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: 2,
        color,
        opacity: s,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};
