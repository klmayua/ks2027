'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { InteractiveStatCard, RankedBars, Stat } from '@/components/charts';
import { DetailDrawer } from '@/components/detail-drawer';
import { PageHeader, Panel } from '@/components/shell';
import {
  DIGITAL_PRESETS,
  OSUN_2026_BENCHMARK,
  simulateDigitalWave,
  type DigitalMechanismImpact,
  type DigitalWaveInputs,
  type LgaDigitalBreakdown,
} from '@/lib/war-room/digital-wave';
import { PREDICTION_PRESETS, runPrediction } from '@/lib/war-room/predictive';

type DrawerState =
  | { kind: 'mechanism'; mech: DigitalMechanismImpact }
  | { kind: 'lga'; lga: LgaDigitalBreakdown }
  | { kind: 'benchmark' }
  | null;

const PRIORITY_STYLE: Record<LgaDigitalBreakdown['digitalPriority'], string> = {
  critical: 'bg-aggrieved/15 text-aggrieved border-aggrieved/40',
  high: 'bg-passive/15 text-passive border-passive/40',
  standard: 'bg-line text-ink-muted border-line-bright',
};

export default function DigitalWavePage() {
  const [inputs, setInputs] = useState<DigitalWaveInputs>(DIGITAL_PRESETS.full_wave.inputs);
  const [activePreset, setActivePreset] = useState<'current' | 'partial' | 'full_wave' | 'custom'>('full_wave');
  const [drawer, setDrawer] = useState<DrawerState>(null);

  const sim = useMemo(() => simulateDigitalWave(inputs), [inputs]);
  const analogSim = useMemo(() => simulateDigitalWave(DIGITAL_PRESETS.current.inputs), []);

  // Show exact coupled effect on Kwara South Senate forecast (Ground Only vs. Ground + Active Digital)
  const coupledPrediction = useMemo(
    () =>
      runPrediction({
        ...PREDICTION_PRESETS.ground_only.inputs,
        digital: inputs,
      }),
    [inputs]
  );
  const analogPrediction = useMemo(
    () => runPrediction(PREDICTION_PRESETS.ground_only.inputs),
    []
  );

  const applyPreset = (key: 'current' | 'partial' | 'full_wave') => {
    setInputs(DIGITAL_PRESETS[key].inputs);
    setActivePreset(key);
  };

  const patch = <K extends keyof DigitalWaveInputs>(key: K, value: number) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
    setActivePreset('custom');
  };

  return (
    <>
      <PageHeader
        eyebrow="Digital Wave Simulation · 907 Polling Units"
        title="How a Real-Time Digital Wave Neutralises Incumbent Cash in Kwara South"
        lede="Abstracts the four proven August 2026 digital election mechanics — un-riggable PU capture, narrative velocity, tracked youth/diaspora turnout, and live incident triage — onto Kwara South’s 7 LGAs, 83 wards, and 907 polling units."
        aside={
          <div className="flex w-full flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-line bg-surface-raised px-4 py-3 lg:w-auto">
            <Stat
              label="Digital readiness"
              value={`${sim.readinessIndex}/100`}
              size="sm"
              tone={sim.readinessIndex >= 80 ? 'good' : sim.readinessIndex >= 50 ? 'warn' : 'bad'}
            />
            <Stat
              label="Net digital swing"
              value={`+${sim.totalNetDigitalSwing.toLocaleString()}`}
              size="sm"
              tone="accent"
            />
            <button
              type="button"
              onClick={() => setDrawer({ kind: 'benchmark' })}
              className="rounded-md border border-line-bright bg-surface px-2.5 py-1.5 text-[11px] font-medium text-ink-muted hover:border-accent/50 hover:text-ink"
            >
              Aug 2026 benchmark ›
            </button>
          </div>
        }
      />

      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        {/* Top 6 Clickable KPI Cards */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
          <InteractiveStatCard
            label="Digital readiness"
            value={`${sim.readinessIndex}/100`}
            tone={sim.readinessIndex >= 80 ? 'good' : sim.readinessIndex >= 50 ? 'warn' : 'bad'}
            sub={sim.readinessIndex >= 80 ? 'Wave active' : `${sim.uncoveredPollingUnits} PUs exposed`}
            onClick={() => applyPreset('full_wave')}
          />
          <InteractiveStatCard
            label="Net digital swing"
            value={`+${sim.totalNetDigitalSwing.toLocaleString()}`}
            tone="accent"
            sub={`+${sim.liftOverAnalogBaseline.toLocaleString()} vs analog`}
            onClick={() => setDrawer({ kind: 'benchmark' })}
          />
          <InteractiveStatCard
            label="Live PUs covered"
            value={`${sim.coveredPollingUnits}/907`}
            tone={sim.coveredPollingUnits >= 800 ? 'good' : 'warn'}
            sub={`${inputs.puCaptureCoveragePct}% EC8A capture`}
            onClick={() => setDrawer({ kind: 'mechanism', mech: sim.mechanisms[0] })}
          />
          <InteractiveStatCard
            label="Leakage defended"
            value={`+${sim.votesProtectedFromLeakage.toLocaleString()}`}
            tone="good"
            sub="Un-riggable PU sheets"
            onClick={() => setDrawer({ kind: 'mechanism', mech: sim.mechanisms[0] })}
          />
          <InteractiveStatCard
            label="Turnout vs. cash"
            value={`+${sim.turnoutVotesAdded.toLocaleString()}`}
            tone="accent"
            sub="Youth + diaspora pull"
            onClick={() => setDrawer({ kind: 'mechanism', mech: sim.mechanisms[2] })}
          />
          <InteractiveStatCard
            label="Narrative + triage"
            value={`+${(sim.narrativeVotesRetained + sim.suppressionVotesRescued).toLocaleString()}`}
            tone="good"
            sub={`${inputs.incidentResponseMinutes}-min incident SLA`}
            onClick={() => setDrawer({ kind: 'mechanism', mech: sim.mechanisms[1] })}
          />
        </div>

        {/* Preset Switcher + With Digital vs. Without Digital Impact Comparison */}
        <section className="rounded-lg border border-accent/40 bg-surface p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="rounded bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
                With Digital vs. Without Digital · Live Senate Coupling
              </span>
              <h2 className="mt-2 text-base font-semibold text-ink sm:text-lg">
                {sim.verdictHeadline}
              </h2>
              <p className="mt-1 text-xs text-ink-muted">{sim.verdictDetail}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(['current', 'partial', 'full_wave'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => applyPreset(k)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activePreset === k
                      ? 'border-accent bg-accent text-ground'
                      : 'border-line bg-surface-raised text-ink-muted hover:text-ink'
                  }`}
                >
                  {DIGITAL_PRESETS[k].tag}
                </button>
              ))}
            </div>
          </div>

          {/* Side-by-side comparison cards */}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-aggrieved/35 bg-ground/70 p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-aggrieved">
                  Without Digital Wave (Analog Ground Only)
                </span>
                <span className="figure text-xs font-bold text-aggrieved">
                  {analogPrediction.winProbabilityPct}% Win Prob.
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="figure text-2xl font-bold text-ink">
                  {analogPrediction.marginPdpVsApc >= 0 ? '+' : ''}
                  {analogPrediction.marginPdpVsApc.toLocaleString()}
                </span>
                <span className="text-xs text-ink-faint">projected PDP vs APC margin</span>
              </div>
              <p className="mt-1.5 text-[11px] text-ink-muted">
                Only {analogSim.coveredPollingUnits}/907 PUs captured live · {analogSim.inputs.incidentResponseMinutes}-min lag · APC cash & dark-room alteration go unchecked.
              </p>
            </div>

            <div className="rounded-md border border-aligned/45 bg-aligned/[0.06] p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-aligned">
                  With Active Digital Simulation ({sim.readinessIndex}/100)
                </span>
                <span className="figure text-xs font-bold text-aligned">
                  {coupledPrediction.winProbabilityPct}% Win Prob.
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="figure text-2xl font-bold text-aligned">
                  {coupledPrediction.marginPdpVsApc >= 0 ? '+' : ''}
                  {coupledPrediction.marginPdpVsApc.toLocaleString()}
                </span>
                <span className="text-xs text-ink-faint">
                  (+{(coupledPrediction.marginPdpVsApc - analogPrediction.marginPdpVsApc).toLocaleString()} net digital lift)
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-ink-muted">
                {sim.coveredPollingUnits}/907 PUs defended in real time · {inputs.incidentResponseMinutes}-min incident SLA · Multi-language narrative speed beats rumour & cash.
              </p>
            </div>
          </div>
        </section>

        {/* 4 Interactive Mechanism Cards (Directly tunable + Deep-Dive Drawer) */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-ink">
                The 4 Digital Wave Mechanisms — Tuned for Kwara South
              </h2>
              <p className="text-xs text-ink-faint">
                Adjust any slider to simulate impact on Kwara South’s 907 PUs, or tap “Execution blueprint ›” for deliverables.
              </p>
            </div>
            <Link
              href="/war-room/predict"
              className="text-xs font-semibold text-accent hover:underline"
            >
              See full coupled forecast in Predictive Engine →
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {sim.mechanisms.map((mech) => {
              const sliderConfig =
                mech.id === 'unriggable_pu'
                  ? { min: 15, max: 100, step: 1, val: inputs.puCaptureCoveragePct, onChange: (v: number) => patch('puCaptureCoveragePct', v), minLbl: '15% (Analog)', maxLbl: '100% (All 907 PUs)' }
                  : mech.id === 'narrative_speed'
                    ? { min: 15, max: 100, step: 1, val: inputs.narrativeSyncScore, onChange: (v: number) => patch('narrativeSyncScore', v), minLbl: 'Ad-hoc forwards', maxLbl: '83-Ward 4-Lang Sync' }
                    : mech.id === 'turnout_beats_cash'
                      ? { min: 15, max: 100, step: 1, val: inputs.youthDiasporaMobilisation, onChange: (v: number) => patch('youthDiasporaMobilisation', v), minLbl: 'Passive online', maxLbl: 'Tracked Youth + Diaspora' }
                      : { min: 10, max: 180, step: 5, val: inputs.incidentResponseMinutes, onChange: (v: number) => patch('incidentResponseMinutes', v), minLbl: '10 min (Live Room)', maxLbl: '180 min (Too Late)' };

              return (
                <div
                  key={mech.id}
                  className="flex flex-col justify-between rounded-lg border border-line bg-surface p-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-ink">{mech.title}</h3>
                        <p className="mt-0.5 text-[11px] font-medium text-accent">{mech.principle}</p>
                      </div>
                      <span className="figure shrink-0 rounded bg-aligned/15 px-2 py-0.5 text-xs font-bold text-aligned">
                        +{mech.netVotesImpact.toLocaleString()} votes
                      </span>
                    </div>

                    <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                      {mech.kwaraSouthApplication}
                    </p>

                    <div className="mt-3 rounded-md border border-line bg-ground/60 p-2.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-ink-faint">Active setting</span>
                        <span className="figure font-semibold text-ink">{mech.currentValueLabel}</span>
                      </div>
                      <input
                        type="range"
                        min={sliderConfig.min}
                        max={sliderConfig.max}
                        step={sliderConfig.step}
                        value={sliderConfig.val}
                        onChange={(e) => sliderConfig.onChange(Number(e.target.value))}
                        className="mt-1.5 w-full accent-accent"
                      />
                      <div className="flex justify-between text-[10px] text-ink-faint">
                        <span>{sliderConfig.minLbl}</span>
                        <span>{sliderConfig.maxLbl}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5 text-[11px]">
                    <span className="text-ink-faint">Owner: {mech.owner}</span>
                    <button
                      type="button"
                      onClick={() => setDrawer({ kind: 'mechanism', mech })}
                      className="font-semibold text-accent hover:underline"
                    >
                      Execution blueprint ›
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 7-LGA Digital Impact Chart & Interactive Breakdown */}
        <div className="grid gap-4 lg:grid-cols-5">
          <Panel
            title="Digital Net Vote Yield by LGA"
            note="Tap any LGA bar to inspect its 4-lever breakdown"
            className="lg:col-span-2"
          >
            <RankedBars
              data={sim.lgaBreakdown.map((l) => ({
                id: l.lgaCode,
                label: l.name,
                value: l.totalNetSwing,
                note: `${l.coveredPus}/${l.pollingUnits} PUs`,
                color: l.digitalPriority === 'critical' ? '#22c55e' : '#16a34a',
              }))}
              valueFormat={(n) => `+${n.toLocaleString()}`}
              onSelect={(d) => {
                const match = sim.lgaBreakdown.find((x) => x.lgaCode === d.id);
                if (match) setDrawer({ kind: 'lga', lga: match });
              }}
            />
          </Panel>

          <Panel
            title="7-LGA Digital Deployment Priority Matrix"
            note="907 post-2021 Polling Units · Tap any card for breakdown"
            className="lg:col-span-3"
          >
            <div className="space-y-2">
              {sim.lgaBreakdown.map((l) => (
                <button
                  key={l.lgaCode}
                  type="button"
                  onClick={() => setDrawer({ kind: 'lga', lga: l })}
                  className="flex w-full flex-col gap-1.5 rounded-md border border-line bg-surface-raised/60 p-3 text-left transition-colors hover:border-accent/50 hover:bg-surface-raised sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-ink">{l.name}</span>
                      <span
                        className={`rounded border px-1.5 py-px text-[9px] font-bold uppercase ${PRIORITY_STYLE[l.digitalPriority]}`}
                      >
                        {l.digitalPriority}
                      </span>
                      <span className="figure text-[10px] text-ink-faint">
                        {l.coveredPus}/{l.pollingUnits} PUs live · {(l.baselineTurnout * 100).toFixed(1)}% 2023 turnout
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-[11px] text-ink-muted">{l.rationale}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <div className="figure text-sm font-bold text-aligned">
                        +{l.totalNetSwing.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-ink-faint">net votes</div>
                    </div>
                    <span className="text-ink-faint">›</span>
                  </div>
                </button>
              ))}
            </div>
          </Panel>
        </div>

        {/* Compact Provenance & Strategic Methodology Footnote Card */}
        <button
          type="button"
          onClick={() => setDrawer({ kind: 'benchmark' })}
          className="flex w-full flex-col justify-between gap-2 rounded-lg border border-line-bright bg-surface-raised/50 p-4 text-left transition-colors hover:border-accent/50 sm:flex-row sm:items-center"
        >
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
              Why This Model Works · Verified Aug 15, 2026 Digital Precedent
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              Federal might stops at the polling unit. On 15 Aug 2026, a digital-first campaign won by{' '}
              <strong className="figure text-ink">+66,252 votes</strong> across 30 LGAs / 332 wards despite federal
              incumbency and a party switch. Kwara South is 4× more compact (7 LGAs / 83 wards / 907 PUs).
            </p>
          </div>
          <span className="shrink-0 text-xs font-semibold text-accent">Inspect benchmark ›</span>
        </button>
      </div>

      <DetailDrawer
        open={drawer !== null}
        onClose={() => setDrawer(null)}
        eyebrow={
          drawer?.kind === 'mechanism'
            ? `Digital Mechanism · ${drawer.mech.owner}`
            : drawer?.kind === 'lga'
              ? `${drawer.lga.name} LGA · ${drawer.lga.pollingUnits} Polling Units`
              : 'External Methodology Benchmark'
        }
        title={
          drawer?.kind === 'mechanism'
            ? drawer.mech.title
            : drawer?.kind === 'lga'
              ? `${drawer.lga.name} Digital Wave Impact`
              : OSUN_2026_BENCHMARK.title
        }
      >
        {drawer?.kind === 'mechanism' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-md border border-line bg-surface-raised p-3">
                <div className="text-[10px] uppercase text-ink-faint">Current Modeled Yield</div>
                <div className="figure mt-1 text-xl font-bold text-aligned">
                  +{drawer.mech.netVotesImpact.toLocaleString()}
                </div>
                <div className="text-[10px] text-ink-faint">
                  of +{drawer.mech.maxPotentialVotes.toLocaleString()} max potential
                </div>
              </div>
              <div className="rounded-md border border-line bg-surface-raised p-3">
                <div className="text-[10px] uppercase text-ink-faint">Active Readiness</div>
                <div className="figure mt-1 text-xl font-bold text-accent">
                  {drawer.mech.readinessPct}%
                </div>
                <div className="text-[10px] text-ink-faint">{drawer.mech.currentValueLabel}</div>
              </div>
            </div>

            <div className="rounded-md border border-line bg-ground/70 p-3.5 text-xs leading-relaxed text-ink-muted">
              <strong className="text-ink">Kwara South Execution:</strong> {drawer.mech.kwaraSouthApplication}
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                Concrete KS2027 Deliverables
              </h4>
              <ul className="mt-2 space-y-2">
                {drawer.mech.keyDeliverables.map((d, i) => (
                  <li
                    key={i}
                    className="flex gap-2 rounded-md border border-line bg-surface-raised/60 p-2.5 text-xs text-ink"
                  >
                    <span className="font-bold text-accent">✓</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {drawer?.kind === 'lga' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-md border border-line bg-surface-raised p-3">
                <div className="text-[10px] uppercase text-ink-faint">Total Digital Swing</div>
                <div className="figure mt-1 text-xl font-bold text-aligned">
                  +{drawer.lga.totalNetSwing.toLocaleString()}
                </div>
              </div>
              <div className="rounded-md border border-line bg-surface-raised p-3">
                <div className="text-[10px] uppercase text-ink-faint">Live Covered PUs</div>
                <div className="figure mt-1 text-xl font-bold text-accent">
                  {drawer.lga.coveredPus} / {drawer.lga.pollingUnits}
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded-md border border-line bg-ground/70 p-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-ink-muted">1. Un-riggable PU Capture (Leakage Defended)</span>
                <span className="figure font-semibold text-aligned">+{drawer.lga.votesProtected.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">2. Narrative Velocity (Rumour & Ballot Clarity)</span>
                <span className="figure font-semibold text-aligned">+{drawer.lga.narrativeRetained.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">3. Turnout Beats Cash (Youth & Diaspora)</span>
                <span className="figure font-semibold text-accent">+{drawer.lga.turnoutAdded.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">4. Eyes on Every Unit (Incidents Rescued)</span>
                <span className="figure font-semibold text-ink">+{drawer.lga.incidentsRescued.toLocaleString()}</span>
              </div>
            </div>

            <div className="rounded-md border border-accent/35 bg-accent/[0.06] p-3 text-xs text-ink">
              <strong className="text-accent">Why this LGA matters digitally:</strong> {drawer.lga.rationale}
            </div>
          </div>
        )}

        {drawer?.kind === 'benchmark' && (
          <div className="space-y-4">
            <p className="text-xs leading-relaxed text-ink-muted">{OSUN_2026_BENCHMARK.summary}</p>
            <div className="grid grid-cols-2 gap-2.5">
              {OSUN_2026_BENCHMARK.stats.map((st) => (
                <div key={st.metric} className="rounded-md border border-line bg-surface-raised p-3">
                  <div className="text-[10px] uppercase text-ink-faint">{st.metric}</div>
                  <div className="figure mt-1 text-base font-bold text-accent">{st.value}</div>
                  <div className="mt-0.5 text-[10px] text-ink-muted">{st.detail}</div>
                </div>
              ))}
            </div>
            <div className="rounded-md border border-line bg-ground/70 p-3 text-[11px] text-ink-faint">
              Source: {OSUN_2026_BENCHMARK.source}. Used strictly as a strategic digital-mechanism benchmark — all
              Kwara South figures are calibrated to Kwara South’s own 7 LGAs, 83 wards, 907 PUs, and 2023 INEC totals.
            </div>
          </div>
        )}
      </DetailDrawer>
    </>
  );
}
