import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Stage, Cam } from "../three/Stage";
import { Mannequin, idlePose } from "../three/Mannequin";
import { Coins, Mat, RoundBox } from "../three/Objetos";
import { Callout, DataCard, Label, Tags } from "../ui/Overlays";
import { CenaProps, Roteiro } from "../Explicativo";
import { projetar } from "../projetar";
import { clamp, ease, easeOut, lerp, lerp3, pop, rand } from "../anim";
import { C, MONO, SANS } from "../theme";
import roteiro from "../../../videos/pix/roteiro.json";

type V3 = [number, number, number];
const cam = (pos: V3, look: V3, fov = 40): Cam => ({ pos, look, fov });

/* ───────────────────────── peças ───────────────────────── */

const Chave: React.FC<{ position?: V3; rotation?: V3; scale?: number; glow?: number; color?: string }> = ({
  position,
  rotation,
  scale = 1,
  glow = 0.6,
  color = C.accent,
}) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh castShadow>
      <torusGeometry args={[0.1, 0.035, 10, 24]} />
      <Mat color={color} glow={glow} />
    </mesh>
    <mesh position={[0.25, 0, 0]} castShadow>
      <boxGeometry args={[0.32, 0.05, 0.04]} />
      <Mat color={color} glow={glow} />
    </mesh>
    {[0.3, 0.38].map((x) => (
      <mesh key={x} position={[x, -0.05, 0]}>
        <boxGeometry args={[0.04, 0.07, 0.04]} />
        <Mat color={color} glow={glow} />
      </mesh>
    ))}
  </group>
);

/** Celular em pé, tela para +Z. Origem no centro. Tela: 0,76 × 1,56. */
const Celular: React.FC<{ position?: V3; rotation?: V3; scale?: number; tela?: string }> = ({
  position,
  rotation,
  scale = 1,
  tela = "#151515",
}) => (
  <group position={position} rotation={rotation} scale={scale}>
    <RoundBox size={[0.86, 1.7, 0.08]} radius={0.08} color="#2b2b2a" />
    <RoundBox size={[0.76, 1.56, 0.01]} radius={0.04} position={[0, 0, 0.042]} color={tela} />
  </group>
);

/** Prédio de banco: base, colunas e frontão. Origem no chão. */
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

/** Moeda solta (o dinheiro viajando). */
const Moeda: React.FC<{ position: V3; scale?: number; spin?: number }> = ({ position, scale = 1, spin = 0 }) => (
  <mesh position={position} rotation={[Math.PI / 2, 0, spin]} scale={scale} castShadow>
    <cylinderGeometry args={[0.16, 0.16, 0.04, 28]} />
    <meshStandardMaterial color={C.gold} roughness={0.35} metalness={0.55} emissive={C.gold} emissiveIntensity={0.15} />
  </mesh>
);

const arco = (f: number, a: V3, b: V3, de: number, ate: number, h = 0.4): V3 => {
  const t = ease(f, de, ate);
  const p = lerp3(a, b, t);
  return [p[0], p[1] + Math.sin(Math.PI * t) * h, p[2]];
};

/** Retângulo da tela do celular projetado (para colocar HTML em cima). */
const telaNaTela = (centro: V3, escala: number, c: Cam) => {
  const top = projetar([centro[0], centro[1] + 0.78 * escala, centro[2] + 0.05], c);
  const bot = projetar([centro[0], centro[1] - 0.78 * escala, centro[2] + 0.05], c);
  const mid = projetar([centro[0], centro[1], centro[2] + 0.05], c);
  const h = bot.y - top.y;
  return { x: mid.x, y: mid.y, h, w: h * (0.76 / 1.56) };
};

