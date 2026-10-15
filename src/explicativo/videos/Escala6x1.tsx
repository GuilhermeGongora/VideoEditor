import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Stage, Cam } from "../three/Stage";
import { Mannequin, idlePose, walkPose } from "../three/Mannequin";
import { Coins, DashedRing, Paper, Pill, RoundBox, Stall } from "../three/Objetos";
import { Callout, DataCard, Label, Tags } from "../ui/Overlays";
import { CenaProps } from "../Explicativo";
import { projetar } from "../projetar";
import { clamp, ease, easeOut, lerp, lerp3, pop, rand } from "../anim";
import { C } from "../theme";

type V3 = [number, number, number];
const cam = (pos: V3, look: V3, fov = 40): Cam => ({ pos, look, fov });

/* ───────────────────────── 1. APROVADO ───────────────────────── */
const ROWS = [
  { r: 2.9, n: 15 },
  { r: 3.55, n: 19 },
  { r: 4.2, n: 22 },
  { r: 4.85, n: 25 },
];
const SEATS = ROWS.flatMap((row, ri) =>
  Array.from({ length: row.n }, (_, i) => {
    const a = Math.PI + 0.18 + ((Math.PI - 0.36) * i) / (row.n - 1);
    return { x: Math.cos(a) * row.r, z: -1.2 + Math.sin(a) * row.r, y: 0.3 + ri * 0.2, a, ri };
  }),
);
const ORDER = [...SEATS.keys()].sort((p, q) => SEATS[p].a - SEATS[q].a);
const AUSENTES = new Set([ORDER[9], ORDER[27], ORDER[44], ORDER[58], ORDER[73]]);
const CONTRA = ORDER[66];

const Aprovado: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const vAt = w("aprovou");
  const sweep = ease(f, vAt, vAt + 40);
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0, 5.0, 10.6], [0.6, 3.9, 8.9], t), [0, 0.15, -1.4]);
  const card = w("75");
  const homem = pop(f, 8);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <group scale={0.48} position={[0, 0, -0.7]}>
        {SEATS.map((s, i) => {
          const rank = ORDER.indexOf(i) / ORDER.length;
          const on = !AUSENTES.has(i) && i !== CONTRA && sweep > rank;
          const lit = on ? interpolate(sweep, [rank, rank + 0.06], [0, 1], clamp) : 0;
          const color = i === CONTRA && sweep > rank ? "#2a2a28" : on ? C.accent : "#6f6e69";
          return <Pill key={i} position={[s.x, s.y + lit * 0.06, s.z]} color={color} glow={on ? 0.6 * lit : 0} h={0.26} />;
        })}
        </group>
        <Mannequin pose={idlePose(f, 1)} position={[0, 0, 0.6]} scale={0.8 * homem} />
      </Stage>
      <DataCard at={card} label="SENADO · VOTAÇÃO" value="75" rightLabel="CONTRA" rightValue="1" top={300} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 2. O QUE MUDA ───────────────────────── */
const DIAS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];
const Muda: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const pec = w("PEC");
  const muda = ease(f, pec + 6, pec + 30);
  const t = ease(f, 0, dur);
  const c = cam(lerp3([-2.6, 2.7, 9.6], [2.0, 2.4, 9.0], t), [0, 0.55, 0]);
  const blocos = DIAS.map((d, i) => {
    const folgaAntes = i === 6;
    const folgaDepois = i >= 5;
    const hAntes = folgaAntes ? 0.12 : (44 / 6) * 0.26;
    const hDepois = folgaDepois ? 0.12 : 8 * 0.26;
    const h = lerp(hAntes, hDepois, i === 5 ? muda : ease(f, pec + 18, pec + 40));
    const virouFolga = i === 5 && muda > 0.5;
    const isFolga = folgaAntes || virouFolga;
    const appear = pop(f, 4 + i * 3);
    return { d, i, h: Math.max(0.12, h) * appear * 0.62, isFolga, x: (i - 3) * 0.5 };
  });
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        {blocos.map((b) => (
          <RoundBox
            key={b.i}
            size={[0.4, Math.max(0.05, b.h), 0.4]}
            radius={0.05}
            position={[b.x, Math.max(0.05, b.h) / 2, 0]}
            color={b.isFolga ? C.accent : C.white}
            glow={b.isFolga ? 0.55 : 0}
          />
        ))}
        <Mannequin pose={idlePose(f, 4)} position={[2.3, 0, -0.9]} rotationY={-0.5} look="gray" scale={0.75} />
      </Stage>
      {blocos.map((b) => {
        const p = projetar([b.x, 0, 0.32], c);
        return <Label key={b.i} x={p.x} y={p.y + 26} at={6 + b.i * 3} text={b.d} color={b.isFolga ? C.accent : C.textDim} />;
      })}
      <DataCard
        at={4}
        label="HORAS POR SEMANA"
        value={f >= w("40") ? "40" : "44"}
        unit="h"
        rightLabel="FOLGAS"
        rightValue={f >= w("duas") ? "2" : "1"}
      />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 3. AOS POUCOS ───────────────────────── */
