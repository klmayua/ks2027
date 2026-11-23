/**
 * Directives and channels — M2 (Kwara South Senatorial District).
 *
 * Scopes directives strictly across Kwara South's 83 wards: district-wide, by federal constituency,
 * by LGA (7), by ward, or by wing (women, youth, elders). Channel membership derives directly from
 * the org chart so revoking a ward office revokes access immediately.
 */

import {
  FEDERAL_CONSTITUENCIES,
  lgas,
  wards,
  type FederalConstituencyId,
} from '@/lib/geography';

export type DirectiveScope =
  | { kind: 'district' }
  | { kind: 'constituency'; constituencyIds: FederalConstituencyId[] }
  | { kind: 'lga'; lgaCodes: string[] }
  | { kind: 'ward'; wardIds: string[] }
  | { kind: 'wing'; wing: 'women' | 'youth' | 'elders' };

export type DirectivePriority = 'routine' | 'priority' | 'urgent';

export interface Directive {
  id: string;
  reference: string;
  title: string;
  body: string;
  issuedByRole: string;
  issuedByName: string;
  scope: DirectiveScope;
  priority: DirectivePriority;
  issuedAt: string;
  ackDeadline?: string;
  requiresAck: boolean;
  task?: {
    instruction: string;
    requiresProof: boolean;
  };
}

export interface Acknowledgement {
  directiveId: string;
  wardId: string;
  byPersonName: string;
  byRole: string;
  at: string;
}

export interface TaskCompletion {
  directiveId: string;
  wardId: string;
  byPersonName: string;
  at: string;
  proof?: {
    caption: string;
    lat: number;
    lng: number;
    accuracyMetres: number;
    capturedAt: string;
  };
}

export function resolveScope(scope: DirectiveScope): string[] {
  switch (scope.kind) {
    case 'district':
      return wards.map((w) => w.id);
    case 'constituency': {
      const codes = new Set(
        FEDERAL_CONSTITUENCIES.filter((fc) => scope.constituencyIds.includes(fc.id)).flatMap(
          (fc) => fc.lgaCodes
        )
      );
      return wards.filter((w) => codes.has(w.lgaCode)).map((w) => w.id);
    }
    case 'lga': {
      const codes = new Set(scope.lgaCodes);
      return wards.filter((w) => codes.has(w.lgaCode)).map((w) => w.id);
    }
    case 'ward':
      return scope.wardIds;
    case 'wing':
      return wards.map((w) => w.id);
  }
}

export function describeScope(scope: DirectiveScope): string {
  switch (scope.kind) {
    case 'district':
      return 'All 83 wards, Kwara South';
    case 'constituency':
      return FEDERAL_CONSTITUENCIES.filter((fc) => scope.constituencyIds.includes(fc.id))
        .map((fc) => fc.shortName)
        .join(', ');
    case 'lga':
      return scope.lgaCodes
        .map((c) => lgas.find((l) => l.code === c)?.name ?? c)
        .join(', ');
    case 'ward':
      return `${scope.wardIds.length} ward${scope.wardIds.length === 1 ? '' : 's'}`;
    case 'wing':
      return `${scope.wing[0].toUpperCase()}${scope.wing.slice(1)} wing, Kwara South`;
  }
}

export interface DirectiveCoverage {
  directiveId: string;
  targetWards: number;
  acknowledged: number;
  rate: number;
  silentWardIds: string[];
  byLga: { lgaCode: string; target: number; acked: number }[];
  completions: number;
  completionsWithProof: number;
}

export function coverageFor(
  directive: Directive,
  acks: Acknowledgement[],
  completions: TaskCompletion[] = []
): DirectiveCoverage {
  const target = resolveScope(directive.scope);
  const targetSet = new Set(target);
  const ackedWards = new Set(
    acks.filter((a) => a.directiveId === directive.id && targetSet.has(a.wardId)).map((a) => a.wardId)
  );

  const byLgaMap = new Map<string, { target: number; acked: number }>();
  for (const wardId of target) {
    const lgaCode = wardId.split('-')[0];
    const row = byLgaMap.get(lgaCode) ?? { target: 0, acked: 0 };
    row.target += 1;
    if (ackedWards.has(wardId)) row.acked += 1;
    byLgaMap.set(lgaCode, row);
  }

  const mine = completions.filter((c) => c.directiveId === directive.id);

  return {
    directiveId: directive.id,
    targetWards: target.length,
    acknowledged: ackedWards.size,
    rate: target.length ? ackedWards.size / target.length : 0,
    silentWardIds: target.filter((w) => !ackedWards.has(w)),
    byLga: [...byLgaMap.entries()]
      .map(([lgaCode, v]) => ({ lgaCode, ...v }))
      .sort((a, b) => a.lgaCode.localeCompare(b.lgaCode)),
    completions: mine.length,
    completionsWithProof: mine.filter((c) => c.proof).length,
  };
}

export interface Channel {
  id: string;
  name: string;
  level: 'senatorial' | 'constituency' | 'lga' | 'ward' | 'wing';
  memberCountEstimate: number;
}

export function deriveChannels(): Channel[] {
  const out: Channel[] = [
    {
      id: 'ch-ks-council',
      name: 'Kwara South Campaign Council',
      level: 'senatorial',
      memberCountEstimate: 8 + lgas.length * 2,
    },
  ];

  for (const fc of FEDERAL_CONSTITUENCIES) {
    out.push({
      id: `ch-fc-${fc.id}`,
      name: `${fc.shortName} coordination`,
      level: 'constituency',
      memberCountEstimate: 6 + fc.lgaCodes.length * 13,
    });
  }

  for (const lga of lgas) {
    out.push({
      id: `ch-lga-${lga.code}`,
      name: `${lga.name} LGA executive`,
      level: 'lga',
      memberCountEstimate: 13 + lga.declaredWardCount * 8,
    });
  }

  for (const ward of wards) {
    out.push({
      id: `ch-ward-${ward.id}`,
      name: ward.name,
      level: 'ward',
      memberCountEstimate: 8 + ward.declaredPollingUnitCount,
    });
  }

  for (const wing of ['Women', 'Youth', 'Elders']) {
    out.push({
      id: `ch-wing-${wing.toLowerCase()}`,
      name: `${wing} wing, Kwara South`,
      level: 'wing',
      memberCountEstimate: wards.length * 2,
    });
  }

  return out;
}

export const PRIORITY_LABELS: Record<DirectivePriority, string> = {
  routine: 'Routine',
  priority: 'Priority',
  urgent: 'Urgent',
};
