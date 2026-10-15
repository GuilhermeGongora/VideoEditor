import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Stage, Cam } from "../three/Stage";
import { Mannequin, idlePose, walkPose } from "../three/Mannequin";
import { Coins, Mat, RoundBox, Stall } from "../three/Objetos";
import { Callout, DataCard, Label, Tags } from "../ui/Overlays";
import { CenaProps, Roteiro } from "../Explicativo";
import { projetar } from "../projetar";
import { ease, easeOut, lerp, lerp3, pop } from "../anim";
import { C } from "../theme";
import roteiro from "../../../videos/selic/roteiro.json";

type V3 = [number, number, number];
const cam = (pos: V3, look: V3, fov = 40): Cam => ({ pos, look, fov });

/* ───────────────────────── 1. 13,75% (cinco cortes) ───────────────────────── */
const DEGRAUS = [
  { mes: "MAR", v: 14.75, txt: "14,75" },
  { mes: "ABR", v: 14.5, txt: "14,50" },
  { mes: "JUN", v: 14.25, txt: "14,25" },
  { mes: "AGO", v: 14.0, txt: "14,00" },
  { mes: "SET", v: 13.75, txt: "13,75" },
];
const altura = (v: number) => (v - 12) * 0.62;
const Corte: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const t1375 = w("13,75");
  const cortou = w("cortou");
  const quinta = w("quinta");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([1.2, 2.5, 9.6], [0.3, 2.3, 8.7], t), [0, 0.65, 0]);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        {DEGRAUS.map((d, i) => {
          const at = i === 4 ? cortou : 4 + i * 5;
          const h = altura(d.v) * easeOut(f, at, at + 18);
          const last = i === 4;
          return (
            <RoundBox
              key={d.mes}
              size={[0.4, Math.max(0.02, h), 0.5]}
              radius={0.04}
              position={[(i - 2) * 0.5, Math.max(0.02, h) / 2, 0]}
              color={last ? C.accent : C.white}
              glow={last ? 0.5 : 0}
            />
          );
        })}
        <Mannequin pose={idlePose(f, 2)} position={[1.55, 0, -0.6]} rotationY={-0.5} look="gray" scale={0.8} />
      </Stage>
      {DEGRAUS.map((d, i) => {
        const at = i === 4 ? cortou : 4 + i * 5;
        const top = projetar([(i - 2) * 0.5, altura(d.v), 0.25], c);
        const base = projetar([(i - 2) * 0.5, 0, 0.35], c);
        return (
          <React.Fragment key={d.mes}>
            <Label x={top.x} y={top.y - 26} at={at + 10} text={d.txt} color={i === 4 ? C.accent : C.text} size={22} />
            <Label x={base.x} y={base.y + 24} at={at} text={d.mes} color={C.textDim} />
          </React.Fragment>
        );
      })}
      <DataCard at={t1375} label="SELIC · AO ANO · BC" value="13,75" unit="%" rightLabel="CORTES SEGUIDOS" rightValue={f >= quinta ? "5" : ""} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 2. O QUE É (a base) ───────────────────────── */
const COLUNAS = [
  { txt: "EMPRÉSTIMO", palavra: "empréstimo", x: -0.75, h: 1.0 },
  { txt: "CARTÃO", palavra: "cartão", x: 0, h: 1.4 },
  { txt: "FINANCIAMENTO", palavra: "financiamento", x: 0.75, h: 0.8 },
];
const Base: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const basica = w("básica");
  const base = w("base");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([-0.8, 2.8, 9.4], [0.5, 2.5, 8.6], t), [0, 0.7, 0]);
  const laje = pop(f, basica - 4);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <RoundBox size={[2.5, 0.3, 1.3]} radius={0.06} position={[0, 0.15, 0]} scale={laje} color={C.accent} glow={0.45} />
        {COLUNAS.map((col) => {
          const at = w(col.palavra);
          const h = col.h * easeOut(f, at, at + 16);
          return h > 0.01 ? (
            <RoundBox key={col.txt} size={[0.45, h, 0.45]} radius={0.05} position={[col.x, 0.3 + h / 2, 0]} color={C.white} />
          ) : null;
        })}
      </Stage>
      <Label
        x={projetar([0, 0.15, 0.66], c).x}
        y={projetar([0, 0.15, 0.66], c).y}
        at={basica}
        text="SELIC = BASE"
        color={C.ink}
        size={26}
      />
      {COLUNAS.map((col) => {
        const p = projetar([col.x, 0.3 + col.h, 0], c);
        return <Label key={col.txt} x={p.x} y={p.y - 28} at={w(col.palavra)} text={col.txt} color={C.text} size={20} />;
      })}
      <Tags top={540} items={[{ text: "TAXA BÁSICA DE JUROS", at: basica, on: f < base }, { text: "BASE DOS OUTROS", at: base, on: f >= base }]} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 3. QUEM DECIDE (Copom) ───────────────────────── */
