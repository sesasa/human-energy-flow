# Activity, explanations and nutrient stores

This extension separates **food input**, **body reserves** and **change over time**. Iron and vitamin B12 have distinct models. Other micronutrients remain dietary-intake comparisons. None of the indices are laboratory results, clinical reference ranges, diagnostic thresholds or treatment targets. There is no symptom inference, personalized supplement dose, or automatic anemia/performance penalty.

## Iron: external balance and internal recycling

`src/model/micronutrients.ts` runs in daily steps. Starting pools are chosen teaching anchors:

| Pool | Reference | Selected low stores |
| --- | ---: | ---: |
| Storage, ferritin-related | 600 mg | 252 mg |
| Transferrin transport buffer | 3 mg | 3 mg |
| Red-cell iron | 2,400 mg | 2,400 mg |
| Tissue / enzyme pool | 300 mg | 300 mg |
| Seven-day marrow pipeline | 140 mg | 140 mg |

The displayed reserve index is `100 × storage / 600`. The selected low start is **42 / 100**, not “42% of a ferritin reference range.” It assumes functional iron is initially maintained. Ferritin as a clinical marker is influenced by inflammation and cannot be inferred from this index.

Each day:

1. Calculate iron intake and estimated absorption separately for each actual meal.
2. Recycle `red cells / 120` and `tissue / 180` into the daily transport flow. Mature the oldest marrow queue entry into red cells.
3. Remove 1.2 mg of external physiological losses, or 2.4 mg under the explicit higher-loss assumption.
4. Mobilize storage when needed, up to an authored 8 mg/day limit, to support marrow, tissues and the transport buffer.
5. Allocate transport iron to marrow demand and tissue replacement; marrow iron enters the seven-slot queue. Transport surplus above 3 mg becomes storage.
6. Preserve a mass ledger: `total pool − starting total = cumulative absorbed − cumulative lost`.

About 22 mg/day of functional turnover recycles in the reference model. This is **not** a 22 mg dietary requirement or daily loss. The transport compartment is a pass-through daily buffer; the model does not claim to resolve transferrin kinetics within a day. The RBC 120-day scale is grounded in physiology; the seven-day marrow queue, tissue turnover, pool allocation and demand correction are teaching simplifications. Repeated intake replenishes reserves slowly, not instantly.

If storage is exhausted or functional demand cannot be supported, the iron projection stops and freezes. The UI says **Projection stopped**, and the preview curve ends. The model does not continue into an unvalidated anemia trajectory. B12 continues independently. Functional iron is preserved through all ordinary low-store/recovery examples; crossing the boundary is not reported as a clinical diagnosis.

### Absorption assumptions

CoFID reports total food iron, not heme proportions or phytate. These explicit category heuristics are authored, not measurements of a particular meal:

- Heme fraction: beef 0.40, chicken 0.30, salmon/mackerel 0.25; other catalog foods use non-heme iron. Eggs are not treated as heme sources.
- Storage regulation: `R = clamp(exp(1.2 × (1 − storage/600)), 0.1, 2.5)`.
- Vitamin C factor: `1 + 0.5 × C/(C+50)` from **the same meal**, with C in mg.
- Phytate heuristic: `1 − 0.3 × foodMass/(foodMass+150)` for oats, bread, brown rice, lentils and nuts. It uses ingredient weight, not measured phytate.
- Non-heme fraction: `clamp(0.064 × R × Cfactor × phytateFactor / (1 + nonhemeIron/40), 0.004, 0.30)`.
- Heme fraction absorbed: `clamp(0.23 × (0.85 + 0.15 × R), 0.12, 0.35)`.
- Explicit reduced-uptake assumption multiplies total absorption by 0.30.

The base coefficient is calibrated so the existing mixed reference week approximately maintains the reference reserve. It is not a validated absorption algorithm; whole-diet absorption and individual variation are not predictable from these coefficients. Calcium, tea/coffee, inflammation/hepcidin dynamics, medication, disease and the variable bioavailability of foods such as spinach are not independently represented. Missing nutrient values remain flagged as lower bounds.

