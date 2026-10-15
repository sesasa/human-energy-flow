# Sources and reproducibility

## Food composition

All nine additions come from the same [Public Health England CoFID 2021 workbook](https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid) as Healthy. [Direct workbook](https://assets.publishing.service.gov.uk/media/60538b91e90e07527df82ae4/McCance_Widdowsons_Composition_of_Foods_Integrated_Dataset_2021..xlsx). Workbook SHA-256: `436e9445ef2adb2a75f3d7edd51302de3adad25385f9795fc94ba58bd030e97d`.

`scripts/extract-foods.py` reproduces all 37 records. Tests pin the original 28 records and the original Healthy menu to their pre-change SHA-256 digests. All nutrient values are per 100 g edible portion; null remains unavailable and trace becomes approximately 0. Values use the same 3.75 kcal/g carbohydrate-equivalent,4 protein,9 fat and2 AOAC-fibre convention. Display rounding never changes model inputs. Existing 28 records are unchanged.

| ID | CoFID code | Preparation |
|---|---|---|
| white-bread | 11-980 | white sliced bread, UK flour fortification |
| bun | 11-1006 | white soft bread roll |
| burger-patty | 19-490 | 98–99% beef burger, fried in vegetable oil |
| fries | 13-486 | fine-cut potato chips from fast-food outlets |
| pizza | 11-936 | retail cheese-and-tomato pizza |
| fried-chicken | 18-500 | battered deep-fried takeaway chicken, edible weight |
| sausage | 19-509 | chilled pork sausages, grilled |
| cola | 17-175 | regular cola |
| tea | 17-165 | average black tea infusion without milk/sugar |

Existing cake, cheese, potatoes, rice, oil and salt are reused unchanged. Menu names, quantities and repetition are authored examples, not sourced eating surveys or prescribed intake targets. Composite-food micronutrients have not been guessed. All new foods have known iron/B12/folate/D values; some fatty-acid data remain missing and are flagged. UK bread's calcium/iron must not be interpreted as universal for bread from every country. There is no processing-category penalty.

## Modeling evidence and limits

- [Hall 2007, Forbes theory revisited](https://www.cambridge.org/core/journals/british-journal-of-nutrition/article/body-fat-and-fatfree-mass-interrelationships-forbess-theory-revisited/E4058619DF9042AB22DF2CF7B0A88152): differential fat-free fraction of weight loss `10.4/(10.4+fat kg)`. We retain existing energy densities and training-gain assumptions, apply the fraction to a rolling weekly deficit, and conserve daily energy. This hybrid teaching adaptation is **not** Hall's full validated dynamic model or an athlete-specific muscle-loss forecast. Seven-day averaging is authored to avoid alternating-day artifacts; lean tissue includes water/organs and is not synonymous with muscle.
- [NIH ODS B12](https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/) and [folate](https://ods.od.nih.gov/factsheets/Folate-HealthProfessional/): nutrition and storage context for the existing pool models. Separate store illustrations reuse the prior 2500 µg B12 and 20000 µg folate assumed initial pools and prior turnover/uptake functions. The shapes are illustrative, not calibrated to the entered laboratory result. No serum conversion is made.
- [NIH ODS iron](https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/): animal/plant iron and regulated uptake. New nearly all-beef patties use the existing authored beef heme fraction 0.4; battered chicken and pork sausage use 0.3. These are absorption assumptions, not CoFID measurements; sensitivity bands remain essential.
- [Ahmad Fuzi et al. 2017](https://pubmed.ncbi.nlm.nih.gov/29046302/): tea with a meal can inhibit nonheme iron absorption. We disclose that tea inhibition is **not** currently simulated; no unexplained tea penalty is introduced.

Existing [lab evidence/limits](../lab-results/MODEL.md), [profile/cycle sources](../profile-cycle/SOURCES.md), and [diet accounting](../diet/MODEL.md) continue to apply. Added relative fatigue recovery uses a bounded food energy/protein support factor, explicitly an authored educational signal rather than a validated time-to-recovery calculation. Individual food GI, caffeine, sodium/fluid weight changes, blood pressure, cardiometabolic disease, malabsorption and clinically severe undernutrition are outside this model.
