import { useSyncExternalStore } from "react";
import { FORMS, MOKSHA_THRESHOLD, STORY_TREES, type Effect, type Form, type Node, type Seed } from "./data";
import { sfx, setMuted } from "./audio";

export type Phase = "INTRO" | "PLAY" | "DIALOGUE" | "AUDIT" | "MOKSHA";

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

export type GameState = {
  phase: Phase;
  form: Form;
  life: number;
  age: number;
  seeds: Seeds; // this life
  atman: Atman;
  objective: number;
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
};

const zeroSeeds = (): Seeds => ({ nishkama: 0, sakam: 0, adharma: 0 });

function lifeState(form: Form): Partial<GameState> {
  return {
    form,
    age: 0,
    seeds: zeroSeeds(),
    objective: 0,
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
  };
}

function initial(): GameState {
  return {
    ...lifeState("prince"),
    phase: "INTRO",
    life: 1,
    atman: { jnana: 0, vairagya: 0, sakamKarma: 0, nishkamaKarma: 0, adharmaKarma: 0, unseenBadKarma: 0 },
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

export function openDialogue(treeId: string) {
  if (!STORY_TREES[treeId]) return;
  sfx.talk();
  set({ treeId, nodeId: "start", phase: "DIALOGUE", talked: { ...state.talked, [treeId]: true } });
}

export function chooseOption(index: number) {
  const node = currentNode();
  const choice = node?.choices[index];
  if (!choice) return;
  sfx.talk();
  if (choice.tag === "nishkama") sfx.chant();
  if (state.form === "prince" && choice.effect?.seed) sfx.drums();
  const wasSil = state.treeId === "silhouette";
  applyEffect(choice.effect);
  if (choice.next) return set({ nodeId: choice.next });
  if (wasSil) {
    return set({ treeId: null, nodeId: null, phase: "PLAY", silhouetteMet: true, doomAt: Date.now() + 300_000 });
  }
  set({ treeId: null, nodeId: null, phase: state.phase === "DIALOGUE" ? "PLAY" : state.phase });
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
  });
  setTimeout(rebirth, 8000);
}

function rebirth() {
  const au = state.audit;
  if (!au || state.phase !== "AUDIT") return;
  sfx.chord();
  if (au.next === "prince") setTimeout(() => sfx.drums(), 600);
  set({
    ...lifeState(au.next),
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
