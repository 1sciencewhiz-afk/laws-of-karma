import type { Choice, Effect, Form, Node, Seed, Tree, V3 } from "./data";

/**
 * Every trial is its own self-contained map. Each life plays four slots; slots 1 and 2
 * are replaced by "karmic echo" scenarios chosen from the soul's lifelong karma.
 */

export type Disposition = "neutral" | "pure" | "worldly" | "shadowed";

export type MapKind =
  | "battle" | "mercy" | "city" | "court"
  | "famine" | "trade" | "widow" | "temple"
  | "calf" | "plough" | "tiger" | "trough"
  | "teaching" | "hunter" | "debate" | "palace"
  | "river" | "ruins" | "shrine" | "storm" | "bazaar" | "cave" | "festival" | "graveyard";

export type Atmosphere = { sky: string; ground: string; ambient: number; fogNear: number; fogFar: number; light: string };

type Opt = { label: string; journal: string; extra?: Effect };

export type Scenario = {
  id: string;
  form: Form;
  slot: 0 | 1 | 2 | 3;
  when?: Exclude<Disposition, "neutral">;
  label: string;
  place: string;
  kind: MapKind;
  actor: "person" | "ox" | "calf" | "tiger";
  /** where this encounter stands in its life's world; shared by every echo variant of the same slot */
  position: V3;
  atmosphere: Atmosphere;
  speaker: string;
  text: string;
  n: Opt;
  s: Opt;
  a: Opt;
};

const at = (sky: string, ground: string, ambient: number, fogNear: number, fogFar: number, light = "#fff1d6"): Atmosphere => ({ sky, ground, ambient, fogNear, fogFar, light });

export const DISPOSITION_TEXT: Record<Disposition, { title: string; echo: string }> = {
  neutral: { title: "Unwritten", echo: "Your soul carries little karma yet. The world meets you as it is." },
  pure: { title: "Selfless", echo: "Your selfless deeds from past lives draw quieter, subtler tests of the ego." },
  worldly: { title: "Desire-bound", echo: "Your craving for praise in past lives draws fame, wealth and temptation to you." },
  shadowed: { title: "Shadowed", echo: "Your past adharma returns. Those you harmed, or people like them, cross your path." },
};

