import React, { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Stage, Cam } from "../three/Stage";
import { Mannequin, idlePose } from "../three/Mannequin";
import { Coins, RoundBox } from "../three/Objetos";
import { Callout, DataCard, Label, Tags } from "../ui/Overlays";
import { CenaProps, Roteiro } from "../Explicativo";
import { projetar } from "../projetar";
import { clamp, ease, easeOut, lerp, lerp3, pop } from "../anim";
import { C } from "../theme";
import roteiro from "../../../videos/milhao-bilhao/roteiro.json";

type V3 = [number, number, number];
const cam = (pos: V3, look: V3, fov = 40): Cam => ({ pos, look, fov });

/** Número com unidade menor (para caber no lado direito do cartão). */
const ComUnidade: React.FC<{ n: string; u: string }> = ({ n, u }) => (
  <>
    {n}
    <span style={{ fontSize: 40, color: C.textDim, marginLeft: 6 }}>{u}</span>
  </>
);

/* ───────────── torre de anos (gancho e fim): 1 placa = 1 ano; 11 dias = uma lasquinha ───────────── */
const PLACA = 0.075;
const TorreAnos: React.FC<{ f: number; de: number; ate: number; dia: number }> = ({ f, de, ate, dia }) => (
  <group>
    <RoundBox size={[0.7, 0.02, 0.7]} radius={0.006} position={[-0.55, 0.01, 0]} scale={pop(f, dia)} color={C.white} glow={0.3} />
    {Array.from({ length: 31 }, (_, i) => {
      const at = lerp(de, ate, i / 30);
      const s = pop(f, at, 30, 16);
      return s > 0.01 ? (
        <RoundBox
          key={i}
          size={[0.7, PLACA * 0.86, 0.7]}
          radius={0.012}
          position={[0.55, PLACA / 2 + i * PLACA + (1 - Math.min(1, s)) * 0.3, 0]}
          color={C.accent}
          glow={0.35}
        />
      ) : null;
    })}
  </group>
);

/* ───────────────────────── 1. GANCHO ───────────────────────── */
const Gancho: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const t11 = w("11");
  const tBi = w("bilhão");
  const t31 = w("31");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0.9, 2.1, 9.8], [0.3, 2.0, 9.3], t), [0.05, 0.75, 0]);
  const pDia = projetar([-0.55, 0, 0.45], c);
  const pAno = projetar([0.55, 31 * PLACA, 0.3], c);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <TorreAnos f={f} de={0} ate={t31 + 4} dia={0} />
        <Mannequin pose={idlePose(f, 1)} position={[-1.15, 0, -0.5]} rotationY={0.4} look="white" scale={0.85} />
      </Stage>
      <Label x={pDia.x} y={pDia.y + 24} at={t11} text="11 DIAS" color={C.text} size={26} />
      <Label x={pAno.x} y={pAno.y - 30} at={t31} text="31 ANOS" color={C.accent} size={30} />
      <DataCard
        at={0}
        label="1 MILHÃO DE SEGUNDOS"
        value={f >= t11 ? <ComUnidade n="11" u="dias" /> : "…"}
        rightLabel="1 BILHÃO"
        rightValue={f >= t31 ? <ComUnidade n="31" u="anos" /> : f >= tBi ? "?" : ""}
      />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 2. 1 REAL POR SEGUNDO ───────────────────────── */
