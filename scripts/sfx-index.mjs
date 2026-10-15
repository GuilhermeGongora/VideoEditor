// Cataloga a biblioteca de efeitos sonoros para o Claude "conhecer" os sons sem ouvir.
//
// Para cada som em public/soundeffects/ (e public/sfx/):
//   - mede duração, pico (momento do impacto), ataque, decaimento, graves/agudos, ruído x tom;
//   - deduz o PAPEL do som (impacto, whoosh, pop, meme, risada, riser, vidro, dinheiro, trilha…)
//     pelo nome do arquivo e pelas características;
//   - cria uma cópia NORMALIZADA (mesmo nível de volume para todos) em public/soundeffects/_norm/;
//   - desenha "cartões" (espectrograma + nome) por papel em out/sfx-cards/ para o Claude olhar.
// Também lê public/soundeffects/preferences.json (favoritos, banidos, notas do usuário).
//
// Saídas: public/soundeffects/catalog.json (completo) e catalog.md (resumo para o Claude ler).
// Uso: npm run sfx:index            (incremental, usa cache)
//      npm run sfx:index -- --force (refaz tudo)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { decodePcm, features, peakInfo, probeDuration } from "./lib/audio.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const PUBLIC = path.join(ROOT, "public");
const LIB = path.join(PUBLIC, "soundeffects");
const NORM = path.join(LIB, "_norm");
const CARDS = path.join(ROOT, "out", "sfx-cards");
const OUT_JSON = path.join(LIB, "catalog.json");
const OUT_MD = path.join(LIB, "catalog.md");
const PREFS = path.join(LIB, "preferences.json");
const FORCE = process.argv.includes("--force");
const EXT = new Set([".wav", ".mp3", ".ogg", ".m4a", ".aac", ".flac", ".opus"]);
const SKIP_DIRS = new Set(["_norm", "_cards"]);

// Papéis e palavras-chave (pt/en) usadas no nome do arquivo ou da pasta
export const ROLES = {
  pop: ["pop", "click", "clique", "bubble", "bolha", "tick", "tap", "blip", "ui", "notification", "notif", "swipe"],
  whoosh: ["whoosh", "woosh", "swoosh", "swish", "swoop", "transition", "transicao", "transição", "zoom", "swing", "wind", "air"],
  impact: ["impact", "impacto", "hit", "punch", "soco", "murro", "slap", "tapa", "pancada", "porrada", "bonk", "bang", "thud", "kick", "chute", "smack", "boom", "explosion", "explosao", "explosão", "fall", "queda", "crash", "batida", "slam", "body", "bone", "crack"],
  glass: ["glass", "vidro", "shatter", "break", "quebra", "window", "janela"],
  meme: ["meme", "vine", "bruh", "oof", "sus", "among", "emotional", "damage", "windows", "error", "xp", "huh", "what", "wow", "sheesh", "bonk", "taco", "fart", "peido", "rizz", "skibidi", "metal pipe", "pipe", "augh", "ahh", "nani", "yeet", "goofy", "cartoon", "boing", "honk", "quack", "spring", "mola"],
  fail: ["fail", "sad", "trombone", "wah", "lose", "loser", "price is right", "nope", "wrong", "errado", "buzzer", "dun"],
  laugh: ["laugh", "risada", "rir", "haha", "crowd", "plateia", "plateia", "applause", "aplauso", "cheer", "audience", "torcida", "kids", "sitcom"],
  riser: ["riser", "rise", "suspense", "tension", "tensao", "tensão", "build", "drum roll", "drumroll", "rufar", "uplifter", "anticipation"],
  stop: ["scratch", "record", "freeze", "stop", "rewind", "pause", "vinyl", "disco"],
  money: ["cash", "money", "dinheiro", "coin", "moeda", "register", "caixa", "ka-ching", "kaching", "ching"],
  ding: ["ding", "bell", "sino", "chime", "correct", "success", "win", "level up", "achievement"],
  vehicle: ["car", "carro", "horn", "buzina", "tire", "pneu", "skid", "brake", "freio", "engine", "motor", "moto", "bike", "crash car"],
  voice: ["voice", "voz", "scream", "grito", "yell", "no", "nooo", "omg", "gasp", "say", "fala"],
  music: ["music", "musica", "música", "song", "beat", "sting", "loop", "bgm", "bed", "trilha", "theme", "intro", "outro", "phonk", "funny music"],
};

const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[_\-.]+/g, " ");

