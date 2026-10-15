import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Stage, Cam } from "../three/Stage";
import { Mannequin, idlePose, walkPose } from "../three/Mannequin";
import { DashedRing, Mat, Paper, RoundBox } from "../three/Objetos";
import { Callout, DataCard, Label, Tags } from "../ui/Overlays";
import { CenaProps, Roteiro } from "../Explicativo";
import roteiro from "../../../videos/segundo-turno/roteiro.json";
import { projetar } from "../projetar";
import { clamp, ease, easeOut, lerp, lerp3, pop } from "../anim";
import { C, MONO, SANS } from "../theme";

type V3 = [number, number, number];
const cam = (pos: V3, look: V3, fov = 40): Cam => ({ pos, look, fov });

/* ───────────────────────── peças ───────────────────────── */

/** Urna eletrônica numa mesinha. Origem no chão; tela à esquerda, teclado à direita, de frente para +Z. */
const URNA_TELA: V3 = [-0.3, 1.02, 0.12];
const Urna: React.FC<{ position?: V3; rotationY?: number; scale?: number; tela?: number }> = ({
  position = [0, 0, 0],
  rotationY = 0,
  scale = 1,
  tela = 0,
}) => (
  <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
    <RoundBox size={[1.6, 0.06, 1.0]} radius={0.02} position={[0, 0.72, 0]} color="#5a5955" />
    {[-0.7, 0.7].map((x) =>
      [-0.4, 0.4].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 0.35, z]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.7, 8]} />
          <Mat color="#5a5955" />
        </mesh>
      )),
    )}
    <group position={[0, 0.9, 0]} rotation={[0.35, 0, 0]}>
      <RoundBox size={[1.25, 0.3, 0.75]} radius={0.06} color={C.white} />
      <RoundBox
        size={[0.62, 0.04, 0.42]}
        radius={0.015}
        position={[-0.28, 0.16, 0.02]}
        color={tela > 0 ? C.accent : "#1d1d1c"}
        glow={tela * 0.7}
      />
      {Array.from({ length: 12 }, (_, i) => (
        <RoundBox
          key={i}
          size={[0.09, 0.03, 0.07]}
          radius={0.012}
          position={[0.27 + (i % 3) * 0.12, 0.16, -0.13 + Math.floor(i / 3) * 0.1]}
          color={i === 11 ? C.accent : "#3a3936"}
          glow={i === 11 ? 0.4 : 0}
        />
      ))}
    </group>
  </group>
);

const Check: React.FC<{ ok: boolean; text: string; sub?: string; at: number; on?: boolean }> = ({ ok, text, sub, at, on }) => {
  const f = useCurrentFrame();
  const s = pop(f, at);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, opacity: s, transform: `translateX(${(1 - s) * -30}px)` }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          border: `2px solid ${ok ? C.accent : C.dark}`,
          background: ok ? C.accent : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: ok ? C.ink : C.gray,
          fontWeight: 900,
          fontSize: 28,
          fontFamily: SANS,
        }}
      >
        {ok ? "✓" : "✕"}
      </div>
      <div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, color: ok ? C.text : C.gray }}>{text}</div>
        {sub ? (
          <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 2, color: on ? C.accent : C.textDim }}>{sub}</div>
        ) : null}
      </div>
    </div>
  );
};

/* ───────────────────────── 1. NINGUÉM PASSOU ───────────────────────── */
const ESCALA = 3.0; // 100% = 3,0 de altura
const BARRAS = [
  { nome: "FLÁVIO", pct: 47.03, txt: "47,03%", x: -0.55, palavra: "Flávio" },
  { nome: "LULA", pct: 45.16, txt: "45,16%", x: 0.55, palavra: "Lula" },
];
const Placar: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const t50 = w("50%");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0.4, 2.4, 9.6], [-0.3, 2.2, 8.5], t), [0, 1.0, 0]);
  const linha = pop(f, t50);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        {BARRAS.map((b) => {
          const at = w(b.palavra);
          const h = Math.max(0.02, (b.pct / 100) * ESCALA * easeOut(f, at, at + 24));
          return <RoundBox key={b.nome} size={[0.7, h, 0.7]} radius={0.04} position={[b.x, h / 2, 0]} color={C.white} />;
        })}
        {/* linha dos 50% */}
        <RoundBox
          size={[2.3, 0.025, 1.1]}
          radius={0.01}
          position={[0, 0.5 * ESCALA, 0]}
          scale={[linha, 1, 1]}
          color={C.accent}
          glow={0.7}
          opacity={0.75}
        />
      </Stage>
      {BARRAS.map((b) => {
        const at = w(b.palavra);
        const topo = projetar([b.x, (b.pct / 100) * ESCALA, 0.35], c);
        const base = projetar([b.x, 0, 0.45], c);
        return (
          <React.Fragment key={b.nome}>
            <Label x={topo.x} y={topo.y + 40} at={at + 18} text={b.txt} color={C.ink} size={34} />
            <Label x={base.x} y={base.y + 26} at={at} text={b.nome} color={C.text} size={24} />
          </React.Fragment>
        );
      })}
      <Label
        x={projetar([1.15, 0.5 * ESCALA, 0.55], c).x - 40}
        y={projetar([1.15, 0.5 * ESCALA, 0.55], c).y - 30}
        at={t50 + 4}
        text="50%"
        color={C.accent}
        size={30}
      />
      <DataCard at={4} label="1º TURNO · PRESIDENTE" value="Ninguém" rightLabel="PRECISAVA DE" rightValue="+50%" />
      <Callout
        at={w("válidos") + 4}
        x={projetar([-0.55, 1.41, 0.35], c).x}
        y={projetar([-0.55, 1.41, 0.35], c).y}
        dx={40}
        dy={-230}
        title="% dos votos válidos"
        sub="FONTE: TSE · 04/10/2026"
      />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 2. A REGRA ───────────────────────── */
