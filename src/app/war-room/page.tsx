'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  DivergingBars,
  Gauge,
  HeatGrid,
  InteractiveStatCard,
  Legend,
  RankedBars,
  SERIES,
  StackedBar,
  Stat,
} from '@/components/charts';
import { DetailDrawer } from '@/components/detail-drawer';
import { LgaDrawerBody, RISK_COLOR, WardDrawerBody } from '@/components/geo-drilldown';
import { PageHeader, Panel } from '@/components/shell';
import { campaignConfig, daysUntil, primaryElection } from '@/config/campaign.config';
import {
  FEDERAL_CONSTITUENCIES,
  getLga,
  getWard,
  totals,
  wards,
  type FederalConstituencyId,
} from '@/lib/geography';
import { POST_2021_PUS_BY_LGA, pollingUnitRoll } from '@/lib/geography/roll';
import {
  DISTRICT_PROXY_TOTALS_2023,
  SENATE_TOTALS_2023,
  constituencyWeights,
  lgasByWeight,
  sourceReconciliation,
  totalValidVotes,
} from '@/lib/geography/results-2023';
import { RISK_LABELS, type WardControl } from '@/lib/party/structure';
import { seedRoster, seedStakeholders } from '@/lib/simulation/seed';
import { seedClaims, seedMentions, seedResponses } from '@/lib/simulation/seed-narrative';
import { breakdown, isSendable, velocity } from '@/lib/narrative/osint';
import { analyse } from '@/lib/war-room/analysis';

const pct = (n: number, dp = 0) => `${(n * 100).toFixed(dp)}%`;

type DrawerState =
  | { kind: 'lga'; lgaCode: string }
  | { kind: 'ward'; wardId: string; fromLga?: string }
  | { kind: 'kpi'; topic: 'voters' | 'pus' | 'wards' | 'gap' | 'turnout' | 'core' }
  | null;

