/**
 * KS2027 Predictive & Prescriptive Engine — Kwara South Senatorial District.
 *
 * Commercial core of the War Room: answers three executive questions with auditable math
 * over verified INEC 2023 baselines (APC 55,966 · PDP 34,950 · SDP 24,265; 7-LGA valid vote
 * proxy 124,294; 907 post-2021 PUs):
 *
 *   1. WHAT IS THE SITUATION TODAY? (Honest status-quo diagnosis — no sugarcoating)
 *   2. WHAT DOES IT PREDICT? (Win probability, PDP/APC/ADC vote projection, 7-LGA swing map,
 *      and 3-scenario fan: Do Nothing vs. Ground Only vs. Full Ground + Digital Wave)
 *   3. WHAT MUST BE DONE? (Auto-ranked mandatory actions ordered by marginal vote yield)
 */

import {
  SENATE_TOTALS_2023,
  lgasByWeight,
  totalValidVotes,
} from '@/lib/geography/results-2023';
import { POST_2021_PUS_BY_LGA } from '@/lib/geography/roll';
import {
  DIGITAL_PRESETS,
  simulateDigitalWave,
  type DigitalWaveInputs,
  type DigitalWaveResult,
} from '@/lib/war-room/digital-wave';

export interface PredictionInputs {
  /** % of 2023 SDP vote pool (24,265) successfully unified behind Popoola (PDP). */
  sdpHarmonisationPct: number;
  /** % effectiveness containing ADC (Akogun Oyedepo) vote-splitting in Isin/Irepodun/Ifelodun. */
  adcContainmentPct: number;
  /** % of aggrieved May 2026 APC primary (Sen. Lola Ashiru & 10 aspirants) soft voters harvested/neutralised. */
  ashiruFractureHarvestPct: number;
  /** Percentage-point turnout lift in Ifelodun & rural farming wards above 2023 22.6% floor (0–10 pts). */
  ifelodunTurnoutLiftPts: number;
  /** OSINT rapid-response & topical narrative discipline (0–100: security/roads framing + 2018 clip inoculation). */
  osintDisciplinePct: number;
  /** Coupled Digital Wave operational levers (derived from Aug 2026 Osun mechanics). */
  digital: DigitalWaveInputs;
}

export const PREDICTION_PRESETS: Record<
  'status_quo' | 'ground_only' | 'full_execution',
  {
    id: 'status_quo' | 'ground_only' | 'full_execution';
    label: string;
    shortLabel: string;
    tagline: string;
    inputs: PredictionInputs;
  }
> = {
  status_quo: {
    id: 'status_quo',
    label: 'Scenario 1: Status Quo (Do Nothing / Coast)',
    shortLabel: 'Status Quo',
    tagline: 'Fragmented SDP/PDP wards, uncontained Oyedepo ADC bleed, analog PU coverage.',
    inputs: {
      sdpHarmonisationPct: 42,
      adcContainmentPct: 32,
      ashiruFractureHarvestPct: 16,
      ifelodunTurnoutLiftPts: 1.0,
      osintDisciplinePct: 44,
      digital: DIGITAL_PRESETS.current.inputs,
    },
  },
  ground_only: {
    id: 'ground_only',
    label: 'Scenario 2: Traditional Ground Game Only (No Digital Wave)',
    shortLabel: 'Ground Only',
    tagline: 'Strong PDP–SDP reconciliation & Ashiru outreach, but analog collation & slow response leave PUs exposed to APC cash.',
    inputs: {
      sdpHarmonisationPct: 78,
      adcContainmentPct: 62,
      ashiruFractureHarvestPct: 42,
      ifelodunTurnoutLiftPts: 4.0,
      osintDisciplinePct: 70,
      digital: DIGITAL_PRESETS.current.inputs,
    },
  },
  full_execution: {
    id: 'full_execution',
    label: 'Scenario 3: Full Ground + Osun-Grade Digital Wave',
    shortLabel: 'Full + Digital',
    tagline: 'Reunified PDP+SDP base, ADC tactical containment, Ashiru fracture harvest, Ifelodun turnout lift, and 907-PU real-time digital defence.',
    inputs: {
      sdpHarmonisationPct: 84,
      adcContainmentPct: 74,
      ashiruFractureHarvestPct: 52,
      ifelodunTurnoutLiftPts: 5.5,
      osintDisciplinePct: 90,
      digital: DIGITAL_PRESETS.full_wave.inputs,
    },
  },
};

