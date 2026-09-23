import { chooseOption, currentLoka, currentNode, nextLoka, setForm, toggleCoOp, toggleJournal, toggleMute, useGame } from "@/game/store";
import { useNear } from "@/game/proximity";
import { setTouch, clearTouch } from "@/game/input";
import { sfx } from "@/game/audio";
import { useEffect } from "react";

const panel =
  "rounded-2xl border border-[oklch(0.72_0.12_85_/_0.35)] bg-[oklch(0.16_0.07_290_/_0.78)] backdrop-blur-md shadow-[0_0_40px_oklch(0.6_0.18_300_/_0.25)]";

function Btn({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        sfx.unlock();
        onClick();
      }}
      className={`pointer-events-auto rounded-xl border px-3 py-1.5 text-xs font-medium tracking-wide transition-colors ${
        active
          ? "border-[oklch(0.85_0.14_85)] bg-[oklch(0.85_0.14_85_/_0.2)] text-[oklch(0.95_0.08_90)]"
          : "border-[oklch(0.72_0.12_85_/_0.35)] bg-[oklch(0.2_0.07_290_/_0.6)] text-[oklch(0.9_0.03_90)] hover:bg-[oklch(0.3_0.09_290_/_0.7)]"
      }`}
    >
      {children}
    </button>
  );
}

function TouchBtn({ k, label, className = "" }: { k: Parameters<typeof setTouch>[0]; label: string; className?: string }) {
  const bind = {
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      sfx.unlock();
      setTouch(k, true);
    },
    onPointerUp: () => setTouch(k, false),
    onPointerLeave: () => setTouch(k, false),
    onPointerCancel: () => setTouch(k, false),
  };
  return (
    <button
      type="button"
      {...bind}
      className={`pointer-events-auto select-none rounded-xl border border-[oklch(0.72_0.12_85_/_0.35)] bg-[oklch(0.2_0.07_290_/_0.7)] text-sm font-semibold text-[oklch(0.93_0.05_90)] active:bg-[oklch(0.4_0.12_300_/_0.8)] ${className}`}
    >
      {label}
    </button>
  );
}

