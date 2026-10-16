# VideoEditor — vídeos de ranking automáticos

Você joga os clipes, o Claude assiste cada um, escreve a lista, corta no ritmo, coloca os efeitos
sonoros da sua biblioteca, renderiza e revisa o resultado.

## Começar (Codespaces)
1. **Code → Codespaces → Create codespace on main** (só na primeira vez; depois reabra o mesmo).
2. Atualizar quando houver novidade: `git pull` e `npm install`.

## Fazer um vídeo
1. Arraste os clipes para `clips/`, nomeados pela posição: `5-....mp4` … `1-....mp4`.
2. No terminal: `claude` → `/novo-ranking título "Funniest Instant Karma Moments", @gongoale`
3. Baixar: `npm run baixar` → aba **Ports** → porta **8080** → ícone de globo.
4. Não gostou de algo? Diga ao Claude com `/feedback ...` (ex.: "/feedback o 4 não é dança, o cara
   está socando o vidro; os sons do 4 estão exagerados"). Ele corrige e anota a lição em
   `notas-do-editor.md` para não repetir.

## Vídeos explicativos 3D (canal educativo)
Assunto explicado com bonecos e objetos 3D, narração e legenda palavra por palavra.
1. No terminal: `claude` → `/novo-explicativo escala 6x1` (ou qualquer assunto).
   O Claude pesquisa, escreve o roteiro, gera a voz, monta as cenas, confere e renderiza.
2. Ou na mão: `npm run narrar -- 6x1` → `npm run quadros -- 6x1` (prévia) → `npm run explicar -- 6x1`.
   Voz do canal: fica em `voz.json`. Ouvir opções: `npm run vozes` (Microsoft) ou `npm run vozes -- eleven`
   (ElevenLabs, precisa de `ELEVENLABS_API_KEY` no `.env`). Fixar: `npm run vozes -- usar <id> feminina|masculina`.
   No roteiro: `"voz": {"principal": "feminina", "alternar": "cenas"}` (alternar = dupla de vozes).
   Legenda do post (com fontes e hashtags): `npm run legenda -- 6x1` → `out/6x1-legenda.txt` (o painel tem botão Copiar).
   Thumbnails: `npm run thumb -- 6x1` → pasta `thumbs/` (o `explicar` já gera junto).
3. Baixar vídeos e thumbs: `npm run baixar` (porta 8080). O 3D renderiza sem placa de vídeo: ~10 min por minuto.

## Rodar no seu PC (WSL2 + GPU NVIDIA)
1. `bash .devcontainer/setup.sh` (o mesmo setup do Codespace).
2. Voz local na GPU: `bash scripts/setup-voz-local.sh` → `npm run vozes -- referencia` → `npm run vozes -- local`.
   Para usar a sua voz: grave 15–20 s em `marca/voz-minha.wav` e `npm run vozes -- usar marca/voz-minha.wav masculina`.

## Sua biblioteca de sons
1. Arraste seus sons para `public/soundeffects/` (subpastas ajudam: `impacts/`, `memes/`, `whoosh/`…).
2. `npm run sfx:index` — cataloga, deduz o tipo de cada som e cria versões com volume igualado.
3. **Ensine o Claude:** `npm run sons` → abra a porta 8080 → `/sons`. Ouça, marque ⭐ (favorito),
   ⛔ (não usar) e escreva o que cada som é ("tapa estalado, bom para queda"). Fica salvo em
   `public/soundeffects/preferences.json` e o Claude usa nas próximas edições.
4. Salve no GitHub pela aba **Source Control** (Commit → Sync). Arquivos > 100 MB não sobem.

## Comandos
| Comando | O que faz |
|---|---|
| `npm run prep -- --reset` | Converte os clipes e recria a lista |
| `npm run analyze` | Folhas de frames com o tempo + análise do áudio de cada clipe |
| `npm run sfx:index` | Cataloga/normaliza os sons |
| `npm run sfx:find -- impact` | Busca sons por tipo ou palavra |
| `npm run dev` | Prévia ao vivo (Remotion Studio, porta 3000) |
| `npm run render` | Gera `out/ranking.mp4` |
| `npm run qa` | Revisão automática (silêncios, estouro, ritmo, labels) |
| `npm run baixar` / `npm run sons` | Painel: baixar vídeos / ouvir e classificar sons |

## Como o Claude edita
O guia de edição fica em `.claude/skills/novo-ranking/` (`SKILL.md` + `references/som.md`,
`labels.md`, `ritmo.md`). Dá para editar esses arquivos para mudar o estilo do canal.

Remotion é gratuito para uso comercial por pessoas e empresas de até 3 pessoas.
