# Guided physiology: plots, anatomy and narration

The physiology solvers, food records, original Healthy menu and male/female body-shape mapping are retained. This revision changes their presentation and adds an authored event track.

## Layout and plots

- Left: a scene title based on actual body trends, three or fewer key points, the actual meal illustration, expandable explanation.
- Center: the existing anatomy, Front/Back, activity figure and system rail. Playback and the shared timeline are directly below the body.
- On phones, a compact copy of the followed plot sits beside playback; the complete set remains below.
- Right: paired glucose/insulin indices, liver/muscle glycogen in grams, heart rate in bpm, modeled fuel mix, recovery. Sprint mode substitutes rapid buffers, power/fatigue, heart rate, oxidative support and sprint-only ATP-regeneration shares.
- Long term: body-composition changes in kg with absolute readouts, body fat in percent with point changes, modeled resting heart rate, and only selected laboratory markers. A projection limit ends the line; numerical body readouts explicitly identify the held boundary state.
- Plot paths use actual solver samples. Min/max decimation preserves short PCr troughs. Cursor values use solver sampling functions. Plot pointer, touch and keyboard input all seek the same master timeline and pause playback. The active coordinate system is retained through drags and keyboard focus, even when crossing the sprint window. Main-axis ticks correspond to real time; destination buttons form a separate Jump to row.
- Sprint plots include the configured warm-up and cooldown, so the introductory and concluding cues have visible values. Day plots resume afterward.
- Laboratory plots retain the entered-result dot, distinct modeled line, supplied/default reference range, sensitivity envelope, unestimated gaps and ferritin-only menstrual markers. These are educational scenarios, not precise future blood tests.

## Narration

`src/engine/narrationEvents.ts` builds different cue tracks for daily physiology, the configured sprint protocol and long-term adaptation. Events carry simulation-time boundaries, short spoken sentences, a system and specific plot/line targets. Food, training, observed trend direction, projection limits, selected labs and menstrual settings determine relevant wording. No additional biomarker oscillation or metabolic equation is introduced.

`src/engine/narration.ts` queues one sentence at a time using the browser's speech synthesis service. A local English voice is preferred. Browser/OS voice quality, availability and network behavior vary; no voice recording or external paid TTS dependency is bundled.

Playback rules:

1. Voice toggling while paused does not speak. Play starts the current event, including after a manual seek.
2. Pause cancels native speech and remembers the unfinished sentence. Resume restarts that sentence. This avoids unreliable native mid-utterance resume behavior.
3. Seek, view changes and input changes cancel the old event; generation tokens reject late callbacks.
4. Selected speed is retained. Speech rate changes within a comfortable range; the visual clock slows as necessary to remain within the speaking event. “Narrating · guided pacing” makes this explicit. Between cues it returns to the selected speed. Walks remain accelerated relative to short sprint efforts.
5. The next event onset is a clock boundary, preventing fast playback from skipping a short cue. Speech failure or missing completion callbacks releases pacing and falls back to visible captions.
6. Manual system selection overrides guided visual emphasis until Guided is selected again. It does not change the physiological model.
7. Captions can be toggled independently of voice. Silent captions use a polite live region; with native voice on, live announcements are off to avoid duplicate speech. Plot sliders and current-value labels remain keyboard accessible.

## Scientific interpretation

- Daily glucose/insulin curves are relative model signals, not clinical concentrations or direct measurements of uptake. Exercise narration describes the independent contraction pathway; its transporter machinery is not individually simulated. [Richter & Hargreaves, 2013](https://pubmed.ncbi.nlm.nih.gov/23899560/).
- Sprint PCr, glycolytic supply, oxidative support and declining performance are teaching outputs. The existing 20-repetition running example extends evidence from shorter studied protocols; it is not a fitted subject-specific prediction. [Gaitanos et al., 1993](https://pubmed.ncbi.nlm.nih.gov/8226473/).
- Narration about phosphate and calcium handling explains mechanisms summarized by the existing fatigue index. Neither phosphate concentration nor sarcoplasmic calcium is a separately calculated state. [Allen, Kabbara & Westerblad, 2002](https://pubmed.ncbi.nlm.nih.gov/11880693/).
- Cardiovascular narration follows the existing resting-heart-rate output; it does not claim a modeled stroke volume or VO₂ measurement. Recovery and oxidative support retain explicit “index” labels.
- The same diet, laboratory and menstrual assumptions documented in the existing modules apply to their plots; this UI does not introduce new food or laboratory coefficients.
- Native speech cancellation and event semantics follow the [Web Speech API specification](https://webaudio.github.io/web-speech-api/). The controller handles unavailable services and missing events defensively.

## Verification

Pure tests cover cue timing, changed food/exercise, constrained laboratory narratives, sentence completion, pause/resume, seek cancellation, stale callbacks, speed changes and watchdog fallback. Plot tests check fixed scales, exact current values, preserved PCr extrema, null gaps, mass accounting and laboratory references/cycle markers. Browser tests exercise the real UI with a deterministic speech-service substitute; they verify synchronization rather than claiming to assess an installed voice's audio quality.

Claude provided the initial design review and implemented the reusable plot renderer/adapters. The final independent review and follow-up are recorded in this directory.
