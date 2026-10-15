import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Stage, Cam } from "../three/Stage";
import { Mannequin, idlePose } from "../three/Mannequin";
import { Coins, Mat, RoundBox } from "../three/Objetos";
import { Callout, DataCard, Label, Tags } from "../ui/Overlays";
import { CenaProps, Roteiro } from "../Explicativo";
import roteiro from "../../../videos/aproximacao/roteiro.json";
import { projetar } from "../projetar";
import { clamp, ease, easeOut, lerp, lerp3, pop } from "../anim";
import { C } from "../theme";

type V3 = [number, number, number];
const cam = (pos: V3, look: V3, fov = 40): Cam => ({ pos, look, fov });

/* ───────────────────────── peças ───────────────────────── */

/** Cartão (1,0 × 0,63), de frente para +Z. `raioX` deixa o plástico transparente e mostra a bobina. */
const Cartao: React.FC<{
  position?: V3;
  rotation?: V3;
  scale?: number;
  color?: string;
  glow?: number;
  raioX?: number;
  bobina?: number;
  chip?: number;
}> = ({ position, rotation, scale = 1, color = C.white, glow = 0, raioX = 0, bobina = 0, chip = 0 }) => {
  const loops = [0, 1, 2];
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <RoundBox size={[1.0, 0.63, 0.025]} radius={0.012} color={color} glow={glow} opacity={1 - raioX * 0.7} />
      <RoundBox
        size={[0.15, 0.115, 0.012]}
        radius={0.01}
        position={[-0.3, 0.04, 0.016]}
        color={chip > 0 ? C.accent : "#b9b7b0"}
        glow={chip * 0.9}
      />
      {raioX > 0.01
        ? loops.map((k) => {
            const w = 0.84 - k * 0.07;
            const h = 0.48 - k * 0.07;
            const on = bobina > 0;
            const col = on ? C.accent : "#8d8b85";
            const t = 0.012;
            const lados: { p: V3; s: V3 }[] = [
              { p: [0, h / 2, 0], s: [w, t, t] },
              { p: [0, -h / 2, 0], s: [w, t, t] },
              { p: [-w / 2, 0, 0], s: [t, h, t] },
              { p: [w / 2, 0, 0], s: [t, h, t] },
            ];
            return lados.map((l, i) => (
              <mesh key={`${k}-${i}`} position={l.p} scale={raioX}>
                <boxGeometry args={l.s} />
                <Mat color={col} glow={on ? bobina * 0.9 : 0} />
              </mesh>
            ));
          })
        : null}
    </group>
  );
};

/** Maquininha em pé, levemente inclinada. Origem no chão; tela de frente para +Z. */
const Maquininha: React.FC<{ position?: V3; rotationY?: number; scale?: number; tela?: number }> = ({
  position = [0, 0, 0],
  rotationY = 0,
  scale = 1,
  tela = 0,
}) => (
  <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
    <group position={[0, 0.72, 0]} rotation={[-0.18, 0, 0]}>
      <RoundBox size={[0.78, 1.4, 0.2]} radius={0.08} color="#3a3936" />
      <RoundBox
        size={[0.62, 0.48, 0.02]}
        radius={0.02}
        position={[0, 0.36, 0.1]}
        color={tela > 0 ? C.accent : "#1d1d1c"}
        glow={tela * 0.8}
      />
      {/* símbolo de aproximação na tela */}
      {[0.07, 0.13, 0.19].map((r) => (
        <mesh key={r} position={[-0.06, 0.36, 0.115]} rotation={[0, 0, -Math.PI / 4]}>
          <torusGeometry args={[r, 0.012, 6, 20, Math.PI / 2]} />
          <meshBasicMaterial color={tela > 0 ? C.ink : "#8d8b85"} />
        </mesh>
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <RoundBox
          key={i}
          size={[0.15, 0.08, 0.02]}
          radius={0.02}
          position={[((i % 3) - 1) * 0.2, -0.05 - Math.floor(i / 3) * 0.14, 0.1]}
          color="#6f6e69"
        />
      ))}
    </group>
  </group>
);

