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

export type TrialStage = {
  id: string;
  tree: string;
  node: string;
  position: V3;
  label: string;
  kind: "battle" | "mercy" | "city" | "court" | "famine" | "trade" | "widow" | "temple" | "calf" | "plough" | "tiger" | "trough" | "teaching" | "hunter" | "debate" | "palace";
  atmosphere: { sky: string; ground: string; ambient: number; fogNear: number; fogFar: number };
};

export const FORM_TREE: Record<Form, string> = { prince: "mentor", merchant: "elder", animal: "calf", sage: "disciple" };

/** The four physical encounters in each life, ordered along a walkable route. */
export const TRIAL_STAGES: Record<Form, TrialStage[]> = {
  prince: [
    { id: "prince-battle", tree: "mentor", node: "start", position: [0, 0, 5], label: "Face Drona", kind: "battle", atmosphere: { sky: "#443248", ground: "#74583d", ambient: 0.62, fogNear: 20, fogFar: 74 } },
    { id: "prince-mercy", tree: "mentor", node: "s1", position: [11, 0, -3], label: "Approach the wounded soldier", kind: "mercy", atmosphere: { sky: "#302b46", ground: "#54473e", ambient: 0.42, fogNear: 12, fogFar: 52 } },
    { id: "prince-city", tree: "mentor", node: "s2", position: [0, 0, -17], label: "Enter the conquered city", kind: "city", atmosphere: { sky: "#5c3030", ground: "#59433a", ambient: 0.46, fogNear: 14, fogFar: 58 } },
    { id: "prince-court", tree: "mentor", node: "s3", position: [-13, 0, -6], label: "Hear the Queen", kind: "court", atmosphere: { sky: "#35284d", ground: "#574438", ambient: 0.68, fogNear: 22, fogFar: 76 } },
  ],
  merchant: [
    { id: "merchant-famine", tree: "elder", node: "start", position: [0, 0, 5], label: "Hear the village elder", kind: "famine", atmosphere: { sky: "#725039", ground: "#8a693c", ambient: 0.64, fogNear: 18, fogFar: 66 } },
    { id: "merchant-trade", tree: "elder", node: "s1", position: [-11, 0, -8], label: "Meet the rival trader", kind: "trade", atmosphere: { sky: "#5a4935", ground: "#765d39", ambient: 0.58, fogNear: 16, fogFar: 60 } },
    { id: "merchant-widow", tree: "elder", node: "s2", position: [10, 0, -8], label: "Meet the widow", kind: "widow", atmosphere: { sky: "#494238", ground: "#63533f", ambient: 0.46, fogNear: 12, fogFar: 52 } },
    { id: "merchant-temple", tree: "elder", node: "s3", position: [0, 0, -21], label: "Attend the temple dedication", kind: "temple", atmosphere: { sky: "#506071", ground: "#526348", ambient: 0.74, fogNear: 24, fogFar: 82 } },
  ],
  animal: [
    { id: "animal-calf", tree: "calf", node: "start", position: [10, 0, 7], label: "Approach the trapped calf", kind: "calf", atmosphere: { sky: "#344536", ground: "#3e4a30", ambient: 0.52, fogNear: 14, fogFar: 56 } },
    { id: "animal-plough", tree: "calf", node: "s1", position: [-11, 0, 0], label: "Approach the farmer", kind: "plough", atmosphere: { sky: "#5a513b", ground: "#655838", ambient: 0.66, fogNear: 20, fogFar: 70 } },
    { id: "animal-tiger", tree: "calf", node: "s2", position: [10, 0, -13], label: "Protect the herd", kind: "tiger", atmosphere: { sky: "#182f2a", ground: "#273b2b", ambient: 0.34, fogNear: 9, fogFar: 42 } },
    { id: "animal-trough", tree: "calf", node: "s3", position: [0, 0, -24], label: "Approach the trough", kind: "trough", atmosphere: { sky: "#365b63", ground: "#425640", ambient: 0.72, fogNear: 20, fogFar: 74 } },
  ],
  sage: [
    { id: "sage-teaching", tree: "disciple", node: "start", position: [9, 0, 8], label: "Teach your disciple", kind: "teaching", atmosphere: { sky: "#213d43", ground: "#294331", ambient: 0.62, fogNear: 18, fogFar: 68 } },
    { id: "sage-hunter", tree: "disciple", node: "s1", position: [-10, 0, 4], label: "Approach the sick hunter", kind: "hunter", atmosphere: { sky: "#24373c", ground: "#34443a", ambient: 0.48, fogNear: 12, fogFar: 52 } },
    { id: "sage-debate", tree: "disciple", node: "s2", position: [-8, 0, -12], label: "Meet the rival sage", kind: "debate", atmosphere: { sky: "#302c4d", ground: "#30383b", ambient: 0.56, fogNear: 16, fogFar: 62 } },
    { id: "sage-palace", tree: "disciple", node: "s3", position: [8, 0, -22], label: "Receive the royal messenger", kind: "palace", atmosphere: { sky: "#513b58", ground: "#3c483b", ambient: 0.7, fogNear: 22, fogFar: 78 } },
  ],
};

