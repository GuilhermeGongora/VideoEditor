import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Stage, Cam } from "../three/Stage";
import { Mannequin, idlePose } from "../three/Mannequin";
import { Mat, RoundBox } from "../three/Objetos";
import { DataCard, Label, Tags } from "../ui/Overlays";
import { CenaProps, Roteiro } from "../Explicativo";
import { projetar } from "../projetar";
import { clamp, ease, easeOut, lerp, lerp3, pop } from "../anim";
import { C } from "../theme";
import roteiro from "../../../videos/milhao-bilhao/roteiro.json";

type V3 = [number, number, number];
const cam = (pos: V3, look: V3, fov = 40): Cam => ({ pos, look, fov });

/* ───────────────────────── 1. 1 REAL POR SEGUNDO ───────────────────────── */
// Duas pistas no chão: a de 1 milhão (curta) e a de 1 bilhão (mil vezes mais longa, some na névoa).
const UNID = 0.7; // comprimento da pista de 1 milhão
const Segundos: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const tMi = w("milhão");
  const tBi = w("bilhão");
  const t32 = w("32");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0.0, 3.8, 5.8], [0.3, 4.0, 6.0], t), [0, 0, 0]);
  const fillA = easeOut(f, 2, tMi + 6) * UNID;
  const fillB = interpolate(f, [tBi - 6, dur], [0, 1], clamp) ** 1.6 * 40;
  // contador de reais: 1 por segundo, acelerado até chegar a 1 milhão quando a voz diz "milhão"
  const reais = Math.round(interpolate(f, [0, tMi], [1, 1_000_000], { ...clamp, easing: (x) => x ** 3 }));
  const fimA = projetar([-0.35, 0.05, 0.2 - UNID], c);
  const ptB = projetar([0.35, 0.05, -2.5], c);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        {[-0.35, 0.35].map((x) => (
          <RoundBox key={x} size={[0.32, 0.02, 60]} radius={0.008} position={[x, 0.01, 0.2 - 30]} color="#3a3936" />
        ))}
        <RoundBox size={[0.34, 0.05, Math.max(0.01, fillA)]} radius={0.015} position={[-0.35, 0.03, 0.2 - fillA / 2]} color={C.white} glow={0.2} />
        {fillB > 0.01 ? (
          <RoundBox size={[0.34, 0.05, fillB]} radius={0.015} position={[0.35, 0.03, 0.2 - fillB / 2]} color={C.accent} glow={0.6} />
        ) : null}
      </Stage>
      <Label x={fimA.x - 140} y={fimA.y + 20} at={tMi} text="11,5 DIAS" color={C.text} size={26} />
      <Label x={ptB.x - 150} y={ptB.y} at={t32} text="31,7 ANOS →" color={C.accent} size={30} />
      <DataCard
        at={0}
        label="GANHANDO R$ 1 POR SEGUNDO"
        value={f < tMi ? `R$ ${reais.toLocaleString("pt-BR")}` : "11,5"}
        unit={f < tMi ? undefined : "dias"}
        rightLabel={f < tMi ? "1 BILHÃO" : "1 MILHÃO → 1 BILHÃO"}
        rightValue={f >= t32 ? <>31,7<span style={{ fontSize: 40, color: C.textDim, marginLeft: 6 }}>anos</span></> : f >= tBi ? "…" : ""}
      />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 2. MIL VEZES (três zeros) ───────────────────────── */