/* ───────────────────────── 1. 1 BILHÃO ───────────────────────── */
const PISO = Array.from({ length: 144 }, (_, i) => ({ i, col: i % 12, row: Math.floor(i / 12) }));
const Bilhao: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const t1 = w("1");
  const t71 = w("7,1");
  const t = ease(f, 0, dur);
  const ang = lerp(-0.35, 0.3, t);
  const r = 9.8;
  const c = cam([Math.sin(ang) * r, lerp(6.0, 5.2, t), Math.cos(ang) * r], [0, 0.6, 0]);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        {PISO.map((p) => {
          const x = (p.col - 5.5) * 0.24;
          const z = (p.row - 5.5) * 0.24;
          const d = Math.hypot(x, z);
          const ap = pop(f, 2 + d * 8 + rand(p.i) * 6);
          // ondas de transações saindo do centro depois do "7,1"
          const onda = f >= t71 ? Math.max(0, Math.sin((f - t71) / 5 - d * 3)) : 0;
          const on = f >= t1 + d * 6 && rand(p.i + 9) > 0.8;
          return (
            <RoundBox
              key={p.i}
              size={[0.18, 0.08 + onda * 0.25, 0.18]}
              radius={0.025}
              position={[x, 0.04 + onda * 0.12, z]}
              scale={ap}
              color={on || onda > 0.6 ? C.accent : C.white}
              glow={on ? 0.35 + onda * 0.4 : onda * 0.5}
            />
          );
        })}
        <Chave position={[-0.45, 2.0 + Math.sin(f / 18) * 0.06, 0.4]} rotation={[0.2, Math.sin(f / 40) * 0.5, 0.1]} scale={2.2 * pop(f, t1 - 4)} />
      </Stage>
      <DataCard at={t1} label="CHAVES PIX · BC · 30/09/2026" value="1 bilhão" rightLabel="TRANSAÇÕES EM SET." rightValue={f >= t71 ? "7,1 bi" : ""} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 2. A CHAVE ───────────────────────── */
const GAVETAS = ["BANCO", "AGÊNCIA", "CONTA"];
const ChaveCena: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const tipos = [w("CPF"), w("celular"), w("e-mail"), w("aleatória")];
  const tras = w("trás");
  const ats = [w("banco"), w("agência"), w("conta", 1)];
  const t = ease(f, 0, dur);
  const c = cam(lerp3([-0.4, 2.1, 8.6], [0.4, 1.9, 7.7], t), [0.0, 1.0, 0]);
  const vai = ease(f, tras - 4, tras + 22);
  const kPos = lerp3([-0.7, 1.4, 0.3], [-0.2, 1.15, 0.45], vai);
  const ativo = tipos.reduce((a, at, i) => (f >= at ? i : a), -1);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Chave position={kPos} rotation={[0.1, Math.sin(f / 30) * 0.3, 0]} scale={2.6 * pop(f, 3)} />
        {GAVETAS.map((g, i) => {
          const on = f >= ats[i];
          return (
            <RoundBox
              key={g}
              size={[1.0, 0.36, 0.7]}
              radius={0.05}
              position={[0.75, 0.2 + i * 0.42, -0.3]}
              scale={pop(f, tras + i * 4)}
              color={on ? C.accent : C.white}
              glow={on ? 0.45 : 0}
            />
          );
        })}
        <Mannequin pose={idlePose(f, 5)} position={[-1.1, 0, -1.4]} rotationY={0.4} look="gray" scale={0.8} />
      </Stage>
      {GAVETAS.map((g, i) => {
        const p = projetar([0.75, 0.2 + i * 0.42, 0.06], c);
        return <Label key={g} x={p.x} y={p.y} at={tras + i * 4 + 4} text={g} color={f >= ats[i] ? C.ink : C.dark} size={24} />;
      })}
      <Tags
        top={540}
        items={["CPF", "CELULAR", "E-MAIL", "ALEATÓRIA"].map((txt, i) => ({ text: txt, at: tipos[i], on: ativo === i && f < tras }))}
      />
      <Callout
        at={w("apelido") + 2}
        out={tras - 6}
        x={projetar(kPos, c).x}
        y={projetar(kPos, c).y}
        dx={60}
        dy={-200}
        title="Apelido da conta"
        sub="ATÉ 5 POR CONTA (PESSOA)"
      />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 3. A AGENDA (DICT) ───────────────────────── */