export interface LgaForecast {
  lgaCode: string;
  name: string;
  pollingUnits: number;
  weightShare: number;
  pdpVotes: number;
  apcVotes: number;
  adcVotes: number;
  otherVotes: number;
  marginPdpVsApc: number;
  winner: 'PDP' | 'APC' | 'TOSSUP';
  digitalContribution: number;
  keyBattlegroundNote: string;
}

export interface MandatoryAction {
  id: string;
  rank: number;
  urgency: 'critical' | 'high' | 'elevated';
  title: string;
  targetArea: string;
  owner: string;
  deadlineWindow: string;
  /** Marginal PDP vs APC net margin gain if executed from current level to full target. */
  marginalVoteYield: number;
  /** Estimated win-probability points gained by executing this action alone. */
  winProbLiftPts: number;
  currentStateLabel: string;
  targetStateLabel: string;
  whyItMatters: string;
  exactActionSteps: string[];
  costOfInaction: string;
  actionHref: string;
  actionCta: string;
}

export interface ScenarioSnapshot {
  id: 'status_quo' | 'ground_only' | 'full_execution';
  label: string;
  shortLabel: string;
  pdpVotes: number;
  apcVotes: number;
  adcVotes: number;
  margin: number;
  winProbabilityPct: number;
  verdict: 'WIN' | 'TOSSUP' | 'LOSS';
}

export interface PredictionResult {
  inputs: PredictionInputs;
  pdpVotes: number;
  apcVotes: number;
  adcVotes: number;
  otherVotes: number;
  totalProjectedVotes: number;
  marginPdpVsApc: number;
  winProbabilityPct: number;
  verdict: 'DECISIVE WIN' | 'LEAN PDP' | 'KNIFE-EDGE TOSS-UP' | 'LEAN APC' | 'PROJECTED LOSS';
  verdictTone: 'good' | 'accent' | 'warn' | 'bad';
  votesNeededToFlip: number;
  /** Exact share of margin explained by the Digital Wave vs. analog baseline. */
  digitalMarginContribution: number;
  digitalResult: DigitalWaveResult;
  situationSummary: {
    headline: string;
    hardTruth: string;
    structuralEdge: string;
    primaryDanger: string;
  };
  lgaForecasts: LgaForecast[];
  scenarios: ScenarioSnapshot[];
  mandatoryActions: MandatoryAction[];
}

/**
 * Per-LGA baseline party propensity priors calibrated to 2023 INEC Kwara South totals
 * (APC 55,966 · PDP 34,950 · SDP 24,265) and verified 2026 candidate hometown/primary footprints.
 */
const LGA_PRIORS: Record<
  string,
  {
    apcBias: number;
    pdpBias: number;
    sdpBias: number;
    adcExposure: number; // Oyedepo (Isanlu-Isin) spoiler intensity
    ashiruVulnerability: number; // May 2026 Lola Ashiru primary wound intensity
    battlegroundNote: string;
  }
