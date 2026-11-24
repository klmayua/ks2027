'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { InteractiveStatCard, StackedBar, Stat } from '@/components/charts';
import { DetailDrawer } from '@/components/detail-drawer';
import { PageHeader, Panel } from '@/components/shell';
import {
  DIGITAL_PRESETS,
  type DigitalWaveInputs,
} from '@/lib/war-room/digital-wave';
import {
  PREDICTION_PRESETS,
  runPrediction,
  type LgaForecast,
  type MandatoryAction,
  type PredictionInputs,
} from '@/lib/war-room/predictive';

type DrawerState =
  | { kind: 'action'; action: MandatoryAction }
  | { kind: 'lga'; lga: LgaForecast }
  | { kind: 'methodology' }
  | null;

const URGENCY_BADGE: Record<MandatoryAction['urgency'], string> = {
  critical: 'bg-aggrieved/15 text-aggrieved border-aggrieved/40',
  high: 'bg-passive/15 text-passive border-passive/40',
  elevated: 'bg-accent/15 text-accent border-accent/40',
};

const WINNER_BADGE: Record<LgaForecast['winner'], string> = {
  PDP: 'bg-aligned/15 text-aligned border-aligned/40',
  APC: 'bg-aggrieved/15 text-aggrieved border-aggrieved/40',
  TOSSUP: 'bg-passive/15 text-passive border-passive/40',
};

