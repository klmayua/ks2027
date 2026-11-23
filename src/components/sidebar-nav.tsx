'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavSection {
  group: string;
  items: { href: string; label: string; milestone: string }[];
}

export const WAR_ROOM_SECTIONS: NavSection[] = [
  {
    group: 'Structure',
    items: [
      { href: '/war-room', label: 'Overview', milestone: 'M1' },
      { href: '/war-room/structure', label: 'Power map', milestone: 'M1' },
      { href: '/war-room/reconciliation', label: 'Reconciliation', milestone: 'M1' },
    ],
  },
  {
    group: 'Operations',
    items: [
      { href: '/war-room/comms', label: 'Directives', milestone: 'M2' },
      { href: '/war-room/narrative', label: 'Narrative & OSINT', milestone: 'M3' },
      { href: '/war-room/election-day', label: 'Election day', milestone: 'M4' },
    ],
  },
  {
    group: 'Field',
    items: [{ href: '/field', label: 'Ward officer view', milestone: 'M2' }],
  },
  {
    group: 'Public',
    items: [
      { href: '/ledger', label: 'Public ledger', milestone: 'M5' },
      { href: '/ledger/results', label: 'Public results', milestone: 'M5' },
    ],
  },
];

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
                        active ? 'text-accent' : 'text-ink-faint'
                      }`}
                    >
                      {item.milestone}
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
