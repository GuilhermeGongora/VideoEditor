// "Assiste" aos clipes para o Claude: gera folhas de frames COM O TEMPO escrito em cada quadro,
// espectrograma do áudio e uma linha do tempo de volume com eventos (pancadas, gritos, silêncios).
//
// Uso:
//   npm run analyze                    -> todos os clipes do ranking.json
//   npm run analyze -- clips/x.mp4     -> um clipe específico (caminho dentro de public/)
//   npm run analyze -- --fps 6         -> mais quadros por segundo (padrão 4)
//
// Saída em out/analysis/<clipe>/: frames-1.jpg (…), spectrum.png, audio.txt, summary.json
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { bar, decodePcm, hasAudioStream, probeDuration, rmsTimeline, silences, transients } from "./lib/audio.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const PUBLIC = path.join(ROOT, "public");
const OUT = path.join(ROOT, "out", "analysis");
const args = process.argv.slice(2);
const fpsArg = args.indexOf("--fps");
const FPS = fpsArg >= 0 ? Number(args[fpsArg + 1]) : 4;
const targets = args.filter((a, i) => !a.startsWith("--") && (fpsArg < 0 || i !== fpsArg + 1));

const FONT_CANDIDATES = [
  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
  "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
  "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
];
const FONT = FONT_CANDIDATES.find((f) => fs.existsSync(f));

let clips = targets;
if (!clips.length) {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, "ranking.json"), "utf8"));
  clips = data.items.map((it) => it.clip);
}

const COLS = 6;
const PER_SHEET = 48;

for (const clip of clips) {
  const file = path.isAbsolute(clip) ? clip : fs.existsSync(path.join(PUBLIC, clip)) ? path.join(PUBLIC, clip) : path.join(ROOT, clip);
  if (!fs.existsSync(file)) {
    console.warn(`✗ não encontrado: ${clip}`);
    continue;
  }
  const name = path.basename(file, path.extname(file));
  const dir = path.join(OUT, name);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const duration = probeDuration(file);

  // Folhas de frames com o tempo (segundos) escrito em cada quadro
  const total = Math.ceil(duration * FPS);
  const sheets = Math.ceil(total / PER_SHEET);
  const stamp = FONT
    ? `,drawbox=x=0:y=0:w=iw:h=34:color=black@0.7:t=fill,drawtext=fontfile=${FONT}:text='%{eif\\:t\\:d}.%{eif\\:mod(t*100\\,100)\\:d\\:2}s':x=6:y=5:fontsize=24:fontcolor=yellow`
    : "";
  for (let s = 0; s < sheets; s++) {
    const start = (s * PER_SHEET) / FPS;
    const rows = Math.ceil(Math.min(PER_SHEET, total - s * PER_SHEET) / COLS);
    execFileSync("ffmpeg", [
      "-v", "error", "-y",
      "-i", file,
      "-vf",
      `trim=start=${start},setpts=PTS-STARTPTS+${start}/TB,fps=${FPS},scale=240:-2${stamp},tile=${COLS}x${rows}:padding=4:color=white`,
      "-frames:v", "1",
      path.join(dir, `frames-${s + 1}.jpg`),
    ]);
  }

  // Áudio
  const audio = hasAudioStream(file);
  const pcm = audio ? decodePcm(file) : null;
  const WIN = 0.25;
  let lines = [];
  let summary = { clip, duration: Number(duration.toFixed(2)), fps: FPS, sheets, hasAudio: !!pcm };
  if (pcm) {
    const tl = rmsTimeline(pcm, WIN);
    const sil = silences(tl, WIN, -45, 0.3);
    const tr = transients(tl, WIN, 8, -35);
    const avg = tl.reduce((s, v) => s + v, 0) / Math.max(1, tl.length);
    const silentClip = avg < -50;
    summary = { ...summary, avgDb: Number(avg.toFixed(1)), silentClip, silences: sil, events: tr };
    lines.push(`Volume a cada ${WIN}s (dB). Eventos = subidas bruscas (pancada, grito, batida, impacto).`);
    tl.forEach((v, i) => {
      const t = i * WIN;
      const ev = tr.find((e) => Math.abs(e.t - t) < 0.01) ? "  ◀ evento" : "";
      lines.push(`${t.toFixed(2).padStart(6)}s ${v.toFixed(0).padStart(4)} ${bar(v)}${ev}`);
    });
    if (sil.length) lines.push(`\nSilêncios: ${sil.map(([a, b]) => `${a.toFixed(2)}–${b.toFixed(2)}s`).join(", ")}`);
    if (silentClip) lines.push(`\n⚠ Clipe praticamente sem áudio: precisa de som ambiente/efeitos para não ficar "morto".`);
    try {
      execFileSync("ffmpeg", [
        "-v", "error", "-y", "-i", file,
        "-filter_complex", "[0:a]aformat=channel_layouts=mono,showspectrumpic=s=1200x240:legend=1:scale=log:fscale=log",
        path.join(dir, "spectrum.png"),
      ]);
    } catch {}
  } else {
    lines.push("Sem trilha de áudio. Vai precisar de som ambiente/efeitos.");
  }
  fs.writeFileSync(path.join(dir, "audio.txt"), lines.join("\n") + "\n");
  fs.writeFileSync(path.join(dir, "summary.json"), JSON.stringify(summary, null, 2) + "\n");

  console.log(`✓ ${name}: ${duration.toFixed(1)}s, ${sheets} folha(s) de frames, áudio: ${pcm ? (summary.silentClip ? "MUDO" : `${summary.events.length} eventos`) : "não tem"}`);
  console.log(`   ${path.relative(ROOT, dir)}/  (frames-*.jpg, spectrum.png, audio.txt)`);
}
