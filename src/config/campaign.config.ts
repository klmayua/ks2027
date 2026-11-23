/**
 * Campaign configuration — KS2027 (Kwara South Senatorial District).
 *
 * Nothing political is hardcoded anywhere else in the codebase. The principal, party, 2027 ballot
 * context, cycle dates, priority order and simulation seed all resolve from here.
 */

import type { FederalConstituencyId } from '@/lib/geography';

export interface Principal {
  name: string;
  shortName: string;
  office: string;
  party: string;
  partyAbbreviation: string;
  /** LGA code the principal hails from — drives home-turf gravity warnings (Offa = '13'). */
  homeLgaCode: string;
  homeLgaName: string;
  homeConstituency: FederalConstituencyId;
  background: string;
}

export interface CycleMilestone {
  id: string;
  label: string;
  date: string;
  /** Source for the date, so the countdown can cite INEC rather than assert. */
  citation: string;
  kind: 'past' | 'upcoming' | 'election';
}

export interface BallotContestant {
  party: string;
  candidate: string;
  note?: string;
}

export interface CampaignConfig {
  principal: Principal;
  district: {
    code: string;
    name: string;
    state: string;
    headquarters: string;
    slogan: string;
  };
  cycle: {
    name: string;
    milestones: CycleMilestone[];
  };
  ballot2027: {
    totalCandidates: number;
    citation: string;
    notable: BallotContestant[];
  };
  zoning: {
    priorityOrder: FederalConstituencyId[];
    note: string;
  };
  simulation: {
    enabled: boolean;
    seed: string;
  };
}

const INEC_2027 = 'INEC 2027 timetable and schedule of activities';

export const campaignConfig: CampaignConfig = {
  principal: {
    name: 'Popoola Adekeye Lekan Saheed',
    shortName: 'Saheed Popoola',
    office: 'Senator, Kwara South Senatorial District',
    party: 'Peoples Democratic Party',
    partyAbbreviation: 'PDP',
    homeLgaCode: '13',
    homeLgaName: 'Offa',
    homeConstituency: 'ifelodun_offa_oyun',
    background:
      'Former Executive Chairman of Offa LGA (2011–2013), Commissioner for Youth & Sports ' +
      '(2008–2011), and two-term Member, Kwara State House of Assembly (Ojomu/Balogun).',
  },

  district: {
    code: 'KS2027',
    name: 'Kwara South',
    state: 'Kwara State',
    headquarters: 'Omu-Aran',
    slogan: 'Kwara South Senatorial District',
  },

  cycle: {
    name: '2027 National Assembly cycle',
    milestones: [
      {
        id: 'primaries',
        label: 'Party primaries',
        date: '2026-05-30',
        citation: INEC_2027,
        kind: 'past',
      },
      {
        id: 'nass-nomination',
        label: 'National Assembly nominations close',
        date: '2026-07-24',
        citation: INEC_2027,
        kind: 'past',
      },
      {
        id: 'nass-campaign-opens',
        label: 'National Assembly campaign opens',
        date: '2026-08-19',
        citation: INEC_2027,
        kind: 'past',
      },
      {
        id: 'nass-final-list',
        label: 'Final NASS candidate list published (11 candidates)',
        date: '2026-09-20',
        citation: INEC_2027,
        kind: 'past',
      },
      {
        id: 'presidential-nass',
        label: 'Presidential & National Assembly (Senate) election',
        date: '2027-01-16',
        citation: INEC_2027,
        kind: 'election',
      },
      {
        id: 'governorship',
        label: 'Governorship & State Assembly election',
        date: '2027-02-06',
        citation: INEC_2027,
        kind: 'election',
      },
    ],
  },

  ballot2027: {
    totalCandidates: 11,
    citation: 'INEC final list of candidates — Kwara South Senatorial District (2027)',
    notable: [
      { party: 'PDP', candidate: 'Popoola Adekeye Lekan Saheed', note: 'Principal · Offa LGA' },
      { party: 'APC', candidate: 'Adewoye Olalekan', note: 'Open seat — incumbent not on ballot' },
      { party: 'ADC', candidate: 'Oyedepo Iyiola', note: 'Third-force challenger' },
      { party: 'SDP', candidate: 'Anifowose Grace', note: '2023 third-place platform (24,265)' },
    ],
  },

  zoning: {
    priorityOrder: ['ifelodun_offa_oyun', 'ekiti_irepodun_isin_oke_ero'],
    note:
      'Ifelodun, Offa and Irepodun alone cast 60.6% of Kwara South votes. Offa is the ' +
      'principal’s home LGA (18.9% of votes) — winning requires matching Offa energy in ' +
      'Ifelodun (largest roll, lowest turnout at 22.6%) and Irepodun (district HQ, Omu-Aran).',
  },

  simulation: {
    enabled: true,
    seed: 'ks2027-pdp-demo',
  },
};

/** The election the platform is counting down to: Saturday, 16 January 2027. */
export function primaryElection(): CycleMilestone {
  const m = campaignConfig.cycle.milestones.find((x) => x.id === 'presidential-nass');
  if (!m) throw new Error('Presidential/NASS Senate milestone missing from campaign config.');
  return m;
}

export function daysUntil(date: string, from: Date = new Date()): number {
  const target = new Date(`${date}T00:00:00Z`).getTime();
  const start = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  return Math.round((target - start) / 86_400_000);
}
