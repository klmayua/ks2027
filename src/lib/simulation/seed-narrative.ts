/**
 * Seeded OSINT narrative & topical relevance monitoring data — M3 (Kwara South 2025–2027 cycle).
 *
 * Topical domains and context anchors are grounded in verified 2025–2026 Kwara South reporting
 * (Premium Times, FIJ, Punch, Vanguard, The Nation, Channels TV, ThisDay, Galaxy TV, FactualTimes,
 * INEC declarations). Individual stream excerpts are badged as simulated monitoring items modeling
 * how live Kwara South radio, news, social, and ward returns flow through the OSINT response desk.
 *
 * INVARIANT: Every single Mention (280/280) and Claim (6/6) carries BOTH an explicit
 * `TopicalRelevance` score (0–100) AND a complete `ResponseRecommendation`.
 */

import type { FederalConstituencyId } from '@/lib/geography';
import type {
  Claim,
  Language,
  Mention,
  RelevanceTier,
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
  {
    id: 't-security',
    label: 'Banditry, Eruku & Ifelodun abductions',
    origin: 'campaign',
    relevance: {
      score: 98,
      tier: 'critical',
      electoralWeight: 96,
      recencyMomentum: 99,
      swingSensitivity: 97,
      candidateExposure: 98,
      whyItMattersNow:
        '#1 kitchen-table issue in Kwara South: voters blame 8 years of APC incumbency while Popoola holds the only proven Offa Neighbourhood Watch executive record.',
      verifiedContext:
        'Late-2025 Eruku (Oke-Ero) church mass abduction, Egbe–Eruku highway intercepts, and 2026 Owa-Onire / Share–Oke-Ode / Oke-Ode–Babanla displacements flagged by Kwara South Dev. Forum (FIJ, Premium Times, Leadership).',
      impactedLgas: ['Ifelodun', 'Oke-Ero', 'Isin', 'Irepodun', 'Ekiti'],
    },
  },
  {
    id: 't-roads',
    label: 'Ilorin–Omu-Aran–Kabba & feeder road decay',
    origin: 'organic',
    relevance: {
      score: 94,
      tier: 'critical',
      electoralWeight: 92,
      recencyMomentum: 93,
      swingSensitivity: 95,
      candidateExposure: 94,
      whyItMattersNow:
        'Road blockades in Isin & Ekiti directly fuse economic pain with kidnapping ambush traps — prime anti-incumbent leverage for Popoola’s NUJ News Keg manifesto.',
      verifiedContext:
        '2025–2026 community highway blockades & “Enough is Enough” protests at Isanlu-Isin, Oke-Onigbin, Edidi & Eruku over Ilorin–Omu-Aran–Kabba, Iloffa–Ekiti & Ajase–Offa corridors (Punch, Channels TV, Guardian).',
      impactedLgas: ['Irepodun', 'Isin', 'Ekiti', 'Oke-Ero', 'Offa'],
    },
  },
  {
    id: 't-saraki-2018',
    label: '2018 Offa clips & Saraki reconciliation',
    origin: 'opponent',
    relevance: {
      score: 93,
      tier: 'critical',
      electoralWeight: 88,
      recencyMomentum: 96,
      swingSensitivity: 91,
      candidateExposure: 99,
      whyItMattersNow:
        'Popoola’s single highest viral attack surface: APC & ADC splice 2018 O to ge clips to depress legacy Saraki turnout in Irepodun & Ifelodun.',
      verifiedContext:
        'Popoola’s late-2025/2026 PDP return & public apology to Dr. Bukola Saraki for 2018 political heat (Galaxy TV, The Niche, Vanguard), paired with Saraki’s 2026 Irepodun grassroots tour.',
      impactedLgas: ['Offa', 'Irepodun', 'Ifelodun', 'Oyun'],
    },
  },
  {
    id: 't-igbomina-equity',
    label: 'Igbomina vs. Ibolo (Offa) representation',
    origin: 'opponent',
    relevance: {
      score: 91,
      tier: 'critical',
      electoralWeight: 95,
      recencyMomentum: 88,
      swingSensitivity: 94,
      candidateExposure: 90,
      whyItMattersNow:
        'Igbomina & Ekiti LGAs hold 60 of 83 wards (626/907 PUs). Both Adewoye (APC) and Oyedepo (ADC) exploit “Offa-only” fears unless Popoola proves Igbomina inclusion.',
      verifiedContext:
        'Adewoye polled highest in Isin in May 2026 APC primary; Oyedepo is Akogun of Isanlu-Isin; Popoola pledged 83 ward liaison officers across all 7 LGAs (Informant247, HolisticInfos).',
      impactedLgas: ['Ifelodun', 'Irepodun', 'Isin', 'Oke-Ero', 'Ekiti'],
    },
  },
  {
    id: 't-apc-fracture',
    label: 'APC May 2026 primary rift & Ashiru fallout',
    origin: 'campaign',
    relevance: {
      score: 89,
      tier: 'high',
      electoralWeight: 86,
      recencyMomentum: 89,
      swingSensitivity: 92,
      candidateExposure: 88,
      whyItMattersNow:
        'APC’s biggest structural wound: incumbent Deputy Senate Leader Lola Ashiru placed 3rd behind Adewoye AND APC zoned 2027 gov to Kwara North (Speaker Danladi Salihu).',
      verifiedContext:
        'May 18, 2026 11-aspirant APC Kwara South primary (Adewoye 65,256; Ashiru 3rd) + APC zoning governorship to Speaker Yakubu Danladi Salihu — the same Speaker who declared Popoola’s seat vacant in 2022 (The Nation, Punch, Premium Times).',
      impactedLgas: ['Offa', 'Irepodun', 'Ifelodun', 'Oyun'],
    },
  },
  {
    id: 't-adc-split',
    label: 'ADC (Akogun Oyedepo) & SDP reunification',
    origin: 'opponent',
    relevance: {
      score: 88,
      tier: 'high',
      electoralWeight: 84,
      recencyMomentum: 87,
      swingSensitivity: 96,
      candidateExposure: 86,
      whyItMattersNow:
        '2023 proved PDP (34,950) + SDP (24,265) beats APC (55,966) ONLY if anti-APC votes do not split again. Oyedepo’s ADC threatens to peel 12k–16k protest votes in Isin/Irepodun/Ifelodun.',
      verifiedContext:
        'INEC 2027 list confirms Chief Iyiola Oyedepo (ADC, Isanlu-Isin, ex-PDP Chairman & O to ge arrowhead) vs. Popoola (PDP, 2023 SDP Reps candidate for Ifelodun/Offa/Oyun).',
      impactedLgas: ['Isin', 'Irepodun', 'Ifelodun'],
    },
  },
  {
    id: 't-agriculture',
    label: 'Safe farms, harvest safety & rural economy',
    origin: 'campaign',
    relevance: {
      score: 82,
      tier: 'high',
      electoralWeight: 85,
      recencyMomentum: 79,
      swingSensitivity: 84,
      candidateExposure: 80,
      whyItMattersNow:
        'Directly converts Ifelodun (22.6% floor turnout) & Oke-Ero farming wards by tying security directly to harvest income and rural food prices.',
      verifiedContext:
        'Displaced farmers along Owa-Onire, Share–Oke-Ode & Isin corridors; Popoola’s Tribune/NUJ manifesto anchoring safe-farm agriculture as Kwara South’s economic backbone.',
      impactedLgas: ['Ifelodun', 'Oke-Ero', 'Ekiti', 'Isin'],
    },
  },
  {
    id: 't-digital-cyber',
    label: 'Online smears, cyberbullying & PU defence',
    origin: 'organic',
    relevance: {
      score: 79,
      tier: 'high',
      electoralWeight: 78,
      recencyMomentum: 84,
      swingSensitivity: 80,
      candidateExposure: 76,
      whyItMattersNow:
        'Kwara Police Command warned against online cyberbullying & thuggery while August 2026 proved digital narrative speed & real-time PU capture decide elections against cash.',
      verifiedContext:
        'CP Ojo Adekimi (Kwara Police Command) 2026 anti-thuggery & anti-cyberbullying warnings across Offa, Ifelodun & Irepodun (VON, Leadership) + Aug 2026 digital campaign shift.',
      impactedLgas: ['Offa', 'Irepodun', 'Ifelodun', 'Oyun'],
    },
  },
  {
    id: 't-party-switch',
    label: '4-party trajectory & 2022 seat-vacation clash',
    origin: 'opponent',
    relevance: {
      score: 77,
      tier: 'elevated',
      electoralWeight: 74,
      recencyMomentum: 76,
      swingSensitivity: 79,
      candidateExposure: 85,
      whyItMattersNow:
        'Opponents attack Popoola’s PDP→APC→SDP→PDP path; flipping the frame onto his March 2022 defiance of Speaker Danladi Salihu turns a liability into an anti-impunity badge.',
      verifiedContext:
        'March 31, 2022 Kwara Assembly seat vacation under Sec. 109(1)(g) by Speaker Yakubu Danladi Salihu despite Justice Yusuf’s High Court injunction (Premium Times, TVC News).',
      impactedLgas: ['Offa', 'Oyun', 'Ifelodun', 'Irepodun'],
    },
  },
];

