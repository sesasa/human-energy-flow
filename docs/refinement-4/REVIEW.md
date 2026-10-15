# Claude collaboration and validation

The user asked for an initial discussion with Claude and a final Claude review. Actual locally installed Claude CLI was used with strict MCP configuration and restricted tools; no model was presented as Claude by proxy.

## Design and implementation

- [Root proposal](PROPOSAL.md), followed by [Claude’s initial critique](claude-proposal.txt).
- [Bounded viewer task](VIEWER-TASK.md), implemented by Claude with Read/Edit/Write restricted to specified files. [Implementation response](claude-viewer.txt), [viewer behavior and integration notes](viewer-notes.md).
- Root implemented observations, distinct folate/D models, the new nutrient panel, real-food experiments, integration, validation and documentation.

The shared design uses one active nutrient card, a separate lab observation, a separately selected model reserve, the current applied diet as baseline, and explicit illustrated food experiments. The timeline remains a single source for chart, playback, values and anatomy. A representative day uses its actual weekday menu and explicitly separates initial-body acute physiology from long-term reserves.

## Final review and resolutions

[Claude’s read-only code/screenshot review](claude-final-review.txt) identified the following. All changes below are implemented:

1. An early viewer-test failure came from a fractional fill on an integer day slider. The test now uses an integer and passes all later checks. Long-term positions accept fractional days. Fresh screenshots were regenerated.
2. Baseline trend labels now compare a whole year, with a tolerance for negligible changes, and say Rising / Falling / Nearly steady. They do not imply universal recovery speed. The small main-view watch reports the nearby month.
3. Food experiments are available in reference scenarios. Non-default input/absorption assumptions switch the reference intent to Hypothetical. The reference choice clearly says it restores reference starting assumptions.
4. Invalid lab drafts suppress the old comparison, preserve the actual typed entries between markers, and block Apply until corrected or discarded.
5. Nutrient graph labels use fixed-size HTML around scalable SVG curves. Important caveats and milestone captions have larger fonts on desktop and phones.
6. Removed negative plate margins that covered the representative meal label.
7. The apparent stray sprint tooltip was caused by actual incidental mouse hover in the screenshot test. Moving the pointer away and allowing dismissal produces a clean screenshot. Touch tests use an actual tap, not an emulated desktop mouse click.
8. Added a four-pool main-view screenshot and a two-column grid so reserve values remain readable on the narrow left panel.
9. Apply is labeled “view over time,” matching the full timeline.
10. Existing and newly added food targets use the same portion caps, also used by inclusion checks, retaining idempotence.

Additional refinements: mobile Front/Back no longer inherits the old right-aligned row; activity labels are below the figure at a larger size; dinner emphasizes glucose/insulin; the beef suggestion notes its single weekly meal impact; the run explanation describes insulin-independent uptake; related Hb/TSAT fields have visible marker headings.

A [closing verification task](CLOSING-REVIEW-TASK.md) asks Claude to recheck these fixes against passing logs and regenerated screenshots. Its verbatim result is saved in [closing review](claude-closing-review.txt). Claude’s closing verdict: **“there are no substantive blockers left.”** It confirmed all ten fixes against source, passing logs and the regenerated screenshots; remaining comments concerned optional typography and test instrumentation.

## Validation

- `npm run build`: TypeScript checking and production bundle pass.
- `npm test`: **73 numerical checks pass**, including pool conservation, distinct nutrient time scales, reference stability, worsening under altered inputs, lab/model independence, food accounting and idempotence, and full-window trend wording.
- `npm run test:browser`: day/sprint physiology, scene emphasis, playback, anatomy controls, model settings, reduced motion and mobile pass.
- `npm run test:composition`: initial-body presets, geometry, mass accounting, export and mobile pass.
- `npm run test:diet`: seven-day edits, once/repeat scopes, food illustrations, exports, absorption storytelling, keyboard navigation and mobile pass.
- `npm run test:status`: activity labels/poses, deterministic pause/seek, tooltips, mass deltas and four applied reserves pass.
- `npm run test:viewer`: click/drag/keyboard/touch chart scrubbing, shared playback state, exact return position, actual weekday meals, one-off diet isolation, separate views and mobile pass.
- `npm run test:micronutrients`: supplied lab units/ranges, no automatic reserve conversion, current-diet baseline stability, food comparisons, invalid-entry handling, draft/apply/reset/export, observation-only markers, tooltips and mobile pass.

Logs and screenshots: `artifacts/refinement-4/`. Other regression screenshots remain under `artifacts/composition/`, `artifacts/diet/`, `artifacts/status/` and the original browser-artifact folder.

This validates internal behavior and presentation, not clinical predictive accuracy. The reserve indices are explicitly authored educational models, not predicted laboratory results; calcium, magnesium and zinc do not have reservoir forecasts. The app is served locally on port 5174.
