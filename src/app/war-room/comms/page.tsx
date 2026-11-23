import {
  Funnel,
  Legend,
  RankedBars,
  SERIES,
  Sparkline,
  StackedBar,
  Stat,
  WeightedMosaic,
  type MosaicRow,
} from '@/components/charts';
import { PageHeader, Panel } from '@/components/shell';
import { getLga, getWard, lgas, wardsInLga } from '@/lib/geography';
import { resultFor } from '@/lib/geography/results-2023';
import {
  PRIORITY_LABELS,
  coverageFor,
  deriveChannels,
  describeScope,
  resolveScope,
  type Directive,
  type DirectivePriority,
} from '@/lib/comms/directives';
import { seedRoster } from '@/lib/simulation/seed';
import { seedAcknowledgements, seedDirectives } from '@/lib/simulation/seed-comms';

const PRIORITY_TONE: Record<DirectivePriority, string> = {
  routine: 'border-unknown/40 text-ink-muted',
  priority: 'border-passive/40 text-passive',
  urgent: 'border-aggrieved/50 bg-aggrieved/10 text-aggrieved',
};

const ACK_COLOR = { acked: '#16a34a', silent: '#d03b3b', out: '#2b3444' };

const pct = (n: number, dp = 0) => `${(n * 100).toFixed(dp)}%`;

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days <= 0 ? 'today' : `${days}d ago`;
}