> = {
  '05': {
    apcBias: 1.03,
    pdpBias: 0.96,
    sdpBias: 1.18,
    adcExposure: 1.25,
    ashiruVulnerability: 1.0,
    battlegroundNote:
      'Ifelodun (236 PUs, 22.6% floor): Largest prize. Banditry in Owa-Onire/Share–Oke-Ode + 2023 SDP base make this the decisive flip LGA.',
  },
  '13': {
    apcBias: 0.92,
    pdpBias: 1.16,
    sdpBias: 1.22,
    adcExposure: 0.45,
    ashiruVulnerability: 1.55,
    battlegroundNote:
      'Offa (173 PUs): Popoola’s home LGA + Lola Ashiru’s primary wound. Must win by +4,500+ to offset Igbomina pressure.',
  },
  '09': {
    apcBias: 1.09,
    pdpBias: 0.94,
    sdpBias: 0.96,
    adcExposure: 1.35,
    ashiruVulnerability: 1.15,
    battlegroundNote:
      'Irepodun (158 PUs): Core Igbomina swing battleground. Saraki’s tour rebuilt PDP pulse, but Adewoye cash & Oyedepo radio pull are fierce.',
  },
  '15': {
    apcBias: 0.94,
    pdpBias: 1.12,
    sdpBias: 1.08,
    adcExposure: 0.55,
    ashiruVulnerability: 1.05,
    battlegroundNote:
      'Oyun (108 PUs): Ibolo sister LGA where Popoola ran in 2023. High PDP+SDP consolidation target.',
  },
  '10': {
    apcBias: 1.18,
    pdpBias: 0.78,
    sdpBias: 0.75,
    adcExposure: 2.1,
    ashiruVulnerability: 0.7,
    battlegroundNote:
      'Isin (80 PUs): Toughest terrain — Oyedepo’s home (Isanlu-Isin) & Adewoye’s top APC primary LGA. Focus on damage containment.',
  },
  '14': {
    apcBias: 0.95,
    pdpBias: 1.04,
    sdpBias: 0.85,
    adcExposure: 0.85,
    ashiruVulnerability: 0.9,
    battlegroundNote:
      'Oke-Ero (76 PUs): Eruku church abduction outrage & Egbe–Eruku road collapse create a major anti-APC security swing.',
  },
  '04': {
    apcBias: 0.98,
    pdpBias: 1.0,
    sdpBias: 0.88,
    adcExposure: 0.75,
    ashiruVulnerability: 0.85,
    battlegroundNote:
      'Ekiti (76 PUs): Iloffa–Ekiti federal road decay drives anti-incumbent anger; parallel PU capture locks ward parity.',
  },
};

function logisticWinProb(margin: number): number {
  // Smooth logistic curve calibrated so 0 margin = 50%, +12,000 = ~88%, -12,000 = ~12%
  const z = margin / 5800;
  const p = 1 / (1 + Math.exp(-z));
  return Math.max(4, Math.min(96, Math.round(p * 100)));
}

