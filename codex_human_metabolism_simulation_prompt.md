# Codex Project Brief — Interactive Human Metabolism, Cardiovascular, and Muscular Adaptation Simulator

## Project Title

**Human Energy Flow: A Visual Simulation of Metabolism, Cardiovascular Activity, Exercise, Recovery, and Long-Term Muscular Adaptation**

---

## 1. Objective

Build a visually compelling, scientifically responsible educational simulation for a lay audience that shows how a healthy adult human body:

1. processes meals,
2. regulates blood glucose and insulin,
3. stores and uses energy,
4. responds to exercise,
5. repairs and adapts muscle,
6. uses energy during ordinary mental work and rest,
7. and gradually changes over months and years.

The first scenario should model a **healthy, fit 35-year-old male** who eats a sufficient mixed diet, performs approximately **1 hour of exercise per day**, and spends approximately **6 hours per day reading, learning, or doing mentally demanding work**.

The simulation should first explain **one representative day in detail**, then smoothly transition into **long-term adaptation over 1 year**, followed by a faster simulation of **2 additional years**.

The emphasis must be on **visual explanation rather than text-heavy explanation**.

This is an **educational physiology model**, not a clinical simulator.

---

# 2. Main Experience

The user should feel that they are watching energy and nutrients move through a living body.

The core experience should visually answer questions such as:

- What happens immediately after a meal?
- Why does insulin rise?
- Where does glucose go?
- What is stored as glycogen?
- What happens to dietary fat?
- What happens to dietary protein?
- What fuel does exercise actually use?
- Why does stored energy decrease during exercise?
- What happens during recovery?
- Why do trained muscles slowly become larger and stronger?
- Why does a person not necessarily gain fat if calorie intake approximately matches expenditure?
- How does repeating the same healthy pattern for months change the body?

Use animation, color, motion, organ highlighting, changing reservoir levels, simplified graphs, and narration to explain these processes.

---

# 3. Scientific Standard

Accuracy is important.

The simulation should use a **simplified but physiologically defensible model**.

Do not present the model as exact human physiology.

Clearly separate:

- measured or well-established physiology,
- reasonable population-level estimates,
- and intentionally simplified educational abstractions.

Avoid misleading statements such as:

- "all food becomes glucose,"
- "all excess carbohydrate immediately becomes fat,"
- "insulin directly causes obesity,"
- "protein is the main fuel for exercise,"
- "muscle grows visibly after one workout,"
- "mental work burns enormous amounts of extra calories,"
- or "all energy stored after a meal is later completely emptied during exercise."

The system should instead communicate approximate flows and trends.

---

# 4. Default Human Model

Use the following default person unless a better scientifically justified baseline is proposed:

| Parameter | Default |
|---|---:|
| Age | 35 years |
| Sex | Male |
| Height | 175 cm |
| Body mass | 75 kg |
| Fitness | Healthy, moderately fit |
| Body-fat level | Healthy / moderately lean |
| Meals | 2–3 mixed meals per day |
| Exercise | ~60 min/day |
| Exercise example | 3 km run + resistance training |
| Mental work | ~6 h/day |
| Sleep | ~7–8 h/day |

All major physiological inputs should be implemented as parameters rather than hard-coded assumptions wherever practical.

The architecture must allow later scenarios such as:

- identical diet with **exercise removed**,
- a **55-year-old** version,
- changed body weight,
- changed exercise volume,
- changed calorie intake,
- changed protein intake,
- or calorie surplus/deficit scenarios.

---

# 5. Nutrition Assumptions

Use realistic mixed meals containing foods such as:

- steak / lean beef,
- chicken,
- fish,
- eggs,
- bread,
- rice,
- potatoes,
- vegetables,
- and optional dairy or fruit.

A reasonable starting target is:

- **Energy intake:** approximately **2,500–2,700 kcal/day**
- **Protein:** approximately **120–140 g/day**
- **Carbohydrate:** approximately **250–320 g/day**
- **Fat:** approximately **70–90 g/day**

These values should not be treated as universal prescriptions.

They are parameters for the simulation.

For a 75 kg active adult, use approximately **1.6 g protein/kg/day** as the default protein target:

