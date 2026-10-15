import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Stage, Cam } from "../three/Stage";
import { Mannequin, idlePose } from "../three/Mannequin";
import { Coins, Mat, Paper, RoundBox } from "../three/Objetos";
import { Callout, DataCard, Label, Tags } from "../ui/Overlays";
import { CenaProps, Roteiro } from "../Explicativo";
import { projetar } from "../projetar";
import { ease, easeOut, lerp, lerp3, pop } from "../anim";
import { C } from "../theme";
import roteiro from "../../../videos/imposto-de-renda/roteiro.json";

type V3 = [number, number, number];
const cam = (pos: V3, look: V3, fov = 40): Cam => ({ pos, look, fov });

/* ───────────────────────── peças ───────────────────────── */

/** Prédio público: base, colunas e frontão. Origem no chão. */
const Predio: React.FC<{ position?: V3; scale?: number; on?: number }> = ({ position, scale = 1, on = 0 }) => (
  <group position={position} scale={scale}>
    <RoundBox size={[1.5, 0.16, 1.0]} radius={0.03} position={[0, 0.08, 0]} color={C.white} />
    {[-0.55, -0.18, 0.18, 0.55].map((x) => (
      <mesh key={x} position={[x, 0.66, 0.25]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 1.0, 14]} />
        <Mat color={on > 0 ? C.accent : C.white} glow={on * 0.5} />
      </mesh>
    ))}
    <RoundBox size={[1.6, 0.18, 1.05]} radius={0.03} position={[0, 1.25, 0]} color={C.white} />
    <mesh position={[0, 1.5, 0]} rotation={[0, Math.PI / 4, 0]} scale={[1, 0.35, 1]} castShadow>
      <coneGeometry args={[1.05, 1, 4]} />
      <Mat color={C.white} />
    </mesh>
  </group>
);

/** Moeda solta, de frente para a câmera. */
const Moeda: React.FC<{ position: V3; scale?: number }> = ({ position, scale = 1 }) => (
  <mesh position={position} rotation={[Math.PI / 2, 0, 0]} scale={scale} castShadow>
    <cylinderGeometry args={[0.16, 0.16, 0.04, 28]} />
    <meshStandardMaterial color={C.gold} roughness={0.35} metalness={0.55} emissive={C.gold} emissiveIntensity={0.15} />
  </mesh>
);

const arco = (f: number, a: V3, b: V3, de: number, ate: number, h = 0.5): V3 => {
  const t = ease(f, de, ate);
  const p = lerp3(a, b, t);
  return [p[0], p[1] + Math.sin(Math.PI * t) * h, p[2]];
};

/* Tabela mensal do IR (2026) e o desconto da Lei 15.270/2025 — usados na cena do desconto. */
const FAIXAS = [
  { ate: 2428.8, aliq: 0, ded: 0 },
  { ate: 2826.65, aliq: 0.075, ded: 182.16 },
  { ate: 3751.05, aliq: 0.15, ded: 394.16 },
  { ate: 4664.68, aliq: 0.225, ded: 675.49 },
  { ate: Infinity, aliq: 0.275, ded: 908.73 },
];
const impostoTabela = (r: number) => {
  const fx = FAIXAS.find((x) => r <= x.ate)!;
  return Math.max(0, r * fx.aliq - fx.ded);
};
const desconto = (r: number) => (r <= 5000 ? Infinity : r <= 7350 ? Math.max(0, 978.62 - 0.133145 * r) : 0);
const impostoNovo = (r: number) => Math.max(0, impostoTabela(r) - Math.min(desconto(r), impostoTabela(r)));

/* ───────────────────────── 1. ATÉ R$ 5 MIL ───────────────────────── */
const Isento: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const t5 = w("5");
  const naoPaga = w("paga");
  const t15 = w("15");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0.6, 2.3, 9.2], [-0.2, 2.1, 8.3], t), [0, 0.95, 0]);
  const zera = ease(f, naoPaga, naoPaga + 10);
  const gente = Array.from({ length: 9 }, (_, i) => {
    const a = Math.PI + 0.3 + (i / 8) * (Math.PI - 0.6);
    return { i, x: Math.cos(a) * 1.25, z: -0.5 + Math.sin(a) * 0.9 };
  });
  const papel: V3 = [0, 1.3, 0.4];
  const linha = projetar([0.35 * 0.85, 1.3 + (0.45 - 3 * 0.22) * 0.85, 0.45], c);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Paper position={papel} rotation={[0, Math.sin(f / 40) * 0.1, 0]} scale={0.85 * pop(f, 2)} lines={5} highlight={3} highlightGlow={0.9 * zera} />
        {gente.map((g) => (
          <Mannequin
            key={g.i}
            pose={idlePose(f, g.i)}
            position={[g.x, 0, g.z]}
            rotationY={Math.atan2(-g.x, 0.6 - g.z)}
            look={f >= t15 + g.i * 2 ? "accent" : "white"}
            scale={0.62 * pop(f, 4 + g.i * 2)}
          />
        ))}
      </Stage>
      <DataCard at={t5} label="ISENTO ATÉ · POR MÊS · DESDE JAN/26" value="R$ 5 mil" rightLabel="BENEFICIADOS" rightValue={f >= t15 ? "15 mi+" : ""} />
      <Callout at={naoPaga + 4} x={linha.x} y={linha.y} dx={60} dy={-150} title="IR: R$ 0" sub="LINHA DO HOLERITE" />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 2. O QUE É ───────────────────────── */
