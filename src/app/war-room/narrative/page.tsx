'use client';

import { useMemo, useState } from 'react';

import { DetailDrawer } from '@/components/detail-drawer';
import { PageHeader, Panel } from '@/components/shell';
import { FEDERAL_CONSTITUENCIES, type FederalConstituencyId } from '@/lib/geography';
import {
  CHANNEL_LABELS,
  CLAIM_STATUS_LABELS,
  LANGUAGE_LABELS,
  SOURCE_LABELS,
  breakdown,
  byConstituency,
  byLanguage,
  isSendable,
  lowConfidence,
  totalMentions,
  velocity,
  type Claim,
  type ClaimStatus,
  type Language,
  type Mention,
  type Response,
} from '@/lib/narrative/osint';
import {
  TOPICS,
  seedClaims,
  seedMentions,
  seedResponses,
} from '@/lib/simulation/seed-narrative';

const STATUS_TONE: Record<ClaimStatus, string> = {
  monitoring: 'border-unknown/40 text-ink-muted',
  verifying: 'border-passive/40 text-passive',
  response_drafted: 'border-reconciled/40 text-reconciled',
  response_approved: 'border-aligned/40 text-aligned',
  responded: 'border-aligned/60 bg-aligned/10 text-aligned',
  conceded: 'border-reconciled/50 bg-reconciled/10 text-reconciled',
  dormant: 'border-line-bright text-ink-faint',
};

const ASSESSMENT_TONE: Record<Claim['assessment'], string> = {
  false: 'text-aggrieved',
  misleading: 'text-passive',
  unverified: 'text-ink-muted',
  substantially_true: 'text-reconciled',
};

const ASSESSMENT_LABELS: Record<Claim['assessment'], string> = {
  false: 'False',
  misleading: 'Misleading',
  unverified: 'Unverified',
  substantially_true: 'Substantially true',
};

