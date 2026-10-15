# Viewer refinement 4: implementation notes

Files changed: `src/main.ts`, `src/visual/activity.ts`, `src/visual/charts.ts`, `src/visual/presentation.ts`, `src/engine/timeline.ts`. New: `src/visual/viewer.css`, imported last in `main.ts` after `status.css`.

These are Claude’s original implementation notes. Root subsequently integrated the four-pool watch and new tooltips, built the app, ran numerical/browser checks, and inspected desktop/mobile screenshots. See REVIEW.md for the final validation record.

## New IDs and selectors
- **Views:** `#view-tab-day` ("Inside a Day") and `#view-tab-long` ("Over Time") are `aria-pressed` buttons. Their groups are `#view-group-day` and `#view-group-long`, which get `.active` for the current view.
  - The original `#phase-day`, `#phase-intense`, `#phase-year` and `#phase-three` buttons remain. They are always visible as submodes inside each group.
  - `#phase-intense` is now labelled "Sprint session".
  - `body.long-view` is toggled when the Over Time view is showing.
- **Shortcuts:** `#inside-day` ("Inside this day →") sits top-right in `.stage-top` in the long view only. `#inside-day-label` holds text like "Tuesday · day 254".
- **Representative-day banner** (top of the story panel, day view only, when a representative day is active): `#day-context`, `#day-context-label`, `#back-to-long`, `#day-context-reset` ("Show day 1").
- **Activity:** `#activity-wrap` wraps `#activity-person` and the visible `#activity-caption`. The caption is `aria-hidden`; the SVG's accessible name is set to the same text.
  - `#activity-wrap` is hidden in the long view. `#activity-person` is also hidden, as before.
  - `#activity-tag` is still `sr-only` and keeps its old uppercase values.
- **Left column:** `aside#secondary-panel` holds `#secondary-metrics` (left metric rows), `#stores-watch`, `.energy-card` and `.subject-card`. These moved out of the story panel and the right panel; their IDs are unchanged.
  - On desktop it occupies grid column 1, row 2. On mobile (≤760px) it is placed in row 4, after the right panel.
- **Front/Back:** `.anatomy-controls` (`#view-front`, `#view-back`) moved into `.body-stage .stage-top`, top-left.
- **Chart:** `#trace-card`, `#trace-host` and `#trace-cursor` are kept.
  - In the long view, `#trace-host` contains `.composition`, which holds:
    - the `[data-chart-metric="mass|lean|fatmass|bodyfat"]` buttons (`aria-pressed`)
    - `#composition-chart` (`role="slider"`, `tabindex=0`, `aria-valuenow` in days, descriptive `aria-valuetext`), which wraps an `aria-hidden` SVG
    - `.chart-cue`
  - Inside that SVG, the cursor group is `g#trace-cursor`.
- **New metric rows:** `row-aerobic` (normal day) and `row-glycolytic` (sprint session) are on the right; `row-bodyfat` (long view) is on the right.

## API changes
- `ActivityView.update(..., reducedMotion, label?)`: the optional `label` overrides the SVG title and `aria-label`. Calls without it behave as before.
- `Metric.side?: 'right'|'left'`.
- `normalMetrics(s, focus, restingHR=60)` now returns 7 rows in a fixed order for each scene type:
  - `fuel`: right glucose, insulin, liver, muscle; left fat, aerobic, recovery
  - `exercise`: right muscle, fat, aerobic; left glucose, insulin, liver, recovery
  - `recovery`: right recovery, muscle, liver; left glucose, insulin, fat, aerobic

  `metricScene()` selects the scene type. It changes only when exercise power or the chapter/meal focus changes.
- `sprintMetrics` keeps the same placement for the whole session:
  - right: power, PCr, glycolytic, fatigue, ATP
  - left: glycogen, oxygen

  Glycolytic contribution = `glycolyticFlux / (pcr + glycolytic + aerobic flux)`.
- `longMetrics(adaptation, person, leanCeiling, highlight)`:
  - right: mass, lean, fatmass, bodyfat. Each shows kg (or %) plus a signed change against baseline; bodyfat's change is in percentage points.
  - left: conditioning.
  - The metric selected in the chart gets `primary` emphasis.
- `activityCaption(activity, meal?)` produces "Eating breakfast" (the actual meal name), "Eating a snack", "Lunch skipped" for an empty meal, "Reading · mental work", "Recovery walk" (sprint walk phase), and so on.
- `CompositionChart(onSeek, onMetric?)` has `.element`, `.selected`, `setStates(states)`, `setMetric(m)` and `update(position)`.
  - The SVG is built once. Path data is cached per metric and cleared only when `setStates` receives a new array.
  - `pointermove` only moves the cursor and knob and updates attributes. Seeks are coalesced with rAF.