const OUTLETS: [string, SourceKind][] = [
  ['Premium Times', 'news'],
  ['Vanguard', 'news'],
  ['Punch', 'news'],
  ['The Nation', 'news'],
  ['ThisDay', 'news'],
  ['Nigerian Tribune', 'news'],
  ['FIJ Nigeria', 'news'],
  ['FactualTimes Kwara', 'news'],
  ['Okin FM Offa', 'radio'],
  ['Harmony FM Ilorin', 'radio'],
  ['Radio Kwara', 'radio'],
  ['Sobi FM', 'radio'],
  ['Public WhatsApp / X / TikTok', 'social_public'],
  ['Ward liaison return', 'field_report'],
  ['KS2027 Media Desk', 'official_statement'],
];

const EXCERPTS: Record<string, string[]> = {
  't-security': [
    'Oke-Ero callers on Okin FM still point to the Eruku church abduction and ask what 8 years of APC control delivered on rural safety.',
    'Kwara South Development Forum voices in Owa-Onire and Share–Oke-Ode warn displaced farmers still hesitate to return without local watch cover.',
    'Residents compare Popoola’s 2011–2013 Offa Neighbourhood Watch favourably against Adewoye’s untested state-police pitch at the NUJ parliament.',
    'Fulani community elders in Ifelodun ask whether Popoola’s neighbourhood watch includes pastoralist representatives or targets them.',
  ],
  't-roads': [
    'Commuters on the Ilorin–Omu-Aran–Kabba highway say collapsed craters around Isanlu-Isin and Oke-Onigbin slow cars into ambush traps.',
    'Youth protesters in Ekiti and Isin recall their “Enough is Enough” barricades and demand concrete FERMA oversight rather than pre-election promises.',
    'Traders plying Ajase-Ipo–Offa and Iloffa–Ekiti say transport fares doubled because federal maintenance contracts stalled.',
  ],
  't-saraki-2018': [
    'Viral TikTok clip splices Popoola’s 2018 Offa bank robbery remarks to tell Irepodun PDP loyalists not to trust his return.',
    'Saraki’s grassroots tour in Irepodun drew warm crowds, with ward elders welcoming Popoola’s public apology as mature unity.',
    'Offa youth groups debate whether Popoola’s reconciliation with Saraki costs him O to ge swing voters.',
  ],
  't-igbomina-equity': [
    'Callers from Omu-Aran and Share ask why an Offa (Ibolo) candidate should hold the Senate seat when Igbomina LGAs carry 60 of 83 wards.',
    'Adewoye’s strong Isin primary tally and Oyedepo’s Isanlu-Isin title are both being used on WhatsApp to push an “Igbomina-first” line.',
    'Irepodun ward officers report Popoola’s 83 Ward Liaison Officers pledge landed well when explained in Igbomina Yoruba.',
  ],
  't-apc-fracture': [
    'Aggrieved Lola Ashiru loyalists in Offa and Irepodun say the May 18 APC primary humiliated the Deputy Senate Leader and broke local trust.',
    'Kwara South APC stakeholders privately complain that zoning the 2027 governorship to Kwara North (Speaker Danladi) sidelined southern interests.',
    'Defeated APC aspirants’ ward captains in Ifelodun are reportedly open to silent neutrality rather than working for Adewoye.',
  ],
  't-adc-split': [
    'Akogun Iyiola Oyedepo’s radio interview on Harmony FM resonated with educated listeners in Isin and Omu-Aran frustrated with both major parties.',
    'Former 2023 SDP coordinators in Ifelodun warn that unless harmonisation is finalised fast, ADC could peel away angry protest voters.',
    'Grassroots analysts remind callers that 2023 PDP + SDP outpolled APC by 3,249 votes — splitting again into ADC hands APC the seat.',
  ],
  't-agriculture': [
    'Farmers along Oke-Ode–Babanla say food prices in Omu-Aran will not drop until rural roads and farm-settlement security are fixed together.',
    'Popoola’s Tribune manifesto linking rural watch security directly to safe farming drew strong positive feedback from Ifelodun cooperatives.',
    'Cooperative leaders ask for verified senate intervention funds rather than one-off election-season palliatives.',
  ],
  't-digital-cyber': [
    'Kwara Police CP Ojo Adekimi warned youth groups in Offa, Ifelodun, and Irepodun against online cyberbullying and election thuggery.',
    'Viral fake polling-unit graphics are circulating on WhatsApp groups confusing former SDP voters about PDP’s 2027 ballot symbol.',
    'Youth leaders in Offa and Omu-Aran note how real-time digital PU monitoring neutralised cash in the August 2026 Osun poll.',
  ],
  't-party-switch': [
    'Opposition posts mock Popoola’s journey from PDP to APC to SDP and back to PDP as political inconsistency.',
    'Supporters counter that Speaker Yakubu Danladi Salihu — now APC’s gov candidate — defied Justice Yusuf’s High Court order to vacate Popoola’s seat in 2022.',
    'Old 2018 Kwara Assembly committee petition screenshots resurfaced briefly in an Offa WhatsApp forum.',
  ],
};

