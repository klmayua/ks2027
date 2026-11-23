'use client';

import { useMemo, useState } from 'react';

import {
  DivergingBars,
  Gauge,
  InteractiveStatCard,
  RankedBars,
  SERIES,
  StackedBar,
} from '@/components/charts';
import { DetailDrawer } from '@/components/detail-drawer';
import { PageHeader, Panel } from '@/components/shell';
import { FEDERAL_CONSTITUENCIES, type FederalConstituencyId } from '@/lib/geography';
import {
  AVAILABLE_CITATIONS,
  CHANNEL_LABELS,
  CLAIM_STATUS_LABELS,
  DISPATCH_TARGETS,
  LANGUAGE_LABELS,
  POSTURE_LABELS,
  SOURCE_LABELS,
  URGENCY_LABELS,
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
  type ResponseChannel,
  type ResponsePosture,
  type SourceKind,
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

const POSTURE_TONE: Record<ResponsePosture, string> = {
  rebut: 'border-aggrieved/40 bg-aggrieved/10 text-aggrieved',
  clarify: 'border-reconciled/40 bg-reconciled/10 text-reconciled',
  amplify: 'border-aligned/40 bg-aligned/10 text-aligned',
  concede: 'border-passive/40 bg-passive/10 text-passive',
  monitor: 'border-line-bright bg-surface text-ink-muted',
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

const SOURCE_ORDER: SourceKind[] = [
  'radio',
  'news',
  'social_public',
  'field_report',
  'official_statement',
];

const SOURCE_SUB: Record<SourceKind, string> = {
  radio: 'Okin FM · Harmony · Radio Kwara · Sobi',
  news: 'Vanguard · ThisDay · Tribune · Daily Trust',
  social_public: 'Public posts · open feeds only',
  field_report: '83 Kwara South ward officers',
  official_statement: 'Party & INEC public statements',
};

const APPROVERS = [
  'Director-General, KS2027',
  'Publicity Secretary',
  'Senatorial Chairman',
  'Legal & Election-Day Lead',
] as const;

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

interface HitActionState {
  posture: ResponsePosture;
  channel: ResponseChannel;
  language: Language;
  draft: string;
  citations: string[];
  approver: string;
  approvalNote: string;
  approvedAt?: string;
  dispatchedAt?: string;
  dispatchedTo?: string;
}

type DrawerState =
  | { kind: 'claim'; claimId: string }
  | { kind: 'hit'; mentionId: string; returnTo?: { title: string; subtitle: string; items: Mention[] } }
  | { kind: 'mentions'; title: string; subtitle: string; items: Mention[] }
  | null;

export default function NarrativePage() {
  const mentions = useMemo(() => seedMentions(), []);
  const claims = useMemo(() => seedClaims(), []);
  const initialResponses = useMemo(() => seedResponses(), []);

  // Unified live response state keyed by `claim:<id>` or `hit:<mentionId>`
  const [actionMap, setActionMap] = useState<Record<string, HitActionState>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Filters
  const [claimFilter, setClaimFilter] = useState<'all' | 'accelerating' | 'held' | 'dispatched'>('all');
  const [hitFilter, setHitFilter] = useState<'all' | 'urgent' | 'rebut' | 'amplify' | 'dispatched'>('all');
  const [hitQuery, setHitQuery] = useState('');
  const [fcFilter, setFcFilter] = useState<'all' | FederalConstituencyId>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | SourceKind>('all');
  const [drawer, setDrawer] = useState<DrawerState>(null);

  const getClaimState = (claim: Claim): HitActionState => {
    const key = `claim:${claim.id}`;
    if (actionMap[key]) return actionMap[key];
    const base: Response | undefined = initialResponses.find((r) => r.id === claim.responseId);
    return {
      posture: claim.posture,
      channel: base?.channel ?? 'press_statement',
      language: base?.language ?? 'en',
      draft: base?.draft ?? claim.recommendedAngle,
      citations: base?.citations ?? [],
      approver: base?.approval?.byRole ?? 'Director-General, KS2027',
      approvalNote: base?.approval?.note ?? '',
      approvedAt: base?.approval?.at,
      dispatchedAt: base?.sentAt,
      dispatchedTo: base?.dispatchedTo,
    };
  };

  const getMentionState = (m: Mention): HitActionState => {
    const key = `hit:${m.id}`;
    if (actionMap[key]) return actionMap[key];
    return {
      posture: m.recommendation.posture,
      channel: m.recommendation.channel,
      language: m.recommendation.language,
      draft: m.recommendation.suggestedDraft,
      citations: m.recommendation.citations,
      approver: 'Publicity Secretary',
      approvalNote: '',
    };
  };

  const updateAction = (key: string, current: HitActionState, patch: Partial<HitActionState>) => {
    setActionMap((prev) => ({
      ...prev,
      [key]: { ...current, ...patch },
    }));
  };

  const filteredMentions = useMemo(
    () =>
      mentions.filter((m) => {
        if (fcFilter !== 'all' && m.constituencyId !== fcFilter) return false;
        if (sourceFilter !== 'all' && m.sourceKind !== sourceFilter) return false;
        return true;
      }),
    [mentions, fcFilter, sourceFilter]
  );

  const overall = useMemo(() => breakdown(filteredMentions), [filteredMentions]);
  const constituencies = useMemo(() => byConstituency(mentions), [mentions]);
  const languages = useMemo(() => byLanguage(filteredMentions), [filteredMentions]);
  const uncertain = useMemo(() => lowConfidence(filteredMentions), [filteredMentions]);

  const bySource = useMemo(
    () =>
      SOURCE_ORDER.map((kind) => {
        const items = mentions.filter(
          (m) => m.sourceKind === kind && (fcFilter === 'all' || m.constituencyId === fcFilter)
        );
        return { kind, items, stats: breakdown(items) };
      }),
    [mentions, fcFilter]
  );

  const topicRows = useMemo(
    () =>
      TOPICS.map((t) => ({
        topic: t,
        items: filteredMentions.filter((m) => m.topicId === t.id),
        breakdown: breakdown(filteredMentions.filter((m) => m.topicId === t.id)),
      })).sort((a, b) => b.breakdown.net - a.breakdown.net),
    [filteredMentions]
  );

  const acceleratingCount = useMemo(
    () => claims.filter((c) => c.status !== 'dormant' && velocity(c) > 1.6).length,
    [claims]
  );

  const claimStates = claims.map((c) => ({ claim: c, state: getClaimState(c) }));
  const heldClaims = claimStates.filter((x) => !x.state.approvedAt);
  const dispatchedClaimCount = claimStates.filter((x) => Boolean(x.state.dispatchedAt)).length;
  const dispatchedHitCount = Object.entries(actionMap).filter(
    ([k, v]) => k.startsWith('hit:') && Boolean(v.dispatchedAt)
  ).length;
  const totalDispatched = dispatchedClaimCount + dispatchedHitCount;

  const rising = useMemo(() => {
    const base = [...claims]
      .filter((c) => c.status !== 'dormant')
      .filter((c) => fcFilter === 'all' || c.constituencyIds.includes(fcFilter))
      .sort((a, b) => velocity(b) - velocity(a));

    if (claimFilter === 'accelerating') return base.filter((c) => velocity(c) > 1.6);
    if (claimFilter === 'held') return base.filter((c) => !getClaimState(c).approvedAt);
    if (claimFilter === 'dispatched') return base.filter((c) => Boolean(getClaimState(c).dispatchedAt));
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claims, fcFilter, claimFilter, actionMap]);

  const visibleHits = useMemo(() => {
    const q = hitQuery.trim().toLowerCase();
    return filteredMentions.filter((m) => {
      const st = actionMap[`hit:${m.id}`];
      if (hitFilter === 'urgent' && m.recommendation.urgency !== 'immediate_2h') return false;
      if (
        hitFilter === 'rebut' &&
        m.recommendation.posture !== 'rebut' &&
        m.recommendation.posture !== 'clarify'
      )
        return false;
      if (hitFilter === 'amplify' && m.recommendation.posture !== 'amplify') return false;
      if (hitFilter === 'dispatched' && !st?.dispatchedAt) return false;
      if (q) {
        const hitText = `${m.excerpt} ${m.sourceName} ${m.recommendation.angle}`.toLowerCase();
        if (!hitText.includes(q)) return false;
      }
      return true;
    });
  }, [filteredMentions, hitFilter, hitQuery, actionMap]);

  const nonEnglishMentions = filteredMentions.filter((m) => m.language !== 'en');
  const positiveShare = overall.total ? overall.positive / overall.total : 0;

  // Keep isSendable referenced to verify contract with osint module
  const sampleSendableCheck = isSendable(initialResponses[0]);

  const activeClaim =
    drawer?.kind === 'claim' ? claims.find((c) => c.id === drawer.claimId) : undefined;
  const activeMention =
    drawer?.kind === 'hit' ? mentions.find((m) => m.id === drawer.mentionId) : undefined;

  const copyText = (key: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((cur) => (cur === key ? null : cur)), 1800);
  };

  /** Reusable 4-step Response Mechanism panel for BOTH Claims and individual OSINT Mention Hits */
  const renderResponseMechanism = (
    key: string,
    state: HitActionState,
    ownerRole: string,
    urgencyLabel: string,
    recommendedAngle: string
  ) => {
    const isApproved = Boolean(state.approvedAt);
    const isDispatched = Boolean(state.dispatchedAt);

    return (
      <div className="space-y-4">
        {/* Step 1: Recommendation Summary */}
        <div className="rounded-lg border border-accent/35 bg-accent/[0.07] p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
              Recommended Response Playbook
            </span>
            <span className="figure rounded bg-surface px-2 py-0.5 text-[10px] text-ink-muted">
              {urgencyLabel} · {ownerRole}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink">{recommendedAngle}</p>
        </div>

        {/* Step 2: Posture, Channel & Language Controls */}
        <div className="space-y-3 rounded-lg border border-line bg-surface-raised p-3.5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            1 · Configure response posture &amp; delivery channel
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(['rebut', 'clarify', 'amplify', 'concede', 'monitor'] as ResponsePosture[]).map(
              (p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => updateAction(key, state, { posture: p })}
                  className={`rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                    state.posture === p
                      ? POSTURE_TONE[p]
                      : 'border-line bg-surface text-ink-muted hover:text-ink'
                  }`}
                >
                  {POSTURE_LABELS[p]}
                </button>
              )
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.1em] text-ink-faint">Channel</span>
              <select
                value={state.channel}
                onChange={(e) =>
                  updateAction(key, state, { channel: e.target.value as ResponseChannel })
                }
                className="mt-1 w-full rounded-md border border-line bg-surface px-2.5 py-2 text-xs text-ink focus:border-accent focus:outline-none"
              >
                {(Object.keys(CHANNEL_LABELS) as ResponseChannel[]).map((ch) => (
                  <option key={ch} value={ch}>
                    {CHANNEL_LABELS[ch]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                Language
              </span>
              <select
                value={state.language}
                onChange={(e) =>
                  updateAction(key, state, { language: e.target.value as Language })
                }
                className="mt-1 w-full rounded-md border border-line bg-surface px-2.5 py-2 text-xs text-ink focus:border-accent focus:outline-none"
              >
                {(Object.keys(LANGUAGE_LABELS) as Language[]).map((lang) => (
                  <option key={lang} value={lang}>
                    {LANGUAGE_LABELS[lang]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Step 3: Editable Response Draft + Citations */}
        <div className="space-y-2.5 rounded-lg border border-line bg-surface-raised p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              2 · Response draft &amp; public ledger citations
            </span>
            <button
              type="button"
              onClick={() => copyText(key, state.draft)}
              className="rounded border border-line-bright bg-surface px-2 py-1 text-[10px] font-medium text-ink hover:border-accent hover:text-accent"
            >
              {copiedKey === key ? '✓ Copied' : 'Copy draft'}
            </button>
          </div>

          <textarea
            rows={4}
            value={state.draft}
            onChange={(e) => updateAction(key, state, { draft: e.target.value })}
            className="w-full rounded-md border border-line bg-surface p-3 text-xs leading-relaxed text-ink focus:border-accent focus:outline-none"
          />

          <div>
            <div className="mb-1.5 text-[10px] uppercase tracking-[0.1em] text-ink-faint">
              Attach verified KS2027 citations ({state.citations.length} selected)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_CITATIONS.map((cit) => {
                const selected = state.citations.includes(cit);
                return (
                  <button
                    key={cit}
                    type="button"
                    onClick={() =>
                      updateAction(key, state, {
                        citations: selected
                          ? state.citations.filter((x) => x !== cit)
                          : [...state.citations, cit],
                      })
                    }
                    className={`rounded border px-2 py-1 text-[10px] transition-colors ${
                      selected
                        ? 'border-accent/60 bg-accent/15 text-accent'
                        : 'border-line bg-surface text-ink-faint hover:text-ink'
                    }`}
                  >
                    {selected ? '✓ ' : '+ '}
                    {cit}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 4: Named Human Approval Gate + Live Dispatch Execution */}
        <div className="space-y-3 rounded-lg border border-line bg-surface-raised p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              3 · Human approval gate &amp; dispatch ({sampleSendableCheck ? 'assertSendable' : ''})
            </span>
            <span
              className={`rounded-sm border px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.1em] ${
                isDispatched
                  ? 'border-aligned/60 bg-aligned/15 text-aligned'
                  : isApproved
                    ? 'border-reconciled/60 bg-reconciled/15 text-reconciled'
                    : 'border-passive/50 bg-passive/10 text-passive'
              }`}
            >
              {isDispatched ? 'Dispatched' : isApproved ? 'Approved · Ready' : 'Held at gate'}
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                Sign-off officer
              </span>
              <select
                value={state.approver}
                onChange={(e) => updateAction(key, state, { approver: e.target.value })}
                className="mt-1 w-full rounded-md border border-line bg-surface px-2.5 py-2 text-xs text-ink focus:border-accent focus:outline-none"
              >
                {APPROVERS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                Approval note
              </span>
              <input
                type="text"
                value={state.approvalNote}
                onChange={(e) => updateAction(key, state, { approvalNote: e.target.value })}
                placeholder="e.g. Clear for Okin FM morning slot"
                className="mt-1 w-full rounded-md border border-line bg-surface px-2.5 py-2 text-xs text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
              />
            </label>
          </div>

          <div className="rounded border border-line bg-surface px-3 py-2 text-[11px] text-ink-muted">
            Dispatch destination:{' '}
            <strong className="text-ink">{DISPATCH_TARGETS[state.channel]}</strong>
          </div>

          <div className="flex flex-wrap gap-2">
            {!isApproved ? (
              <button
                type="button"
                onClick={() =>
                  updateAction(key, state, { approvedAt: new Date().toISOString() })
                }
                className="flex-1 rounded-md bg-accent px-4 py-2.5 text-xs font-semibold text-ground transition-all hover:brightness-110 active:scale-[0.99]"
              >
                Approve &amp; Sign Off ({state.approver.split(',')[0]})
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() =>
                    updateAction(key, state, {
                      dispatchedAt: new Date().toISOString(),
                      dispatchedTo: DISPATCH_TARGETS[state.channel],
                    })
                  }
                  className="flex-1 rounded-md bg-aligned px-4 py-2.5 text-xs font-semibold text-ground transition-all hover:brightness-110 active:scale-[0.99]"
                >
                  {isDispatched
                    ? `✓ Re-dispatch to ${CHANNEL_LABELS[state.channel]}`
                    : `Dispatch Now → ${CHANNEL_LABELS[state.channel]}`}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateAction(key, state, {
                      approvedAt: undefined,
                      dispatchedAt: undefined,
                      dispatchedTo: undefined,
                    })
                  }
                  className="rounded-md border border-aggrieved/50 px-3 py-2.5 text-xs font-medium text-aggrieved hover:bg-aggrieved/10"
                >
                  Hold
                </button>
              </>
            )}
          </div>

          {isDispatched && (
            <div className="rounded-md border border-aligned/40 bg-aligned/10 px-3 py-2 text-[11px] text-aligned">
              <strong>Dispatched</strong> to {state.dispatchedTo} · approved by {state.approver} at{' '}
              <span className="figure">
                {new Date(state.dispatchedAt!).toLocaleTimeString('en-NG', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <PageHeader
        eyebrow="OSINT & Response Command · Kwara South"
        title="Every OSINT hit carries a response recommendation"
        lede="Public broadcast radio (Okin FM, Harmony FM, Radio Kwara, Sobi FM), national press, public social, and 83 ward returns — every hit generates an actionable playbook, editable draft, named sign-off gate, and dispatch route."
        aside={
          <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 px-3.5 py-2.5">
            <span className="size-2 animate-pulse rounded-full bg-accent" />
            <div className="text-xs">
              <div className="font-semibold text-accent">100% Hits Covered</div>
              <div className="text-[10px] text-ink-muted">
                Recommendation + Response Mechanism live
              </div>
            </div>
          </div>
        }
      />

      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        {/* TOP 6 CLICKABLE OSINT KPI NUMBER CARDS */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
          <InteractiveStatCard
            label="OSINT hits"
            value={overall.total}
            sub="100% with playbooks"
            onClick={() =>
              setDrawer({
                kind: 'mentions',
                title: 'All OSINT hits with response playbooks',
                subtitle: `${overall.total} monitored hits — tap any to open Response Mechanism`,
                items: filteredMentions,
              })
            }
          />
          <InteractiveStatCard
            label="Net sentiment"
            value={`${overall.net >= 0 ? '+' : ''}${(overall.net * 100).toFixed(0)}`}
            tone={overall.net >= 0 ? 'good' : 'bad'}
            sub={`+${overall.positive} pos · −${overall.negative} neg`}
            onClick={() =>
              setDrawer({
                kind: 'mentions',
                title: 'Negative OSINT hits requiring response',
                subtitle: `${overall.negative} negative hits with rebut/clarify drafts ready`,
                items: filteredMentions.filter((m) => m.sentiment === 'negative'),
              })
            }
          />
          <InteractiveStatCard
            label="Accelerating"
            value={acceleratingCount}
            tone="bad"
            sub={`of ${claims.length} tracked claims`}
            active={claimFilter === 'accelerating'}
            onClick={() =>
              setClaimFilter((cur) => (cur === 'accelerating' ? 'all' : 'accelerating'))
            }
          />
          <InteractiveStatCard
            label="Held at gate"
            value={heldClaims.length}
            tone={heldClaims.length > 0 ? 'warn' : 'good'}
            sub={heldClaims.length > 0 ? 'tap to sign off' : 'all claims cleared'}
            onClick={() => {
              if (heldClaims[0]) setDrawer({ kind: 'claim', claimId: heldClaims[0].claim.id });
              else setClaimFilter('all');
            }}
          />
          <InteractiveStatCard
            label="Dispatched"
            value={totalDispatched}
            tone="accent"
            sub="radio · press · 83 wards"
            active={claimFilter === 'dispatched'}
            onClick={() =>
              setClaimFilter((cur) => (cur === 'dispatched' ? 'all' : 'dispatched'))
            }
          />
          <InteractiveStatCard
            label="Human review"
            value={uncertain.length}
            tone="warn"
            sub="<65% confidence"
            onClick={() =>
              setDrawer({
                kind: 'mentions',
                title: 'Low-confidence human review queue',
                subtitle: `${uncertain.length} hits routed to analysts — tap any to respond`,
                items: uncertain,
              })
            }
          />
        </div>

        {/* 5 CLICKABLE SOURCE CHANNEL CARDS */}
        <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-5">
          {bySource.map(({ kind, items, stats }) => {
            const active = sourceFilter === kind;
            return (
              <button
                key={kind}
                type="button"
                onClick={() => setSourceFilter((cur) => (cur === kind ? 'all' : kind))}
                className={`flex min-w-[168px] shrink-0 flex-col justify-between rounded-lg border p-3 text-left transition-all active:scale-[0.98] sm:min-w-0 ${
                  active
                    ? 'border-accent/60 bg-accent/15'
                    : 'border-line bg-surface hover:border-line-bright hover:bg-surface-raised'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                    {SOURCE_LABELS[kind]}
                  </span>
                  <span
                    className={`figure text-xs font-semibold ${
                      stats.net >= 0 ? 'text-aligned' : 'text-aggrieved'
                    }`}
                  >
                    {stats.net >= 0 ? '+' : ''}
                    {(stats.net * 100).toFixed(0)}
                  </span>
                </div>
                <div className="mt-1.5 flex items-baseline justify-between">
                  <span className="figure text-xl font-semibold text-ink">{items.length}</span>
                  <span className="text-[10px] text-accent">
                    {active ? 'Filtered ✕' : 'Filter ›'}
                  </span>
                </div>
                <div className="mt-1 truncate text-[10px] text-ink-muted">{SOURCE_SUB[kind]}</div>
              </button>
            );
          })}
        </div>

        {/* ABOVE-THE-FOLD VISUAL DASHBOARD */}
        <div className="grid gap-4 lg:grid-cols-5">
          <Panel
            title="Topic net sentiment"
            note="Tap any topic to open hits & response drafts"
            className="lg:col-span-3"
          >
            <DivergingBars
              data={topicRows.map(({ topic, breakdown: b }) => ({
                id: topic.id,
                label: topic.label,
                value: b.net * 100,
                note: `${b.total} hits · ${topic.origin}`,
              }))}
              format={(n) => `${n > 0 ? '+' : ''}${n.toFixed(0)}`}
              onSelect={(d) => {
                const hit = topicRows.find((t) => t.topic.id === d.id);
                if (hit) {
                  setDrawer({
                    kind: 'mentions',
                    title: hit.topic.label,
                    subtitle: `${hit.breakdown.total} OSINT hits — tap any to open Response Mechanism`,
                    items: hit.items,
                  });
                }
              }}
            />
          </Panel>

          <Panel
            title="Sentiment balance & constituency pulse"
            note="Tap constituency to filter"
            className="lg:col-span-2"
          >
            <div className="flex flex-wrap items-center gap-4 sm:gap-5">
              <Gauge
                value={positiveShare}
                label="Positive share"
                tone={overall.net >= 0.1 ? 'good' : overall.net >= 0 ? 'warn' : 'bad'}
              />
              <div className="min-w-[140px] flex-1 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-ink-muted">
                    <span className="size-2 rounded-sm bg-aligned" /> Positive
                  </span>
                  <span className="figure font-semibold text-aligned">{overall.positive}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-ink-muted">
                    <span className="size-2 rounded-sm bg-unknown" /> Neutral
                  </span>
                  <span className="figure font-semibold text-ink">{overall.neutral}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-ink-muted">
                    <span className="size-2 rounded-sm bg-aggrieved" /> Negative
                  </span>
                  <span className="figure font-semibold text-aggrieved">{overall.negative}</span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <StackedBar
                showLabels
                segments={[
                  { label: 'Positive', value: overall.positive, color: '#16a34a' },
                  { label: 'Neutral', value: overall.neutral, color: '#64748b' },
                  { label: 'Negative', value: overall.negative, color: '#d03b3b' },
                ]}
              />
            </div>

            <div className="mt-4 space-y-2 border-t border-line pt-3">
              {constituencies.map(({ constituencyId, breakdown: b }) => {
                const fc = FEDERAL_CONSTITUENCIES.find((x) => x.id === constituencyId);
                return (
                  <button
                    key={constituencyId}
                    type="button"
                    onClick={() =>
                      setFcFilter((cur) => (cur === constituencyId ? 'all' : constituencyId))
                    }
                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-xs transition-colors ${
                      fcFilter === constituencyId
                        ? 'border-accent/60 bg-accent/15'
                        : 'border-line bg-surface-raised hover:border-line-bright'
                    }`}
                  >
                    <span className="font-medium text-ink">{fc?.shortName}</span>
                    <span className="flex items-center gap-2">
                      <span className="figure text-[10px] text-ink-faint">{b.total} hits</span>
                      <span
                        className={`figure font-semibold ${
                          b.net >= 0 ? 'text-aligned' : 'text-aggrieved'
                        }`}
                      >
                        {b.net >= 0 ? '+' : ''}
                        {(b.net * 100).toFixed(0)}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* TRACKED CLAIMS — ALL 5/5 WITH RESPONSE RECOMMENDATIONS & LIVE RESPONSE MECHANISM */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {(
              [
                ['all', `All claims (${claims.length})`],
                ['accelerating', `Accelerating (${acceleratingCount})`],
                ['held', `Held at gate (${heldClaims.length})`],
                ['dispatched', `Dispatched (${dispatchedClaimCount})`],
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
          {(fcFilter !== 'all' || sourceFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setFcFilter('all');
                setSourceFilter('all');
              }}
              className="rounded-md border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] text-accent"
            >
              Clear filters ✕
            </button>
          )}
        </div>

        <Panel
          title="Tracked claims — response playbooks & approval gate"
          note="All 5 claims carry recommended responses · tap any card to edit, sign off & dispatch"
        >
          <div className="grid gap-3 lg:grid-cols-2">
            {rising.map((claim) => {
              const st = getClaimState(claim);
              const v = velocity(claim);
              return (
                <button
                  key={claim.id}
                  type="button"
                  onClick={() => setDrawer({ kind: 'claim', claimId: claim.id })}
                  className="group flex flex-col justify-between rounded-lg border border-line bg-surface-raised p-4 text-left transition-all hover:border-accent/50 hover:bg-ground/40 active:scale-[0.995]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-1.5">
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
                            ×{v.toFixed(1)}
                          </span>
                        )}
                      </div>
                      <Spark values={claim.dailyMentions} />
                    </div>

                    <p className="mt-2.5 text-sm font-medium leading-snug text-ink">
                      {claim.statement}
                    </p>

                    {/* Response Recommendation Strip RIGHT ON THE CARD */}
                    <div className="mt-3 rounded-md border border-line bg-surface p-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span
                          className={`rounded border px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.08em] ${POSTURE_TONE[st.posture]}`}
                        >
                          {POSTURE_LABELS[st.posture]}
                        </span>
                        <span className="figure text-[10px] text-ink-faint">
                          {CHANNEL_LABELS[st.channel]} · {URGENCY_LABELS[claim.urgency]}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-ink-muted">
                        <strong className="text-ink">Rec:</strong> {claim.recommendedAngle}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5 text-[11px]">
                    {st.dispatchedAt ? (
                      <span className="font-medium text-aligned">
                        ✓ Dispatched ({CHANNEL_LABELS[st.channel]})
                      </span>
                    ) : st.approvedAt ? (
                      <span className="font-medium text-reconciled">
                        ✓ Approved — ready to dispatch
                      </span>
                    ) : (
                      <span className="font-semibold text-passive">
                        ● Held — tap to approve &amp; dispatch
                      </span>
                    )}
                    <span className="font-medium text-accent transition-transform group-hover:translate-x-0.5">
                      Respond ›
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>

        {/* LIVE OSINT HITS STREAM — EVERY SINGLE HIT WITH ITS OWN RESPONSE RECOMMENDATION */}
        <Panel
          title="Live OSINT hits & response recommendations"
          note={`${visibleHits.length} hits · every hit carries a recommended posture, draft & dispatch path`}
        >
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 sm:mx-0 sm:flex-wrap sm:px-0">
              {(
                [
                  ['all', `All hits (${filteredMentions.length})`],
                  ['urgent', 'Urgent 2h SLA'],
                  ['rebut', 'Rebut / Clarify'],
                  ['amplify', 'Amplify wins'],
                  ['dispatched', `Dispatched (${dispatchedHitCount})`],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setHitFilter(id)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    hitFilter === id
                      ? 'border-accent/60 bg-accent/15 text-accent'
                      : 'border-line bg-surface-raised text-ink-muted hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <input
              type="search"
              value={hitQuery}
              onChange={(e) => setHitQuery(e.target.value)}
              placeholder="Search outlet, excerpt, recommendation…"
              className="w-full rounded-lg border border-line bg-surface-raised px-3 py-2 text-xs text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none sm:w-64"
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {visibleHits.slice(0, 12).map((m) => {
              const st = getMentionState(m);
              const topic = TOPICS.find((t) => t.id === m.topicId);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setDrawer({ kind: 'hit', mentionId: m.id })}
                  className="group flex flex-col justify-between rounded-lg border border-line bg-surface-raised p-3.5 text-left transition-all hover:border-accent/50 active:scale-[0.995]"
                >
                  <div>
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

                    <p className="mt-1.5 text-xs font-medium leading-relaxed text-ink">
                      “{m.excerpt}”
                    </p>

                    {/* Mandatory Response Recommendation on EVERY hit */}
                    <div className="mt-2.5 rounded-md border border-accent/25 bg-accent/[0.05] p-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <span
                          className={`rounded border px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.08em] ${POSTURE_TONE[st.posture]}`}
                        >
                          {POSTURE_LABELS[st.posture]}
                        </span>
                        <span className="figure text-[10px] text-ink-faint">
                          {CHANNEL_LABELS[st.channel]} · {URGENCY_LABELS[m.recommendation.urgency]}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-ink-muted">
                        {m.recommendation.angle}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line pt-2 text-[11px]">
                    <span className="truncate text-ink-faint">
                      {topic?.label} · {m.recommendation.ownerRole}
                    </span>
                    {st.dispatchedAt ? (
                      <span className="shrink-0 font-semibold text-aligned">✓ Dispatched</span>
                    ) : st.approvedAt ? (
                      <span className="shrink-0 font-semibold text-reconciled">Approved ›</span>
                    ) : (
                      <span className="shrink-0 font-medium text-accent group-hover:translate-x-0.5">
                        Open mechanism ›
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {visibleHits.length > 12 && (
            <button
              type="button"
              onClick={() =>
                setDrawer({
                  kind: 'mentions',
                  title: `All matching OSINT hits (${visibleHits.length})`,
                  subtitle: 'Tap any hit to edit its draft, sign off & dispatch',
                  items: visibleHits,
                })
              }
              className="mt-3 w-full rounded-lg border border-line bg-surface-raised py-2.5 text-xs font-medium text-accent hover:border-accent/50"
            >
              View all {visibleHits.length} hits with response recommendations ›
            </button>
          )}
        </Panel>

        {/* LANGUAGE BREAKDOWN */}
        <Panel
          title="OSINT coverage by language"
          note={`${Math.round((nonEnglishMentions.length / (filteredMentions.length || 1)) * 100)}% non-English · tap any bar`}
        >
          <RankedBars
            data={languages.map(({ language, count }) => ({
              id: language,
              label: LANGUAGE_LABELS[language].split(' ')[0],
              value: count,
              note: `${Math.round((count / (filteredMentions.length || 1)) * 100)}% share`,
              color: language === 'yo' ? SERIES[0] : language === 'en' ? SERIES[1] : SERIES[2],
            }))}
            onSelect={(d) => {
              const lang = d.id as Language;
              setDrawer({
                kind: 'mentions',
                title: `${LANGUAGE_LABELS[lang]} OSINT hits`,
                subtitle: `${d.value} hits — every hit includes a recommended response`,
                items: filteredMentions.filter((m) => m.language === lang),
              });
            }}
          />
        </Panel>
      </div>

      {/* DEEP RESPONSE MECHANISM & MENTIONS DRAWER */}
      <DetailDrawer
        open={drawer !== null}
        onClose={() => setDrawer(null)}
        onBack={
          drawer?.kind === 'hit' && drawer.returnTo
            ? () =>
                setDrawer({
                  kind: 'mentions',
                  title: drawer.returnTo!.title,
                  subtitle: drawer.returnTo!.subtitle,
                  items: drawer.returnTo!.items,
                })
            : undefined
        }
        backLabel={drawer?.kind === 'hit' && drawer.returnTo ? 'Back to hits list' : undefined}
        eyebrow={
          drawer?.kind === 'claim'
            ? `Claim Response Mechanism · ${activeClaim?.firstSeenSource ?? ''}`
            : drawer?.kind === 'hit'
              ? `OSINT Hit Response Mechanism · ${activeMention?.sourceName ?? ''}`
              : 'OSINT Hits & Recommendations'
        }
        title={
          drawer?.kind === 'claim'
            ? activeClaim?.statement ?? ''
            : drawer?.kind === 'hit'
              ? activeMention?.excerpt ?? ''
              : drawer?.kind === 'mentions'
                ? drawer.title
                : ''
        }
        subtitle={
          drawer?.kind === 'claim' && activeClaim
            ? `${CLAIM_STATUS_LABELS[activeClaim.status]} · ${ASSESSMENT_LABELS[activeClaim.assessment]} · ${totalMentions(activeClaim)} mentions`
            : drawer?.kind === 'hit' && activeMention
              ? `${SOURCE_LABELS[activeMention.sourceKind]} · ${LANGUAGE_LABELS[activeMention.language]} · ${activeMention.sentiment} (${Math.round(activeMention.confidence * 100)}% conf.)`
              : drawer?.kind === 'mentions'
                ? drawer.subtitle
                : undefined
        }
      >
        {drawer?.kind === 'claim' && activeClaim && (
          <div className="space-y-5">
            <div className="rounded-lg border border-line bg-surface-raised p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                  Velocity curve ({activeClaim.dailyMentions.length} days)
                </span>
                <span className="figure text-xs text-accent">
                  ×{velocity(activeClaim).toFixed(1)} acceleration
                </span>
              </div>
              <div className="flex h-16 items-end gap-1.5">
                {activeClaim.dailyMentions.map((v, i) => {
                  const max = Math.max(...activeClaim.dailyMentions, 1);
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <span className="figure text-[9px] text-ink-faint">{v}</span>
                      <div
                        className="w-full rounded-t bg-accent/80"
                        style={{ height: `${Math.max(8, (v / max) * 44)}px` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {renderResponseMechanism(
              `claim:${activeClaim.id}`,
              getClaimState(activeClaim),
              activeClaim.ownerRole,
              URGENCY_LABELS[activeClaim.urgency],
              activeClaim.recommendedAngle
            )}
          </div>
        )}

        {drawer?.kind === 'hit' &&
          activeMention &&
          renderResponseMechanism(
            `hit:${activeMention.id}`,
            getMentionState(activeMention),
            activeMention.recommendation.ownerRole,
            URGENCY_LABELS[activeMention.recommendation.urgency],
            activeMention.recommendation.angle
          )}

        {drawer?.kind === 'mentions' && (
          <div className="space-y-2.5">
            {drawer.items.slice(0, 30).map((m) => {
              const st = getMentionState(m);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() =>
                    setDrawer({
                      kind: 'hit',
                      mentionId: m.id,
                      returnTo: {
                        title: drawer.title,
                        subtitle: drawer.subtitle,
                        items: drawer.items,
                      },
                    })
                  }
                  className="group block w-full rounded-lg border border-line bg-surface-raised p-3.5 text-left transition-colors hover:border-accent/50"
                >
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
                  <p className="mt-1.5 text-xs leading-relaxed text-ink">“{m.excerpt}”</p>
                  <div className="mt-2 rounded border border-accent/25 bg-accent/[0.06] px-2.5 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span
                        className={`rounded border px-1.5 py-px text-[9px] font-semibold uppercase ${POSTURE_TONE[st.posture]}`}
                      >
                        {POSTURE_LABELS[st.posture]}
                      </span>
                      <span className="text-[10px] font-medium text-accent">
                        {st.dispatchedAt ? '✓ Dispatched' : 'Open Response Mechanism ›'}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-snug text-ink-muted">
                      {m.recommendation.angle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </DetailDrawer>
    </>
  );
}
