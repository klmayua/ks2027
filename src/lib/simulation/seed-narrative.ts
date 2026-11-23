/**
 * Seeded OSINT monitoring & response recommendations — M3 (Kwara South PDP).
 *
 * Guarantees that EVERY SINGLE OSINT hit (all 280 mentions + all 5 tracked claims) carries a
 * concrete, Kwara South-grounded ResponseRecommendation with posture, SLA, channel, language,
 * owner, citations, and ready-to-edit draft.
 */

import { campaignConfig } from '@/config/campaign.config';
import type { FederalConstituencyId } from '@/lib/geography';
import type {
  Claim,
  Language,
  Mention,
  Response,
  ResponseChannel,
  ResponsePosture,
  ResponseRecommendation,
  ResponseUrgency,
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

interface TopicPlaybook {
  ownerRole: string;
  citations: string[];
  negative: { angle: string; draft: string };
  neutral: { angle: string; draft: string };
  positive: { angle: string; draft: string };
}

const TOPIC_PLAYBOOKS: Record<string, TopicPlaybook> = {
  't-security': {
    ownerRole: 'Security Liaison & Publicity Desk',
    citations: ['KS-SEC-001 (Neighbourhood Watch)', 'Vanguard manifesto interview'],
    negative: {
      angle: 'Acknowledge farmland fear urgently; point to Popoola’s proven Offa neighbourhood-watch record & KS-SEC-001.',
      draft:
        'Rural kidnapping across Ifelodun, Ekiti and Oke-Ero is Hon. Saheed Popoola’s #1 priority. ' +
        'Under commitment KS-SEC-001, he will replicate his proven Offa LGA registered neighbourhood ' +
        'watch across all 7 LGAs — uniting local youths, Fulani residents and formal security ' +
        'agencies so farmers return safely to their land.',
    },
    neutral: {
      angle: 'Clarify how KS-SEC-001 links community vigilantes directly to Police & NSCDC intelligence.',
      draft:
        'Under KS-SEC-001, community neighbourhood-watch teams across Kwara South will be formally ' +
        'registered, equipped, and linked to Police and NSCDC commands with quarterly public ' +
        'safety audits.',
    },
    positive: {
      angle: 'Amplify community endorsement on Yoruba morning radio and ward WhatsApp briefs.',
      draft:
        'Elders and farmers across Kwara South remember what worked in Offa LGA. Hon. Saheed ' +
        'Popoola’s inclusive neighbourhood-watch blueprint (KS-SEC-001) puts safety first across ' +
        'all 7 local governments.',
    },
  },
  't-roads': {
    ownerRole: 'Policy & Works Oversight Desk',
    citations: ['KS-RDS-002 (FERMA Federal Roads)'],
    negative: {
      angle: 'Validate commuter frustration; contrast incumbent neglect with Senate Works & FERMA oversight commitment.',
      draft:
        'Commuters on Ilorin–Omu-Aran–Kabba and Offa–Oyun corridors have waited too long. Hon. ' +
        'Saheed Popoola commits under KS-RDS-002 to file a joint engineering dossier with the ' +
        'Federal Ministry of Works and enforce FERMA palliative oversight transparently.',
    },
    neutral: {
      angle: 'Share the published KS-RDS-002 milestone timetable with local market & transport unions.',
      draft:
        'Our federal corridor tracker (KS-RDS-002) publishes every budget line and contractor ' +
        'mobilisation milestone for Kwara South federal roads so residents can verify delivery.',
    },
    positive: {
      angle: 'Syndicate transport union support into Omu-Aran and Offa radio spots.',
      draft:
        'Good federal roads unlock farm-gate income from Ekiti to Offa. KS-RDS-002 turns Senate ' +
        'oversight into tracked, verifiable road rehabilitation.',
    },
  },
  't-reunification': {
    ownerRole: 'Director-General, KS2027',
    citations: ['2023 INEC Omu-Aran Senate Record', 'Reconciliation pipeline'],
    negative: {
      angle: 'Pivot defection attacks into the unity story: bringing the 2023 SDP base back to PDP to end Kwara South’s split.',
      draft:
        'In 2023, APC won Kwara South Senate only because PDP (34,950) and SDP (24,265) split ' +
        '59,215 opposition votes. Returning home to PDP unites both structures behind one credible ' +
        'grassroots leader focused on insecurity and roads.',
    },
    neutral: {
      angle: 'Update ward chairmen on completed harmonisation meetings across the 7 LGAs.',
      draft:
        'PDP and returning SDP ward coordinators are harmonising polling unit teams across all 83 ' +
        'wards ahead of 16 January 2027 so every unit is guarded by one united structure.',
    },
    positive: {
      angle: 'Amplify unity endorsements from legacy PDP and returning structures.',
      draft:
        'One united Kwara South PDP: combining the 2023 PDP and SDP structures puts the district ' +
        'ahead before Election Day even starts.',
    },
  },
  't-balance': {
    ownerRole: 'Senatorial Chairman',
    citations: ['KS-GOV-008 (Quarterly Scorecard)', 'KS/DIR/2026/003 (Ifelodun–Irepodun Surge)'],
    negative: {
      angle: 'Rebut "Offa-only" framing with hard facts: dual constituency desks (Omu-Aran & Offa) and 7-LGA commitment map.',
      draft:
        'Offa is 18.9% of Kwara South’s vote — no Senator can represent or win this district from ' +
        'one LGA. KS-GOV-008 establishes constituency desks in both Omu-Aran and Offa, with every ' +
        'zonal project mapped transparently across all 7 LGAs.',
    },
    neutral: {
      angle: 'Publish the 7-LGA project distribution table and Igbomina–Ekiti leadership roster.',
      draft:
        'Every commitment on the KS2027 Public Ledger — 3 solar PHCs per LGA (KS-HLT-003), ' +
        'youth hubs in both constituencies (KS-YTH-005), and 7-LGA security networks — guarantees ' +
        'equitable reach.',
    },
    positive: {
      angle: 'Highlight cross-LGA endorsements from Omu-Aran, Share, Osi, Iloffa and Araromi-Opin.',
      draft:
        'From Ifelodun and Irepodun to Ekiti, Isin, Oke-Ero, Oyun and Offa — Kwara South is ' +
        'moving as one constituency.',
    },
  },
  't-agriculture': {
    ownerRole: 'Rural Economy & Agriculture Desk',
    citations: ['KS-AGR-006 (Farm Cooperatives)', 'KS-SEC-001 (Neighbourhood Watch)'],
    negative: {
      angle: 'Tie farm-access pain directly to KS-SEC-001 security corridors + KS-AGR-006 input support.',
      draft:
        'Farmers cannot harvest without safe roads and safe farmlands. Hon. Popoola pairs ' +
        'registered community security (KS-SEC-001) with transparent cooperative input delivery ' +
        '(KS-AGR-006) across all farming wards.',
    },
    neutral: {
      angle: 'Invite farm cooperative heads in Ifelodun, Ekiti and Oke-Ero onto the open beneficiary register.',
      draft:
        'Under KS-AGR-006, agricultural input and dry-season storage allocations are published by ' +
        'cooperative and ward so real farmers — not middlemen — receive support.',
    },
    positive: {
      angle: 'Amplify farmer cooperative feedback on Yoruba and Fulfulde community radio.',
      draft:
        'Safe farms and direct cooperative inputs: KS-AGR-006 puts Kwara South’s cocoa, cashew ' +
        'and cassava growers back at the centre of federal intervention.',
    },
  },
  't-youth': {
    ownerRole: 'Youth Wing & Enterprise Desk',
    citations: ['KS-YTH-005 (Offa & Omu-Aran Hubs)'],
    negative: {
      angle: 'Contrast one-off cash handouts with accredited vocational certification & paid neighbourhood-watch roles.',
      draft:
        'Kwara South youths deserve accredited skills and real work, not election-week tokens. ' +
        'KS-YTH-005 delivers SMEDAN/ITF certification hubs in both federal constituencies, ' +
        'alongside paid community security roles under KS-SEC-001.',
    },
    neutral: {
      angle: 'Share eligibility & transport-stipend details for youths across Ekiti, Isin, Oke-Ero, Ifelodun and Oyun.',
      draft:
        'Both federal constituency vocational hubs (KS-YTH-005) include transport stipends so ' +
        'trainees from all 7 LGAs participate equally.',
    },
    positive: {
      angle: 'Convert youth enthusiasm into polling-unit agent recruitment across all 907 PUs.',
      draft:
        'Youths across Kwara South are backing Popoola’s skills and security agenda — join your ' +
        'ward youth team to protect every vote on 16 January 2027.',
    },
  },
  't-health': {
    ownerRole: 'Public Health & Constituency Desk',
    citations: ['KS-HLT-003 (21 Solar PHCs)'],
    negative: {
      angle: 'Cite ward-by-ward PHC audit and KS-HLT-003 commitment to solar-power 3 PHCs in every LGA.',
      draft:
        'No rural clinic should lose vaccines or night-delivery care to power failure. KS-HLT-003 ' +
        'allocates zonal intervention funds to equip 21 Primary Health Centres — 3 in every LGA ' +
        'of Kwara South — with 24-hour solar cold-chain power.',
    },
    neutral: {
      angle: 'Share the 21-PHC facility audit checklist with ward nurses and community development committees.',
      draft:
        'Ward nurses and community chairs help nominate the 3 priority PHCs per LGA under ' +
        'KS-HLT-003, with geotagged commissioning published openly on the Public Ledger.',
    },
    positive: {
      angle: 'Feature nurse and maternal-health testimonials in women’s wing market briefings.',
      draft:
        '21 solar-powered PHCs across all 7 LGAs — practical healthcare delivery tracked openly ' +
        'under KS-HLT-003.',
    },
  },
  't-ballot': {
    ownerRole: 'War Room Strategy Desk',
    citations: ['2023 INEC Omu-Aran Senate Record'],
    negative: {
      angle: 'Remind voters that APC’s seat is open and splitting votes among minor parties only helps the status quo.',
      draft:
        'With the incumbent off the ballot and 11 candidates running, only a united PDP structure ' +
        'across all 83 wards can deliver Kwara South on 16 January 2027.',
    },
    neutral: {
      angle: 'Brief ward chairmen on turnout math in the 3-LGA core (Ifelodun, Offa, Irepodun = 60.6% of votes).',
      draft:
        'This open-seat Senate race will be won on ward turnout and agent protection across all ' +
        '907 Kwara South polling units — stay focused on door-to-door mobilisation.',
    },
    positive: {
      angle: 'Amplify momentum narrative: united PDP + experienced grassroots former chairman & two-term lawmaker.',
      draft:
        'Experience meets grassroots unity: Hon. Saheed Popoola brings executive LGA leadership ' +
        'and two terms of legislative experience to an open Kwara South Senate race.',
    },
  },
};

function recommendedChannelFor(sourceKind: SourceKind, sentiment: Sentiment): ResponseChannel {
  if (sourceKind === 'radio') return 'radio_script';
  if (sourceKind === 'field_report') return 'ward_talking_points';
  if (sourceKind === 'news') return 'press_statement';
  if (sourceKind === 'social_public') {
    return sentiment === 'negative' ? 'ward_talking_points' : 'social_post';
  }
  return 'press_statement';
}

function buildRecommendation(
  topicId: string,
  sentiment: Sentiment,
  sourceKind: SourceKind,
  language: Language,
  confidence: number
): ResponseRecommendation {
  const pb = TOPIC_PLAYBOOKS[topicId] ?? TOPIC_PLAYBOOKS['t-security'];
  const channel = recommendedChannelFor(sourceKind, sentiment);

  let posture: ResponsePosture;
  let urgency: ResponseUrgency;
  let copy: { angle: string; draft: string };

  if (sentiment === 'negative') {
    posture = topicId === 't-reunification' || topicId === 't-balance' ? 'rebut' : 'clarify';
    urgency = sourceKind === 'radio' || sourceKind === 'news' ? 'immediate_2h' : 'same_day_6h';
    copy = pb.negative;
  } else if (sentiment === 'positive') {
    posture = 'amplify';
    urgency = 'next_cycle_24h';
    copy = pb.positive;
  } else {
    posture = confidence < 0.65 ? 'monitor' : 'clarify';
    urgency = confidence < 0.65 ? 'watch' : 'next_cycle_24h';
    copy = pb.neutral;
  }

  return {
    posture,
    urgency,
    channel,
    language,
    ownerRole: pb.ownerRole,
    angle: copy.angle,
    suggestedDraft: copy.draft,
    citations: pb.citations,
  };
}

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
    const sentiment = weighted(r, SENTIMENT_BY_ORIGIN[topic.origin]);

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
      sentiment,
      confidence,
      topicId: topic.id,
      constituencyId,
      observedAt: new Date(now - Math.floor(r() * 14 * 86_400_000)).toISOString(),
      recommendation: buildRecommendation(topic.id, sentiment, sourceKind, language, confidence),
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
      posture: 'rebut',
      urgency: 'immediate_2h',
      ownerRole: 'Director-General, KS2027',
      recommendedAngle:
        'Counter on Yoruba morning radio with hard math: Offa is 18.9% of votes; cite KS/DIR/2026/003 & dual Omu-Aran/Offa offices.',
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
      posture: 'rebut',
      urgency: 'immediate_2h',
      ownerRole: 'Publicity Secretary',
      recommendedAngle:
        'Publish English statement + Fulfulde & Yoruba radio summaries quoting Popoola’s explicit inclusion of Fulani residents and Police/NSCDC registration.',
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
      posture: 'concede',
      urgency: 'same_day_6h',
      ownerRole: 'Senatorial Chairman',
      recommendedAngle:
        'Concede plainly for the 4 affected Ifelodun wards and publish the Share/Oke-Ode harmonisation schedule.',
      responseId: 'r-3',
    },
    {
      id: 'c-4',
      statement:
        'That an undisclosed coalition deal has been struck between two rival Kwara South Senate candidates ahead of January.',
      status: 'response_drafted',
      firstSeenAt: '2026-11-19T18:30:00.000Z',
      firstSeenSource: 'Public post',
      dailyMentions: curve(26, 4, true),
      constituencyIds: ['ifelodun_offa_oyun', 'ekiti_irepodun_isin_oke_ero'],
      languages: ['en', 'pcm'],
      assessment: 'unverified',
      posture: 'clarify',
      urgency: 'immediate_2h',
      ownerRole: 'War Room Strategy Desk',
      recommendedAngle:
        'Do not amplify rival names publicly; push disciplined ward talking points keeping 83 ward officers focused on turnout.',
      responseId: 'r-4',
    },
    {
      id: 'c-5',
      statement:
        'That primary health centre solar upgrades promised during the town hall cannot be funded through federal zonal allocations.',
      status: 'response_drafted',
      firstSeenAt: '2026-11-20T11:00:00.000Z',
      firstSeenSource: 'Okin FM Offa',
      dailyMentions: curve(14, 4, true),
      constituencyIds: ['ifelodun_offa_oyun'],
      languages: ['yo', 'en'],
      assessment: 'misleading',
      posture: 'clarify',
      urgency: 'same_day_6h',
      ownerRole: 'Policy & Health Desk',
      recommendedAngle:
        'Air a 60-second Yoruba explainer on Okin FM citing NPHCDA zonal intervention precedent and KS-HLT-003 costing (₦420m for 21 PHCs).',
      responseId: 'r-5',
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
      citations: ['KS/DIR/2026/003 (Ifelodun–Irepodun Surge)', 'KS-GOV-008 (Quarterly Scorecard)'],
      draftedBy: 'ai_assisted',
      approval: {
        byName: 'Director-General, KS2027',
        byRole: 'Director-General, KS2027',
        at: '2026-11-10T09:15:00.000Z',
        note: 'Approved for Okin FM and Harmony FM Yoruba morning slots.',
      },
      sentAt: '2026-11-10T11:00:00.000Z',
      dispatchedTo: 'Okin FM Offa · Harmony FM · Radio Kwara desk',
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
      citations: ['KS-SEC-001 (Neighbourhood Watch)'],
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
      citations: ['2023 INEC Omu-Aran Senate Record'],
      draftedBy: 'human',
      approval: {
        byName: 'Senatorial Chairman',
        byRole: 'Senatorial Chairman',
        at: '2026-11-12T16:45:00.000Z',
        note: 'Concede plainly — credibility in Ifelodun matters more than spin.',
      },
      sentAt: '2026-11-12T17:30:00.000Z',
      dispatchedTo: 'Kwara South & national press correspondents',
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
      citations: ['2023 INEC Omu-Aran Senate Record'],
      draftedBy: 'ai_assisted',
      // Deliberately unapproved — demonstrates the live human approval gate & dispatch workflow.
    },
    {
      id: 'r-5',
      claimId: 'c-5',
      channel: 'radio_script',
      language: 'yo',
      draft:
        'Solar electrification and cold-chain upgrades for Primary Health Centres are among the ' +
        'most established federal zonal interventions executed through the National Primary Health ' +
        'Care Development Agency (NPHCDA). Commitment KS-HLT-003 costs ₦420m across 21 rural PHCs ' +
        '— three in every LGA of Kwara South — and every handover will be published with geotagged ' +
        'proof on the KS2027 Public Ledger.',
      citations: ['KS-HLT-003 (21 Solar PHCs)'],
      draftedBy: 'ai_assisted',
      // Deliberately unapproved — ready for sign-off & dispatch to Okin FM Offa.
    },
  ];
}