interface PlaybookRule {
  ownerRole: string;
  defaultChannel: ResponseChannel;
  citations: string[];
  bySentiment: Record<
    Sentiment,
    { posture: ResponsePosture; urgency: ResponseUrgency; angle: string; draft: string }
  >;
}

const TOPIC_PLAYBOOKS: Record<string, PlaybookRule> = {
  't-security': {
    ownerRole: 'Publicity Secretary & Security Desk',
    defaultChannel: 'radio_script',
    citations: ['KS-SEC-001 (Offa Neighbourhood Watch 2011–2013 Record)', 'Kwara South Dev. Forum 2026 Rural Displacement Brief'],
    bySentiment: {
      negative: {
        posture: 'rebut',
        urgency: 'immediate_2h',
        angle: 'Clarify inclusive multi-ethnic watch model (Yoruba + Fulani + Police) & contrast with 8 years of APC Eruku/Ifelodun failures.',
        draft:
          'Hon. Saheed Popoola’s community security model replicates his proven 2011–2013 registered Offa Neighbourhood Watch: integrating local youths, settled Fulani residents, traditional rulers, and formal security agencies. After Eruku and Owa-Onire, Kwara South needs tested local execution — not untested promises from the party in power since 2019.',
      },
      neutral: {
        posture: 'clarify',
        urgency: 'same_day_6h',
        angle: 'Publish the 7-LGA neighbourhood watch charter in Yoruba & Fulfulde across Oke-Ero, Ifelodun & Isin.',
        draft:
          'Popoola’s Senate security blueprint directly targets the Eruku, Owa-Onire, Share–Oke-Ode, and Isin corridors through registered community watch units feeding live intelligence to police and military formations.',
      },
      positive: {
        posture: 'amplify',
        urgency: 'same_day_6h',
        angle: 'Clip & syndicate positive Offa Neighbourhood Watch comparisons across all 83 ward WhatsApp hubs.',
        draft:
          'Residents across Kwara South remember results, not slogans: as Offa LGA Chairman (2011–2013), Hon. Saheed Popoola built a working Neighbourhood Watch. On 16 January 2027, we scale tested community security across all 7 LGAs.',
      },
    },
  },
  't-roads': {
    ownerRole: 'Policy & Infrastructure Desk',
    defaultChannel: 'press_statement',
    citations: ['KS-RDS-002 (Ilorin–Omu-Aran–Kabba & Iloffa–Ekiti FERMA Brief)'],
    bySentiment: {
      negative: {
        posture: 'clarify',
        urgency: 'same_day_6h',
        angle: 'Stand solidly with Isin/Ekiti road protesters; tie collapsed federal roads directly to APC’s 8-year federal/Senate record.',
        draft:
          'We stand with commuters and protesters at Isanlu-Isin, Oke-Onigbin, and Eruku. Collapsed craters on Ilorin–Omu-Aran–Kabba, Iloffa–Ekiti, and Ajase–Offa are now kidnapping traps. Hon. Popoola’s NUJ manifesto commits to dedicated Senate Works/FERMA appropriation oversight and quarterly public progress audits.',
      },
      neutral: {
        posture: 'clarify',
        urgency: 'next_cycle_24h',
        angle: 'Share named priority corridor list (Ilorin–Omu-Aran–Egbe, Iloffa–Ekiti, Ajase–Offa) in Yoruba & English.',
        draft:
          'Every failed federal corridor in Kwara South is documented in KS-RDS-002: Ilorin–Omu-Aran–Kabba, Iloffa–Ekiti, and Ajase–Offa. Fixing bad roads is both an economic rescue and an anti-kidnapping measure.',
      },
      positive: {
        posture: 'amplify',
        urgency: 'next_cycle_24h',
        angle: 'Amplify trader & commuter endorsement of Popoola’s road-security linkage.',
        draft:
          'Good roads stop ambushes and cut market fares. Support KS-RDS-002 for accountable federal road rehabilitation across all 7 Kwara South LGAs.',
      },
    },
  },
  't-saraki-2018': {
    ownerRole: 'Publicity Secretary & Campaign Director',
    defaultChannel: 'social_post',
    citations: ['Galaxy TV / The Niche Public Reconciliation Transcript', '2023 INEC Omu-Aran Record (PDP+SDP 59,215 > APC 55,966)'],
    bySentiment: {
      negative: {
        posture: 'rebut',
        urgency: 'immediate_2h',
        angle: 'Inoculate 2018 clip smears within 2h: reframe public apology as rare political courage putting 2026 Kwara South survival above 2018 heat.',
        draft:
          'Opponents replaying 2018 clips have no answer for 2026 kidnappings in Eruku and Ifelodun. Hon. Saheed Popoola showed rare leadership by publicly apologizing to Dr. Bukola Saraki and reuniting the Kwara South PDP family. Today Saraki and Popoola stand side-by-side in Irepodun and across all 7 LGAs to rescue Kwara South.',
      },
      neutral: {
        posture: 'clarify',
        urgency: 'same_day_6h',
        angle: 'Push joint Saraki–Popoola Irepodun/Ifelodun tour visuals to settle legacy PDP doubts.',
        draft:
          'Reconciliation is complete and on the public record. Dr. Bukola Saraki’s Kwara South tour and Hon. Popoola’s candidacy unite legacy PDP and returning 2023 SDP structures under one winning umbrella.',
      },
      positive: {
        posture: 'amplify',
        urgency: 'same_day_6h',
        angle: 'Syndicate warm Irepodun/Ifelodun unity crowd clips to WhatsApp & Facebook.',
        draft:
          'Unity beats division. Across Irepodun, Ifelodun, Offa, and Oyun, legacy PDP elders and returning progressive youths are rallying together behind Hon. Saheed Popoola.',
      },
    },
  },
  't-igbomina-equity': {
    ownerRole: 'Igbomina Co-Directors & Senatorial Chairman',
    defaultChannel: 'radio_script',
    citations: ['KS-GOV-008 (83 Ward Liaison Officers — NUJ News Keg Pledge)', 'KS/DIR/2026/003 (Ifelodun–Irepodun 65% Field Surge)'],
    bySentiment: {
      negative: {
        posture: 'rebut',
        urgency: 'immediate_2h',
        angle: 'Rebut “Offa-only” claim in Igbomina Yoruba with 83 Ward Liaison Officers & 65% field allocation to Ifelodun/Irepodun/Isin/Oke-Ero/Ekiti.',
        draft:
          'Kwara South has 83 wards — 60 of them in Ifelodun, Irepodun, Isin, Oke-Ero, and Ekiti. Hon. Popoola’s published field directive places 65% of mobilisation and dedicated Ward Liaison Officers in every single Igbomina and Ekiti ward. Representation belongs to all 7 LGAs, never one town.',
      },
      neutral: {
        posture: 'clarify',
        urgency: 'same_day_6h',
        angle: 'Name Igbomina campaign directors & local ward liaison officers in Omu-Aran, Share, Isanlu-Isin & Iloffa.',
        draft:
          'Under KS-GOV-008, every ward in Ifelodun, Irepodun, Isin, Oke-Ero, Ekiti, Oyun, and Offa gets an appointed constituency liaison desk reporting quarterly on Senate projects.',
      },
      positive: {
        posture: 'amplify',
        urgency: 'next_cycle_24h',
        angle: 'Broadcast Igbomina ward endorsements on Okin FM & Harmony FM.',
        draft:
          'From Share to Omu-Aran, Eruku to Iloffa, all 7 LGAs of Kwara South are equal partners in Hon. Saheed Popoola’s Senate mandate.',
      },
    },
  },
  't-apc-fracture': {
    ownerRole: 'Senatorial Chairman & Reconciliation Desk',
    defaultChannel: 'ward_talking_points',
    citations: ['May 18, 2026 APC Primary Record (Ashiru 3rd-Place Fracture)'],
    bySentiment: {
      negative: {
        posture: 'monitor',
        urgency: 'watch',
        angle: 'Do not gloat publicly over Ashiru’s defeat; keep back-channel outreach respectful & dignified.',
        draft:
          'Ward officers must never insult aggrieved APC stakeholders or Sen. Lola Ashiru’s supporters. Welcome every Kwara South son and daughter sidelined by APC’s primary and Kwara North governorship zoning into a broad district coalition.',
      },
      neutral: {
        posture: 'clarify',
        urgency: 'same_day_6h',
        angle: 'Highlight Kwara South district interest after APC zoned governorship to Kwara North.',
        draft:
          'With APC zoning the 2027 governorship outside Kwara South, our district needs an independent, fearless Senator in Abuja who answers to our 83 wards — not a state-house rubber stamp.',
      },
      positive: {
        posture: 'amplify',
        urgency: 'same_day_6h',
        angle: 'Channel soft/aggrieved APC ward coordinators quietly into KS2027 reconciliation pipeline.',
        draft:
          'Kwara South comes first before party factions. Our reconciliation desk remains open to ward mobilisers across all 7 LGAs who want real security and federal roads.',
      },
    },
  },
  't-adc-split': {
    ownerRole: 'Igbomina Co-Directors & Radio Desk',
    defaultChannel: 'radio_script',
    citations: ['2023 INEC Omu-Aran Record (PDP+SDP 59,215 > APC 55,966)'],
    bySentiment: {
      negative: {
        posture: 'clarify',
        urgency: 'immediate_2h',
        angle: 'Respect Akogun Oyedepo personally while proving mathematically that splitting anti-APC votes into ADC hands APC a free win.',
        draft:
          'We respect Chief Iyiola Oyedepo as an elder of Isanlu-Isin. Yet the 2023 INEC record is unmistakable: PDP (34,950) plus SDP (24,265) beat APC (55,966) by 3,249 votes — APC only won because opposition votes split. Only PDP has the 907-polling-unit network to defeat APC on 16 January 2027.',
      },
      neutral: {
        posture: 'clarify',
        urgency: 'same_day_6h',
        angle: 'Accelerate formal PDP–SDP ward committee integration so zero coordinators drift to ADC.',
        draft:
          'Hon. Saheed Popoola carried the SDP banner across Ifelodun, Offa, and Oyun in 2023 and now unites that entire base inside PDP. One unified opposition ballot flips Kwara South.',
      },
      positive: {
        posture: 'amplify',
        urgency: 'same_day_6h',
        angle: 'Amplify tactical-unity voices warning against repeating the 2023 opposition split.',
        draft:
          '59,215 beat 55,966 in 2023 — don’t split the change vote in 2027. Vote umbrella (PDP) across all 907 Kwara South polling units.',
      },
    },
  },
  't-agriculture': {
    ownerRole: 'Policy & Rural Economy Desk',
    defaultChannel: 'radio_script',
    citations: ['KS-SEC-001 (Offa Neighbourhood Watch 2011–2013 Record)', 'Kwara South Dev. Forum 2026 Rural Displacement Brief'],
    bySentiment: {
      negative: {
        posture: 'clarify',
        urgency: 'same_day_6h',
        angle: 'Tie rural farm abandonment directly to security & road intervention — zero empty palliatives.',
        draft:
          'Farmers in Owa-Onire, Oke-Ode, and Isin do not want election-week rice bags — they want safe farms and motorable feeder roads. Popoola’s manifesto links community watch security directly to federal agricultural cooperative financing.',
      },
      neutral: {
        posture: 'clarify',
        urgency: 'next_cycle_24h',
        angle: 'Share cooperative registration framework through all 83 ward liaison desks.',
        draft:
          'Through 83 ward liaison desks, farming cooperatives across Ifelodun, Oke-Ero, Ekiti, and Isin will have transparent quarterly access to federal agricultural inputs and rural road advocacy.',
      },
      positive: {
        posture: 'amplify',
        urgency: 'next_cycle_24h',
        angle: 'Syndicate farming cooperative support clips in Igbomina Yoruba & Fulfulde.',
        draft:
          'Safe farms mean lower food prices and stronger rural incomes. Kwara South farmers are rallying behind Hon. Saheed Popoola’s security-first agriculture agenda.',
      },
    },
  },
  't-digital-cyber': {
    ownerRole: 'Digital Command & Legal Adviser',
    defaultChannel: 'social_post',
    citations: ['2023 INEC Omu-Aran Record (PDP+SDP 59,215 > APC 55,966)'],
    bySentiment: {
      negative: {
        posture: 'rebut',
        urgency: 'immediate_2h',
        angle: 'Debunk fake ballot graphics immediately; issue clean PDP umbrella visual guide & endorse CP Ojo Adekimi’s peaceful-campaign stance.',
        draft:
          'IGNORE fake WhatsApp ballot flyers. Hon. Saheed Popoola is the INEC-confirmed PDP candidate (Umbrella symbol) for Kwara South Senate. We fully endorse CP Ojo Adekimi’s call for issue-based, thuggery-free campaigning and live transparent polling-unit verification.',
      },
      neutral: {
        posture: 'clarify',
        urgency: 'same_day_6h',
        angle: 'Push clean “Vote Umbrella (PDP) — Saheed Popoola” graphics across WhatsApp & TikTok.',
        draft:
          'Ballot clarity for every returning SDP & PDP supporter: look for the PDP Umbrella for Hon. Popoola Adekeye Lekan Saheed on Saturday, 16 January 2027.',
      },
      positive: {
        posture: 'amplify',
        urgency: 'same_day_6h',
        angle: 'Recruit youth digital PU monitors across Offa, Omu-Aran & Share.',
        draft:
          'Every polling unit photographed, timestamped, and verified in public. Join KS2027’s 907-PU peaceful digital defence network.',
      },
    },
  },
  't-party-switch': {
    ownerRole: 'Legal Adviser & Publicity Secretary',
    defaultChannel: 'press_statement',
    citations: ['March 2022 High Court Injunction (Justice Yusuf / Sec. 109)'],
    bySentiment: {
      negative: {
        posture: 'rebut',
        urgency: 'same_day_6h',
        angle: 'Flip cross-carpeting attack into anti-impunity badge against APC’s 2027 gov candidate (Speaker Danladi Salihu); hold 2018 court order ready.',
        draft:
          'Hon. Saheed Popoola left APC in 2022 over exclusion and governance failure — and paid the price when Speaker Yakubu Danladi Salihu (now APC’s governorship candidate) defied Justice Yusuf’s High Court injunction to declare his seat vacant. He has returned home to Kwara South’s historic PDP base where he first served as Commissioner and Offa Chairman.',
      },
      neutral: {
        posture: 'clarify',
        urgency: 'next_cycle_24h',
        angle: 'Keep narrative anchored on Popoola’s consistent 18-year Kwara South grassroots service.',
        draft:
          'From Commissioner (2008–2011) to Offa Chairman (2011–2013) to 2-term Assemblyman, Hon. Popoola’s loyalty has always been to Kwara South’s people — never to impunity.',
      },
      positive: {
        posture: 'amplify',
        urgency: 'next_cycle_24h',
        angle: 'Highlight Popoola’s courtroom & grassroots courage against executive overreach.',
        draft:
          'Kwara South needs a Senator who cannot be intimidated. Hon. Popoola stood up to executive impunity in 2022 and stands ready to defend our 7 LGAs in Abuja.',
      },
    },
  },
};

