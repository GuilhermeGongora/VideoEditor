# ranking-video

Gera vídeos de ranking (estilo "Ranking Funniest Robot Moments") automaticamente:
você joga os clipes, o Claude monta a lista, os textos, as legendas e os efeitos sonoros.

## 1. Subir no GitHub e abrir no Codespaces
1. Crie um repositório vazio no GitHub (ex.: `ranking-video`) e envie estes arquivos
   (Add file → Upload files, arrastando o conteúdo do zip).
2. No repositório: **Code → Codespaces → Create codespace on main**.
   O setup instala ffmpeg, dependências, efeitos sonoros e o Claude Code (~3–5 min).

## 2. Fazer um vídeo
1. Arraste os clipes para a pasta `clips/`, nomeados pela posição:
   `6-nice-grandma.mp4`, `5-bro.mp4`, …, `1-fbi-robot.mp4`.
2. No terminal: `claude` e peça, por exemplo:
   > /novo-ranking título "Funniest Robot Moments", @gongoale, em inglês
3. O vídeo sai em `out/ranking.mp4` (botão direito → Download).

## Comandos
| Comando | O que faz |
|---|---|
| `npm run prep -- --reset` | Converte os clipes de `clips/` e recria a lista no `ranking.json` |
| `npm run dev` | Abre o Remotion Studio (prévia ao vivo, porta 3000) |
| `npm run render` | Renderiza `out/ranking.mp4` |
| `npm run sfx` | Gera os sons básicos (pop, whoosh, ding, boom, riser) |
| `npm run sfx:ai -- laugh "crowd laughing" 2` | Gera um som com IA (ElevenLabs) |

Para a ElevenLabs: Codespaces → Settings → Secrets → `ELEVENLABS_API_KEY`.

## Editar na mão (`ranking.json`)
```json
{
  "titleLines": ["Ranking [Funniest](red)", "[Robot](blue) Moments"],
  "subtitle": "(Last one is amazing 😂😂)",
  "handle": "@gongoale",
  "items": [
    { "rank": 3, "label": "lego 😂", "clip": "clips/3-lego.mp4", "start": 0.5, "end": 3,
      "captions": [{ "text": "Wait for it… 😏", "from": 0.1, "to": 1.7, "style": "box", "sfx": "sfx/riser.wav" }] }
  ]
}
```
Estilos de legenda: `box` (caixa preta, máquina de escrever), `whitebox`, `pop` (grande, vermelho), `plain`.
Clipe horizontal: `"fit": "contain"`.

Remotion é gratuito para uso comercial por pessoas e empresas de até 3 pessoas.
