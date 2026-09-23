import { useSyncExternalStore } from "react";

export type Near = { kind: "npc" | "spirit" | "silhouette" | "portal"; id: string; label: string } | null;

let near: Near = null;
const listeners = new Set<() => void>();

export function setNear(next: Near) {
  const same = (near?.id ?? null) === (next?.id ?? null) && (near?.kind ?? null) === (next?.kind ?? null);
  if (same) return;
  near = next;
  for (const l of listeners) l();
}

export function useNear(): Near {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    () => near,
    () => null,
  );
}