function Spark({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-7 items-end gap-0.5" aria-hidden="true">
      {values.map((v, i) => (
        <span
          key={i}
          className="w-1.5 rounded-t-sm bg-accent/80"
          style={{ height: `${Math.max(10, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

type DrawerState =
  | { kind: 'claim'; claimId: string }
  | { kind: 'mentions'; title: string; subtitle: string; items: Mention[] }
  | null;

export default function NarrativePage() {
  const mentions = useMemo(() => seedMentions(), []);
  const claims = useMemo(() => seedClaims(), []);
  const initialResponses = useMemo(() => seedResponses(), []);

  // Live human approval gate state (toggle approve / revoke on held drafts!)
  const [approvals, setApprovals] = useState<Record<string, boolean>>({});
  const [claimFilter, setClaimFilter] = useState<'all' | 'accelerating' | 'held' | 'conceded'>('all');
  const [fcFilter, setFcFilter] = useState<'all' | FederalConstituencyId>('all');
  const [drawer, setDrawer] = useState<DrawerState>(null);

  const responses: Response[] = useMemo(
    () =>
      initialResponses.map((r) => {
        if (approvals[r.id] === true && !r.approval) {
          return {
            ...r,
            approval: {
              byName: 'Director-General, KS2027',
              byRole: 'Director-General, KS2027',
              at: new Date().toISOString(),
              note: 'Signed off live in war room.',
            },
          };
        }
        if (approvals[r.id] === false && r.approval) {
          return { ...r, approval: undefined };
        }
        return r;
      }),
    [initialResponses, approvals]
  );

  const filteredMentions = useMemo(
    () =>
      fcFilter === 'all' ? mentions : mentions.filter((m) => m.constituencyId === fcFilter),
    [mentions, fcFilter]
  );

  const overall = useMemo(() => breakdown(filteredMentions), [filteredMentions]);
  const constituencies = useMemo(() => byConstituency(mentions), [mentions]);
  const languages = useMemo(() => byLanguage(filteredMentions), [filteredMentions]);
  const uncertain = useMemo(() => lowConfidence(filteredMentions), [filteredMentions]);

  const topicRows = useMemo(
    () =>
      TOPICS.map((t) => ({
        topic: t,
        items: filteredMentions.filter((m) => m.topicId === t.id),
        breakdown: breakdown(filteredMentions.filter((m) => m.topicId === t.id)),
      })).sort((a, b) => a.breakdown.net - b.breakdown.net),
    [filteredMentions]
  );

  const rising = useMemo(() => {
    const base = [...claims]
      .filter((c) => c.status !== 'dormant')
      .filter((c) => fcFilter === 'all' || c.constituencyIds.includes(fcFilter))
      .sort((a, b) => velocity(b) - velocity(a));

    if (claimFilter === 'accelerating') return base.filter((c) => velocity(c) > 1.6);
    if (claimFilter === 'conceded') return base.filter((c) => c.status === 'conceded');
    if (claimFilter === 'held') {
      return base.filter((c) => {
        const resp = responses.find((r) => r.id === c.responseId);
        return resp && !isSendable(resp);
      });
    }
    return base;
  }, [claims, fcFilter, claimFilter, responses]);

  const awaitingApproval = responses.filter((r) => !isSendable(r));
  const nonEnglishShare = filteredMentions.length
    ? filteredMentions.filter((m) => m.language !== 'en').length / filteredMentions.length
    : 0;

  const activeClaim =
    drawer?.kind === 'claim' ? claims.find((c) => c.id === drawer.claimId) : undefined;
  const activeResponse = activeClaim
    ? responses.find((r) => r.id === activeClaim.responseId)
    : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Narrative & OSINT · Kwara South"
        title="Public sources only, human approval always"
        lede="Tap any tracked claim, topic, language bar, or low-confidence mention to drill into raw source excerpts and operate the human approval gate."
        aside={
          <div className="grid grid-cols-3 gap-4 rounded-lg border border-line bg-surface-raised px-4 py-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Mentions</div>
              <div className="figure text-xl font-semibold text-ink">{overall.total}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Net</div>
              <div
                className={`figure text-xl font-semibold ${
                  overall.net >= 0 ? 'text-aligned' : 'text-aggrieved'
                }`}
              >
                {overall.net >= 0 ? '+' : ''}
                {(overall.net * 100).toFixed(0)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Held</div>
              <div className="figure text-xl font-semibold text-passive">
                {awaitingApproval.length}
              </div>
            </div>
          </div>
        }
      />

      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        {/* Mobile-friendly Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {(
              [
                ['all', `All claims (${claims.length})`],
                ['accelerating', 'Accelerating'],
                ['held', `Awaiting approval (${awaitingApproval.length})`],
                ['conceded', 'Conceded'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setClaimFilter(id)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  claimFilter === id
                    ? 'border-accent/60 bg-accent/15 text-accent'
                    : 'border-line bg-surface text-ink-muted hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ['all', 'All Kwara South'],
                ...FEDERAL_CONSTITUENCIES.map((fc) => [fc.id, fc.shortName] as const),
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFcFilter(id as 'all' | FederalConstituencyId)}
                className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  fcFilter === id
                    ? 'border-accent/60 bg-accent/15 text-accent'
                    : 'border-line bg-surface text-ink-muted hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Deep Clickable Tracked Claim Cards */}
        <Panel title="Tracked claims" note="Ranked by acceleration · tap any claim to inspect & approve">
          <div className="space-y-3">
            {rising.length === 0 ? (
              <p className="text-xs text-ink-muted">No claims match the current filter.</p>
            ) : (
              rising.map((claim) => {
                const response = responses.find((r) => r.id === claim.responseId);
                const v = velocity(claim);
                return (
                  <button
                    key={claim.id}
                    type="button"
                    onClick={() => setDrawer({ kind: 'claim', claimId: claim.id })}
                    className="group block w-full rounded-lg border border-line bg-surface-raised p-4 text-left transition-all hover:border-accent/50 hover:bg-ground/40 active:scale-[0.995]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-sm border px-1.5 py-px text-[9px] font-medium uppercase tracking-[0.1em] ${STATUS_TONE[claim.status]}`}
                          >
                            {CLAIM_STATUS_LABELS[claim.status]}
                          </span>
                          <span
                            className={`text-[10px] font-medium uppercase tracking-[0.1em] ${ASSESSMENT_TONE[claim.assessment]}`}
                          >
                            {ASSESSMENT_LABELS[claim.assessment]}
                          </span>
                          {v > 1.6 && (
                            <span className="rounded-sm bg-aggrieved/15 px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.1em] text-aggrieved">
                              Accelerating ×{v.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm font-medium leading-relaxed text-ink">
                          {claim.statement}
                        </p>
                        <p className="mt-1.5 text-[11px] text-ink-faint">
                          {claim.firstSeenSource} · {totalMentions(claim)} mentions ·{' '}
                          {claim.languages.map((l) => l.toUpperCase()).join('/')} ·{' '}
                          {claim.constituencyIds
                            .map(
                              (id) =>
                                FEDERAL_CONSTITUENCIES.find((x) => x.id === id)?.shortName ?? id
                            )
                            .join(', ')}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <Spark values={claim.dailyMentions} />
                        <span className="text-[11px] text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent">
                          Inspect ›
                        </span>
                      </div>
                    </div>

                    {response && (
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5 text-[11px]">
                        <span className="text-ink-muted">
                          {CHANNEL_LABELS[response.channel]} ·{' '}
                          {response.draftedBy === 'ai_assisted' ? 'AI-assisted' : 'Human'}
                        </span>
                        {response.approval ? (
                          <span className="font-medium text-aligned">
                            ✓ Approved ({response.approval.byRole})
                          </span>
                        ) : (
                          <span className="font-semibold text-passive">
                            ● Held — tap to review &amp; approve
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </Panel>

        {/* Topics + Constituencies */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel
            title="Topics"
            note="Tap any topic to inspect raw mentions"
            className="lg:col-span-2"
          >
            <div className="space-y-1.5">
              {topicRows.map(({ topic, items, breakdown: b }) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() =>
                    setDrawer({
                      kind: 'mentions',
                      title: topic.label,
                      subtitle: `${b.total} public mentions · Origin: ${topic.origin}`,
                      items,
                    })
                  }
                  className="group flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border border-transparent px-2.5 py-2.5 text-left transition-colors hover:border-line hover:bg-surface-raised"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-ink">{topic.label}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px] uppercase tracking-[0.1em]">
                      <span
                        className={
                          topic.origin === 'opponent'
                            ? 'text-aggrieved'
                            : topic.origin === 'campaign'
                              ? 'text-aligned'
                              : 'text-ink-faint'
                        }
                      >
                        {topic.origin}
                      </span>
                      <span className="figure text-ink-faint">{b.total} mentions</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-2 w-24 overflow-hidden rounded-sm">
                      <span
                        className="bg-aligned"
                        style={{ width: `${(b.positive / (b.total || 1)) * 100}%` }}
                      />
                      <span
                        className="bg-unknown"
                        style={{ width: `${(b.neutral / (b.total || 1)) * 100}%` }}
                      />
                      <span
                        className="bg-aggrieved"
                        style={{ width: `${(b.negative / (b.total || 1)) * 100}%` }}
                      />
                    </div>
                    <span
                      className={`figure w-10 text-right text-sm font-semibold ${
                        b.net >= 0 ? 'text-aligned' : 'text-aggrieved'
                      }`}
                    >
                      {b.net >= 0 ? '+' : ''}
                      {(b.net * 100).toFixed(0)}
                    </span>
                    <span className="text-ink-faint group-hover:text-accent">›</span>
                  </div>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="By federal constituency" note="Tap to filter">
            <div className="space-y-3">
              {constituencies.map(({ constituencyId, breakdown: b }) => {
                const fc = FEDERAL_CONSTITUENCIES.find((x) => x.id === constituencyId);
                return (
                  <button
                    key={constituencyId}
                    type="button"
                    onClick={() =>
                      setFcFilter((cur) => (cur === constituencyId ? 'all' : constituencyId))
                    }
                    className={`block w-full rounded-lg border p-3 text-left transition-colors ${
                      fcFilter === constituencyId
                        ? 'border-accent/50 bg-accent/10'
                        : 'border-line bg-surface-raised hover:border-line-bright'
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-medium text-ink">{fc?.name}</span>
                      <span
                        className={`figure text-sm font-semibold ${
                          b.net >= 0 ? 'text-aligned' : 'text-aggrieved'
                        }`}
                      >
                        {b.net >= 0 ? '+' : ''}
                        {(b.net * 100).toFixed(0)}
                      </span>
                    </div>
                    <div className="mt-2 flex h-2 overflow-hidden rounded-sm">
                      <span
                        className="bg-aligned"
                        style={{ width: `${(b.positive / (b.total || 1)) * 100}%` }}
                      />
                      <span
                        className="bg-unknown"
                        style={{ width: `${(b.neutral / (b.total || 1)) * 100}%` }}
                      />
                      <span
                        className="bg-aggrieved"
                        style={{ width: `${(b.negative / (b.total || 1)) * 100}%` }}
                      />
                    </div>
                    <div className="figure mt-1.5 text-[10px] text-ink-faint">
                      {b.total} mentions · +{b.positive} / {b.neutral} / −{b.negative}
                    </div>
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* Language + Human Review Queue + Approval Gate */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Language" note={`${Math.round(nonEnglishShare * 100)}% non-English · tap to inspect`}>
            <div className="space-y-1.5">
              {languages.map(({ language, count }) => (
                <button
                  key={language}
                  type="button"
                  onClick={() =>
                    setDrawer({
                      kind: 'mentions',
                      title: `${LANGUAGE_LABELS[language]} mentions`,
                      subtitle: `${count} monitored public items`,
                      items: filteredMentions.filter((m) => m.language === language),
                    })
                  }
                  className="group flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-surface-raised"
                >
                  <span className="w-32 shrink-0 truncate text-[11px] text-ink-muted">
                    {LANGUAGE_LABELS[language]}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-sm bg-surface-raised">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${(count / (filteredMentions.length || 1)) * 100}%` }}
                    />
                  </div>
                  <span className="figure w-8 shrink-0 text-right text-xs text-ink">{count}</span>
                  <span className="text-ink-faint group-hover:text-accent">›</span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Needs a human read" note={`${uncertain.length} low-confidence`}>
            <div className="space-y-2">
              {uncertain.slice(0, 4).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() =>
                    setDrawer({
                      kind: 'mentions',
                      title: 'Human review queue',
                      subtitle: `${uncertain.length} items below 65% model confidence`,
                      items: uncertain,
                    })
                  }
                  className="block w-full rounded-lg border border-line bg-surface-raised px-3 py-2.5 text-left transition-colors hover:border-passive/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                      {SOURCE_LABELS[m.sourceKind]} · {m.sourceName}
                    </span>
                    <span className="figure text-[10px] text-passive">
                      {(m.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-snug text-ink-muted">
                    {m.excerpt}
                  </p>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Approval gate" note={`${awaitingApproval.length} held`}>
            {awaitingApproval.length === 0 ? (
              <div className="rounded-lg border border-aligned/30 bg-aligned/5 p-3.5 text-xs text-aligned">
                All drafted responses currently carry named sign-off.
              </div>
            ) : (
              <div className="space-y-2">
                {awaitingApproval.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setDrawer({ kind: 'claim', claimId: r.claimId })}
                    className="block w-full rounded-lg border border-passive/40 bg-passive/5 px-3 py-2.5 text-left transition-colors hover:border-passive"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-passive">
                        {CHANNEL_LABELS[r.channel]} · held
                      </span>
                      <span className="text-[11px] text-accent">Review ›</span>
                    </div>
                    <p className="mt-1 line-clamp-3 text-xs leading-snug text-ink-muted">
                      {r.draft}
                    </p>
                  </button>
                ))}
              </div>
            )}
            <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-ink-muted">
              <code className="text-ink">assertSendable()</code> throws on any response without a
              named sign-off. Tap a held draft above to operate the gate.
            </p>
          </Panel>
        </div>
      </div>

      {/* Deep Claim Dossier & Mentions Feed Drawer */}
      <DetailDrawer
        open={drawer !== null}
        onClose={() => setDrawer(null)}
        eyebrow={
          drawer?.kind === 'claim'
            ? `Claim dossier · ${activeClaim?.firstSeenSource ?? ''}`
            : 'Public source mentions'
        }
        title={
          drawer?.kind === 'claim'
            ? activeClaim?.statement ?? ''
            : drawer?.kind === 'mentions'
              ? drawer.title
              : ''
        }
        subtitle={
          drawer?.kind === 'claim' && activeClaim
            ? `${CLAIM_STATUS_LABELS[activeClaim.status]} · ${ASSESSMENT_LABELS[activeClaim.assessment]} · ${totalMentions(activeClaim)} mentions`
            : drawer?.kind === 'mentions'
              ? drawer.subtitle
              : undefined
        }
      >
        {drawer?.kind === 'claim' && activeClaim && (
          <div className="space-y-5">
            {/* Daily mention velocity chart */}
            <div className="rounded-lg border border-line bg-surface-raised p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  Daily mention trajectory ({activeClaim.dailyMentions.length} days)
                </span>
                <span className="figure text-xs text-accent">
                  ×{velocity(activeClaim).toFixed(1)} velocity
                </span>
              </div>
              <div className="flex h-20 items-end gap-1.5">
                {activeClaim.dailyMentions.map((v, i) => {
                  const max = Math.max(...activeClaim.dailyMentions, 1);
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <span className="figure text-[9px] text-ink-faint">{v}</span>
                      <div
                        className="w-full rounded-t bg-accent/80"
                        style={{ height: `${Math.max(8, (v / max) * 56)}px` }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-2.5 text-[10px] text-ink-muted">
                {activeClaim.languages.map((l: Language) => (
                  <span key={l} className="rounded border border-line px-1.5 py-0.5">
                    {LANGUAGE_LABELS[l]}
                  </span>
                ))}
              </div>
            </div>

            {/* Response & Human Approval Gate */}
            {activeResponse ? (
              <div className="rounded-lg border border-line bg-surface-raised p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                    {CHANNEL_LABELS[activeResponse.channel]} · {LANGUAGE_LABELS[activeResponse.language]}
                  </span>
                  <span
                    className={`rounded-sm border px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.1em] ${
                      activeResponse.approval
                        ? 'border-aligned/50 bg-aligned/10 text-aligned'
                        : 'border-passive/50 bg-passive/10 text-passive'
                    }`}
                  >
                    {activeResponse.approval ? 'Approved to send' : 'Gate held'}
                  </span>
                </div>

                <p className="mt-2.5 text-sm leading-relaxed text-ink">{activeResponse.draft}</p>

                {activeResponse.citations.length > 0 ? (
                  <div className="mt-3 text-[11px] text-ink-muted">
                    Citations: <span className="text-ink">{activeResponse.citations.join(' · ')}</span>
                  </div>
                ) : (
                  <div className="mt-3 rounded border border-aggrieved/30 bg-aggrieved/5 px-3 py-2 text-[11px] text-aggrieved">
                    No published citations attached — treat as guidance only until sourced.
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                  <div className="text-[11px] text-ink-muted">
                    {activeResponse.approval
                      ? `Signed off by ${activeResponse.approval.byRole}`
                      : 'Blocked by assertSendable() until named officer approves'}
                  </div>
                  {activeResponse.approval ? (
                    <button
                      type="button"
                      onClick={() =>
                        setApprovals((prev) => ({ ...prev, [activeResponse.id]: false }))
                      }
                      className="rounded-md border border-aggrieved/50 px-3 py-2 text-xs font-medium text-aggrieved hover:bg-aggrieved/10"
                    >
                      Revoke approval
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setApprovals((prev) => ({ ...prev, [activeResponse.id]: true }))
                      }
                      className="rounded-md bg-accent px-3.5 py-2 text-xs font-semibold text-ground hover:brightness-110"
                    >
                      Approve &amp; Sign Off
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-line-bright p-4 text-xs text-ink-muted">
                No response drafted yet. Claim is under active monitoring across Kwara South outlets.
              </div>
            )}
          </div>
        )}

        {drawer?.kind === 'mentions' && (
          <div className="space-y-2.5">
            {drawer.items.slice(0, 30).map((m) => (
              <div key={m.id} className="rounded-lg border border-line bg-surface-raised p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase tracking-[0.1em]">
                  <span className="text-ink-faint">
                    {m.sourceName} · {SOURCE_LABELS[m.sourceKind]} · {m.language.toUpperCase()}
                  </span>
                  <span
                    className={`figure font-semibold ${
                      m.sentiment === 'positive'
                        ? 'text-aligned'
                        : m.sentiment === 'negative'
                          ? 'text-aggrieved'
                          : 'text-ink-muted'
                    }`}
                  >
                    {m.sentiment} · {Math.round(m.confidence * 100)}%
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-ink">{m.excerpt}</p>
                <div className="figure mt-1.5 text-[10px] text-ink-faint">
                  {new Date(m.observedAt).toLocaleString('en-NG')}
                </div>
              </div>
            ))}
          </div>
        )}
      </DetailDrawer>
    </>
  );
}
