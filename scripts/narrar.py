#!/usr/bin/env python3
"""
Gera a narração de um vídeo explicativo + o tempo de cada palavra (para a legenda karaokê).

Uso:  npm run narrar -- 6x1            (lê videos/6x1/roteiro.json)
      npm run narrar -- 6x1 --kokoro   (força a voz local)

Voz (campo "voz" do roteiro.json):
  "principal": "masculina" | "feminina"   → qual voz narra o vídeo
  "alternar":  "cenas"                    → as cenas se alternam entre as duas vozes (estilo dupla)
  "velocidade": 1.05                      → 1.0 = normal
  "masculina"/"feminina": "<voz do edge>" → troca a voz (lista: npm run vozes)
  Cada cena também aceita "voz": "masculina" | "feminina".

Motores:
  chatterbox → voz local na GPU (MIT), clona uma voz de referência; bash scripts/setup-voz-local.sh
  eleven → ElevenLabs, a mais humana (paga; "motor": "eleven" + ELEVENLABS_API_KEY; vozes em "eleven": {"feminina": "<id>", "masculina": "<id>"})
  edge   → vozes neurais da Microsoft (grátis, naturais; precisa de internet). pip: edge-tts
  kokoro → voz local, offline (pip: kokoro-onnx soundfile; baixa o modelo do GitHub sozinho)

Naturalidade: a voz fala a FRASE inteira de uma vez (a entonação flui pelas vírgulas) e o tempo de
cada palavra vem da própria voz (WordBoundary do edge), não de estimativa.

Saídas: public/explicativo/<slug>/narracao.wav e public/explicativo/<slug>/tempos.json
"""
import asyncio, io, json, os, re, subprocess, sys, urllib.error, urllib.request
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Chaves locais (ex.: ELEVENLABS_API_KEY) em .env na raiz do projeto — fora do Git.
_env = os.path.join(ROOT, ".env")
if os.path.exists(_env):
    for _l in open(_env, encoding="utf-8"):
        _l = _l.strip()
        if _l and not _l.startswith("#") and "=" in _l:
            _k, _v = _l.split("=", 1)
            os.environ.setdefault(_k.strip(), _v.strip().strip('"').strip("'"))
SR = 24000
PAUSA_FRASE = {".": 0.2, "!": 0.22, "?": 0.24, ":": 0.15, ";": 0.15, "": 0.12}  # só no modo frase a frase
FIM_CENA = 0.1  # respiro entre cenas (a trilha cobre, nunca fica silêncio morto)
KOKORO_DIR = os.environ.get("KOKORO_DIR", os.path.expanduser("~/.cache/kokoro"))
KOKORO_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"

# Vozes padrão. NÃO use as "Multilingual": em português elas puxam sotaque de Portugal.
# A voz aprovada do canal é a masculina (Antonio) — a dos vídeos 6x1 e aproximação.
EDGE = {
    "feminina": ["pt-BR-FranciscaNeural", "pt-BR-ThalitaNeural"],
    "masculina": ["pt-BR-AntonioNeural"],
}
KOKORO = {"feminina": "pf_dora", "masculina": "pm_alex"}


def frases(texto):
    """Divide a fala em FRASES (ponto, exclamação, interrogação). Vírgulas ficam dentro da frase,
    para a voz fazer a entonação natural. Não quebra "26,8" nem "14.10"."""
    out = []
    for s in re.split(r"(?<=[.!?;:])\s+", texto.strip()):
        s = s.strip()
        if s:
            out.append((s, s[-1] if s[-1] in ".!?;:" else ""))
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


PAUSA_MAX = 0.2  # pausas internas mais longas que isso são encurtadas (Ludificando: < 5% de silêncio)


