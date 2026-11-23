/**
 * Reconciliation pipeline — Kwara South Senatorial District (PDP).
 *
 * After a contested primary and Popoola's late-2025 reunification with the PDP/Saraki structure
 * from his 2023 SDP base, the binding constraint on winning Kwara South is unifying legacy PDP
 * ward chairs, returning SDP structures, and Igbomina/Ekiti bloc leaders behind one ballot push.
 */

import type { FederalConstituencyId } from '@/lib/geography';

export type ReconciliationStage =
  | 'identified'
  | 'assigned'
  | 'engaged'
  | 'ask_tabled'
  | 'agreed'
  | 'reconciled'
  | 'refused';

export const STAGE_ORDER: ReconciliationStage[] = [
  'identified',
  'assigned',
  'engaged',
  'ask_tabled',
  'agreed',
  'reconciled',
];

export const STAGE_LABELS: Record<ReconciliationStage, string> = {
  identified: 'Identified',
  assigned: 'Handler assigned',
  engaged: 'Engaged',
  ask_tabled: 'Ask tabled',
  agreed: 'Terms agreed',
  reconciled: 'Reconciled',
  refused: 'Refused',
};

export type StakeholderKind =
  | 'senatorial_aspirant'
  | 'legislator_serving'
  | 'legislator_former'
  | 'party_officer'
  | 'traditional'
  | 'financier'
  | 'union_association'
  | 'other';

export const KIND_LABELS: Record<StakeholderKind, string> = {
  senatorial_aspirant: 'Senatorial aspirant',
  legislator_serving: 'Serving legislator',
  legislator_former: 'Former legislator',
  party_officer: 'Party officer',
  traditional: 'Traditional leader',
  financier: 'Financier',
  union_association: 'Union / association',
  other: 'Other',
};

export type AskCategory =
  | 'position'
  | 'recognition'
  | 'process_review'
  | 'financial'
  | 'constituency_commitment'
  | 'none_stated';

export const ASK_LABELS: Record<AskCategory, string> = {
  position: 'Campaign council role',
  recognition: 'Public recognition',
  process_review: 'Harmonisation of ward exco',
  financial: 'Mobilisation logistics',
  constituency_commitment: 'Constituency commitment',
  none_stated: 'None stated',
};

export interface ContactLogEntry {
  id: string;
  at: string;
  byHandlerId: string;
  channel: 'in_person' | 'phone' | 'emissary' | 'written';
  note: string;
  movedToStage?: ReconciliationStage;
}

export interface Stakeholder {
  id: string;
  name: string;
  kind: StakeholderKind;
  bloc?: string;
  constituencyId: FederalConstituencyId;
  lgaCode: string;
  carriesWardIds: string[];
  stage: ReconciliationStage;
  ask: AskCategory;
  askDetail?: string;
  handlerId?: string;
  contactLog: ContactLogEntry[];
  refusalNote?: string;
  updatedAt: string;
}

const KIND_WEIGHT: Record<StakeholderKind, number> = {
  senatorial_aspirant: 3,
  legislator_serving: 2.5,
  legislator_former: 2,
  party_officer: 1.5,
  financier: 1.5,
  traditional: 1.25,
  union_association: 1.25,
  other: 1,
};

export function reconciliationWeight(s: Stakeholder): number {
  return s.carriesWardIds.length * KIND_WEIGHT[s.kind];
}

export function byPriority(stakeholders: Stakeholder[]): Stakeholder[] {
  return [...stakeholders].sort((a, b) => reconciliationWeight(b) - reconciliationWeight(a));
}

export function daysSinceContact(s: Stakeholder, now: Date = new Date()): number | null {
  const last = s.contactLog.at(-1);
  if (!last) return null;
  return Math.floor((now.getTime() - new Date(last.at).getTime()) / 86_400_000);
}

export function stalled(
  stakeholders: Stakeholder[],
  thresholdDays = 14,
  now: Date = new Date()
): Stakeholder[] {
  return byPriority(
    stakeholders.filter((s) => {
      if (s.stage === 'reconciled' || s.stage === 'refused') return false;
      const days = daysSinceContact(s, now);
      return days === null || days >= thresholdDays;
    })
  );
}

export interface PipelineSummary {
  total: number;
  byStage: Record<ReconciliationStage, number>;
  wardsAtStake: number;
  wardsRecovered: number;
  stalledCount: number;
}

export function summarise(
  stakeholders: Stakeholder[],
  now: Date = new Date()
): PipelineSummary {
  const byStage = {
    identified: 0,
    assigned: 0,
    engaged: 0,
    ask_tabled: 0,
    agreed: 0,
    reconciled: 0,
    refused: 0,
  } satisfies Record<ReconciliationStage, number>;

  const atStake = new Set<string>();
  const recovered = new Set<string>();

  for (const s of stakeholders) {
    byStage[s.stage] += 1;
    const target = s.stage === 'reconciled' ? recovered : atStake;
    for (const w of s.carriesWardIds) target.add(w);
  }

  for (const w of atStake) recovered.delete(w);

  return {
    total: stakeholders.length,
    byStage,
    wardsAtStake: atStake.size,
    wardsRecovered: recovered.size,
    stalledCount: stalled(stakeholders, 14, now).length,
  };
}
