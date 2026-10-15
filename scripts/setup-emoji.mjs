// Copia os emojis (Twemoji, SVG) para public/emoji/.
// Emojis viram imagens para renderizar igual em qualquer máquina (o Chrome headless
// do Codespaces não desenha emojis coloridos de forma confiável).
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const SRC = path.join(ROOT, "node_modules", "@twemoji", "svg");
const DST = path.join(ROOT, "public", "emoji");

if (!fs.existsSync(SRC)) {
  console.log("@twemoji/svg não instalado; pulando.");
  process.exit(0);
}
fs.mkdirSync(DST, { recursive: true });
let n = 0;
for (const f of fs.readdirSync(SRC)) {
  if (!f.endsWith(".svg")) continue;
  const to = path.join(DST, f);
  if (!fs.existsSync(to)) {
    fs.copyFileSync(path.join(SRC, f), to);
    n++;
  }
}
console.log(`emoji: ${n} arquivos copiados para public/emoji`);
