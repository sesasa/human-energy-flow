# Micronutrients, observations and food experiments

The new Micronutrients view expands the earlier iron/B12 feature without changing their conservation model. It presents one nutrient at a time: starting context, optional lab observation, a separately chosen model reserve, current-diet trajectory, and optional food changes. The baseline uses the **currently applied food plan**, not a hard-coded reset to the Reference Diet. The comparison and draft share initial settings and weekday; changing foods does not move the baseline. Applying the draft establishes a new baseline.

## Separate data models

`DietApplication.micronutrients` contains intent (`none`, `lab`, `hypothetical`) and typed observations. The curated list includes ferritin, serum B12, 25-OH D, serum folate, total serum calcium and serum magnesium. Zinc is an additional test. Hemoglobin and transferrin saturation are optional iron context.

`DietApplication.status` contains only explicit model assumptions. `simulateNutrients()` does not read laboratory observations. Lab values are never mapped to model percentages, diagnoses, anemia or exercise impairment. Tests verify identical nutrient trajectories for different lab observations with identical model assumptions.

Only supplied laboratory bounds are compared. Either or both bounds may be entered; no range means no range classification. Invalid/inverted ranges and unsupported units are rejected. Result and limits share the selected unit; changing it clears the fields and asks the user to re-enter the printed values. Invalid inputs keep Apply from committing and can be discarded. Labs remain fixed observations as the hypothetical model evolves.

## Distinct nutrient dynamics

Iron and B12 retain the [previous equations and boundaries](../status/MODEL.md). The new vitamin D and folate models each have their own input/loss ledger. They are not clinical recovery or lab-concentration models.

| Feature | Vitamin D | Folate |
| --- | --- | --- |
| Chosen reference anchor | 600 µg effective availability pool | 20,000 µg food-folate reserve |
| Chosen low start | 45% of anchor | 40% of anchor |
| Dietary absorption assumption | 80% of catalog food input | 50% of natural food folate |
| Other input | Explicit None / Background input, 6.3 µg/day assumed in the default reference scenario | None |
| Daily turnover | `pool × (1 − exp(−ln(2)/35))` | `pool × 0.0155` |
| Reduced absorption option | Not separately estimated | Multiplies uptake by 0.3 |
| Time scale | Weeks-scale availability buffering including an abstract tissue component | Smaller stores and months-scale turnover, much faster than B12 |

Both use `next pool = pool + absorbed food + assumed external input − losses`. Neither pool is clipped at the reference anchor; the chart's index can exceed 100 without diagnosing toxicity or declaring better health. 100 is a visual reference, not a goal to maximize.

The reference menu supplies about 7.0 µg vitamin D and 620 µg food folate daily on average. With the explicit background D assumption and the chosen folate turnover, the reference scenarios are approximately steady. Removing background D input while keeping food fixed lowers the availability model over time. Low folate with reduced uptake can also worsen despite an apparently adequate food total. B12 remains much slower. Exact turnover and absorption curves are authored; the physiological relationships and marker distinctions are sourced separately.

No reservoir model is invented for calcium, magnesium or zinc. Their lab observations and calculated intake remain available, with a concise explanation of why serum concentration does not reveal a whole-body nutrient tank.

## Food changes

`src/model/foodExperiments.ts` defines idempotent target portions. Each action deep-copies the draft, modifies specified meals only, and reduces compatible rice/pasta/potato/oil portions toward the original meal energy when possible. Calories are recalculated from real food data. If a chosen meal lacks suitable portions to reduce, the preview shows the remaining energy change; no invisible calorie adjustment is made.

Examples include lentils + orange at Monday/Thursday lunch; chicken → beef at Thursday dinner; chicken → salmon in Sunday's vegetable pasta; beef → mackerel at Monday dinner; and spinach added to Saturday dinner with a potato adjustment. Different fish/meat options have different iron, B12 and vitamin D profiles. Existing larger portions are retained; repeat clicks cannot stack the same suggestion. Conflicting protein sources are removed explicitly and displayed as gram changes.

Food suggestions are explicit Add actions, not automatic changes or reversible toggles that might silently undo subsequent manual edits. The user can adjust any resulting meal, reset individual days or discard the complete draft. Adding a weekly suggestion selects Repeat week and labels that scope. Intake, calories/macros, first-week absorption and 3/6/12-month indices are recalculated. Under reduced uptake or higher losses a food change can be insufficient; the UI never promises correction.

## Scope and limits

The current-diet baseline and edited draft both respect a one-day override, then return to the active weekly pattern. Starting reserves and assumptions apply to the entire run. Reference food reset retains applied laboratory context/status while discarding unapplied context changes. Discard restores foods, context, status, weekday and scope. Session exports include the applied observations and the separate draft; refresh starts a new session as before.

The screen carries the requested clinical boundary: confirmed deficiency can have causes beyond diet and may need clinician-guided treatment; the simulation is educational. It does not prescribe supplements, infer deficiency from symptoms, or predict a repeat blood test. Pool models do not imply personal safety, training readiness or a disease trajectory.

## Trend wording and final review adjustments

The baseline headline compares start with day 365. An absolute change below 3 model-index points is labeled Nearly steady; otherwise Rising or Falling. The nearby-month watch uses 28 days and a 1-point tolerance. Neither label claims a recovery rate. This avoids calling vitamin D 45→47 a meaningful recovery or calling faster folate loss slow. Exact values remain visible at 3/6/12 months.

Food experiments are available even with no known low status. Choosing a non-default absorption/input assumption switches that reference context to Hypothetical. The No known low status choice explicitly says Reference start & inputs. Invalid lab drafts retain their typed fields between marker selections and show Check this entry instead of a stale valid comparison; Apply remains blocked until fixed or discarded.

The nutrient curve uses SVG paths with fixed-size HTML axis labels, so phones do not shrink the labels to unreadable glyphs. Secondary caveats and milestone descriptions use at least 11px. Food cards expose the second weekday’s actual portion changes in a disclosure, and the Apply action is labeled view over time to match the existing full projection.