export default function PredictiveEnginePage() {
  const [inputs, setInputs] = useState<PredictionInputs>(PREDICTION_PRESETS.status_quo.inputs);
  const [activePreset, setActivePreset] = useState<'status_quo' | 'ground_only' | 'full_execution' | 'custom'>('status_quo');
  const [drawer, setDrawer] = useState<DrawerState>(null);

  const prediction = useMemo(() => runPrediction(inputs), [inputs]);

  const applyPreset = (id: 'status_quo' | 'ground_only' | 'full_execution') => {
    setInputs(PREDICTION_PRESETS[id].inputs);
    setActivePreset(id);
  };

  const patchInput = <K extends keyof PredictionInputs>(key: K, value: PredictionInputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
    setActivePreset('custom');
  };

  const applyDigitalPreset = (key: keyof typeof DIGITAL_PRESETS) => {
    patchInput('digital', DIGITAL_PRESETS[key].inputs);
  };

  const patchDigital = <K extends keyof DigitalWaveInputs>(key: K, value: number) => {
    setInputs((prev) => ({ ...prev, digital: { ...prev.digital, [key]: value } }));
    setActivePreset('custom');
  };

  const pdpLgasWon = prediction.lgaForecasts.filter((l) => l.winner === 'PDP').length;
  const apcLgasWon = prediction.lgaForecasts.filter((l) => l.winner === 'APC').length;

  return (
    <>
      <PageHeader
        eyebrow="Predictive & Prescriptive Engine · Kwara South 2027"
        title="The Situation, What It Predicts & What MUST Be Done"
        lede="Auditable multi-driver forecast built over INEC 2023 Senate totals (APC 55,966 · PDP 34,950 · SDP 24,265), May 2026 primary fractures, ADC Oyedepo spoiler dynamics, and the Osun-derived 907-PU Digital Wave model."
        aside={
          <div className="flex w-full flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-line bg-surface-raised px-4 py-3 lg:w-auto">
            <Stat
              label="Win probability"
              value={`${prediction.winProbabilityPct}%`}
              size="sm"
              tone={prediction.verdictTone}
            />
            <Stat
              label="Projected margin"
              value={`${prediction.marginPdpVsApc >= 0 ? '+' : ''}${prediction.marginPdpVsApc.toLocaleString()}`}
              size="sm"
              tone={prediction.marginPdpVsApc >= 0 ? 'good' : 'bad'}
            />
            <button
              type="button"
              onClick={() => setDrawer({ kind: 'methodology' })}
              className="rounded-md border border-line-bright bg-surface px-2.5 py-1.5 text-[11px] font-medium text-ink-muted hover:border-accent/50 hover:text-ink"
            >
              Model math ›
            </button>
          </div>
        }
      />

      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        {/* Top 6 Clickable KPI Strip */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
          <InteractiveStatCard
            label="Win probability"
            value={`${prediction.winProbabilityPct}%`}
            tone={prediction.verdictTone}
            sub={prediction.verdict}
            onClick={() => setDrawer({ kind: 'methodology' })}
          />
          <InteractiveStatCard
            label="Net margin (PDP−APC)"
            value={`${prediction.marginPdpVsApc >= 0 ? '+' : ''}${prediction.marginPdpVsApc.toLocaleString()}`}
            tone={prediction.marginPdpVsApc >= 0 ? 'good' : 'bad'}
            sub={
              prediction.votesNeededToFlip > 0
                ? `Need +${prediction.votesNeededToFlip.toLocaleString()} to flip`
                : `Leading ${pdpLgasWon}/7 LGAs`
            }
            onClick={() => setDrawer({ kind: 'methodology' })}
          />
          <InteractiveStatCard
            label="Popoola (PDP)"
            value={prediction.pdpVotes}
            tone="accent"
            sub={`${((prediction.pdpVotes / prediction.totalProjectedVotes) * 100).toFixed(1)}% projected`}
            onClick={() => applyPreset('full_execution')}
          />
          <InteractiveStatCard
            label="Adewoye (APC)"
            value={prediction.apcVotes}
            tone="bad"
            sub={`${((prediction.apcVotes / prediction.totalProjectedVotes) * 100).toFixed(1)}% projected`}
            onClick={() => applyPreset('status_quo')}
          />
          <InteractiveStatCard
            label="Oyedepo (ADC)"
            value={prediction.adcVotes}
            tone="warn"
            sub="Igbomina spoiler bleed"
            onClick={() =>
              setDrawer({
                kind: 'action',
                action:
                  prediction.mandatoryActions.find((a) => a.id === 'act-adc') ??
                  prediction.mandatoryActions[0],
              })
            }
          />
          <InteractiveStatCard
            label="Digital wave lift"
            value={`+${prediction.digitalMarginContribution.toLocaleString()}`}
            tone={prediction.digitalMarginContribution >= 6000 ? 'good' : 'warn'}
            sub={`${prediction.digitalResult.readinessIndex}/100 digital readiness`}
            onClick={() =>
              setDrawer({
                kind: 'action',
                action:
                  prediction.mandatoryActions.find((a) => a.id === 'act-digital') ??
                  prediction.mandatoryActions[0],
              })
            }
          />
        </div>

        {/* =====================================================================
            ACT 1: THE SITUATION TODAY (Honest Baseline Diagnosis)
            ===================================================================== */}
        <section className="rounded-lg border border-aggrieved/35 bg-surface p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded bg-aggrieved/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-aggrieved">
                Step 1 · The Situation Today
              </span>
              <span className="text-xs text-ink-faint">Unvarnished baseline before intervention</span>
            </div>
            <button
              type="button"
              onClick={() => applyPreset('full_execution')}
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-ground hover:opacity-90"
            >
              Simulate Full Execution + Digital Wave →
            </button>
          </div>

          <h2 className="mt-2.5 text-base font-semibold text-ink sm:text-lg">
            {prediction.situationSummary.headline}
          </h2>

          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-md border border-line bg-ground/70 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-aggrieved">
                Hard Truth (Do Nothing)
              </div>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                {prediction.situationSummary.hardTruth}
              </p>
            </div>
            <div className="rounded-md border border-line bg-ground/70 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-aligned">
                Why The Seat Is 100% Flippable
              </div>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                {prediction.situationSummary.structuralEdge}
              </p>
            </div>
            <div className="rounded-md border border-line bg-ground/70 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-passive">
                Fatal Mistake To Avoid
              </div>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                {prediction.situationSummary.primaryDanger}
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================================
            ACT 2: WHAT IT PREDICTS (3-Scenario Fan + Interactive Controls + 7 LGAs)
            ===================================================================== */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
                Step 2 · What It Predicts
              </span>
              <span className="text-xs text-ink-muted">
                Tap any scenario to compare trajectories or tune individual levers below
              </span>
            </div>
            <span className="figure text-xs text-ink-faint">
              Modeled scenario · Anchored to INEC 2023 Senate base
            </span>
          </div>

          {/* 3-Scenario Comparison Cards */}
          <div className="grid gap-3 md:grid-cols-3">
            {prediction.scenarios.map((s) => {
              const selected = activePreset === s.id;
              const verdictColor =
                s.verdict === 'WIN'
                  ? 'border-aligned/50 text-aligned bg-aligned/10'
                  : s.verdict === 'LOSS'
                    ? 'border-aggrieved/50 text-aggrieved bg-aggrieved/10'
                    : 'border-passive/50 text-passive bg-passive/10';
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => applyPreset(s.id)}
                  className={`rounded-lg border p-4 text-left transition-all active:scale-[0.99] ${
                    selected
                      ? 'border-accent bg-accent/[0.08] ring-1 ring-accent/40'
                      : 'border-line bg-surface hover:border-line-bright hover:bg-surface-raised'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-ink">{s.shortLabel}</span>
                    <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${verdictColor}`}>
                      {s.verdict} · {s.winProbabilityPct}%
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span
                      className={`figure text-2xl font-bold ${
                        s.margin >= 0 ? 'text-aligned' : 'text-aggrieved'
                      }`}
                    >
                      {s.margin >= 0 ? '+' : ''}
                      {s.margin.toLocaleString()}
                    </span>
                    <span className="text-xs text-ink-faint">PDP vs APC margin</span>
                  </div>
                  <div className="figure mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-muted">
                    <span>PDP {s.pdpVotes.toLocaleString()}</span>
                    <span>APC {s.apcVotes.toLocaleString()}</span>
                    <span>ADC {s.adcVotes.toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-[11px] leading-snug text-ink-faint">
                    {PREDICTION_PRESETS[s.id].tagline}
                  </p>
                </button>
              );
            })}
          </div>

          {/* =====================================================================
              ACT 2 (EXECUTIVE-FIRST): WHAT MUST BE DONE NOW (ABOVE THE SLIDERS)
              ===================================================================== */}
          <section className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded bg-aligned/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-aligned">
                  What MUST Be Done Now
                </span>
                <span className="text-xs text-ink-muted">
                  Auto-ranked by exact marginal vote yield from your active scenario to target
                </span>
              </div>
              <span className="text-xs text-ink-faint">Tap any directive for execution blueprint</span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {prediction.mandatoryActions.map((act) => (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => setDrawer({ kind: 'action', action: act })}
                  className="group flex flex-col justify-between rounded-lg border border-line bg-surface p-4 text-left transition-all hover:border-accent/60 hover:bg-surface-raised active:scale-[0.99]"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="figure flex size-6 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                          #{act.rank}
                        </span>
                        <span
                          className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${URGENCY_BADGE[act.urgency]}`}
                        >
                          {act.urgency}
                        </span>
                      </div>
                      <span className="figure rounded bg-aligned/15 px-2 py-0.5 text-xs font-bold text-aligned">
                        {act.marginalVoteYield > 0
                          ? `+${act.marginalVoteYield.toLocaleString()} net votes`
                          : 'Target Locked ✓'}
                      </span>
                    </div>

                    <h3 className="mt-2.5 text-sm font-semibold text-ink group-hover:text-accent">
                      {act.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">{act.whyItMatters}</p>
                  </div>

                  <div className="mt-3 border-t border-line pt-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                      <span className="text-ink-faint">{act.targetArea}</span>
                      <span className="font-semibold text-accent">Inspect steps ›</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[10px] text-ink-faint">
                      <span>Now: {act.currentStateLabel}</span>
                      <span>Deadline: {act.deadlineWindow}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* =====================================================================
              ACT 3: STRESS-TEST SIMULATOR (INTERACTIVE LEVERS + 7-LGA SWING)
              ===================================================================== */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-2">
              <span className="rounded bg-surface-raised px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">
                Step 3 · Stress-Test Simulator
              </span>
              <span className="text-xs text-ink-muted">
                Tune individual levers to see what happens if any action above slips
              </span>
            </div>
          </div>

          {/* Interactive Driver Console + Live Projected Split */}
          <div className="grid gap-4 lg:grid-cols-5">
            <Panel
              title="Interactive Campaign Levers"
              note={activePreset === 'custom' ? 'Custom scenario active' : PREDICTION_PRESETS[activePreset].shortLabel}
              className="lg:col-span-3"
            >
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-ink">1. PDP + 2023 SDP Ward Harmonisation</span>
                    <span className="figure font-semibold text-accent">{inputs.sdpHarmonisationPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={95}
                    step={1}
                    value={inputs.sdpHarmonisationPct}
                    onChange={(e) => patchInput('sdpHarmonisationPct', Number(e.target.value))}
                    className="mt-1.5 w-full accent-accent"
                  />
                  <div className="flex justify-between text-[10px] text-ink-faint">
                    <span>Fragmented (20%)</span>
                    <span>Target: 84% of 24,265 SDP pool unified</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-ink">2. ADC (Akogun Oyedepo) Spoiler Containment</span>
                    <span className="figure font-semibold text-accent">{inputs.adcContainmentPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={90}
                    step={1}
                    value={inputs.adcContainmentPct}
                    onChange={(e) => patchInput('adcContainmentPct', Number(e.target.value))}
                    className="mt-1.5 w-full accent-accent"
                  />
                  <div className="flex justify-between text-[10px] text-ink-faint">
                    <span>Heavy bleed in Isin/Irepodun (10%)</span>
                    <span>Target: 74% tactical unity</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-ink">3. May 2026 APC (Ashiru) Fracture Harvest</span>
                    <span className="figure font-semibold text-accent">{inputs.ashiruFractureHarvestPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={80}
                    step={1}
                    value={inputs.ashiruFractureHarvestPct}
                    onChange={(e) => patchInput('ashiruFractureHarvestPct', Number(e.target.value))}
                    className="mt-1.5 w-full accent-accent"
                  />
                  <div className="flex justify-between text-[10px] text-ink-faint">
                    <span>APC heals primary wound (0%)</span>
                    <span>Target: 52% aggrieved ward harvest</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-ink">4. Ifelodun & Rural Turnout Lift (above 22.6% floor)</span>
                    <span className="figure font-semibold text-accent">+{inputs.ifelodunTurnoutLiftPts.toFixed(1)} pts</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={9}
                    step={0.5}
                    value={inputs.ifelodunTurnoutLiftPts}
                    onChange={(e) => patchInput('ifelodunTurnoutLiftPts', Number(e.target.value))}
                    className="mt-1.5 w-full accent-accent"
                  />
                  <div className="flex justify-between text-[10px] text-ink-faint">
                    <span>Flat 22.6% turnout</span>
                    <span>Target: +5.5 pts rural farm mobilisation</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-ink">5. OSINT Topical Response & 2018 Clip Inoculation</span>
                    <span className="figure font-semibold text-accent">{inputs.osintDisciplinePct}%</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    step={2}
                    value={inputs.osintDisciplinePct}
                    onChange={(e) => patchInput('osintDisciplinePct', Number(e.target.value))}
                    className="mt-1.5 w-full accent-accent"
                  />
                  <div className="flex justify-between text-[10px] text-ink-faint">
                    <span>Unchecked smear drag (20%)</span>
                    <span>Target: 90% 2-hour SLA mastery</span>
                  </div>
                </div>

                {/* Coupled Digital Wave Selector */}
                <div className="rounded-md border border-accent/35 bg-accent/[0.05] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-ink">
                        6. Coupled Digital Wave (907 PUs · Osun Aug 2026 Mechanics)
                      </div>
                      <div className="text-[11px] text-ink-muted">
                        Readiness: <strong className="figure text-accent">{prediction.digitalResult.readinessIndex}/100</strong> ·{' '}
                        {prediction.digitalResult.coveredPollingUnits}/907 PUs live ·{' '}
                        <strong className="figure text-aligned">+{prediction.digitalMarginContribution.toLocaleString()} margin lift</strong>
                      </div>
                    </div>
                    <Link
                      href="/war-room/digital"
                      className="text-[11px] font-semibold text-accent hover:underline"
                    >
                      Deep Digital Sim →
                    </Link>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {(['current', 'partial', 'full_wave'] as const).map((k) => {
                      const active =
                        inputs.digital.puCaptureCoveragePct === DIGITAL_PRESETS[k].inputs.puCaptureCoveragePct &&
                        inputs.digital.narrativeSyncScore === DIGITAL_PRESETS[k].inputs.narrativeSyncScore;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => applyDigitalPreset(k)}
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                            active
                              ? 'border-accent bg-accent/20 text-accent'
                              : 'border-line bg-surface text-ink-muted hover:text-ink'
                          }`}
                        >
                          {DIGITAL_PRESETS[k].tag}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-2.5">
                    <div className="flex justify-between text-[11px] text-ink-muted">
                      <span>Live 907-PU Photo Capture Coverage</span>
                      <span className="figure text-ink">{inputs.digital.puCaptureCoveragePct}%</span>
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={100}
                      step={1}
                      value={inputs.digital.puCaptureCoveragePct}
                      onChange={(e) => patchDigital('puCaptureCoveragePct', Number(e.target.value))}
                      className="mt-1 w-full accent-accent"
                    />
                  </div>
                </div>
              </div>
            </Panel>

            {/* Live Projected Vote Split + 7-LGA Swing Summary */}
            <Panel
              title="Live District Projection (7 LGAs)"
              note={`${pdpLgasWon} PDP · ${apcLgasWon} APC · ${7 - pdpLgasWon - apcLgasWon} Toss-up`}
              className="lg:col-span-2"
            >
              <div className="space-y-4">
                <div className="rounded-md border border-line bg-ground/70 p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-[0.12em] text-ink-faint">
                      Active Verdict
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        prediction.marginPdpVsApc >= 2000
                          ? 'bg-aligned/15 text-aligned'
                          : prediction.marginPdpVsApc <= -2000
                            ? 'bg-aggrieved/15 text-aggrieved'
                            : 'bg-passive/15 text-passive'
                      }`}
                    >
                      {prediction.verdict}
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span
                      className={`figure text-3xl font-bold ${
                        prediction.marginPdpVsApc >= 0 ? 'text-aligned' : 'text-aggrieved'
                      }`}
                    >
                      {prediction.marginPdpVsApc >= 0 ? '+' : ''}
                      {prediction.marginPdpVsApc.toLocaleString()}
                    </span>
                    <span className="figure text-sm font-semibold text-ink">
                      {prediction.winProbabilityPct}% Win Prob.
                    </span>
                  </div>
                  <div className="mt-3">
                    <StackedBar
                      segments={[
                        { label: 'Popoola (PDP)', value: prediction.pdpVotes, color: '#22c55e' },
                        { label: 'Adewoye (APC)', value: prediction.apcVotes, color: '#ef4444' },
                        { label: 'Oyedepo (ADC)', value: prediction.adcVotes, color: '#eab308' },
                        { label: 'Others', value: prediction.otherVotes, color: '#52525b' },
                      ]}
                    />
                  </div>
                  <div className="figure mt-2.5 grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="rounded bg-surface p-1.5">
                      <div className="text-ink-faint">PDP</div>
                      <div className="font-semibold text-aligned">{prediction.pdpVotes.toLocaleString()}</div>
                    </div>
                    <div className="rounded bg-surface p-1.5">
                      <div className="text-ink-faint">APC</div>
                      <div className="font-semibold text-aggrieved">{prediction.apcVotes.toLocaleString()}</div>
                    </div>
                    <div className="rounded bg-surface p-1.5">
                      <div className="text-ink-faint">ADC</div>
                      <div className="font-semibold text-passive">{prediction.adcVotes.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* 7-LGA Clickable Swing Rows */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-medium text-ink-faint">
                    7-LGA Swing Forecast — tap any LGA to drill in
                  </div>
                  {prediction.lgaForecasts.map((l) => (
                    <button
                      key={l.lgaCode}
                      type="button"
                      onClick={() => setDrawer({ kind: 'lga', lga: l })}
                      className="flex w-full items-center justify-between gap-2 rounded-md border border-line bg-surface-raised/60 px-3 py-2 text-left transition-colors hover:border-accent/50 hover:bg-surface-raised"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-ink">{l.name}</span>
                          <span className="figure text-[10px] text-ink-faint">{l.pollingUnits} PUs</span>
                        </div>
                        <div className="figure text-[10px] text-ink-muted">
                          PDP {l.pdpVotes.toLocaleString()} · APC {l.apcVotes.toLocaleString()} · ADC {l.adcVotes.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={`figure text-xs font-semibold ${
                            l.marginPdpVsApc >= 0 ? 'text-aligned' : 'text-aggrieved'
                          }`}
                        >
                          {l.marginPdpVsApc >= 0 ? '+' : ''}
                          {l.marginPdpVsApc.toLocaleString()}
                        </span>
                        <span
                          className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${WINNER_BADGE[l.winner]}`}
                        >
                          {l.winner}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div>

      {/* Deep-Dive Drawer */}
      <DetailDrawer
        open={drawer !== null}
        onClose={() => setDrawer(null)}
        eyebrow={
          drawer?.kind === 'action'
            ? `Mandatory Directive #${drawer.action.rank}`
            : drawer?.kind === 'lga'
              ? `LGA Swing Forecast · ${drawer.lga.pollingUnits} Polling Units`
              : 'Predictive Engine Methodology'
        }
        title={
          drawer?.kind === 'action'
            ? drawer.action.title
            : drawer?.kind === 'lga'
              ? `${drawer.lga.name} LGA Projection`
              : 'How the KS2027 Predictive Engine Calculates Outcomes'
        }
      >
        {drawer?.kind === 'action' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-md border border-line bg-surface-raised p-3">
                <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                  Marginal Vote Yield
                </div>
                <div className="figure mt-1 text-xl font-bold text-aligned">
                  +{drawer.action.marginalVoteYield.toLocaleString()}
                </div>
                <div className="text-[11px] text-ink-faint">
                  +{drawer.action.winProbLiftPts} pts win probability
                </div>
              </div>
              <div className="rounded-md border border-line bg-surface-raised p-3">
                <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                  Owner & Deadline
                </div>
                <div className="mt-1 text-xs font-semibold text-ink">{drawer.action.owner}</div>
                <div className="mt-0.5 text-[11px] text-passive">{drawer.action.deadlineWindow}</div>
              </div>
            </div>

            <div className="rounded-md border border-line bg-ground/70 p-3 text-xs">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                Gap To Close
              </div>
              <div className="mt-1 text-ink-muted">
                Current: <strong className="text-ink">{drawer.action.currentStateLabel}</strong> → Target:{' '}
                <strong className="text-aligned">{drawer.action.targetStateLabel}</strong>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                Non-Negotiable Execution Steps
              </h4>
              <ul className="mt-2 space-y-2">
                {drawer.action.exactActionSteps.map((step, idx) => (
                  <li
                    key={idx}
                    className="flex gap-2.5 rounded-md border border-line bg-surface-raised/60 p-2.5 text-xs text-ink"
                  >
                    <span className="figure font-bold text-accent">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-md border border-aggrieved/40 bg-aggrieved/[0.07] p-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-aggrieved">
                Cost of Inaction
              </div>
              <p className="mt-1 text-xs text-ink-muted">{drawer.action.costOfInaction}</p>
            </div>

            <Link
              href={drawer.action.actionHref}
              onClick={() => setDrawer(null)}
              className="block w-full rounded-md bg-accent px-4 py-2.5 text-center text-xs font-semibold text-ground hover:opacity-90"
            >
              {drawer.action.actionCta} →
            </Link>
          </div>
        )}

        {drawer?.kind === 'lga' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-md border border-line bg-surface-raised p-3 text-center">
                <div className="text-[10px] uppercase text-ink-faint">Popoola (PDP)</div>
                <div className="figure mt-1 text-lg font-bold text-aligned">
                  {drawer.lga.pdpVotes.toLocaleString()}
                </div>
              </div>
              <div className="rounded-md border border-line bg-surface-raised p-3 text-center">
                <div className="text-[10px] uppercase text-ink-faint">Adewoye (APC)</div>
                <div className="figure mt-1 text-lg font-bold text-aggrieved">
                  {drawer.lga.apcVotes.toLocaleString()}
                </div>
              </div>
              <div className="rounded-md border border-line bg-surface-raised p-3 text-center">
                <div className="text-[10px] uppercase text-ink-faint">Oyedepo (ADC)</div>
                <div className="figure mt-1 text-lg font-bold text-passive">
                  {drawer.lga.adcVotes.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="rounded-md border border-line bg-ground/70 p-3.5 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-ink-muted">Projected PDP vs APC Margin</span>
                <span
                  className={`figure font-bold ${
                    drawer.lga.marginPdpVsApc >= 0 ? 'text-aligned' : 'text-aggrieved'
                  }`}
                >
                  {drawer.lga.marginPdpVsApc >= 0 ? '+' : ''}
                  {drawer.lga.marginPdpVsApc.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Share of Kwara South Electorate</span>
                <span className="figure font-semibold text-ink">
                  {(drawer.lga.weightShare * 100).toFixed(1)}% ({drawer.lga.pollingUnits} PUs)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Digital Wave Swing Contribution</span>
                <span className="figure font-semibold text-accent">
                  +{drawer.lga.digitalContribution.toLocaleString()} votes
                </span>
              </div>
            </div>

            <div className="rounded-md border border-accent/35 bg-accent/[0.06] p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
                2026–2027 Ground Assessment
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-ink">
                {drawer.lga.keyBattlegroundNote}
              </p>
            </div>

            <Link
              href="/war-room/structure"
              onClick={() => setDrawer(null)}
              className="block w-full rounded-md border border-accent/50 bg-accent/15 px-4 py-2.5 text-center text-xs font-semibold text-accent hover:bg-accent/25"
            >
              Inspect {drawer.lga.name} Wards & PUs in Power Map →
            </Link>
          </div>
        )}

        {drawer?.kind === 'methodology' && (
          <div className="space-y-3 text-xs leading-relaxed text-ink-muted">
            <p>
              <strong className="text-ink">Verified Anchor Baseline:</strong> Every LGA projection starts from the
              official INEC 2023 Kwara South Senate totals declared at Omu-Aran (APC 55,966 · PDP 34,950 · SDP 24,265)
              distributed by the 7-LGA 2023 valid-vote weight (124,294 total valid votes) and 907 post-2021 PUs.
            </p>
            <p>
              <strong className="text-ink">6 Explicit Drivers:</strong> (1) PDP+SDP reunification rate, (2) Akogun
              Oyedepo ADC vote-split containment calibrated highest in Isin, Irepodun & Ifelodun, (3) May 2026 APC
              primary (Lola Ashiru 3rd-place) fracture harvest, (4) Ifelodun & rural farming turnout lift above the
              22.6% floor, (5) OSINT topical response discipline, and (6) live coupled Digital Wave impact from{' '}
              <code>digital-wave.ts</code>.
            </p>
            <p>
              <strong className="text-ink">Prescriptive Ranking:</strong> Each directive in Step 3 is calculated via
              live marginal sensitivity analysis — moving that single lever from your current setting to target while
              holding all other levers constant to report exact marginal vote yield.
            </p>
          </div>
        )}
      </DetailDrawer>
    </>
  );
}
