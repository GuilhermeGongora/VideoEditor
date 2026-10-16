import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Stage, Cam } from "../three/Stage";
import { Mat, RoundBox } from "../three/Objetos";
import { Callout, DataCard, Label, Tags } from "../ui/Overlays";
import { CenaProps, Roteiro } from "../Explicativo";
import { projetar } from "../projetar";
import { clamp, ease, easeOut, lerp, lerp3, pop, rand } from "../anim";
import { C, MONO } from "../theme";
import roteiro from "../../../videos/urna/roteiro.json";

type V3 = [number, number, number];
const cam = (pos: V3, look: V3, fov = 40): Cam => ({ pos, look, fov });

/* ───────────────────────── a urna, peça por peça ───────────────────────── */
// Origem no chão. `abre` 0 = montada, 1 = vista explodida (cada peça sobe/afasta um tanto).
type Peca = "tela" | "teclado" | "bio" | "impressora" | "placa" | "cpu" | "ram" | "mse" | "tampa";
const SUBIDA: Record<Peca, V3> = {
  tampa: [0, 0.95, 0],
  tela: [-0.15, 1.35, 0.1],
  teclado: [0.25, 1.3, 0.3],
  bio: [0.3, 1.45, -0.2],
  impressora: [-0.3, 1.45, -0.3],
  placa: [0, 0.4, 0],
  cpu: [0, 0.6, 0],
  ram: [0, 0.7, 0],
  mse: [0, 0.6, 0],
};
const Urna: React.FC<{
  abre?: number;
  /** peças que acendem (0..1) */
  luz?: Partial<Record<Peca, number>>;
  /** 0..1: a placa e a tela apagam (urna desligada) */
  apaga?: number;
  /** peças escondidas (ex.: teclado trocado) */
  sem?: Peca[];
  telaCor?: string;
  position?: V3;
  rotationY?: number;
  scale?: number;
}> = ({ abre = 0, luz = {}, apaga = 0, sem = [], telaCor, position = [0, 0, 0], rotationY = 0, scale = 1 }) => {
  const o = (p: Peca): V3 => [SUBIDA[p][0] * abre, SUBIDA[p][1] * abre, SUBIDA[p][2] * abre];
  const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const cor = (p: Peca, base: string) => ((luz[p] ?? 0) > 0.05 ? C.accent : base);
  const brilho = (p: Peca) => (luz[p] ?? 0) * 0.7;
  const placaCor = apaga > 0.5 ? "#232322" : "#3a3936";
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      {/* base */}
      <RoundBox size={[1.7, 0.2, 1.05]} radius={0.06} position={[0, 0.1, 0]} color={C.white} />
      {/* placa-mãe com processador, memória e o chip de segurança (MSE) */}
      <group position={add([0, 0.23, 0], o("placa"))}>
        <RoundBox size={[1.4, 0.03, 0.85]} radius={0.01} color={placaCor} />
        {Array.from({ length: 10 }, (_, i) => (
          <mesh key={i} position={[-0.6 + i * 0.13, 0.017, 0.38]}>
            <boxGeometry args={[0.06, 0.004, 0.03]} />
            <meshBasicMaterial color={apaga > 0.5 ? "#333" : "#8f8c85"} />
          </mesh>
        ))}
      </group>
      <RoundBox size={[0.24, 0.05, 0.24]} radius={0.01} position={add([-0.25, 0.27, 0.05], o("cpu"))} color={cor("cpu", "#8f8c85")} glow={brilho("cpu")} />
      {[-0.13, 0.13].map((z) => (
        <RoundBox key={z} size={[0.55, 0.09, 0.05]} radius={0.01} position={add([0.28, 0.29, z], o("ram"))} color={cor("ram", "#5a5955")} glow={brilho("ram")} />
      ))}
      <RoundBox size={[0.13, 0.04, 0.13]} radius={0.01} position={add([0.5, 0.265, -0.3], o("mse"))} color={apaga > 0.5 ? "#2a2a28" : C.accent} glow={apaga > 0.5 ? 0 : 0.4 + brilho("mse")} />
      {/* tampa */}
      <RoundBox size={[1.7, 0.12, 1.05]} radius={0.05} position={add([0, 0.4, 0], o("tampa"))} color={C.white} opacity={abre > 0.2 ? 0.5 : 1} />
      {/* tela (inclinada) */}
      {sem.includes("tela") ? null : <group position={add([-0.42, 0.72, -0.05], o("tela"))} rotation={[1.05, 0, 0]}>
        <RoundBox size={[0.72, 0.05, 0.52]} radius={0.02} color="#d9d6cf" />
        <RoundBox size={[0.62, 0.02, 0.42]} radius={0.01} position={[0, 0.027, 0]} color={apaga > 0.5 ? "#111" : telaCor ?? "#1d2a24"} glow={apaga > 0.5 ? 0 : 0.25} />
      </group>}
      {/* teclado do eleitor */}
      {sem.includes("teclado") ? null : (
        <group position={add([0.42, 0.48, 0.15], o("teclado"))}>
          <RoundBox size={[0.52, 0.05, 0.58]} radius={0.02} color={cor("teclado", "#d9d6cf")} glow={brilho("teclado") * 0.6} />
          {Array.from({ length: 12 }, (_, i) => (
            <RoundBox
              key={i}
              size={[0.11, 0.03, 0.09]}
              radius={0.015}
              position={[-0.14 + (i % 3) * 0.14, 0.035, -0.18 + Math.floor(i / 3) * 0.12]}
              color="#3a3936"
            />
          ))}
        </group>
      )}
      {/* leitor biométrico */}
      <group position={add([0.42, 0.49, -0.3], o("bio"))}>
        <RoundBox size={[0.3, 0.08, 0.2]} radius={0.03} color={cor("bio", "#5a5955")} glow={brilho("bio")} />
        <RoundBox size={[0.14, 0.01, 0.1]} radius={0.004} position={[0, 0.045, 0]} color="#9fc3d8" glow={0.2} />
      </group>
      {/* impressora */}
      <group position={add([-0.42, 0.5, -0.36], o("impressora"))}>
        <RoundBox size={[0.42, 0.12, 0.26]} radius={0.03} color={cor("impressora", "#5a5955")} glow={brilho("impressora")} />
        <mesh position={[0, 0.062, 0.06]}>
          <boxGeometry args={[0.3, 0.005, 0.02]} />
          <meshBasicMaterial color="#1b1b1b" />
        </mesh>
      </group>
    </group>
  );
};

