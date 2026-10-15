import React, { createContext, useContext } from "react";
import { Audio, Sequence, staticFile } from "remotion";

/**
 * Camada de efeitos automáticos dos explicativos. O roteiro pode trocar qualquer som pelo da biblioteca
 * do usuário (campo "sons" do roteiro.json, use o src do catálogo: "soundeffects/_norm/...").
 */
export type Sons = {
  /** trilha de fundo (loop). null = sem trilha */
  musica?: string | null;
  /** volume da trilha quando ninguém fala (abaixa sozinha sob a voz) */
  musicaVolume?: number;
  /** som na troca de cena */
  transicao?: string | null;
  /** som quando um cartão/anotação/pílula aparece */
  aparecer?: string | null;
  /** volume geral dos efeitos */
  volume?: number;
};

export const SONS_PADRAO: Required<Sons> = {
  musica: "sfx/bed-scientia.mp3",
  musicaVolume: 0.5,
  transicao: "sfx/swoosh.wav",
  aparecer: "sfx/tick.wav",
  volume: 0.55,
};

export const SonsCtx = createContext<Required<Sons> & { ligado: boolean }>({ ...SONS_PADRAO, ligado: false });

/** Toca o som de "aparecer" no frame `at` (usado pelos cartões, anotações e pílulas). */
export const SomAparecer: React.FC<{ at: number; mult?: number }> = ({ at, mult = 1 }) => {
  const s = useContext(SonsCtx);
  if (!s.ligado || !s.aparecer || !Number.isFinite(at)) return null;
  return (
    <Sequence from={Math.max(0, Math.round(at))} durationInFrames={20} layout="none">
      <Audio src={staticFile(s.aparecer)} volume={0.32 * s.volume * mult} />
    </Sequence>
  );
};
