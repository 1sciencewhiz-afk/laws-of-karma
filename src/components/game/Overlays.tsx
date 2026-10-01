import { useEffect, type ReactNode } from "react";
import { FORMS, GITA_EXCERPTS, GLOSSARY, MOKSHA_THRESHOLD } from "@/game/data";
import { begin, chooseOption, currentNode, mokshaReady, restartWheel, toggleJournal, toggleMute, useGame } from "@/game/store";
import { useNear } from "@/game/proximity";
import { clearTouch, setTouch } from "@/game/input";
import { sfx } from "@/game/audio";

const panel =
  "rounded-2xl border border-[oklch(0.72_0.12_85_/_0.35)] bg-[oklch(0.16_0.07_290_/_0.8)] backdrop-blur-md text-[oklch(0.92_0.03_90)]";
const gold = "text-[oklch(0.88_0.12_85)]";

function Btn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        sfx.unlock();
        onClick();
      }}
      className="pointer-events-auto rounded-xl border border-[oklch(0.72_0.12_85_/_0.4)] bg-[oklch(0.22_0.07_290_/_0.7)] px-3 py-1.5 text-xs font-medium hover:bg-[oklch(0.32_0.09_290_/_0.8)]"
    >
      {children}
    </button>
  );
}

function TouchBtn({ k, label, className = "" }: { k: Parameters<typeof setTouch>[0]; label: string; className?: string }) {
  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.preventDefault();
        sfx.unlock();
        setTouch(k, true);
      }}
      onPointerUp={() => setTouch(k, false)}
      onPointerLeave={() => setTouch(k, false)}
      onPointerCancel={() => setTouch(k, false)}
      className={`pointer-events-auto select-none rounded-xl border border-[oklch(0.72_0.12_85_/_0.35)] bg-[oklch(0.2_0.07_290_/_0.7)] text-sm font-semibold active:bg-[oklch(0.4_0.12_300_/_0.8)] ${className}`}
    >
      {label}
    </button>
  );
}

function Bar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  return (
    <div className="mt-1.5">
      <div className="flex justify-between text-[10px] uppercase tracking-widest opacity-80">
        <span>{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <div className="mt-0.5 h-1.5 rounded-full bg-[oklch(0.3_0.05_290)]">
        <div className="h-full rounded-full bg-[oklch(0.85_0.15_85)]" style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }} />
      </div>
    </div>
  );
}

export function HUD() {
  const s = useGame();
  const near = useNear();
  const info = FORMS[s.form];
  useEffect(() => () => clearTouch(), []);
  if (s.phase === "INTRO") return null;
  const objective = info.objectives[Math.min(s.objective, info.objectives.length - 1)];

  return (
    <div className="pointer-events-none fixed inset-0 z-10 select-none">
      <div className={`absolute left-3 top-3 w-56 ${panel} px-4 py-3`}>
        <h1 className={`text-xs font-semibold tracking-[0.2em] ${gold}`}>LAWS OF KARMA · LIFE {s.life}</h1>
        <p className="mt-1 text-sm font-semibold">{info.title}</p>
        <p className="text-[11px] opacity-75">{info.subtitle}</p>
        <Bar label="Age" value={s.age} max={info.lifespan} />
        <Bar label="Jnana" value={s.atman.jnana} />
        <Bar label="Vairagya" value={s.atman.vairagya} />
        <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider">
          <span>Nishkama {s.atman.nishkamaKarma}</span>
          <span>Sakam {s.atman.sakamKarma}</span>
          <span>Adharma {s.atman.adharmaKarma}</span>
        </div>
        <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wider opacity-80">
          <span>Health {"♥".repeat(Math.max(0, s.health))}</span>
          <span>Merit {Math.round(s.merit)}</span>
        </div>
      </div>

      <div className={`absolute right-3 top-3 max-w-[240px] ${panel} px-4 py-3`}>
        <p className={`text-[10px] uppercase tracking-widest ${gold}`}>Current goal</p>
        <p className="mt-1 text-xs">{s.lifeEndAt ? s.lifeEndReason : objective}</p>
        {mokshaReady(s) && s.form === "sage" && <p className="mt-1 text-[11px] text-[oklch(0.9_0.14_85)]">Find the shadow spirit and give it all your merit.</p>}
        <div className="mt-2 flex gap-2">
          <Btn onClick={toggleJournal}>Journal (J)</Btn>
          <Btn onClick={toggleMute}>{s.muted ? "Unmute" : "Mute"}</Btn>
        </div>
      </div>

      {near && s.phase === "PLAY" && (
        <div className={`absolute bottom-40 left-1/2 -translate-x-1/2 ${panel} px-4 py-2 text-sm`}>
          <span className={gold}>E</span> · {near.label}
        </div>
      )}

      <div className="absolute bottom-4 left-4 grid grid-cols-3 gap-1.5">
        <span />
        <TouchBtn k="up" label="▲" className="h-12 w-12" />
        <span />
        <TouchBtn k="left" label="◀" className="h-12 w-12" />
        <TouchBtn k="down" label="▼" className="h-12 w-12" />
        <TouchBtn k="right" label="▶" className="h-12 w-12" />
      </div>
      <div className="absolute bottom-4 right-4 flex gap-2">
        {info.jump > 0 && <TouchBtn k="jump" label="Jump" className="h-14 w-16" />}
        <TouchBtn k="interact" label="Act (E)" className="h-14 w-16" />
      </div>
    </div>
  );
}

