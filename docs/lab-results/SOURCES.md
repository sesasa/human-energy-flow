# Source register

Reviewed October 2026. Food measurements, reference intervals and response evidence are distinguished below from authored simulation assumptions. The simulator is educational; none of these sources validates individualized lab forecasting from the user's menu.

## Food composition

[UK CoFID 2021](https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid) supplies the existing per-100-g iron, B12, folate, D and macronutrient catalogue. Exact food codes, edible preparation descriptions and missing-value handling are preserved in [data/README.md](../../data/README.md). No food nutrient values were invented for this revision.

## Default laboratory comparisons

| Marker | Source and default | How the app uses it |
|---|---|---|
| Ferritin | [Mayo Clinic Laboratories](https://www.mayocliniclabs.com/test-catalog/overview/619953): adult male 31–409 µg/L | Labeled example for the simulator's adult male; not universal or diagnostic |
| Vitamin B12 | [Mayo Clinic Laboratories](https://www.mayocliniclabs.com/test-catalog/overview/9154): 180–914 ng/L | Displayed in pg/mL or converted to pmol/L; assay-dependent |
| Serum folate | [Mayo test setup](https://www.mayocliniclabs.com/api/sitecore/testcatalog/TestCatalogSetupPDF?testid=800139): ≥4.0 µg/L | One-sided default; no invented upper limit |
| 25-OH vitamin D | [NIH ODS](https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/): 50–125 nmol/L used as the comparison band | Explicitly **NIH guide, not a lab interval**; lower adequacy boundary and upper caution boundary have different meanings |

A user's supplied limit or limits override the entire default. Being within a reference interval does not establish health; being outside it does not identify a cause. Units remain next to inputs and axes.

## Ferritin and iron balance

- [Walters et al., 1973, serum ferritin and storage iron](https://pmc.ncbi.nlm.nih.gov/articles/PMC477879/): historical relationship in healthy subjects; not proof of an individual conversion.
- [Journal of Clinical Pathology review](https://jcp.bmj.com/content/64/4/287): describes the approximate 8 mg stored iron per 1 ng/mL ferritin relationship and interpretation limitations.
- [NIH ODS iron professional fact sheet](https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/): dietary forms, absorption, regulation and factors affecting status. Mixed-diet absorption varies; low stores are distinct from iron-deficiency anemia.
- [Iron transport and recycling review](https://pmc.ncbi.nlm.nih.gov/articles/PMC5977983/): functional pools and recycling support the pre-existing pool architecture.

The case conversions 6/8/10 mg per µg/L, uptake multipliers 0.3/1/1.25 and losses 2.4/1.2/1.0 mg/day are **authored sensitivity assumptions**, not reported clinical confidence limits. Exact heme fractions, vitamin-C/phytate modifiers and store-regulation equations are teaching simplifications. The model does not infer inflammation, menstrual loss, gastrointestinal bleeding or malabsorption from a single result.

## B12 response

[Systematic review and meta-analysis of B12 intake and status](https://pubmed.ncbi.nlm.nih.gov/23269815/) reports about an 11% serum response per doubling of intake in pooled adult/elderly data, approximately 8% in adults, and a pooled upper interval coefficient of 12.5%. The app uses the adult coefficient centrally and includes no response through the pooled upper response as sensitivity. Evidence mixes study designs and is not a deficient individual's recovery law.

[NIH ODS B12](https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/) supports the distinction between serum observations, larger body stores, clinical context, food release and absorption limitations. The app's saturable meal uptake formula and 90-day serum adjustment time remain authored approximations. They do not model treatment of pernicious anemia or other malabsorption.

## Folate response

[Bayesian meta-analysis of natural-food folate intake and blood biomarkers](https://pmc.ncbi.nlm.nih.gov/articles/PMC4425166/) reports approximately 7% higher serum/plasma folate per 10% higher intake, with a 1–12% credible interval. The reviewed population is largely women aged 12–49. The app uses the central coefficient, includes a no-response case, and displays the upper coefficient as sensitivity. Extension to this adult male and to intake reductions is uncertain.

[NIH ODS folate](https://ods.od.nih.gov/factsheets/Folate-HealthProfessional/) explains food bioavailability and the difference between recent serum status and longer-term red-cell status. The 21-day adjustment time is authored, not the study's fitted recovery rate. The food calculation uses natural-food folate values, not folic-acid supplement doses.

## Vitamin D response

- [2021 systematic review of vitamin-D-fortified foods](https://pubmed.ncbi.nlm.nih.gov/34308818/): about 2 nmol/L higher 25-OH D per additional 100 IU/day, equivalent to 0.8 nmol/L per µg/day; substantial heterogeneity.
- [Fortified-food meta-analysis](https://www.sciencedirect.com/science/article/pii/S0022316622027948): pooled response approximately 1.2 nmol/L per µg/day, interval 0.72–1.68.
- [NIH ODS vitamin D](https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/): approximately 15-day circulating half-life, variation in food and non-food exposure, concentration units and interpretive limitations.

The app's central coefficient is 0.8, with sensitivity including zero response through 1.68. Ordinary food changes and decreases are extrapolations from fortification studies. Sunlight and other non-food influences are held constant; no sunlight or supplement dose is recommended. The 80% uptake display is an authored accounting approximation, not an estimated personal absorption fraction.

## Interpretation

These data support exploring the plausible **direction** of a modest food change. They cannot identify why a result is low, predict whether food alone will correct it, or provide the next laboratory value. B12/folate/D unchanged-diet curves are held steady by assumption; this is not a prediction of the untreated course. Scope limits and uncertainty wording are part of the interface, not only this document.