const COLS = 11;
const AosPoucos: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const t60 = w("Sessenta");
  const t42 = w("42");
  const tAno = w("Um");
  const t40 = w("40");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0, 6.0, 11.5], [0.8, 5.0, 10.2], t), [0, 0.2, -0.2]);
  const cubos = Array.from({ length: 44 }, (_, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const sai = i >= 42 ? t42 + 4 + (i - 42) * 4 : i >= 40 ? t40 + 4 + (i - 40) * 4 : 1e7;
    const k = easeOut(f, sai, sai + 26);
    const ap = pop(f, 3 + (col + row) * 1.2);
    return {
      i,
      pos: [(col - 5) * 0.42, 0.2 + k * 2.6, -row * 0.42 + 0.4] as V3,
      sai: f >= sai,
      op: 1 - k,
      s: ap * (1 - k * 0.4),
    };
  });
  const etapa = f >= t40 ? 2 : f >= t60 ? 1 : 0;
  const plates = ["HOJE", "+60 DIAS", "+1 ANO"];
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        {cubos.map((q) =>
          q.op > 0.01 ? (
            <RoundBox
              key={q.i}
              size={[0.34, 0.34, 0.34]}
              radius={0.05}
              position={q.pos}
              scale={q.s}
              color={q.sai ? C.accent : C.white}
              glow={q.sai ? 0.7 : 0.05}
              opacity={q.op}
            />
          ) : null,
        )}
        {plates.map((p, i) => (
          <RoundBox
            key={p}
            size={[1.05, 0.06, 0.38]}
            radius={0.03}
            position={[(i - 1) * 1.25, 0.03, 1.5]}
            color={i === etapa ? C.accent : "#5a5955"}
            glow={i === etapa ? 0.5 : 0}
          />
        ))}
      </Stage>
      {plates.map((p, i) => {
        const pt = projetar([(i - 1) * 1.25, 0, 1.75], c);
        return <Label key={p} x={pt.x} y={pt.y + 22} at={6} text={p} color={i === etapa ? C.accent : C.textDim} />;
      })}
      <DataCard at={4} label="LIMITE POR SEMANA" value={f >= t40 ? "40" : f >= t42 ? "42" : "44"} unit="h" />
      <Tags
        top={520}
        items={[
          { text: "+60 DIAS · 5x2", at: t60, on: etapa === 1 },
          { text: "+1 ANO", at: tAno, on: etapa === 2 },
        ]}
      />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 4. SALÁRIO ───────────────────────── */
