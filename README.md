# KS2027 — Kwara South Senatorial Campaign Operating Platform

Structure, reconciliation, narrative monitoring, election-day parallel tallying, and public
commitment tracking for **Hon. Popoola Adekeye Lekan Saheed (PDP)** in the **2027 Kwara South
Senatorial District election** (Saturday, 16 January 2027).

Built by Farawa Media on the Kwara 2027 operating platform architecture around a single premise:
**Kwara South is small enough to be real.** Seven local governments, 83 wards, and 907 polling
units is small enough that every ward officer, polling agent, directive return, and EC8A sheet can
be tracked as an actual record rather than an estimate.

## The rules this codebase enforces

1. **No number renders without a source record.** Every figure carries its provenance
   (`src/lib/provenance.ts`). Simulated values are visibly badged, and `assertPublishable` throws
   rather than letting simulated data cross into the public ledger.
2. **Real geography, badged simulation.** The 7 LGAs, 83 wards, and 682 enumerated 2015 polling
   units are parsed directly from INEC's directory and reconciled against INEC's declared totals,
   with the 2021 expansion gap (907 current PUs; 225 unallocated converted voting points) stated
   plainly in every denominator.
3. **Nothing political is hardcoded outside config.** Principal, party, 2027 INEC ballot context,
   cycle dates, and priority ordering resolve from `src/config/campaign.config.ts`.

## Data

| | Count | Source |
|---|---|---|
| LGAs | 7 | Ekiti, Ifelodun, Irepodun, Isin, Offa, Oke-Ero, Oyun |
| Federal Constituencies | 2 | Ifelodun/Offa/Oyun (3 LGAs, 41 wards) · Ekiti/Irepodun/Isin/Oke-Ero (4 LGAs, 42 wards) |
| Wards (registration areas) | 83 | INEC Directory of Polling Units, Kwara State, rev. January 2015 |
| Polling units (current roll) | 907 | Post-2021 INEC expansion (682 enumerated to ward level; 225 unallocated) |
| 2023 Senate baseline | 115,181 (top 3) | INEC declaration at Omu-Aran: APC 55,966 · PDP 34,950 · SDP 24,265 |

## Surfaces

- `/war-room` — Overview: allocation gap across 7 LGAs & 2 federal constituencies, ward control,
  2023 Senate path-to-flip math, and source reconciliation
- `/war-room/structure` — Power map: 83-ward weighted mosaic and orphan wards
- `/war-room/reconciliation` — Post-primary & PDP/SDP reunification stakeholder pipeline
- `/war-room/comms` — Role-derived channels, directives, acknowledgement funnel & chase list
- `/war-room/narrative` — Public-source OSINT, Kwara South claims, Yoruba/English/Pidgin/Fulfulde
  coverage, and human approval gate (`assertSendable`)
- `/war-room/election-day` — 16 January 2027 parallel tally, EC8A coverage against 907 PUs,
  incident desks, and tier-two citizen reports
- `/field` — Offline-first ward officer mobile interface
- `/ledger` & `/ledger/results` — Light-theme public Senatorial commitment register (`KS-*`) and
  open parallel count

## Commands

```bash
npm run data:inec       # regenerate src/lib/geography/kwara-south.generated.json
npm run check:analysis  # verify 7 LGAs / 83 wards / 682 PUs / 2 federal constituencies
npm run typecheck       # tsc --noEmit
npm run lint            # eslint
npm run build           # production build
```