/** Centro da tela da urna montada (para pôr texto em cima). */
const TELA: V3 = [-0.42, 0.74, 0.0];

/* ───────────────────────── 1. GANCHO ───────────────────────── */
const Gancho: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const tLinux = w("Linux");
  const tTecl = w("teclado");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0.9, 2.4, 6.6], [0.3, 2.4, 6.2], t), [0, 0.3, 0]);
  const sai = easeOut(f, tTecl - 4, tTecl + 12);
  const entra = easeOut(f, tTecl + 8, tTecl + 22);
  const pT = projetar(TELA, c);
  const generico: V3 = lerp3([1.6, 0.6, 0.9], [0.42, 0.62, 0.15], entra);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Urna sem={sai > 0.5 ? ["teclado"] : []} telaCor={f >= tTecl + 20 ? "#3a1a1a" : undefined} />
        {/* o teclado original sai, um genérico tenta entrar */}
        {sai < 0.99 && sai > 0.01 ? (
          <RoundBox size={[0.52, 0.05, 0.58]} radius={0.02} position={[0.42 + sai * 0.9, 0.48 + sai * 0.6, 0.15 + sai * 0.6]} color="#d9d6cf" opacity={1 - sai} />
        ) : null}
        {f >= tTecl + 6 ? <RoundBox size={[0.52, 0.06, 0.58]} radius={0.02} position={generico} color="#4d4c49" /> : null}
      </Stage>
      {f >= tLinux - 2 ? (
        <div
          style={{
            position: "absolute",
            left: pT.x,
            top: pT.y - 30,
            transform: "translate(-50%, -50%)",
            fontFamily: MONO,
            fontWeight: 700,
            fontSize: f >= tTecl + 20 ? 24 : 30,
            lineHeight: 1.2,
            color: f >= tTecl + 20 ? C.accent : C.text,
            opacity: pop(f, tLinux - 2),
            textAlign: "center",
            whiteSpace: "nowrap",
            textShadow: "0 2px 10px rgba(0,0,0,0.8)",
          }}
        >
          {f >= tTecl + 20 ? <>✕ TECLADO<br />NÃO RECONHECIDO</> : "$ uenux"}
        </div>
      ) : null}
      <Tags top={1180} items={[{ text: "RODA LINUX", at: tLinux, on: f < tTecl }, { text: "TECLADO TROCADO = RECUSADO", at: tTecl + 20, on: f >= tTecl + 20 }]} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 2. O SISTEMA ───────────────────────── */
