let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(m: boolean) {
  muted = m;
}

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur: number, type: OscillatorType, gain = 0.08, slideTo?: number) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  try {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), c.currentTime + dur);
    g.gain.setValueAtTime(0.0001, c.currentTime);
    g.gain.exponentialRampToValueAtTime(gain, c.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    osc.connect(g).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + dur + 0.05);
  } catch {
    /* audio is decorative — never crash the game */
  }
}

export const sfx = {
  unlock: () => ac(),
  jump: () => tone(520, 0.22, "sine", 0.06, 880),
  swap: () => tone(300, 0.3, "triangle", 0.06, 180),
  karma: () => {
    tone(440, 0.15, "sine", 0.04);
    tone(660, 0.18, "sine", 0.03);
  },
  chord: () => {
    [392, 494, 587, 784].forEach((f, i) => setTimeout(() => tone(f, 0.9, "sine", 0.05), i * 90));
  },
  hurt: () => tone(180, 0.35, "sawtooth", 0.06, 60),
  talk: () => tone(700, 0.08, "square", 0.025),
  drums: () => sfxExtra.drums(),
  chant: () => sfxExtra.chant(),
  chime: () => sfxExtra.chime(),
  rumble: () => {
    tone(70, 2.6, "sawtooth", 0.12, 30);
    tone(45, 3.0, "square", 0.09, 20);
  },
};

const sfxExtra = {
  drums: () => {
    [0, 180, 360, 720, 900, 1080].forEach((t, i) => setTimeout(() => tone(i % 3 === 2 ? 110 : 70, 0.35, "sine", 0.14, 40), t));
  },
  chant: () => {
    tone(146.8, 2.2, "sine", 0.05);
    tone(220, 2.2, "sine", 0.035);
    setTimeout(() => tone(1760, 0.8, "sine", 0.02), 200);
    setTimeout(() => tone(2349, 0.9, "sine", 0.015), 500);
  },
  chime: () => {
    [880, 1318, 1760].forEach((f, i) => setTimeout(() => tone(f, 1.2, "sine", 0.035), i * 160));
  },
};
