/**
 * Election day — M4 (Kwara South Senatorial District · 16 January 2027).
 *
 * Two rules shape everything here:
 * 1. The evidence is primary, the number is derived — every figure traces to a photographed EC8A.
 * 2. Two tiers, never mixed — accredited polling agents feed the tally; open citizen reports
 *    corroborate and raise incidents but never enter the count.
 *
 * Coverage uses Kwara South's authoritative post-2021 denominator (907 PUs), while stating plainly
 * that 682 are ward-enumerated in the 2015 directory and 225 remain unallocated.
 */

import { lgas, pollingUnits, wards } from '@/lib/geography';
import { POST_2021_PUS_BY_LGA, pollingUnitRoll } from '@/lib/geography/roll';

export type AgentStatus =
  | 'nominated'
  | 'accredited'
  | 'deployed'
  | 'checked_in'
  | 'unreachable'
  | 'stood_down';

export const AGENT_STATUS_LABELS: Record<AgentStatus, string> = {
  nominated: 'Nominated',
  accredited: 'Accredited',
  deployed: 'Deployed',
  checked_in: 'Checked in',
  unreachable: 'Unreachable',
  stood_down: 'Stood down',
};

export interface Agent {
  id: string;
  name: string;
  phone: string;
  pollingUnitId: string;
  wardId: string;
  lgaCode: string;
  status: AgentStatus;
  checkedInAt?: string;
  accreditationRef?: string;
}

export interface ResultForm {
  imageRef: string;
  lat: number;
  lng: number;
  accuracyMetres: number;
  capturedAt: string;
  syncedLate: boolean;
}

export interface ResultSubmission {
  id: string;
  pollingUnitId: string;
  wardId: string;
  lgaCode: string;
  agentId: string;
  agentName: string;
  votes: Record<string, number>;
  registeredVoters: number;
  accreditedVoters: number;
  rejectedBallots: number;
  form: ResultForm;
  submittedAt: string;
  disputed?: {
    withSubmissionId: string;
    field: string;
    values: [number, number];
  };
}

export type CitizenReportKind =
  | 'queue_length'
  | 'late_start'
  | 'material_shortage'
  | 'conduct_concern'
  | 'all_clear';

export const CITIZEN_REPORT_LABELS: Record<CitizenReportKind, string> = {
  queue_length: 'Queue length',
  late_start: 'Late start',
  material_shortage: 'Material shortage',
  conduct_concern: 'Conduct concern',
  all_clear: 'All clear',
};

export interface CitizenReport {
  id: string;
  kind: CitizenReportKind;
  pollingUnitId?: string;
  wardId: string;
  lgaCode: string;
  note: string;
  submittedAt: string;
  corroborations: number;
}

export const CORROBORATION_THRESHOLD = 2;

export function surfaced(reports: CitizenReport[]): CitizenReport[] {
  return reports.filter((r) => r.corroborations >= CORROBORATION_THRESHOLD);
}

export type IncidentType =
  | 'violence'
  | 'intimidation'
  | 'vote_buying'
  | 'material_failure'
  | 'bvas_failure'
  | 'late_start'
  | 'obstruction'
  | 'other';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentDesk = 'legal' | 'security_liaison' | 'media' | 'operations';
export type IncidentStatus = 'open' | 'acknowledged' | 'actioned' | 'resolved' | 'unfounded';

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  open: 'Open',
  acknowledged: 'Acknowledged',
  actioned: 'Actioned',
  resolved: 'Resolved',
  unfounded: 'Unfounded',
};

export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  violence: 'Violence',
  intimidation: 'Intimidation',
  vote_buying: 'Inducement',
  material_failure: 'Material failure',
  bvas_failure: 'BVAS failure',
  late_start: 'Late start',
  obstruction: 'Obstruction of agent',
  other: 'Other',
};

export const DESK_LABELS: Record<IncidentDesk, string> = {
  legal: 'Legal',
  security_liaison: 'Security liaison',
  media: 'Media desk',
  operations: 'Operations',
};