export function IntroOverlay() {
  const s = useGame();
  if (s.phase !== "INTRO") return null;
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-[oklch(0.1_0.05_290_/_0.85)] p-4">
      <div className={`max-w-md ${panel} p-6 text-center`}>
        <h1 className={`text-xl font-semibold tracking-[0.2em] ${gold}`}>LAWS OF KARMA</h1>
        <p className="mt-3 text-sm opacity-85">
          You cannot choose your body. Your deeds choose it for you. Live each life, act, and let the wheel decide what you become next.
        </p>
        <p className="mt-2 text-xs opacity-70">WASD / arrows to move · Space to jump · E to act · J for the journal</p>
        <div className="mt-5">
          <Btn onClick={begin}>Begin the first life</Btn>
        </div>
      </div>
    </div>
  );
}

export function DialogueOverlay() {
  const s = useGame();
  const node = currentNode();
  if (s.phase !== "DIALOGUE" || !node) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center p-4">
      <div className={`w-full max-w-xl ${panel} p-5`}>
        {node.title && <p className="text-[10px] uppercase tracking-widest opacity-60">{node.title}</p>}
        <p className={`text-xs uppercase tracking-widest ${gold}`}>{node.speaker}</p>
        <p className="mt-2 text-sm leading-relaxed">{node.text}</p>
        <div className="mt-4 flex flex-col gap-2">
          {node.choices.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => chooseOption(i)}
              className="rounded-xl border border-[oklch(0.72_0.12_85_/_0.35)] bg-[oklch(0.22_0.07_290_/_0.7)] px-3 py-2 text-left text-sm hover:bg-[oklch(0.32_0.09_290_/_0.8)]"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function JournalOverlay() {
  const s = useGame();
  if (!s.journalOpen) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[oklch(0.1_0.05_290_/_0.8)] p-4">
      <div className={`max-h-[85vh] w-full max-w-2xl overflow-y-auto ${panel} p-6`}>
        <div className="flex items-center justify-between">
          <h2 className={`text-lg font-semibold tracking-widest ${gold}`}>JOURNAL</h2>
          <Btn onClick={toggleJournal}>Close</Btn>
        </div>
        <p className="mt-2 text-xs opacity-75">
          Moksha needs Jnana ≥ {MOKSHA_THRESHOLD.jnana}, Vairagya ≥ {MOKSHA_THRESHOLD.vairagya} and no unresolved adharma.
        </p>
        <h3 className={`mt-4 text-xs uppercase tracking-widest ${gold}`}>Your lives</h3>
        {s.journal.length === 0 ? <p className="mt-1 text-sm opacity-70">No deeds recorded yet.</p> : s.journal.map((j, i) => <p key={i} className="mt-1 text-sm">{j}</p>)}
        <h3 className={`mt-4 text-xs uppercase tracking-widest ${gold}`}>Bhagavad Gita</h3>
        {GITA_EXCERPTS.map((g) => (
          <p key={g.ref} className="mt-2 text-sm italic">
            “{g.text}” <span className="not-italic opacity-70">— {g.ref}</span>
          </p>
        ))}
        <h3 className={`mt-4 text-xs uppercase tracking-widest ${gold}`}>Glossary</h3>
        {GLOSSARY.map((g) => (
          <p key={g.term} className="mt-1 text-sm">
            <span className={gold}>{g.term}:</span> {g.def}
          </p>
        ))}
      </div>
    </div>
  );
}

export function AuditOverlay() {
  const s = useGame();
  const a = s.audit;
  if (s.phase !== "AUDIT" || !a) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[oklch(0.08_0.05_290_/_0.9)] p-4">
      <div className={`max-w-md ${panel} p-6 text-center`}>
        <div className="mx-auto h-24 w-24 animate-spin rounded-full border-4 border-dashed border-[oklch(0.85_0.14_85)] [animation-duration:3s]" />
        <h2 className={`mt-4 text-lg font-semibold tracking-widest ${gold}`}>KARMIC AUDIT</h2>
        <p className="mt-2 text-sm opacity-85">{a.reason}</p>
        <p className="mt-3 text-xs uppercase tracking-wider">
          Life as {FORMS[a.form].title} · Nishkama {a.seeds.nishkama} · Sakam {a.seeds.sakam} · Adharma {a.seeds.adharma}
        </p>
        <p className="mt-4 text-sm">
          The wheel turns. You will be reborn as a <span className={gold}>{FORMS[a.next].title}</span>.
        </p>
      </div>
    </div>
  );
}

export function MokshaOverlay() {
  const s = useGame();
  if (s.phase !== "MOKSHA") return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[oklch(0.85_0.12_85_/_0.85)] p-4">
      <div className="max-w-md text-center text-[oklch(0.2_0.06_290)]">
        <h2 className="text-2xl font-semibold tracking-[0.3em]">MOKSHA</h2>
        <p className="mt-3 text-sm">You gave away every fruit of every deed. The Atman merges into Brahman. The wheel stops.</p>
        <p className="mt-2 text-xs opacity-80">After {s.life} lives.</p>
        <button type="button" onClick={restartWheel} className="mt-5 rounded-xl border border-[oklch(0.2_0.06_290)] px-4 py-2 text-sm">
          Turn the wheel again
        </button>
      </div>
    </div>
  );
}
