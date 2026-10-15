// Cataloga a biblioteca de efeitos sonoros em public/soundeffects/ (e public/sfx/).
// Gera public/soundeffects/catalog.json com nome, categoria (subpasta), duração,
// momento do pico (impacto) e volume médio, para o Claude escolher os sons pelo nome.
//
// Uso: npm run sfx:index
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const PUBLIC = path.join(ROOT, "public");
const DIRS = ["soundeffects", "sfx"];
const EXT = new Set([".wav", ".mp3", ".ogg", ".m4a", ".aac", ".flac", ".opus"]);
const OUT = path.join(PUBLIC, "soundeffects", "catalog.json");

const walk = (dir) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
        const p = path.join(dir, d.name);
        return d.isDirectory() ? walk(p) : EXT.has(path.extname(d.name).toLowerCase()) ? [p] : [];
      })
    : [];

const analyze = (file) => {
  const duration = Number(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file])
      .toString()
      .trim(),
  );
  // Decodifica em mono 8 kHz para achar o pico (momento do impacto) e o volume médio
  const pcm = execFileSync("ffmpeg", ["-v", "error", "-i", file, "-ac", "1", "-ar", "8000", "-f", "s16le", "-"], {
    maxBuffer: 1024 * 1024 * 512,
  });
  let peak = 0;
  let peakAt = 0;
  let sumSq = 0;
  const n = Math.floor(pcm.length / 2);
  for (let i = 0; i < n; i++) {
    const v = Math.abs(pcm.readInt16LE(i * 2));
    sumSq += v * v;
    if (v > peak) {
      peak = v;
      peakAt = i;
    }
  }
  const rms = n ? Math.sqrt(sumSq / n) / 32768 : 0;
  return {
    duration: Number(duration.toFixed(2)),
    peakAt: Number((peakAt / 8000).toFixed(2)),
    loudnessDb: rms > 0 ? Number((20 * Math.log10(rms)).toFixed(1)) : -99,
  };
};

const files = DIRS.flatMap((d) => walk(path.join(PUBLIC, d)));
if (files.length === 0) {
  console.log("Nenhum som encontrado. Coloque seus efeitos em public/soundeffects/ (pode usar subpastas).");
  process.exit(0);
}

const previous = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { sounds: [] };
const cache = new Map(previous.sounds.map((s) => [s.src, s]));

const sounds = [];
for (const file of files) {
  const src = path.relative(PUBLIC, file).split(path.sep).join("/");
  const stat = fs.statSync(file);
  const cached = cache.get(src);
  let info;
  if (cached && cached.mtime === Math.round(stat.mtimeMs)) {
    info = cached;
  } else {
    try {
      info = { ...analyze(file), mtime: Math.round(stat.mtimeMs) };
    } catch (e) {
      console.warn(`✗ não consegui ler ${src}`);
      continue;
    }
  }
  const rel = path.relative(path.join(PUBLIC, src.split("/")[0]), file).split(path.sep);
  sounds.push({
    src,
    name: path.basename(file, path.extname(file)),
    category: rel.length > 1 ? rel.slice(0, -1).join("/") : src.split("/")[0],
    duration: info.duration,
    peakAt: info.peakAt,
    loudnessDb: info.loudnessDb,
    mtime: info.mtime,
  });
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ generated: new Date().toISOString(), count: sounds.length, sounds }, null, 2) + "\n");

const byCat = sounds.reduce((m, s) => ((m[s.category] ??= []).push(s), m), {});
console.log(`${sounds.length} sons catalogados em public/soundeffects/catalog.json\n`);
for (const [cat, list] of Object.entries(byCat)) {
  console.log(`[${cat}] ${list.length} sons`);
  for (const s of list.slice(0, 8)) console.log(`  ${s.name}  (${s.duration}s, pico em ${s.peakAt}s)`);
  if (list.length > 8) console.log(`  … +${list.length - 8}`);
}
