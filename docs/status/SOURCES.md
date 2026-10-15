# Micronutrient source register

Reviewed 2026-10-06. These sources support the relationships and broad scales below. They do not validate the app's authored recovery curves or exact coefficients.

| Source | Used for | Limits |
| --- | --- | --- |
| [NIH ODS: Iron, health professional factsheet](https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/) | Heme/non-heme absorption; vitamin C and meal interactions; stores and ferritin; low stores preceding anemia; evaluation of confirmed deficiency | No clinical ferritin threshold or treatment dose is encoded. Exact absorption depends on more than this model includes. |
| [Overview of Iron Metabolism in Health and Disease](https://pmc.ncbi.nlm.nih.gov/articles/PMC5977983/) | Small circulating transport pool, functional/storage pools, approximately 20–25 mg/day recycling and erythropoietic demand, 1–2 mg/day external absorption/loss, roughly 120-day red-cell lifetime | Simplified daily buffer and seven-day marrow queue are implementation assumptions. No personal iron-kinetic prediction. |
| [NIH ODS: Vitamin B12, health professional factsheet](https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/) | Substantial 1–5 mg body stores, potentially slow deficiency development, limited active absorption, possible need for professional treatment of malabsorption | Chosen 2.5 mg reference and 0.8 mg low anchor are illustrative; no lab conversion. |
| [National Academies DRI: Vitamin B12](https://www.ncbi.nlm.nih.gov/books/NBK114302/) and [turnover appendix](https://www.ncbi.nlm.nih.gov/books/NBK114329/?report=printable) | Store/loss framework and approximately 0.1% daily turnover used as an educational baseline | The app does not implement the full enterohepatic system; the food-meal uptake curve is authored. |
| [UK CoFID 2021](https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid) | Existing per-food iron, B12 and vitamin C quantities used for actual edited meals | No catalog heme or phytate measurement; category modifiers are explicitly heuristic. See [food provenance](../../data/README.md). |

The reference reserve calibration, low starting indices, heme shares, phytate-weight proxy, absorption response functions, tissue turnover, marrow delay, higher-loss and reduced-uptake multipliers are disclosed in [MODEL.md](MODEL.md). Vitamin D, magnesium and other micronutrients remain intake-only comparisons because this extension does not implement their distinct regulation, endogenous inputs and tissue dynamics.
