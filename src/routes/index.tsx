import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Samsara's Spark — Cosmic Karma Platformer" },
      {
        name: "description",
        content:
          "Play Samsara's Spark: guide a glowing Jiva through cosmic lokas, reincarnate between light and tortoise forms, and sacrifice karma to free shadow spirits.",
      },
      { property: "og:title", content: "Samsara's Spark — Cosmic Karma Platformer" },
      {
        property: "og:description",
        content:
          "A 2D karma-balancing platformer: switch forms, dodge shadow thorns, and give away your karma to open the gate.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SamsarasSpark,
});

/* ------------------------------------------------------------------ */
/* Level data — append objects here to add new lokas                   */
/* ------------------------------------------------------------------ */

type Rect = { x: number; y: number; w: number; h: number };

type Loka = {
  id: string;
  name: string;
  subtitle: string;
  hue: number; // background accent hue
  start: { x: number; y: number };
  platforms: Rect[];
  hazards: Rect[]; // ground thorns / shadow spikes
  npc: { x: number; y: number; karmaNeeded: number };
  gate: Rect;
};

const WORLD_W = 960;
const WORLD_H = 540;

const LOKAS_DATA: Loka[] = [
  {
    id: "bhuloka",
    name: "Bhuloka",
    subtitle: "Earthly Realm",
    hue: 262,
    start: { x: 70, y: 380 },
    platforms: [
      { x: 0, y: 470, w: 960, h: 70 },
      { x: 250, y: 380, w: 140, h: 16 },
      { x: 470, y: 310, w: 140, h: 16 },
      { x: 690, y: 385, w: 150, h: 16 },
    ],
    hazards: [
      { x: 330, y: 450, w: 90, h: 20 },
      { x: 560, y: 450, w: 110, h: 20 },
    ],
    npc: { x: 800, y: 420, karmaNeeded: 100 },
    gate: { x: 880, y: 390, w: 50, h: 80 },
  },
  {
    id: "patala",
    name: "Patala",
    subtitle: "Underworld",
    hue: 292,
    start: { x: 60, y: 120 },
    platforms: [
      { x: 0, y: 470, w: 960, h: 70 },
      { x: 0, y: 200, w: 180, h: 16 },
      { x: 250, y: 260, w: 120, h: 16 },
      { x: 430, y: 200, w: 120, h: 16 },
      { x: 300, y: 390, w: 120, h: 16 },
      { x: 610, y: 300, w: 130, h: 16 },
      { x: 780, y: 380, w: 130, h: 16 },
    ],
    hazards: [
      { x: 180, y: 450, w: 140, h: 20 },
      { x: 430, y: 450, w: 160, h: 20 },
      { x: 680, y: 450, w: 120, h: 20 },
    ],
    npc: { x: 830, y: 315, karmaNeeded: 100 },
    gate: { x: 890, y: 300, w: 50, h: 80 },
  },
];

/* ------------------------------------------------------------------ */
/* Tunables                                                            */
/* ------------------------------------------------------------------ */

const FORMS = {
  jiva: { label: "Jiva (Light)", speed: 4.4, jump: 13.2, r: 13, canJump: true, immune: false },
  tortoise: { label: "Tortoise (Earth)", speed: 1.9, jump: 0, r: 17, canJump: false, immune: true },
} as const;

type FormKey = keyof typeof FORMS;

const GRAVITY = 0.62;
const MAX_KARMA = 100;
const SACRIFICE_RATE = 42; // karma per second
const HAZARD_PENALTY = 25;

type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; hue: number };

type Player = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
  form: FormKey;
};

function rectsOverlapCircle(c: { x: number; y: number; r: number }, r: Rect) {
  const nx = Math.max(r.x, Math.min(c.x, r.x + r.w));
  const ny = Math.max(r.y, Math.min(c.y, r.y + r.h));
  const dx = c.x - nx;
  const dy = c.y - ny;
  return dx * dx + dy * dy <= c.r * c.r;
}

