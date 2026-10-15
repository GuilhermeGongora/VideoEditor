// Revisão automática do vídeo renderizado (o "olho e ouvido" de um editor antes de entregar).
// Uso: npm run qa            (analisa out/ranking.mp4)
//      npm run qa -- out/outro.mp4
//
// Verifica: silêncios ("buraco" no áudio), estouro/clipping, trechos altos demais, clipe muito mais
// baixo/alto que os outros, excesso de efeitos, final abrupto, ritmo (duração dos clipes), labels.
// Gera out/qa/report.md, out/qa/frames.jpg (com tempo e clipe) e out/qa/spectrum.png.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { decodePcm, peakInfo, probeDuration, rmsTimeline, silences, transients } from "./lib/audio.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const video = path.resolve(ROOT, process.argv[2] ?? "out/ranking.mp4");
const OUT = path.join(ROOT, "out", "qa");
if (!fs.existsSync(video)) {
  console.error(`Vídeo não encontrado: ${video}. Rode "npm run render" antes.`);
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

const data = JSON.parse(fs.readFileSync(path.join(ROOT, "ranking.json"), "utf8"));
const FPS = data.fps ?? 30;
let acc = 0;
const segs = data.items.map((it) => {
  const len = Math.round(((it.end ?? it.duration) - (it.start ?? 0)) * FPS) / FPS;
  const s = { rank: it.rank, label: it.label, from: acc, to: acc + len, len, item: it };
  acc += len;
  return s;
});
const clipAt = (t) => segs.find((s) => t >= s.from && t < s.to) ?? segs[segs.length - 1];
const where = (t) => {
  const s = clipAt(t);
  return `${t.toFixed(1)}s (#${s.rank} "${s.label}", ${(t - s.from).toFixed(1)}s no clipe)`;
};

const problems = [];
const warn = (sev, msg) => problems.push({ sev, msg });

// ---------- Áudio ----------
const pcm = decodePcm(video);
const duration = probeDuration(video);
const WIN = 0.1;
if (!pcm) warn("ALTO", "O vídeo não tem áudio.");
else {
  const tl = rmsTimeline(pcm, WIN);
  const { peakDb } = peakInfo(pcm);
  // silêncios (ignora o comecinho do fade de entrada)
  for (const [a, b] of silences(tl, WIN, -45, 0.3)) {
    if (a < 0.3) continue;
    warn("ALTO", `Buraco de silêncio de ${(b - a).toFixed(1)}s em ${where(a)}. Corte o clipe antes (end) ou cubra com som.`);
  }
  // clipping
  let clipped = 0;
  for (let i = 0; i < pcm.length; i++) if (Math.abs(pcm[i]) >= 32700) clipped++;
  if (clipped > 50) warn("ALTO", `Áudio estourando (${clipped} amostras no limite, pico ${peakDb.toFixed(1)} dB). Baixe volumes de efeitos.`);
  // trechos muito altos (média de 0,5s acima de -8 dB)
  for (let i = 0; i + 5 <= tl.length; i += 5) {
    const m = tl.slice(i, i + 5).reduce((s, v) => s + v, 0) / 5;
    if (m > -8) {
      warn("MÉDIO", `Muito alto (${m.toFixed(0)} dB) em ${where(i * WIN)}. Provável efeito alto demais ou sem ducking.`);
      i += 10;
    }
  }
  // equilíbrio entre clipes
  const means = segs.map((s) => {
    const part = tl.slice(Math.floor(s.from / WIN), Math.floor(s.to / WIN));
    return part.reduce((a, v) => a + v, 0) / Math.max(1, part.length);
  });
  const sorted = [...means].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  segs.forEach((s, i) => {
    const d = means[i] - median;
    if (d < -8) warn("ALTO", `Clipe #${s.rank} "${s.label}" está ${Math.abs(d).toFixed(0)} dB mais baixo que os outros (áudio original mudo ou volume baixo?). Precisa de som ambiente/efeitos ou volume 1.`);
    else if (d > 6) warn("MÉDIO", `Clipe #${s.rank} "${s.label}" está ${d.toFixed(0)} dB mais alto que os outros.`);
  });
  // excesso de efeitos dentro dos clipes
  segs.forEach((s) => {
    const n = (s.item.sounds ?? []).length;
    if (n > 3) warn("MÉDIO", `Clipe #${s.rank} tem ${n} efeitos sonoros. Humano usa 1–2 no momento certo; o resto vira barulho.`);
    const times = (s.item.sounds ?? []).map((x) => x.at).sort((a, b) => a - b);
    for (let i = 1; i < times.length; i++)
      if (times[i] - times[i - 1] < 0.35) warn("MÉDIO", `Clipe #${s.rank}: dois efeitos quase juntos (${times[i - 1]}s e ${times[i]}s).`);
  });
  // final
  const last = tl.slice(-3).reduce((s, v) => s + v, 0) / 3;
  if (last > -22) warn("MÉDIO", `Final abrupto: áudio ainda alto (${last.toFixed(0)} dB) no último 0,3s. Termine o clipe depois da reação ou aumente endFadeSeconds.`);
  // eventos fortes no vídeo final (para o Claude conferir o sincronismo com a imagem)
  const ev = transients(tl, WIN, 10, -30);
  fs.writeFileSync(
    path.join(OUT, "events.txt"),
    ev.map((e) => `${where(e.t)}  ${e.db} dB`).join("\n") + "\n",
  );
}

// ---------- Ritmo e texto ----------
if (duration < 20) warn("MÉDIO", `Vídeo curto (${duration.toFixed(1)}s). Ideal 25–40s.`);
if (duration > 45) warn("MÉDIO", `Vídeo longo (${duration.toFixed(1)}s). Ideal 25–40s: corte enrolação.`);
segs.forEach((s) => {
  const max = s.rank === 1 ? 8.5 : 7;
  if (s.len > max) warn("MÉDIO", `Clipe #${s.rank} "${s.label}" tem ${s.len.toFixed(1)}s (máx. ~${max}s). Corte o começo parado (start) ou o fim (end).`);
  if (s.len < 2) warn("BAIXO", `Clipe #${s.rank} muito curto (${s.len.toFixed(1)}s): dá tempo de entender?`);
  const words = s.label.replace(/\p{Extended_Pictographic}/gu, "").trim().split(/\s+/).filter(Boolean);
  if (words.length > 3 || s.label.length > 22) warn("MÉDIO", `Label #${s.rank} "${s.label}" longo. Use 1–3 palavras.`);
  if ((s.item.captions ?? []).length) warn("MÉDIO", `Clipe #${s.rank} tem legenda na tela; o usuário prefere só o texto fixo.`);
});

// ---------- Imagens para revisão visual ----------
const FONT = ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"].find((f) => fs.existsSync(f));
const stamp = FONT
  ? `,drawbox=x=0:y=ih-40:w=iw:h=40:color=black@0.75:t=fill,drawtext=fontfile=${FONT}:text='%{eif\\:t\\:d}.%{eif\\:mod(t*10\\,10)\\:d}s':x=8:y=h-34:fontsize=28:fontcolor=yellow`
  : "";
const cols = 8;
const n = Math.ceil(duration * 2);
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", video, "-vf", `fps=2,scale=200:-2${stamp},tile=${cols}x${Math.ceil(n / cols)}:padding=3:color=white`, "-frames:v", "1", path.join(OUT, "frames.jpg")]);
if (pcm)
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", video, "-filter_complex", "[0:a]aformat=channel_layouts=mono,showspectrumpic=s=1600x260:legend=1:scale=log:fscale=log", path.join(OUT, "spectrum.png")]);

// ---------- Relatório ----------
const order = { ALTO: 0, MÉDIO: 1, BAIXO: 2 };
problems.sort((a, b) => order[a.sev] - order[b.sev]);
const report = [
  `# QA — ${path.basename(video)} (${duration.toFixed(1)}s)`,
  "",
  "## Clipes",
  ...segs.map((s) => `- ${s.from.toFixed(1)}–${s.to.toFixed(1)}s  #${s.rank} "${s.label}" (${s.len.toFixed(1)}s, ${(s.item.sounds ?? []).length} efeitos)`),
  "",
  "## Problemas",
  ...(problems.length ? problems.map((p) => `- [${p.sev}] ${p.msg}`) : ["- Nenhum problema automático encontrado."]),
  "",
  "## Revisão visual (faça você)",
  "- Olhe out/qa/frames.jpg: o label de cada clipe descreve o que REALMENTE acontece?",
  "- Olhe out/qa/spectrum.png e out/qa/events.txt: cada pancada/efeito cai na ação certa?",
];
fs.writeFileSync(path.join(OUT, "report.md"), report.join("\n") + "\n");
console.log(report.join("\n"));
process.exitCode = problems.some((p) => p.sev === "ALTO") ? 2 : 0;
