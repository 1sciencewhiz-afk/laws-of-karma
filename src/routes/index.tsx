import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect } from "react";
import { AuditOverlay, DialogueOverlay, HUD, IntroOverlay, JournalOverlay, MokshaOverlay, PerformanceOverlay } from "@/components/game/Overlays";
import { bindKeyboard } from "@/game/input";
import { tick, toggleJournal, useGame } from "@/game/store";
import { sfx } from "@/game/audio";

const GameCanvas = lazy(() => import("@/components/game/GameCanvas"));

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Laws of Karma — A 3D Journey Through Samsara" },
      {
        name: "description",
        content:
          "Live as prince, merchant, ox or sage. Your deeds, not your choices, decide each rebirth — until you give everything away and reach Moksha.",
      },
      { property: "og:title", content: "Laws of Karma — A 3D Journey Through Samsara" },
      { property: "og:description", content: "A 3D narrative game of karma, rebirth and liberation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LawsOfKarma,
});

function LawsOfKarma() {
  const s = useGame();

  useEffect(() => {
    const unbind = bindKeyboard((code) => {
      if (code === "KeyJ") toggleJournal();
      sfx.unlock();
    });
    const id = setInterval(() => tick(0.5), 500);
    return () => {
      unbind();
      clearInterval(id);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-[oklch(0.12_0.05_290)]">
      <Suspense
        fallback={
          <div className="flex h-full items-center justify-center text-sm tracking-[0.3em] text-[oklch(0.85_0.12_85)]">
            THE WHEEL BEGINS TO TURN…
          </div>
        }
      >
        <GameCanvas />
      </Suspense>
      <HUD />
      <DialogueOverlay />
      <PerformanceOverlay />
      <JournalOverlay />
      <AuditOverlay />
      <MokshaOverlay />
      <IntroOverlay />
      {s.cataclysm && <div className="pointer-events-none fixed inset-0 z-40 animate-pulse bg-[oklch(0.35_0.2_25_/_0.35)]" />}
    </div>
  );
}
