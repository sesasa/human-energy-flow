# Physiology model and its limits

Parameters live in `scenarios/default.json`. Code separates energy estimates, repeating minute-scale physiology, the master timeline, daily long-term integration and rendering. Labels in the science dialog distinguish established physiological directions, population estimates and teaching abstractions. References and applicability are recorded in [SOURCES.md](SOURCES.md).

## Energy estimates

All energy is in kcal, time in minutes unless specified, mass in kg, macronutrients and glycogen in g.

```text
intake = 4 × (protein_g + carbohydrate_g) + 9 × fat_g
RMR = 10 × weight_kg + 6.25 × height_cm − 5 × age_years + sex_constant
sex_constant = +5 for male, −161 for female
thermic = .25 × protein_energy + .075 × carbohydrate_energy + .02 × fat_energy
run_minutes = min(exercise_minutes, distance_km / speed_kmh × 60)
net_exercise = max(0, MET × weight × duration_hours − RMR × duration_hours / 24)
TDEE = RMR + ordinary_movement + net_exercise + thermic
balance = intake − TDEE
```

Default RMR is 1673.75. Run is 18 min at a 9.3 MET estimate (~10 km/h); remaining 42 min use a 4 MET average resistance-session estimate, including rest periods. Net exercise is 349.51. Ordinary movement is 350, thermic effect 243.16, and training-day total 2616.42. Intake is 2603, giving −13.42 kcal. These small differences are far below real estimation uncertainty. A lighter weekly day substitutes 3.3 MET ordinary activity for resistance work while retaining the run. The default long-term mean energy balance therefore differs from the representative training-day budget.

Mifflin estimates resting expenditure across people; it is not measured metabolism. METs use a population convention. Subtracting modeled rest avoids double counting but is not a validated individual MET correction. Running energy changes with mass, not with the fitness variable. Expenditure updates with mass and age; recomposition alone does not change Mifflin RMR. Ordinary movement, thermogenesis and exercise estimates are uncertain. Protein energy is counted in the daily budget even though protein is not highlighted as an exercise fuel.

## Minutes to hours

A day begins at 06:00 and ends at the next 06:00. Meal fractions sum to one. Absorption is a circular gamma-shaped kernel:

```text
kernel(dt) = dt / scale² × exp(−dt / scale)
scale = 50 min carbohydrate, 70 min protein, 125 min fat
```

Normalize each discrete 1440-minute kernel to one, then multiply by the meal's macro quantity. Circular timing includes absorption from yesterday's dinner. Warm up the repeated day for at least six days, stopping when liver and muscle glycogen changes are below 0.00001 g (maximum 90 cycles). The first display state is the unadvanced 06:00 state. Each following snapshot is the next minute.

These kernels are schematic, with overlapping processes and slower lipid appearance. They do not simulate gastric emptying, glycemic index, incretin kinetics or specific food portions. Protein/fat/carbohydrate signals remain active during every narrative chapter; chapter ordering only shifts the explanation's focus.

Relative glucose and insulin relax toward absorption-driven targets over 14 and 12 minutes; amino acid/fat availability relaxes over 22 and 35 minutes. Signals are bounded between zero and one. Insulin includes an amino acid input and is reduced during exercise. No mmol/L, mg/dL, insulin concentration or clinical interpretation is implied. Insulin reduces modeled liver release and fat mobilization; contraction-mediated uptake is present during exercise independently of insulin.

## Glycogen and substrate ledgers

Liver capacity defaults to 100 g and muscle capacity to 400 g, scaled with body mass. These are illustrative capacities; real stores vary greatly. Local muscle demand is 0.03 g/min per 75 kg plus 75% of the exercise carbohydrate demand. Circulating demand is 0.09 g/min per 75 kg plus 25% of exercise carbohydrate demand. Remaining absorbed carbohydrate replenishes liver and muscle; full-store overflow goes to carbohydrate oxidation, not automatic conversion to fat. Liver release is reduced by the insulin signal at rest; exercise directs about 90% of unmet circulating supply to available hepatic glycogen. The endogenous glucose marker covers the remainder. Minimum modeled reserves prevent the schematic from emptying a healthy store completely.

