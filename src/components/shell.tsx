import type { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  lede,
  aside,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  aside?: ReactNode;
}) {
  return (
    <header className="border-b border-line bg-surface px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            {eyebrow}
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            {title}
          </h1>
          {lede && <p className="mt-2 text-sm leading-relaxed text-ink-muted">{lede}</p>}
        </div>
        {aside && <div className="w-full lg:w-auto">{aside}</div>}
      </div>
    </header>
  );
}

export function Panel({
  title,
  note,
  children,
  className = '',
}: {
  title: string;
  note?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded border border-line bg-surface ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line px-3 py-3 sm:px-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
          {title}
        </h2>
        {note && <span className="text-[11px] text-ink-faint">{note}</span>}
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </section>
  );
}

export function SimulationBanner({ seed }: { seed: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-passive/25 bg-passive/10 px-6 py-2 lg:px-8">
      <span className="rounded-sm bg-passive px-1.5 py-px text-[10px] font-bold uppercase tracking-[0.14em] text-ground">
        Simulation
      </span>
      <span className="text-xs text-passive/90">
        Geography is real INEC Kwara South data. People, alignments and pipeline entries are
        generated — seed <span className="figure">{seed}</span>. Nothing here is publishable.
      </span>
    </div>
  );
}
