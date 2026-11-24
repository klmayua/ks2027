/**
 * Digital Wave Simulation Engine — Kwara South 2027.
 *
 * Abstracts the four verified digital campaign mechanics documented by Farawa Media in
 * "How Digital Won Osun 2026" (INEC Aug 15–16, 2026 declaration: 511,067 votes, +66,252 margin
 * across 30 LGAs / 332 wards despite federal incumbency and a party switch) and models how those
 * exact operational levers perform when deployed across Kwara South's 7 LGAs, 83 wards, and
 * 907 post-2021 polling units.
 *
 * All Osun figures are explicitly badged as verified external benchmark context; all Kwara South
 * vote projections are transparently marked as modeled scenario outputs over INEC 2023 baselines.
 */

import { lgasByWeight } from '@/lib/geography/results-2023';
import { POST_2021_PUS_BY_LGA, pollingUnitRoll } from '@/lib/geography/roll';

export interface OsunBenchmarkFact {
  metric: string;
  value: string;
  detail: string;
}

export const OSUN_2026_BENCHMARK = {
  title: 'August 15, 2026 Strategic Benchmark (Methodology Reference Only)',
  source: 'INEC Declaration (15–16 Aug 2026) · Mechanism analysis: Farawa Media',
  summary:
    'In August 2026, a state-level opposition/re-aligned campaign defeated full federal incumbency, patronage, and party-switch confusion by +66,252 votes (511,067 vs. 444,815). Kwara South 2027 does NOT copy Osun politics — it translates the four repeatable digital mechanisms onto Kwara South’s 907 polling units.',
  stats: [
    { metric: 'Benchmark Winner Tally', value: '511,067', detail: 'Verified INEC declaration (Aug 15–16, 2026)' },
    { metric: 'Margin Over Federal Party', value: '+66,252', detail: 'Despite federal might, cash & late party switch' },
    { metric: 'Footprint Defended', value: '30 LGAs / 332 Wards', detail: 'KS2027 scale: 7 LGAs / 83 Wards / 907 PUs (4× tighter span)' },
    { metric: 'Decisive Edge', value: 'Real-Time Digital', detail: 'PU photo-capture + narrative speed + tracked turnout + live triage' },
  ] as OsunBenchmarkFact[],
};

export interface DigitalWaveInputs {
  /** % of Kwara South's 907 PUs covered by real-time photo-tabulation & IReV parity agents (0–100). */
  puCaptureCoveragePct: number;
  /** Coordinated multi-language narrative velocity across WhatsApp/TikTok/Facebook/Radio (0–100). */
  narrativeSyncScore: number;
  /** Online-to-ground tracked youth, campus & Kwara South diaspora turnout engine (0–100). */
  youthDiasporaMobilisation: number;
  /** Mean incident response time from field alert to war-room action, in minutes (10–180). Lower is better. */
  incidentResponseMinutes: number;
}

export const DIGITAL_PRESETS: Record<
  'current' | 'partial' | 'full_wave',
  { label: string; tag: string; description: string; inputs: DigitalWaveInputs }
> = {
  current: {
    label: 'Current Baseline (Analog)',
    tag: 'No Digital Wave',
    description:
      'Traditional analog ward captains, slow manual collation, ad-hoc WhatsApp forwards, 2+ hour incident lag. Leaves APC cash & dark-room alteration uncontested.',
    inputs: {
      puCaptureCoveragePct: 28,
      narrativeSyncScore: 30,
      youthDiasporaMobilisation: 25,
      incidentResponseMinutes: 135,
    },
  },
  partial: {
    label: 'Partial Digital Sync',
    tag: 'Mid-Grade Rollout',
    description:
      'Digital PU capture in urban Offa/Omu-Aran wards (~62%), moderate Yoruba/English content drops, partial youth tracking — still exposed in rural Ifelodun & Oke-Ero.',
    inputs: {
      puCaptureCoveragePct: 62,
      narrativeSyncScore: 60,
      youthDiasporaMobilisation: 55,
      incidentResponseMinutes: 55,
    },
  },
  full_wave: {
    label: 'Full Osun-Grade Digital Wave',
    tag: 'Recommended Target',
    description:
      '96%+ real-time photo capture across all 907 PUs, 4-language rapid narrative sync ahead of state media, tracked youth/diaspora turnout push, and <15-min live incident command.',
    inputs: {
      puCaptureCoveragePct: 96,
      narrativeSyncScore: 92,
      youthDiasporaMobilisation: 88,
      incidentResponseMinutes: 14,
    },
  },
};