const Linux: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const tUenux = w("UEnux");
  const t2008 = w("2008");
  const tWifi = w("Wi-Fi");
  const tCabo = w("cabo");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([-0.6, 2.4, 6.6], [0.5, 2.4, 6.4], t), [0, 0.4, 0]);
  const pT = projetar(TELA, c);
  const wifi = pop(f, tWifi);
  const cabo = pop(f, tCabo);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Urna telaCor="#16261d" />
        {/* Wi-Fi riscado */}
        <group position={[0.12, 1.0, -0.45]} scale={0.45 * wifi}>
          {[0.18, 0.34, 0.5].map((r) => (
            <mesh key={r} rotation={[0, 0, Math.PI / 4]}>
              <torusGeometry args={[r, 0.035, 8, 24, Math.PI / 2]} />
              <Mat color={C.gray} />
            </mesh>
          ))}
          <mesh position={[0, 0.06, 0]}>
            <sphereGeometry args={[0.06, 12, 10]} />
            <Mat color={C.gray} />
          </mesh>
          <mesh rotation={[0, 0, -0.8]} position={[0, 0.2, 0.05]}>
            <boxGeometry args={[0.07, 0.95, 0.04]} />
            <Mat color={C.accent} glow={0.6} />
          </mesh>
        </group>
        {/* cabo de rede solto, riscado */}
        <group position={[0.72, 1.0, -0.45]} scale={0.45 * cabo}>
          <RoundBox size={[0.3, 0.22, 0.4]} radius={0.03} color={C.gray} />
          <mesh position={[0, -0.05, -0.45]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.6, 12]} />
            <Mat color={C.gray} />
          </mesh>
          <mesh rotation={[0, 0, -0.8]} position={[0, 0, 0.25]}>
            <boxGeometry args={[0.07, 0.8, 0.04]} />
            <Mat color={C.accent} glow={0.6} />
          </mesh>
        </group>
      </Stage>
      <div
        style={{
          position: "absolute",
          left: pT.x,
          top: pT.y - 20,
          transform: "translate(-50%, -50%)",
          fontFamily: MONO,
          textAlign: "center",
          opacity: pop(f, tUenux - 2),
          textShadow: "0 2px 10px rgba(0,0,0,0.8)",
        }}
      >
        <div style={{ fontSize: 44, fontWeight: 700, color: C.accent }}>UEnux</div>
        <div style={{ fontSize: 20, color: C.text, letterSpacing: 2 }}>LINUX DO TSE</div>
      </div>
      <DataCard at={tUenux} label="SISTEMA DA URNA" value="UEnux" rightLabel="DESDE" rightValue={f >= t2008 ? "2008" : ""} />
      <Tags top={1180} items={[{ text: "SEM WI-FI", at: tWifi, on: true }, { text: "SEM CABO DE REDE", at: tCabo, on: true }]} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 3. AS PEÇAS (vista explodida) ───────────────────────── */
