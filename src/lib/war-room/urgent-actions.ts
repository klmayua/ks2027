/**
 * Unified "Realities → Act Now" Urgent Command Queue — Kwara South 2027.
 *
 * Synthesises live outputs from:
 *   - Predictive Engine (`predictive.ts`) — exact marginal vote yield of closing each gap
 *   - Digital Wave Engine (`digital-wave.ts`) — blind polling units out of 907
 *   - OSINT & Topical Relevance (`seed-narrative.ts`) — accelerating claims held at approval gate
 *   - Candidate & Rivals Dossier (`dossier.ts`) — verified 2026 ground-game fault lines
 *
 * Every item pairs ONE verified current reality with ONE non-negotiable action right now.
 */

import { isSendable, velocity } from '@/lib/narrative/osint';
import { seedClaims, seedResponses } from '@/lib/simulation/seed-narrative';
import { PREDICTION_PRESETS, runPrediction } from '@/lib/war-room/predictive';

export type ActionHorizon = 'now_24h' | 'this_week' | 'lock_poll_day';

export const HORIZON_LABELS: Record<ActionHorizon, string> = {
  now_24h: 'Now · 2–24h Fires',
  this_week: 'This Week · Ground',
  lock_poll_day: 'Lock Before Poll Day',
};

export interface UrgentActionItem {
  id: string;
  horizon: ActionHorizon;
  severity: 'critical' | 'high';
  realityTag: string;
  reality: string;
  actionNow: string;
  impactLabel: string;
  impactTone: 'good' | 'bad' | 'warn' | 'accent';
  targetArea: string;
  owner: string;
  deadline: string;
  steps: string[];
  costOfInaction: string;
  executeHref: string;
  executeLabel: string;
}