Resting bars show only qualitative carbohydrate/fat emphasis, not all-substrate oxidation percentages. The running teaching mixture is 78% carbohydrate and 22% fat; resistance mixture 62%/38%; ordinary rest shifts with nutrient arrival. Mixtures are illustrative. Small amino acid contributions during exercise are omitted from the visual mixture. They do not imply zero protein energy across the entire day. Low-fuel scenarios may use additional pathways not modeled here; mixture fractions do not predict substrate oxidation under every possible diet.

Carbohydrate ledger:

```text
dietary_carbohydrate = carbohydrate_oxidized + change_in_glycogen
```

The endogenous glucose marker represents gluconeogenic/recycled carbon supporting demand. It is not independently added to energy intake. The day engine's carbohydrate oxidation ledger tracks dietary and stored carbohydrate; amino acid and lipid carbon conversions are not resolved biochemically.

At the periodic daily baseline, net protein pool deposition is assumed zero for the minute engine. Nearly all dietary protein's energy is eventually used over ongoing turnover and metabolism; amino acid particles illustrate availability, not all protein becoming muscle. Nitrogen handling is not a resolved state. Amino acids that are broken down can have carbon skeletons used in metabolism and nitrogen removed largely as urea. No claim is made that unused protein is simply excreted.

Daily protein energy-equivalent ledger: protein intake × 4 = protein energy ultimately accounted in expenditure. Fat oxidation is the balancing energy term:

```text
fat_energy_oxidized = expenditure − carbohydrate_oxidized × 4 − protein_energy_accounted
fat_energy_change = dietary_fat × 9 − fat_energy_oxidized
energy_residual = intake − expenditure − glycogen_change × 4 − fat_energy_change
```

This closes the combined daily energy bookkeeping; it is not a gram-resolved metabolic flux model. Per-minute carbohydrate transfers labeled oxidation are eventual oxidation equivalents: they are not constrained to instantaneous expenditure. Do not interpret them as calorimetry or infer instantaneous fat oxidation by subtraction. The ledger separately records carbohydrate overflow. Transient handling, fat sparing and nitrogen kinetics are unresolved. The day fat-store display is a representative initial store, held approximately constant at this display scale. Intra-day fat uptake/mobilization is visual, while cumulative fat change is resolved by the long-term engine. Carbohydrate, protein and fat absorption grams are individually conserved.

## Cardiovascular response, work and recovery

Illustrative HR targets: default resting 65 bpm, sleep 55, run 145, resistance around 112 with set-related oscillation, lower-intensity movement 94. Heart rate relaxes over approximately two minutes during exercise and five during recovery. At 06:00 the person is just waking, so the displayed rate initially reflects sleep. The model does not infer a measured heart rate from age alone or predict stroke volume or oxygen consumption.

Fatigue accumulates during exercise and falls outside exercise; it changes recovery glow. Sleep and dietary adequacy affect the separate long-term gain rule. Default mental work windows total six hours (10–13, 14–16, 20–21). A cached schedule assigns additional work to available awake slots, avoiding meals, sleep and exercise; mental work and tissue recovery may overlap. Ten-hour work schedules are checked explicitly. Brain demand remains visually steady and is already included in RMR. No large mental-work calorie term is added. Sleep lasts eight hours (22–06).

## Weeks to three years

The long-term engine uses daily energy-budget aggregates and a six-day push/pull/legs rotation, followed by a lighter recovery day. Each group has time between loading sessions. The displayed day is representative of a moderate training day, not an instruction to perform hard full-body lifting every day.

```text
protein_adequacy = clamp(protein_g / (body_mass × 1.6), 0, 1)
recovery_factor = clamp(sleep_hours / 8, 0, 1)
energy_adequacy = clamp(1 + energy_balance / 600, 0, 1)
volume = clamp(resistance_minutes / 42, 0, 1) × training_intensity / .75
stimulus = volume on resistance days, zero otherwise
lean_gain = (ceiling / time_constant) × stimulus × protein_adequacy
            × recovery_factor × energy_adequacy × (1 − accrued_gain / ceiling)
```

Default additional lean ceiling 2.2 kg and time constant 330 days are illustrative parameters for a moderately fit adult. This is not a biological equation or a prediction of an individual's training response. Different muscle groups have separate visual response weights. SVG width changes are limited to about 2%, localized to the muscle paths; there is no growth within a workout.

Chemical fat and hydrated lean tissue have stored energy densities 9400 and 1800 kcal/kg, respectively. These approximate storage densities do not estimate construction costs. Lean mass includes water and non-muscle tissues. Synthesis cost is not separately estimated; body fluids, glycogen-associated water and bone changes are omitted.

