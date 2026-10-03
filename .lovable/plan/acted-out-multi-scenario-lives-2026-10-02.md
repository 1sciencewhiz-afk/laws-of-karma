# Acted-Out Multi-Scenario Lives

## Goal

Turn every choice in all four lives into a short, visible 3D scene rather than presenting four dialogue cards back-to-back. Each trial will stage its own actors and props, pause movement for the decision, animate the chosen consequence, then lead the player to the next trial.

## Player Experience

- Each life contains four distinct locations and encounters in the same world.
- A glowing objective marker guides the player to the current trial.
- Approaching the encounter starts a brief non-interactive setup animation before choices appear.
- After choosing, the dialogue closes and the scene visibly performs that decision for a few seconds.
- A concise consequence caption appears during the performance, then the next trial activates.
- Actors and world props remain changed where useful, so the life feels cumulative rather than reset between cards.
- The final performance flows into the existing life ending, Karmic Audit, and automatic rebirth.

## Four Lives

- **Prince:** Drona and opposing ranks; wounded soldier and guards; conquered city gate with civilians and soldiers; throne court with the Queen and kneeling brother.
- **Merchant:** starving villagers at the silos; rival trader beside tampered sacks; widow and children at the storehouse; returned rain and temple dedication.
- **Ox:** trapped calf in thorns; farmer and plough; tiger confronting the herd; old ox at the watering trough.
- **Sage:** disciple at the ashram; sick hunter at the gate; rival sage’s debate circle; royal messenger offering palace symbols.

## Choice Performances

Each selfless, praise-seeking, and selfish option gets a distinct animation outcome using movement, posture, prop visibility, color, and particles. Examples include giving water versus taking armour, opening grain sacks versus sealing them, shielding the herd versus fleeing, and welcoming the hunter versus driving him away.

## Technical Approach

- Extend story data with a stable scene identifier and a world position for each trial.
- Add a short encounter state machine: `approach → setup → choice → consequence → next`.
- Store the selected consequence long enough for the 3D scene to animate it before applying the next trial or ending the life.
- Build lightweight procedural actor/prop groups and animate them with delta-time in the existing frame loop.
- Keep the existing R3F debug-prop safeguard, controls, karma logic, hidden consequences, audit, rebirth, journal, and Moksha rules intact.
- Keep actor counts and effects within the existing mobile performance budget.

## Playthrough and Refinement

- Play through all four trials in each of the four lives, testing representative selfless, praise-seeking, and selfish paths.
- Verify encounter order, movement lock/unlock, visible consequences, journal entries, life completion, audit, and rebirth.
- Test desktop controls and the touch layout at the current mobile-sized preview.
- Refine camera framing, actor positions, timing, visibility, prompts, collision-free routes, and any confusing objective transitions found during play.
- Confirm the final scene renders without blank screens, console errors, missing interactions, or overlapping interface elements.

&nbsp;

&nbsp;

&nbsp;

&nbsp;

note: all scenes should be acted out and the props and entities should move accordingly