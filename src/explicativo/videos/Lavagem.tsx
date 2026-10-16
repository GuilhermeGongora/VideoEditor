import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Stage, Cam } from "../three/Stage";
import { Mannequin, idlePose } from "../three/Mannequin";
import { Coins, RoundBox, Stall } from "../three/Objetos";
import { Callout, DataCard, Label, Tags } from "../ui/Overlays";
import { CenaProps, Roteiro } from "../Explicativo";
import { projetar } from "../projetar";
import { clamp, ease, easeOut, lerp, lerp3, pop } from "../anim";
import { C } from "../theme";
import roteiro from "../../../videos/lavagem/roteiro.json";

type V3 = [number, number, number];
const cam = (pos: V3, look: V3, fov = 40): Cam => ({ pos, look, fov });

const SUJO = "#3f3d39";
const LIMPO = "#ecebe2";

/* ───────────── peças ───────────── */
/** Maço de notas. */
const Maco: React.FC<{ position: V3; cor?: string; s?: number; rotY?: number; glow?: number }> = ({ position, cor = SUJO, s = 1, rotY = 0, glow = 0 }) =>
  s > 0.01 ? (
    <group position={position} rotation={[0, rotY, 0]} scale={s}>
      <RoundBox size={[0.3, 0.07, 0.14]} radius={0.01} position={[0, 0.035, 0]} color={cor} glow={glow} />
      <RoundBox size={[0.06, 0.075, 0.145]} radius={0.004} position={[0, 0.036, 0]} color={cor === SUJO ? "#6b6862" : C.accent} glow={cor === SUJO ? 0 : 0.3} />
    </group>
  ) : null;

/** Pilha de maços. */
const Pilha: React.FC<{ f: number; at: number; n: number; position: V3; cor?: string; glow?: number }> = ({ f, at, n, position, cor, glow }) => (
  <group position={position}>
    {Array.from({ length: n }, (_, i) => (
      <Maco key={i} position={[(i % 2) * 0.02, Math.floor(i) * 0.072, 0]} rotY={(i * 0.37) % 0.5 - 0.25} s={pop(f, at + i * 2)} cor={cor} glow={glow} />
    ))}
  </group>
);

/** Máquina de lavar (a metáfora do vídeo). */
const Maquina: React.FC<{ f: number; giro: number; position?: V3; s?: number; brilho?: number }> = ({ f, giro, position = [0, 0, 0], s = 1, brilho = 0 }) => (
  <group position={position} scale={s}>
    <RoundBox size={[1.1, 1.3, 0.9]} radius={0.08} position={[0, 0.65, 0]} color={C.white} />
    <RoundBox size={[1.0, 0.16, 0.02]} radius={0.02} position={[0, 1.18, 0.455]} color="#cfcdc6" />
    <mesh position={[0.32, 1.18, 0.47]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.05, 0.05, 0.03, 24]} />
      <meshStandardMaterial color={C.accent} emissive={C.accent} emissiveIntensity={0.6} />
    </mesh>
    <mesh position={[0, 0.58, 0.46]}>
      <torusGeometry args={[0.36, 0.05, 16, 48]} />
      <meshStandardMaterial color="#bdbbb4" metalness={0.3} roughness={0.4} />
    </mesh>
    <mesh position={[0, 0.58, 0.44]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.33, 0.33, 0.02, 40]} />
      <meshStandardMaterial color="#1d1d1c" emissive={C.accent} emissiveIntensity={0.08 + brilho * 0.4} />
    </mesh>
    {/* notas girando dentro do tambor */}
    <group position={[0, 0.58, 0.47]} rotation={[0, 0, giro]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[Math.cos((i * Math.PI) / 2) * 0.18, Math.sin((i * Math.PI) / 2) * 0.18, 0]} rotation={[0, 0, (i * Math.PI) / 2]}>
          <boxGeometry args={[0.14, 0.07, 0.01]} />
          <meshStandardMaterial color={brilho > 0.5 ? LIMPO : SUJO} />
        </mesh>
      ))}
    </group>
  </group>
);

