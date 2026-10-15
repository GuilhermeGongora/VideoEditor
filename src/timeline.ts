import { Item } from "./types";

export type Segment = { item: Item; from: number; len: number; index: number };

export const clipFrames = (item: Item, fps: number) => {
  const start = item.start ?? 0;
  const end = item.end ?? item.duration;
  if (end === undefined) {
    throw new Error(`O clipe "${item.clip}" está sem duração. Rode "npm run prep" ou informe "end".`);
  }
  return Math.max(1, Math.round((end - start) * fps));
};

export const buildSegments = (items: Item[], fps: number): Segment[] => {
  let from = 0;
  return items.map((item, index) => {
    const len = clipFrames(item, fps);
    const seg = { item, from, len, index };
    from += len;
    return seg;
  });
};
