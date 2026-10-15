# Plot cards: API and assumptions

New files only: `src/visual/plotCard.ts`, `src/visual/plotSpecs.ts`, `src/visual/plots.css`, `tests/plots.test.ts`.
No model, physics or existing file was changed.

## API (as contracted, plus optional fields)

```ts
// src/visual/plotCard.ts
export type SystemId = 'guided'|'cardiovascular'|'metabolism'|'muscular'|'digestion'|'brain'|'micronutrients';
export interface PlotPoint { x; y:number|null; low?:number|null; high?:number|null }
export interface PlotSeries { id; label; color; points; dash?; format?; readout?:(x)=>{value;detail?;change?}; tip?;
  sample?:(x)=>number|null }            // optional: exact model value for the cursor dot
export interface PlotSpec { id; title; unit; domain; xDomain; xTicks; series; systems; note?; bands?; reference?; observed?;
  toTimeline?; fromTimeline?;
  xLabel?; yTicks?; formatY?; formatX?; step?; pageStep?; referenceLabel?; limits?:{y;label?;color?}[] }
  // bands[].tick?: draws a short solid mark on the x axis instead of full-height shading
export class PlotCard { readonly element; readonly spec; constructor(spec,onSeek); update(timeline); emphasize(active,series?);
  xFor(timeline); dispose() }
export function interpolate(points,x) / linePath / bandPath   // pure helpers, used by tests

// src/visual/plotSpecs.ts
export function dayPlotSpecs(day:DaySimulation,scenario:Scenario):PlotSpec[]
export function sprintPlotSpecs(intense:IntenseDay):PlotSpec[]
export function longPlotSpecs(states:AdaptationState[],labs:Partial<Record<NutritionMarker,LabProjection>>,app:DietApplication):PlotSpec[]
export function minMaxDecimate(points,x0,x1,buckets), exerciseBands(states)
```

`readout` may also return `change`, which fills `SERIES-change`.

## Integration

- **CSS:** import `./visual/plots.css` once.
- **Building cards:** build cards with `new PlotCard(spec, t => seek(t))` whenever the model object changes (new `day`, `intense`, `longStates`, labs or diet). Specs are immutable, and paths are drawn once in the constructor.
- **Every frame:** call `card.update(timeline.position)`. This moves the cursor and dots and rewrites the legend text. Nothing else is redrawn.
- **Seeking:** `onSeek` receives a *master timeline* position:
  - Day and long modes map x to the timeline as identity (minutes 0–1440, days 0–1095).
  - Sprint mode uses `startMinute + x`, where x is minutes from the first sprint.
  - Pointer drags are rAF-throttled. The card never moves its own cursor; it waits for `update()`.
- **Mount one mode's set at a time.** Within a set, IDs are unique. Across sets, `heart`/`hr` exist in both day and sprint modes, and `hr` is also the long-mode resting heart-rate series. Mounting day and sprint sets together would duplicate `plot-heart`, `row-hr`, `hr-value` and so on.
- **`emphasize`:**
  - `emphasize(true)` marks the card relevant (`.is-active`).
  - `emphasize(false)` dims it (`.is-dimmed`).
  - `emphasize(true, ['pcr'])` also thickens those lines and dims the card's other lines and legend rows.
  - For "no guidance", call `emphasize(true)` on every card.
- **Outside the plot window:** when the timeline is outside a card's xDomain (sprint cards before or after the session window), the cursor is hidden, the readouts show "—" and the slider's text says "Outside this plot". The root decides whether such cards are shown at all.

## DOM contract

| Element | Attributes |
|---|---|
| card | `section.plot-card#plot-CARD[data-plot=CARD][data-systems="…"]` |
| legend | `.plot-readout` > `.plot-row#row-SERIES[tabindex=0][data-tip=metric-SERIES][data-legend=SERIES]` containing `#SERIES-value`, `#SERIES-note` (detail, hidden if empty) and `#SERIES-change` (hidden if empty) |
| plot | `.plot-area.plot-slider[role=slider][tabindex=0]` with aria-valuemin/max/now in plot-x units and aria-valuetext listing time plus every readout. Contains `svg[aria-hidden=true]`. |
| lines | `path.plot-line[data-series=SERIES]`; uncertainty is `path.plot-uncertainty[data-series=SERIES]`. `data-plot` is only on the card, so `section[data-plot=X]` and `[data-plot=X]` stay unambiguous. |
| cursor | `g.plot-cursor` (translated per frame) containing `.plot-dot[data-dot=SERIES]`. There is no `#trace-cursor`. |
| card note | `#plot-CARD-note` (`.plot-note`) |

