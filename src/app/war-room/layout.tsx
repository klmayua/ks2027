import Link from 'next/link';

import { BottomNav } from '@/components/bottom-nav';
import { MobileSubRail, SidebarNav } from '@/components/sidebar-nav';
import { campaignConfig, daysUntil, primaryElection } from '@/config/campaign.config';

export default function WarRoomLayout({ children }: { children: React.ReactNode }) {
  const election = primaryElection();
  const days = daysUntil(election.date);

  return (
    <div className="flex min-h-screen">
      {/* Mobile fixed header + 1-tap rail — ZERO hamburger menu */}
      <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-surface/95 backdrop-blur lg:hidden">
        <div className="pdp-bar h-[2px] w-full" />
        <div className="flex items-center justify-between px-4 py-2">
          <Link href="/war-room" className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">
                {campaignConfig.district.code}
              </span>
              <span className="rounded-sm border border-accent/40 bg-accent/10 px-1 py-px text-[8px] font-bold uppercase tracking-[0.1em] text-accent">
                {campaignConfig.principal.partyAbbreviation}
              </span>
              <span className="inline-flex items-center gap-1 rounded-sm border border-accent/30 bg-accent/10 px-1 py-px text-[8px] font-semibold uppercase tracking-[0.08em] text-accent">
                <span className="size-1 rounded-full bg-accent" />
                OSINT
              </span>
            </div>
            <div className="truncate text-xs font-medium text-ink">
              {campaignConfig.principal.shortName} · Kwara South
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {campaignConfig.simulation.enabled && (
              <span className="rounded-sm border border-passive/40 bg-passive/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-passive">
                Sim
              </span>
            )}
            <div className="rounded border border-line bg-surface-raised px-2 py-1 text-right">
              <div className="figure text-xs font-semibold leading-none text-accent">{days}d</div>
              <div className="text-[8px] uppercase leading-tight text-ink-faint">Jan 16</div>
            </div>
          </div>
        </div>
        <MobileSubRail />
      </header>

      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-surface lg:flex">
        <div className="pdp-bar h-[2px] w-full" />
        <div className="border-b border-line px-5 py-4">
          <Link href="/war-room" className="block">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
                {campaignConfig.district.name} 2027
              </span>
              <span className="rounded-sm border border-accent/40 bg-accent/10 px-1.5 py-px text-[9px] font-bold uppercase tracking-[0.12em] text-accent">
                {campaignConfig.principal.partyAbbreviation}
              </span>
            </div>
            <div className="mt-1 text-sm font-medium text-ink">
              {campaignConfig.principal.shortName}
            </div>
            <div className="mt-0.5 text-[11px] text-ink-faint">OSINT &amp; Senatorial War Room</div>
          </Link>
        </div>

        <SidebarNav />

        {campaignConfig.simulation.enabled && (
          <div className="border-t border-line px-5 py-3">
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-passive" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-passive">
                Simulation
              </span>
            </div>
            <p className="mt-1 text-[10px] leading-tight text-ink-faint">
              Kwara South geography is real INEC data. People and activity are generated — seed{' '}
              <span className="figure">{campaignConfig.simulation.seed}</span>.
            </p>
          </div>
        )}

        <div className="border-t border-line px-5 py-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
            Senate poll · no rehearsal
          </div>
          <div className="figure mt-1 text-2xl font-semibold text-accent">{days}</div>
          <div className="text-[11px] text-ink-muted">
            days ·{' '}
            {new Date(`${election.date}T00:00:00Z`).toLocaleDateString('en-NG', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              timeZone: 'UTC',
            })}
          </div>
          <div className="mt-1 text-[10px] leading-tight text-ink-faint">{election.citation}</div>
        </div>
      </aside>

      {/* Top padding clears mobile header + 1-tap sub-rail; bottom padding clears 60px BottomNav */}
      <main className="min-w-0 flex-1 pb-24 pt-[92px] lg:pb-0 lg:pt-0">{children}</main>

      <BottomNav />
    </div>
  );
}
