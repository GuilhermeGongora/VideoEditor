import React from "react";
import { CalculateMetadataFunction, Composition, staticFile } from "remotion";
import { parseMedia } from "@remotion/media-parser";
import { Ranking } from "./Ranking";
import { clipFrames } from "./timeline";
import { RankingData } from "./types";
import data from "../ranking.json";
import { Explicativos } from "./explicativo/Composicoes";

const calculateMetadata: CalculateMetadataFunction<RankingData> = async ({ props }) => {
  const fps = props.fps ?? 30;
  const items = await Promise.all(
    props.items.map(async (item) => {
      if (item.duration || item.end) return item;
      const { slowDurationInSeconds } = await parseMedia({
        src: staticFile(item.clip),
        fields: { slowDurationInSeconds: true },
      });
      return { ...item, duration: slowDurationInSeconds };
    }),
  );
  const durationInFrames = items.reduce((sum, it) => sum + clipFrames(it, fps), 0);
  return {
    fps,
    width: props.width ?? 1080,
    height: props.height ?? 1920,
    durationInFrames: Math.max(1, durationInFrames),
    props: { ...props, items },
  };
};

export const RemotionRoot: React.FC = () => (
  <>
  <Composition
    id="Ranking"
    component={Ranking}
    defaultProps={data as RankingData}
    calculateMetadata={calculateMetadata}
    durationInFrames={300}
    fps={30}
    width={1080}
    height={1920}
  />
  <Explicativos />
  </>
);
