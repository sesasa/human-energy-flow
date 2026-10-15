# Claude collaboration and implementation review

Actual Claude CLI was used, with permission limited to the task files. No GPT agent was presented as Claude. Records:

- [Initial proposal review](claude-proposal.txt): read-only physiology, scope and UI review.
- [Activity implementation response](claude-activity.txt): Claude authored only `src/visual/activity.ts`; integration and browser validation were completed afterward by Codex.
- [Final read-only review](claude-final-review.txt): model, UI integration, tests and actual desktop/mobile screenshots. Claude did not run tests or inspect the individual activity crops; Codex did both. Its review is a code/design critique, not medical validation.

## Decisions from the first review

Implemented: steady reference-store calibration, independent Fe/B12 mass ledgers, recycled functional iron distinguished from external losses, a seven-slot marrow queue, stopped iron projection when functional pools become unsupported, status preserved on food reset, status drafts/export, per-meal vitamin C, absorption previews, and separate slow reserves vs rapidly changing physiology.

Reference iron and B12 reserves stay within 2% of their chosen anchors over three years. Low-store examples preserve initial functional iron. No automatic anemia, symptom diagnosis, supplement dosing or exercise penalty is introduced. D/Mg stay intake-only. The main watch appears only for a selected low condition, changed assumptions or meaningful modeled deviation; normal users retain a compact right panel.

## Final findings and fixes

| Claude finding | Resolution |
| --- | --- |
| Scope and selected starting weekday missing from pending/discard handling | Both now count as draft settings. Discard restores applied day and scope; reopening deliberately preserves uncommitted drafts, matching the existing session behavior. Initial one-day applications populate the correct draft. |
| Food-pair button could stack; one-day preview used the applied week rather than the edited draft | Pairing is now idempotent: ensures at least 150 g lentils and 150 g orange in Mon/Thu lunches, replaces up to 100 g rice only when adding lentils, and disables when already included. Its impact uses the actual draft repeating week even if the current food scope is one-off. |
| Last instant of a detailed day showed the next weekday's menu/status | Detailed day and intense views hold the selected initial daily reserve and menu through the endpoint. Long-term mode advances nutrient day boundaries. |
| One-day copy said “one meal” | Changed to “One day of food has little effect on a year of stores.” |
| Crowded mobile timeline labels | Hide 3- and 6-month labels on narrow screens; retain year landmarks. Added a swipe cue for the iron flow diagram. |
| Tooltip title could imply a lab ferritin measurement | “Modeled iron reserve”; ferritin is explained only in the educational body text. |
| “Ready” recovery label overstated what the model knows | Replaced with “High” and “Illustrative recovery index.” |

Other refinements: shorter Body stores header, smaller flow diagram, removal of duplicated weekly macro summary in the stores footer, viewport-aware tooltips inside native dialogs, and throttled live tooltip content. The scope selector remains visible so the preview's meal-application behavior stays reviewable. The clinical boundary remains in the dedicated stores view as requested.

## Verification

- Production TypeScript/Vite build passes.
- 63 numerical tests pass, including new nutrient-state conservation, slow response, regulation, food scope, idempotent suggestions and independent macro behavior.
- Four browser suites: general day/sprint interactions, composition, Diet, and the new status suite. Tests include desktop, 390/320px widths, keyboard/touch-style interactions, deterministic scrubbing, pause/reduced motion, diet/status draft transactions, actual food correction, endpoint behavior and projection limits.
- [Numerical output](../../artifacts/status/model-tests.txt), [new browser output](../../artifacts/status/browser-tests.txt), [build](../../artifacts/status/build.txt).
- Example screenshots: [day figure](../../artifacts/status/activity-run.png), [stores](../../artifacts/status/stores-desktop.png), [long-term view](../../artifacts/status/stores-main-year.png), [mobile tooltip](../../artifacts/status/stores-mobile-tooltip.png).

Tests demonstrate correct software behavior within disclosed assumptions, not a validated clinical recovery forecast. Scientific provenance and authored constants are in [SOURCES.md](SOURCES.md) and [MODEL.md](MODEL.md).
