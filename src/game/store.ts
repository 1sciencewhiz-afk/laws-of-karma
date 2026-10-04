import { useSyncExternalStore } from "react";
import { FORMS, MOKSHA_THRESHOLD, type Effect, type Form, type Node, type Seed } from "./data";
import { dispositionOf, pickStageScenarios, STORY_TREES, type Disposition, type Scenario } from "./scenarios";
import { sfx, setMuted } from "./audio";

export type Phase = "INTRO" | "PLAY" | "SETUP" | "DIALOGUE" | "PERFORMANCE" | "AUDIT" | "MOKSHA";

/** Beat offsets (ms from performance start) the player can hit by pressing Act in time. */
const QTE_BEATS = [1000, 2150, 3300];
const QTE_WINDOW = 350;

export type Atman = {
  jnana: number;
  vairagya: number;
  sakamKarma: number;
  nishkamaKarma: number;
  adharmaKarma: number;
  /** hidden — never rendered */
  unseenBadKarma: number;
};

export type Seeds = Record<Seed, number>;
export type Audit = { reason: string; form: Form; seeds: Seeds; next: Form; endsAt: number };
export type Performance = {
  sceneId: string;
  seed: Seed;
  caption: string;
  startedAt: number;
  endsAt: number;
  nextNode: string | null;
  completesLife: boolean;
  /** rhythm QTE played out during the deed: ms-offsets of each beat and whether it was hit */
  beats: number[];
  hits: boolean[];
};
export type EncounterSetup = { treeId: string; nodeId: string; sceneId: string; endsAt: number };

export type GameState = {
  phase: Phase;
  form: Form;
  life: number;
  age: number;
  seeds: Seeds; // this life
  atman: Atman;
  objective: number;
  trialIndex: number;
  lifeEndAt: number | null;
  lifeEndReason: string;
  treeId: string | null;
  nodeId: string | null;
  journal: string[];
  journalOpen: boolean;
  muted: boolean;
  respawnKey: number;
  levelKey: number;
  health: number;
  // scenario
  talked: Record<string, boolean>;
  silosUnlocked: boolean;
  hoarding: boolean;
  silosOpened: boolean[];
  mirrors: number[];
  lightAligned: boolean;
  spiritFill: number;
  merit: number;
  // hidden cataclysm
  silhouetteVisible: boolean;
  silhouetteMet: boolean;
  doomAt: number | null;
  cataclysm: boolean;
  audit: Audit | null;
  performance: Performance | null;
  encounterSetup: EncounterSetup | null;
  // the four karma-shaped encounters chosen for this life
  stages: Scenario[];
  disposition: Disposition;
};

const zeroSeeds = (): Seeds => ({ nishkama: 0, sakam: 0, adharma: 0 });

function lifeState(form: Form, atman: Atman): Partial<GameState> {
  const disposition = dispositionOf(atman);
  return {
    form,
    age: 0,
    seeds: zeroSeeds(),
    objective: 0,
    trialIndex: 0,
    lifeEndAt: null,
    lifeEndReason: "",
    health: 3,
    talked: {},
    silosUnlocked: false,
    hoarding: false,
    silosOpened: [false, false, false],
    mirrors: [0, 0, 0],
    lightAligned: false,
    spiritFill: 0,
    stages: pickStageScenarios(form, disposition),
    disposition,
  };
}

function initial(): GameState {
  const atman: Atman = { jnana: 0, vairagya: 0, sakamKarma: 0, nishkamaKarma: 0, adharmaKarma: 0, unseenBadKarma: 0 };
  return {
    ...lifeState("prince", atman),
    phase: "INTRO",
    life: 1,
    atman,
    treeId: null,
    nodeId: null,
    journal: [],
    journalOpen: false,
    muted: false,
    respawnKey: 0,
    levelKey: 0,
    merit: 0,
    silhouetteVisible: false,
    silhouetteMet: false,
    doomAt: null,
    cataclysm: false,
    audit: null,
    performance: null,
    encounterSetup: null,
  } as GameState;
}

let state: GameState = initial();
const listeners = new Set<() => void>();
function set(patch: Partial<GameState>) {
  state = { ...state, ...patch };
  for (const l of listeners) l();
}
export const getState = () => state;
export function useGame(): GameState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    getState,
    getState,
  );
}

export function currentNode(): Node | null {
  if (!state.treeId || !state.nodeId) return null;
  return STORY_TREES[state.treeId]?.[state.nodeId] ?? null;
}

export function mokshaReady(s = state) {
  return s.atman.jnana >= MOKSHA_THRESHOLD.jnana && s.atman.vairagya >= MOKSHA_THRESHOLD.vairagya && s.atman.adharmaKarma === 0;
}

/* ------------------------------ actions ------------------------------ */