const SAL: V3 = [-0.8, 0, 0.3];
const GOV: V3 = [0.75, 0, -0.7];
const OQue: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const gov = w("governo");
  const desc = w("descontado");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([-0.6, 2.4, 8.8], [0.4, 2.2, 7.9], t), [0, 0.6, -0.2]);
  const pilha = 12;
  const voando = [0, 1, 2].map((k) => {
    const de = gov - 6 + k * 6;
    const topo: V3 = [SAL[0], 0.035 + (pilha - 1 - k) * 0.062 * 0.9, SAL[2]];
    return { k, de, pos: arco(f, topo, [GOV[0], 1.0, GOV[2] + 0.4], de, de + 22, 0.7), chegou: f >= de + 22, saiu: f >= de };
  });
  const restantes = pilha - voando.filter((v) => v.saiu).length;
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Coins count={restantes} position={SAL} scale={0.9} />
        {voando.map((v) => (v.saiu && !v.chegou ? <Moeda key={v.k} position={v.pos} scale={1.2} /> : null))}
        <Predio position={GOV} scale={0.6 * pop(f, 4)} on={voando[2].chegou ? 1 : 0} />
        <Paper position={[-0.1, 1.25, 0.9]} rotation={[0, 0.2, 0.03]} scale={0.5 * pop(f, desc)} lines={5} highlight={3} />
      </Stage>
      <Label x={projetar([SAL[0], 0, SAL[2] + 0.45], c).x} y={projetar([SAL[0], 0, SAL[2] + 0.45], c).y + 22} at={3} text="SEU SALÁRIO" />
      <Label x={projetar([GOV[0], 0, GOV[2] + 0.6], c).x} y={projetar([GOV[0], 0, GOV[2] + 0.6], c).y + 22} at={6} text="GOVERNO" />
      <Tags top={540} items={[{ text: "PARTE DO QUE VOCÊ GANHA", at: gov - 6, on: f < desc }, { text: "SAI DO SALÁRIO", at: desc, on: f >= desc }]} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 3. AS FAIXAS ───────────────────────── */
const DEGRAUS = ["ISENTO", "7,5%", "15%", "22,5%", "27,5%"];
const Faixas: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const deg = w("degraus");
  const t75 = w("7,5%");
  const t275 = w("27,5%");
  const ped = w("pedaço");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([1.4, 2.8, 9.0], [0.4, 2.5, 8.2], t), [0, 0.8, 0]);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        {DEGRAUS.map((d, i) => {
          const h = 0.25 + i * 0.32;
          const fatia = f >= ped + i * 7;
          return (
            <React.Fragment key={d}>
              <RoundBox size={[0.5, h, 0.8]} radius={0.04} position={[(i - 2) * 0.52, h / 2, 0]} scale={pop(f, deg - 6 + i * 3)} color={C.white} />
              <RoundBox
                size={[0.5, 0.06, 0.8]}
                radius={0.02}
                position={[(i - 2) * 0.52, h + 0.03, 0]}
                scale={pop(f, ped + i * 7)}
                color={C.accent}
                glow={fatia ? 0.5 : 0}
              />
            </React.Fragment>
          );
        })}
        <Mannequin pose={idlePose(f, 3)} position={[-1.45, 0, -0.7]} rotationY={0.5} look="gray" scale={0.8} />
      </Stage>
      {DEGRAUS.map((d, i) => {
        const h = 0.25 + i * 0.32;
        const p = projetar([(i - 2) * 0.52, Math.min(h / 2, 0.4), 0.42], c);
        const at = i === 0 ? deg : i === 1 ? t75 : i === 4 ? t275 : t75 + (i - 1) * 5;
        return <Label key={d} x={p.x} y={p.y} at={at} text={d} color={C.ink} size={i === 0 ? 17 : 22} />;
      })}
      <Tags top={540} items={[{ text: "CADA TAXA SÓ NO SEU PEDAÇO", at: ped, on: true }]} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 4. O DESCONTO ───────────────────────── */
