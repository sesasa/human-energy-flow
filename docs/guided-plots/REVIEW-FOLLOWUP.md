# Final review response

Please review only these corrections to the findings in `claude-final-review.txt`. Keep this focused. Read-only; do not start or stop servers, restore screenshots, or edit source. The current preview is available at http://127.0.0.1:5174/. The implementation and guided browser test are passing. Return any remaining concrete issue with the fixes, or confirm they resolve the original findings.

1. Timeline: actual time ticks now live in `#transport-axis`. Buttons are in a separate, bordered **JUMP TO** row (chronologically sorted), so their spacing does not imply time position.
2. Gesture continuity: `PlotCard.interacting` pins the current coordinate system while dragging or while the slider has keyboard focus. `updatePlots` defers the daily/sprint card swap. New guided browser regressions drag 500 → 605 → 700 without interruption, and use arrow keys across the boundary without focus loss.
3. Related plots: `cue` accepts additional emphasis targets. Exercise onset and recovery also emphasize HR; sprint intro includes power/fatigue; the first walking recovery includes oxygen support.
4. Long-term context now comes from `visual/longStory.ts`, based on actual recent fat/lean deltas. The fast-food regression confirms the final-year panel reports growing fat stores rather than automatic progress/stability. Limits retain explicit stopped/held wording.
5. Lab tooltips no longer append “from start” after “vs entered”.
6. A system without a matching plot leaves the plots undimmed. Micronutrients with no selected lab opens its configuration; with selected labs the matching cards are emphasized.
7. Active cards have a brighter border and left accent. Other curves become quieter, but their numerical labels keep full contrast.
8. **Captions** has its own toggle, independent of speech. Voice on enables captions initially; voice off leaves that preference intact. Silent captions use a polite live region, switched off during native speech to avoid doubling audio.
9. Mode entry, Apply scenario and Show day 1 all start the sprint mode at the warmup.
10. Extra plot-frame spacing separates y-axis labels from legends. The colliding exercise label was removed from the plot area; the exercise band remains explained in the note.
11. On phones, a compact copy of the currently followed plot appears immediately above captions/playback, while the full set remains below. It has a separate DOM namespace and uses the same timeline. The guided browser suite checks this, including independent captions.
12. Retained intentionally: the Micronutrients tab's action already explicitly reads **Apply & view over time ↗**. The Meals tab's action remains **Run with this diet ↗**. This is an explicit long-term laboratory exploration action, not an unlabeled automatic switch.

Root independently ran all nine existing browser suites earlier. After these changes, root reran browser, viewer, daily-body and guided suites; all pass. 131 numerical tests pass, including related-plot focus and actual long-term scene trends. No physiology coefficients, food records or Healthy menu changed.

Relevant screenshots have been refreshed in `artifacts/guided-plots/guided-*.png`. The mobile screenshot includes the new followed plot and silent captions.
