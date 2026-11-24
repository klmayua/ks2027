'use client';

import Link from 'next/link';
import { useState } from 'react';

import { InteractiveStatCard, Stat } from '@/components/charts';
import { DetailDrawer } from '@/components/detail-drawer';
import { PageHeader, Panel } from '@/components/shell';
import { getLga, lgas } from '@/lib/geography';
import {
  CANDIDATES,
  GROUND_GAME_MATRIX,
  KWARA_SOUTH_SENATE_HISTORY,
  type CandidateDossier,
  type GroundGameDimension,
  type HistoricalCycle,
} from '@/lib/intelligence/dossier';

type DrawerState =
  | { kind: 'candidate'; candidate: CandidateDossier; tab: 'overview' | 'assets' | 'risks' }
  | { kind: 'dimension'; dim: GroundGameDimension }
  | { kind: 'history'; cycle: HistoricalCycle }
  | null;

const LEADER_BADGE: Record<GroundGameDimension['leader'], string> = {
  popoola: 'bg-aligned/15 text-aligned border-aligned/45',
  adewoye: 'bg-aggrieved/15 text-aggrieved border-aggrieved/45',
  oyedepo: 'bg-passive/15 text-passive border-passive/45',
  contested: 'bg-accent/15 text-accent border-accent/45',
};

const PARTY_ACCENT: Record<CandidateDossier['party'], { border: string; badge: string; bar: string }> = {
  PDP: {
    border: 'border-aligned/50',
    badge: 'bg-aligned/15 text-aligned border-aligned/40',
    bar: 'bg-aligned',
  },
  APC: {
    border: 'border-aggrieved/40',
    badge: 'bg-aggrieved/15 text-aggrieved border-aggrieved/40',
    bar: 'bg-aggrieved',
  },
  ADC: {
    border: 'border-passive/40',
    badge: 'bg-passive/15 text-passive border-passive/40',
    bar: 'bg-passive',
  },
};

const RATING_PILL: Record<'strong' | 'competitive' | 'weak', string> = {
  strong: 'bg-aligned/15 text-aligned border-aligned/35',
  competitive: 'bg-passive/15 text-passive border-passive/35',
  weak: 'bg-aggrieved/12 text-aggrieved border-aggrieved/30',
};

const SEVERITY_BADGE: Record<'critical' | 'high' | 'moderate', string> = {
  critical: 'bg-aggrieved/15 text-aggrieved border-aggrieved/40',
  high: 'bg-passive/15 text-passive border-passive/40',
  moderate: 'bg-line text-ink-muted border-line-bright',
};