const guessRoles = (rel, f, duration) => {
  // palavras inteiras (aceita plural e números colados: "punch2", "hits")
  const text = ` ${norm(rel).replace(/(\d+)/g, " $1 ").replace(/\s+/g, " ")} `;
  const has = (k) => new RegExp(`\\s${norm(k).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(s|es)?\\s`).test(text);
  const roles = Object.entries(ROLES)
    .filter(([, kws]) => kws.some(has))
    .map(([r]) => r);
  if (roles.length) return { roles: [...new Set(roles)], by: "nome" };
  // Sem pista no nome: deduz pelas características
  if (!f) return { roles: ["misc"], by: "?" };
  if (duration < 0.35 && f.attack < 0.04) return { roles: ["pop"], by: "som" };
  if (f.attack > duration * 0.6 && duration > 0.8) return { roles: ["riser"], by: "som" };
  if (f.zcr > 2500 && duration < 1.3 && f.attack > 0.06) return { roles: ["whoosh"], by: "som" };
  if (f.lowRatio > 0.45 && f.attack < 0.06 && f.decay < 1.5) return { roles: ["impact"], by: "som" };
  if (duration > 4 && f.steadiness < 5) return { roles: ["music"], by: "som" };
  return { roles: ["misc"], by: "?" };
};

const traits = (f, duration) => {
  if (!f) return "";
  const t = [];
  t.push(duration < 0.4 ? "curtíssimo" : duration < 1.2 ? "curto" : duration < 3 ? "médio" : "longo");
  t.push(f.attack < 0.04 ? "ataque seco" : f.attack < 0.25 ? "ataque rápido" : "entra devagar");
  if (f.lowRatio > 0.5) t.push("grave/pesado");
  else if (f.highRatio > 0.35) t.push("agudo/brilhante");
  t.push(f.zcr > 3000 ? "ruidoso" : f.zcr < 800 ? "tonal/encorpado" : "misto");
  if (f.activeSeconds > 2 && f.steadiness < 5) t.push("contínuo");
  return t.join(", ");
};

const walk = (dir) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
        if (d.name.startsWith(".") || SKIP_DIRS.has(d.name)) return [];
        const p = path.join(dir, d.name);
        return d.isDirectory() ? walk(p) : EXT.has(path.extname(d.name).toLowerCase()) ? [p] : [];
      })
    : [];

const files = [...walk(LIB), ...walk(path.join(PUBLIC, "sfx"))];
if (files.length === 0) {
  console.log("Nenhum som encontrado. Coloque seus efeitos em public/soundeffects/ (pode usar subpastas).");
  process.exit(0);
}

const prefs = fs.existsSync(PREFS) ? JSON.parse(fs.readFileSync(PREFS, "utf8")) : { favorites: [], banned: [], notes: {} };
const previous = !FORCE && fs.existsSync(OUT_JSON) ? JSON.parse(fs.readFileSync(OUT_JSON, "utf8")) : { sounds: [] };
const cache = new Map(previous.sounds.map((s) => [s.original, s]));

const TARGET_RMS = -19; // nível alvo da parte ativa (deixa espaço para o áudio do clipe)
const MAX_PEAK = -3; // pico máximo em dBFS

