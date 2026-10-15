# Daily body and ATP overlay review

The user asks: “please review this with claude, and also make the anatomical person fitted to the diet; it happens when the mode is Over Time but not for daily ones... also when running the sim, a text appear on the ATP availability menu bar”.

Please review the current code READ ONLY and suggest a small, coherent fix. Do not edit or run other tools beyond the allowed reads. The root agent is reproducing the UI and will implement/test.

Relevant files: src/main.ts (setDayContext, render, navigation, updateMetrics), src/model/dietSimulation.ts, src/model/day.ts, src/model/sprint.ts, src/model/longTerm.ts, src/visual/body.ts, src/visual/activity.ts, src/visual/tooltips.ts, tests/viewer-browser.ts, tests/status-browser.ts.

Findings so far:
- Diet already supplies daily meal timing, absorption, glycogen, protein, energy and sprint fuel; repeat/once scopes exist.
- Current representative-day navigation intentionally reused a settled food week at the STARTING body. BodyView receives adaptation only in long mode. Thus opening a later day visibly resets the outline. We should carry the selected long-term body snapshot into both normal/sprint day, with consistent acute physiology (mass/lean/fat/resting HR) and activity character. Keep within-day composition stable; no instant fat/lean transformation merely from selecting a template.
- Preserve base profile, activity schedule and diet inputs, exact long timeline return, one-day override semantics, front/back and existing physiological animation. The sampled body should remain explicitly a representative day at the selected modeled body, not a reconstructed continuous historical day.
- BodyView's existing long argument also forces resting HR and muscle adaptation. Avoid passing it naively to daily view and freezing exercise heart rate.
- Suspected overlay is EducationalTooltips opening from pointerover when live metric rows move under a stationary pointer, or remaining stale/pinned across navigation. User has been asked what text appears; not yet answered. Review for concrete causes and recommend intentional hover/focus/tap behavior without removing educational tooltips.

Please provide concise recommendations and risks/test cases. Cite relevant code rather than speculative broad redesign. We will request a final review after corrections.
