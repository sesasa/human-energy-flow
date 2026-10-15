# Food data provenance

`foods.json` is a small derived extract of the [UK Composition of Foods Integrated Dataset (CoFID), 2021](https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid), published by Public Health England. Contains public sector information licensed under the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/). Crown copyright.

The source workbook is [McCance and Widdowson’s CoFID 2021](https://assets.publishing.service.gov.uk/media/60538b91e90e07527df82ae4/McCance_Widdowsons_Composition_of_Foods_Integrated_Dataset_2021..xlsx); the [user guide](https://assets.publishing.service.gov.uk/media/60538e66d3bf7f03249bac58/McCance_and_Widdowsons_Composition_of_Foods_integrated_dataset_2021.pdf) defines units, preparation descriptions, missing values and energy conventions. Each record preserves the exact food code/name. Values are per 100 g edible food, not a substitute for a product’s own label.

Reproduce from the downloaded workbook:

```sh
python -m venv /tmp/cofid-tools
/tmp/cofid-tools/bin/pip install openpyxl
/tmp/cofid-tools/bin/python scripts/extract-foods.py /path/to/CoFID_2021.xlsx
```

Sheets used: Proximates, Inorganics, Vitamins, PUFA per 100gFood. `N` and blanks remain null; `Tr` becomes approximately zero. EPA and DHA use cis-n3 columns where available, otherwise their named legacy EPA/DHA columns. No runtime network requests are used for nutrition data.

The reference coverage values are documented in [the diet model](../docs/diet/MODEL.md), with [sources](../docs/diet/SOURCES.md). The reference menu and portion sizes are authored teaching examples, not part of the source dataset.

## Added diet templates

The original 28 food records and Healthy week are unchanged. Nine CoFID records were appended for Fast-food / ultra-processed and Low-variety nutrient-limited examples. Exact codes, workbook hash, assumptions and menus are in [template sources](../docs/diet-templates/SOURCES.md) and [template model](../docs/diet-templates/MODEL.md). Template portions are authored; their calories/macros/micronutrients are calculated from the catalogue.