export function routeIncident(type: IncidentType, severity: IncidentSeverity): IncidentDesk {
  if (type === 'violence' || severity === 'critical') return 'security_liaison';
  if (type === 'vote_buying' || type === 'obstruction' || type === 'intimidation') return 'legal';
  if (type === 'bvas_failure' || type === 'material_failure' || type === 'late_start')
    return 'operations';
  return severity === 'high' ? 'media' : 'operations';
}

export interface Incident {
  id: string;
  type: IncidentType;
  severity: IncidentSeverity;
  pollingUnitId?: string;
  wardId: string;
  lgaCode: string;
  reportedBy: string;
  tier: 'agent' | 'citizen';
  description: string;
  reportedAt: string;
  desk: IncidentDesk;
  status: IncidentStatus;
  log: { at: string; by: string; note: string; status: IncidentStatus }[];
}

export interface Coverage {
  totalPollingUnits: number;
  enumeratedPollingUnits: number;
  unallocatedPollingUnits: number;
  reported: number;
  rate: number;
  rateOfEnumerated: number;
  agentsCheckedIn: number;
  agentsAccredited: number;
  silentWardIds: string[];
  byLga: {
    lgaCode: string;
    total: number;
    enumerated: number;
    reported: number;
    rate: number;
  }[];
}

export function computeCoverage(
  submissions: ResultSubmission[],
  agents: Agent[]
): Coverage {
  const reportedPus = new Set(submissions.map((s) => s.pollingUnitId));

  const byLga = lgas.map((lga) => {
    const total = POST_2021_PUS_BY_LGA[lga.code] ?? lga.declaredPollingUnitCount;
    const enumerated = lga.declaredPollingUnitCount;
    const reported = submissions.filter((s) => s.lgaCode === lga.code).length;
    return { lgaCode: lga.code, total, enumerated, reported, rate: total ? reported / total : 0 };
  });

  const reportedWards = new Set(submissions.map((s) => s.wardId));
  const enumerated = pollingUnits.length;
  const total = pollingUnitRoll.currentTotal;

  return {
    totalPollingUnits: total,
    enumeratedPollingUnits: enumerated,
    unallocatedPollingUnits: pollingUnitRoll.unallocated,
    reported: reportedPus.size,
    rate: total ? reportedPus.size / total : 0,
    rateOfEnumerated: enumerated ? reportedPus.size / enumerated : 0,
    agentsCheckedIn: agents.filter((a) => a.status === 'checked_in').length,
    agentsAccredited: agents.filter((a) => a.accreditationRef).length,
    silentWardIds: wards.filter((w) => !reportedWards.has(w.id)).map((w) => w.id),
    byLga,
  };
}

export interface PartyTally {
  partyCode: string;
  votes: number;
  share: number;
}

export interface Tally {
  parties: PartyTally[];
  totalVotes: number;
  rejectedBallots: number;
  accreditedVoters: number;
  turnoutOfReporting: number;
  registeredInReporting: number;
  disputedCount: number;
}

export function computeTally(submissions: ResultSubmission[]): Tally {
  const totals = new Map<string, number>();
  let rejected = 0;
  let accredited = 0;
  let registered = 0;

  for (const s of submissions) {
    for (const [party, votes] of Object.entries(s.votes)) {
      totals.set(party, (totals.get(party) ?? 0) + votes);
    }
    rejected += s.rejectedBallots;
    accredited += s.accreditedVoters;
    registered += s.registeredVoters;
  }

  const totalVotes = [...totals.values()].reduce((a, b) => a + b, 0);

  return {
    parties: [...totals.entries()]
      .map(([partyCode, votes]) => ({
        partyCode,
        votes,
        share: totalVotes ? votes / totalVotes : 0,
      }))
      .sort((a, b) => b.votes - a.votes),
    totalVotes,
    rejectedBallots: rejected,
    accreditedVoters: accredited,
    registeredInReporting: registered,
    turnoutOfReporting: registered ? accredited / registered : 0,
    disputedCount: submissions.filter((s) => s.disputed).length,
  };
}
