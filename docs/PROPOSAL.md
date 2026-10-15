# Technical and visual proposal

Build a local Vite + TypeScript web application with a semi-transparent, stylized SVG anatomical figure. Nutrients follow animated paths; blood flow and heart pulse respond to activity. Organs and localized muscle groups respond to the current scene. This is an educational schematic, not anatomical imaging.

## Numerical baseline

Healthy moderately fit male, 35 years, 175 cm, 75 kg, initial body fat 17% (scenario assumption). Protein 130 g, carbohydrate 325 g, fat 87 g: 2603 kcal using 4/4/9. Mifflin–St Jeor rounded equation gives 1668.75 kcal/day resting expenditure. Ordinary movement: 350 kcal/day above rest. Thermic effect: 25% of protein energy, 7.5% of carbohydrate energy, 2% of fat energy = 243.16 kcal/day. Run: 18 min at 10 km/h, illustrative 10 MET. Resistance session: 42 min, session-average 3.8 MET. Net exercise: (MET−1) × kg × hours = 349.5 kcal. Daily expenditure ≈2611 kcal, balance ≈−8 kcal (well within estimation uncertainty). Meals distribute the macros in fractions 0.28, 0.36, 0.36 at 08:00, 13:00, 19:00.

## Separate time scales and accounting

- Minute-step day engine: gamma-like absorption curves, bounded dimensionless glucose/insulin response, liver and muscle glycogen in grams, activity, fatigue, recovery and heart-rate response. Glucose/insulin are explicitly relative illustrative signals, not clinical concentrations. Normalize each absorption curve so daily absorbed totals equal meal inputs, including overnight carryover from a repeating day.
- Glycogen transfers: absorbed carbohydrates split into oxidation and storage; bounded liver/muscle reservoirs; liver output supports circulating glucose; muscle glycogen is consumed locally. Track all carbohydrate destinations, overflow oxidation, and endogenous glucose supply as simplified bookkeeping. Fat and amino acid signals have distinct visual paths. Dietary fat enters circulation through a visibly labeled simplified lymph route. Amino acids support systemic turnover; protein is not an exercise fuel in this teaching example.
- Long-term daily integration: dynamic expenditure updates with body mass and age. Bounded training-driven lean gain, protein/sleep/energy adequacy, different muscle group responses, and cardiovascular conditioning with diminishing returns. Account for lean tissue energy deposition (illustrative 1800 kcal/kg) and remaining energy balance in fat stores (9400 kcal/kg). Never invent endless fat loss at neutral balance. These coefficients and gain ceiling are model assumptions, not individual predictions. Track cumulative energy residuals. Slow growth occurs only in the long-term engine, never within a day.

## Storyboard

06–08: baseline; 08–08:20: breakfast; 08:20–09: absorption; 09–10: insulin signaling; 10–12: nutrient distribution and mental work; 12–13: return toward baseline; 13–14: lunch; 14–16: steady brain demand / mental work; 16–16:18: run; 16:18–17: rotating resistance routine; 17–19: recovery; 19–20: dinner and replenishment; 20–22: repair and day summary; 22–06: sleep (8 h). Mental work totals 6 h across 10–12 and 12–13 and 14–16 and 20–21. Start at 06:00 and finish at the following 06:00.

Day playback transitions to one year, then accelerates through years two and three. Slider and chapter buttons allow direct exploration. Narration uses browser speech synthesis with short synchronized captions; explicit toggle and graceful text fallback. Playback speed, restart, pause, layer controls, organ inspection, adjustable scenario parameters, and a model/source dialog make assumptions discoverable. No exercise comparison is included only for architecture/testing; age and diet scenarios reuse the model.

## Visual direction

Dark scientific documentary aesthetic: deep ink background, warm paper typography, cyan coordinates, spacious body-centered composition. Gold glucose, mint glycogen, purple insulin signals, yellow dietary fat, cyan amino acids/recovery, red blood. Compact reservoir panel, activity strip, glucose/insulin trace and daily energy budget. Long-term chart and visible modest localized muscle changes. In the long-term view, instantaneous organ signals remain an illustrative representative day and are labeled accordingly.

## Validation

Node tests for macro totals, daily absorbed mass, bounded pools, carbohydrate ledger, net exercise, exercise fuel mixtures, energy balance, continuity, no-exercise adaptation, age reuse, long-term plateau and energy residual. Browser tests for playback, scrubbing, layer filters, narration toggle, scenario edits, responsive layout, errors, day-to-year transitions. Screenshots plus internal lay-user audit. Claude proposal and result reviews attempted through the installed CLI; availability is not presumed from installation alone.

## Sources selected during research

- Mifflin et al. 1990: https://pubmed.ncbi.nlm.nih.gov/2305711/
- ISSN protein position stand 2017: https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/
- Murray & Rosenbloom 2018, glycogen: https://pmc.ncbi.nlm.nih.gov/articles/PMC6019055/
- Hargreaves & Spriet / glycogen regulation review: https://pmc.ncbi.nlm.nih.gov/articles/PMC5872716/
- Westerterp 2004, thermogenesis: https://pmc.ncbi.nlm.nih.gov/articles/PMC524030/
- Raichle & Gusnard 2002, brain budget: https://pmc.ncbi.nlm.nih.gov/articles/PMC124895/
- 2024 Compendium: https://pacompendium.com/conditioning-exercise/ and https://pacompendium.com/running/
- NIDDK dynamic energy-balance model (context, not replicated): https://www.niddk.nih.gov/bwp
