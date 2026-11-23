/**
 * War room aggregates — Kwara South Senatorial District.
 *
 * Derives ward-level effective control across the 83 wards and rolls up by Kwara South's two
 * federal constituencies and seven LGAs so the overview, power map, and reconciliation surfaces
 * share one consistent set of numbers.
 */

import {
  FEDERAL_CONSTITUENCIES,
  constituencyOfLga,
  lgas,
  wards,
  type FederalConstituencyId,
  type Lga,
} from '@/lib/geography';
import { POST_2021_PUS_BY_LGA } from '@/lib/geography/roll';
import { summarise, type PipelineSummary, type Stakeholder } from '@/lib/party/reconciliation';
import { deriveWardControl, type RosterEntry, type WardControl } from '@/lib/party/structure';
import { sourced, type Provenance, type Sourced } from '@/lib/provenance';

export interface ConstituencyAnalysis {
  id: FederalConstituencyId;
  name: string;
  shortName: string;
  lgas: Lga[];
  wardCount: number;
  control: Record<WardControl['risk'], number>;
  meanControl: number;
  openStakeholders: number;
  wardsAtStake: number;
  wardShare: number;
  pollingUnitShare: number;
  allocationGapPoints: number;
  pollingUnitCount: number;
}

export interface WarRoomAnalysis {
  wardControl: Map<string, WardControl>;
  control: Record<WardControl['risk'], number>;
  meanControl: number;
  constituencies: ConstituencyAnalysis[];
  pipeline: PipelineSummary;
  orphanWards: string[];
}

export function analyse(
  entries: RosterEntry[],
  stakeholders: Stakeholder[]
): WarRoomAnalysis {
  const wardControl = new Map<string, WardControl>();
  for (const ward of wards) {
    wardControl.set(ward.id, deriveWardControl(ward.id, entries));
  }

  const control = { held: 0, contested: 0, exposed: 0, vacant: 0 };
  let controlSum = 0;
  for (const c of wardControl.values()) {
    control[c.risk] += 1;
    controlSum += c.effectiveControl;
  }

  const open = stakeholders.filter((s) => s.stage !== 'reconciled' && s.stage !== 'refused');
  const claimedWards = new Set<string>();
  for (const s of open) for (const w of s.carriesWardIds) claimedWards.add(w);

  const districtPollingUnits = lgas.reduce(
    (s, l) => s + (POST_2021_PUS_BY_LGA[l.code] ?? l.declaredPollingUnitCount),
    0
  );

  const constituencies: ConstituencyAnalysis[] = FEDERAL_CONSTITUENCIES.map((fc) => {
    const fcLgas = lgas.filter((l) => fc.lgaCodes.includes(l.code));
    const fcWards = wards.filter((w) => fc.lgaCodes.includes(w.lgaCode));
    const fcControl = { held: 0, contested: 0, exposed: 0, vacant: 0 };
    let sum = 0;
    for (const w of fcWards) {
      const c = wardControl.get(w.id);
      if (!c) continue;
      fcControl[c.risk] += 1;
      sum += c.effectiveControl;
    }
    const fcStakeholders = open.filter((s) => s.constituencyId === fc.id);
    const atStake = new Set<string>();
    for (const s of fcStakeholders) for (const w of s.carriesWardIds) atStake.add(w);

    const pollingUnitCount = fcLgas.reduce(
      (s, l) => s + (POST_2021_PUS_BY_LGA[l.code] ?? l.declaredPollingUnitCount),
      0
    );
    const wardShare = wards.length ? fcWards.length / wards.length : 0;
    const pollingUnitShare = districtPollingUnits ? pollingUnitCount / districtPollingUnits : 0;

    return {
      id: fc.id,
      name: fc.name,
      shortName: fc.shortName,
      lgas: fcLgas,
      wardCount: fcWards.length,
      control: fcControl,
      meanControl: fcWards.length ? sum / fcWards.length : 0,
      openStakeholders: fcStakeholders.length,
      wardsAtStake: atStake.size,
      wardShare,
      pollingUnitShare,
      allocationGapPoints: (pollingUnitShare - wardShare) * 100,
      pollingUnitCount,
    };
  });

  const orphanWards = wards
    .filter((w) => {
      const c = wardControl.get(w.id);
      return c && (c.risk === 'vacant' || c.risk === 'exposed') && !claimedWards.has(w.id);
    })
    .map((w) => w.id);

  return {
    wardControl,
    control,
    meanControl: wards.length ? controlSum / wards.length : 0,
    constituencies,
    pipeline: summarise(stakeholders),
    orphanWards,
  };
}

export function derived<T extends number | string>(
  value: T,
  formula: string,
  inputs: Provenance[]
): Sourced<T> {
  return sourced(value, { kind: 'derived', formula, inputs });
}

export function constituencyOf(lgaCode: string): FederalConstituencyId | undefined {
  return constituencyOfLga(lgaCode)?.id;
}
