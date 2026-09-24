import { useSyncExternalStore } from "react";
import { LOKAS_DATA, MOKSHA_THRESHOLD, STORY_TREES, type Effect, type Form, type Node } from "./data";
import { sfx, setMuted } from "./audio";

export type Phase = "STORY_CHOICE" | "IN_GAME_DIALOGUE" | "WORLD_ACTION" | "RESOLUTION" | "MOKSHA";

export type Atman = { jnana: number; vairagya: number; sakamKarma: number; nishkamaKarma: number };
export type Audit = { reason: string; rebornAs: Form; lives: number } | null;

export type JournalEntry = { title: string; text: string };

export type GameState = {
  phase: Phase;
  lokaIndex: number;
  karma: number;
  spiritKarma: number;
  form: Form;
  portalOpen: boolean;
  treeId: string | null;
  nodeId: string | null;
  storyFlags: Record<string, boolean>;
  journal: JournalEntry[];
  hazardsCleared: boolean;
  coOpEnabled: boolean;
  muted: boolean;
  journalOpen: boolean;
  respawnKey: number;
  levelKey: number;
  cataclysm: boolean;
  silhouetteVisible: boolean;
  silhouetteMet: boolean;
  resolutionText: string;
  /** hidden — never rendered in the UI */
  unseenBadKarma: number;
  doomAt: number | null;
  atman: Atman;
  fogOverride: string | null;
  audit: Audit;
  lives: number;
};

function initial(): GameState {
  return {
    phase: "STORY_CHOICE",
    lokaIndex: 0,
    karma: 100,
    spiritKarma: 0,
    form: "jiva",
    portalOpen: false,
    treeId: LOKAS_DATA[0]!.storyTreeId,
    nodeId: "start",
    storyFlags: {},
    journal: [],
    hazardsCleared: false,
    coOpEnabled: false,
    muted: false,
    journalOpen: false,
    respawnKey: 0,
    levelKey: 0,
    cataclysm: false,
    silhouetteVisible: false,
    silhouetteMet: false,
    resolutionText: "",
    unseenBadKarma: 0,
    doomAt: null,
    atman: { jnana: 0, vairagya: 0, sakamKarma: 0, nishkamaKarma: 0 },
    fogOverride: null,
    audit: null,
    lives: 1,
  };
}

let state: GameState = initial();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function set(patch: Partial<GameState>) {
  state = { ...state, ...patch };
  emit();
}