const MESES = ["JAN", "MAR", "ABR", "JUN", "AGO", "SET", "NOV", "DEZ"];
const Copom: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const cp = w("Copom");
  const t8 = w("8");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0.6, 3.4, 8.8], [-0.4, 3.0, 7.9], t), [0, 0.5, -0.3]);
  const gente = Array.from({ length: 7 }, (_, i) => {
    const a = Math.PI + 0.35 + (i / 6) * (Math.PI - 0.7);
    return { i, x: Math.cos(a) * 1.05, z: -0.6 + Math.sin(a) * 0.8, rot: -a - Math.PI / 2 };
  });
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <mesh position={[0, 0.38, -0.6]} scale={pop(f, 2)} castShadow receiveShadow>
          <cylinderGeometry args={[0.75, 0.75, 0.08, 40]} />
          <Mat color={C.white} />
        </mesh>
        <mesh position={[0, 0.18, -0.6]} scale={pop(f, 2)}>
          <cylinderGeometry args={[0.12, 0.2, 0.36, 16]} />
          <Mat color="#5a5955" />
        </mesh>
        {gente.map((g) => (
          <Mannequin
            key={g.i}
            pose={idlePose(f, g.i + 40)}
            position={[g.x, 0, g.z]}
            rotationY={Math.atan2(-g.x, -0.6 - g.z) }
            look={f >= cp ? "white" : "gray"}
            scale={0.68 * pop(f, 3 + g.i * 2)}
          />
        ))}
        {MESES.map((m, i) => {
          const feito = i < 6;
          const prox = i === 6;
          const on = f >= t8 + i * 2;
          const pulso = prox ? 0.4 + 0.4 * Math.sin(f / 5) : 0;
          return (
            <RoundBox
              key={m}
              size={[0.3, 0.05, 0.3]}
              radius={0.02}
              position={[(i - 3.5) * 0.36, 0.025, 1.0]}
              scale={pop(f, t8 + i * 2)}
              color={prox && on ? C.accent : feito ? C.white : "#5a5955"}
              glow={prox && on ? pulso : 0}
            />
          );
        })}
      </Stage>
      {MESES.map((m, i) => {
        const p = projetar([(i - 3.5) * 0.36, 0, 1.25], c);
        return <Label key={m} x={p.x} y={p.y + 18} at={t8 + i * 2} text={m} color={i === 6 ? C.accent : C.textDim} size={18} />;
      })}
      <DataCard at={cp} label="COPOM · BANCO CENTRAL" value={f >= t8 ? "8" : "—"} unit="reuniões/ano" rightLabel="PRÓXIMA" rightValue={f >= t8 ? "NOV" : ""} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 4. O FREIO ───────────────────────── */
