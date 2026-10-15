# Sex-aware profiles and optional menstrual iron

This revision preserves the existing food, acute physiology and laboratory architecture, while adding profile context. The core new implementation is `src/model/profile.ts`; `profileFromScenario` is the single source for diet/lab context. Defaults are male, age 35,75kg175 cm and cycle OFF. The female case also starts with cycle OFF; selecting sex does not infer menstruation, menopause, pregnancy or a diagnosis.

## Navigation and profile behavior

The app opens in **Over Time**. Its secondary **Show Inside a Day** action opens the selected weekday's representative daily sequence. Only that view displays **Healthy day / Sprint session** and **Back to Over Time**. The return action restores the exact long-term position; entering the same representative day restores its last daily position. The anatomy shortcut also opens the selected weekday. The one/three-year top tabs are removed; timeline milestones and graph scrubbing already cover those spans.

Profile changes use the existing Apply workflow and restart the simulation from the new initial state, as the dialog states. This deliberate reset avoids mixing old initial conditions with a new profile. Unapplied food/lab drafts survive a profile change; the new profile reaches their previews and cache keys. Applying/discarding/resetting food does not reset the applied sex or cycle settings. JSON export records both the scenario cycle settings and the applied diet profile.

The sex radio buttons are in Adjust scenario beside the person configuration. Matching example presets switch to the corresponding sex example. Custom weight, height and body-fat measurements remain unchanged. The model supports female body fat14–50% for input (male 6–50%); long-term composition stops outside14–45% female or6–45% male. These are deliberately bounded software scopes, not medical definitions of safety or ideal fatness. Inactive invalid cycle fields are reset to valid default cycle parameters on Apply rather than blocking an invisible field.

## Energy and body composition

Mifflin–St Jeor already implemented both sex terms; the new selector makes them accessible:

`resting kcal/day = 10 × weight(kg) + 6.25 × height(cm) − 5 × age + s`

where `s = +5` male and `−161` female. At identical dimensions the resting estimate differs by 166 kcal/day. Activity costs and food processing remain separately accounted, so the total difference depends on the modeled activity. There is no new arbitrary sex multiplier on total expenditure. The dialog previews resting and daily expenditure; the actual food week stays as chosen. The preview also shows the weekly average energy balance, including the lighter Sunday, so a surplus from unchanged meals is explicit rather than read as an intrinsic female weight forecast.

Female illustrative presets keep the male preset BMI/height relationship and use22%/27%/38% fat for underweight/baseline/overweight examples. At175 cm the example weights remain55/75/88 kg. These are **authored representative bodies**, not equations or measured averages. Underweight/overweight refer to BMI; a particular body-fat percentage is a separate property. The baseline female lean/fat split is54.75/20.25 kg.

The existing illustrative lean-gain ceiling now scales with actual starting lean mass: `configured ceiling × initial lean / 62.25 kg`. Relative potential is not reduced solely by sex. The literature supports similar relative hypertrophic responses; it does not validate this application's exact2.2 kg baseline ceiling or330-day adaptation coefficient. Calories, actual protein, activity and starting tissue remain the drivers of long-term differences. Energy conservation is retained.

Claude implemented modest female silhouette changes, same-sex fat-softness reference and sex-aware shape caching/accessible labels. Organs and vascular routes keep their shared coherent coordinates and hit targets. Front/Back, muscle highlighting, particles and sprint visualization remain functional. The differences are authored schematic geometry, not a body scan or anthropometric estimator.

## Cycle inputs and iron loss

Editable inputs: enabled; average length21–40 days; bleeding1–10 days; starting cycle day1 through cycle length; light/typical/heavy. The bounds describe supported regular-cycle scenarios, not diagnostic criteria. Day 1 means the first bleeding day. No ovulation, hormone, performance, BMR or other nutrient oscillation is inferred. Pregnancy, lactation, irregular cycles, hormonal contraception and the causes of abnormal bleeding are outside this model.

| Category | Representative blood volume / cycle | Sensitivity range |
|---|---:|---:|
| Light | 15 mL | 5–20 mL |
| Typical | 30 mL | 20–60 mL |
| Heavy | 80 mL | 60–120 mL |

These are **authored illustrative category scenarios**, anchored to reported medians near 28–30 mL and the traditional80 mL high-loss threshold. The ranges overlap intentionally and do not convert subjective bleeding intensity into measured volume.80 mL is not presented as a universal heavy-bleeding average. The UI says the categories are not measurements and includes a concise assessment note for heavy/persistent bleeding.

