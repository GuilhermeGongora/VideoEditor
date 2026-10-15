import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Sequence } from "remotion";
import { fitText } from "@remotion/layout-utils";
import { C, MONO, SANS } from "./theme";
import { SemOverlays } from "./ui/Overlays";
import type { CenaProps, Roteiro, Tempos } from "./Explicativo";

export type ThumbCfg = {
  /** Linhas do título separadas por \n. Trecho entre *asteriscos* sai na cor de destaque. */
  titulos: string[];
  /** id da cena usada de fundo e o quadro (contado do início da cena) */
  cena: string;
  quadro: number;
  /** quanto o 3D desce para dar espaço ao título (px) e o zoom dele */
  descer?: number;
  zoom?: number;
};

const partes = (linha: string) =>
  linha.split(/(\*[^*]+\*)/g).filter(Boolean).map((p) => ({ t: p.replace(/\*/g, ""), on: p.startsWith("*") }));

const LARGURA = 940;

/**
 * Thumbnail/capa vertical 1080x1920: chip da marca, título grande (com destaque em amarelo)
 * e a cena 3D do vídeo por baixo. Título dentro da área que o Instagram mostra no perfil (4:5).
 */
export const Thumb: React.FC<{
  roteiro: Roteiro & { thumb?: ThumbCfg };
  tempos: Tempos | null;
  cenas: Record<string, React.FC<CenaProps>>;
  variante?: number;
}> = ({ roteiro, tempos, cenas, variante = 0 }) => {
  const cfg = roteiro.thumb!;
  const [handle] = useState(() => delayRender("fonte do título"));
  const [pronto, setPronto] = useState(false);
  useEffect(() => {
    document.fonts.load(`800 120px Inter`).then(() => setPronto(true));
  }, []);
  useEffect(() => {
    if (pronto) continueRender(handle);
  }, [pronto, handle]);

  const linhas = (cfg.titulos[variante] ?? cfg.titulos[0]).split("\n");
  const tamanho = pronto
    ? Math.min(
        138,
        ...linhas.map(
          (l) => fitText({ text: l.replace(/\*/g, ""), withinWidth: LARGURA, fontFamily: "Inter", fontWeight: 800, letterSpacing: "-3px" }).fontSize,
        ),
      )
    : 120;

  const Cena = cenas[cfg.cena];
  const tc = tempos?.cenas.find((c) => c.id === cfg.cena);
  const w = (texto: string) => {
    if (!tc) return 0;
    const alvo = texto.toLowerCase();
    const p = tc.palavras.find((q) => q.w.toLowerCase().startsWith(alvo));
    return p ? Math.round((p.start - tc.start) * 30) : 0;
  };

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* 3D por baixo, deslocado para baixo */}
      <AbsoluteFill style={{ transform: `translateY(${cfg.descer ?? 260}px) scale(${cfg.zoom ?? 1.3})` }}>
        <SemOverlays.Provider value>
          <Sequence from={-cfg.quadro} layout="none">
            {Cena ? <Cena dur={cfg.quadro + 60} w={w} /> : null}
          </Sequence>
        </SemOverlays.Provider>
      </AbsoluteFill>
      {/* escurece o topo para o título saltar */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(10,10,10,0.96) 0%, rgba(10,10,10,0.85) 30%, rgba(10,10,10,0) 52%), radial-gradient(ellipse 90% 55% at 50% 70%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)",
        }}
      />
      <div style={{ position: "absolute", left: 70, right: 70, top: 300 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 14,
            padding: "12px 26px 12px 16px",
            borderRadius: 999,
            border: `2px solid ${C.border}`,
            background: "rgba(30,30,30,0.9)",
          }}
        >
          <div style={{ width: 26, height: 26, borderRadius: 99, background: C.accent, boxShadow: `0 0 22px ${C.accent}` }} />
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: C.text }}>
            {roteiro.marca}
          </div>
        </div>
        <div
          style={{
            marginTop: 34,
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: tamanho,
            lineHeight: 1.04,
            letterSpacing: -3,
            color: C.text,
            textShadow: "0 6px 30px rgba(0,0,0,0.6)",
          }}
        >
          {linhas.map((l, i) => (
            <div key={i} style={{ whiteSpace: "nowrap" }}>
              {partes(l).map((p, j) => (
                <span key={j} style={{ color: p.on ? C.accent : C.text }}>
                  {p.t}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