const DIGITOS = ["1", "0", "0", "0", "0", "0", "0", "0", "0", "0"];
const Zeros: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const tMil = w("mil");
  const tres = w("três");
  const mult = w("multiplica");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([-0.6, 2.2, 8.2], [0.6, 2.0, 7.6], t), [0, 0.6, 0]);
  const x = (i: number) => (i - 4.5) * 0.28;
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        {DIGITOS.map((d, i) => {
          const extra = i >= 7;
          const at = extra ? tres + (i - 7) * 4 : 2 + i * 3;
          // cada zero extra "pulsa" quando a voz diz "multiplica"
          const pulso = extra ? Math.max(0, Math.sin(Math.PI * interpolate(f, [mult + (i - 7) * 8, mult + (i - 7) * 8 + 14], [0, 1], clamp))) : 0;
          return (
            <RoundBox
              key={i}
              size={[0.24, 0.36, 0.24]}
              radius={0.04}
              position={[x(i), 0.18 + pulso * 0.25, 0]}
              scale={pop(f, at)}
              color={extra ? C.accent : C.white}
              glow={extra ? 0.4 + pulso * 0.5 : 0}
            />
          );
        })}
        <Mannequin pose={idlePose(f, 6)} position={[0.3, 0, -1.2]} look="gray" scale={0.75} />
      </Stage>
      {DIGITOS.map((d, i) => {
        const extra = i >= 7;
        const at = extra ? tres + (i - 7) * 4 : 2 + i * 3;
        const pulso = extra ? Math.max(0, Math.sin(Math.PI * interpolate(f, [mult + (i - 7) * 8, mult + (i - 7) * 8 + 14], [0, 1], clamp))) : 0;
        const p = projetar([x(i), 0.18 + pulso * 0.25, 0.13], c);
        return <Label key={i} x={p.x} y={p.y} at={at} text={d} color={C.ink} size={30} />;
      })}
      {[7, 8, 9].map((i) => {
        const p = projetar([x(i), 0.6, 0], c);
        return <Label key={i} x={p.x} y={p.y - 20} at={mult + (i - 7) * 8} text="×10" color={C.accent} size={22} />;
      })}
      <DataCard at={tMil} label="1 BILHÃO = 1 MILHÃO ×" value="1.000" rightLabel="ZEROS A MAIS" rightValue={f >= tres ? "3" : ""} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 3. EM NOTAS DE 100 ───────────────────────── */
// Bloco de 1 milhão (10 mil notas) e bloco de 1 bilhão: 10× em cada lado = mil vezes o volume.
const BLOCO: V3 = [0.31, 0.2, 0.14];
const Notas: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const tMi = w("milhão");
  const tBi = w("bilhão");
  const t = ease(f, 0, dur);
  const recua = ease(f, tBi - 6, tBi + 30);
  const c = cam(lerp3([0.3, 1.0, 3.0], [0.8, 3.0, 10.4], recua * 0.85 + t * 0.15), lerp3([0, 0.3, 0.3], [0, 0.75, -1.2], recua));
  const big = pop(f, tBi, 30, 18);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <RoundBox size={BLOCO} radius={0.015} position={[0, BLOCO[1] / 2, 0.5]} scale={pop(f, tMi - 4)} color={C.white} />
        {big > 0.01 ? (
          <RoundBox
            size={[BLOCO[0] * 10, BLOCO[1] * 10, BLOCO[2] * 10]}
            radius={0.08}
            position={[0, BLOCO[1] * 5 * big, -1.4]}
            scale={big}
            color={C.accent}
            glow={0.35}
          />
        ) : null}
      </Stage>
      <Label
        x={projetar([0, BLOCO[1] + 0.05, 0.5], c).x}
        y={projetar([0, BLOCO[1] + 0.05, 0.5], c).y - 22}
        at={tMi}
        text="1 MILHÃO"
        color={C.text}
        size={recua > 0.5 ? 16 : 24}
      />
      <DataCard
        at={tMi}
        label="EM NOTAS DE R$ 100"
        value="10 mil"
        unit="notas"
        rightLabel="1 BILHÃO"
        rightValue={f >= tBi ? "10 milhões" : ""}
      />
      <Tags top={540} items={[{ text: "BLOCO 10× MAIOR EM CADA LADO = 1.000×", at: tBi + 20, on: true }]} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 4. ENFILEIRADAS ───────────────────────── */