const Freio: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const juro = w("Juro");
  const caro = w("caro");
  const menos = w("menos");
  const dev = w("devagar");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([-0.6, 2.6, 9.4], [0.4, 2.3, 8.5], t), [0.1, 0.75, -0.3]);
  // preços: sobem rápido, e mais devagar depois do "devagar"
  const preco = 0.4 + (Math.min(f, dev) / Math.max(1, dev)) * 1.1 + Math.max(0, f - dev) * 0.002;
  const gente = Array.from({ length: 5 }, (_, i) => {
    const sai = i >= 2;
    const k = sai ? ease(f, menos + (i - 2) * 4, menos + 30 + (i - 2) * 4) : 0;
    const x0 = -0.7 + i * 0.38;
    const dir = i % 2 ? 1 : -1;
    return { i, sai, k, pos: [x0 + dir * k * 1.2, 0, 0.6 + k * 0.6] as V3, rot: sai && k > 0 ? dir * Math.PI * 0.5 : Math.PI };
  });
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Stall position={[-0.35, 0, -0.9]} scale={0.8} />
        <RoundBox
          size={[0.5, 0.26, 0.05]}
          radius={0.03}
          position={[-0.35, 1.05, -0.45]}
          scale={pop(f, caro - 4)}
          color={f >= caro ? C.accent : C.white}
          glow={f >= caro ? 0.5 : 0}
        />
        {gente.map((g) => (
          <Mannequin
            key={g.i}
            pose={g.sai && g.k > 0 && g.k < 1 ? walkPose(f / 4 + g.i) : idlePose(f, g.i + 60)}
            position={g.pos}
            rotationY={g.rot}
            look={g.sai && g.k > 0.3 ? "dark" : "white"}
            scale={0.72}
          />
        ))}
        {/* barra dos preços */}
        <RoundBox size={[0.35, preco, 0.35]} radius={0.04} position={[1.2, preco / 2, -0.5]} color={f >= dev ? C.accent : C.white} glow={f >= dev ? 0.4 : 0} />
      </Stage>
      <Label x={projetar([1.2, 0, -0.2], c).x} y={projetar([1.2, 0, -0.2], c).y + 20} at={4} text="PREÇOS" color={C.textDim} />
      <Label x={projetar([-0.35, 1.05, -0.4], c).x} y={projetar([-0.35, 1.05, -0.4], c).y} at={caro} text="R$ ↑" color={C.ink} size={22} />
      <Tags
        top={540}
        items={[
          { text: "JURO ALTO", at: juro, on: f < menos },
          { text: "COMPRA MENOS", at: menos, on: f >= menos && f < dev },
          { text: "PREÇO MAIS LENTO", at: dev, on: f >= dev },
        ]}
      />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 5. A META ───────────────────────── */
const PCT = 0.6; // 1% = 0,6 de altura
const Meta: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const t3 = w("3%");
  const t45 = w("4,5%");
  const tipca = w("4,58%");
  const teto = w("teto");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0.6, 2.2, 10.6], [0.2, 2.1, 9.7], t), [0.1, 1.55, 0]);
  const enche = easeOut(f, tipca - 6, tipca + 24) * 4.58;
  const banda = pop(f, t45);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        {/* trilho do termômetro: 0% a 6% */}
        <RoundBox size={[0.42, 6 * PCT, 0.42]} radius={0.12} position={[0.0, 3 * PCT, -0.05]} color="#3a3936" />
        {/* faixa tolerada 1,5% a 4,5% */}
        <RoundBox size={[1.0, 3 * PCT, 0.04]} radius={0.02} position={[0.0, 3 * PCT, -0.5]} scale={[banda, 1, 1]} color={C.white} opacity={0.14} />
        <RoundBox size={[1.1, 0.04, 1.1]} radius={0.01} position={[0.0, 1.5 * PCT, 0]} scale={banda} color={C.gray} />
        {/* meta 3% */}
        <RoundBox size={[1.1, 0.04, 1.1]} radius={0.01} position={[0.0, 3 * PCT, 0]} scale={pop(f, t3)} color={C.white} glow={0.3} />
        {/* teto 4,5% */}
        <RoundBox size={[1.1, 0.04, 1.1]} radius={0.01} position={[0.0, 4.5 * PCT, 0]} scale={banda} color={C.gray} />
        {/* IPCA */}
        {enche > 0.01 ? (
          <RoundBox size={[0.3, enche * PCT, 0.3]} radius={0.1} position={[0.0, (enche * PCT) / 2, 0.12]} color={C.accent} glow={0.6} />
        ) : null}
        <Mannequin pose={idlePose(f, 8)} position={[0.9, 0, -0.5]} rotationY={-0.5} look="gray" scale={0.8} />
      </Stage>
      {[
        { v: 3, txt: "META 3%", at: t3, cor: C.text },
        { v: 4.5, txt: "TETO 4,5%", at: t45, cor: C.textDim },
        { v: 1.5, txt: "PISO 1,5%", at: t45, cor: C.textDim },
      ].map((l) => {
        const p = projetar([-0.55, l.v * PCT, 0.5], c);
        return <Label key={l.txt} x={p.x - 40} y={p.y} at={l.at} text={l.txt} color={l.cor} size={22} />;
      })}
      <DataCard at={tipca} label="IPCA 12 MESES · IBGE · SET/26" value="4,58" unit="%" rightLabel="TETO DA META" rightValue="4,5%" />
      <Callout
        at={teto}
        x={projetar([0.0, 4.58 * PCT, 0.2], c).x}
        y={projetar([0.0, 4.58 * PCT, 0.2], c).y}
        dx={110}
        dy={-120}
        title="Acima do teto"
        sub="FONTE: IBGE"
      />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 6. NO SEU BOLSO ───────────────────────── */