function SamsarasSpark() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- React-visible state (HUD) ---
  const [lokaIndex, setLokaIndex] = useState(0);
  const [karma, setKarma] = useState(MAX_KARMA);
  const [npcKarma, setNpcKarma] = useState(0);
  const [form, setForm] = useState<FormKey>("jiva");
  const [gateOpen, setGateOpen] = useState(false);
  const [coOpEnabled, setCoOpEnabled] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState("Reach the gate — but the Shadow bars the way.");
  const [nearNpc, setNearNpc] = useState(false);
  const [completed, setCompleted] = useState(false);

  // --- mutable game refs ---
  const loka = LOKAS_DATA[Math.min(lokaIndex, LOKAS_DATA.length - 1)]!;
  const lokaRef = useRef(loka);
  lokaRef.current = loka;

  const playerRef = useRef<Player>({
    x: loka.start.x,
    y: loka.start.y,
    vx: 0,
    vy: 0,
    grounded: false,
    form: "jiva",
  });
  const allyRef = useRef({ x: loka.start.x - 40, y: loka.start.y });
  const player2PosRef = useRef({ x: 0, y: 0 }); // co-op ready hook (networked player slot)
  const karmaRef = useRef(MAX_KARMA);
  const npcKarmaRef = useRef(0);
  const gateOpenRef = useRef(false);
  const resetTimerRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});
  const touchRef = useRef({ left: false, right: false, jump: false, sacrifice: false });
  const coOpRef = useRef(false);
  const completedRef = useRef(false);
  const timeRef = useRef(0);

  coOpRef.current = coOpEnabled;
  completedRef.current = completed;

  const spawnParticles = useCallback((x: number, y: number, n: number, hue: number) => {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * 3 + 0.6;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 0.6,
        life: 1,
        max: 1,
        hue,
      });
    }
    if (particlesRef.current.length > 600) particlesRef.current.splice(0, 200);
  }, []);

  const loadLoka = useCallback(
    (index: number) => {
      const next = LOKAS_DATA[index];
      if (!next) return;
      lokaRef.current = next;
      playerRef.current = { x: next.start.x, y: next.start.y, vx: 0, vy: 0, grounded: false, form: "jiva" };
      allyRef.current = { x: next.start.x - 40, y: next.start.y };
      karmaRef.current = MAX_KARMA;
      npcKarmaRef.current = 0;
      gateOpenRef.current = false;
      particlesRef.current = [];
      setLokaIndex(index);
      setKarma(MAX_KARMA);
      setNpcKarma(0);
      setGateOpen(false);
      setForm("jiva");
      setCompleted(false);
      setMessage(`${next.name} — ${next.subtitle}. Offer your karma to the Shadow.`);
    },
    [],
  );

  const respawn = useCallback(
    (reason: string) => {
      if (resetTimerRef.current > 0) return;
      const l = lokaRef.current;
      spawnParticles(playerRef.current.x, playerRef.current.y, 40, 45);
      resetTimerRef.current = 1.1;
      setResetting(true);
      setMessage(reason);
      playerRef.current = { ...playerRef.current, x: l.start.x, y: l.start.y, vx: 0, vy: 0, grounded: false };
      karmaRef.current = MAX_KARMA;
      setKarma(MAX_KARMA);
    },
    [spawnParticles],
  );

  const setFormSafe = useCallback((f: FormKey) => {
    playerRef.current.form = f;
    setForm(f);
  }, []);

  // --- keyboard ---
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowleft", "arrowright", "arrowup", "arrowdown", " ", "w", "a", "s", "d"].includes(k)) {
        e.preventDefault();
      }
      keysRef.current[k] = true;
      if (k === "1") setFormSafe("jiva");
      if (k === "2") setFormSafe("tortoise");
    };
    const up = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    const blur = () => {
      keysRef.current = {};
    };
    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [setFormSafe]);

  // --- main loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    let hudAcc = 0;

    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      timeRef.current += dt;
      const frame = dt * 60;

      const l = lokaRef.current;
      const p = playerRef.current;
      const keys = keysRef.current;
      const touch = touchRef.current;
      const cfg = FORMS[p.form];

      if (resetTimerRef.current > 0) {
        resetTimerRef.current = Math.max(0, resetTimerRef.current - dt);
        if (resetTimerRef.current === 0) {
          setResetting(false);
          spawnParticles(p.x, p.y, 30, 50);
        }
      }

      const frozen = resetTimerRef.current > 0 || completedRef.current;

      // ---- input ----
      const left = !frozen && (keys["a"] || keys["arrowleft"] || touch.left);
      const right = !frozen && (keys["d"] || keys["arrowright"] || touch.right);
      const jump = !frozen && (keys["w"] || keys["arrowup"] || keys[" "] || touch.jump);
      const sacrificing = !frozen && (keys["e"] || touch.sacrifice);

      const target = (right ? cfg.speed : 0) - (left ? cfg.speed : 0);
      p.vx += (target - p.vx) * Math.min(1, 0.28 * frame);
      if (Math.abs(p.vx) < 0.02) p.vx = 0;

      if (jump && cfg.canJump && p.grounded) {
        p.vy = -cfg.jump;
        p.grounded = false;
        spawnParticles(p.x, p.y + cfg.r, 10, 48);
      }

      p.vy = Math.min(p.vy + GRAVITY * frame, 18);

      // ---- horizontal collision ----
      p.x += p.vx * frame;
      for (const plat of l.platforms) {
        if (rectsOverlapCircle({ x: p.x, y: p.y, r: cfg.r }, plat)) {
          if (p.x < plat.x + plat.w / 2) p.x = plat.x - cfg.r;
          else p.x = plat.x + plat.w + cfg.r;
          p.vx = 0;
        }
      }
      p.x = Math.max(cfg.r, Math.min(WORLD_W - cfg.r, p.x));

      // ---- vertical collision ----
      p.y += p.vy * frame;
      p.grounded = false;
      for (const plat of l.platforms) {
        if (rectsOverlapCircle({ x: p.x, y: p.y, r: cfg.r }, plat)) {
          if (p.vy >= 0 && p.y <= plat.y + plat.h) {
            p.y = plat.y - cfg.r;
            p.vy = 0;
            p.grounded = true;
          } else if (p.vy < 0) {
            p.y = plat.y + plat.h + cfg.r;
            p.vy = 0;
          }
        }
      }
      if (p.y > WORLD_H + 120) respawn("You fell through the void. Reincarnating…");

      // ---- hazards ----
      if (!cfg.immune && !frozen) {
        for (const hz of l.hazards) {
          if (rectsOverlapCircle({ x: p.x, y: p.y, r: cfg.r }, hz)) {
            karmaRef.current = Math.max(0, karmaRef.current - HAZARD_PENALTY);
            setKarma(karmaRef.current);
            spawnParticles(p.x, p.y, 24, 350);
            if (karmaRef.current <= 0) {
              respawn("Karma exhausted — Reincarnation Reset.");
            } else {
              respawn("The shadow thorns burned you. Reincarnating…");
            }
            break;
          }
        }
      }

      // ---- sacrifice ----
      const dn = Math.hypot(p.x - l.npc.x, p.y - l.npc.y);
      const isNear = dn < 90;
      if (
        sacrificing &&
        isNear &&
        !gateOpenRef.current &&
        karmaRef.current > 0 &&
        npcKarmaRef.current < l.npc.karmaNeeded
      ) {
        const amount = Math.min(SACRIFICE_RATE * dt, karmaRef.current, l.npc.karmaNeeded - npcKarmaRef.current);
        karmaRef.current -= amount;
        npcKarmaRef.current += amount;
        spawnParticles(p.x, p.y - 6, 2, 48);
        if (npcKarmaRef.current >= l.npc.karmaNeeded) {
          gateOpenRef.current = true;
          spawnParticles(l.npc.x, l.npc.y, 70, 48);
          setGateOpen(true);
          setMessage("The Shadow is freed in golden light. The gate is open!");
        }
        if (karmaRef.current <= 0.01) {
          karmaRef.current = 0;
          respawn("You gave all you had — Reincarnation Reset.");
        }
      }

      // ---- gate ----
      if (gateOpenRef.current && !completedRef.current && rectsOverlapCircle({ x: p.x, y: p.y, r: cfg.r }, l.gate)) {
        completedRef.current = true;
        setCompleted(true);
        spawnParticles(l.gate.x + l.gate.w / 2, l.gate.y + 40, 80, 48);
        setMessage(
          lokaIndexHasNext() ? "Loka complete. Step onward to the next realm." : "All lokas transcended. Moksha.",
        );
      }

      // ---- ally (co-op simulation) ----
      const ally = allyRef.current;
      if (coOpRef.current) {
        const tx = p.x - (p.vx >= 0 ? 46 : -46);
        const ty = p.y - 22;
        ally.x += (tx - ally.x) * Math.min(1, 0.08 * frame);
        ally.y += (ty - ally.y) * Math.min(1, 0.08 * frame);
        player2PosRef.current = { x: ally.x, y: ally.y };
        if (Math.random() < 0.25) spawnParticles(ally.x, ally.y, 1, 190);
      }

      // ---- trail ----
      if (p.form === "jiva" && Math.abs(p.vx) > 0.5 && Math.random() < 0.7) {
        spawnParticles(p.x, p.y, 1, 48);
      }

      // ---- particles ----
      const ps = particlesRef.current;
      for (let i = ps.length - 1; i >= 0; i--) {
        const pt = ps[i]!;
        pt.x += pt.vx * frame;
        pt.y += pt.vy * frame;
        pt.vy += 0.03 * frame;
        pt.life -= dt * 1.4;
        if (pt.life <= 0) ps.splice(i, 1);
      }

      // ---- HUD sync (throttled) ----
      hudAcc += dt;
      if (hudAcc > 0.08) {
        hudAcc = 0;
        setKarma(Math.round(karmaRef.current));
        setNpcKarma(Math.round(npcKarmaRef.current));
        setNearNpc(isNear);
      }

      draw(ctx, {
        loka: l,
        player: p,
        ally: coOpRef.current ? ally : null,
        particles: ps,
        npcKarma: npcKarmaRef.current,
        gateOpen: gateOpenRef.current,
        time: timeRef.current,
        resetting: resetTimerRef.current > 0,
      });
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [respawn, spawnParticles]);

  function lokaIndexHasNext() {
    return lokaIndex + 1 < LOKAS_DATA.length;
  }

  const nextLoka = () => {
    if (lokaIndex + 1 < LOKAS_DATA.length) loadLoka(lokaIndex + 1);
    else loadLoka(0);
  };

  const hold = (key: keyof typeof touchRef.current) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      touchRef.current[key] = true;
    },
    onPointerUp: () => {
      touchRef.current[key] = false;
    },
    onPointerLeave: () => {
      touchRef.current[key] = false;
    },
    onPointerCancel: () => {
      touchRef.current[key] = false;
    },
  });

  const npcPct = Math.round((npcKarma / loka.npc.karmaNeeded) * 100);

  return (
    <div className="min-h-screen bg-[oklch(0.17_0.07_285)] text-[oklch(0.96_0.02_90)]">
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Header */}
        <header className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
          <div>
            <h1 className="text-2xl font-semibold tracking-wide text-[oklch(0.92_0.13_92)] drop-shadow-[0_0_18px_oklch(0.85_0.15_92/0.5)]">
              Samsara&apos;s Spark
            </h1>
            <p className="text-sm text-white/60">
              {loka.name} — {loka.subtitle} · Loka {lokaIndex + 1}/{LOKAS_DATA.length}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <div className="min-w-40">
              <div className="flex justify-between text-xs uppercase tracking-widest text-white/60">
                <span>Karma Pool</span>
                <span>{karma}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[oklch(0.88_0.15_92)] transition-[width] duration-100"
                  style={{ width: `${(karma / MAX_KARMA) * 100}%` }}
                />
              </div>
            </div>
            <div className="min-w-40">
              <div className="flex justify-between text-xs uppercase tracking-widest text-white/60">
                <span>Shadow Karma</span>
                <span>{npcPct}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[oklch(0.72_0.16_300)] transition-[width] duration-100"
                  style={{ width: `${npcPct}%` }}
                />
              </div>
            </div>
            <div className="rounded-full border border-white/15 px-3 py-1 text-xs tracking-wide text-white/80">
              Form: {FORMS[form].label}
            </div>
          </div>
        </header>

        {/* Canvas */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_0_60px_oklch(0.4_0.15_290/0.45)]">
          <canvas
            ref={canvasRef}
            width={WORLD_W}
            height={WORLD_H}
            className="block w-full touch-none select-none"
          />
          {resetting && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[oklch(0.2_0.1_290/0.6)] backdrop-blur-sm">
              <p className="animate-pulse text-xl tracking-[0.35em] text-[oklch(0.92_0.13_92)]">
                REINCARNATING…
              </p>
            </div>
          )}
          {completed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[oklch(0.18_0.08_290/0.78)] backdrop-blur-sm">
              <p className="text-2xl tracking-widest text-[oklch(0.92_0.13_92)]">LOKA COMPLETE</p>
              <button
                onClick={nextLoka}
                className="rounded-full bg-[oklch(0.88_0.15_92)] px-6 py-2 font-medium text-[oklch(0.2_0.06_285)] transition hover:brightness-110"
              >
                {lokaIndexHasNext() ? "Enter Next Loka" : "Begin the Cycle Anew"}
              </button>
            </div>
          )}
        </div>

        <p className="mt-3 min-h-6 text-center text-sm text-white/70">{message}</p>
        {nearNpc && !gateOpen && (
          <p className="text-center text-sm text-[oklch(0.88_0.15_92)]">
            Hold E (or Sacrifice Karma) to offer your light to the Shadow.
          </p>
        )}

        {/* Controls */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <ControlBtn {...hold("left")}>◀ Left</ControlBtn>
          <ControlBtn {...hold("right")}>Right ▶</ControlBtn>
          <ControlBtn {...hold("jump")}>▲ Jump</ControlBtn>
          <ControlBtn {...hold("sacrifice")} gold>
            ✦ Sacrifice Karma
          </ControlBtn>
          <button
            onClick={() => setFormSafe(form === "jiva" ? "tortoise" : "jiva")}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10"
          >
            ⟳ Swap Form
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <FormBtn active={form === "jiva"} onClick={() => setFormSafe("jiva")}>
            1 · Jiva (Light)
          </FormBtn>
          <FormBtn active={form === "tortoise"} onClick={() => setFormSafe("tortoise")}>
            2 · Tortoise (Earth)
          </FormBtn>
          <button
            onClick={() => setCoOpEnabled((v) => !v)}
            className={`rounded-xl border px-4 py-2 text-sm transition ${
              coOpEnabled
                ? "border-[oklch(0.8_0.12_200)] bg-[oklch(0.8_0.12_200/0.18)] text-[oklch(0.88_0.1_200)]"
                : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
            }`}
          >
            ☾ Simulate Co-Op Ally: {coOpEnabled ? "On" : "Off"}
          </button>
          <button
            onClick={() => loadLoka(lokaIndex)}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10"
          >
            ↺ Restart Loka
          </button>
        </div>

        <p className="mt-4 text-center text-xs leading-relaxed text-white/45">
          WASD / Arrows to move · Space or W to jump (Jiva only) · 1 / 2 to reincarnate · Hold E near the Shadow to
          sacrifice karma. The Tortoise is immune to shadow thorns but cannot jump.
        </p>
      </div>
    </div>
  );
}

