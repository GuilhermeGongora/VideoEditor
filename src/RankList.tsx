import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fitText } from "@remotion/layout-utils";
import { plainForMeasure, rankColor, strokeText, withEmoji } from "./style";
import { Segment } from "./timeline";

export const RankList: React.FC<{
  slots: number;
  segments: Segment[];
  top: number;
  spacing: number;
  x: number;
  fontSize: number;
  labelMaxWidth: number;
  fontsReady: boolean;
}> = ({ slots, segments, top, spacing, x, fontSize, labelMaxWidth, fontsReady }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const numberWidth = fontSize * 1.25;

  return (
    <>
      {Array.from({ length: slots }, (_, i) => i + 1).map((rank) => {
        const seg = segments.find((s) => s.item.rank === rank);
        const shown = seg && frame >= seg.from;
        const t = seg ? frame - seg.from : 0;
        const pop = shown ? spring({ frame: t, fps, config: { damping: 11, stiffness: 220, mass: 0.6 } }) : 0;
        const scale = shown ? interpolate(pop, [0, 1], [0.3, 1]) : 1;
        const y = top + (rank - 1) * spacing;
        // Label longo encolhe para caber (sem cobrir o vídeo inteiro)
        const labelSize =
          seg && fontsReady
            ? Math.min(
                fontSize,
                Math.floor(fitText({ text: plainForMeasure(seg.item.label), withinWidth: labelMaxWidth, fontFamily: "Montserrat", fontWeight: 800 }).fontSize),
              )
            : fontSize;
        return (
          <div
            key={rank}
            style={{
              position: "absolute",
              left: x,
              top: y,
              height: spacing,
              display: "flex",
              alignItems: "center",
              fontSize,
              fontWeight: 800,
              whiteSpace: "nowrap",
              ...strokeText(Math.round(fontSize * 0.2)),
            }}
          >
            <span style={{ color: rankColor(rank), minWidth: numberWidth }}>{rank}.</span>
            {shown ? (
              <span
                style={{
                  color: "#fff",
                  display: "inline-block",
                  fontSize: labelSize,
                  WebkitTextStroke: `${Math.round(labelSize * 0.2)}px #000`,
                  transform: `scale(${scale})`,
                  transformOrigin: "left center",
                  opacity: Math.min(1, pop * 1.5),
                }}
              >
                {withEmoji(seg!.item.label)}
              </span>
            ) : null}
          </div>
        );
      })}
    </>
  );
};
