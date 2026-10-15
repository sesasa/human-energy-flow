# Laboratory results and food-response scenarios

Implemented October 2026. The subsequent [profile/cycle revision](../profile-cycle/MODEL.md) updates live basal losses, functional red-cell initialization, sensitivity cases and age/sex defaults; the earlier unprofiled values below remain for historical solver compatibility. This supersedes the reserve-selection interface in `docs/refinement-4`. The six local sample screenshots informed the hierarchy: test name, measured value, unit, nearby reference interval, and a simple time plot. No patient result, date, identifier or historical series was copied into the application. The empty state contains no prefilled results.

## Interaction and data

Choose any subset of Ferritin, Vitamin B12, Folate and 25-OH Vitamin D. Only selected markers with valid entered results produce projections and main-timeline readings. Hemoglobin, MCV and MCH are optional supporting observations; they do not get nutrient plots. Selection can be removed without deleting the observation. No symptom-based classification or diagnosis is made.

A supplied lower and/or upper reference limit overrides the default, including one-sided limits. Defaults and their sources are labeled. Changing units clears result and bounds, so a number is never silently reinterpreted. B12 uses 0.7378 pmol/L per pg/mL, folate 2.266 nmol/L per ng/mL, and D 2.5 nmol/L per ng/mL. Ferritin ng/mL and µg/L are equivalent. These are concentration unit conversions, not conversions into percent body stores.

The actual measurement is a single dot at Start. Future values are dashed and explicitly labeled **Modeled trajectory — educational estimate**. Green marks the reference region; the marker-colored envelope shows sensitivity. When a wide reference interval extends above the visible scale, the graph says so. No follow-up measurement is invented. Values are rounded in the interface; internal integration retains precision.

## Real foods and shared scope

All food nutrients come from the pinned **CoFID 2021** extract; see [data provenance](../../data/README.md). Nutrient intake is the sum of `per100 × edible grams / 100`. Unknown values remain flagged, not assigned random substitutes. Food labels and preparation states are retained. Rice, pasta and potatoes use cooked weights. Calories retain the existing consistent protein/fat/carbohydrate/fiber accounting.

For each selected marker, aggregate each distinct food across the actual seven-day plan, rank by its known nutrient contribution, and display the three largest contributors. These are total intake contributions, not absorption rankings. The user chooses one named weekday/meal serving to edit. Eggs are displayed in approximate 50 g edible portions; all other foods use grams. No calorie compensation, food substitution or suggested-meal algorithm runs in the background.

An edit updates the shared Meals draft, weekly nutrient totals, macros, estimated uptake and all selected curves immediately. It explicitly selects repeating-week scope, as stated beside the controls. Run applies it to daily and long-term physiology. Until then the live body uses the previously applied food plan. A one-day override is honored in the projection preview: it replaces day zero only, followed by the applied week. Contributors then describe that first week's actual foods. Reset restores reference food while preserving already applied observations; Discard restores the applied draft and validation state.

## Ferritin: approximate net iron balance

`src/model/labProjection.ts` initializes the existing conserved iron model in `src/model/micronutrients.ts`. The central case uses **8 mg storage iron per µg/L ferritin**, a historical healthy-subject association. This is not an individual assay calibration. No ferritin percentage is calculated. Inflammation, liver disease, abnormal losses, anemia and other conditions can invalidate the relationship.

The underlying solver retains distinct storage, transport, marrow, red-cell and tissue pools. Daily recycling is large relative to dietary input. Marrow maturation has a seven-day delay, red cells an illustrative 120-day turnover, and tissues 180 days. Losses remove iron; functional demands mostly recycle it rather than consuming the entire demand as an additional daily loss. Storage changes follow absorbed input minus net losses after functional allocation. The conservation tests remain in place.

Absorption is computed meal by meal from total iron and authored heme fractions (beef 0.4, chicken 0.3, oily fish 0.25), since CoFID does not report heme iron. Non-heme uptake depends on the storage pool, same-meal vitamin C, a coarse high-phytate-food modifier and dose saturation. The functional forms and coefficients are teaching approximations, not validated individualized absorption estimates. Heme absorption is limited to 12–35%; non-heme to 0.4–30% before the sensitivity multiplier. See the source register and previous [pool-model documentation](../refinement-4/MODEL.md).

| Case | Initial mg storage iron per µg/L | Absorption multiplier | Daily loss |
|---|---:|---:|---:|
| Central | 8 | 1 | 1.2 mg |
| Lower balance | 10 | 0.3 | 2.4 mg |
| Higher balance | 6 | 1.25 | 1.0 mg |

