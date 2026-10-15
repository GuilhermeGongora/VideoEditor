// Prepara os clipes brutos de clips/ para o Remotion e atualiza ranking.json.
//
// Convenção de nomes (recomendada):  <posição>-<texto-da-lista>.<ext>
//   6-nice-grandma.mp4   5-bro.mov   ...   1-fbi-robot.mp4
// A posição vira "rank" e o resto vira "label" (hífens viram espaços).
// O vídeo é montado do maior número até o 1.
// Sem número no nome: ordem alfabética = ordem de aparição.
//
// Uso:
//   npm run prep            -> converte clipes novos e adiciona itens que faltam
//   npm run prep -- --reset -> recria a lista de itens do zero a partir de clips/
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const RAW = path.join(ROOT, "clips");
const OUT = path.join(ROOT, "public", "clips");
const JSON_PATH = path.join(ROOT, "ranking.json");
const RESET = process.argv.includes("--reset");
const EXT = new Set([".mp4", ".mov", ".m4v", ".webm", ".mkv", ".avi"]);

fs.mkdirSync(RAW, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

const files = fs
  .readdirSync(RAW)
  .filter((f) => EXT.has(path.extname(f).toLowerCase()))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

if (files.length === 0) {
  console.log("Nenhum clipe em clips/. Coloque os vídeos lá (ex.: 6-nice-grandma.mp4 ... 1-fbi-robot.mp4).");
  process.exit(0);
}

const probeDuration = (file) =>
  Number(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file])
      .toString()
      .trim(),
  );

const hasAudio = (file) =>
  execFileSync("ffprobe", ["-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", file])
    .toString()
    .trim().length > 0;

const slug = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

const prepared = [];
for (const f of files) {
  const base = path.basename(f, path.extname(f));
  const src = path.join(RAW, f);
  const outName = `${slug(base) || "clip"}.mp4`;
  const dst = path.join(OUT, outName);

  const fresh = fs.existsSync(dst) && fs.statSync(dst).mtimeMs > fs.statSync(src).mtimeMs;
  if (!fresh) {
    console.log(`→ convertendo ${f}`);
    // 1080 de largura (ou 1920 de altura, o que couber), 30fps, H.264 + AAC.
    // Se o clipe não tiver áudio, cria uma faixa silenciosa para não quebrar a mixagem.
    const audio = hasAudio(src);
    const args = ["-y", "-v", "error", "-i", src];
    if (!audio) args.push("-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo");
    args.push(
      "-vf",
      "scale='if(gt(a,1080/1920),-2,1080)':'if(gt(a,1080/1920),1920,-2)',fps=30,format=yuv420p",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "20",
      "-c:a",
      "aac",
      "-ar",
      "48000",
      "-b:a",
      "192k",
    );
    if (!audio) args.push("-map", "0:v:0", "-map", "1:a:0", "-shortest");
    args.push("-movflags", "+faststart", dst);
    execFileSync("ffmpeg", args, { stdio: "inherit" });
  } else {
    console.log(`✓ ${f} (já convertido)`);
  }

  const m = base.match(/^\s*#?(\d+)[\s._-]*(.*)$/);
  prepared.push({
    clip: `clips/${outName}`,
    duration: Number(probeDuration(dst).toFixed(3)),
    rank: m ? Number(m[1]) : undefined,
    label: (m ? m[2] : base).replace(/[-_]+/g, " ").trim() || "TODO",
  });
}

// Ordem de aparição: ranks numéricos do maior para o menor; o resto em ordem alfabética.
const allNumbered = prepared.every((p) => p.rank !== undefined);
if (allNumbered) prepared.sort((a, b) => b.rank - a.rank);
else prepared.forEach((p, i) => (p.rank = prepared.length - i));

const template = {
  titleLines: ["Ranking [Funniest](red)", "[Robot](blue) Moments"],
  subtitle: "(Last one is amazing 😂😂)",
  handle: "@gongoale",
  fadeInSeconds: 0.8,
  sfx: { reveal: "sfx/pop.wav", transition: "sfx/whoosh.wav", final: "sfx/boom.wav", volume: 0.7 },
  music: null,
  items: [],
};

let data = fs.existsSync(JSON_PATH) ? JSON.parse(fs.readFileSync(JSON_PATH, "utf8")) : template;
if (RESET || !Array.isArray(data.items)) data.items = [];

const byClip = new Map(data.items.map((it) => [it.clip, it]));
for (const p of prepared) {
  const existing = byClip.get(p.clip);
  if (existing) {
    existing.duration = p.duration;
  } else {
    data.items.push({ rank: p.rank, label: p.label, clip: p.clip, duration: p.duration, captions: [], sounds: [] });
  }
}
// Remove itens cujo arquivo não existe mais
data.items = data.items.filter((it) => fs.existsSync(path.join(ROOT, "public", it.clip)));

fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + "\n");
const total = data.items.reduce((s, it) => s + ((it.end ?? it.duration) - (it.start ?? 0)), 0);
console.log(`\nranking.json atualizado: ${data.items.length} itens, ~${total.toFixed(1)}s de vídeo.`);
for (const it of data.items) console.log(`  #${it.rank}  ${it.label}  (${it.clip}, ${it.duration}s)`);