> 75 kg × 1.6 g/kg ≈ 120 g protein/day

Explain that adequate protein supports:

- normal protein turnover,
- tissue maintenance,
- exercise recovery,
- and muscle adaptation.

Do not depict the entire protein intake as being converted into new muscle.

---

# 6. Daily Energy Model

Use a realistic approximate daily energy budget.

A reasonable initial model may be:

### Resting energy expenditure

Approximately:

**1,650–1,800 kcal/day**

Use a documented equation such as Mifflin–St Jeor, or another defensible estimate.

### Non-exercise activity and normal daily movement

Approximately:

**350–600 kcal/day**

This includes:

- standing,
- walking,
- household movement,
- ordinary activity,
- and spontaneous movement.

### Exercise

Approximately:

**350–550 kcal/day**

depending on exercise intensity and implementation assumptions.

The 3 km run itself should not be assumed to consume the entire exercise budget; resistance training also contributes.

### Thermic effect of food

Represent separately or include it clearly in total daily expenditure.

### Total daily energy expenditure

Target approximately:

**2,450–2,750 kcal/day**

for the default scenario.

### Default balance

Use a scenario near energy balance, for example:

- intake: **~2,600 kcal**
- expenditure: **~2,580–2,650 kcal**

Do not make the simulation depend on exact equality.

Allow normal day-to-day variation.

---

# 7. Important Metabolic Representation

The model should distinguish at least these energy/nutrient pools:

## Circulating glucose

Represents glucose currently available in blood.

Visual representation:
- glowing particles or flowing color inside major vessels.

## Liver glycogen

Represents short-term carbohydrate storage in the liver.

Visual representation:
- a reservoir or fill level inside the liver.

## Muscle glycogen

Represents glycogen stored locally in skeletal muscle.

Visual representation:
- subtle storage intensity inside muscles.

## Adipose energy stores

Represents triglyceride energy stored in fat cells.

Visual representation:
- a slow-changing long-term energy reservoir.

## Circulating fatty acids

Optional simplified pool for fat being mobilized and used.

## Amino acid / protein availability

Represents amino acids derived from dietary protein.

Use these primarily for:

- protein turnover,
- repair,
- synthesis,
- enzymes and other tissues,
- and muscle adaptation.

Avoid treating amino acids as a major normal exercise fuel.

---

# 8. Hormonal Simplification

At minimum represent:

## Insulin

After a mixed meal:

- blood glucose rises,
- amino acids rise,
- insulin rises,
- tissues increase nutrient uptake,
- liver and muscle increase glycogen storage,
- fat storage is favored during the post-meal state,
- endogenous glucose production is suppressed.

Represent insulin visually as a **signal**, not as an energy substance.

A possible visualization:

- insulin signal = blue/violet glow,
- glucose = orange/gold,
- glycogen = green reservoir,
- active blood flow = vivid red movement.

Insulin should rise after meals and gradually fall toward baseline.

Do not imply that insulin is simply an "energy storage hormone" with only one function.

---

# 9. One-Day Simulation

The detailed day is the educational centerpiece.

Use a timeline with smooth transitions.

---

## Scene 1 — Baseline / Morning

Show the resting body before food.

Illustrate:

- heart beating at resting rate,
- normal blood flow,
- stable glucose,
- low-to-moderate insulin,
- liver glycogen reservoir,
- muscle glycogen stores,
- fat stores,
- resting energy consumption.

Narration should establish that the body is already consuming energy continuously even while resting.

---

## Scene 2 — Meal

Show a realistic meal.

Example:

- eggs + bread,
- chicken + rice,
- steak + potato,
- fish + rice.

The exact meals can rotate across the day.

Show approximate:

- calories,
- protein,
- carbohydrate,
- fat.

Avoid excessive numerical clutter.

Use one compact nutritional display.

---

## Scene 3 — Digestion and Absorption

Animate nutrients moving from:

**digestive system → bloodstream**

Show:

- glucose entering circulation,
- amino acids entering circulation,
- dietary fat entering circulation through a simplified representation.

Keep anatomy simplified enough for a layperson.

---

