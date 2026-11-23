'use client';

import { useMemo, useState } from 'react';

import { Funnel, InteractiveStatCard, RankedBars, SERIES } from '@/components/charts';
import { DetailDrawer } from '@/components/detail-drawer';
import { WardDrawerBody } from '@/components/geo-drilldown';
import { PageHeader, Panel } from '@/components/shell';
import { FEDERAL_CONSTITUENCIES, getLga, getWard, lgas } from '@/lib/geography';
import {
  ASK_LABELS,
  KIND_LABELS,
  STAGE_LABELS,
  STAGE_ORDER,
  byPriority,
  daysSinceContact,
  reconciliationWeight,
  stalled,
  summarise,
  type ReconciliationStage,
  type Stakeholder,
} from '@/lib/party/reconciliation';
import { seedRoster, seedStakeholders } from '@/lib/simulation/seed';
import { analyse } from '@/lib/war-room/analysis';

const STAGE_TONE: Record<ReconciliationStage, string> = {
  identified: 'border-unknown/40 text-unknown',
  assigned: 'border-unknown/40 text-ink-muted',
  engaged: 'border-reconciled/40 text-reconciled',
  ask_tabled: 'border-passive/40 text-passive',
  agreed: 'border-aligned/40 text-aligned',
  reconciled: 'border-aligned/60 bg-aligned/10 text-aligned',
  refused: 'border-aggrieved/50 bg-aggrieved/10 text-aggrieved',
};