const Dentro: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const tAtom = w("Atom");
  const t4 = w("4");
  const tPouco = w("Pouco");
  const t = ease(f, 0, dur);
  const abre = easeOut(f, 2, 34);
  const c = cam(lerp3([1.4, 3.0, 8.8], [-0.6, 3.0, 8.6], t), [0, 0.95, 0]);
  const pCpu = projetar([-0.25, 0.27 + SUBIDA.cpu[1] * abre, 0.15], c);
  const pRam = projetar([0.5, 0.33 + SUBIDA.ram[1] * abre, 0.15], c);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Urna abre={abre} luz={{ cpu: f >= tAtom ? 1 : 0, ram: f >= t4 ? 1 : 0 }} />
      </Stage>
      <Callout at={tAtom} x={pCpu.x} y={pCpu.y} dx={-40} dy={170} title="Intel Atom" sub="UE2020 · UE2022" />
      <Callout at={t4} x={pRam.x} y={pRam.y} dx={20} dy={150} title="4 GB de RAM" sub="FONTE: TSE" />
      <Tags top={540} items={[{ text: "SÓ UMA TAREFA: GUARDAR VOTOS", at: tPouco + 10, on: true }]} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 4. AO LIGAR (assinaturas) ───────────────────────── */
const N_PROG = 6;
const Liga: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const tMse = w("MSE");
  const tConf = w("confere");
  const tBater = w("bater");
  const tDesl = w("desliga");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0.8, 2.8, 7.6], [0.2, 3.0, 7.8], t), [0.1, 0.8, -0.1]);
  const abre = 0.55;
  const msePos: V3 = [0.5, 0.265 + SUBIDA.mse[1] * abre, -0.3];
  const apaga = ease(f, tDesl - 2, tDesl + 8);
  // programas passam pelo MSE um a um; o último (depois do "bater") é o errado
  const progs = Array.from({ length: N_PROG }, (_, i) => {
    const errado = i === N_PROG - 1;
    const de = errado ? tBater - 10 : tConf + i * 6;
    const k = ease(f, de, de + 14);
    const ini: V3 = [-0.7 + i * 0.14, 1.6, 0.35];
    const p = lerp3(ini, [msePos[0], msePos[1] + 0.12, msePos[2]], k);
    const ok = !errado && k >= 1;
    return { i, errado, k, p, ok, de };
  });
  const pMse = projetar(msePos, c);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Urna abre={abre} luz={{ mse: f >= tMse && apaga < 0.5 ? 1 : 0 }} apaga={apaga} />
        {progs.map((g) =>
          g.k < 1 || g.errado ? (
            <RoundBox
              key={g.i}
              size={[0.13, 0.17, 0.02]}
              radius={0.01}
              position={g.p}
              scale={pop(f, tConf - 4 + g.i * 2) * (g.k >= 1 ? 0.8 : 1)}
              color={g.errado ? "#2a2a28" : C.white}
              rotation={[0, 0.4, 0]}
            />
          ) : null,
        )}
      </Stage>
      <Callout at={tMse} out={tBater - 14} x={pMse.x} y={pMse.y} dx={-80} dy={-230} title="MSE: chip de segurança" sub="GUARDA AS CHAVES E ASSINA" />
      <Label x={pMse.x + 70} y={pMse.y - 40} at={tConf + 20} text={`✓ ${Math.min(N_PROG - 1, Math.max(0, Math.floor((f - tConf) / 6)))} OK`} color={C.accent} size={24} />
      <Tags top={540} items={[{ text: "CONFERE CADA PROGRAMA", at: tConf, on: f < tBater }, { text: "1 ERRADO → DESLIGA", at: tBater, on: f >= tBater }]} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 5. PEÇA TROCADA ───────────────────────── */
