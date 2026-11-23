/**
 * Seeded narrative monitoring data — M3 (Kwara South Senatorial District · PDP).
 *
 * Topics, claims, and response drafts reflect the actual 2027 Kwara South Senate dynamics around
 * Popoola Adekeye Lekan Saheed: rural insecurity & kidnapping, decayed federal/rural roads,
 * agriculture & youth jobs, PDP/SDP reunification, Offa vs Igbomina/Ekiti balance, and the
 * 11-candidate open-seat ballot.
 */

import { campaignConfig } from '@/config/campaign.config';
import type { FederalConstituencyId } from '@/lib/geography';
import type {
  Claim,
  Language,
  Mention,
  Response,
  Sentiment,
  SourceKind,
  Topic,
} from '@/lib/narrative/osint';
import { pick, rng, weighted } from '@/lib/simulation/rng';

export const TOPICS: Topic[] = [
  { id: 't-security', label: 'Rural insecurity & kidnapping', origin: 'campaign' },
  { id: 't-roads', label: 'Federal & inter-LGA roads', origin: 'organic' },
  { id: 't-reunification', label: 'Party transitions & PDP return', origin: 'opponent' },
  { id: 't-balance', label: 'Offa vs Igbomina / Ekiti balance', origin: 'organic' },
  { id: 't-agriculture', label: 'Agriculture & farmland access', origin: 'campaign' },
  { id: 't-youth', label: 'Youth empowerment & jobs', origin: 'campaign' },
  { id: 't-health', label: 'Primary healthcare delivery', origin: 'campaign' },
  { id: 't-ballot', label: 'Open-seat APC transition & 11-way ballot', origin: 'campaign' },
];

const OUTLETS: [string, SourceKind][] = [
  ['Vanguard', 'news'],
  ['ThisDay', 'news'],
  ['Nigerian Tribune', 'news'],
  ['Daily Trust', 'news'],
  ['Punch', 'news'],
  ['Voice of Nigeria', 'news'],
  ['Okin FM Offa', 'radio'],
  ['Harmony FM Ilorin', 'radio'],
  ['Radio Kwara', 'radio'],
  ['Sobi FM', 'radio'],
  ['Public post', 'social_public'],
  ['Ward officer return', 'field_report'],
  ['KS2027 PDP press desk', 'official_statement'],
];

const EXCERPTS: Record<string, string[]> = {
  't-security': [
    'Farmers around Oke-Ode and Eruku say kidnapping along border paths has kept families off their farms.',
    'Callers on Okin FM recalled Popoola’s registered neighbourhood watch during his Offa chairmanship.',
    'Community elders welcome integrating youth and Fulani residents into a registered security network.',
    'Vigilante groups across Ifelodun ask for formal equipment and intelligence links to security agencies.',
  ],
  't-roads': [
    'Commuters on the Ilorin–Omu-Aran–Kabba highway report hours lost to failed sections.',
    'Traders between Offa and Erin-Ile complain that bad feeder roads double produce transport costs.',
    'Residents demand active Senate oversight over FERMA allocations for Kwara South federal roads.',
  ],
  't-reunification': [
    'Opponents question Popoola’s movement from APC to SDP and back to PDP ahead of 2027.',
    'Supporters argue reuniting his 2023 SDP base with the PDP structure closes the 21,000-vote gap.',
    'Legacy PDP ward leaders in Irepodun confirm harmonisation talks with returning structures.',
  ],
  't-balance': [
    'Callers in Omu-Aran ask how a candidate from Offa will balance projects across Igbomina and Ekiti LGAs.',
    'Youth leaders in Isin and Oke-Ero urge equal constituency representation across all seven local governments.',
    'Stakeholders note that the senatorial collation headquarters sits in Omu-Aran and must anchor outreach.',
  ],
  't-agriculture': [
    'Cocoa, cashew and cassava growers in Ekiti and Oke-Ero say security and feeder roads decide their harvest.',
    'Farm cooperatives in Ifelodun request federal dry-season inputs and safe market corridors.',
  ],
  't-youth': [
    'Graduates in Offa and Omu-Aran ask for structured vocational certification rather than one-off handouts.',
    'Youth groups back paid community intelligence and neighbourhood-watch roles.',
  ],
  't-health': [
    'Rural primary health centres across Isin and Ifelodun remain without steady power for cold-chain storage.',
    'Nurses in Ekiti LGA say referral transport to Omu-Aran takes too long on damaged roads.',
  ],
  't-ballot': [
    'With incumbent Senator Ashiru off the 2027 ballot, observers see an open race across eleven candidates.',
    'Analysts watch how votes split between PDP’s Saheed Popoola, APC’s Adewoye Olalekan and ADC’s Iyiola Oyedepo.',
  ],
};