const GRID = Array.from({ length: 100 }, (_, i) => ({ i, col: i % 10, row: Math.floor(i / 10) }));
const Regra: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const met = w("metade");
  const t100 = w("100");
  const t51 = w("51");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0, 7.0, 8.2], [0.5, 6.2, 7.3], t), [0, -0.2, 0.2]);
  const sweep = ease(f, met, met + 30);
  const up = easeOut(f, t51, t51 + 14);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        {GRID.map((g) => {
          const ordem = g.row * 10 + g.col;
          const metade = ordem < 50 && sweep * 50 > ordem;
          const o51 = ordem === 50 && f >= t51;
          const ap = pop(f, 2 + (g.col + g.row) * 0.8);
          return (
            <RoundBox
              key={g.i}
              size={[0.22, 0.22, 0.22]}
              radius={0.04}
              position={[(g.col - 4.5) * 0.28, 0.11 + (o51 ? up * 0.5 : 0), (g.row - 4.5) * 0.28]}
              scale={ap * (o51 ? 1 + up * 0.25 : 1)}
              color={o51 ? C.accent : metade ? C.white : "#4d4c49"}
              glow={o51 ? 0.8 : 0}
            />
          );
        })}
      </Stage>
      <DataCard
        at={t100}
        label="VOTOS VÁLIDOS"
        value="100"
        rightLabel="PRA VENCER"
        rightValue={f >= t51 ? "51" : "?"}
      />
      <Tags top={1180} items={[{ text: "METADE = 50", at: met + 10 }, { text: "+1 = 51", at: t51, on: true }]} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 3. VOTO VÁLIDO ───────────────────────── */
const Validos: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const val = w("válido");
  const br = w("Branco");
  const nu = w("nulo");
  const conta = w("conta");
  const ning = w("ninguém");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([-0.3, 2.8, 8.6], [0.4, 2.5, 7.7], t), [0.0, 0.45, -0.3]);
  const cubos = Array.from({ length: 10 }, (_, i) => {
    const fora = i >= 8;
    const sai = i === 8 ? br : nu;
    const k = fora ? easeOut(f, sai + 2, sai + 22) : 0;
    const valido = !fora && f >= val + i * 2;
    return {
      i,
      fora,
      pos: [-1.35 + i * 0.3 + k * 0.1, 0.14 + Math.sin(Math.PI * k) * 0.45, k * -0.9] as V3,
      color: fora ? (k > 0.5 ? "#2a2a28" : C.white) : valido ? C.accent : C.white,
      glow: valido ? 0.45 : 0,
      ap: pop(f, 2 + i * 2),
    };
  });
  const moldura = pop(f, conta - 4);
  const pb = projetar(cubos[8].pos, c);
  const pn = projetar(cubos[9].pos, c);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        {cubos.map((q) => (
          <RoundBox key={q.i} size={[0.22, 0.26, 0.22]} radius={0.04} position={q.pos} scale={q.ap} color={q.color} glow={q.glow} />
        ))}
        {/* área "na conta" debaixo dos 8 válidos */}
        <RoundBox size={[2.5, 0.015, 0.5]} radius={0.007} position={[-0.3, 0.008, 0]} scale={[moldura, 1, 1]} color={C.accent} glow={0.3} opacity={0.35} />
        <Mannequin pose={idlePose(f, 2)} position={[-1.0, 0, -2.2]} rotationY={0.4} look="gray" scale={0.8} />
      </Stage>
      <Label x={pb.x} y={pb.y - 50} at={br} text="BRANCO" color={C.text} size={26} />
      <Label x={pn.x} y={pn.y - 80} at={nu} text="NULO" color={C.text} size={26} />
      <Label
        x={projetar([-0.3, 0, 0.4], c).x}
        y={projetar([-0.3, 0, 0.4], c).y + 30}
        at={conta - 4}
        text="NA CONTA"
        color={C.accent}
        size={24}
      />
      <Tags
        top={540}
        items={[
          { text: "VÁLIDO = VOTO EM CANDIDATO", at: val, on: f < br },
          { text: "NÃO VAI PRA NINGUÉM", at: ning, on: f >= ning },
        ]}
      />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 4. SÓ DOIS ───────────────────────── */
