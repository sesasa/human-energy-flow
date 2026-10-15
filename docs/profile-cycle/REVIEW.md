# Claude consultation, implementation and validation

The actual locally installed Claude CLI was used with restricted file tools and an empty strict MCP configuration. This was not a different model presented as Claude. No messages were sent to people or external channels.

## Initial discussion

[Proposal](PROPOSAL.md), [Claude's initial critique](claude-proposal.txt).

Constructive suggestions implemented:

- Add a single profile context to diet/lab state and cache keys.
- Remove blood iron from red cells, then use existing delayed marrow replacement; no display smoothing.
- Fix the total menstrual loss per category and distribute it across editable duration.
- Add starting cycle day and distinguish assumed intensity from measured blood loss.
- Separate basal loss from periodic menstrual loss; avoid double counting.
- Preserve custom body measurements; matching presets select corresponding illustrative examples.
- Use actual lean tissue for absolute gain potential, with no blanket female adaptation penalty.
- Show cycle events as subtle axis ticks at the year scale, only on ferritin.
- Use profile-aware lab defaults and population intake comparisons while supplied laboratory ranges win.

Root retained the existing restart-on-Apply behavior for new initial profiles, explicitly described in the dialog. Navigation alone preserves the exact long-term and daily positions. Root did not add BMI-based body-fat estimates that could be mistaken for measurements.

## Bounded visual implementation

[Visual task](VISUAL-TASK.md), [Claude's implementation notes](claude-visual.txt). Claude edited `bodyShape.ts`, `body.ts` and `anatomy.ts`; root integrated and tested the changes. Female and male share physiological internals and functioning Front/Back views. Anatomy remains schematic.

## Final review

[Final review task](FINAL-REVIEW-TASK.md), [Claude's final read-only code and screenshot review](claude-final-review.txt). The first final-review attempt received a temporary Anthropic API529 overload error (retained in `artifacts/profile-cycle/claude-final-attempt1.txt`). It was retried using the same read-only restrictions. Claude found the model internally consistent and the desktop/mobile layout usable. Its main finding was that a depleted sensitivity case was still shown as a finite zero-like ferritin bound. This was corrected: shading and numeric sensitivity stop when either bounding case reaches the model limit, while a valid central line remains. A dedicated numerical test checks the stop against the underlying solver, and the browser suite checks the explanation.

The remaining constructive polish was applied: ferritin uses “Uptake/loss sensitivity”; chart accessibility mentions bleeding ticks; the profile preview reports the chosen food week's average surplus/deficit; female body-fat validation names the model's supported range; saved inactive cycle settings are documented. The model and chart changes received a narrow [closing review](claude-closing-review.txt), requested in [this task](CLOSING-REVIEW-TASK.md). Claude confirmed: “No new blockers. All of the fixes are correct.” Its remaining optional saved-cycle documentation note is already included in MODEL.md under Cycle inputs and iron loss.

## Validation evidence

- Production TypeScript/Vite build passed.
- **98 numerical tests passed**, including 13 new profile/cycle checks.
- All seven browser suites passed: general physiology, composition, diet, status, viewer, micronutrients and the new profile suite.
- The profile suite checks progressive navigation/remembered positions, custom-body preservation, sex-aware energy/anatomy, cycle timing/intensity, food coupling, supplied/default laboratory limits, preview cache, exports and 320/390px mobile layouts.
- Numerical checks cover Mifflin's sex term, lean scaling and energy conservation; iron conservation over three years; exact cyclic totals independent of duration/phase; male/off behavior; shorter-cycle cumulative losses; heavier bleeding; food-driven recovery/decline; no artificial monthly jumps; and no B12/folate/D cycling.
- After the final-review fixes, the production build, all 98 numerical tests, profile browser suite and micronutrients browser suite passed again; these latest logs have UTC timestamps.
- Screenshots of male/female views, profile controls, ferritin cycle ticks, navigation and mobile layouts were visually inspected.

Logs and screenshots: `artifacts/profile-cycle/`. These checks establish internal behavior, not clinical validity. The assumptions and evidence are in [MODEL.md](MODEL.md) and [SOURCES.md](SOURCES.md).
