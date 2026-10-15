# Som — como um editor humano usa efeitos em vídeos de ranking

## As 3 camadas
1. **Áudio original do clipe** — é a camada principal. Gritos, falas, vidro quebrando e a reação
   das pessoas são o que tem graça de verdade. **Nunca deixe o clipe mudo** (`volume` < 0.6 só se o
   áudio original for ruim: música alta com direitos, vento estourando). Se zerar, coloque
   som ambiente ou o vídeo fica "morto" (o QA acusa).
2. **Sons estruturais** (`ranking.json > sfx`) — os mesmos no vídeo inteiro, são a identidade do canal:
   - `transition`: whoosh curto (< 0,8s) na troca de clipe.
   - `reveal`: pop/click curto (< 0,5s) quando o item entra na lista.
   - `final`: impacto mais pesado na entrada do #1 (boom, tambor, hit grave).
   - `volume` 0.5–0.7. Eles devem ser sentidos, não chamar atenção.
3. **Sons de acento** (`items[].sounds`) — 0 a 2 por clipe, **só no payoff ou na reação**.
   Não é para sonorizar cada ação. Oito socos com oito efeitos de soco = barulho, não comédia.

## Onde colocar um acento
- No quadro do payoff (impacto, queda, splash, batida do carro) ou logo depois (1–3 quadros).
  Som **antes** da imagem parece erro; levemente depois parece natural.
- Alinhamento: `at = segundo_do_payoff − pico_do_som` (o `pico` está no catálogo).
- Na reação (cara de choque, olhar para a câmera): meme curto (vine boom, bruh, "huh") com `duck` 0.3–0.5.
- Antes do absurdo: record scratch/freeze ou um riser curto (máx. 1 por vídeo).
- Se alguém **fala** algo engraçado, não cubra a fala: coloque o som depois.

## Escolher o som certo
- Combine com o material: vidro → vidro; tapa → tapa; queda → thud/bonk; batida de carro → o áudio
  original costuma bastar, no máximo um grave (boom) por baixo; água/splash → splash.
- Combine com a emoção: briga/raiva → impactos secos; vergonha/falha → sad trombone, "bruh";
  surpresa → vine boom; vitória/karma justo → ding/cash/"ka-ching".
- Nunca coloque som que mude o sentido da cena (música de dança numa briga).
- Escalada: acentos mais discretos nos primeiros lugares, os mais fortes no #2 e #1.
- Não repita o mesmo acento duas vezes no vídeo (estruturais podem repetir).
- Varie entre vídeos: veja em `notas-do-editor.md` os sons usados recentemente.
- Prefira ⭐ favoritos; nunca use ⛔; leia as 📝 notas do usuário (elas dizem o que o som realmente é).
- Você não ouve os sons: decida pelo papel, nome, nota do usuário, duração e formato
  (cartão em `out/sfx-cards/`). Ataque seco + grave = pancada; ruído que sobe e desce = whoosh;
  pico no fim = riser; longo e constante = trilha/ambiente.

## Volume e mixagem
- Os sons do catálogo já vêm normalizados (`soundeffects/_norm/...`), então o `volume` é comparável:
  estruturais 0.5–0.7 · acentos 0.7–0.9 · memes 0.6–0.8 com `duck` 0.3–0.5.
- `duck` abaixa o áudio do clipe enquanto o efeito toca (o efeito "aparece" sem ficar alto demais).
- `maxSeconds` em sons longos (risada, trilha) para não invadir o próximo clipe.
- Nunca dois sons a menos de 0,35s um do outro.
- O fim do vídeo tem fade automático (`endFadeSeconds`, padrão 0.4s). Não termine num som alto.

## Checklist antes de renderizar
- [ ] Nenhum clipe mudo.
- [ ] Cada acento tem um motivo visível no quadro exato.
- [ ] Máximo 2 acentos por clipe; nenhum repetido.
- [ ] O som combina com a emoção real da cena.
