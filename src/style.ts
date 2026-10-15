import React from "react";
import { getStaticFiles, Img, staticFile } from "remotion";

export const DEFAULT_COLORS: Record<string, string> = {
  white: "#FFFFFF",
  red: "#FF1F1F",
  blue: "#1E8FFF",
  gold: "#FFD21F",
  yellow: "#FFE600",
  green: "#2BE34A",
  pink: "#FF3FA4",
  orange: "#FF8A00",
  black: "#000000",
};

export const FONT = "Montserrat, sans-serif";
export const TYPEWRITER = "'Courier Prime', 'Courier New', monospace";

export const resolveColor = (c: string | undefined, colors: Record<string, string>) =>
  c ? colors[c] ?? c : "#FFFFFF";

/** Texto branco com contorno preto grosso (estilo TikTok). */
export const strokeText = (strokePx: number): React.CSSProperties => ({
  fontFamily: FONT,
  WebkitTextStroke: `${strokePx}px #000`,
  paintOrder: "stroke fill",
});

/** Converte "Ranking [Funniest](red)" em pedaços coloridos. */
export const parseMarkup = (line: string): { text: string; color?: string }[] => {
  const out: { text: string; color?: string }[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m.index > last) out.push({ text: line.slice(last, m.index) });
    out.push({ text: m[1], color: m[2] });
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push({ text: line.slice(last) });
  return out;
};

export const rankColor = (rank: number) =>
  rank === 1 ? DEFAULT_COLORS.gold : rank === 2 ? DEFAULT_COLORS.blue : rank === 3 ? DEFAULT_COLORS.red : "#FFFFFF";

const EMOJI_RE = /((?:\p{Extended_Pictographic}|\p{Regional_Indicator})(?:\u{FE0F}|\u{20E3}|\u{200D}|\p{Extended_Pictographic}|\p{Emoji_Modifier}|\p{Regional_Indicator})*)/gu;

let available: Set<string> | null = null;
const emojiFiles = () => {
  if (!available) {
    try {
      available = new Set(getStaticFiles().map((f) => f.name));
    } catch {
      available = new Set();
    }
  }
  return available;
};

/** Caminho do SVG do Twemoji para um emoji (ou null se não existir). */
const emojiFile = (emoji: string): string | null => {
  const cps = [...emoji].map((c) => c.codePointAt(0)!.toString(16));
  const candidates = [cps.join("-"), cps.filter((c) => c !== "fe0f").join("-")];
  const files = emojiFiles();
  for (const c of candidates) {
    const name = `emoji/${c}.svg`;
    if (files.size === 0 || files.has(name)) return name;
  }
  return null;
};

/**
 * Troca emojis por imagens (Twemoji). Assim eles aparecem iguais no Studio,
 * no render local e no Codespaces, mesmo com contorno no texto.
 */
export const withEmoji = (text: string): React.ReactNode =>
  text.split(EMOJI_RE).map((part, i) => {
    if (i % 2 === 0 || !part) return part;
    const file = emojiFile(part);
    if (!file) return part;
    return React.createElement(Img, {
      key: i,
      src: staticFile(file),
      style: {
        height: "1.05em",
        width: "1.05em",
        verticalAlign: "-0.17em",
        margin: "0 0.04em",
        display: "inline-block",
      },
    });
  });
