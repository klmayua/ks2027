import {
  Legend,
  RankedBars,
  StackedBar,
  Stat,
  WeightedMosaic,
  type MosaicRow,
} from '@/components/charts';
import { PageHeader, Panel } from '@/components/shell';
import { FEDERAL_CONSTITUENCIES, getWard, lgas, wardsInLga } from '@/lib/geography';
import { resultFor, totalValidVotes } from '@/lib/geography/results-2023';
import { RISK_LABELS, type WardControl } from '@/lib/party/structure';
import { seedRoster, seedStakeholders } from '@/lib/simulation/seed';
import { analyse } from '@/lib/war-room/analysis';

const RISK_COLOR: Record<WardControl['risk'], string> = {
  held: '#16a34a',
  contested: '#fab219',
  exposed: '#d03b3b',
  vacant: '#4a5163',
};

const pct = (n: number, dp = 0) => `${(n * 100).toFixed(dp)}%`;

export default function PowerMapPage() {
  const { entries } = seedRoster();
  const stakeholders = seedStakeholders();
  const a = analyse(entries, stakeholders);

  const claimedBy = new Map<string, string[]>();
  for (const s of stakeholders) {
    if (s.stage === 'reconciled' || s.stage === 'refused') continue;
    for (const w of s.carriesWardIds) claimedBy.set(w, [...(claimedBy.get(w) ?? []), s.name]);
  }

  // Vote weight per ward, apportioned from each LGA's 2023 proxy by polling unit share.
  const wardVotes = new Map<string, number>();
  for (const lga of lgas) {
    const result = resultFor(lga.code);
    const lgaWards = wardsInLga(lga.code);
    const puTotal = lgaWards.reduce((s, w) => s + w.declaredPollingUnitCount, 0) || 1;
    for (const w of lgaWards) {
      wardVotes.set(
        w.id,
        Math.round(((result?.validVotes ?? 0) * w.declaredPollingUnitCount) / puTotal)
      );
    }
  }

  let votesExposed = 0;
  let votesHeld = 0;
  for (const [wardId, votes] of wardVotes) {
    const risk = a.wardControl.get(wardId)?.risk;
    if (risk === 'held') votesHeld += votes;
    else if (risk === 'exposed' || risk === 'vacant') votesExposed += votes;
  }
  const totalWardVotes = [...wardVotes.values()].reduce((s, v) => s + v, 0) || 1;

  const rows: MosaicRow[] = lgas
    .map((lga) => {
      const result = resultFor(lga.code);
      const lgaWards = wardsInLga(lga.code);
      return {
        id: lga.code,
        label: lga.name,
        weight: result?.validVotes ?? 0,
        note: `${((result?.validVotes ?? 0) / 1000).toFixed(1)}k`,
        cells: lgaWards
          .slice()
          .sort((x, y) => y.declaredPollingUnitCount - x.declaredPollingUnitCount)
          .map((w) => {
            const c = a.wardControl.get(w.id)!;
            const claims = claimedBy.get(w.id) ?? [];
            return {
              id: w.id,
              weight: w.declaredPollingUnitCount,
              color: RISK_COLOR[c.risk],
              label:
                w.declaredPollingUnitCount >= 12 ? String(w.declaredPollingUnitCount) : undefined,
              title: [
                `${w.name} (${w.id})`,
                `${RISK_LABELS[c.risk]} — ${c.filledSeats}/${c.loadBearingSeats} load-bearing seats`,
                `${w.declaredPollingUnitCount} enumerated PUs · ~${(wardVotes.get(w.id) ?? 0).toLocaleString('en-NG')} votes (2023 proxy)`,
                claims.length ? `Claimed by: ${claims.join(', ')}` : null,
              ]
                .filter(Boolean)
                .join('\n'),
            };
          }),
      };
    })
    .sort((x, y) => y.weight - x.weight);

  const exposureByLga = lgas
    .map((lga) => {
      const lgaWards = wardsInLga(lga.code);
      const atRisk = lgaWards
        .filter((w) => {
          const r = a.wardControl.get(w.id)?.risk;
          return r === 'exposed' || r === 'vacant';
        })
        .reduce((s, w) => s + (wardVotes.get(w.id) ?? 0), 0);
      return { name: lga.name, atRisk, total: resultFor(lga.code)?.validVotes ?? 0 };
    })
    .filter((x) => x.atRisk > 0)
    .sort((x, y) => y.atRisk - x.atRisk);

  return (
    <>
      <PageHeader
        eyebrow="Power map · 83 wards"
        title="Exposure, weighted by where Kwara South votes"
        aside={
          <div className="flex w-full flex-wrap gap-x-6 gap-y-3 rounded border border-line bg-surface-raised px-4 py-3 sm:px-5 lg:w-auto">
            <Stat
              label="2023 votes exposed"
              value={`${(votesExposed / 1000).toFixed(1)}k`}
              tone="bad"
              size="sm"
              sub={`${pct(votesExposed / totalWardVotes)} of Kwara South`}
            />
            <Stat
              label="2023 votes held"
              value={`${(votesHeld / 1000).toFixed(1)}k`}
              tone="good"
              size="sm"
              sub={pct(votesHeld / totalWardVotes)}
            />
          </div>
        }
      />

      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <Panel
          title="Every ward in Kwara South, sized by weight"
          note="Row width = LGA votes cast (2023 proxy) · cell width = polling units"
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Legend
              items={(Object.keys(RISK_LABELS) as WardControl['risk'][]).map((risk) => ({
                label: RISK_LABELS[risk],
                color: RISK_COLOR[risk],
                value: String(a.control[risk]),
              }))}
            />
            <span className="text-[11px] text-ink-faint">
              Ifelodun casts 3.1× Isin. Equal tiles hide that.
            </span>
          </div>

          <WeightedMosaic rows={rows} height={28} />

          <p className="mt-4 border-t border-line pt-3 text-xs text-ink-muted">
            Ward vote weight is apportioned from each LGA&rsquo;s 2023 proxy by polling unit share —
            approximate by construction. Per-ward Senate EC8B sheets replace it on ingestion.
          </p>
        </Panel>

        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Votes at risk by LGA" note="Exposed and vacant wards only">
            <RankedBars
              data={exposureByLga.map((l) => ({
                label: l.name,
                value: l.atRisk,
                note: `${pct(l.atRisk / (l.total || 1))} of its 2023 vote`,
                color: '#d03b3b',
              }))}
              valueFormat={(n) => `${(n / 1000).toFixed(1)}k`}
            />
            <p className="mt-3 border-t border-line pt-3 text-xs text-ink-muted">
              The operational chase list. Closing exposure in Ifelodun and Irepodun recovers far
              more ballots per ward chair than equal spending across all seven LGAs.
            </p>
          </Panel>

          <Panel title="Control by federal constituency" note="Share of wards in each state">
            <div className="space-y-4">
              {FEDERAL_CONSTITUENCIES.map((fc) => {
                const analysis = a.constituencies.find((x) => x.id === fc.id)!;
                const votes = fc.lgaCodes.reduce((s, c) => s + (resultFor(c)?.validVotes ?? 0), 0);
                return (
                  <div key={fc.id}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-2">
                      <span className="text-xs text-ink">{fc.name}</span>
                      <span className="figure shrink-0 text-[11px] text-ink-faint">
                        {analysis.wardCount}w · {pct(votes / totalValidVotes)} vote
                      </span>
                    </div>
                    <StackedBar
                      height="h-5"
                      showLabels
                      segments={(Object.keys(RISK_LABELS) as WardControl['risk'][]).map((risk) => ({
                        label: RISK_LABELS[risk],
                        value: analysis.control[risk],
                        color: RISK_COLOR[risk],
                      }))}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-3">
              <Stat
                label="Orphan wards"
                value={a.orphanWards.length}
                tone="warn"
                size="sm"
                sub="no structure, unclaimed"
              />
              <Stat
                label="Claimed by pipeline"
                value={a.pipeline.wardsAtStake}
                tone="bad"
                size="sm"
                sub="recoverable by reconciling"
              />
            </div>
          </Panel>
        </div>

        <Panel
          title="Orphan wards"
          note={`${a.orphanWards.length} — exposed or empty, and nobody in the pipeline carries them`}
        >
          {a.orphanWards.length === 0 ? (
            <p className="text-sm text-ink-muted">Every exposed ward is claimed by someone.</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5">
                {a.orphanWards.map((id) => {
                  const ward = getWard(id);
                  const v = wardVotes.get(id) ?? 0;
                  return (
                    <span
                      key={id}
                      className="flex items-center gap-2 rounded-[3px] border border-line-bright bg-surface-raised px-2 py-1"
                      title={`${ward?.name} — ~${v.toLocaleString('en-NG')} votes (2023 proxy)`}
                    >
                      <span className="text-[11px] text-ink-muted">{ward?.name}</span>
                      <span className="figure text-[10px] text-aggrieved">
                        {(v / 1000).toFixed(1)}k
                      </span>
                    </span>
                  );
                })}
              </div>
              <p className="mt-3 border-t border-line pt-3 text-xs text-ink-muted">
                Reconciliation will not recover these — no stakeholder claims them. They require
                direct LGA appointment before December, not committee negotiation.
              </p>
            </>
          )}
        </Panel>
      </div>
    </>
  );
}