const LANG_TABLE: [Language, number][] = [
  ['yo', 44],
  ['en', 36],
  ['pcm', 13],
  ['ful', 7],
];

const CONSTITUENCIES: [FederalConstituencyId, number][] = [
  ['ifelodun_offa_oyun', 56],
  ['ekiti_irepodun_isin_oke_ero', 44],
];

const SENTIMENT_BY_ORIGIN: Record<Topic['origin'], [Sentiment, number][]> = {
  campaign: [
    ['positive', 48],
    ['neutral', 35],
    ['negative', 17],
  ],
  organic: [
    ['positive', 25],
    ['neutral', 40],
    ['negative', 35],
  ],
  opponent: [
    ['positive', 13],
    ['neutral', 29],
    ['negative', 58],
  ],
};

function tierFromScore(score: number): RelevanceTier {
  if (score >= 90) return 'critical';
  if (score >= 80) return 'high';
  if (score >= 70) return 'elevated';
  return 'watch';
}

function buildRecommendation(
  topicId: string,
  sentiment: Sentiment,
  language: Language
): ResponseRecommendation {
  const rule = TOPIC_PLAYBOOKS[topicId] ?? TOPIC_PLAYBOOKS['t-security'];
  const s = rule.bySentiment[sentiment];
  return {
    posture: s.posture,
    urgency: s.urgency,
    channel: rule.defaultChannel,
    language: language === 'ful' && topicId === 't-security' ? 'ful' : language === 'yo' ? 'yo' : 'en',
    ownerRole: rule.ownerRole,
    angle: s.angle,
    suggestedDraft: s.draft,
    citations: [...rule.citations],
  };
}

