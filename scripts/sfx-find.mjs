// Busca sons no catálogo.  Ex.:
//   npm run sfx:find -- impact                 (por papel)
//   npm run sfx:find -- vidro                  (por palavra no nome/pasta)
//   npm run sfx:find -- impact --max 1 --top 10
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CAT = path.join(ROOT, "public", "soundeffects", "catalog.json");
if (!fs.existsSync(CAT)) {
  console.log('Rode "npm run sfx:index" primeiro.');
  process.exit(1);
}
const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? Number(args[args.indexOf(k) + 1]) : d);
const max = opt("--max", Infinity);
const min = opt("--min", 0);
const top = opt("--top", 15);
const terms = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--"))).map((t) => t.toLowerCase());

const { sounds } = JSON.parse(fs.readFileSync(CAT, "utf8"));
const res = sounds
  .filter((s) => !s.banned && s.duration <= max && s.duration >= min)
  .map((s) => {
    const hay = `${s.roles.join(" ")} ${s.folder} ${s.name} ${s.note ?? ""}`.toLowerCase();
    const score = terms.reduce((acc, t) => acc + (s.roles.includes(t) ? 3 : hay.includes(t) ? 2 : 0), 0) + (s.favorite ? 1.5 : 0);
    return { s, score };
  })
  .filter((r) => !terms.length || r.score >= terms.length * 2)
  .sort((a, b) => b.score - a.score || a.s.duration - b.s.duration)
  .slice(0, top);

for (const { s } of res) {
  console.log(`${s.favorite ? "⭐" : "  "} ${(s.folder ? s.folder + "/" : "") + s.name}`);
  console.log(`     ${s.roles.join(",")} · ${s.duration}s · pico ${s.peakAt}s · ${s.traits}${s.note ? ` · 📝 ${s.note}` : ""}`);
  console.log(`     "${s.src}"`);
}
if (!res.length) console.log("Nada encontrado.");