const ALVO = 13;
const CEL3: V3 = [-0.85, 1.15, 1.6];
const Agenda: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const dict = w("DICT");
  const dig = w("digita");
  const cons = w("consulta");
  const nome = w("nome");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0.6, 2.3, 9.4], [-0.1, 2.1, 8.6], t), [0.1, 1.0, 0]);
  const gav = Array.from({ length: 24 }, (_, i) => ({ i, col: i % 6, row: Math.floor(i / 6) }));
  const abre = easeOut(f, cons + 16, cons + 30);
  const alvo = gav[ALVO];
  const alvoPos: V3 = [(alvo.col - 2.5) * 0.42 + 0.35, 0.35 + alvo.row * 0.32, -0.9 + 0.25 + abre * 0.35];
  const pulso = arco(f, [CEL3[0], CEL3[1] + 0.4, CEL3[2]], alvoPos, cons, cons + 16, 0.5);
  const volta = arco(f, alvoPos, [CEL3[0], CEL3[1] + 0.4, CEL3[2]], nome - 14, nome, 0.5);
  const s = telaNaTela(CEL3, 0.85, c);
  const digitado = "maria@email.com".slice(0, Math.floor(interpolate(f, [dig, dig + 24], [0, 15], clamp)));
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        {gav.map((g) => {
          const isAlvo = g.i === ALVO;
          return (
            <RoundBox
              key={g.i}
              size={[0.38, 0.27, 0.5]}
              radius={0.03}
              position={[(g.col - 2.5) * 0.42 + 0.35, 0.35 + g.row * 0.32, -0.9 + (isAlvo ? abre * 0.35 : 0)]}
              scale={pop(f, 2 + (g.col + g.row) * 1.5)}
              color={isAlvo && abre > 0 ? C.accent : C.white}
              glow={isAlvo ? abre * 0.6 : 0}
            />
          );
        })}
        <Celular position={CEL3} rotation={[0, 0.35, 0]} scale={0.85 * pop(f, dig - 10)} />
        {f >= cons && f < cons + 16 ? (
          <mesh position={pulso}>
            <sphereGeometry args={[0.08, 14, 10]} />
            <Mat color={C.accent} glow={1} />
          </mesh>
        ) : null}
        {f >= nome - 14 && f < nome ? (
          <mesh position={volta}>
            <sphereGeometry args={[0.08, 14, 10]} />
            <Mat color={C.accent} glow={1} />
          </mesh>
        ) : null}
      </Stage>
      <Label
        x={projetar([0.35, 1.75, -0.9], c).x}
        y={projetar([0.35, 1.75, -0.9], c).y - 20}
        at={dict}
        text="DICT · BANCO CENTRAL"
        color={C.accent}
        size={26}
      />
      {f >= dig - 4 ? (
        <div
          style={{
            position: "absolute",
            left: s.x - s.w / 2,
            top: s.y - s.h / 2,
            width: s.w,
            height: s.h,
            padding: s.w * 0.08,
            boxSizing: "border-box",
            fontFamily: SANS,
            color: C.text,
            opacity: pop(f, dig - 4),
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: s.w * 0.07, color: C.textDim, letterSpacing: 2 }}>CHAVE PIX</div>
          <div
            style={{
              marginTop: s.w * 0.04,
              padding: s.w * 0.05,
              borderRadius: s.w * 0.04,
              border: `2px solid ${C.border}`,
              fontFamily: MONO,
              fontSize: s.w * 0.075,
            }}
          >
            {digitado}
            <span style={{ opacity: Math.floor(f / 8) % 2 }}>|</span>
          </div>
          {f >= nome ? (
            <div style={{ marginTop: s.w * 0.12, opacity: pop(f, nome) }}>
              <div style={{ fontFamily: MONO, fontSize: s.w * 0.06, color: C.textDim, letterSpacing: 2 }}>VAI PARA</div>
              <div style={{ fontWeight: 800, fontSize: s.w * 0.12, color: C.accent }}>Maria S.</div>
              <div style={{ fontFamily: MONO, fontSize: s.w * 0.055, color: C.textDim }}>***.456.789-**</div>
            </div>
          ) : null}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/* ───────────────────────── 4. O CAMINHO (SPI) ───────────────────────── */
const A: V3 = [-1.05, 0, 0.3];
const B: V3 = [1.05, 0, 0.3];
const HUB: V3 = [0, 0, -1.4];
const Caminho: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const conf = w("confirma");
  const spi = w("SPI");
  const sai = w("Sai");
  const cai = w("cai");
  const mad = w("madrugada");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([-0.6, 4.4, 10.6], [0.6, 4.0, 9.7], t), [0, 0.35, -0.4]);
  const topoA: V3 = [A[0], 1.75, A[2]];
  const topoB: V3 = [B[0], 1.75, B[2]];
  const topoH: V3 = [HUB[0], 1.5, HUB[2]];
  // a moeda: A → HUB (no SPI) → B (no "cai")
  const p1 = arco(f, topoA, topoH, Math.min(spi, sai) - 4, Math.min(spi, sai) + 18, 0.5);
  const p2 = arco(f, topoH, topoB, cai - 14, cai + 4, 0.5);
  const moeda = f < cai - 14 ? p1 : p2;
  const chegou = f >= cai + 4;
  const anel = (f - spi) / 30;
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Predio position={A} scale={0.55 * pop(f, 2)} />
        <Predio position={B} scale={0.55 * pop(f, 6)} on={chegou ? 1 : 0} />
        {/* SPI: o centro que liga os bancos */}
        <group position={HUB} scale={pop(f, spi - 6)}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.5, 0.6, 1.0, 32]} />
            <Mat color={C.white} />
          </mesh>
          <mesh position={[0, 1.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.45 + (anel % 1) * 0.15, 0.03, 8, 40]} />
            <Mat color={C.accent} glow={0.9} />
          </mesh>
        </group>
        {/* fios do SPI até os bancos */}
        {[A, B].map((p, k) =>
          Array.from({ length: 12 }, (_, i) => {
            const q = lerp3([p[0], 0.02, p[2]], [HUB[0], 0.02, HUB[2]], (i + 0.5) / 12);
            return (
              <mesh key={`${k}-${i}`} position={q}>
                <boxGeometry args={[0.06, 0.012, 0.06]} />
                <meshBasicMaterial color={f >= spi ? C.accent : "#5a5955"} />
              </mesh>
            );
          }),
        )}
        {f >= conf ? <Moeda position={chegou ? [B[0], 1.75 + Math.sin(f / 8) * 0.04, B[2]] : moeda} scale={1.4 * pop(f, conf)} spin={f / 6} /> : null}
      </Stage>
      {[
        { p: A, t: "SEU BANCO", at: 4 },
        { p: B, t: "BANCO DE QUEM RECEBE", at: 8 },
      ].map((l) => {
        const q = projetar([l.p[0], 0, l.p[2] + 0.55], c);
        return <Label key={l.t} x={q.x} y={q.y + 24} at={l.at} text={l.t} color={C.textDim} />;
      })}
      <Label
        x={projetar([HUB[0], 1.3, HUB[2]], c).x}
        y={projetar([HUB[0], 1.3, HUB[2]], c).y - 70}
        at={spi}
        text="SPI · BANCO CENTRAL"
        color={C.accent}
        size={26}
      />
      <Tags
        top={540}
        items={[
          { text: "NA HORA", at: w("hora"), on: f < mad },
          { text: "24H · TODO DIA", at: mad, on: f >= mad },
        ]}
      />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 5. À NOITE ───────────────────────── */