export function seedMentions(seedText = 'ks2027-kwara-south-2026', count = 280): Mention[] {
  const r = rng(`${seedText}:mentions`);
  const out: Mention[] = [];
  const now = Date.parse('2026-11-24T12:00:00.000Z');

  // Weight topic selection toward higher-relevance 2026 flashpoints
  const weightedTopicIds: [string, number][] = TOPICS.map((t) => [
    t.id,
    Math.max(8, t.relevance.score - 55),
  ]);

  for (let i = 0; i < count; i++) {
    const topicId = weighted(r, weightedTopicIds);
    const topic = TOPICS.find((t) => t.id === topicId) ?? TOPICS[0];
    const [sourceName, sourceKind] = pick(r, OUTLETS);
    const language = weighted(r, LANG_TABLE);
    const constituencyId = weighted(r, CONSTITUENCIES);

    const baseConfidence = language === 'en' ? 0.85 : language === 'yo' ? 0.72 : language === 'pcm' ? 0.7 : 0.58;
    const confidence = Math.min(
      0.98,
      Number((baseConfidence + r() * 0.16 - (sourceKind === 'radio' ? 0.06 : 0)).toFixed(2))
    );
    const sentiment = weighted(r, SENTIMENT_BY_ORIGIN[topic.origin]);

    // Adjust per-hit relevance slightly by sentiment & source reach
    const sentimentBoost = sentiment === 'negative' ? 3 : sentiment === 'positive' ? 1 : -2;
    const sourceBoost = sourceKind === 'radio' || sourceKind === 'news' ? 1 : 0;
    const relevanceScore = Math.max(55, Math.min(100, topic.relevance.score + sentimentBoost + sourceBoost));

    out.push({
      id: `m-${i + 1}`,
      sourceKind,
      sourceName,
      url: sourceKind === 'news' ? 'https://example.invalid/ks2027-simulated-stream' : undefined,
      language,
      excerpt: pick(r, EXCERPTS[topic.id]),
      sentiment,
      confidence,
      topicId: topic.id,
      constituencyId,
      observedAt: new Date(now - Math.floor(r() * 14 * 86_400_000)).toISOString(),
      relevanceScore,
      relevanceTier: tierFromScore(relevanceScore),
      whyRelevant: topic.relevance.whyItMattersNow,
      recommendation: buildRecommendation(topic.id, sentiment, language),
    });
  }

  return out.sort((a, b) => b.observedAt.localeCompare(a.observedAt));
}

