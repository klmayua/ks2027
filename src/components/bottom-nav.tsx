'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Item {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const icon = (d: string) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5">
    <path d={d} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PRIMARY: Item[] = [
  { href: '/war-room', label: 'Overview', icon: icon('M3 13h4v8H3zM10 3h4v18h-4zM17 9h4v12h-4z') },
  {
    href: '/war-room/structure',
    label: 'Map',
    icon: icon('M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v4H4zM14 15h6v4h-6z'),
  },
  {
    href: '/war-room/comms',
    label: 'Directives',
    icon: icon('M4 5h16v10H8l-4 4z'),
  },
  {
    href: '/war-room/election-day',
    label: 'Election',
    icon: icon('M9 12l2 2 4-4M12 3l7 4v5c0 4.4-3 8.3-7 9-4-.7-7-4.6-7-9V7z'),
  },
];

const MORE: { href: string; label: string; note: string }[] = [
  { href: '/war-room/reconciliation', label: 'Reconciliation', note: 'Stakeholder pipeline' },
  { href: '/war-room/narrative', label: 'Narrative & OSINT', note: 'Sentiment and claims' },
  { href: '/field', label: 'Ward officer view', note: 'What the field sees' },
  { href: '/ledger', label: 'Public ledger', note: 'Senatorial commitments' },
  { href: '/ledger/results', label: 'Public results', note: 'Parallel count' },
];

export function BottomNav() {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isMoreActive = MORE.some((m) => pathname === m.href);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ground/80 backdrop-blur-sm lg:hidden"
          onClick={() => setOpenPath(null)}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-line bg-surface transition-transform duration-200 lg:hidden ${
          open ? 'translate-y-0' : 'pointer-events-none translate-y-full'
        }`}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 4.5rem)' }}
        role="dialog"
        aria-label="More destinations"
        aria-hidden={!open}
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-line-bright" />
        <ul className="px-3 py-3">
          {MORE.map((m) => (
            <li key={m.href}>
              <Link
                href={m.href}
                className={`flex items-center justify-between rounded-lg px-4 py-3.5 ${
                  pathname === m.href ? 'bg-surface-raised text-accent' : 'text-ink'
                }`}
              >
                <span>
                  <span className="block text-sm">{m.label}</span>
                  <span className="block text-[11px] text-ink-faint">{m.note}</span>
                </span>
                <span className="text-ink-faint">›</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Primary"
      >
        <ul className="flex">
          {PRIMARY.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex h-14 flex-col items-center justify-center gap-0.5 ${
                    active ? 'text-accent' : 'text-ink-faint'
                  }`}
                >
                  {item.icon}
                  <span className="text-[10px] leading-none">{item.label}</span>
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setOpenPath((cur) => (cur === pathname ? null : pathname))}
              aria-expanded={open}
              className={`flex h-14 w-full flex-col items-center justify-center gap-0.5 ${
                open || isMoreActive ? 'text-accent' : 'text-ink-faint'
              }`}
            >
              {icon('M5 12h.01M12 12h.01M19 12h.01')}
              <span className="text-[10px] leading-none">More</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
