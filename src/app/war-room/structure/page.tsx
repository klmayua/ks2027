'use client';

import { useMemo, useState } from 'react';

import {
  InteractiveStatCard,
  Legend,
  RankedBars,
  StackedBar,
  Stat,
  WeightedMosaic,
  type MosaicRow,
} from '@/components/charts';
import { DetailDrawer } from '@/components/detail-drawer';
import {
  LgaDrawerBody,
  RISK_COLOR,
  WardDrawerBody,
} from '@/components/geo-drilldown';
import { PageHeader, Panel } from '@/components/shell';
import {
  FEDERAL_CONSTITUENCIES,
  constituencyOfLga,
  getLga,
  getWard,
  lgas,
  wardsInLga,
  type FederalConstituencyId,
} from '@/lib/geography';
import { resultFor, totalValidVotes } from '@/lib/geography/results-2023';
import {
  RISK_LABELS,
  type Alignment,
  type RosterEntry,
  type WardControl,
} from '@/lib/party/structure';
import { seedRoster, seedStakeholders } from '@/lib/simulation/seed';
import { analyse } from '@/lib/war-room/analysis';

const pct = (n: number, dp = 0) => `${(n * 100).toFixed(dp)}%`;
const ALIGNMENT_CYCLE: Alignment[] = ['aligned', 'reconciled', 'passive', 'aggrieved', 'unknown'];

type DrawerState =
  | { kind: 'lga'; lgaCode: string }
  | { kind: 'ward'; wardId: string; fromLga?: string }
  | null;

