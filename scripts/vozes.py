#!/usr/bin/env python3
"""
Escolher a voz do canal pelo ouvido.

  npm run vozes                         → amostras de todas as vozes em português da Microsoft (grátis)
  npm run vozes -- eleven               → vozes do ElevenLabs em português do Brasil (da sua conta + biblioteca)
                                          baixa a prévia de cada uma (grátis) para ouvir no painel
  npm run vozes -- testar <id>          → frase de teste com a voz do ElevenLabs, igual ao narrar (gasta ~200 créditos)
  npm run vozes -- referencia           → cria marca/voz-feminina.wav e voz-masculina.wav (Microsoft) para o Chatterbox clonar
  npm run vozes -- local                → liga o Chatterbox (GPU) e gera amostras feminina/masculina para ouvir
  npm run vozes -- comparar lavagem     → narra o começo do vídeo nas duas vozes (Microsoft × local) para comparar
  npm run vozes -- usar <id> feminina   → fixa essa voz no voz.json (vale para todos os vídeos)
  npm run vozes -- usar marca/voz-minha.wav masculina  → clona a SUA gravação (Chatterbox)
  npm run vozes -- usar <id> masculina

Ouça em: npm run baixar → porta 8080 → seção "Vozes".
"""
import asyncio, json, os, re, sys, urllib.error, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "out", "vozes")
VOZ_JSON = os.path.join(ROOT, "voz.json")
LISTA = os.path.join(OUT, "eleven.json")
FRASE = ("O Senado aprovou o fim da escala seis por um. Foram setenta e cinco votos a um. "
         "Mas calma: não muda de uma vez, e o salário não pode cair.")

_env = os.path.join(ROOT, ".env")
if os.path.exists(_env):
    for _l in open(_env, encoding="utf-8"):
        _l = _l.strip()
        if _l and not _l.startswith("#") and "=" in _l:
            _k, _v = _l.split("=", 1)
            os.environ.setdefault(_k.strip(), _v.strip().strip('"').strip("'"))
KEY = os.environ.get("ELEVENLABS_API_KEY")


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:30]


class ErroApi(Exception):
    pass


def api(path, data=None, method=None):
    if not KEY:
        sys.exit("Falta ELEVENLABS_API_KEY no .env")
    req = urllib.request.Request("https://api.elevenlabs.io" + path, data=json.dumps(data).encode() if data is not None else None,
                                 headers={"xi-api-key": KEY, "Content-Type": "application/json"}, method=method or ("POST" if data is not None else "GET"))
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            body = r.read()
    except urllib.error.HTTPError as e:
        msg = e.read().decode("utf-8", "ignore")
        try:
            d = json.loads(msg).get("detail", msg)
            msg = d.get("message", d) if isinstance(d, dict) else d
        except Exception:
            pass
        raise ErroApi(f"HTTP {e.code}: {msg}")
    except urllib.error.URLError as e:
        raise ErroApi(f"sem conexão com o ElevenLabs ({e.reason})")
    return json.loads(body) if body[:1] in (b"{", b"[") else body


PERMISSAO = """
A sua chave do ElevenLabs não tem permissão para LER VOZES (ela só pode gerar fala).
Arrume em 1 minuto: elevenlabs.io → Developers → API Keys → edite a chave e ligue
  "Voices: Read" e "Voices: Write"  (ou crie uma chave sem restrições) → cole no .env.
Ou escolha no site: Voices → Voice Library → filtre Português/Brasil → "Add to my voices",
copie o Voice ID e rode:  npm run vozes -- usar <voice_id> feminina   (ou masculina)
"""


def baixar(url, arq):
    try:
        urllib.request.urlretrieve(url, arq)
        return True
    except Exception:
        return False


def genero_de(v):
    g = (v.get("gender") or (v.get("labels") or {}).get("gender") or "").lower()
    return "feminina" if g.startswith("f") else "masculina" if g.startswith("m") else "?"


def eh_brasil(v):
    txt = " ".join(str(v.get(k, "")) for k in ["locale", "accent", "language", "description", "name"]).lower()
    txt += " " + json.dumps(v.get("labels") or {}).lower() + json.dumps(v.get("verified_languages") or []).lower()
    return "pt-br" in txt or "brazil" in txt or "brasil" in txt


