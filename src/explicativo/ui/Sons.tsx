import React, { createContext, useContext } from "react";
import { Audio, Sequence, staticFile } from "remotion";

/**
 * Camada de efeitos automáticos dos explicativos. O roteiro pode trocar qualquer som pelo da biblioteca
 * do usuário (campo "sons" do roteiro.json, use o src do catálogo: "soundeffects/_norm/...").
 */
export type Acento = {
  /** palavra da narração em que o som bate (ex.: "bilhão", "75") */
  palavra: string;
  /** id da cena onde procurar a palavra (opcional; sem ele procura no vídeo todo) */
  cena?: string;
  /** qual ocorrência da palavra (0 = primeira) */
  n?: number;
  /** arquivo do som (ex.: "sfx/boom.wav", "sfx/ding.wav", "sfx/riser.wav") */
  som: string;
  /** segundo do impacto dentro do arquivo (riser ≈ 1.49) — o som começa antes para o pico cair na palavra */
  pico?: number;
  volume?: number;
};

export type Sons = {
  /** trilha de fundo (loop). null = sem trilha */
  musica?: string | null;
  /** volume da trilha quando ninguém fala (abaixa sozinha sob a voz) */
  musicaVolume?: number;
  /** som na troca de cena; uma lista alterna entre os sons (não fica repetitivo) */
  transicao?: string | string[] | null;
  /** som quando anotação/pílula aparece */
  aparecer?: string | null;
  /** som quando o cartão de número (DataCard) aparece — mais "estalado" que o aparecer */
  dado?: string | null;
  /** impacto no 1º frame (o gancho) */
  abertura?: string | null;
  /** subida que termina na entrada do encerramento */
  final?: string | null;
  /** sons em palavras-chave da fala (2–4 por vídeo: o número forte, a virada, a resposta) */
  acentos?: Acento[];
  /** volume geral dos efeitos */
  volume?: number;
};

export const SONS_PADRAO: Required<Sons> = {
  musica: null, // o vídeo de referência (aproximação) não tem trilha; ligue por roteiro: "sons": {"musica": "sfx/bed-scientia.mp3"}
  musicaVolume: 0.5,
  transicao: ["sfx/swoosh.wav", "sfx/whoosh.wav"],
  aparecer: "sfx/tick.wav",
  dado: "sfx/pop.wav",
  abertura: "sfx/boom.wav",
  final: "sfx/riser.wav",
  acentos: [],
  volume: 0.55,
};

export const SonsCtx = createContext<Required<Sons> & { ligado: boolean }>({ ...SONS_PADRAO, ligado: false });

/** Toca o som de "aparecer" (ou o de "dado") no frame `at` — usado pelos cartões, anotações e pílulas. */
export const SomAparecer: React.FC<{ at: number; mult?: number; tipo?: "aparecer" | "dado" }> = ({ at, mult = 1, tipo = "aparecer" }) => {
  const s = useContext(SonsCtx);
  const src = tipo === "dado" ? s.dado ?? s.aparecer : s.aparecer;
  if (!s.ligado || !src || !Number.isFinite(at)) return null;
  const base = tipo === "dado" && s.dado ? 0.5 : 0.32;
  return (
    <Sequence from={Math.max(0, Math.round(at))} durationInFrames={24} layout="none">
      <Audio src={staticFile(src)} volume={base * s.volume * mult} />
    </Sequence>
  );
};
