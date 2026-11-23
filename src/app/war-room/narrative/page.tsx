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
      })).sort((a, b) => b.breakdown.net - a.breakdown.net),
    [filteredMentions]
  );

  const acceleratingCount = useMemo(
    () => claims.filter((c) => c.status !== 'dormant' && velocity(c) > 1.6).length,
    [claims]
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
  const nonEnglishMentions = filteredMentions.filter((m) => m.language !== 'en');
  const nonEnglishShare = filteredMentions.length
    ? nonEnglishMentions.length / filteredMentions.length
    : 0;
  const positiveShare = overall.total ? overall.positive / overall.total : 0;

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
        lede="Okin FM Offa, Harmony FM, Radio Kwara, Sobi FM, national dailies, public social, and ward returns. Every metric card, topic bar, and claim drills into raw evidence."
      />

      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        {/* TOP 6 CLICKABLE KPI NUMBER CARDS — matches Overview command rhythm */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
          <InteractiveStatCard
            label="Public mentions"
            value={overall.total}
            sub="last 14 days · tap feed"
            onClick={() =>
              setDrawer({
                kind: 'mentions',
                title: 'All monitored public mentions',
                subtitle: `${overall.total} items across Kwara South outlets`,
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
                title: 'Negative mentions driving risk',
                subtitle: `${overall.negative} negative items across monitored topics`,
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
            value={awaitingApproval.length}
            tone={awaitingApproval.length > 0 ? 'warn' : 'good'}
            sub={awaitingApproval.length > 0 ? 'tap to review & approve' : 'all signed off'}
            onClick={() => {
              if (awaitingApproval[0]) {
                setDrawer({ kind: 'claim', claimId: awaitingApproval[0].claimId });
              } else {
                setClaimFilter('all');
              }
            }}
          />
          <InteractiveStatCard
            label="Non-English"
            value={`${Math.round(nonEnglishShare * 100)}%`}
            tone="accent"
            sub="Yoruba · Pidgin · Fulfulde"
            onClick={() =>
              setDrawer({
                kind: 'mentions',
                title: 'Non-English Kwara South discourse',
                subtitle: `${nonEnglishMentions.length} Yoruba, Pidgin, and Fulfulde items`,
                items: nonEnglishMentions,
              })
            }
          />
          <InteractiveStatCard
            label="Human review"
            value={uncertain.length}
            tone="warn"
            sub="below 65% confidence"
            onClick={() =>
              setDrawer({
                kind: 'mentions',
                title: 'Low-confidence human review queue',
                subtitle: `${uncertain.length} mentions routed to human analysts`,
                items: uncertain,
              })
            }
          />
        </div>

        {/* ABOVE-THE-FOLD VISUAL DASHBOARD GRID */}
        <div className="grid gap-4 lg:grid-cols-5">
          <Panel
            title="Topic net sentiment"
            note="Tap any topic bar to read its raw public mentions"
            className="lg:col-span-3"
          >
            <DivergingBars
              data={topicRows.map(({ topic, breakdown: b }) => ({
                id: topic.id,
                label: topic.label,
                value: b.net * 100,
                note: `${b.total} mentions · ${topic.origin}`,
              }))}
              format={(n) => `${n > 0 ? '+' : ''}${n.toFixed(0)}`}
              onSelect={(d) => {
                const hit = topicRows.find((t) => t.topic.id === d.id);
                if (hit) {
                  setDrawer({
                    kind: 'mentions',
                    title: hit.topic.label,
                    subtitle: `${hit.breakdown.total} mentions · Origin: ${hit.topic.origin}`,
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
                      <span className="figure text-[10px] text-ink-faint">{b.total}m</span>
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

        {/* FILTER STRIP + 2-COLUMN CLICKABLE TRACKED CLAIM CARDS */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {(
              [
                ['all', `All claims (${claims.length})`],
                ['accelerating', `Accelerating (${acceleratingCount})`],
                ['held', `Held at gate (${awaitingApproval.length})`],
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
          {fcFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setFcFilter('all')}
              className="rounded-md border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] text-accent"
            >
              Clear constituency filter ✕
            </button>
          )}
        </div>

        <Panel
          title="Tracked claims"
          note="Tap any claim card to inspect velocity curve & operate approval gate"
        >
          <div className="grid gap-3 lg:grid-cols-2">
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
                      <p className="mt-1.5 text-[11px] text-ink-faint">
                        {claim.firstSeenSource} · {totalMentions(claim)} mentions ·{' '}
                        {claim.languages.map((l) => l.toUpperCase()).join('/')}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5 text-[11px]">
                      {response ? (
                        response.approval ? (
                          <span className="font-medium text-aligned">
                            ✓ Approved ({response.approval.byRole})
                          </span>
                        ) : (
                          <span className="font-semibold text-passive">
                            ● Held — tap to approve
                          </span>
                        )
                      ) : (
                        <span className="text-ink-faint">Monitoring</span>
                      )}
                      <span className="text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent">
                        Inspect ›
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Panel>

        {/* LANGUAGE BREAKDOWN + HUMAN REVIEW QUEUE */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel
            title="Mentions by language"
            note={`${Math.round(nonEnglishShare * 100)}% non-English · tap any bar`}
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
                  title: `${LANGUAGE_LABELS[lang]} mentions`,
                  subtitle: `${d.value} monitored public items`,
                  items: filteredMentions.filter((m) => m.language === lang),
                });
              }}
            />
          </Panel>

          <Panel
            title="Human review queue"
            note={`${uncertain.length} low-confidence · tap any card`}
          >
            <div className="grid gap-2 sm:grid-cols-2">
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
                  className="rounded-lg border border-line bg-surface-raised p-3 text-left transition-colors hover:border-passive/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                      {m.sourceName}
                    </span>
                    <span className="figure shrink-0 text-[10px] font-semibold text-passive">
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

            {activeResponse ? (
              <div className="rounded-lg border border-line bg-surface-raised p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                    {CHANNEL_LABELS[activeResponse.channel]} ·{' '}
                    {LANGUAGE_LABELS[activeResponse.language]}
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
                    Citations:{' '}
                    <span className="text-ink">{activeResponse.citations.join(' · ')}</span>
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
                No response drafted yet. Claim is under active monitoring across Kwara South
                outlets.
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