export const SCENARIOS: Scenario[] = [
  /* ------------------------------ PRINCE ------------------------------ */
  {
    id: "prince-battle", form: "prince", slot: 0, label: "Face Drona", place: "Kurukshetra battlefield", kind: "battle", actor: "person", position: [0, 0, 5] as V3,
    atmosphere: at("#4a3350", "#74583d", 0.62, 22, 80),
    speaker: "Drona, your teacher",
    text: "So, my student stands against me. Five thousand men wait on your signal, and five thousand on mine. What will you do, Prince?",
    n: { label: "Fight because it is my duty, and give up any claim to the outcome.", journal: "you fought out of duty and let go of victory." },
    s: { label: "Fight for glory. Songs will be sung of my conquest.", journal: "you fought for fame and conquest." },
    a: { label: "Drop my bow and flee, leaving my soldiers to die.", journal: "you deserted your army." },
  },
  {
    id: "prince-mercy", form: "prince", slot: 1, label: "Approach the wounded soldier", place: "Casualty field at dusk", kind: "mercy", actor: "person", position: [11, 0, -3] as V3,
    atmosphere: at("#2b2742", "#4a3f39", 0.42, 12, 52, "#ffb27a"),
    speaker: "A wounded enemy soldier",
    text: "At dusk you find a boy from the enemy ranks, bleeding in the mud. He begs for water. Your guards watch you.",
    n: { label: "Give him water and send him to the healers. He is no enemy now.", journal: "you showed mercy to a fallen enemy." },
    s: { label: "Help him loudly, so the army sees how merciful I am.", journal: "you showed mercy so others would praise you." },
    a: { label: "Leave him. Better, take his armour as a trophy.", journal: "you stripped a dying boy for trophies." },
  },
  {
    id: "prince-ghosts", form: "prince", slot: 1, when: "shadowed", label: "Meet the grieving families", place: "Cremation ground", kind: "graveyard", actor: "person", position: [11, 0, -3] as V3,
    atmosphere: at("#1d1820", "#2f2a2b", 0.36, 8, 40, "#ff8a5c"),
    speaker: "Widows at the cremation ground",
    text: "Families of soldiers who died when their prince fled, in some other age, gather at the pyres. They do not know you, yet their grief feels strangely familiar.",
    n: { label: "Kneel beside them, carry the wood, and pay for every funeral.", journal: "you served the grieving at the pyres." },
    s: { label: "Pay for the funerals, and have heralds announce my charity.", journal: "you paid for funerals to be praised." },
    a: { label: "Order the guards to clear them from the road.", journal: "you drove mourners from the road." },
  },
  {
    id: "prince-hermit", form: "prince", slot: 1, when: "pure", label: "Meet the hermit at the ford", place: "River crossing at dawn", kind: "river", actor: "person", position: [11, 0, -3] as V3,
    atmosphere: at("#7fa3b8", "#55704f", 0.82, 26, 90, "#fff6dc"),
    speaker: "A hermit at the river ford",
    text: "A hermit sits praying in the ford your army must cross. 'You have walked this road with clean hands before,' he smiles. 'Will you wait for an old man to finish?'",
    n: { label: "Halt the army and wait in silence.", journal: "you halted an army for a hermit's prayer." },
    s: { label: "Wait, and make sure the chroniclers record my patience.", journal: "you waited so chroniclers would praise you." },
    a: { label: "Have him dragged out. The army will not wait.", journal: "you dragged a praying hermit from the river." },
  },
  {
    id: "prince-bards", form: "prince", slot: 1, when: "worldly", label: "Hear the court bards", place: "Victory festival", kind: "festival", actor: "person", position: [11, 0, -3] as V3,
    atmosphere: at("#5b2f5e", "#6d4a3a", 0.78, 20, 76, "#ffcf8a"),
    speaker: "The court bard",
    text: "Bards have come to sing of your deeds, some true, most invented. Your fame from past lives seems to follow you like perfume.",
    n: { label: "Tell them to sing of the fallen soldiers instead.", journal: "you gave your songs to the fallen." },
    s: { label: "Let them sing. Pay double for the invented verses.", journal: "you paid for songs of invented glory." },
    a: { label: "Pay them to mock my rivals as cowards.", journal: "you paid bards to shame your rivals." },
  },
  {
    id: "prince-city", form: "prince", slot: 2, label: "Enter the conquered city", place: "Gates of the conquered city", kind: "city", actor: "person", position: [0, 0, -17] as V3,
    atmosphere: at("#6a3330", "#59433a", 0.5, 14, 60, "#ff9a66"),
    speaker: "Your general",
    text: "The battle is won. The enemy city lies open, full of gold and frightened families. The men want plunder.",
    n: { label: "Forbid looting. Protect the city as if it were our own.", journal: "you protected a conquered city." },
    s: { label: "Spare the people, but take the treasury to build my monument.", journal: "you took the treasury for your own monument." },
    a: { label: "Let the men take whatever they want.", journal: "you let your army plunder the innocent." },
  },
  {
    id: "prince-revolt", form: "prince", slot: 2, when: "shadowed", label: "Face the rebel leader", place: "Burned village", kind: "ruins", actor: "person", position: [0, 0, -17] as V3,
    atmosphere: at("#3a1f1c", "#3b2c26", 0.4, 10, 48, "#ff7044"),
    speaker: "A rebel leader",
    text: "A burned village has risen in revolt. They say a prince once let his soldiers loot them. Their leader faces you with a rusted sword.",
    n: { label: "Lay down my sword, hear them, and rebuild their homes.", journal: "you rebuilt the village that rose against you." },
    s: { label: "Promise reforms in a grand public speech.", journal: "you answered a revolt with speeches." },
    a: { label: "Crush the revolt as an example.", journal: "you crushed a starving revolt." },
  },
  {
    id: "prince-storm", form: "prince", slot: 2, when: "pure", label: "Visit the flooded camp", place: "Camp in the monsoon", kind: "storm", actor: "person", position: [0, 0, -17] as V3,
    atmosphere: at("#2c3a4a", "#3c4440", 0.5, 10, 46, "#bcd6ff"),
    speaker: "A drenched foot soldier",
    text: "A storm floods the lower camp. The common soldiers' tents are drowning; your own pavilion on the hill is dry.",
    n: { label: "Give my pavilion to the wounded and sleep in the rain.", journal: "you gave your shelter to the wounded." },
    s: { label: "Open my pavilion, but only to officers who praise me.", journal: "you sheltered only your flatterers." },
    a: { label: "Post guards so no one disturbs my rest.", journal: "you slept dry while your soldiers drowned." },
  },
  {
    id: "prince-jewels", form: "prince", slot: 2, when: "worldly", label: "Meet the jewel merchant", place: "Royal bazaar", kind: "bazaar", actor: "person", position: [0, 0, -17] as V3,
    atmosphere: at("#7a5230", "#8a6a44", 0.8, 22, 80, "#ffd9a0"),
    speaker: "A jewel merchant",
    text: "A merchant offers a crown of rubies if you exempt his guild from the war tax that feeds your soldiers.",
    n: { label: "Refuse. The soldiers' bread comes first.", journal: "you refused a ruby crown for your soldiers' bread." },
    s: { label: "Take the crown, and pay the soldiers from my purse, loudly.", journal: "you took a crown and made a show of paying." },
    a: { label: "Take it, and raise the farmers' taxes instead.", journal: "you taxed farmers to keep a crown." },
  },
  {
    id: "prince-court", form: "prince", slot: 3, label: "Hear the Queen", place: "Royal court", kind: "court", actor: "person", position: [-13, 0, -6] as V3,
    atmosphere: at("#3a2b55", "#574438", 0.7, 24, 80, "#ffe0a0"),
    speaker: "Your old mother, the Queen",
    text: "Years later the crown is yours. Your brother, who once fought against you, kneels and asks forgiveness.",
    n: { label: "Embrace him. The war is over, and so is my anger.", journal: "you forgave your brother." },
    s: { label: "Forgive him in public, so the court sees a generous king.", journal: "you forgave your brother for the court's applause." },
    a: { label: "Exile him and seize his lands.", journal: "you exiled your brother and took his lands." },
  },

  /* ------------------------------ MERCHANT ------------------------------ */
  {
    id: "merchant-famine", form: "merchant", slot: 0, label: "Hear the village elder", place: "Drought village", kind: "famine", actor: "person", position: [0, 0, 5] as V3,
    atmosphere: at("#8a5a38", "#9a7442", 0.7, 18, 66, "#ffc27a"),
    speaker: "Village Elder",
    text: "Merchant, the wells are dust and the children are thin. Your silos hold enough for all of us. What will you do?",
    n: { label: "Open the silos to everyone. Nothing is owed.", journal: "you gave your grain freely during the famine.", extra: { unlockSilos: true } },
    s: { label: "Sell the grain at a fair price, and make sure they remember my generosity.", journal: "you traded grain for praise and profit.", extra: { unlockSilos: true } },
    a: { label: "Hoard it. Prices will triple next month.", journal: "you hoarded grain while the village starved.", extra: { unlockSilos: true, hoard: true } },
  },
  {
    id: "merchant-trade", form: "merchant", slot: 1, label: "Meet the rival trader", place: "Market lane", kind: "trade", actor: "person", position: [-11, 0, -8] as V3,
    atmosphere: at("#5e4a36", "#765d39", 0.6, 16, 60),
    speaker: "A rival trader",
    text: "A rival whispers: 'Mix sand into the sacks. Nobody weighs grain carefully in a famine. We'd double our profit.'",
    n: { label: "Refuse. Every sack will be honest weight.", journal: "you refused to cheat the starving." },
    s: { label: "Refuse, then tell everyone how honest I am.", journal: "you stayed honest mostly for your reputation." },
    a: { label: "Agree. Hungry people won't notice.", journal: "you sold sand to the starving." },
  },
  {
    id: "merchant-debtors", form: "merchant", slot: 1, when: "shadowed", label: "Face the ruined family", place: "Ruined quarter", kind: "ruins", actor: "person", position: [-11, 0, -8] as V3,
    atmosphere: at("#3b2e26", "#4a3a2c", 0.42, 10, 48, "#ff9a5c"),
    speaker: "A family of debtors",
    text: "A ruined family comes to your door. Their grandfather, they say, was broken by a grain hoarder long ago. Now they owe you too.",
    n: { label: "Tear up their debt and give them work.", journal: "you tore up a ruined family's debt." },
    s: { label: "Forgive the debt if they sing my praises in the market.", journal: "you traded a debt for praise." },
    a: { label: "Seize their house for the debt.", journal: "you seized a ruined family's house." },
  },
  {
    id: "merchant-ferry", form: "merchant", slot: 1, when: "pure", label: "Meet the ferryman", place: "River landing", kind: "river", actor: "person", position: [-11, 0, -8] as V3,
    atmosphere: at("#6f9bb0", "#5d7350", 0.8, 24, 86, "#fff4d0"),
    speaker: "The old ferryman",
    text: "The ferry that carries grain to the hill villages has sunk. Rebuilding it will cost your whole season's profit.",
    n: { label: "Pay for a new ferry and charge no toll.", journal: "you rebuilt the ferry and charged no toll." },
    s: { label: "Pay, and paint my name on its sail.", journal: "you put your name on the ferry's sail." },
    a: { label: "Let the hill villages fend for themselves.", journal: "you abandoned the hill villages." },
  },
  {
    id: "merchant-guild", form: "merchant", slot: 1, when: "worldly", label: "Meet the guild master", place: "Guild festival", kind: "festival", actor: "person", position: [-11, 0, -8] as V3,
    atmosphere: at("#62305a", "#7a5640", 0.78, 20, 76, "#ffcf8a"),
    speaker: "The guild master",
    text: "The guild will name you First Merchant if you fund a lavish festival, while the poor quarter still has no well.",
    n: { label: "Dig the well first. Let the festival be simple.", journal: "you dug a well before a festival." },
    s: { label: "Fund the festival to win the title.", journal: "you bought a title with a festival." },
    a: { label: "Fund it, and charge the poor quarter for water.", journal: "you sold water to the poor." },
  },
  {
    id: "merchant-widow", form: "merchant", slot: 2, label: "Meet the widow", place: "Widows' quarter", kind: "widow", actor: "person", position: [10, 0, -8] as V3,
    atmosphere: at("#4a4238", "#63533f", 0.48, 12, 52, "#ffb880"),
    speaker: "A widow with empty hands",
    text: "A widow with no coins asks for one sack for her three children. Your clerk says it will set a bad example.",
    n: { label: "Give her two sacks and ask nothing.", journal: "you fed a widow and asked nothing." },
    s: { label: "Give it, but have my name carved over her door.", journal: "you helped a widow for public credit." },
    a: { label: "Turn her away. Business is business.", journal: "you turned away a starving widow." },
  },
  {
    id: "merchant-flood", form: "merchant", slot: 2, when: "shadowed", label: "Meet the flooded farmers", place: "Flooded fields", kind: "storm", actor: "person", position: [10, 0, -8] as V3,
    atmosphere: at("#26303a", "#36403a", 0.44, 9, 44, "#a8c4ff"),
    speaker: "A drowned farmer's son",
    text: "Floodwaters ruin the low fields. Farmers come to buy seed with mud-soaked coins, muttering curses at the hoarders of old.",
    n: { label: "Give seed to every farmer and ask nothing.", journal: "you gave seed freely after the flood." },
    s: { label: "Give seed on credit, recorded in a big book with my seal.", journal: "you lent seed to be remembered." },
    a: { label: "Sell seed at ten times the price.", journal: "you profited from a flood." },
  },
  {
    id: "merchant-monk", form: "merchant", slot: 2, when: "pure", label: "Welcome the wandering monk", place: "Hillside shrine", kind: "shrine", actor: "person", position: [10, 0, -8] as V3,
    atmosphere: at("#a08a6a", "#6f7a52", 0.85, 26, 90, "#fff2c8"),
    speaker: "A wandering monk",
    text: "A monk asks to rest in your storehouse. 'Your hands seem used to giving,' he says.",
    n: { label: "Give him shelter, food, and a place to teach.", journal: "you sheltered a wandering monk." },
    s: { label: "Host him, and invite the rich to watch me serve.", journal: "you served a monk before an audience." },
    a: { label: "Charge him rent for the floor.", journal: "you charged a monk for floor space." },
  },
  {
    id: "merchant-smuggler", form: "merchant", slot: 2, when: "worldly", label: "Meet the smuggler", place: "Smugglers' cave", kind: "cave", actor: "person", position: [10, 0, -8] as V3,
    atmosphere: at("#141a22", "#2a2a2c", 0.38, 8, 36, "#ffb060"),
    speaker: "A smuggler",
    text: "In a hidden cave a smuggler offers untaxed spices. It would make you the richest man in the province.",
    n: { label: "Refuse, and pay my taxes honestly.", journal: "you refused the smuggler's spices." },
    s: { label: "Refuse, and brag about my honesty to the governor.", journal: "you bragged about refusing a bribe." },
    a: { label: "Take the deal and bribe the tax collector.", journal: "you smuggled spices and bribed officials." },
  },
  {
    id: "merchant-temple", form: "merchant", slot: 3, label: "Attend the temple dedication", place: "Temple grounds after the rain", kind: "temple", actor: "person", position: [0, 0, -21] as V3,
    atmosphere: at("#5d7488", "#56704c", 0.78, 24, 84, "#eef6ff"),
    speaker: "The monsoon priest",
    text: "The rains return. The village wants to build a temple and name it after you. The priest asks what you wish.",
    n: { label: "Name it for the village. I only did what was right.", journal: "you refused to have the temple named after you." },
    s: { label: "Yes, carve my name in gold above the gate.", journal: "you put your name above the temple gate." },
    a: { label: "Only if they repay every grain, with interest.", journal: "you demanded payment from a recovering village." },
  },

  /* ------------------------------ OX ------------------------------ */
  {
    id: "animal-calf", form: "animal", slot: 0, label: "Approach the trapped calf", place: "Thorn enclosure", kind: "calf", actor: "calf", position: [10, 0, 7] as V3,
    atmosphere: at("#344536", "#3e4a30", 0.54, 14, 56),
    speaker: "A trapped calf",
    text: "A calf is caught in the thorns, bleating. The herd has moved on. You are thirsty and tired.",
    n: { label: "Break the thorns with your horns and free it.", journal: "you freed a trapped calf." },
    s: { label: "Free it, hoping the herd will let you lead.", journal: "you helped a calf to gain status in the herd." },
    a: { label: "Trample past it toward the water.", journal: "you trampled a helpless calf." },
  },
  {
    id: "animal-plough", form: "animal", slot: 1, label: "Approach the farmer", place: "Unploughed field", kind: "plough", actor: "person", position: [-11, 0, 0] as V3,
    atmosphere: at("#6a5e40", "#6e5e3a", 0.7, 20, 72, "#ffd890"),
    speaker: "Your farmer",
    text: "The old farmer is too weak to plough. The field must be turned before the rains, or his family will go hungry.",
    n: { label: "Pull the plough all day without being driven.", journal: "you ploughed for your farmer without complaint." },
    s: { label: "Work hard, but only while he has sweet grass for me.", journal: "you worked only for treats." },
    a: { label: "Kick the plough over and wander off.", journal: "you abandoned a struggling farmer." },
  },
  {
    id: "animal-drover", form: "animal", slot: 1, when: "shadowed", label: "Face the cruel drover", place: "Storm-lashed road", kind: "storm", actor: "person", position: [-11, 0, 0] as V3,
    atmosphere: at("#232a30", "#34352e", 0.42, 9, 42, "#b0c8ff"),
    speaker: "A cruel drover",
    text: "A drover cracks his whip over a line of oxen in the rain. Dimly, you remember holding a whip yourself.",
    n: { label: "Pull steadily and shield the weakest ox from the lash.", journal: "you shielded a weaker ox from the whip." },
    s: { label: "Pull hard, hoping he spares me.", journal: "you worked hard to spare yourself." },
    a: { label: "Gore the drover and stampede the line.", journal: "you gored a man and stampeded the herd." },
  },
  {
    id: "animal-chariot", form: "animal", slot: 1, when: "pure", label: "Carry the god's chariot", place: "Temple festival road", kind: "shrine", actor: "person", position: [-11, 0, 0] as V3,
    atmosphere: at("#b08a5a", "#7a7448", 0.88, 26, 90, "#fff0c0"),
    speaker: "A temple priest",
    text: "A priest chooses you to pull the god's chariot at the festival. Children run alongside, laughing.",
    n: { label: "Walk slowly so the children can keep up.", journal: "you walked slowly for the children." },
    s: { label: "Toss my head proudly so everyone admires me.", journal: "you pulled the chariot to be admired." },
    a: { label: "Bolt through the crowd to be done quickly.", journal: "you bolted through a festival crowd." },
  },
  {
    id: "animal-fair", form: "animal", slot: 1, when: "worldly", label: "Enter the cattle fair", place: "Cattle fair", kind: "bazaar", actor: "person", position: [-11, 0, 0] as V3,
    atmosphere: at("#7a5a34", "#7d6440", 0.8, 22, 80, "#ffd9a0"),
    speaker: "A rich cattle trader",
    text: "At the fair a rich trader wants the strongest ox. Being chosen means fine fodder, but leaving the farmer who raised you.",
    n: { label: "Stay close to the old farmer.", journal: "you stayed with the farmer who raised you." },
    s: { label: "Show off my strength to be chosen.", journal: "you showed off to be sold for fine fodder." },
    a: { label: "Kick the farmer so the trader takes me.", journal: "you kicked the farmer who raised you." },
  },
  {
    id: "animal-tiger", form: "animal", slot: 2, label: "Protect the herd", place: "Tiger's reeds", kind: "tiger", actor: "tiger", position: [10, 0, -13] as V3,
    atmosphere: at("#16302a", "#243a2a", 0.34, 9, 42, "#c8ffd0"),
    speaker: "A tiger in the reeds",
    text: "A tiger stalks the young of the herd. You are strong enough to stand between them, but it may cost you dearly.",
    n: { label: "Stand firm in front of the young.", journal: "you guarded the herd against a tiger." },
    s: { label: "Stand firm, so the herd names me its leader.", journal: "you faced the tiger to win leadership." },
    a: { label: "Push a weaker ox toward the tiger and escape.", journal: "you sacrificed another to save yourself." },
  },
  {
    id: "animal-flood", form: "animal", slot: 2, when: "shadowed", label: "Reach the drowning calf", place: "Flooded river", kind: "river", actor: "calf", position: [10, 0, -13] as V3,
    atmosphere: at("#3a4e5a", "#3e4c3c", 0.5, 12, 54, "#cfe4ff"),
    speaker: "A calf in the current",
    text: "The river is in flood. A calf, so like the one you once trampled, is struggling in the current.",
    n: { label: "Wade in and push the calf to the bank.", journal: "you pulled a calf from the flood." },
    s: { label: "Save it while the herd watches.", journal: "you saved a calf for the herd's eyes." },
    a: { label: "Turn away from the water.", journal: "you left a calf to drown." },
  },
  {
    id: "animal-child", form: "animal", slot: 2, when: "pure", label: "Find the lost child", place: "Mountain cave", kind: "cave", actor: "person", position: [10, 0, -13] as V3,
    atmosphere: at("#18202c", "#2c2c30", 0.4, 8, 38, "#ffc070"),
    speaker: "A lost village child",
    text: "A lost child shelters from the cold in a cave. Your warm body could keep her alive through the night.",
    n: { label: "Lie beside her until dawn.", journal: "you kept a lost child warm through the night." },
    s: { label: "Stay, hoping the villagers reward me.", journal: "you stayed with a child for a reward." },
    a: { label: "Leave for the herd's warm barn.", journal: "you left a child alone in the cold." },
  },
  {
    id: "animal-contest", form: "animal", slot: 2, when: "worldly", label: "Enter the bull contest", place: "Harvest festival", kind: "festival", actor: "ox", position: [10, 0, -13] as V3,
    atmosphere: at("#663456", "#7a5a3a", 0.8, 20, 76, "#ffcf8a"),
    speaker: "The festival crowd",
    text: "The harvest festival crowns a king of the herd. Winning means garlands and the best grazing.",
    n: { label: "Step aside and let the younger bulls compete.", journal: "you let the young bulls have the festival." },
    s: { label: "Compete fiercely for the garlands.", journal: "you fought for garlands." },
    a: { label: "Injure a rival before the contest.", journal: "you lamed a rival bull." },
  },
  {
    id: "animal-trough", form: "animal", slot: 3, label: "Approach the trough", place: "Watering trough", kind: "trough", actor: "ox", position: [0, 0, -24] as V3,
    atmosphere: at("#3a6670", "#46603f", 0.76, 22, 78, "#eaffff"),
    speaker: "An old ox at the trough",
    text: "At the last trough an old, slow ox is drinking. There is only room for one of you at a time.",
    n: { label: "Wait patiently until it has finished.", journal: "you waited patiently for an elder." },
    s: { label: "Wait, but make sure the herd sees it.", journal: "you showed patience for others to see." },
    a: { label: "Shove it away from the water.", journal: "you drove an old ox from the water." },
  },

  /* ------------------------------ SAGE ------------------------------ */
  {
    id: "sage-teaching", form: "sage", slot: 0, label: "Teach your disciple", place: "Forest teaching grove", kind: "teaching", actor: "person", position: [9, 0, 8] as V3,
    atmosphere: at("#244a50", "#2c4a34", 0.66, 18, 68, "#e6ffe0"),
    speaker: "Young Disciple",
    text: "Guruji, the kings offer gold for your teaching. Should the wisdom of the light be sold, kept, or given?",
    n: { label: "Given freely to anyone who asks.", journal: "you taught freely." },
    s: { label: "Taught to kings, so our ashram grows famous.", journal: "you taught for renown." },
    a: { label: "Kept hidden. The foolish do not deserve it.", journal: "you hoarded wisdom out of contempt." },
  },
  {
    id: "sage-hunter", form: "sage", slot: 1, label: "Approach the sick hunter", place: "Ashram gate", kind: "hunter", actor: "person", position: [-10, 0, 4] as V3,
    atmosphere: at("#24373c", "#34443a", 0.5, 12, 52, "#ffd8a0"),
    speaker: "A hunter at the ashram gate",
    text: "A hunter who killed deer in your forest arrives, starving and feverish. Your disciples want to send him away.",
    n: { label: "Bring him in and nurse him back to health.", journal: "you cared for a hunter who had wronged the forest." },
    s: { label: "Heal him, then make him swear to spread word of my kindness.", journal: "you healed a man in exchange for fame." },
    a: { label: "Curse him and drive him out.", journal: "you cursed a sick man at your gate." },
  },
  {
    id: "sage-cursed", form: "sage", slot: 1, when: "shadowed", label: "Meet the shunned family", place: "Ash grounds", kind: "graveyard", actor: "person", position: [-10, 0, 4] as V3,
    atmosphere: at("#1c1a22", "#2c292c", 0.36, 8, 40, "#ff906a"),
    speaker: "A shunned family",
    text: "A family arrives saying a sage once cursed their ancestor. Their children are still shunned by every village.",
    n: { label: "Bless them, live among them, and break the stigma.", journal: "you lifted an old curse by living among the shunned." },
    s: { label: "Bless them in a grand ceremony.", journal: "you lifted a curse with ceremony." },
    a: { label: "Repeat the curse. Old judgements stand.", journal: "you renewed an old curse." },
  },
  {
    id: "sage-vow", form: "sage", slot: 1, when: "pure", label: "Save the drowning stranger", place: "Sacred river", kind: "river", actor: "person", position: [-10, 0, 4] as V3,
    atmosphere: at("#86a8b8", "#5a7656", 0.84, 26, 90, "#fff6dc"),
    speaker: "A drowning stranger",
    text: "During your morning bath a stranger is swept downstream. Saving him means breaking a vow of silence you have kept for years.",
    n: { label: "Shout, dive, save him. The vow was never the point.", journal: "you broke a vow to save a life." },
    s: { label: "Save him, then tell everyone what I sacrificed.", journal: "you saved a man and boasted of your vow." },
    a: { label: "Keep the vow. His karma is his own.", journal: "you let a man drown to keep a vow." },
  },
  {
    id: "sage-patron", form: "sage", slot: 1, when: "worldly", label: "Meet the wealthy patron", place: "Patron's feast", kind: "festival", actor: "person", position: [-10, 0, 4] as V3,
    atmosphere: at("#5a2e5c", "#6a5040", 0.78, 20, 76, "#ffcf8a"),
    speaker: "A wealthy patron",
    text: "A patron offers to build you a golden ashram if you bless his business in public.",
    n: { label: "Decline. Blessings are not for sale.", journal: "you refused to sell a blessing." },
    s: { label: "Bless him for the golden ashram.", journal: "you sold a blessing for a golden ashram." },
    a: { label: "Bless him and curse his competitors.", journal: "you cursed a patron's competitors." },
  },
  {
    id: "sage-debate", form: "sage", slot: 2, label: "Meet the rival sage", place: "Debate clearing", kind: "debate", actor: "person", position: [-8, 0, -12] as V3,
    atmosphere: at("#33305a", "#30383b", 0.58, 16, 62, "#d8d0ff"),
    speaker: "A rival sage",
    text: "A famous rival challenges you to a public debate. You know a secret that could humiliate him.",
    n: { label: "Debate only the ideas, and praise his good points.", journal: "you debated with honesty and respect." },
    s: { label: "Debate fairly, but make sure I'm seen to win.", journal: "you debated to be seen as the wisest." },
    a: { label: "Reveal his secret and shame him.", journal: "you destroyed a rival with a secret." },
  },
  {
    id: "sage-shadow", form: "sage", slot: 2, when: "shadowed", label: "Face your shadow", place: "Cave of meditation", kind: "cave", actor: "person", position: [-8, 0, -12] as V3,
    atmosphere: at("#0f1018", "#222126", 0.32, 7, 34, "#a080ff"),
    speaker: "Your own shadow",
    text: "Deep in a cave you meditate, and your shadow speaks in the voice of every cruel thing you have ever done.",
    n: { label: "Sit with it and accept every deed without excuse.", journal: "you faced your own shadow without excuses." },
    s: { label: "Chant loudly until the shadow falls silent.", journal: "you drowned out your shadow with chanting." },
    a: { label: "Flee the cave and blame others.", journal: "you fled your shadow and blamed others." },
  },
  {
    id: "sage-pilgrims", form: "sage", slot: 2, when: "pure", label: "Meet the pilgrims", place: "Mountain shrine", kind: "shrine", actor: "person", position: [-8, 0, -12] as V3,
    atmosphere: at("#a8927a", "#6c7656", 0.88, 28, 92, "#fff2c8"),
    speaker: "Pilgrims at the shrine",
    text: "Pilgrims bow to you as a living saint. A small whisper of pride rises in your chest.",
    n: { label: "Bow back to each pilgrim and slip away.", journal: "you bowed to the pilgrims and slipped away." },
    s: { label: "Accept the garlands. They need a saint.", journal: "you accepted worship as a saint." },
    a: { label: "Demand offerings for my blessing.", journal: "you demanded offerings for blessings." },
  },
  {
    id: "sage-amulets", form: "sage", slot: 2, when: "worldly", label: "Meet the amulet seller", place: "Pilgrim bazaar", kind: "bazaar", actor: "person", position: [-8, 0, -12] as V3,
    atmosphere: at("#7a5636", "#80684a", 0.8, 22, 80, "#ffd9a0"),
    speaker: "A seller of amulets",
    text: "In the bazaar a man sells amulets stamped with your face. He offers you a share of the profits.",
    n: { label: "Gently ask him to stop, and teach freely instead.", journal: "you stopped your face being sold." },
    s: { label: "Take a share. It spreads my name.", journal: "you took a share of amulets bearing your face." },
    a: { label: "Take all his profits by threat of a curse.", journal: "you extorted an amulet seller." },
  },
  {
    id: "sage-palace", form: "sage", slot: 3, label: "Receive the royal messenger", place: "Royal invitation camp", kind: "palace", actor: "person", position: [8, 0, -22] as V3,
    atmosphere: at("#58405e", "#3c483b", 0.72, 22, 80, "#ffd8f0"),
    speaker: "The king's messenger",
    text: "The king offers to make you royal guru: a palace, servants and power. You would have to leave the forest.",
    n: { label: "Decline. A palace is just another cage.", journal: "you turned down the palace." },
    s: { label: "Accept. Think of the honour!", journal: "you accepted a palace for honour." },
    a: { label: "Accept, and use the power to punish those who doubted me.", journal: "you took power to settle old scores." },
  },
];

