import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { CaptionView } from "./Captions";
import { Clip } from "./Clip";
import { useFonts } from "./fonts";
import { Header } from "./Header";
import { duckGain, DuckWindow, edgeFade, masterFade, sfxVolume } from "./mix";
import { RankList } from "./RankList";
import { DEFAULT_COLORS } from "./style";
import { buildSegments } from "./timeline";
import { RankingData } from "./types";

export const Ranking: React.FC<RankingData> = (props) => {
  const { fps, durationInFrames: total } = useVideoConfig();
  const frame = useCurrentFrame();
  const colors = { ...DEFAULT_COLORS, ...(props.colors ?? {}) };
  const headerHeight = props.headerHeight ?? 322;
  const list = { top: 576, spacing: 120, x: 52, fontSize: 44, labelMaxWidth: 600, ...(props.list ?? {}) };
  const sfx = { reveal: "sfx/pop.wav", transition: "sfx/whoosh.wav", final: "sfx/boom.wav", volume: 0.7, ...(props.sfx ?? {}) };
  const segments = buildSegments(props.items, fps);
  const slots = Math.max(...props.items.map((i) => i.rank));
  const endFade = Math.round((props.endFadeSeconds ?? 0.4) * fps);

  const allText = [
    ...props.titleLines,
    props.subtitle ?? "",
    props.handle ?? "",
    ...props.items.flatMap((i) => [i.label, ...(i.captions ?? []).map((c) => c.text)]),
  ].join(" ");
  const fontsReady = useFonts(allText);

  const fadeFrames = Math.round((props.fadeInSeconds ?? 0.4) * fps);
  const fade = fadeFrames > 0 ? interpolate(frame, [0, fadeFrames], [1, 0], { extrapolateRight: "clamp" }) : 0;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {segments.map((s) => {
        const sounds = s.item.sounds ?? [];
        const ducks: DuckWindow[] = sounds
          .filter((snd) => (snd.duck ?? 0) > 0)
          .map((snd) => {
            const from = Math.round(snd.at * fps);
            return { from, to: from + Math.round((snd.duckSeconds ?? snd.maxSeconds ?? 0.8) * fps), amount: snd.duck! };
          });
        const base = s.item.volume ?? 1;
        const clipVolume = (f: number) => base * edgeFade(f, s.len) * duckGain(f, ducks) * masterFade(s.from + f, total, endFade);
        return (
          <Sequence key={`clip-${s.index}`} from={s.from} durationInFrames={s.len} premountFor={fps}>
            <Clip item={s.item} top={headerHeight} volume={clipVolume} />
            {(s.item.captions ?? []).map((c, ci) => {
              const cFrom = Math.round(c.from * fps);
              const cLen = c.to !== undefined ? Math.max(1, Math.round((c.to - c.from) * fps)) : Math.max(1, s.len - cFrom);
              return (
                <Sequence key={ci} from={cFrom} durationInFrames={cLen} layout="none">
                  <CaptionView caption={c} colors={colors} />
                  {c.sfx ? <Audio src={staticFile(c.sfx)} volume={sfx.volume} /> : null}
                </Sequence>
              );
            })}
            {sounds.map((snd, si) => {
              const at = Math.round(snd.at * fps);
              if (at >= s.len || at < 0) return null;
              const maxFrames = snd.maxSeconds ? Math.round(snd.maxSeconds * fps) : undefined;
              return (
                <Sequence key={`snd-${si}`} from={at} durationInFrames={maxFrames} layout="none">
                  <Audio src={staticFile(snd.src)} volume={sfxVolume(snd.volume ?? 0.8, s.from + at, total, endFade, maxFrames)} />
                </Sequence>
              );
            })}
          </Sequence>
        );
      })}

      {/* Fade de entrada a partir do preto */}
      <AbsoluteFill style={{ background: "#000", opacity: fade, pointerEvents: "none" }} />

      <Header
        titleLines={props.titleLines}
        subtitle={props.subtitle}
        handle={props.handle}
        headerHeight={headerHeight}
        colors={colors}
        fontsReady={fontsReady}
      />
      <RankList slots={slots} segments={segments} fontsReady={fontsReady} {...list} />

      {/* Sons fixos do ranking: whoosh na troca, pop na entrada do item, impacto no #1 */}
      {segments.map((s) => {
        const isFinal = s.item.rank === 1;
        const revealSrc = s.item.sfx !== undefined ? s.item.sfx : isFinal ? sfx.final ?? sfx.reveal : sfx.reveal;
        const whooshFrom = Math.max(0, s.from - Math.round(0.18 * fps));
        return (
          <React.Fragment key={`sfx-${s.index}`}>
            {s.index > 0 && sfx.transition ? (
              <Sequence from={whooshFrom} durationInFrames={Math.round(fps * 1)} layout="none">
                <Audio src={staticFile(sfx.transition)} volume={sfxVolume(sfx.volume * 0.8, whooshFrom, total, endFade, Math.round(fps * 1))} />
              </Sequence>
            ) : null}
            {revealSrc ? (
              <Sequence from={s.from} durationInFrames={Math.round(fps * 2.5)} layout="none">
                <Audio src={staticFile(revealSrc)} volume={sfxVolume(sfx.volume, s.from, total, endFade, Math.round(fps * 2.5))} />
              </Sequence>
            ) : null}
          </React.Fragment>
        );
      })}

      {props.music ? (
        <Audio src={staticFile(props.music.src)} volume={sfxVolume(props.music.volume ?? 0.12, 0, total, endFade)} loop />
      ) : null}
    </AbsoluteFill>
  );
};
