import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { rankColor, strokeText, withEmoji } from "./style";
import { Segment } from "./timeline";

export const RankList: React.FC<{
  slots: number;
  segments: Segment[];
  top: number;
  spacing: number;
  x: number;
  fontSize: number;
}> = ({ slots, segments, top, spacing, x, fontSize }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <>
      {Array.from({ length: slots }, (_, i) => i + 1).map((rank) => {
        const seg = segments.find((s) => s.item.rank === rank);
        const shown = seg && frame >= seg.from;
        const t = seg ? frame - seg.from : 0;
        const pop = shown ? spring({ frame: t, fps, config: { damping: 11, stiffness: 220, mass: 0.6 } }) : 0;
        const scale = shown ? interpolate(pop, [0, 1], [0.3, 1]) : 1;
        const y = top + (rank - 1) * spacing;
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
            <span style={{ color: rankColor(rank), minWidth: fontSize * 1.25 }}>{rank}.</span>
            {shown ? (
              <span
                style={{
                  color: "#fff",
                  display: "inline-block",
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
