// Gera efeitos sonoros com a API de Sound Effects da ElevenLabs.
// Requer: export ELEVENLABS_API_KEY=...   (no Codespaces: Settings > Secrets)
//
// Uso:
//   npm run sfx:ai                                   -> gera o kit padrão (pop, whoosh, ding, boom, riser) em .mp3
//   npm run sfx:ai -- laugh "crowd laughing hard" 2  -> gera public/sfx/laugh.mp3 com 2 segundos
//
// Depois aponte o ranking.json para os .mp3 (ex.: "reveal": "sfx/pop.mp3").
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.join(ROOT, "public", "sfx");
const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) {
  console.error("Defina ELEVENLABS_API_KEY antes de rodar.");
  process.exit(1);
}
fs.mkdirSync(OUT, { recursive: true });

const KIT = {
  pop: ["Short satisfying cartoon pop, bubble pop UI sound, punchy, no reverb", 0.5],
  whoosh: ["Fast swoosh transition whoosh, clean, short", 0.6],
  ding: ["Bright cartoon ding bell, game show correct answer", 1],
  boom: ["Deep cinematic boom impact hit with sub bass, trailer hit", 2],
  riser: ["Short tension riser building suspense, ends abruptly", 1.5],
};

const [, , name, text, dur] = process.argv;
const jobs = name ? { [name]: [text, dur ? Number(dur) : undefined] } : KIT;

for (const [n, [prompt, seconds]] of Object.entries(jobs)) {
  const res = await fetch("https://api.elevenlabs.io/v1/sound-generation", {
    method: "POST",
    headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ text: prompt, ...(seconds ? { duration_seconds: seconds } : {}), prompt_influence: 0.5 }),
  });
  if (!res.ok) {
    console.error(`✗ ${n}: ${res.status} ${await res.text()}`);
    continue;
  }
  fs.writeFileSync(path.join(OUT, `${n}.mp3`), Buffer.from(await res.arrayBuffer()));
  console.log(`✓ sfx/${n}.mp3  ("${prompt}")`);
}
