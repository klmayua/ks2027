'use client';

import { useMemo, useState } from 'react';

import {
  InteractiveStatCard,
  Legend,
  SERIES,
  StackedBar,
  WeightedMosaic,
} from '@/components/charts';
import { DetailDrawer } from '@/components/detail-drawer';
import { PageHeader, Panel } from '@/components/shell';
import { getLga, getWard, lgas, wardsInLga } from '@/lib/geography';
import { resultFor } from '@/lib/geography/results-2023';
import {
  AGENT_STATUS_LABELS,
  CITIZEN_REPORT_LABELS,
  CORROBORATION_THRESHOLD,
  DESK_LABELS,
  INCIDENT_STATUS_LABELS,
  INCIDENT_TYPE_LABELS,
  computeCoverage,
  computeTally,
  surfaced,
  type Incident,
  type IncidentDesk,
  type IncidentSeverity,
  type IncidentStatus,
} from '@/lib/election';
import {
  seedAgents,
  seedCitizenReports,
  seedIncidents,
  seedSubmissions,
} from '@/lib/simulation/seed-election';

const SEVERITY_TONE: Record<IncidentSeverity, string> = {
  low: 'text-ink-muted',
  medium: 'text-passive',
  high: 'text-aggrieved',
  critical: 'text-aggrieved font-semibold',
};

const STATUS_TONE: Record<IncidentStatus, string> = {
  open: 'border-aggrieved/50 bg-aggrieved/10 text-aggrieved',
  acknowledged: 'border-passive/40 text-passive',
  actioned: 'border-reconciled/40 text-reconciled',
  resolved: 'border-aligned/50 bg-aligned/10 text-aligned',
  unfounded: 'border-line-bright text-ink-faint',
};

const PARTY_COLOR: Record<string, string> = {
  PDP: SERIES[0],
  APC: SERIES[1],
  SDP: SERIES[2],
  ADC: SERIES[3],
};

const pct = (n: number, dp = 0) => `${(n * 100).toFixed(dp)}%`;

type DrawerState =
  | { kind: 'ward'; wardId: string; fromLga?: string }
  | { kind: 'lga'; lgaCode: string }
  | { kind: 'incident'; id: string }
  | null;