def encurtar_pausas(a, maximo=PAUSA_MAX, limiar=0.012):
    """Encurta silêncios internos longos (a voz da Microsoft respira demais entre frases).
    Devolve (áudio, remap) — remap(t) converte um tempo do áudio original para o encurtado,
    para as marcas de palavra continuarem batendo com a fala."""
    win = int(0.01 * SR)
    n = len(a) // win
    if n < 3:
        return a, (lambda t: t)
    env = np.abs(a[: n * win]).reshape(n, win).max(axis=1)
    mudo = env < limiar
    cortes = []  # (início_em_amostras, tamanho_removido)
    i = 0
    while i < n:
        if mudo[i]:
            j = i
            while j < n and mudo[j]:
                j += 1
            if i > 0 and j < n and (j - i) * win > (maximo + 0.04) * SR:  # só pausas internas
                manter = int(maximo * SR)
                ini = i * win + manter // 2
                cortes.append((ini, (j - i) * win - manter))
            i = j
        else:
            i += 1
    if not cortes:
        return a, (lambda t: t)
    partes, pos = [], 0
    for ini, tam in cortes:
        partes.append(a[pos:ini])
        pos = ini + tam
    partes.append(a[pos:])

    def remap(t):
        x = t * SR
        tirado = 0
        for ini, tam in cortes:
            if x >= ini + tam:
                tirado += tam
            elif x > ini:
                tirado += x - ini
        return (x - tirado) / SR

    return np.concatenate(partes), remap


def aparar(a, limiar=0.012, folga=0.03):
    """Tira silêncio do começo e do fim. Devolve (áudio, segundos cortados no começo)."""
    idx = np.where(np.abs(a) > limiar)[0]
    if len(idx) == 0:
        return a, 0.0
    i0 = max(0, idx[0] - int(folga * SR))
    i1 = min(len(a), idx[-1] + int(folga * SR))
    return a[i0:i1], i0 / SR


class Edge:
    nome = "edge"

    def __init__(self, vel, pitch="+0Hz"):
        import edge_tts  # noqa
        pct = int(round((vel - 1) * 100))
        self.rate = f"{'+' if pct >= 0 else ''}{pct}%"
        self.pitch = pitch
        self.ok = {}

    def _gerar(self, texto, voz):
        import edge_tts

        async def go():
            buf, marcas = b"", []
            com = edge_tts.Communicate(texto, voz, rate=self.rate, pitch=self.pitch, boundary="WordBoundary")
            async for ch in com.stream():
                if ch["type"] == "audio":
                    buf += ch["data"]
                elif ch["type"] == "WordBoundary":
                    marcas.append((ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7, ch["text"]))
            return buf, marcas

        buf, marcas = asyncio.run(go())
        if not buf:
            raise RuntimeError("sem áudio")
        return decode(buf), marcas

    def voz_de(self, genero, preferida=None):
        """Primeira voz da lista que funciona nesta máquina (guarda o resultado)."""
        candidatas = ([preferida] if preferida else []) + EDGE[genero]
        for v in candidatas:
            if v in self.ok:
                if self.ok[v]:
                    return v
                continue
            try:
                self._gerar("Oi.", v)
                self.ok[v] = True
                return v
            except Exception:
                self.ok[v] = False
                print(f"  voz {v} indisponível, tentando outra…")
        raise RuntimeError(f"nenhuma voz {genero} do edge funcionou")

    def falar(self, texto, genero, preferida=None):
        return self._gerar(texto, self.voz_de(genero, preferida))


class ErroEleven(Exception):
    pass