export default function PowerMapPage() {
  const initialRoster = useMemo(() => seedRoster(), []);
  const stakeholders = useMemo(() => seedStakeholders(), []);

  // Live local alignment overrides so clicking an officer's alignment in the drawer recalculates the map!
  const [alignmentOverrides, setAlignmentOverrides] = useState<Record<string, Alignment>>({});
  const [fcFilter, setFcFilter] = useState<'all' | FederalConstituencyId>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | WardControl['risk']>('all');
  const [expandedLgaMobile, setExpandedLgaMobile] = useState<string | null>('05');
  const [drawer, setDrawer] = useState<DrawerState>(null);

  const entries: RosterEntry[] = useMemo(
    () =>
      initialRoster.entries.map((e) => {
        const override = alignmentOverrides[e.appointment.id];
        if (!override) return e;
        return { ...e, appointment: { ...e.appointment, alignment: override } };
      }),
    [initialRoster.entries, alignmentOverrides]
  );

  const a = useMemo(() => analyse(entries, stakeholders), [entries, stakeholders]);

  const cycleAlignment = (appointmentId: string) => {
    const current =
      alignmentOverrides[appointmentId] ??
      initialRoster.entries.find((e) => e.appointment.id === appointmentId)?.appointment
        .alignment ??
      'unknown';
    const next = ALIGNMENT_CYCLE[(ALIGNMENT_CYCLE.indexOf(current) + 1) % ALIGNMENT_CYCLE.length];
    setAlignmentOverrides((prev) => ({ ...prev, [appointmentId]: next }));
  };

  const claimedBy = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const s of stakeholders) {
      if (s.stage === 'reconciled' || s.stage === 'refused') continue;
      for (const w of s.carriesWardIds) map.set(w, [...(map.get(w) ?? []), s.name]);
    }
    return map;
  }, [stakeholders]);

  const wardVotes = useMemo(() => {
    const map = new Map<string, number>();
    for (const lga of lgas) {
      const result = resultFor(lga.code);
      const lgaWards = wardsInLga(lga.code);
      const puTotal = lgaWards.reduce((s, w) => s + w.declaredPollingUnitCount, 0) || 1;
      for (const w of lgaWards) {
        map.set(
          w.id,
          Math.round(((result?.validVotes ?? 0) * w.declaredPollingUnitCount) / puTotal)
        );
      }
    }
    return map;
  }, []);

  let votesExposed = 0;
  let votesHeld = 0;
  for (const [wardId, votes] of wardVotes) {
    const risk = a.wardControl.get(wardId)?.risk;
    if (risk === 'held') votesHeld += votes;
    else if (risk === 'exposed' || risk === 'vacant') votesExposed += votes;
  }
  const totalWardVotes = [...wardVotes.values()].reduce((s, v) => s + v, 0) || 1;

  const visibleLgas = lgas
    .filter((l) => fcFilter === 'all' || constituencyOfLga(l.code)?.id === fcFilter)
    .sort((x, y) => (resultFor(y.code)?.validVotes ?? 0) - (resultFor(x.code)?.validVotes ?? 0));

  const rows: MosaicRow[] = visibleLgas.map((lga) => {
    const result = resultFor(lga.code);
    const lgaWards = wardsInLga(lga.code);
    return {
      id: lga.code,
      label: lga.name,
      weight: result?.validVotes ?? 0,
      note: `${((result?.validVotes ?? 0) / 1000).toFixed(1)}k`,
      cells: lgaWards
        .slice()
        .sort((x, y) => y.declaredPollingUnitCount - x.declaredPollingUnitCount)
        .map((w) => {
          const c = a.wardControl.get(w.id)!;
          const claims = claimedBy.get(w.id) ?? [];
          const dimmed = riskFilter !== 'all' && c.risk !== riskFilter;
          return {
            id: w.id,
            weight: w.declaredPollingUnitCount,
            color: dimmed ? '#1d2431' : RISK_COLOR[c.risk],
            label:
              !dimmed && w.declaredPollingUnitCount >= 12
                ? String(w.declaredPollingUnitCount)
                : undefined,
            title: [
              `${w.name} (${w.id}) — Click to inspect`,
              `${RISK_LABELS[c.risk]} — ${c.filledSeats}/${c.loadBearingSeats} load-bearing seats`,
              `${w.declaredPollingUnitCount} enumerated PUs · ~${(wardVotes.get(w.id) ?? 0).toLocaleString('en-NG')} votes`,
              claims.length ? `Claimed by: ${claims.join(', ')}` : null,
            ]
              .filter(Boolean)
              .join('\n'),
          };
        }),
    };
  });

  const exposureByLga = visibleLgas
    .map((lga) => {
      const lgaWards = wardsInLga(lga.code);
      const atRisk = lgaWards
        .filter((w) => {
          const r = a.wardControl.get(w.id)?.risk;
          return r === 'exposed' || r === 'vacant';
        })
        .reduce((s, w) => s + (wardVotes.get(w.id) ?? 0), 0);
      return { code: lga.code, name: lga.name, atRisk, total: resultFor(lga.code)?.validVotes ?? 0 };
    })
    .filter((x) => x.atRisk > 0)
    .sort((x, y) => y.atRisk - x.atRisk);

  const activeLga = drawer?.kind === 'lga' ? getLga(drawer.lgaCode) : undefined;
  const activeWard = drawer?.kind === 'ward' ? getWard(drawer.wardId) : undefined;
  const overrideCount = Object.keys(alignmentOverrides).length;

  return (
    <>
      <PageHeader
        eyebrow="Power map · 83 Kwara South wards"
        title="Exposure, weighted by where Kwara South votes"
        lede="Tap any LGA or ward tile below to inspect its executive roster, phone contacts, polling units, and live-simulate ward alignment changes."
        aside={
          <div className="flex w-full flex-wrap gap-x-6 gap-y-3 rounded-lg border border-line bg-surface-raised px-4 py-3 sm:px-5 lg:w-auto">
            <Stat
              label="2023 votes exposed"
              value={`${(votesExposed / 1000).toFixed(1)}k`}
              tone="bad"
              size="sm"
              sub={`${pct(votesExposed / totalWardVotes)} of Kwara South`}
            />
            <Stat
              label="2023 votes held"
              value={`${(votesHeld / 1000).toFixed(1)}k`}
              tone="good"
              size="sm"
              sub={pct(votesHeld / totalWardVotes)}
            />
          </div>
        }
      />

      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        {/* Interactive Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {(
              [
                ['all', 'All Kwara South (7 LGAs)'],
                ...FEDERAL_CONSTITUENCIES.map((fc) => [fc.id, fc.shortName] as const),
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFcFilter(id as 'all' | FederalConstituencyId)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  fcFilter === id
                    ? 'border-accent/60 bg-accent/15 text-accent'
                    : 'border-line bg-surface text-ink-muted hover:border-line-bright hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', 'held', 'contested', 'exposed', 'vacant'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRiskFilter(r)}
                className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  riskFilter === r
                    ? 'border-accent/60 bg-accent/15 text-accent'
                    : 'border-line bg-surface text-ink-muted hover:text-ink'
                }`}
              >
                {r === 'all' ? 'All states' : `${RISK_LABELS[r]} (${a.control[r]})`}
              </button>
            ))}
            {overrideCount > 0 && (
              <button
                type="button"
                onClick={() => setAlignmentOverrides({})}
                className="rounded-md border border-passive/40 bg-passive/10 px-2.5 py-1 text-[11px] text-passive hover:bg-passive/20"
              >
                Reset {overrideCount} edit{overrideCount === 1 ? '' : 's'}
              </button>
            )}
          </div>
        </div>

        {/* Clickable Risk Summary Cards */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {(['held', 'contested', 'exposed', 'vacant'] as const).map((risk) => (
            <InteractiveStatCard
              key={risk}
              label={RISK_LABELS[risk]}
              value={a.control[risk]}
              sub="wards · tap to filter"
              tone={
                risk === 'held'
                  ? 'good'
                  : risk === 'contested'
                    ? 'warn'
                    : risk === 'exposed'
                      ? 'bad'
                      : 'neutral'
              }
              active={riskFilter === risk}
              onClick={() => setRiskFilter((cur) => (cur === risk ? 'all' : risk))}
            />
          ))}
        </div>

        {/* Desktop Interactive Mosaic + Mobile Native Expandable LGA/Ward Cards */}
        <Panel
          title="Every ward in Kwara South, sized by weight"
          note="Tap any ward tile or LGA row to inspect roster & polling units"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Legend
              items={(Object.keys(RISK_LABELS) as WardControl['risk'][]).map((risk) => ({
                label: RISK_LABELS[risk],
                color: RISK_COLOR[risk],
                value: String(a.control[risk]),
              }))}
            />
            <span className="text-[11px] text-ink-faint">
              Ifelodun casts 3.1× Isin. Tap any block to drill in.
            </span>
          </div>

          {/* Desktop/Tablet Weighted Mosaic */}
          <div className="hidden sm:block">
            <WeightedMosaic
              rows={rows}
              height={30}
              onSelectRow={(lgaCode) => setDrawer({ kind: 'lga', lgaCode })}
              onSelectCell={(wardId, lgaCode) =>
                setDrawer({ kind: 'ward', wardId, fromLga: lgaCode })
              }
            />
          </div>

          {/* Mobile-native accordion cards with crisp tappable ward chips */}
          <div className="space-y-2.5 sm:hidden">
            {visibleLgas.map((lga) => {
              const lgaWards = wardsInLga(lga.code).filter(
                (w) => riskFilter === 'all' || a.wardControl.get(w.id)?.risk === riskFilter
              );
              const isExpanded = expandedLgaMobile === lga.code;
              const votes = resultFor(lga.code)?.validVotes ?? 0;

              return (
                <div
                  key={lga.code}
                  className="overflow-hidden rounded-lg border border-line bg-surface-raised"
                >
                  <div className="flex items-center justify-between gap-2 px-3.5 py-3">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedLgaMobile((cur) => (cur === lga.code ? null : lga.code))
                      }
                      className="flex flex-1 items-center justify-between gap-2 text-left"
                    >
                      <div>
                        <div className="text-sm font-semibold text-ink">{lga.name}</div>
                        <div className="figure text-[11px] text-ink-muted">
                          {(votes / 1000).toFixed(1)}k votes · {lgaWards.length} wards shown
                        </div>
                      </div>
                      <span className="text-xs text-ink-faint">{isExpanded ? '▾' : '▸'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDrawer({ kind: 'lga', lgaCode: lga.code })}
                      className="rounded border border-line-bright px-2 py-1 text-[10px] font-medium text-accent"
                    >
                      LGA ›
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="grid grid-cols-2 gap-1.5 border-t border-line bg-surface p-2.5">
                      {lgaWards.map((w) => {
                        const c = a.wardControl.get(w.id)!;
                        return (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() =>
                              setDrawer({ kind: 'ward', wardId: w.id, fromLga: lga.code })
                            }
                            className="flex flex-col justify-between rounded-md border border-line bg-surface-raised p-2.5 text-left active:scale-[0.98]"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="line-clamp-1 text-xs font-medium text-ink">
                                {w.name}
                              </span>
                              <span
                                className="mt-0.5 size-2 shrink-0 rounded-full"
                                style={{ background: RISK_COLOR[c.risk] }}
                              />
                            </div>
                            <div className="mt-1 flex items-center justify-between text-[10px] text-ink-faint">
                              <span className="figure">{w.declaredPollingUnitCount} PUs</span>
                              <span className="figure">{Math.round(c.effectiveControl * 100)}%</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Votes at risk by LGA" note="Tap any LGA to drill into exposed wards">
            <RankedBars
              data={exposureByLga.map((l) => ({
                id: l.code,
                label: l.name,
                value: l.atRisk,
                note: `${pct(l.atRisk / (l.total || 1))} of its 2023 vote`,
                color: '#d03b3b',
              }))}
              onSelect={(d) => d.id && setDrawer({ kind: 'lga', lgaCode: d.id })}
              valueFormat={(n) => `${(n / 1000).toFixed(1)}k`}
            />
          </Panel>

          <Panel title="Control by federal constituency" note="Tap to filter power map">
            <div className="space-y-3">
              {FEDERAL_CONSTITUENCIES.map((fc) => {
                const analysis = a.constituencies.find((x) => x.id === fc.id)!;
                const votes = fc.lgaCodes.reduce((s, c) => s + (resultFor(c)?.validVotes ?? 0), 0);
                return (
                  <button
                    key={fc.id}
                    type="button"
                    onClick={() => setFcFilter((cur) => (cur === fc.id ? 'all' : fc.id))}
                    className={`block w-full rounded-lg border p-3 text-left transition-colors ${
                      fcFilter === fc.id
                        ? 'border-accent/50 bg-accent/10'
                        : 'border-line bg-surface-raised hover:border-line-bright'
                    }`}
                  >
                    <div className="mb-1.5 flex items-baseline justify-between gap-2">
                      <span className="text-xs font-medium text-ink">{fc.name}</span>
                      <span className="figure shrink-0 text-[11px] text-ink-faint">
                        {analysis.wardCount}w · {pct(votes / totalValidVotes)} vote
                      </span>
                    </div>
                    <StackedBar
                      height="h-5"
                      showLabels
                      segments={(Object.keys(RISK_LABELS) as WardControl['risk'][]).map((risk) => ({
                        label: RISK_LABELS[risk],
                        value: analysis.control[risk],
                        color: RISK_COLOR[risk],
                      }))}
                    />
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>

        <Panel
          title="Orphan wards"
          note={`${a.orphanWards.length} unclaimed exposed/vacant wards — tap any to inspect`}
        >
          {a.orphanWards.length === 0 ? (
            <p className="text-sm text-ink-muted">Every exposed ward is claimed by someone.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {a.orphanWards.map((id) => {
                const ward = getWard(id);
                const lga = ward ? getLga(ward.lgaCode) : undefined;
                const v = wardVotes.get(id) ?? 0;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setDrawer({ kind: 'ward', wardId: id, fromLga: ward?.lgaCode })}
                    className="flex items-center gap-2 rounded-md border border-line-bright bg-surface-raised px-2.5 py-2 text-left transition-colors hover:border-accent/50 active:scale-[0.98]"
                  >
                    <span className="text-xs font-medium text-ink">{ward?.name}</span>
                    <span className="text-[10px] text-ink-faint">{lga?.name}</span>
                    <span className="figure text-[10px] text-aggrieved">
                      {(v / 1000).toFixed(1)}k
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

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
            ? 'LGA Power Map'
            : `Ward Power Map · ${getLga(activeWard?.lgaCode ?? '')?.name ?? ''}`
        }
        title={
          drawer?.kind === 'lga'
            ? `${activeLga?.name ?? ''} Local Government`
            : `${activeWard?.name ?? ''} Ward`
        }
        subtitle={
          drawer?.kind === 'ward'
            ? 'Tap any officer’s alignment chip below to simulate reconciliation and watch the power map update.'
            : 'Tap any ward to inspect its executive roster and polling units.'
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
            onCycleAlignment={cycleAlignment}
          />
        )}
      </DetailDrawer>
    </>
  );
}
