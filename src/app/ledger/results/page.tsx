import { campaignConfig } from '@/config/campaign.config';
import { lgas } from '@/lib/geography';
import { computeCoverage, computeTally } from '@/lib/election';
import { seedAgents, seedSubmissions } from '@/lib/simulation/seed-election';

const pct = (n: number, dp = 1) => `${(n * 100).toFixed(dp)}%`;

export default function PublicResultsPage() {
  const agents = seedAgents();
  const submissions = seedSubmissions(agents);
  const coverage = computeCoverage(submissions, agents);
  const tally = computeTally(submissions);

  const outstanding = coverage.totalPollingUnits - coverage.reported;
  const lateSync = submissions.filter((s) => s.form.syncedLate).length;

  const byLowestCoverage = [...coverage.byLga].sort((a, b) => a.rate - b.rate);

  return (
    <>
      {campaignConfig.simulation.enabled && (
        <div className="mb-8 rounded border border-[--ledger-warn]/40 bg-[--ledger-warn]/8 p-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-[--ledger-warn]">
            Preview — not published
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-[--ledger-ink-muted]">
            Seeded demonstration data for the 16 January 2027 Kwara South Senate election. Nothing
            on this page is a real result.
          </p>
        </div>
      )}

      <section>
        <h1 className="text-2xl font-semibold tracking-tight text-[--ledger-ink]">
          Collected Kwara South results, and what is still missing
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[--ledger-ink-muted]">
          These figures are read from photographed Form EC8A sheets submitted by accredited PDP
          polling agents across Kwara South&rsquo;s 7 local governments, each carrying a location,
          timestamp and named submitter. They are a parallel verification record — INEC alone
          declares official results at the Omu-Aran collation centre.
        </p>
      </section>

      <section className="mt-8 rounded border border-[--ledger-line] bg-[--ledger-surface] p-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-[--ledger-ink-faint]">
              Kwara South polling units reported
            </div>
            <div className="figure mt-1 text-5xl font-semibold text-[--ledger-ink]">
              {coverage.reported.toLocaleString('en-NG')}
              <span className="text-2xl text-[--ledger-ink-faint]">
                {' '}
                / {coverage.totalPollingUnits.toLocaleString('en-NG')}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="figure text-3xl font-semibold text-[--ledger-warn]">
              {outstanding.toLocaleString('en-NG')}
            </div>
            <div className="text-[11px] text-[--ledger-ink-faint]">still outstanding</div>
          </div>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-sm bg-[--ledger-raised]">
          <div className="h-full bg-[--ledger-good]" style={{ width: `${coverage.rate * 100}%` }} />
        </div>

        <p className="mt-4 text-sm leading-relaxed text-[--ledger-ink-muted]">
          <span className="font-medium text-[--ledger-ink]">{pct(coverage.rate)}</span> of Kwara
          South polling units have reported. The remaining{' '}
          <span className="font-medium text-[--ledger-ink]">
            {outstanding.toLocaleString('en-NG')}
          </span>{' '}
          are displayed first because a count that hides missing units is not evidence.
        </p>

        <p className="mt-3 border-t border-[--ledger-line] pt-3 text-xs leading-relaxed text-[--ledger-ink-muted]">
          The denominator is Kwara South&rsquo;s{' '}
          <span className="figure font-medium text-[--ledger-ink]">
            {coverage.totalPollingUnits.toLocaleString('en-NG')}
          </span>{' '}
          polling units after INEC&rsquo;s 2021 expansion (+225 converted voting points across the 7
          LGAs). Ward-level detail is loaded for{' '}
          <span className="figure">{coverage.enumeratedPollingUnits.toLocaleString('en-NG')}</span>{' '}
          units from the 2015 directory; the remaining{' '}
          <span className="figure">{coverage.unallocatedPollingUnits.toLocaleString('en-NG')}</span>{' '}
          stay in the denominator until INEC Kwara&rsquo;s current ward list is imported. Reporting
          against the smaller subset would show{' '}
          <span className="figure">{pct(coverage.rateOfEnumerated)}</span> — we publish the lower,
          truer figure.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="border-b border-[--ledger-line] pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[--ledger-ink-faint]">
          Collected Senate tally — {coverage.reported.toLocaleString('en-NG')} polling units
        </h2>
        <div className="mt-4 space-y-3">
          {tally.parties.map((p) => (
            <div key={p.partyCode} className="flex items-center gap-4">
              <span
                className={`figure w-12 shrink-0 text-base font-semibold ${
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
                  style={{ width: `${Math.max(p.share * 100, 7)}%` }}
                >
                  <span className="figure text-[11px] font-semibold text-white">
                    {pct(p.share)}
                  </span>
                </div>
              </div>
              <span className="figure w-24 shrink-0 text-right text-sm text-[--ledger-ink]">
                {p.votes.toLocaleString('en-NG')}
              </span>
            </div>
          ))}
        </div>

        <dl className="mt-6 grid gap-4 border-t border-[--ledger-line] pt-4 sm:grid-cols-4">
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
              Turnout of reporting units
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

        <p className="mt-4 text-xs leading-relaxed text-[--ledger-ink-muted]">
          <span className="font-medium text-[--ledger-bad]">
            {tally.disputedCount} polling units
          </span>{' '}
          have a conflicting second submission. Both are retained and published openly for
          collation review at Omu-Aran.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="border-b border-[--ledger-line] pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[--ledger-ink-faint]">
          Coverage across all 7 Kwara South LGAs
        </h2>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-[0.12em] text-[--ledger-ink-faint]">
              <th className="pb-2 font-medium">Local government</th>
              <th className="pb-2 text-right font-medium">Reported</th>
              <th className="pb-2 text-right font-medium">Post-2021 PUs</th>
              <th className="pb-2 text-right font-medium">Coverage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[--ledger-line]">
            {byLowestCoverage.map((row) => (
              <tr key={row.lgaCode}>
                <td className="py-2.5 text-[--ledger-ink]">
                  {lgas.find((l) => l.code === row.lgaCode)?.name}
                </td>
                <td className="figure py-2.5 text-right text-[--ledger-ink-muted]">
                  {row.reported}
                </td>
                <td className="figure py-2.5 text-right text-[--ledger-ink-faint]">{row.total}</td>
                <td className="figure py-2.5 text-right text-[--ledger-warn]">{pct(row.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs leading-relaxed text-[--ledger-ink-muted]">
          <span className="figure text-[--ledger-ink]">{lateSync}</span> forms were captured offline
          and synchronised once signal returned, preserving original timestamps and GPS coordinates.
        </p>
      </section>

      <section className="mt-8 rounded border border-[--ledger-line] bg-[--ledger-surface] p-5">
        <h2 className="text-sm font-medium text-[--ledger-ink]">How to verify this yourself</h2>
        <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[--ledger-ink-muted]">
          <li>
            Every figure traces to an individual photographed Form EC8A carrying the polling unit
            code, capture time, GPS coordinates, and accredited agent ID.
          </li>
          <li>
            The full Kwara South dataset is structured for open export so journalists, observers,
            and legal teams can audit totals independently.
          </li>
          <li>
            Where our parallel record and INEC&rsquo;s official record differ, INEC&rsquo;s
            declaration governs — and any discrepancy enters legal review backed by primary EC8A
            evidence.
          </li>
        </ul>
      </section>
    </>
  );
}