function evaluateCore(inputs: PredictionInputs) {
  const digitalResult = simulateDigitalWave(inputs.digital);
  const analogDigital = simulateDigitalWave(DIGITAL_PRESETS.current.inputs);
  const ranked = lgasByWeight();

  // Normalize biases so weighted sums match exact 2023 Senate base totals
  const rawApcSum = ranked.reduce((s, l) => s + (l.validVotes / totalValidVotes) * LGA_PRIORS[l.lgaCode].apcBias, 0);
  const rawPdpSum = ranked.reduce((s, l) => s + (l.validVotes / totalValidVotes) * LGA_PRIORS[l.lgaCode].pdpBias, 0);
  const rawSdpSum = ranked.reduce((s, l) => s + (l.validVotes / totalValidVotes) * LGA_PRIORS[l.lgaCode].sdpBias, 0);

  const sdpFrac = inputs.sdpHarmonisationPct / 100;
  const adcContainFrac = inputs.adcContainmentPct / 100;
  const ashiruFrac = inputs.ashiruFractureHarvestPct / 100;
  const osintFrac = inputs.osintDisciplinePct / 100;

  const lgaForecasts: LgaForecast[] = ranked.map((l) => {
    const prior = LGA_PRIORS[l.lgaCode];
    const share = l.validVotes / totalValidVotes;
    const pus = POST_2021_PUS_BY_LGA[l.lgaCode] ?? 0;

    // 2023 LGA baseline shares anchored to actual INEC 2023 Senate totals
    const baseApc = SENATE_TOTALS_2023.apc * ((share * prior.apcBias) / rawApcSum);
    const basePdp = SENATE_TOTALS_2023.pdp * ((share * prior.pdpBias) / rawPdpSum);
    const baseSdp = SENATE_TOTALS_2023.sdp * ((share * prior.sdpBias) / rawSdpSum);

    // 1. SDP reunification into PDP vs. leakage to ADC/APC/apathy
    const sdpToPdp = baseSdp * sdpFrac;
    const sdpUnreconciled = baseSdp - sdpToPdp;

    // 2. ADC (Akogun Oyedepo) vote-splitting pressure — peels both unreconciled SDP and soft PDP/APC
    const adcPullIntensity = (1 - adcContainFrac * 0.72) * prior.adcExposure;
    const adcFromSdp = sdpUnreconciled * Math.min(0.75, 0.34 * adcPullIntensity);
    const adcFromPdp = basePdp * Math.min(0.26, 0.13 * adcPullIntensity);
    const adcFromApc = baseApc * Math.min(0.1, 0.045 * adcPullIntensity);
    const adcVotes = Math.round(adcFromSdp + adcFromPdp + adcFromApc + l.validVotes * 0.012 * prior.adcExposure);

    // 3. May 2026 APC Ashiru primary fracture harvest (some stay home, some cross to Popoola)
    const apcFractureLoss = baseApc * 0.21 * ashiruFrac * prior.ashiruVulnerability;
    const apcDefectorsToPdp = apcFractureLoss * 0.52;

    // 4. Ifelodun & rural security/turnout lift (strongest in Ifelodun 05, Oke-Ero 14, Ekiti 04, Irepodun 09)
    const ruralBoostWeight =
      l.lgaCode === '05' ? 1.0 : l.lgaCode === '14' || l.lgaCode === '04' ? 0.55 : l.lgaCode === '09' ? 0.45 : 0.2;
    const newTurnoutVotes = l.registered * (inputs.ifelodunTurnoutLiftPts / 100) * 0.32 * ruralBoostWeight;
    const turnoutToPdp = newTurnoutVotes * 0.64;
    const turnoutToApc = newTurnoutVotes * 0.28;

    // 5. OSINT topical narrative balance (security/roads framing + 2018 clip inoculation)
    // Below 50% discipline = net drag on PDP from 2018 clips & Offa-only smears; above 50% = net gain pinning banditry/roads on APC
    const osintShift = l.validVotes * 0.055 * (osintFrac - 0.48);

    // 6. Coupled Digital Wave impact (from digital-wave.ts)
    const lgaDig = digitalResult.lgaBreakdown.find((d) => d.lgaCode === l.lgaCode);
    const lgaAnalog = analogDigital.lgaBreakdown.find((d) => d.lgaCode === l.lgaCode);
    const digitalDeltaVsAnalog = (lgaDig?.totalNetSwing ?? 0) - (lgaAnalog?.totalNetSwing ?? 0);
    // Digital wave adds turnout/retained votes to PDP and strips dark-room alteration/cash edge from APC
    const digitalToPdp = digitalDeltaVsAnalog * 0.65;
    const digitalTrimFromApc = digitalDeltaVsAnalog * 0.35;

    // Traditional APC state-machinery / cash floor advantage when digital is weak
    const analogApcCashEdge =
      (1 - digitalResult.readinessIndex / 100) * l.validVotes * 0.048;

    const pdpVotes = Math.max(
      400,
      Math.round(basePdp + sdpToPdp - adcFromPdp + apcDefectorsToPdp + turnoutToPdp + osintShift * 0.6 + digitalToPdp)
    );
    const apcVotes = Math.max(
      500,
      Math.round(
        baseApc +
          sdpUnreconciled * 0.22 -
          adcFromApc -
          apcFractureLoss +
          turnoutToApc -
          osintShift * 0.4 -
          digitalTrimFromApc +
          analogApcCashEdge
      )
    );
    const otherVotes = Math.max(120, Math.round(l.validVotes * 0.025));
    const marginPdpVsApc = pdpVotes - apcVotes;

    return {
      lgaCode: l.lgaCode,
      name: l.name,
      pollingUnits: pus,
      weightShare: share,
      pdpVotes,
      apcVotes,
      adcVotes,
      otherVotes,
      marginPdpVsApc,
      winner: marginPdpVsApc > 450 ? 'PDP' : marginPdpVsApc < -450 ? 'APC' : 'TOSSUP',
      digitalContribution: Math.round(digitalDeltaVsAnalog),
      keyBattlegroundNote: prior.battlegroundNote,
    };
  });

  const pdpVotes = lgaForecasts.reduce((s, x) => s + x.pdpVotes, 0);
  const apcVotes = lgaForecasts.reduce((s, x) => s + x.apcVotes, 0);
  const adcVotes = lgaForecasts.reduce((s, x) => s + x.adcVotes, 0);
  const otherVotes = lgaForecasts.reduce((s, x) => s + x.otherVotes, 0);
  const totalProjectedVotes = pdpVotes + apcVotes + adcVotes + otherVotes;
  const marginPdpVsApc = pdpVotes - apcVotes;
  const winProbabilityPct = logisticWinProb(marginPdpVsApc);

  return {
    pdpVotes,
    apcVotes,
    adcVotes,
    otherVotes,
    totalProjectedVotes,
    marginPdpVsApc,
    winProbabilityPct,
    lgaForecasts,
    digitalResult,
  };
}

