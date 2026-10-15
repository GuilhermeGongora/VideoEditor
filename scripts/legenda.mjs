// Monta a legenda do post (Instagram/TikTok) a partir do campo "post" do roteiro.json.
// Uso: npm run legenda -- 6x1   →  out/<slug>-legenda.txt  (também sai no npm run explicar)
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

export const montarLegenda = (rot) => {
  const p = rot.post ?? {};
  const frases = (t) => t.split(/(?<=[.!?])\s+/);
  const gancho = p.gancho ?? frases(rot.cenas[0].fala).join(" ");
  const pontos = p.pontos ?? rot.cenas.slice(1, 4).map((c) => frases(c.fala)[0].replace(/[.!]$/, ""));
  const fontes = p.fontes ?? (rot.fontes ?? []).map((f) => f.split(/[,:]/)[0].trim());
  const tags = [...new Set([...(p.hashtags ?? [rot.slug.replace(/[^a-z0-9]/gi, "")]), "scientia"])];
  const linhas = [gancho, "", ...pontos.flatMap((x) => [`• ${x}`, ""])];
  if (fontes.length) linhas.push(`Fontes: ${fontes.join(", ")}.`, "");
  linhas.push(tags.map((t) => `#${t.replace(/^#/, "")}`).join(" "));
  return linhas.join("\n");
};

export const salvarLegenda = (slug) => {
  const rot = JSON.parse(fs.readFileSync(path.join(ROOT, "videos", slug, "roteiro.json"), "utf8"));
  const texto = montarLegenda(rot);
  fs.mkdirSync(path.join(ROOT, "out"), { recursive: true });
  const arq = path.join("out", `${slug}-legenda.txt`);
  fs.writeFileSync(path.join(ROOT, arq), texto + "\n");
  if (!rot.post) console.log('Aviso: roteiro sem "post"; legenda montada automaticamente (melhor escrever à mão).');
  return { arq, texto };
};

if (process.argv[1] && process.argv[1].endsWith("legenda.mjs")) {
  const slug = process.argv[2];
  if (!slug) {
    console.log("Uso: npm run legenda -- <slug>");
    process.exit(1);
  }
  const { arq, texto } = salvarLegenda(slug);
  console.log(`\n${texto}\n\n→ ${arq}`);
}
