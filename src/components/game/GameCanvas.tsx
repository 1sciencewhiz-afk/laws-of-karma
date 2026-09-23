/** @jsxRuntime classic */
import "@/game/r3f-devtag-patch";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, Stars } from "@react-three/drei";
import React, { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Loka } from "@/game/data";
import { STORY_TREES } from "@/game/data";
import {
  addHiddenKarma,
  currentLoka,
  damage,
  getState,
  openDialogue,
  reachPortal,
  resolveCataclysm,
  spendKarma,
  triggerCataclysm,
  useGame,
} from "@/game/store";
import { setNear } from "@/game/proximity";
import { consumeJump, readInput } from "@/game/input";
import { sfx } from "@/game/audio";

const GRAVITY = 26;
const SIL_POS = new THREE.Vector3(-26, 2.6, -26);

/* ------------------------------- world ------------------------------- */

function Ground({ loka }: { loka: Loka }) {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[loka.ground.w, loka.ground.d, 32, 32]} />
        <meshStandardMaterial color={loka.groundColor} roughness={0.85} metalness={0.15} />
      </mesh>
      <gridHelper args={[loka.ground.w, 35, "#6b5cff", "#3c3270"]} position={[0, 0.02, 0]} />
    </group>
  );
}

function Platforms({ loka }: { loka: Loka }) {
  return (
    <group>
      {loka.platforms.map((p, i) => (
        <mesh key={i} position={[p.x, p.y / 2, p.z]} castShadow receiveShadow>
          <boxGeometry args={[p.w, p.y, p.d]} />
          <meshStandardMaterial color="#3b3270" roughness={0.6} emissive="#241d4d" emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Hazards({ loka, cleared }: { loka: Loka; cleared: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime();
      ref.current.children.forEach((c, i) => {
        c.position.y = 0.35 + Math.sin(t * 2 + i) * 0.08;
      });
    }
  });
  if (cleared) return null;
  return (
    <group ref={ref}>
      {loka.hazards.map((h, i) => (
        <mesh key={i} position={[h.x, 0.35, h.z]}>
          <boxGeometry args={[h.w, 0.7, h.d]} />
          <meshStandardMaterial
            color="#1a0620"
            emissive={h.forbidden ? "#4b0f4b" : "#7a1330"}
            emissiveIntensity={0.9}
            roughness={0.4}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
    </group>
  );
}

function SpiritMesh({ position, progress, dissolved }: { position: [number, number, number]; progress: number; dissolved: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.6;
    ref.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * 1.4) * 0.15;
    const target = dissolved ? 0 : 1;
    ref.current.scale.lerp(new THREE.Vector3(target, target, target), 1 - Math.exp(-3 * delta));
  });
  const glow = 0.2 + progress * 2.4;
  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <capsuleGeometry args={[0.9, 2.1, 6, 16]} />
        <meshStandardMaterial color="#0d0718" emissive="#f4c66a" emissiveIntensity={glow} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.9, 0]}>
        <sphereGeometry args={[0.55, 20, 20]} />
        <meshStandardMaterial color="#14091f" emissive="#ffe0a3" emissiveIntensity={glow * 1.4} />
      </mesh>
      <pointLight color="#ffcf87" intensity={progress * 14} distance={16} />
      {dissolved && (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.2, 0]}>
          <ringGeometry args={[1.6, 2.6, 40]} />
          <meshBasicMaterial color="#ffd89b" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function Portal({ position, open }: { position: [number, number, number]; open: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * (open ? 1.6 : 0.2);
  });
  return (
    <group position={position}>
      <mesh ref={ref}>
        <torusGeometry args={[2.2, 0.28, 16, 48]} />
        <meshStandardMaterial
          color={open ? "#ffe3ab" : "#2d2352"}
          emissive={open ? "#ffc861" : "#3a2d6b"}
          emissiveIntensity={open ? 2.4 : 0.4}
        />
      </mesh>
      <mesh>
        <circleGeometry args={[2.1, 40]} />
        <meshBasicMaterial color={open ? "#f8e2b4" : "#140d2a"} transparent opacity={open ? 0.45 : 0.25} side={THREE.DoubleSide} />
      </mesh>
      {open && <pointLight color="#ffd28a" intensity={10} distance={20} />}
    </group>
  );
}

function NpcMesh({ position, talking }: { position: [number, number, number]; talking: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * 1.8) * 0.1;
  });
  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.5, 0.8, 1.9, 12]} />
        <meshStandardMaterial color="#4e3a7a" emissive="#6d55b8" emissiveIntensity={0.5} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.4, 0]} castShadow>
        <sphereGeometry args={[0.45, 18, 18]} />
        <meshStandardMaterial color="#d9c7a1" emissive="#8a6f3c" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <sphereGeometry args={[0.22, 14, 14]} />
        <meshBasicMaterial color={talking ? "#fff0c4" : "#8fe3ff"} />
      </mesh>
      <pointLight color="#9fd8ff" intensity={2.5} distance={8} />
    </group>
  );
}