const KM = 0.0042; // unidades por km na estrada
const Fila: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const t156 = w("15,6");
  const enf = w("Enfileiradas");
  const t15 = w("1,5");
  const t1560 = w("1.560");
  const bsb = w("Brasília");
  const t = ease(f, 0, dur);
  const abre = ease(f, enf - 6, enf + 30);
  const c = cam(
    lerp3([0, 1.6, 2.2], [1.0, 13, 10], abre * 0.9 + t * 0.1),
    lerp3([0, 0.6, -1.0], [0, 0, -1.2], abre),
  );
  // estrada diagonal saindo de perto da câmera para o fundo
  const dir: V3 = [0, 0, -1];
  const ponto = (km: number): V3 => [0, 0.02, 0.8 + dir[2] * km * KM];
  const ang = Math.atan2(dir[0], dir[2]);
  const encheMi = easeOut(f, t15, t15 + 14) * 1.56;
  const encheBi = easeOut(f, t1560, t1560 + 50) * 1560;
  const nota = 1 - ease(f, enf - 4, enf + 10);
  const marcos = [
    { km: 0, txt: "SÃO PAULO", at: bsb - 6, cor: C.text },
    { km: 1020, txt: "BRASÍLIA · 1.020 KM", at: bsb, cor: C.text },
    { km: 1560, txt: "1 BILHÃO · 1.560 KM", at: t1560 + 40, cor: C.accent },
  ];
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        {/* uma nota de R$ 100 em tamanho real ampliado (15,6 × 7) */}
        {nota > 0.01 ? (
          <group position={[0, 0.7, -0.6]} rotation={[-0.25, 0.3, 0]} scale={pop(f, t156 - 6) * nota}>
            <RoundBox size={[1.56, 0.7, 0.02]} radius={0.01} color={C.white} />
            <RoundBox size={[0.4, 0.4, 0.025]} radius={0.2} position={[0.45, 0, 0.005]} color={C.gray} />
          </group>
        ) : null}
        {/* estrada */}
        <RoundBox size={[0.4, 0.02, 1700 * KM]} radius={0.008} position={[...lerp3(ponto(0), ponto(1700), 0.5)] as V3} rotation={[0, ang, 0]} color="#3a3936" scale={abre} />
        {encheBi > 0.5 ? (
          <RoundBox size={[0.42, 0.04, encheBi * KM]} radius={0.01} position={lerp3(ponto(0), ponto(encheBi), 0.5)} rotation={[0, ang, 0]} color={C.accent} glow={0.6} />
        ) : null}
        {encheMi > 0.01 ? <RoundBox size={[0.3, 0.06, 0.04]} radius={0.01} position={ponto(1.5)} rotation={[0, ang, 0]} color={C.white} glow={0.4} /> : null}
        {marcos.map((m) => (
          <mesh key={m.km} position={[ponto(m.km)[0], 0.25, ponto(m.km)[2]]} scale={pop(f, m.at)} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 0.5, 12]} />
            <Mat color={m.km === 1560 ? C.accent : C.white} glow={m.km === 1560 ? 0.6 : 0} />
          </mesh>
        ))}
      </Stage>
      {marcos.map((m) => {
        const p = projetar([ponto(m.km)[0], 0, ponto(m.km)[2]], c);
        return <Label key={m.km} x={p.x - 150} y={p.y + 10} at={m.at} text={m.txt} color={m.cor} size={22} />;
      })}
      <DataCard
        at={t156}
        label={f >= enf ? "NOTAS ENFILEIRADAS" : "UMA NOTA DE R$ 100 · BC"}
        value={f >= t1560 ? "1.560 km" : f >= t15 ? "1,5 km" : "15,6 cm"}
        rightLabel={f >= t1560 ? "1 MILHÃO" : undefined}
        rightValue={f >= t1560 ? "1,5 km" : undefined}
      />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 5. EM CUBINHOS ───────────────────────── */
