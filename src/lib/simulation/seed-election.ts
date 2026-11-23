/**
 * Seeded election-day state — M4 (Kwara South Senate · Saturday, 16 January 2027).
 *
 * Models a live mid-count parallel tally across Kwara South's 682 ward-enumerated polling units
 * reported honestly against the authoritative 907 post-2021 denominator. Uses the actual major
 * party codes on the INEC 2027 Kwara South Senate ballot (PDP, APC, ADC, SDP).
 */

import { campaignConfig } from '@/config/campaign.config';
import { constituencyOfLga, lgas, pollingUnits, wards } from '@/lib/geography';
import {
  routeIncident,
  type Agent,
  type AgentStatus,
  type CitizenReport,
  type CitizenReportKind,
  type Incident,
  type IncidentSeverity,
  type IncidentStatus,
  type IncidentType,
  type ResultSubmission,
} from '@/lib/election';
import { jitteredPoint, personName, pick, rng, weighted } from '@/lib/simulation/rng';

export const PARTY_CODES = ['PDP', 'APC', 'ADC', 'SDP'] as const;

/**
 * Simulated mid-count strength per sub-bloc reflecting a tightly fought Kwara South race where
 * PDP consolidation (including Popoola's Offa base) makes the seat competitive.
 */
const STRENGTH_BY_LGA: Record<string, Record<string, number>> = {
  '13': { PDP: 0.50, APC: 0.36, ADC: 0.08, SDP: 0.06 }, // Offa (principal's home LGA)
  '15': { PDP: 0.44, APC: 0.41, ADC: 0.09, SDP: 0.06 }, // Oyun
  '05': { PDP: 0.43, APC: 0.43, ADC: 0.08, SDP: 0.06 }, // Ifelodun (battleground)
  '09': { PDP: 0.41, APC: 0.43, ADC: 0.10, SDP: 0.06 }, // Irepodun (Omu-Aran)
  '10': { PDP: 0.42, APC: 0.42, ADC: 0.10, SDP: 0.06 }, // Isin
  '04': { PDP: 0.41, APC: 0.44, ADC: 0.09, SDP: 0.06 }, // Ekiti
  '14': { PDP: 0.39, APC: 0.46, ADC: 0.09, SDP: 0.06 }, // Oke-Ero
};

const DEFAULT_STRENGTH: Record<string, number> = {
  PDP: 0.43,
  APC: 0.42,
  ADC: 0.09,
  SDP: 0.06,
};

const AGENT_STATUS_TABLE: [AgentStatus, number][] = [
  ['checked_in', 71],
  ['deployed', 13],
  ['accredited', 7],
  ['unreachable', 5],
  ['nominated', 3],
  ['stood_down', 1],
];

// Election day: Saturday, 16 January 2027 (month index 0 = January).
const ELECTION_YEAR = 2027;
const ELECTION_MONTH = 0;
const ELECTION_DAY = 16;

export function seedAgents(seedText = campaignConfig.simulation.seed): Agent[] {
  const r = rng(`${seedText}:agents`);
  const out: Agent[] = [];

  for (const pu of pollingUnits) {
    const status = weighted(r, AGENT_STATUS_TABLE);
    const accredited = status !== 'nominated';
    out.push({
      id: `ag-${pu.id}`,
      name: personName(r),
      phone: `080${Math.floor(r() * 90_000_000 + 10_000_000)}`,
      pollingUnitId: pu.id,
      wardId: `${pu.lgaCode}-${pu.wardCode}`,
      lgaCode: pu.lgaCode,
      status,
      accreditationRef: accredited ? `KS/PDP/AG/${pu.id}` : undefined,
      checkedInAt:
        status === 'checked_in'
          ? new Date(
              Date.UTC(ELECTION_YEAR, ELECTION_MONTH, ELECTION_DAY, 7, Math.floor(r() * 55))
            ).toISOString()
          : undefined,
    });
  }

  return out;
}