export default function DirectivesPage() {
  const { entries } = seedRoster();
  const directives = seedDirectives();
  const { acks, completions } = seedAcknowledgements(directives, entries);
  const channels = deriveChannels();

  const coverage = new Map(directives.map((d) => [d.id, coverageFor(d, acks, completions)]));

  const featured =
    directives.find((d) => d.scope.kind === 'district' && d.priority === 'urgent') ?? directives[0];
  const fc = coverage.get(featured.id)!;
  const ackedWards = new Set(acks.filter((a) => a.directiveId === featured.id).map((a) => a.wardId));
  const featuredScope = new Set(resolveScope(featured.scope));

  const issued = new Date(featured.issuedAt).getTime();
  const curve = Array.from({ length: 24 }, (_, i) => {
    const cutoff = issued + (i + 1) * 3 * 3_600_000;
    return acks.filter((a) => a.directiveId === featured.id && new Date(a.at).getTime() <= cutoff)
      .length;
  });

  const rows: MosaicRow[] = lgas
    .map((lga) => {
      const result = resultFor(lga.code);
      const row = fc.byLga.find((x) => x.lgaCode === lga.code);
      return {
        id: lga.code,
        label: lga.name,
        weight: result?.validVotes ?? 0,
        note: row ? `${row.acked}/${row.target}` : '—',
        cells: wardsInLga(lga.code)
          .slice()
          .sort((x, y) => y.declaredPollingUnitCount - x.declaredPollingUnitCount)
          .map((w) => ({
            id: w.id,
            weight: w.declaredPollingUnitCount,
            color: !featuredScope.has(w.id)
              ? ACK_COLOR.out
              : ackedWards.has(w.id)
                ? ACK_COLOR.acked
                : ACK_COLOR.silent,
            title: (() => {
              if (!featuredScope.has(w.id)) return `${w.name} — not addressed`;
              const ack = acks.find((a) => a.directiveId === featured.id && a.wardId === w.id);
              return ack
                ? `${w.name} (${w.id})\nConfirmed by ${ack.byPersonName}, ${ack.byRole}\n${new Date(ack.at).toLocaleString('en-NG')}`
                : `${w.name} (${w.id})\nNo acknowledgement — follow up\n${w.declaredPollingUnitCount} enumerated PUs`;
            })(),
          })),
      };
    })
    .sort((x, y) => y.weight - x.weight);

  const worst = fc.byLga
    .map((r) => ({
      name: getLga(r.lgaCode)?.name ?? r.lgaCode,
      silent: r.target - r.acked,
      rate: r.target ? r.acked / r.target : 0,
      votes: resultFor(r.lgaCode)?.validVotes ?? 0,
    }))
    .filter((r) => r.silent > 0)
    .sort((x, y) => y.silent * y.votes - x.silent * x.votes);

  const withProof = completions.filter((c) => c.proof).length;
  const channelCounts = channels.reduce<Record<string, number>>((acc, c) => {
    acc[c.level] = (acc[c.level] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        eyebrow="Directives · 83 Kwara South wards"
        title="One channel that can be proved"
        aside={
          <div className="flex w-full flex-wrap gap-x-6 gap-y-3 rounded border border-line bg-surface-raised px-4 py-3 sm:px-5 lg:w-auto">
            <Stat label="Issued" value={directives.length} size="sm" />
            <Stat label="Channels" value={channels.length} size="sm" sub="auto-derived" />
            <Stat label="Geotagged proofs" value={withProof} tone="good" size="sm" />
          </div>
        }
      />

      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <div className="grid gap-4 lg:grid-cols-5">
          <Panel
            title="Where a directive loses people"
            note={featured.reference}
            className="lg:col-span-3"
          >
            <div className="mb-3 flex items-center gap-2">
              <span
                className={`rounded-sm border px-1.5 py-px text-[10px] font-medium uppercase tracking-[0.1em] ${PRIORITY_TONE[featured.priority]}`}
              >
                {PRIORITY_LABELS[featured.priority]}
              </span>
              <span className="text-sm text-ink">{featured.title}</span>
            </div>
            <Funnel
              stages={[
                { label: 'Wards addressed', value: fc.targetWards },
                { label: 'Confirmed receipt', value: fc.acknowledged },
                { label: 'Task completed', value: fc.completions },
                { label: 'Proof submitted', value: fc.completionsWithProof },
              ]}
            />
            <p className="mt-3 border-t border-line pt-3 text-xs text-ink-muted">
              The drop from confirmation to completion is the real number to manage across 83 wards.
              Reading a directive is one tap; returning verified names or geotagged evidence is not.
            </p>
          </Panel>

          <Panel
            title="How it landed"
            note="Acknowledgements, first 72 hours"
            className="lg:col-span-2"
          >
            <Sparkline
              values={curve}
              color={SERIES[0]}
              height={64}
              ariaLabel="acknowledgements over time"
            />
            <div className="mt-3 grid grid-cols-3 gap-3 border-t border-line pt-3">
              <Stat label="First 24h" value={pct(curve[7] / (fc.acknowledged || 1))} size="sm" />
              <Stat
                label="Final rate"
                value={pct(fc.rate)}
                tone={fc.rate > 0.7 ? 'good' : 'warn'}
                size="sm"
              />
              <Stat label="Silent" value={fc.silentWardIds.length} tone="bad" size="sm" />
            </div>
            <p className="mt-3 text-xs text-ink-muted">
              Most confirmations arrive in the first day. Anything still silent at 72 hours is a
              ward-structure problem, not a messaging one.
            </p>
          </Panel>
        </div>

        <Panel
          title="Who confirmed, sized by weight"
          note="Row width = LGA votes cast (2023 proxy) · cell width = polling units"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Legend
              items={[
                { label: 'Confirmed', color: ACK_COLOR.acked, value: String(fc.acknowledged) },
                {
                  label: 'Silent',
                  color: ACK_COLOR.silent,
                  value: String(fc.silentWardIds.length),
                },
                { label: 'Not addressed', color: ACK_COLOR.out },
              ]}
            />
            <span className="text-[11px] text-ink-faint">
              A silent ward in Ifelodun or Offa costs over 3× a silent ward in Isin.
            </span>
          </div>
          <WeightedMosaic rows={rows} height={26} />
        </Panel>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Chase list" note="Silent wards ranked by what their LGA carries">
            <RankedBars
              data={worst.map((w) => ({
                label: w.name,
                value: w.silent,
                note: `${pct(w.rate)} confirmed · ${(w.votes / 1000).toFixed(1)}k votes`,
                color: '#d03b3b',
              }))}
              valueFormat={(n) => `${n} silent`}
            />
          </Panel>

          <Panel title="Channels" note="Membership follows role, never a hand-managed list">
            <div className="space-y-2">
              {(
                [
                  ['ward', 'Ward'],
                  ['lga', 'LGA'],
                  ['wing', 'Wings'],
                  ['constituency', 'Fed. Const.'],
                  ['senatorial', 'Senatorial'],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-right text-[11px] text-ink-muted">
                    {label}
                  </span>
                  <div className="h-4 flex-1">
                    <div
                      className="h-full rounded-r-[4px]"
                      style={{
                        width: `${Math.max(((channelCounts[key] ?? 0) / channels.length) * 100, 2)}%`,
                        background: SERIES[0],
                      }}
                    />
                  </div>
                  <span className="figure w-10 shrink-0 text-right text-xs text-ink">
                    {channelCounts[key] ?? 0}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 border-t border-line pt-3 text-xs text-ink-muted">
              Revoking a ward office revokes the channel with it. A directive that did not come
              through a verified KS2027 role cannot be authentic — ending forged WhatsApp circulars.
            </p>
          </Panel>
        </div>

        <Panel title="Issued" note="Most recent first">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-line text-left text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                  <th className="pb-2 pr-3 font-medium">Directive</th>
                  <th className="pb-2 pr-3 font-medium">Scope</th>
                  <th className="pb-2 pr-3 font-medium">Issued</th>
                  <th className="pb-2 pr-3 font-medium">Acknowledgement</th>
                  <th className="pb-2 text-right font-medium">Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {[...directives]
                  .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
                  .map((d: Directive) => {
                    const c = coverage.get(d.id)!;
                    return (
                      <tr key={d.id} className="align-middle">
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-sm border px-1.5 py-px text-[9px] font-medium uppercase tracking-[0.1em] ${PRIORITY_TONE[d.priority]}`}
                            >
                              {PRIORITY_LABELS[d.priority]}
                            </span>
                            <span className="text-sm text-ink">{d.title}</span>
                          </div>
                          <div className="figure mt-0.5 text-[10px] text-ink-faint">
                            {d.reference} · {d.issuedByRole}
                          </div>
                        </td>
                        <td className="py-2.5 pr-3 text-xs text-ink-muted">
                          {describeScope(d.scope)}
                        </td>
                        <td className="py-2.5 pr-3 text-xs text-ink-faint">
                          {timeAgo(d.issuedAt)}
                        </td>
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2">
                            <div className="w-28">
                              <StackedBar
                                height="h-2.5"
                                segments={[
                                  {
                                    label: 'Confirmed',
                                    value: c.acknowledged,
                                    color: ACK_COLOR.acked,
                                  },
                                  {
                                    label: 'Silent',
                                    value: c.targetWards - c.acknowledged,
                                    color: ACK_COLOR.silent,
                                  },
                                ]}
                              />
                            </div>
                            <span
                              className={`figure text-xs ${
                                c.rate >= 0.75
                                  ? 'text-aligned'
                                  : c.rate >= 0.5
                                    ? 'text-passive'
                                    : 'text-aggrieved'
                              }`}
                            >
                              {pct(c.rate)}
                            </span>
                            <span className="figure text-[10px] text-ink-faint">
                              {c.acknowledged}/{c.targetWards}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 text-right">
                          {d.task ? (
                            <span className="figure text-xs text-ink">
                              {c.completionsWithProof}
                              <span className="text-ink-faint">/{c.completions}</span>
                            </span>
                          ) : (
                            <span className="text-ink-faint">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Field returns" note={`${withProof} geotagged`}>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {completions
              .filter((c) => c.proof)
              .slice(0, 6)
              .map((c, i) => {
                const ward = getWard(c.wardId);
                return (
                  <div
                    key={`${c.directiveId}-${c.wardId}-${i}`}
                    className="rounded border border-line bg-surface-raised px-3 py-2"
                  >
                    <div className="truncate text-xs text-ink">{c.proof!.caption}</div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] text-ink-faint">
                        {ward?.name} · {c.byPersonName}
                      </span>
                      <span className="figure shrink-0 text-[10px] text-reconciled">
                        ±{c.proof!.accuracyMetres}m
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </Panel>
      </div>
    </>
  );
}