/** Banco: base, colunas e frontão. */
const Banco: React.FC<{ position: V3; s?: number; glow?: number }> = ({ position, s = 1, glow = 0 }) =>
  s > 0.01 ? (
    <group position={position} scale={s}>
      <RoundBox size={[1.3, 0.12, 0.8]} radius={0.02} position={[0, 0.06, 0]} color={C.white} />
      {[-0.45, -0.15, 0.15, 0.45].map((x) => (
        <mesh key={x} position={[x, 0.55, 0.2]}>
          <cylinderGeometry args={[0.07, 0.07, 0.86, 20]} />
          <meshStandardMaterial color={C.white} />
        </mesh>
      ))}
      <RoundBox size={[1.2, 0.86, 0.4]} radius={0.02} position={[0, 0.55, -0.15]} color="#cfcdc6" />
      <RoundBox size={[1.4, 0.1, 0.85]} radius={0.02} position={[0, 1.03, 0]} color={C.white} glow={glow} />
      <mesh position={[0, 1.2, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]} scale={[1, 1, 1]}>
        <cylinderGeometry args={[0.3, 0.3, 0.8, 3]} />
        <meshStandardMaterial color={C.white} />
      </mesh>
    </group>
  ) : null;

const Casa: React.FC<{ position: V3; s: number }> = ({ position, s }) =>
  s > 0.01 ? (
    <group position={position} scale={s}>
      <RoundBox size={[0.8, 0.6, 0.7]} radius={0.03} position={[0, 0.3, 0]} color={LIMPO} />
      <mesh position={[0, 0.78, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.62, 0.38, 4]} />
        <meshStandardMaterial color={C.accent} emissive={C.accent} emissiveIntensity={0.15} />
      </mesh>
      <RoundBox size={[0.18, 0.3, 0.02]} radius={0.01} position={[0, 0.15, 0.36]} color={C.dark} />
    </group>
  ) : null;

const Carro: React.FC<{ position: V3; s: number }> = ({ position, s }) =>
  s > 0.01 ? (
    <group position={position} scale={s}>
      <RoundBox size={[0.9, 0.22, 0.45]} radius={0.06} position={[0, 0.2, 0]} color={LIMPO} />
      <RoundBox size={[0.5, 0.18, 0.4]} radius={0.06} position={[-0.05, 0.38, 0]} color="#d6d4cc" />
      {[-0.28, 0.28].flatMap((x) =>
        [-0.21, 0.21].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.1, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.06, 20]} />
            <meshStandardMaterial color="#1d1d1c" />
          </mesh>
        )),
      )}
    </group>
  ) : null;

const Lupa: React.FC<{ position: V3; s: number; rot?: number }> = ({ position, s, rot = 0.5 }) =>
  s > 0.01 ? (
    <group position={position} scale={s} rotation={[0, 0, rot]}>
      <mesh>
        <torusGeometry args={[0.32, 0.05, 16, 48]} />
        <meshStandardMaterial color={C.accent} emissive={C.accent} emissiveIntensity={0.4} />
      </mesh>
      <mesh>
        <circleGeometry args={[0.3, 40]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.12} />
      </mesh>
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.55, 16]} />
        <meshStandardMaterial color={C.white} />
      </mesh>
    </group>
  ) : null;

/* ───────────────────────── 1. GANCHO: a lavanderia ───────────────────────── */
const Gancho: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const tLimpo = w("limpo");
  const t3 = w("3");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0.4, 1.8, 7.6], [-0.2, 1.7, 7.0], t), [0, 0.6, 0]);
  const giro = -f * 0.35;
  const brilho = interpolate(f, [tLimpo - 6, tLimpo + 8], [0, 1], clamp);
  const pSujo = projetar([-0.98, 0.6, 0.3], c);
  const pLimpo = projetar([0.98, 0.6, 0.3], c);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Maquina f={f} giro={giro} brilho={brilho} s={0.85} />
        <Pilha f={f} at={0} n={6} position={[-0.98, 0, 0.3]} />
        <Pilha f={f} at={tLimpo} n={6} position={[0.98, 0, 0.3]} cor={LIMPO} glow={0.15} />
      </Stage>
      <Label x={pSujo.x} y={pSujo.y - 20} at={4} text="SUJO" color={C.text} size={26} />
      <Label x={pLimpo.x} y={pLimpo.y - 20} at={tLimpo} text="LIMPO" color={C.accent} size={26} />
      <Tags top={540} items={[{ text: "3 ETAPAS", at: t3, on: true }]} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 2. O PROBLEMA: a mala ───────────────────────── */
