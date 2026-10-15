import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT, resolveColor, strokeText, TYPEWRITER, withEmoji } from "./style";
import { Caption } from "./types";

export const CaptionView: React.FC<{ caption: Caption; colors: Record<string, string> }> = ({ caption, colors }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const style = caption.style ?? "plain";
  const x = caption.x ?? 540;
  const y = caption.y ?? 1100;

  const pop = spring({ frame, fps, config: { damping: style === "pop" ? 7 : 12, stiffness: 240, mass: 0.6 } });
  const scale = interpolate(pop, [0, 1], [style === "pop" ? 0 : 0.6, 1]);
  const rotate = style === "pop" ? interpolate(pop, [0, 1], [-12, -4]) : 0;

  const base: React.CSSProperties = {
    position: "absolute",
    left: x,
    top: y,
    transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`,
    whiteSpace: "pre",
    textAlign: "center",
  };

  if (style === "box" || style === "whitebox") {
    const dark = style === "box";
    return (
      <div
        style={{
          ...base,
          background: dark ? "rgba(0,0,0,0.88)" : "#fff",
          color: resolveColor(caption.color ?? (dark ? "white" : "black"), colors),
          fontFamily: dark ? TYPEWRITER : FONT,
          fontWeight: 700,
          fontSize: caption.size ?? 44,
          padding: dark ? "16px 30px" : "14px 28px",
          borderRadius: dark ? 6 : 12,
          boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
        }}
      >
        {withEmoji(caption.text)}
      </div>
    );
  }

  const size = caption.size ?? (style === "pop" ? 96 : 64);
  return (
    <div
      style={{
        ...base,
        color: resolveColor(caption.color ?? (style === "pop" ? "red" : "white"), colors),
        fontWeight: 900,
        fontSize: size,
        ...strokeText(Math.round(size * 0.16)),
      }}
    >
      {withEmoji(caption.text)}
    </div>
  );
};