function StageChip({ stage }: { stage: ReconciliationStage }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-sm border px-1.5 py-px text-[10px] font-medium uppercase tracking-[0.1em] ${STAGE_TONE[stage]}`}
    >
      {STAGE_LABELS[stage]}
    </span>
  );
}

type DrawerState =
  | { kind: 'stakeholder'; id: string }
  | { kind: 'ward'; wardId: string; fromStakeholderId: string }
  | null;

export default function ReconciliationPage() {
  const initialStakeholders = useMemo(() => seedStakeholders(), []);
  const { entries } = useMemo(() => seedRoster(), []);

  const [stageOverrides, setStageOverrides] = useState<Record<string, ReconciliationStage>>({});
  const [stageFilter, setStageFilter] = useState<'all' | 'open' | 'stalled' | ReconciliationStage>(
    'all'
  );
  const [lgaFilter, setLgaFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [drawer, setDrawer] = useState<DrawerState>(null);

  const stakeholders: Stakeholder[] = useMemo(
    () =>
      initialStakeholders.map((s) =>
        stageOverrides[s.id] ? { ...s, stage: stageOverrides[s.id] } : s
      ),
    [initialStakeholders, stageOverrides]
  );

  const analysis = useMemo(() => analyse(entries, stakeholders), [entries, stakeholders]);
  const summary = useMemo(() => summarise(stakeholders), [stakeholders]);
  const ranked = useMemo(() => byPriority(stakeholders), [stakeholders]);
  const cold = useMemo(() => stalled(stakeholders), [stakeholders]);
  const coldSet = useMemo(() => new Set(cold.map((s) => s.id)), [cold]);

  const openCount = summary.total - summary.byStage.reconciled - summary.byStage.refused;
  const recoveryPct =
    summary.wardsAtStake + summary.wardsRecovered > 0
      ? Math.round(
          (summary.wardsRecovered / (summary.wardsAtStake + summary.wardsRecovered)) * 100
        )
      : 0;

  const wardsByLga = useMemo(
    () =>
      lgas
        .map((l) => {
          const set = new Set<string>();
          for (const s of stakeholders) {
            if (s.lgaCode === l.code && s.stage !== 'reconciled' && s.stage !== 'refused') {
              for (const w of s.carriesWardIds) set.add(w);
            }
          }
          return {
            lgaCode: l.code,
            name: l.name,
            wards: set.size,
            openCases: stakeholders.filter(
              (s) => s.lgaCode === l.code && s.stage !== 'reconciled' && s.stage !== 'refused'
            ).length,
          };
        })
        .sort((a, b) => b.wards - a.wards),
    [stakeholders]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ranked.filter((s) => {
      if (stageFilter === 'open' && (s.stage === 'reconciled' || s.stage === 'refused'))
        return false;
      else if (stageFilter === 'stalled' && !coldSet.has(s.id)) return false;
      else if (
        stageFilter !== 'all' &&
        stageFilter !== 'open' &&
        stageFilter !== 'stalled' &&
        s.stage !== stageFilter
      )
        return false;

      if (lgaFilter !== 'all' && s.lgaCode !== lgaFilter) return false;
      if (q) {
        const lgaName = getLga(s.lgaCode)?.name.toLowerCase() ?? '';
        const match =
          s.name.toLowerCase().includes(q) ||
          (s.bloc ?? '').toLowerCase().includes(q) ||
          lgaName.includes(q) ||
          KIND_LABELS[s.kind].toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [ranked, stageFilter, lgaFilter, query, coldSet]);

  const activeStakeholder =
    drawer?.kind === 'stakeholder'
      ? stakeholders.find((s) => s.id === drawer.id)
      : drawer?.kind === 'ward'
        ? stakeholders.find((s) => s.id === drawer.fromStakeholderId)
        : undefined;

  const activeWard = drawer?.kind === 'ward' ? getWard(drawer.wardId) : undefined;

  // Funnel stages (cumulative progress)
  const funnelStages = [
    { label: 'Identified+', value: summary.total },
    {
      label: 'Assigned+',
      value: summary.total - summary.byStage.identified,
    },
    {
      label: 'Engaged+',
      value:
        summary.byStage.engaged +
        summary.byStage.ask_tabled +
        summary.byStage.agreed +
        summary.byStage.reconciled,
    },
    {
      label: 'Agreed+',
      value: summary.byStage.agreed + summary.byStage.reconciled,
    },
    { label: 'Reconciled', value: summary.byStage.reconciled },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Reconciliation · PDP & SDP Reunification"
        title="Unifying Kwara South behind one Senate ticket"
        lede="Tap any KPI card, LGA bar, or stakeholder below to filter the pipeline, inspect contact logs, and advance reconciliation stages live."
      />

      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        {/* TOP 6 CLICKABLE KPI NUMBER CARDS */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
          <InteractiveStatCard
            label="Stakeholders"
            value={summary.total}
            sub="across 7 LGAs"
            active={stageFilter === 'all'}
            onClick={() => setStageFilter('all')}
          />
          <InteractiveStatCard
            label="Open cases"
            value={openCount}
            sub="active negotiation"
            active={stageFilter === 'open'}
            onClick={() => setStageFilter((cur) => (cur === 'open' ? 'all' : 'open'))}
          />
          <InteractiveStatCard
            label="Wards at stake"
            value={summary.wardsAtStake}
            tone="bad"
            sub="carried by open blocs"
            onClick={() => setStageFilter('open')}
          />
          <InteractiveStatCard
            label="Stalled 14d+"
            value={summary.stalledCount}
            tone="warn"
            sub="going cold · tap list"
            active={stageFilter === 'stalled'}
            onClick={() => setStageFilter((cur) => (cur === 'stalled' ? 'all' : 'stalled'))}
          />
          <InteractiveStatCard
            label="Reconciled"
            value={summary.byStage.reconciled}
            tone="good"
            sub={`${summary.wardsRecovered} wards recovered`}
            active={stageFilter === 'reconciled'}
            onClick={() => setStageFilter((cur) => (cur === 'reconciled' ? 'all' : 'reconciled'))}
          />
          <InteractiveStatCard
            label="Recovery rate"
            value={`${recoveryPct}%`}
            tone="accent"
            sub={`${summary.byStage.refused} refused`}
            active={stageFilter === 'refused'}
            onClick={() => setStageFilter((cur) => (cur === 'refused' ? 'all' : 'refused'))}
          />
        </div>

        {/* ABOVE-THE-FOLD VISUAL DASHBOARD GRID */}
        <div className="grid gap-4 lg:grid-cols-5">
          <Panel
            title="Pipeline conversion"
            note="Tap any stage card below to filter"
            className="lg:col-span-3"
          >
            <Funnel stages={funnelStages} />
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-3 sm:grid-cols-4 lg:grid-cols-7">
              {[...STAGE_ORDER, 'refused' as const].map((stage) => {
                const active = stageFilter === stage;
                return (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => setStageFilter((cur) => (cur === stage ? 'all' : stage))}
                    className={`rounded-md border px-2.5 py-2 text-left transition-all ${
                      active
                        ? 'border-accent/60 bg-accent/15'
                        : 'border-line bg-surface-raised hover:border-line-bright'
                    }`}
                  >
                    <div className="truncate text-[9px] uppercase tracking-[0.08em] text-ink-faint">
                      {STAGE_LABELS[stage]}
                    </div>
                    <div className="figure mt-0.5 text-lg font-semibold text-ink">
                      {summary.byStage[stage]}
                    </div>
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel
            title="Wards at stake by LGA"
            note="Tap any LGA to filter stakeholders"
            className="lg:col-span-2"
          >
            <RankedBars
              data={wardsByLga.map((x) => ({
                id: x.lgaCode,
                label: x.name,
                value: x.wards,
                note: `${x.openCases} open cases`,
                color: lgaFilter === x.lgaCode ? SERIES[0] : '#d03b3b',
              }))}
              activeId={lgaFilter === 'all' ? null : lgaFilter}
              onSelect={(d) =>
                d.id && setLgaFilter((cur) => (cur === d.id ? 'all' : d.id!))
              }
              valueFormat={(n) => `${n} wards`}
            />
          </Panel>
        </div>

        {/* Going cold clickable pills */}
        {cold.length > 0 && (
          <Panel title="Going cold" note="Tap any stalling stakeholder to open their dossier">
            <div className="flex flex-wrap gap-2">
              {cold.slice(0, 10).map((s) => {
                const days = daysSinceContact(s);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setDrawer({ kind: 'stakeholder', id: s.id })}
                    className="flex items-center gap-2 rounded-md border border-passive/30 bg-passive/5 px-2.5 py-2 transition-colors hover:border-passive hover:bg-passive/15 active:scale-[0.98]"
                  >
                    <span className="text-xs font-medium text-ink">{s.name}</span>
                    <span className="figure text-[11px] text-passive">
                      {days === null ? 'never' : `${days}d`}
                    </span>
                    <span className="figure text-[11px] text-ink-faint">
                      {s.carriesWardIds.length}w
                    </span>
                  </button>
                );
              })}
            </div>
          </Panel>
        )}

        {/* Filter bar + Search */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            <button
              type="button"
              onClick={() => setLgaFilter('all')}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${
                lgaFilter === 'all'
                  ? 'border-accent/60 bg-accent/15 text-accent'
                  : 'border-line bg-surface text-ink-muted hover:text-ink'
              }`}
            >
              All 7 LGAs
            </button>
            {lgas.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLgaFilter((cur) => (cur === l.code ? 'all' : l.code))}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${
                  lgaFilter === l.code
                    ? 'border-accent/60 bg-accent/15 text-accent'
                    : 'border-line bg-surface text-ink-muted hover:text-ink'
                }`}
              >
                {l.name}
              </button>
            ))}
          </div>

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, bloc, role…"
            className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none sm:w-64"
          />
        </div>

        {/* Stakeholders — Mobile Cards + Desktop Clickable Table */}
        <Panel
          title="By recovery weight"
          note={`${filtered.length} of ${ranked.length} stakeholders · tap any to open dossier`}
        >
          <div className="space-y-2.5 md:hidden">
            {filtered.slice(0, 40).map((s, i) => {
              const days = daysSinceContact(s);
              const lga = getLga(s.lgaCode);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setDrawer({ kind: 'stakeholder', id: s.id })}
                  className="block w-full rounded-lg border border-line bg-surface-raised p-3.5 text-left transition-colors hover:border-line-bright active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="figure text-[10px] text-ink-faint">#{i + 1}</span>
                        <span className="truncate text-sm font-semibold text-ink">{s.name}</span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-ink-muted">
                        {KIND_LABELS[s.kind]} · {lga?.name}
                      </div>
                      {s.bloc && <div className="mt-0.5 text-[11px] text-aggrieved">{s.bloc}</div>}
                    </div>
                    <StageChip stage={s.stage} />
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-line pt-2 text-[11px]">
                    <span className="text-ink-muted">{ASK_LABELS[s.ask]}</span>
                    <div className="flex items-center gap-3">
                      <span className="figure text-ink">{s.carriesWardIds.length}w</span>
                      <span className="figure text-passive">
                        {days === null ? 'no contact' : `${days}d`}
                      </span>
                      <span className="text-accent">›</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[780px]">
              <thead>
                <tr className="border-b border-line text-left text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                  <th className="pb-2 pr-3 font-medium">#</th>
                  <th className="pb-2 pr-3 font-medium">Stakeholder</th>
                  <th className="pb-2 pr-3 font-medium">Base</th>
                  <th className="pb-2 pr-3 font-medium">Stage</th>
                  <th className="pb-2 pr-3 font-medium">Ask</th>
                  <th className="pb-2 pr-3 text-right font-medium">Wards</th>
                  <th className="pb-2 pr-3 text-right font-medium">Weight</th>
                  <th className="pb-2 text-right font-medium">Last contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.slice(0, 40).map((s, i) => {
                  const days = daysSinceContact(s);
                  const lga = getLga(s.lgaCode);
                  const fc = FEDERAL_CONSTITUENCIES.find((x) => x.id === s.constituencyId);
                  const coldFlag = days === null || days >= 14;
                  const open = s.stage !== 'reconciled' && s.stage !== 'refused';
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setDrawer({ kind: 'stakeholder', id: s.id })}
                      className="cursor-pointer align-top transition-colors hover:bg-surface-raised"
                    >
                      <td className="figure py-3 pr-3 text-xs text-ink-faint">{i + 1}</td>
                      <td className="py-3 pr-3">
                        <div className="text-sm font-medium text-ink">{s.name}</div>
                        <div className="mt-0.5 text-[11px] text-ink-faint">
                          {KIND_LABELS[s.kind]}
                          {s.bloc && <span className="ml-1.5 text-aggrieved">· {s.bloc}</span>}
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-xs text-ink-muted">
                        {lga?.name}
                        <div className="text-[11px] text-ink-faint">{fc?.shortName}</div>
                      </td>
                      <td className="py-3 pr-3">
                        <StageChip stage={s.stage} />
                      </td>
                      <td className="py-3 pr-3 text-xs text-ink-muted">{ASK_LABELS[s.ask]}</td>
                      <td className="figure py-3 pr-3 text-right text-sm text-ink">
                        {s.carriesWardIds.length}
                      </td>
                      <td className="figure py-3 pr-3 text-right text-sm text-ink-muted">
                        {reconciliationWeight(s).toFixed(1)}
                      </td>
                      <td className="py-3 text-right">
                        {days === null ? (
                          <span className="text-[11px] text-aggrieved">no contact</span>
                        ) : (
                          <span
                            className={`figure text-sm ${open && coldFlag ? 'text-passive' : 'text-ink-muted'}`}
                          >
                            {days}d
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <DetailDrawer
        open={drawer !== null}
        onClose={() => setDrawer(null)}
        onBack={
          drawer?.kind === 'ward'
            ? () => setDrawer({ kind: 'stakeholder', id: drawer.fromStakeholderId })
            : undefined
        }
        backLabel={
          drawer?.kind === 'ward'
            ? `Back to ${activeStakeholder?.name ?? 'Stakeholder'}`
            : undefined
        }
        eyebrow={
          drawer?.kind === 'ward'
            ? `Carried ward · ${getLga(activeWard?.lgaCode ?? '')?.name ?? ''}`
            : `Stakeholder dossier · ${getLga(activeStakeholder?.lgaCode ?? '')?.name ?? ''}`
        }
        title={
          drawer?.kind === 'ward'
            ? `${activeWard?.name ?? ''} Ward`
            : activeStakeholder?.name ?? ''
        }
        subtitle={
          drawer?.kind === 'stakeholder' && activeStakeholder
            ? `${KIND_LABELS[activeStakeholder.kind]}${activeStakeholder.bloc ? ` · ${activeStakeholder.bloc}` : ''}`
            : undefined
        }
      >
        {drawer?.kind === 'stakeholder' && activeStakeholder && (
          <div className="space-y-5">
            <div className="rounded-lg border border-line bg-surface-raised p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  Update reconciliation stage (live demo)
                </span>
                <StageChip stage={activeStakeholder.stage} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[...STAGE_ORDER, 'refused' as const].map((stage) => (
                  <button
                    key={stage}
                    type="button"
                    onClick={() =>
                      setStageOverrides((prev) => ({ ...prev, [activeStakeholder.id]: stage }))
                    }
                    className={`rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                      activeStakeholder.stage === stage
                        ? 'border-accent bg-accent/15 text-accent'
                        : 'border-line bg-surface text-ink-muted hover:border-line-bright hover:text-ink'
                    }`}
                  >
                    {STAGE_LABELS[stage]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-lg border border-line bg-surface-raised p-3">
                <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Ask</div>
                <div className="mt-1 text-xs font-medium text-ink">
                  {ASK_LABELS[activeStakeholder.ask]}
                </div>
              </div>
              <div className="rounded-lg border border-line bg-surface-raised p-3">
                <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                  Recovery weight
                </div>
                <div className="figure mt-1 text-base font-semibold text-accent">
                  {reconciliationWeight(activeStakeholder).toFixed(1)}{' '}
                  <span className="text-xs font-normal text-ink-muted">
                    ({activeStakeholder.carriesWardIds.length}w)
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                Wards carried ({activeStakeholder.carriesWardIds.length}) — tap to inspect ward
              </h3>
              <div className="flex flex-wrap gap-2">
                {activeStakeholder.carriesWardIds.map((wid) => {
                  const w = getWard(wid);
                  return (
                    <button
                      key={wid}
                      type="button"
                      onClick={() =>
                        setDrawer({
                          kind: 'ward',
                          wardId: wid,
                          fromStakeholderId: activeStakeholder.id,
                        })
                      }
                      className="rounded-md border border-line-bright bg-surface-raised px-3 py-2 text-xs text-ink transition-colors hover:border-accent/60 hover:text-accent"
                    >
                      {w?.name ?? wid}{' '}
                      <span className="figure text-[10px] text-ink-faint">
                        ({w?.declaredPollingUnitCount ?? 0} PUs)
                      </span>{' '}
                      ›
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                Contact log ({activeStakeholder.contactLog.length})
              </h3>
              {activeStakeholder.contactLog.length === 0 ? (
                <div className="rounded-lg border border-dashed border-aggrieved/40 bg-aggrieved/5 p-3.5 text-xs text-aggrieved">
                  No contact recorded yet. Assign a Kwara South handler immediately.
                </div>
              ) : (
                <ol className="space-y-2.5">
                  {[...activeStakeholder.contactLog].reverse().map((entry) => (
                    <li
                      key={entry.id}
                      className="rounded-lg border border-line bg-surface-raised p-3"
                    >
                      <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                        <span>
                          {entry.channel.replace('_', ' ')} · Handler {entry.byHandlerId}
                        </span>
                        <span className="figure">
                          {new Date(entry.at).toLocaleDateString('en-NG')}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-ink">{entry.note}</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}

        {drawer?.kind === 'ward' && analysis.wardControl.get(drawer.wardId) && (
          <WardDrawerBody
            wardId={drawer.wardId}
            entries={entries}
            control={analysis.wardControl.get(drawer.wardId)!}
            stakeholders={stakeholders}
          />
        )}
      </DetailDrawer>
    </>
  );
}