function Silhouette() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.2) * 0.2;
  });
  return (
    <group ref={ref} position={SIL_POS.toArray()}>
      <mesh>
        <capsuleGeometry args={[0.7, 3.6, 6, 14]} />
        <meshStandardMaterial color="#05030a" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

const DECOR = [
  [-24, -8, 1.8],
  [20, -18, 2.4],
  [-18, 24, 1.4],
  [26, 12, 2.0],
  [6, -26, 2.8],
  [-30, 4, 1.6],
  [14, 26, 1.2],
] as const;

function Decor() {
  return (
    <group>
      {DECOR.map(([x, z, r], i) => (
        <mesh key={i} position={[x, r * 0.45, z]} rotation-y={i} castShadow receiveShadow>
          <dodecahedronGeometry args={[r, 0]} />
          <meshStandardMaterial color="#332a5e" roughness={0.95} emissive="#5b3fa8" emissiveIntensity={0.25} />
        </mesh>
      ))}
    </group>
  );
}

function Dust() {
  const positions = useMemo(() => {
    const arr = new Float32Array(600 * 3);
    for (let i = 0; i < 600; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 70;
      arr[i * 3 + 1] = Math.random() * 18;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 70;
    }
    return arr;
  }, []);
  const ref = useRef<THREE.Points>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.02;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#cbb8ff" size={0.12} sizeAttenuation transparent opacity={0.6} />
    </points>
  );
}

function CoOpAlly({ playerRef }: { playerRef: React.RefObject<THREE.Group | null> }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }, delta) => {
    if (!ref.current || !playerRef.current) return;
    const t = clock.getElapsedTime();
    const p = playerRef.current.position;
    const target = new THREE.Vector3(p.x + Math.cos(t * 1.2) * 2.6, p.y + 1.2 + Math.sin(t * 2) * 0.2, p.z + Math.sin(t * 1.2) * 2.6);
    ref.current.position.lerp(target, 1 - Math.exp(-6 * delta));
  });
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.45, 20, 20]} />
        <meshStandardMaterial color="#bfe9ff" emissive="#7ad3ff" emissiveIntensity={2.2} />
      </mesh>
      <pointLight color="#7ad3ff" intensity={5} distance={10} />
    </group>
  );
}

/* ------------------------------ player ------------------------------- */

function topUnder(loka: Loka, x: number, z: number) {
  let top = 0;
  for (const p of loka.platforms) {
    if (Math.abs(x - p.x) <= p.w / 2 && Math.abs(z - p.z) <= p.d / 2) top = Math.max(top, p.y);
  }
  return top;
}

