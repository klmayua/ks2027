'use client';

import { useMemo, useState } from 'react';

import { DetailDrawer } from '@/components/detail-drawer';
import { campaignConfig } from '@/config/campaign.config';
import { getLga, getWard, lgas } from '@/lib/geography';
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  describeReach,
  formatNaira,
  lgaCodesOf,
  progressOf,
  proofCount,
  summarise,
  wardNames,
  type Commitment,
  type CommitmentCategory,
  type CommitmentStatus,
} from '@/lib/commitments';
import { seedCommitments } from '@/lib/simulation/seed-commitments';

const STATUS_TONE: Record<CommitmentStatus, string> = {
  proposed: 'border-[--ledger-line] text-[--ledger-ink-faint]',
  committed: 'border-[--ledger-accent]/40 text-[--ledger-accent]',
  not_started: 'border-[--ledger-line] text-[--ledger-ink-muted]',
  in_progress: 'border-[--ledger-accent]/40 text-[--ledger-accent]',
  delivered: 'border-[--ledger-good]/40 bg-[--ledger-good]/10 text-[--ledger-good]',
  delayed: 'border-[--ledger-warn]/40 bg-[--ledger-warn]/10 text-[--ledger-warn]',
  revised: 'border-[--ledger-warn]/40 text-[--ledger-warn]',
  abandoned: 'border-[--ledger-bad]/40 bg-[--ledger-bad]/10 text-[--ledger-bad]',
};

function PreviewNotice() {
  return (
    <div className="mb-6 rounded-lg border border-[--ledger-warn]/40 bg-[--ledger-warn]/8 p-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[--ledger-warn]">
        Preview — not published
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-[--ledger-ink-muted] sm:text-sm">
        Rendering seeded demonstration data for the KS2027 Senatorial pitch.{' '}
        <code className="text-[--ledger-ink]">assertPublishable()</code> refuses simulated records
        on the live publish path.
      </p>
    </div>
  );
}

function CommitmentCard({ c, onOpen }: { c: Commitment; onOpen: () => void }) {
  const progress = progressOf(c);
  const proofs = proofCount(c);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group block w-full rounded-lg border border-[--ledger-line] bg-[--ledger-surface] p-4 text-left transition-all hover:border-[--ledger-accent]/50 hover:shadow-sm active:scale-[0.995] sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="figure rounded-sm bg-[--ledger-raised] px-1.5 py-0.5 text-[11px] font-semibold text-[--ledger-ink]">
              {c.id}
            </span>
            <span className="text-[11px] uppercase tracking-[0.1em] text-[--ledger-ink-faint]">
              {CATEGORY_LABELS[c.category]}
            </span>
            <span
              className={`rounded-sm border px-1.5 py-px text-[10px] font-medium uppercase tracking-[0.1em] ${STATUS_TONE[c.status]}`}
            >
              {STATUS_LABELS[c.status]}
            </span>
          </div>

          <h3 className="mt-2 text-base font-semibold tracking-tight text-[--ledger-ink] group-hover:text-[--ledger-accent] sm:text-lg">
            {c.title}
          </h3>
          <p className="mt-1 text-xs font-medium text-[--ledger-accent]">{c.instrument}</p>
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[--ledger-ink-muted] sm:text-sm">
            {c.rationale}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <div className="figure text-lg font-semibold text-[--ledger-ink] sm:text-xl">
            {formatNaira(c.estimatedCostNgn)}
          </div>
          <div className="text-[11px] text-[--ledger-ink-faint]">by {c.targetYear}</div>
        </div>
      </div>

      {c.milestones.length > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-[--ledger-ink-faint]">
            <span>
              {c.milestones.filter((m) => m.completedAt).length}/{c.milestones.length} milestones
              {proofs > 0 && ` · ${proofs} geotagged`}
            </span>
            <span className="figure font-medium text-[--ledger-ink]">
              {Math.round(progress * 100)}%
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-sm bg-[--ledger-raised]">
            <div
              className="h-full bg-[--ledger-good]"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[--ledger-line] pt-2.5 text-[11px]">
        <span className="truncate text-[--ledger-ink-faint]">
          {describeReach(c)}
          {c.wardIds.length > 0 && ` — ${wardNames(c, 3)}`}
        </span>
        <span className="shrink-0 font-medium text-[--ledger-accent] transition-transform group-hover:translate-x-0.5">
          Audit record ›
        </span>
      </div>
    </button>
  );
}