const Pecas: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const tTec = w("Teclado");
  const tBio = w("digital");
  const tImp = w("impressora");
  const tCif = w("cifrado");
  const tPeca = w("Peça");
  const tNao = w("funciona");
  const t = ease(f, 0, dur);
  const abre = 0.75;
  const c = cam(lerp3([-0.4, 3.0, 8.4], [0.6, 3.0, 8.2], t), [0.05, 0.95, 0]);
  const mse: V3 = [0.5, 0.265 + SUBIDA.mse[1] * abre, -0.3];
  const pecas: { p: Peca; base: V3; at: number; nome: string }[] = [
    { p: "teclado", base: [0.42, 0.48, 0.15], at: tTec, nome: "TECLADO" },
    { p: "bio", base: [0.42, 0.49, -0.3], at: tBio, nome: "DIGITAL" },
    { p: "impressora", base: [-0.42, 0.5, -0.36], at: tImp, nome: "IMPRESSORA" },
  ];
  const pos = (x: { p: Peca; base: V3 }): V3 => [x.base[0] + SUBIDA[x.p][0] * abre, x.base[1] + SUBIDA[x.p][1] * abre, x.base[2] + SUBIDA[x.p][2] * abre];
  const generico = easeOut(f, tPeca - 2, tPeca + 14);
  const recusa = f >= tNao;
  const gPos: V3 = lerp3([1.8, 1.5, 1.0], [1.05, 1.35, 0.6], generico) as V3;
  const recuo: V3 = recusa ? [gPos[0] + easeOut(f, tNao, tNao + 12) * 0.5, gPos[1] - easeOut(f, tNao, tNao + 12) * 0.3, gPos[2]] : gPos;
  const pG = projetar(recuo, c);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Urna abre={abre} sem={["tela"]} luz={{ teclado: f >= tTec ? 1 : 0, bio: f >= tBio ? 1 : 0, impressora: f >= tImp ? 1 : 0 }} />
        {/* conversa cifrada: pontinhos indo de cada peça até o MSE */}
        {f >= tCif
          ? pecas.map((x, k) =>
              [0, 1, 2].map((j) => {
                const ph = (((f - tCif) / 20 + j / 3 + k * 0.17) % 1 + 1) % 1;
                return (
                  <mesh key={`${k}-${j}`} position={lerp3(pos(x), mse, ph)}>
                    <sphereGeometry args={[0.03, 10, 8]} />
                    <Mat color={C.accent} glow={1} />
                  </mesh>
                );
              }),
            )
          : null}
        {generico > 0.01 ? <RoundBox size={[0.4, 0.05, 0.45]} radius={0.02} position={recuo} rotation={[0, -0.3, 0]} color="#4d4c49" /> : null}
      </Stage>
      {pecas.map((x) => {
        const p = projetar(pos(x), c);
        return <Label key={x.p} x={p.x - (x.p === "teclado" ? 150 : 0)} y={p.y + (x.p === "teclado" ? 4 : -34)} at={x.at} text={x.nome} color={C.text} size={22} />;
      })}
      {generico > 0.01 ? <Label x={pG.x} y={pG.y + 36} at={tPeca} text={recusa ? "✕ NÃO RECONHECIDA" : "PEÇA GENÉRICA"} color={recusa ? C.accent : C.text} size={24} /> : null}
      <Tags top={540} items={[{ text: "CHIP PRÓPRIO + CIFRADO", at: tCif, on: true }]} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 6. O VOTO (zerésima + RDV embaralhado) ───────────────────────── */