const RENDAS = [3000, 3600, 4200, 4800, 5400, 6000, 6600, 7200, 7800, 8400];
const ESC = 1.5 / 1400; // altura por real de imposto
const Desconto: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const zera = w("zera");
  const entre = w("Entre");
  const acima = w("Acima");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0.0, 2.3, 8.4], [0.4, 2.1, 7.6], t), [0.1, 0.5, 0]);
  const xDe = (i: number) => (i - 4.5) * 0.27;
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        {RENDAS.map((r, i) => {
          const antes = impostoTabela(r) * ESC;
          const depois = impostoNovo(r) * ESC;
          // o imposto novo aparece por faixa, na palavra que fala dela
          const at = r <= 5000 ? zera : r <= 7350 ? entre : acima;
          const k = easeOut(f, at, at + 18);
          const h = lerp(antes, depois, k);
          const zerou = depois < 0.01 && k > 0.9;
          return (
            <React.Fragment key={r}>
              {/* imposto antes (fantasma) */}
              <RoundBox size={[0.19, Math.max(0.02, antes), 0.19]} radius={0.03} position={[xDe(i), Math.max(0.02, antes) / 2, -0.12]} scale={pop(f, 2 + i * 2)} color={C.gray} opacity={0.3} />
              {/* imposto agora */}
              <RoundBox
                size={[0.19, Math.max(0.03, h), 0.19]}
                radius={0.03}
                position={[xDe(i), Math.max(0.03, h) / 2, 0.12]}
                scale={pop(f, 2 + i * 2)}
                color={zerou ? C.accent : C.white}
                glow={zerou ? 0.7 : 0}
              />
            </React.Fragment>
          );
        })}
      </Stage>
      {[
        { x: (xDe(3) + xDe(4)) / 2, txt: "5 MIL", at: zera },
        { x: (xDe(7) + xDe(8)) / 2, txt: "7.350", at: entre },
      ].map((m) => {
        const p = projetar([m.x, 0, 0.4], c);
        return <Label key={m.txt} x={p.x} y={p.y + 26} at={m.at} text={m.txt} color={C.accent} size={22} />;
      })}
      {RENDAS.map((r, i) =>
        i % 3 === 0 ? (
          <Label key={r} x={projetar([xDe(i), 0, 0.4], c).x} y={projetar([xDe(i), 0, 0.4], c).y + 60} at={4} text={`${r / 1000}`.replace(".", ",") + " mil"} color={C.textDim} size={18} />
        ) : null,
      )}
      <DataCard
        at={zera}
        label="IMPOSTO POR MÊS · LEI 15.270"
        value={f >= acima ? "igual" : f >= entre ? "menor" : "R$ 0"}
        rightLabel="FAIXA"
        rightValue={f >= acima ? "+7.350" : f >= entre ? "5–7.350" : "até 5 mil"}
      />
      <Tags top={540} items={[{ text: "CINZA = ANTES", at: 4 }, { text: "BRANCO = AGORA", at: 4, on: true }]} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 5. QUEM PAGA MAIS ───────────────────────── */
const Alta: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const t600 = w("600");
  const t10 = w("10%");
  const t141 = w("141");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([-0.6, 2.4, 9.6], [0.4, 2.3, 8.7], t), [0, 1.05, 0]);
  const sobe = easeOut(f, t600, t600 + 24);
  const ped = 0.05 + sobe * 1.1;
  const gente = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 + 0.3;
    return { i, x: Math.cos(a) * 1.05, z: Math.sin(a) * 0.7 };
  });
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <RoundBox size={[0.7, ped, 0.7]} radius={0.05} position={[0, ped / 2, 0]} color={C.white} />
        <Mannequin pose={idlePose(f, 50)} position={[0, ped, 0]} look={f >= t10 ? "accent" : "white"} scale={0.7} />
        {gente.map((g) => (
          <Mannequin key={g.i} pose={idlePose(f, g.i + 70)} position={[g.x, 0, g.z]} rotationY={Math.atan2(-g.x, -g.z)} look="gray" scale={0.6 * pop(f, 3 + g.i * 2)} />
        ))}
      </Stage>
      <DataCard
        at={t600}
        label="IMPOSTO MÍNIMO · +R$ 600 MIL/ANO"
        value={f >= t10 ? "até 10%" : "—"}
        rightLabel="PESSOAS"
        rightValue={f >= t141 ? "141 mil" : ""}
      />
      <Callout
        at={t10 + 4}
        x={projetar([0.2, ped + 1.2, 0], c).x}
        y={projetar([0.2, ped + 1.2, 0], c).y}
        dx={90}
        dy={60}
        title="R$ 50 mil por mês"
        sub="FONTE: AGÊNCIA BRASIL"
      />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 6. A DECLARAÇÃO ───────────────────────── */