export function buildUrgentActions(): UrgentActionItem[] {
  const statusQuo = runPrediction(PREDICTION_PRESETS.status_quo.inputs);
  const claims = seedClaims();
  const responses = seedResponses();

  const byActionId = (id: string) => statusQuo.mandatoryActions.find((a) => a.id === id);
  const claimById = (id: string) => claims.find((c) => c.id === id);
  const respFor = (claimId: string) => responses.find((r) => r.claimId === claimId);

  const c1 = claimById('c-1'); // 2018 Offa/Saraki clips
  const c4 = claimById('c-4'); // ADC Oyedepo split push
  const c5 = claimById('c-5'); // Ilorin–Omu-Aran–Kabba roads
  const r1Held = c1 ? !isSendable(respFor(c1.id)!) : true;
  const r4Held = c4 ? !isSendable(respFor(c4.id)!) : true;

  const actDigital = byActionId('act-digital');
  const actSdp = byActionId('act-sdp');
  const actAshiru = byActionId('act-ashiru');
  const actAdc = byActionId('act-adc');
  const actIfelodun = byActionId('act-ifelodun');

  return [
    // =========================================================================
    // HORIZON 1: RIGHT NOW (2–24h LIVE FIRES)
    // =========================================================================
    {
      id: 'ua-2018-clips',
      horizon: 'now_24h',
      severity: 'critical',
      realityTag: `OSINT FIRE · REL ${c1?.relevanceScore ?? 98}/100 · ×${c1 ? velocity(c1).toFixed(1) : '2.8'}`,
      reality:
        'Viral TikTok & WhatsApp clips are splicing Popoola’s 2018 Offa robbery remarks to depress legacy Saraki/PDP voter turnout in Irepodun & Ifelodun.',
      actionNow: r1Held
        ? 'Approve & dispatch the Yoruba/English inoculation draft held at the OSINT gate + drop joint Saraki–Popoola Irepodun visuals.'
        : 'Syndicate approved Yoruba/English inoculation across all 83 ward WhatsApp broadcast nodes.',
      impactLabel: 'SLA: 2 Hours · Gate Held',
      impactTone: 'bad',
      targetArea: 'Irepodun · Ifelodun · Offa',
      owner: 'Publicity Secretary & Campaign Director',
      deadline: 'Within 2 hours (Today)',
      steps: [
        'Open OSINT Command → tap the held 2018-clip claim card (c-1).',
        'Sign off the bilingual Yoruba/English rebuttal framing Popoola’s public apology as political maturity.',
        'Push joint Dr. Bukola Saraki + Popoola Irepodun tour visuals across Okin FM, Harmony FM & 83 ward WhatsApp hubs.',
      ],
      costOfInaction:
        'Unanswered 2018 clips chill legacy PDP base turnout in Irepodun & Ifelodun by 3,000–5,000 votes.',
      executeHref: '/war-room/narrative',
      executeLabel: 'Approve & Dispatch in OSINT',
    },
    {
      id: 'ua-adc-radio',
      horizon: 'now_24h',
      severity: 'critical',
      realityTag: `VOTE-SPLIT ALERT · REL ${c4?.relevanceScore ?? 91}/100`,
      reality:
        'Akogun Iyiola Oyedepo (ADC, Isanlu-Isin) is pulling angry anti-APC & 2023 SDP voters on Harmony FM — risking a repeat of the 2023 opposition split that gifted APC the seat.',
      actionNow: r4Held
        ? 'Clear & air the “59,215 Beat 55,966 — Don’t Split the Change Vote” Yoruba radio drop on Okin FM & Harmony FM.'
        : 'Escalate tactical-unity radio drops across Isin, Irepodun & Ifelodun.',
      impactLabel: `+${(actAdc?.marginalVoteYield ?? 4500).toLocaleString()} net votes`,
      impactTone: 'warn',
      targetArea: 'Isin · Irepodun · Ifelodun (Igbomina)',
      owner: 'Igbomina Co-Directors & Radio Desk',
      deadline: 'Next radio belt (Within 6 hours)',
      steps: [
        'Open OSINT Command → sign off claim c-4 Yoruba radio script citing INEC 2023 math (PDP 34,950 + SDP 24,265 = 59,215 > APC 55,966).',
        'Respect Akogun Oyedepo personally — never attack him; focus strictly on 907-PU capacity to beat APC.',
        'Deploy Igbomina leaders on morning radio to eliminate the “Offa-only” whisper narrative.',
      ],
      costOfInaction:
        'If ADC drains 12,000–16,000 anti-APC votes across Isin/Irepodun/Ifelodun, APC wins through the middle.',
      executeHref: '/war-room/narrative',
      executeLabel: 'Clear Radio Script in OSINT',
    },
    {
      id: 'ua-security-roads',
      horizon: 'now_24h',
      severity: 'high',
      realityTag: `TOP ISSUE · REL ${c5?.relevanceScore ?? 89}/100`,
      reality:
        'Late-2025 Eruku church abductions, Owa-Onire displacements, and Isin/Ekiti road barricades (“Enough is Enough”) have APC’s 8-year incumbency on the defensive.',
      actionNow:
        'Pin collapsed federal roads & rural kidnappings squarely on 8 years of APC control while broadcasting Popoola’s proven 2011–2013 Offa Neighbourhood Watch record in Yoruba & Fulfulde.',
      impactLabel: 'SLA: 6 Hours · #1 Voter Issue',
      impactTone: 'accent',
      targetArea: 'Oke-Ero (Eruku) · Ifelodun · Isin · Ekiti',
      owner: 'Policy & Security Desk',
      deadline: 'Today (Evening radio & press)',
      steps: [
        'Dispatch the approved Fulfulde + Yoruba Neighbourhood Watch clarification (claim c-2) affirming Fulani & police inclusion.',
        'Sign off claim c-5 press brief tying Ilorin–Omu-Aran–Kabba & Iloffa–Ekiti craters to APC’s 2019–2026 record.',
        'Publish the 83-Ward Liaison Officers security & road audit charter.',
      ],
      costOfInaction:
        'Cedes Kwara South’s #1 issue to Adewoye’s untested “state police” talking point.',
      executeHref: '/war-room/narrative',
      executeLabel: 'Launch Security & Roads Push',
    },

    // =========================================================================
    // HORIZON 2: THIS WEEK (GROUND-GAME REALITIES)
    // =========================================================================
    {
      id: 'ua-sdp-harmonise',
      horizon: 'this_week',
      severity: 'critical',
      realityTag: '2023 BASE REALITY · 24,265 SDP VOTES',
      reality:
        'PDP (34,950) + SDP (24,265) ALREADY beat APC (55,966) by +3,249 in 2023, yet ward harmonisation between returning 2023 SDP coordinators and legacy PDP officers is still incomplete (~42%).',
      actionNow:
        'Formally fold returning 2023 SDP coordinators into titled Ward Liaison roles across Ifelodun, Offa, Oyun & Irepodun before Dec 15.',
      impactLabel: `+${(actSdp?.marginalVoteYield ?? 9200).toLocaleString()} net votes`,
      impactTone: 'good',
      targetArea: 'Ifelodun (18 W) · Offa (12 W) · Oyun (11 W) · Irepodun (11 W)',
      owner: 'Senatorial Chairman & Reconciliation Desk',
      deadline: 'Complete by 15 Dec 2026',
      steps: actSdp?.exactActionSteps ?? [
        'Co-opt 2023 SDP ward coordinators into KS2027 ward campaign committees.',
        'Run joint Saraki + Popoola + ex-SDP unity meetings in Share, Omu-Aran & Offa.',
      ],
      costOfInaction:
        'Unreconciled SDP coordinators drift to ADC or sit out poll day — leaving PDP trapped ~10,000+ votes behind APC.',
      executeHref: '/war-room/reconciliation',
      executeLabel: 'Open Reconciliation Pipeline',
    },
    {
      id: 'ua-ashiru-fracture',
      horizon: 'this_week',
      severity: 'critical',
      realityTag: 'APC INTERNAL WOUND · MAY 18, 2026 PRIMARY',
      reality:
        'Incumbent Deputy Senate Leader Lola Ashiru placed 3rd behind Adewoye in May 2026 alongside 9 losing aspirants — AND APC zoned 2027 governorship to Kwara North (Speaker Danladi Salihu).',
      actionNow:
        'Run quiet, respectful bilateral back-channel outreach to aggrieved Ashiru ward captains in Offa, Irepodun & Ifelodun to secure neutrality or silent support.',
      impactLabel: `+${(actAshiru?.marginalVoteYield ?? 4800).toLocaleString()} net votes`,
      impactTone: 'good',
      targetArea: 'Offa · Irepodun · Ifelodun · Oyun',
      owner: 'Principal & Senior Envoys',
      deadline: 'Bilateral outreach by 22 Dec 2026',
      steps: actAshiru?.exactActionSteps ?? [
        'Prohibit public gloating over Ashiru’s primary defeat.',
        'Engage aggrieved ward mobilisers privately around defending Kwara South’s voice.',
      ],
      costOfInaction:
        'Gives APC 7 weeks to heal its primary rift and rally united state patronage behind Adewoye.',
      executeHref: '/war-room/dossier',
      executeLabel: 'Review Rival Fracture Dossier',
    },
    {
      id: 'ua-igbomina-reach',
      horizon: 'this_week',
      severity: 'high',
      realityTag: 'GEOGRAPHIC REALITY · 60 OF 83 WARDS',
      reality:
        'Igbomina & Ekiti LGAs hold 60/83 wards (626/907 PUs), and both Adewoye (top primary in Isin) and Oyedepo (Isanlu-Isin) fish directly in Igbomina waters while Ifelodun sits at a 22.6% turnout floor.',
      actionNow:
        'Lock 65%+ of field/transport spend into Ifelodun (236 PUs) & Irepodun (158 PUs), elevate Igbomina co-directors publicly, and deploy ward transport for rural farming communities.',
      impactLabel: `+${(actIfelodun?.marginalVoteYield ?? 3800).toLocaleString()} net votes`,
      impactTone: 'accent',
      targetArea: 'Ifelodun (236 PUs) · Irepodun (158 PUs) · Oke-Ero · Ekiti',
      owner: 'Field Operations & Igbomina Co-Directors',
      deadline: 'Lock ward schedule by 20 Dec 2026',
      steps: actIfelodun?.exactActionSteps ?? [
        'Publish 83-ward liaison roster highlighting 60 Igbomina/Ekiti officers.',
        'Deploy safe-passage & transport plan for Owa-Onire, Share, Oke-Ode & Babanla.',
      ],
      costOfInaction:
        'Offa alone (173 PUs) cannot win a 907-PU Senate district — losing Igbomina equity caps Popoola below 42%.',
      executeHref: '/war-room/structure',
      executeLabel: 'Inspect 83-Ward Power Map',
    },

    // =========================================================================
    // HORIZON 3: LOCK BEFORE POLL DAY (907-PU DIGITAL DEFENCE)
    // =========================================================================
    {
      id: 'ua-digital-907pu',
      horizon: 'lock_poll_day',
      severity: 'critical',
      realityTag: `DIGITAL DEFENCE GAP · ${statusQuo.digitalResult.uncoveredPollingUnits}/907 PUs BLIND`,
      reality:
        'Adewoye brings a 30-year industrialist war chest + sitting state machinery. On current analog operations, 653 of Kwara South’s 907 PUs have zero live EC8A capture and 2+ hour incident lag.',
      actionNow:
        'Deploy the Osun Aug 2026 digital playbook across all 907 Kwara South PUs: live EC8A photo-capture agents, 4-language WhatsApp/TikTok hubs, youth/diaspora pledge tracking, and <15-min incident triage.',
      impactLabel: `+${(actDigital?.marginalVoteYield ?? 11000).toLocaleString()} net votes`,
      impactTone: 'good',
      targetArea: 'All 7 LGAs · 83 Wards · 907 Polling Units',
      owner: 'Digital Command & Collation Lead',
      deadline: 'Onboard 907 PU agents by 20 Dec 2026',
      steps: actDigital?.exactActionSteps ?? [
        'Recruit & train 907 smartphone PU agents for live EC8A photo upload.',
        'Stand up 83 Ward WhatsApp broadcast nodes & <15-min incident desk.',
      ],
      costOfInaction:
        'Without digital PU defence & tracked turnout, even strong traditional ground work stays a fragile toss-up against APC cash.',
      executeHref: '/war-room/digital',
      executeLabel: 'Open Digital Wave Simulator',
    },
  ];
}
