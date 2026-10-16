// Atalhos dos vídeos explicativos.
//   npm run quadros -- 6x1   → um quadro de cada cena (no fim de cada fala) em out/quadros/<slug>/grade.jpg
//   npm run explicar -- 6x1  → renderiza o vídeo em out/<slug>.mp4 (e as thumbs)
//   npm run thumb -- 6x1     → só as thumbnails em thumbs/<slug>-1.png, -2.png… (uma por título em roteiro.thumb)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { salvarLegenda } from "./legenda.mjs";
import { publicar } from "./publicar.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const [modo, slug] = process.argv.slice(2);
if (!slug) {
  console.log("Uso: npm run quadros -- <slug>  |  npm run explicar -- <slug>  |  npm run thumb -- <slug>");
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

// O 3D precisa de WebGL. Sem placa de vídeo (Codespaces), cada máquina aceita um modo diferente:
// testa um quadro em cada modo e guarda o primeiro que funcionar em out/.gl
const GL_FILE = path.join(ROOT, "out", ".gl");
const escolherGl = (frame) => {
  const salvo = fs.existsSync(GL_FILE) ? fs.readFileSync(GL_FILE, "utf8").trim() : null;
  const modos = [...new Set([salvo, "angle", "swiftshader", "swangle"].filter(Boolean))];
  for (const gl of modos) {
    try {
      execFileSync("npx", ["remotion", "still", "out/bundle", id, "out/.gltest.png", `--frame=${frame}`, `--gl=${gl}`, "--log=error", ...extra], { cwd: ROOT, stdio: "pipe" });
      fs.writeFileSync(GL_FILE, gl);
      if (gl !== salvo) console.log(`3D: usando o modo --gl=${gl}`);
      return gl;
    } catch {
      console.log(`3D: modo ${gl} não funcionou aqui, testando o próximo…`);
    }
  }
  console.error("Nenhum modo de WebGL funcionou. Rode: npx remotion browser ensure  e tente de novo.");
  process.exit(1);
};
const bundle = () => execFileSync("npx", ["remotion", "bundle", "--out-dir=out/bundle", "--log=error"], { cwd: ROOT, stdio: "inherit" });

// Quebra uma frase em linhas curtas (~16 letras) e destaca a última.
const quebrar = (frase) => {
  const linhas = [];
  for (const p of frase.split(/\s+/)) {
    const ult = linhas[linhas.length - 1];
    if (ult !== undefined && (ult + " " + p).length <= 16) linhas[linhas.length - 1] = ult + " " + p;
    else linhas.push(p);
  }
  if (linhas.length > 1) linhas[linhas.length - 1] = `*${linhas[linhas.length - 1]}*`;
  return linhas.slice(0, 4).join("\n");
};

const thumbs = (gl) => {
  let cfg = rot.thumb;
  let props = {};
  if (!cfg?.titulos?.length) {
    // Roteiro sem "thumb": gera uma capa automática com a 1ª frase e a 1ª cena (melhor escrever à mão).
    const c0 = tempos.cenas[0];
    const frase = rot.cenas[0].fala.split(/(?<=[.!?])\s/)[0];
    cfg = { titulos: [quebrar(frase)], cena: c0.id, quadro: Math.round((c0.end - c0.start) * 30 * 0.8) };
    props = { roteiro: { ...rot, thumb: cfg } };
    console.log("Aviso: roteiro sem \"thumb\"; gerando capa automática com a 1ª frase.");
  }
  fs.mkdirSync(path.join(ROOT, "thumbs"), { recursive: true });
  cfg.titulos.forEach((_, i) => {
    const arq = `thumbs/${slug}-${i + 1}.png`;
    run(["still", "out/bundle", `${id}Thumb`, arq, `--props=${JSON.stringify({ ...props, variante: i })}`, `--gl=${gl}`, "--log=error"]);
    console.log(`Thumb: ${arq}`);
  });
};

if (modo === "thumb") {
  bundle();
  thumbs(escolherGl(Math.round(tempos.duracao * 15)));
  console.log(`Legenda do post: ${salvarLegenda(slug).arq}`);
} else if (modo === "render") {
  const out = `out/${slug}.mp4`;
  bundle();
  const gl = escolherGl(Math.round(tempos.duracao * 15));
  run(["render", "out/bundle", id, out, "--concurrency=2", `--gl=${gl}`]);
  thumbs(gl);
  const leg = salvarLegenda(slug);
  publicar(slug);
  console.log(`Legenda do post: ${leg.arq}`);
  console.log(`\nPronto: ${out}  (baixe com: npm run baixar)`);
} else {
  const dir = path.join(ROOT, "out", "quadros", slug);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  bundle();
  const gl = escolherGl(Math.round(tempos.duracao * 15));
  const frames = tempos.cenas.map((c) => Math.round((c.start * 0.2 + c.end * 0.8) * 30));
  frames.forEach((fr, i) => {
    run(["still", "out/bundle", id, path.join(dir, `${String(i + 1).padStart(2, "0")}-${tempos.cenas[i].id}.jpg`), `--frame=${fr}`, "--image-format=jpeg", "--log=error", `--gl=${gl}`]);
  });
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".jpg")).sort();
  const n = files.length;
  const layout = files.map((_, k) => `${(k % 4) * 405}_${Math.floor(k / 4) * 720}`).join("|");
  const filters = files.map((f, k) => `[${k}]scale=405:720[s${k}];`).join("") + files.map((_, k) => `[s${k}]`).join("") + `xstack=inputs=${n}:layout=${layout}:fill=white`;
  execFileSync("ffmpeg", ["-v", "error", "-y", ...files.flatMap((f) => ["-i", path.join(dir, f)]), "-filter_complex", filters, path.join(dir, "grade.jpg")]);
  console.log(`Quadros: out/quadros/${slug}/ (grade.jpg mostra todas as cenas)`);
}
