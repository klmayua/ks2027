import { PageHeader, Panel } from '@/components/shell';
import { FEDERAL_CONSTITUENCIES } from '@/lib/geography';
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
    <div className="flex h-6 items-end gap-px" aria-hidden="true">
      {values.map((v, i) => (
        <span
          key={i}
          className="w-1 rounded-t-sm bg-accent/75"
          style={{ height: `${Math.max(6, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export default function NarrativePage() {
  const mentions = seedMentions();
  const claims = seedClaims();
  const responses = seedResponses();

  const overall = breakdown(mentions);
  const constituencies = byConstituency(mentions);
  const languages = byLanguage(mentions);
  const uncertain = lowConfidence(mentions);

  const topicRows = TOPICS.map((t) => ({
    topic: t,
    breakdown: breakdown(mentions.filter((m) => m.topicId === t.id)),
  })).sort((a, b) => a.breakdown.net - b.breakdown.net);

  const rising = [...claims]
    .filter((c) => c.status !== 'dormant')
    .sort((a, b) => velocity(b) - velocity(a));

  const awaitingApproval = responses.filter((r) => !isSendable(r));
  const nonEnglishShare = mentions.length
    ? mentions.filter((m) => m.language !== 'en').length / mentions.length
    : 0;

  return (
    <>
      <PageHeader
        eyebrow="Narrative & OSINT · Kwara South"
        title="Public sources only, human approval always"
        lede="Monitoring of published journalism, Kwara South and Ilorin broadcast radio (Okin FM, Harmony FM, Radio Kwara, Sobi FM), public posts and the campaign's own ward returns. There is no ingest path for private groups or direct messages, and no response leaves without a named sign-off."
        aside={
          <div className="grid grid-cols-3 gap-4 rounded border border-line bg-surface-raised px-4 py-3">
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
              <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Claims</div>
              <div className="figure text-xl font-semibold text-passive">{claims.length}</div>
            </div>
          </div>
        }
      />

      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <Panel title="Tracked claims" note="Ranked by acceleration, not volume">
          <div className="space-y-3">
            {rising.map((claim) => {
              const response = responses.find((r) => r.id === claim.responseId);
              const v = velocity(claim);
              return (
                <div
                  key={claim.id}
                  className="rounded border border-line bg-surface-raised p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 max-w-3xl flex-1">
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
                      <p className="mt-2 text-sm leading-relaxed text-ink">{claim.statement}</p>
                      <p className="mt-1.5 text-[11px] text-ink-faint">
                        First seen {new Date(claim.firstSeenAt).toLocaleDateString('en-NG')} ·{' '}
                        {claim.firstSeenSource} · {totalMentions(claim)} mentions ·{' '}
                        {claim.languages.map((l) => LANGUAGE_LABELS[l]).join(', ')} ·{' '}
                        {claim.constituencyIds
                          .map(
                            (id) =>
                              FEDERAL_CONSTITUENCIES.find((x) => x.id === id)?.shortName ?? id
                          )
                          .join(', ')}
                      </p>
                    </div>
                    <Spark values={claim.dailyMentions} />
                  </div>

                  {response && (
                    <div className="mt-3 border-t border-line pt-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                          {CHANNEL_LABELS[response.channel]} · {LANGUAGE_LABELS[response.language]}
                        </span>
                        <span
                          className={`rounded-sm border px-1.5 py-px text-[9px] font-medium uppercase tracking-[0.1em] ${
                            response.draftedBy === 'ai_assisted'
                              ? 'border-reconciled/40 text-reconciled'
                              : 'border-line-bright text-ink-muted'
                          }`}
                        >
                          {response.draftedBy === 'ai_assisted'
                            ? 'AI-assisted draft'
                            : 'Human draft'}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                        {response.draft}
                      </p>
                      {response.citations.length > 0 && (
                        <p className="mt-2 text-[11px] text-ink-faint">
                          Cites: {response.citations.join(' · ')}
                        </p>
                      )}
                      <p className="mt-2 text-[11px]">
                        {response.approval ? (
                          <span className="text-aligned">
                            Approved by {response.approval.byRole},{' '}
                            {new Date(response.approval.at).toLocaleString('en-NG')}
                            {response.approval.note && (
                              <span className="text-ink-faint"> — “{response.approval.note}”</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-passive">
                            Awaiting approval — cannot be sent
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>

        <div className="grid gap-5 lg:grid-cols-3">
          <Panel title="Topics" note="Worst net sentiment first" className="lg:col-span-2">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                    <th className="pb-2 font-medium">Topic</th>
                    <th className="pb-2 font-medium">Origin</th>
                    <th className="pb-2 text-right font-medium">Mentions</th>
                    <th className="pb-2 font-medium">Mix</th>
                    <th className="pb-2 text-right font-medium">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {topicRows.map(({ topic, breakdown: b }) => (
                    <tr key={topic.id}>
                      <td className="py-2.5 text-ink">{topic.label}</td>
                      <td className="py-2.5">
                        <span
                          className={`text-[10px] uppercase tracking-[0.1em] ${
                            topic.origin === 'opponent'
                              ? 'text-aggrieved'
                              : topic.origin === 'campaign'
                                ? 'text-aligned'
                                : 'text-ink-faint'
                          }`}
                        >
                          {topic.origin}
                        </span>
                      </td>
                      <td className="figure py-2.5 text-right text-ink-muted">{b.total}</td>
                      <td className="py-2.5">
                        <div className="flex h-1.5 w-28 overflow-hidden rounded-sm">
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
                      </td>
                      <td
                        className={`figure py-2.5 text-right ${
                          b.net >= 0 ? 'text-aligned' : 'text-aggrieved'
                        }`}
                      >
                        {b.net >= 0 ? '+' : ''}
                        {(b.net * 100).toFixed(0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel title="By federal constituency" note="Sentiment where it is felt">
            <div className="space-y-4">
              {constituencies.map(({ constituencyId, breakdown: b }) => {
                const fc = FEDERAL_CONSTITUENCIES.find((x) => x.id === constituencyId);
                return (
                  <div key={constituencyId}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs text-ink">{fc?.name}</span>
                      <span
                        className={`figure text-sm ${
                          b.net >= 0 ? 'text-aligned' : 'text-aggrieved'
                        }`}
                      >
                        {b.net >= 0 ? '+' : ''}
                        {(b.net * 100).toFixed(0)}
                      </span>
                    </div>
                    <div className="mt-1.5 flex h-2 overflow-hidden rounded-sm">
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
                    <div className="figure mt-1 text-[10px] text-ink-faint">
                      {b.total} mentions
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <Panel title="Language" note={`${Math.round(nonEnglishShare * 100)}% non-English`}>
            <div className="space-y-2">
              {languages.map(({ language, count }) => (
                <div key={language} className="flex items-center gap-3">
                  <span className="w-36 shrink-0 truncate text-[11px] text-ink-muted">
                    {LANGUAGE_LABELS[language]}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-surface-raised">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${(count / mentions.length) * 100}%` }}
                    />
                  </div>
                  <span className="figure w-8 shrink-0 text-right text-xs text-ink">{count}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-ink-muted">
              An English-only monitor misses{' '}
              <span className="figure text-ink">{Math.round(nonEnglishShare * 100)}%</span> of
              Kwara South discourse — especially Yoruba morning radio on Okin FM and Harmony FM,
              plus Fulfulde security dialogue across rural Ifelodun and Ekiti.
            </p>
          </Panel>

          <Panel title="Needs a human read" note={`${uncertain.length} low-confidence`}>
            <div className="space-y-2">
              {uncertain.slice(0, 6).map((m) => (
                <div key={m.id} className="rounded border border-line bg-surface-raised px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                      {SOURCE_LABELS[m.sourceKind]} · {LANGUAGE_LABELS[m.language]}
                    </span>
                    <span className="figure text-[10px] text-passive">
                      {(m.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-snug text-ink-muted">{m.excerpt}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-ink-muted">
              Low-confidence classifications route to a human analyst rather than auto-counting —
              preventing Yoruba or Fulfulde sarcasm and radio idioms from inverting sentiment.
            </p>
          </Panel>

          <Panel title="Approval gate" note={`${awaitingApproval.length} held`}>
            {awaitingApproval.length === 0 ? (
              <p className="text-sm text-ink-muted">Nothing awaiting sign-off.</p>
            ) : (
              <div className="space-y-2">
                {awaitingApproval.map((r) => (
                  <div
                    key={r.id}
                    className="rounded border border-passive/30 bg-passive/5 px-3 py-2"
                  >
                    <div className="text-[10px] uppercase tracking-[0.1em] text-passive">
                      {CHANNEL_LABELS[r.channel]} · held
                    </div>
                    <p className="mt-1 text-xs leading-snug text-ink-muted">{r.draft}</p>
                    {r.citations.length === 0 && (
                      <p className="mt-1.5 text-[11px] text-aggrieved">
                        No citations — cannot be published as fact.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-ink-muted">
              <code className="text-ink">assertSendable()</code> throws on any response without a
              recorded approval. The gate lives on the send path in code.
            </p>
          </Panel>
        </div>

        <Panel title="What this system will not do" note="Enforced by the type system">
          <ul className="grid gap-2 text-xs leading-relaxed text-ink-muted sm:grid-cols-2">
            <li>
              <span className="text-ink">No private sources.</span> <code>SourceKind</code> admits
              only published journalism, broadcast radio, public posts, official statements and the
              campaign&rsquo;s own ward returns.
            </li>
            <li>
              <span className="text-ink">No inauthentic amplification.</span> There are no automated
              posting accounts — every output is a draft for named campaign officers to publish
              under their own name.
            </li>
            <li>
              <span className="text-ink">No fabrication.</span> Responses cite published commitments
              (e.g. <code>KS-SEC-001</code>) or directives; drafts without citations are flagged.
            </li>
            <li>
              <span className="text-ink">Concession is a first-class state.</span> Claims can be
              assessed <em>substantially true</em> and marked <em>conceded</em> so the war room
              corrects real weaknesses before voters do.
            </li>
          </ul>
        </Panel>
      </div>
    </>
  );
}
