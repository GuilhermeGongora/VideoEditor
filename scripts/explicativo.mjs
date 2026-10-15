// Atalhos dos vídeos explicativos.
//   npm run quadros -- 6x1   → um quadro de cada cena (no fim de cada fala) em out/quadros/<slug>/grade.jpg
//   npm run explicar -- 6x1  → renderiza o vídeo em out/<slug>.mp4
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const [modo, slug] = process.argv.slice(2);
if (!slug) {
  console.log("Uso: npm run quadros -- <slug>   |   npm run explicar -- <slug>");
  process.exit(1);
}
const rot = JSON.parse(fs.readFileSync(path.join(ROOT, "videos", slug, "roteiro.json"), "utf8"));
const temposPath = path.join(ROOT, "public", "explicativo", slug, "tempos.json");
if (!fs.existsSync(temposPath)) {
  console.log(`Falta a narração. Rode antes: npm run narrar -- ${slug}`);
  process.exit(1);
}
const tempos = JSON.parse(fs.readFileSync(temposPath, "utf8"));
const id = rot.composicao;
const extra = process.env.REMOTION_BROWSER ? [`--browser-executable=${process.env.REMOTION_BROWSER}`] : [];
const run = (args) => execFileSync("npx", ["remotion", ...args, ...extra], { cwd: ROOT, stdio: "inherit" });

if (modo === "render") {
  const out = `out/${slug}.mp4`;
  run(["render", id, out, "--concurrency=2"]);
  console.log(`\nPronto: ${out}  (baixe com: npm run baixar)`);
} else {
  const dir = path.join(ROOT, "out", "quadros", slug);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  execFileSync("npx", ["remotion", "bundle", "--out-dir=out/bundle", "--log=error"], { cwd: ROOT, stdio: "inherit" });
  const frames = tempos.cenas.map((c) => Math.round((c.start * 0.2 + c.end * 0.8) * 30));
  frames.forEach((fr, i) => {
    run(["still", "out/bundle", id, path.join(dir, `${String(i + 1).padStart(2, "0")}-${tempos.cenas[i].id}.jpg`), `--frame=${fr}`, "--image-format=jpeg", "--log=error"]);
  });
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".jpg")).sort();
  const n = files.length;
  const layout = files.map((_, k) => `${(k % 4) * 405}_${Math.floor(k / 4) * 720}`).join("|");
  const filters = files.map((f, k) => `[${k}]scale=405:720[s${k}];`).join("") + files.map((_, k) => `[s${k}]`).join("") + `xstack=inputs=${n}:layout=${layout}:fill=white`;
  execFileSync("ffmpeg", ["-v", "error", "-y", ...files.flatMap((f) => ["-i", path.join(dir, f)]), "-filter_complex", filters, path.join(dir, "grade.jpg")]);
  console.log(`Quadros: out/quadros/${slug}/ (grade.jpg mostra todas as cenas)`);
}
