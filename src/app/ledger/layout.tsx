import Link from 'next/link';

import { campaignConfig } from '@/config/campaign.config';

export default function LedgerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ledger min-h-screen">
      <div className="pdp-bar h-[2px] w-full" />
      <header className="border-b border-[--ledger-line] bg-[--ledger-surface]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
          <Link href="/ledger" className="block">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[--ledger-accent] sm:text-[11px]">
              {campaignConfig.district.name} 2027 · {campaignConfig.principal.partyAbbreviation}
            </div>
            <div className="mt-0.5 text-base font-semibold tracking-tight text-[--ledger-ink] sm:text-lg">
              {campaignConfig.principal.shortName} — Public Ledger
            </div>
          </Link>
          <nav className="-mx-4 flex w-full gap-4 overflow-x-auto px-4 text-sm sm:mx-0 sm:w-auto sm:gap-5 sm:overflow-visible sm:px-0">
            <Link
              href="/ledger"
              className="shrink-0 whitespace-nowrap text-[--ledger-ink-muted] hover:text-[--ledger-ink]"
            >
              Commitments
            </Link>
            <Link
              href="/ledger/results"
              className="shrink-0 whitespace-nowrap text-[--ledger-ink-muted] hover:text-[--ledger-ink]"
            >
              Results
            </Link>
            <Link
              href="/field"
              className="shrink-0 whitespace-nowrap text-[--ledger-ink-muted] hover:text-[--ledger-ink]"
            >
              Field view
            </Link>
            <Link
              href="/war-room"
              className="shrink-0 whitespace-nowrap text-[--ledger-ink-muted] hover:text-[--ledger-ink]"
            >
              War room →
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>

      <footer className="mt-12 border-t border-[--ledger-line] bg-[--ledger-surface]">
        <div className="mx-auto max-w-5xl px-6 py-8 text-xs leading-relaxed text-[--ledger-ink-faint]">
          <p>
            Every figure on this page links to the record it was derived from. Senatorial
            commitments carry a permanent identifier (<code>KS-*</code>) that stays fixed from the
            2027 campaign trail into quarterly National Assembly constituency reviews across all 7
            LGAs of Kwara South.
          </p>
          <p className="mt-2">
            Structural geography from the Independent National Electoral Commission, Directory of
            Polling Units (Kwara State — Kwara South extract), revision January 2015, reconciled
            against 2021 LGA expansion totals (907 polling units).
          </p>
        </div>
      </footer>
    </div>
  );
}
