# Claude consultation and validation

Actual local Claude CLI was used with restricted file tools and an empty strict MCP configuration. No messages were sent to people or external applications.

## Initial discussion

[Proposal](PROPOSAL.md) and [Claude critique](claude-proposal.txt). Constructive suggestions implemented:

- Preserve Healthy's existing frozen week and all existing food records exactly.
- Fix two-meal chapters, meal-index clamping and keyboard tab counts.
- Keep templates as metadata; actual food drives all physiology.
- Preserve per-template portion drafts, original lab food anchors and user profile/activity settings.
- Use the existing source dataset, preserve unknown values, and extend heme assumptions for the new meat foods.
- Add a sourced lean/fat partition under sustained weekly energy deficit, with conserved energy rather than an arbitrary category penalty.
- Keep unsupported serum projections withheld; show a separate, explicitly assumed store illustration for selected B12/folate scenarios.
- Use existing reset/apply controls and a single compact template selector shared between Meals and Micronutrients.

Tea absorption inhibition was not given an unsourced multiplier; its omission is documented. Foods and portions were selected before calculating totals. Neither example is calorie-matched to Healthy, since the user asked that actual foods determine outcomes.

## Meal illustrations

[Bounded task](PLATES-TASK.md), [Claude implementation notes](claude-plates.txt). Claude edited only `plates.ts`, adding a burger assembled from real ingredients, fries, pizza, fried chicken, sausages, buns, cola and tea. Root reviewed code, integrated the UI/model and visually inspected rendered desktop/mobile screenshots. Existing Healthy artwork remains visually unchanged.

## Final review

[Task](FINAL-REVIEW-TASK.md) and [actual review](claude-final-review.txt). Claude identified a cross-template one-day draft-status bug and suggested weekly recovery averaging and permanent scope stops. Corrections:

- Discard now reconstructs the applied week plus the actual override and clears the pending flag. A one-day Run explicitly says the selected day is applied while other weekday edits remain drafts, preserving the established scope semantics.
- Routine recovery support now uses the actual repeating week's mean protein/energy. A single edited day does not instantly replace habitual support; absorbed nutrient signals still respond to that day.
- Composition limits permanently stop the curve. A regression tests a later change of energy balance cannot restart it.
- Documentation distinguishes exact preservation of Healthy food data from generic model improvements affecting all diets; no template-specific exemption is used. Source-document spacing was corrected.

The optional compressed mobile selector was not adopted: full, readable template names fit at 320 px after the grid correction. A [narrow closing review](claude-closing-review.txt) checks the substantive corrections, with [this task](CLOSING-REVIEW-TASK.md).

Claude's closing verdict: **“No concrete blocker remains.”** It confirmed the draft-state, weekly recovery and permanent scope-stop corrections by reading the implementation and tests. Claude did not rerun the checks; Codex ran the validation recorded below.

## Validation

- **109 numerical tests pass**, including 11 template/model tests.
- All **eight browser suites pass**: templates, general physiology, diet, micronutrients, profile/cycle, viewer, composition and status.
- TypeScript and Vite production build pass. After review corrections, all 109 numerical tests and the template/diet browser suites passed again; their latest logs include UTC timestamps.
- SHA-256 regressions prove the exact original Healthy week and all 28 original food records are unchanged. A separate source-text comparison also confirms the authored reference menu was not rewritten.
- Tests cover two repeated menus per added week, real source codes/values, complete selected lab nutrient data, macro/energy closure, nutrient-conserving absorption, food-dependent signals and sprint fuel, lean/fat loss and scope stops, slow B12 depletion without a fabricated serum curve, shared profile/activity settings, draft/week/one-day/reset semantics, retained lab anchors, keyboard access, and 320/390 px layouts.
- Browser testing found a 320 px weekday-strip overflow; corrected with shrinkable grid tracks. An old exact header-string assertion was updated for the intentional Healthy label. No assertions were removed.

Evidence: `artifacts/diet-templates/`. These checks establish deterministic internal behavior, not clinical validity. [MODEL.md](MODEL.md) and [SOURCES.md](SOURCES.md) state the scientific limits.
