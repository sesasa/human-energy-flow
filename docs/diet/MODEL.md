# Diet and model integration

The application now starts from a repeating seven-day reference diet, not three identical macro fractions. The immutable reference is in `src/model/diet.ts`; experiments use deep copies. The mean is approximately 2,627 kcal, 134 g protein, 327 g carbohydrate, 87 g fat and at least 43 g measured fibre per day. See the generated audit in `artifacts/diet/nutrition-audit.json` for exact calculated values. This is an educational reference menu, not a prescription.

## Food accounting

`data/foods.json` contains 28 ordinary foods extracted from UK CoFID 2021. Every food retains its source code, original description, preparation state, original energy value and per-100-g nutrient values. `scripts/extract-foods.py` reproduces the extraction from the official workbook with Python/openpyxl. Amounts refer to edible food; rice, potatoes, pasta, meats and cooked vegetables use the corresponding cooked records. Oats use dry weight; fruit excludes peel/core as appropriate. Milk grams are used directly rather than assuming a precise ml conversion.

For CoFID food inputs, the common energy function uses:

`4 × protein + 3.75 × available carbohydrate + 9 × fat + 2 × measured AOAC fibre`

CoFID carbohydrate is expressed as monosaccharide equivalents. Its source energy column excludes the added fibre convention, so the simulator deliberately recalculates rather than mixing source calories with model calories. Original abstract scenarios still use their original 4/4/9 convention; all UI diet inputs use the food convention. Available carbohydrate and fibre are separate. Fibre contributes energy through a slow colonic stream and does not drive glucose or insulin. Thermic fractions are the same scenario parameters in the day and long-term engine; fibre thermogenesis is not separately estimated.

Unknown (`N`, blank) values remain null, never automatic zeroes. `Tr` is approximated as zero. Totals track missing keys; fibre and micronutrient amounts with missing contributions are shown as lower bounds. This also flags unreported fibre in plain animal foods rather than silently substituting a guessed value. Calories exclude unknown fibre and are approximate. Food-table values are typical, not exact brands or laboratory measurements of the illustrated plate.

## Absorption and weekly continuity

Each meal supplies its own calculated carbohydrate, protein, fat and fibre. The gamma-shaped kernels use 50, 70, 125 and 240 minute scales respectively; the fibre stream also starts after 240 minutes. Fat and fibre increase the carbohydrate/protein time scales modestly, capped at 35%. These are teaching coefficients, not validated glycaemic-index or gastric-emptying predictions.

Kernels are normalized over a finite 2,880-minute horizon. The repeated-week convolution runs on a 10,080-minute axis, including the previous Sunday’s tail. The minute engine runs seven sequential days, carrying glycogen, relative signals, heart rate and fatigue. It repeats weeks until liver/muscle boundaries agree within 0.00001 g (at least three weeks, maximum 30). Reference data converge in three weeks. Sunday substitutes light recovery for the resistance portion; the configured underlying weekly activity flag remains intact.

Daily ledgers distinguish food consumed from energy absorbed:

`gut energy change = consumed energy − absorbed energy`

This quantity can be positive or negative on individual days and sums to approximately zero over a settled week. Day expenditure uses the actual absorbed thermic load. Tests independently sum convolution nutrients and week energy in addition to checking the engine’s residual (which alone is not independent validation).

## Scope semantics

- **Repeat this modified weekly diet:** all seven draft days become the active repeating week. The chosen weekday is the starting day in both day and long-term views.
- **Apply only to this simulated day:** the selected draft day replaces the first simulated day exactly once. The previously applied week remains the background pattern. Other edited days remain drafts.
- For a one-off, the engine subtracts that actual occurrence’s original absorption kernel and adds the new one on a linear future axis. It leaves previous-day tails and initial body state unchanged. Digestion continues into the next real day, and sequential state is retained.
- **Reset to Reference Diet:** immediately applies the original week and resets food drafts, preserving body, exercise and applied micronutrient-status settings. Unapplied status drafts are discarded.
- **Reset this day to reference:** changes only that draft day; it requires Run to affect the simulation.
- **Discard draft:** restores the applied week, any applied one-day override and the applied nutrient settings.

Drafts survive closing/reopening the dialog during the session. Refresh starts a new reference session; Export JSON includes active diet, scope, starting weekday, foods, quantities, sprint configuration and drafts.

The day view shows the selected 06:00–06:00 day. The model computes all seven days of carryover. The long-term view follows actual weekdays and calories rather than simply applying a weekly mean. Its protein adequacy rule uses a trailing seven-day average, including the appropriate pre-start week. Food affects lean adaptation through that existing illustrative rule, alongside sleep and energy. Daily amino-acid signals respond to actual meal protein. Acute fatigue/recovery timing remains a teaching abstraction, not a protein-repair forecast.

## Sprint integration

The intense session begins from the selected diet day’s state and absorption. A no-workout trace determines whole-muscle availability immediately before warm-up; this seeds the local active muscle pool. The minute-scale trace then includes the sprint profile once, replacing normal exercise. The local pool’s depletion is a visualization of that exercise, not a second subtraction from whole-body glycogen.

A bounded threshold multiplier reduces glycolytic support below 45% local availability. This threshold and effect size are illustrative. Normal carbohydrate changes often have little effect on short-sprint power; severe depletion matters more. ATP remains protected, PCr cycles, and fatigue still limits late efforts even with fuel present. The long-term pattern remains the normal activity routine; selecting the intense day does not project maximal sprinting every day for years.

## Micronutrients and limits

Coverage compares weekly average food intake with fixed US male 31–50 RDA/AI values: iron 8 mg, calcium 1,000 mg, magnesium 420 mg, potassium 3,400 mg, zinc 11 mg, B12 2.4 µg, folate 400 µg DFE, C 90 mg, D 15 µg and ALA 1.6 g. This menu’s ordinary unfortified food folate is compared at 1 µg = 1 µg DFE; added folic-acid fortification is not reconstructed. EPA+DHA has a separate EFSA adult reference of 250 mg. Sodium uses the US 2,300 mg limit, not an adequacy target or a goal to fill.

The panel explicitly uses the reference adult’s comparison values even if age/body settings change. Meeting a reference is not an overall health score or a clinical sufficiency diagnosis. Vitamin D is food-only, below the reference in this menu; sunlight and supplements are not modeled. Missing fatty-acid values stay marked. Iron and B12 now also have explicitly selected, slow body-store models; see [the nutrient-store model](../status/MODEL.md). Other micronutrients remain coverage-only. Symptoms, clinical diagnoses, electrolyte changes, blood pressure and disease are not inferred.

## Illustration and interaction

Claude implemented the initial SVG food renderer. Native SVG plates depict actual foods, with mass-based area, discrete egg/bread pieces, side bowls/glasses and smaller garnishes. Quantity scaling is independent of slot size and portion-based sorting. Illustrations remain schematic; dense plates may overlap, and more than seven main ingredients get an explicit extra-food count. Grams and calculated nutrition remain authoritative.

One meal editor is expanded at a time. Day and meal tabs support arrows/Home/End, gram fields and +/- buttons retain focus, and newly added foods receive keyboard focus. A compact meal appears at the actual meal time, then fades through digestion into tissue uptake while the existing body signals animate. Starting-body presets are drafts inside Adjust scenario until Apply.