function PlayerRig({ groupRef }: { groupRef: React.RefObject<THREE.Group | null> }) {
  const vel = useRef(new THREE.Vector3());
  const grounded = useRef(true);
  const interactWasDown = useRef(false);
  const visitedForbidden = useRef<Set<number>>(new Set());
  const cataclysmAt = useRef<number | null>(null);
  const invulnUntil = useRef(0);
  const shake = useRef({ x: 0, y: 0 });
  const state = useGame();
  const loka = currentLoka();

  // respawn / level change
  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.position.set(loka.start[0], loka.start[1], loka.start[2]);
    vel.current.set(0, 0, 0);
    visitedForbidden.current.clear();
  }, [state.respawnKey, state.levelKey, loka, groupRef]);

  useFrame(({ camera }, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const g = groupRef.current;
    if (!g) return;
    const s = getState();
    const active = s.phase === "WORLD_ACTION" && !s.cataclysm;
    const input = readInput();

    // ---- movement
    const speed = s.form === "jiva" ? 12 : 5.5;
    let dx = 0;
    let dz = 0;
    if (active) {
      if (input.up) dz -= 1;
      if (input.down) dz += 1;
      if (input.left) dx -= 1;
      if (input.right) dx += 1;
      const len = Math.hypot(dx, dz) || 1;
      dx = (dx / len) * speed;
      dz = (dz / len) * speed;
    }
    vel.current.x += (dx - vel.current.x) * (1 - Math.exp(-12 * delta));
    vel.current.z += (dz - vel.current.z) * (1 - Math.exp(-12 * delta));

    // ---- jump
    if (active && s.form === "jiva" && grounded.current && consumeJump()) {
      vel.current.y = 11;
      grounded.current = false;
      sfx.jump();
    } else if (!active || s.form === "tortoise") {
      consumeJump();
    }

    vel.current.y -= GRAVITY * delta;
    g.position.x += vel.current.x * delta;
    g.position.z += vel.current.z * delta;
    g.position.y += vel.current.y * delta;

    const half = loka.ground.w / 2 - 1.5;
    g.position.x = THREE.MathUtils.clamp(g.position.x, -half, half);
    g.position.z = THREE.MathUtils.clamp(g.position.z, -half, half);

    const floor = topUnder(loka, g.position.x, g.position.z) + (s.form === "jiva" ? 1.0 : 0.6);
    if (g.position.y <= floor) {
      g.position.y = floor;
      vel.current.y = 0;
      grounded.current = true;
    }

    // ---- hazards
    if (active && !s.hazardsCleared) {
      loka.hazards.forEach((h, i) => {
        const inside =
          Math.abs(g.position.x - h.x) <= h.w / 2 && Math.abs(g.position.z - h.z) <= h.d / 2 && g.position.y <= 1.6;
        if (!inside) return;
        if (h.forbidden && !visitedForbidden.current.has(i)) {
          visitedForbidden.current.add(i);
          addHiddenKarma(3);
        }
        if (s.form === "jiva" && performance.now() > invulnUntil.current) {
          invulnUntil.current = performance.now() + 1200;
          damage(35);
        }
      });
    }

    // ---- proximity / interaction
    const dist = (p: THREE.Vector3Like) => g.position.distanceTo(new THREE.Vector3(p.x, g.position.y, p.z));
    const spiritV = new THREE.Vector3(...loka.spirit);
    let near: Parameters<typeof setNear>[0] = null;

    if (active) {
      const nearSpirit = !s.portalOpen && dist(spiritV) < 4.2;
      const npc = loka.npcs.find((n) => dist({ x: n.x, y: 0, z: n.z } as THREE.Vector3Like) < 3.4);
      const nearSil = s.silhouetteVisible && !s.silhouetteMet && dist(SIL_POS) < 4;
      const nearPortal = s.portalOpen && dist(new THREE.Vector3(...loka.portal)) < 3;

      if (nearSpirit) near = { kind: "spirit", id: "spirit", label: "Shadow Barrier Spirit — hold E to sacrifice karma" };
      else if (npc) near = { kind: "npc", id: npc.id, label: `${npc.label} — press E to speak` };
      else if (nearSil) near = { kind: "silhouette", id: "silhouette", label: "??? — press E" };
      else if (nearPortal) near = { kind: "portal", id: "portal", label: "Exit portal" };

      const pressed = input.interact && !interactWasDown.current;

      if (nearSpirit && input.interact) {
        spendKarma(42 * delta);
        if (Math.random() < delta * 6) sfx.karma();
      }
      if (npc && pressed && STORY_TREES[npc.treeId]) openDialogue(npc.treeId);
      if (nearSil && pressed) openDialogue("silhouette");
      if (nearPortal) reachPortal();
    }
    setNear(near);
    interactWasDown.current = input.interact;

    // ---- hidden doom timer
    if (s.doomAt && Date.now() >= s.doomAt) triggerCataclysm();
    if (s.cataclysm) {
      if (cataclysmAt.current === null) cataclysmAt.current = performance.now();
      else if (performance.now() - cataclysmAt.current > 3200) {
        cataclysmAt.current = null;
        resolveCataclysm();
      }
    } else {
      cataclysmAt.current = null;
    }

    // ---- camera follow
    const offset = new THREE.Vector3(0, 9, 14);
    const target = g.position.clone().add(offset);
    camera.position.lerp(target, 1 - Math.exp(-4 * delta));
    const look = g.position.clone();
    look.y += 1.4;
    camera.lookAt(look);

    // ---- camera shake during cataclysm
    camera.position.x -= shake.current.x;
    camera.position.y -= shake.current.y;
    shake.current = { x: 0, y: 0 };
    if (s.cataclysm) {
      shake.current = { x: (Math.random() - 0.5) * 1.2, y: (Math.random() - 0.5) * 0.9 };
      camera.position.x += shake.current.x;
      camera.position.y += shake.current.y;
    }
  });

  return null;
}