## Scene 4 — Insulin Response

As glucose and amino acids enter the blood:

- increase insulin visualization,
- pulse or brighten pancreatic signaling,
- show insulin distributing through circulation.

Narration example:

> "After the meal, glucose and amino acids enter the bloodstream. The pancreas responds by releasing insulin. Insulin helps coordinate how tissues use and store the incoming nutrients."

---

## Scene 5 — Nutrient Distribution

Visually show multiple destinations simultaneously.

### Liver

Show:

- glucose uptake,
- glycogen replenishment,
- suppression of liver glucose output.

### Skeletal muscle

Show:

- glucose uptake,
- glycogen replenishment,
- amino acid availability.

### Other tissues

Show immediate energy use.

### Adipose tissue

Show a modest amount of energy storage as appropriate.

Do not portray all incoming carbohydrate as immediately becoming fat.

---

## Scene 6 — Return Toward Baseline

Over the following hours:

- blood glucose returns toward baseline,
- insulin falls,
- circulating nutrients decline,
- stored glycogen remains available.

Use visual fading or shrinking signal intensity.

---

# 10. Exercise Sequence

The person performs approximately:

- **3 km running**
- followed by **resistance training / gym**

Total exercise time: approximately 1 hour.

The animation should become physiologically dynamic.

---

## Cardiovascular response

Show:

- increased heart rate,
- greater blood flow,
- more blood directed toward active skeletal muscle,
- increased oxygen delivery,
- increased carbon-dioxide removal.

Use animated blood-flow intensity.

The heart should visibly work harder, but avoid cartoonish exaggeration.

---

## Energy use during exercise

Show simultaneous contribution from:

- muscle glycogen,
- circulating glucose,
- fatty acids / fat stores.

Fuel mixture should depend loosely on exercise intensity.

Running and hard resistance sets should use substantial carbohydrate.

Lower-intensity periods should show relatively greater fat contribution.

Do not show complete depletion of glycogen during an ordinary 1-hour mixed workout.

---

## Muscle activation

Highlight muscles that are currently being used.

For running, emphasize:

- quadriceps,
- hamstrings,
- gluteals,
- calves,
- hip musculature,
- core.

For resistance training, select a representative routine and highlight:

- chest,
- back,
- shoulders,
- arms,
- legs,
- core.

Do not show every muscle growing equally.

---

# 11. Mental Work / Reading

After exercise and meals, show the person spending several hours:

- reading,
- learning,
- coding,
- or doing concentrated mental work.

Highlight the brain subtly.

Explain that:

- the brain has continuous metabolic demand,
- glucose is an important brain fuel under normal fed conditions,
- but concentrated thinking does not normally increase whole-body calorie expenditure nearly as much as exercise.

The visual effect should be steady and subtle.

---

# 12. Recovery

Shift from performance to repair.

Show:

- heart rate returning toward baseline,
- circulation normalizing,
- glycogen beginning to replenish from later meals,
- protein synthesis / tissue repair,
- muscle recovery.

Use a "repair" visual metaphor such as:

- fibers being restored,
- structural threads being reinforced,
- muscle regions gently brightening.

Avoid implying that muscle fibers are literally torn apart and reconstructed in a simplistic mechanical way.

---

# 13. Muscle Growth Representation

Muscle growth should be gradual.

The model should conceptually include:

- resistance-training stimulus,
- protein availability,
- recovery,
- training history,
- diminishing returns,
- and energy availability.

A simplified adaptation variable may be used.

For example:

```text
daily_adaptation =
training_stimulus
× recovery_factor
× protein_adequacy
× energy_adequacy
× diminishing_returns
```

This is not intended as a biological equation.

It is an educational simulation rule.

The implementation should clearly label such rules internally as simplified abstractions.

---

# 14. Protein Handling

Do not use language such as:

> "the unused protein is simply excreted."

That is biologically misleading.

Instead, model protein conceptually as follows:

Dietary protein → amino acids.

Amino acids can contribute to:

- tissue protein synthesis,
- enzymes,
- hormones and other molecules,
- normal protein turnover,
- energy metabolism when required.