const sounds = [];
let done = 0;
for (const file of files) {
  const original = path.relative(PUBLIC, file).split(path.sep).join("/");
  const mtime = Math.round(fs.statSync(file).mtimeMs);
  const relInLib = original.replace(/^soundeffects\//, "");
  const normRel = `soundeffects/_norm/${relInLib.replace(/\.[^.]+$/, "")}.wav`;
  const normAbs = path.join(PUBLIC, normRel);

  let entry = cache.get(original);
  if (!entry || entry.mtime !== mtime || !fs.existsSync(normAbs)) {
    try {
      const duration = probeDuration(file);
      const pcm = decodePcm(file);
      const f = pcm ? features(pcm) : null;
      const { peakDb, peakAt } = pcm ? peakInfo(pcm) : { peakDb: -120, peakAt: 0 };
      // Volume da parte ativa (ignora silêncio) para normalizar por sensação, limitado pelo pico
      const activeRms = f ? f.rmsDb + 10 * Math.log10(Math.max(0.05, duration / Math.max(0.02, f.activeSeconds))) : -30;
      const gain = Math.min(TARGET_RMS - activeRms, MAX_PEAK - peakDb, 24);
      fs.mkdirSync(path.dirname(normAbs), { recursive: true });
      execFileSync("ffmpeg", ["-v", "error", "-y", "-i", file, "-af", `volume=${gain.toFixed(2)}dB,alimiter=limit=0.95:level=false`, "-ar", "48000", "-ac", "2", normAbs]);
      entry = {
        original,
        mtime,
        duration: Number(duration.toFixed(2)),
        peakAt: Number(peakAt.toFixed(2)),
        peakDb: Number(peakDb.toFixed(1)),
        gainDb: Number(gain.toFixed(1)),
        features: f,
      };
      done++;
    } catch (e) {
      console.warn(`✗ não consegui ler ${original}`);
      continue;
    }
  }
  const name = path.basename(file, path.extname(file));
  const folder = path.dirname(relInLib) === "." ? "" : path.dirname(relInLib);
  const note = prefs.notes?.[original] ?? prefs.notes?.[name];
  // A nota do usuário também conta para descobrir o papel ("tapa estalado" → impact)
  const { roles, by } = guessRoles(`${folder} ${name} ${note ?? ""}`, entry.features, entry.duration);
  sounds.push({
    ...entry,
    src: normRel,
    name,
    folder,
    roles,
    rolesBy: by,
    traits: traits(entry.features, entry.duration),
    favorite: prefs.favorites?.includes(original) || prefs.favorites?.includes(name) || false,
    banned: prefs.banned?.includes(original) || prefs.banned?.includes(name) || false,
    note: note ?? undefined,
  });
}

fs.writeFileSync(OUT_JSON, JSON.stringify({ generated: new Date().toISOString(), count: sounds.length, sounds }, null, 2) + "\n");

// Resumo em Markdown agrupado por papel (o que o Claude lê)
const byRole = {};
for (const s of sounds) for (const r of s.roles) (byRole[r] ??= []).push(s);
const md = [
  "# Catálogo de efeitos sonoros",
  "",
  "Gerado por `npm run sfx:index`. Use o `src` no ranking.json (é a versão normalizada).",
  "`pico` = segundo do impacto dentro do arquivo (para alinhar: at = momento − pico).",
  "⭐ favorito do usuário · ⛔ banido (não use) · 📝 nota do usuário",
  "",
];
for (const role of Object.keys(ROLES).concat("misc")) {
  const list = (byRole[role] ?? []).sort((a, b) => Number(b.favorite) - Number(a.favorite) || a.duration - b.duration);
  if (!list.length) continue;
  md.push(`## ${role} (${list.length})`, "", "| som | dur | pico | características | src |", "|---|---|---|---|---|");
  for (const s of list) {
    const flags = `${s.favorite ? "⭐ " : ""}${s.banned ? "⛔ " : ""}${s.note ? `📝 ${s.note} ` : ""}`;
    md.push(`| ${flags}${s.folder ? `${s.folder}/` : ""}${s.name} | ${s.duration}s | ${s.peakAt}s | ${s.traits}${s.rolesBy === "som" ? " (papel deduzido pelo som)" : ""} | \`${s.src}\` |`);
  }
  md.push("");
}
fs.writeFileSync(OUT_MD, md.join("\n"));

// Cartões visuais por papel: espectrograma + nome (o Claude "vê" o formato do som)
fs.rmSync(CARDS, { recursive: true, force: true });
const FONT = ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"].find((f) => fs.existsSync(f));
for (const [role, list] of Object.entries(byRole)) {
  const tmp = path.join(CARDS, "_tmp", role);
  fs.mkdirSync(tmp, { recursive: true });
  const chosen = list.slice(0, 40);
  chosen.forEach((s, i) => {
    const label = `${s.name}`.replace(/[':\\%]/g, " ").slice(0, 34) + ` ${s.duration}s`;
    const text = FONT ? `,pad=iw:ih+30:0:30:black,drawtext=fontfile=${FONT}:text='${label}':x=6:y=6:fontsize=16:fontcolor=white` : "";
    try {
      execFileSync("ffmpeg", [
        "-v", "error", "-y", "-i", path.join(PUBLIC, s.src),
        "-filter_complex", `[0:a]aformat=channel_layouts=mono,asplit[a][b];[a]showspectrumpic=s=300x90:legend=0:scale=log:fscale=log,format=rgb24[sp];[b]showwavespic=s=300x40:colors=white:scale=sqrt,format=rgb24[wv];[wv][sp]vstack${text}`,
        path.join(tmp, `${String(i).padStart(3, "0")}.png`),
      ]);
    } catch {}
  });
  const rows = Math.ceil(chosen.length / 4);
  try {
    execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", "1", "-i", path.join(tmp, "%03d.png"), "-vf", `tile=4x${rows}:padding=6:color=gray`, "-frames:v", "1", path.join(CARDS, `${role}.png`)]);
  } catch {}
}
fs.rmSync(path.join(CARDS, "_tmp"), { recursive: true, force: true });

console.log(`${sounds.length} sons catalogados (${done} analisados agora).`);
for (const [role, list] of Object.entries(byRole).sort((a, b) => b[1].length - a[1].length)) console.log(`  ${role.padEnd(8)} ${list.length}`);
console.log(`\nResumo: public/soundeffects/catalog.md · Cartões visuais: out/sfx-cards/<papel>.png`);
