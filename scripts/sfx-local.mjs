// Gera efeitos sonoros básicos com ffmpeg (sem API, sem custo) em public/sfx/.
// Para sons melhores, use "npm run sfx:ai" (ElevenLabs).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.join(ROOT, "public", "sfx");
fs.mkdirSync(OUT, { recursive: true });

const run = (name, args) => {
  execFileSync("ffmpeg", ["-y", "-v", "error", ...args, "-ar", "48000", "-ac", "2", path.join(OUT, `${name}.wav`)]);
  console.log(`✓ sfx/${name}.wav`);
};

// pop: "bolha" curta quando o item entra na lista
run("pop", ["-f", "lavfi", "-i", "aevalsrc='0.9*sin(2*PI*(260*t+900*(1-exp(-t*45))/45))*exp(-t*28)':d=0.22"]);

// whoosh: ruído filtrado com envelope, na troca de clipe
run("whoosh", [
  "-f", "lavfi", "-i", "anoisesrc=color=pink:d=0.5:a=0.9",
  "-af", "highpass=f=400,lowpass=f=5000,volume='0.9*sin(PI*t/0.5)^2':eval=frame,afade=t=out:st=0.4:d=0.1",
]);

// ding: sino para destaques/legendas
run("ding", ["-f", "lavfi", "-i", "aevalsrc='0.5*sin(2*PI*1318*t)*exp(-t*4)+0.3*sin(2*PI*2637*t)*exp(-t*6)+0.15*sin(2*PI*3951*t)*exp(-t*9)':d=1.2"]);

// boom: impacto grave na revelação do #1
run("boom", [
  "-f", "lavfi", "-i", "aevalsrc='0.95*sin(2*PI*(45+90*exp(-t*9))*t)*exp(-t*2.6)':d=1.6",
  "-f", "lavfi", "-i", "anoisesrc=color=brown:d=0.35:a=0.6",
  "-filter_complex", "[1]lowpass=f=900,afade=t=out:st=0:d=0.35[n];[0][n]amix=inputs=2:normalize=0,alimiter=limit=0.95",
]);

// riser: tensão antes de algo ("wait for it")
run("riser", [
  "-f", "lavfi", "-i", "aevalsrc='0.35*sin(2*PI*(200*t+700*t*t/2))*(t/1.5)':d=1.5",
  "-f", "lavfi", "-i", "anoisesrc=color=white:d=1.5:a=0.25",
  "-filter_complex", "[1]highpass=f=2000,volume='(t/1.5)^2':eval=frame[n];[0][n]amix=inputs=2:normalize=0",
]);
