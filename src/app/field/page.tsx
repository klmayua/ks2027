'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import { Stat } from '@/components/charts';
import { getLga, getWard, pollingUnitsInWard, wardsInLga } from '@/lib/geography';
import { seedDirectives } from '@/lib/simulation/seed-comms';

const DEMO_WARDS = ['05-01', '04-01', '09-01', '13-01'] as const;

type PhoneTab = 'tasks' | 'ward' | 'report' | 'me';

export default function FieldPage() {
  const directives = useMemo(() => seedDirectives(), []);

  const [wardId, setWardId] = useState<string>('05-01');
  const [tab, setTab] = useState<PhoneTab>('tasks');
  const [confirmedIds, setConfirmedIds] = useState<Record<string, boolean>>({});
  const [queuedItems, setQueuedItems] = useState<string[]>([
    'Asset photo — Oke-Ode culvert (offline)',
    'Ward exco check-in (offline)',
    'Youth wing contact list (offline)',
  ]);
  const [reportType, setReportType] = useState<'security' | 'road' | 'rally' | 'agent'>('security');
  const [reportNote, setReportNote] = useState('');

  const ward = getWard(wardId) ?? getWard('05-01')!;
  const lga = getLga(ward.lgaCode)!;
  const lgaWards = wardsInLga(ward.lgaCode);
  const units = pollingUnitsInWard(ward.id);

  const pending = directives.slice(0, 3).filter((d) => !confirmedIds[d.id]);
  const done = [
    ...directives.slice(0, 3).filter((d) => confirmedIds[d.id]),
    ...directives.slice(3, 5),
  ];

  const confirmDirective = (id: string, title: string) => {
    setConfirmedIds((prev) => ({ ...prev, [id]: true }));
    setQueuedItems((prev) => [`Confirmed: ${title.slice(0, 34)}…`, ...prev]);
  };

  const submitQuickReport = () => {
    const label = {
      security: 'Security alert',
      road: 'Road / infrastructure issue',
      rally: 'Mobilisation update',
      agent: 'Polling unit agent update',
    }[reportType];
    setQueuedItems((prev) => [
      `${label}: ${reportNote.trim() || `${ward.name} return`}`,
      ...prev,
    ]);
    setReportNote('');
    setTab('tasks');
  };

  return (
    <div className="min-h-screen bg-ground px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              Field · KS2027 PDP
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
              Interactive ward officer mobile view
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
              Try it directly: switch wards below, tap <strong>Confirm receipt</strong>, browse
              real INEC polling units under <strong>Ward</strong>, or queue an offline report under{' '}
              <strong>Report</strong>.
            </p>
          </div>
          <Link
            href="/war-room"
            className="rounded-lg border border-line bg-surface px-3.5 py-2 text-xs font-medium text-ink-muted hover:border-line-bright hover:text-ink"
          >
            ← Back to war room
          </Link>
        </header>

        {/* Live Kwara South Ward Switcher */}
        <div className="mb-5 flex flex-wrap gap-2">
          {DEMO_WARDS.map((id) => {
            const w = getWard(id);
            const l = w ? getLga(w.lgaCode) : undefined;
            if (!w || !l) return null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setWardId(id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  wardId === id
                    ? 'border-accent/60 bg-accent/15 text-accent'
                    : 'border-line bg-surface text-ink-muted hover:text-ink'
                }`}
              >
                {w.name} <span className="opacity-70">· {l.name}</span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-start gap-6 sm:gap-8">
          {/* Interactive Phone Frame */}
          <div className="mx-auto flex w-full max-w-[360px] shrink-0 flex-col overflow-hidden rounded-2xl border border-line-bright bg-surface shadow-2xl sm:rounded-[28px] sm:border-[6px]">
            <div className="pdp-bar h-[2px] w-full" />
            <div className="flex items-center justify-between bg-surface-raised px-4 py-2 text-[10px] text-ink-faint">
              <span className="figure">09:14</span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-passive" />
                2G · Offline-ready
              </span>
            </div>

            {/* Live Offline Queue Banner */}
            <div className="flex items-center justify-between gap-2 border-b border-passive/30 bg-passive/10 px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="size-2 shrink-0 animate-pulse rounded-full bg-passive" />
                <span className="text-[11px] leading-tight text-passive">
                  <span className="font-semibold">{queuedItems.length} items queued.</span> Saved
                  offline.
                </span>
              </div>
              {queuedItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setQueuedItems([])}
                  className="rounded border border-passive/40 px-1.5 py-0.5 text-[10px] font-semibold text-passive hover:bg-passive/20"
                >
                  Sync now
                </button>
              )}
            </div>

            {/* Identity */}
            <div className="border-b border-line px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                {lga.name} · Kwara South
              </div>
              <div className="mt-0.5 text-lg font-semibold text-ink">{ward.name}</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded-sm bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-accent">
                  PDP Ward Chairman
                </span>
                <span className="figure text-[10px] text-ink-faint">
                  {units.length} enumerated PUs
                </span>
              </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[380px] flex-1 overflow-y-auto">
              {tab === 'tasks' && (
                <>
                  <div className="px-4 py-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                      Needs you ({pending.length})
                    </div>
                    {pending.length === 0 ? (
                      <div className="mt-2 rounded-lg border border-aligned/30 bg-aligned/10 p-3 text-xs text-aligned">
                        All directives confirmed for {ward.name}. Standing updated.
                      </div>
                    ) : (
                      pending.map((d, i) => (
                        <div
                          key={d.id}
                          className="mt-2.5 rounded-lg border border-line bg-surface-raised p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-medium leading-snug text-ink">
                              {d.title}
                            </span>
                            {i === 0 && (
                              <span className="shrink-0 rounded-sm bg-aggrieved/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-aggrieved">
                                Urgent
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                            {d.body.slice(0, 96)}…
                          </p>
                          <div className="mt-1.5 text-[10px] text-ink-faint">
                            {d.issuedByRole} · ref <span className="figure">{d.reference}</span>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => confirmDirective(d.id, d.title)}
                              className="flex-1 rounded-md bg-accent px-3 py-2.5 text-xs font-semibold text-ground transition-all hover:brightness-110 active:scale-[0.98]"
                            >
                              Confirm receipt
                            </button>
                            {d.task && (
                              <button
                                type="button"
                                onClick={() => setTab('report')}
                                className="flex-1 rounded-md border border-line-bright px-3 py-2.5 text-xs font-semibold text-ink hover:border-accent"
                              >
                                {d.task.requiresProof ? 'Take photo' : 'Submit'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="border-t border-line px-4 py-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                      Done this week ({done.length})
                    </div>
                    {done.map((d) => (
                      <div key={d.id} className="mt-2 flex items-start gap-2">
                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-aligned" />
                        <div className="min-w-0">
                          <div className="truncate text-xs text-ink-muted">{d.title}</div>
                          <div className="text-[10px] text-ink-faint">
                            Confirmed · {confirmedIds[d.id] ? 'queued offline' : 'synced'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {tab === 'ward' && (
                <div className="px-4 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                    Polling units in {ward.name} ({units.length})
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {units.map((pu) => (
                      <div
                        key={pu.id}
                        className="rounded-lg border border-line bg-surface-raised px-3 py-2.5"
                      >
                        <div className="text-xs font-medium text-ink">{pu.name}</div>
                        <div className="mt-0.5 flex items-center justify-between text-[10px] text-ink-faint">
                          <span className="figure">PU {pu.id}</span>
                          <span className="text-aligned">Agent assigned</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'report' && (
                <div className="space-y-3 px-4 py-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                    Queue offline ward return
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        ['security', 'Security watch'],
                        ['road', 'Road / PHC photo'],
                        ['rally', 'Canvass return'],
                        ['agent', 'PU agent check'],
                      ] as const
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setReportType(key)}
                        className={`rounded-lg border px-2.5 py-2.5 text-left text-xs font-medium ${
                          reportType === key
                            ? 'border-accent bg-accent/15 text-accent'
                            : 'border-line bg-surface-raised text-ink-muted'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={3}
                    value={reportNote}
                    onChange={(e) => setReportNote(e.target.value)}
                    placeholder={`Short note from ${ward.name}…`}
                    className="w-full rounded-lg border border-line bg-surface-raised p-2.5 text-xs text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={submitQuickReport}
                    className="w-full rounded-lg bg-accent py-2.5 text-xs font-semibold text-ground active:scale-[0.99]"
                  >
                    Save to offline queue
                  </button>
                </div>
              )}

              {tab === 'me' && (
                <div className="space-y-3 px-4 py-3">
                  <div className="rounded-lg border border-line bg-surface-raised p-3">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                      Ward standing in {lga.name}
                    </div>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="figure text-2xl font-semibold text-accent">
                        {Object.keys(confirmedIds).length > 0 ? '1st' : '3rd'}
                      </span>
                      <span className="text-xs text-ink-muted">
                        of {lgaWards.length} wards · {6 + Object.keys(confirmedIds).length} on-time
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-line bg-surface-raised p-3 text-xs">
                    <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                      Queued items ({queuedItems.length})
                    </div>
                    {queuedItems.length === 0 ? (
                      <p className="mt-1.5 text-aligned">Everything synced.</p>
                    ) : (
                      <ul className="mt-1.5 space-y-1 text-ink-muted">
                        {queuedItems.map((item, idx) => (
                          <li key={idx} className="truncate">
                            • {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Phone Bottom Tabs */}
            <nav className="flex border-t border-line bg-surface">
              {(
                [
                  ['tasks', 'Tasks'],
                  ['ward', 'Ward'],
                  ['report', 'Report'],
                  ['me', 'Me'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`flex-1 py-3 text-center text-[11px] font-medium transition-colors ${
                    tab === key
                      ? 'border-t-2 border-accent text-accent'
                      : 'border-t-2 border-transparent text-ink-faint hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="min-w-[280px] flex-1 space-y-4">
            <div className="rounded-lg border border-line bg-surface p-5">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                Why it looks like this
              </h2>
              <dl className="mt-4 space-y-3.5 text-xs leading-relaxed">
                <div>
                  <dt className="font-medium text-ink">The queue banner is always visible</dt>
                  <dd className="mt-0.5 text-ink-muted">
                    Across rural Ifelodun (Oke-Ode, Babanla, Ora), Ekiti (Eruku, Obbo), Isin and
                    Oke-Ero, weak signal is normal. Officers must see immediately that offline work
                    is saved safely until signal returns.
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-ink">No dashboard, no aggregate</dt>
                  <dd className="mt-0.5 text-ink-muted">
                    Ward chairmen see only their ward, their tasks, and their rank inside {lga.name}
                    — never noisy district charts.
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-ink">Two buttons, never a form</dt>
                  <dd className="mt-0.5 text-ink-muted">
                    Confirm receipt is one tap. Across 83 wards, anything heavier stalls under real
                    campaign pressure.
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border border-line bg-surface p-5">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                Budget per officer, per month
              </h2>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <Stat label="Data" value="< 4 MB" size="sm" tone="good" />
                <Stat label="Screens" value="4" size="sm" />
                <Stat label="Taps to confirm" value="1" size="sm" tone="accent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
