export type Form = "jiva" | "tortoise";

export type Box = {
  x: number;
  z: number;
  w: number;
  d: number;
  /** stepping here silently adds hidden bad karma */
  forbidden?: boolean;
};

export type Platform = { x: number; y: number; z: number; w: number; d: number };

export type NpcSpot = { id: string; x: number; z: number; treeId: string; label: string };

export type Loka = {
  id: string;
  name: string;
  subtitle: string;
  storyTreeId: string;
  ground: { w: number; d: number };
  groundColor: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  ambient: number;
  start: [number, number, number];
  platforms: Platform[];
  hazards: Box[];
  npcs: NpcSpot[];
  spirit: [number, number, number];
  portal: [number, number, number];
};

export const LOKAS_DATA: Loka[] = [
  {
    id: "bhuloka",
    name: "Bhuloka",
    subtitle: "The Earthly Realm",
    storyTreeId: "bhuloka_intro",
    ground: { w: 70, d: 70 },
    groundColor: "#2a2352",
    fogColor: "#1b1440",
    fogNear: 18,
    fogFar: 72,
    ambient: 0.45,
    start: [0, 1.2, 22],
    platforms: [
      { x: -8, y: 1.2, z: 8, w: 7, d: 7 },
      { x: 9, y: 2.2, z: 2, w: 6, d: 6 },
      { x: -2, y: 3.2, z: -10, w: 8, d: 6 },
    ],
    hazards: [
      { x: -9, z: 13, w: 14, d: 4 },
      { x: -14, z: -2, w: 5, d: 12 },
      { x: 14, z: -12, w: 8, d: 6, forbidden: true },
    ],
    npcs: [{ id: "rishi", x: -12, z: 16, treeId: "rishi", label: "Rishi Agasti" }],
    spirit: [0, 1.4, -20],
    portal: [0, 2, -27],
  },
  {
    id: "patala",
    name: "Patala",
    subtitle: "The Underworld",
    storyTreeId: "patala_intro",
    ground: { w: 70, d: 70 },
    groundColor: "#3a1430",
    fogColor: "#2a0a18",
    fogNear: 12,
    fogFar: 58,
    ambient: 0.3,
    start: [-20, 1.2, 22],
    platforms: [
      { x: -12, y: 1.6, z: 10, w: 6, d: 6 },
      { x: 0, y: 3.0, z: 4, w: 6, d: 6 },
      { x: 12, y: 1.8, z: -2, w: 6, d: 6 },
      { x: 2, y: 4.2, z: -12, w: 7, d: 7 },
    ],
    hazards: [
      { x: -6, z: 16, w: 16, d: 4 },
      { x: 6, z: 6, w: 10, d: 6 },
      { x: -16, z: -12, w: 10, d: 8 },
      { x: 18, z: 14, w: 8, d: 8, forbidden: true },
    ],
    npcs: [{ id: "asura", x: 16, z: 8, treeId: "asura", label: "Bound Asura" }],
    spirit: [0, 1.4, -21],
    portal: [0, 2, -28],
  },
];

/* ------------------------------------------------------------------ */
/* Branching dialogue trees                                            */
/* ------------------------------------------------------------------ */

export type Effect = {
  karma?: number;
  badKarma?: number;
  flag?: string;
  flagValue?: boolean;
  journal?: { title: string; text: string };
  form?: Form;
  removeHazards?: boolean;
};

export type Choice = { label: string; effect?: Effect; next: string | null };

export type Node = { speaker: string; text: string; choices: Choice[] };

export type Tree = Record<string, Node>;

