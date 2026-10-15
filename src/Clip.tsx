import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useVideoConfig } from "remotion";
import { Item } from "./types";

export const Clip: React.FC<{ item: Item; top: number; volume: (f: number) => number }> = ({ item, top, volume }) => {
  const { fps } = useVideoConfig();
  const src = staticFile(item.clip);
  const trimBefore = item.start ? Math.round(item.start * fps) : undefined;
  const trimAfter = item.end ? Math.round(item.end * fps) : undefined;
  const fit = item.fit ?? "cover";

  return (
    <AbsoluteFill style={{ top, height: undefined, bottom: 0, overflow: "hidden", background: "#000" }}>
      {fit === "contain" ? (
        <OffthreadVideo
          src={src}
          muted
          trimBefore={trimBefore}
          trimAfter={trimAfter}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(40px) brightness(0.6)",
            transform: "scale(1.2)",
          }}
        />
      ) : null}
      <OffthreadVideo
        src={src}
        volume={volume}
        trimBefore={trimBefore}
        trimAfter={trimAfter}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: fit }}
      />
    </AbsoluteFill>
  );
};
