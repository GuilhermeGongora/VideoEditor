"""Números por extenso em português do Brasil, com gênero ("1 folga" → "uma folga", "2 horas" → "duas
horas", "200 pessoas" → "duzentas pessoas"). Usado pelo narrar.py antes de mandar o texto para a voz:
a legenda continua mostrando os dígitos, só a fala muda.

Regra importante para a legenda karaokê: cada token com dígitos vira o MESMO tanto de palavras faladas
seja masculino ou feminino, então o alinhamento palavra-a-palavra não quebra.
"""
import re

UNI = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze",
       "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"]
DEZ = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"]
CEN = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos",
       "oitocentos", "novecentos"]

# palavras femininas comuns nos vídeos (o resto é decidido pela terminação)
FEM = {"folga", "folgas", "hora", "horas", "semana", "semanas", "pessoa", "pessoas", "vez", "vezes", "etapa",
       "etapas", "compra", "compras", "empresa", "empresas", "lei", "leis", "urna", "urnas", "nota", "notas",
       "moeda", "moedas", "conta", "contas", "parcela", "parcelas", "cadeira", "cadeiras", "cena", "cenas",
       "família", "famílias", "casa", "casas", "vaga", "vagas", "transferência", "transferências",
       "tela", "telas", "senha", "senhas", "chave", "chaves", "regra", "regras", "dívida", "dívidas",
       "seção", "seções", "eleição", "eleições", "votação", "votações", "operação", "operações",
       "transação", "transações", "unidade", "unidades", "cidade", "cidades", "mulher", "mulheres"}
MASC = {"dia", "dias", "mapa", "mapas", "problema", "problemas", "sistema", "sistemas", "programa", "programas",
        "tema", "temas", "clima", "planeta", "planetas", "idioma", "idiomas", "cinema", "esquema"}


# preposições/conectivos: não decidem gênero ("461 a 4 votos")
NEUTRAS = {"a", "à", "as", "às", "e", "de", "da", "do", "para", "pra", "por", "pela", "até", "em", "ou",
           "contra", "x", "mais", "menos", "cada", "sobre"}


def feminino(palavra):
    p = (palavra or "").lower().strip(".,;:!?\"'()")
    if not p:
        return False
    if p in MASC or p in NEUTRAS or len(p) <= 2:
        return False
    if p in FEM:
        return True
    return bool(re.search(r"(a|as|ção|ções|dade|dades|agem|agens)$", p))


def _ate999(n, fem):
    if n == 0:
        return ""
    if n == 100:
        return "cem"
    c, r = divmod(n, 100)
    partes = []
    if c:
        cen = CEN[c]
        if fem and c >= 2:
            cen = cen[:-2] + "as"  # duzentos → duzentas
        partes.append(cen)
    if r:
        if r < 20:
            u = UNI[r]
        else:
            d, un = divmod(r, 10)
            u = DEZ[d] + (" e " + UNI[un] if un else "")
        if fem:
            u = re.sub(r"\bum$", "uma", u)
            u = re.sub(r"\bdois$", "duas", u)
        partes.append(u)
    return " e ".join(partes)


def por_extenso(n, fem=False):
    """Inteiro ≥ 0 por extenso. fem=True concorda com substantivo feminino."""
    if n == 0:
        return "zero"
    grupos = []
    for nome_s, nome_p, div in (("bilhão", "bilhões", 10**9), ("milhão", "milhões", 10**6)):
        q, n = divmod(n, div)
        if q:
            grupos.append(_ate999(q, False) + " " + (nome_s if q == 1 else nome_p))
    q, n = divmod(n, 1000)
    if q:
        grupos.append("mil" if q == 1 else _ate999(q, fem) + " mil")
    if n:
        grupos.append(_ate999(n, fem))
    if len(grupos) > 1:
        ult = grupos[-1]
        # "dois mil e vinte e seis", "mil e quinhentos"; mas "dois mil trezentos e quarenta"
        sep = " e " if (n < 100 or n % 100 == 0) else " "
        return ", ".join(grupos[:-1]).replace(", ", " ") + sep + ult if n else " ".join(grupos)
    return grupos[0]


