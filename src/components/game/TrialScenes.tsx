/** @jsxRuntime classic */
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { TRIAL_STAGES, type Form, type Seed, type TrialStage, type V3 } from "@/game/data";
import { useGame } from "@/game/store";

const outcomeColor: Record<Seed, string> = { nishkama: "#ffe8a0", sakam: "#dc9cff", adharma: "#a31635" };

function Person({ color = "#d9ad78", small = false, kneel = false }: { color?: string; small?: boolean; kneel?: boolean }) {
  const k = small ? 0.65 : 1;
  return (
    <group scale={k} position-y={kneel ? 0.2 : 0} rotation-x={kneel ? -0.45 : 0}>
      <mesh position={[0, 1.05, 0]} castShadow><capsuleGeometry args={[0.3, 0.8, 4, 8]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[0, 1.9, 0]} castShadow><sphereGeometry args={[0.28, 12, 10]} /><meshStandardMaterial color="#dcb48e" /></mesh>
    </group>
  );
}

function Ox({ color = "#806044", small = false }: { color?: string; small?: boolean }) {
  return (
    <group scale={small ? 0.65 : 1}>
      <mesh position={[0, 0.75, 0]} castShadow><boxGeometry args={[1.2, 0.8, 1.8]} /><meshStandardMaterial color={color} roughness={0.9} /></mesh>
      <mesh position={[0, 0.9, -1]}><boxGeometry args={[0.75, 0.7, 0.65]} /><meshStandardMaterial color={color} /></mesh>
      <mesh position={[-0.32, 1.3, -1.1]} rotation-z={-0.5}><coneGeometry args={[0.12, 0.55, 7]} /><meshStandardMaterial color="#e9d7aa" /></mesh>
      <mesh position={[0.32, 1.3, -1.1]} rotation-z={0.5}><coneGeometry args={[0.12, 0.55, 7]} /><meshStandardMaterial color="#e9d7aa" /></mesh>
    </group>
  );
}

function Marker({ active }: { active: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = 3.2 + Math.sin(clock.elapsedTime * 2.4) * 0.25;
    ref.current.rotation.y += 0.02;
  });
  if (!active) return null;
  return <group ref={ref}><mesh><octahedronGeometry args={[0.35, 0]} /><meshStandardMaterial color="#fff0a8" emissive="#ffd86a" emissiveIntensity={4} /></mesh><pointLight color="#ffd86a" intensity={8} distance={9} /></group>;
}