export function getState() {
  return state;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useGame(): GameState {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function currentLoka() {
  return LOKAS_DATA[Math.min(state.lokaIndex, LOKAS_DATA.length - 1)]!;
}

export function currentNode(): Node | null {
  if (!state.treeId || !state.nodeId) return null;
  const tree = STORY_TREES[state.treeId];
  if (!tree) return null;
  return tree[state.nodeId] ?? null;
}

/* ----------------------------- actions ----------------------------- */

function applyEffect(e: Effect | undefined) {
  if (!e) return;
  const patch: Partial<GameState> = {};
  if (typeof e.karma === "number") patch.karma = Math.max(0, Math.min(100, state.karma + e.karma));
  if (typeof e.badKarma === "number") {
    const next = state.unseenBadKarma + e.badKarma;
    patch.unseenBadKarma = next;
    if (next >= 10) patch.silhouetteVisible = true;
  }
  if (e.flag) patch.storyFlags = { ...state.storyFlags, [e.flag]: e.flagValue ?? true };
  if (e.journal && !state.journal.some((j) => j.title === e.journal!.title)) {
    patch.journal = [...state.journal, e.journal];
  }
  if (e.form) patch.form = e.form;
  if (e.removeHazards) patch.hazardsCleared = true;
  if (e.restoreHazards) patch.hazardsCleared = false;
  if (e.fog) patch.fogOverride = e.fog;
  if (e.jnana || e.vairagya || e.kind) {
    const a = { ...state.atman };
    a.jnana = Math.min(100, a.jnana + (e.jnana ?? 0));
    a.vairagya = Math.min(100, a.vairagya + (e.vairagya ?? 0));
    if (e.kind === "sakam") a.sakamKarma += 1;
    if (e.kind === "nishkama") a.nishkamaKarma += 1;
    if (e.kind === "adharma") a.vairagya = Math.max(0, a.vairagya - 10);
    patch.atman = a;
  }
  set(patch);
}

export function chooseOption(index: number) {
  const node = currentNode();
  if (!node) return;
  const choice = node.choices[index];
  if (!choice) return;
  sfx.talk();
  applyEffect(choice.effect);
  if (choice.next) {
    set({ nodeId: choice.next });
    return;
  }
  // dialogue finished
  if (state.treeId === "silhouette") {
    const delay = 300 + Math.random() * 300; // 5–10 minutes
    set({ treeId: null, nodeId: null, phase: "WORLD_ACTION", silhouetteMet: true, doomAt: Date.now() + delay * 1000 });
    return;
  }
  set({ treeId: null, nodeId: null, phase: "WORLD_ACTION" });
}

export function openDialogue(treeId: string) {
  if (!STORY_TREES[treeId]) return;
  sfx.talk();
  set({ treeId, nodeId: "start", phase: "IN_GAME_DIALOGUE" });
}

export function spendKarma(amount: number) {
  const finalRealm = state.lokaIndex === LOKAS_DATA.length - 1;
  if (state.portalOpen && !finalRealm) return;
  const cap = finalRealm && state.portalOpen ? Infinity : 100 - state.spiritKarma;
  const give = Math.min(amount, state.karma, cap);
  if (give <= 0) return;
  const spirit = state.spiritKarma + give;
  const opened = spirit >= 100;
  if (opened) sfx.chord();
  set({ karma: state.karma - give, spiritKarma: spirit, portalOpen: opened || state.portalOpen });
}

export function damage(amount: number) {
  sfx.hurt();
  const karma = Math.max(0, state.karma - amount);
  if (karma <= 0) {
    startAudit("Your karma pool ran dry. The body could hold you no longer.");
  } else {
    set({ karma, respawnKey: state.respawnKey + 1 });
  }
}

export function addHiddenKarma(amount: number) {
  const next = state.unseenBadKarma + amount;
  set({ unseenBadKarma: next, silhouetteVisible: state.silhouetteVisible || next >= 10 });
}

export function setForm(form: Form) {
  if (state.form === form) return;
  sfx.swap();
  set({ form });
}

export function toggleCoOp() {
  set({ coOpEnabled: !state.coOpEnabled });
}

export function toggleMute() {
  const muted = !state.muted;
  setMuted(muted);
  set({ muted });
}

export function toggleJournal() {
  set({ journalOpen: !state.journalOpen });
}

export function reachPortal() {
  if (state.phase !== "WORLD_ACTION" || !state.portalOpen) return;
  sfx.chord();
  const loka = currentLoka();
  const a = state.atman;
  if (
    state.lokaIndex === LOKAS_DATA.length - 1 &&
    a.jnana >= MOKSHA_THRESHOLD.jnana &&
    a.vairagya >= MOKSHA_THRESHOLD.vairagya &&
    state.karma <= 0
  ) {
    set({ phase: "MOKSHA" });
    return;
  }
  set({
    phase: "RESOLUTION",
    resolutionText: `${loka.name} releases you. You gave away everything you had counted, and the gate answered.`,
  });
}

export function nextLoka() {
  const idx = state.lokaIndex + 1;
  if (idx >= LOKAS_DATA.length) {
    // loop back to the first realm, wheel-of-samsara style
    set({
      ...initial(),
      journal: state.journal,
      storyFlags: state.storyFlags,
      unseenBadKarma: state.unseenBadKarma,
      silhouetteVisible: state.unseenBadKarma >= 10,
      doomAt: state.doomAt,
      muted: state.muted,
      atman: state.atman,
      lives: state.lives,
      levelKey: state.levelKey + 1,
    });
    return;
  }
  set({
    lokaIndex: idx,
    phase: "STORY_CHOICE",
    treeId: LOKAS_DATA[idx]!.storyTreeId,
    nodeId: "start",
    karma: 100,
    spiritKarma: 0,
    portalOpen: false,
    hazardsCleared: false,
    fogOverride: null,
    levelKey: state.levelKey + 1,
    respawnKey: state.respawnKey + 1,
  });
}

export function triggerCataclysm() {
  if (state.cataclysm) return;
  sfx.rumble();
  set({ cataclysm: true, doomAt: null });
}

export function resolveCataclysm() {
  set({ cataclysm: false, unseenBadKarma: 0, silhouetteVisible: false, silhouetteMet: false });
  startAudit("A meteor fell from the red sky. The good word came due.");
}

function startAudit(reason: string) {
  const a = state.atman;
  const rebornAs: Form = a.nishkamaKarma >= a.sakamKarma && state.unseenBadKarma < 6 ? "jiva" : "tortoise";
  sfx.rumble();
  set({ audit: { reason, rebornAs, lives: state.lives + 1 } });
}

/** Rebirth after the Karmic Audit: keeps jnana + vairagya only */
export function rebirth() {
  const au = state.audit;
  if (!au) return;
  sfx.chord();
  set({
    audit: null,
    lives: au.lives,
    form: au.rebornAs,
    atman: { jnana: state.atman.jnana, vairagya: state.atman.vairagya, sakamKarma: 0, nishkamaKarma: 0 },
    karma: 100,
    spiritKarma: 0,
    portalOpen: false,
    respawnKey: state.respawnKey + 1,
    levelKey: state.levelKey + 1,
    phase: "WORLD_ACTION",
  });
}

export function restartWheel() {
  set({ ...initial(), muted: state.muted, levelKey: state.levelKey + 1 });
}
