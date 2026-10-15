# Validation record

## Proposal review

Claude Code 2.1.289 was actually available and returned a review. Raw response: [claude-proposal-review.txt](claude-proposal-review.txt). The review is advisory, not scientific validation by a clinician. Each suggestion was independently assessed against arithmetic, source direction, and educational scope.

| Suggestion | Decision | Reason / action |
|---|---|---|
| Correct Mifflin arithmetic and reconcile MET rest references | Accept | Male baseline is 1673.75 kcal/day. Subtract the modeled RMR for exercise minutes from gross MET cost. Use Compendium 9.3 MET at ~10 km/h and an illustrative 4 MET average lifting session. |
| Constant brain demand; reconcile mental-work windows | Accept | Brain baseline stays on continuously; small focus halo only. Configured work windows total 6 h without adding a calorie surcharge. |
| Overlapping digestion, signaling and distribution | Accept | Chapters select narrative focus; all state variables run concurrently. Separate absorption speeds for carbohydrate, protein and fat. |
| Close all macronutrient ledgers | Accept with scope | Close daily carbohydrate gram balance and protein energy-equivalent turnover; derive fat as the residual energy term. This is substrate bookkeeping, not nitrogen kinetics. Long-term net tissue deposition is accounted separately. |
| Portal route for glucose/amino acids; fat via lymph; local muscle glycogen | Accept | Routing and arrow directions explicitly distinguish these pathways. |
| Insulin suppresses liver output and lipolysis; contraction-mediated uptake | Accept | Exercise caption and muscle uptake work at low insulin. Relative signals respond concurrently. |
| Clarify lean vs muscle; tissue energy; realistic gain magnitude and training week | Accept | Fat mass means chemical lipid; lean includes water and tissues. Small, localized morphological changes. Push/pull/legs rotation with a light seventh day. Energy densities are storage, not construction costs. |
| Add FFM-specific RMR / synthesis cost | Defer | Avoid mixing uncalibrated expenditure equations; document Mifflin's composition limitation. No separately estimated synthesis cost; included only approximately in expenditure uncertainty. |
| Cardiovascular adaptation affects HR, not fixed-speed run cost | Accept | Mass scales exercise energy; fitness affects HR and recovery, never discounts running calories. Sleep HR is lower. |
| Shapes plus colors; reduced motion | Accept | Glucose circles, amino acid diamonds, fat squares; signal rings. Reduced motion uses static arrows and steady organs. |
| Iterate periodic state; master clock; cancel voice on pause/scrub | Accept | Warm up repeating day until glycogen converges; timeline drives captions, never waits for speech. |
| Single provenance object / engine boundary | Accept | Typed scenario and model assumptions; long-term consumes budget and daily schedule. No repeated minute integration during long-term scrubbing. |
| Clarify no-exercise comparison | Accept | UI adjusts exercise minutes; no dedicated comparison dashboard. No-exercise regression tests verify architecture. |

## Internal proposal pass

Validated 4/4/9 total (2603 kcal), RMR (1673.75), net exercise (~350), thermic effect (243.16), training-day TDEE (~2616), and 8 h sleep. The day runs 06:00–06:00. Selected model is suitable for education, not clinical inference. Instantaneous traces have relative units. Chapters do not imply sequential biochemistry. Growth equations and HR endpoint are illustrative, not paper-derived personal predictions.

## Result review and checks

To be completed after implementation.

## Actual result-stage Claude review

Claude returned a second text-only advisory review: [claude-result-review.txt](claude-result-review.txt). It reviewed the first functional source, narration and numerical outputs. It did **not** see screenshots; no visual-agent inspection is claimed. Internal screenshot inspection covered desktop baseline, meals, exercise, year one, year three, mobile and the mobile scenario dialog. Review suggestions were independently assessed below. Some fixes were already underway by the time Claude responded.

