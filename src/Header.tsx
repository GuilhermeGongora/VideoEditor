import React from "react";
import { AbsoluteFill } from "remotion";
import { fitText } from "@remotion/layout-utils";
import { FONT, parseMarkup, plainForMeasure, resolveColor, strokeText, withEmoji } from "./style";

const MAX_TITLE = 82;
const TITLE_WIDTH = 1000;

export const Header: React.FC<{
  titleLines: string[];
  subtitle?: string;
  handle?: string;
  headerHeight: number;
  colors: Record<string, string>;
  fontsReady: boolean;
}> = ({ titleLines, subtitle, handle, headerHeight, colors, fontsReady }) => {
  // Título: mesmo tamanho nas duas linhas, encolhe se alguma linha não couber
  const titleSize = fontsReady
    ? Math.min(
        MAX_TITLE,
        ...titleLines.map((l) =>
          Math.floor(
            fitText({ text: plainForMeasure(parseMarkup(l).map((p) => p.text).join("")), withinWidth: TITLE_WIDTH, fontFamily: "Montserrat", fontWeight: 900 })
              .fontSize,
          ),
        ),
      )
    : MAX_TITLE;
  const lineHeight = Math.round(titleSize * 1.27);
  const titleTop = 86 + Math.round((MAX_TITLE * 1.27 * 2 - lineHeight * 2) / 2);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: headerHeight, background: "#000" }} />
      <div
        style={{
          position: "absolute",
          top: titleTop,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: titleSize,
          lineHeight: `${lineHeight}px`,
          color: "#fff",
          letterSpacing: -0.5,
        }}
      >
        {titleLines.map((line, i) => (
          <div key={i} style={{ whiteSpace: "nowrap" }}>
            {parseMarkup(line).map((p, j) => (
              <span key={j} style={{ color: resolveColor(p.color ?? "white", colors), whiteSpace: "pre" }}>
                {withEmoji(p.text)}
              </span>
            ))}
          </div>
        ))}
      </div>
      {subtitle ? (
        <div
          style={{
            position: "absolute",
            top: 288,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 34,
            fontWeight: 800,
            color: "#fff",
            ...strokeText(7),
          }}
        >
          {withEmoji(subtitle)}
        </div>
      ) : null}
      {handle ? (
        <div
          style={{
            position: "absolute",
            top: 334,
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: 38,
            fontWeight: 800,
            color: "#fff",
            ...strokeText(8),
          }}
        >
          {withEmoji(handle)}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