const Segundos: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const tMi = w("milhão");
  const tBi = w("bilhão");
  const t32 = w("32");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([-0.3, 1.9, 7.7], [0.5, 1.9, 7.3], t), [0.1, 0.85, 0]);
  const reais = Math.round(interpolate(f, [0, tMi], [1, 1_000_000], { ...clamp, easing: (x) => x ** 3 }));
  const moedas = Math.round(interpolate(f, [0, tMi], [1, 18], clamp));
  // ponteiro: voltas até o "milhão" e muito mais rápido depois do "bilhão"
  const giro = interpolate(f, [0, tMi], [0, 11.5], clamp) + interpolate(f, [tBi, dur], [0, 60], clamp);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Mannequin pose={idlePose(f, 3)} position={[-0.75, 0, 0]} rotationY={0.35} look="white" scale={1} />
        <Coins count={moedas} position={[0.35, 0, 0.4]} scale={1.1} />
        <group position={[0.9, 1.75, -0.6]} scale={0.7 * pop(f, 4)}>
          <mesh>
            <torusGeometry args={[0.55, 0.05, 12, 48]} />
            <meshStandardMaterial color={f >= tBi ? C.accent : C.white} emissive={f >= tBi ? C.accent : "#000"} emissiveIntensity={0.5} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.52, 0.52, 0.03, 40]} />
            <meshStandardMaterial color="#2b2b2a" />
          </mesh>
          <group rotation={[0, 0, -giro * Math.PI * 2]} position={[0, 0, 0.04]}>
            <mesh position={[0, 0.2, 0]}>
              <boxGeometry args={[0.05, 0.42, 0.03]} />
              <meshStandardMaterial color={C.white} />
            </mesh>
          </group>
        </group>
      </Stage>
      <DataCard
        at={0}
        label="GANHANDO R$ 1 POR SEGUNDO"
        value={f < tMi ? `R$ ${reais.toLocaleString("pt-BR")}` : <ComUnidade n="11,5" u="dias" />}
        rightLabel="1 BILHÃO"
        rightValue={f >= t32 ? <ComUnidade n="31,7" u="anos" /> : f >= tBi ? "…" : ""}
      />
      <Tags top={1180} items={[{ text: "SEM PARAR, DIA E NOITE", at: w("parar"), on: true }]} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 3. MIL VEZES (três zeros) ───────────────────────── */
const DIGITOS = ["1", "0", "0", "0", "0", "0", "0", "0", "0", "0"];
const Zeros: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const tMil = w("mil");
  const tres = w("três");
  const mult = w("multiplica");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([-0.6, 2.0, 9.6], [0.6, 2.0, 9.3], t), [0, 0.4, 0]);
  const x = (i: number) => (i - 4.5) * 0.3;
  const pulsoDe = (i: number) =>
    i >= 7 ? Math.max(0, Math.sin(Math.PI * interpolate(f, [mult + (i - 7) * 8, mult + (i - 7) * 8 + 14], [0, 1], clamp))) : 0;
  const atDe = (i: number) => (i >= 7 ? tres + (i - 7) * 4 : 2 + i * 2);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        {DIGITOS.map((d, i) => {
          const extra = i >= 7;
          const p = pulsoDe(i);
          return (
            <RoundBox
              key={i}
              size={[0.27, 0.4, 0.27]}
              radius={0.045}
              position={[x(i), 0.2 + p * 0.3, 0]}
              scale={pop(f, atDe(i))}
              color={extra ? C.accent : C.white}
              glow={extra ? 0.35 + p * 0.5 : 0}
            />
          );
        })}
        <Mannequin pose={idlePose(f, 6)} position={[0.25, 0, -1.0]} look="white" scale={0.8} />
      </Stage>
      {DIGITOS.map((d, i) => {
        const p = projetar([x(i), 0.2 + pulsoDe(i) * 0.3, 0.14], c);
        return <Label key={i} x={p.x} y={p.y} at={atDe(i)} text={d} color={C.ink} size={32} />;
      })}
      {[7, 8, 9].map((i) => {
        const p = projetar([x(i), 0.75, 0], c);
        return <Label key={i} x={p.x} y={p.y - 16} at={mult + (i - 7) * 8} text="×10" color={C.accent} size={24} />;
      })}
      <DataCard at={tMil} label="1 BILHÃO = 1 MILHÃO ×" value="1.000" rightLabel="ZEROS A MAIS" rightValue={f >= tres ? "3" : ""} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 4. 1 MILHÃO EM NOTAS (tapete de 109 m²) ───────────────────────── */
