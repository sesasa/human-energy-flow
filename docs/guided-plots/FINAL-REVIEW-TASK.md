Please independently review the finished revision in this repository. Read-only review: do not edit project files. You may run tests or use /tmp for probes. You are the actual Claude reviewer requested by the user.

User wants: concise left scene context, physiological time-series plots on the right, grouped compatible axes, long-term interactive plots with shared timeline, central playback under the anatomy, a vertical system rail beside the body, and separately authored event-based narration for daily/sprint/long modes. Narration must follow actual food/activity/scenario and plot changes, remain synchronized across pause/resume/speed/seek, avoid obsolete speech, and guide attention to the relevant plot/anatomy. Preserve the current visual style, healthy diet, body/diet model, female/cycle/lab workflows.

You provided an initial design critique in docs/guided-plots/claude-proposal.txt and implemented the new PlotCard/PlotSpecs modules. Root integrated those and added the event script, speech controller, system rail and layout. Some small plot changes since your implementation: full configured warmup/cooldown (so narration has visible data), held boundary numerical values while projection lines stop, reference interval labels, and fixed tooltip IDs.

Review at least:
- src/main.ts (integration / shared timeline / labels / scope)
- src/engine/narration.ts, narrationEvents.ts, timeline.ts
- src/visual/plotCard.ts, plotSpecs.ts, plotTips.ts, documentary.css, body.ts
- tests/narration.test.ts, plots.test.ts, guided-browser.ts (coverage, not just green results)
- docs/guided-plots/IMPLEMENTATION.md
- screenshots artifacts/guided-plots/guided-meal.png, guided-sprint.png, guided-long.png, guided-mobile.png (Read can inspect PNG)

Validation so far: build + 129 numerical tests pass; all nine existing browser suites updated to reflect the intentional bar-to-plot layout pass. New guided-browser suite tests speech with a deterministic service substitute, not the audio quality of the installed OS voice. Native browser voice quality/availability varies, and this is documented honestly.

Please look for concrete bugs or misleading biology, misplaced or unreadable controls/plots, cue/plot domain mismatches, stale speech or timeline boundary traps, errors after changing diet/sex/selected lab scope, and responsiveness/accessibility. Focus on actionable findings and distinguish blockers from refinements. The UI should not narrate an unsupported prediction, pretend relative indices are lab values, or imply recovery when the actual model declines. Manual system focus should persist until Guided is selected again.

Return concise findings with file/line references, rationale and recommended fixes. State what you checked and what you could not verify. If satisfactory, say so, but do not assume it merely because tests pass.