const Salario: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const t = ease(f, 0, dur);
  const c = cam(lerp3([-0.5, 2.1, 8.6], [0.4, 2.0, 7.6], t), [-0.1, 0.85, 0]);
  const sal = w("salário");
  const papel = pop(f, 2);
  const hi = ease(f, sal, sal + 10);
  const papelPos: V3 = [0.4, 1.5, 0];
  const anchor = projetar([0.4 + 0.35 * 0.82, 1.5 + 0.45 * 0.82, 0.05], c);
  const moedas = Math.round(lerp(0, 11, ease(f, 6, 30)));
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Paper position={papelPos} rotation={[0, -0.25, 0.04]} scale={0.82 * papel} lines={5} highlight={0} highlightGlow={0.8 * hi} />
        <Coins count={moedas} position={[-0.85, 0, 0.5]} scale={0.75} />
      </Stage>
      <Callout at={sal + 4} x={anchor.x} y={anchor.y} dx={-170} dy={-210} title="Sem redução salarial" sub="TEXTO DA PEC" />
      <Tags top={1180} items={[{ text: "MENOS HORAS", at: w("Trabalha") }, { text: "MESMO SALÁRIO", at: w("ganha"), on: true }]} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 5. QUEM GANHA ───────────────────────── */
const GENTE = Array.from({ length: 27 }, (_, i) => {
  const col = i % 9;
  const row = Math.floor(i / 9);
  return { x: ((col - 4) * 0.62 + (row % 2) * 0.31 - 0.15) * 0.72, z: -row * 0.75 * 0.72, i, carteira: i < 22 };
});
const Quem: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const t0 = w("26,8");
  const t22 = w("22");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0, 4.4, 12.5], [-0.5, 3.6, 11.0], t), [0, 0.5, -0.8]);
  const split = f >= t22;
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        {GENTE.map((g) => {
          const ap = pop(f, 2 + (g.i % 9) * 1.5 + Math.floor(g.i / 9) * 4);
          const look = split ? (g.carteira ? "white" : "dark") : "white";
          return (
            <Mannequin
              key={g.i}
              pose={idlePose(f, g.i)}
              position={[g.x, (ap - 1) * 1.5, g.z]}
              rotationY={(rand(g.i) - 0.5) * 0.5}
              scale={0.68}
              look={look}
              opacity={1}
            />
          );
        })}
        <DashedRing radius={2.25} position={[0, 0.01, -0.55]} progress={ease(f, t22, t22 + 24)} dashes={64} />
      </Stage>
      <DataCard
        at={t0}
        label="BENEFICIADOS · DIEESE"
        value="26,8"
        unit="mi"
        rightLabel="COM CARTEIRA"
        rightValue={split ? "22 mi" : "—"}
      />
      <Callout
        at={t0 + 18}
        x={projetar([GENTE[19].x, 1.32, GENTE[19].z], c).x}
        y={projetar([GENTE[19].x, 1.32, GENTE[19].z], c).y}
        dx={50}
        dy={-120}
        title="1 boneco ≈ 1 milhão"
        sub="FONTE: DIEESE / PNAD 2025"
      />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 6. EXCEÇÕES ───────────────────────── */
const Excecoes: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const comp = w("compensada");
  const peq = w("pequenas");
  const pan = ease(f, peq - 14, peq + 22);
  const c = cam(lerp3([-3.4, 6.2, 8.4], [3.6, 3.0, 9.6], pan), lerp3([-3.4, -0.1, -0.7], [3.6, 1.5, -0.6], pan));
  const tiles = Array.from({ length: 28 }, (_, i) => {
    const col = i % 7;
    const row = Math.floor(i / 7);
    const folga = col === 6;
    const extra = col === [2, 4, 1, 3][row];
    const on = folga || (extra && f >= comp + row * 4);
    const up = extra ? easeOut(f, comp + row * 4, comp + row * 4 + 12) : 0;
    return { i, x: -3.4 + (col - 3) * 0.55, z: -1.6 + row * 0.55, on, up, ap: pop(f, 2 + i * 0.6) };
  });
  const anchor = projetar([3.6, 2.25, -1.2], c);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        {tiles.map((q) => (
          <RoundBox
            key={q.i}
            size={[0.46, 0.1 + q.up * 0.08, 0.46]}
            radius={0.04}
            position={[q.x, 0.05, q.z]}
            scale={q.ap}
            color={q.on ? C.accent : C.white}
            glow={q.on ? 0.55 : 0}
          />
        ))}
        <Stall position={[3.6, 0, -1.2]} scale={0.95} />
        {[0, 1, 2].map((i) => (
          <Mannequin key={i} pose={idlePose(f, 10 + i)} position={[2.8 + i * 0.8, 0, 0.3]} scale={0.8} look="gray" />
        ))}
      </Stage>
      <Tags
        top={520}
        items={[
          { text: "ACORDO COLETIVO", at: 4, on: pan < 0.5 },
          { text: "MEI · MICRO · PEQUENAS", at: peq, on: pan >= 0.5 },
        ]}
      />
      {pan < 0.2 ? (
        <Callout
          at={comp + 6}
          out={peq - 16}
          x={projetar([-3.4 + (6 - 3) * 0.55, 0.15, -1.6], c).x}
          y={projetar([-3.4 + (6 - 3) * 0.55, 0.15, -1.6], c).y}
          dx={-60}
          dy={-200}
          title="Média de 2 folgas"
          sub="COMPENSADA NO MÊS"
        />
      ) : null}
      <Callout at={w("regras")} x={anchor.x} y={anchor.y} dx={-60} dy={-120} title="Lei futura" sub="REGRAS DE TRANSIÇÃO" />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 7. E AGORA? ───────────────────────── */
