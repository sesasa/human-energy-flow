# Daily body continuity and ATP tooltip behavior

The original Healthy menu and food data are untouched.

## Cause and correction

Daily food quantities already drove minute-scale absorption and sprint fuel. However, the old representative-day viewer explicitly reused the **starting body**, so opening a later Over Time point reset the anatomy and acute physiology.

`dayContext.ts` now creates a representative acute day from the exact fractional long-term body snapshot. It copies mass, fat fraction and the existing modeled resting HR into an isolated scenario, advances age by the selected elapsed time, and preserves the mass scaling for ordinary movement used in Over Time. The actual repeating food week settles at that body's capacities; a one-day override is dropped after its first week. It does not mutate the starting profile, activity schedule, menus or laboratory inputs. This reuses existing model equations and introduces no diet-label penalties or new physiological coefficients.

Both Daily routine/Healthy day and Sprint session use the same snapshot. BodyView retains the regional muscle adaptation as well as the outline, while heart animation uses live acute HR. The small activity character receives the same proportions. The banner shows mass and fat percentage with the selected time. Composition remains fixed during the simulated 24 hours; this is not a continuous reconstruction of historical minute states. Returning preserves exact long-term time. New applied inputs retain the established restart behavior. Show day 1 restores the starting body. Extreme selected ages/masses outside the existing acute solver's input domain disable the daily shortcut rather than crash or silently clamp the body.

## Tooltip behavior

Layout/text updates can generate `pointerover` beneath a stationary cursor. The previous handler immediately opened an educational tooltip, including around ATP. Hover now requires actual pointer movement followed by a 250 ms dwell at a stable row position. Keyboard focus and tap-to-pin remain available. Seeking, playback controls, mode changes and structural metric moves clear the explanation and pending hover. Escape still dismisses it. The existing popup placement keeps it beside the hovered bar where space permits.

The user was asked for the exact unexpected text. This correction addresses the concrete automatic-hover and stale-tooltip paths found in code; it does not assume a different, unidentified text rendering bug was reproduced.

The existing status regression caught overlapping leave/focus-close timers canceling a deliberate hover during rapid control changes. The tooltip now cancels the prior close timer before scheduling another. Event tracing confirmed the cause; the regression is retained.

## Claude consultation

Actual Claude CLI, read-only with restricted Read/Glob/Grep tools and no MCP servers, reviewed the issue: [task](REVIEW-TASK.md), [initial review](claude-initial-review.txt). Implemented its body-snapshot, movement-scaling, glycogen/recovery, live-HR, small-character, scope and tooltip suggestions. Fractional rather than integer body time is retained to match the graph exactly. The [final review](claude-final-review.txt) found no implementation blocker and requested stronger evidence for the automatic-hover regression. The synthetic event check was replaced with real playback beneath a stationary pointer; it asserts a trusted browser pointerover, no pointermove and no popup. A later-body profile apply/reset check was added too.

## Validation

Five new numerical tests cover exact body snapshots and energy components, unchanged initial body across templates, male/female gain/loss, routine/sprint fuel and HR, energy conservation, unchanged configuration, one-day scopes, frozen projections and domain checks.

The new browser regression covers exact matching outlines/muscle transforms between long and both daily views, within-day stability, small-character proportions, front/back, live pulse, reset/return, unchanged exported profile, tooltip hover/focus/Escape/tap, layout-generated pointer events, no bar overlap, and 320/390 px layouts. Desktop screenshots were visually checked. Evidence is in `artifacts/daily-body/`.

Final results: **114 numerical tests, all nine browser suites, and the TypeScript/Vite production build passed.** Browser suites: daily-body, viewer, status, templates, profile, micronutrients, diet, general and composition. Status was rerun after the close-timer correction; daily-body passed again with the real stationary-pointer playback regression and later-body reset check. No assertions were removed. Claude's review was read-only; Codex ran these checks.