function ControlBtn({
  children,
  gold,
  ...rest
}: React.ComponentProps<"button"> & { gold?: boolean }) {
  return (
    <button
      {...rest}
      className={`select-none rounded-xl border px-5 py-3 text-sm transition active:scale-95 ${
        gold
          ? "border-[oklch(0.88_0.15_92)] bg-[oklch(0.88_0.15_92/0.18)] text-[oklch(0.92_0.13_92)]"
          : "border-white/15 bg-white/5 text-white/85 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function FormBtn({
  active,
  children,
  ...rest
}: React.ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      {...rest}
      className={`rounded-xl border px-4 py-2 text-sm transition ${
        active
          ? "border-[oklch(0.88_0.15_92)] bg-[oklch(0.88_0.15_92/0.2)] text-[oklch(0.92_0.13_92)]"
          : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Rendering                                                           */
/* ------------------------------------------------------------------ */

const STARS = Array.from({ length: 90 }, (_, i) => ({
  x: (i * 137.5) % WORLD_W,
  y: (i * 83.7) % WORLD_H,
  r: ((i * 13) % 5) / 4 + 0.3,
  p: (i % 10) / 10,
}));

function draw(
  ctx: CanvasRenderingContext2D,
  s: {
    loka: Loka;
    player: Player;
    ally: { x: number; y: number } | null;
    particles: Particle[];
    npcKarma: number;
    gateOpen: boolean;
    time: number;
    resetting: boolean;
  },
) {
  const { loka, player, ally, particles, gateOpen, time } = s;

  const bg = ctx.createLinearGradient(0, 0, 0, WORLD_H);
  bg.addColorStop(0, `hsl(${loka.hue} 60% 12%)`);
  bg.addColorStop(1, `hsl(${loka.hue - 20} 55% 6%)`);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  // stars
  for (const st of STARS) {
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(time * 1.2 + st.p * 8));
    ctx.fillStyle = `rgba(255,248,220,${0.18 + tw * 0.4})`;
    ctx.beginPath();
    ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // platforms
  for (const p of loka.platforms) {
    const g = ctx.createLinearGradient(0, p.y, 0, p.y + p.h);
    g.addColorStop(0, `hsl(${loka.hue} 45% 34%)`);
    g.addColorStop(1, `hsl(${loka.hue} 45% 18%)`);
    ctx.fillStyle = g;
    roundRect(ctx, p.x, p.y, p.w, p.h, 6);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,225,160,0.35)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // hazards (shadow thorns)
  for (const h of loka.hazards) {
    ctx.save();
    ctx.shadowColor = "rgba(180,40,90,0.8)";
    ctx.shadowBlur = 16;
    ctx.fillStyle = "rgba(30,6,20,0.95)";
    const spikes = Math.max(2, Math.floor(h.w / 18));
    ctx.beginPath();
    ctx.moveTo(h.x, h.y + h.h);
    for (let i = 0; i < spikes; i++) {
      const x0 = h.x + (i * h.w) / spikes;
      ctx.lineTo(x0 + h.w / spikes / 2, h.y - 4 + Math.sin(time * 4 + i) * 2);
      ctx.lineTo(x0 + h.w / spikes, h.y + h.h);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,90,140,0.7)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  // gate
  const g = loka.gate;
  ctx.save();
  ctx.shadowBlur = gateOpen ? 40 : 10;
  ctx.shadowColor = gateOpen ? "rgba(255,215,120,0.95)" : "rgba(120,90,180,0.6)";
  ctx.strokeStyle = gateOpen ? "rgba(255,225,150,0.95)" : "rgba(160,140,210,0.6)";
  ctx.lineWidth = 3;
  roundRect(ctx, g.x, g.y, g.w, g.h, 10);
  ctx.stroke();
  ctx.fillStyle = gateOpen
    ? `rgba(255,220,140,${0.18 + 0.12 * Math.sin(time * 3)})`
    : "rgba(60,40,100,0.5)";
  ctx.fill();
  ctx.restore();

  // NPC
  const pct = Math.min(1, s.npcKarma / loka.npc.karmaNeeded);
  const npcR = 20;
  ctx.save();
  ctx.shadowBlur = 25;
  ctx.shadowColor = gateOpen ? "rgba(255,215,120,0.95)" : "rgba(90,40,140,0.9)";
  const ng = ctx.createRadialGradient(loka.npc.x, loka.npc.y, 2, loka.npc.x, loka.npc.y, npcR + 10);
  if (gateOpen) {
    ng.addColorStop(0, "rgba(255,245,200,1)");
    ng.addColorStop(1, "rgba(255,190,80,0)");
  } else {
    ng.addColorStop(0, `rgba(${120 + pct * 135},${60 + pct * 160},${180 - pct * 60},1)`);
    ng.addColorStop(1, "rgba(40,10,70,0)");
  }
  ctx.fillStyle = ng;
  ctx.beginPath();
  ctx.arc(loka.npc.x, loka.npc.y + Math.sin(time * 2) * 4, npcR + 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // npc karma ring
  ctx.beginPath();
  ctx.arc(loka.npc.x, loka.npc.y, npcR + 16, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
  ctx.strokeStyle = "rgba(255,220,150,0.9)";
  ctx.lineWidth = 3;
  ctx.stroke();

  // particles
  for (const pt of particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.max) * 0.9;
    ctx.fillStyle = `hsl(${pt.hue} 90% 72%)`;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 2.2 * pt.life + 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // ally
  if (ally) {
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(120,220,255,0.9)";
    ctx.fillStyle = "rgba(190,240,255,0.9)";
    ctx.beginPath();
    ctx.arc(ally.x, ally.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // player
  const cfg = FORMS[player.form];
  ctx.save();
  if (player.form === "jiva") {
    ctx.shadowBlur = 30;
    ctx.shadowColor = "rgba(255,225,140,0.95)";
    const pg = ctx.createRadialGradient(player.x, player.y, 1, player.x, player.y, cfg.r + 8);
    pg.addColorStop(0, "rgba(255,255,240,1)");
    pg.addColorStop(0.5, "rgba(255,220,130,0.85)");
    pg.addColorStop(1, "rgba(255,190,70,0)");
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.arc(player.x, player.y, cfg.r + 8, 0, Math.PI * 2);
    ctx.fill();
    // four-point spark
    ctx.fillStyle = "rgba(255,255,235,0.95)";
    star(ctx, player.x, player.y, cfg.r + 6, cfg.r * 0.35, time * 1.2);
    ctx.fill();
  } else {
    ctx.shadowBlur = 18;
    ctx.shadowColor = "rgba(200,170,90,0.7)";
    ctx.fillStyle = "rgba(90,70,50,1)";
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + 4, cfg.r + 4, cfg.r * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    const sg = ctx.createLinearGradient(player.x, player.y - cfg.r, player.x, player.y + cfg.r);
    sg.addColorStop(0, "rgba(235,200,120,1)");
    sg.addColorStop(1, "rgba(140,105,55,1)");
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.arc(player.x, player.y, cfg.r, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,235,180,0.8)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(player.x, player.y, cfg.r * 0.6, Math.PI, 0);
    ctx.stroke();
  }
  ctx.restore();
}

function star(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  rot: number,
) {
  const points = 4;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i * Math.PI) / points + rot;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
