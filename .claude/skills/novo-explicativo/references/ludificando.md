# Padrão de referência: Ludificando (analisado em 16/10/2026, 4 vídeos)

Vídeos estudados: escala 6x1 (93 s), dívida do MEI (92 s), "quanto o presidente manda" (95 s),
taxa das blusinhas (77 s). Use isto como régua de qualidade. **Não copie roteiro, voz ou marca deles**:
copie a GRAMÁTICA (estrutura, ritmo, acabamento).

## Números medidos (nosso → deles)
| Medida | Scientia (antes) | Ludificando |
|---|---|---|
| Duração | 45–60 s | **75–95 s** |
| Capítulos (chips) | 5–7 | **9–12** |
| Silêncio na voz | 9–15 % | **0–5 %** |
| Variação de tom da voz | 3,4 semitons (Antonio) | **4–5,5 semitons** (voz feminina, ~235 Hz) |
| Ritmo da fala | ~6 sílabas/s | 6–7 sílabas/s |
| Volume | −14/−16 LUFS | −14 LUFS |

## Estrutura de capítulos (quase igual nos 4)
1. **GANCHO** (0–3 s): pergunta na voz **e** numa pílula grande na tela (`<Pergunta>`):
   "QUANTO O PRESIDENTE MANDA?", "FIM DA TAXA DAS BLUSINHAS" → "FICOU MAIS BARATO?".
   Às vezes um alerta de desconfiança: "Antes de acreditar no que te mandarem…".
2. **CONTEXTO / HOJE / A CONTA**: como é hoje, com o número-base num cartão que FICA na tela.
3. **A PROPOSTA / O QUE MUDA**: o mesmo cartão muda de valor (44 h → 40 h).
4. **QUANDO / LINHA DO TEMPO**: régua de etapas no topo (`<Etapas>`: APROVAÇÃO → +2 MESES → +1 ANO).
5. **EXCEÇÕES / FICA DE FORA**: quem não entra na regra.
6. **OS DOIS LADOS**: SEMPRE uma balança (`<Balanca>`), "Quem defende" num prato (bonecos/família),
   "Quem critica" no outro (moedas/fábrica), cada lado com `Callout` + fonte. Tom neutro.
7. **VOTAÇÃO / O QUE FALTA**: plenário que acende até o quórum (`<Hemiciclo>`: 49 de 81, 257 de 513).
8. **CUIDADO**: golpe ou fake news ligado ao tema — celular com mensagem falsa (`<Celular>`),
   carimbo "GOLPE". Isso gera MUITO compartilhamento.
9. **SUA VEZ / COMENTA**: pergunta para o público ("…com mais um dia de folga?") + CTA falado
   ("Comenta X", "Salva pra entender o resultado").

## Cenografia (o que dá "mais vida")
- **Um cenário-herói por vídeo, que volta várias vezes**: as 6 torres de horas (6x1), o caderninho do
  fiado (MEI), a mesa do presidente com 5 botões (presidente), a esteira da alfândega (blusinhas).
  As cenas são VARIAÇÕES desse cenário (câmera chega mais perto, um objeto acende), não um objeto novo
  a cada cena. O fim volta ao cenário do começo (loop).
- **HUD que atravessa o vídeo**: o cartão de número (`DataCard fixo`) e a régua de etapas ficam na
  mesma posição de uma cena para a outra e só o valor/etapa muda.
- **Pílulas de contexto empilhando** no topo (`<Contexto>`): "SÓ SAIU O IMPOSTO FEDERAL" → "ATÉ US$ 50"
  → "ICMS: CONTINUA" (a última em destaque).
- **Objetos com identidade**: faixa verde-amarela no boneco = presidente; anel de prazo fechando em volta
  do documento = "pode sumir em 120 dias" (`<AnelPrazo>`); carrinho com nota fiscal; caixa com papéis.
- **Câmera perto** (objeto ocupa 50–70 % da largura), **profundidade de campo** forte (prateleiras e
  poeira da frente borradas) e **brilho** (bloom) só no que está em destaque — já vem no `Stage`.
- Mistura de dois cenários: estúdio com prateleiras (assunto do dia a dia) e fundo escuro com
  poeira (política, votação, "os dois lados").

## Texto
- Legenda karaokê com 1–2 linhas, palavra atual branca, resto cinza (o nosso já faz).
- Callout = título curto + linha MONO em maiúsculas com o detalhe/fonte.
- Números grandes: `3,6 MI`, `R$ 12,6 BI`, `49 de 81`, unidade menor ao lado.

## Voz
- Feminina, viva: sobe no fim das perguntas, enfatiza número, quase sem respiro entre frases.
- Na nossa produção: o narrar.py já encurta pausas > 0,2 s. Para mais vida na escrita: perguntas
  retóricas a cada 2–3 cenas ("Ficou quieto?", "E quem já pagou?"), frases curtas, contraste
  ("Só que…", "Mas atenção:"), números ditos de forma falada ("uns 50 mil").
