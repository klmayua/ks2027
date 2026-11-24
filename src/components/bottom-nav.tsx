'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Mobile-first bottom navigation — ZERO hamburger, ZERO hidden "More" drawer.
 *
 * Five direct 60px thumb targets elevating the core strategic intelligence stack:
 * Overview · Predict · OSINT (live dot) · Digital · Dossier.
 * Operational & structural surfaces sit in the 1-tap horizontal sub-rail under the header.
 */

interface TabItem {
  href: string;
  label: string;
  featured?: boolean;
  liveDot?: boolean;
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
    href: '/war-room/predict',
    label: 'Predict',
    featured: true,
    icon: icon('M3 17l6-6 4 4 8-8M15 7h6v6'),
  },
  {
    href: '/war-room/narrative',
    label: 'OSINT',
    featured: true,
    liveDot: true,
    icon: icon(
      'M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.24a6 6 0 0 1 0-8.49M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14'
    ),
  },
  {
    href: '/war-room/digital',
    label: 'Digital',
    icon: icon('M13 2L3 14h9l-1 8 10-12h-9l1-8z'),
  },
  {
    href: '/war-room/dossier',
    label: 'Dossier',
    icon: icon('M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8a4 4 0 0 0 0 8M22 11h-6M19 8v6'),
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
                {active && (
                  <span className="absolute inset-x-3 top-0 h-[2.5px] rounded-b-full bg-accent" />
                )}

                <span className="relative">
                  {item.icon}
                  {item.liveDot && (
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
