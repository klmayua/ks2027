/**
 * 2023 Kwara South electoral baseline.
 *
 * Two distinct official datasets are carried side by side rather than conflated:
 *
 * 1. **2023 Kwara South Senatorial District declared totals** (25 February 2023, collated at
 *    Omu-Aran): APC 55,966 · PDP 34,950 · SDP 24,265. This is the actual Senate benchmark that
 *    Popoola Adekeye Lekan Saheed (PDP) is challenging to flip — and it contains the central
 *    strategic math of the race: PDP (34,950) + SDP (24,265) = 59,215, which exceeded APC by
 *    3,249 votes in 2023 when Popoola himself ran on the SDP ticket in Ifelodun/Offa/Oyun.
 *
 * 2. **2023 per-LGA Governorship results for the 7 Kwara South LGAs** (March 2023). Used as the
 *    per-LGA geographic vote-weight and turnout proxy until per-LGA Senate Form EC8D collation
 *    sheets are ingested from INEC Kwara. Explicitly badged as a proxy everywhere it appears.
 */

import type { Provenance } from '@/lib/provenance';
import { FEDERAL_CONSTITUENCIES, lgas, type FederalConstituencyId } from './index';
import { POST_2021_PUS_BY_LGA } from './roll';

export const SENATE_2023_PROVENANCE: Provenance = {
  kind: 'official',
  publisher: 'Independent National Electoral Commission (INEC)',
  document: '2023 Kwara South Senatorial District election — declared totals at Omu-Aran',
  revision: 'February 2023',
};

export const RESULTS_2023_PROXY_PROVENANCE: Provenance = {
  kind: 'official',
  publisher: 'Independent National Electoral Commission (INEC), via published reporting',
  document: '2023 Kwara governorship election — 7 Kwara South LGAs (geographic weight proxy)',
  revision: 'March 2023',
  staleness:
    'Per-LGA breakdown is from the March 2023 governorship poll, used as a spatial weight and ' +
    'turnout proxy until per-LGA Senate Form EC8D sheets are entered.',
};

/**
 * Declared Kwara South Senatorial District totals (25 Feb 2023, Omu-Aran collation centre).
 * Returning Officer: Prof. Ajibola Akanbi.
 */
export const SENATE_TOTALS_2023 = {
  apc: 55_966, // Senator Oyelola Ashiru (APC)
  pdp: 34_950, // Dr. Rafiu Adebayo Ibrahim (PDP)
  sdp: 24_265, // SDP senatorial candidate (cycle in which Popoola ran SDP in Ifelodun/Offa/Oyun)
  topThreeTotal: 55_966 + 34_950 + 24_265,
  apcLeadOverPdp: 55_966 - 34_950, // 21,016 votes to flip
  pdpPlusSdp: 34_950 + 24_265, // 59,215 — +3,249 ahead of APC
  pdpPlusSdpMarginOverApc: 34_950 + 24_265 - 55_966,
  collationCentre: 'Omu-Aran (Irepodun LGA)',
} as const;

export interface LgaResult2023 {
  lgaCode: string;
  apc: number;
  pdp: number;
  sdp: number;
  others: number;
  validVotes: number;
  /** As published, 0–1. */
  turnout: number;
}

/** 2023 per-LGA results for Kwara South's 7 LGAs (governorship geographic proxy). */
export const RESULTS_2023: LgaResult2023[] = [
  { lgaCode: '04', apc: 6_836, pdp: 4_273, sdp: 170, others: 319, validVotes: 11_598, turnout: 0.2692 }, // Ekiti
  { lgaCode: '05', apc: 17_599, pdp: 9_085, sdp: 1_559, others: 763, validVotes: 29_006, turnout: 0.2256 }, // Ifelodun
  { lgaCode: '09', apc: 12_860, pdp: 7_614, sdp: 1_693, others: 566, validVotes: 22_733, turnout: 0.2584 }, // Irepodun
  { lgaCode: '10', apc: 5_274, pdp: 3_400, sdp: 567, others: 197, validVotes: 9_438, turnout: 0.228 }, // Isin
  { lgaCode: '13', apc: 14_696, pdp: 6_705, sdp: 1_289, others: 841, validVotes: 23_531, turnout: 0.2462 }, // Offa
  { lgaCode: '14', apc: 7_758, pdp: 3_768, sdp: 149, others: 133, validVotes: 11_808, turnout: 0.2718 }, // Oke-Ero
  { lgaCode: '15', apc: 8_991, pdp: 5_465, sdp: 1_068, others: 656, validVotes: 16_180, turnout: 0.2681 }, // Oyun
];

const byCode = new Map(RESULTS_2023.map((r) => [r.lgaCode, r]));

export const resultFor = (lgaCode: string) => byCode.get(lgaCode);

/** Registered voters implied by valid votes ÷ published turnout. Derived, not published. */
export function impliedRegistered(r: LgaResult2023): number {
  return Math.round(r.validVotes / r.turnout);
}

export const totalValidVotes = RESULTS_2023.reduce((s, r) => s + r.validVotes, 0);
export const totalImpliedRegistered = RESULTS_2023.reduce((s, r) => s + impliedRegistered(r), 0);
export const districtProxyTurnout = totalImpliedRegistered
  ? totalValidVotes / totalImpliedRegistered
  : 0;