export default function CandidateDossierPage() {
  const [drawer, setDrawer] = useState<DrawerState>(null);
  const [filterLeader, setFilterLeader] = useState<'all' | 'popoola' | 'adewoye' | 'contested'>('all');

  const popoolaLeads = GROUND_GAME_MATRIX.filter((d) => d.leader === 'popoola').length;
  const rivalLeads = GROUND_GAME_MATRIX.filter((d) => d.leader === 'adewoye' || d.leader === 'oyedepo').length;
  const contestedDims = GROUND_GAME_MATRIX.filter((d) => d.leader === 'contested').length;

  const visibleDimensions = GROUND_GAME_MATRIX.filter((d) => {
    if (filterLeader === 'all') return true;
    if (filterLeader === 'adewoye') return d.leader === 'adewoye' || d.leader === 'oyedepo';
    return d.leader === filterLeader;
  });

  return (
    <>
      <PageHeader
        eyebrow="Candidate & Rivals Deep Dive · Kwara South 2027"
        title="Side-by-Side Ground Game & Kwara’s Historical PDP Legacy"
        lede="Verified biographical archives, 1999–2023 senatorial history, and an unvarnished head-to-head comparison of Hon. Saheed Popoola (PDP), Prince Olalekan Adewoye (APC), and Akogun Iyiola Oyedepo (ADC) across 8 decisive ground-game dimensions."
        aside={
          <div className="flex w-full flex-wrap gap-x-5 gap-y-2 rounded-lg border border-line bg-surface-raised px-4 py-3 lg:w-auto">
            <Stat label="Historic PDP streak" value="15 yrs" size="sm" tone="accent" sub="2004–2019 (4 terms)" />
            <Stat label="2023 PDP+SDP edge" value="+3,249" size="sm" tone="good" sub="59,215 vs APC 55,966" />
          </div>
        }
      />

      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        {/* Top 6 Clickable KPI Cards */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
          <InteractiveStatCard
            label="PDP Senate legacy"
            value="15 yrs"
            tone="accent"
            sub="2004–2019 · Ajibola & Rafiu"
            onClick={() => setDrawer({ kind: 'history', cycle: KWARA_SOUTH_SENATE_HISTORY[4] })}
          />
          <InteractiveStatCard
            label="APC drop 19→23"
            value="-37.6%"
            tone="good"
            sub="89,704 → 55,966 (-33.7k)"
            onClick={() => setDrawer({ kind: 'history', cycle: KWARA_SOUTH_SENATE_HISTORY[6] })}
          />
          <InteractiveStatCard
            label="2023 PDP+SDP pool"
            value="59,215"
            tone="good"
            sub="+3,249 ahead of APC"
            onClick={() => setDrawer({ kind: 'dimension', dim: GROUND_GAME_MATRIX[1] })}
          />
          <InteractiveStatCard
            label="Popoola leads"
            value={`${popoolaLeads} / 8`}
            tone="accent"
            sub="Legacy · SDP · Security"
            onClick={() => setFilterLeader('popoola')}
          />
          <InteractiveStatCard
            label="Rivals hold edge"
            value={`${rivalLeads} / 8`}
            tone="bad"
            sub="Cash · Igbomina · ADC pull"
            onClick={() => setFilterLeader('adewoye')}
          />
          <InteractiveStatCard
            label="Open tie-breakers"
            value={`${contestedDims} / 8`}
            tone="warn"
            sub="Ashiru split & Digital PU"
            onClick={() => setFilterLeader('contested')}
          />
        </div>

        {/* =====================================================================
            SECTION 1: SIDE-BY-SIDE 3-CANDIDATE DEEP-DIVE CARDS
            ===================================================================== */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-ink">
                Verified 2027 Kwara South Frontrunners — Tap Any Candidate for Full Dossier
              </h2>
              <p className="text-xs text-ink-faint">
                Includes verified career arc, Kwara PDP legacy relation, 7-LGA footprint, assets & honest vulnerabilities.
              </p>
            </div>
            <Link href="/war-room/predict" className="text-xs font-semibold text-accent hover:underline">
              See vote forecast in Predictive Engine →
            </Link>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            {CANDIDATES.map((cand) => {
              const style = PARTY_ACCENT[cand.party];
              return (
                <div
                  key={cand.id}
                  className={`flex flex-col justify-between rounded-lg border bg-surface p-4 ${
                    cand.isPrincipal ? 'border-accent/60 bg-accent/[0.04]' : style.border
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${style.badge}`}>
                            {cand.party}
                          </span>
                          <span className="rounded bg-surface-raised px-2 py-0.5 text-[10px] text-ink-muted">
                            {cand.culturalBloc} · {cand.homeLgaName}
                          </span>
                          {cand.isPrincipal && (
                            <span className="rounded bg-accent/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-accent">
                              Principal
                            </span>
                          )}
                        </div>
                        <h3 className="mt-2 text-base font-semibold text-ink">{cand.name}</h3>
                      </div>
                    </div>

                    <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{cand.profileLine}</p>

                    <div className="mt-3 rounded-md border border-line bg-ground/70 p-2.5">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
                        Relation to Historical Kwara PDP Legacy
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
                        {cand.pdpLegacyRelation}
                      </p>
                    </div>

                    {/* 7-LGA Mini Ground Footprint */}
                    <div className="mt-3">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                        7-LGA Ground Footprint
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {lgas.map((l) => {
                          const fp = cand.lgaFootprint[l.code];
                          if (!fp) return null;
                          return (
                            <span
                              key={l.code}
                              title={fp.note}
                              className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${RATING_PILL[fp.rating]}`}
                            >
                              {l.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <p className="mt-3 text-[11px] leading-snug text-ink">
                      <strong className="text-ink-faint">Bottom line:</strong> {cand.overallThreatOrEdge}
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-1.5 border-t border-line pt-3">
                    <button
                      type="button"
                      onClick={() => setDrawer({ kind: 'candidate', candidate: cand, tab: 'overview' })}
                      className="rounded border border-line bg-surface-raised px-2 py-1.5 text-[11px] font-medium text-ink hover:border-accent/50"
                    >
                      Timeline ({cand.timeline.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDrawer({ kind: 'candidate', candidate: cand, tab: 'assets' })}
                      className="rounded border border-aligned/35 bg-aligned/10 px-2 py-1.5 text-[11px] font-medium text-aligned hover:bg-aligned/20"
                    >
                      Assets ({cand.assets.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDrawer({ kind: 'candidate', candidate: cand, tab: 'risks' })}
                      className="rounded border border-aggrieved/35 bg-aggrieved/10 px-2 py-1.5 text-[11px] font-medium text-aggrieved hover:bg-aggrieved/20"
                    >
                      Risks ({cand.vulnerabilities.length})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =====================================================================
            SECTION 2: SIDE-BY-SIDE GROUND-GAME SCORECARD ("WHO LEADS HERE")
            ===================================================================== */}
        <Panel
          title="Real Ground-Game Comparison — Who Leads Where & Why"
          note="Tap any dimension for verified evidence & Popoola’s required counter-play"
        >
          <div className="mb-4 flex flex-wrap gap-1.5">
            {(
              [
                ['all', `All dimensions (${GROUND_GAME_MATRIX.length})`],
                ['popoola', `Where Popoola leads (${popoolaLeads})`],
                ['adewoye', `Where rivals lead (${rivalLeads})`],
                ['contested', `Open tie-breakers (${contestedDims})`],
              ] as const
            ).map(([k, lbl]) => (
              <button
                key={k}
                type="button"
                onClick={() => setFilterLeader(k)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  filterLeader === k
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-line bg-surface-raised text-ink-muted hover:text-ink'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {visibleDimensions.map((dim) => (
              <button
                key={dim.id}
                type="button"
                onClick={() => setDrawer({ kind: 'dimension', dim })}
                className="w-full rounded-lg border border-line bg-surface-raised/60 p-3.5 text-left transition-colors hover:border-accent/55 hover:bg-surface-raised"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-ink sm:text-sm">{dim.dimension}</span>
                    <span className="rounded bg-ground px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-ink-faint">
                      {dim.weight}
                    </span>
                  </div>
                  <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${LEADER_BADGE[dim.leader]}`}>
                    {dim.leaderLabel}
                  </span>
                </div>

                {/* 3-Candidate Side-by-Side Bars */}
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <div>
                    <div className="flex justify-between text-[10px]">
                      <span className="font-medium text-aligned">Popoola (PDP)</span>
                      <span className="figure font-semibold text-ink">{dim.popoolaScore}/100</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ground">
                      <div className="h-full rounded-full bg-aligned" style={{ width: `${dim.popoolaScore}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px]">
                      <span className="font-medium text-aggrieved">Adewoye (APC)</span>
                      <span className="figure font-semibold text-ink">{dim.adewoyeScore}/100</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ground">
                      <div className="h-full rounded-full bg-aggrieved" style={{ width: `${dim.adewoyeScore}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px]">
                      <span className="font-medium text-passive">Oyedepo (ADC)</span>
                      <span className="figure font-semibold text-ink">{dim.oyedepoScore}/100</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ground">
                      <div className="h-full rounded-full bg-passive" style={{ width: `${dim.oyedepoScore}%` }} />
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-muted">
                  <span className="line-clamp-1 flex-1">{dim.groundReality}</span>
                  <span className="shrink-0 font-semibold text-accent">Deep dive ›</span>
                </div>
              </button>
            ))}
          </div>
        </Panel>

        {/* =====================================================================
            SECTION 3: KWARA SOUTH HISTORICAL PDP LEGACY TIMELINE (1999–2023)
            ===================================================================== */}
        <Panel
          title="Kwara South Senate Electoral History (1999–2023) — Why Old Legacy Is PDP"
          note="Verified INEC & Tribunal record · Tap any cycle for strategic implications"
        >
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {KWARA_SOUTH_SENATE_HISTORY.map((c) => {
              const partyColor =
                c.party === 'PDP'
                  ? 'border-aligned/45 bg-aligned/[0.06]'
                  : c.party === 'APC'
                    ? 'border-aggrieved/40 bg-aggrieved/[0.05]'
                    : 'border-line bg-surface-raised/60';
              const badge =
                c.party === 'PDP'
                  ? 'bg-aligned/20 text-aligned'
                  : c.party === 'APC'
                    ? 'bg-aggrieved/20 text-aggrieved'
                    : 'bg-line text-ink-muted';
              return (
                <button
                  key={c.year}
                  type="button"
                  onClick={() => setDrawer({ kind: 'history', cycle: c })}
                  className={`flex flex-col justify-between rounded-lg border p-3.5 text-left transition-all hover:border-accent/60 active:scale-[0.99] ${partyColor}`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="figure text-lg font-bold text-ink">{c.year}</span>
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${badge}`}>{c.party}</span>
                    </div>
                    <div className="mt-1 text-xs font-semibold text-ink">{c.winner}</div>
                    <div className="mt-0.5 text-[10px] font-medium text-accent">{c.eraTag}</div>
                    {c.winnerVotes && (
                      <div className="figure mt-2 text-[11px] text-ink-muted">
                        Winner: <strong className="text-ink">{c.winnerVotes.toLocaleString()}</strong>
                        {c.runnerUpVotes ? ` · PDP ${c.runnerUpVotes.toLocaleString()}` : ''}
                        {c.sdpVotes ? ` · SDP ${c.sdpVotes.toLocaleString()}` : ''}
                      </div>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-[11px] text-ink-muted">{c.pdpLegacyNote}</p>
                </button>
              );
            })}

            {/* 2027 Open Seat Card */}
            <Link
              href="/war-room/predict"
              className="flex flex-col justify-between rounded-lg border border-dashed border-accent/60 bg-accent/[0.07] p-3.5 text-left transition-colors hover:bg-accent/[0.12]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="figure text-lg font-bold text-accent">2027</span>
                  <span className="rounded bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent">
                    OPEN SEAT
                  </span>
                </div>
                <div className="mt-1 text-xs font-semibold text-ink">
                  Popoola (PDP) vs Adewoye (APC) vs Oyedepo (ADC)
                </div>
                <p className="mt-2 text-[11px] text-ink-muted">
                  Incumbent Sen. Lola Ashiru defeated in May 2026 APC primary. Reunified PDP + SDP base + Digital Wave flips Kwara South back to PDP.
                </p>
              </div>
              <span className="mt-2 text-xs font-semibold text-accent">Run 2027 Forecast →</span>
            </Link>
          </div>
        </Panel>
      </div>

      {/* Deep-Dive Drawer */}
      <DetailDrawer
        open={drawer !== null}
        onClose={() => setDrawer(null)}
        eyebrow={
          drawer?.kind === 'candidate'
            ? `${drawer.candidate.partyFull} · ${drawer.candidate.culturalBloc} (${drawer.candidate.homeLgaName})`
            : drawer?.kind === 'dimension'
              ? `Ground-Game Audit · ${drawer.dim.weight} weight`
              : drawer?.kind === 'history'
                ? `Verified INEC / Tribunal Cycle · ${drawer.cycle.eraTag}`
                : ''
        }
        title={
          drawer?.kind === 'candidate'
            ? drawer.candidate.name
            : drawer?.kind === 'dimension'
              ? drawer.dim.dimension
              : drawer?.kind === 'history'
                ? `${drawer.cycle.year} Kwara South Senate — ${drawer.cycle.winner} (${drawer.cycle.party})`
                : ''
        }
      >
        {drawer?.kind === 'candidate' && (
          <div className="space-y-4">
            {/* Drawer sub-tabs */}
            <div className="flex gap-1.5 border-b border-line pb-3">
              {(
                [
                  ['overview', 'Timeline & Footprint'],
                  ['assets', `Verified Assets (${drawer.candidate.assets.length})`],
                  ['risks', `Vulnerabilities & Counters (${drawer.candidate.vulnerabilities.length})`],
                ] as const
              ).map(([tabId, label]) => (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => setDrawer({ ...drawer, tab: tabId })}
                  className={`rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                    drawer.tab === tabId
                      ? 'border-accent bg-accent/15 text-accent'
                      : 'border-line bg-surface-raised text-ink-muted hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {drawer.tab === 'overview' && (
              <div className="space-y-4">
                <div className="rounded-md border border-line bg-ground/70 p-3 text-xs">
                  <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
                    Education & Credentials
                  </div>
                  <ul className="mt-1.5 space-y-1 text-ink-muted">
                    {drawer.candidate.education.map((e, i) => (
                      <li key={i}>• {e}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                    Verified Political & Career Timeline
                  </h4>
                  <div className="mt-2 space-y-2.5">
                    {drawer.candidate.timeline.map((ev, i) => (
                      <div key={i} className="rounded-md border border-line bg-surface-raised/60 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="figure text-[11px] font-bold text-accent">{ev.period}</span>
                          <span className="text-[10px] text-ink-faint">{ev.source}</span>
                        </div>
                        <div className="mt-1 text-xs font-semibold text-ink">{ev.role}</div>
                        <p className="mt-1 text-xs leading-relaxed text-ink-muted">{ev.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">
                    7-LGA Ground-Game Assessment
                  </h4>
                  <div className="mt-2 space-y-1.5">
                    {Object.entries(drawer.candidate.lgaFootprint).map(([code, fp]) => {
                      const lga = getLga(code);
                      return (
                        <div
                          key={code}
                          className="rounded-md border border-line bg-surface-raised/50 p-2.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-ink">{lga?.name ?? code}</span>
                            <span className={`rounded border px-1.5 py-px text-[9px] font-bold uppercase ${RATING_PILL[fp.rating]}`}>
                              {fp.rating}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-ink-muted">{fp.note}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {drawer.tab === 'assets' && (
              <div className="space-y-3">
                <div className="rounded-md border border-line bg-ground/70 p-3 text-xs">
                  <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
                    2027 Core Campaign Pitch
                  </div>
                  <ul className="mt-1.5 space-y-1.5 text-ink-muted">
                    {drawer.candidate.corePitch2027.map((p, i) => (
                      <li key={i}>• {p}</li>
                    ))}
                  </ul>
                </div>

                {drawer.candidate.assets.map((a, i) => (
                  <div key={i} className="rounded-md border border-aligned/35 bg-aligned/[0.05] p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-semibold text-ink">{a.title}</h4>
                      <span className="shrink-0 text-[10px] text-ink-faint">{a.source}</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">{a.detail}</p>
                    <div className="mt-2 rounded bg-ground/70 px-2.5 py-1.5 text-[11px] font-medium text-aligned">
                      Electoral value: {a.electoralValue}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {drawer.tab === 'risks' && (
              <div className="space-y-3">
                {drawer.candidate.vulnerabilities.map((v) => (
                  <div key={v.id} className="rounded-md border border-line bg-surface-raised/60 p-3.5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-xs font-semibold text-ink">{v.title}</h4>
                      <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${SEVERITY_BADGE[v.severity]}`}>
                        {v.severity}
                      </span>
                    </div>
                    <p className="text-xs text-ink-muted">
                      <strong className="text-ink">Verified record:</strong> {v.verifiedFact}
                    </p>
                    <p className="text-xs text-aggrieved">
                      <strong>Attack vector:</strong> {v.opponentAttackAngle}
                    </p>
                    <div className="rounded border border-accent/35 bg-accent/[0.06] p-2.5 text-xs text-ink">
                      <strong className="text-accent">War-room counter-play:</strong> {v.counterPlay}
                    </div>
                    <div className="text-[10px] text-ink-faint">Source: {v.source}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {drawer?.kind === 'dimension' && (
          <div className="space-y-4">
            <div className={`inline-flex rounded border px-2.5 py-1 text-xs font-bold ${LEADER_BADGE[drawer.dim.leader]}`}>
              Verdict: {drawer.dim.leaderLabel}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md border border-aligned/40 bg-aligned/10 p-2.5">
                <div className="text-[10px] text-aligned">Popoola (PDP)</div>
                <div className="figure mt-1 text-xl font-bold text-ink">{drawer.dim.popoolaScore}</div>
              </div>
              <div className="rounded-md border border-aggrieved/40 bg-aggrieved/10 p-2.5">
                <div className="text-[10px] text-aggrieved">Adewoye (APC)</div>
                <div className="figure mt-1 text-xl font-bold text-ink">{drawer.dim.adewoyeScore}</div>
              </div>
              <div className="rounded-md border border-passive/40 bg-passive/10 p-2.5">
                <div className="text-[10px] text-passive">Oyedepo (ADC)</div>
                <div className="figure mt-1 text-xl font-bold text-ink">{drawer.dim.oyedepoScore}</div>
              </div>
            </div>

            <div className="rounded-md border border-line bg-ground/70 p-3.5 text-xs space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
                Kwara Historical PDP Legacy Anchor
              </div>
              <p className="leading-relaxed text-ink">{drawer.dim.pdpLegacyAnchor}</p>
            </div>

            <div className="rounded-md border border-line bg-surface-raised p-3.5 text-xs space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                Current 2026 Ground Reality
              </div>
              <p className="leading-relaxed text-ink-muted">{drawer.dim.groundReality}</p>
            </div>

            <div className="rounded-md border border-aligned/45 bg-aligned/[0.08] p-3.5 text-xs space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-aligned">
                What Popoola MUST Do Here
              </div>
              <p className="leading-relaxed text-ink">{drawer.dim.whatPopoolaMustDo}</p>
            </div>
          </div>
        )}

        {drawer?.kind === 'history' && (
          <div className="space-y-4 text-xs">
            <div className="rounded-md border border-line bg-surface-raised p-3.5 space-y-2">
              <div className="flex justify-between">
                <span className="text-ink-faint">Winner</span>
                <span className="font-semibold text-ink">
                  {drawer.cycle.winner} ({drawer.cycle.party})
                </span>
              </div>
              {drawer.cycle.runnerUp && (
                <div className="flex justify-between">
                  <span className="text-ink-faint">Key Challenger(s)</span>
                  <span className="text-right text-ink-muted">{drawer.cycle.runnerUp}</span>
                </div>
              )}
              {drawer.cycle.winnerVotes && (
                <div className="flex justify-between">
                  <span className="text-ink-faint">Declared Votes</span>
                  <span className="figure font-semibold text-ink">
                    {drawer.cycle.winnerVotes.toLocaleString()}
                    {drawer.cycle.runnerUpVotes ? ` vs PDP ${drawer.cycle.runnerUpVotes.toLocaleString()}` : ''}
                    {drawer.cycle.sdpVotes ? ` + SDP ${drawer.cycle.sdpVotes.toLocaleString()}` : ''}
                  </span>
                </div>
              )}
            </div>

            <div className="rounded-md border border-line bg-ground/70 p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">
                Historical Significance
              </div>
              <p className="mt-1.5 leading-relaxed text-ink-muted">{drawer.cycle.significance}</p>
            </div>

            <div className="rounded-md border border-accent/40 bg-accent/[0.06] p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-accent">
                Relevance to 2027 PDP Legacy Ground Game
              </div>
              <p className="mt-1.5 leading-relaxed text-ink">{drawer.cycle.pdpLegacyNote}</p>
            </div>

            <div className="text-[10px] text-ink-faint">Source: {drawer.cycle.source}</div>
          </div>
        )}
      </DetailDrawer>
    </>
  );
}