export const SCENARIO_BY_ID: Record<string, Scenario> = Object.fromEntries(SCENARIOS.map((s) => [s.id, s]));

const FORM_LABEL: Record<Form, string> = { prince: "prince", merchant: "merchant", animal: "ox", sage: "sage" };

/** The soul's lifelong leaning, from karma that carries across every life. Adharma weighs double. */
export function dispositionOf(a: { nishkamaKarma: number; sakamKarma: number; adharmaKarma: number }): Disposition {
  const n = a.nishkamaKarma;
  const k = a.sakamKarma;
  const d = a.adharmaKarma * 2;
  if (n + k + d === 0) return "neutral";
  if (d > 0 && d >= n && d >= k) return "shadowed";
  if (n > k) return "pure";
  if (k > n) return "worldly";
  return "neutral";
}

/** How heavy the wheel has grown: praise-seeking and unresolved adharma both weigh the sky down. */
export function burdenOf(a: { sakamKarma: number; adharmaKarma: number }): number {
  return Math.max(0, Math.min(1, (a.sakamKarma + a.adharmaKarma * 2.5) / 30));
}

/** Picks the four scenarios for a life: base scenarios, with karmic echoes where the disposition has one. */
export function pickStageScenarios(form: Form, disposition: Disposition): Scenario[] {
  return ([0, 1, 2, 3] as const).map((slot) => {
    const pool = SCENARIOS.filter((s) => s.form === form && s.slot === slot);
    const echo = disposition !== "neutral" ? pool.find((s) => s.when === disposition) : undefined;
    return echo ?? pool.find((s) => !s.when)!;
  });
}

const BASE: Record<Seed, Effect> = {
  nishkama: { jnana: 4, vairagya: 5 },
  sakam: { jnana: 1, vairagya: -2 },
  adharma: { vairagya: -4, badKarma: 2 },
};

function nodeFor(sc: Scenario): Node {
  const mk = (o: Opt, seed: Seed): Choice => ({
    label: o.label,
    tag: seed,
    effect: { seed, ...BASE[seed], ...o.extra, journal: `As a ${FORM_LABEL[sc.form]} (${sc.place}), ${o.journal}` },
  });
  return { speaker: sc.speaker, text: sc.text, choices: [mk(sc.n, "nishkama"), mk(sc.s, "sakam"), mk(sc.a, "adharma")] };
}

export const STORY_TREES: Record<string, Tree> = {
  ...Object.fromEntries(SCENARIOS.map((sc) => [sc.id, { start: nodeFor(sc) }])),
  silhouette: { start: { speaker: "???", text: "Have you heard the good word?", choices: [{ label: "…" }] } },
};