const Problema: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const tGastar = w("gastar");
  const tMala = w("mala");
  const tAtencao = w("atenção");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([-0.4, 1.7, 7.6], [0.3, 1.6, 7.0], t), [0, 0.8, 0]);
  const vira = easeOut(f, tAtencao - 4, tAtencao + 14);
  const abre = easeOut(f, tMala, tMala + 14);
  const pMala = projetar([0.15, 0.45, 0.5], c);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Mannequin pose={idlePose(f, 2)} position={[-0.35, 0, 0]} rotationY={0.3} look="white" />
        {/* mala com notas */}
        <group position={[0.2, 0, 0.45]} scale={pop(f, tMala - 4)}>
          <RoundBox size={[0.75, 0.32, 0.5]} radius={0.04} position={[0, 0.16, 0]} color="#2a2927" />
          <group position={[0, 0.32, -0.25]} rotation={[-abre * 1.6, 0, 0]}>
            <RoundBox size={[0.75, 0.05, 0.5]} radius={0.02} position={[0, 0.02, 0.25]} color="#2a2927" />
          </group>
          {[-0.2, 0, 0.2].map((x, i) => (
            <Maco key={x} position={[x, 0.3, 0]} rotY={Math.PI / 2} s={abre} glow={0} cor={i === 1 ? SUJO : SUJO} />
          ))}
        </group>
        {/* gente olhando */}
        {[-1.0, 1.0, 0.45].map((x, i) => (
          <Mannequin
            key={i}
            pose={idlePose(f, 10 + i)}
            position={[x, 0, -1.3 - i * 0.5]}
            rotationY={lerp(i === 0 ? -0.6 : 0.6, x < 0 ? 0.9 : -0.9, vira)}
            look={vira > 0.5 ? "accent" : "gray"}
            scale={0.92}
          />
        ))}
      </Stage>
      <Tags top={420} items={[{ text: "NÃO PODE GASTAR", at: tGastar, on: true }]} />
      <Callout at={tAtencao} x={pMala.x} y={pMala.y} dx={120} dy={-330} title="Chama atenção" sub="DINHEIRO VIVO, SEM ORIGEM" />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 3. COLOCAÇÃO: depósitos pequenos ───────────────────────── */
const N_DEP = 7;
const Colocacao: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const tBanco = w("banco");
  const tVarios = w("vários");
  const tAlerta = w("alerta");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0.2, 2.0, 8.6], [-0.2, 1.9, 8.0], t), [0, 0.7, 0]);
  const inicio = tVarios - 6;
  const passo = Math.max(4, (dur - inicio - 10) / N_DEP);
  const feitos = Math.max(0, Math.min(N_DEP, Math.floor((f - inicio) / passo) + 1));
  const pBanco = projetar([0.85, 1.35, 0], c);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Banco position={[0.85, 0, -0.2]} s={0.85 * pop(f, tBanco - 6)} glow={interpolate(f, [tAlerta, tAlerta + 10], [0, 0.4], clamp)} />
        <Mannequin pose={idlePose(f, 4)} position={[-1.0, 0, 0.2]} rotationY={0.6} look="white" />
        <Pilha f={f} at={0} n={Math.max(0, 5 - Math.floor(feitos * 0.7))} position={[-0.55, 0, 0.55]} />
        {Array.from({ length: N_DEP }, (_, i) => {
          const a = inicio + i * passo;
          const k = easeOut(f, a, a + 16);
          if (f < a) return null;
          const x = lerp(-0.5, 0.6, k);
          const y = 0.15 + Math.sin(k * Math.PI) * 0.45;
          return <Maco key={i} position={[x, y, 0.45]} s={k < 1 ? 0.8 : 0} />;
        })}
      </Stage>
      <Label x={pBanco.x} y={pBanco.y - 24} at={tBanco} text="BANCO" color={C.text} size={24} />
      <DataCard at={tVarios - 4} label="DEPÓSITOS PEQUENOS" value={String(feitos)} rightLabel="ALERTA" rightValue={f >= tAlerta ? "não" : ""} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 4. OCULTAÇÃO: conta em conta ───────────────────────── */