export default function WarRoomOverview() {
  const { entries } = useMemo(() => seedRoster(), []);
  const stakeholders = useMemo(() => seedStakeholders(), []);
  const a = useMemo(() => analyse(entries, stakeholders), [entries, stakeholders]);

  const osintMentions = useMemo(() => seedMentions(), []);
  const osintClaims = useMemo(() => seedClaims(), []);
  const osintResponses = useMemo(() => seedResponses(), []);
  const osintStats = useMemo(() => breakdown(osintMentions), [osintMentions]);
  const topClaim = useMemo(
    () => [...osintClaims].sort((x, y) => velocity(y) - velocity(x))[0],
    [osintClaims]
  );
  const heldDrafts = useMemo(
    () => osintResponses.filter((r) => !isSendable(r)).length,
    [osintResponses]
  );

  const [drawer, setDrawer] = useState<DrawerState>(null);

  // Interactive Path-to-Flip Simulator state
  const [sdpCapturePct, setSdpCapturePct] = useState(85);
  const [ifelodunLiftPts, setIfelodunLiftPts] = useState(6);
  const [offaBoostPct, setOffaBoostPct] = useState(12);

  const wardCounts = useMemo(
    () =>
      Object.fromEntries(
        FEDERAL_CONSTITUENCIES.map((fc) => [
          fc.id,
          wards.filter((w) => fc.lgaCodes.includes(w.lgaCode)).length,
        ])
      ) as Record<FederalConstituencyId, number>,
    []
  );

  const fcWeights = useMemo(() => constituencyWeights(wardCounts), [wardCounts]);
  const ranked = useMemo(() => lgasByWeight(), []);
  const recon = useMemo(() => sourceReconciliation(), []);

  const election = primaryElection();
  const days = daysUntil(election.date);

  let running = 0;
  let lgasForHalf = 0;
  for (const l of ranked) {
    running += l.validVotes;
    lgasForHalf += 1;
    if (running >= totalValidVotes / 2) break;
  }

  const offa = ranked.find((l) => l.lgaCode === campaignConfig.principal.homeLgaCode);
  const ifelodun = ranked.find((l) => l.lgaCode === '05');
  const lowestTurnout = [...ranked].sort((x, y) => x.turnout - y.turnout)[0];
  const highestTurnout = [...ranked].sort((x, y) => y.turnout - x.turnout)[0];

  // Path-to-Flip derived projection (clearly labelled as scenario simulator over 2023 Senate base)
  const sdpGain = Math.round((SENATE_TOTALS_2023.sdp * sdpCapturePct) / 100);
  const ifelodunNewVotes = Math.round(((ifelodun?.registered ?? 128_500) * (ifelodunLiftPts / 100)) * 0.62);
  const offaHomeGain = Math.round((offa?.validVotes ?? 23_531) * (offaBoostPct / 100) * 0.55);
  const projectedPdp = SENATE_TOTALS_2023.pdp + sdpGain + ifelodunNewVotes + offaHomeGain;
  const projectedMargin = projectedPdp - SENATE_TOTALS_2023.apc;

  const activeLga = drawer?.kind === 'lga' ? getLga(drawer.lgaCode) : undefined;
  const activeWard = drawer?.kind === 'ward' ? getWard(drawer.wardId) : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Overview · Kwara South Senatorial District"
        title="Where the votes are, and how to flip the seat"
        lede={campaignConfig.principal.background}
        aside={
          <div className="flex w-full flex-wrap gap-x-6 gap-y-3 rounded-lg border border-line bg-surface-raised px-4 py-3 sm:px-5 lg:w-auto">
            <Stat label="Days to Senate poll" value={days} tone="accent" size="sm" sub="16 Jan 2027" />
            <Stat
              label="Principal"
              value={campaignConfig.principal.shortName}
              size="sm"
              sub={`${campaignConfig.principal.partyAbbreviation} · ${campaignConfig.principal.homeLgaName} LGA`}
            />
          </div>
        }
      />

      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        {/* Clickable KPI Cards — 2 cols mobile, 3 tablet, 6 desktop */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
          <InteractiveStatCard
            label="Implied voters"
            value={DISTRICT_PROXY_TOTALS_2023.impliedRegistered}
            sub="2023 Kwara South proxy"
            active={drawer?.kind === 'kpi' && drawer.topic === 'voters'}
            onClick={() => setDrawer({ kind: 'kpi', topic: 'voters' })}
          />
          <InteractiveStatCard
            label="Polling units"
            value={pollingUnitRoll.currentTotal}
            sub={`${pollingUnitRoll.enumerated} + ${pollingUnitRoll.unallocated} (2021)`}
            active={drawer?.kind === 'kpi' && drawer.topic === 'pus'}
            onClick={() => setDrawer({ kind: 'kpi', topic: 'pus' })}
          />
          <InteractiveStatCard
            label="Wards"
            value={totals.wards.value}
            sub="7 LGAs · 2 constituencies"
            active={drawer?.kind === 'kpi' && drawer.topic === 'wards'}
            onClick={() => setDrawer({ kind: 'kpi', topic: 'wards' })}
          />
          <InteractiveStatCard
            label="2023 Senate gap"
            value={SENATE_TOTALS_2023.apcLeadOverPdp}
            tone="bad"
            sub="APC over PDP · tap math"
            active={drawer?.kind === 'kpi' && drawer.topic === 'gap'}
            onClick={() => setDrawer({ kind: 'kpi', topic: 'gap' })}
          />
          <InteractiveStatCard
            label="Turnout 2023"
            value={pct(DISTRICT_PROXY_TOTALS_2023.turnout, 1)}
            tone="warn"
            sub="7-LGA gov proxy"
            active={drawer?.kind === 'kpi' && drawer.topic === 'turnout'}
            onClick={() => setDrawer({ kind: 'kpi', topic: 'turnout' })}
          />
          <InteractiveStatCard
            label="Core LGAs"
            value={`${lgasForHalf} / 7`}
            tone="accent"
            sub={`${pct(running / totalValidVotes, 1)} of district vote`}
            active={drawer?.kind === 'kpi' && drawer.topic === 'core'}
            onClick={() => setDrawer({ kind: 'kpi', topic: 'core' })}
          />
        </div>

        {/* Live OSINT Command Banner — front and center intelligence entry */}
        <Link
          href="/war-room/narrative"
          className="group flex flex-col justify-between gap-3 rounded-lg border border-accent/40 bg-accent/[0.07] p-4 transition-all hover:border-accent hover:bg-accent/[0.12] sm:flex-row sm:items-center"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
                <span className="size-1.5 animate-pulse rounded-full bg-accent" />
                Live OSINT
              </span>
              <span className="figure text-xs text-ink">
                {osintStats.total} mentions ·{' '}
                <span className={osintStats.net >= 0 ? 'text-aligned' : 'text-aggrieved'}>
                  {osintStats.net >= 0 ? '+' : ''}
                  {(osintStats.net * 100).toFixed(0)} net
                </span>
              </span>
              {heldDrafts > 0 && (
                <span className="rounded bg-passive/15 px-1.5 py-0.5 text-[10px] font-semibold text-passive">
                  {heldDrafts} draft held at approval gate
                </span>
              )}
            </div>
            {topClaim && (
              <p className="mt-1.5 line-clamp-1 text-xs text-ink-muted sm:text-sm">
                <strong className="text-aggrieved">
                  ×{velocity(topClaim).toFixed(1)} rumour alert:
                </strong>{' '}
                {topClaim.statement}
              </p>
            )}
          </div>
          <span className="shrink-0 text-xs font-semibold text-accent transition-transform group-hover:translate-x-0.5">
            Open OSINT Command →
          </span>
        </Link>

        {/* Quick LGA Drill-Down Strip — thumb-friendly on mobile */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {ranked.map((l) => (
            <button
              key={l.lgaCode}
              type="button"
              onClick={() => setDrawer({ kind: 'lga', lgaCode: l.lgaCode })}
              className="flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 text-xs transition-colors hover:border-accent/50 hover:bg-surface-raised active:scale-[0.98]"
            >
              <span className="font-medium text-ink">{l.name}</span>
              <span className="figure text-[11px] text-accent">
                {(l.validVotes / 1000).toFixed(1)}k
              </span>
              <span className="text-ink-faint">›</span>
            </button>
          ))}
        </div>

        {/* Allocation gap + Ward control */}
        <div className="grid gap-4 lg:grid-cols-5">
          <Panel
            title="Allocation gap across Kwara South"
            note="Tap any LGA to drill into its wards & PUs"
            className="lg:col-span-3"
          >
            <DivergingBars
              data={ranked.map((l) => ({
                id: l.lgaCode,
                label: l.name,
                value: l.gapPoints,
                note: `${l.wards}w · ${(l.validVotes / 1000).toFixed(1)}k votes`,
              }))}
              activeId={drawer?.kind === 'lga' ? drawer.lgaCode : null}
              onSelect={(d) => d.id && setDrawer({ kind: 'lga', lgaCode: d.id })}
              format={(n) => `${n > 0 ? '+' : ''}${n.toFixed(1)}pt`}
            />

            <div className="mt-4 space-y-2 border-t border-line pt-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                By federal constituency
              </div>
              {fcWeights.map((fc) => (
                <div key={fc.id} className="space-y-1 sm:flex sm:items-center sm:gap-3 sm:space-y-0">
                  <span className="block text-[11px] text-ink-muted sm:w-40 sm:shrink-0 sm:truncate sm:text-right">
                    {fc.shortName}
                  </span>
                  <div className="flex flex-1 items-center gap-2">
                    <StackedBar
                      height="h-3"
                      segments={[
                        { label: 'Ward share', value: fc.wardShare, color: '#4a5163' },
                        { label: 'rest', value: 1 - fc.wardShare, color: 'transparent' },
                      ]}
                    />
                    <span className="figure w-10 shrink-0 text-right text-[11px] text-ink-faint">
                      {pct(fc.wardShare)}
                    </span>
                    <StackedBar
                      height="h-3"
                      segments={[
                        { label: 'Vote share', value: fc.voteShare, color: SERIES[0] },
                        { label: 'rest', value: 1 - fc.voteShare, color: 'transparent' },
                      ]}
                    />
                    <span className="figure w-10 shrink-0 text-right text-[11px] text-ink">
                      {pct(fc.voteShare)}
                    </span>
                  </div>
                </div>
              ))}
              <Legend
                items={[
                  { label: 'Ward share', color: '#4a5163' },
                  { label: 'Vote share (2023 proxy)', color: SERIES[0] },
                ]}
              />
            </div>

            <p className="mt-3 text-xs leading-relaxed text-ink-muted">
              Equal per-ward spending under-serves{' '}
              <span className="text-ink">Irepodun (+5.0pt)</span> and{' '}
              <span className="text-ink">Offa (+4.5pt)</span> while over-serving{' '}
              <span className="text-ink">Isin (−5.7pt)</span>. Guard against{' '}
              <span className="text-accent">Offa home-turf gravity</span>: Offa casts{' '}
              <span className="figure text-ink">{pct(offa?.voteShare ?? 0, 1)}</span> of Kwara
              South&rsquo;s vote — winning requires dominating Ifelodun and Irepodun alongside Offa.
            </p>
          </Panel>

          <Panel title="Ward control" note={`${totals.wards.value} wards`} className="lg:col-span-2">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <Gauge
                value={a.meanControl}
                label="Mean control"
                tone={a.meanControl > 0.5 ? 'good' : a.meanControl > 0.3 ? 'warn' : 'bad'}
              />
              <div className="min-w-[150px] flex-1 space-y-2">
                {(Object.keys(RISK_LABELS) as WardControl['risk'][]).map((risk) => (
                  <Link
                    key={risk}
                    href={`/war-room/structure`}
                    className="flex items-center gap-2 rounded px-1.5 py-1 transition-colors hover:bg-surface-raised"
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-[2px]"
                      style={{ background: RISK_COLOR[risk] }}
                    />
                    <span className="flex-1 text-[11px] text-ink-muted">{RISK_LABELS[risk]}</span>
                    <span className="figure text-lg font-semibold text-ink">{a.control[risk]}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <StackedBar
                showLabels
                segments={(Object.keys(RISK_LABELS) as WardControl['risk'][]).map((risk) => ({
                  label: RISK_LABELS[risk],
                  value: a.control[risk],
                  color: RISK_COLOR[risk],
                }))}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3">
              <Link
                href="/war-room/reconciliation"
                className="rounded-lg border border-line bg-surface-raised p-3 transition-colors hover:border-line-bright"
              >
                <Stat label="Wards at stake" value={a.pipeline.wardsAtStake} tone="bad" size="sm" />
              </Link>
              <Link
                href="/war-room/reconciliation"
                className="rounded-lg border border-line bg-surface-raised p-3 transition-colors hover:border-line-bright"
              >
                <Stat label="Stalled 14d+" value={a.pipeline.stalledCount} tone="warn" size="sm" />
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                href="/war-room/structure"
                className="text-xs font-medium text-accent underline underline-offset-4 hover:text-ink"
              >
                Open power map →
              </Link>
              <Link
                href="/war-room/reconciliation"
                className="text-xs text-ink-muted underline underline-offset-4 hover:text-ink"
              >
                Reconciliation pipeline →
              </Link>
            </div>
          </Panel>
        </div>

        {/* LGA priority + Turnout */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Votes cast by LGA" note="Tap any LGA for ward-by-ward drill-down">
            <RankedBars
              data={ranked.map((l, i) => ({
                id: l.lgaCode,
                label: l.name,
                value: l.validVotes,
                note: `${pct(l.voteShare, 1)} · ${l.currentPus} PUs${i < lgasForHalf ? ' · core' : ''}`,
                color: i < lgasForHalf ? SERIES[0] : '#2b3444',
              }))}
              activeId={drawer?.kind === 'lga' ? drawer.lgaCode : null}
              onSelect={(d) => d.id && setDrawer({ kind: 'lga', lgaCode: d.id })}
              valueFormat={(n) => `${(n / 1000).toFixed(1)}k`}
            />
            <p className="mt-3 border-t border-line pt-3 text-xs text-ink-muted">
              <span className="figure text-ink">{lgasForHalf}</span> of 7 LGAs —{' '}
              <span className="text-ink">Ifelodun, Offa and Irepodun</span> — carry{' '}
              <span className="figure text-ink">{pct(running / totalValidVotes, 1)}</span> of all
              votes cast in Kwara South.
            </p>
          </Panel>

          <Panel title="Turnout by LGA" note="Tap any tile to inspect LGA">
            <HeatGrid
              cells={ranked
                .slice()
                .sort((x, y) => y.turnout - x.turnout)
                .map((l) => ({
                  id: l.lgaCode,
                  label: l.name,
                  t: (l.turnout - 0.21) / (0.28 - 0.21),
                  value: pct(l.turnout, 1),
                  title: `${l.name}: ${pct(l.turnout, 1)} turnout · ${l.validVotes.toLocaleString('en-NG')} votes`,
                }))}
              onSelect={(cell) => cell.id && setDrawer({ kind: 'lga', lgaCode: cell.id })}
            />
            <p className="mt-3 border-t border-line pt-3 text-xs text-ink-muted">
              <span className="text-ink">{lowestTurnout.name}</span> has Kwara South&rsquo;s largest
              voter roll (~{(lowestTurnout.registered / 1000).toFixed(0)}k) yet recorded Kwara&rsquo;s
              lowest turnout (<span className="figure text-ink">{pct(lowestTurnout.turnout, 1)}</span>
              ) against {highestTurnout.name} at{' '}
              <span className="figure text-ink">{pct(highestTurnout.turnout, 1)}</span>.
            </p>
          </Panel>
        </div>

        {/* 2023 Senate baseline & Interactive Path-to-Flip Simulator + Source reconciliation */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel
            title="2023 Senate baseline & interactive flip model"
            note="Declared at Omu-Aran · 25 Feb 2023"
            className="lg:col-span-2"
          >
            <StackedBar
              showLabels
              height="h-8"
              segments={[
                { label: 'PDP', value: SENATE_TOTALS_2023.pdp, color: SERIES[0] },
                { label: 'SDP', value: SENATE_TOTALS_2023.sdp, color: SERIES[2] },
                { label: 'APC', value: SENATE_TOTALS_2023.apc, color: SERIES[1] },
              ]}
            />
            <div className="mt-3">
              <Legend
                items={[
                  {
                    label: 'PDP (2023)',
                    color: SERIES[0],
                    value: SENATE_TOTALS_2023.pdp.toLocaleString('en-NG'),
                  },
                  {
                    label: 'SDP (2023 · Popoola’s former platform)',
                    color: SERIES[2],
                    value: SENATE_TOTALS_2023.sdp.toLocaleString('en-NG'),
                  },
                  {
                    label: 'APC (2023 winner · open seat in 2027)',
                    color: SERIES[1],
                    value: SENATE_TOTALS_2023.apc.toLocaleString('en-NG'),
                  },
                ]}
              />
            </div>

            {/* Interactive Flip Simulator */}
            <div className="mt-4 rounded-lg border border-line bg-surface-raised p-3.5 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
                  Interactive path-to-flip simulator (vs 2023 APC 55,966)
                </span>
                <span
                  className={`figure rounded px-2 py-0.5 text-xs font-semibold ${
                    projectedMargin >= 0
                      ? 'bg-aligned/15 text-aligned'
                      : 'bg-aggrieved/15 text-aggrieved'
                  }`}
                >
                  {projectedMargin >= 0 ? 'PDP LEADS BY +' : 'PDP TRAILS BY '}
                  {projectedMargin.toLocaleString('en-NG')}
                </span>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <div className="flex justify-between text-[11px] text-ink-muted">
                    <span>2023 SDP retention</span>
                    <span className="figure text-ink">{sdpCapturePct}% (+{sdpGain.toLocaleString('en-NG')})</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={sdpCapturePct}
                    onChange={(e) => setSdpCapturePct(Number(e.target.value))}
                    className="mt-1.5 h-2 w-full cursor-pointer accent-[#22c55e]"
                  />
                </label>

                <label className="block">
                  <div className="flex justify-between text-[11px] text-ink-muted">
                    <span>Ifelodun turnout lift</span>
                    <span className="figure text-ink">+{ifelodunLiftPts}pt (+{ifelodunNewVotes.toLocaleString('en-NG')})</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={12}
                    step={1}
                    value={ifelodunLiftPts}
                    onChange={(e) => setIfelodunLiftPts(Number(e.target.value))}
                    className="mt-1.5 h-2 w-full cursor-pointer accent-[#22c55e]"
                  />
                </label>

                <label className="block">
                  <div className="flex justify-between text-[11px] text-ink-muted">
                    <span>Offa home surge</span>
                    <span className="figure text-ink">+{offaBoostPct}% (+{offaHomeGain.toLocaleString('en-NG')})</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    step={1}
                    value={offaBoostPct}
                    onChange={(e) => setOffaBoostPct(Number(e.target.value))}
                    className="mt-1.5 h-2 w-full cursor-pointer accent-[#22c55e]"
                  />
                </label>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5 text-[11px] text-ink-muted">
                <span>
                  Simulated PDP total:{' '}
                  <strong className="figure text-ink">
                    {projectedPdp.toLocaleString('en-NG')}
                  </strong>{' '}
                  vs 2023 APC benchmark <span className="figure">55,966</span>
                </span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSdpCapturePct(0);
                      setIfelodunLiftPts(0);
                      setOffaBoostPct(0);
                    }}
                    className="rounded border border-line bg-surface px-2 py-1 text-[10px] hover:border-line-bright hover:text-ink"
                  >
                    2023 Raw
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSdpCapturePct(85);
                      setIfelodunLiftPts(6);
                      setOffaBoostPct(12);
                    }}
                    className="rounded border border-accent/40 bg-accent/10 px-2 py-1 text-[10px] text-accent hover:bg-accent/20"
                  >
                    Target Plan
                  </button>
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Source reconciliation" note="Senate vs proxy & PU roll">
            <div className="space-y-2.5">
              {recon.map((r) => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => setDrawer({ kind: 'kpi', topic: 'pus' })}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface-raised"
                >
                  <span className="text-[11px] text-ink-muted">{r.label}</span>
                  <span className="figure text-xs text-ink-faint">
                    {r.senate.toLocaleString('en-NG')} / {r.proxy.toLocaleString('en-NG')}
                  </span>
                  <span
                    className={`figure w-16 text-right text-xs ${
                      r.delta === 0 ? 'text-aligned' : 'text-passive'
                    }`}
                  >
                    {r.delta > 0
                      ? `+${r.delta.toLocaleString('en-NG')}`
                      : r.delta.toLocaleString('en-NG')}
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-ink-muted">
              Per-LGA spatial weights use the March 2023 governorship declaration as a proxy until
              per-LGA Senate Form EC8D sheets are ingested. Tap any row to view the full 2015→2021
              PU expansion table.
            </p>
          </Panel>
        </div>
      </div>

      {/* Deep Drill-Down Drawer */}
      <DetailDrawer
        open={drawer !== null}
        onClose={() => setDrawer(null)}
        onBack={
          drawer?.kind === 'ward' && drawer.fromLga
            ? () => setDrawer({ kind: 'lga', lgaCode: drawer.fromLga! })
            : undefined
        }
        backLabel={
          drawer?.kind === 'ward' && drawer.fromLga
            ? `Back to ${getLga(drawer.fromLga)?.name ?? 'LGA'}`
            : undefined
        }
        eyebrow={
          drawer?.kind === 'lga'
            ? 'LGA deep dive · Kwara South'
            : drawer?.kind === 'ward'
              ? `Ward deep dive · ${getLga(activeWard?.lgaCode ?? '')?.name ?? ''}`
              : 'Metric provenance & breakdown'
        }
        title={
          drawer?.kind === 'lga'
            ? `${activeLga?.name ?? ''} Local Government`
            : drawer?.kind === 'ward'
              ? `${activeWard?.name ?? ''} Ward`
              : drawer?.kind === 'kpi'
                ? {
                    voters: 'Implied 2023 Registered Voters by LGA',
                    pus: 'Kwara South Polling Unit Expansion (2015 → 2021)',
                    wards: 'All 7 LGAs & 83 Wards Directory',
                    gap: '2023 Senate Gap & 2027 11-Candidate Ballot',
                    turnout: 'Turnout Spread Across Kwara South',
                    core: 'The 3-LGA Core Carrying 60.6% of Votes',
                  }[drawer.topic]
                : ''
        }
        subtitle={
          drawer?.kind === 'lga'
            ? 'Click any ward below to inspect ward executive officers, stakeholders, and real INEC polling units.'
            : drawer?.kind === 'ward'
              ? 'Full ward executive roster, reconciliation claims, and INEC polling unit directory.'
              : 'Every number links back to its INEC source or stated derivation.'
        }
      >
        {drawer?.kind === 'lga' && (
          <LgaDrawerBody
            lgaCode={drawer.lgaCode}
            wardControl={a.wardControl}
            stakeholders={stakeholders}
            onSelectWard={(wardId) =>
              setDrawer({ kind: 'ward', wardId, fromLga: drawer.lgaCode })
            }
          />
        )}

        {drawer?.kind === 'ward' && a.wardControl.get(drawer.wardId) && (
          <WardDrawerBody
            wardId={drawer.wardId}
            entries={entries}
            control={a.wardControl.get(drawer.wardId)!}
            stakeholders={stakeholders}
          />
        )}

        {drawer?.kind === 'kpi' && (
          <div className="space-y-4">
            {drawer.topic === 'gap' && (
              <div className="space-y-3">
                <div className="rounded-lg border border-line bg-surface-raised p-4 text-xs leading-relaxed text-ink-muted">
                  <p className="text-ink font-medium">2023 Kwara South Senate Declaration (Omu-Aran)</p>
                  <p className="mt-1">
                    APC (Lola Ashiru): <span className="figure text-ink">55,966</span> · PDP (Rafiu
                    Ibrahim): <span className="figure text-ink">34,950</span> · SDP:{' '}
                    <span className="figure text-ink">24,265</span>.
                  </p>
                  <p className="mt-2">
                    In 2027, the APC seat is open (incumbent Ashiru is not on the ballot). INEC
                    published <strong className="text-ink">11 candidates</strong>:
                  </p>
                </div>
                <div className="space-y-2">
                  {campaignConfig.ballot2027.notable.map((c) => (
                    <div
                      key={c.party}
                      className="flex items-center justify-between rounded-lg border border-line bg-surface-raised px-3.5 py-2.5"
                    >
                      <div>
                        <div className="text-sm font-medium text-ink">{c.candidate}</div>
                        <div className="text-[11px] text-ink-faint">{c.note}</div>
                      </div>
                      <span
                        className={`figure rounded px-2 py-0.5 text-xs font-semibold ${
                          c.party === 'PDP'
                            ? 'bg-accent/15 text-accent'
                            : 'bg-line text-ink-muted'
                        }`}
                      >
                        {c.party}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                Tap any LGA to drill into its wards
              </div>
              {ranked.map((l) => {
                const post2021 = POST_2021_PUS_BY_LGA[l.lgaCode] ?? l.enumeratedPus;
                const delta = post2021 - l.enumeratedPus;
                return (
                  <button
                    key={l.lgaCode}
                    type="button"
                    onClick={() => setDrawer({ kind: 'lga', lgaCode: l.lgaCode })}
                    className="group flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-surface-raised px-3.5 py-3 text-left transition-colors hover:border-accent/50"
                  >
                    <div>
                      <div className="text-sm font-medium text-ink">{l.name}</div>
                      <div className="text-[11px] text-ink-muted">
                        {l.wards} wards · {l.enumeratedPus} →{' '}
                        <span className="text-ink">{post2021} PUs</span>{' '}
                        <span className="text-accent">(+{delta})</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="figure text-sm font-semibold text-ink">
                        {l.validVotes.toLocaleString('en-NG')}
                      </div>
                      <div className="figure text-[10px] text-ink-faint">
                        {pct(l.turnout, 1)} turnout · ~{(l.registered / 1000).toFixed(0)}k reg
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </DetailDrawer>
    </>
  );
}
