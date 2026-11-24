'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { DetailDrawer } from '@/components/detail-drawer';
import {
  HORIZON_LABELS,
  buildUrgentActions,
  type ActionHorizon,
  type UrgentActionItem,
} from '@/lib/war-room/urgent-actions';

type ActionStatus = 'open' | 'in_motion' | 'done';

const STATUS_META: Record<ActionStatus, { label: string; style: string; next: ActionStatus }> = {
  open: {
    label: 'Open',
    style: 'border-aggrieved/45 bg-aggrieved/10 text-aggrieved',
    next: 'in_motion',
  },
  in_motion: {
    label: 'In Motion',
    style: 'border-passive/50 bg-passive/15 text-passive',
    next: 'done',
  },
  done: {
    label: 'Done ✓',
    style: 'border-aligned/50 bg-aligned/15 text-aligned',
    next: 'open',
  },
};

const IMPACT_STYLE: Record<UrgentActionItem['impactTone'], string> = {
  good: 'bg-aligned/15 text-aligned border-aligned/40',
  bad: 'bg-aggrieved/15 text-aggrieved border-aggrieved/40',
  warn: 'bg-passive/15 text-passive border-passive/40',
  accent: 'bg-accent/15 text-accent border-accent/40',
};

export function UrgentActionBoard() {
  const items = useMemo(() => buildUrgentActions(), []);
  const [horizonFilter, setHorizonFilter] = useState<'all' | ActionHorizon>('all');
  const [statuses, setStatuses] = useState<Record<string, ActionStatus>>({});
  const [activeItem, setActiveItem] = useState<UrgentActionItem | null>(null);

  const getStatus = (id: string): ActionStatus => statuses[id] ?? 'open';

  const cycleStatus = (id: string) => {
    setStatuses((prev) => {
      const cur = prev[id] ?? 'open';
      return { ...prev, [id]: STATUS_META[cur].next };
    });
  };

  const setStatus = (id: string, next: ActionStatus) => {
    setStatuses((prev) => ({ ...prev, [id]: next }));
  };

  const visible = items.filter((item) =>
    horizonFilter === 'all' ? true : item.horizon === horizonFilter
  );

  const nowCount = items.filter((i) => i.horizon === 'now_24h').length;
  const weekCount = items.filter((i) => i.horizon === 'this_week').length;
  const pollCount = items.filter((i) => i.horizon === 'lock_poll_day').length;
  const activeCount = items.filter((i) => getStatus(i.id) !== 'open').length;

  return (
    <>
      <section className="rounded-lg border border-aggrieved/40 bg-surface p-4 sm:p-5">
        {/* Header Row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded bg-aggrieved/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-aggrieved">
                <span className="size-1.5 animate-pulse rounded-full bg-aggrieved" />
                Act Now · Urgent Actions Against Realities
              </span>
              <span className="figure rounded bg-surface-raised px-2 py-0.5 text-[10px] font-semibold text-ink-muted">
                {activeCount}/{items.length} in motion or done
              </span>
            </div>
            <h2 className="mt-2 text-base font-semibold text-ink sm:text-lg">
              What is hitting Kwara South today — and what MUST be executed right now
            </h2>
            <p className="mt-0.5 text-xs text-ink-muted">
              Each card pairs a verified 2025–2026 reality with the exact counter-action, vote impact, and 1-tap execution desk.
            </p>
          </div>

          <Link
            href="/war-room/predict"
            className="shrink-0 self-start rounded-md border border-accent/50 bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/25"
          >
            Full Predictive Proof →
          </Link>
        </div>

        {/* Horizon Filter Pills */}
        <div className="-mx-4 mt-3.5 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {(
            [
              ['all', `All Urgent (${items.length})`],
              ['now_24h', `Now · 2–24h (${nowCount})`],
              ['this_week', `This Week · Ground (${weekCount})`],
              ['lock_poll_day', `Lock 907 PUs (${pollCount})`],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setHorizonFilter(id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                horizonFilter === id
                  ? 'border-accent bg-accent text-ground'
                  : 'border-line bg-surface-raised text-ink-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Reality -> Act Now Cards */}
        <div className="mt-3.5 grid gap-3 lg:grid-cols-2">
          {visible.map((item) => {
            const st = getStatus(item.id);
            const stMeta = STATUS_META[st];
            const isDone = st === 'done';

            return (
              <div
                key={item.id}
                className={`flex flex-col justify-between rounded-lg border p-3.5 transition-all ${
                  isDone
                    ? 'border-aligned/35 bg-aligned/[0.04] opacity-80'
                    : item.horizon === 'now_24h'
                      ? 'border-aggrieved/35 bg-ground/60'
                      : 'border-line bg-ground/60 hover:border-line-bright'
                }`}
              >
                <div>
                  {/* Top metadata line */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.11em] text-ink-faint">
                      {item.realityTag}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`figure rounded border px-2 py-0.5 text-[10px] font-bold ${IMPACT_STYLE[item.impactTone]}`}
                      >
                        {item.impactLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() => cycleStatus(item.id)}
                        title="Tap to cycle status: Open → In Motion → Done"
                        className={`rounded border px-2 py-0.5 text-[10px] font-bold transition-colors ${stMeta.style}`}
                      >
                        {stMeta.label}
                      </button>
                    </div>
                  </div>

                  {/* Reality Block */}
                  <div className="mt-2.5 rounded-md border border-aggrieved/25 bg-aggrieved/[0.05] px-2.5 py-2">
                    <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-aggrieved">
                      Reality Today
                    </span>
                    <p className="mt-0.5 text-xs leading-snug text-ink-muted">{item.reality}</p>
                  </div>

                  {/* Action Now Block */}
                  <div className="mt-2 rounded-md border border-aligned/30 bg-aligned/[0.06] px-2.5 py-2">
                    <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-aligned">
                      Action Required Now
                    </span>
                    <p className="mt-0.5 text-xs font-semibold leading-snug text-ink">
                      {item.actionNow}
                    </p>
                  </div>
                </div>

                {/* Footer: Owner/Deadline + Brief Drawer + Direct Execute CTA */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2.5">
                  <div className="min-w-0 text-[10px] text-ink-faint">
                    <div className="truncate font-medium text-ink-muted">{item.owner}</div>
                    <div>
                      {item.deadline} · {HORIZON_LABELS[item.horizon]}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveItem(item)}
                      className="rounded-md border border-line-bright bg-surface px-2.5 py-1.5 text-[11px] font-medium text-ink hover:border-accent/50"
                    >
                      Steps ›
                    </button>
                    <Link
                      href={item.executeHref}
                      className="rounded-md bg-accent px-2.5 py-1.5 text-[11px] font-semibold text-ground hover:opacity-90"
                    >
                      Execute →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Deep-Dive Action Brief Drawer */}
      <DetailDrawer
        open={activeItem !== null}
        onClose={() => setActiveItem(null)}
        eyebrow={activeItem ? `${HORIZON_LABELS[activeItem.horizon]} · ${activeItem.realityTag}` : ''}
        title={activeItem?.actionNow ?? ''}
      >
        {activeItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-md border border-line bg-surface-raised p-3">
                <div className="text-[10px] uppercase text-ink-faint">Impact / SLA</div>
                <div className="figure mt-1 text-base font-bold text-aligned">
                  {activeItem.impactLabel}
                </div>
                <div className="mt-0.5 text-[10px] text-ink-muted">{activeItem.targetArea}</div>
              </div>
              <div className="rounded-md border border-line bg-surface-raised p-3">
                <div className="text-[10px] uppercase text-ink-faint">Owner & Deadline</div>
                <div className="mt-1 text-xs font-semibold text-ink">{activeItem.owner}</div>
                <div className="mt-0.5 text-[11px] text-passive">{activeItem.deadline}</div>
              </div>
            </div>

            {/* Status Switcher */}
            <div className="rounded-md border border-line bg-ground/70 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                War-Room Execution Status
              </div>
              <div className="mt-2 flex gap-1.5">
                {(['open', 'in_motion', 'done'] as ActionStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(activeItem.id, s)}
                    className={`flex-1 rounded-md border py-1.5 text-xs font-semibold transition-colors ${
                      getStatus(activeItem.id) === s
                        ? STATUS_META[s].style
                        : 'border-line bg-surface text-ink-muted hover:text-ink'
                    }`}
                  >
                    {STATUS_META[s].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-aggrieved/35 bg-aggrieved/[0.06] p-3.5 text-xs">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-aggrieved">
                Verified Current Reality
              </div>
              <p className="mt-1 leading-relaxed text-ink">{activeItem.reality}</p>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                Exact Execution Checklist
              </h4>
              <ul className="mt-2 space-y-2">
                {activeItem.steps.map((step, idx) => (
                  <li
                    key={idx}
                    className="flex gap-2.5 rounded-md border border-line bg-surface-raised/60 p-2.5 text-xs text-ink"
                  >
                    <span className="figure font-bold text-accent">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-md border border-passive/40 bg-passive/[0.07] p-3 text-xs">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-passive">
                Cost of Inaction
              </div>
              <p className="mt-1 text-ink-muted">{activeItem.costOfInaction}</p>
            </div>

            <Link
              href={activeItem.executeHref}
              onClick={() => setActiveItem(null)}
              className="block w-full rounded-md bg-accent px-4 py-2.5 text-center text-xs font-semibold text-ground hover:opacity-90"
            >
              {activeItem.executeLabel} →
            </Link>
          </div>
        )}
      </DetailDrawer>
    </>
  );
}