def eleven():
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT):
        if f.startswith("eleven-"):
            os.remove(os.path.join(OUT, f))
    vozes = []
    try:
        conta = api("/v1/voices").get("voices", [])
    except ErroApi as e:
        print(f"Não consegui listar as vozes da sua conta ({e}).")
        if "401" in str(e) or "permission" in str(e).lower():
            print(PERMISSAO)
        conta = []
    for v in conta:
        vozes.append({"id": v["voice_id"], "nome": v["name"], "genero": genero_de(v), "origem": "conta",
                      "br": eh_brasil(v), "preview": v.get("preview_url"), "dono": None})
    q = urllib.parse.urlencode({"page_size": 60, "language": "pt", "sort": "trending"})
    try:
        biblioteca = api(f"/v1/shared-voices?{q}").get("voices", [])
    except ErroApi as e:
        print(f"Não consegui buscar na biblioteca ({e}).")
        biblioteca = []
    if not conta and not biblioteca:
        sys.exit(1)
    for v in biblioteca:
        if not eh_brasil(v):
            continue
        vozes.append({"id": v["voice_id"], "nome": v["name"], "genero": genero_de(v), "origem": "biblioteca",
                      "br": True, "preview": v.get("preview_url"), "dono": v.get("public_owner_id"),
                      "desc": (v.get("description") or "")[:80]})
    vozes.sort(key=lambda v: (not v["br"], v["genero"], v["origem"] != "conta"))
    json.dump(vozes, open(LISTA, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{'gênero':<10} {'origem':<11} {'nome':<26} id")
    for v in vozes:
        if not v["br"] and v["origem"] == "biblioteca":
            continue
        ok = v["preview"] and baixar(v["preview"], os.path.join(OUT, f"eleven-{v['genero']}-{slug(v['nome'])}-{v['id']}.mp3"))
        marca = "" if v["br"] else "  (não é pt-BR)"
        print(f"{v['genero']:<10} {v['origem']:<11} {v['nome'][:25]:<26} {v['id']}{'' if ok else '  (sem prévia)'}{marca}")
    print("\nOuça as prévias: npm run baixar → porta 8080 → seção Vozes (arquivos eleven-…).")
    print("Gostou? Teste com a nossa frase:  npm run vozes -- testar <id>")
    print("Fixe no canal:                    npm run vozes -- usar <id> feminina   (ou masculina)")


def testar(vid):
    """Gera a frase de teste com a voz do ElevenLabs usando EXATAMENTE o mesmo caminho do narrar
    (modelo, ajustes, números por extenso). Gasta ~150 créditos."""
    import subprocess
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import narrar
    cfg = json.load(open(VOZ_JSON, encoding="utf-8")) if os.path.exists(VOZ_JSON) else {}
    os.makedirs(OUT, exist_ok=True)
    m = narrar.Eleven(1.0, {"teste": vid}, cfg.get("eleven_ajustes"), cfg.get("eleven_modelo"))
    a, _ = m.falar(narrar.para_tts(FRASE_TESTE, {}), "teste")
    arq = os.path.join(OUT, f"teste-eleven-{vid}.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(narrar.SR), "-ac", "1", "-i", "pipe:0",
                    "-af", narrar.TRATAMENTO_ELEVEN, "-ar", "48000", arq], input=a.tobytes(), check=True)
    print(f"ok → out/vozes/teste-eleven-{vid}.wav (ouça no painel)")


# frase de teste com o que costuma soar robótico: número com gênero, pergunta, contraste
FRASE_TESTE = ("Acabou a escala 6x1. Então agora você folga sábado e domingo? Não necessariamente. "
               "A lei garante 2 folgas por semana, e no máximo 40 horas. Mas quem escolhe os dias, em geral, é a empresa.")


REF_TEXTO = ("Sabe quanto tempo leva pra contar até um bilhão? Trinta e um anos! Sem parar, dia e noite. "
             "Parece exagero, né? Só que não é. E tem mais: um milhão você conta em onze dias. "
             "Onze dias! Agora pensa nisso da próxima vez que ouvir essas duas palavras.")


def referencia():
    import edge_tts
    cfg = json.load(open(VOZ_JSON, encoding="utf-8")) if os.path.exists(VOZ_JSON) else {}
    edge = cfg.get("edge", {})
    print("Dica: a MELHOR referência é uma gravação humana de 15–20 s, animada, sem música, com autorização de quem fala")
    print("(npm run vozes -- usar marca/voz-minha.wav masculina). Esta aqui é a voz da Microsoft lendo um texto expressivo.")
    for genero, padrao in (("feminina", "pt-BR-FranciscaNeural"), ("masculina", "pt-BR-AntonioNeural")):
        voz = edge.get(genero) or padrao
        mp3 = os.path.join(OUT, f"_ref-{genero}.mp3")
        os.makedirs(OUT, exist_ok=True)
        try:
            asyncio.run(edge_tts.Communicate(REF_TEXTO, voz, rate="+8%").save(mp3))
        except Exception:
            asyncio.run(edge_tts.Communicate(REF_TEXTO, "pt-BR-FranciscaNeural" if genero == "feminina" else "pt-BR-AntonioNeural").save(mp3))
        wav = os.path.join(ROOT, "marca", f"voz-{genero}.wav")
        os.system(f'ffmpeg -v error -y -i "{mp3}" -ac 1 -ar 24000 "{wav}"')
        print(f"ok → marca/voz-{genero}.wav ({voz})")
    print("Agora: npm run vozes -- local")


def local():
    cfg = json.load(open(VOZ_JSON, encoding="utf-8")) if os.path.exists(VOZ_JSON) else {}
    cfg["motor"] = "chatterbox"
    cfg.setdefault("chatterbox", {"feminina": "marca/voz-feminina.wav", "masculina": "marca/voz-masculina.wav", "emocao": 0.65, "ritmo": 0.4})
    json.dump(cfg, open(VOZ_JSON, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    open(VOZ_JSON, "a").write("\n")
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import narrar
    import soundfile as sf
    m = narrar.Chatterbox(cfg["chatterbox"], cfg.get("velocidade", 1.05))
    os.makedirs(OUT, exist_ok=True)
    for g in ("feminina", "masculina"):
        import numpy as np
        partes = [x for x in re.split(r"(?<=[.!?:])\s+", FRASE) if x]
        a = np.concatenate([np.concatenate([m.falar(x, g)[0], np.zeros(int(0.2 * narrar.SR), dtype=np.float32)]) for x in partes])
        sf.write(os.path.join(OUT, f"local-{g}.wav"), a, narrar.SR)
        print(f"ok → out/vozes/local-{g}.wav")
    print("Ouça no painel (npm run baixar). Ajuste no voz.json → chatterbox.emocao (0.3 calmo … 0.8 animado).")


def comparar(slug, cenas=3):
    """Narra o começo de um vídeo real com a voz da Microsoft e com o Chatterbox (GPU), mesmo volume,
    para decidir pelo ouvido. Não muda o voz.json."""
    import numpy as np, subprocess
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import narrar
    cfg = json.load(open(VOZ_JSON, encoding="utf-8")) if os.path.exists(VOZ_JSON) else {}
    rot = json.load(open(os.path.join(ROOT, "videos", slug, "roteiro.json"), encoding="utf-8"))
    genero = (rot.get("voz") or {}).get("principal") or cfg.get("principal") or "masculina"
    pron = rot.get("pronuncia", {})
    falas = [narrar.para_tts(c["fala"], pron) for c in rot["cenas"][:cenas]]
    vel = cfg.get("velocidade", 1.08)
    motores = [("microsoft", lambda: narrar.Edge(vel))]
    chat = dict(cfg.get("chatterbox") or {})
    chat.setdefault("emocao", 0.65)
    chat.setdefault("ritmo", 0.4)
    motores.append(("local", lambda: narrar.Chatterbox(chat, vel)))
    os.makedirs(OUT, exist_ok=True)
    for nome, fazer in motores:
        try:
            m = fazer()
            pedacos = []
            for f in falas:
                a, _ = m.falar(f, genero, (cfg.get("edge") or {}).get(genero) if nome == "microsoft" else None)
                if nome == "microsoft":
                    a, _ = narrar.encurtar_pausas(a)
                a, _ = narrar.aparar(a)
                pedacos += [a, np.zeros(int(0.1 * narrar.SR), dtype=np.float32)]
            audio = np.concatenate(pedacos)
            arq = os.path.join(OUT, f"comparar-{slug}-{nome}.wav")
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(narrar.SR), "-ac", "1", "-i", "pipe:0",
                            "-af", "highpass=f=75,equalizer=f=3200:t=q:w=1.2:g=2,acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120,loudnorm=I=-14:TP=-1.2",
                            "-ar", "48000", arq], input=audio.tobytes(), check=True)
            print(f"ok → out/vozes/comparar-{slug}-{nome}.wav")
        except Exception as e:
            print(f"{nome}: não deu ({type(e).__name__}: {e})")
            if nome == "local":
                print("  instale a voz local: bash scripts/setup-voz-local.sh  ·  referência: npm run vozes -- referencia")
    print("Ouça os dois (npm run baixar → porta 8080 → Vozes). Gostou do local? npm run vozes -- local fixa o Chatterbox.")


def usar(vid, genero):
    if genero not in ("feminina", "masculina"):
        sys.exit("Use: npm run vozes -- usar <id> feminina|masculina")
    cfg = json.load(open(VOZ_JSON, encoding="utf-8")) if os.path.exists(VOZ_JSON) else {}
    if vid.lower().endswith((".wav", ".mp3", ".m4a", ".flac")):  # gravação para o Chatterbox clonar
        caminho = os.path.relpath(os.path.abspath(vid), ROOT)
        if not os.path.exists(os.path.join(ROOT, caminho)):
            sys.exit(f"arquivo não encontrado: {vid}")
        cfg.setdefault("chatterbox", {})[genero] = caminho
        cfg["motor"] = "chatterbox"
        json.dump(cfg, open(VOZ_JSON, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
        open(VOZ_JSON, "a").write("\n")
        print(f"voz.json: Chatterbox {genero} = {caminho}")
        return
    if vid.startswith("pt-"):  # voz da Microsoft
        cfg.setdefault("edge", {})[genero] = vid
        if cfg.get("motor") != "eleven":
            cfg["motor"] = "edge"
    else:
        lista = json.load(open(LISTA, encoding="utf-8")) if os.path.exists(LISTA) else []
        info = next((v for v in lista if v["id"] == vid), None)
        if info and info["origem"] == "biblioteca" and info.get("dono"):
            # vozes da biblioteca precisam ser adicionadas à sua conta antes de usar pela API
            try:
                api(f"/v1/voices/add/{info['dono']}/{vid}", {"new_name": f"Scientia {genero} - {info['nome']}"[:40]})
                print("voz adicionada à sua conta do ElevenLabs")
            except ErroApi as e:
                print(f"aviso: não consegui adicionar a voz à conta ({e}). Adicione pelo site: Voice Library → 'Add to my voices'.")
        cfg.setdefault("eleven", {})[genero] = vid
        cfg["motor"] = "eleven"
    json.dump(cfg, open(VOZ_JSON, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    open(VOZ_JSON, "a").write("\n")
    print(f"voz.json: {genero} = {vid} (motor: {cfg['motor']}). Vale para os próximos 'npm run narrar'.")


async def edge():
    import edge_tts
    os.makedirs(OUT, exist_ok=True)
    vozes = [v for v in await edge_tts.list_voices() if v["Locale"].startswith("pt-")]
    vozes.sort(key=lambda v: (v["Locale"] != "pt-BR", v["ShortName"]))
    for v in vozes:
        nome = v["ShortName"]
        genero = "feminina" if v["Gender"] == "Female" else "masculina"
        try:
            await edge_tts.Communicate(FRASE, nome, rate="+5%").save(os.path.join(OUT, f"{nome}.mp3"))
            print(f"  {nome:<36} {genero:<10} {v['Locale']}")
        except Exception as e:
            print(f"  {nome:<36} falhou ({type(e).__name__})")
    print("\nOuça: npm run baixar (porta 8080). Fixe com: npm run vozes -- usar <nome> feminina|masculina")


if __name__ == "__main__":
    a = sys.argv[1:]
    if not a:
        asyncio.run(edge())
    elif a[0] == "eleven":
        eleven()
    elif a[0] == "referencia":
        referencia()
    elif a[0] == "local":
        local()
    elif a[0] == "comparar":
        if len(a) < 2:
            sys.exit("Use: npm run vozes -- comparar <slug>")
        comparar(a[1])
    elif a[0] == "testar" and len(a) > 1:
        testar(a[1])
    elif a[0] == "usar" and len(a) > 2:
        usar(a[1], a[2])
    else:
        print(__doc__)
