'use client';

import { useMemo, useState } from 'react';

import { DetailDrawer } from '@/components/detail-drawer';
import { campaignConfig } from '@/config/campaign.config';
import { getLga, getWard, lgas } from '@/lib/geography';
import { computeCoverage, computeTally } from '@/lib/election';
import { seedAgents, seedSubmissions } from '@/lib/simulation/seed-election';

const pct = (n: number, dp = 1) => `${(n * 100).toFixed(dp)}%`;

export default function PublicResultsPage() {
  const agents = useMemo(() => seedAgents(), []);
  const submissions = useMemo(() => seedSubmissions(agents), [agents]);
  const coverage = useMemo(() => computeCoverage(submissions, agents), [submissions, agents]);
  const tally = useMemo(() => computeTally(submissions), [submissions]);

  const [selectedLga, setSelectedLga] = useState<string | null>(null);

  const outstanding = coverage.totalPollingUnits - coverage.reported;
  const lateSync = submissions.filter((s) => s.form.syncedLate).length;
  const byLowestCoverage = [...coverage.byLga].sort((a, b) => a.rate - b.rate);

  const lgaSubmissions = useMemo(
    () => (selectedLga ? submissions.filter((s) => s.lgaCode === selectedLga) : []),
    [submissions, selectedLga]
  );
  const lgaTally = useMemo(() => computeTally(lgaSubmissions), [lgaSubmissions]);

  return (
    <>
      {campaignConfig.simulation.enabled && (
        <div className="mb-6 rounded-lg border border-[--ledger-warn]/40 bg-[--ledger-warn]/8 p-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[--ledger-warn]">
            Preview — not published
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-[--ledger-ink-muted] sm:text-sm">
            Seeded demonstration data for the 16 January 2027 Kwara South Senate election. Nothing
            on this page is a real result.
          </p>
        </div>
      )}

      <section>
        <h1 className="text-xl font-semibold tracking-tight text-[--ledger-ink] sm:text-2xl">
          Collected Kwara South results, and what is still missing
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[--ledger-ink-muted]">
          Read from photographed Form EC8A sheets submitted by accredited PDP polling agents across
          Kwara South&rsquo;s 7 local governments. Tap any LGA below to inspect its parallel count
          and individual polling unit forms.
        </p>
      </section>

      <section className="mt-6 rounded-lg border border-[--ledger-line] bg-[--ledger-surface] p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-[--ledger-ink-faint]">
              Kwara South polling units reported
            </div>
            <div className="figure mt-1 text-4xl font-semibold text-[--ledger-ink] sm:text-5xl">
              {coverage.reported.toLocaleString('en-NG')}
              <span className="text-xl text-[--ledger-ink-faint] sm:text-2xl">
                {' '}
                / {coverage.totalPollingUnits.toLocaleString('en-NG')}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="figure text-2xl font-semibold text-[--ledger-warn] sm:text-3xl">
              {outstanding.toLocaleString('en-NG')}
            </div>
            <div className="text-[11px] text-[--ledger-ink-faint]">still outstanding</div>
          </div>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-sm bg-[--ledger-raised]">
          <div className="h-full bg-[--ledger-good]" style={{ width: `${coverage.rate * 100}%` }} />
        </div>

        <p className="mt-3 text-xs leading-relaxed text-[--ledger-ink-muted]">
          Denominator is Kwara South&rsquo;s{' '}
          <span className="figure font-medium text-[--ledger-ink]">
            {coverage.totalPollingUnits}
          </span>{' '}
          post-2021 polling units ({coverage.enumeratedPollingUnits} ward-enumerated +{' '}
          {coverage.unallocatedPollingUnits} unallocated). Against the enumerated subset alone this
          would show <span className="figure">{pct(coverage.rateOfEnumerated)}</span> — we publish
          the lower, truer <span className="figure">{pct(coverage.rate)}</span>.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="border-b border-[--ledger-line] pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[--ledger-ink-faint]">
          Collected Senate tally — {coverage.reported.toLocaleString('en-NG')} polling units
        </h2>
        <div className="mt-4 space-y-3">
          {tally.parties.map((p) => (
            <div key={p.partyCode} className="flex items-center gap-3 sm:gap-4">
              <span
                className={`figure w-10 shrink-0 text-sm font-semibold sm:w-12 sm:text-base ${
                  p.partyCode === 'PDP' ? 'text-[--ledger-accent]' : 'text-[--ledger-ink]'
                }`}
              >
                {p.partyCode}
              </span>
              <div className="h-7 flex-1 overflow-hidden rounded-sm bg-[--ledger-raised]">
                <div
                  className={`flex h-full items-center pl-2 ${
                    p.partyCode === 'PDP' ? 'bg-[--ledger-accent]' : 'bg-[--ledger-ink-muted]/65'
                  }`}
                  style={{ width: `${Math.max(p.share * 100, 9)}%` }}
                >
                  <span className="figure text-[11px] font-semibold text-white">
                    {pct(p.share)}
                  </span>
                </div>
              </div>
              <span className="figure w-20 shrink-0 text-right text-sm text-[--ledger-ink] sm:w-24">
                {p.votes.toLocaleString('en-NG')}
              </span>
            </div>
          ))}
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-[--ledger-line] pt-4 sm:grid-cols-4">
          <div>
            <dt className="text-[10px] uppercase tracking-[0.12em] text-[--ledger-ink-faint]">
              Votes counted
            </dt>
            <dd className="figure text-lg text-[--ledger-ink]">
              {tally.totalVotes.toLocaleString('en-NG')}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.12em] text-[--ledger-ink-faint]">
              Turnout (reporting)
            </dt>
            <dd className="figure text-lg text-[--ledger-ink]">{pct(tally.turnoutOfReporting)}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.12em] text-[--ledger-ink-faint]">
              Rejected ballots
            </dt>
            <dd className="figure text-lg text-[--ledger-ink-muted]">
              {tally.rejectedBallots.toLocaleString('en-NG')}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.12em] text-[--ledger-ink-faint]">
              Disputed forms
            </dt>
            <dd className="figure text-lg text-[--ledger-bad]">{tally.disputedCount}</dd>
          </div>
        </dl>
      </section>

      {/* Clickable LGA Coverage Cards */}
      <section className="mt-8">
        <h2 className="border-b border-[--ledger-line] pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[--ledger-ink-faint]">
          Coverage across all 7 Kwara South LGAs — tap any LGA to inspect forms
        </h2>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {byLowestCoverage.map((row) => (
            <button
              key={row.lgaCode}
              type="button"
              onClick={() => setSelectedLga(row.lgaCode)}
              className="group flex items-center justify-between gap-3 rounded-lg border border-[--ledger-line] bg-[--ledger-surface] p-3.5 text-left transition-all hover:border-[--ledger-accent]/50 active:scale-[0.99]"
            >
              <div>
                <div className="text-sm font-semibold text-[--ledger-ink]">
                  {lgas.find((l) => l.code === row.lgaCode)?.name}
                </div>
                <div className="figure mt-0.5 text-xs text-[--ledger-ink-muted]">
                  {row.reported} of {row.total} post-2021 PUs
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="figure text-sm font-semibold text-[--ledger-warn]">
                  {pct(row.rate)}
                </span>
                <span className="text-[--ledger-accent] transition-transform group-hover:translate-x-0.5">
                  ›
                </span>
              </div>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-[--ledger-ink-muted]">
          <span className="figure text-[--ledger-ink]">{lateSync}</span> forms were captured offline
          and synchronised once signal returned, preserving original timestamps and GPS.
        </p>
      </section>

      <DetailDrawer
        open={selectedLga !== null}
        onClose={() => setSelectedLga(null)}
        tone="ledger"
        eyebrow="Parallel count audit · 16 Jan 2027"
        title={`${getLga(selectedLga ?? '')?.name ?? ''} Local Government`}
        subtitle={`${lgaSubmissions.length} photographed Form EC8A sheets collected`}
      >
        {selectedLga && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {lgaTally.parties.map((p) => (
                <div
                  key={p.partyCode}
                  className="rounded-lg border border-[--ledger-line] bg-[--ledger-raised] p-3 text-center"
                >
                  <div className="text-[10px] font-semibold text-[--ledger-ink-faint]">
                    {p.partyCode}
                  </div>
                  <div className="figure mt-0.5 text-base font-semibold text-[--ledger-ink]">
                    {p.votes.toLocaleString('en-NG')}
                  </div>
                  <div className="figure text-[10px] text-[--ledger-accent]">{pct(p.share)}</div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[--ledger-ink-faint]">
                Sampled EC8A submissions ({Math.min(20, lgaSubmissions.length)} of{' '}
                {lgaSubmissions.length})
              </h3>
              {lgaSubmissions.slice(0, 20).map((s) => (
                <div
                  key={s.id}
                  className="rounded-lg border border-[--ledger-line] bg-[--ledger-raised]/50 p-3 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-[--ledger-ink]">
                      {getWard(s.wardId)?.name} · PU <span className="figure">{s.pollingUnitId}</span>
                    </span>
                    {s.disputed && (
                      <span className="rounded bg-[--ledger-bad]/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-[--ledger-bad]">
                        Disputed
                      </span>
                    )}
                  </div>
                  <div className="figure mt-1.5 flex flex-wrap gap-3 text-[11px] text-[--ledger-ink-muted]">
                    {Object.entries(s.votes).map(([k, v]) => (
                      <span key={k}>
                        {k}: <strong className="text-[--ledger-ink]">{v}</strong>
                      </span>
                    ))}
                  </div>
                  <div className="mt-1 text-[10px] text-[--ledger-ink-faint]">
                    Agent: {s.agentName} · GPS {s.form.lat.toFixed(3)}, {s.form.lng.toFixed(3)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DetailDrawer>
    </>
  );
}
