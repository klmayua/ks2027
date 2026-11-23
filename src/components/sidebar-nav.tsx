'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavSection {
  group: string;
  items: { href: string; label: string; badge: string; highlight?: boolean }[];
}

export const WAR_ROOM_SECTIONS: NavSection[] = [
  {
    group: 'Intelligence',
    items: [
      { href: '/war-room', label: 'Overview', badge: 'M1' },
      { href: '/war-room/narrative', label: 'OSINT & Narrative', badge: 'LIVE', highlight: true },
    ],
  },
  {
    group: 'Structure',
    items: [
      { href: '/war-room/structure', label: 'Power map', badge: 'M1' },
      { href: '/war-room/reconciliation', label: 'Reconciliation', badge: 'M1' },
    ],
  },
  {
    group: 'Operations',
    items: [
      { href: '/war-room/comms', label: 'Directives', badge: 'M2' },
      { href: '/war-room/election-day', label: 'Election day', badge: 'M4' },
      { href: '/field', label: 'Ward officer view', badge: 'M2' },
    ],
  },
  {
    group: 'Public',
    items: [
      { href: '/ledger', label: 'Public ledger', badge: 'M5' },
      { href: '/ledger/results', label: 'Public results', badge: 'M5' },
    ],
  },
];

const MOBILE_RAIL: { href: string; label: string }[] = [
  { href: '/war-room/narrative', label: 'OSINT' },
  { href: '/war-room/comms', label: 'Directives' },
  { href: '/field', label: 'Field View' },
  { href: '/ledger', label: 'Public Ledger' },
  { href: '/ledger/results', label: 'Results' },
];

/**
 * Direct 1-tap mobile sub-rail under the header — ZERO hamburger, ZERO hidden drawers.
 */
export function MobileSubRail() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-t border-line bg-ground/90 px-3 py-1.5 lg:hidden">
      {MOBILE_RAIL.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
              active
                ? 'border-accent/60 bg-accent/15 text-accent'
                : 'border-line bg-surface text-ink-muted hover:text-ink'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="War room navigation">
      {WAR_ROOM_SECTIONS.map((section) => (
        <div key={section.group} className="mb-5">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            {section.group}
          </div>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors ${
                      active
                        ? 'border-accent/40 bg-accent/10 font-medium text-ink'
                        : 'border-transparent text-ink-muted hover:bg-surface-raised hover:text-ink'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {active && <span className="size-1.5 rounded-full bg-accent" />}
                      {item.label}
                    </span>
                    <span
                      className={`figure text-[10px] ${
                        item.highlight
                          ? 'rounded bg-accent/15 px-1.5 py-px font-semibold text-accent'
                          : active
                            ? 'text-accent'
                            : 'text-ink-faint'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
