import Link from 'next/link';

import {
  DivergingBars,
  Gauge,
  HeatGrid,
  Legend,
  RankedBars,
  SERIES,
  StackedBar,
  Stat,
} from '@/components/charts';
import { PageHeader, Panel } from '@/components/shell';
import { campaignConfig, daysUntil, primaryElection } from '@/config/campaign.config';
import { FEDERAL_CONSTITUENCIES, totals, wards, type FederalConstituencyId } from '@/lib/geography';
import { pollingUnitRoll } from '@/lib/geography/roll';
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
import { analyse } from '@/lib/war-room/analysis';

const RISK_COLOR: Record<WardControl['risk'], string> = {
  held: '#16a34a',
  contested: '#fab219',
  exposed: '#d03b3b',
  vacant: '#4a5163',
};

const pct = (n: number, dp = 0) => `${(n * 100).toFixed(dp)}%`;

export default function WarRoomOverview() {
  const { entries } = seedRoster();
  const stakeholders = seedStakeholders();
  const a = analyse(entries, stakeholders);

  const wardCounts = Object.fromEntries(
    FEDERAL_CONSTITUENCIES.map((fc) => [
      fc.id,
      wards.filter((w) => fc.lgaCodes.includes(w.lgaCode)).length,
    ])
  ) as Record<FederalConstituencyId, number>;

  const fcWeights = constituencyWeights(wardCounts);
  const ranked = lgasByWeight();
  const recon = sourceReconciliation();

  const election = primaryElection();
  const days = daysUntil(election.date);

  // Top LGAs needed to cross half the district's votes.
  let running = 0;
  let lgasForHalf = 0;
  for (const l of ranked) {
    running += l.validVotes;
    lgasForHalf += 1;
    if (running >= totalValidVotes / 2) break;
  }

  const offa = ranked.find((l) => l.lgaCode === campaignConfig.principal.homeLgaCode);
  const lowestTurnout = [...ranked].sort((x, y) => x.turnout - y.turnout)[0];
  const highestTurnout = [...ranked].sort((x, y) => y.turnout - x.turnout)[0];

  return (
    <>
      <PageHeader
        eyebrow="Overview · Kwara South Senatorial District"
        title="Where the votes are, and how to flip the seat"
        lede={campaignConfig.principal.background}
        aside={
          <div className="flex w-full flex-wrap gap-x-6 gap-y-3 rounded border border-line bg-surface-raised px-4 py-3 sm:px-5 lg:w-auto">
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
        {/* Headline row — real figures only */}
        <div className="grid grid-cols-2 gap-4 rounded border border-line bg-surface p-4 sm:grid-cols-3 sm:gap-6 sm:p-5 lg:grid-cols-6">
          <Stat
            label="Implied voters"
            value={DISTRICT_PROXY_TOTALS_2023.impliedRegistered}
            sub="2023 Kwara South proxy"
          />
          <Stat
            label="Polling units"
            value={pollingUnitRoll.currentTotal}
            sub={`${pollingUnitRoll.enumerated} enumerated · +${pollingUnitRoll.unallocated} (2021)`}
          />
          <Stat label="Wards" value={totals.wards.value} sub="7 LGAs · 2 fed. constituencies" />
          <Stat
            label="2023 Senate gap"
            value={SENATE_TOTALS_2023.apcLeadOverPdp}
            tone="bad"
            sub="APC over PDP at Omu-Aran"
          />
          <Stat
            label="Turnout 2023"
            value={pct(DISTRICT_PROXY_TOTALS_2023.turnout, 1)}
            tone="warn"
            sub="7-LGA gov proxy"
          />
          <Stat
            label="LGAs for majority"
            value={lgasForHalf}
            tone="accent"
            sub={`of 7 — ${pct(running / totalValidVotes, 1)} cumulative`}
          />
        </div>

        {/* Allocation gap + Ward control */}
        <div className="grid gap-4 lg:grid-cols-5">
          <Panel
            title="Allocation gap across Kwara South"
            note="Vote share minus ward share · 2023 per-LGA proxy"
            className="lg:col-span-3"
          >
            <DivergingBars
              data={ranked.map((l) => ({
                label: l.name,
                value: l.gapPoints,
                note: `${l.wards}w · ${(l.validVotes / 1000).toFixed(1)}k votes`,
              }))}
              format={(n) => `${n > 0 ? '+' : ''}${n.toFixed(1)}pt`}
            />

            <div className="mt-4 hidden space-y-2 border-t border-line pt-3 sm:block">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                By federal constituency
              </div>
              {fcWeights.map((fc) => (
                <div key={fc.id} className="flex items-center gap-3">
                  <span className="w-40 shrink-0 truncate text-right text-[11px] text-ink-muted">
                    {fc.shortName}
                  </span>
                  <StackedBar
                    height="h-3"
                    segments={[
                      { label: 'Ward share', value: fc.wardShare, color: '#4a5163' },
                      { label: 'rest', value: 1 - fc.wardShare, color: 'transparent' },
                    ]}
                  />
                  <span className="figure w-11 shrink-0 text-right text-[11px] text-ink-faint">
                    {pct(fc.wardShare)}
                  </span>
                  <StackedBar
                    height="h-3"
                    segments={[
                      { label: 'Vote share', value: fc.voteShare, color: SERIES[0] },
                      { label: 'rest', value: 1 - fc.voteShare, color: 'transparent' },
                    ]}
                  />
                  <span className="figure w-11 shrink-0 text-right text-[11px] text-ink">
                    {pct(fc.voteShare)}
                  </span>
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
              <div className="min-w-[160px] flex-1 space-y-2.5">
                {(Object.keys(RISK_LABELS) as WardControl['risk'][]).map((risk) => (
                  <div key={risk} className="flex items-center gap-2">
                    <span
                      className="size-2.5 shrink-0 rounded-[2px]"
                      style={{ background: RISK_COLOR[risk] }}
                    />
                    <span className="flex-1 text-[11px] text-ink-muted">{RISK_LABELS[risk]}</span>
                    <span className="figure text-lg font-semibold text-ink">{a.control[risk]}</span>
                  </div>
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
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-3">
              <Stat label="Wards at stake" value={a.pipeline.wardsAtStake} tone="bad" size="sm" />
              <Stat label="Stalled 14d+" value={a.pipeline.stalledCount} tone="warn" size="sm" />
            </div>
            <Link
              href="/war-room/reconciliation"
              className="mt-3 inline-block text-xs text-accent underline underline-offset-4 hover:text-ink"
            >
              Open the reconciliation pipeline →
            </Link>
          </Panel>
        </div>

        {/* LGA priority + Turnout */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Votes cast by LGA" note="2023 proxy · work down this list">
            <RankedBars
              data={ranked.map((l, i) => ({
                label: l.name,
                value: l.validVotes,
                note: `${pct(l.voteShare, 1)} of district · ${l.currentPus} PUs${i < lgasForHalf ? ' · core bloc' : ''}`,
                color: i < lgasForHalf ? SERIES[0] : '#2b3444',
              }))}
              valueFormat={(n) => `${(n / 1000).toFixed(1)}k`}
            />
            <p className="mt-3 border-t border-line pt-3 text-xs text-ink-muted">
              <span className="figure text-ink">{lgasForHalf}</span> of 7 LGAs —{' '}
              <span className="text-ink">Ifelodun, Offa and Irepodun</span> — carry{' '}
              <span className="figure text-ink">{pct(running / totalValidVotes, 1)}</span> of all
              votes cast in Kwara South.
            </p>
          </Panel>

          <Panel title="Turnout by LGA" note="2023 proxy · darker is higher">
            <HeatGrid
              cells={ranked
                .slice()
                .sort((x, y) => y.turnout - x.turnout)
                .map((l) => ({
                  label: l.name,
                  t: (l.turnout - 0.21) / (0.28 - 0.21),
                  value: pct(l.turnout, 1),
                  title: `${l.name}: ${pct(l.turnout, 1)} turnout · ${l.validVotes.toLocaleString('en-NG')} votes · ~${l.registered.toLocaleString('en-NG')} implied voters`,
                }))}
            />
            <p className="mt-3 border-t border-line pt-3 text-xs text-ink-muted">
              <span className="text-ink">{lowestTurnout.name}</span> has Kwara South&rsquo;s largest
              voter roll (~{(lowestTurnout.registered / 1000).toFixed(0)}k) yet recorded Kwara&rsquo;s
              lowest turnout (<span className="figure text-ink">{pct(lowestTurnout.turnout, 1)}</span>
              ) against {highestTurnout.name} at{' '}
              <span className="figure text-ink">{pct(highestTurnout.turnout, 1)}</span>. Lifting
              Ifelodun turnout by 8 points alone yields ~10,000 new votes.
            </p>
          </Panel>
        </div>

        {/* 2023 Senate baseline & path to flip + Source reconciliation */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel
            title="2023 Senate baseline & path to flip"
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

            <div className="mt-4 grid grid-cols-1 gap-4 border-t border-line pt-3 sm:grid-cols-3">
              <Stat
                label="PDP + SDP (2023)"
                value={SENATE_TOTALS_2023.pdpPlusSdp}
                size="sm"
                tone="good"
                sub={`+${SENATE_TOTALS_2023.pdpPlusSdpMarginOverApc.toLocaleString('en-NG')} ahead of APC`}
              />
              <Stat
                label="Non-voters (2023 proxy)"
                value={DISTRICT_PROXY_TOTALS_2023.impliedRegistered - totalValidVotes}
                size="sm"
                tone="warn"
                sub="~75% stayed home"
              />
              <Stat
                label="2027 ballot field"
                value={`${campaignConfig.ballot2027.totalCandidates} candidates`}
                size="sm"
                sub="APC open seat · ADC · SDP"
              />
            </div>

            <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-ink-muted">
              In 2023, APC won Kwara South Senate with 55,966 votes only because opposition votes
              split between PDP (34,950) and SDP (24,265) — the cycle in which Saheed Popoola
              contested on the SDP ticket in Ifelodun/Offa/Oyun. Reunifying both pools inside PDP
              flips the baseline by <span className="figure text-aligned">+3,249</span> before a
              single new voter is mobilised.
            </p>
          </Panel>

          <Panel title="Source reconciliation" note="Senate vs proxy & PU roll">
            <div className="space-y-2.5">
              {recon.map((r) => (
                <div key={r.label} className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-ink-muted">{r.label}</span>
                  <span className="figure text-xs text-ink-faint">
                    {r.senate.toLocaleString('en-NG')} / {r.proxy.toLocaleString('en-NG')}
                  </span>
                  <span
                    className={`figure w-16 text-right text-xs ${
                      r.delta === 0 ? 'text-aligned' : 'text-passive'
                    }`}
                  >
                    {r.delta > 0 ? `+${r.delta.toLocaleString('en-NG')}` : r.delta.toLocaleString('en-NG')}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-ink-muted">
              Per-LGA spatial weights use the March 2023 governorship declaration as a proxy until
              per-LGA Senate Form EC8D collation sheets are ingested. Offa alone expanded from 86 to
              173 polling units (+87) in 2021; confirm ward-level allocations with INEC Kwara.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