These are **authored sensitivity cases**, not probabilities or clinical confidence limits. They intentionally show that the same food plan could have a different direction under different uptake/loss assumptions. The low case can exhaust modeled storage; a zero edge then denotes the model floor, not a forecast of a patient's ferritin. The central projection is withheld after its functional-pool support fails. Starts outside 1–300 µg/L, or a supplied hemoglobin below its supplied lower limit, also withhold numeric futures. These scope bounds are software limits, not diagnostic thresholds. A withheld uptake is shown as “Not estimated,” never zero.

Increasing total dietary iron does not necessarily create positive balance. The model can rise, approximately stabilize or fall. It does not use a preselected recovery curve or drive ferritin toward the reference band.

## B12, folate and D: conservative anchored food-response scenarios

A single blood test and menu cannot identify stores, absorption, prior exposure, ongoing losses, sunlight, medication or illness. There is no defensible universal conversion from a generic reservoir percentage to these serum concentrations. Instead, the app uses population intake-response evidence to explore **a change from the food plan in use when the result was entered**.

Entering or changing a result freezes a copy of the currently applied habitual weekly menu (`dietAtResult`), excluding a one-day override. Food edits and Apply preserve that anchor. Resetting food does not fabricate a new measurement. For older observations without a snapshot, the applied menu is the fallback anchor. An observation is assumed to reflect that menu; this assumption is visible in the card and is a substantial limitation.

Let `L0` be the entered concentration in canonical units, `I0` the anchor weekly mean, and `I(t)` a rolling seven-day intake from actual daily meals. Six prior days use the anchor menu aligned with the scenario weekday, so merely choosing a different starting weekday does not create a fictitious trend.

| Marker | Central food-response target | Sensitivity case | Adjustment time |
|---|---|---|---|
| Serum B12 | `L0 × (I/I0)^(ln(1.08)/ln(2))` | No response through pooled upper coefficient 1.125 per doubling | 90-day time constant, authored |
| Serum folate | `L0 × (I/I0)^(ln(1.07)/ln(1.1))` | No response through upper coefficient 1.12 per 10% intake | 21-day time constant, authored |
| 25-OH D | `L0 + 0.8 × (I−I0)` in nmol/L; food D in µg/day | No response through 1.68 nmol/L per extra µg/day | Approximate 15-day circulating half-life |

Daily adjustment is `L(next) = L + (target−L) × (1−exp(−1/tau))`; `tau = 15/ln(2)` for D. These rates are **not fitted clinical recovery curves**. In particular, a serum B12 response is not liver-store replenishment, and serum folate is not red-cell folate. Folate evidence is largely from women aged 12–49; applying it to this adult male is uncertain. B12 evidence mixes observational intake and supplementation studies. Vitamin D evidence concerns fortified foods; application to ordinary foods and decreases is an extrapolation. These limitations accompany the source links.

Non-food influences are held constant. Consequently, an unchanged food week remains at the entered concentration for these three markers, even if low. This is an explicit **no-change assumption**, not a claim that untreated deficiency stays stable. A fixed diet's future clinical direction cannot be identified from this information alone. Moderate food increases and decreases can move the scenario in either direction; none is guaranteed to normalize a low result. Sensitivity includes no response because absorption or the underlying cause may dominate.

To avoid unlimited extrapolation, B12/folate intake ratios outside 0.5–2 or vitamin D changes exceeding 25 µg/day stop the numeric series. These are conservative authored model limits, not medical safety limits. Intake and food controls continue to function. Zero B12/folate anchor intake cannot support a ratio and also withholds a future.

Displayed estimated uptake is separate from the empirical concentration response: B12 uses saturable meal uptake plus a 1% passive component, food folate uses a 50% approximation, and vitamin D uses an authored 80% approximation. These are illustrative accounting aids, not measured absorption. They are **not multiplied into the population response coefficient a second time**. The food coefficient already relates ingested intake to observed concentrations.

## Limits and implementation

The dialog previews one year. Applied selected scenarios share the existing three-year timeline, so playback and scrubbing inspect the same model. Extrapolation over years is especially uncertain. No personalized supplement dose, deficiency diagnosis, clinical recovery date or exercise-performance effect is inferred. The app explicitly advises clinician-guided evaluation/treatment for confirmed deficiency.

`labs.ts`: observations, selection, units and source-backed default ranges. `labProjection.ts`: lab-unit scenarios, scope limits, contributor accounting. `labChart.ts`: reference band, observed dot and projected lines. `nutrientPanel.ts`: results and shared-food controls. `main.ts`: selected-only timeline readings. Legacy reservoir and experiment helpers remain for regression compatibility; their old scenario/suggestion UI is removed.
