import React from "react";
import { CalculateMetadataFunction, Composition, staticFile } from "remotion";
import { Explicativo, Roteiro, Tempos } from "./Explicativo";
import { Thumb, ThumbCfg } from "./Thumb";
import { ENCERRAMENTO } from "./ui/Encerramento";
import type { CenaProps } from "./Explicativo";

type Props = { roteiro: Roteiro & { thumb?: ThumbCfg }; tempos: Tempos | null; variante?: number };

const meta: CalculateMetadataFunction<Props> = async ({ props }) => {
  const res = await fetch(staticFile(`explicativo/${props.roteiro.slug}/tempos.json`));
  // Sem narração ainda: não quebra os outros vídeos; este fica curto e vazio até rodar o narrar.
  if (!res.ok) return { durationInFrames: 30, props: { ...props, tempos: null } };
  const tempos = (await res.json()) as Tempos;
  return { durationInFrames: Math.ceil(tempos.duracao * 30) - 12 + ENCERRAMENTO, props: { ...props, tempos } };
};

type Video = { id: string; roteiro: Roteiro; cenas: Record<string, React.FC<CenaProps>> };

/**
 * Cada vídeo explicativo = roteiro (videos/<slug>/roteiro.json) + cenas (src/explicativo/videos/<Nome>.tsx).
 * Os vídeos se registram sozinhos: todo arquivo em ./videos que exporta `VIDEO` vira uma composição
 * (e a sua thumbnail). NÃO é preciso editar este arquivo para criar um vídeo novo.
 */
declare const require: { context: (d: string, sub: boolean, re: RegExp) => { keys: () => string[]; (k: string): { VIDEO?: Video } } };
const ctx = require.context(
  "./videos",
  false,
  /\.tsx$/,
);
const VIDEOS: Video[] = ctx
  .keys()
  .map((k) => ctx(k).VIDEO)
  .filter((v): v is Video => Boolean(v))
  .sort((a, b) => a.id.localeCompare(b.id));

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
    {VIDEOS.map((v) => (
      <Composition
        key={`${v.id}Thumb`}
        id={`${v.id}Thumb`}
        component={({ roteiro, tempos, variante }: Props) => <Thumb roteiro={roteiro} tempos={tempos} cenas={v.cenas} variante={variante} />}
        defaultProps={{ roteiro: v.roteiro, tempos: null, variante: 0 } as Props}
        calculateMetadata={async (a) => ({ ...(await meta(a)), durationInFrames: 1 })}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1920}
      />
    ))}
  </>
);