const Check: React.FC<{ ok: boolean; text: string; sub: string; at: number; pulse?: boolean }> = ({ ok, text, sub, at, pulse }) => {
  const f = useCurrentFrame();
  const s = pop(f, at);
  const glow = pulse ? 0.5 + 0.5 * Math.sin(f / 5) : 1;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: s, transform: `translateX(${(1 - s) * -30}px)` }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          border: `2px solid ${ok ? C.accent : C.accent}`,
          background: ok ? C.accent : `rgba(220,255,60,${0.15 * glow})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.ink,
          fontWeight: 900,
          fontSize: 28,
          fontFamily: "Inter",
        }}
      >
        {ok ? "✓" : ""}
      </div>
      <div>
        <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 36, color: C.text }}>{text}</div>
        <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 18, letterSpacing: 2, color: C.textDim }}>{sub}</div>
      </div>
    </div>
  );
};

const Agora: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0.4, 1.7, 8.8], [-0.3, 1.8, 8.0], t), [0.2, 0.75, 0]);
  const rel = w("relógio");
  const ring = pop(f, rel - 4);
  const hand = easeOut(f, rel + 6, dur) * Math.PI * 2 * 0.9;
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Paper position={[-0.55, 1.0, -0.4]} rotation={[0.05, 0.35 + Math.sin(f / 40) * 0.05, -0.06]} scale={0.8} lines={6} />
        <Mannequin pose={idlePose(f, 7)} position={[1.2, 0, 0.3]} rotationY={-0.6} look="accent" />
        <group position={[1.15, 2.55, 0.2]} scale={ring * 0.5}>
          <mesh>
            <torusGeometry args={[0.55, 0.045, 12, 48]} />
            <meshStandardMaterial color={C.accent} emissive={C.accent} emissiveIntensity={0.7} />
          </mesh>
          <mesh rotation={[0, 0, -hand]} position={[0, 0, 0.02]}>
            <boxGeometry args={[0.05, 0.42, 0.03]} />
            <meshStandardMaterial color={C.white} />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <sphereGeometry args={[0.06, 12, 10]} />
            <meshStandardMaterial color={C.white} />
          </mesh>
        </group>
      </Stage>
      <div style={{ position: "absolute", left: 80, top: 290, display: "flex", flexDirection: "column", gap: 22 }}>
        <Check ok text="Câmara" sub="APROVADA · MAIO" at={4} />
        <Check ok text="Senado" sub="APROVADA · 14/10 · 75 x 1" at={9} />
        <Check ok={false} text="Promulgação" sub="CONTA 60 DIAS A PARTIR DAQUI" at={w("promulgação")} pulse />
      </div>
    </AbsoluteFill>
  );
};

export const CENAS_6X1: Record<string, React.FC<CenaProps>> = {
  aprovado: Aprovado,
  muda: Muda,
  "aos-poucos": AosPoucos,
  salario: Salario,
  quem: Quem,
  excecoes: Excecoes,
  agora: Agora,
};