const PONTOS: V3[] = [
  [-0.95, 0, 0.3],
  [-0.35, 0, -0.5],
  [0.3, 0, 0.35],
  [0.92, 0, -0.45],
];
const Ocultacao: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const tConta = w("conta");
  const tLaranjas = w("laranjas");
  const tFachada = w("fachada");
  const tNinguem = w("ninguém");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0.0, 2.8, 8.8], [0.3, 2.6, 8.3], t), [0, 0.6, -0.1]);
  // o maço pula de um ponto para o próximo
  const saltos = PONTOS.length - 1;
  const prog = interpolate(f, [tConta, tNinguem], [0, saltos], clamp);
  const i0 = Math.min(saltos - 1, Math.floor(prog));
  const k = prog - i0;
  const a = PONTOS[i0];
  const b = PONTOS[i0 + 1];
  const pos: V3 = [lerp(a[0], b[0], k), 0.75 + Math.sin(k * Math.PI) * 0.5, lerp(a[2], b[2], k)];
  const some = interpolate(f, [tNinguem, tNinguem + 12], [1, 0], clamp);
  const pL = projetar([-0.35, 1.9, -0.5], c);
  const pF = projetar([0.92, 1.55, -0.45], c);
  const pQ = projetar([pos[0], pos[1] + 0.4, pos[2]], c);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        {PONTOS.map((p, i) => (
          <RoundBox key={i} size={[0.5, 0.6, 0.5]} radius={0.05} position={[p[0], 0.3, p[2]]} scale={pop(f, 2 + i * 3)} color={i === 3 ? C.gray : C.white} />
        ))}
        {/* laranja (boneco) e empresa de fachada */}
        <Mannequin pose={idlePose(f, 5)} position={[-0.35, 0.6, -0.5]} look={f >= tLaranjas ? "accent" : "gray"} scale={0.7 * pop(f, tLaranjas - 4)} />
        <group position={[0.92, 0.6, -0.45]} scale={pop(f, tFachada - 4)}>
          <Stall position={[0, 0, 0]} scale={0.4} />
        </group>
        <Maco position={pos} s={some} rotY={f * 0.15} />
        {/* rastro tracejado que vai apagando */}
        {Array.from({ length: 24 }, (_, i) => {
          const q = (i / 23) * saltos;
          if (q > prog) return null;
          const j = Math.min(saltos - 1, Math.floor(q));
          const kk = q - j;
          const A = PONTOS[j];
          const B = PONTOS[j + 1];
          return (
            <mesh key={i} position={[lerp(A[0], B[0], kk), 0.75 + Math.sin(kk * Math.PI) * 0.5, lerp(A[2], B[2], kk)]}>
              <sphereGeometry args={[0.025, 10, 10]} />
              <meshStandardMaterial color={C.accent} emissive={C.accent} emissiveIntensity={0.6} transparent opacity={0.85 * some} />
            </mesh>
          );
        })}
      </Stage>
      <Label x={pL.x} y={pL.y - 10} at={tLaranjas} text="LARANJA" color={C.accent} size={24} />
      <Label x={pF.x} y={pF.y + 150} at={tFachada} text="FACHADA" color={C.text} size={24} />
      <Label x={pQ.x} y={pQ.y - 30} at={tNinguem} text="ORIGEM?" color={C.accent} size={34} />
      <Tags top={1180} items={[{ text: "CONTA → CONTA → CONTA", at: tConta, on: true }]} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 5. INTEGRAÇÃO: volta limpo ───────────────────────── */
const Integracao: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const tLucro = w("lucro");
  const tCasa = w("casa");
  const tCarro = w("carro");
  const tInv = w("investimento");
  const tHonesto = w("honesto");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([-0.3, 2.1, 8.8], [0.3, 2.0, 8.2], t), [0, 0.55, 0]);
  const pC = projetar([-0.85, 0, 0.45], c);
  const pK = projetar([0.15, 0.62, 0.55], c);
  const pI = projetar([0.8, 0.6, 0.3], c);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Stall position={[-0.2, 0, -1.4]} scale={0.7 * pop(f, tLucro - 6)} />
        <Pilha f={f} at={tLucro} n={4} position={[0.9, 0.0, -1.1]} cor={LIMPO} />
        <Casa position={[-0.85, 0, 0]} s={pop(f, tCasa - 3)} />
        <Carro position={[0.15, 0, 0.55]} s={pop(f, tCarro - 3)} />
        <Coins count={Math.round(interpolate(f, [tInv - 3, tInv + 18], [0, 10], clamp))} position={[0.92, 0, 0.3]} scale={0.9} />
        <Mannequin pose={idlePose(f, 7)} position={[0.55, 0, -0.55]} rotationY={-0.2} look={f >= tHonesto ? "accent" : "white"} scale={0.9} />
      </Stage>
      <Label x={pC.x} y={pC.y + 26} at={tCasa} text="CASA" color={C.text} size={24} />
      <Label x={pK.x} y={pK.y - 10} at={tCarro} text="CARRO" color={C.text} size={24} />
      <Label x={pI.x} y={pI.y - 10} at={tInv} text="INVESTIMENTO" color={C.text} size={18} />
      <Tags top={540} items={[{ text: "\"LUCRO DE EMPRESA\"", at: tLucro, on: f < tHonesto }, { text: "PARECE HONESTO", at: tHonesto, on: f >= tHonesto }]} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 6. QUEM VIGIA: banco + Coaf ───────────────────────── */