type Opt = { label: string; journal: string; extra?: Effect };
type Scene = { speaker: string; text: string; n: Opt; s: Opt; a: Opt; first?: Effect };

/** Builds a tree of several scenarios played back-to-back. Every choice leads to the next scenario. */
function chain(life: string, scenes: Scene[], completeAtEnd: boolean): Tree {
  const tree: Tree = {};
  scenes.forEach((sc, i) => {
    const last = i === scenes.length - 1;
    const next = last ? undefined : `s${i + 1}`;
    const mk = (o: Opt, seed: Seed, base: Effect): Choice => ({
      label: o.label,
      tag: seed,
      ...(next ? { next } : {}),
      effect: { seed, ...base, ...o.extra, journal: `As a ${life}, ${o.journal}`, complete: last && completeAtEnd },
    });
    tree[i === 0 ? "start" : `s${i}`] = {
      title: `Trial ${i + 1} of ${scenes.length}`,
      speaker: sc.speaker,
      text: sc.text,
      choices: [
        mk(sc.n, "nishkama", { jnana: 4, vairagya: 5 }),
        mk(sc.s, "sakam", { jnana: 1, vairagya: -2 }),
        mk(sc.a, "adharma", { vairagya: -4, badKarma: 2 }),
      ],
    };
  });
  return tree;
}

