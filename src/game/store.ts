import { useSyncExternalStore } from "react";
import { LOKAS_DATA, STORY_TREES, type Effect, type Form, type Node } from "./data";
import { sfx, setMuted } from "./audio";

export type Phase = "STORY_CHOICE" | "IN_GAME_DIALOGUE" | "WORLD_ACTION" | "RESOLUTION";

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
  if (state.portalOpen) return;
  const give = Math.min(amount, state.karma, 100 - state.spiritKarma);
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
    set({ karma: 25, respawnKey: state.respawnKey + 1 });
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
  set({
    cataclysm: false,
    unseenBadKarma: 0,
    silhouetteVisible: false,
    silhouetteMet: false,
    karma: 100,
    spiritKarma: 0,
    portalOpen: false,
    respawnKey: state.respawnKey + 1,
    levelKey: state.levelKey + 1,
    phase: "WORLD_ACTION",
  });
}