const PESSOA: V3 = [-1.0, 0, 0.3];
const GOV6: V3 = [0.85, 0, -0.6];
const Declaracao: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const decl = w("declaração");
  const rest = w("restituição");
  const dif = w("diferença");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0.4, 2.5, 8.8], [-0.3, 2.3, 8.0], t), [0, 0.8, -0.2]);
  const mao: V3 = [PESSOA[0] + 0.2, 1.1, PESSOA[2] + 0.2];
  const gov: V3 = [GOV6[0], 1.1, GOV6[2] + 0.5];
  const m1 = arco(f, gov, mao, rest - 12, rest + 10);
  const m2 = arco(f, mao, gov, dif - 4, dif + 18);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Mannequin pose={idlePose(f, 12)} position={PESSOA} rotationY={0.5} look="white" scale={0.85} />
        <Predio position={GOV6} scale={0.6} />
        <Paper position={[0.0, 1.3, 0.2]} rotation={[0, Math.sin(f / 35) * 0.15, 0]} scale={0.45 * pop(f, decl - 4)} lines={5} highlight={f >= dif ? 4 : f >= rest ? 2 : -1} />
        {f >= rest - 12 && f < rest + 10 ? <Moeda position={m1} scale={1.3} /> : null}
        {f >= dif - 4 && f < dif + 18 ? <Moeda position={m2} scale={1.3} /> : null}
      </Stage>
      <Label x={projetar([PESSOA[0], 0, PESSOA[2] + 0.4], c).x} y={projetar([PESSOA[0], 0, PESSOA[2] + 0.4], c).y + 22} at={3} text="VOCÊ" />
      <Label x={projetar([GOV6[0], 0, GOV6[2] + 0.6], c).x} y={projetar([GOV6[0], 0, GOV6[2] + 0.6], c).y + 22} at={3} text="RECEITA" />
      <Tags
        top={540}
        items={[
          { text: "PAGOU A MAIS → RESTITUIÇÃO", at: rest, on: f < dif },
          { text: "A MENOS → PAGA", at: dif, on: f >= dif },
        ]}
      />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 7. E AGORA? ───────────────────────── */
const Agora: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const sal = w("salário");
  const t27 = w("2027");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0.8, 2.6, 9.2], [-0.2, 2.4, 8.4], t), [0, 0.6, 0]);
  const placas = [
    { x: -0.75, txt: "JAN/26 · SALÁRIO", at: sal },
    { x: 0.75, txt: "2027 · DECLARAÇÃO", at: t27 },
  ];
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        {placas.map((p) => {
          const on = f >= p.at;
          return (
            <React.Fragment key={p.txt}>
              <RoundBox size={[1.05, 0.07, 0.6]} radius={0.03} position={[p.x, 0.035, 0.4]} scale={pop(f, 3)} color={on ? C.accent : "#5a5955"} glow={on ? 0.5 : 0} />
              <Paper position={[p.x, 1.35, 0.2]} rotation={[0, (p.x < 0 ? 0.2 : -0.2) + Math.sin(f / 40) * 0.05, 0]} scale={0.5 * pop(f, p.at - 4)} lines={5} highlight={3} highlightGlow={on ? 0.8 : 0} />
            </React.Fragment>
          );
        })}
        <Mannequin pose={idlePose(f, 33)} position={[0, 0, -0.6]} look="white" scale={0.75} />
      </Stage>
      {placas.map((p) => {
        const q = projetar([p.x, 0, 0.75], c);
        return <Label key={p.txt} x={q.x} y={q.y + 22} at={p.at} text={p.txt} color={C.accent} size={20} />;
      })}
      <DataCard at={sal} label="NO SALÁRIO" value="jan/26" rightLabel="NA DECLARAÇÃO" rightValue={f >= t27 ? "2027" : ""} />
    </AbsoluteFill>
  );
};

export const CENAS_IMPOSTO_DE_RENDA: Record<string, React.FC<CenaProps>> = {
  isento: Isento,
  oque: OQue,
  faixas: Faixas,
  desconto: Desconto,
  alta: Alta,
  declaracao: Declaracao,
  agora: Agora,
};

export const VIDEO = { id: "ImpostoDeRenda", roteiro: roteiro as Roteiro, cenas: CENAS_IMPOSTO_DE_RENDA };