export interface DigitalMechanismImpact {
  id: 'unriggable_pu' | 'narrative_speed' | 'turnout_beats_cash' | 'eyes_on_units';
  title: string;
  principle: string;
  kwaraSouthApplication: string;
  currentValueLabel: string;
  netVotesImpact: number;
  maxPotentialVotes: number;
  readinessPct: number;
  owner: string;
  keyDeliverables: string[];
}

export interface LgaDigitalBreakdown {
  lgaCode: string;
  name: string;
  pollingUnits: number;
  coveredPus: number;
  baselineValidVotes: number;
  baselineTurnout: number;
  votesProtected: number;
  narrativeRetained: number;
  turnoutAdded: number;
  incidentsRescued: number;
  totalNetSwing: number;
  digitalPriority: 'critical' | 'high' | 'standard';
  rationale: string;
}

export interface DigitalWaveResult {
  inputs: DigitalWaveInputs;
  /** Total modeled net vote swing for PDP Popoola from digital operations (above 0-digital floor). */
  totalNetDigitalSwing: number;
  /** Additional net swing compared to current analog baseline. */
  liftOverAnalogBaseline: number;
  /** Breakdown across the 4 mechanisms. */
  votesProtectedFromLeakage: number;
  narrativeVotesRetained: number;
  turnoutVotesAdded: number;
  suppressionVotesRescued: number;
  /** Number of Kwara South's 907 PUs actively monitored in real time. */
  coveredPollingUnits: number;
  uncoveredPollingUnits: number;
  /** Composite 0–100 digital readiness index. */
  readinessIndex: number;
  mechanisms: DigitalMechanismImpact[];
  lgaBreakdown: LgaDigitalBreakdown[];
  /** Cost-of-inaction note if campaign skips digital. */
  verdictHeadline: string;
  verdictDetail: string;
}

const LGA_DIGITAL_PROFILE: Record<
  string,
  { youthDensity: number; leakageRisk: number; confusionRisk: number; priority: 'critical' | 'high' | 'standard'; rationale: string }
> = {
  '05': {
    youthDensity: 1.15,
    leakageRisk: 1.35,
    confusionRisk: 1.25,
    priority: 'critical',
    rationale: '236 PUs (largest LGA) + 22.6% lowest turnout + rural banditry/SDP confusion. Highest digital ROI in Kwara South.',
  },
  '13': {
    youthDensity: 1.35,
    leakageRisk: 1.0,
    confusionRisk: 1.2,
    priority: 'critical',
    rationale: '173 PUs + Federal Polytechnic / urban youth & diaspora hub. Digital locks Popoola’s home margin and neutralises 2018 clip smears.',
  },
  '09': {
    youthDensity: 1.25,
    leakageRisk: 1.15,
    confusionRisk: 1.25,
    priority: 'critical',
    rationale: '158 PUs (Omu-Aran / Landmark Univ. corridor). Critical Igbomina battleground against APC cash & ADC protest pull.',
  },
  '15': {
    youthDensity: 1.0,
    leakageRisk: 0.95,
    confusionRisk: 1.0,
    priority: 'high',
    rationale: '108 PUs (Ibolo corridor). Digital defends Popoola’s 2023 Reps carryover and accelerates SDP→PDP ballot clarity.',
  },
  '10': {
    youthDensity: 0.9,
    leakageRisk: 1.05,
    confusionRisk: 1.15,
    priority: 'high',
    rationale: '80 PUs (Adewoye & Oyedepo Igbomina hub). Rapid narrative sync stops total PDP bleed and defends minority votes.',
  },
  '14': {
    youthDensity: 0.85,
    leakageRisk: 1.15,
    confusionRisk: 0.95,
    priority: 'high',
    rationale: '76 PUs (Eruku security flashpoint). Real-time incident command reassures anxious rural voters on poll day.',
  },
  '04': {
    youthDensity: 0.85,
    leakageRisk: 1.1,
    confusionRisk: 0.95,
    priority: 'standard',
    rationale: '76 PUs (Iloffa–Ekiti road corridor). Parallel photo capture prevents quiet collation leakage in remote wards.',
  },
};

