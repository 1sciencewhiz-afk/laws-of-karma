import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect } from "react";
import { DialogueOverlay, HUD, JournalOverlay, ResolutionOverlay } from "@/components/game/Overlays";
import { bindKeyboard } from "@/game/input";
import { setForm, toggleJournal, useGame } from "@/game/store";
import { sfx } from "@/game/audio";

const GameCanvas = lazy(() => import("@/components/game/GameCanvas"));

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Samsara's Spark 3D — Cosmic Karma Platformer" },
      {
        name: "description",
        content:
          "Guide a glowing Jiva through 3D cosmic lokas: choose your path in branching parables, swap between light and tortoise forms, and pour your karma into the shadow spirit to open the gate.",
      },
      { property: "og:title", content: "Samsara's Spark 3D — Cosmic Karma Platformer" },
      {
        property: "og:description",
        content: "A 3D narrative platformer of reincarnation, sacrifice and hidden consequence.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SamsarasSpark3D,
});

function SamsarasSpark3D() {
  const s = useGame();

  useEffect(() => {
    return bindKeyboard((code) => {
      if (code === "Digit1") setForm("jiva");
      if (code === "Digit2") setForm("tortoise");
      if (code === "KeyJ") toggleJournal();
      sfx.unlock();
    });
  }, []);

  return (
    <div className="fixed inset-0 bg-[oklch(0.12_0.05_290)]">
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center text-sm tracking-[0.3em] text-[oklch(0.85_0.12_85)]">
            KINDLING THE SPARK…
          </div>
        }
      >
        <GameCanvas />
      </Suspense>
      <HUD />
      <DialogueOverlay />
      <ResolutionOverlay />
      <JournalOverlay />
      {s.cataclysm && (
        <div className="pointer-events-none fixed inset-0 z-40 animate-pulse bg-[oklch(0.35_0.2_25_/_0.35)]" />
      )}
    </div>
  );
}