// Escala: 1 unidade = 4 m. Tapete de 10,45 m × 10,45 m (109 m²); pessoa de 1,75 m.
const ESC = 0.25;
const LADO = 10.45 * ESC;
const Tapete: React.FC<{ abre: number }> = ({ abre }) => (
  <group scale={[abre, 1, abre]}>
    <RoundBox size={[LADO, 0.02, LADO]} radius={0.006} position={[0, 0.01, 0]} color="#ECEAE2" />
    {Array.from({ length: 9 }, (_, i) => {
      const p = -LADO / 2 + ((i + 1) * LADO) / 10;
      return (
        <React.Fragment key={i}>
          <mesh position={[p, 0.022, 0]}>
            <boxGeometry args={[0.008, 0.004, LADO]} />
            <meshBasicMaterial color="#9b988f" />
          </mesh>
          <mesh position={[0, 0.022, p]}>
            <boxGeometry args={[LADO, 0.004, 0.008]} />
            <meshBasicMaterial color="#9b988f" />
          </mesh>
        </React.Fragment>
      );
    })}
  </group>
);
const TapeteCena: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const tNotas = w("notas", 1);
  const t10 = w("10");
  const chao = w("chão");
  const t109 = w("109");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0.6, 2.4, 4.6], [1.0, 4.4, 6.4], t), [0, 0.1, -0.3]);
  const abre = easeOut(f, chao - 6, chao + 26);
  // antes de abrir no chão: uma pilha de notas ao lado da pessoa
  const pilha = (1 - abre) * pop(f, t10 - 4);
  const borda = projetar([LADO / 2, 0, -LADO / 2], c);
  const pPilha = projetar([-0.25, 0.28, 0.1], c);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        {abre > 0.01 ? <Tapete abre={abre} /> : null}
        {pilha > 0.01 ? (
          <group position={[-0.25, 0, 0.1]} scale={pilha}>
            {Array.from({ length: 8 }, (_, i) => (
              <RoundBox key={i} size={[0.25, 0.03, 0.112]} radius={0.006} position={[0, 0.016 + i * 0.032, 0]} rotation={[0, i * 0.15, 0]} color="#ECEAE2" />
            ))}
          </group>
        ) : null}
        <Mannequin pose={idlePose(f, 9)} position={[0.12, 0.02, 0.1]} look="white" scale={ESC} />
      </Stage>
      <Label x={borda.x - 70} y={borda.y - 22} at={t109} text="10,4 M DE LADO" color={C.text} size={22} />
      <DataCard
        at={t10}
        label="1 MILHÃO EM NOTAS DE R$ 100"
        value={<ComUnidade n="10 mil" u="notas" />}
        rightLabel="NO CHÃO"
        rightValue={f >= t109 ? <ComUnidade n="109" u="m²" /> : ""}
      />
      <Callout at={tNotas + 4} out={chao + 10} x={pPilha.x} y={pPilha.y} dx={-30} dy={-200} title="Cada nota: 15,6 × 7 cm" sub="FONTE: BANCO CENTRAL" />
      <Tags top={1180} items={[{ text: "PESSOA = 1,75 M", at: chao + 10, on: true }]} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 5. 1 BILHÃO EM NOTAS (mil tapetes) ───────────────────────── */