Nitrogen from amino acids that are broken down is converted largely to urea and excreted.

The carbon skeletons may be oxidized or enter other metabolic pathways.

For the layman-facing narration, simplify this to:

> "Protein supplies amino acids for constant tissue maintenance and, after training, supports muscle repair and adaptation. Amino acids that are not incorporated into proteins can be broken down and used through other metabolic pathways."

---

# 15. End-of-Day Dashboard

At the end of the representative day, display a clean summary.

For example:

```text
Energy eaten            ~2600 kcal
Energy expended          ~2600 kcal
Protein eaten            ~125 g
Protein target           ~120 g
Exercise completed       60 min
Energy balance           approximately neutral
Training stimulus        positive
Recovery status          adequate
```

Do not state that "120 g protein was required for today's muscle growth."

Protein recommendations operate across overall diet and adaptation, not as an exact daily construction requirement.

A better label is:

> "Daily protein target for an active 75 kg adult"

---

# 16. Transition to Long-Term Simulation

After completing the one-day sequence:

Zoom out.

Show:

- days repeating,
- meals repeating,
- workouts repeating,
- recovery cycles repeating,
- calendar days advancing.

Accelerate simulation time.

Transition smoothly from:

**hours → days → weeks → months**

The viewer should understand that the visible long-term changes emerge from repetition of small daily effects.

---

# 17. One-Year Adaptation

Simulate approximately one year of consistent healthy behavior.

The outcome should be plausible, modest, and visually believable.

Potential changes:

- slightly increased muscle mass,
- improved muscular definition,
- better exercise capacity,
- stable or slightly reduced fat mass,
- approximately stable body weight or modest increase due to lean mass,
- improved cardiovascular fitness.

Avoid dramatic transformation unless the initial condition and training plan justify it.

The person begins already fit, so gains should be slower than for an untrained beginner.

---

# 18. Cardiovascular Adaptation Over the Year

Illustrate qualitative training adaptation.

Possible effects to model:

- lower resting heart rate,
- improved stroke volume,
- improved exercise efficiency,
- greater capacity for oxygen delivery,
- improved recovery after exercise.

Do not claim precise values unless the model uses sourced ranges.

A visual example:

Month 0:
- resting HR ~65 bpm

Month 12:
- resting HR ~58–62 bpm

Only use such values if they remain parameterized and are described as illustrative.

---

# 19. Muscle Adaptation Over the Year

Display slow changes primarily in trained muscles.

For example:

- quadriceps slightly larger,
- gluteals slightly larger,
- upper back slightly thicker,
- shoulders somewhat more defined,
- arms modestly larger,
- chest modestly more developed.

Show growth continuously rather than suddenly.

Include diminishing returns.

---

# 20. Body-Fat Representation

Because energy intake and expenditure are approximately matched:

- body fat should remain broadly stable,
- or decrease slightly if the model intentionally allocates a modest recomposition effect.

Do not make the person continuously lose fat for three years while remaining at exact energy balance.

If body composition changes, maintain approximate mass-energy consistency.

---

# 21. Years 2 and 3

After the detailed first year:

fast-forward through **two additional years**.

The adaptation rate should slow.

The result should not look like unlimited linear muscle growth.

Show:

- continued fitness,
- smaller incremental muscle gains,
- stable healthy body composition,
- well-conditioned cardiovascular system.

Implement a plateau / diminishing-return mechanism.

---

# 22. Visualization Design

The project should communicate mainly through visuals.

Preferred methods:

- semi-transparent anatomical body,
- visible cardiovascular network,
- simplified organs,
- muscular overlay,
- animated nutrient particles,
- organ glow,
- storage gauges,
- heat maps,
- moving particles,
- timeline,
- changing heart rate,
- short floating labels,
- smooth camera transitions.

Avoid large blocks of explanatory text during the animation.

---

# 23. Suggested Color Language

Use a consistent visual grammar.

Example:

| Process | Suggested visual |
|---|---|
| Blood | red |
| Oxygenated flow emphasis | bright red |
| Glucose | gold/orange |
| Insulin signaling | blue/violet |
| Glycogen | green |
| Stored fat | pale yellow |
| Active muscle | orange/red |
| Muscle recovery | cyan/white |
| Brain activity | soft yellow |
| Metabolic energy consumption | fading glow |

