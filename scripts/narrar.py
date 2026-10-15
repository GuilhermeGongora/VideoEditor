#!/usr/bin/env python3
"""
Gera a narração de um vídeo explicativo + o tempo de cada palavra (para a legenda karaokê).

Uso:  npm run narrar -- 6x1            (lê videos/6x1/roteiro.json)
      npm run narrar -- 6x1 --kokoro   (força a voz local)

Motores:
  edge   → vozes neurais da Microsoft (grátis, soam naturais; precisa de internet). pip: edge-tts
  kokoro → voz local, roda offline (pip: kokoro-onnx soundfile; baixa o modelo do GitHub sozinho)

Saídas: public/explicativo/<slug>/narracao.wav e public/explicativo/<slug>/tempos.json
"""
import asyncio, io, json, os, re, subprocess, sys, tempfile, urllib.request
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 24000
PAUSA = {",": 0.12, ";": 0.18, ":": 0.18, ".": 0.32, "!": 0.32, "?": 0.32, "": 0.1}
FIM_CENA = 0.45
KOKORO_DIR = os.environ.get("KOKORO_DIR", os.path.expanduser("~/.cache/kokoro"))
KOKORO_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"


def frases(texto):
    """Divide em frases curtas pela pontuação seguida de espaço (não quebra "26,8" nem "14.10").
    Devolve [(frase, pontuação_final)]."""
    out = []
    for s in re.split(r"(?<=[,.;:!?])\s+", texto.strip()):
        s = s.strip()
        if s:
            out.append((s, s[-1] if s[-1] in ",.;:!?" else ""))
    return out


def para_tts(s, pron):
    for k in sorted(pron, key=len, reverse=True):
        s = re.sub(rf"(?<!\w){re.escape(k)}(?!\w)", pron[k], s)
    return s


def decode(data_or_path):
    """Qualquer áudio → float32 mono 24 kHz (via ffmpeg)."""
    args = ["ffmpeg", "-v", "error", "-i", "pipe:0" if isinstance(data_or_path, bytes) else data_or_path,
            "-f", "f32le", "-ac", "1", "-ar", str(SR), "pipe:1"]
    r = subprocess.run(args, input=data_or_path if isinstance(data_or_path, bytes) else None, capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype=np.float32).copy()


def aparar(a, limiar=0.012, folga=0.03):
    """Tira silêncio do começo e do fim."""
    idx = np.where(np.abs(a) > limiar)[0]
    if len(idx) == 0:
        return a
    i0 = max(0, idx[0] - int(folga * SR))
    i1 = min(len(a), idx[-1] + int(folga * SR))
    return a[i0:i1]


class Edge:
    nome = "edge"

    def __init__(self, voz, vel):
        import edge_tts  # noqa
        self.voz = voz
        pct = int(round((vel - 1) * 100))
        self.rate = f"{'+' if pct >= 0 else ''}{pct}%"

    def falar(self, texto):
        import edge_tts

        async def go():
            buf = b""
            async for ch in edge_tts.Communicate(texto, self.voz, rate=self.rate).stream():
                if ch["type"] == "audio":
                    buf += ch["data"]
            return buf

        return decode(asyncio.run(go()))


class Kokoro:
    nome = "kokoro"

    def __init__(self, voz, vel):
        from kokoro_onnx import Kokoro as K
        os.makedirs(KOKORO_DIR, exist_ok=True)
        for f in ["kokoro-v1.0.int8.onnx", "voices-v1.0.bin"]:
            p = os.path.join(KOKORO_DIR, f)
            if not os.path.exists(p):
                print(f"baixando {f}…")
                urllib.request.urlretrieve(KOKORO_URL + f, p)
        self.k = K(os.path.join(KOKORO_DIR, "kokoro-v1.0.int8.onnx"), os.path.join(KOKORO_DIR, "voices-v1.0.bin"))
        self.voz, self.vel = voz, vel

    def falar(self, texto):
        s, sr = self.k.create(texto, voice=self.voz, speed=self.vel, lang="pt-br")
        s = np.asarray(s, dtype=np.float32)
        if sr != SR:
            s = decode(_wav_bytes(s, sr))
        return s


def _wav_bytes(a, sr):
    import soundfile as sf
    b = io.BytesIO()
    sf.write(b, a, sr, format="WAV")
    return b.getvalue()


def tempos_palavras(frase, t0, dur):
    """Distribui as palavras da frase pelo tempo falado (peso ~ tamanho da palavra)."""
    palavras = frase.split()
    pesos = [len(re.sub(r"\W", "", w)) + 2.5 for w in palavras]
    total = sum(pesos)
    out, t = [], t0
    for w, p in zip(palavras, pesos):
        d = dur * p / total
        out.append({"w": w, "start": round(t, 3), "end": round(t + d, 3)})
        t += d
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        sys.exit("Uso: npm run narrar -- <slug>")
    slug = args[0]
    rot = json.load(open(os.path.join(ROOT, "videos", slug, "roteiro.json"), encoding="utf-8"))
    voz = rot.get("voz", {})
    vel = voz.get("velocidade", 1.0)
    pron = rot.get("pronuncia", {})
    out_dir = os.path.join(ROOT, "public", "explicativo", slug)
    os.makedirs(out_dir, exist_ok=True)

    motor = None
    if "--kokoro" not in sys.argv:
        try:
            motor = Edge(voz.get("edge", "pt-BR-AntonioNeural"), vel)
            motor.falar("teste")
        except Exception as e:
            print(f"edge-tts indisponível ({type(e).__name__}); usando a voz local Kokoro.")
            motor = None
    if motor is None:
        motor = Kokoro(voz.get("kokoro", "pm_alex"), vel)
    print(f"motor: {motor.nome}")

    pedacos, cenas, t = [], [], 0.0
    pedacos.append(np.zeros(int(0.25 * SR), dtype=np.float32))
    t = 0.25
    for cena in rot["cenas"]:
        c0 = t
        palavras = []
        for frase, pont in frases(cena["fala"]):
            a = aparar(motor.falar(para_tts(frase, pron)))
            dur = len(a) / SR
            palavras += tempos_palavras(frase, t, dur)
            palavras[-1]["fimFrase"] = True
            pausa = PAUSA.get(pont, 0.1)
            pedacos += [a, np.zeros(int(pausa * SR), dtype=np.float32)]
            t += dur + pausa
        pedacos.append(np.zeros(int(FIM_CENA * SR), dtype=np.float32))
        t += FIM_CENA
        cenas.append({"id": cena["id"], "start": round(c0, 3), "end": round(t, 3), "palavras": palavras})
        print(f"  {cena['id']:<12} {t - c0:5.2f}s")
    audio = np.concatenate(pedacos)
    audio = audio / max(1e-6, np.abs(audio).max()) * 0.89
    wav = os.path.join(out_dir, "narracao.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "pipe:0",
                    "-af", "highpass=f=70,acompressor=threshold=-18dB:ratio=3:attack=5:release=80,loudnorm=I=-16:TP=-1.5",
                    "-ar", "48000", wav], input=audio.tobytes(), check=True)
    json.dump({"motor": motor.nome, "duracao": round(t + 0.6, 3), "cenas": cenas},
              open(os.path.join(out_dir, "tempos.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"ok: {t:.1f}s → public/explicativo/{slug}/narracao.wav + tempos.json")


if __name__ == "__main__":
    main()