export function seedClaims(seedText = 'ks2027-kwara-south-2026'): Claim[] {
  const r = rng(`${seedText}:claims`);
  const curve = (peak: number, len: number, rising: boolean) =>
    Array.from({ length: len }, (_, i) => {
      const t = i / (len - 1);
      const shape = rising ? Math.pow(t, 2.0) : Math.sin(Math.PI * t);
      return Math.max(0, Math.round(peak * shape + r() * 2.5));
    });

  return [
    {
      id: 'c-1',
      topicId: 't-saraki-2018',
      statement:
        'Viral TikTok/WhatsApp clips splice Popoola’s 2018 Offa bank robbery remarks to argue legacy Saraki/PDP loyalists in Irepodun & Ifelodun should boycott him.',
      status: 'verifying',
      firstSeenAt: '2026-11-21T07:15:00.000Z',
      firstSeenSource: 'Public WhatsApp / X / TikTok',
      dailyMentions: curve(42, 6, true),
      constituencyIds: ['ifelodun_offa_oyun', 'ekiti_irepodun_isin_oke_ero'],
      languages: ['yo', 'en', 'pcm'],
      assessment: 'misleading',
      relevanceScore: 98,
      relevanceTier: 'critical',
      whyItMattersNow:
        'Direct threat to PDP base turnout in Irepodun & Ifelodun; opponents weaponize 2018 heat while omitting Popoola’s public apology & Saraki’s 2026 Irepodun tour.',
      verifiedAnchor: 'Popoola public reconciliation & apology (Galaxy TV / The Niche) + Saraki 2026 Irepodun tour (The Nation).',
      posture: 'rebut',
      urgency: 'immediate_2h',
      ownerRole: 'Publicity Secretary & Campaign Director',
      recommendedAngle:
        'Frame the public apology as rare political maturity putting 2026 Kwara South security above 2018 bitterness; flood Irepodun/Ifelodun with joint Saraki–Popoola visuals.',
      responseId: 'r-1',
    },
    {
      id: 'c-2',
      topicId: 't-security',
      statement:
        'Claim circulating in Ifelodun & Oke-Ero that Popoola’s proposed Neighbourhood Watch bypasses formal security agencies and excludes settled Fulani pastoralists.',
      status: 'response_approved',
      firstSeenAt: '2026-11-18T11:20:00.000Z',
      firstSeenSource: 'Okin FM Offa / Public post',
      dailyMentions: curve(34, 8, true),
      constituencyIds: ['ifelodun_offa_oyun', 'ekiti_irepodun_isin_oke_ero'],
      languages: ['yo', 'ful', 'en'],
      assessment: 'false',
      relevanceScore: 97,
      relevanceTier: 'critical',
      whyItMattersNow:
        'Rural banditry (Eruku church abduction & Owa-Onire displacements) is Kwara South’s #1 voter issue — leaving ethnic distortion uncorrected costs both Fulani and moderate swing votes.',
      verifiedAnchor: 'Popoola’s 2011–2013 registered Offa Neighbourhood Watch record + 2026 NUJ News Keg security pledge (ThisDay / ReportsNow).',
      posture: 'rebut',
      urgency: 'immediate_2h',
      ownerRole: 'Publicity Secretary',
      recommendedAngle:
        'Publish the documented 2011–2013 registered Offa multi-ethnic model in English, Yoruba & Fulfulde and contrast it with 8 years of APC rural insecurity.',
      responseId: 'r-2',
    },
    {
      id: 'c-3',
      topicId: 't-igbomina-equity',
      statement:
        'Whisper campaign across Omu-Aran, Share & Isanlu-Isin claiming an Offa (Ibolo) PDP ticket will marginalise the 5 Igbomina/Ekiti LGAs (60 of 83 wards).',
      status: 'responded',
      firstSeenAt: '2026-11-12T15:00:00.000Z',
      firstSeenSource: 'Harmony FM Ilorin',
      dailyMentions: curve(26, 11, false),
      constituencyIds: ['ekiti_irepodun_isin_oke_ero', 'ifelodun_offa_oyun'],
      languages: ['yo', 'en'],
      assessment: 'false',
      relevanceScore: 93,
      relevanceTier: 'critical',
      whyItMattersNow:
        'Adewoye (APC) polled highest in Isin and Oyedepo (ADC) is Akogun of Isanlu-Isin; losing the Igbomina equity frame caps Popoola below 40%.',
      verifiedAnchor: 'Popoola’s 83 Ward Liaison Officers pledge (NUJ News Keg) + KS/DIR/2026/003 65% field allocation to Igbomina/Ekiti LGAs.',
      posture: 'rebut',
      urgency: 'same_day_6h',
      ownerRole: 'Igbomina Co-Directors',
      recommendedAngle:
        'Lead with Igbomina voices & published 65% non-Offa allocation plus named liaison officers for all 60 Igbomina/Ekiti wards.',
      responseId: 'r-3',
    },
    {
      id: 'c-4',
      topicId: 't-adc-split',
      statement:
        'WhatsApp push urging angry 2023 SDP & anti-APC voters in Isin, Irepodun & Ifelodun to vote ADC (Akogun Oyedepo) instead of reuniting inside PDP.',
      status: 'verifying',
      firstSeenAt: '2026-11-22T09:30:00.000Z',
      firstSeenSource: 'Harmony FM Ilorin / Social',
      dailyMentions: curve(29, 5, true),
      constituencyIds: ['ekiti_irepodun_isin_oke_ero', 'ifelodun_offa_oyun'],
      languages: ['yo', 'en'],
      assessment: 'misleading',
      relevanceScore: 91,
      relevanceTier: 'critical',
      whyItMattersNow:
        'Exact replay of 2023’s fatal opposition split: PDP+SDP beat APC by +3,249 in 2023, yet APC won because anti-APC votes divided across two ballots.',
      verifiedAnchor: 'INEC 2023 Omu-Aran collation (APC 55,966 vs PDP 34,950 + SDP 24,265 = 59,215) + INEC 2027 list (Oyedepo ADC).',
      posture: 'clarify',
      urgency: 'immediate_2h',
      ownerRole: 'Senatorial Chairman & Radio Desk',
      recommendedAngle:
        'Respect Akogun Oyedepo personally while proving mathematically that ADC lacks 907-PU reach — splitting the change vote hands Adewoye (APC) a free win.',
      responseId: 'r-4',
    },
    {
      id: 'c-5',
      topicId: 't-roads',
      statement:
        'APC surrogates claim the Ilorin–Omu-Aran–Kabba and Iloffa–Ekiti federal road failures cannot be fixed by a Senator and blame past PDP years instead of 2019–2026 APC control.',
      status: 'monitoring',
      firstSeenAt: '2026-11-19T14:10:00.000Z',
      firstSeenSource: 'Radio Kwara / Public post',
      dailyMentions: curve(21, 7, true),
      constituencyIds: ['ekiti_irepodun_isin_oke_ero', 'ifelodun_offa_oyun'],
      languages: ['yo', 'en', 'pcm'],
      assessment: 'misleading',
      relevanceScore: 89,
      relevanceTier: 'high',
      whyItMattersNow:
        'Community barricades at Isanlu-Isin, Oke-Onigbin & Eruku show peak voter anger; owning the road-security nexus converts undecided commuters.',
      verifiedAnchor: 'Isin & Ekiti highway blockades (“Enough is Enough” protests — Punch / Channels TV) + APC 8-year incumbency (2019–2026).',
      posture: 'rebut',
      urgency: 'same_day_6h',
      ownerRole: 'Policy & Infrastructure Desk',
      recommendedAngle:
        'Pin 8 straight years of APC federal + state + Senate control onto the craters while detailing Senate Works/FERMA appropriation oversight.',
      responseId: 'r-5',
    },
    {
      id: 'c-6',
      topicId: 't-party-switch',
      statement:
        'Viral graphics attacking Popoola as a “4-party hopper” (PDP → APC → SDP → PDP) while resurfacing a 2018 Kwara Assembly committee petition screenshot.',
      status: 'monitoring',
      firstSeenAt: '2026-11-20T18:45:00.000Z',
      firstSeenSource: 'Public WhatsApp / X / TikTok',
      dailyMentions: curve(18, 6, true),
      constituencyIds: ['ifelodun_offa_oyun'],
      languages: ['en', 'yo', 'pcm'],
      assessment: 'misleading',
      relevanceScore: 84,
      relevanceTier: 'high',
      whyItMattersNow:
        'Directly attacks candidate character; counter-framing it around Speaker Yakubu Danladi Salihu’s 2022 contempt of court turns an attack into anti-impunity fuel.',
      verifiedAnchor: 'March 31, 2022 Sec. 109(1)(g) seat vacation defying Justice Yusuf’s injunction (Premium Times) + 2018 High Court restraint (Punch).',
      posture: 'clarify',
      urgency: 'same_day_6h',
      ownerRole: 'Legal Adviser & Publicity Secretary',
      recommendedAngle:
        'Highlight that APC’s 2027 gov candidate (Speaker Danladi Salihu) defied a High Court order to unseat Popoola in 2022, and keep 2018 legal order strictly on standby.',
      responseId: 'r-6',
    },
  ];
}

