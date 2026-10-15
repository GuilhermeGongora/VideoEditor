#!/usr/bin/env python3
"""
Ouve todas as vozes em português do edge-tts com a mesma frase, para escolher pelo ouvido.
Uso: npm run vozes   →  out/vozes/<voz>.mp3  (ouça em: npm run baixar → porta 8080)
Depois coloque a escolhida no roteiro.json:  "voz": {"masculina": "<voz>"}  ou  {"feminina": "<voz>"}
"""
import asyncio, os
import edge_tts

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "out", "vozes")
FRASE = ("O Senado aprovou o fim da escala seis por um. Foram setenta e cinco votos a um. "
         "Mas calma: não muda de uma vez, e o salário não pode cair.")


async def main():
    os.makedirs(OUT, exist_ok=True)
    vozes = [v for v in await edge_tts.list_voices() if v["Locale"].startswith("pt-")]
    vozes.sort(key=lambda v: (v["Locale"] != "pt-BR", v["ShortName"]))
    for v in vozes:
        nome = v["ShortName"]
        genero = "feminina" if v["Gender"] == "Female" else "masculina"
        arq = os.path.join(OUT, f"{nome}.mp3")
        try:
            await edge_tts.Communicate(FRASE, nome, rate="+5%").save(arq)
            print(f"  {nome:<36} {genero:<10} {v['Locale']}")
        except Exception as e:
            print(f"  {nome:<36} falhou ({type(e).__name__})")
    print(f"\nAmostras em out/vozes/. Ouça com: npm run baixar (porta 8080).")
    print("pt-PT = sotaque de Portugal. As 'Multilingual' costumam soar mais naturais.")


asyncio.run(main())