const CELS = 24; // tabela do RDV: 6 × 4
const Votos: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const tZer = w("zerésima");
  const tVazia = w("vazia");
  const tCada = w("Cada");
  const tReg = w("Registro");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([-0.1, 3.2, 9.8], [0.3, 3.2, 9.6], t), [0.1, 0.4, -0.2]);
  const papel = easeOut(f, tZer - 6, tZer + 16) * 0.5;
  const sai = ease(f, tCada - 10, tCada);
  // 8 votos caem em casas sorteadas da tabela (ordem embaralhada)
  const casas = Array.from({ length: CELS }, (_, i) => i).sort((a, b) => rand(a + 3) - rand(b + 3));
  const tab = (i: number): V3 => [0.65 + (i % 6) * 0.17, 0.06, -0.45 + Math.floor(i / 6) * 0.17];
  const votos = Array.from({ length: 8 }, (_, k) => {
    const de = tCada + 4 + k * 5;
    const alvo = tab(casas[k]);
    const ini: V3 = [-0.13, 0.62, 0.15];
    const q = ease(f, de, de + 12);
    const p = lerp3(ini, alvo, q);
    return { k, de, p: [p[0], p[1] + Math.sin(Math.PI * q) * 0.5, p[2]] as V3, chegou: q >= 1 };
  });
  const pZ = projetar([-0.97, 0.62 + papel * 0.5, -0.36], c);
  const pTab = projetar([1.07, 0.06, -0.62], c);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Urna position={[-0.55, 0, 0]} luz={{ impressora: f >= tZer && f < tCada ? 1 : 0 }} />
        {/* zerésima saindo da impressora */}
        {papel > 0.01 ? (
          <RoundBox size={[0.26, papel, 0.01]} radius={0.004} position={[-0.97, 0.56 + papel / 2, -0.3]} rotation={[-0.2, 0, 0]} color="#f2f1ec" opacity={1 - sai * 0.6} />
        ) : null}
        {/* tabela do RDV */}
        {Array.from({ length: CELS }, (_, i) => (
          <RoundBox key={i} size={[0.14, 0.02, 0.14]} radius={0.01} position={tab(i)} scale={pop(f, tReg - 10 + i * 0.5)} color="#5a5955" />
        ))}
        {votos.map((v) =>
          f >= v.de ? (
            <RoundBox key={v.k} size={[0.1, 0.07, 0.1]} radius={0.015} position={v.chegou ? [v.p[0], 0.1, v.p[2]] : v.p} color={C.accent} glow={0.5} />
          ) : null,
        )}
      </Stage>
      {papel > 0.2 ? <Label x={pZ.x + 30} y={pZ.y - 30} at={tZer} text="ZERÉSIMA: 0 VOTOS" color={C.text} size={22} /> : null}
      <Label x={pTab.x} y={pTab.y - 30} at={tReg} text="RDV · ORDEM EMBARALHADA" color={C.accent} size={22} />
      <Tags top={540} items={[{ text: "PROVA DE QUE ESTÁ VAZIA", at: tVazia, on: f < tCada }, { text: "SEM ORDEM, SEM NOME", at: tReg + 10, on: f >= tReg }]} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 7. ÀS 17H ───────────────────────── */
