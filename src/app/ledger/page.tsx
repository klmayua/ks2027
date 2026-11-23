import { campaignConfig } from '@/config/campaign.config';
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  describeReach,
  formatNaira,
  progressOf,
  proofCount,
  summarise,
  wardNames,
  type Commitment,
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
    <div className="mb-8 rounded border border-[--ledger-warn]/40 bg-[--ledger-warn]/8 p-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[--ledger-warn]">
        Preview — not published
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-[--ledger-ink-muted]">
        This page is rendering seeded demonstration data for the KS2027 Senatorial pitch. The
        publish path calls <code className="text-[--ledger-ink]">assertPublishable()</code>, which
        throws on any value carrying simulated provenance — so this register <em>cannot</em> go live
        until verified commitments and geotagged field evidence replace the demo seed.
      </p>
    </div>
  );
}

function CommitmentCard({ c }: { c: Commitment }) {
  const progress = progressOf(c);
  const proofs = proofCount(c);

  return (
    <article className="border-b border-[--ledger-line] py-6 last:border-0">
      <div className="flex flex-wrap items-start justify-between gap-4">
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
            {c.phase === 'campaign' && (
              <span className="text-[10px] uppercase tracking-[0.1em] text-[--ledger-ink-faint]">
                campaign phase
              </span>
            )}
          </div>

          <h3 className="mt-2 text-lg font-medium tracking-tight text-[--ledger-ink]">{c.title}</h3>
          <p className="mt-1 text-xs font-medium text-[--ledger-accent]">{c.instrument}</p>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[--ledger-ink-muted]">
            {c.rationale}
          </p>

          <p className="mt-2 text-[11px] text-[--ledger-ink-faint]">
            {describeReach(c)}
            {c.wardIds.length > 0 && ` — ${wardNames(c)}`}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <div className="figure text-xl font-semibold text-[--ledger-ink]">
            {formatNaira(c.estimatedCostNgn)}
          </div>
          <div className="text-[11px] text-[--ledger-ink-faint]">by {c.targetYear}</div>
        </div>
      </div>

      {c.milestones.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-[11px] text-[--ledger-ink-faint]">
            <span>
              {c.milestones.filter((m) => m.completedAt).length} of {c.milestones.length} milestones
              {proofs > 0 && ` · ${proofs} with geotagged evidence`}
            </span>
            <span className="figure">{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-sm bg-[--ledger-raised]">
            <div
              className="h-full bg-[--ledger-good]"
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          <ol className="mt-3 space-y-1.5">
            {c.milestones.map((m) => (
              <li key={m.id} className="flex items-start gap-2 text-xs">
                <span
                  className={`mt-1 size-1.5 shrink-0 rounded-full ${
                    m.completedAt ? 'bg-[--ledger-good]' : 'bg-[--ledger-line]'
                  }`}
                />
                <span className="flex-1">
                  <span
                    className={
                      m.completedAt ? 'text-[--ledger-ink]' : 'text-[--ledger-ink-faint]'
                    }
                  >
                    {m.label}
                  </span>
                  <span className="figure ml-2 text-[--ledger-ink-faint]">
                    due{' '}
                    {new Date(m.dueBy).toLocaleDateString('en-NG', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  {m.proof && (
                    <span className="mt-0.5 block text-[11px] text-[--ledger-ink-faint]">
                      Evidence: {m.proof.caption} ·{' '}
                      <span className="figure">
                        {m.proof.lat.toFixed(3)}, {m.proof.lng.toFixed(3)}
                      </span>
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {c.revisionNote && (
        <p className="mt-4 border-l-2 border-[--ledger-warn]/50 bg-[--ledger-warn]/5 py-2 pl-3 text-xs leading-relaxed text-[--ledger-ink-muted]">
          <span className="font-medium text-[--ledger-warn]">Change to this commitment: </span>
          {c.revisionNote}
        </p>
      )}
    </article>
  );
}

export default function LedgerPage() {
  const commitments = seedCommitments();
  const s = summarise(commitments);

  const inTerm = commitments.filter((c) => c.phase === 'senate_term');
  const campaign = commitments.filter((c) => c.phase === 'campaign');

  return (
    <>
      {campaignConfig.simulation.enabled && <PreviewNotice />}

      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-[--ledger-ink]">
          Every Senatorial commitment, with its permanent identifier
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[--ledger-ink-muted]">
          Built around Hon. {campaignConfig.principal.name}&rsquo;s five Kwara South pillars —
          community security, federal road oversight, agriculture, youth jobs, and rural healthcare.
          Every item states the exact legislative or zonal instrument a Senator controls, stays
          under one permanent <code>KS-*</code> key across the 11th Senate term, and publishes
          delays or pivots alongside deliveries.
        </p>
      </section>

      <section className="mt-8 grid gap-4 rounded border border-[--ledger-line] bg-[--ledger-surface] p-5 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-[--ledger-ink-faint]">
            Commitments
          </div>
          <div className="figure text-2xl font-semibold text-[--ledger-ink]">{s.total}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-[--ledger-ink-faint]">
            Delivered
          </div>
          <div className="figure text-2xl font-semibold text-[--ledger-good]">{s.delivered}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-[--ledger-ink-faint]">
            Off track
          </div>
          <div className="figure text-2xl font-semibold text-[--ledger-warn]">{s.offTrack}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-[--ledger-ink-faint]">
            Zonal &amp; trust value
          </div>
          <div className="figure text-2xl font-semibold text-[--ledger-ink]">
            {formatNaira(s.totalCostNgn)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.12em] text-[--ledger-ink-faint]">
            With evidence
          </div>
          <div className="figure text-2xl font-semibold text-[--ledger-ink]">{s.withProof}</div>
        </div>
      </section>

      <p className="mt-3 text-xs leading-relaxed text-[--ledger-ink-faint]">
        <span className="font-medium text-[--ledger-warn]">{s.offTrack} off track</span> is
        published as prominently as {s.delivered} delivered. A constituency scorecard that only
        reports wins is a brochure; keeping delayed and revised items visible is what makes the
        delivered ones believable.
      </p>

      <section className="mt-10">
        <h2 className="border-b border-[--ledger-line] pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[--ledger-ink-faint]">
          11th Senate term tracking (demonstration) — {inTerm.length} commitments
        </h2>
        <div>
          {inTerm.map((c) => (
            <CommitmentCard key={c.id} c={c} />
          ))}
        </div>
      </section>

      {campaign.length > 0 && (
        <section className="mt-10">
          <h2 className="border-b border-[--ledger-line] pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[--ledger-ink-faint]">
            Campaign phase — {campaign.length} commitments
          </h2>
          <p className="mt-3 text-xs leading-relaxed text-[--ledger-ink-muted]">
            Committed on the 2027 Kwara South trail, carrying the exact same identifiers into
            inauguration and quarterly town-hall reviews.
          </p>
          <div>
            {campaign.map((c) => (
              <CommitmentCard key={c.id} c={c} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
