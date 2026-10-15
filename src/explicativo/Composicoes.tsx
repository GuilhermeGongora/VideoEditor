import React from "react";
import { CalculateMetadataFunction, Composition, staticFile } from "remotion";
import { Explicativo, Roteiro, Tempos } from "./Explicativo";
import { CENAS_6X1 } from "./videos/Escala6x1";
import roteiro6x1 from "../../videos/6x1/roteiro.json";

type Props = { roteiro: Roteiro; tempos: Tempos | null };

const meta: CalculateMetadataFunction<Props> = async ({ props }) => {
  const res = await fetch(staticFile(`explicativo/${props.roteiro.slug}/tempos.json`));
  if (!res.ok) throw new Error(`Rode antes: npm run narrar -- ${props.roteiro.slug}`);
  const tempos = (await res.json()) as Tempos;
  return { durationInFrames: Math.ceil(tempos.duracao * 30), props: { ...props, tempos } };
};

/** Cada vídeo explicativo = roteiro (videos/<slug>/roteiro.json) + cenas (src/explicativo/videos/*.tsx). */
const VIDEOS: { id: string; roteiro: Roteiro; cenas: typeof CENAS_6X1 }[] = [
  { id: "Escala6x1", roteiro: roteiro6x1 as Roteiro, cenas: CENAS_6X1 },
];

export const Explicativos: React.FC = () => (
  <>
    {VIDEOS.map((v) => (
      <Composition
        key={v.id}
        id={v.id}
        component={({ roteiro, tempos }: Props) => (tempos ? <Explicativo roteiro={roteiro} tempos={tempos} cenas={v.cenas} /> : null)}
        defaultProps={{ roteiro: v.roteiro, tempos: null } as Props}
        calculateMetadata={meta}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
      />
    ))}
  </>
);