```text
fat_change_kg = (daily_balance − lean_gain_kg × lean_energy_density) / fat_energy_density
body_mass = fat_mass + lean_mass
cumulative_balance = fat_change_total × fat_density + lean_change_total × lean_density
```

Thus adding lean at neutral energy balance requires an offset in stored energy; the app never creates unlimited free muscle or limitless fat loss. Predicted expenditure changes with mass and age. A projection that leaves the supported 6–45% body-fat range is frozen and explicitly flagged; it does not continue outside its model domain.

Fitness represents additional conditioning relative to the already moderately fit baseline, not absolute fitness. Day zero marks the start of this repeating training program. Fitness relaxes toward an exercise-and-recovery target over 210 days. Resting HR tends from 65 toward 59 bpm by default. These are illustrative curve endpoints. Fitness changes HR, not the energy cost of running at a fixed speed. Long-term organ view shows a resting snapshot of a representative day, labeled persistently. Reservoir metrics switch to composition instead of pretending to display every minute of 1095 days.

## Rendering and speech

SVG uses organ highlights, red circulation, gold circular glucose particles, cyan diamond amino acid particles, square sand-colored fat particles, mint glycogen and violet insulin rings. Glucose/amino acid paths first visit liver; long-chain fat uses a separate schematic lymph path. Muscle glycogen never travels back into circulation. All colors are conventions.

The detailed day is a representative push day of the longer split rotation. Posterior muscles shown faintly on the anterior schematic are projections, not exact surface anatomy.

The simulation clock drives narration and captions. Chapter rates are capped to provide at least 18 seconds with narration, eight seconds without, when starting at a chapter boundary; direct scrubbing can of course skip ahead. Speech never controls physiological time. Pausing, scrubbing, changing phase and restarting cancel voice. Browser speech availability varies; captions always work. Reduced motion disables heartbeat, dash motion and particles, retaining static route arrows.

## Explicit limits

No disease, medications, endocrine network, clinical glucose dynamics, tissue oxygen balance, renal glucose production, detailed amino acid/nitrogen pool, dehydration, lactate shuttle or age-dependent anabolic resistance. A healthy older adult uses the same abstraction with age-adjusted resting estimates; age alone does not mean poor health. Source ranges validate plausible educational directions, not precise personal results. The anatomy is schematic and anterior-view muscle visibility is incomplete.


## Starting composition options

The Starting body selector offers illustrative underweight, fit-baseline and overweight examples. At 175 cm these initialize 55 kg / 12% body fat, 75 kg / 17%, and 88 kg / 30%. Preset weight scales with height squared to preserve approximate BMI. Custom height, weight and body-fat percentage can be entered independently. Presets outside the existing 40–160 kg support range are disabled at that height.

BMI is weight divided by height squared; it does not separate fat from lean tissue. Body fat is a distinct input. Lean mass here means all fat-free tissue, including organs, bone and water, rather than muscle alone. These distinctions follow [CDC's explanation of BMI and composition](https://www.cdc.gov/bmi/faq/index.html). The example fat percentages are design choices, not diagnostic thresholds or targets.

Changing a starting preset retains the current nutrition, activity, conditioning and heart-rate parameters. Resting energy and exercise cost change with mass/height through the existing population estimates; body-fat percentage is not an additional Mifflin–St Jeor input. Muscle glycogen capacity is now scaled by fat-free mass relative to the original 62.25 kg lean baseline, instead of total weight. The sprint active glycogen pool and reference mechanical power use the same lean-size scaling. This proxy is intentionally simplified and is not a measurement of muscle mass or running performance.

The SVG uses fat-free mass relative to height to set tissue width, and a separate soft-tissue envelope to illustrate changes in fat. Internal structures remain layered and connected. Long-term anatomy uses the current modeled fat and lean masses; the control strip always identifies the **starting** composition. Shape, regional fat distribution and hypertrophy remain artistic approximations. Higher fat does not automatically alter insulin behavior, heart rate or fitness.

The existing long-term gain rule remains a modest, bounded training response. It is not a weight-restoration, fat-loss or clinical malnutrition model. Food is not automatically retargeted when switching starting body, so the same meals can produce different estimated energy balances. Existing composition support limits still stop unsupported long-term projections.