export function seedSubmissions(
  agents: Agent[],
  seedText = campaignConfig.simulation.seed
): ResultSubmission[] {
  const r = rng(`${seedText}:results`);
  const out: ResultSubmission[] = [];

  const checkedIn = agents.filter((a) => a.status === 'checked_in');

  for (const agent of checkedIn) {
    // Mid-count: ~80% of checked-in agents have transmitted EC8As so far.
    if (r() > 0.8) continue;

    const strength = STRENGTH_BY_LGA[agent.lgaCode] ?? DEFAULT_STRENGTH;
    const fc = constituencyOfLga(agent.lgaCode)?.id;

    const registered = 360 + Math.floor(r() * 540);
    const turnout = 0.24 + r() * 0.24;
    const accreditedVoters = Math.floor(registered * turnout);
    const rejected = Math.floor(accreditedVoters * (0.01 + r() * 0.03));
    const valid = accreditedVoters - rejected;

    const raw = PARTY_CODES.map((p) => Math.max(0.01, strength[p] + (r() - 0.5) * 0.2));
    const sum = raw.reduce((a, b) => a + b, 0);
    const votes: Record<string, number> = {};
    let assigned = 0;
    PARTY_CODES.forEach((p, i) => {
      const v = i === PARTY_CODES.length - 1 ? valid - assigned : Math.floor((raw[i] / sum) * valid);
      votes[p] = Math.max(0, v);
      assigned += votes[p];
    });

    const syncedLate = r() < (fc === 'ekiti_irepodun_isin_oke_ero' ? 0.22 : 0.14);
    const captured = new Date(
      Date.UTC(ELECTION_YEAR, ELECTION_MONTH, ELECTION_DAY, 15, Math.floor(r() * 59))
    ).toISOString();

    out.push({
      id: `rs-${agent.pollingUnitId}`,
      pollingUnitId: agent.pollingUnitId,
      wardId: agent.wardId,
      lgaCode: agent.lgaCode,
      agentId: agent.id,
      agentName: agent.name,
      votes,
      registeredVoters: registered,
      accreditedVoters,
      rejectedBallots: rejected,
      form: {
        imageRef: `ec8a/ks2027/${agent.pollingUnitId}.jpg`,
        ...jitteredPoint(r, agent.lgaCode, 0.05),
        accuracyMetres: Math.round(4 + r() * 18),
        capturedAt: captured,
        syncedLate,
      },
      submittedAt: syncedLate
        ? new Date(
            Date.UTC(ELECTION_YEAR, ELECTION_MONTH, ELECTION_DAY, 19, Math.floor(r() * 59))
          ).toISOString()
        : captured,
    });
  }

  const disputeCount = Math.max(3, Math.floor(out.length * 0.008));
  for (let i = 0; i < disputeCount && i < out.length; i++) {
    const idx = Math.floor(r() * out.length);
    const s = out[idx];
    if (s.disputed) continue;
    const a = s.accreditedVoters;
    s.disputed = {
      withSubmissionId: `rs-alt-${s.pollingUnitId}`,
      field: 'accreditedVoters',
      values: [a, a + 6 + Math.floor(r() * 34)],
    };
  }

  return out;
}

const REPORT_TABLE: [CitizenReportKind, number][] = [
  ['all_clear', 45],
  ['queue_length', 23],
  ['late_start', 16],
  ['material_shortage', 10],
  ['conduct_concern', 6],
];

const REPORT_NOTES: Record<CitizenReportKind, string[]> = {
  all_clear: ['Voting orderly at the primary school; queue moving steadily.', 'Peaceful accreditation since 08:30.'],
  queue_length: ['Long queue past midday at central ward unit.', 'Over ninety waiting on one BVAS machine.'],
  late_start: ['Materials arrived late from the LGA RAC.', 'Officials arrived at 09:35; accreditation underway.'],
  material_shortage: ['Senate ballot booklets running low at this unit.', 'Stamp pad dried out mid-morning.'],
  conduct_concern: [
    'Unaccredited party canvassers standing inside the voting perimeter.',
    'Persons recording voter names at the school gate.',
  ],
};

export function seedCitizenReports(
  seedText = campaignConfig.simulation.seed,
  count = 135
): CitizenReport[] {
  const r = rng(`${seedText}:citizen`);
  const out: CitizenReport[] = [];

  for (let i = 0; i < count; i++) {
    const ward = pick(r, wards);
    const kind = weighted(r, REPORT_TABLE);
    out.push({
      id: `cr-${i + 1}`,
      kind,
      wardId: ward.id,
      lgaCode: ward.lgaCode,
      note: pick(r, REPORT_NOTES[kind]),
      submittedAt: new Date(
        Date.UTC(
          ELECTION_YEAR,
          ELECTION_MONTH,
          ELECTION_DAY,
          8 + Math.floor(r() * 10),
          Math.floor(r() * 59)
        )
      ).toISOString(),
      corroborations: 1 + Math.floor(r() * 4),
    });
  }

  return out;
}

