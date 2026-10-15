# One coffee inside a day

The coffee experiment belongs to the regular daily view, including a representative day at a later modeled body. It is not repeated through the seven-day diet or the long-term model. The Healthy menu and food-composition records are unchanged. The sprint day does not include this experiment. There is no residual caffeine at 06:00 and no tea/cola/chocolate contribution; the interface states this scope explicitly.

## Input and exposure

Default: one black filter coffee at 09:30, approximately 90 mg caffeine. The 45/90/180 mg choices represent approximate half/ordinary/large cups, not measured brands or dose recommendations. [EFSA lists about 90 mg for 200 mL filter coffee](https://www.efsa.europa.eu/en/topics/topic/caffeine) and notes substantial variation in beverage content. Plain coffee's small food-energy contribution is omitted in this caffeine-only experiment; no sugar, meal or invented energy is added to the existing accounting.

For elapsed hours t, dose D, absorption ka = 4/hour, and elimination ke = ln(2)/5 hours:

- Gut amount = D exp(-ka t).
- Body amount = D ka/(ka-ke) [exp(-ke t) - exp(-ka t)].
- Cleared amount = D - gut - body.

Before drinking, all three amounts are zero. The oral dose is approximated as a single input at the start of a ten-minute drinking scene. Absorption is complete in the model (F = 1), and the peak is about 52 minutes after the input. This is an analytic one-compartment approximation, not a measured concentration; units are mg in the body, not mg/L in blood. Active metabolites such as paraxanthine are omitted.

[White et al., 2016, a primary pharmacokinetic study](https://pubmed.ncbi.nlm.nih.gov/27100333/) supports rapid absorption and examines variation with beverage and consumption conditions. ka = 4/hour is a teaching choice in that broad time window, not a fitted rate for this individual. The five-hour elimination assumption is within published adult examples. [EFSA's explanation](https://www.efsa.europa.eu/sites/default/files/corporate_publications/files/efsaexplainscaffeine150527.pdf) describes effects beginning around 15–30 minutes, an average adult half-life near four hours, and variation roughly two to eight hours. The plot envelope uses two- and eight-hour elimination scenarios. It is a sensitivity band, not a confidence interval or the full range of human variation.

Changing cup size scales exposure; changing its time shifts exposure and the amount present at scheduled bedtime. The peak, half-peak time and bedtime amount come from the current trajectory. Half-life is not the duration of perceived effects. Habit, medicines, pregnancy, liver function and other influences are not inferred from age or sex.

## Mechanism and behavior illustration

[Caffeine receptor occupancy measured with PET](https://pubmed.ncbi.nlm.nih.gov/22966134/) provides human evidence for cerebral adenosine-receptor antagonism. Our app does not calculate a receptor occupancy percentage from that study. The brain outline and hexagonal route signals illustrate exposure, not measured neuronal activity.

The second plot deliberately uses **illustrative indices**:

- Sleep pressure rises exponentially toward one during waking (18-hour teaching constant) and decays during scheduled sleep (4-hour teaching constant). Its initial value is the periodic solution for the selected sleep schedule.
- Alerting effect E = bodyMg/(bodyMg + 75).
- Sleepiness signal = sleep pressure × (1 - 0.45 E).

The 75 mg scale and 0.45 visual effect are declared teaching parameters, not estimated pharmacodynamic constants, questionnaire scores or percent performance gains. The curves teach temporary masking of sleepiness while sleep need persists. They never imply that caffeine removes adenosine, restores lost sleep, or creates an obligatory rebound crash. The sleepiness series has gaps during scheduled sleep; the interface does not claim to measure subjective feelings while asleep.

[Daan, Beersma and Borbély, 1984](https://pubmed.ncbi.nlm.nih.gov/6696142/) is the conceptual source for rising/falling homeostatic pressure. This app includes only that simplified component, not a fitted two-process sleep model: circadian arousal, prior sleep debt, naps, tolerance and withdrawal are omitted. Actual sleep timing stays user-configured, so the sleeping character is not a prediction of caffeine-compatible sleep quality.

[Gardiner et al., a randomized crossover trial](https://pubmed.ncbi.nlm.nih.gov/39377163/) illustrates why dose and timing matter and why a universal sleep penalty is inappropriate: 100 mg and 400 mg produced different results in that study population. We show residual exposure and a qualified sleep explanation, without predicting sleep latency, lost minutes or architecture.

Heart rate, insulin/glucose, glycogen, substrate mix, recovery, calories and body composition are not assigned caffeine multipliers. [A placebo-controlled coffee/caffeine study](https://pubmed.ncbi.nlm.nih.gov/2045756/) found hemodynamic changes without a heart-rate change, reinforcing that a generic automatic pulse-rate increase would mislead. This scope is explained in the interface and sources; absence of a modeled effect does not establish biological absence.

## Interaction and review

Coffee controls select only awake ten-minute breaks outside the modeled workout. A changed schedule moves an invalid coffee time to its nearest available half-hour slot. Changing the cup pauses, keeps the current timeline position, cancels obsolete speech and rebuilds the caffeine plots/cues. The same cursor, timeline and director control coffee, meals and activity. Settings are included under `dailyCoffee` in the existing JSON export.

The activity figure uses a coffee pose only in the visual layer; `Activity`, `simulateDay`, the energy ledger and the looping diet initialization are untouched. The two coffee cards are only appended in the regular daily view. Timed narration covers ingestion, receptor signaling, mental work, clearance and remaining caffeine at bedtime; no independent audio timer is introduced.

Claude's initial read-only consultation is retained in `claude-consultation.txt`. Its recommendations on scope, 09:30 timing, two plots, comparison controls, uncertainty, animation, cancellation and model isolation were adopted.

The implemented feature was reviewed in `claude-final-review.txt`. Corrections preserve meal illustrations when a cup overlaps a meal, preserve existing narration across coffee cues, and align the clearance scene with its actual narration interval. Coffee's brain explanation uses an available gap. When no substantial part of a coincident explanation survives, its sentences are included with the drink event. The digestion/liver focus, sleep-shading label and readable exported clock were also corrected. The closing review in `claude-closing-review.txt` confirmed all seven findings addressed, with no remaining material defects or misleading claims.

The review's 10:00 mental-work example was checked against the actual schedule: the current Healthy weekly menu causes the first work block to begin at 07:00. Regression coverage therefore exercises that real overlap, in addition to 09:00 storage, coffee with breakfast, and a 10:00 cup followed by lunch.

Validation: production build, all 141 unit/model tests, and coffee/guided browser checks pass after these corrections. Existing general, viewer and daily-body browser suites also passed with the feature. The coffee browser checks dose/time/skip changes, shared seeking, pause/speed/narration, meal/work conflicts, unchanged meal and body accounting, settings export, tooltip access, small screens and reduced motion. Screenshots are retained under `artifacts/caffeine/`.