const Bolso: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const div = w("dívida");
  const guard = w("guardado");
  const tes = w("Tesouro");
  const cdb = w("CDB");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0.2, 2.4, 8.2], [-0.3, 2.2, 7.4], t), [0, 0.8, 0]);
  const peso = 0.3 + easeOut(f, div, div + 30) * 0.9;
  const moedas = Math.round(lerp(3, 16, easeOut(f, guard, guard + 40)));
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <RoundBox size={[0.8, peso, 0.8]} radius={0.06} position={[-0.75, peso / 2, 0]} scale={pop(f, 3)} color="#4d4c49" />
        <Coins count={moedas} position={[0.75, 0, 0]} scale={0.95} />
        <Mannequin pose={idlePose(f, 77)} position={[0, 0, -1.0]} look="white" scale={0.8} />
      </Stage>
      <Label x={projetar([-0.75, 0, 0.5], c).x} y={projetar([-0.75, 0, 0.5], c).y + 22} at={div} text="DÍVIDA PESA" color={C.text} />
      <Label x={projetar([0.75, 0, 0.5], c).x} y={projetar([0.75, 0, 0.5], c).y + 22} at={guard} text="GUARDADO RENDE" color={C.accent} />
      <Tags
        top={540}
        items={[
          { text: "TESOURO SELIC", at: tes, on: f >= tes },
          { text: "CDB", at: cdb, on: f >= cdb },
        ]}
      />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 7. E AGORA? ───────────────────────── */
const PLACAS = [
  { txt: "SET · 13,75%", x: -1.0 },
  { txt: "3–4 NOV", x: 0 },
  { txt: "8–9 DEZ", x: 1.0 },
];
const Agora: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const nov = w("novembro");
  const focus = w("Focus");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0.8, 2.6, 8.4], [-0.2, 2.3, 7.6], t), [0, 0.6, 0]);
  const pulso = 0.4 + 0.4 * Math.sin(f / 5);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        {PLACAS.map((p, i) => (
          <RoundBox
            key={p.txt}
            size={[0.85, 0.07, 0.5]}
            radius={0.03}
            position={[p.x, 0.035, 0.4]}
            scale={pop(f, 3 + i * 4)}
            color={i === 1 && f >= nov ? C.accent : i === 0 ? C.white : "#5a5955"}
            glow={i === 1 && f >= nov ? pulso : 0}
          />
        ))}
        <Mannequin pose={idlePose(f, 90)} position={[0, 0, -0.4]} look={f >= nov ? "accent" : "white"} scale={0.8} />
        {/* relógio */}
        <group position={[-1.0, 1.4, -0.6]} scale={0.45 * pop(f, 6)}>
          <mesh>
            <torusGeometry args={[0.55, 0.045, 12, 48]} />
            <meshStandardMaterial color={C.white} />
          </mesh>
          <mesh rotation={[0, 0, -f / 20]} position={[0, 0, 0.02]}>
            <boxGeometry args={[0.05, 0.42, 0.03]} />
            <meshStandardMaterial color={C.accent} emissive={C.accent} emissiveIntensity={0.6} />
          </mesh>
        </group>
      </Stage>
      {PLACAS.map((p, i) => {
        const q = projetar([p.x, 0, 0.75], c);
        return <Label key={p.txt} x={q.x} y={q.y + 22} at={3 + i * 4} text={p.txt} color={i === 1 ? C.accent : C.textDim} size={20} />;
      })}
      <DataCard at={4} label="PRÓXIMO COPOM" value="3–4/nov" rightLabel="FIM DE 2026 · PROJEÇÃO FOCUS" rightValue={f >= focus ? "13,75%" : ""} />
    </AbsoluteFill>
  );
};

export const CENAS_SELIC: Record<string, React.FC<CenaProps>> = {
  corte: Corte,
  base: Base,
  copom: Copom,
  freio: Freio,
  meta: Meta,
  bolso: Bolso,
  agora: Agora,
};

export const VIDEO = { id: "Selic", roteiro: roteiro as Roteiro, cenas: CENAS_SELIC };