- **Keyboard:** ←/→ and ↑/↓ move one step. Shift, PageUp and PageDown move one page. Home and End jump to the ends.
  - Day: 5 min / 60 min.
  - Sprint: half a sprint / one sprint+walk cycle.
  - Long: 1 day / 30 days.
- **Touch:** `touch-action: pan-y`, so vertical page scroll still works and horizontal drags scrub. Pointer capture is used.
- **Text:** all text goes in via `textContent`; series colours are set through CSSOM. No HTML is interpolated.
- **Accessibility:** legends are not `aria-live`. The slider's valuetext carries the current values.

## Cards and assumptions

**Day** (x = minutes from 06:00, ticks 06/12/18/00/06):
- `meal`: glucose and insulin on a fixed 0–1 *relative index*. Readouts have 2 decimals, with no % and no clinical units. Meals are shown as amber bands (unlabelled, because names overlap).
- `glycogen`: liver and muscle in grams. Fixed 0 to the larger capacity, rounded up to 50 g. Dotted lines mark each capacity, and readouts say "N g / of CAP g". Liver sits low on the shared gram axis; that is honest scaling.
- `heart`: hr in bpm, fixed to the day's min/max ±5 rounded to 10.
- `fuel`: carbShare and fatShare as % of *modeled energy demand*. The note says this is not measured oxidation. These two lines are exact complements in the model.
- `recovery`: illustrative 0–100 index. The `fatigue` duplicate is not plotted.
- Exercise is a teal band built from the binary `contractionUptake` flag, not drawn as a curve.
- Points are min/max decimated from the real 1441 states. Readouts call `sampleDay`.

**Sprint** (x = minutes from the first sprint; domain is 1 min of warm-up, the full protocol, then 1 min of cooldown):
- `rapid-energy`: atp, pcr and glycogen, each as a % of its own reference, fixed 0–100.
- `power-fatigue`: "Available power" (solid) and fatigue (dotted). The note says these are separate indices. The power detail reads "Capacity, not current output" outside sprints.
- `heart`: hr in bpm.
- `oxygen`: 0–100 relative support. The note says it is not saturation.
- `pathways`: pcrSource, glycolytic and aerobicSource as a % share of relative flux. These are present only while `phase==='sprint'`; elsewhere they are null, so lines break and readouts show "— / Sprints only".
- Each repetition gets a subtle sprint band.
- The 0.1 s states are decimated by min/max into 600 buckets. A test checks that every repetition's PCr minimum is kept exactly.
- Readouts call `sampleSprint` directly, not `sampleIntenseDay`. Within this window the two agree for the plotted fields.

**Long** (x = day, 0–1095, ticks Start/Year 1/2/3):
- `composition`: mass, lean and fatmass plotted as kg change from day 0, on a symmetric-capable axis with ticks at −a, 0 and +b, at least ±0.5 kg. Readouts show the absolute kg value and a signed kg change.
- `bodyfat`: % of body mass, with a dotted start line and a change in points.
- `conditioning`: series `hr`, the modeled resting heart rate in bpm. No stroke volume.
- **Projection limit:** states from the first `atLimit` day onward are frozen copies, not model results. They plot as a gap, with the readout "Projection stopped / Outside supported range".
- **Labs:** `lab-<marker>` cards, with series id = marker, only for markers that are both selected (`selectedLabMarkers`) and present in `labs`, in the order ferritin, b12, folate, vitd.
  - Points are the `LabProjection` points exactly (daily, not decimated). Null means a gap and "Not estimated / Outside model scope", never zero or a bridged line.
  - The dashed line is the modeled estimate, the shading is `low/high` sensitivity, and the dot at day 0 is the entered result.
  - `reference` comes from `effectiveLabRange(marker, observation, projection.profile ?? app.profile)`.
  - The y-top uses the same rule as `labChart`.
  - Ferritin alone gets bleeding-day ticks from `cycleEvents`.
  - The note always says "educational estimate … sensitivity, not precision", and mentions the gaps and the sensitivity cut-off day when relevant.
  - The legend names the test ("Ferritin", "Serum B12", "Serum folate", "25-OH D"), not the nutrient.
- `reserveIllustration` is **not** used, so it is never presented as a serum result.

## Not done / for root

- Not wired into `main.ts`. Existing meter rows and IDs (`row-glucose`, …) still exist there, and the new cards reuse those IDs, so remove the old rows when mounting cards.
- Not added: tooltip text (`setTip('metric-SERIES', …)`), narration, page layout, and browser tests for scrubbing.
- Verified so far:
  - `tests/plots.test.ts`: 5 tests pass.
  - `tsc --noEmit`: clean.
  - A throwaway headless-Chrome render of day, sprint and long cards: no page errors, exact seek mapping, cards about 142–166 px tall at 340 px width.
  - Composition (3 rows) and labs (long note) are the tallest, at about 165 px.