/** Ondas do campo saindo da tela da maquininha (anéis que crescem e somem). */
const Ondas: React.FC<{ position: V3; rotationY?: number; at: number; alcance?: number; forca?: number }> = ({
  position,
  rotationY = 0,
  at,
  alcance = 0.9,
  forca = 1,
}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const liga = interpolate(f, [at, at + 12], [0, 1], clamp) * forca;
  return (
    <group position={position} rotation={[-0.18, rotationY, 0]}>
      {[0, 1, 2, 3].map((i) => {
        const ph = (((f - at) / 36 + i / 4) % 1 + 1) % 1;
        return (
          <mesh key={i} position={[0, 0, 0.12 + ph * alcance]}>
            <torusGeometry args={[0.22 + ph * 0.35, 0.012, 6, 48]} />
            <meshBasicMaterial color={C.accent} transparent opacity={(1 - ph) * 0.85 * liga} />
          </mesh>
        );
      })}
    </group>
  );
};

/** Chavinha (a chave secreta do chip). */
const Chave: React.FC<{ position?: V3; rotation?: V3; scale?: number; glow?: number }> = ({ position, rotation, scale = 1, glow = 0.7 }) => (
  <group position={position} rotation={rotation} scale={scale}>
    <mesh>
      <torusGeometry args={[0.1, 0.035, 10, 24]} />
      <Mat color={C.accent} glow={glow} />
    </mesh>
    <mesh position={[0.25, 0, 0]}>
      <boxGeometry args={[0.32, 0.05, 0.04]} />
      <Mat color={C.accent} glow={glow} />
    </mesh>
    {[0.3, 0.38].map((x) => (
      <mesh key={x} position={[x, -0.05, 0]}>
        <boxGeometry args={[0.04, 0.07, 0.04]} />
        <Mat color={C.accent} glow={glow} />
      </mesh>
    ))}
  </group>
);

/** Cubinho de dado que viaja num arco de A até B entre os frames `de` e `ate`. */
const voo = (f: number, a: V3, b: V3, de: number, ate: number, altura = 0.35): V3 => {
  const t = ease(f, de, ate);
  const p = lerp3(a, b, t);
  return [p[0], p[1] + Math.sin(Math.PI * t) * altura, p[2]];
};

/** Pontinho de dado preso a um objeto 3D, com rótulo HTML. */
const Dado3D: React.FC<{ position: V3; color: string; glow?: number; s?: number }> = ({ position, color, glow = 0.6, s = 1 }) => (
  <RoundBox size={[0.13, 0.13, 0.13]} radius={0.025} position={position} scale={s} color={color} glow={glow} />
);

const Etiqueta: React.FC<{ x: number; y: number; texto: string; sub: string; o: number; cor?: string }> = ({ x, y, texto, sub, o, cor = C.text }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      transform: "translate(-50%, -100%)",
      opacity: o,
      textAlign: "center",
      whiteSpace: "nowrap",
    }}
  >
    <div style={{ fontFamily: "'JetBrains Mono'", fontWeight: 700, fontSize: 40, color: cor, letterSpacing: 3 }}>{texto}</div>
    <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 17, letterSpacing: 2, color: C.textDim }}>{sub}</div>
  </div>
);

/* ───────────────────────── 1. GANCHO ───────────────────────── */
const GRADE: V3[] = [
  [-0.56, 1.72, 0],
  [0.56, 1.72, 0],
  [-0.56, 0.98, 0],
  [0.56, 0.98, 0],
];
const Gancho: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const tres = w("Três");
  const bat = w("bateria");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0.3, 1.8, 8.2], [-0.2, 1.65, 7.1], t), [0, 1.3, 0]);
  const raio = ease(f, bat - 4, bat + 12);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        {GRADE.map((p, i) => {
          const ap = pop(f, 3 + i * 3);
          const on = i < 3 && f >= tres + 6 + i * 5;
          const lit = on ? easeOut(f, tres + 6 + i * 5, tres + 16 + i * 5) : 0;
          return (
            <Cartao
              key={i}
              position={[p[0], p[1] + Math.sin((f + i * 20) / 22) * 0.03, p[2]]}
              rotation={[0.05, Math.sin((f + i * 30) / 45) * 0.25, (i % 2 ? 1 : -1) * 0.05]}
              scale={0.92 * ap}
              color={on ? C.accent : C.white}
              glow={0.45 * lit}
              raioX={i === 3 ? raio : 0}
            />
          );
        })}
      </Stage>
      <DataCard at={tres} label="COMPRAS NA MAQUININHA · ABECS" value="76,2" unit="%" rightLabel="POR APROXIMAÇÃO" rightValue="3 de 4" />
      <Callout
        at={bat + 4}
        x={projetar([GRADE[3][0] + 0.3, GRADE[3][1] - 0.2, 0], c).x}
        y={projetar([GRADE[3][0] + 0.3, GRADE[3][1] - 0.2, 0], c).y}
        dx={-230}
        dy={110}
        title="Sem bateria"
        sub="SÓ PLÁSTICO, CHIP E FIO"
      />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 2. A ENERGIA ───────────────────────── */
