/** @jsxRuntime classic */
import "@/game/r3f-devtag-patch";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ANIMAL, FORMS, GROUND, MERCHANT, PRINCE, SAGE, SIL_POS, START, type V3 } from "@/game/data";
import {
  getState,
  hurt,
  mokshaReady,
  openDialogue,
  openSilo,
  reachPool,
  rotateMirror,
  transferMerit,
  useGame,
} from "@/game/store";
import { setNear, type Near } from "@/game/proximity";
import { consumeJump, readInput } from "@/game/input";
import { sfx } from "@/game/audio";

const GRAVITY = 26;
const v3 = (p: V3) => new THREE.Vector3(p[0], p[1], p[2]);

/* ------------------------------ props ------------------------------ */

function Npc({ position, color = "#e8d3a0" }: { position: V3; color?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 1, 0]} castShadow>
        <capsuleGeometry args={[0.45, 1.1, 6, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0, 2.15, 0]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#f2d7b0" />
      </mesh>
      <pointLight position={[0, 2.5, 0]} color="#ffd48a" intensity={4} distance={8} />
    </group>
  );
}

function Soldiers() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const COUNT = 5000;
  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    const color = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      const side = i < COUNT / 2 ? 1 : -1;
      const j = i % (COUNT / 2);
      const col = j % 50;
      const row = Math.floor(j / 50);
      o.position.set((col - 25) * 1.1, 0.6, side === 1 ? 20 + row * 0.9 : -20 - row * 0.9);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, color.set(side === 1 ? "#c9a24a" : "#8a3030"));
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <boxGeometry args={[0.5, 1.2, 0.5]} />
      <meshStandardMaterial />
    </instancedMesh>
  );
}

function PrinceWorld() {
  return (
    <group>
      <Soldiers />
      <Npc position={PRINCE.mentor} color="#c84a3a" />
      <mesh position={[PRINCE.mentor[0], 0.8, PRINCE.mentor[2] - 2.5]} castShadow>
        <boxGeometry args={[3, 1.6, 2]} />
        <meshStandardMaterial color="#7a5a2a" metalness={0.4} />
      </mesh>
    </group>
  );
}

