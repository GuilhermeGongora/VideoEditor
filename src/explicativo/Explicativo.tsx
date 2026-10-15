import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "./theme";
import { clamp } from "./anim";
import { Hud } from "./ui/Overlays";
import { Karaoke, Palavra } from "./ui/Karaoke";
import { ENCERRAMENTO, Encerramento } from "./ui/Encerramento";
import { Sons, SONS_PADRAO, SonsCtx } from "./ui/Sons";

export type Tempos = {
  duracao: number;
  cenas: { id: string; start: number; end: number; palavras: Palavra[] }[];
};

export type Roteiro = {
  slug: string;
  marca: string;
  sons?: Sons;
  /** chamada no encerramento, ex.: "comenta PIX que eu te mando as fontes" */
  cta?: string;
  cenas: { id: string; chip: string; fala: string }[];
};

/** O que cada cena recebe: duração em frames e `w("palavra")` → frame (local) em que ela é dita. */
export type CenaProps = { dur: number; w: (texto: string, n?: number) => number };

const limpa = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\w,]/g, "");

const TRANS = 10; // frames de sobreposição entre cenas

/** Fade de entrada da cena por cima da anterior. */
const Fade: React.FC<{ children: React.ReactNode; first: boolean }> = ({ children, first }) => {
  const f = useCurrentFrame();
  const o = first ? 1 : interpolate(f, [0, TRANS], [0, 1], clamp);
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

const Vinheta: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background:
        "radial-gradient(ellipse 90% 65% at 50% 48%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.38) 100%), linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 72%, rgba(0,0,0,0.4) 100%)",
    }}
  />
);

/**
 * Casca de um vídeo explicativo: narração, cenas na ordem do roteiro (cada uma no tempo da sua fala),
 * marca + chip do capítulo e legenda karaokê.
 */
export const Explicativo: React.FC<{
  roteiro: Roteiro;
  tempos: Tempos;
  cenas: Record<string, React.FC<CenaProps>>;
}> = ({ roteiro, tempos, cenas }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const todas = tempos.cenas.flatMap((c) => c.palavras);
  const sons = { ...SONS_PADRAO, ...(roteiro.sons ?? {}) };
  // trechos com voz (para abaixar a trilha enquanto alguém fala)
  const falas = todas.map((p) => [p.start * fps - 4, p.end * fps + 4] as const);
  const falando = (f: number) => {
    let lo = 0, hi = falas.length - 1;
    while (lo <= hi) {
      const m = (lo + hi) >> 1;
      if (f < falas[m][0]) hi = m - 1;
      else if (f > falas[m][1]) lo = m + 1;
      else return true;
    }
    return false;
  };
  const volTrilha = (f: number) => {
    const entra = interpolate(f, [0, 20], [0, 1], clamp);
    const sai = interpolate(f, [durationInFrames - 30, durationInFrames - 4], [1, 0], clamp);
    return sons.musicaVolume * (falando(f) ? 0.55 : 1) * entra * sai;
  };
  return (
    <SonsCtx.Provider value={{ ...sons, ligado: true }}>
    <AbsoluteFill style={{ background: C.bg }}>
      {sons.musica ? <Audio src={staticFile(sons.musica)} loop volume={volTrilha} /> : null}
      {tempos.cenas.map((tc, i) => {
        const Cena = cenas[tc.id];
        const info = roteiro.cenas.find((c) => c.id === tc.id);
        const from = Math.max(0, Math.round(tc.start * fps) - (i === 0 ? 0 : TRANS));
        const fim = i === tempos.cenas.length - 1 ? tempos.duracao : tc.end;
        const dur = Math.round(fim * fps) - from;
        const w = (texto: string, n = 0) => {
          const alvo = limpa(texto);
          const achadas = tc.palavras.filter((p) => limpa(p.w).startsWith(alvo));
          const p = achadas[n] ?? achadas[0];
          return p ? Math.round(p.start * fps) - from : 0;
        };
        return (
          <Sequence key={tc.id} from={from} durationInFrames={dur} name={tc.id}>
            <Fade first={i === 0}>
              {Cena ? <Cena dur={dur} w={w} /> : null}
              <Vinheta />
              <Hud marca={roteiro.marca} chip={info?.chip ?? ""} chipAt={i === 0 ? 2 : TRANS - 4} />
            </Fade>
          </Sequence>
        );
      })}
      <Karaoke palavras={todas} />
      <Audio src={staticFile(`explicativo/${roteiro.slug}/narracao.wav`)} />
      <Sequence from={Math.round(tempos.duracao * fps) - 12} durationInFrames={ENCERRAMENTO} name="encerramento">
        <Encerramento cta={roteiro.cta} />
      </Sequence>
      {sons.transicao
        ? tempos.cenas.slice(1).map((tc) => (
            <Sequence key={`tr-${tc.id}`} from={Math.max(0, Math.round(tc.start * fps) - TRANS - 4)} durationInFrames={24} layout="none">
              <Audio src={staticFile(sons.transicao!)} volume={0.5 * sons.volume} />
            </Sequence>
          ))
        : null}
      {sons.transicao ? (
        <Sequence from={Math.round(tempos.duracao * fps) - 16} durationInFrames={24} layout="none">
          <Audio src={staticFile(sons.transicao)} volume={0.45 * sons.volume} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
    </SonsCtx.Provider>
  );
};