export function seedResponses(): Response[] {
  return [
    {
      id: 'r-1',
      claimId: 'c-1',
      channel: 'social_post',
      language: 'yo',
      draft:
        'Awon alatako to n tun fidio 2018 fi sowo ko ni idahun si ijinigbe ni Eruku ati Ifelodun loni. Hon. Saheed Popoola ti fi oye agba han, o si ti tun ifowosowopo se pelu Dr. Bukola Saraki fun itesiwaju Kwara South. (English companion: Opponents replaying 2018 clips have no answer for 2026 insecurity. Popoola’s public reconciliation with Dr. Saraki puts Kwara South’s survival above past political heat.)',
      citations: [
        'Galaxy TV / The Niche Public Reconciliation Transcript',
        '2023 INEC Omu-Aran Record (PDP+SDP 59,215 > APC 55,966)',
      ],
      draftedBy: 'ai_assisted',
      // Deliberately awaiting approval so user can test live approval & dispatch gate!
    },
    {
      id: 'r-2',
      claimId: 'c-2',
      channel: 'press_statement',
      language: 'en',
      draft:
        'The opposite is on the public record. Hon. Saheed Popoola’s community security framework replicates his proven 2011–2013 registered Offa LGA Neighbourhood Watch: integrating local youths, settled Fulani residents, traditional rulers, and formal security agencies to defend Eruku, Owa-Onire, Share–Oke-Ode, and Isin corridors.',
      citations: [
        'KS-SEC-001 (Offa Neighbourhood Watch 2011–2013 Record)',
        'Kwara South Dev. Forum 2026 Rural Displacement Brief',
      ],
      draftedBy: 'ai_assisted',
      approval: {
        byName: 'Publicity Secretary',
        byRole: 'Publicity Secretary',
        at: '2026-11-22T14:20:00.000Z',
        note: 'Approved. Issue English statement plus Fulfulde & Igbomina Yoruba audio notes on Okin FM and Harmony FM.',
      },
    },
    {
      id: 'r-3',
      claimId: 'c-3',
      channel: 'radio_script',
      language: 'yo',
      draft:
        'Kwara South ni ijoba ibile meje ati woodu metalelagorin (83). Ninu won, woodu ogota (60) wa ni Ifelodun, Irepodun, Isin, Oke-Ero ati Ekiti. Hon. Saheed Popoola ti fi idi re mule pe 65% ise ipolongo ati awon asoju woodu 83 yoo wa ni gbogbo ilu Igbomina ati Ekiti lai yo enikeni sile.',
      citations: [
        'KS-GOV-008 (83 Ward Liaison Officers — NUJ News Keg Pledge)',
        'KS/DIR/2026/003 (Ifelodun–Irepodun 65% Field Surge)',
      ],
      draftedBy: 'ai_assisted',
      approval: {
        byName: 'Campaign Director',
        byRole: 'Campaign Director',
        at: '2026-11-15T09:15:00.000Z',
        note: 'Approved for Okin FM, Harmony FM & Radio Kwara morning belt.',
      },
      sentAt: '2026-11-15T11:30:00.000Z',
      dispatchedTo: 'Okin FM Offa · Harmony FM · Radio Kwara · Sobi FM desk',
    },
    {
      id: 'r-4',
      claimId: 'c-4',
      channel: 'radio_script',
      language: 'yo',
      draft:
        'A bowo fun Akogun Iyiola Oyedepo gege bi agba ni Isanlu-Isin. Sugbon abajade INEC 2023 fi han gbangba pe PDP (34,950) ati SDP (24,265) ju APC (55,966) lo pelu ibo 3,249 — ipinya ibo lo gbe APC wole. Ni January 16, 2027, PDP nikan lo ni eto ni gbogbo polling unit 907 lati gba Kwara South pada.',
      citations: ['2023 INEC Omu-Aran Record (PDP+SDP 59,215 > APC 55,966)'],
      draftedBy: 'ai_assisted',
      // Deliberately awaiting approval for live human gate operation
    },
    {
      id: 'r-5',
      claimId: 'c-5',
      channel: 'press_statement',
      language: 'en',
      draft:
        'APC has held the Presidency, Kwara Government House, and the Kwara South Senate seat since 2019 — yet commuters at Isanlu-Isin, Oke-Onigbin, and Eruku had to barricade federal highways in protest. Hon. Popoola will deploy Senate Works & FERMA appropriation oversight with published quarterly audits on Ilorin–Omu-Aran–Kabba, Iloffa–Ekiti, and Ajase–Offa.',
      citations: ['KS-RDS-002 (Ilorin–Omu-Aran–Kabba & Iloffa–Ekiti FERMA Brief)'],
      draftedBy: 'ai_assisted',
      // Awaiting approval
    },
    {
      id: 'r-6',
      claimId: 'c-6',
      channel: 'ward_talking_points',
      language: 'en',
      draft:
        'Ward officers: remind voters that Hon. Popoola broke with APC over Kwara South neglect — and APC’s 2027 governorship candidate (Speaker Yakubu Danladi Salihu) defied Justice Yusuf’s High Court injunction in March 2022 to declare his seat vacant. Do not amplify 2018 smear graphics; refer any press inquiry on the 2018 High Court restraint order directly to the Legal Adviser.',
      citations: ['March 2022 High Court Injunction (Justice Yusuf / Sec. 109)'],
      draftedBy: 'human',
      approval: {
        byName: 'Legal Adviser',
        byRole: 'Legal Adviser',
        at: '2026-11-21T16:10:00.000Z',
        note: 'Cleared for internal ward officer distribution only.',
      },
    },
  ];
}
