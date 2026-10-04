# Laws of karma

Build a complete, fully interactive 2D web prototype for a game called "Samsara's Spark" using React, Tailwind CSS, and HTML5 Canvas (or basic Lucide React icons with CSS positioning). Everything must be implemented in a self-contained, crash-proof single-page architecture with state management.

### CORE CONCEPTS & THEME:


Aesthetic: Deep indigo/violet cosmic background with soft glowing gold/white elements (Vedic/spiritual theme).


Protagonist (Jiva): A glowing star entity controlled with WASD / Arrow Keys + Space to jump.


Objective: Reach the level gate by balancing Karma and practicing self-sacrifice.



### GAMEPLAY MECHANICS TO INCLUDE:
1. FORM REINCARNATION (Press '1' or '2' or click UI toggle buttons):
   - Jiva Form (Light/Star): Fast movement, high jump, soft glowing trail. Vulnerable to shadow hazards.
   - Tortoise Form (Heavy Earth): Slow movement, no jump, but completely immune to ground thorn/shadow hazards.

2. SACRIFICIAL KARMA SYSTEM:
   - Display a "Karma Pool" UI counter (starts at 100).
   - Add a "Shadow Barrier NPC" blocking the exit gate.
   - Standing near the NPC and holding 'E' (or pressing a 'Sacrifice Karma' button) drains the player's Karma pool and transfers it to the NPC.
   - When the NPC reaches 100 Karma, it transforms into a glowing golden spirit and clears the path.
   - If the player runs out of Karma, show a brief "Reincarnation Reset" animation that respawns them at the start point with restored Karma.

3. MODULAR ARCHITECTURE (For easy expansion):
   - Store levels as an array of objects called LOKAS_DATA (e.g., Level 1: "Bhuloka - Earthly Realm", Level 2: "Patala - Underworld").
   - Each level object should define player start position, hazard locations, NPC locations, and exit gate conditions.
   - Include a simple "Next Loka" loader function so future levels can be added easily by appending objects to the array.

4. MULTIPLAYERS & CO-OP READY HOOKS:
   - Include dummy local state variables for player2 (e.g., coOpEnabled: false, player2Pos: {x, y}). Add a UI toggle for "Simulate Co-Op Ally" that spawns a secondary glowing companion spirit following the player.

### UI & VISUAL LAYOUT:


Top Header: Game Title ("Samsara's Spark"), Level Name, Karma Counter, Current Form Indicator.


Center: HTML5 Canvas / Interactive Game Area with simple platform collision, glowing particle effects, and clean visuals.


Bottom Control Panel: On-screen buttons for Mobile/Touch fallback (Left, Right, Jump, Swap Form, Sacrifice Karma).



Do not use external image URLs that could break; render all sprites natively using glowing Canvas paths or SVG icons. Ensure all physics, collision, key handlers, and state toggles are completely implemented without leaving placeholders or incomplete code.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0a3b5d72-da20-4f61-ba97-def1829956e0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