const INCIDENT_TABLE: [IncidentType, number][] = [
  ['late_start', 26],
  ['bvas_failure', 21],
  ['material_failure', 15],
  ['obstruction', 12],
  ['intimidation', 10],
  ['vote_buying', 9],
  ['violence', 3],
  ['other', 4],
];

const SEVERITY_TABLE: [IncidentSeverity, number][] = [
  ['low', 40],
  ['medium', 35],
  ['high', 19],
  ['critical', 6],
];

const STATUS_TABLE: [IncidentStatus, number][] = [
  ['resolved', 35],
  ['actioned', 22],
  ['acknowledged', 19],
  ['open', 18],
  ['unfounded', 6],
];

const INCIDENT_NOTES: Record<IncidentType, string> = {
  violence: 'Scuffle near the school gate; security personnel intervened and voting resumed.',
  intimidation: 'Group of youths stationed outside perimeter questioning incoming voters.',
  vote_buying: 'Cash inducement reported along the approach road outside the unit.',
  material_failure: 'Senate result sheets (EC8A) short at collation handover.',
  bvas_failure: 'BVAS unit struggling to authenticate fingerprints; queue stalled.',
  late_start: 'RAC dispatch delayed along rural feeder road; voting started past 09:45.',
  obstruction: 'Accredited PDP agent briefly barred from viewing tally sheet.',
  other: 'Reported irregularity requiring LGA legal desk review.',
};

export function seedIncidents(
  seedText = campaignConfig.simulation.seed,
  count = 42
): Incident[] {
  const r = rng(`${seedText}:incidents`);
  const out: Incident[] = [];

  for (let i = 0; i < count; i++) {
    const ward = pick(r, wards);
    const type = weighted(r, INCIDENT_TABLE);
    const severity = weighted(r, SEVERITY_TABLE);
    const status = weighted(r, STATUS_TABLE);
    const desk = routeIncident(type, severity);
    const tier = r() < 0.74 ? 'agent' : 'citizen';

    const reportedAt = new Date(
      Date.UTC(
        ELECTION_YEAR,
        ELECTION_MONTH,
        ELECTION_DAY,
        7 + Math.floor(r() * 11),
        Math.floor(r() * 59)
      )
    );

    const log: Incident['log'] = [
      {
        at: reportedAt.toISOString(),
        by: tier === 'agent' ? 'Polling agent' : 'Citizen report',
        note: 'Reported.',
        status: 'open',
      },
    ];

    const progression: IncidentStatus[] = ['acknowledged', 'actioned', 'resolved'];
    const target = progression.indexOf(status);
    for (let s = 0; s <= target; s++) {
      log.push({
        at: new Date(reportedAt.getTime() + (s + 1) * (12 + r() * 40) * 60_000).toISOString(),
        by: `${desk} desk`,
        note:
          progression[s] === 'acknowledged'
            ? 'Picked up by the KS2027 desk.'
            : progression[s] === 'actioned'
              ? 'Dispatched to LGA field team.'
              : 'Closed. Outcome logged and agent notified.',
        status: progression[s],
      });
    }
    if (status === 'unfounded') {
      log.push({
        at: new Date(reportedAt.getTime() + 42 * 60_000).toISOString(),
        by: `${desk} desk`,
        note: 'Verified against second accredited agent; not substantiated.',
        status: 'unfounded',
      });
    }

    out.push({
      id: `in-${i + 1}`,
      type,
      severity,
      wardId: ward.id,
      lgaCode: ward.lgaCode,
      reportedBy: personName(r),
      tier,
      description: INCIDENT_NOTES[type],
      reportedAt: reportedAt.toISOString(),
      desk,
      status,
      log,
    });
  }

  return out.sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));
}

export const lgaName = (code: string) => lgas.find((l) => l.code === code)?.name ?? code;