const Dois: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const td = w("dois");
  const ganha = w("ganha");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0.5, 2.6, 8.4], [-0.3, 2.3, 7.4], t), [0, 0.45, -0.4]);
  const k = ease(f, td + 4, td + 28);
  const gente = Array.from({ length: 5 }, (_, i) => {
    const fica = i < 2;
    const x0 = (i - 2) * 0.68;
    const x1 = fica ? (i === 0 ? -0.42 : 0.42) : x0;
    return {
      i,
      fica,
      pos: [lerp(x0, x1, k), 0, fica ? lerp(0, 0.4, k) : lerp(0, -1.4, k)] as V3,
      look: !fica && k > 0.2 ? ("dark" as const) : ("white" as const),
      ap: pop(f, 2 + i * 3),
    };
  });
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        {gente.map((g) => (
          <Mannequin key={g.i} pose={idlePose(f, g.i + 20)} position={g.pos} scale={0.8 * g.ap} look={g.look} />
        ))}
        <DashedRing radius={1.0} position={[0, 0.01, 0.4]} progress={ease(f, td + 20, td + 44)} dashes={48} />
        {[0, 1].map((i) => (
          <RoundBox
            key={i}
            size={[0.5, 0.05, 0.5]}
            radius={0.02}
            position={[i === 0 ? -0.42 : 0.42, 0.025, 0.4]}
            scale={pop(f, ganha)}
            color={C.accent}
            glow={0.5}
          />
        ))}
      </Stage>
      {[0, 1].map((i) => {
        const p = projetar([i === 0 ? -0.42 : 0.42, 0, 0.75], c);
        return <Label key={i} x={p.x} y={p.y + 22} at={td + 20} text={i === 0 ? "1º" : "2º"} color={C.accent} size={26} />;
      })}
      <Tags
        top={540}
        items={[
          { text: "SÓ OS 2 MAIS VOTADOS", at: td, on: f < ganha },
          { text: "MAIS VOTOS VÁLIDOS VENCE", at: ganha, on: f >= ganha },
        ]}
      />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 5. QUAIS CARGOS ───────────────────────── */
const Cargos: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0.3, 1.8, 8.4], [-0.3, 1.9, 7.6], t), [0.6, 1.0, 0]);
  const pres = w("presidente");
  const gov = w("governador");
  const pref = w("prefeito");
  const mil = w("200");
  const sen = w("Senador");
  const dep = w("deputado");
  const linha = f >= sen ? -1 : f >= pref ? 2 : f >= gov ? 1 : f >= pres ? 0 : -1;
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Paper
          position={[1.55, 1.15, -0.3]}
          rotation={[0.05, -0.35 + Math.sin(f / 40) * 0.05, 0.04]}
          scale={0.9 * pop(f, 2)}
          lines={6}
          highlight={linha}
        />
        <Mannequin pose={idlePose(f, 31)} position={[0.4, 0, -0.9]} rotationY={0.3} look="gray" scale={0.8} />
      </Stage>
      <div style={{ position: "absolute", left: 70, top: 470, display: "flex", flexDirection: "column", gap: 26 }}>
        <Check ok text="Presidente" at={pres} />
        <Check ok text="Governador" at={gov} />
        <Check ok text="Prefeito" sub={f >= mil ? "SÓ CIDADES COM +200 MIL ELEITORES" : undefined} on at={pref} />
        <Check ok={false} text="Senador" sub="SEM 2º TURNO" at={sen} />
        <Check ok={false} text="Deputado" sub="SEM 2º TURNO" at={dep} />
      </div>
    </AbsoluteFill>
  );
};

