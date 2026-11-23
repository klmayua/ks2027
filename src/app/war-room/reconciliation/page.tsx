import { PageHeader, Panel } from '@/components/shell';
import { FEDERAL_CONSTITUENCIES, getLga } from '@/lib/geography';
import {
  ASK_LABELS,
  KIND_LABELS,
  STAGE_LABELS,
  STAGE_ORDER,
  byPriority,
  daysSinceContact,
  reconciliationWeight,
  stalled,
  summarise,
  type ReconciliationStage,
  type Stakeholder,
} from '@/lib/party/reconciliation';
import { seedStakeholders } from '@/lib/simulation/seed';

const STAGE_TONE: Record<ReconciliationStage, string> = {
  identified: 'border-unknown/40 text-unknown',
  assigned: 'border-unknown/40 text-ink-muted',
  engaged: 'border-reconciled/40 text-reconciled',
  ask_tabled: 'border-passive/40 text-passive',
  agreed: 'border-aligned/40 text-aligned',
  reconciled: 'border-aligned/60 bg-aligned/10 text-aligned',
  refused: 'border-aggrieved/50 bg-aggrieved/10 text-aggrieved',
};

function StageChip({ stage }: { stage: ReconciliationStage }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-sm border px-1.5 py-px text-[10px] font-medium uppercase tracking-[0.1em] ${STAGE_TONE[stage]}`}
    >
      {STAGE_LABELS[stage]}
    </span>
  );
}

function StakeholderRow({ s, rank }: { s: Stakeholder; rank: number }) {
  const days = daysSinceContact(s);
  const lga = getLga(s.lgaCode);
  const fc = FEDERAL_CONSTITUENCIES.find((x) => x.id === s.constituencyId);
  const cold = days === null || days >= 14;
  const open = s.stage !== 'reconciled' && s.stage !== 'refused';

  return (
    <tr className="align-top">
      <td className="figure py-3 pr-3 text-xs text-ink-faint">{rank}</td>
      <td className="py-3 pr-3">
        <div className="text-sm text-ink">{s.name}</div>
        <div className="mt-0.5 text-[11px] text-ink-faint">
          {KIND_LABELS[s.kind]}
          {s.bloc && <span className="ml-1.5 text-aggrieved">· {s.bloc}</span>}
        </div>
      </td>
      <td className="py-3 pr-3 text-xs text-ink-muted">
        {lga?.name}
        <div className="text-[11px] text-ink-faint">{fc?.shortName}</div>
      </td>
      <td className="py-3 pr-3">
        <StageChip stage={s.stage} />
      </td>
      <td className="py-3 pr-3 text-xs text-ink-muted">
        {ASK_LABELS[s.ask]}
        {s.askDetail && <div className="text-[11px] text-ink-faint">{s.askDetail}</div>}
      </td>
      <td className="figure py-3 pr-3 text-right text-sm text-ink">{s.carriesWardIds.length}</td>
      <td className="figure py-3 pr-3 text-right text-sm text-ink-muted">
        {reconciliationWeight(s).toFixed(1)}
      </td>
      <td className="py-3 pr-3 text-right">
        {days === null ? (
          <span className="text-[11px] text-aggrieved">no contact</span>
        ) : (
          <span className={`figure text-sm ${open && cold ? 'text-passive' : 'text-ink-muted'}`}>
            {days}d
          </span>
        )}
      </td>
      <td className="py-3 text-xs text-ink-faint">{s.handlerId ?? '—'}</td>
    </tr>
  );
}

export default function ReconciliationPage() {
  const stakeholders = seedStakeholders();
  const summary = summarise(stakeholders);
  const ranked = byPriority(stakeholders);
  const cold = stalled(stakeholders);

  return (
    <>
      <PageHeader
        eyebrow="Reconciliation · PDP & SDP Reunification"
        title="Unifying Kwara South behind one Senate ticket"
        lede="Closing the 21,016-vote 2023 gap depends on harmonising legacy PDP ward officers, returning 2023 SDP structures, and Igbomina–Ekiti caucuses before 16 January 2027. Every stakeholder is tracked by named handler, recorded ask, and the exact wards they carry."
        aside={
          <div className="grid grid-cols-3 gap-4 rounded border border-line bg-surface-raised px-4 py-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Open</div>
              <div className="figure text-xl font-semibold text-ink">
                {summary.total - summary.byStage.reconciled - summary.byStage.refused}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">At stake</div>
              <div className="figure text-xl font-semibold text-aggrieved">
                {summary.wardsAtStake}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Stalled</div>
              <div className="figure text-xl font-semibold text-passive">
                {summary.stalledCount}
              </div>
            </div>
          </div>
        }
      />

      <div className="space-y-4 p-4 sm:p-6 lg:p-8">
        <Panel title="Pipeline" note={`${summary.total} stakeholders across 7 LGAs`}>
          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-7">
            {[...STAGE_ORDER, 'refused' as const].map((stage) => (
              <div
                key={stage}
                className="rounded border border-line bg-surface-raised px-3 py-2.5"
              >
                <div className="text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                  {STAGE_LABELS[stage]}
                </div>
                <div className="figure mt-1 text-2xl font-semibold text-ink">
                  {summary.byStage[stage]}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {cold.length > 0 && (
          <Panel
            title="Going cold"
            note="Open cases with no contact in 14 days, heaviest first"
          >
            <div className="flex flex-wrap gap-2">
              {cold.slice(0, 12).map((s) => {
                const days = daysSinceContact(s);
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 rounded border border-passive/30 bg-passive/5 px-2.5 py-1.5"
                  >
                    <span className="text-xs text-ink">{s.name}</span>
                    <span className="figure text-[11px] text-passive">
                      {days === null ? 'never' : `${days}d`}
                    </span>
                    <span className="figure text-[11px] text-ink-faint">
                      {s.carriesWardIds.length}w
                    </span>
                  </div>
                );
              })}
              {cold.length > 12 && (
                <span className="self-center text-[11px] text-ink-faint">
                  +{cold.length - 12} more
                </span>
              )}
            </div>
            <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-ink-muted">
              With fewer than eight weeks to 16 January, a stakeholder carrying four Ifelodun or
              Irepodun wards going quiet for a fortnight costs more than a week of rallies.
            </p>
          </Panel>
        )}

        <Panel
          title="By recovery weight"
          note="Wards carried, scaled by standing — not by who is loudest"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-line text-left text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                  <th className="pb-2 pr-3 font-medium">#</th>
                  <th className="pb-2 pr-3 font-medium">Stakeholder</th>
                  <th className="pb-2 pr-3 font-medium">Base</th>
                  <th className="pb-2 pr-3 font-medium">Stage</th>
                  <th className="pb-2 pr-3 font-medium">Ask</th>
                  <th className="pb-2 pr-3 text-right font-medium">Wards</th>
                  <th className="pb-2 pr-3 text-right font-medium">Weight</th>
                  <th className="pb-2 pr-3 text-right font-medium">Last contact</th>
                  <th className="pb-2 font-medium">Handler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ranked.slice(0, 40).map((s, i) => (
                  <StakeholderRow key={s.id} s={s} rank={i + 1} />
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-ink-muted">
            Showing the top {Math.min(40, ranked.length)} of {ranked.length}. Weight is wards
            carried × a standing multiplier, keeping committee time on load-bearing ward blocs.
          </p>
        </Panel>
      </div>
    </>
  );
}