const COIN_H = 0.062 * 0.9;
const Noite: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const trava = w("trava");
  const t20 = w("20h");
  const t1000 = w("1.000");
  const t24 = w("24");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([-0.4, 2.3, 8.8], [0.3, 2.1, 7.9], t), [0.1, 0.8, 0]);
  const moedas = Math.round(lerp(0, 18, ease(f, 4, t1000 + 10)));
  const teto = 11;
  const tetoY = 0.035 + teto * COIN_H;
  const visiveis = Math.min(moedas, teto);
  const sobra = Math.max(0, moedas - teto);
  const anc = projetar([0.3 - 0.42, tetoY + 0.03, 0.2], c);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        {/* lua */}
        <mesh position={[-1.3, 1.8, -2.2]} scale={pop(f, trava - 4)}>
          <sphereGeometry args={[0.32, 32, 24]} />
          <meshStandardMaterial color={C.white} emissive={C.white} emissiveIntensity={0.55} />
        </mesh>
        <Coins count={visiveis} position={[0.3, 0, 0.2]} scale={0.9} />
        {/* moedas que passam do limite ficam de fora, apagadas */}
        {Array.from({ length: sobra }, (_, i) => (
          <mesh key={i} position={[1.0 + (i % 2) * 0.05, 0.03 + i * 0.056, 0.5]} castShadow>
            <cylinderGeometry args={[0.27, 0.27, 0.05, 28]} />
            <Mat color="#4d4c49" />
          </mesh>
        ))}
        <RoundBox
          size={[0.85, 0.03, 0.85]}
          radius={0.012}
          position={[0.3, tetoY + 0.03, 0.2]}
          scale={pop(f, t1000)}
          color={C.accent}
          glow={0.6}
          opacity={0.85}
        />
        <Mannequin pose={idlePose(f, 14)} position={[-0.85, 0, -0.5]} rotationY={0.4} look="gray" scale={0.8} />
      </Stage>
      <DataCard
        at={t20}
        label="LIMITE PADRÃO · 20H ÀS 6H"
        value={f >= t1000 ? "R$ 1.000" : "—"}
        rightLabel="PRA AUMENTAR"
        rightValue={f >= t24 ? "24–48h" : ""}
      />
      <Callout at={t1000 + 6} x={anc.x} y={anc.y} dx={-60} dy={-200} title="Entre pessoas" sub="REGRA DO BANCO CENTRAL" />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 6. E SE FOR GOLPE? ───────────────────────── */