## Vitamin B12: a slower reserve

The chosen reference reserve is 2,500 µg; the selected low start is 800 µg, or **32 / 100**. Substantial stores and slow depletion are supported by evidence; these exact index anchors are not clinical cutoffs.

For each meal containing `I` µg:

`absorbed = min(I, 1.5 × (1 − exp(−0.5 × I / 1.5)) + 0.01 × I)`

The explicit reduced-uptake assumption multiplies the saturable active term by 0.1 while retaining the small passive term. Daily loss is `0.001 × current store`, followed by:

`next store = current store + absorbed intake − loss`

The pool has its own conservation ledger. The fractional turnover is informed by the National Academies' B12 discussion; the meal saturation curve is an authored approximation. Food-bound release, intrinsic factor, enterohepatic cycling and different causes of malabsorption are not separately resolved. The same formula must not be interpreted as a supplement-dose calculator.

## Diet scope and state convention

- Boundary day 0 is the selected starting reserve. No weekly warm-up erases an explicitly low status.
- Boundary day d contains reserves after the previous d days. Its input labels describe the upcoming selected weekday's menu, not the source of all iron already in the body.
- Repeat-week uses each actual weekday's foods. One-day scope uses the selected override only on day 0, then the applied background week resumes.
- Starting status and absorption/loss assumptions apply to the entire run, independently of food scope.
- Editing status or foods produces a draft. Run applies both and restarts. **Apply & view one year** also opens the long-term view at day 0.
- The Mon/Thu suggestion edits those lunches only: ensure at least 150 g lentils and 150 g orange; replace up to 100 g rice when adding lentils. It is idempotent and disables once both pairs are included. It selects repeating-week scope, previews absorption and calorie changes from the actual draft week, and stays a draft until applied.
- Reset to Reference Diet preserves **applied** nutrient settings and resets all food drafts; any unapplied status draft is discarded. Discard draft restores foods, status, starting weekday and application scope to the applied values.
- Export includes `diet.status` and `nutrientStatusDraft`. Refresh starts a new session, as for existing meal drafts.

The detailed day view holds daily reserve indices steady while glucose and other faster signals animate. Long-term reserves interpolate daily boundaries as the timeline advances. Main reserve cards appear for a selected low status, altered assumptions, or a reserve deviation greater than 5% from the model anchor. They are hidden during sprint detail to keep the effort-specific bars readable. The Diet chart explicitly covers one year; main long-term tracking continues for three years. Nutrient status is independent of the body-composition model's supported range.

## Presentation

The small native SVG activity person shows rest, eating, laptop work, running, dumbbell curls, recovery, sleep and sprint/walk phases. Claude authored the figure module. Main integration freezes it on pause, resets its pose on seeking/restart, and provides static activity poses for reduced motion. The body-size presets modestly affect its width. Front/Back controls live in the left story panel.

One educational tooltip system supports hover, keyboard focus, click/tap pinning and Escape. Tooltips explain meaning, current reading and an approximate model direction; live text refresh is throttled during playback, with immediate updates on pause/seek. They remain readable above native dialogs and stay inside the viewport. The rows preserve the existing accessible meter values. Long-term body, lean and fat rows show kg and signed absolute changes from the initial scenario; fat also retains percentage.

## Validation and practical limits

63 numerical tests include reference stability (within 2% over three years), per-day Fe/B12 conservation, distinct internal/external iron turnover, the marrow queue, low-store initialization, gradual recovery, same-meal vitamin C, day-specific food edits, one-off vs repeating scope, reduced uptake/larger losses, stopped projections and B12 saturation. Status browser checks cover activity scenes, playback/scrubbing, reduced motion, tooltip interactions, pending/apply/discard/reset/export, actual meal changes, day/year reserves, unsupported projections and 320/390px layouts. Existing browser, diet and composition regressions also pass.

Tests validate implementation and chosen relationships; they do not validate individual physiological forecasts. These models do not establish whether food alone can correct a confirmed deficiency. The UI explicitly calls for clinician-guided investigation and supplementation when appropriate, without recommending doses.