export function HUD() {
  const s = useGame();
  const near = useNear();
  const loka = currentLoka();

  useEffect(() => () => clearTouch(), []);

  return (
    <div className="pointer-events-none fixed inset-0 z-10 select-none">
      {/* top-left */}
      <div className={`pointer-events-none absolute left-3 top-3 ${panel} px-4 py-3`}>
        <h1 className="text-sm font-semibold tracking-[0.2em] text-[oklch(0.9_0.11_85)]">SAMSARA&apos;S SPARK 3D</h1>
        <p className="mt-0.5 text-xs text-[oklch(0.8_0.04_300)]">
          {loka.name} · {loka.subtitle}
        </p>
        <div className="mt-2 w-48">
          <div className="flex justify-between text-[10px] uppercase tracking-widest text-[oklch(0.78_0.05_300)]">
            <span>Karma Pool</span>
            <span>{Math.round(s.karma)}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-[oklch(0.3_0.05_290)]">
            <div
              className="h-full rounded-full bg-[oklch(0.85_0.15_85)] transition-[width] duration-150"
              style={{ width: `${Math.max(0, Math.min(100, s.karma))}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[10px] uppercase tracking-widest text-[oklch(0.78_0.05_300)]">
            <span>Spirit</span>
            <span>{Math.round(s.spiritKarma)}%</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-[oklch(0.3_0.05_290)]">
            <div
              className="h-full rounded-full bg-[oklch(0.78_0.16_320)] transition-[width] duration-150"
              style={{ width: `${s.spiritKarma}%` }}
            />
          </div>
        </div>
      </div>

      {/* top-right */}
      <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
        <div className={`${panel} flex gap-2 px-3 py-2`}>
          <Btn onClick={() => setForm("jiva")} active={s.form === "jiva"}>
            1 · Jiva
          </Btn>
          <Btn onClick={() => setForm("tortoise")} active={s.form === "tortoise"}>
            2 · Tortoise
          </Btn>
        </div>
        <div className={`${panel} flex gap-2 px-3 py-2`}>
          <Btn onClick={toggleJournal}>Journal ({s.journal.length})</Btn>
          <Btn onClick={toggleCoOp} active={s.coOpEnabled}>
            Co-Op Ally
          </Btn>
          <Btn onClick={toggleMute}>{s.muted ? "Unmute" : "Mute"}</Btn>
        </div>
      </div>

      {/* interaction prompt */}
      {near && s.phase === "WORLD_ACTION" && (
        <div className={`absolute left-1/2 top-16 -translate-x-1/2 ${panel} px-4 py-2 text-xs text-[oklch(0.92_0.06_88)]`}>
          {near.label}
        </div>
      )}

      {/* touch controls */}
      <div className="absolute bottom-4 left-4 grid grid-cols-3 grid-rows-3 gap-1.5">
        <TouchBtn k="up" label="▲" className="col-start-2 row-start-1 h-12 w-12" />
        <TouchBtn k="left" label="◀" className="col-start-1 row-start-2 h-12 w-12" />
        <TouchBtn k="right" label="▶" className="col-start-3 row-start-2 h-12 w-12" />
        <TouchBtn k="down" label="▼" className="col-start-2 row-start-3 h-12 w-12" />
      </div>
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2">
        <TouchBtn k="jump" label="JUMP" className="h-12 w-28" />
        <TouchBtn k="interact" label="E · TALK / SACRIFICE" className="h-12 w-48" />
      </div>

      <p className="absolute bottom-2 left-1/2 hidden -translate-x-1/2 text-[10px] tracking-widest text-[oklch(0.7_0.04_300)] sm:block">
        WASD / ARROWS MOVE · SPACE JUMP · 1 / 2 FORM · HOLD E INTERACT
      </p>
    </div>
  );
}

export function DialogueOverlay() {
  const s = useGame();
  const node = currentNode();
  if ((s.phase !== "STORY_CHOICE" && s.phase !== "IN_GAME_DIALOGUE") || !node) return null;
  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center bg-[oklch(0.08_0.05_290_/_0.6)] p-4 sm:items-center">
      <div className={`${panel} w-full max-w-xl p-6`}>
        <p className="text-[11px] uppercase tracking-[0.25em] text-[oklch(0.85_0.13_85)]">{node.speaker}</p>
        <p className="mt-3 text-sm leading-relaxed text-[oklch(0.94_0.02_90)]">{node.text}</p>
        <div className="mt-5 flex flex-col gap-2">
          {node.choices.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                sfx.unlock();
                chooseOption(i);
              }}
              className="rounded-xl border border-[oklch(0.72_0.12_85_/_0.3)] bg-[oklch(0.22_0.07_292_/_0.7)] px-4 py-3 text-left text-sm text-[oklch(0.93_0.03_90)] transition-colors hover:border-[oklch(0.85_0.14_85)] hover:bg-[oklch(0.3_0.1_295_/_0.8)]"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ResolutionOverlay() {
  const s = useGame();
  if (s.phase !== "RESOLUTION") return null;
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-[oklch(0.08_0.05_290_/_0.72)] p-4">
      <div className={`${panel} w-full max-w-lg p-7 text-center`}>
        <p className="text-[11px] uppercase tracking-[0.3em] text-[oklch(0.85_0.13_85)]">Resolution</p>
        <p className="mt-4 text-sm leading-relaxed text-[oklch(0.94_0.02_90)]">{s.resolutionText}</p>
        <button
          type="button"
          onClick={() => {
            sfx.unlock();
            nextLoka();
          }}
          className="mt-6 rounded-xl border border-[oklch(0.85_0.14_85)] bg-[oklch(0.85_0.14_85_/_0.18)] px-6 py-2.5 text-sm font-medium text-[oklch(0.95_0.08_90)] hover:bg-[oklch(0.85_0.14_85_/_0.3)]"
        >
          Turn the wheel
        </button>
      </div>
    </div>
  );
}

export function JournalOverlay() {
  const s = useGame();
  if (!s.journalOpen) return null;
  const flags = Object.entries(s.storyFlags).filter(([, v]) => v);
  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-[oklch(0.08_0.05_290_/_0.5)]" onClick={toggleJournal}>
      <div
        className={`h-full w-full max-w-sm overflow-y-auto border-l border-[oklch(0.72_0.12_85_/_0.3)] bg-[oklch(0.14_0.06_290_/_0.95)] p-6 backdrop-blur-md`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm tracking-[0.25em] text-[oklch(0.88_0.12_85)]">JOURNAL</h2>
          <button type="button" onClick={toggleJournal} className="text-xs text-[oklch(0.8_0.04_300)]">
            Close
          </button>
        </div>
        <h3 className="mt-6 text-[10px] uppercase tracking-widest text-[oklch(0.75_0.05_300)]">Parables</h3>
        {s.journal.length === 0 && <p className="mt-2 text-xs text-[oklch(0.7_0.03_300)]">No parables unlocked yet.</p>}
        <div className="mt-2 space-y-3">
          {s.journal.map((j) => (
            <div key={j.title} className="rounded-xl border border-[oklch(0.72_0.12_85_/_0.2)] bg-[oklch(0.2_0.07_292_/_0.6)] p-3">
              <p className="text-xs font-semibold text-[oklch(0.9_0.1_85)]">{j.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-[oklch(0.88_0.02_90)]">{j.text}</p>
            </div>
          ))}
        </div>
        <h3 className="mt-6 text-[10px] uppercase tracking-widest text-[oklch(0.75_0.05_300)]">Choices made</h3>
        {flags.length === 0 && <p className="mt-2 text-xs text-[oklch(0.7_0.03_300)]">The wheel has not yet recorded you.</p>}
        <ul className="mt-2 space-y-1 text-xs text-[oklch(0.88_0.02_90)]">
          {flags.map(([k]) => (
            <li key={k}>· {k.replace(/([A-Z])/g, " $1").toLowerCase()}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
