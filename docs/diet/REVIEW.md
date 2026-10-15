# Claude collaboration and verification

The actual installed Claude CLI was used, with external MCP configuration disabled. Reviews used read-only tools; the illustration task was restricted to writing `src/visual/plates.ts`. No GPT reviewer was labeled as Claude.

- [Initial proposal](PROPOSAL.md) and [Claude proposal response](claude-proposal.txt): inspected the existing engine and proposed explicit scope semantics, genuine weekly convolution, coherent CoFID energy units, a rolling protein rule and one expanded meal editor.
- [Illustration task](PLATES-TASK.md) and [Claude implementation report](claude-plates.txt): Claude authored the first SVG renderer, with real food shapes, editable quantities, bowls/glasses, deterministic textures and accessible labels. Root type-checked and visually inspected it.
- [Final review task](REVIEW-TASK.md) and [Claude’s unedited integration review](claude-final-review.txt): Claude inspected the integrated code and four actual screenshots. It found no simulation blocker, and raised two presentation blockers plus smaller issues.

## Changes made after review

1. Replaced slot-dependent, capped food sizing with mass-based sizing independent of neighboring portions. Removed weight-dependent sorting so increasing a food no longer swaps plate slots. Increased food size; oats respond across the allowed range. Very crowded meals remain schematic and extra foods beyond seven main ingredients are explicitly counted. Added tests for constant size across layouts and monotonic rice size from 10 to 600 g.
2. Added dialog scroll padding and reduced the desktop action bar. Browser assertions focus the bottom ingredient and add-food control and verify they remain above the sticky footer. Moved the per-meal nutrition line above the plate so it remains visible while browsing.
3. Fixed micronutrient averages to union keys from all weekdays. Added the empty-Monday regression test.
4. Adding a food moves keyboard focus to the new grams input. Native tabs follow chronological meal order, including keyboard arrows/Home/End.
5. Clarified that day reset returns to the reference, added a separate Discard draft action, and moved edited-state descriptions onto accessible day-tab labels.
6. Changed mobile totals to a 3+2 grid; clarified fixed US/EFSA reference comparisons and linked the source references inside the collapsed section. Meal tooltips now use readable food names.

One recommendation was deliberately not adopted: replacing unreported fibre and fatty-acid values with assumed zeroes. The extract preserves what the source actually reports, and missing contributions stay flagged. This is conservative and auditable; it avoids presenting inferred zeroes as measured data. Measured totals that already exceed the comparison target can still say Reference met, with their lower-bound marker visible.

The requested selected-day-once semantics were retained instead of replacing them with an edited-week-once mode. The UI explains that other edited weekdays stay drafts and that the previously applied week resumes. Numerical and browser tests verify this explicitly.

## Verification

- TypeScript check and production Vite build.
- 50 numerical/renderer tests: baseline regressions; food nutrient accounting; immutable independent weekdays; convolution mass conservation; weekly carryover; one-off future-only absorption; actual weekday/rolling-protein long-term behavior; low-carbohydrate sprint support; missing nutrient coverage; quantity-driven illustrations.
- Chrome Diet flow: seven day tabs, independent portion edits and changing SVGs, pending draft preservation, once/repeat application, JSON export, actual meal cameo, reset/discard controls, keyboard tabs, zero quantities, source coverage, Sunday activity preservation, 390 px mobile and sprint compatibility.
- Existing anatomy/day/sprint/long-term browser regression suite.
- Updated starting-body browser suite verifies draft controls inside Adjust scenario, cancel/apply, presets, anatomy changes, expenditure, custom body fat, export and mobile.

Artifacts live in `artifacts/diet/`, including `nutrition-audit.json`, numerical/browser logs and screenshots. The model remains illustrative: relative blood signals, simplified meal absorption, and bounded long-term body composition are not individualized forecasts. Session food edits can be exported; browser refresh resets the food session to its reference state.
