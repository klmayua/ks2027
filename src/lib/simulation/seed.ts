/**
 * Deterministic simulation seed — M1 (Kwara South Senatorial District).
 *
 * Populates the war room with a realistic post-primary and post-reunification PDP structure across
 * Kwara South's 7 LGAs and 83 wards. Everything produced here carries `simulated` provenance and
 * is refused by `assertPublishable()`.
 */

import { campaignConfig } from '@/config/campaign.config';
import {
  FEDERAL_CONSTITUENCIES,
  constituencyOfLga,
  lgas,
  wards,
  type FederalConstituencyId,
} from '@/lib/geography';
import type { Provenance } from '@/lib/provenance';
import type {
  Alignment,
  Appointment,
  Person,
  RosterEntry,
  Scope,
} from '@/lib/party/structure';
import { positionsForLevel } from '@/lib/party/structure';
import type {
  AskCategory,
  ContactLogEntry,
  ReconciliationStage,
  Stakeholder,
  StakeholderKind,
} from '@/lib/party/reconciliation';
import { personName, pick, rng, weighted } from '@/lib/simulation/rng';

export const SIMULATION_PROVENANCE: Provenance = {
  kind: 'simulated',
  scenario: 'kwara-south pdp post-primary reunification',
  seed: campaignConfig.simulation.seed,
};

/**
 * Alignment distribution reflects home-turf gravity: Offa (Popoola's home LGA) reads warmest,
 * surrounding Ifelodun/Oyun read moderately warm from his 2023 Federal Constituency campaign, while
 * Ekiti/Irepodun/Isin/Oke-Ero require active ward-by-ward reconciliation.
 */
const ALIGNMENT_BY_CONSTITUENCY: Record<FederalConstituencyId, [Alignment, number][]> = {
  ifelodun_offa_oyun: [
    ['aligned', 42],
    ['passive', 24],
    ['aggrieved', 14],
    ['reconciled', 10],
    ['unknown', 10],
  ],
  ekiti_irepodun_isin_oke_ero: [
    ['aligned', 27],
    ['passive', 30],
    ['aggrieved', 23],
    ['reconciled', 8],
    ['unknown', 12],
  ],
};

const OFFA_ALIGNMENT: [Alignment, number][] = [
  ['aligned', 58],
  ['passive', 18],
  ['aggrieved', 8],
  ['reconciled', 10],
  ['unknown', 6],
];

export interface SeededRoster {
  people: Person[];
  appointments: Appointment[];
  entries: RosterEntry[];
}

export function seedRoster(seedText = campaignConfig.simulation.seed): SeededRoster {
  const r = rng(`${seedText}:roster`);
  const people: Person[] = [];
  const appointments: Appointment[] = [];
  const entries: RosterEntry[] = [];

  const allPositions = [
    ...positionsForLevel('senatorial'),
    ...positionsForLevel('constituency'),
    ...positionsForLevel('lga'),
    ...positionsForLevel('ward'),
  ];

  const add = (scope: Scope, positionId: string, alignment: Alignment, homeWardId?: string) => {
    const person: Person = {
      id: `p-${people.length + 1}`,
      name: personName(r),
      phone: `080${Math.floor(r() * 90_000_000 + 10_000_000)}`,
      homeWardId,
    };
    const position = allPositions.find((p) => p.id === positionId);
    if (!position) return;

    const appointment: Appointment = {
      id: `a-${appointments.length + 1}`,
      personId: person.id,
      positionId,
      scope,
      alignment,
      assessedAt: '2026-10-15T00:00:00.000Z',
    };
    people.push(person);
    appointments.push(appointment);
    entries.push({ appointment, person, position });
  };

  // Senatorial campaign executive — fully staffed.
  for (const p of positionsForLevel('senatorial')) {
    add({ level: 'senatorial' }, p.id, weighted(r, ALIGNMENT_BY_CONSTITUENCY.ifelodun_offa_oyun));
  }

  // Federal constituency coordinators (2 constituencies).
  for (const fc of FEDERAL_CONSTITUENCIES) {
    for (const p of positionsForLevel('constituency')) {
      add(
        { level: 'constituency', constituencyId: fc.id },
        p.id,
        weighted(r, ALIGNMENT_BY_CONSTITUENCY[fc.id])
      );
    }
  }

  // LGA executives across all 7 LGAs — occasional non-load-bearing vacancies.
  for (const lga of lgas) {
    const fc = constituencyOfLga(lga.code)?.id ?? 'ifelodun_offa_oyun';
    const table = lga.code === '13' ? OFFA_ALIGNMENT : ALIGNMENT_BY_CONSTITUENCY[fc];
    for (const p of positionsForLevel('lga')) {
      if (!p.loadBearing && r() < 0.16) continue;
      add({ level: 'lga', lgaCode: lga.code }, p.id, weighted(r, table));
    }
  }

  // Ward executives across all 83 wards — where structure thins out.
  for (const ward of wards) {
    const fc = constituencyOfLga(ward.lgaCode)?.id ?? 'ifelodun_offa_oyun';
    const table = ward.lgaCode === '13' ? OFFA_ALIGNMENT : ALIGNMENT_BY_CONSTITUENCY[fc];
    for (const p of positionsForLevel('ward')) {
      const vacancyChance = p.loadBearing ? (ward.lgaCode === '13' ? 0.08 : 0.15) : 0.32;
      if (r() < vacancyChance) continue;
      add({ level: 'ward', wardId: ward.id }, p.id, weighted(r, table), ward.id);
    }
  }

  return { people, appointments, entries };
}