const TERM2: V3 = [-0.55, 0, -0.1];
const Energia: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const campo = w("campo");
  const antena = w("antena");
  const entra = w("entra");
  const energia = w("energia");
  const chipAt = w("chip");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([1.2, 1.9, 6.6], [0.5, 1.7, 5.7], t), [0.0, 1.05, 0.3]);
  const chega = ease(f, entra - 10, entra + 18);
  const cardPos = lerp3([0.45, 1.45, 1.1], [-0.3, 1.2, 0.95], chega);
  const raio = ease(f, antena - 4, antena + 14);
  const bob = easeOut(f, energia, energia + 10);
  const chip = easeOut(f, chipAt, chipAt + 8);
  const anc = projetar([cardPos[0] + 0.4, cardPos[1] + 0.2, cardPos[2]], c);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Maquininha position={TERM2} rotationY={0.18} scale={pop(f, 2)} tela={chip} />
        <Ondas position={[TERM2[0], 1.08, TERM2[2]]} rotationY={0.18} at={campo} alcance={1.0} />
        <Cartao
          position={cardPos}
          rotation={[0, 0.18 - (1 - chega) * 0.5, 0]}
          scale={pop(f, antena - 18)}
          raioX={raio}
          bobina={bob}
          chip={chip}
        />
      </Stage>
      <Tags
        top={1180}
        items={[
          { text: "CAMPO MAGNÉTICO", at: campo, on: f < energia },
          { text: "VIRA ENERGIA", at: energia, on: f >= energia },
        ]}
      />
      <Callout at={antena + 6} x={anc.x} y={anc.y} dx={-140} dy={-190} title="Antena = bobina de fio" sub="DENTRO DO PLÁSTICO" />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 3. BEM PERTO ───────────────────────── */
const TERM3: V3 = [-0.9, 0, 0];
const ROT3 = 0.95;
const Perto: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const chegar = w("chegar");
  const poucos = w("poucos");
  const freq = w("13,56");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([1.4, 2.2, 6.8], [0.8, 1.95, 5.9], t), [-0.2, 0.95, 0.3]);
  const dir: V3 = [Math.sin(ROT3), 0, Math.cos(ROT3)];
  const tela: V3 = [TERM3[0] + dir[0] * 0.12, 1.08, TERM3[2] + dir[2] * 0.12];
  const dist = lerp(lerp(2.2, 1.3, ease(f, chegar - 6, chegar + 16)), 0.3, ease(f, poucos, poucos + 18));
  const cardPos: V3 = [tela[0] + dir[0] * dist, tela[1] + 0.05, tela[2] + dir[2] * dist];
  const perto = dist < 0.6;
  const lit = interpolate(dist, [0.4, 0.8], [1, 0], clamp);
  const zona = projetar([tela[0] + dir[0] * 0.55, 0.02, tela[2] + dir[2] * 0.55], c);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Maquininha position={TERM3} rotationY={ROT3} tela={lit} />
        <Ondas position={[TERM3[0], 1.08, TERM3[2]]} rotationY={ROT3} at={0} alcance={0.6} />
        {/* zona de alcance no chão */}
        <mesh position={[tela[0] + dir[0] * 0.3, 0.012, tela[2] + dir[2] * 0.3]} rotation={[-Math.PI / 2, 0, -ROT3]}>
          <planeGeometry args={[0.8, 0.6]} />
          <meshBasicMaterial color={C.accent} transparent opacity={0.18 * pop(f, poucos)} />
        </mesh>
        <Cartao
          position={cardPos}
          rotation={[0, ROT3, 0]}
          scale={pop(f, 2)}
          color={perto ? C.white : C.gray}
          chip={lit}
        />
      </Stage>
      <Label x={540} y={560} at={poucos} text="ALCANCE: POUCOS CM" color={C.accent} size={24} />
      <DataCard at={freq} label="FREQUÊNCIA DO NFC" value="13,56" unit="MHz" />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 4. A CONVERSA ───────────────────────── */