Assumed normal hemoglobin for blood-loss accounting is135 g/L; iron content is3.39 mg/g Hb. Thus `0.135 × 3.39 = 0.45765 mg Fe/mL`, yielding approximately7/14/37 mg per representative cycle. This is independent of optional entered Hb, which remains a contextual lab observation and can withhold a ferritin model when below a supplied lower limit.

The total loss per cycle stays fixed when bleeding duration changes. An authored normalized linear taper weights bleeding day1 throughN by `N,N−1,…,1`; it sums exactly to the category total. Outside those days cyclic loss is zero. A shorter cycle repeats the same total more often. Starting-cycle-day alignment shifts the events, not their per-cycle total. Male and cycle-OFF profiles add no menstrual loss, even if saved cycle parameters exist. Switching to male retains saved cycle settings (including the toggle); switching back to female makes those settings visible and active again if enabled.

## Conserved iron model, without display smoothing

Basal iron loss uses the National Academies estimate `0.014 mg/kg/day` at the profile's initial weight. This deliberately changes the old75 kg male central value from1.2 to1.05 mg/day. Weight is fixed for this iron model; it is not silently updated by separate body-composition adaptation. Initial functional red-cell iron uses Nadler blood volume:

- male L: `0.3669 × height(m)^3 + 0.03219 × weight(kg) + 0.6041`
- female L: `0.3561 × height(m)^3 + 0.03308 × weight(kg) + 0.1833`

Multiply by assumed normal Hb150 g/L male or135 g/L female and3.39 mg Fe/g. This initializes a functional pool; it is neither a predicted blood-volume measurement nor a future hemoglobin result. The model still assumes no additional functional iron deficit at entry.

Menstrual iron leaves **red cells**, not the small circulating transport pool. Recycling, the existing marrow replacement response and seven-day maturation delay gradually draw from stores. Net iron accounting is:

`total iron(next) − total iron(now) = absorbed food iron − basal loss − menstrual iron loss`

The cumulative menstrual ledger is separate and included once in cumulative total loss. No average menstrual loss is added on top of periodic events. Ordinary red-cell recycling remains internal transfer, not a second external loss. When functional pools cannot be supported, the numeric ferritin future is withheld as before.

Ferritin remains the rough historical storage proxy: central storage/8 mg perµg/L, starting exactly at the entered measurement. There is **no display smoothing**, monthly reset or forced post-period drop. Small cumulative changes arise from the ledger and delayed replacement. On a one-year plot, rose-colored axis ticks span the modeled bleeding days. They are separate from the green reference band and colored sensitivity envelope, and only appear for ferritin with an active female cycle. B12/folate/D receive neither markers nor cycle effects.

Profile-aware sensitivity uses storage conversion6/8/10 mg perµg/L, uptake1.25/1/0.3times baseline, basal losses0.8/1/1.3times baseline, and corresponding low/representative/high category loss. These are assumptions, not probabilities or clinical confidence limits. If either bounding sensitivity case reaches functional depletion, the shaded envelope stops at its last supported day and the UI explains the limit. A still-valid central curve continues; the frozen case is never presented as a future zero ferritin value. The legacy no-profile solver retains earlier default cases for compatibility with older numerical callers; all live UI scenarios carry a profile.

## Reference comparisons and diet connection

Supplied laboratory bounds always override defaults. The linked Mayo ferritin intervals are male adult31–409 µg/L; female 18–50years6–175; female 51+11–328. These are assay/age/sex intervals, not treatment targets, and age alone is not used to infer menopause or switch the cycle off. B12, folate and D keep their existing marker-appropriate defaults. A result within a lab interval can still need clinical interpretation.

The food coverage overview now uses age/sex US references for iron, calcium, magnesium, potassium, zinc, vitamin C, D and ALA; unchanged references retain their existing sources. The iron RDA already incorporates usual menstrual needs for its age/sex group, so the cycle setting does not add its losses to the RDA again. This population comparison is distinct from the simulated absorbed-iron ledger and is not a personalized prescription.

The same CoFID food quantities, meal-specific iron absorption and three contributor controls feed the cycle-aware model. Beef/fish heme estimates, legumes/grains and same-meal vitamin C retain their existing assumptions. Adding food can improve the balance, but it cannot guarantee correction; loss and absorption still matter. Calorie/protein changes feed the main body simulation through the shared applied week.