// ---------------------------------------------------------------------------
// Reconciliation pipeline — 64 stakeholders across 7 Kwara South LGAs
// ---------------------------------------------------------------------------

const KIND_TABLE: [StakeholderKind, number][] = [
  ['party_officer', 30],
  ['legislator_former', 16],
  ['legislator_serving', 10],
  ['union_association', 12],
  ['traditional', 12],
  ['financier', 8],
  ['senatorial_aspirant', 6],
  ['other', 6],
];

const STAGE_TABLE: [ReconciliationStage, number][] = [
  ['identified', 22],
  ['assigned', 18],
  ['engaged', 20],
  ['ask_tabled', 14],
  ['agreed', 9],
  ['reconciled', 12],
  ['refused', 5],
];

const ASK_TABLE: [AskCategory, number][] = [
  ['position', 28],
  ['recognition', 22],
  ['process_review', 18],
  ['constituency_commitment', 16],
  ['financial', 8],
  ['none_stated', 8],
];

const BLOCS = [
  'Legacy PDP ward bloc',
  '2023 SDP returnee structure',
  'Igbomina–Ekiti representation caucus',
  'Post-primary aggrieved bloc',
] as const;

const CHANNELS = ['in_person', 'phone', 'emissary', 'written'] as const;

const CONTACT_NOTES = [
  'Received the Omu-Aran delegation. Wants harmonisation between legacy PDP and returning SDP ward officers.',
  'Declined a phone call this week; asked that the principal visit through his LGA chairman.',
  'Open to appearing at the Ifelodun town hall once rural security commitments are co-signed.',
  'Concerned that campaign council roles lean too heavily toward Offa. Wants Igbomina balance.',
  'Positive. Ready to mobilise his ward youth structure ahead of the January 16 poll.',
  'Wants clarity on polling unit agent slots before turning over his ward register.',
  'Non-committal; watching whether the rival aspirant bloc reconciles first.',
  'Agreed to step back from contesting the ward list after Saraki-axis elders intervened.',
];

export function seedStakeholders(
  seedText = campaignConfig.simulation.seed,
  count = 64
): Stakeholder[] {
  const r = rng(`${seedText}:reconciliation`);
  const out: Stakeholder[] = [];

  // Weight pipeline toward Ekiti/Irepodun/Isin/Oke-Ero + Ifelodun where reconciliation unlocks the race.
  const constituencyTable: [FederalConstituencyId, number][] = [
    ['ekiti_irepodun_isin_oke_ero', 56],
    ['ifelodun_offa_oyun', 44],
  ];

  for (let i = 0; i < count; i++) {
    const constituencyId = weighted(r, constituencyTable);
    const fcLgas = lgas.filter((l) => constituencyOfLga(l.code)?.id === constituencyId);
    const lga = pick(r, fcLgas);
    const lgaWards = wards.filter((w) => w.lgaCode === lga.code);
    const kind = weighted(r, KIND_TABLE);
    const stage = weighted(r, STAGE_TABLE);

    const reach =
      kind === 'senatorial_aspirant'
        ? 4 + Math.floor(r() * 6)
        : kind === 'legislator_serving' || kind === 'legislator_former'
          ? 2 + Math.floor(r() * 4)
          : 1 + Math.floor(r() * 3);

    const carriesWardIds = [...lgaWards]
      .sort(() => r() - 0.5)
      .slice(0, Math.min(reach, lgaWards.length))
      .map((w) => w.id);

    const stageIndex = STAGE_TABLE.findIndex(([s]) => s === stage);
    const contactCount = stage === 'identified' ? 0 : 1 + Math.floor(r() * (stageIndex + 1));
    const contactLog: ContactLogEntry[] = [];
    let cursor = new Date('2026-09-24T09:00:00.000Z').getTime();
    for (let c = 0; c < contactCount; c++) {
      cursor += (2 + Math.floor(r() * 10)) * 86_400_000;
      contactLog.push({
        id: `c-${i}-${c}`,
        at: new Date(cursor).toISOString(),
        byHandlerId: `ks-h${1 + Math.floor(r() * 5)}`,
        channel: pick(r, CHANNELS),
        note: pick(r, CONTACT_NOTES),
      });
    }

    out.push({
      id: `s-${i + 1}`,
      name: personName(r),
      kind,
      bloc: r() < 0.48 ? pick(r, BLOCS) : undefined,
      constituencyId,
      lgaCode: lga.code,
      carriesWardIds,
      stage,
      ask: stage === 'identified' ? 'none_stated' : weighted(r, ASK_TABLE),
      handlerId: stage === 'identified' ? undefined : `ks-h${1 + Math.floor(r() * 5)}`,
      contactLog,
      refusalNote:
        stage === 'refused'
          ? 'Engaged and declined. Escalated to the Kwara South Senatorial Chairman.'
          : undefined,
      updatedAt: contactLog.at(-1)?.at ?? '2026-09-24T09:00:00.000Z',
    });
  }

  return out;
}
