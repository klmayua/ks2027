import Link from 'next/link';

import { Stat } from '@/components/charts';
import { getLga, getWard, pollingUnitsInWard, wardsInLga } from '@/lib/geography';
import { seedDirectives } from '@/lib/simulation/seed-comms';

/**
 * The field experience — a Kwara South PDP ward officer on a phone.
 *
 * Built to opposite constraints from the war room: one column, large touch targets, text before
 * graphics, and offline-first by default for rural wards across Ifelodun, Ekiti, Isin and Oke-Ero.
 */

const WARD_ID = '05-01'; // Oke-Ode I, Ifelodun — key rural ward with low 2023 turnout & patchy signal.

export default function FieldPage() {
  const ward = getWard(WARD_ID)!;
  const lga = getLga(ward.lgaCode)!;
  const lgaWards = wardsInLga(ward.lgaCode);
  const units = pollingUnitsInWard(WARD_ID);
  const directives = seedDirectives();

  const pending = directives.slice(0, 2);
  const done = directives.slice(2, 4);

  return (
    <div className="min-h-screen bg-ground px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
              Field · KS2027 PDP
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
              What a Kwara South ward officer sees
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
              Built to the opposite constraints from the war room: one column, large targets, text
              before graphics, and no assumption of a network. Nothing on this screen aggregates — a
              ward chairman in Oke-Ode needs to know what is being asked of them today, not how the
              entire district is trending.
            </p>
          </div>
          <Link
            href="/war-room"
            className="rounded border border-line bg-surface px-3 py-1.5 text-xs text-ink-muted hover:border-line-bright hover:text-ink"
          >
            ← Back to war room
          </Link>
        </header>

        <div className="flex flex-wrap items-start gap-6 sm:gap-8">
          {/* Phone frame */}
          <div className="mx-auto w-full max-w-[340px] shrink-0 overflow-hidden rounded-none border-0 bg-surface sm:rounded-[28px] sm:border-[6px] sm:border-line-bright sm:shadow-2xl">
            <div className="pdp-bar h-[2px] w-full" />
            <div className="flex items-center justify-between bg-surface-raised px-4 py-2 text-[10px] text-ink-faint">
              <span className="figure">09:14</span>
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-passive" />
                2G
              </span>
            </div>

            <div className="flex items-center gap-2 border-b border-passive/30 bg-passive/10 px-4 py-2">
              <span className="size-2 shrink-0 animate-pulse rounded-full bg-passive" />
              <span className="text-[11px] leading-tight text-passive">
                <span className="font-semibold">3 items queued.</span> They will send when you have
                signal. Keep working.
              </span>
            </div>

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

            <div className="px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                Needs you
              </div>

              {pending.map((d, i) => (
                <div
                  key={d.id}
                  className="mt-2.5 rounded-lg border border-line bg-surface-raised p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium leading-snug text-ink">{d.title}</span>
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
                      className="flex-1 rounded-md bg-accent px-3 py-2.5 text-xs font-semibold text-ground"
                    >
                      Confirm receipt
                    </button>
                    {d.task && (
                      <button
                        type="button"
                        className="flex-1 rounded-md border border-line-bright px-3 py-2.5 text-xs font-semibold text-ink"
                      >
                        {d.task.requiresProof ? 'Take photo' : 'Submit'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-line px-4 py-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                Done this week
              </div>
              {done.map((d) => (
                <div key={d.id} className="mt-2 flex items-start gap-2">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-aligned" />
                  <div className="min-w-0">
                    <div className="truncate text-xs text-ink-muted">{d.title}</div>
                    <div className="text-[10px] text-ink-faint">Confirmed · synced</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-line bg-surface-raised px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.12em] text-ink-faint">
                    Your ward this month
                  </div>
                  <div className="mt-0.5 text-xs text-ink">
                    <span className="figure font-semibold text-aligned">6 of 7</span> returns on
                    time
                  </div>
                </div>
                <div className="text-right">
                  <div className="figure text-lg font-semibold text-accent">3rd</div>
                  <div className="text-[10px] text-ink-faint">
                    of {lgaWards.length} in {lga.name}
                  </div>
                </div>
              </div>
            </div>

            <nav className="flex border-t border-line">
              {['Tasks', 'Ward', 'Report', 'Me'].map((t, i) => (
                <span
                  key={t}
                  className={`flex-1 py-3 text-center text-[11px] ${
                    i === 0 ? 'border-t-2 border-accent text-accent' : 'text-ink-faint'
                  }`}
                >
                  {t}
                </span>
              ))}
            </nav>
          </div>

          <div className="min-w-[280px] flex-1 space-y-4">
            <div className="rounded border border-line bg-surface p-5">
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
                    Showing a ward officer district totals invites them to feel like a data point.
                    They see their ward, their tasks, and their standing in {lga.name}.
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-ink">Standing is on the first screen</dt>
                  <dd className="mt-0.5 text-ink-muted">
                    Rank within the LGA&rsquo;s wards costs nothing and keeps ward chairmen opening
                    the app every week through 16 January 2027.
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

            <div className="rounded border border-line bg-surface p-5">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                Budget per officer, per month
              </h2>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <Stat label="Data" value="< 4 MB" size="sm" tone="good" />
                <Stat label="Screens" value="4" size="sm" />
                <Stat label="Taps to confirm" value="1" size="sm" tone="accent" />
              </div>
              <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-ink-muted">
                Text-first, compressed EC8A and asset photos, no video, no background drain. A ward
                officer never has to choose between the app and their airtime.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