// Escala: 1 unidade = 4 m. Pessoa 1,75 m; cubo de 1 m (1 milhão); cubo de 10 m (1 bilhão).
const M = 0.25;
const Cubos: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const tMi = w("milhão");
  const tBi = w("bilhão");
  const t10 = w("10");
  const t = ease(f, 0, dur);
  const recua = ease(f, tBi - 4, tBi + 34);
  const c = cam(lerp3([0.4, 0.5, 2.6], [1.4, 4.4, 11.5], recua * 0.9 + t * 0.1), lerp3([-0.2, 0.18, 0.4], [0, 0.9, -1.0], recua));
  const grande = easeOut(f, tBi, tBi + 34);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <RoundBox size={[1 * M, 1 * M, 1 * M]} radius={0.015} position={[-0.45, M / 2, 0.45]} scale={pop(f, tMi - 4)} color={C.white} />
        <Mannequin pose={idlePose(f, 4)} position={[-0.1, 0, 0.45]} look="white" scale={M} />
        {grande > 0.005 ? (
          <RoundBox size={[10 * M, 10 * M * grande, 10 * M]} radius={0.04} position={[0, (10 * M * grande) / 2, -1.2]} color={C.accent} glow={0.3} opacity={0.92} />
        ) : null}
      </Stage>
      <Label
        x={projetar([-0.45, M + 0.03, 0.45], c).x}
        y={projetar([-0.45, M + 0.03, 0.45], c).y - 20}
        at={tMi}
        text="1 M"
        color={C.text}
        size={recua > 0.5 ? 16 : 26}
      />
      <DataCard
        at={w("cubinhos")}
        label="CUBINHOS DE 1 CM"
        value={f >= tMi ? "1 m" : "—"}
        unit="1 milhão"
        rightLabel="1 BILHÃO"
        rightValue={f >= t10 ? "10 m" : ""}
      />
      <Tags top={540} items={[{ text: "PESSOA = 1,75 M", at: w("pessoa"), on: f < t10 }, { text: "10 M DE LADO", at: t10, on: f >= t10 }]} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 6. PARA LEMBRAR ───────────────────────── */
// Barras na proporção real: 11,5 dias ao lado de 31,7 anos.
const ANO = 0.06;
const Lembre: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const t11 = w("11");
  const t31 = w("31");
  const tMi = w("milhão");
  const tBi = w("bilhão");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0.8, 2.3, 9.4], [-0.4, 2.1, 8.6], t), [0, 0.95, 0]);
  const hBi = 31.7 * ANO * easeOut(f, tBi, tBi + 30);
  const hMi = Math.max(0.012, (11.5 / 365) * ANO);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <RoundBox size={[0.6, hMi, 0.6]} radius={0.005} position={[-0.6, hMi / 2, 0]} scale={pop(f, tMi)} color={C.white} glow={0.4} />
        {hBi > 0.01 ? <RoundBox size={[0.6, hBi, 0.6]} radius={0.05} position={[0.6, hBi / 2, 0]} color={C.accent} glow={0.45} /> : null}
        <Mannequin pose={idlePose(f, 22)} position={[-1.0, 0, -0.9]} rotationY={0.4} look="gray" scale={0.8} />
      </Stage>
      <Label x={projetar([-0.6, 0, 0.4], c).x} y={projetar([-0.6, 0, 0.4], c).y + 22} at={tMi} text="11,5 DIAS" color={C.text} size={24} />
      <Label x={projetar([0.6, 0, 0.4], c).x} y={projetar([0.6, 0, 0.4], c).y + 22} at={tBi} text="31,7 ANOS" color={C.accent} size={24} />
      <DataCard at={w("milhão")} label="1 MILHÃO DE SEGUNDOS" value={f >= t11 ? "11,5 dias" : ""} rightLabel="1 BILHÃO" rightValue={f >= t31 ? "31,7 anos" : ""} />
    </AbsoluteFill>
  );
};

export const CENAS_MILHAO_BILHAO: Record<string, React.FC<CenaProps>> = {
  segundos: Segundos,
  zeros: Zeros,
  notas: Notas,
  fila: Fila,
  cubos: Cubos,
  lembre: Lembre,
};

export const VIDEO = { id: "MilhaoBilhao", roteiro: roteiro as Roteiro, cenas: CENAS_MILHAO_BILHAO };