/* ───────────────────────── 6. NA URNA ───────────────────────── */
const UFS = ["AC", "AM", "DF", "ES", "RJ", "RN", "TO"];
const NaUrna: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const t6 = w("6");
  const df = w("Distrito");
  const gov = w("governador", 1);
  const pres = w("presidente");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([-0.6, 3.4, 8.4], [0.4, 3.1, 7.6], t), [0, 0.35, 0.2]);
  const etapa = f >= pres ? 2 : f >= gov ? 1 : 0;
  const tela = projetar([URNA_TELA[0], URNA_TELA[1], URNA_TELA[2] - 0.3], c);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Urna position={[0, 0, -0.3]} tela={etapa > 0 ? 1 : 0} scale={pop(f, 2)} />
        {UFS.map((u, i) => {
          const on = u === "DF" ? f >= df : f >= t6 + i * 3;
          return (
            <RoundBox
              key={u}
              size={[0.3, 0.06, 0.3]}
              radius={0.02}
              position={[(i - 3) * 0.36, 0.03, 0.85]}
              scale={pop(f, 4 + i * 2)}
              color={on ? C.accent : "#5a5955"}
              glow={on ? 0.5 : 0}
            />
          );
        })}
      </Stage>
      {UFS.map((u, i) => {
        const p = projetar([(i - 3) * 0.36, 0, 1.1], c);
        const on = u === "DF" ? f >= df : f >= t6 + i * 3;
        return <Label key={u} x={p.x} y={p.y + 20} at={4 + i * 2} text={u} color={on ? C.accent : C.textDim} size={22} />;
      })}
      {etapa > 0 ? (
        <div
          style={{
            position: "absolute",
            left: tela.x,
            top: tela.y - 120,
            transform: "translate(-50%, -50%)",
            fontFamily: MONO,
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: 3,
            padding: "10px 18px",
            borderRadius: 12,
            background: C.panel,
            border: `1.5px solid ${C.accent}`,
            color: C.accent,
            opacity: interpolate(f, [etapa === 1 ? gov : pres, (etapa === 1 ? gov : pres) + 6], [0, 1], clamp),
          }}
        >
          {etapa === 1 ? "1º GOVERNADOR" : "2º PRESIDENTE"}
        </div>
      ) : null}
      <DataCard at={t6} label="2º TURNO PARA GOVERNADOR · TSE" value={f >= df ? "6 estados + DF" : "6 estados"} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 7. DIA 25 ───────────────────────── */
const Dia: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const t25 = w("25");
  const t8 = w("8h");
  const t17 = w("17h");
  const fila = w("fila");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0.6, 2.5, 8.4], [0.0, 2.3, 7.5], t), [0.15, 0.75, 0]);
  // relógio: ponteiro das horas vai de 8h a 17h
  const horas = lerp(8, 17, ease(f, t8, t17 + 10));
  const ang = ((horas % 12) / 12) * Math.PI * 2;
  const passo = ease(f, 0, dur) * 0.45;
  const pessoas = Array.from({ length: 4 }, (_, i) => {
    const x = -0.1 + i * 0.5 - passo;
    return { i, pos: [x, 0, 0.1] as V3, ph: f / 6 + i * 1.3 };
  });
  const ult = pessoas[3].pos;
  const pu = projetar([ult[0], 1.45, ult[2]], c);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Urna position={[-1.25, 0, -0.2]} rotationY={0.6} tela={1} scale={0.85} />
        {pessoas.map((p) => (
          <Mannequin
            key={p.i}
            pose={walkPose(p.ph)}
            position={p.pos}
            rotationY={-Math.PI / 2}
            look={p.i === 3 && f >= fila ? "accent" : "white"}
            scale={0.8}
          />
        ))}
        <group position={[-1.2, 1.65, -0.6]} scale={pop(f, t8 - 4) * 0.5}>
          <mesh>
            <torusGeometry args={[0.55, 0.045, 12, 48]} />
            <meshStandardMaterial color={C.accent} emissive={C.accent} emissiveIntensity={0.7} />
          </mesh>
          <mesh rotation={[0, 0, -ang]} position={[0, 0, 0.02]}>
            <boxGeometry args={[0.06, 0.6, 0.03]} />
            <meshStandardMaterial color={C.white} />
          </mesh>
          <mesh position={[0, 0, 0.03]}>
            <sphereGeometry args={[0.06, 12, 10]} />
            <meshStandardMaterial color={C.white} />
          </mesh>
        </group>
      </Stage>
      <DataCard
        at={t25}
        label="DOMINGO · 2º TURNO"
        value="25/10"
        rightLabel="HORÁRIO DE BRASÍLIA"
        rightValue={f >= t17 ? "8h–17h" : f >= t8 ? "8h–" : ""}
      />
      <Callout at={fila + 4} x={pu.x} y={pu.y} dx={-120} dy={-170} title="Na fila às 17h? Vota" sub="RECEBE SENHA DO MESÁRIO" />
    </AbsoluteFill>
  );
};

export const CENAS_SEGUNDO_TURNO: Record<string, React.FC<CenaProps>> = {
  placar: Placar,
  regra: Regra,
  validos: Validos,
  dois: Dois,
  cargos: Cargos,
  urna: NaUrna,
  dia: Dia,
};

/** Registro do vídeo: o Composicoes.tsx acha este export sozinho (não precisa editar mais nada). */
export const VIDEO = { id: "SegundoTurno", roteiro: roteiro as Roteiro, cenas: CENAS_SEGUNDO_TURNO };