function PlayerMesh({ groupRef }: { groupRef: React.RefObject<THREE.Group | null> }) {
  const state = useGame();
  const innerRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }, delta) => {
    if (innerRef.current) {
      innerRef.current.rotation.y += delta * 1.4;
      if (state.form === "jiva") innerRef.current.position.y = Math.sin(clock.getElapsedTime() * 2.2) * 0.12;
      else innerRef.current.position.y = 0;
    }
  });
  return (
    <group ref={groupRef}>
      {state.form === "jiva" ? (
        <group>
          <mesh ref={innerRef} castShadow>
            <sphereGeometry args={[0.7, 28, 28]} />
            <meshStandardMaterial color="#fff6dd" emissive="#ffd479" emissiveIntensity={2.6} roughness={0.2} />
          </mesh>
          <mesh>
            <sphereGeometry args={[1.15, 20, 20]} />
            <meshBasicMaterial color="#ffd89b" transparent opacity={0.16} />
          </mesh>
          <pointLight color="#ffd28a" intensity={16} distance={22} castShadow />
        </group>
      ) : (
        <group>
          <mesh ref={innerRef} castShadow>
            <sphereGeometry args={[0.95, 22, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#3d5c37" roughness={0.9} metalness={0.05} />
          </mesh>
          <mesh position={[0, -0.15, 0]} castShadow>
            <boxGeometry args={[1.5, 0.35, 1.2]} />
            <meshStandardMaterial color="#5a4630" roughness={1} />
          </mesh>
          <pointLight color="#9ad69a" intensity={2.5} distance={8} />
        </group>
      )}
    </group>
  );
}

/* ------------------------------- scene -------------------------------- */

function Scene() {
  const state = useGame();
  const loka = currentLoka();
  const playerRef = useRef<THREE.Group>(null);
  const skyColor = state.cataclysm ? "#1a0000" : loka.fogColor;

  return (
    <>
      <color attach="background" args={[skyColor]} />
      <fog attach="fog" args={[skyColor, loka.fogNear, loka.fogFar]} />
      <ambientLight intensity={state.cataclysm ? 0.15 : loka.ambient} color={state.cataclysm ? "#ff5555" : "#b9a8ff"} />
      <directionalLight
        position={[14, 22, 10]}
        intensity={state.cataclysm ? 0.4 : 1.1}
        color={state.cataclysm ? "#ff6b4a" : "#cbbcff"}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <Environment>
        <Lightformer intensity={1.6} color="#9f8cff" position={[0, 8, 0]} scale={[14, 14, 1]} />
        <Lightformer intensity={0.9} color="#ffc98a" position={[-8, 3, -6]} rotation-y={Math.PI / 2} scale={[16, 3, 1]} />
      </Environment>
      <Stars radius={90} depth={40} count={1400} factor={3} fade speed={0.4} />
      <Dust />
      <Ground loka={loka} />
      <Decor />
      <Platforms loka={loka} />
      <Hazards loka={loka} cleared={state.hazardsCleared} />
      {loka.npcs.map((n) => (
        <NpcMesh key={n.id} position={[n.x, 1.0, n.z]} talking={state.treeId === n.treeId} />
      ))}
      <SpiritMesh position={loka.spirit} progress={state.spiritKarma / 100} dissolved={state.portalOpen} />
      <Portal position={loka.portal} open={state.portalOpen} />
      {state.silhouetteVisible && <Silhouette />}
      <PlayerMesh groupRef={playerRef} />
      {state.coOpEnabled && <CoOpAlly playerRef={playerRef} />}
      <PlayerRig groupRef={playerRef} />
      {state.cataclysm && <Meteor />}
    </>
  );
}

function Meteor() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.position.y -= delta * 22;
    ref.current.rotation.x += delta * 3;
    if (ref.current.position.y < 1) ref.current.position.y = 1;
  });
  return (
    <mesh ref={ref} position={[0, 60, 0]}>
      <dodecahedronGeometry args={[3.2, 0]} />
      <meshStandardMaterial color="#2a0505" emissive="#ff3b1f" emissiveIntensity={2.5} roughness={0.9} />
    </mesh>
  );
}

export default function GameCanvas() {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 12, 30], fov: 58 }} gl={{ antialias: true }}>
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  );
}
