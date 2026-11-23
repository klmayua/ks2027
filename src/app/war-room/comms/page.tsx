'use client';

import { useMemo, useState } from 'react';

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
import { DetailDrawer } from '@/components/detail-drawer';
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
  type TaskCompletion,
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

type DrawerState =
  | { kind: 'directive'; id: string }
  | { kind: 'lga'; lgaCode: string }
  | { kind: 'ward'; wardId: string; fromLga?: string }
  | { kind: 'proof'; completion: TaskCompletion }
  | null;

export default function DirectivesPage() {
  const { entries } = useMemo(() => seedRoster(), []);
  const directives = useMemo(() => seedDirectives(), []);
  const { acks, completions } = useMemo(
    () => seedAcknowledgements(directives, entries),
    [directives, entries]
  );
  const channels = useMemo(() => deriveChannels(), []);

  const coverage = useMemo(
    () => new Map(directives.map((d) => [d.id, coverageFor(d, acks, completions)])),
    [directives, acks, completions]
  );

  const defaultFeatured =
    directives.find((d) => d.scope.kind === 'district' && d.priority === 'urgent') ?? directives[0];

  const [selectedId, setSelectedId] = useState<string>(defaultFeatured.id);
  const [drawer, setDrawer] = useState<DrawerState>(null);

  const featured = directives.find((d) => d.id === selectedId) ?? defaultFeatured;
  const fc = coverage.get(featured.id)!;
  const featuredAcks = useMemo(
    () => acks.filter((a) => a.directiveId === featured.id),
    [acks, featured.id]
  );
  const ackedWards = useMemo(() => new Set(featuredAcks.map((a) => a.wardId)), [featuredAcks]);
  const featuredScope = useMemo(() => new Set(resolveScope(featured.scope)), [featured.scope]);

  const issued = new Date(featured.issuedAt).getTime();
  const curve = Array.from({ length: 24 }, (_, i) => {
    const cutoff = issued + (i + 1) * 3 * 3_600_000;
    return featuredAcks.filter((a) => new Date(a.at).getTime() <= cutoff).length;
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
            title: !featuredScope.has(w.id)
              ? `${w.name} — not addressed`
              : ackedWards.has(w.id)
                ? `${w.name} — Confirmed · click for officer details`
                : `${w.name} — Silent · click to inspect chase record`,
          })),
      };
    })
    .sort((x, y) => y.weight - x.weight);

  const worst = fc.byLga
    .map((r) => ({
      lgaCode: r.lgaCode,
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

  const sortedDirectives = [...directives].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  const drawerDirective =
    drawer?.kind === 'directive' ? directives.find((d) => d.id === drawer.id) : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Directives · 83 Kwara South wards"
        title="One channel that can be proved"
        lede="Select any issued directive below to inspect its live acknowledgement funnel, 72-hour arrival curve, silent ward chase list, and geotagged field returns."
        aside={
          <div className="flex w-full flex-wrap gap-x-6 gap-y-3 rounded-lg border border-line bg-surface-raised px-4 py-3 sm:px-5 lg:w-auto">
            <Stat label="Issued" value={directives.length} size="sm" />
            <Stat label="Channels" value={channels.length} size="sm" sub="auto-derived" />
            <Stat label="Geotagged proofs" value={withProof} tone="good" size="sm" />
          </div>
        }
      />

      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        {/* Directive selector strip — thumb-friendly switcher */}
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {sortedDirectives.map((d) => {
            const c = coverage.get(d.id)!;
            const active = d.id === featured.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedId(d.id)}
                className={`flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-all active:scale-[0.98] ${
                  active
                    ? 'border-accent/60 bg-accent/15 text-ink'
                    : 'border-line bg-surface text-ink-muted hover:border-line-bright hover:text-ink'
                }`}
              >
                <span className="figure text-[10px] text-accent">{d.reference.slice(-3)}</span>
                <span className="max-w-[180px] truncate font-medium">{d.title}</span>
                <span className="figure text-[10px] text-ink-faint">{pct(c.rate)}</span>
              </button>
            );
          })}
        </div>

        {/* Funnel + 72h curve for active directive */}
        <div className="grid gap-4 lg:grid-cols-5">
          <Panel
            title="Where this directive loses people"
            note={featured.reference}
            className="lg:col-span-3"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-sm border px-1.5 py-px text-[10px] font-medium uppercase tracking-[0.1em] ${PRIORITY_TONE[featured.priority]}`}
                >
                  {PRIORITY_LABELS[featured.priority]}
                </span>
                <span className="text-sm font-medium text-ink">{featured.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setDrawer({ kind: 'directive', id: featured.id })}
                className="rounded border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent hover:bg-accent/20"
              >
                Read full circular ›
              </button>
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
              Scope: <span className="text-ink">{describeScope(featured.scope)}</span> · Issued by{' '}
              <span className="text-ink">{featured.issuedByRole}</span>.
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
            <button
              type="button"
              onClick={() => setDrawer({ kind: 'directive', id: featured.id })}
              className="mt-3 w-full rounded-lg border border-line bg-surface-raised py-2 text-xs font-medium text-ink transition-colors hover:border-accent/50 hover:text-accent"
            >
              View all {fc.silentWardIds.length} silent wards to chase ›
            </button>
          </Panel>
        </div>

        {/* Interactive Mosaic (Desktop) + Clickable LGA Cards (Mobile) */}
        <Panel
          title="Who confirmed, sized by weight"
          note="Tap any LGA or ward block to inspect confirmation status"
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
          </div>

          <div className="hidden sm:block">
            <WeightedMosaic
              rows={rows}
              height={28}
              onSelectRow={(lgaCode) => setDrawer({ kind: 'lga', lgaCode })}
              onSelectCell={(wardId, lgaCode) =>
                setDrawer({ kind: 'ward', wardId, fromLga: lgaCode })
              }
            />
          </div>

          {/* Mobile tappable LGA confirmation cards */}
          <div className="grid grid-cols-1 gap-2 sm:hidden">
            {rows.map((r) => {
              const lgaRow = fc.byLga.find((x) => x.lgaCode === r.id);
              const rate = lgaRow && lgaRow.target ? lgaRow.acked / lgaRow.target : 0;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setDrawer({ kind: 'lga', lgaCode: r.id })}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-raised px-3.5 py-3 text-left active:scale-[0.99]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-ink">{r.label}</span>
                      <span className="figure text-xs text-ink-muted">
                        {lgaRow ? `${lgaRow.acked}/${lgaRow.target}` : 'Not in scope'}
                      </span>
                    </div>
                    {lgaRow && (
                      <div className="mt-2">
                        <StackedBar
                          height="h-2"
                          segments={[
                            { label: 'Confirmed', value: lgaRow.acked, color: ACK_COLOR.acked },
                            {
                              label: 'Silent',
                              value: lgaRow.target - lgaRow.acked,
                              color: ACK_COLOR.silent,
                            },
                          ]}
                        />
                      </div>
                    )}
                  </div>
                  <div className="figure shrink-0 text-xs text-accent">
                    {lgaRow ? `${pct(rate)} ›` : '—'}
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Chase list" note="Tap any LGA to see silent wards">
            {worst.length === 0 ? (
              <p className="text-xs text-aligned">Every addressed ward has confirmed this directive.</p>
            ) : (
              <RankedBars
                data={worst.map((w) => ({
                  id: w.lgaCode,
                  label: w.name,
                  value: w.silent,
                  note: `${pct(w.rate)} confirmed · ${(w.votes / 1000).toFixed(1)}k votes`,
                  color: '#d03b3b',
                }))}
                onSelect={(d) => d.id && setDrawer({ kind: 'lga', lgaCode: d.id })}
                valueFormat={(n) => `${n} silent`}
              />
            )}
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
                        width: `${Math.max(((channelCounts[key] ?? 0) / channels.length) * 100, 3)}%`,
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
              Revoking a ward office revokes the channel with it. No forged WhatsApp circulars.
            </p>
          </Panel>
        </div>

        {/* Issued Directives — Tappable Cards on Mobile, Clickable Rows on Desktop */}
        <Panel title="Issued directives" note="Tap any directive to focus the dashboard or read full text">
          <div className="space-y-2.5 md:hidden">
            {sortedDirectives.map((d) => {
              const c = coverage.get(d.id)!;
              const isSelected = d.id === featured.id;
              return (
                <div
                  key={d.id}
                  className={`rounded-lg border p-3.5 transition-colors ${
                    isSelected
                      ? 'border-accent/60 bg-accent/10'
                      : 'border-line bg-surface-raised'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(d.id);
                      setDrawer({ kind: 'directive', id: d.id });
                    }}
                    className="block w-full text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`rounded-sm border px-1.5 py-px text-[9px] font-medium uppercase tracking-[0.1em] ${PRIORITY_TONE[d.priority]}`}
                      >
                        {PRIORITY_LABELS[d.priority]}
                      </span>
                      <span className="figure text-[10px] text-ink-faint">
                        {d.reference} · {timeAgo(d.issuedAt)}
                      </span>
                    </div>
                    <div className="mt-2 text-sm font-medium text-ink">{d.title}</div>
                    <div className="mt-1 text-[11px] text-ink-muted">{describeScope(d.scope)}</div>
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="flex-1">
                        <StackedBar
                          height="h-2"
                          segments={[
                            { label: 'Confirmed', value: c.acknowledged, color: ACK_COLOR.acked },
                            {
                              label: 'Silent',
                              value: c.targetWards - c.acknowledged,
                              color: ACK_COLOR.silent,
                            },
                          ]}
                        />
                      </div>
                      <span className="figure text-xs text-ink">{pct(c.rate)}</span>
                      <span className="text-accent">›</span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[700px]">
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
                {sortedDirectives.map((d: Directive) => {
                  const c = coverage.get(d.id)!;
                  const isSelected = d.id === featured.id;
                  return (
                    <tr
                      key={d.id}
                      onClick={() => {
                        setSelectedId(d.id);
                        setDrawer({ kind: 'directive', id: d.id });
                      }}
                      className={`cursor-pointer align-middle transition-colors ${
                        isSelected ? 'bg-accent/10' : 'hover:bg-surface-raised'
                      }`}
                    >
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-sm border px-1.5 py-px text-[9px] font-medium uppercase tracking-[0.1em] ${PRIORITY_TONE[d.priority]}`}
                          >
                            {PRIORITY_LABELS[d.priority]}
                          </span>
                          <span className="text-sm font-medium text-ink">{d.title}</span>
                        </div>
                        <div className="figure mt-0.5 text-[10px] text-ink-faint">
                          {d.reference} · {d.issuedByRole}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-ink-muted">
                        {describeScope(d.scope)}
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-ink-faint">{timeAgo(d.issuedAt)}</td>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24">
                            <StackedBar
                              height="h-2.5"
                              segments={[
                                { label: 'Confirmed', value: c.acknowledged, color: ACK_COLOR.acked },
                                {
                                  label: 'Silent',
                                  value: c.targetWards - c.acknowledged,
                                  color: ACK_COLOR.silent,
                                },
                              ]}
                            />
                          </div>
                          <span className="figure text-xs text-ink">{pct(c.rate)}</span>
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

        {/* Clickable Field Returns */}
        <Panel title="Field returns" note={`${withProof} geotagged · tap any card to inspect proof`}>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {completions
              .filter((c) => c.proof)
              .slice(0, 6)
              .map((c, i) => {
                const ward = getWard(c.wardId);
                return (
                  <button
                    key={`${c.directiveId}-${c.wardId}-${i}`}
                    type="button"
                    onClick={() => setDrawer({ kind: 'proof', completion: c })}
                    className="group rounded-lg border border-line bg-surface-raised px-3.5 py-3 text-left transition-colors hover:border-accent/50 active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="line-clamp-2 text-xs font-medium text-ink">
                        {c.proof!.caption}
                      </span>
                      <span className="text-ink-faint group-hover:text-accent">›</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] text-ink-faint">
                        {ward?.name} · {c.byPersonName}
                      </span>
                      <span className="figure shrink-0 text-[10px] text-reconciled">
                        ±{c.proof!.accuracyMetres}m
                      </span>
                    </div>
                  </button>
                );
              })}
          </div>
        </Panel>
      </div>

      {/* Deep Drawer for Directive, LGA, Ward, or Proof */}
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
          drawer?.kind === 'directive'
            ? drawerDirective?.reference
            : drawer?.kind === 'lga'
              ? `Directive coverage · ${featured.reference}`
              : drawer?.kind === 'ward'
                ? `Ward receipt · ${featured.reference}`
                : 'Geotagged field proof'
        }
        title={
          drawer?.kind === 'directive'
            ? drawerDirective?.title ?? ''
            : drawer?.kind === 'lga'
              ? `${getLga(drawer.lgaCode)?.name ?? ''} LGA Returns`
              : drawer?.kind === 'ward'
                ? `${getWard(drawer.wardId)?.name ?? ''} Ward`
                : drawer?.kind === 'proof'
                  ? drawer.completion.proof?.caption ?? 'Field proof'
                  : ''
        }
      >
        {drawer?.kind === 'directive' && drawerDirective && (() => {
          const cov = coverage.get(drawerDirective.id)!;
          return (
            <div className="space-y-5">
              <div className="rounded-lg border border-line bg-surface-raised p-4">
                <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                  Official instruction · {drawerDirective.issuedByRole} ({drawerDirective.issuedByName})
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink">{drawerDirective.body}</p>
                {drawerDirective.task && (
                  <div className="mt-3 rounded border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-accent">
                    Required return: {drawerDirective.task.instruction}
                    {drawerDirective.task.requiresProof && ' (Geotagged photograph mandatory)'}
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                  Silent wards to chase ({cov.silentWardIds.length})
                </h3>
                {cov.silentWardIds.length === 0 ? (
                  <p className="text-xs text-aligned">All targeted wards confirmed.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                    {cov.silentWardIds.map((wid) => {
                      const w = getWard(wid);
                      const l = w ? getLga(w.lgaCode) : undefined;
                      return (
                        <button
                          key={wid}
                          type="button"
                          onClick={() => setDrawer({ kind: 'ward', wardId: wid, fromLga: w?.lgaCode })}
                          className="flex items-center justify-between rounded-md border border-aggrieved/30 bg-aggrieved/5 px-3 py-2 text-left text-xs hover:border-aggrieved"
                        >
                          <span className="font-medium text-ink">{w?.name}</span>
                          <span className="text-[10px] text-ink-faint">{l?.name} ›</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {drawer?.kind === 'lga' && (
          <div className="space-y-2">
            <p className="text-xs text-ink-muted">
              Showing ward-by-ward confirmation for <strong className="text-ink">{featured.title}</strong>.
            </p>
            {wardsInLga(drawer.lgaCode).map((w) => {
              const inScope = featuredScope.has(w.id);
              const ack = featuredAcks.find((a) => a.wardId === w.id);
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setDrawer({ kind: 'ward', wardId: w.id, fromLga: drawer.lgaCode })}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-surface-raised px-3.5 py-3 text-left hover:border-line-bright"
                >
                  <div>
                    <div className="text-sm font-medium text-ink">{w.name}</div>
                    <div className="text-[11px] text-ink-faint">
                      {ack
                        ? `Confirmed by ${ack.byPersonName} (${ack.byRole})`
                        : inScope
                          ? 'No confirmation received yet'
                          : 'Not addressed by this directive'}
                    </div>
                  </div>
                  <span
                    className={`rounded-sm border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${
                      !inScope
                        ? 'border-line text-ink-faint'
                        : ack
                          ? 'border-aligned/40 bg-aligned/10 text-aligned'
                          : 'border-aggrieved/40 bg-aggrieved/10 text-aggrieved'
                    }`}
                  >
                    {!inScope ? 'Out' : ack ? 'Confirmed' : 'Silent'}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {drawer?.kind === 'ward' && (() => {
          const w = getWard(drawer.wardId);
          const ack = featuredAcks.find((a) => a.wardId === drawer.wardId);
          const comp = completions.find(
            (c) => c.directiveId === featured.id && c.wardId === drawer.wardId
          );
          return (
            <div className="space-y-4">
              <div className="rounded-lg border border-line bg-surface-raised p-4">
                <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                  Status for {featured.reference}
                </div>
                {ack ? (
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="font-semibold text-aligned">Confirmed receipt</div>
                    <div className="text-ink">
                      {ack.byPersonName} — {ack.byRole}
                    </div>
                    <div className="figure text-ink-faint">
                      {new Date(ack.at).toLocaleString('en-NG')}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-aggrieved">
                    Silent — no officer in {w?.name} has confirmed this directive yet.
                  </div>
                )}
              </div>
              {comp && (
                <div className="rounded-lg border border-line bg-surface-raised p-4 text-xs">
                  <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                    Task return
                  </div>
                  <div className="mt-1 font-medium text-ink">Submitted by {comp.byPersonName}</div>
                  {comp.proof && (
                    <div className="mt-2 space-y-1 text-ink-muted">
                      <div>{comp.proof.caption}</div>
                      <div className="figure text-[11px] text-reconciled">
                        GPS: {comp.proof.lat}, {comp.proof.lng} (±{comp.proof.accuracyMetres}m)
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {drawer?.kind === 'proof' && drawer.completion.proof && (
          <div className="space-y-4 text-xs">
            <div className="rounded-lg border border-line bg-surface-raised p-4">
              <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                Verified field submission
              </div>
              <div className="mt-2 text-sm font-medium text-ink">
                {drawer.completion.proof.caption}
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3">
                <div>
                  <dt className="text-[10px] uppercase text-ink-faint">Ward</dt>
                  <dd className="mt-0.5 text-ink">
                    {getWard(drawer.completion.wardId)?.name} (
                    {getLga(drawer.completion.wardId.split('-')[0])?.name})
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase text-ink-faint">Submitted by</dt>
                  <dd className="mt-0.5 text-ink">{drawer.completion.byPersonName}</dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase text-ink-faint">GPS Coordinates</dt>
                  <dd className="figure mt-0.5 text-reconciled">
                    {drawer.completion.proof.lat}, {drawer.completion.proof.lng}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] uppercase text-ink-faint">Accuracy</dt>
                  <dd className="figure mt-0.5 text-ink">
                    ±{drawer.completion.proof.accuracyMetres} metres
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </DetailDrawer>
    </>
  );
}
