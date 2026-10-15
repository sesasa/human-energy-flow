# Same person, different food

## Healthy is unchanged

`dietTemplates.healthy` is the original frozen `referenceDiet` object, not a rebuilt week. All seven daily menus, portions, meal times and the original 28 food records are unchanged. This is a data-preservation promise, not a promise that simulated outputs from the old model remain identical: the general lean-loss and recovery extensions apply to all food plans, including Healthy, without a template-specific exemption. Tests pin both to their pre-revision hashes. Nine new CoFID records are appended to the catalogue. The two new weekly menus contain only authored food portions; no template has an outcome multiplier, nutrient target or deficiency setting.

## Menus and computed intake

Fast food repeats a sausage bun and tea breakfast, cheeseburger/fries/cola lunch, and cake snack. Dinner alternates 300 g cheese-and-tomato pizza with 330 g cola, and 180 g battered chicken plus 200 g fries and 330 g cola. A burger is calculated as its actual 100 g cooked beef patty, 80 g bun and 20 g cheese; the plate assembles those ingredients visually. Lunch also has 150 g fries and 400 g cola. Breakfast contains 80 g bun, 75 g sausage and 300 g unsweetened tea; cake is 80 g. All weights are edible portions. Preparation already includes cooking fat; it is not added a second time.

Low variety repeats two meals at 10:00 and 19:00. First meal: 160 g white bread, 200 g boiled potatoes, 10 g oil, 1 g salt, 300 g tea. Evening: 80 g white bread, 400 g rice, 200 g potatoes, 10 g oil, 1 g salt and 300 g tea. Three evenings swap 100 g rice for 100 g potatoes. No animal foods, fruit, other vegetables or nuts are silently added. Tea is brewed without milk/sugar. UK white bread retains its real flour-fortification nutrients; potatoes still supply vitamin C and potassium.

Calculated weekly averages (rounding for this document only):

| Menu | kcal/day | Protein g | Carbohydrate g | Fat g | Fibre g | Sodium mg |
|---|---:|---:|---:|---:|---:|---:|
| Healthy | 2627 | 134 | 327 | 87 | ≥43 | 1783 |
| Fast food | 3018 | 111 | 366 | 128 | 24 | 3451 |
| Low variety | 1492 | 38 | 288 | 26 | 16 | 1799 |

These outcomes were calculated after choosing ordinary portions, not forced in code. Fast food still supplies B12, protein and exercise carbohydrate. Low variety is energy-limited as well as nutrient-limited. These two individual example weeks do not represent every inexpensive or processed-food diet.

## Interaction and state

A native three-radio selector stays available in Meals and Micronutrients. It replaces the shared food draft and selects repeating-week scope. Each template's portion draft is remembered while switching during the session. Choosing a template leaves person, sex, cycle, sleep, exercise, sprint settings, nutrient status choices and actual lab observations unchanged. An observation's `dietAtResult` remains its original food snapshot.

Totals, illustrations and selected lab previews update immediately. Run applies the chosen week to both Inside a Day and Over Time through the existing callback; only then does the main body change. Applying restarts the timeline as before. Templates are metadata; all engines read actual food quantities. After a one-day Run, the selected day is explicitly labeled applied and the remaining unapplied weekday changes stay marked as drafts. Discard restores the actual applied week plus its one-day override and clears the draft flag. A one-day application keeps the existing applied week and records `onceTemplate` only for the override; later days resume the existing week. JSON exports carry both applied/draft template IDs and food quantities.

Reset this day restores that day's authored meals in the current template. Reset to Healthy / Reference Diet applies the original week and clears template drafts while preserving already applied lab observations/profile. Discard clears unapplied template drafts and restores applied food. Normal add-food and portion controls work in all menus. Meal tab navigation and chapters support a different number of meals. The everyday tab is called Daily routine for alternative menus so it does not label fast food as a Healthy day.

## Physiology

The existing nutrient-conserving weekly absorption convolution uses actual meal times, carbohydrate, fat, protein and fibre. Glucose/insulin remain relative signals, with a shared mixed-meal digestion kernel rather than individual food GI. Actual glycogen supplies the sprint engine. Identical glycogen can give identical early sprint performance across differently named templates; no category penalty is imposed. Person/activity settings stay fixed; expenditure can still differ through the thermic effect of the actual food and subsequent mass change.

Low energy/protein previously reduced long-term gains but never permitted lean loss. The extension uses Hall/Forbes' differential fat-free fraction `p = 10.4 / (10.4 + fat kg)` under a sustained seven-day average deficit. Lean loss is `max(0, -meanBalance) × p / (p × rhoLean + (1-p) × rhoFat)`. Existing illustrative training gain is added separately. The actual day's remaining energy change updates fat: `(dailyBalance - netLeanChange × rhoLean) / rhoFat`. Daily and cumulative energy therefore close exactly. Weekly averaging avoids wearing down lean tissue from ordinary alternating meal days. This hybrid teaching rule is not a muscle-specific clinical forecast. Protein influences gains, but no unsourced protein-only catabolism coefficient is added.

The existing relative fatigue signal now uses the repeating week’s average protein and energy for recovery support `min(1, protein / model protein target, food energy / estimated expenditure)`. Off-exercise fatigue clearance is the existing 0.0004 per minute multiplied by `0.5 + 0.5 × support`. This is explicitly authored, bounded illustrative timing—not a validated prediction of recovery. A one-day override keeps habitual recovery support from the applied week; the actual override still changes absorption, amino acids, energy, glycogen and exercise fuel. With no weekly diet supplied, the standalone day solver uses its daily menu. The sprint engine retains its separate PCr/fatigue time course and glycogen dependence. Lean-mass bars represent absolute tissue with a separate signed change, so lost tissue does not make a gain-only bar appear empty.

Extreme composition permanently stops at the existing supported body-fat bounds and displays Projection limit reached. It does not extrapolate severe undernutrition through years. No sodium-to-blood-pressure, inflammation, disease or deficiency diagnoses are invented. Tea absorption inhibition is disclosed as unmodeled.

## Micronutrients

All actual selected lab markers and inputs persist across template switches. Known food inputs change intake, estimated uptake and existing projections. Ferritin uses its conserved pools and profile/cycle losses. New patties/chicken/sausage use the existing meat-category heme assumptions; see SOURCES.md. Missing marker data withhold numeric projections instead of using unknown as zero.

The large B12/folate reduction from Healthy to a limited menu is outside the existing empirical serum-response scope. A numeric future remains withheld. A separately labeled small store illustration then reuses the existing conserved nutrient-pool model, with its original assumed starting stores (2500 µg B12; 20000 µg folate). It is never calibrated to the entered blood value. Percentages mean fraction of those assumed initial stores, not laboratory reference ranges or deficiency thresholds. B12 has slower turnover than folate. Actual foods affect the series; no template assigns low status. The main timeline can indicate the separate store direction while keeping the laboratory value Not estimated.

The fallback is shown only for selected B12/folate markers whose food change cannot support the serum projection. It does not add an unrelated dashboard or automatically select tests. With no B12-contributing food, the existing contributor section honestly has no entries; foods can still be added in Meals. No automatic dietary correction or supplementation is introduced.
