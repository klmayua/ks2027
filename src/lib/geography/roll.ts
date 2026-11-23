/**
 * The current Kwara South polling unit roll.
 *
 * The bundled INEC directory (January 2015) enumerates 682 polling units across Kwara South's 83
 * wards. INEC's 2021 expansion converted 225 voting points into full polling units across the
 * seven LGAs, taking Kwara South to 907 polling units — including Offa more than doubling from 86
 * to 173. We hold the per-LGA post-2021 totals but not yet the ward-level allocation of those 225
 * new units.
 *
 * Coverage is computed against the authoritative 907 total; the 225 unallocated units are stated
 * plainly rather than hidden behind a flattering 682 denominator.
 */

import { pollingUnits } from './index';
import type { Provenance } from '@/lib/provenance';

export const PU_EXPANSION_2021: Provenance = {
  kind: 'official',
  publisher: 'Independent National Electoral Commission (INEC)',
  document: '2021 polling unit expansion — Kwara South Senatorial District LGA totals',
  revision: 'May 2021',
  url: 'https://inecelectionresults.ng/',
};

/** Post-2021 authoritative polling unit counts by LGA across Kwara South. */
export const POST_2021_PUS_BY_LGA: Record<string, number> = {
  '04': 76,  // Ekiti      (was 66,  +10)
  '05': 236, // Ifelodun   (was 197, +39)
  '09': 158, // Irepodun   (was 133, +25)
  '10': 80,  // Isin       (was 68,  +12)
  '13': 173, // Offa       (was 86,  +87)
  '14': 76,  // Oke-Ero    (was 63,  +13)
  '15': 108, // Oyun       (was 69,  +39)
};

export const CURRENT_DISTRICT_PU_TOTAL = Object.values(POST_2021_PUS_BY_LGA).reduce(
  (sum, n) => sum + n,
  0
);

export const pollingUnitRoll = {
  /** Authoritative Kwara South total after the 2021 expansion (907). */
  currentTotal: CURRENT_DISTRICT_PU_TOTAL,
  /** Units enumerated to ward level in the bundled 2015 directory (682). */
  enumerated: pollingUnits.length,
  /** Converted voting points whose ward-level mapping we do not yet hold (225). */
  unallocated: CURRENT_DISTRICT_PU_TOTAL - pollingUnits.length,
  byLga: POST_2021_PUS_BY_LGA,
  provenance: PU_EXPANSION_2021,
  note:
    'INEC converted 225 voting points to full polling units across Kwara South in 2021, lifting ' +
    'the district from 682 to 907 (with Offa alone jumping from 86 to 173). Per-LGA totals are ' +
    'confirmed, but the ward-level allocation of those 225 units is not in the 2015 directory, so ' +
    'they are included in the coverage denominator while remaining unplaced on the ward map.',
} as const;

export const registeredVoters = {
  /** Sum of implied 2023 registered voters across Kwara South's 7 LGAs (derived, not declared). */
  implied2023District: 500_664,
  stateConfirmed2023: 1_695_927,
  stateCvrPhaseThreeAdditions: 99_350,
  cvrNote:
    'State-wide CVR phase III recorded 99,350 new registrations across Kwara for the 2027 cycle; ' +
    'per-LGA cleaned figures for Kwara South must be obtained from INEC Kwara before final agent ' +
    'deployment.',
  provenance: {
    kind: 'official',
    publisher: 'Independent National Electoral Commission (INEC)',
    document: '2023 voter register proxy & 2027 CVR returns',
    revision: '2023 proxy; CVR to July 2026',
    staleness:
      'Final 2027 Kwara South LGA register not yet published. Implied 2023 total is derived from ' +
      'valid votes ÷ published turnout.',
  } satisfies Provenance,
} as const;
