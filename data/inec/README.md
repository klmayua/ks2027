# INEC source data — Kwara South Senatorial District

## `kwara-pu-directory-2015.txt`

Text extracted from the INEC *Directory of Polling Units — Kwara State*, revision January 2015.

- **Source:** <https://inecnigeria.org/wp-content/uploads/2019/02/PU_Directory_Revised_January_2015_Kwara.pdf>
- **Publisher:** Independent National Electoral Commission (INEC)
- **Extraction:** `pdf-parse` text layer, 107 pages, unmodified apart from page-break markers.

Parsed and scoped to the 7 LGAs of Kwara South Senatorial District (Ekiti `04`, Ifelodun `05`,
Irepodun `09`, Isin `10`, Offa `13`, Oke-Ero `14`, Oyun `15`) by `scripts/parse-inec-directory.mjs`
into `src/lib/geography/kwara-south.generated.json`.

The parser reconciles every parsed count against INEC's own declared totals and refuses to report
success on mismatch. Current Kwara South scope:

| | Parsed (2015 directory) | Post-2021 INEC expansion |
|---|---|---|
| LGAs | 7 | 7 |
| Wards (registration areas) | 83 | 83 |
| Polling units | 682 | 907 (+225 converted voting points) |

## Known staleness — read before operational use

**The per-ward polling unit roll is pre-2021.** INEC's 2021 expansion converted 225 voting points
into full polling units across Kwara South, lifting the district total from 682 to 907 (including
Offa doubling from 86 to 173). We hold the per-LGA post-2021 totals but not yet the ward-level
mapping of those 225 new units. Coverage denominators use the authoritative 907 total rather than
the flattering 682 subset.

**LGA and ward structure is stable** — 7 LGAs and 83 wards, corroborated by 2023 general election
reporting. Ward-level work can proceed on this data.

Every record keeps its INEC code (`lgaCode`, `wardCode`, `code`), so a newer directory can be
reconciled in without re-keying anything downstream.
