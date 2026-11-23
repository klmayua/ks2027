/**
 * Senatorial Commitments — M5 (Kwara South Senatorial District).
 *
 * A commitment made on the 2027 Senate trail carries a permanent identifier (`KS-*`) into the
 * 11th National Assembly term — covering bills/motions, zonal intervention projects, federal
 * agency oversight (FERMA, UBEC, rural health/security), and quarterly constituency reporting.
 */

import { getLga, getWard } from '@/lib/geography';

export type CommitmentCategory =
  | 'security'
  | 'roads'
  | 'agriculture'
  | 'youth'
  | 'health'
  | 'water'
  | 'education'
  | 'women'
  | 'power'
  | 'governance';

export const CATEGORY_LABELS: Record<CommitmentCategory, string> = {
  security: 'Community security',
  roads: 'Federal roads & access',
  agriculture: 'Agriculture',
  youth: 'Youth & jobs',
  health: 'Healthcare',
  water: 'Rural water',
  education: 'Education',
  women: 'Market & women',
  power: 'Rural power',
  governance: 'Constituency accountability',
};

const CATEGORY_CODE: Record<CommitmentCategory, string> = {
  security: 'SEC',
  roads: 'RDS',
  agriculture: 'AGR',
  youth: 'YTH',
  health: 'HLT',
  water: 'WAT',
  education: 'EDU',
  women: 'WMN',
  power: 'PWR',
  governance: 'GOV',
};

export function commitmentId(category: CommitmentCategory, sequence: number): string {
  return `KS-${CATEGORY_CODE[category]}-${String(sequence).padStart(3, '0')}`;
}

export type CommitmentPhase = 'campaign' | 'senate_term';

export type CommitmentStatus =
  | 'proposed'
  | 'committed'
  | 'not_started'
  | 'in_progress'
  | 'delivered'
  | 'delayed'
  | 'revised'
  | 'abandoned';

export const STATUS_LABELS: Record<CommitmentStatus, string> = {
  proposed: 'Proposed',
  committed: 'Committed',
  not_started: 'Not started',
  in_progress: 'In progress',
  delivered: 'Delivered',
  delayed: 'Delayed',
  revised: 'Revised',
  abandoned: 'Abandoned',
};

export interface Milestone {
  id: string;
  label: string;
  dueBy: string;
  completedAt?: string;
  proof?: {
    caption: string;
    lat: number;
    lng: number;
    capturedAt: string;
  };
}

export interface Commitment {
  id: string;
  title: string;
  category: CommitmentCategory;
  /** Legislative / oversight / zonal mechanism so voters know what a Senator actually controls. */
  instrument: string;
  rationale: string;
  wardIds: string[];
  estimatedCostNgn: number;
  targetYear: number;
  phase: CommitmentPhase;
  status: CommitmentStatus;
  milestones: Milestone[];
  revisionNote?: string;
  createdAt: string;
  updatedAt: string;
}

export function progressOf(c: Commitment): number {
  if (c.milestones.length === 0) return 0;
  return c.milestones.filter((m) => m.completedAt).length / c.milestones.length;
}

export function proofCount(c: Commitment): number {
  return c.milestones.filter((m) => m.proof).length;
}

export function lgaCodesOf(c: Commitment): string[] {
  return [...new Set(c.wardIds.map((w) => w.split('-')[0]))];
}

export function describeReach(c: Commitment): string {
  const lgaCodes = lgaCodesOf(c);
  if (c.wardIds.length === 0) return 'All 7 LGAs · Kwara South';
  if (lgaCodes.length === 1) {
    const lga = getLga(lgaCodes[0]);
    return `${c.wardIds.length} ward${c.wardIds.length === 1 ? '' : 's'} · ${lga?.name ?? ''}`;
  }
  return `${c.wardIds.length} wards across ${lgaCodes.length} LGAs`;
}

export function wardNames(c: Commitment, limit = 4): string {
  const names = c.wardIds.slice(0, limit).map((id) => getWard(id)?.name ?? id);
  const extra = c.wardIds.length - names.length;
  return names.join(', ') + (extra > 0 ? ` +${extra} more` : '');
}

export interface ScorecardSummary {
  total: number;
  byStatus: Record<CommitmentStatus, number>;
  totalCostNgn: number;
  meanProgress: number;
  delivered: number;
  offTrack: number;
  withProof: number;
}

export function summarise(commitments: Commitment[]): ScorecardSummary {
  const byStatus = {
    proposed: 0,
    committed: 0,
    not_started: 0,
    in_progress: 0,
    delivered: 0,
    delayed: 0,
    revised: 0,
    abandoned: 0,
  } satisfies Record<CommitmentStatus, number>;

  let cost = 0;
  let progressSum = 0;
  let termPhase = 0;

  for (const c of commitments) {
    byStatus[c.status] += 1;
    cost += c.estimatedCostNgn;
    if (c.phase === 'senate_term') {
      progressSum += progressOf(c);
      termPhase += 1;
    }
  }

  return {
    total: commitments.length,
    byStatus,
    totalCostNgn: cost,
    meanProgress: termPhase ? progressSum / termPhase : 0,
    delivered: byStatus.delivered,
    offTrack: byStatus.delayed + byStatus.abandoned + byStatus.revised,
    withProof: commitments.filter((c) => proofCount(c) > 0).length,
  };
}

export function formatNaira(amount: number): string {
  if (amount === 0) return 'Legislative / oversight';
  if (amount >= 1_000_000_000) return `₦${(amount / 1_000_000_000).toFixed(1)}bn`;
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(0)}m`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(0)}k`;
  return `₦${amount}`;
}