class Eleven:
    """ElevenLabs (pago, a voz mais humana). Precisa de ELEVENLABS_API_KEY. Tempo das palavras vem do
    endpoint with-timestamps (alinhamento por caractere)."""
    nome = "eleven"
    def __init__(self, vel, ids=None, ajustes=None):
        self.key = os.environ.get("ELEVENLABS_API_KEY")
        if not self.key:
            raise RuntimeError("sem ELEVENLABS_API_KEY no .env")
        self.ids = {k: v for k, v in (ids or {}).items() if v}
        if not self.ids:
            raise RuntimeError("nenhuma voz do ElevenLabs escolhida em voz.json (rode: npm run vozes -- eleven)")
        self.ajustes = {"stability": 0.45, "similarity_boost": 0.8, "style": 0.15, **(ajustes or {})}
        self.vel = max(0.7, min(1.2, vel))

    def voz_de(self, genero, preferida=None):
        # se só uma voz foi escolhida, ela narra tudo (melhor que cair numa voz ruim)
        return self.ids.get(genero) or next(iter(self.ids.values()))

    def falar(self, texto, genero, preferida=None):
        import base64
        body = json.dumps({
            "text": texto,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {**self.ajustes, "use_speaker_boost": True, "speed": self.vel},
        }).encode()
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{self.voz_de(genero)}/with-timestamps?output_format=mp3_44100_128",
            data=body, headers={"xi-api-key": self.key, "Content-Type": "application/json"}, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                d = json.loads(r.read())
        except urllib.error.HTTPError as e:
            corpo = e.read().decode("utf-8", "ignore")
            try:
                det = json.loads(corpo).get("detail", corpo)
                corpo = det.get("message", det) if isinstance(det, dict) else det
            except Exception:
                pass
            dica = {
                402: "o plano grátis do ElevenLabs não deixa usar vozes da Voice Library pela API, ou os créditos acabaram. "
                     "Saídas: assinar o Starter, escolher vozes 'Default'/criadas por você, ou usar a Microsoft (npm run vozes).",
                401: "a chave não tem permissão de Text to Speech ou está errada (.env).",
                404: "voice ID não encontrado — adicione a voz à sua conta ('Add to my voices') ou confira o ID no voz.json.",
                429: "limite de uso por minuto/créditos atingido; tente de novo daqui a pouco.",
            }.get(e.code, "")
            raise ErroEleven(f"ElevenLabs HTTP {e.code}: {corpo}\n  → {dica}") from None
        audio = decode(base64.b64decode(d["audio_base64"]))
        al = d.get("alignment") or {}
        chars, ini, fim = al.get("characters", []), al.get("character_start_times_seconds", []), al.get("character_end_times_seconds", [])
        marcas, cur, c0, c1 = [], "", None, None
        for ch, a, b in zip(chars, ini, fim):
            if ch.isspace():
                if cur:
                    marcas.append((c0, c1, cur))
                cur, c0 = "", None
                continue
            if c0 is None:
                c0 = a
            cur, c1 = cur + ch, b
        if cur:
            marcas.append((c0, c1, cur))
        return audio, marcas