export const DISTRICT_PROXY_TOTALS_2023 = {
  apc: RESULTS_2023.reduce((s, r) => s + r.apc, 0),
  pdp: RESULTS_2023.reduce((s, r) => s + r.pdp, 0),
  sdp: RESULTS_2023.reduce((s, r) => s + r.sdp, 0),
  others: RESULTS_2023.reduce((s, r) => s + r.others, 0),
  validVotes: totalValidVotes,
  impliedRegistered: totalImpliedRegistered,
  turnout: districtProxyTurnout,
} as const;

/**
 * Reconciles the 2023 Senatorial declaration against the per-LGA governorship proxy and the
 * post-2021 polling unit roll, exposing every gap rather than smoothing it over.
 */
export function sourceReconciliation() {
  const enumeratedPus = lgas.reduce((s, l) => s + l.declaredPollingUnitCount, 0);
  const currentPus = Object.values(POST_2021_PUS_BY_LGA).reduce((s, n) => s + n, 0);

  return [
    {
      label: 'APC (Senate vs Gov proxy)',
      senate: SENATE_TOTALS_2023.apc,
      proxy: DISTRICT_PROXY_TOTALS_2023.apc,
      delta: SENATE_TOTALS_2023.apc - DISTRICT_PROXY_TOTALS_2023.apc,
    },
    {
      label: 'PDP (Senate vs Gov proxy)',
      senate: SENATE_TOTALS_2023.pdp,
      proxy: DISTRICT_PROXY_TOTALS_2023.pdp,
      delta: SENATE_TOTALS_2023.pdp - DISTRICT_PROXY_TOTALS_2023.pdp,
    },
    {
      label: 'SDP (Senate vs Gov proxy)',
      senate: SENATE_TOTALS_2023.sdp,
      proxy: DISTRICT_PROXY_TOTALS_2023.sdp,
      delta: SENATE_TOTALS_2023.sdp - DISTRICT_PROXY_TOTALS_2023.sdp,
    },
    {
      label: 'Polling units (2015 vs 2021)',
      senate: enumeratedPus,
      proxy: currentPus,
      delta: currentPus - enumeratedPus,
    },
  ];
}

// ---------------------------------------------------------------------------
// Allocation gap — inside Kwara South (by Federal Constituency and by LGA)
// ---------------------------------------------------------------------------

export interface ConstituencyWeight {
  id: FederalConstituencyId;
  name: string;
  shortName: string;
  wards: number;
  wardShare: number;
  votesCast: number;
  voteShare: number;
  /** voteShare − wardShare, in points. Positive = under-served by per-ward resourcing. */
  gapPoints: number;
  pdpShare: number;
  apcShare: number;
  turnout: number;
}

export function constituencyWeights(
  wardCounts: Record<FederalConstituencyId, number>
): ConstituencyWeight[] {
  const totalWards = Object.values(wardCounts).reduce((a, b) => a + b, 0);

  return FEDERAL_CONSTITUENCIES.map((fc) => {
    const rows = RESULTS_2023.filter((r) => fc.lgaCodes.includes(r.lgaCode));
    const votesCast = rows.reduce((s, r) => s + r.validVotes, 0);
    const pdp = rows.reduce((s, r) => s + r.pdp, 0);
    const apc = rows.reduce((s, r) => s + r.apc, 0);
    const registered = rows.reduce((s, r) => s + impliedRegistered(r), 0);
    const wards = wardCounts[fc.id];

    const wardShare = totalWards ? wards / totalWards : 0;
    const voteShare = totalValidVotes ? votesCast / totalValidVotes : 0;

    return {
      id: fc.id,
      name: fc.name,
      shortName: fc.shortName,
      wards,
      wardShare,
      votesCast,
      voteShare,
      gapPoints: (voteShare - wardShare) * 100,
      pdpShare: votesCast ? pdp / votesCast : 0,
      apcShare: votesCast ? apc / votesCast : 0,
      turnout: registered ? votesCast / registered : 0,
    };
  });
}

export interface LgaWeight {
  lgaCode: string;
  name: string;
  wards: number;
  wardShare: number;
  validVotes: number;
  voteShare: number;
  /** voteShare − wardShare in percentage points. Positive = under-served by equal per-ward spend. */
  gapPoints: number;
  apc: number;
  pdp: number;
  sdp: number;
  others: number;
  pdpShare: number;
  apcShare: number;
  turnout: number;
  registered: number;
  currentPus: number;
  enumeratedPus: number;
}

/** LGAs ranked by 2023 votes cast — the list a Kwara South campaign must actually work down. */
export function lgasByWeight(): LgaWeight[] {
  const totalWards = lgas.reduce((s, l) => s + l.declaredWardCount, 0) || 1;

  return [...RESULTS_2023]
    .map((r) => {
      const lga = lgas.find((l) => l.code === r.lgaCode);
      const wardCount = lga?.declaredWardCount ?? 0;
      const wardShare = wardCount / totalWards;
      const voteShare = totalValidVotes ? r.validVotes / totalValidVotes : 0;
      return {
        ...r,
        name: lga?.name ?? r.lgaCode,
        wards: wardCount,
        wardShare,
        voteShare,
        gapPoints: (voteShare - wardShare) * 100,
        pdpShare: r.validVotes ? r.pdp / r.validVotes : 0,
        apcShare: r.validVotes ? r.apc / r.validVotes : 0,
        registered: impliedRegistered(r),
        currentPus: POST_2021_PUS_BY_LGA[r.lgaCode] ?? lga?.declaredPollingUnitCount ?? 0,
        enumeratedPus: lga?.declaredPollingUnitCount ?? 0,
      };
    })
    .sort((a, b) => b.validVotes - a.validVotes);
}