export default function LedgerPage() {
  const commitments = useMemo(() => seedCommitments(), []);
  const s = useMemo(() => summarise(commitments), [commitments]);

  const [statusFilter, setStatusFilter] = useState<'all' | 'delivered' | 'in_progress' | 'off_track'>('all');
  const [lgaFilter, setLgaFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | CommitmentCategory>('all');
  const [selected, setSelected] = useState<Commitment | null>(null);

  const filtered = useMemo(
    () =>
      commitments.filter((c) => {
        if (statusFilter === 'delivered' && c.status !== 'delivered') return false;
        if (statusFilter === 'in_progress' && c.status !== 'in_progress' && c.status !== 'committed')
          return false;
        if (
          statusFilter === 'off_track' &&
          c.status !== 'delayed' &&
          c.status !== 'revised' &&
          c.status !== 'abandoned'
        )
          return false;
        if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
        if (lgaFilter !== 'all' && c.wardIds.length > 0 && !lgaCodesOf(c).includes(lgaFilter))
          return false;
        return true;
      }),
    [commitments, statusFilter, categoryFilter, lgaFilter]
  );

  const categories = [...new Set(commitments.map((c) => c.category))];

  return (
    <>
      {campaignConfig.simulation.enabled && <PreviewNotice />}

      <section>
        <h1 className="text-xl font-semibold tracking-tight text-[--ledger-ink] sm:text-2xl">
          Every Senatorial commitment, with its permanent identifier
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[--ledger-ink-muted]">
          Tap any KPI card or commitment below to filter by status, LGA, or pillar and inspect full
          geotagged milestones and revision history.
        </p>
      </section>

      {/* Clickable Scorecard KPI Cards */}
      <section className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`rounded-lg border p-3.5 text-left transition-colors ${
            statusFilter === 'all'
              ? 'border-[--ledger-accent] bg-[--ledger-surface]'
              : 'border-[--ledger-line] bg-[--ledger-surface] hover:border-[--ledger-accent]/40'
          }`}
        >
          <div className="text-[10px] uppercase tracking-[0.12em] text-[--ledger-ink-faint]">
            Commitments
          </div>
          <div className="figure mt-1 text-2xl font-semibold text-[--ledger-ink]">{s.total}</div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter((cur) => (cur === 'delivered' ? 'all' : 'delivered'))}
          className={`rounded-lg border p-3.5 text-left transition-colors ${
            statusFilter === 'delivered'
              ? 'border-[--ledger-good] bg-[--ledger-good]/5'
              : 'border-[--ledger-line] bg-[--ledger-surface] hover:border-[--ledger-good]/40'
          }`}
        >
          <div className="text-[10px] uppercase tracking-[0.12em] text-[--ledger-ink-faint]">
            Delivered
          </div>
          <div className="figure mt-1 text-2xl font-semibold text-[--ledger-good]">
            {s.delivered}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter((cur) => (cur === 'off_track' ? 'all' : 'off_track'))}
          className={`rounded-lg border p-3.5 text-left transition-colors ${
            statusFilter === 'off_track'
              ? 'border-[--ledger-warn] bg-[--ledger-warn]/8'
              : 'border-[--ledger-line] bg-[--ledger-surface] hover:border-[--ledger-warn]/40'
          }`}
        >
          <div className="text-[10px] uppercase tracking-[0.12em] text-[--ledger-ink-faint]">
            Off track
          </div>
          <div className="figure mt-1 text-2xl font-semibold text-[--ledger-warn]">
            {s.offTrack}
          </div>
        </button>

        <div className="rounded-lg border border-[--ledger-line] bg-[--ledger-surface] p-3.5">
          <div className="text-[10px] uppercase tracking-[0.12em] text-[--ledger-ink-faint]">
            Zonal &amp; trust value
          </div>
          <div className="figure mt-1 text-2xl font-semibold text-[--ledger-ink]">
            {formatNaira(s.totalCostNgn)}
          </div>
        </div>

        <div className="col-span-2 rounded-lg border border-[--ledger-line] bg-[--ledger-surface] p-3.5 sm:col-span-1">
          <div className="text-[10px] uppercase tracking-[0.12em] text-[--ledger-ink-faint]">
            With evidence
          </div>
          <div className="figure mt-1 text-2xl font-semibold text-[--ledger-ink]">{s.withProof}</div>
        </div>
      </section>

      {/* Mobile-friendly LGA & Pillar filter pills */}
      <div className="mt-5 space-y-2">
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          <button
            type="button"
            onClick={() => setLgaFilter('all')}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs ${
              lgaFilter === 'all'
                ? 'border-[--ledger-accent] bg-[--ledger-accent] text-white'
                : 'border-[--ledger-line] bg-[--ledger-surface] text-[--ledger-ink-muted]'
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
                  ? 'border-[--ledger-accent] bg-[--ledger-accent] text-white'
                  : 'border-[--ledger-line] bg-[--ledger-surface] text-[--ledger-ink-muted]'
              }`}
            >
              {l.name}
            </button>
          ))}
        </div>

        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`shrink-0 rounded-md border px-2.5 py-1 text-[11px] ${
              categoryFilter === 'all'
                ? 'border-[--ledger-ink] bg-[--ledger-ink] text-white'
                : 'border-[--ledger-line] bg-[--ledger-surface] text-[--ledger-ink-muted]'
            }`}
          >
            All pillars
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter((cur) => (cur === cat ? 'all' : cat))}
              className={`shrink-0 rounded-md border px-2.5 py-1 text-[11px] ${
                categoryFilter === cat
                  ? 'border-[--ledger-ink] bg-[--ledger-ink] text-white'
                  : 'border-[--ledger-line] bg-[--ledger-surface] text-[--ledger-ink-muted]'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Clickable Commitment Card List */}
      <section className="mt-6 space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-[--ledger-line] bg-[--ledger-surface] p-6 text-sm text-[--ledger-ink-muted]">
            No commitments match those filters.
          </div>
        ) : (
          filtered.map((c) => (
            <CommitmentCard key={c.id} c={c} onOpen={() => setSelected(c)} />
          ))
        )}
      </section>

      {/* Light-theme Audit Drawer */}
      <DetailDrawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        tone="ledger"
        eyebrow={selected ? `${selected.id} · ${CATEGORY_LABELS[selected.category]}` : undefined}
        title={selected?.title ?? ''}
        subtitle={selected?.instrument}
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[--ledger-line] bg-[--ledger-raised] p-3.5">
              <span
                className={`rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${STATUS_TONE[selected.status]}`}
              >
                {STATUS_LABELS[selected.status]}
              </span>
              <span className="figure text-base font-semibold text-[--ledger-ink]">
                {formatNaira(selected.estimatedCostNgn)} · target {selected.targetYear}
              </span>
            </div>

            <p className="text-sm leading-relaxed text-[--ledger-ink-muted]">{selected.rationale}</p>

            {selected.revisionNote && (
              <div className="rounded-lg border-l-2 border-[--ledger-warn] bg-[--ledger-warn]/10 p-3 text-xs leading-relaxed text-[--ledger-ink-muted]">
                <strong className="text-[--ledger-warn]">Published change note: </strong>
                {selected.revisionNote}
              </div>
            )}

            <div>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[--ledger-ink-faint]">
                Milestones &amp; geotagged evidence ({selected.milestones.length})
              </h3>
              {selected.milestones.length === 0 ? (
                <p className="text-xs text-[--ledger-ink-faint]">
                  Campaign proposal — milestones publish upon committee costing.
                </p>
              ) : (
                <ol className="space-y-2">
                  {selected.milestones.map((m) => (
                    <li
                      key={m.id}
                      className="rounded-lg border border-[--ledger-line] bg-[--ledger-raised]/60 p-3 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={
                            m.completedAt
                              ? 'font-medium text-[--ledger-ink]'
                              : 'text-[--ledger-ink-muted]'
                          }
                        >
                          {m.completedAt ? '✓ ' : '○ '}
                          {m.label}
                        </span>
                        <span className="figure shrink-0 text-[10px] text-[--ledger-ink-faint]">
                          {new Date(m.dueBy).toLocaleDateString('en-NG', {
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      {m.proof && (
                        <div className="mt-1.5 text-[11px] text-[--ledger-good]">
                          Proof: {m.proof.caption} ·{' '}
                          <span className="figure">
                            {m.proof.lat.toFixed(3)}, {m.proof.lng.toFixed(3)}
                          </span>
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[--ledger-ink-faint]">
                Mapped wards ({selected.wardIds.length === 0 ? 'All 83 wards' : selected.wardIds.length})
              </h3>
              {selected.wardIds.length === 0 ? (
                <p className="text-xs text-[--ledger-ink-muted]">
                  District-wide commitment covering all 7 LGAs and 83 wards of Kwara South.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {selected.wardIds.map((wid) => {
                    const w = getWard(wid);
                    const l = w ? getLga(w.lgaCode) : undefined;
                    return (
                      <span
                        key={wid}
                        className="rounded border border-[--ledger-line] bg-[--ledger-raised] px-2 py-1 text-[11px] text-[--ledger-ink]"
                      >
                        {w?.name ?? wid}{' '}
                        <span className="text-[--ledger-ink-faint]">· {l?.name}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </DetailDrawer>
    </>
  );
}
