# Revision 2 proposal: anatomy, visual hierarchy, repeated sprints

User asks for more believable fit adult anatomy, fewer words, cleaner context-sensitive right-side bars, a separate intense-exercise day, and an actual Claude collaboration on UI/physiology before implementation.

## Proposed presentation

Preserve local Vite/TypeScript application and normal day / long-term modes. Add explicit “Intense exercise day” mode. One large semi-transparent anterior anatomical illustration remains the visual centerpiece. Redraw silhouette, articulated hands/feet, pectorals/deltoids/fusiform limb muscles; anatomical heart with great vessels, asymmetric lobed lungs with bronchi, wedge-shaped right liver, J stomach, kidneys, colon framing small bowel; systemic arteries branch and paired veins return toward heart; pulmonary loop is distinct. Posterior muscles will not masquerade as anterior anatomy. Use native layered SVG so structures remain interactive and recolorable. No decorative cards or stock artwork.

Left: scene name, max 3–4 brief keyword statements, one compact meal macro line or sprint rep/countdown; explanatory prose moves into an optional “Why?” disclosure and voice captions. Existing inspection remains opt-in. Right: fixed row order with bold metric value and thicker track, emphasis changes via border/color/contrast. Normal mode shows glucose, insulin, separate glycogens, fat-use emphasis, HR/circulation and recovery. Sprint mode: ATP availability (near stable), PCr, active-muscle glycogen, fatigue/stress, available sprint power, oxygen support; one stacked bar for PCr/glycolytic/aerobic ATP resynthesis. Put HR next to oxygen to avoid nine competing cards. Values are approximate normalized indices where no clinical model exists.

Sprint narrative: retained ATP does not mean high power can be sustained. Capacity falls while fuel remains. Stress is a composite fatigue index, not lactate concentration or a claim lactate is poison. PCr resynthesis is oxygen-dependent, not powered by walking itself. Aerobic support persists into recovery. No illustration of ATP “emptying”.

Single bottom session strip: 20 two-tone sprint/recovery blocks, current rep and countdown, clickable reps. During the session the clock slows to seconds (default real-time sprint, faster but visible recovery). Full-day overview stays accessible so breakfast / warm-up / intervals / post-session recovery / meals / sleep remain a single day. Selecting intense mode offers a clear “Go to intervals” action. No automatic transition from this day into years of daily maximal sprinting.

## Proposed model

Parameter file: 20 × (6 seconds maximal intent + 30 seconds walking), 8-minute warm-up and 5-minute cooldown, beginning around 16:00. Source protocols support studying 6-second repeats with short recovery, but 20 repetitions and exact coefficients are explicitly illustrative, not a training prescription or validated personal forecast.

Separate deterministic subsecond engine (0.1–0.25 s step): PCr depletes rapidly with power demand, restores exponentially during recovery; recovery rate depends on oxygen support and accumulated fatigue. ATP availability is a protected bounded state (roughly 92–100% in this teaching example), dynamically regenerated. Stress rises in work and decays slowly between reps. A slower fatigue state accumulates across reps. Local glycogen declines gradually with glycolytic and aerobic-carbohydrate work; stores stay substantially available. Available power depends jointly on PCr availability, fatigue/stress and local glycogen sufficiency. Actual effort is maximal intent but delivered output falls. Aerobic share rises over successive repeats while absolute glycolytic rate can fall. HR has response lag and stays elevated during recovery. All three ATP-resynthesis pathways contribute together; PCr buffering is finite, not free energy.

Full-day integration replaces the normal workout, not adds a second one. Net exercise energy comes from one sprint-session cost model including warm-up/walk/cooldown and recovery cost, so displayed expenditure is not inherited from the 60-min run/lift day. Instantaneous ATP fractions are illustrative flux shares, separate from food calorie accounting. Outside session, PCr/ATP recover quickly while fatigue recedes over longer hours; glycogen refills with later intake. No new clinical mmol/L claims.

## Evidence inspected

- Girard et al. 2011 repeated-sprint fatigue review: https://pubmed.ncbi.nlm.nih.gov/21780851/
- Bogdanis 2012 fatigue review, including Gaitanos 10×6 s / 30 s recovery: https://pmc.ncbi.nlm.nih.gov/articles/PMC3355468/
- PCr recovery after single/repeated short sprints: https://pubmed.ncbi.nlm.nih.gov/9241025/
- Recovery / PCr / persistent fatigue: https://pubmed.ncbi.nlm.nih.gov/23284836/
- Energy system interaction: https://pmc.ncbi.nlm.nih.gov/articles/PMC3005844/

## Proposed checks

Stable ATP; bounded PCr; PCr trough and partial refill within a rep; smaller later-rep recovered PCr; fatigue accumulation; lower late power with glycogen remaining; aerobic share increasing in later sprints; HR lags and remains elevated in walk; long recovery improves available power without claiming instantaneous glycogen replenishment. Energy budget replaces normal exercise. Deterministic rewind. Browser checks mode switching, interval boundary timing, slow session playback, automatic context emphasis, disclosures, mobile, reduced-motion, no console errors.

Please critique and refine this proposal. Focus on scientific pitfalls, cognitive load, redundant metrics, anatomical coherence, exact UI emphasis, and the simplest effective visualization. Give at most 10 actionable suggestions. Do not edit files. We will assess suggestions before implementation. Distinguish facts from model choices. Do not assert that you saw screenshots.