const TERM4: V3 = [-0.75, 0, 0];
const CARD4: V3 = [0.4, 1.25, 0.35];
const TELA4: V3 = [-0.75, 1.12, 0.2];
const CHIP4: V3 = [CARD4[0] - 0.27, CARD4[1] + 0.04, CARD4[2] + 0.05];
const Conversa: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const num = w("número");
  const mist = w("mistura");
  const chave = w("chave");
  const dev = w("devolve");
  const compra = w("compra");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([0.2, 2.0, 6.9], [0.0, 1.8, 6.0], t), [0.0, 1.05, 0.2]);
  const nPos = voo(f, TELA4, CHIP4, num, num + 20);
  const nVis = f >= num - 2 && f < mist + 10;
  const nS = f < mist ? pop(f, num - 2) : 1 - ease(f, mist, mist + 10);
  const kPos = lerp3([CARD4[0] + 0.1, CARD4[1] + 0.7, CARD4[2] + 0.1], [CHIP4[0] + 0.12, CHIP4[1] + 0.12, CHIP4[2] + 0.06], ease(f, chave + 6, chave + 22));
  const kS = pop(f, chave - 2) * (1 - ease(f, chave + 22, chave + 30));
  const cPos = voo(f, CHIP4, TELA4, dev + 2, dev + 24, 0.45);
  const cVis = f >= dev - 2;
  const pn = projetar(nPos, c);
  const pc = projetar(cPos, c);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Maquininha position={TERM4} rotationY={0.2} tela={f >= compra ? 1 : 0} />
        <Cartao position={CARD4} rotation={[0, -0.45, 0]} scale={0.9 * pop(f, 3)} chip={f >= mist ? 1 : 0.3} />
        {nVis ? <Dado3D position={nPos} color={C.white} glow={0.2} s={nS} /> : null}
        {kS > 0.01 ? <Chave position={kPos} rotation={[0, -0.25, -0.5]} scale={0.9 * kS} /> : null}
        {cVis ? <Dado3D position={cPos} color={C.accent} glow={0.8} s={pop(f, dev - 2) * 1.2} /> : null}
      </Stage>
      {nVis ? <Etiqueta x={pn.x} y={pn.y - 30} texto="4821" sub="Nº ALEATÓRIO" o={nS} /> : null}
      {cVis ? <Etiqueta x={pc.x} y={pc.y - 34} texto="A7·F3·9C" sub="CÓDIGO SÓ DESTA COMPRA" o={pop(f, dev - 2)} cor={C.accent} /> : null}
      <Tags
        top={540}
        items={[
          { text: "NÚMERO", at: num, on: f < chave },
          { text: "+ CHAVE", at: chave, on: f >= chave && f < dev },
          { text: "= CÓDIGO", at: dev, on: f >= dev },
        ]}
      />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 5. E SE COPIAREM? ───────────────────────── */
