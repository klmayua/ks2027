import { Legend, SERIES, WeightedMosaic } from '@/components/charts';
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

export default function ElectionDayPage() {
  const agents = seedAgents();
  const submissions = seedSubmissions(agents);
  const citizenReports = seedCitizenReports();
  const incidents = seedIncidents();

  const coverage = computeCoverage(submissions, agents);
  const tally = computeTally(submissions);

  const reportedWards = new Set(submissions.map((s) => s.wardId));
  const wardSubmissionCount = new Map<string, number>();
  for (const s of submissions) {
    wardSubmissionCount.set(s.wardId, (wardSubmissionCount.get(s.wardId) ?? 0) + 1);
  }

  const openIncidents = incidents.filter(
    (i) => i.status === 'open' || i.status === 'acknowledged'
  );
  const byDesk = (['legal', 'security_liaison', 'media', 'operations'] as IncidentDesk[]).map(
    (desk) => ({
      desk,
      open: incidents.filter((i) => i.desk === desk && i.status === 'open').length,
      total: incidents.filter((i) => i.desk === desk).length,
    })
  );

  const visibleReports = surfaced(citizenReports);
  const lateSync = submissions.filter((s) => s.form.syncedLate).length;

  return (
    <>
      <PageHeader
        eyebrow="Election day · Saturday, 16 January 2027"
        title="The evidence is primary, the number is derived"
        lede="Every Kwara South Senate figure here is read off a photographed Form EC8A carrying a geotag, a timestamp and an accredited PDP polling agent. Open citizen reports corroborate and raise incidents but never enter the count. The platform reports what was collected — INEC alone declares the winner at Omu-Aran."
        aside={
          <div className="rounded border border-line bg-surface-raised px-5 py-4 text-right">
            <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">
              Polling units reported
            </div>
            <div className="figure mt-1 text-4xl font-semibold text-ink">
              {coverage.reported.toLocaleString('en-NG')}
              <span className="text-xl text-ink-faint">
                /{coverage.totalPollingUnits.toLocaleString('en-NG')}
              </span>
            </div>
            <div className="figure mt-0.5 text-sm text-passive">
              {pct(coverage.rate, 1)} ·{' '}
              {(coverage.totalPollingUnits - coverage.reported).toLocaleString('en-NG')} outstanding
            </div>
          </div>
        }
      />

      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <Panel
          title="Coverage"
          note="Stated before any result — a dashboard that hides its gaps is not evidence"
        >
          <div className="mb-4 h-3 overflow-hidden rounded-sm bg-surface-raised">
            <div className="h-full bg-aligned" style={{ width: `${coverage.rate * 100}%` }} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Reported</div>
              <div className="figure text-2xl font-semibold text-aligned">{coverage.reported}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                Outstanding
              </div>
              <div className="figure text-2xl font-semibold text-aggrieved">
                {coverage.totalPollingUnits - coverage.reported}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                Silent wards
              </div>
              <div className="figure text-2xl font-semibold text-passive">
                {coverage.silentWardIds.length}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                Agents checked in
              </div>
              <div className="figure text-2xl font-semibold text-ink">
                {coverage.agentsCheckedIn}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                Synced offline
              </div>
              <div className="figure text-2xl font-semibold text-reconciled">{lateSync}</div>
            </div>
          </div>

          <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-ink-muted">
            <span className="figure text-reconciled">{lateSync}</span> EC8A forms were photographed
            without mobile signal and synced later with original timestamp and GPS intact. Across
            rural parts of Ifelodun, Ekiti, Isin and Oke-Ero, offline capture is the normal path.
          </p>
          <div className="mt-3 rounded border border-passive/30 bg-passive/5 p-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-passive">
              Denominator note
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
              Coverage is measured against{' '}
              <span className="figure text-ink">
                {coverage.totalPollingUnits.toLocaleString('en-NG')}
              </span>{' '}
              polling units — Kwara South&rsquo;s post-2021 total after INEC converted 225 voting
              points (including +87 in Offa alone). Only{' '}
              <span className="figure text-ink">
                {coverage.enumeratedPollingUnits.toLocaleString('en-NG')}
              </span>{' '}
              are ward-enumerated in the 2015 directory, leaving{' '}
              <span className="figure text-passive">
                {coverage.unallocatedPollingUnits.toLocaleString('en-NG')}
              </span>{' '}
              units in the denominator that cannot yet be placed on the ward mosaic below.
            </p>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-faint">
              Against the enumerated subset alone coverage would read{' '}
              <span className="figure">{pct(coverage.rateOfEnumerated, 1)}</span> rather than{' '}
              <span className="figure">{pct(coverage.rate, 1)}</span>. We display the lower, truer
              number.
            </p>
          </div>
        </Panel>

        <Panel
          title="Where the returns are"
          note="Row width = LGA votes cast (2023 proxy) · cell width = polling units"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Legend
              items={[
                { label: 'Reporting wards', color: '#16a34a', value: String(reportedWards.size) },
                { label: 'Partial', color: '#fab219' },
                {
                  label: 'Silent',
                  color: '#d03b3b',
                  value: String(coverage.silentWardIds.length),
                },
              ]}
            />
            <span className="text-[11px] text-ink-faint">
              Missing returns in Ifelodun, Offa or Irepodun move the Senate tally fastest.
            </span>
          </div>

          <WeightedMosaic
            height={26}
            rows={lgas
              .map((lga) => {
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
                        title: `${w.name} (${w.id})\n${got} of ${w.declaredPollingUnitCount} enumerated polling units reported`,
                      };
                    }),
                };
              })
              .sort((x, y) => y.weight - x.weight)}
          />
        </Panel>

        <div className="grid gap-5 lg:grid-cols-3">
          <Panel
            title="Collected Senate tally"
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
                  <div className="h-5 flex-1 overflow-hidden rounded-sm bg-surface-raised">
                    <div
                      className="flex h-full items-center pl-2"
                      style={{
                        width: `${Math.max(p.share * 100, 6)}%`,
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

            <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-ink-muted">
              Turnout is computed against registered voters on the{' '}
              <span className="figure text-ink">{coverage.reported}</span> EC8As received so far,
              not the full district roll.{' '}
              <span className="figure text-aggrieved">{tally.disputedCount}</span> units have a
              conflicting second submission and stay visibly flagged for the Omu-Aran collation
              legal team.
            </p>
          </Panel>

          <Panel title="Incident desks" note={`${openIncidents.length} open`}>
            <div className="space-y-2">
              {byDesk.map(({ desk, open, total }) => (
                <div
                  key={desk}
                  className="flex items-center justify-between rounded border border-line bg-surface-raised px-3 py-2"
                >
                  <span className="text-xs text-ink">{DESK_LABELS[desk]}</span>
                  <span className="flex items-baseline gap-2">
                    <span
                      className={`figure text-lg font-semibold ${open > 0 ? 'text-aggrieved' : 'text-ink-faint'}`}
                    >
                      {open}
                    </span>
                    <span className="figure text-[10px] text-ink-faint">of {total}</span>
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-ink-muted">
              Deterministic routing by incident type and severity keeps legal, security liaison,
              media, and operations desks closing cases visibly while polls are open.
            </p>
          </Panel>
        </div>

        <Panel title="Incident queue" note="Most recent first">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px]">
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
                {incidents.slice(0, 16).map((i) => {
                  const ward = getWard(i.wardId);
                  const last = i.log.at(-1)!;
                  return (
                    <tr key={i.id} className="align-top">
                      <td className="py-2.5 pr-3">
                        <div className="text-sm text-ink">{INCIDENT_TYPE_LABELS[i.type]}</div>
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
                      <td className="py-2.5 pr-3">
                        <span
                          className={`text-[10px] uppercase tracking-[0.1em] ${
                            i.tier === 'agent' ? 'text-aligned' : 'text-ink-faint'
                          }`}
                        >
                          {i.tier}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-ink-muted">
                        {DESK_LABELS[i.desk]}
                      </td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={`inline-block whitespace-nowrap rounded-sm border px-1.5 py-px text-[9px] font-medium uppercase tracking-[0.1em] ${STATUS_TONE[i.status]}`}
                        >
                          {INCIDENT_STATUS_LABELS[i.status]}
                        </span>
                      </td>
                      <td className="py-2.5 text-[11px] text-ink-faint">
                        {last.note}
                        <div>
                          {new Date(last.at).toLocaleTimeString('en-NG', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'UTC',
                          })}{' '}
                          · {last.by}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="grid gap-5 lg:grid-cols-2">
          <Panel
            title="Citizen reports"
            note={`${visibleReports.length} surfaced of ${citizenReports.length}`}
          >
            <div className="space-y-2">
              {visibleReports.slice(0, 6).map((r) => (
                <div key={r.id} className="rounded border border-line bg-surface-raised px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                      {CITIZEN_REPORT_LABELS[r.kind]} · {getWard(r.wardId)?.name}
                    </span>
                    <span className="figure text-[10px] text-reconciled">
                      ×{r.corroborations}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">{r.note}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-ink-muted">
              Open reports need{' '}
              <span className="figure text-ink">{CORROBORATION_THRESHOLD}</span> independent
              corroborations before surfacing, and never enter the tally.
            </p>
          </Panel>

          <Panel title="Agent readiness" note={`${agents.length} enumerated polling unit positions`}>
            <div className="space-y-2">
              {(
                ['checked_in', 'deployed', 'accredited', 'unreachable', 'nominated', 'stood_down'] as const
              ).map((status) => {
                const n = agents.filter((a) => a.status === status).length;
                return (
                  <div key={status} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-[11px] text-ink-muted">
                      {AGENT_STATUS_LABELS[status]}
                    </span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-surface-raised">
                      <div
                        className={`h-full ${
                          status === 'checked_in'
                            ? 'bg-aligned'
                            : status === 'unreachable'
                              ? 'bg-aggrieved'
                              : 'bg-unknown'
                        }`}
                        style={{ width: `${(n / agents.length) * 100}%` }}
                      />
                    </div>
                    <span className="figure w-12 shrink-0 text-right text-xs text-ink">{n}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-ink-muted">
              Accreditation separates tier-one EC8A submissions from tier-two observations. The 225
              post-2021 polling units are onboarded into this same roster once INEC Kwara&rsquo;s
              ward directory is imported.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
