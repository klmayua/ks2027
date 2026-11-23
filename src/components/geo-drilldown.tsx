'use client';

import { StackedBar } from '@/components/charts';
import {
  constituencyOfLga,
  getLga,
  getWard,
  pollingUnitsInWard,
  wardsInLga,
} from '@/lib/geography';
import { POST_2021_PUS_BY_LGA } from '@/lib/geography/roll';
import { lgasByWeight } from '@/lib/geography/results-2023';
import { STAGE_LABELS, type Stakeholder } from '@/lib/party/reconciliation';
import {
  ALIGNMENT_LABELS,
  RISK_LABELS,
  type Alignment,
  type RosterEntry,
  type WardControl,
} from '@/lib/party/structure';

export const RISK_COLOR: Record<WardControl['risk'], string> = {
  held: '#16a34a',
  contested: '#fab219',
  exposed: '#d03b3b',
  vacant: '#4a5163',
};

export const RISK_BADGE: Record<WardControl['risk'], string> = {
  held: 'border-aligned/40 bg-aligned/10 text-aligned',
  contested: 'border-passive/40 bg-passive/10 text-passive',
  exposed: 'border-aggrieved/40 bg-aggrieved/10 text-aggrieved',
  vacant: 'border-line-bright bg-surface-raised text-ink-faint',
};

const ALIGNMENT_BADGE: Record<Alignment, string> = {
  aligned: 'border-aligned/40 bg-aligned/10 text-aligned',
  reconciled: 'border-reconciled/40 bg-reconciled/10 text-reconciled',
  passive: 'border-passive/40 bg-passive/10 text-passive',
  aggrieved: 'border-aggrieved/40 bg-aggrieved/10 text-aggrieved',
  unknown: 'border-line-bright text-ink-faint',
};

const pct = (n: number, dp = 1) => `${(n * 100).toFixed(dp)}%`;

