// Utilitários de análise de áudio (sem dependências): decodifica com ffmpeg e mede volume.
import { execFileSync } from "node:child_process";

export const RATE = 16000;

/** Decodifica qualquer arquivo de áudio/vídeo para PCM mono 16 kHz (Int16Array). Retorna null se não houver áudio. */
export const decodePcm = (file, { start, duration } = {}) => {
  const args = ["-v", "error"];
  if (start) args.push("-ss", String(start));
  args.push("-i", file);
  if (duration) args.push("-t", String(duration));
  args.push("-vn", "-ac", "1", "-ar", String(RATE), "-f", "s16le", "-");
  try {
    const buf = execFileSync("ffmpeg", args, { maxBuffer: 1024 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] });
    if (buf.length < 4) return null;
    return new Int16Array(buf.buffer, buf.byteOffset, Math.floor(buf.length / 2));
  } catch {
    return null;
  }
};

export const hasAudioStream = (file) => {
  try {
    return (
      execFileSync("ffprobe", ["-v", "error", "-select_streams", "a", "-show_entries", "stream=index", "-of", "csv=p=0", file])
        .toString()
        .trim().length > 0
    );
  } catch {
    return false;
  }
};

export const probeDuration = (file) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim());

export const db = (x) => (x > 0 ? 20 * Math.log10(x) : -120);

/** RMS em dB por janela (segundos). */
export const rmsTimeline = (pcm, win = 0.1) => {
  const w = Math.max(1, Math.round(win * RATE));
  const out = [];
  for (let i = 0; i + w <= pcm.length; i += w) {
    let s = 0;
    for (let j = i; j < i + w; j++) s += pcm[j] * pcm[j];
    out.push(db(Math.sqrt(s / w) / 32768));
  }
  return out;
};

export const peakInfo = (pcm) => {
  let peak = 0;
  let at = 0;
  for (let i = 0; i < pcm.length; i++) {
    const v = Math.abs(pcm[i]);
    if (v > peak) {
      peak = v;
      at = i;
    }
  }
  return { peakDb: db(peak / 32768), peakAt: at / RATE };
};

/** Faixas de silêncio (abaixo de thresholdDb) com duração mínima. */
export const silences = (timeline, win, thresholdDb = -45, minDur = 0.3) => {
  const out = [];
  let startIdx = -1;
  timeline.forEach((v, i) => {
    if (v < thresholdDb) {
      if (startIdx < 0) startIdx = i;
    } else if (startIdx >= 0) {
      if ((i - startIdx) * win >= minDur) out.push([startIdx * win, i * win]);
      startIdx = -1;
    }
  });
  if (startIdx >= 0 && (timeline.length - startIdx) * win >= minDur) out.push([startIdx * win, timeline.length * win]);
  return out;
};

/** Transientes: janelas que sobem >= jumpDb em relação à média das anteriores (batidas, pancadas, gritos). */
export const transients = (timeline, win, jumpDb = 8, floorDb = -35) => {
  const out = [];
  for (let i = 2; i < timeline.length; i++) {
    const before = (timeline[i - 1] + timeline[i - 2]) / 2;
    if (timeline[i] > floorDb && timeline[i] - before >= jumpDb) {
      if (!out.length || i * win - out[out.length - 1].t > 0.25) out.push({ t: Number((i * win).toFixed(2)), db: Math.round(timeline[i]) });
    }
  }
  return out;
};

/**
 * Características simples para "entender" um som sem ouvir:
 * graves (<250 Hz), agudos (>3 kHz), taxa de cruzamento por zero (ruído x tom),
 * ataque (tempo até o pico) e decaimento (do pico até -20 dB).
 */
export const features = (pcm) => {
  const n = pcm.length;
  if (!n) return null;
  // filtros de 1 polo: passa-baixa ~250 Hz e passa-alta ~3 kHz
  const aLow = Math.exp((-2 * Math.PI * 250) / RATE);
  const aHigh = Math.exp((-2 * Math.PI * 3000) / RATE);
  let lp = 0;
  let lp3 = 0;
  let eAll = 0;
  let eLow = 0;
  let eHigh = 0;
  let zc = 0;
  for (let i = 0; i < n; i++) {
    const x = pcm[i] / 32768;
    lp = (1 - aLow) * x + aLow * lp;
    lp3 = (1 - aHigh) * x + aHigh * lp3;
    const hp = x - lp3;
    eAll += x * x;
    eLow += lp * lp;
    eHigh += hp * hp;
    if (i && (pcm[i] >= 0) !== (pcm[i - 1] >= 0)) zc++;
  }
  const tl = rmsTimeline(pcm, 0.02);
  let pk = -120;
  let pkI = 0;
  tl.forEach((v, i) => {
    if (v > pk) {
      pk = v;
      pkI = i;
    }
  });
  let decayI = tl.length;
  for (let i = pkI; i < tl.length; i++) {
    if (tl[i] < pk - 20) {
      decayI = i;
      break;
    }
  }
  const rms = db(Math.sqrt(eAll / n));
  // estabilidade: desvio do volume na parte ativa (som contínuo x pontual)
  const active = tl.filter((v) => v > pk - 25);
  const mean = active.reduce((s, v) => s + v, 0) / Math.max(1, active.length);
  const sd = Math.sqrt(active.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(1, active.length));
  return {
    rmsDb: Number(rms.toFixed(1)),
    lowRatio: Number((eLow / Math.max(eAll, 1e-12)).toFixed(2)),
    highRatio: Number((eHigh / Math.max(eAll, 1e-12)).toFixed(2)),
    zcr: Math.round((zc / n) * RATE),
    attack: Number((pkI * 0.02).toFixed(2)),
    decay: Number(((decayI - pkI) * 0.02).toFixed(2)),
    activeSeconds: Number((active.length * 0.02).toFixed(2)),
    steadiness: Number(sd.toFixed(1)),
  };
};

/** Barra ASCII para timeline de volume (-60..0 dB). */
export const bar = (v) => {
  const n = Math.max(0, Math.min(20, Math.round((v + 60) / 3)));
  return "█".repeat(n).padEnd(20, "·");
};