// 1.000 tapetes numa grade de 25 × 40. O do canto (em destaque) é o de 1 milhão.
const COLS = 40;
const ROWS = 25;
const PASSO = 0.11;
const MilTapetes: React.FC<{ f: number; at: number }> = ({ f, at }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.BoxGeometry(PASSO * 0.9, 0.02, PASSO * 0.9), []);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    for (let i = 0; i < COLS * ROWS; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const s = i === 0 ? 0 : pop(f, at + Math.hypot(col, row) * 0.9);
      tmp.position.set((col - (COLS - 1) / 2) * PASSO, 0.012, (row - (ROWS - 1) / 2) * PASSO);
      tmp.scale.set(Math.max(0.0001, s), 1, Math.max(0.0001, s));
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, [f, at, tmp]);
  return (
    <instancedMesh ref={ref} args={[geo, undefined, COLS * ROWS]} receiveShadow>
      <meshStandardMaterial color="#ECEAE2" roughness={0.8} />
    </instancedMesh>
  );
};
const Campo: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const tBi = w("bilhão");
  const t10 = w("10");
  const t1000 = w("1.000");
  const t330 = w("330");
  const recua = ease(f, 0, t1000 + 20);
  const t = ease(f, 0, dur);
  // começa perto do tapete de 1 milhão (canto da grade) e sobe até ver os mil
  const canto: V3 = [-((COLS - 1) / 2) * PASSO, 0, -((ROWS - 1) / 2) * PASSO];
  const c = cam(
    lerp3([canto[0] + 0.15, 0.45, canto[2] + 0.55], [0.3, 13, 5], recua * 0.94 + t * 0.06),
    lerp3([canto[0], 0, canto[2]], [0, 0, 0], recua),
  );
  const pCanto = projetar([canto[0], 0.02, canto[2]], c);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <MilTapetes f={f} at={t1000 - 4} />
        <RoundBox size={[PASSO * 0.95, 0.03, PASSO * 0.95]} radius={0.004} position={[canto[0], 0.016, canto[2]]} color={C.accent} glow={0.6} />
        <Mannequin pose={idlePose(f, 9)} position={[canto[0], 0.03, canto[2]]} look="white" scale={0.012} />
      </Stage>
      <Label x={pCanto.x + 40} y={pCanto.y - 26} at={tBi} text="1 MILHÃO" color={C.accent} size={recua > 0.5 ? 20 : 26} />
      <DataCard
        at={tBi}
        label="1 BILHÃO EM NOTAS DE R$ 100"
        value={f >= t10 ? <ComUnidade n="10 mi" u="notas" /> : "?"}
        rightLabel="QUADRADO DE"
        rightValue={f >= t330 ? <ComUnidade n="330" u="m" /> : ""}
      />
      <Tags top={540} items={[{ text: "1.000 TAPETES DE 109 M²", at: t1000, on: true }]} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 6. EM CUBINHOS ───────────────────────── */
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
        value={f >= tMi ? <ComUnidade n="1 m" u="1 milhão" /> : "—"}
        rightLabel="1 BILHÃO"
        rightValue={f >= t10 ? "10 m" : ""}
      />
      <Tags top={540} items={[{ text: "PESSOA = 1,75 M", at: w("você"), on: f < t10 }, { text: "10 M DE LADO", at: t10, on: f >= t10 }]} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 7. PARA LEMBRAR ───────────────────────── */
const Lembre: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const t11 = w("11");
  const t31 = w("31");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([-0.3, 2.0, 9.6], [0.5, 2.0, 9.2], t), [0.05, 0.75, 0]);
  const pDia = projetar([-0.55, 0, 0.45], c);
  const pAno = projetar([0.55, 31 * PLACA, 0.3], c);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <TorreAnos f={f} de={2} ate={18} dia={2} />
        <Mannequin pose={idlePose(f, 22)} position={[-1.15, 0, -0.5]} rotationY={0.4} look="white" scale={0.85} />
      </Stage>
      <Label x={pDia.x} y={pDia.y + 24} at={t11} text="11 DIAS" color={C.text} size={26} />
      <Label x={pAno.x} y={pAno.y - 30} at={t31} text="31 ANOS" color={C.accent} size={30} />
      <DataCard
        at={2}
        label="MILHÃO × BILHÃO DE SEGUNDOS"
        value={f >= t11 ? <ComUnidade n="11" u="dias" /> : "…"}
        rightLabel="BILHÃO"
        rightValue={f >= t31 ? <ComUnidade n="31" u="anos" /> : ""}
      />
    </AbsoluteFill>
  );
};

export const CENAS_MILHAO_BILHAO: Record<string, React.FC<CenaProps>> = {
  gancho: Gancho,
  segundos: Segundos,
  zeros: Zeros,
  tapete: TapeteCena,
  campo: Campo,
  cubos: Cubos,
  lembre: Lembre,
};

export const VIDEO = { id: "MilhaoBilhao", roteiro: roteiro as Roteiro, cenas: CENAS_MILHAO_BILHAO };