export const STORY_TREES: Record<string, Tree> = {
  mentor: chain("prince", [
    {
      speaker: "Drona, your teacher",
      text: "So, my student stands against me. Five thousand men wait on your signal, and five thousand on mine. What will you do, Prince?",
      n: { label: "Fight because it is my duty, and give up any claim to the outcome.", journal: "you fought out of duty and let go of victory." },
      s: { label: "Fight for glory. Songs will be sung of my conquest.", journal: "you fought for fame and conquest." },
      a: { label: "Drop my bow and flee, leaving my soldiers to die.", journal: "you deserted your army." },
    },
    {
      speaker: "A wounded enemy soldier",
      text: "At dusk you find a boy from the enemy ranks, bleeding in the mud. He begs for water. Your guards watch you.",
      n: { label: "Give him water and send him to the healers. He is no enemy now.", journal: "you showed mercy to a fallen enemy." },
      s: { label: "Help him loudly, so the army sees how merciful I am.", journal: "you showed mercy so others would praise you." },
      a: { label: "Leave him. Better, take his armour as a trophy.", journal: "you stripped a dying boy for trophies." },
    },
    {
      speaker: "Your general",
      text: "The battle is won. The enemy city lies open, full of gold and frightened families. The men want plunder.",
      n: { label: "Forbid looting. Protect the city as if it were our own.", journal: "you protected a conquered city." },
      s: { label: "Spare the people, but take the treasury to build my monument.", journal: "you took the treasury for your own monument." },
      a: { label: "Let the men take whatever they want.", journal: "you let your army plunder the innocent." },
    },
    {
      speaker: "Your old mother, the Queen",
      text: "Years later the crown is yours. Your brother, who once fought against you, kneels and asks forgiveness.",
      n: { label: "Embrace him. The war is over, and so is my anger.", journal: "you forgave your brother." },
      s: { label: "Forgive him in public, so the court sees a generous king.", journal: "you forgave your brother for the court's applause." },
      a: { label: "Exile him and seize his lands.", journal: "you exiled your brother and took his lands." },
    },
  ], true),
  elder: chain("merchant", [
    {
      speaker: "Village Elder",
      text: "Merchant, the wells are dust and the children are thin. Your silos hold enough for all of us. What will you do?",
      n: { label: "Open the silos to everyone. Nothing is owed.", journal: "you gave your grain freely during the famine.", extra: { unlockSilos: true } },
      s: { label: "Sell the grain at a fair price, and make sure they remember my generosity.", journal: "you traded grain for praise and profit.", extra: { unlockSilos: true } },
      a: { label: "Hoard it. Prices will triple next month.", journal: "you hoarded grain while the village starved.", extra: { unlockSilos: true, hoard: true } },
    },
    {
      speaker: "A rival trader",
      text: "A rival whispers: 'Mix sand into the sacks. Nobody weighs grain carefully in a famine. We'd double our profit.'",
      n: { label: "Refuse. Every sack will be honest weight.", journal: "you refused to cheat the starving." },
      s: { label: "Refuse, then tell everyone how honest I am.", journal: "you stayed honest mostly for your reputation." },
      a: { label: "Agree. Hungry people won't notice.", journal: "you sold sand to the starving." },
    },
    {
      speaker: "A widow with empty hands",
      text: "A widow with no coins asks for one sack for her three children. Your clerk says it will set a bad example.",
      n: { label: "Give her two sacks and ask nothing.", journal: "you fed a widow and asked nothing." },
      s: { label: "Give it, but have my name carved over her door.", journal: "you helped a widow for public credit." },
      a: { label: "Turn her away. Business is business.", journal: "you turned away a starving widow." },
    },
    {
      speaker: "The monsoon priest",
      text: "The rains return. The village wants to build a temple and name it after you. The priest asks what you wish.",
      n: { label: "Name it for the village. I only did what was right.", journal: "you refused to have the temple named after you." },
      s: { label: "Yes, carve my name in gold above the gate.", journal: "you put your name above the temple gate." },
      a: { label: "Only if they repay every grain, with interest.", journal: "you demanded payment from a recovering village." },
    },
  ], false),
  calf: chain("ox", [
    {
      speaker: "A trapped calf",
      text: "A calf is caught in the thorns, bleating. The herd has moved on. You are thirsty and tired.",
      n: { label: "Break the thorns with your horns and free it.", journal: "you freed a trapped calf." },
      s: { label: "Free it, hoping the herd will let you lead.", journal: "you helped a calf to gain status in the herd." },
      a: { label: "Trample past it toward the water.", journal: "you trampled a helpless calf." },
    },
    {
      speaker: "Your farmer",
      text: "The old farmer is too weak to plough. The field must be turned before the rains, or his family will go hungry.",
      n: { label: "Pull the plough all day without being driven.", journal: "you ploughed for your farmer without complaint." },
      s: { label: "Work hard, but only while he has sweet grass for me.", journal: "you worked only for treats." },
      a: { label: "Kick the plough over and wander off.", journal: "you abandoned a struggling farmer." },
    },
    {
      speaker: "A tiger in the reeds",
      text: "A tiger stalks the young of the herd. You are strong enough to stand between them, but it may cost you dearly.",
      n: { label: "Stand firm in front of the young.", journal: "you guarded the herd against a tiger." },
      s: { label: "Stand firm, so the herd names me its leader.", journal: "you faced the tiger to win leadership." },
      a: { label: "Push a weaker ox toward the tiger and escape.", journal: "you sacrificed another to save yourself." },
    },
    {
      speaker: "An old ox at the trough",
      text: "At the last trough an old, slow ox is drinking. There is only room for one of you at a time.",
      n: { label: "Wait patiently until it has finished.", journal: "you waited patiently for an elder." },
      s: { label: "Wait, but make sure the herd sees it.", journal: "you showed patience for others to see." },
      a: { label: "Shove it away from the water.", journal: "you drove an old ox from the water." },
    },
  ], false),
  disciple: chain("sage", [
    {
      speaker: "Young Disciple",
      text: "Guruji, the kings offer gold for your teaching. Should the wisdom of the light be sold, kept, or given?",
      n: { label: "Given freely to anyone who asks.", journal: "you taught freely." },
      s: { label: "Taught to kings, so our ashram grows famous.", journal: "you taught for renown." },
      a: { label: "Kept hidden. The foolish do not deserve it.", journal: "you hoarded wisdom out of contempt." },
    },
    {
      speaker: "A hunter at the ashram gate",
      text: "A hunter who killed deer in your forest arrives, starving and feverish. Your disciples want to send him away.",
      n: { label: "Bring him in and nurse him back to health.", journal: "you cared for a hunter who had wronged the forest." },
      s: { label: "Heal him, then make him swear to spread word of my kindness.", journal: "you healed a man in exchange for fame." },
      a: { label: "Curse him and drive him out.", journal: "you cursed a sick man at your gate." },
    },
    {
      speaker: "A rival sage",
      text: "A famous rival challenges you to a public debate. You know a secret that could humiliate him.",
      n: { label: "Debate only the ideas, and praise his good points.", journal: "you debated with honesty and respect." },
      s: { label: "Debate fairly, but make sure I'm seen to win.", journal: "you debated to be seen as the wisest." },
      a: { label: "Reveal his secret and shame him.", journal: "you destroyed a rival with a secret." },
    },
    {
      speaker: "The king's messenger",
      text: "The king offers to make you royal guru: a palace, servants and power. You would have to leave the forest.",
      n: { label: "Decline. A palace is just another cage.", journal: "you turned down the palace." },
      s: { label: "Accept. Think of the honour!", journal: "you accepted a palace for honour." },
      a: { label: "Accept, and use the power to punish those who doubted me.", journal: "you took power to settle old scores." },
    },
  ], true),
  silhouette: {
    start: {
      speaker: "???",
      text: "Have you heard the good word?",
      choices: [{ label: "…" }],
    },
  },
};

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