export const STORY_TREES: Record<string, Tree> = {
  bhuloka_intro: {
    start: {
      speaker: "The Wheel",
      text: "A spark of soul falls into Bhuloka. A drowning calf cries in the river while a merchant offers you a purse of gold to walk on.",
      choices: [
        {
          label: "Wade in and lift the calf out.",
          effect: {
            karma: 10,
            flag: "savedCalf",
            flagValue: true,
            journal: {
              title: "Parable of the Calf",
              text: "You gave your time to a creature that could never repay you. The river remembered.",
            },
          },
          next: "form",
        },
        {
          label: "Take the gold and keep walking.",
          effect: {
            karma: -5,
            badKarma: 4,
            flag: "tookGold",
            flagValue: true,
            journal: {
              title: "Parable of the Purse",
              text: "The purse was light. Something else grew heavy, though you could not name it.",
            },
          },
          next: "form",
        },
        {
          label: "Call for help, then move on.",
          effect: { badKarma: 1, journal: { title: "Parable of the Shout", text: "A shout is cheaper than wet feet." } },
          next: "form",
        },
      ],
    },
    form: {
      speaker: "The Wheel",
      text: "Choose the body you will wear through this realm.",
      choices: [
        { label: "Jiva — swift light, fragile.", effect: { form: "jiva" }, next: null },
        { label: "Tortoise — slow shell, unharmed by thorns.", effect: { form: "tortoise" }, next: null },
      ],
    },
  },
  patala_intro: {
    start: {
      speaker: "The Wheel",
      text: "Patala's crimson fog closes in. A chained spirit begs you to break its bonds — but the chains hold back the thorn-fields too.",
      choices: [
        {
          label: "Break the chains. Let it be free.",
          effect: {
            karma: 5,
            flag: "freedSpirit",
            flagValue: true,
            journal: { title: "Parable of the Chain", text: "Freedom given is never lost, only relocated." },
          },
          next: "form",
        },
        {
          label: "Leave it bound. Your path is safer.",
          effect: {
            badKarma: 5,
            flag: "leftBound",
            flagValue: true,
            journal: { title: "Parable of the Safe Road", text: "You kept the road clean and the debt unpaid." },
          },
          next: "form",
        },
      ],
    },
    form: {
      speaker: "The Wheel",
      text: "Choose the body you will wear through the underworld.",
      choices: [
        { label: "Jiva — swift light, fragile.", effect: { form: "jiva" }, next: null },
        { label: "Tortoise — slow shell, unharmed by thorns.", effect: { form: "tortoise" }, next: null },
      ],
    },
  },
  rishi: {
    start: {
      speaker: "Rishi Agasti",
      text: "Little spark. The shadow at the gate is not your enemy — it is hungry for what you refuse to give away.",
      choices: [
        {
          label: "What should I give?",
          next: "teach",
        },
        {
          label: "I have nothing to spare.",
          effect: { badKarma: 2 },
          next: "warn",
        },
      ],
    },
    teach: {
      speaker: "Rishi Agasti",
      text: "Your karma. All hundred grains of it. Empty yourself at the gate and it will open.",
      choices: [
        {
          label: "Thank you, teacher.",
          effect: {
            karma: 10,
            journal: { title: "The Rishi's Teaching", text: "Hold 'E' by the shadow spirit until your karma is gone. Emptiness opens the gate." },
          },
          next: null,
        },
      ],
    },
    warn: {
      speaker: "Rishi Agasti",
      text: "Then you will carry it. Weight does not vanish because you stop counting it.",
      choices: [{ label: "Leave.", next: null }],
    },
  },
  asura: {
    start: {
      speaker: "Bound Asura",
      text: "You smell of daylight. Cut me loose and I will clear the thorns from your road.",
      choices: [
        {
          label: "Free him and trust the offer.",
          effect: {
            removeHazards: true,
            karma: -10,
            flag: "sparedAsura",
            flagValue: true,
            journal: { title: "Parable of the Asura", text: "You paid in karma; the thorns withdrew. Trust is a currency too." },
          },
          next: "freed",
        },
        {
          label: "Refuse and walk away.",
          effect: { badKarma: 2 },
          next: "refused",
        },
        {
          label: "Mock him and kick the chain.",
          effect: { badKarma: 4, journal: { title: "Parable of the Kick", text: "Cruelty to the bound is cruelty to yourself, delayed." } },
          next: "refused",
        },
      ],
    },
    freed: {
      speaker: "Bound Asura",
      text: "The thorns sleep. Go, spark — and remember who unbound you.",
      choices: [{ label: "Go.", next: null }],
    },
    refused: {
      speaker: "Bound Asura",
      text: "Then walk the thorns yourself. They were made from refusals like yours.",
      choices: [{ label: "Leave.", next: null }],
    },
  },
  silhouette: {
    start: {
      speaker: "???",
      text: "Have you heard the good word?",
      choices: [{ label: "…", next: null }],
    },
  },
};