const Fim: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const t17 = w("17h");
  const tBol = w("boletim");
  const tPorta = w("porta");
  const tMidia = w("mídia");
  const tRede = w("rede");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0.0, 2.8, 8.2], [0.4, 2.8, 8.0], t), [0, 0.8, -0.6]);
  const papel = easeOut(f, tBol, tBol + 20) * 0.55;
  const vaiPorta = ease(f, tPorta - 6, tPorta + 14);
  const porta: V3 = [-1.0, 0, -0.75];
  const papelPos = lerp3([-0.52, 0.56 + papel / 2, -0.3], [porta[0] + 0.06, 1.05, porta[2] + 0.05], vaiPorta);
  // mídia lacrada indo pela rede privada até o prédio da Justiça Eleitoral
  const predio: V3 = [1.0, 0, -1.9];
  const midia = ease(f, tMidia + 2, tRede + 20);
  const mPos = lerp3([0.35, 0.6, 0.2], [predio[0], 1.0, predio[2]], midia);
  const pP = projetar([predio[0], 0.85, predio[2]], c);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Urna position={[-0.1, 0, 0]} luz={{ impressora: f >= tBol && f < tPorta ? 1 : 0 }} />
        {/* porta da seção */}
        <group position={porta} scale={pop(f, tPorta - 10)}>
          <RoundBox size={[0.1, 2.0, 0.12]} radius={0.02} position={[-0.42, 1.0, 0]} color="#8f8c85" />
          <RoundBox size={[0.1, 2.0, 0.12]} radius={0.02} position={[0.42, 1.0, 0]} color="#8f8c85" />
          <RoundBox size={[0.94, 0.1, 0.12]} radius={0.02} position={[0, 2.0, 0]} color="#8f8c85" />
          <RoundBox size={[0.74, 1.9, 0.04]} radius={0.02} position={[0, 0.95, -0.02]} color="#6f6b63" />
        </group>
        {papel > 0.01 ? <RoundBox size={[0.26, papel, 0.01]} radius={0.004} position={papelPos} color="#f2f1ec" /> : null}
        {/* trilha tracejada da rede privada */}
        {Array.from({ length: 14 }, (_, i) => {
          const q = lerp3([0.15, 0.02, 0.4], [predio[0], 0.02, predio[2] + 0.5], (i + 0.5) / 14);
          return (
            <mesh key={i} position={q}>
              <boxGeometry args={[0.05, 0.01, 0.05]} />
              <meshBasicMaterial color={f >= tRede && (i + 0.5) / 14 <= midia ? C.accent : "#5a5955"} />
            </mesh>
          );
        })}
        {/* prédio da Justiça Eleitoral */}
        <group position={predio} scale={0.5 * pop(f, tMidia - 6)}>
          <RoundBox size={[1.5, 0.16, 1.0]} radius={0.03} position={[0, 0.08, 0]} color={C.white} />
          {[-0.55, -0.18, 0.18, 0.55].map((x) => (
            <mesh key={x} position={[x, 0.66, 0.25]} castShadow>
              <cylinderGeometry args={[0.07, 0.07, 1.0, 14]} />
              <Mat color={midia >= 1 ? C.accent : C.white} glow={midia >= 1 ? 0.5 : 0} />
            </mesh>
          ))}
          <RoundBox size={[1.6, 0.18, 1.05]} radius={0.03} position={[0, 1.25, 0]} color={C.white} />
        </group>
        {f >= tMidia && midia < 1 ? <RoundBox size={[0.14, 0.03, 0.1]} radius={0.01} position={[mPos[0], mPos[1] + Math.sin(Math.PI * midia) * 0.5, mPos[2]]} color={C.accent} glow={0.8} /> : null}
      </Stage>
      <Label x={pP.x} y={pP.y - 24} at={tMidia} text="JUSTIÇA ELEITORAL" color={C.textDim} size={20} />
      <DataCard at={t17} label="FIM DA VOTAÇÃO" value="17h" rightLabel="BOLETIM DE URNA" rightValue={f >= tBol ? "5 vias" : ""} />
      <Tags top={540} items={[{ text: "1 VIA NA PORTA", at: tPorta, on: f < tMidia }, { text: "MÍDIA LACRADA · REDE PRIVADA", at: tRede, on: f >= tMidia }]} />
    </AbsoluteFill>
  );
};

export const CENAS_URNA: Record<string, React.FC<CenaProps>> = {
  gancho: Gancho,
  linux: Linux,
  dentro: Dentro,
  liga: Liga,
  pecas: Pecas,
  votos: Votos,
  fim: Fim,
};

export const VIDEO = { id: "Urna", roteiro: roteiro as Roteiro, cenas: CENAS_URNA };
