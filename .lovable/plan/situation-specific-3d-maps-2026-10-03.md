# Situation-specific 3D maps

## Goal
Make each of the 16 trials feel like a different place, not four props placed on one unchanged field.

## Changes
- Give every trial its own environmental profile: ground treatment, fog, lighting, landmark props, and boundary dressing.
- Transition the active environment as the player completes a performance and advances to the next trial.
- Keep inactive trial landmarks subdued so the current destination remains readable without removing navigation context.
- Preserve the existing approach → choice → acted performance → next-trial sequence and all current controls.

## Environment direction
- **Prince:** war camp, muddy casualty ground, breached city, royal court.
- **Merchant:** drought village, market lane, widow's quarter, rain-restored temple grounds.
- **Ox:** thorn enclosure, furrowed field, reed-lined tiger territory, watering trough.
- **Sage:** forest teaching grove, healing gate, debate clearing, royal invitation camp.

## Validation
- Check the project compiles without errors.
- Play through all four trials of each life in the browser and confirm each map transition, acted consequence, and next destination.
- Check desktop and mobile framing, movement boundaries, prompts, and visual clarity; refine pacing or contrast where needed.

## Technical details
- Add a scene-environment configuration keyed by each existing trial scene ID.
- Render environment geometry with reusable procedural components and animate transitions with frame-rate-independent fades/scales.
- Keep the scene procedural and within the existing mobile rendering budget; no external assets or new persistence.
