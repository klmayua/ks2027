'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Mobile-first bottom navigation — ZERO hamburger, ZERO hidden "More" drawer.
 *
 * Five direct 56px thumb targets with OSINT promoted as a primary destination with a live signal
 * indicator. Secondary surfaces (Directives, Field, Public Ledger, Results) sit in a 1-tap
 * horizontal rail under the mobile header so nothing is ever hidden behind a menu icon.
 */

interface TabItem {
  href: string;
  label: string;
  featured?: boolean;
  icon: React.ReactNode;
}

const icon = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="size-5">
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TABS: TabItem[] = [
  {
    href: '/war-room',
    label: 'Overview',
    icon: icon('M3 13h4v8H3zM10 3h4v18h-4zM17 9h4v12h-4z'),
  },
  {
    href: '/war-room/narrative',
    label: 'OSINT',
    featured: true,
    icon: icon(
      'M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.24a6 6 0 0 1 0-8.49M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14'
    ),
  },
  {
    href: '/war-room/structure',
    label: 'Map',
    icon: icon('M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v4H4zM14 15h6v4h-6z'),
  },
  {
    href: '/war-room/reconciliation',
    label: 'Reconcile',
    icon: icon('M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8a4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75'),
  },
  {
    href: '/war-room/election-day',
    label: 'Poll Day',
    icon: icon('M9 12l2 2 4-4M12 3l7 4v5c0 4.4-3 8.3-7 9-4-.7-7-4.6-7-9V7z'),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line-bright bg-surface/98 shadow-[0_-8px_24px_rgba(0,0,0,0.45)] backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Primary mobile navigation"
    >
      <ul className="grid grid-cols-5">
        {TABS.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`relative flex h-[60px] flex-col items-center justify-center gap-1 transition-colors active:scale-95 ${
                  active
                    ? 'text-accent'
                    : item.featured
                      ? 'text-ink'
                      : 'text-ink-muted hover:text-ink'
                }`}
              >
                {/* Top active indicator bar */}
                {active && (
                  <span className="absolute inset-x-3 top-0 h-[2.5px] rounded-b-full bg-accent" />
                )}

                <span className="relative">
                  {item.icon}
                  {item.featured && (
                    <span
                      className="absolute -right-1 -top-0.5 size-2 rounded-full bg-accent ring-2 ring-surface"
                      aria-hidden="true"
                    />
                  )}
                </span>

                <span
                  className={`text-[10px] leading-none tracking-tight ${
                    active || item.featured ? 'font-semibold' : 'font-medium'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
