// Copia o vídeo pronto para a pasta do Google Drive, organizado para postar.
//   npm run publicar -- 6x1        (o "npm run explicar" já chama sozinho no fim)
//   npm run publicar -- --marca    (copia a identidade visual para Scientia/Identidade)
//
// Estrutura criada em SCIENTIA_DRIVE (padrão: G:\Meu Drive\Scientia → /mnt/g/Meu Drive/Scientia no WSL):
//   Scientia/
//     Posts/
//       2026-10-16 · 6x1 · Senado aprovou o fim da 6x1/
//         video.mp4 · thumb-1.png · thumb-2.png · legenda.txt · fontes.txt
//     Identidade/   (avatar, logo, símbolo)
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

// .env (SCIENTIA_DRIVE=/mnt/g/Meu Drive/Scientia)
const envFile = path.join(ROOT, ".env");
if (fs.existsSync(envFile)) {
  for (const l of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const DRIVE = process.env.SCIENTIA_DRIVE || "/mnt/g/Meu Drive/Scientia";

const semAcento = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const nomePasta = (s) => s.replace(/[\\/:*?"<>|\n\r]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);

export const driveDisponivel = () => {
  const raiz = path.dirname(DRIVE);
  return fs.existsSync(raiz);
};

const ajudaMontar = () => {
  console.log(`\nNão achei o Drive em "${DRIVE}".`);
  console.log("No WSL o G: do Google Drive precisa ser montado uma vez:");
  console.log("  sudo mkdir -p /mnt/g && sudo mount -t drvfs G: /mnt/g");
  console.log("Para montar sempre que abrir o Ubuntu:");
  console.log(`  echo 'G: /mnt/g drvfs defaults 0 0' | sudo tee -a /etc/fstab`);
  console.log("Outro lugar? Coloque no .env:  SCIENTIA_DRIVE=/mnt/g/Meu Drive/Scientia\n");
};

// Cópia "manual" em blocos: o G: do Google Drive no WSL recusa copyFile (EPERM ao copiar permissões).
const copiarArquivo = (de, para) => {
  const buf = Buffer.allocUnsafe(4 * 1024 * 1024);
  const fi = fs.openSync(de, "r");
  const fo = fs.openSync(para, "w");
  try {
    let n;
    while ((n = fs.readSync(fi, buf, 0, buf.length, null)) > 0) fs.writeSync(fo, buf, 0, n);
  } finally {
    fs.closeSync(fi);
    fs.closeSync(fo);
  }
};

const copiar = (de, para) => {
  if (!fs.existsSync(de)) return false;
  try {
    copiarArquivo(de, para);
    return true;
  } catch (e) {
    console.log(`  não consegui copiar ${path.basename(de)} (${e.code ?? e.message})`);
    return false;
  }
};

export const publicar = (slug) => {
  if (!driveDisponivel()) {
    ajudaMontar();
    return null;
  }
  const rot = JSON.parse(fs.readFileSync(path.join(ROOT, "videos", slug, "roteiro.json"), "utf8"));
  const titulo = (rot.thumb?.titulos?.[0] ?? rot.cenas[0].fala).replace(/\*/g, "").replace(/\n/g, " ");
  const data = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" }); // AAAA-MM-DD
  const postsDir = path.join(DRIVE, "Posts");
  fs.mkdirSync(postsDir, { recursive: true });
  // reaproveita a pasta se o vídeo já foi publicado antes (mesmo slug)
  const existente = fs.readdirSync(postsDir).find((d) => d.split(" · ")[1] === slug);
  const pasta = path.join(postsDir, existente ?? nomePasta(`${data} · ${slug} · ${titulo}`));
  fs.mkdirSync(pasta, { recursive: true });

  const feitos = [];
  if (copiar(path.join(ROOT, "out", `${slug}.mp4`), path.join(pasta, "video.mp4"))) feitos.push("video.mp4");
  for (const i of [1, 2, 3]) {
    if (copiar(path.join(ROOT, "thumbs", `${slug}-${i}.png`), path.join(pasta, `thumb-${i}.png`))) feitos.push(`thumb-${i}.png`);
  }
  if (copiar(path.join(ROOT, "out", `${slug}-legenda.txt`), path.join(pasta, "legenda.txt"))) feitos.push("legenda.txt");
  if (rot.fontes?.length) {
    fs.writeFileSync(path.join(pasta, "fontes.txt"), rot.fontes.map((f) => `- ${f}`).join("\n") + "\n");
    feitos.push("fontes.txt");
  }
  console.log(`Drive: ${pasta}\n  ${feitos.join(" · ")}`);
  return pasta;
};

const publicarMarca = () => {
  if (!driveDisponivel()) return ajudaMontar();
  const dir = path.join(DRIVE, "Identidade");
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(path.join(ROOT, "marca"))) {
    if (/\.(png|svg|md)$/i.test(f)) copiar(path.join(ROOT, "marca", f), path.join(dir, f));
  }
  console.log(`Drive: ${dir}`);
};

if (process.argv[1] && process.argv[1].endsWith("publicar.mjs")) {
  const arg = process.argv[2];
  if (!arg) {
    console.log("Uso: npm run publicar -- <slug>   |   npm run publicar -- --marca");
    process.exit(1);
  }
  if (arg === "--marca") publicarMarca();
  else if (arg === "--todos") {
    for (const s of fs.readdirSync(path.join(ROOT, "videos"))) {
      if (fs.existsSync(path.join(ROOT, "out", `${s}.mp4`))) publicar(s);
    }
  } else publicar(semAcento(arg));
}