def _num(txt):
    return int(txt.replace(".", ""))


ESCALAS = {"mil", "milhão", "milhões", "bilhão", "bilhões", "trilhão", "trilhões"}


def _limpo(t):
    return t.lower().strip(".,;:!?\"'()")


def falar_tokens(tokens):
    """Recebe as palavras como aparecem na legenda e devolve, para CADA uma, o que a voz deve falar
    (pode ser "" — ex.: "R$" vira "" e o "reais" entra depois do número). Assim a legenda continua
    alinhada palavra a palavra."""
    out = []
    reais_pendente = False
    for i, tok in enumerate(tokens):
        prox = tokens[i + 1] if i + 1 < len(tokens) else ""
        if tok == "R$":
            out.append("")
            reais_pendente = True
            continue
        if reais_pendente and _limpo(tok) in ESCALAS:
            fecha = re.search(r"[.,;:!?\"')]*$", tok).group(0)
            base = tok[: len(tok) - len(fecha)] if fecha else tok
            out.append(base + (" reais" if _limpo(tok) == "mil" else " de reais") + fecha)
            reais_pendente = False
            continue
        esc = re.fullmatch(r"([\"'(]*)(\d+)x(\d+)([.,;:!?\"')]*)", tok)  # 6x1 → seis por um
        if esc:
            out.append(esc.group(1) + por_extenso(int(esc.group(2))) + " por " + por_extenso(int(esc.group(3))) + esc.group(4))
            reais_pendente = False
            continue
        m = re.fullmatch(r"([\"'(]*)(R\$)?(\d{1,3}(?:\.\d{3})+|\d+)(,\d+)?(%|º|ª|h)?([.,;:!?\"')]*)", tok)
        if not m:
            out.append(tok)
            reais_pendente = False
            continue
        abre, real, inteiro, dec, suf, fecha = m.groups()
        real = real or ("R$" if reais_pendente else None)
        n = _num(inteiro)
        if suf in ("º", "ª"):
            ordinais = {1: "primeir", 2: "segund", 3: "terceir", 4: "quart", 5: "quint", 6: "sext", 7: "sétim",
                        8: "oitav", 9: "non", 10: "décim"}
            if n in ordinais:
                out.append(abre + ordinais[n] + ("a" if suf == "ª" else "o") + fecha)
                continue
        if len(inteiro) == 4 and inteiro.isdigit() and 1900 <= n <= 2100 and not real and not dec and not suf:
            out.append(abre + por_extenso(n) + fecha)  # ano
            continue
        nome = tokens[i + 2] if _limpo(prox) == "mil" and i + 2 < len(tokens) else prox
        fem = (suf == "h") or (feminino(nome) and not real and suf is None and not dec)
        palavras = por_extenso(n, fem)
        if dec:
            d = dec[1:]
            palavras += " vírgula " + (" ".join(UNI[int(c)] for c in d) if len(d) > 2 or d.startswith("0") else por_extenso(int(d)))
        if real and _limpo(prox) not in ESCALAS:
            palavras += " real" if n == 1 and not dec else " reais"
            real = None
        if suf == "%":
            palavras += " por cento"
        if suf == "h":
            palavras += " hora" if n == 1 else " horas"
        out.append(abre + palavras + fecha)
        reais_pendente = bool(real) and _limpo(prox) in ESCALAS
    return out


def normalizar(texto):
    """Texto inteiro com os números por extenso (para mandar à voz)."""
    return " ".join(x for x in falar_tokens(texto.split()) if x)


if __name__ == "__main__":
    for t in ["Hoje a lei permite 1 folga, e com a PEC passam a ser 2 folgas.",
              "Até 200 reais, em geral. São 200 pessoas e 2026 é ano de eleição.",
              "O Dieese calcula 26,8 milhões de pessoas. Foram 75 votos a 1.",
              "Às 17h, a urna imprime o boletim. R$ 50 mil, 76,2% das compras, 1º turno.",
              "1.000 tapetes, 21 milhões de bitcoins, 461 a 4 votos, 3 a 10 anos."]:
        print(normalizar(t))