const LANG_TABLE: [Language, number][] = [
  ['yo', 44],
  ['en', 38],
  ['pcm', 11],
  ['ful', 7],
];

const CONSTITUENCIES: [FederalConstituencyId, number][] = [
  ['ifelodun_offa_oyun', 54],
  ['ekiti_irepodun_isin_oke_ero', 46],
];

const SENTIMENT_BY_ORIGIN: Record<Topic['origin'], [Sentiment, number][]> = {
  campaign: [
    ['positive', 48],
    ['neutral', 36],
    ['negative', 16],
  ],
  organic: [
    ['positive', 22],
    ['neutral', 44],
    ['negative', 34],
  ],
  opponent: [
    ['positive', 14],
    ['neutral', 30],
    ['negative', 56],
  ],
};

export function seedMentions(
  seedText = campaignConfig.simulation.seed,
  count = 280
): Mention[] {
  const r = rng(`${seedText}:mentions`);
  const out: Mention[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const topic = pick(r, TOPICS);
    const [sourceName, sourceKind] = pick(r, OUTLETS);
    const language = weighted(r, LANG_TABLE);
    const constituencyId = weighted(r, CONSTITUENCIES);

    const baseConfidence = language === 'en' ? 0.84 : language === 'pcm' ? 0.72 : 0.6;
    const confidence = Math.min(
      0.98,
      Number((baseConfidence + r() * 0.2 - (sourceKind === 'radio' ? 0.08 : 0)).toFixed(2))
    );

    out.push({
      id: `m-${i + 1}`,
      sourceKind,
      sourceName,
      url: sourceKind === 'news' ? 'https://example.invalid/simulated' : undefined,
      language,
      excerpt: pick(r, EXCERPTS[topic.id]),
      sentiment: weighted(r, SENTIMENT_BY_ORIGIN[topic.origin]),
      confidence,
      topicId: topic.id,
      constituencyId,
      observedAt: new Date(now - Math.floor(r() * 14 * 86_400_000)).toISOString(),
    });
  }

  return out.sort((a, b) => b.observedAt.localeCompare(a.observedAt));
}

export function seedClaims(seedText = campaignConfig.simulation.seed): Claim[] {
  const r = rng(`${seedText}:claims`);
  const curve = (peak: number, len: number, rising: boolean) =>
    Array.from({ length: len }, (_, i) => {
      const t = i / (len - 1);
      const shape = rising ? Math.pow(t, 2.1) : Math.sin(Math.PI * t);
      return Math.max(0, Math.round(peak * shape + r() * 3));
    });

  return [
    {
      id: 'c-1',
      statement:
        'That the PDP Kwara South campaign is an Offa-only project that will sideline Irepodun, Ekiti, Isin and Oke-Ero.',
      status: 'responded',
      firstSeenAt: '2026-11-08T13:20:00.000Z',
      firstSeenSource: 'Harmony FM Ilorin',
      dailyMentions: curve(32, 10, false),
      constituencyIds: ['ekiti_irepodun_isin_oke_ero'],
      languages: ['yo', 'en'],
      assessment: 'false',
      responseId: 'r-1',
    },
    {
      id: 'c-2',
      statement:
        'That Popoola’s neighbourhood-watch security plan bypasses formal security agencies and excludes pastoralist communities.',
      status: 'response_approved',
      firstSeenAt: '2026-11-14T08:15:00.000Z',
      firstSeenSource: 'Public post',
      dailyMentions: curve(29, 7, true),
      constituencyIds: ['ifelodun_offa_oyun', 'ekiti_irepodun_isin_oke_ero'],
      languages: ['yo', 'ful', 'en'],
      assessment: 'false',
      responseId: 'r-2',
    },
    {
      id: 'c-3',
      statement:
        'That harmonisation talks between returning 2023 SDP coordinators and legacy PDP ward officers in Ifelodun have stalled.',
      status: 'conceded',
      firstSeenAt: '2026-11-10T09:40:00.000Z',
      firstSeenSource: 'Ward officer return',
      dailyMentions: curve(19, 9, false),
      constituencyIds: ['ifelodun_offa_oyun'],
      languages: ['yo', 'en'],
      assessment: 'substantially_true',
      responseId: 'r-3',
    },
    {
      id: 'c-4',
      statement:
        'That an undisclosed coalition deal has been struck between two rival Kwara South Senate candidates ahead of January.',
      status: 'verifying',
      firstSeenAt: '2026-11-19T18:30:00.000Z',
      firstSeenSource: 'Public post',
      dailyMentions: curve(26, 4, true),
      constituencyIds: ['ifelodun_offa_oyun', 'ekiti_irepodun_isin_oke_ero'],
      languages: ['en', 'pcm'],
      assessment: 'unverified',
      responseId: 'r-4',
    },
    {
      id: 'c-5',
      statement:
        'That primary health centre solar upgrades promised during the town hall cannot be funded through federal zonal allocations.',
      status: 'monitoring',
      firstSeenAt: '2026-11-20T11:00:00.000Z',
      firstSeenSource: 'Okin FM Offa',
      dailyMentions: curve(11, 3, true),
      constituencyIds: ['ifelodun_offa_oyun'],
      languages: ['yo', 'en'],
      assessment: 'misleading',
    },
  ];
}