export function begin() {
  sfx.unlock();
  sfx.drums();
  set({ phase: "PLAY" });
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

function applyEffect(e: Effect | undefined) {
  if (!e) return;
  const a = { ...state.atman };
  const seeds = { ...state.seeds };
  const patch: Partial<GameState> = {};
  if (e.seed) {
    seeds[e.seed] += 1;
    if (e.seed === "nishkama") {
      a.nishkamaKarma += 1;
      patch.merit = state.merit + 30;
    }
    if (e.seed === "sakam") {
      a.sakamKarma += 1;
      patch.merit = state.merit + 10;
    }
    if (e.seed === "adharma") a.adharmaKarma += 1;
  }
  a.jnana = clamp(a.jnana + (e.jnana ?? 0));
  a.vairagya = clamp(a.vairagya + (e.vairagya ?? 0));
  if (e.badKarma) a.unseenBadKarma += e.badKarma;
  if (a.unseenBadKarma >= 10) patch.silhouetteVisible = true;
  if (e.journal) patch.journal = [...state.journal, `Life ${state.life}: ${e.journal}`];
  if (e.unlockSilos) {
    patch.silosUnlocked = true;
    patch.objective = 1;
  }
  if (e.hoard) patch.hoarding = true;
  set({ ...patch, atman: a, seeds });
  if (e.complete) completeLife("Your dharma in this life has played out.");
}

export function openDialogue(treeId: string, nodeId = "start") {
  if (!STORY_TREES[treeId]) return;
  sfx.talk();
  const stage = state.stages[state.trialIndex]?.id === treeId ? state.stages[state.trialIndex] : undefined;
  set({
    treeId,
    nodeId,
    phase: stage ? "SETUP" : "DIALOGUE",
    encounterSetup: stage ? { treeId, nodeId, sceneId: stage.id, endsAt: Date.now() + 1600 } : null,
    talked: { ...state.talked, [`${treeId}:${nodeId}`]: true },
  });
}

export function chooseOption(index: number) {
  const node = currentNode();
  const choice = node?.choices[index];
  if (!choice) return;
  sfx.talk();
  if (choice.tag === "nishkama") sfx.chant();
  if (state.form === "prince" && choice.effect?.seed) sfx.drums();
  const wasSil = state.treeId === "silhouette";
  const stage = state.stages[state.trialIndex];
  // only the Prince and the Sage close out their life at the story's fourth trial —
  // the Merchant and the Ox end theirs through their own objectives (silos / the pool).
  const completesLife = (state.form === "prince" || state.form === "sage") && state.trialIndex === 3;
  const effect = choice.effect;
  applyEffect(effect);
  if (wasSil) {
    return set({ treeId: null, nodeId: null, phase: "PLAY", silhouetteMet: true, doomAt: Date.now() + 300_000 });
  }
  const now = Date.now();
  set({
    phase: "PERFORMANCE",
    performance: {
      sceneId: stage?.id ?? "deed",
      seed: choice.tag ?? "sakam",
      caption: choice.effect?.journal ?? choice.label,
      startedAt: now,
      endsAt: now + 4200,
      nextNode: choice.next ?? null,
      completesLife,
      beats: QTE_BEATS,
      hits: QTE_BEATS.map(() => false),
    },
  });
}

/** Press Act in time with a beat during the performance to steady the deed. */
export function registerBeat() {
  const perf = state.performance;
  if (!perf || state.phase !== "PERFORMANCE") return;
  const elapsed = Date.now() - perf.startedAt;
  let best = -1;
  let bestDist = QTE_WINDOW;
  perf.beats.forEach((b, i) => {
    if (perf.hits[i]) return;
    const dist = Math.abs(elapsed - b);
    if (dist <= bestDist) {
      best = i;
      bestDist = dist;
    }
  });
  if (best === -1) return;
  const hits = perf.hits.map((h, i) => (i === best ? true : h));
  sfx.karma();
  set({ performance: { ...perf, hits } });
}

/** Reward for steadying the deed in rhythm: focus mutes the edge of whatever the choice already planted. */
function applyQteBonus(performance: Performance) {
  const hitCount = performance.hits.filter(Boolean).length;
  if (hitCount === 0) return;
  const a = { ...state.atman };
  const patch: Partial<GameState> = {};
  if (performance.seed === "adharma") {
    a.unseenBadKarma = Math.max(0, a.unseenBadKarma - hitCount * 0.5);
  } else {
    a.vairagya = clamp(a.vairagya + hitCount * 1.5);
    if (performance.seed === "sakam") patch.merit = state.merit + hitCount * 4;
  }
  set({ ...patch, atman: a });
}

function finishPerformance() {
  const performance = state.performance;
  if (!performance) return;
  applyQteBonus(performance);
  if (performance.completesLife) {
    set({ performance: null, treeId: null, nodeId: null, phase: "PLAY" });
    completeLife("Your four trials in this life have played out.");
    return;
  }
  set({
    performance: null,
    phase: "PLAY",
    treeId: null,
    nodeId: null,
    trialIndex: Math.min(3, state.trialIndex + 1),
    objective: Math.min(3, state.objective + 1),
  });
}

function completeLife(reason: string) {
  if (state.lifeEndAt) return;
  sfx.chime();
  set({ lifeEndAt: Date.now() + 4000, lifeEndReason: reason });
}

export function openSilo(i: number) {
  if (!state.silosUnlocked || state.silosOpened[i]) return;
  const opened = state.silosOpened.map((v, j) => (j === i ? true : v));
  sfx.karma();
  set({ silosOpened: opened });
  if (opened.every(Boolean)) {
    completeLife(state.hoarding ? "The silos stayed locked for profit. Your life ends in counting-houses." : "The grain is shared out. Your life as a merchant draws to a close.");
  }
}

export function rotateMirror(i: number) {
  if (state.lightAligned) return;
  const m = state.mirrors.map((v, j) => (j === i ? (v + 1) % 4 : v));
  sfx.talk();
  const solved = m.every((v, j) => v === [1, 3, 2][j]);
  set({ mirrors: m });
  if (solved) {
    sfx.chant();
    set({ lightAligned: true, objective: 1, atman: { ...state.atman, jnana: clamp(state.atman.jnana + 20) } });
  }
}

export function reachPool() {
  if (state.objective > 0) return;
  // an animal life patiently endured works off one seed of adharma
  const a = { ...state.atman, vairagya: clamp(state.atman.vairagya + 6), adharmaKarma: Math.max(0, state.atman.adharmaKarma - 1) };
  set({ objective: 1, atman: a, journal: [...state.journal, `Life ${state.life}: You endured an animal's life with patience.`] });
  completeLife("You drank from the pool and lay down in the shade. The burden is paid.");
}

export function hurt() {
  sfx.hurt();
  const health = state.health - 1;
  if (health <= 0) return endLife("The body could bear no more.");
  set({ health, respawnKey: state.respawnKey + 1 });
}

export function transferMerit(amount: number) {
  if (!mokshaReady() || state.merit <= 0) return;
  const give = Math.min(amount, state.merit);
  const fill = Math.min(100, state.spiritFill + give);
  set({ merit: state.merit - give, spiritFill: fill });
  if (state.merit <= 0.01) {
    sfx.chord();
    set({ phase: "MOKSHA", merit: 0, spiritFill: 100 });
  }
}

/** Called every 0.5s from the route. */
export function tick(dt: number) {
  const s = state;
  if (s.phase === "PERFORMANCE" && s.performance && Date.now() >= s.performance.endsAt) {
    finishPerformance();
    return;
  }
  if (s.phase === "SETUP" && s.encounterSetup && Date.now() >= s.encounterSetup.endsAt) {
    set({ phase: "DIALOGUE", encounterSetup: null });
    return;
  }
  if (s.doomAt && Date.now() >= s.doomAt && !s.cataclysm) {
    sfx.rumble();
    set({ cataclysm: true, doomAt: null });
    setTimeout(() => {
      set({ cataclysm: false, silhouetteVisible: false, silhouetteMet: false, atman: { ...state.atman, unseenBadKarma: 0 } });
      endLife("A meteor fell from a red sky. The good word came due.", "animal");
    }, 3500);
    return;
  }
  if (s.phase !== "PLAY" || s.cataclysm) return;
  if (s.lifeEndAt && Date.now() >= s.lifeEndAt) return endLife(s.lifeEndReason);
  const age = s.age + dt;
  if (age >= FORMS[s.form].lifespan) return endLife("Your lifespan is complete.");
  set({ age });
}

/** Karmic Audit — fully automatic. The player never picks the next form. */
export function computeNextForm(seeds: Seeds, atman: Atman): Form {
  const { nishkama: n, sakam: k, adharma: a } = seeds;
  if (a > 0 && a >= n && a >= k) return "animal";
  if (atman.adharmaKarma > 2) return "animal";
  if (n > k && atman.jnana >= 30) return "sage";
  if (k > n) return "merchant";
  return "prince";
}

function endLife(reason: string, forced?: Form) {
  if (state.phase === "AUDIT" || state.phase === "MOKSHA") return;
  const next = forced ?? computeNextForm(state.seeds, state.atman);
  sfx.chime();
  set({
    phase: "AUDIT",
    treeId: null,
    nodeId: null,
    audit: { reason, form: state.form, seeds: state.seeds, next, endsAt: Date.now() + 8000 },
    performance: null,
    encounterSetup: null,
  });
  setTimeout(rebirth, 8000);
}

function rebirth() {
  const au = state.audit;
  if (!au || state.phase !== "AUDIT") return;
  sfx.chord();
  if (au.next === "prince") setTimeout(() => sfx.drums(), 600);
  set({
    ...lifeState(au.next, state.atman),
    audit: null,
    phase: "PLAY",
    life: state.life + 1,
    respawnKey: state.respawnKey + 1,
    levelKey: state.levelKey + 1,
  });
}

export function toggleMute() {
  setMuted(!state.muted);
  set({ muted: !state.muted });
}
export function toggleJournal() {
  set({ journalOpen: !state.journalOpen });
}
export function restartWheel() {
  set({ ...initial(), phase: "PLAY", muted: state.muted, levelKey: state.levelKey + 1 });
}