const CONTAS: V3[] = [
  [-1.1, 0, 1.2],
  [-0.3, 0, 0.7],
  [-0.95, 0, -0.1],
  [-0.1, 0, -0.8],
  [-0.8, 0, -1.6],
  [0.1, 0, -2.4],
];
const Golpe: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const avise = w("Avise");
  const segue = w("segue");
  const t5 = w("5");
  const gar = w("garantida");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([1.6, 5.4, 8.8], [2.0, 4.8, 7.9], t), [-0.45, 0.2, -0.6]);
  const top = (p: V3): V3 => [p[0], 0.5, p[2]];
  // o golpista espalha o dinheiro: 5 saltos rápidos no começo
  const salto = interpolate(f, [6, avise], [0, 5], clamp);
  const k = Math.min(4, Math.floor(salto));
  const moeda = arco(f, top(CONTAS[k]), top(CONTAS[k + 1]), 6 + (k * (avise - 6)) / 5, 6 + ((k + 1) * (avise - 6)) / 5, 0.35);
  const rastro = interpolate(f, [segue, t5 + 10], [0, 5], clamp);
  const perde = ease(f, gar - 4, gar + 10);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        {CONTAS.map((p, i) => {
          const lit = i <= rastro && f >= segue;
          return (
            <RoundBox
              key={i}
              size={[0.42, 0.38, 0.42]}
              radius={0.05}
              position={[p[0], 0.19, p[2]]}
              scale={pop(f, 2 + i * 2)}
              color={i === 0 ? C.white : lit ? C.accent : "#5a5955"}
              glow={lit && i > 0 ? 0.45 : 0}
            />
          );
        })}
        {CONTAS.slice(0, 5).map((p, i) =>
          Array.from({ length: 6 }, (_, j) => {
            const q = lerp3(p, CONTAS[i + 1], (j + 0.5) / 6);
            const on = f >= segue && rastro >= i + (j + 0.5) / 6;
            return (
              <mesh key={`${i}-${j}`} position={[q[0], 0.02, q[2]]}>
                <boxGeometry args={[0.07, 0.012, 0.07]} />
                <meshBasicMaterial color={on ? C.accent : "#3a3936"} />
              </mesh>
            );
          }),
        )}
        {perde < 0.99 ? <Moeda position={salto >= 5 ? [CONTAS[5][0], 0.5 + perde * 0.6, CONTAS[5][2]] : moeda} scale={1.2 * (1 - perde)} spin={f / 6} /> : null}
        <Mannequin pose={idlePose(f, 4)} position={[-1.55, 0, 1.9]} rotationY={0.6} look="white" scale={0.75} />
      </Stage>
      {CONTAS.slice(1).map((p, i) => {
        const q = projetar([p[0], 0.5, p[2]], c);
        return <Label key={i} x={q.x} y={q.y - 30} at={segue + i * 5} text={`${i + 1}`} color={C.accent} size={26} />;
      })}
      <DataCard at={segue} label="DEVOLUÇÃO (MED 2.0) · BC" value={f >= t5 ? "5" : "—"} unit="saltos" rightLabel="DESDE" rightValue="fev/26" />
      <Callout
        at={gar + 4}
        x={projetar(top(CONTAS[5]), c).x}
        y={projetar(top(CONTAS[5]), c).y}
        dx={-80}
        dy={-160}
        title="Não é garantida"
        sub="SE O DINHEIRO JÁ SUMIU"
      />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 7. CONFIRA O NOME ───────────────────────── */