const LADRAO: V3 = [-0.25, 0, -2.7];
const MAO: V3 = [-0.35, 1.05, -2.4];
const Copia: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const copiar = w("copiar");
  const prox = w("próxima");
  const velho = w("velho");
  const rec = w("recusado");
  const chave = w("chave");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([-0.1, 2.3, 7.6], [0.3, 2.0, 6.7], t), [0.1, 1.0, -0.4]);
  // cópia: sai da tela da maquininha e vai para a mão do boneco
  const copPos = voo(f, TELA4, MAO, copiar + 2, copiar + 22, 0.3);
  // na próxima compra: número novo vai até o cartão
  const nPos = voo(f, TELA4, CHIP4, prox + 4, prox + 22);
  const nO = pop(f, prox + 2) * (1 - ease(f, velho - 6, velho + 2));
  // código velho volta para a maquininha e é rejeitado (quica e cai)
  const ida = ease(f, velho, rec + 4);
  let vPos = f < velho ? copPos : voo(f, MAO, [TELA4[0] + 0.3, TELA4[1], TELA4[2] + 0.4], velho, rec + 4, 0.2);
  if (f > rec + 4) {
    const k = easeOut(f, rec + 4, rec + 26);
    vPos = [TELA4[0] + 0.3 + k * 0.7, TELA4[1] + 0.4 * Math.sin(Math.PI * k) - k * 1.0, TELA4[2] + 0.4 + k * 0.4];
  }
  const recusa = f >= rec + 2;
  const pisca = recusa && f < rec + 30 ? (Math.floor((f - rec) / 4) % 2 === 0 ? 1 : 0) : 0;
  const pn = projetar(nPos, c);
  const pt = projetar([TELA4[0] + 0.1, TELA4[1] + 0.25, TELA4[2]], c);
  const pk = projetar(CHIP4, c);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Maquininha position={TERM4} rotationY={0.2} tela={pisca} />
        <Cartao position={CARD4} rotation={[0, -0.45, 0]} scale={0.9} chip={1} />
        <Mannequin pose={idlePose(f, 3)} position={LADRAO} rotationY={-0.2} look="dark" scale={0.85 * pop(f, copiar - 10)} />
        {f >= copiar ? <Dado3D position={vPos} color={f >= rec ? "#2a2a28" : C.gray} glow={0} s={pop(f, copiar) * 1.2} /> : null}
        {nO > 0.01 ? <Dado3D position={nPos} color={C.white} glow={0.2} s={nO} /> : null}
        {f >= chave - 4 ? <Chave position={[CHIP4[0] + 0.12, CHIP4[1] + 0.13, CHIP4[2] + 0.06]} rotation={[0, -0.25, -0.5]} scale={0.8 * pop(f, chave - 4)} glow={0.6 + 0.3 * Math.sin(f / 4)} /> : null}
      </Stage>
      {nO > 0.01 ? <Etiqueta x={pn.x} y={pn.y - 30} texto="7350" sub="NÚMERO NOVO" o={nO} /> : null}
      <Callout at={rec + 2} out={chave - 10} x={pt.x} y={pt.y} dx={60} dy={-230} title="Recusado" sub="CÓDIGO JÁ USADO" />
      <Callout at={chave + 2} x={pk.x} y={pk.y} dx={-10} dy={230} title="A chave fica no chip" sub="NÃO DÁ PARA LER DE FORA" />
      <Tags top={540} items={[{ text: "CÓPIA = INÚTIL", at: copiar + 20, on: ida > 0 }]} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 6. O BANCO ───────────────────────── */
const ST: V3[] = [
  [-0.75, 0, 1.2],
  [0.6, 0, -0.5],
  [-0.3, 0, -2.4],
];
const Banco: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const segue = w("segue");
  const conf = w("confere");
  const apr = w("aprova");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([-0.6, 4.2, 9.6], [0.3, 3.6, 8.5], t), [0.0, 0.6, -0.6]);
  const top = (p: V3, h: number): V3 => [p[0], h, p[2]];
  const ida = ease(f, segue, conf + 4);
  const volta = ease(f, apr, apr + 18);
  const caminho = (k: number): V3 => (k < 0.5 ? lerp3(top(ST[0], 1.3), top(ST[1], 1.0), k * 2) : lerp3(top(ST[1], 1.0), top(ST[2], 1.4), (k - 0.5) * 2));
  const pulso = f < apr ? caminho(ida) : caminho(1 - volta);
  const aprovado = volta >= 1;
  const nomes = ["MAQUININHA", "REDE DO CARTÃO", "BANCO"];
  const banco = f >= conf;
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Maquininha position={ST[0]} rotationY={0.15} tela={aprovado ? 1 : 0} scale={0.9} />
        {/* rede: torre de blocos */}
        <group position={ST[1]} scale={pop(f, 4)}>
          {[0, 1, 2].map((i) => (
            <RoundBox key={i} size={[0.6, 0.26, 0.6]} radius={0.05} position={[0, 0.15 + i * 0.3, 0]} color={C.white} />
          ))}
        </group>
        {/* banco: base, colunas e telhado */}
        <group position={ST[2]} scale={pop(f, 7)}>
          <RoundBox size={[1.5, 0.16, 1.0]} radius={0.03} position={[0, 0.08, 0]} color={C.white} />
          {[-0.55, -0.18, 0.18, 0.55].map((x) => (
            <mesh key={x} position={[x, 0.66, 0.25]} castShadow>
              <cylinderGeometry args={[0.07, 0.07, 1.0, 14]} />
              <Mat color={banco ? C.accent : C.white} glow={banco ? 0.5 : 0} />
            </mesh>
          ))}
          <RoundBox size={[1.6, 0.18, 1.05]} radius={0.03} position={[0, 1.25, 0]} color={C.white} />
          <mesh position={[0, 1.5, 0.0]} rotation={[0, Math.PI / 4, 0]} scale={[1, 0.35, 1]} castShadow>
            <coneGeometry args={[1.05, 1, 4]} />
            <Mat color={C.white} />
          </mesh>
        </group>
        {/* trilha tracejada entre as estações */}
        {Array.from({ length: 22 }, (_, i) => {
          const p = caminho(i / 21);
          return (
            <mesh key={i} position={[p[0], 0.02, p[2]]}>
              <boxGeometry args={[0.05, 0.01, 0.05]} />
              <meshBasicMaterial color={i / 21 <= ida ? C.accent : "#5a5955"} />
            </mesh>
          );
        })}
        {f >= segue && !aprovado ? (
          <mesh position={pulso}>
            <sphereGeometry args={[0.11, 16, 12]} />
            <Mat color={C.accent} glow={1} />
          </mesh>
        ) : null}
      </Stage>
      {ST.map((s, i) => {
        const p = projetar([s[0], 0, s[2] + 0.55], c);
        const q = i === 0 ? projetar([s[0], 1.42, s[2]], c) : null;
        return <Label key={i} x={q ? q.x : p.x} y={q ? q.y - 20 : p.y + 24} at={4 + i * 3} text={nomes[i]} color={(i === 2 && banco) || (i === 0 && aprovado) ? C.accent : C.textDim} />;
      })}
      <Tags top={540} items={[{ text: "APROVADO ✓", at: apr + 18, on: true }]} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── 7. E A SENHA? ───────────────────────── */