class Chatterbox:
    """Chatterbox Multilingual (Resemble AI, licença MIT) rodando na SUA GPU. Clona a voz de um áudio de
    referência de ~10–20 s (marca/voz-feminina.wav, marca/voz-masculina.wav ou a sua própria gravação).
    Instalação: bash scripts/setup-voz-local.sh"""
    nome = "chatterbox"

    def __init__(self, cfg, vel):
        import torch
        import perth
        if getattr(perth, "PerthImplicitWatermarker", None) is None:
            # a marca d'água (perth) não carregou — quase sempre falta o setuptools/pkg_resources no venv.
            # Corrija com: ~/.venvs/scientia/bin/pip install "setuptools<81"
            print("aviso: marca d'água do Chatterbox indisponível (falta setuptools); seguindo sem ela.")
            perth.PerthImplicitWatermarker = getattr(perth, "DummyWatermarker", None) or (lambda: type("W", (), {"apply_watermark": lambda self, w, sample_rate=None: w})())
        from chatterbox.mtl_tts import ChatterboxMultilingualTTS
        self.refs = {}
        for g in ("feminina", "masculina"):
            ref = (cfg or {}).get(g)
            if ref:
                ref = ref if os.path.isabs(ref) else os.path.join(ROOT, ref)
                if os.path.exists(ref):
                    self.refs[g] = ref
        if not self.refs:
            raise RuntimeError("sem áudio de referência (rode: npm run vozes -- referencia, ou grave a sua voz)")
        dev = "cuda" if torch.cuda.is_available() else "cpu"
        if dev == "cpu":
            print("aviso: sem GPU — o Chatterbox vai ficar bem lento")
        self.torch = torch
        self.model = ChatterboxMultilingualTTS.from_pretrained(device=dev)
        self.emocao = float((cfg or {}).get("emocao", 0.55))   # 0.25 calmo · 0.5 natural · 0.8+ animado
        self.ritmo = float((cfg or {}).get("ritmo", 0.45))     # cfg_weight: menor = fala mais solta
        self.vel = vel

    def voz_de(self, genero, preferida=None):
        return self.refs.get(genero) or next(iter(self.refs.values()))

    def _gerar(self, texto, genero, emocao, ritmo, seed):
        self.torch.manual_seed(seed)
        with self.torch.inference_mode():
            wav = self.model.generate(texto, language_id="pt", audio_prompt_path=self.voz_de(genero),
                                      exaggeration=emocao, cfg_weight=ritmo)
        a = wav.squeeze().detach().cpu().numpy().astype(np.float32)
        return aparar(decode(_wav_bytes(a, self.model.sr)))[0]

    def _uma(self, texto, genero):
        """Gera e confere se não saiu cortado (o Chatterbox às vezes encerra a fala antes da hora)."""
        esperado = len(texto) / 15.5  # ~15 caracteres por segundo em fala normal
        melhor = None
        for tentativa, (em, rt) in enumerate([(self.emocao, self.ritmo), (self.emocao * 0.85, 0.5), (0.45, 0.55)]):
            a = self._gerar(texto, genero, em, rt, seed=1234 + tentativa * 7)
            dur = len(a) / SR
            if melhor is None or dur > len(melhor) / SR:
                melhor = a
            if dur >= 0.62 * esperado or len(texto) < 25:
                return a
            print(f"    (fala saiu curta {dur:.1f}s de ~{esperado:.1f}s; gerando de novo)")
        return melhor

    def falar(self, texto, genero, preferida=None):
        # frases longas viram pedaços (o modelo se perde em textos compridos)
        partes = [texto] if len(texto) <= 170 else [p for p in re.split(r"(?<=[,;:])\s+", texto) if p.strip()]
        pedacos = []
        for i, p in enumerate(partes):
            pedacos.append(self._uma(p, genero))
            if i < len(partes) - 1:
                pedacos.append(np.zeros(int(0.08 * SR), dtype=np.float32))
        a = np.concatenate(pedacos)
        if abs(self.vel - 1) > 0.01:  # acelera sem mudar o tom
            r = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "pipe:0",
                                "-af", f"atempo={self.vel:.3f}", "-f", "f32le", "pipe:1"], input=a.tobytes(), capture_output=True, check=True)
            a = np.frombuffer(r.stdout, dtype=np.float32).copy()
        return a, []


class Kokoro:
    nome = "kokoro"

    def __init__(self, vel):
        from kokoro_onnx import Kokoro as K
        os.makedirs(KOKORO_DIR, exist_ok=True)
        for f in ["kokoro-v1.0.int8.onnx", "voices-v1.0.bin"]:
            p = os.path.join(KOKORO_DIR, f)
            if not os.path.exists(p):
                print(f"baixando {f}…")
                urllib.request.urlretrieve(KOKORO_URL + f, p)
        self.k = K(os.path.join(KOKORO_DIR, "kokoro-v1.0.int8.onnx"), os.path.join(KOKORO_DIR, "voices-v1.0.bin"))
        self.vel = vel

    def falar(self, texto, genero, preferida=None):
        s, sr = self.k.create(texto, voice=preferida or KOKORO[genero], speed=self.vel, lang="pt-br")
        s = np.asarray(s, dtype=np.float32)
        if sr != SR:
            s = decode(_wav_bytes(s, sr))
        return s, []


def _wav_bytes(a, sr):
    import soundfile as sf
    b = io.BytesIO()
    sf.write(b, a, sr, format="WAV")
    return b.getvalue()


def _limpa(w):
    return re.sub(r"[^\w]", "", w.lower())


def tempos_proporcionais(palavras, t0, dur):
    pesos = [len(re.sub(r"\W", "", w)) + 2.5 for w in palavras]
    total = sum(pesos)
    out, t = [], t0
    for w, p in zip(palavras, pesos):
        d = dur * p / total
        out.append({"w": w, "start": round(t, 3), "end": round(t + d, 3)})
        t += d
    return out