function computeRaw(inputs: DigitalWaveInputs) {
  const ranked = lgasByWeight();
  const totalPus = pollingUnitRoll.currentTotal; // 907

  // Normalize incident response SLA: 180 min -> 0.0, 10 min -> 1.0
  const responseSpeedNorm = Math.max(0, Math.min(1, (180 - inputs.incidentResponseMinutes) / 170));
  const puNorm = Math.max(0, Math.min(1, inputs.puCaptureCoveragePct / 100));
  const narrativeNorm = Math.max(0, Math.min(1, inputs.narrativeSyncScore / 100));
  const turnoutNorm = Math.max(0, Math.min(1, inputs.youthDiasporaMobilisation / 100));

  const lgaBreakdown: LgaDigitalBreakdown[] = ranked.map((l) => {
    const pus = POST_2021_PUS_BY_LGA[l.lgaCode] ?? 0;
    const prof = LGA_DIGITAL_PROFILE[l.lgaCode] ?? {
      youthDensity: 1,
      leakageRisk: 1,
      confusionRisk: 1,
      priority: 'standard' as const,
      rationale: 'Standard polling-unit coverage target.',
    };

    // Transparent per-LGA vote equations scaled to Kwara South's 124,294 proxy valid votes
    // 1. Un-riggable PU Capture: protects up to ~4.8% of LGA valid votes from alteration/voiding/leakage
    const votesProtected = Math.round(l.validVotes * 0.046 * prof.leakageRisk * Math.pow(puNorm, 1.15));

    // 2. Faster-than-State Narrative Sync: retains up to ~3.6% of LGA valid votes from rumour & SDP->PDP switch confusion
    const narrativeRetained = Math.round(l.validVotes * 0.035 * prof.confusionRisk * narrativeNorm);

    // 3. Turnout Beats Cash: online+diaspora+campus tracked turnout lift (stronger where baseline turnout is low!)
    const turnoutHeadroom = Math.max(0.6, (0.38 - l.turnout) / 0.14); // Ifelodun (22.6%) gets highest headroom
    const turnoutAdded = Math.round(
      l.validVotes * 0.052 * prof.youthDensity * Math.min(1.4, turnoutHeadroom) * turnoutNorm
    );

    // 4. Eyes on Every Unit: rescues up to ~2.1% of LGA valid votes from poll-day disruption/intimidation
    const incidentsRescued = Math.round(l.validVotes * 0.021 * prof.leakageRisk * responseSpeedNorm);

    const totalNetSwing = votesProtected + narrativeRetained + turnoutAdded + incidentsRescued;

    return {
      lgaCode: l.lgaCode,
      name: l.name,
      pollingUnits: pus,
      coveredPus: Math.round(pus * puNorm),
      baselineValidVotes: l.validVotes,
      baselineTurnout: l.turnout,
      votesProtected,
      narrativeRetained,
      turnoutAdded,
      incidentsRescued,
      totalNetSwing,
      digitalPriority: prof.priority,
      rationale: prof.rationale,
    };
  });

  const votesProtectedFromLeakage = lgaBreakdown.reduce((s, x) => s + x.votesProtected, 0);
  const narrativeVotesRetained = lgaBreakdown.reduce((s, x) => s + x.narrativeRetained, 0);
  const turnoutVotesAdded = lgaBreakdown.reduce((s, x) => s + x.turnoutAdded, 0);
  const suppressionVotesRescued = lgaBreakdown.reduce((s, x) => s + x.incidentsRescued, 0);
  const totalNetDigitalSwing =
    votesProtectedFromLeakage + narrativeVotesRetained + turnoutVotesAdded + suppressionVotesRescued;

  const coveredPollingUnits = Math.min(totalPus, Math.round(totalPus * puNorm));
  const readinessIndex = Math.round(
    puNorm * 32 + narrativeNorm * 24 + turnoutNorm * 26 + responseSpeedNorm * 18
  );

  return {
    lgaBreakdown,
    votesProtectedFromLeakage,
    narrativeVotesRetained,
    turnoutVotesAdded,
    suppressionVotesRescued,
    totalNetDigitalSwing,
    coveredPollingUnits,
    uncoveredPollingUnits: totalPus - coveredPollingUnits,
    readinessIndex,
    responseSpeedNorm,
    puNorm,
    narrativeNorm,
    turnoutNorm,
  };
}