const CEL7: V3 = [0, 1.35, 0];
const Confira: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const nome = w("nome");
  const tela = w("tela");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0.5, 1.5, 6.4], [-0.2, 1.4, 5.6], t), [0, 1.1, 0]);
  const s = telaNaTela(CEL7, 1, c);
  const pulsa = f >= nome ? 0.5 + 0.5 * Math.sin((f - nome) / 4) : 0;
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Celular position={CEL7} rotation={[0, Math.sin(f / 50) * 0.12, 0]} scale={pop(f, 2)} />
      </Stage>
      <div
        style={{
          position: "absolute",
          left: s.x - s.w / 2,
          top: s.y - s.h / 2,
          width: s.w,
          height: s.h,
          padding: s.w * 0.09,
          boxSizing: "border-box",
          fontFamily: SANS,
          color: C.text,
          display: "flex",
          flexDirection: "column",
          opacity: pop(f, 4),
        }}
      >
        <div style={{ fontFamily: MONO, fontSize: s.w * 0.06, letterSpacing: 2, color: C.textDim }}>PIX · REVISÃO</div>
        <div style={{ fontWeight: 800, fontSize: s.w * 0.16, marginTop: s.w * 0.06 }}>R$ 50,00</div>
        <div
          style={{
            marginTop: s.w * 0.1,
            padding: s.w * 0.06,
            borderRadius: s.w * 0.05,
            border: `3px solid ${f >= nome ? C.accent : C.border}`,
            boxShadow: f >= nome ? `0 0 ${30 * pulsa}px ${C.accent}` : "none",
          }}
        >
          <div style={{ fontFamily: MONO, fontSize: s.w * 0.055, color: C.textDim, letterSpacing: 2 }}>PARA</div>
          <div style={{ fontWeight: 800, fontSize: s.w * 0.1, color: f >= nome ? C.accent : C.text }}>Maria Souza</div>
          <div style={{ fontFamily: MONO, fontSize: s.w * 0.05, color: C.textDim }}>***.456.789-** · BANCO</div>
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            padding: s.w * 0.06,
            borderRadius: 999,
            textAlign: "center",
            background: f >= tela ? C.accent : C.dark,
            color: f >= tela ? C.ink : C.text,
            fontWeight: 800,
            fontSize: s.w * 0.08,
          }}
        >
          Confirmar
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const CENAS_PIX: Record<string, React.FC<CenaProps>> = {
  bilhao: Bilhao,
  chave: ChaveCena,
  agenda: Agenda,
  caminho: Caminho,
  noite: Noite,
  golpe: Golpe,
  confira: Confira,
};

export const VIDEO = { id: "Pix", roteiro: roteiro as Roteiro, cenas: CENAS_PIX };