export function seedResponses(): Response[] {
  return [
    {
      id: 'r-1',
      claimId: 'c-1',
      channel: 'radio_script',
      language: 'yo',
      draft:
        'Offa casts 18.9% of Kwara South’s votes — no candidate can win this Senate seat from one ' +
        'local government. Our ward directive KS/DIR/2026/003 deploys extra canvass teams into ' +
        'Ifelodun and Irepodun, and our constituency commitment register maps projects across all ' +
        'seven LGAs with permanent public identifiers.',
      citations: ['KS/DIR/2026/003', 'KS-GOV-007', '2023 INEC LGA baseline'],
      draftedBy: 'ai_assisted',
      approval: {
        byName: 'Director-General, KS2027',
        byRole: 'Director-General, KS2027',
        at: '2026-11-10T09:15:00.000Z',
        note: 'Approved for Okin FM and Harmony FM Yoruba morning slots.',
      },
      sentAt: '2026-11-10T11:00:00.000Z',
    },
    {
      id: 'r-2',
      claimId: 'c-2',
      channel: 'press_statement',
      language: 'en',
      draft:
        'The opposite is on the public record. The community security framework proposed by Hon. ' +
        'Saheed Popoola (commitment KS-SEC-001) replicates his Offa LGA neighbourhood-watch model: ' +
        'duly registered with government, integrating local youths alongside Fulani residents and ' +
        'traditional leaders, and sharing intelligence directly with formal security agencies.',
      citations: ['KS-SEC-001', 'Vanguard manifesto interview'],
      draftedBy: 'ai_assisted',
      approval: {
        byName: 'Publicity Secretary',
        byRole: 'Publicity Secretary',
        at: '2026-11-16T14:20:00.000Z',
        note: 'Approved. Issue English statement plus Fulfulde and Yoruba radio summaries.',
      },
    },
    {
      id: 'r-3',
      claimId: 'c-3',
      channel: 'press_statement',
      language: 'en',
      draft:
        'This was accurate for four wards in Ifelodun earlier this month. The reconciliation ' +
        'committee has since met ward officers in Share and Oke-Ode and published the harmonisation ' +
        'timetable. We prefer stating where work remains open rather than denying what ward ' +
        'chairmen already know.',
      citations: ['Reconciliation pipeline, contact log'],
      draftedBy: 'human',
      approval: {
        byName: 'Senatorial Chairman',
        byRole: 'Senatorial Chairman',
        at: '2026-11-12T16:45:00.000Z',
        note: 'Concede plainly — credibility in Ifelodun matters more than spin.',
      },
      sentAt: '2026-11-12T17:30:00.000Z',
    },
    {
      id: 'r-4',
      claimId: 'c-4',
      channel: 'ward_talking_points',
      language: 'en',
      draft:
        'No rival candidate has filed a withdrawal with INEC. Ward officers should stay focused ' +
        'on door-to-door turnout in their polling units and avoid repeating unverified coalition ' +
        'rumours from social media.',
      citations: [],
      draftedBy: 'ai_assisted',
      // Deliberately unapproved — demonstrates assertSendable() holding the gate.
    },
  ];
}