function MerchantWorld() {
  const s = useGame();
  return (
    <group>
      <Npc position={MERCHANT.elder} color="#d8c8a8" />
      {MERCHANT.silos.map((p, i) => (
        <group key={i} position={p}>
          <mesh position={[0, 3, 0]} castShadow>
            <cylinderGeometry args={[2, 2, 6, 20]} />
            <meshStandardMaterial color={s.silosOpened[i] ? "#e8c070" : "#7a6040"} emissive={s.silosOpened[i] ? "#a07020" : "#000"} emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0, 6.6, 0]}>
            <coneGeometry args={[2.3, 1.4, 20]} />
            <meshStandardMaterial color="#5a3a20" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function AnimalWorld() {
  return (
    <group>
      <Npc position={ANIMAL.calf} color="#b08a60" />
      {ANIMAL.hazards.map((h, i) => (
        <mesh key={i} position={[h.x, 0.35, h.z]}>
          <boxGeometry args={[h.w, 0.7, h.d]} />
          <meshStandardMaterial color="#2a0a10" emissive="#7a1330" emissiveIntensity={0.8} transparent opacity={0.85} />
        </mesh>
      ))}
      {ANIMAL.platforms.map((p, i) => (
        <mesh key={i} position={[p.x, p.y / 2, p.z]} castShadow receiveShadow>
          <boxGeometry args={[p.w, p.y, p.d]} />
          <meshStandardMaterial color="#6a5a40" />
        </mesh>
      ))}
      <mesh position={[ANIMAL.pool[0], 0.05, ANIMAL.pool[2]]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[4, 32]} />
        <meshStandardMaterial color="#3a7ab0" emissive="#1a4a80" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

function SageWorld() {
  const s = useGame();
  return (
    <group>
      <Npc position={SAGE.disciple} color="#e8a040" />
      <mesh position={SAGE.source}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial color="#fff2c0" emissive="#ffd060" emissiveIntensity={3} />
      </mesh>
      {SAGE.mirrors.map((p, i) => (
        <group key={i} position={p} rotation-y={(s.mirrors[i] * Math.PI) / 2}>
          <mesh>
            <boxGeometry args={[1.8, 2.2, 0.15]} />
            <meshStandardMaterial color="#cfe0ff" metalness={0.9} roughness={0.1} emissive={s.mirrors[i] === SAGE.solution[i] ? "#ffd060" : "#203050"} emissiveIntensity={0.6} />
          </mesh>
        </group>
      ))}
      <mesh position={SAGE.crystal}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#a0e0ff" emissive={s.lightAligned ? "#ffe080" : "#204060"} emissiveIntensity={s.lightAligned ? 3 : 0.5} />
      </mesh>
      {mokshaReady(s) && (
        <mesh position={[SAGE.spirit[0], 2, SAGE.spirit[2]]}>
          <sphereGeometry args={[1.4, 24, 24]} />
          <meshStandardMaterial
            color={s.spiritFill >= 100 ? "#ffe9a0" : "#1a1030"}
            emissive="#ffd060"
            emissiveIntensity={s.spiritFill / 40}
            transparent
            opacity={0.85}
          />
        </mesh>
      )}
    </group>
  );
}

function Silhouette() {
  return (
    <mesh position={SIL_POS}>
      <capsuleGeometry args={[0.6, 4, 6, 12]} />
      <meshBasicMaterial color="#000000" />
    </mesh>
  );
}

function Meteor() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, d) => {
    if (!ref.current) return;
    ref.current.position.y = Math.max(1, ref.current.position.y - d * 22);
    ref.current.rotation.x += d * 3;
  });
  return (
    <mesh ref={ref} position={[0, 60, 0]}>
      <dodecahedronGeometry args={[3.2, 0]} />
      <meshStandardMaterial color="#2a0505" emissive="#ff3b1f" emissiveIntensity={2.5} />
    </mesh>
  );
}

/* ------------------------------ player ------------------------------ */

type Target = { near: NonNullable<Near>; pos: THREE.Vector3; radius: number; act: () => void; hold?: boolean };

function targets(): Target[] {
  const s = getState();
  const t: Target[] = [];
  const talk = (id: string, pos: V3, label: string) => {
    if (!s.talked[id]) t.push({ near: { kind: "npc", id, label }, pos: v3(pos), radius: 3.5, act: () => openDialogue(id) });
  };
  if (s.form === "prince") talk("mentor", PRINCE.mentor, `Speak with Drona`);
  if (s.form === "merchant") {
    talk("elder", MERCHANT.elder, "Hear the village elder");
    if (s.silosUnlocked)
      MERCHANT.silos.forEach((p, i) => {
        if (!s.silosOpened[i]) t.push({ near: { kind: "silo", id: `silo${i}`, label: "Open the silo" }, pos: v3(p), radius: 4, act: () => openSilo(i) });
      });
  }
  if (s.form === "animal") {
    talk("calf", ANIMAL.calf, "Approach the calf");
    t.push({ near: { kind: "pool", id: "pool", label: "Drink from the pool" }, pos: v3(ANIMAL.pool), radius: 4, act: reachPool });
  }
  if (s.form === "sage") {
    talk("disciple", SAGE.disciple, "Answer your disciple");
    if (!s.lightAligned)
      SAGE.mirrors.forEach((p, i) =>
        t.push({ near: { kind: "mirror", id: `m${i}`, label: "Turn the mirror" }, pos: v3(p), radius: 3, act: () => rotateMirror(i) }),
      );
    if (mokshaReady(s))
      t.push({ near: { kind: "spirit", id: "spirit", label: "Hold E: give all merit" }, pos: v3(SAGE.spirit), radius: 4.5, act: () => transferMerit(1.5), hold: true });
  }
  if (s.silhouetteVisible && !s.silhouetteMet)
    t.push({ near: { kind: "npc", id: "silhouette", label: "Approach the figure" }, pos: v3(SIL_POS), radius: 5, act: () => openDialogue("silhouette") });
  return t;
}

function Player() {
  const s = useGame();
  const g = useRef<THREE.Group>(null);
  const vel = useRef(new THREE.Vector3());
  const grounded = useRef(true);
  const prevE = useRef(false);
  const invuln = useRef(0);
  const info = FORMS[s.form];

  useEffect(() => {
    g.current?.position.set(START[0], START[1], START[2]);
    vel.current.set(0, 0, 0);
  }, [s.respawnKey]);

  useFrame(({ camera }, rawDelta) => {
    const p = g.current;
    if (!p) return;
    const d = Math.min(rawDelta, 0.05);
    const st = getState();
    const inp = readInput();
    const canMove = st.phase === "PLAY" && !st.cataclysm;

    const dir = new THREE.Vector3((inp.right ? 1 : 0) - (inp.left ? 1 : 0), 0, (inp.down ? 1 : 0) - (inp.up ? 1 : 0));
    if (!canMove) dir.set(0, 0, 0);
    if (dir.lengthSq() > 0) dir.normalize().multiplyScalar(info.speed);
    vel.current.x = dir.x;
    vel.current.z = dir.z;
    const jump = consumeJump();
    if (canMove && jump && grounded.current && info.jump > 0) {
      vel.current.y = info.jump;
      grounded.current = false;
      sfx.jump();
    }
    vel.current.y -= GRAVITY * d;
    p.position.addScaledVector(vel.current, d);
    const half = GROUND / 2 - 1;
    p.position.x = THREE.MathUtils.clamp(p.position.x, -half, half);
    p.position.z = THREE.MathUtils.clamp(p.position.z, -half, half);

    // floor & platforms
    let floor = 0.7;
    if (st.form === "animal")
      for (const pl of ANIMAL.platforms)
        if (Math.abs(p.position.x - pl.x) < pl.w / 2 && Math.abs(p.position.z - pl.z) < pl.d / 2 && p.position.y >= pl.y + 0.2) floor = pl.y + 0.7;
    if (p.position.y <= floor) {
      p.position.y = floor;
      vel.current.y = 0;
      grounded.current = true;
    }

    // thorn hazards
    invuln.current = Math.max(0, invuln.current - d);
    if (canMove && st.form === "animal" && invuln.current === 0 && p.position.y < 1.2) {
      for (const h of ANIMAL.hazards)
        if (Math.abs(p.position.x - h.x) < h.w / 2 && Math.abs(p.position.z - h.z) < h.d / 2) {
          invuln.current = 1.2;
          hurt();
          break;
        }
    }

    // interaction
    let best: Target | null = null;
    let bestD = Infinity;
    for (const t of targets()) {
      const dist = Math.hypot(p.position.x - t.pos.x, p.position.z - t.pos.z);
      if (dist < t.radius && dist < bestD) {
        best = t;
        bestD = dist;
      }
    }
    setNear(canMove && best ? best.near : null);
    const pressed = inp.interact && !prevE.current;
    prevE.current = inp.interact;
    if (canMove && best && (best.hold ? inp.interact : pressed)) best.act();
    // auto-trigger pool when walked into
    if (canMove && st.form === "animal" && Math.hypot(p.position.x - ANIMAL.pool[0], p.position.z - ANIMAL.pool[2]) < 3) reachPool();

    // camera
    const target = p.position.clone().add(new THREE.Vector3(0, 9, 14));
    camera.position.lerp(target, 1 - Math.exp(-4 * d));
    if (st.cataclysm) camera.position.add(new THREE.Vector3((Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 0.9, 0));
    camera.lookAt(p.position.x, p.position.y + 1.4, p.position.z);
  });

  const color = { prince: "#ffd479", merchant: "#e0b060", animal: "#8a6a4a", sage: "#fff2d0" }[s.form];
  return (
    <group ref={g} position={START}>
      <mesh castShadow>
        {s.form === "animal" ? <boxGeometry args={[1.6, 1.1, 2.2]} /> : <sphereGeometry args={[0.7, 28, 28]} />}
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={s.form === "animal" ? 0.2 : 1.6} />
      </mesh>
      <pointLight color={color} intensity={10} distance={18} />
    </group>
  );
}

/* ------------------------------ scene ------------------------------ */

function Scene() {
  const s = useGame();
  const info = FORMS[s.form];
  const sky = s.cataclysm ? "#1a0000" : s.phase === "MOKSHA" ? "#c9a24a" : info.fog;
  const World = useMemo(() => ({ prince: PrinceWorld, merchant: MerchantWorld, animal: AnimalWorld, sage: SageWorld })[s.form], [s.form]);
  return (
    <>
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[sky, 18, 70]} />
      <ambientLight intensity={s.cataclysm ? 0.15 : info.ambient} color={s.cataclysm ? "#ff5555" : "#d8ccff"} />
      <directionalLight position={[14, 22, 10]} intensity={s.cataclysm ? 0.4 : 1.1} castShadow />
      <Stars radius={90} depth={40} count={1200} factor={3} fade speed={0.4} />
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[GROUND, GROUND]} />
        <meshStandardMaterial color={info.ground} roughness={0.9} />
      </mesh>
      <World key={s.levelKey} />
      {s.silhouetteVisible && !s.silhouetteMet && <Silhouette />}
      {s.cataclysm && <Meteor />}
      <Player />
    </>
  );
}

export default function GameCanvas() {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 12, 30], fov: 58 }}>
      <Scene />
    </Canvas>
  );
}