const COIN_H = 0.062 * 0.9;
const Senha: React.FC<CenaProps> = ({ dur, w }) => {
  const f = useCurrentFrame();
  const t200 = w("200");
  const def = w("definido");
  const banco = w("banco");
  const t = ease(f, 0, dur);
  const c = cam(lerp3([-0.3, 2.1, 7.0], [0.3, 1.9, 6.1], t), [0.15, 0.8, 0]);
  const moedas = Math.round(lerp(0, 14, ease(f, 4, t200)));
  const teto = lerp(14, 8, ease(f, w("usar") - 2, w("usar") + 18));
  const tetoY = 0.035 + teto * COIN_H;
  const visiveis = Math.min(moedas, Math.round(teto));
  const anc = projetar([0.75 - 0.4, tetoY + 0.03, 0.2], c);
  return (
    <AbsoluteFill>
      <Stage cam={c}>
        <Maquininha position={[-0.55, 0, -0.1]} rotationY={0.25} tela={f >= t200 ? 1 : 0} />
        <Coins count={visiveis} position={[0.75, 0, 0.2]} scale={0.9} />
        <RoundBox
          size={[0.8, 0.03, 0.8]}
          radius={0.012}
          position={[0.75, tetoY + 0.03, 0.2]}
          scale={pop(f, t200)}
          color={C.accent}
          glow={0.6}
          opacity={0.85}
        />
        <Mannequin pose={idlePose(f, 9)} position={[0.9, 0, -2.1]} rotationY={-0.4} look="gray" scale={0.85} />
      </Stage>
      <DataCard at={t200} label="SEM SENHA ATÉ" value="R$ 200" rightLabel="SEU BANCO PODE" rightValue={f >= banco ? "menos" : ""} />
      <Callout at={t200 + 8} x={anc.x} y={anc.y} dx={-40} dy={-300} title="Teto da Abecs" sub="FONTE: ABECS (DESDE 2020)" />
      <Tags
        top={1180}
        items={[
          { text: "EMPRESAS DE CARTÃO", at: def, on: f < banco },
          { text: "SEU BANCO", at: banco, on: f >= banco },
        ]}
      />
    </AbsoluteFill>
  );
};

export const CENAS_APROXIMACAO: Record<string, React.FC<CenaProps>> = {
  gancho: Gancho,
  energia: Energia,
  perto: Perto,
  conversa: Conversa,
  copia: Copia,
  banco: Banco,
  senha: Senha,
};

/** Registro do vídeo: o Composicoes.tsx acha este export sozinho (não precisa editar mais nada). */
export const VIDEO = { id: "Aproximacao", roteiro: roteiro as Roteiro, cenas: CENAS_APROXIMACAO };