export function runPrediction(inputs: PredictionInputs): PredictionResult {
  const active = evaluateCore(inputs);
  const withoutDigital = evaluateCore({
    ...inputs,
    digital: DIGITAL_PRESETS.current.inputs,
  });
  const digitalMarginContribution = active.marginPdpVsApc - withoutDigital.marginPdpVsApc;

  // Evaluate the 3 canonical buyer scenarios for instant comparison
  const scenarios: ScenarioSnapshot[] = (
    ['status_quo', 'ground_only', 'full_execution'] as const
  ).map((key) => {
    const preset = PREDICTION_PRESETS[key];
    const res = evaluateCore(preset.inputs);
    return {
      id: key,
      label: preset.label,
      shortLabel: preset.shortLabel,
      pdpVotes: res.pdpVotes,
      apcVotes: res.apcVotes,
      adcVotes: res.adcVotes,
      margin: res.marginPdpVsApc,
      winProbabilityPct: res.winProbabilityPct,
      verdict:
        res.marginPdpVsApc > 2500 ? 'WIN' : res.marginPdpVsApc < -2500 ? 'LOSS' : 'TOSSUP',
    };
  });

  const statusQuoSnap = scenarios[0];

  // Dynamic marginal sensitivity analysis: measure EXACT vote & win-prob gain of closing each gap
  const target = PREDICTION_PRESETS.full_execution.inputs;
  const sensitivityItem = (patch: Partial<PredictionInputs>) => {
    const bumped = evaluateCore({ ...inputs, ...patch });
    return {
      voteGain: Math.max(0, bumped.marginPdpVsApc - active.marginPdpVsApc),
      probGain: Math.max(0, bumped.winProbabilityPct - active.winProbabilityPct),
    };
  };

  const sDigital = sensitivityItem({ digital: target.digital });
  const sSdp = sensitivityItem({
    sdpHarmonisationPct: Math.max(inputs.sdpHarmonisationPct, target.sdpHarmonisationPct),
  });
  const sAshiru = sensitivityItem({
    ashiruFractureHarvestPct: Math.max(inputs.ashiruFractureHarvestPct, target.ashiruFractureHarvestPct),
  });
  const sAdc = sensitivityItem({
    adcContainmentPct: Math.max(inputs.adcContainmentPct, target.adcContainmentPct),
  });
  const sIfelodun = sensitivityItem({
    ifelodunTurnoutLiftPts: Math.max(inputs.ifelodunTurnoutLiftPts, target.ifelodunTurnoutLiftPts),
  });
  const sOsint = sensitivityItem({
    osintDisciplinePct: Math.max(inputs.osintDisciplinePct, target.osintDisciplinePct),
  });

  const rawActions: Omit<MandatoryAction, 'rank'>[] = [
    {
      id: 'act-digital',
      urgency: sDigital.voteGain >= 4000 ? 'critical' : 'high',
      title: 'Deploy Osun-Grade Digital Wave Across All 907 Polling Units',
      targetArea: 'All 7 LGAs · Priority: Ifelodun (236), Offa (173), Irepodun (158)',
      owner: 'Digital Command & Collation Lead',
      deadlineWindow: 'Lock 907 PU agents by 20 Dec 2026',
      marginalVoteYield: sDigital.voteGain,
      winProbLiftPts: sDigital.probGain,
      currentStateLabel: `${active.digitalResult.readinessIndex}/100 readiness (${active.digitalResult.coveredPollingUnits}/907 PUs)`,
      targetStateLabel: '92+/100 readiness (870+/907 PUs live EC8A capture)',
      whyItMatters:
        'APC’s Adewoye brings superior industrial cash & state machinery. Just like Osun Aug 2026 proved, you cannot out-spend federal/state might — you out-see, out-mobilise, and make all 907 PUs un-riggable in real time.',
      exactActionSteps: [
        'Onboard & verify 907 smartphone PU agents to photograph & upload every EC8A sheet at declaration.',
        'Stand up 83 Ward WhatsApp broadcast nodes delivering 4-language SDP→PDP ballot clarity & security clips.',
        'Launch youth/campus (Offa FedPoly, Omu-Aran) & Kwara South diaspora “Call Home to Vote” pledge tracking.',
        'Cut poll-day incident response SLA from 2+ hours to <15 minutes via the War Room command desk.',
      ],
      costOfInaction:
        'Leaves hundreds of rural PUs blind to alteration and cedes youth/diaspora narrative speed to APC.',
      actionHref: '/war-room/digital',
      actionCta: 'Open Digital Wave Simulator',
    },
    {
      id: 'act-sdp',
      urgency: sSdp.voteGain >= 3000 ? 'critical' : 'high',
      title: 'Lock PDP + Returning 2023 SDP Ward Harmonisation (24,265-Vote Pool)',
      targetArea: 'Ifelodun · Offa · Oyun · Irepodun (41+ Core Wards)',
      owner: 'Senatorial Chairman & Reconciliation Desk',
      deadlineWindow: 'Sign ward joint-tickets by 15 Dec 2026',
      marginalVoteYield: sSdp.voteGain,
      winProbLiftPts: sSdp.probGain,
      currentStateLabel: `${inputs.sdpHarmonisationPct}% harmonised`,
      targetStateLabel: `${target.sdpHarmonisationPct}% harmonised`,
      whyItMatters:
        'In 2023, PDP (34,950) + SDP (24,265) = 59,215 — ALREADY ahead of APC’s 55,966. Popoola personally ran on SDP in Ifelodun/Offa/Oyun in 2023; unifying both structures turns a minority into an immediate majority.',
      exactActionSteps: [
        'Formally co-opt 2023 SDP ward coordinators into paid/titled KS2027 Ward Liaison roles.',
        'Hold joint Saraki + Popoola + ex-SDP unity town halls in Share, Omu-Aran, Offa & Ilemona.',
        'Resolve every contested orphan ward in the Reconciliation Pipeline before campaign tours peak.',
      ],
      costOfInaction:
        'Unreconciled SDP coordinators drift to ADC Oyedepo or sit at home — repeating the exact 2023 split that gifted APC the seat.',
      actionHref: '/war-room/reconciliation',
      actionCta: 'Open Reconciliation Pipeline',
    },
    {
      id: 'act-ashiru',
      urgency: sAshiru.voteGain >= 2500 ? 'critical' : 'high',
      title: 'Harvest APC’s May 2026 Post-Primary Fracture (Sen. Lola Ashiru Bloc)',
      targetArea: 'Offa · Irepodun · Ifelodun · Oyun',
      owner: 'Principal & Senior Back-Channel Envoys',
      deadlineWindow: 'Quiet bilateral engagements by 22 Dec 2026',
      marginalVoteYield: sAshiru.voteGain,
      winProbLiftPts: sAshiru.probGain,
      currentStateLabel: `${inputs.ashiruFractureHarvestPct}% fracture harvested`,
      targetStateLabel: `${target.ashiruFractureHarvestPct}% harvested / neutralised`,
      whyItMatters:
        'Incumbent Deputy Senate Leader Lola Ashiru finished 3rd in the May 18, 2026 APC primary alongside 9 other defeated aspirants, while APC zoned the 2027 governorship to Kwara North. Even turning Ashiru ward captains neutral strips thousands of votes from Adewoye.',
      exactActionSteps: [
        'Run discreet, non-public bilateral outreach to aggrieved Ashiru ward coordinators in Offa & Irepodun.',
        'Never mock Ashiru publicly — frame the race as defending Kwara South’s voice after APC’s Kwara North gov snub.',
        'Offer dignified post-election liaison roles to defecting APC ward mobilisers.',
      ],
      costOfInaction:
        'Gives APC time to heal its May 2026 primary rift and deploy unified state machinery by January.',
      actionHref: '/war-room/dossier',
      actionCta: 'Inspect Opponent Vulnerabilities',
    },
    {
      id: 'act-adc',
      urgency: sAdc.voteGain >= 2000 ? 'critical' : 'high',
      title: 'Contain Akogun Oyedepo (ADC) Vote-Splitting in Igbomina LGAs',
      targetArea: 'Isin · Irepodun · Ifelodun (Igbomina Axis)',
      owner: 'Igbomina Co-Directors & Radio Desk',
      deadlineWindow: 'Continuous radio & ward campaign through 14 Jan 2027',
      marginalVoteYield: sAdc.voteGain,
      winProbLiftPts: sAdc.probGain,
      currentStateLabel: `${inputs.adcContainmentPct}% containment`,
      targetStateLabel: `${target.adcContainmentPct}% tactical unity`,
      whyItMatters:
        'Akogun Iyiola Oyedepo (Isanlu-Isin) commands real moral/radio respect, but ADC cannot defend 907 PUs. Every 1,000 anti-APC votes pulled into ADC is a net gift to APC’s Adewoye.',
      exactActionSteps: [
        'Run respectful “Don’t Split the Change Vote” Yoruba radio drops on Okin FM & Harmony FM citing the 2023 math.',
        'Put Igbomina leaders front-and-centre in Popoola’s rallies across Omu-Aran, Oro & Share to kill the “Offa-only” narrative.',
        'Never attack Oyedepo personally — respect his stature while proving only PDP has the 907-PU machine to beat APC.',
      ],
      costOfInaction:
        'ADC drains 12,000–16,000 anti-APC votes in Isin/Irepodun/Ifelodun, handing APC a plurality win.',
      actionHref: '/war-room/dossier',
      actionCta: 'View Side-by-Side Ground Game',
    },
    {
      id: 'act-osint',
      urgency: sOsint.voteGain >= 2000 ? 'high' : 'elevated',
      title: 'Own the Security/Roads Narrative & Pre-Bunk 2018 Offa Clip Smears',
      targetArea: 'All 7 LGAs · Flashpoints: Oke-Ero (Eruku), Ifelodun, Isin/Ekiti',
      owner: 'Publicity Secretary & OSINT Rapid-Response Desk',
      deadlineWindow: '2h SLA active daily until 16 Jan 2027',
      marginalVoteYield: sOsint.voteGain,
      winProbLiftPts: sOsint.probGain,
      currentStateLabel: `${inputs.osintDisciplinePct}% OSINT discipline`,
      targetStateLabel: `${target.osintDisciplinePct}% rapid-response mastery`,
      whyItMatters:
        'Late-2025 Eruku abductions, Owa-Onire displacements, and Ilorin–Omu-Aran–Kabba road protests are APC’s #1 weakness — while 2018 Offa/Saraki clips are Popoola’s #1 vulnerability. Narrative speed decides which frame dominates.',
      exactActionSteps: [
        'Respond within 2 hours to every high-relevance OSINT hit using pre-approved 4-language scripts.',
        'Pin Eruku/Ifelodun insecurity & FERMA road failures squarely on 8 years of APC control vs. Popoola’s proven Offa Neighbourhood Watch record.',
        'Proactively inoculate the 2018 Saraki reconciliation clip as courageous unity for Kwara South’s survival.',
      ],
      costOfInaction:
        'Viral 2018 clips depress legacy Saraki turnout in Irepodun while APC reframes security around state police.',
      actionHref: '/war-room/narrative',
      actionCta: 'Open OSINT Command & Response Desk',
    },
    {
      id: 'act-ifelodun',
      urgency: sIfelodun.voteGain >= 1800 ? 'high' : 'elevated',
      title: 'Unlock Ifelodun & Rural Turnout Above the 22.6% Floor',
      targetArea: 'Ifelodun (18 Wards · 236 PUs) · Oke-Ero · Ekiti',
      owner: 'Field Operations & Transport Logistics',
      deadlineWindow: 'Ward mobilisation sprint 26 Dec – 16 Jan',
      marginalVoteYield: sIfelodun.voteGain,
      winProbLiftPts: sIfelodun.probGain,
      currentStateLabel: `+${inputs.ifelodunTurnoutLiftPts.toFixed(1)} pts above 2023 floor`,
      targetStateLabel: `+${target.ifelodunTurnoutLiftPts.toFixed(1)} pts turnout unlock`,
      whyItMatters:
        'Ifelodun holds 236 PUs and ~128,500 implied registered voters — yet posted Kwara South’s lowest turnout (22.6%) in 2023. Lifting turnout in aggrieved farming wards where APC is blamed for banditry produces massive net PDP gains.',
      exactActionSteps: [
        'Deploy ward-level transport & safe-passage coordination across Owa-Onire, Share, Oke-Ode & Babanla.',
        'Assign dedicated Ward Liaison Officers in all 18 Ifelodun wards with daily pledge check-ins.',
        'Pair diaspora phone-banking with radio reminders in Igbomina Yoruba & Fulfulde.',
      ],
      costOfInaction:
        'Ifelodun stays depressed at ~23%, leaving 100,000+ registered voters at home and handing the race to APC’s core patronage base.',
      actionHref: '/war-room/structure',
      actionCta: 'Inspect Ifelodun 18 Wards & 236 PUs',
    },
  ];

  // Rank strictly by highest marginal vote yield first
  const mandatoryActions: MandatoryAction[] = rawActions
    .sort((a, b) => b.marginalVoteYield - a.marginalVoteYield)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  let verdict: PredictionResult['verdict'];
  let verdictTone: PredictionResult['verdictTone'];
  if (active.marginPdpVsApc >= 8000) {
    verdict = 'DECISIVE WIN';
    verdictTone = 'good';
  } else if (active.marginPdpVsApc >= 2000) {
    verdict = 'LEAN PDP';
    verdictTone = 'accent';
  } else if (active.marginPdpVsApc > -2000) {
    verdict = 'KNIFE-EDGE TOSS-UP';
    verdictTone = 'warn';
  } else if (active.marginPdpVsApc > -7000) {
    verdict = 'LEAN APC';
    verdictTone = 'bad';
  } else {
    verdict = 'PROJECTED LOSS';
    verdictTone = 'bad';
  }

  return {
    inputs,
    pdpVotes: active.pdpVotes,
    apcVotes: active.apcVotes,
    adcVotes: active.adcVotes,
    otherVotes: active.otherVotes,
    totalProjectedVotes: active.totalProjectedVotes,
    marginPdpVsApc: active.marginPdpVsApc,
    winProbabilityPct: active.winProbabilityPct,
    verdict,
    verdictTone,
    votesNeededToFlip: active.marginPdpVsApc >= 0 ? 0 : Math.abs(active.marginPdpVsApc) + 1,
    digitalMarginContribution,
    digitalResult: active.digitalResult,
    situationSummary: {
      headline: `Baseline Reality: If KS2027 coasts on analog operations today, PDP trails APC by ${Math.abs(
        statusQuoSnap.margin
      ).toLocaleString()} votes (${statusQuoSnap.winProbabilityPct}% win probability).`,
      hardTruth:
        'History favours PDP (15 consecutive years 2004–2019; 2023 PDP+SDP = 59,215 > APC 55,966), BUT anti-APC fragmentation (ADC Oyedepo), APC’s cash/state apparatus (Adewoye), and blind polling units currently hand APC a default plurality.',
      structuralEdge:
        'APC’s May 2026 Lola Ashiru primary wound + 2025–2026 Eruku/Ifelodun banditry outrage + Popoola’s unique PDP+SDP bridge make this seat 100% flippable.',
      primaryDanger:
        'Trying to beat APC’s industrial war chest with an analog campaign — without Osun-grade 907-PU digital defence & narrative speed, even strong ground work remains a fragile toss-up.',
    },
    lgaForecasts: active.lgaForecasts,
    scenarios,
    mandatoryActions,
  };
}