export function simulateDigitalWave(inputs: DigitalWaveInputs): DigitalWaveResult {
  const current = computeRaw(inputs);
  const analog = computeRaw(DIGITAL_PRESETS.current.inputs);
  const maxPossible = computeRaw({
    puCaptureCoveragePct: 100,
    narrativeSyncScore: 100,
    youthDiasporaMobilisation: 100,
    incidentResponseMinutes: 10,
  });

  const liftOverAnalogBaseline = current.totalNetDigitalSwing - analog.totalNetDigitalSwing;

  const mechanisms: DigitalMechanismImpact[] = [
    {
      id: 'unriggable_pu',
      title: '1. Results Made Un-Riggable',
      principle: 'Every polling unit EC8A photographed, timestamped & published live at declaration.',
      kwaraSouthApplication:
        'Deploy 907 trained digital PU agents across all 7 Kwara South LGAs (priority: 236 PUs in Ifelodun & 158 in Irepodun) uploading signed EC8A sheets to the KS2027 Public Ledger before ward collation alters numbers in the dark.',
      currentValueLabel: `${inputs.puCaptureCoveragePct}% (${current.coveredPollingUnits} / 907 PUs)`,
      netVotesImpact: current.votesProtectedFromLeakage,
      maxPotentialVotes: maxPossible.votesProtectedFromLeakage,
      readinessPct: Math.round(current.puNorm * 100),
      owner: 'Election-Day Collation Lead',
      keyDeliverables: [
        '907 verified PU agent smartphones with offline-queued EC8A upload',
        'Auto-checksum cross-matching against INEC IReV uploads in real time',
        'Public live ledger mirror to deter collation-centre tampering',
      ],
    },
    {
      id: 'narrative_speed',
      title: '2. Faster Than the State',
      principle: 'One coordinated message beats state media, smears & ballot confusion in every language.',
      kwaraSouthApplication:
        'Mirror how August 2026 solved late party-switch confusion: flood WhatsApp, Facebook, TikTok & local radio (Okin FM, Harmony FM, Radio Kwara, Sobi FM) in Yoruba (Igbomina/Offa/Ekiti), English, Pidgin & Fulfulde — locking SDP→PDP ballot clarity and pre-bunking 2018 Offa clip smears.',
      currentValueLabel: `${inputs.narrativeSyncScore} / 100 sync velocity`,
      netVotesImpact: current.narrativeVotesRetained,
      maxPotentialVotes: maxPossible.narrativeVotesRetained,
      readinessPct: Math.round(current.narrativeNorm * 100),
      owner: 'Publicity Secretary & OSINT Desk',
      keyDeliverables: [
        '83 Ward WhatsApp broadcast hubs receiving approved audio/video drops within 15 minutes',
        '4-language voice notes (Igbomina Yoruba, Offa Yoruba, Pidgin, Fulfulde) for non-literate rural voters',
        '2-hour SLA OSINT rebuttal pipeline with named human sign-off',
      ],
    },
    {
      id: 'turnout_beats_cash',
      title: '3. Turnout Beats Cash',
      principle: 'Ground + online mobilisation delivers tracked supporters to out-organise vote-buying.',
      kwaraSouthApplication:
        'APC’s Adewoye brings superior corporate & state cash. Instead of matching naira-for-naira, run digital supporter pledge-tracking across Offa (FedPoly), Omu-Aran (Landmark Univ.), Ifelodun youth & Lagos/Abuja/diaspora Kwara South associations driving relatives home to vote.',
      currentValueLabel: `${inputs.youthDiasporaMobilisation} / 100 mobilisation index`,
      netVotesImpact: current.turnoutVotesAdded,
      maxPotentialVotes: maxPossible.turnoutVotesAdded,
      readinessPct: Math.round(current.turnoutNorm * 100),
      owner: 'Youth, Campus & Diaspora Director',
      keyDeliverables: [
        'Digital voter-pledge & PU-check reminders across Offa, Irepodun & Ifelodun youth groups',
        'Kwara South Diaspora “Call Home to Vote” phone-tree targeting Ifelodun’s 22.6% low-turnout wards',
        'Hyper-local 45-sec TikTok/Reels spotlighting Popoola’s security & road commitments',
      ],
    },
    {
      id: 'eyes_on_units',
      title: '4. Eyes on Every Unit',
      principle: 'Incidents seen and answered in minutes, not reported days later after collation closes.',
      kwaraSouthApplication:
        'Connect all 83 ward officers and 907 PU agents to a live incident command room with rapid legal, security-liaison, and media-alert response (especially across Oke-Ero/Eruku & remote Ifelodun wards where intimidation or BVAS delays suppress turnout).',
      currentValueLabel: `${inputs.incidentResponseMinutes}-min response SLA`,
      netVotesImpact: current.suppressionVotesRescued,
      maxPotentialVotes: maxPossible.suppressionVotesRescued,
      readinessPct: Math.round(current.responseSpeedNorm * 100),
      owner: 'Situation Room & Legal Adviser',
      keyDeliverables: [
        '1-tap mobile incident flare from /field to War Room command queue',
        'Direct legal & INEC EO escalation desk on standby per LGA',
        'Instant press & observer alert push whenever intimidation occurs',
      ],
    },
  ];

  let verdictHeadline: string;
  let verdictDetail: string;
  if (current.readinessIndex >= 80) {
    verdictHeadline = `Digital Wave Active: +${current.totalNetDigitalSwing.toLocaleString()} net votes defended & generated`;
    verdictDetail = `Adds +${liftOverAnalogBaseline.toLocaleString()} net votes above an analog campaign — neutralising APC’s cash/incumbency advantage across ${current.coveredPollingUnits} of 907 PUs.`;
  } else if (current.readinessIndex >= 50) {
    verdictHeadline = `Partial Digital Footprint: ${current.uncoveredPollingUnits} polling units remain blind`;
    verdictDetail = `Generates +${current.totalNetDigitalSwing.toLocaleString()} net votes, leaving +${(
      maxPossible.totalNetDigitalSwing - current.totalNetDigitalSwing
    ).toLocaleString()} recoverable digital votes on the table — risky in rural Ifelodun & Irepodun.`;
  } else {
    verdictHeadline = `CRITICAL EXPOSURE: Analog Campaign Leaves ${current.uncoveredPollingUnits} / 907 PUs Defenceless`;
    verdictDetail = `At current analog settings, APC’s superior cash & state machinery go unchallenged. Deploying an Osun-grade digital wave unlocks +${(
      maxPossible.totalNetDigitalSwing - current.totalNetDigitalSwing
    ).toLocaleString()} additional net votes.`;
  }

  return {
    inputs,
    totalNetDigitalSwing: current.totalNetDigitalSwing,
    liftOverAnalogBaseline,
    votesProtectedFromLeakage: current.votesProtectedFromLeakage,
    narrativeVotesRetained: current.narrativeVotesRetained,
    turnoutVotesAdded: current.turnoutVotesAdded,
    suppressionVotesRescued: current.suppressionVotesRescued,
    coveredPollingUnits: current.coveredPollingUnits,
    uncoveredPollingUnits: current.uncoveredPollingUnits,
    readinessIndex: current.readinessIndex,
    mechanisms,
    lgaBreakdown: current.lgaBreakdown,
    verdictHeadline,
    verdictDetail,
  };
}
