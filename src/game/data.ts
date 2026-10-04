export type Form = "animal" | "merchant" | "prince" | "sage";
export type Seed = "nishkama" | "sakam" | "adharma";

export type Box = { x: number; z: number; w: number; d: number };
export type Platform = { x: number; y: number; z: number; w: number; d: number };
export type V3 = [number, number, number];

export type FormInfo = {
  id: Form;
  title: string;
  subtitle: string;
  scenario: string;
  speed: number;
  jump: number; // 0 = cannot jump
  lifespan: number; // seconds of life
  fog: string;
  ground: string;
  ambient: number;
  objectives: string[];
};

/** All form data. Every life takes place in its own procedural 3D scenario. */
export const FORMS: Record<Form, FormInfo> = {
  prince: {
    id: "prince",
    title: "Kshatriya Prince",
    subtitle: "Balanced duty and valor",
    scenario: "Kurukshetra — 5,000 soldiers await your word. Your own teacher leads the opposing army.",
    speed: 8,
    jump: 8,
    lifespan: 240,
    fog: "#3a2a4a",
    ground: "#6b5238",
    ambient: 0.55,
    objectives: ["Walk to your mentor's chariot across the field", "Decide how you will fight"],
  },
  merchant: {
    id: "merchant",
    title: "Grain Merchant",
    subtitle: "Reaped from wealth-seeking deeds",
    scenario: "A three-year drought. Your silos are full; the village is hungry.",
    speed: 7,
    jump: 0,
    lifespan: 240,
    fog: "#6a4a2a",
    ground: "#8a6a3e",
    ambient: 0.6,
    objectives: ["Hear the village elder", "Open all three silos"],
  },
  animal: {
    id: "animal",
    title: "Ox of the Field",
    subtitle: "Bound by past adharma",
    scenario: "A body of burden. Cross the thorn fields to reach the watering pool and survive.",
    speed: 7,
    jump: 10,
    lifespan: 200,
    fog: "#2a3a2e",
    ground: "#3e4a30",
    ambient: 0.5,
    objectives: ["Cross the thorn fields to the watering pool"],
  },
  sage: {
    id: "sage",
    title: "Forest Sage",
    subtitle: "Ripened from selfless action and wisdom",
    scenario: "A quiet ashram in the deep forest. Align the mirrors so the dawn light reaches the crystal.",
    speed: 7,
    jump: 8,
    lifespan: 260,
    fog: "#1f2f4a",
    ground: "#26382c",
    ambient: 0.55,
    objectives: ["Align the three mirrors to guide the light", "Answer your disciple"],
  },
};

export const START: V3 = [0, 1, 14];
export const GROUND = 64;
export const SIL_POS: V3 = [-26, 2.6, -26];

/* ------------------------- scenario layout data ------------------------- */

export const PRINCE = { mentor: [0, 0, -8] as V3 };

export const MERCHANT = {
  elder: [0, 0, 4] as V3,
  silos: [
    [-11, 0, -8],
    [0, 0, -15],
    [11, 0, -8],
  ] as V3[],
};

export const ANIMAL = {
  pool: [0, 0, -24] as V3,
  calf: [10, 0, 6] as V3,
  hazards: [
    { x: 0, z: -3, w: 64, d: 6 },
    { x: 0, z: -15, w: 64, d: 6 },
  ] as Box[],
  platforms: [
    { x: -6, y: 1.0, z: -3, w: 3, d: 2 },
    { x: 6, y: 1.0, z: -3, w: 3, d: 2 },
    { x: 0, y: 1.0, z: -15, w: 3, d: 2 },
  ] as Platform[],
};

export const SAGE = {
  disciple: [10, 0, 8] as V3,
  source: [-14, 1.6, -2] as V3,
  mirrors: [
    [-4, 1.6, -2],
    [-4, 1.6, -14],
    [8, 1.6, -14],
  ] as V3[],
  /** correct rotation step (0–3) for each mirror */
  solution: [1, 3, 2],
  crystal: [8, 1.6, -24] as V3,
  spirit: [0, 0, -22] as V3,
};

/* ------------------------------ dialogue ------------------------------ */

export type Effect = {
  seed?: Seed;
  jnana?: number;
  vairagya?: number;
  badKarma?: number;
  journal?: string;
  complete?: boolean;
  unlockSilos?: boolean;
  hoard?: boolean;
};

export type Choice = { label: string; tag?: Seed; effect?: Effect; next?: string };
export type Node = { speaker: string; text: string; choices: Choice[]; title?: string };
export type Tree = Record<string, Node>;

export const MOKSHA_THRESHOLD = { jnana: 80, vairagya: 80 };

export const GITA_EXCERPTS: { ref: string; text: string }[] = [
  { ref: "Bhagavad Gita 2.47", text: "You have a right to your actions, but never to the fruits of your actions. Do not let the fruit be your motive, and do not be attached to inaction." },
  { ref: "Bhagavad Gita 2.22", text: "As a person puts on new garments, giving up old ones, the soul similarly accepts new bodies, giving up the old and useless ones." },
  { ref: "Bhagavad Gita 3.19", text: "Therefore, without attachment, always do the work that must be done; by working without attachment one attains the Supreme." },
  { ref: "Bhagavad Gita 4.37", text: "As a blazing fire turns wood to ashes, so the fire of knowledge burns all karma to ashes." },
  { ref: "Bhagavad Gita 6.5", text: "Lift yourself by your own self; do not degrade yourself. The self is its own friend, and the self is its own enemy." },
  { ref: "Bhagavad Gita 18.66", text: "Abandon all varieties of dharma and simply surrender unto Me. I shall deliver you from all sinful reactions; do not fear." },
];

export const GLOSSARY: { term: string; def: string }[] = [
  { term: "Karma", def: "Action, and the seed of consequence every action plants." },
  { term: "Nishkama Karma", def: "Selfless action done as duty, without craving its fruit." },
  { term: "Sakam Karma", def: "Good action done for reward, praise or gain. It binds you to worldly lives." },
  { term: "Adharma", def: "Action against righteousness: harm, desertion, greed. It drags the soul into lower births." },
  { term: "Dharma", def: "Your rightful duty and the cosmic order that sustains all beings." },
  { term: "Samsara", def: "The endless wheel of birth, death and rebirth." },
  { term: "Atman", def: "The eternal self that passes from body to body." },
  { term: "Jnana", def: "Wisdom: direct knowledge of the self and the real." },
  { term: "Vairagya", def: "Detachment: freedom from craving and aversion." },
  { term: "Kshatriya", def: "The warrior-ruler order, whose dharma is to protect." },
  { term: "Moksha", def: "Liberation from samsara: the Atman merging into Brahman." },
  { term: "Brahman", def: "The infinite, undivided reality underlying all things." },
];