function Trial({ stage, index, active }: { stage: TrialStage; index: number; active: boolean }) {
  const s = useGame();
  const moving = s.phase === "SETUP" && s.encounterSetup?.sceneId === stage.id;
  const performance = s.phase === "PERFORMANCE" && s.performance?.sceneId === stage.id ? s.performance : null;
  const seed = performance?.seed;
  const root = useRef<THREE.Group>(null);
  const actor = useRef<THREE.Group>(null);
  const prop = useRef<THREE.Group>(null);
  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const t = clock.elapsedTime;
    if (root.current) root.current.scale.setScalar(moving ? 1 + Math.sin(t * 6) * 0.025 : 1);
    if (actor.current) {
      actor.current.position.y = moving ? Math.sin(t * 5) * 0.08 : 0;
      if (performance) {
        const progress = THREE.MathUtils.clamp((Date.now() - performance.startedAt) / 4200, 0, 1);
        const direction = seed === "nishkama" ? -1 : seed === "sakam" ? 0.25 : 1;
        actor.current.position.x = THREE.MathUtils.damp(actor.current.position.x, direction * progress * 2.2, 5, dt);
        actor.current.rotation.y += (seed === "sakam" ? 1.7 : seed === "adharma" ? -0.8 : 0.35) * dt;
      }
    }
    if (prop.current) {
      const target = performance ? (seed === "nishkama" ? 1.25 : seed === "sakam" ? 1.05 : 0.45) : 1;
      prop.current.scale.lerp(new THREE.Vector3(target, target, target), 1 - Math.exp(-4 * dt));
      prop.current.rotation.y += performance ? dt * (seed === "adharma" ? 2.4 : 0.7) : 0;
    }
  });

  const kind = stage.kind;
  const isPersonScene = !["calf", "plough", "tiger", "trough"].includes(kind);
  const actorColor = seed ? outcomeColor[seed] : kind === "hunter" ? "#78a8a0" : kind === "tiger" ? "#c86d2d" : "#c5875c";
  return (
    <group ref={root} position={stage.position}>
      <Marker active={active && s.phase === "PLAY"} />
      <mesh position={[0, 0.03, 0]} rotation-x={-Math.PI / 2} receiveShadow><circleGeometry args={[3.4, 24]} /><meshStandardMaterial color={active ? "#665230" : "#40382e"} emissive={active ? "#7b5b16" : "#000000"} emissiveIntensity={0.4} /></mesh>
      <group ref={actor}>
        {isPersonScene ? <Person color={actorColor} kneel={["mercy", "widow", "hunter", "court"].includes(kind)} /> : <Ox color={actorColor} small={kind === "calf"} />}
      </group>
      <group ref={prop}>
        {kind === "battle" && <><mesh position={[1.4, 1.1, 0]}><cylinderGeometry args={[0.09, 0.09, 2.8, 8]} /><meshStandardMaterial color="#f5dfa0" emissive="#fff1af" emissiveIntensity={moving ? 3 : 0.4} /></mesh><mesh position={[-1.5, 0.5, 0]}><boxGeometry args={[2, 0.5, 2.8]} /><meshStandardMaterial color="#795124" /></mesh></>}
        {kind === "mercy" && <mesh position={[1.2, 0.35, 0]} rotation-z={1.2}><cylinderGeometry args={[0.28, 0.36, 1.2, 10]} /><meshStandardMaterial color={seed === "nishkama" ? "#65b9dc" : "#725a45"} emissive={seed === "nishkama" ? "#297fae" : "#000000"} emissiveIntensity={1.5} /></mesh>}
        {kind === "city" && <><mesh position={[-2.2, 2, 0]}><boxGeometry args={[1.1, 4, 1.3]} /><meshStandardMaterial color={seed === "adharma" ? "#7d1515" : "#8b7652"} emissive={seed === "adharma" ? "#8b0c0c" : "#000000"} /></mesh><mesh position={[2.2, 2, 0]}><boxGeometry args={[1.1, 4, 1.3]} /><meshStandardMaterial color={seed === "adharma" ? "#7d1515" : "#8b7652"} /></mesh><mesh position={[0, 3.7, 0]}><boxGeometry args={[3.5, 0.7, 1]} /><meshStandardMaterial color="#8b7652" /></mesh></>}
        {kind === "court" && <><mesh position={[0, 0.08, 0]}><boxGeometry args={[5, 0.12, 1.4]} /><meshStandardMaterial color="#9a233a" /></mesh><group position={[-1.6, 0, 0]}><Person color="#d6a0a8" /></group></>}
        {kind === "famine" && <>{[-1.6, 0, 1.6].map((x, i) => <mesh key={i} position={[x, 1.1, 1]}><cylinderGeometry args={[0.65, 0.8, 2.2, 12]} /><meshStandardMaterial color={seed === "adharma" ? "#55505a" : "#9a733c"} emissive={seed === "nishkama" ? "#c98526" : "#000000"} emissiveIntensity={1.4} /></mesh>)}</>}
        {kind === "trade" && <>{[-0.8, 0.8].map((x) => <mesh key={x} position={[x, 0.35, 1]}><sphereGeometry args={[0.55, 10, 8]} /><meshStandardMaterial color={seed === "adharma" ? "#86817b" : "#d5a23d"} /></mesh>)}</>}
        {kind === "widow" && <>{[-1.5, -0.8, 0.8].map((x) => <group key={x} position={[x, 0, 1]}><Person small color="#b58e64" /></group>)}</>}
        {kind === "temple" && <><mesh position={[0, 0.35, 0]}><boxGeometry args={[4.5, 0.7, 3.2]} /><meshStandardMaterial color={seed === "sakam" ? "#c8a84c" : "#8b8172"} metalness={seed === "sakam" ? 0.8 : 0.1} /></mesh><mesh position={[0, 2, 0]}><coneGeometry args={[2.1, 3, 4]} /><meshStandardMaterial color="#8d6334" /></mesh></>}
        {kind === "calf" && <>{[-1.2, -0.4, 0.4, 1.2].map((x) => <mesh key={x} position={[x, 0.7, 1]}><coneGeometry args={[0.25, 1.4, 5]} /><meshStandardMaterial color={seed === "nishkama" ? "#4b6432" : "#52172c"} /></mesh>)}</>}
        {kind === "plough" && <><mesh position={[1, 0.35, 0]} rotation-y={0.3}><boxGeometry args={[2.4, 0.25, 0.7]} /><meshStandardMaterial color="#6c4928" /></mesh><group position={[-1.7, 0, 0]}><Person color="#8f633b" kneel={seed === "adharma"} /></group></>}
        {kind === "tiger" && <><mesh position={[1.5, 0.55, 0]}><boxGeometry args={[1.6, 0.7, 0.65]} /><meshStandardMaterial color="#d67a2c" emissive={seed === "adharma" ? "#8b1b12" : "#000000"} /></mesh><group position={[-1.5, 0, 0]}><Ox small color="#9c7755" /></group></>}
        {kind === "trough" && <><mesh position={[0, 0.35, 1]}><boxGeometry args={[3.2, 0.7, 1.2]} /><meshStandardMaterial color="#4b7fa2" emissive="#1e5a78" emissiveIntensity={1} /></mesh><group position={[-1.5, 0, -0.5]}><Ox color="#655044" /></group></>}
        {kind === "teaching" && <>{[-1, 0, 1].map((x, i) => <mesh key={x} position={[x, 2.4 + i * 0.3, 0]}><sphereGeometry args={[0.16, 10, 8]} /><meshStandardMaterial color="#ffe298" emissive="#ffc95b" emissiveIntensity={3} /></mesh>)}</>}
        {kind === "hunter" && <><mesh position={[0, 0.12, 1]} rotation-x={-Math.PI / 2}><ringGeometry args={[1, 1.4, 24]} /><meshBasicMaterial color={seed === "adharma" ? "#52101c" : "#82dbcf"} transparent opacity={0.7} /></mesh></>}
        {kind === "debate" && <mesh position={[0, 1.3, 1]} rotation-x={Math.PI / 2}><cylinderGeometry args={[0.08, 0.3, 4, 8]} /><meshStandardMaterial color={seed === "adharma" ? "#342347" : "#ffd477"} emissive={seed === "adharma" ? "#000000" : "#ffd477"} emissiveIntensity={2} /></mesh>}
        {kind === "palace" && <><mesh position={[0, 2.3, 0]} rotation-y={Math.PI / 4}><octahedronGeometry args={[0.55, 0]} /><meshStandardMaterial color={seed === "nishkama" ? "#f5e1ad" : "#d76bd4"} emissive={seed === "adharma" ? "#a41353" : "#ffd46a"} emissiveIntensity={3} /></mesh><mesh position={[1.7, 0.6, 0]}><boxGeometry args={[2.2, 1.2, 1.2]} /><meshStandardMaterial color="#8f3f69" metalness={0.5} /></mesh></>}
      </group>
      {(moving || performance) && <pointLight position={[0, 2.4, 0]} color={seed ? outcomeColor[seed] : "#ffe5a0"} intensity={performance ? 12 : 6} distance={10} />}
    </group>
  );
}

export function TrialScenes({ form }: { form: Form }) {
  const s = useGame();
  const stages = useMemo(() => TRIAL_STAGES[form], [form]);
  return <group>{stages.map((stage, index) => <Trial key={stage.id} stage={stage} index={index} active={index === s.trialIndex} />)}</group>;
}