# Intense exercise day: implementation and limits

The intense day replaces the healthy day's workout with one short repeated-sprint session. Its default is 8 minutes of warm-up, 20 repetitions of 6 seconds maximal intent followed by 30 seconds walking, and 5 minutes of cooldown. The first sprint starts at 16:00. It stays a single day; long-term buttons still describe the original healthy routine.

## Time and physiology

`src/model/sprint.ts` precomputes a deterministic 0.1-second trajectory. Seeking samples this trajectory; it never advances a hidden second clock. Continuous stores interpolate, while instantaneous demand switches with the sprint/walk phase. The full-day model remains minute-scale and receives the session's integrated minute energy and carbohydrate demand.

The normalized variables below are teaching assumptions, not blood tests, measured concentrations, measured oxygen uptake, or calibrated individual forecasts.

| State | Model behavior |
|---|---|
| ATP availability | Continuous resynthesis defends availability. A sprint target and fatigue terms allow a modest decline; ATP never empties. It is not a measured ATP concentration. |
| PCr | Fast depletion proportional to modeled PCr flux; exponential recovery using oxygen support, with slower recovery during walking and with fatigue. |
| Local glycogen | Exercise carbohydrate cost × 75% / 4 kcal per gram, divided by an illustrative active muscle pool (25% of muscle glycogen capacity). Warm-up is included. |
| Fast fatigue | Builds with maximal output, decays during walking with a 105-second time constant. A composite, not a metabolite assay. |
| Slow fatigue | Builds across efforts and resolves over tens of minutes to hours. |
| Oxygen support | Relative index with lag; sprint onset uses a 28-second time constant. It is not percent VO2max. |
| Heart rate | Lags oxygen support; tends toward a configurable resting baseline and an illustrative 188 bpm ceiling. No personalized maximum-HR prediction. |
| Available power | Relative PCr, glycolytic and oxidative supply, reduced by fast and slow fatigue. Walking displays this as a hollow **capacity** bar, not delivered sprint output. |

PCr support is proportional to `0.51 × sqrt(PCr) × (1 − 0.18 × slow fatigue)`. Glycolytic capacity declines with accumulated sprint work, and begins gradual restoration during cooldown. Oxidative capacity is `0.015 + 0.32 × max(0, oxygen support − 0.2)`. These coefficients create the teaching trajectory; they are not fitted kinetic constants.

PCr recovery uses a base 25-second time constant, multiplied by fatigue terms and a 1.2 walking penalty, divided by oxygen support. This produces partial recovery between short efforts. Later recovery peaks need not fall monotonically: lower achieved power can reduce the next depletion. Fatigue is `0.62 × fast + 0.8 × slow`, bounded to 0–1. There is no claim that lactate alone causes fatigue.

The ATP-regeneration graphic combines PCr buffering, glycolysis and oxidative metabolism. Its **length** represents relative turnover; its colored parts show relative contribution. Walking is much shorter and predominantly oxidative. These schematic rates are not a second calorie ledger. PCr is replenished by oxidative ATP rather than acting as a free fuel source.

After cooldown, PCr/ATP, glycolytic capacity, oxygen and fatigue recover continuously. Local glycogen receives only positive replenishment from the full-day muscle store, rather than an invented time-based refill. Its absolute starting amount and recruitment fraction are simplified; the model does not represent individual muscle fibers or subcellular glycogen compartments.

## Energy integration

Sprint cost uses an illustrative 900 W fresh reference at 75 kg, scaled by available power and fat-free mass relative to the original 62.25 kg lean baseline, with 25% effective efficiency. This is a teaching estimate transferred from cycling-style power, not validated running mechanical work. Warm-up, walking and cooldown use 6, 3.3 and 3 MET respectively. Each subtracts modeled resting expenditure because rest is already counted in the daily budget.

The session's integrated cost replaces the original exercise term. There is no added PCr calorie term, no second workout, and no separate estimate of post-exercise excess oxygen consumption. Recovery cost is represented only by the walking/cooldown activity cost; it is not explicitly solved from ATP stoichiometry.

At default settings the session costs approximately **158 kcal above rest**, giving about **2425 kcal/day** expenditure versus **2603 kcal/day** intake. This shorter day uses less energy than the original 60-minute workout. The original day ledger's assumptions still apply: conservative daily bookkeeping does not imply second-by-second biochemical balance. Whole-body stores use a periodic initialization; this does not make the new mode a recommendation to repeat maximal sessions every day.

## Default trajectory audit

Values are outputs of this implementation, not empirical targets.

| Moment | PCr | ATP | Local glycogen | Available sprint power | Fatigue index |
|---|---:|---:|---:|---:|---:|
| End of first sprint (5.9 s) | 50% | 95% | 94% | 79% | 13 / 100 |
| End of first walk (35.9 s) | 77% | 98% | 93% | 90% | 11 / 100 |
| End of sprint 10 | 29% | 92% | 87% | 56% | 41 / 100 |
| End of sprint 20 | 30% | 91% | 81% | 49% | 48 / 100 |
| End of final walk | 69% | 95% | 81% | 61% | 42 / 100 |

The first effort is mainly anaerobic; aerobic share grows from about 11% at its end to about 32% at the end of repetition 10. These are instantaneous modeled shares, not the averaged experimental values in Gaitanos et al. The 20-repetition running illustration and parameter variations extrapolate from shorter protocols and are not empirically validated.

## Presentation

One body, with a Front/Back toggle. Organs are shaped and placed with anatomical reference; layers remain transparent and depth is illustrative. Active legs use one hue with PCr-linked lightness. Outline color distinguishes sprint from recovery. A maximum of two sprint rows receive primary emphasis and one receives secondary emphasis. ATP remains visible as a quieter, compact bar. Details are available through row tooltips, accessible meter descriptions, the optional explanation, and the science dialog.

The session strip has one rep counter and a remaining-time countdown. Sprint and walk blocks are proportional to duration. At the default playback setting, sprint seconds run at 1× and walking at 3×; both rates are shown together. Warm-up/cooldown and the surrounding day are accelerated. Timing is illustrative playback, not a workout timer.

Desktop retains the right-side metrics; narrow screens stack the full-width body above two columns of metrics. Reduced motion removes moving blood and nutrient effects. Bars and values snap together when seeking.