export function LgaDrawerBody({
  lgaCode,
  wardControl,
  stakeholders,
  onSelectWard,
}: {
  lgaCode: string;
  wardControl: Map<string, WardControl>;
  stakeholders: Stakeholder[];
  onSelectWard: (wardId: string) => void;
}) {
  const lga = getLga(lgaCode);
  const weight = lgasByWeight().find((x) => x.lgaCode === lgaCode);
  const fc = constituencyOfLga(lgaCode);
  const lgaWards = wardsInLga(lgaCode)
    .slice()
    .sort((a, b) => b.declaredPollingUnitCount - a.declaredPollingUnitCount);

  if (!lga || !weight) return null;

  const currentPus = POST_2021_PUS_BY_LGA[lga.code] ?? lga.declaredPollingUnitCount;
  const addedPus = currentPus - lga.declaredPollingUnitCount;
  const controlCounts = { held: 0, contested: 0, exposed: 0, vacant: 0 };
  for (const w of lgaWards) {
    const r = wardControl.get(w.id)?.risk;
    if (r) controlCounts[r] += 1;
  }

  const lgaStakeholders = stakeholders.filter(
    (s) => s.lgaCode === lgaCode && s.stage !== 'reconciled' && s.stage !== 'refused'
  );

  return (
    <div className="space-y-5">
      {/* Meta badges */}
      <div className="flex flex-wrap gap-2">
        <span className="rounded border border-line bg-surface-raised px-2 py-0.5 text-[11px] text-ink-muted">
          INEC Code <span className="figure text-ink">{lga.code}</span>
        </span>
        {fc && (
          <span className="rounded border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] text-accent">
            {fc.shortName}
          </span>
        )}
        <span className="rounded border border-line bg-surface-raised px-2 py-0.5 text-[11px] text-ink-muted">
          Allocation gap:{' '}
          <span className={`figure ${weight.gapPoints >= 0 ? 'text-accent' : 'text-aggrieved'}`}>
            {weight.gapPoints >= 0 ? '+' : ''}
            {weight.gapPoints.toFixed(1)}pt
          </span>
        </span>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-lg border border-line bg-surface-raised p-3">
          <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">2023 Votes</div>
          <div className="figure mt-1 text-lg font-semibold text-ink">
            {weight.validVotes.toLocaleString('en-NG')}
          </div>
          <div className="text-[10px] text-ink-muted">{pct(weight.voteShare)} of district</div>
        </div>
        <div className="rounded-lg border border-line bg-surface-raised p-3">
          <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Turnout</div>
          <div className="figure mt-1 text-lg font-semibold text-passive">
            {pct(weight.turnout)}
          </div>
          <div className="text-[10px] text-ink-muted">
            ~{(weight.registered / 1000).toFixed(0)}k voters
          </div>
        </div>
        <div className="rounded-lg border border-line bg-surface-raised p-3">
          <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Polling units</div>
          <div className="figure mt-1 text-lg font-semibold text-ink">{currentPus}</div>
          <div className="text-[10px] text-ink-muted">
            {lga.declaredPollingUnitCount} + {addedPus} (2021)
          </div>
        </div>
        <div className="rounded-lg border border-line bg-surface-raised p-3">
          <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Open cases</div>
          <div className="figure mt-1 text-lg font-semibold text-aggrieved">
            {lgaStakeholders.length}
          </div>
          <div className="text-[10px] text-ink-muted">in pipeline</div>
        </div>
      </div>

      {/* 2023 party split */}
      <div className="rounded-lg border border-line bg-surface-raised p-3.5">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            2023 per-LGA proxy split
          </span>
          <span className="figure text-[11px] text-ink-muted">
            PDP {weight.pdp.toLocaleString('en-NG')} · APC {weight.apc.toLocaleString('en-NG')} ·
            SDP {weight.sdp.toLocaleString('en-NG')}
          </span>
        </div>
        <StackedBar
          showLabels
          height="h-6"
          segments={[
            { label: 'PDP', value: weight.pdp, color: '#199e70' },
            { label: 'SDP', value: weight.sdp, color: '#d95926' },
            { label: 'APC', value: weight.apc, color: '#3987e5' },
            { label: 'Others', value: weight.others, color: '#64748b' },
          ]}
        />
      </div>

      {/* Ward control summary */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
            Wards in {lga.name} ({lgaWards.length})
          </h3>
          <span className="text-[11px] text-ink-faint">Tap any ward to inspect roster &amp; PUs</span>
        </div>
        <div className="mb-3">
          <StackedBar
            height="h-3"
            segments={(Object.keys(RISK_LABELS) as WardControl['risk'][]).map((risk) => ({
              label: RISK_LABELS[risk],
              value: controlCounts[risk],
              color: RISK_COLOR[risk],
            }))}
          />
        </div>

        <div className="space-y-1.5">
          {lgaWards.map((w) => {
            const c = wardControl.get(w.id);
            const risk = c?.risk ?? 'vacant';
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => onSelectWard(w.id)}
                className="group flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-surface-raised px-3.5 py-3 text-left transition-colors hover:border-line-bright hover:bg-ground/60 active:scale-[0.995]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-ink">{w.name}</span>
                    <span className="figure text-[10px] text-ink-faint">{w.id}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-ink-muted">
                    {w.declaredPollingUnitCount} enumerated PUs · {c?.filledSeats ?? 0}/
                    {c?.loadBearingSeats ?? 5} load-bearing seats ·{' '}
                    {Math.round((c?.effectiveControl ?? 0) * 100)}% control
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-sm border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${RISK_BADGE[risk]}`}
                  >
                    {RISK_LABELS[risk]}
                  </span>
                  <span className="text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent">
                    ›
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function WardDrawerBody({
  wardId,
  entries,
  control,
  stakeholders,
  onCycleAlignment,
}: {
  wardId: string;
  entries: RosterEntry[];
  control: WardControl;
  stakeholders: Stakeholder[];
  onCycleAlignment?: (appointmentId: string) => void;
}) {
  const ward = getWard(wardId);
  const lga = ward ? getLga(ward.lgaCode) : undefined;
  const units = pollingUnitsInWard(wardId);

  const wardEntries = entries
    .filter((e) => e.appointment.scope.level === 'ward' && e.appointment.scope.wardId === wardId)
    .sort((a, b) => a.position.rank - b.position.rank);

  const claiming = stakeholders.filter((s) => s.carriesWardIds.includes(wardId));

  if (!ward) return null;

  return (
    <div className="space-y-5">
      {/* Top status strip */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-lg border border-line bg-surface-raised p-3">
          <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Status</div>
          <div className="mt-1.5">
            <span
              className={`inline-block rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${RISK_BADGE[control.risk]}`}
            >
              {RISK_LABELS[control.risk]}
            </span>
          </div>
        </div>
        <div className="rounded-lg border border-line bg-surface-raised p-3">
          <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Control</div>
          <div className="figure mt-1 text-lg font-semibold text-ink">
            {Math.round(control.effectiveControl * 100)}%
          </div>
          <div className="text-[10px] text-ink-muted">
            {control.filledSeats}/{control.loadBearingSeats} core seats
          </div>
        </div>
        <div className="rounded-lg border border-line bg-surface-raised p-3">
          <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">Polling units</div>
          <div className="figure mt-1 text-lg font-semibold text-ink">{units.length}</div>
          <div className="text-[10px] text-ink-muted">{lga?.name} · {ward.id}</div>
        </div>
      </div>

      {/* Ward executive roster */}
      <div>
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
            Ward executive roster ({wardEntries.length})
          </h3>
          {onCycleAlignment && (
            <span className="text-[10px] text-accent">Tap alignment chip to simulate update</span>
          )}
        </div>
        {wardEntries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line-bright p-4 text-xs text-ink-muted">
            No filled ward executive positions recorded. Requires direct LGA appointment.
          </div>
        ) : (
          <div className="space-y-2">
            {wardEntries.map((e) => (
              <div
                key={e.appointment.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface-raised px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">{e.person.name}</span>
                    {e.position.loadBearing && (
                      <span className="rounded bg-line px-1 py-px text-[9px] uppercase tracking-[0.08em] text-ink-muted">
                        Core
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
                    <span>{e.position.title}</span>
                    {e.person.phone && (
                      <a
                        href={`tel:${e.person.phone}`}
                        className="figure text-accent underline underline-offset-2 hover:text-ink"
                      >
                        {e.person.phone}
                      </a>
                    )}
                  </div>
                </div>
                {onCycleAlignment ? (
                  <button
                    type="button"
                    onClick={() => onCycleAlignment(e.appointment.id)}
                    title="Click to simulate alignment change"
                    className={`rounded-sm border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] transition-opacity hover:opacity-80 ${ALIGNMENT_BADGE[e.appointment.alignment]}`}
                  >
                    {ALIGNMENT_LABELS[e.appointment.alignment]} ↻
                  </button>
                ) : (
                  <span
                    className={`rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${ALIGNMENT_BADGE[e.appointment.alignment]}`}
                  >
                    {ALIGNMENT_LABELS[e.appointment.alignment]}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stakeholders carrying this ward */}
      <div>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
          Reconciliation stakeholders carrying this ward ({claiming.length})
        </h3>
        {claiming.length === 0 ? (
          <p className="text-xs text-ink-faint">No active stakeholder in the pipeline claims this ward.</p>
        ) : (
          <div className="space-y-1.5">
            {claiming.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface-raised px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-xs font-medium text-ink">{s.name}</div>
                  <div className="text-[11px] text-ink-faint">
                    {s.bloc ?? 'Independent'} · carries {s.carriesWardIds.length} wards
                  </div>
                </div>
                <span className="rounded border border-line-bright px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-ink-muted">
                  {STAGE_LABELS[s.stage]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Real INEC polling units */}
      <div>
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
          Enumerated INEC polling units ({units.length})
        </h3>
        <div className="divide-y divide-line rounded-lg border border-line bg-surface-raised">
          {units.map((pu) => (
            <div key={pu.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
              <span className="text-xs text-ink">{pu.name}</span>
              <span className="figure shrink-0 text-[10px] text-ink-faint">{pu.id}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