| Suggestion | Decision | Action / reason |
|---|---|---|
| Long-term view was frozen during lifting while HR said resting | Accept | Sample a genuinely resting 07:30 snapshot. Growth overlay remains gradual; instantaneous organs are persistently labeled representative. |
| Captions contradicted no-exercise and surplus inputs | Accept | Adapt the long-term title, caption, training label and flow summaries; derive summary energy narration from actual budget. |
| Tiny default imbalance cannot support a precise fat forecast | Accept clarification; defer probabilistic band | Explicitly label the path as an accounting illustration, use approximate composition outputs, and state in the first-year caption that tiny differences are below real estimate precision. A calibrated uncertainty distribution would require evidence absent from this educational model. |
| Speech cut off in dense scenes | Accept | Master clock caps chapter rate to allow at least 18 seconds per complete day scene with narration, 8 without. Fast playback still preserves dense-scene explanations. Speech never sets clock progress. Long-term captions have ample playback duration. |
| Current fuel percentages differed from daily macro ledger | Accept | Remove resting percentages, label qualitative carbohydrate/fat emphasis, show approximate percentages only for exercise and disclose omitted small protein contributions. Add overflow carbohydrate field to the audit ledger. |
| Cap minute-by-minute oxidation and derive all fluxes from it | Defer | The minute engine describes pool transfer and availability; its oxidation ledger is daily equivalent bookkeeping, not instantaneous calorimetry. Doing this faithfully needs more transient pools and coupled substrate kinetics. Explicitly document that limitation and remove the misleading instantaneous-total-fuel claim. Do not treat a residual as proof of biochemical fidelity. |
| Ledger tests are identities, not physiological validation | Accept | Describe checks as regression/accounting invariants. Add independent overnight glycogen, complete schedule, outside-domain termination and timing checks. Scientific source review establishes plausible directions; no clinical validation is claimed. |
| Fitness begins at zero despite fit adult | Accept clarification | Fitness state represents *additional* conditioning from an already fit baseline. Mark in code and model documentation; describe day zero as the start of this repeating program. Periodic nutrient state does not imply established long-term training adaptation. |
| Detailed day showed full-body loading despite a split | Accept | Detailed day now shows a representative push session (chest, shoulders, triceps, core); run still highlights legs. The long-term engine rotates split days. Posterior muscle projections are disclosed as schematic. |
| Short run incorrectly labeled 3 km; mental work lost an hour | Accept | Compute distance from actual run minutes. Allocate work to available awake slots without losing requested duration to the concurrent recovery window. The generated schedule is cached per scenario. |
| Midnight hour interpolation crossed noon | Accept | Derive hour from the master time after interpolation rather than interpolating a circular clock value. |
| Day fat bar hard-coded | Retain with disclosure | It is an approximate reference scale for a much larger reservoir, not a capacity fraction. Intra-day fat flows are visual; long-term fat mass is energy-accounted. Documentation states that the day store is approximately held constant at this display resolution. |
| Liver glycogenolysis should dominate exercise output | Accept | Increase glycogen share of liver supply during exercise; strengthen fasting glycogen contribution. Remove the exercise-induced dip in the relative glucose target. Overnight liver drop is now checked against a broad plausible interval. |

## Final verification

- Production bundle and strict TypeScript check pass.
- 19 model/timeline regression checks pass: macro energy, corrected RMR, net exercise, macro absorption, daily bookkeeping, periodic state, bounded pools, simultaneous nutrient signals, mixed exercise fuels, preserved glycogen, six/ten-hour work allocation, eight-hour sleep, midnight clock continuity, overnight liver decline, out-of-domain stopping, narration clock-rate cap, modest diminishing gains, energy residuals, no-exercise and age-55 reuse, timeline transitions and configuration rejection.
- Chrome interaction checks pass: playback and pause, meal/insulin/exercise scrubbing, organ inspection, layers, narration toggle, one- and three-year views, science dialog, no-exercise and reset settings, mobile without horizontal overflow, reduced motion and scenario dialog.
- Narration speech is browser-dependent. The browser test checks integration and cancellation/toggling; it does not claim a human listening assessment of an installed voice.
- Numerical audit: [../artifacts/numerical-output.json](../artifacts/numerical-output.json). UI uses rounded approximate values; internal arithmetic retains precision for auditing.

## Lay-user audit

Meal view uses distinct nutrient shapes and routes; violet signal rings are separate from energy particles. Two glycogen gauges remain distinct. The run raises HR and circulation and activates leg regions, while the push session activates the corresponding upper-body regions. Only the multi-month view changes muscle width, by a few percent at most. Sleep shows continued energy use. Thinking keeps brain demand steady. Three-year curves flatten and body-fat change follows the documented energy balance. No-exercise captions change with the model rather than promising gains.

This is a functional first prototype, not an independently validated clinical model. Remaining limitations include schematic anatomy, daily rather than instantaneous substrate accounting, no nitrogen kinetics, no uncertainty distribution, and platform-dependent speech. These are documented and visible in the science dialog where relevant.

## Starting-body revision

Added underweight / fit-baseline / overweight examples and independent custom mass, height and body-fat inputs. Presets restart the current mode and preserve food, exercise and conditioning. Anatomy follows the selected starting composition and long-term fat/lean state; a compact strip distinguishes the initial lean/fat split from BMI.

Validation: production build and 38 numerical/model tests pass. The original Chrome regression suite and `npm run test:composition` pass, covering preset state, actual SVG changes, energy budgets, correct long-term initial fat/lean mass, editable height/body fat, live preview, JSON export, sprint-mode retention, reset, supported-range controls, mobile overflow and absence of page errors. Visual snapshots are in `artifacts/composition/`. Visual review caught and corrected hand coordinates being included in the thigh deformation region.

The presets' body-fat values and silhouette are illustrative. BMI and body fat remain separate; no fitness or insulin-resistance penalty is assigned from size. Mifflin resting expenditure retains its original inputs, while muscle glycogen and sprint reference power use fat-free mass as a simplified active-tissue proxy.
