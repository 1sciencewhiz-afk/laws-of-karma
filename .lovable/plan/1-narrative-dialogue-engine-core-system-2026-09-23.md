Build a complete, fully interactive 3D narrative platformer web prototype for "Samsara's Spark 3D" using React 19, Tailwind CSS, Three.js (@react-three/fiber v9 and @react-three/drei v10). Everything must be implemented in a self-contained, crash-proof single-page architecture on a client-only route (ssr: false).

### 1. NARRATIVE & DIALOGUE ENGINE (CORE SYSTEM):

- **Story State Machine**: Manage game flow via `STORY_CHOICE`, `IN_GAME_DIALOGUE`, `WORLD_ACTION`, and `RESOLUTION`.

- **Branching Story Data `STORY_TREES`)**: Define structured dialogue trees for each realm (Bhuloka, Patala) and mid-level NPCs. Each node contains speaker name, dialogue text, and 2-4 choices.

- **Choice Payloads**: Choices must dynamically execute actions:

  1. Alter `storyFlags` object (e.g., `sparedAsura: true`).

  2. Modify visible HUD Karma or silently increment `unseenBadKarma`.

  3. Change world state (e.g., spawn/remove hazard zones, alter fog color, or force a starting Form).

- **Mid-Level 3D World Encounters**: Place 3D NPC meshes in the world with glowing 💬 indicators. Approaching them and pressing 'E' (or tapping HUD Talk button) locks 3D movement and opens an interactive dialogue card overlay.

- **Journal / Parables UI**: Add a HUD button "Journal" opening a slide-over modal displaying unlocked parable entries and a summary of choices made.

### 2. 3D VISUALS & ENVIRONMENT (PROCEDURAL):

- Camera: Third-person follow-camera smoothly trailing the player in 3D space with exponential damping.

- Visual Style: Cosmic indigo/violet ambient lighting with soft point lights, glowing emissive materials, distance fog, and procedural dust particle motes (Drei <Points>).

- Procedural Meshes: All 3D models must be built from standard geometries (Spheres, Cubes, Cylinders) so no external file assets fail to load.

### 3. CONTROLS & REINCARNATION MECHANICS:

- Controls: WASD/Arrows for 3D movement, Space to Jump, '1' / '2' to swap forms, 'E' to interact/talk.

- **Jiva Form**: Floating emissive sphere casting point-light. Fast movement, high jump, emits glowing particle trail. Vulnerable to shadow hazard zones.

- **Tortoise Form**: Low, heavy dark green/brown shell mesh. Slow movement, no jump, but immune to ground hazard zones.

### 4. VISIBLE SACRIFICIAL KARMA SYSTEM:

- HUD displays "Karma Pool" (starts at 100).

- A 3D "Shadow Barrier Spirit" mesh blocks the realm's exit portal.

- Holding 'E' near the spirit transfers Karma points from player to NPC, increasing its emissive glow. At 100 Karma, it bursts into a golden particle ring and opens the portal.

### 5. SECRET / HIDDEN BAD KARMA SYSTEM (INVISIBLE TO HUD):

- Maintain a silent state variable `unseenBadKarma` (starts at 0).

- Increment `unseenBadKarma` silently when selecting selfish story choices or stepping into forbidden zones. Never expose this value on the HUD.

- At `unseenBadKarma = 10`, spawn a tall, shadowy silhouette mesh in the distant 3D fog.

- Interacting with this silhouette opens a single-line dialogue: *"Have you heard the good word?"*

- Closing this dialogue starts a silent 5–10 minute timer (300-600s).

- When the timer reaches 0, trigger a catastrophic event: violent camera shake, red/black skybox shift, meteor strike, avatar destruction, and level reset.

### 6. AUDIO & MULTIPLAYER HOOKS:

- **Procedural Web Audio API**: Synthesize sine-wave jump chimes, harmonic Karma transfer chords, and cataclysm rumble purely via browser AudioContext (no external .mp3 files). Include a HUD Mute toggle.

- **Co-Op Ally**: HUD button "Simulate Co-Op Ally" spawns a secondary glowing orb mesh orbiting the main player in 3D.

### 7. LEVEL DATA `LOKAS_DATA`):

- Store realms as an array of objects containing 3D start coords, platform bounding boxes, hazard coordinates, NPC story tree IDs, and lighting overrides.

- Provide 2 playable starter realms: **Bhuloka** (Earthly Realm with lush indigo fog) and **Patala** (Underworld with dark crimson fog).

### 8. HUD & UI OVERLAY:

- Absolute-positioned over WebGL Canvas: Game Title, Current Realm, Visible Karma Counter, Current Form Indicator, Journal Button, Mute Toggle, and Touch Controls (Virtual D-Pad, Jump, Swap, Interact) for mobile.