export default function ElectionDayPage() {
  const agents = useMemo(() => seedAgents(), []);
  const allSubmissions = useMemo(() => seedSubmissions(agents), [agents]);
  const allCitizenReports = useMemo(() => seedCitizenReports(), []);
  const initialIncidents = useMemo(() => seedIncidents(), []);

  const [lgaFilter, setLgaFilter] = useState<string>('all');
  const [deskFilter, setDeskFilter] = useState<'all' | IncidentDesk>('all');
  const [incidentOverrides, setIncidentOverrides] = useState<Record<string, IncidentStatus>>({});
  const [drawer, setDrawer] = useState<DrawerState>(null);

  const incidents: Incident[] = useMemo(
    () =>
      initialIncidents.map((inc) =>
        incidentOverrides[inc.id] ? { ...inc, status: incidentOverrides[inc.id] } : inc
      ),
    [initialIncidents, incidentOverrides]
  );

  const scopedSubmissions = useMemo(
    () =>
      lgaFilter === 'all'
        ? allSubmissions
        : allSubmissions.filter((s) => s.lgaCode === lgaFilter),
    [allSubmissions, lgaFilter]
  );
  const scopedAgents = useMemo(
    () => (lgaFilter === 'all' ? agents : agents.filter((a) => a.lgaCode === lgaFilter)),
    [agents, lgaFilter]
  );
  const scopedIncidents = useMemo(
    () =>
      incidents.filter((i) => {
        if (lgaFilter !== 'all' && i.lgaCode !== lgaFilter) return false;
        if (deskFilter !== 'all' && i.desk !== deskFilter) return false;
        return true;
      }),
    [incidents, lgaFilter, deskFilter]
  );
  const scopedCitizenReports = useMemo(
    () =>
      lgaFilter === 'all'
        ? allCitizenReports
        : allCitizenReports.filter((r) => r.lgaCode === lgaFilter),
    [allCitizenReports, lgaFilter]
  );

  const coverage = useMemo(() => computeCoverage(allSubmissions, agents), [allSubmissions, agents]);
  const tally = useMemo(() => computeTally(scopedSubmissions), [scopedSubmissions]);
  const pdpParty = tally.parties.find((p) => p.partyCode === 'PDP');

  const reportedWards = useMemo(() => new Set(allSubmissions.map((s) => s.wardId)), [allSubmissions]);
  const wardSubmissionCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of allSubmissions) map.set(s.wardId, (map.get(s.wardId) ?? 0) + 1);
    return map;
  }, [allSubmissions]);

  const openIncidents = scopedIncidents.filter(
    (i) => i.status === 'open' || i.status === 'acknowledged'
  );
  const byDesk = (['legal', 'security_liaison', 'media', 'operations'] as IncidentDesk[]).map(
    (desk) => ({
      desk,
      open: incidents.filter(
        (i) =>
          (lgaFilter === 'all' || i.lgaCode === lgaFilter) &&
          i.desk === desk &&
          i.status === 'open'
      ).length,
      total: incidents.filter(
        (i) => (lgaFilter === 'all' || i.lgaCode === lgaFilter) && i.desk === desk
      ).length,
    })
  );

  const visibleReports = surfaced(scopedCitizenReports);
  const lateSync = scopedSubmissions.filter((s) => s.form.syncedLate).length;

  const activeIncident =
    drawer?.kind === 'incident' ? incidents.find((i) => i.id === drawer.id) : undefined;

  const visibleLgas = lgas
    .filter((l) => lgaFilter === 'all' || l.code === lgaFilter)
    .sort((x, y) => (resultFor(y.code)?.validVotes ?? 0) - (resultFor(x.code)?.validVotes ?? 0));

  return (
    <>
      <PageHeader
        eyebrow="Election day · Saturday, 16 January 2027"
        title="The evidence is primary, the number is derived"
        lede="Live parallel count across 907 Kwara South polling units. Filter by LGA or tap any KPI card, ward tile, or incident to inspect photographed EC8As."
      />

      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        {/* TOP 6 CLICKABLE KPI NUMBER CARDS */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
          <InteractiveStatCard
            label="EC8As reported"
            value={scopedSubmissions.length}
            tone="good"
            sub={`of ${coverage.totalPollingUnits} post-2021 PUs`}
            onClick={() => setDrawer({ kind: 'lga', lgaCode: visibleLgas[0]?.code ?? '05' })}
          />
          <InteractiveStatCard
            label="District coverage"
            value={pct(coverage.rate, 1)}
            tone="warn"
            sub={`${coverage.totalPollingUnits - coverage.reported} outstanding`}
            onClick={() => setDrawer({ kind: 'lga', lgaCode: visibleLgas[0]?.code ?? '05' })}
          />
          <InteractiveStatCard
            label="PDP share"
            value={pct(pdpParty?.share ?? 0, 1)}
            tone="accent"
            sub={`${(pdpParty?.votes ?? 0).toLocaleString('en-NG')} votes`}
            onClick={() => setDrawer({ kind: 'lga', lgaCode: '13' })}
          />
          <InteractiveStatCard
            label="Silent wards"
            value={coverage.silentWardIds.length}
            tone="bad"
            sub="zero EC8As received"
            onClick={() =>
              coverage.silentWardIds[0] &&
              setDrawer({
                kind: 'ward',
                wardId: coverage.silentWardIds[0],
                fromLga: coverage.silentWardIds[0].split('-')[0],
              })
            }
          />
          <InteractiveStatCard
            label="Open incidents"
            value={openIncidents.length}
            tone="bad"
            sub={`${tally.disputedCount} disputed EC8As`}
            onClick={() =>
              openIncidents[0] && setDrawer({ kind: 'incident', id: openIncidents[0].id })
            }
          />
          <InteractiveStatCard
            label="Synced offline"
            value={lateSync}
            sub="rural offline captures"
            onClick={() => setDrawer({ kind: 'lga', lgaCode: '05' })}
          />
        </div>

        {/* LGA Filter Strip */}
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <button
            type="button"
            onClick={() => setLgaFilter('all')}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              lgaFilter === 'all'
                ? 'border-accent/60 bg-accent/15 text-accent'
                : 'border-line bg-surface text-ink-muted hover:text-ink'
            }`}
          >
            All Kwara South ({coverage.reported}/{coverage.totalPollingUnits})
          </button>
          {lgas.map((l) => {
            const row = coverage.byLga.find((x) => x.lgaCode === l.code);
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => setLgaFilter((cur) => (cur === l.code ? 'all' : l.code))}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  lgaFilter === l.code
                    ? 'border-accent/60 bg-accent/15 text-accent'
                    : 'border-line bg-surface text-ink-muted hover:text-ink'
                }`}
              >
                {l.name}{' '}
                <span className="figure text-[10px] opacity-75">
                  {row?.reported}/{row?.total}
                </span>
              </button>
            );
          })}
        </div>

        {/* ABOVE-THE-FOLD: LIVE TALLY + INCIDENT DESKS */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel
            title={`Collected Senate tally${lgaFilter === 'all' ? '' : ` — ${getLga(lgaFilter)?.name}`}`}
            note="Tier one only — accredited PDP agents"
            className="lg:col-span-2"
          >
            <div className="space-y-3">
              {tally.parties.map((p) => (
                <div key={p.partyCode} className="flex items-center gap-3">
                  <span
                    className={`figure w-10 shrink-0 text-sm font-semibold ${
                      p.partyCode === 'PDP' ? 'text-accent' : 'text-ink'
                    }`}
                  >
                    {p.partyCode}
                  </span>
                  <div className="h-6 flex-1 overflow-hidden rounded-sm bg-surface-raised">
                    <div
                      className="flex h-full items-center pl-2"
                      style={{
                        width: `${Math.max(p.share * 100, 8)}%`,
                        background: PARTY_COLOR[p.partyCode] ?? '#38bdf8',
                      }}
                    >
                      <span className="figure text-[10px] font-semibold text-ground">
                        {pct(p.share, 1)}
                      </span>
                    </div>
                  </div>
                  <span className="figure w-20 shrink-0 text-right text-sm text-ink">
                    {p.votes.toLocaleString('en-NG')}
                  </span>
                </div>
              ))}
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-3 sm:grid-cols-4">
              <div>
                <dt className="text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                  Votes counted
                </dt>
                <dd className="figure text-lg text-ink">
                  {tally.totalVotes.toLocaleString('en-NG')}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                  Turnout (reporting)
                </dt>
                <dd className="figure text-lg text-ink">{pct(tally.turnoutOfReporting, 1)}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.1em] text-ink-faint">Rejected</dt>
                <dd className="figure text-lg text-ink-muted">
                  {tally.rejectedBallots.toLocaleString('en-NG')}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.1em] text-ink-faint">Disputed</dt>
                <dd className="figure text-lg text-aggrieved">{tally.disputedCount}</dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Incident desks" note={`${openIncidents.length} open · tap to filter`}>
            <div className="space-y-2">
              {byDesk.map(({ desk, open, total }) => (
                <button
                  key={desk}
                  type="button"
                  onClick={() => setDeskFilter((cur) => (cur === desk ? 'all' : desk))}
                  className={`flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-left transition-colors ${
                    deskFilter === desk
                      ? 'border-accent/60 bg-accent/15'
                      : 'border-line bg-surface-raised hover:border-line-bright'
                  }`}
                >
                  <span className="text-xs font-medium text-ink">{DESK_LABELS[desk]}</span>
                  <span className="flex items-baseline gap-2">
                    <span
                      className={`figure text-lg font-semibold ${open > 0 ? 'text-aggrieved' : 'text-ink-faint'}`}
                    >
                      {open}
                    </span>
                    <span className="figure text-[10px] text-ink-faint">of {total}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-3 rounded border border-passive/30 bg-passive/5 p-2.5 text-[11px] text-ink-muted">
              Honest denominator: <span className="figure text-ink">907</span> post-2021 PUs (682
              ward-enumerated + 225 unallocated).
            </div>
          </Panel>
        </div>

        {/* Ward returns mosaic + mobile LGA cards */}
        <Panel
          title="Where the EC8A returns are"
          note="Tap any LGA or ward block to inspect photographed EC8A forms"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Legend
              items={[
                { label: 'Reporting wards', color: '#16a34a', value: String(reportedWards.size) },
                { label: 'Partial', color: '#fab219' },
                { label: 'Silent', color: '#d03b3b', value: String(coverage.silentWardIds.length) },
              ]}
            />
          </div>

          <div className="hidden sm:block">
            <WeightedMosaic
              height={28}
              onSelectRow={(lgaCode) => setDrawer({ kind: 'lga', lgaCode })}
              onSelectCell={(wardId, lgaCode) =>
                setDrawer({ kind: 'ward', wardId, fromLga: lgaCode })
              }
              rows={visibleLgas.map((lga) => {
                const row = coverage.byLga.find((x) => x.lgaCode === lga.code);
                return {
                  id: lga.code,
                  label: lga.name,
                  weight: resultFor(lga.code)?.validVotes ?? 0,
                  note: row ? `${row.reported}/${row.total}` : '—',
                  cells: wardsInLga(lga.code)
                    .slice()
                    .sort((x, y) => y.declaredPollingUnitCount - x.declaredPollingUnitCount)
                    .map((w) => {
                      const got = wardSubmissionCount.get(w.id) ?? 0;
                      const share = w.declaredPollingUnitCount
                        ? got / w.declaredPollingUnitCount
                        : 0;
                      return {
                        id: w.id,
                        weight: w.declaredPollingUnitCount,
                        color: got === 0 ? '#d03b3b' : share >= 0.8 ? '#16a34a' : '#fab219',
                        title: `${w.name} (${w.id}) — ${got}/${w.declaredPollingUnitCount} enumerated PUs`,
                      };
                    }),
                };
              })}
            />
          </div>

          <div className="space-y-2 sm:hidden">
            {visibleLgas.map((lga) => {
              const row = coverage.byLga.find((x) => x.lgaCode === lga.code);
              return (
                <button
                  key={lga.code}
                  type="button"
                  onClick={() => setDrawer({ kind: 'lga', lgaCode: lga.code })}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-surface-raised px-3.5 py-3 text-left active:scale-[0.99]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-ink">{lga.name}</span>
                      <span className="figure text-xs text-ink-muted">
                        {row?.reported}/{row?.total} PUs
                      </span>
                    </div>
                    {row && (
                      <div className="mt-2">
                        <StackedBar
                          height="h-2"
                          segments={[
                            { label: 'Reported', value: row.reported, color: '#16a34a' },
                            {
                              label: 'Outstanding',
                              value: Math.max(0, row.total - row.reported),
                              color: '#2b3444',
                            },
                          ]}
                        />
                      </div>
                    )}
                  </div>
                  <span className="figure text-xs text-accent">
                    {row ? `${pct(row.rate, 0)} ›` : '›'}
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>

        {/* Incident Queue */}
        <Panel
          title="Incident queue"
          note={`${scopedIncidents.length} incidents · tap any to view log & update status`}
        >
          <div className="space-y-2.5 md:hidden">
            {scopedIncidents.slice(0, 14).map((i) => {
              const ward = getWard(i.wardId);
              return (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => setDrawer({ kind: 'incident', id: i.id })}
                  className="block w-full rounded-lg border border-line bg-surface-raised p-3.5 text-left active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium text-ink">
                        {INCIDENT_TYPE_LABELS[i.type]}
                      </div>
                      <div className="text-[11px] text-ink-faint">
                        {ward?.name} · {getLga(i.lgaCode)?.name}
                      </div>
                    </div>
                    <span
                      className={`rounded-sm border px-1.5 py-px text-[9px] font-medium uppercase tracking-[0.1em] ${STATUS_TONE[i.status]}`}
                    >
                      {INCIDENT_STATUS_LABELS[i.status]}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-ink-muted">{i.description}</p>
                  <div className="mt-2 flex items-center justify-between border-t border-line pt-2 text-[10px] uppercase tracking-[0.08em]">
                    <span className={SEVERITY_TONE[i.severity]}>
                      {i.severity} · {DESK_LABELS[i.desk]}
                    </span>
                    <span className="text-accent">Action log ›</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[780px]">
              <thead>
                <tr className="border-b border-line text-left text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                  <th className="pb-2 pr-3 font-medium">Type</th>
                  <th className="pb-2 pr-3 font-medium">Severity</th>
                  <th className="pb-2 pr-3 font-medium">Location</th>
                  <th className="pb-2 pr-3 font-medium">Tier</th>
                  <th className="pb-2 pr-3 font-medium">Desk</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 font-medium">Last action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {scopedIncidents.slice(0, 16).map((i) => {
                  const ward = getWard(i.wardId);
                  const last = i.log.at(-1)!;
                  return (
                    <tr
                      key={i.id}
                      onClick={() => setDrawer({ kind: 'incident', id: i.id })}
                      className="cursor-pointer align-top transition-colors hover:bg-surface-raised"
                    >
                      <td className="py-2.5 pr-3">
                        <div className="text-sm font-medium text-ink">
                          {INCIDENT_TYPE_LABELS[i.type]}
                        </div>
                        <div className="text-[11px] text-ink-faint">{i.description}</div>
                      </td>
                      <td className={`py-2.5 pr-3 text-xs uppercase ${SEVERITY_TONE[i.severity]}`}>
                        {i.severity}
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-ink-muted">
                        {ward?.name}
                        <div className="text-[11px] text-ink-faint">
                          {getLga(i.lgaCode)?.name}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 text-[10px] uppercase text-aligned">{i.tier}</td>
                      <td className="py-2.5 pr-3 text-xs text-ink-muted">{DESK_LABELS[i.desk]}</td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={`inline-block whitespace-nowrap rounded-sm border px-1.5 py-px text-[9px] font-medium uppercase tracking-[0.1em] ${STATUS_TONE[i.status]}`}
                        >
                          {INCIDENT_STATUS_LABELS[i.status]}
                        </span>
                      </td>
                      <td className="py-2.5 text-[11px] text-ink-faint">{last.note}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel
            title="Citizen reports (tier two)"
            note={`${visibleReports.length} surfaced of ${scopedCitizenReports.length}`}
          >
            <div className="space-y-2">
              {visibleReports.slice(0, 6).map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border border-line bg-surface-raised px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                      {CITIZEN_REPORT_LABELS[r.kind]} · {getWard(r.wardId)?.name}
                    </span>
                    <span className="figure text-[10px] text-reconciled">×{r.corroborations}</span>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">{r.note}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 border-t border-line pt-3 text-xs text-ink-muted">
              Requires <span className="figure text-ink">{CORROBORATION_THRESHOLD}</span> independent
              corroborations to surface and never enters the tally.
            </p>
          </Panel>

          <Panel title="Agent readiness" note={`${scopedAgents.length} enumerated positions`}>
            <div className="space-y-2">
              {(
                ['checked_in', 'deployed', 'accredited', 'unreachable', 'nominated', 'stood_down'] as const
              ).map((status) => {
                const n = scopedAgents.filter((a) => a.status === status).length;
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-[11px] text-ink-muted">
                      {AGENT_STATUS_LABELS[status]}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-sm bg-surface-raised">
                      <div
                        className={`h-full ${
                          status === 'checked_in'
                            ? 'bg-aligned'
                            : status === 'unreachable'
                              ? 'bg-aggrieved'
                              : 'bg-unknown'
                        }`}
                        style={{ width: `${(n / (scopedAgents.length || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="figure w-10 shrink-0 text-right text-xs text-ink">{n}</span>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
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
          drawer?.kind === 'incident'
            ? `Incident · ${activeIncident ? DESK_LABELS[activeIncident.desk] : ''}`
            : drawer?.kind === 'ward'
              ? `Ward EC8A forms · ${getLga(getWard(drawer.wardId)?.lgaCode ?? '')?.name ?? ''}`
              : 'LGA election-day returns'
        }
        title={
          drawer?.kind === 'incident'
            ? activeIncident
              ? INCIDENT_TYPE_LABELS[activeIncident.type]
              : ''
            : drawer?.kind === 'ward'
              ? `${getWard(drawer.wardId)?.name ?? ''} Ward`
              : drawer?.kind === 'lga'
                ? `${getLga(drawer.lgaCode)?.name ?? ''} Local Government`
                : ''
        }
      >
        {drawer?.kind === 'lga' && (() => {
          const lgaSubs = allSubmissions.filter((s) => s.lgaCode === drawer.lgaCode);
          const lgaTally = computeTally(lgaSubs);
          return (
            <div className="space-y-4">
              <div className="rounded-lg border border-line bg-surface-raised p-3.5">
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  Collected tally ({lgaSubs.length} EC8As)
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {lgaTally.parties.map((p) => (
                    <div key={p.partyCode} className="rounded border border-line bg-surface p-2">
                      <div className="text-[10px] font-semibold text-ink-faint">{p.partyCode}</div>
                      <div className="figure text-sm font-semibold text-ink">
                        {p.votes.toLocaleString('en-NG')}
                      </div>
                      <div className="figure text-[10px] text-accent">{pct(p.share, 1)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  Tap any ward to inspect photographed EC8A sheets
                </div>
                {wardsInLga(drawer.lgaCode).map((w) => {
                  const got = wardSubmissionCount.get(w.id) ?? 0;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() =>
                        setDrawer({ kind: 'ward', wardId: w.id, fromLga: drawer.lgaCode })
                      }
                      className="flex w-full items-center justify-between rounded-lg border border-line bg-surface-raised px-3.5 py-2.5 text-left hover:border-accent/50"
                    >
                      <span className="text-sm font-medium text-ink">{w.name}</span>
                      <span className="figure text-xs text-ink-muted">
                        {got}/{w.declaredPollingUnitCount} PUs ›
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {drawer?.kind === 'ward' && (() => {
          const wardSubs = allSubmissions.filter((s) => s.wardId === drawer.wardId);
          return (
            <div className="space-y-3">
              <div className="text-xs text-ink-muted">
                {wardSubs.length} photographed Form EC8A submissions received for this ward.
              </div>
              {wardSubs.length === 0 ? (
                <div className="rounded-lg border border-dashed border-aggrieved/40 bg-aggrieved/5 p-4 text-xs text-aggrieved">
                  No EC8A submissions received yet for this ward. Chase ward collation officer.
                </div>
              ) : (
                wardSubs.map((s) => (
                  <div key={s.id} className="rounded-lg border border-line bg-surface-raised p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="figure text-xs font-semibold text-ink">
                        PU {s.pollingUnitId}
                      </span>
                      <div className="flex gap-1.5">
                        {s.form.syncedLate && (
                          <span className="rounded bg-reconciled/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-reconciled">
                            Offline sync
                          </span>
                        )}
                        {s.disputed && (
                          <span className="rounded bg-aggrieved/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-aggrieved">
                            Disputed
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-1.5">
                      {Object.entries(s.votes).map(([party, v]) => (
                        <div
                          key={party}
                          className="rounded border border-line bg-surface px-2 py-1.5 text-center"
                        >
                          <div className="text-[9px] text-ink-faint">{party}</div>
                          <div className="figure text-xs font-semibold text-ink">{v}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-ink-faint">
                      <span>Agent: {s.agentName}</span>
                      <span className="figure">
                        GPS {s.form.lat.toFixed(3)}, {s.form.lng.toFixed(3)} · ±
                        {s.form.accuracyMetres}m
                      </span>
                    </div>
                    {s.disputed && (
                      <div className="mt-2 rounded border border-aggrieved/30 bg-aggrieved/5 px-2.5 py-1.5 text-[11px] text-aggrieved">
                        Dispute on {s.disputed.field}: {s.disputed.values[0]} vs{' '}
                        {s.disputed.values[1]} (retained for legal desk).
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          );
        })()}

        {drawer?.kind === 'incident' && activeIncident && (
          <div className="space-y-5">
            <div className="rounded-lg border border-line bg-surface-raised p-4">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-xs uppercase ${SEVERITY_TONE[activeIncident.severity]}`}>
                  {activeIncident.severity} severity · {activeIncident.tier} tier
                </span>
                <span
                  className={`rounded-sm border px-1.5 py-px text-[9px] font-medium uppercase tracking-[0.1em] ${STATUS_TONE[activeIncident.status]}`}
                >
                  {INCIDENT_STATUS_LABELS[activeIncident.status]}
                </span>
              </div>
              <p className="mt-2 text-sm text-ink">{activeIncident.description}</p>
              <div className="mt-2 text-xs text-ink-muted">
                Location: {getWard(activeIncident.wardId)?.name},{' '}
                {getLga(activeIncident.lgaCode)?.name} · Reported by {activeIncident.reportedBy}
              </div>
            </div>

            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                Update desk status (live demo)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(['open', 'acknowledged', 'actioned', 'resolved', 'unfounded'] as const).map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() =>
                        setIncidentOverrides((prev) => ({ ...prev, [activeIncident.id]: st }))
                      }
                      className={`rounded-md border px-2.5 py-1.5 text-xs font-medium ${
                        activeIncident.status === st
                          ? 'border-accent bg-accent/15 text-accent'
                          : 'border-line bg-surface-raised text-ink-muted hover:text-ink'
                      }`}
                    >
                      {INCIDENT_STATUS_LABELS[st]}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                Audit trail ({activeIncident.log.length})
              </h3>
              <ol className="space-y-2">
                {[...activeIncident.log].reverse().map((entry, idx) => (
                  <li
                    key={idx}
                    className="rounded-lg border border-line bg-surface-raised px-3.5 py-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between text-[10px] text-ink-faint">
                      <span>{entry.by}</span>
                      <span className="figure">
                        {new Date(entry.at).toLocaleTimeString('en-NG', {
                          hour: '2-digit',
                          minute: '2-digit',
                          timeZone: 'UTC',
                        })}{' '}
                        UTC
                      </span>
                    </div>
                    <div className="mt-1 text-ink">{entry.note}</div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </DetailDrawer>
    </>
  );
}