def tempos_da_voz(frase, pron, marcas, t0, corte, dur):
    """Usa os tempos reais que a voz informou (WordBoundary). Cada palavra exibida pode virar várias
    palavras faladas (ex.: "26,8" → "vinte e seis vírgula oito"). Se não bater, cai no proporcional."""
    palavras = frase.split()
    falado = [len(para_tts(re.sub(r"[.,;:!?]+$", "", w), pron).split()) or 1 for w in palavras]
    marcas = [m for m in marcas if _limpa(m[2])]
    if not marcas or len(marcas) != sum(falado):
        return tempos_proporcionais(palavras, t0, dur)
    out, i = [], 0
    for w, n in zip(palavras, falado):
        ini, fim = marcas[i][0] - corte, marcas[i + n - 1][1] - corte
        out.append({"w": w, "start": round(t0 + max(0, ini), 3), "end": round(t0 + min(dur, fim), 3)})
        i += n
    return out


def tempos_cena(fala, pron, marcas, t0, corte, dur):
    """Tempos de todas as palavras da cena a partir das marcas da voz. None se não bater (aí vai frase a frase)."""
    palavras = fala.split()
    falado = [len(para_tts(re.sub(r"[.,;:!?]+$", "", w), pron).split()) or 1 for w in palavras]
    marcas = [m for m in marcas if _limpa(m[2])]
    if not marcas or len(marcas) != sum(falado):
        return None
    out, i = [], 0
    for w, n in zip(palavras, falado):
        ini, fim = marcas[i][0] - corte, marcas[i + n - 1][1] - corte
        item = {"w": w, "start": round(t0 + max(0, ini), 3), "end": round(t0 + min(dur, fim), 3)}
        if re.search(r"[.!?;:]$", w):
            item["fimFrase"] = True
        out.append(item)
        i += n
    out[-1]["fimFrase"] = True
    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        sys.exit("Uso: npm run narrar -- <slug>")
    slug = args[0]
    rot = json.load(open(os.path.join(ROOT, "videos", slug, "roteiro.json"), encoding="utf-8"))
    # voz do canal (voz.json) + o que o roteiro escolher por cima (principal, alternar…)
    canal = json.load(open(os.path.join(ROOT, "voz.json"), encoding="utf-8")) if os.path.exists(os.path.join(ROOT, "voz.json")) else {}
    voz = {**canal, **rot.get("voz", {})}
    vel = voz.get("velocidade", 1.05)
    pron = rot.get("pronuncia", {})
    out_dir = os.path.join(ROOT, "public", "explicativo", slug)
    os.makedirs(out_dir, exist_ok=True)

    # gênero principal (compatível com roteiros antigos que só tinham "edge": "<voz>")
    principal = voz.get("principal")
    if not principal:
        antiga = voz.get("edge", "") if isinstance(voz.get("edge"), str) else ""
        principal = "feminina" if any(n in antiga for n in ["Francisca", "Thalita", "Leila", "Leticia"]) else "masculina"
    outra = "feminina" if principal == "masculina" else "masculina"
    edge_canal = canal.get("edge", {}) if isinstance(canal.get("edge"), dict) else {}
    preferida_edge = {"masculina": voz.get("masculina") or edge_canal.get("masculina"), "feminina": voz.get("feminina") or edge_canal.get("feminina")}
    if isinstance(voz.get("edge"), str):
        preferida_edge[principal] = preferida_edge[principal] or voz["edge"]

    motor = None
    if voz.get("motor") == "chatterbox" and "--kokoro" not in sys.argv:
        try:
            motor = Chatterbox(voz.get("chatterbox"), vel)
        except Exception as e:
            print(f"Chatterbox indisponível ({e}); usando a voz da Microsoft. Instale com: bash scripts/setup-voz-local.sh")
            motor = None
    if motor is None and voz.get("motor") == "eleven" and "--kokoro" not in sys.argv:
        try:
            motor = Eleven(vel, voz.get("eleven"), voz.get("eleven_ajustes"))
        except Exception as e:
            print(f"ElevenLabs indisponível ({e}); usando edge-tts.")
            motor = None
    if motor is None and "--kokoro" not in sys.argv:
        try:
            motor = Edge(vel, voz.get("pitch", "+0Hz"))
            motor.voz_de(principal, preferida_edge[principal])
        except Exception as e:
            print(f"edge-tts indisponível ({type(e).__name__}); usando a voz local Kokoro.")
            motor = None
    if motor is None:
        motor = Kokoro(vel)
        preferida_edge = {"masculina": None, "feminina": None}
    print(f"motor: {motor.nome} · voz principal: {principal}" + (" · alternando por cena" if voz.get("alternar") == "cenas" else ""))

    def gerar(motor, preferida_edge):
        pedacos, cenas = [np.zeros(int(0.25 * SR), dtype=np.float32)], []
        t = 0.25
        for ci, cena in enumerate(rot["cenas"]):
            genero = cena.get("voz") or (outra if voz.get("alternar") == "cenas" and ci % 2 else principal)
            c0 = t
            palavras = None
            if motor.nome in ("edge", "eleven"):
                # Cena inteira numa chamada só: a voz emenda as frases com a entonação dela (mais natural)
                bruto, marcas = motor.falar(para_tts(cena["fala"], pron), genero, preferida_edge.get(genero))
                bruto, remap = encurtar_pausas(bruto)
                marcas = [(remap(m[0]), remap(m[1]), *m[2:]) for m in marcas]
                a, corte = aparar(bruto)
                dur = len(a) / SR
                palavras = tempos_cena(cena["fala"], pron, marcas, t, corte, dur)
                if palavras:
                    pedacos.append(a)
                    t += dur
            if not palavras:
                palavras = []
                for frase, pont in frases(cena["fala"]):
                    bruto, marcas = motor.falar(para_tts(frase, pron), genero, preferida_edge.get(genero))
                    a, corte = aparar(bruto)
                    dur = len(a) / SR
                    palavras += tempos_da_voz(frase, pron, marcas, t, corte, dur)
                    palavras[-1]["fimFrase"] = True
                    pausa = PAUSA_FRASE.get(pont, 0.12)
                    pedacos += [a, np.zeros(int(pausa * SR), dtype=np.float32)]
                    t += dur + pausa
            pedacos.append(np.zeros(int(FIM_CENA * SR), dtype=np.float32))
            t += FIM_CENA
            cenas.append({"id": cena["id"], "start": round(c0, 3), "end": round(t, 3), "voz": genero, "palavras": palavras})
            print(f"  {cena['id']:<12} {t - c0:5.2f}s  ({genero})")
        return pedacos, cenas, t

    try:
        pedacos, cenas, t = gerar(motor, preferida_edge)
    except ErroEleven as e:
        print(f"\n{e}\nRefazendo a narração inteira com a voz da Microsoft (para não misturar vozes)…\n")
        try:
            motor = Edge(vel, voz.get("pitch", "+0Hz"))
            motor.voz_de(principal, preferida_edge[principal])
        except Exception:
            motor = Kokoro(vel)
            preferida_edge = {"masculina": None, "feminina": None}
        print(f"motor: {motor.nome} · voz principal: {principal}")
        pedacos, cenas, t = gerar(motor, preferida_edge)
    audio = np.concatenate(pedacos)
    audio = audio / max(1e-6, np.abs(audio).max()) * 0.89
    wav = os.path.join(out_dir, "narracao.wav")
    # leve "presença" de voz de locução: tira grave embolado, compressão suave, volume padrão de redes
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "pipe:0",
                    # mesmo tratamento dos primeiros vídeos (6x1, aproximação), aprovado pelo usuário.
                    # NÃO adicione eco/ambiência nem EQ pesado: deixou a voz pior.
                    "-af", "highpass=f=75,equalizer=f=3200:t=q:w=1.2:g=2,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120,loudnorm=I=-14:TP=-1.2",
                    "-ar", "48000", wav], input=audio.tobytes(), check=True)
    json.dump({"motor": motor.nome, "duracao": round(t + 0.6, 3), "cenas": cenas},
              open(os.path.join(out_dir, "tempos.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"ok: {t:.1f}s → public/explicativo/{slug}/narracao.wav + tempos.json")


if __name__ == "__main__":
    main()