- `Timeline.update`: day and intense phases now stop paused at 1440. There is no automatic day→long transition.

## Behaviour
- Every manual seek (main scrubber, interval scrubber, milestones, rep strip, Go to intervals, chart drag/click/keys) pauses playback.
- `setPhase` pauses and remembers both the exact long-view float position and the last day phase/position.
  - "Over Time" and "← Back to Over Time" restore the exact float position.
  - "Inside a Day" restores the last day phase and position.
- Restart (`#restart`) now restarts within the current phase. Previously, restarting from the long view jumped back to the day view.
- Play at the end of a day or of the 3-year span restarts from 0.
- **Chart keys:** ←/→/↑/↓ move ±1 day, Shift ±7, PageUp/PageDown ±30, Home/End. Touch uses pointer capture with `touch-action: pan-y`, so vertical page scrolling still works.
  - The One year button still seeks to day 0 and Three years to day 365.1. The chart always shows the full 1095 days.
- **Representative day** (`setDayContext(elapsed)` in `main.ts`):
  - The menu comes from `dietDayAt(dietApplication, elapsed)`. The physiology comes from the weekly simulation at index `elapsed % 7` and is chosen like this:
    - With no `once` override, it uses `weekSimulation`.
    - With a `once` override and `elapsed < 7`, it uses `weekSimulation`, which includes the real carry-over from the one-off day.
    - With a `once` override and `elapsed ≥ 7`, it uses a lazily cached `simulateDiet(scenario, {...app, once: undefined})`, so the override applies only to day 0.
  - The sprint session is re-simulated for that day's scenario and options.
  - The banner reads "Representative Tuesday · menu from day 254" and says it shows acute physiology for the starting body. The body view receives no adaptation state, and `scenario`/`person` are never modified.
  - The stores watch in the day view samples the nutrient trajectory at the representative day index, so it matches the menu shown.
  - `applyScenario` (scenario or diet apply) clears the representative day, the settled-week cache, the remembered long position and the remembered day position.
- Long time context now reads `DAY n` 1-based (`floor(position)+1`, 1..1095), so it matches the "Inside this day" label.

## Integration and test notes for root
- **Tooltips:** `metricDefinitions` has no entries yet for `aerobic`, `glycolytic` and `bodyfat`; they fall back to the row note. Root planned to add them.
  - The aerobic note states "not blood oxygen".
- **`updateStoreWatch`:** the internals are unchanged and only the host moved. Root can extend it to four pools. The `#stores-watch` markup is still inline in the `main.ts` template, inside `#secondary-panel`.
- **Existing tests that need updating:**
  - `status-browser.ts` asserts `.story-panel #view-front` has count 1. It is now `.body-stage #view-front`.
  - `browser.ts` sprint assertions should still hold: `#metric-list` keeps the same order through intervals, walk-late has ≤2 primary and ≥3 quiet rows, and power/PCr are primary early. `glycogen` and `oxygen` now render in `#secondary-metrics`, so `val('glycogen')` still works by ID.
  - Meal: glucose and insulin are primary, muscle is secondary. Run: muscle and fat are primary.
- **Unit tests:** I could not list `tests/*.test.ts`. If any unit test asserts the old 6-row output of `normalMetrics`/`sprintMetrics` or row order, update it.
- **Activity:** rest is now seated on a lounge sofa with a lamp and plant (props `sofa`/`lounge`). The standing rest pose is gone.
  - The palette is refreshed: sage shirt, dusty-blue shorts, coral accent, eye catchlight and hair highlight.
  - Poses are still pure functions of the seconds value; the deterministic pause, seek and reduced-motion behaviour is unchanged.
- **Layout:** on desktop the anatomy is top-aligned (`#body-host` padding-top 34px). `#body-svg` heights are 640px (default), 710px (≥1600), 600px (≤1200) and 540px (≤960). `.body-bottom` now follows the body in normal flow.
  - Mobile (≤760) keeps the old fixed host height. Root moved the caption below the figure and increased its font, and overrode a legacy selector that had displaced Front/Back toward the middle.

## Root integration refinements

- Four nutrient watches show applied Fe/B12/D/folate models; D shows availability, not a predicted blood level.
- Tooltip definitions distinguish HR-derived aerobic support from a measured aerobic energy contribution. Glycolysis is an actual modeled ATP-regeneration share; body-fat change uses percentage points.
- The long timeline input accepts fractional days so chart dragging and returning retain exact positions.
- Dinner emphasizes post-meal glucose/insulin/glycogen, matching breakfast and lunch.
- The mobile stage overrides legacy flex specificity; Front/Back remains at the central viewer’s left edge, clear of the head. Activity captions sit below the figure at readable size.
- Export includes the independently editable micronutrient observation draft.