These are visual conventions only.

They do not need to correspond to literal biochemical colors.

---

# 24. Narration

Include voice narration.

Voice characteristics:

- calm,
- clear,
- intelligent,
- friendly,
- documentary-like,
- not overly dramatic.

Narration should support what is visually happening.

Avoid reading long paragraphs.

Prefer short explanatory statements synchronized to animation.

Example:

> "The meal raises the supply of nutrients in the blood."

> "Insulin now helps coordinate nutrient uptake and storage."

> "Some glucose replenishes glycogen in the liver and muscle."

> "During exercise, those stored fuels become available again."

> "Training creates a signal for adaptation. Recovery and adequate protein allow muscle protein to be rebuilt."

---

# 25. Architecture

Separate the project into distinct layers.

## A. Physiology model

Responsible for:

- energy intake,
- macronutrients,
- glucose dynamics,
- insulin response,
- glycogen,
- fat stores,
- exercise expenditure,
- protein adequacy,
- recovery,
- muscle adaptation,
- cardiovascular adaptation.

## B. Timeline engine

Responsible for:

- meals,
- post-meal windows,
- exercise,
- work,
- rest,
- sleep,
- day progression,
- month/year acceleration.

## C. Visualization layer

Responsible for:

- body rendering,
- organ state,
- cardiovascular animation,
- muscle activation,
- energy reservoirs,
- particle flow,
- charts,
- labels.

## D. Narration engine

Responsible for:

- scene-specific narration,
- synchronization,
- optional generated or recorded voice.

## E. Scenario configuration

Allow parameters such as:

```text
age
sex
height
weight
body_fat
daily_calories
protein
carbohydrate
fat
meal_times
exercise_duration
exercise_type
training_intensity
mental_work_hours
sleep_hours
```

Later scenarios must reuse the same engine.

---

# 26. Model State

Consider maintaining a state object such as:

```text
HumanState
    body_mass
    fat_mass
    lean_mass
    resting_energy_expenditure

    blood_glucose_state
    insulin_state

    liver_glycogen
    muscle_glycogen
    fat_energy_store

    amino_acid_availability

    heart_rate
    cardiovascular_fitness

    fatigue
    recovery

    muscle_groups
        quadriceps
        hamstrings
        gluteals
        calves
        chest
        back
        shoulders
        biceps
        triceps
        core

    daily_energy_intake
    daily_energy_expenditure
```

The exact implementation is flexible.

---

# 27. Separate Physiological Time Scales

Do not use one uniform simulation rule for everything.

Different processes operate on different time scales.

### Minutes to hours

- glucose,
- insulin,
- digestion,
- nutrient absorption,
- heart rate,
- exercise fuel use.

### Hours to days

- glycogen recovery,
- muscle protein synthesis,
- fatigue,
- recovery.

### Weeks to months

- muscle hypertrophy,
- cardiovascular adaptation,
- fat change,
- body composition.

### Months to years

- diminishing adaptation,
- long-term conditioning,
- stable body-composition trends.

This distinction should appear in the code architecture.

---

# 28. Scientific Validation

Before implementing the final experience, verify important numerical assumptions using reputable sources.

Prefer:

- peer-reviewed review articles,
- ACSM,
- ISSN,
- NIH,
- recognized physiology textbooks,
- major academic medical sources.

Document sources used for:

- resting metabolic rate,
- protein target,
- glycogen capacity,
- exercise energy expenditure,
- brain energy use,
- insulin response,
- muscle growth expectations,
- cardiovascular training adaptations.

Do not overfit the simulation to any one paper.

Use realistic ranges.

---

# 29. Claude Review — Proposal Stage

Before implementation:

1. Produce a first technical and visual proposal.
2. Send the proposal to a Claude agent if a Claude tool/agent is available in the environment.
3. Ask Claude specifically to evaluate:

   - physiological accuracy,
   - misleading simplifications,
   - energy accounting,
   - nutrient-flow representation,
   - insulin representation,
   - muscle-growth assumptions,
   - cardiovascular adaptation,
   - visualization clarity,
   - usability for a lay audience,
   - software architecture.