const Coaf: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const tVivo = w("vivo");
  const t50 = w("50");
  const tComunica = w("comunica");
  const tRecorde = w("recorde");
  const t20 = w("20");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0.3, 1.9, 8.2], [-0.2, 1.8, 7.6], t), [0, 0.7, 0]);
  const varre = Math.sin(f * 0.06) * 0.6;
  const pB = projetar([0.5, 1.1, -0.3], c);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Banco position={[0.5, 0, -0.3]} s={0.85 * pop(f, 0)} glow={f >= tComunica ? 0.5 : 0} />
        <Pilha f={f} at={tVivo - 4} n={5} position={[-0.7, 0, 0.5]} />
        <Lupa position={[-0.6 + varre * 0.4, 1.0, 0.6]} s={pop(f, 4)} rot={0.6} />
        {/* papéis de relatório subindo do banco */}
        {Array.from({ length: 6 }, (_, i) => {
          const a = tRecorde + i * 5;
          const k = easeOut(f, a, a + 20);
          return f >= a ? (
            <RoundBox key={i} size={[0.28, 0.36, 0.01]} radius={0.01} position={[0.05 + i * 0.16, 1.25 + k * 0.25, 0.4]} rotation={[0, 0, (i - 2.5) * 0.08]} color={LIMPO} glow={0.1} opacity={1 - k * 0.2} />
          ) : null;
        })}
      </Stage>
      <DataCard
        at={tVivo - 2}
        label="ESPÉCIE: BANCO COMUNICA"
        value={f >= t50 ? "R$ 50 mil+" : "…"}
        rightLabel="RELATÓRIOS COAF 2025"
        rightValue={f >= t20 ? "20.548" : ""}
      />
      <Callout at={tComunica} x={pB.x} y={pB.y} dx={-40} dy={-120} title="Avisa o governo" sub="FONTE: BANCO CENTRAL · COAF" />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 7. A PENA e o rastro ───────────────────────── */
const Pena: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const t3 = w("3");
  const t10 = w("10");
  const tRastro = w("rastro");
  const tPego = w("pego");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([-0.4, 1.8, 7.6], [0.3, 1.7, 7.0], t), [0, 0.8, 0]);
  const grades = easeOut(f, tPego - 8, tPego + 6);
  const trilha = interpolate(f, [tRastro - 4, tPego], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Maquina f={f} giro={-f * 0.2} position={[-0.8, 0, -0.4]} s={0.6} brilho={0} />
        <Mannequin pose={idlePose(f, 12)} position={[0.7, 0, 0]} rotationY={-0.3} look="white" />
        {/* rastro de pegadas acesas da máquina até a pessoa */}
        {Array.from({ length: 12 }, (_, i) => {
          const k = i / 11;
          if (k > trilha) return null;
          return (
            <RoundBox key={i} size={[0.1, 0.01, 0.16]} radius={0.01} position={[lerp(-0.5, 0.55, k), 0.01, 0.2 + Math.sin(k * 6) * 0.08]} rotation={[0, (i % 2) * 0.3, 0]} color={C.accent} glow={0.6} />
          );
        })}
        {/* grades caindo */}
        {grades > 0.01
          ? [-0.3, -0.15, 0, 0.15, 0.3].map((x) => (
              <mesh key={x} position={[0.7 + x, 1.0 + (1 - grades) * 2.5, 0.45]}>
                <cylinderGeometry args={[0.025, 0.025, 2.0, 12]} />
                <meshStandardMaterial color={C.dark} metalness={0.5} roughness={0.4} />
              </mesh>
            ))
          : null}
      </Stage>
      <DataCard at={t3 - 2} label="PENA · LEI 9.613/98" value={f >= t10 ? "3 a 10" : "3 a …"} unit="anos" />
      <Tags top={1180} items={[{ text: "CADA ETAPA DEIXA RASTRO", at: tRastro, on: true }]} />
    </AbsoluteFill>
  );
};

export const CENAS_LAVAGEM: Record<string, React.FC<CenaProps>> = {
  gancho: Gancho,
  problema: Problema,
  colocacao: Colocacao,
  ocultacao: Ocultacao,
  integracao: Integracao,
  coaf: Coaf,
  pena: Pena,
};

export const VIDEO = { id: "Lavagem", roteiro: roteiro as Roteiro, cenas: CENAS_LAVAGEM };
