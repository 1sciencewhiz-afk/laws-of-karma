# Samsara's Spark 3D

Rebuild the game in real 3D (third-person follow camera) per the uploaded brief, replacing the current flat 2D version on the home page. Everything is drawn from built-in shapes and glowing materials — no external files that could fail to load.

## What the player gets

- A cosmic 3D world: violet/indigo ambience, soft point lights, glowing surfaces, gentle fog.
- The Jiva as a floating glowing sphere that casts its own light; the Tortoise as a low, heavy dark shell.
- Camera smoothly trails the player around the world.

## Flow

1. **Story choice** — a clean overlay presents a scenario with 2–3 choices. The choice sets the realm's form, hazards and lighting (and can silently add hidden bad karma).
2. **World action** — move with WASD/arrows, jump with Space, swap form with 1/2.
3. **Resolution** — reach the portal, see a short summary, then the next realm's story choice.

## Mechanics

- **Karma Pool** starts at 100 and shows in the HUD. A Shadow Barrier Spirit blocks the portal; standing near it and holding E (or the Sacrifice button) drains your karma into it, brightening it until it dissolves into particles and the portal opens. Karma at 0 respawns you at the start.
- **Forms**: Jiva is fast, jumps high, emits light, dies to shadow thorns. Tortoise is slow, cannot jump, immune to thorns.
- **Hidden system** (never shown): selfish choices and forbidden zones raise an invisible counter. At 10, a tall dark silhouette appears in the far fog. Interacting with it shows one line of text, then starts a silent 5–10 minute timer; when it expires the world convulses — camera shake, red/black sky, an impact from above — the avatar is destroyed, the realm resets and the hidden counter clears.
- **Co-op hook**: a HUD button spawns a second glowing sphere that orbits and follows you.

## HUD and controls

Overlay on the 3D view: title, current realm, karma counter, form indicator, and touch controls (D-pad, Jump, Swap Form, Sacrifice) for phones.

## Level data

Realms live in a `LOKAS_DATA` array with 3D start coordinates, ground dimensions, hazard zones, spirit and portal placement, so new realms are just new entries. Two realms to start, matching the existing Bhuloka and Patala.

## Technical notes

- Add `three`, `@react-three/fiber` v9, `@react-three/drei` v10 (React 19).
- Game mounts on a client-only route (`ssr: false`) so the canvas never renders on the server — this also clears the current hydration warning.
- Physics is simple AABB/box math on an X/Z plane with Y gravity and jump; all motion uses frame delta with exponential damping.
- Split into `GameCanvas`, `Scene`, `Player`, `Realm`, `SpiritNPC`, `HUD` components with one central game-state store; guards on every interaction so the scene cannot crash.
- Lighting via local Lightformers (no CDN environment presets), capped pixel ratio, 1024 shadow maps.
- Verified in-browser with screenshots of each phase before handing over.