4. Record Claude's suggestions.

Then independently assess every suggestion.

Create a brief table:

| Suggestion | Accept / Reject | Reason |
|---|---|---|

Do **not** implement a suggestion merely because Claude proposed it.

Only adopt suggestions that improve:

- accuracy,
- clarity,
- maintainability,
- or educational value.

If Claude is unavailable, do not fabricate a Claude review. State that external-agent review was unavailable and perform a clearly labeled internal validation pass instead.

---

# 30. Implementation Stage

After proposal validation:

Build a working prototype.

Prioritize:

1. correct state transitions,
2. strong visual communication,
3. smooth timeline,
4. physiological plausibility,
5. modular scenario architecture.

Do not spend excessive time on decorative polish before the simulation logic works.

---

# 31. Claude Review — Result Stage

After a functional first version exists:

Ask Claude, if available, to review:

- screenshots,
- animation behavior,
- narration,
- numerical outputs,
- code architecture,
- physiological assumptions,
- whether visuals create any false biological interpretation.

Again produce:

| Suggestion | Accept / Reject | Reason |
|---|---|---|

Implement the accepted changes.

Do not fabricate review results if Claude is unavailable.

---

# 32. Final Deliverables

Produce:

## A. Working simulation

The main interactive/animated experience.

## B. README

Explain:

- how to run the project,
- controls,
- model assumptions,
- limitations,
- dependencies.

## C. Model documentation

Document:

- equations,
- parameter values,
- references,
- simplifying assumptions.

## D. Scenario file

Provide an easily editable default configuration.

## E. Validation notes

Include:

- initial proposal,
- Claude review if available,
- accepted/rejected feedback,
- final review,
- final changes.

---

# 33. Initial Default Scenario

Use approximately:

```yaml
person:
  age: 35
  sex: male
  height_cm: 175
  weight_kg: 75
  fitness: moderately_fit

nutrition:
  calories_kcal: 2600
  protein_g: 125
  carbohydrate_g: 300
  fat_g: 80

daily_activity:
  mental_work_hours: 6
  exercise_minutes: 60
  run_distance_km: 3
  resistance_training: true
  sleep_hours: 8
```

Before locking these values, check their internal consistency.

For example:

- 125 g protein = 500 kcal
- 300 g carbohydrate = 1200 kcal
- 80 g fat = 720 kcal

Total:

**2420 kcal**

Therefore, if the target is **2600 kcal**, either:

- increase one or more macronutrients,
- include additional dietary components,
- or choose a different macro breakdown.

Ensure the displayed calorie total always matches the macronutrient model closely enough to avoid obvious accounting errors.

A possible internally consistent example is:

- protein: 130 g → 520 kcal
- carbohydrate: 325 g → 1300 kcal
- fat: 87 g → 783 kcal

Total ≈ **2603 kcal**

Use rounded values for the UI.

---

# 34. Key Educational Messages

The final simulation should naturally teach the following ideas:

### Meal

Food supplies:

- carbohydrate,
- protein,
- fat,
- micronutrients.

### Carbohydrate

Carbohydrate can become blood glucose.

Glucose can:

- be used immediately,
- replenish liver glycogen,
- replenish muscle glycogen,
- or contribute indirectly to longer-term energy storage.

### Fat

Dietary fat can:

- be used for energy,
- contribute to membranes and signaling molecules,
- or be stored efficiently in adipose tissue.

### Protein

Protein becomes amino acids used throughout the body.

Resistance training creates a stronger signal for muscle adaptation.

### Insulin

Insulin helps coordinate the fed state and nutrient handling.

It is not itself "stored energy."

### Exercise

Exercise draws from several fuel sources.

It does not simply "burn off the last meal."

### Recovery

Adaptation happens through repeated training + nutrition + recovery.

### Long-term body composition

Body-fat change depends strongly on long-term energy balance.

Muscle growth depends strongly on resistance-training stimulus, protein, recovery, training status, and sufficient energy availability.

---

# 35. Future Scenario: No Exercise

