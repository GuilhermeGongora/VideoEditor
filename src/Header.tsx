import React from "react";
import { AbsoluteFill } from "remotion";
import { FONT, parseMarkup, resolveColor, strokeText, withEmoji } from "./style";

export const Header: React.FC<{
  titleLines: string[];
  subtitle?: string;
  handle?: string;
  headerHeight: number;
  colors: Record<string, string>;
}> = ({ titleLines, subtitle, handle, headerHeight, colors }) => {
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: headerHeight, background: "#000" }} />
      <div
        style={{
          position: "absolute",
          top: 86,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 82,
          lineHeight: "104px",
          color: "#fff",
          letterSpacing: -0.5,
        }}
      >
        {titleLines.map((line, i) => (
          <div key={i}>
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
