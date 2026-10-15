# Validation — laboratory results revision

Validated locally in Chrome at `http://127.0.0.1:5174/`. The production build and numeric checks pass. Sample images were inspected as UX references; all test results entered by automation are synthetic examples, not imported patient data.

## Automated checks

- `npm run build`: TypeScript check and Vite production bundle.
- `npm test`: **85 passing numerical tests**, including 12 laboratory projection tests plus prior physiology/diet regressions.
- `npm run test:micronutrients`: checkbox-only selection; blank-result validation; one/two/four selected plots; source-labeled default and supplied/one-sided ranges; unit changes clear inputs; actual versus projected series; supporting Hb/MCV/MCH; unsupported estimate handling; contributor controls connected bidirectionally with Meals; per-serving/day isolation; updated curves and macros; measurement-anchor persistence; Apply, export, reset and discard; validation-message clearing; selected-only timeline display; keyboard and 320/390px responsive layouts.
- `npm run test:status`: activity figures, pause/seek/reduced motion, tooltips, absolute composition changes, selected laboratory readings on the shared day/year timeline, export and mobile.
- `npm run test:diet`: seven-day food editing, meal illustrations, independent drafts, repeat/once scope, calories, export, reset, keyboard navigation and mobile.
- `npm run test:viewer`: anatomy controls, scene-aware columns, shared chart/playback scrubbing, two time scales, weekday navigation, one-day food isolation and mobile.
- `npm run test:composition`: scenario drafts, body presets/custom inputs, anatomy, energy and export.
- `npm run test:browser`: daily/meal/exercise/sprint/recovery playback and anatomy regression checks.

The model tests independently sum catalogue nutrients to check contributor rankings; verify unit invariance, input immutability and actual portion/macro deltas; test food-driven rising and falling iron balances including increased intake that remains inadequate; check withheld functional depletion; verify unchanged B12/folate/D baselines across all seven starting weekdays; compare one-off and repeating changes; exercise distinct response times, uncertainty ordering and deterministic outcomes. These establish implementation behavior, not clinical validity.

## Visual review

Desktop result/food cards, the selected main-timeline readings, and mobile plots/contributor controls were inspected. The reference band, sensitivity envelope and entered point have separate legends. Measured inputs remain visible beside their unit and reference; units on plot axes do not scale down with SVG width. Long reference intervals are labeled when extending above the visible plot. At mobile sizes, input/plot/food areas stack without horizontal overflow.

Artifacts and command logs are in `artifacts/lab-results/`, including:

- `laboratory-empty.png`
- `laboratory-ferritin.png`
- `laboratory-contributors.png`
- `laboratory-b12.png`
- `laboratory-main-watch.png`
- `laboratory-mobile-input.png`
- `laboratory-mobile-plot.png`
- `laboratory-mobile-foods.png`

Earlier Claude reviews elsewhere in this repository are historical. No new Claude review was performed for this revision.

## Scientific review limits

References and model assumptions are registered in [SOURCES.md](SOURCES.md) and [MODEL.md](MODEL.md). Curves are educational scenarios, not patient predictions. Unchanged-diet stability for B12/folate/D is a declared assumption; the actual untreated course is unknown. Sensitivity envelopes are not clinical confidence intervals. A supplied reference range does not diagnose a deficiency or its cause. No supplementation prescription or guaranteed correction is generated.