The architecture must support removing exercise while keeping food intake unchanged.

This later simulation should make it possible to show:

- lower daily energy expenditure,
- less muscle-training stimulus,
- reduced glycogen turnover,
- gradual positive energy balance if intake is unchanged,
- gradual fat accumulation,
- little or no exercise-driven muscle gain,
- different cardiovascular adaptation.

Do not implement this comparison unless useful for architecture testing, but design for it now.

---

# 36. Future Scenario: Age 55

The same architecture should later support a 55-year-old healthy adult.

Age-related parameters may eventually include:

- resting metabolism,
- lean mass,
- anabolic responsiveness,
- recovery,
- cardiovascular capacity,
- training adaptation,
- maximum heart-rate range.

Do not encode simplistic assumptions such as "older = unhealthy."

The age comparison should eventually show differences in physiology while allowing a healthy 55-year-old to remain highly fit.

---

# 37. UX Goal

The final result should feel closer to:

> an interactive scientific documentary inside the human body

than:

> a spreadsheet with a human avatar.

The simulation should make invisible physiological processes visually intuitive.

Whenever possible:

**show first, narrate second, label third.**

---

# 38. Acceptance Criteria

The project is successful when:

- [ ] A non-expert can understand what happens after a meal.
- [ ] Insulin is portrayed as a signal, not as energy.
- [ ] Liver glycogen and muscle glycogen are shown separately.
- [ ] Exercise uses a mixture of carbohydrate and fat.
- [ ] Protein is primarily associated with turnover, repair, and adaptation.
- [ ] Daily calorie accounting is internally consistent.
- [ ] Protein intake is realistic for the modeled individual.
- [ ] Mental work is represented without exaggerated calorie burn.
- [ ] Cardiovascular response during exercise is visually clear.
- [ ] Muscle activation is localized to relevant muscle groups.
- [ ] Muscle growth over months is gradual.
- [ ] Three-year growth includes diminishing returns.
- [ ] Body-fat changes respect long-term energy balance.
- [ ] Visual communication dominates over text.
- [ ] The architecture supports later "no exercise" and "age 55" scenarios.
- [ ] Scientific assumptions and simplifications are documented.
- [ ] Claude review is used only if actually available.
- [ ] Claude feedback is independently evaluated rather than blindly accepted.

---

# 39. Development Workflow

Follow this order:

### Phase 1 — Research and parameter validation

Validate numerical assumptions and define realistic ranges.

### Phase 2 — Architecture

Design the simulation state model, timeline engine, rendering system, and scenario configuration.

### Phase 3 — Storyboard

Create the complete one-day visual sequence before heavy implementation.

### Phase 4 — Proposal review

Run Claude review if available.

Accept/reject feedback explicitly.

### Phase 5 — Core simulation

Implement:

- meal,
- absorption,
- insulin,
- glycogen,
- exercise,
- cardiovascular response,
- recovery.

### Phase 6 — Long-term adaptation

Implement:

- daily iteration,
- hypertrophy,
- cardiovascular adaptation,
- fat-mass change,
- diminishing returns.

### Phase 7 — Narration and polish

Add:

- voice,
- labels,
- transitions,
- camera movement,
- visual refinement.

### Phase 8 — Final review

Use Claude if available.

Assess feedback independently.

### Phase 9 — Final validation

Verify:

- energy conservation / bookkeeping,
- plausible parameter ranges,
- no misleading narration,
- no visually misleading physiology.

---

# 40. Final Instruction to Codex

Work autonomously through the project.

Make reasonable implementation decisions where requirements are underspecified.

Do not stop for minor questions.

Prefer a scientifically defensible approximation over a false appearance of precision.

When a biological process is too complex to simulate faithfully, use a clearly documented abstraction.

The primary goals, in order, are:

1. **scientific credibility**
2. **visual clarity**
3. **educational value**
4. **modular architecture**
5. **a polished and engaging experience**

Before finalizing, inspect the complete simulation as a lay user and ask:

> "Would someone watching this come away with a more accurate mental model of how food, insulin, stored energy, exercise, recovery, and muscle adaptation interact?"

If the answer is not clearly yes, revise it.
