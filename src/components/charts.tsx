/**
 * Chart primitives — KS2027 War Room.
 *
 * Built against the dark war room surface (#11151d). Series 0 uses PDP emerald (#199e70) so the
 * principal's party reads cleanly alongside APC (#3987e5), SDP (#d95926), and ADC/others (#c98500).
 */

import type { ReactNode } from 'react';

/** Validated categorical series palette: PDP emerald, APC blue, SDP orange, ADC/others amber. */
export const SERIES = ['#199e70', '#3987e5', '#d95926', '#c98500'] as const;

/** Sequential ramp (emerald, light→dark) for turnout and funnel magnitude encoding. */
const SEQUENTIAL = [
  '#c8f3df', '#96e4c1', '#60d09f', '#2db67d', '#199e70', '#127a56', '#0b563c',
];

export function sequentialColor(t: number): string {
  const i = Math.min(SEQUENTIAL.length - 1, Math.max(0, Math.round(t * (SEQUENTIAL.length - 1))));
  return SEQUENTIAL[i];
}

const fmt = (n: number) => n.toLocaleString('en-NG');

export function Stat({
  label,
  value,
  sub,
  tone = 'neutral',
  size = 'md',
}: {
  label: string;
  value: string | number;
  sub?: ReactNode;
  tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'accent';
  size?: 'sm' | 'md' | 'lg';
}) {
  const toneClass = {
    neutral: 'text-ink',
    good: 'text-aligned',
    warn: 'text-passive',
    bad: 'text-aggrieved',
    accent: 'text-accent',
  }[tone];
  const sizeClass = {
    sm: 'text-xl sm:text-2xl',
    md: 'text-3xl sm:text-4xl',
    lg: 'text-4xl sm:text-6xl',
  }[size];

  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-faint">
        {label}
      </div>
      <div className={`figure mt-1 ${sizeClass} font-semibold leading-none ${toneClass}`}>
        {typeof value === 'number' ? fmt(value) : value}
      </div>
      {sub && <div className="mt-1.5 text-[11px] leading-tight text-ink-muted">{sub}</div>}
    </div>
  );
}

export interface BarDatum {
  label: string;
  value: number;
  note?: string;
  color?: string;
  href?: string;
}

export function RankedBars({
  data,
  valueFormat = fmt,
  max,
  showValue = true,
  barClass = '',
}: {
  data: BarDatum[];
  valueFormat?: (n: number) => string;
  max?: number;
  showValue?: boolean;
  barClass?: string;
}) {
  const peak = max ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-1.5">
      {data.map((d) => (
        <div key={d.label} className="group flex items-center gap-3">
          <div className="w-20 shrink-0 truncate text-right sm:w-28">
            <div className="truncate text-xs text-ink" title={d.label}>
              {d.label}
            </div>
            {d.note && <div className="truncate text-[10px] text-ink-faint">{d.note}</div>}
          </div>
          <div className="h-4 flex-1">
            <div
              className={`h-full rounded-r-[4px] transition-opacity group-hover:opacity-100 ${barClass}`}
              style={{
                width: `${Math.max((d.value / peak) * 100, 0.6)}%`,
                background: d.color ?? SERIES[0],
              }}
              title={`${d.label}: ${valueFormat(d.value)}`}
            />
          </div>
          {showValue && (
            <div className="figure w-14 shrink-0 text-right text-xs tabular-nums text-ink sm:w-20">
              {valueFormat(d.value)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export interface Segment {
  label: string;
  value: number;
  color: string;
}

export function StackedBar({
  segments,
  height = 'h-6',
  showLabels = false,
}: {
  segments: Segment[];
  height?: string;
  showLabels?: boolean;
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;

  return (
    <div className={`flex ${height} w-full gap-[2px] overflow-hidden`}>
      {segments
        .filter((s) => s.value > 0)
        .map((s, i, arr) => (
          <div
            key={s.label}
            className={`flex items-center justify-start overflow-hidden ${
              i === 0 ? 'rounded-l-[4px]' : ''
            } ${i === arr.length - 1 ? 'rounded-r-[4px]' : ''}`}
            style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
            title={`${s.label}: ${fmt(s.value)} (${((s.value / total) * 100).toFixed(1)}%)`}
          >
            {showLabels && s.value / total > 0.09 && (
              <span className="figure px-1.5 text-[10px] font-semibold text-ground">
                {((s.value / total) * 100).toFixed(0)}%
              </span>
            )}
          </div>
        ))}
    </div>
  );
}

export function Legend({ items }: { items: { label: string; color: string; value?: string }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-1.5">
          <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: i.color }} />
          <span className="text-[11px] text-ink-muted">{i.label}</span>
          {i.value && <span className="figure text-[11px] text-ink">{i.value}</span>}
        </div>
      ))}
    </div>
  );
}

export function DivergingBars({
  data,
  format = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(1)}`,
}: {
  data: { label: string; value: number; note?: string }[];
  format?: (n: number) => string;
}) {
  const extent = Math.max(...data.map((d) => Math.abs(d.value)), 1);

  return (
    <div className="space-y-2">
      {data.map((d) => {
        const w = (Math.abs(d.value) / extent) * 50;
        const positive = d.value >= 0;
        return (
          <div key={d.label} className="flex items-center gap-3">
            <div className="w-20 shrink-0 text-right sm:w-28">
              <div className="truncate text-xs text-ink">{d.label}</div>
              {d.note && <div className="truncate text-[10px] text-ink-faint">{d.note}</div>}
            </div>
            <div className="relative h-5 flex-1">
              <div className="absolute inset-y-0 left-1/2 w-px bg-line-bright" />
              <div
                className="absolute top-0 h-full"
                style={{
                  left: positive ? '50%' : `${50 - w}%`,
                  width: `${w}%`,
                  background: positive ? SERIES[0] : '#d03b3b',
                  borderRadius: positive ? '0 4px 4px 0' : '4px 0 0 4px',
                }}
                title={`${d.label}: ${format(d.value)}`}
              />
            </div>
            <div
              className={`figure w-12 shrink-0 text-right text-xs tabular-nums sm:w-16 ${
                positive ? 'text-ink' : 'text-aggrieved'
              }`}
            >
              {format(d.value)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Gauge({
  value,
  label,
  caption,
  tone = 'good',
}: {
  value: number;
  label: string;
  caption?: string;
  tone?: 'good' | 'warn' | 'bad';
}) {
  const color = { good: '#16a34a', warn: '#fab219', bad: '#d03b3b' }[tone];
  const r = 42;
  const circumference = Math.PI * r;
  const filled = Math.min(1, Math.max(0, value)) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 100 56"
        className="w-full max-w-[180px]"
        role="img"
        aria-label={`${label}: ${(value * 100).toFixed(1)}%`}
      >
        <path
          d={`M 8 50 A ${r} ${r} 0 0 1 92 50`}
          fill="none"
          stroke="#232a36"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d={`M 8 50 A ${r} ${r} 0 0 1 92 50`}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
        />
      </svg>
      <div className="figure -mt-4 text-2xl font-semibold text-ink">
        {(value * 100).toFixed(1)}%
      </div>
      <div className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-ink-faint">{label}</div>
      {caption && <div className="mt-0.5 text-[11px] text-ink-muted">{caption}</div>}
    </div>
  );
}

export function Sparkline({
  values,
  color = SERIES[0],
  height = 28,
  ariaLabel,
}: {
  values: number[];
  color?: string;
  height?: number;
  ariaLabel?: string;
}) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const w = 100;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = height - (v / max) * (height - 3) - 1.5;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      className="w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label={ariaLabel ?? 'trend'}
    >
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export interface MosaicCell {
  id: string;
  weight: number;
  color: string;
  title: string;
  label?: string;
  href?: string;
}

export interface MosaicRow {
  id: string;
  label: string;
  weight: number;
  note?: string;
  cells: MosaicCell[];
}

export function WeightedMosaic({ rows, height = 22 }: { rows: MosaicRow[]; height?: number }) {
  const widest = Math.max(...rows.map((r) => r.weight), 1);

  return (
    <div className="space-y-1.5">
      {rows.map((row) => {
        const rowTotal = row.cells.reduce((s, c) => s + c.weight, 0) || 1;
        return (
          <div key={row.id} className="flex items-center gap-2 sm:gap-3">
            <div className="w-[68px] shrink-0 text-right sm:w-24">
              <div className="truncate text-[10px] text-ink sm:text-[11px]" title={row.label}>
                {row.label}
              </div>
              {row.note && (
                <div className="figure truncate text-[10px] text-ink-faint">{row.note}</div>
              )}
            </div>
            <div className="flex-1">
              <div
                className="flex gap-[2px] overflow-hidden rounded-[3px]"
                style={{ width: `${(row.weight / widest) * 100}%`, height }}
              >
                {row.cells.map((c) => {
                  const share = c.weight / rowTotal;
                  return (
                    <div
                      key={c.id}
                      title={c.title}
                      className="flex cursor-help items-center justify-center overflow-hidden transition-opacity hover:opacity-80"
                      style={{ width: `${share * 100}%`, background: c.color }}
                    >
                      {c.label && share > 0.13 && (
                        <span className="figure truncate px-1 text-[9px] font-semibold text-ground/85">
                          {c.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Funnel({
  stages,
}: {
  stages: { label: string; value: number; note?: string }[];
}) {
  const top = stages[0]?.value || 1;

  return (
    <div className="space-y-1">
      {stages.map((s, i) => {
        const share = s.value / top;
        const prev = i > 0 ? stages[i - 1].value : s.value;
        const drop = prev > 0 ? 1 - s.value / prev : 0;
        return (
          <div key={s.label} className="flex items-center gap-3">
            <div className="w-20 shrink-0 text-right text-[11px] text-ink-muted sm:w-32">
              {s.label}
            </div>
            <div className="h-7 flex-1">
              <div
                className="flex h-full items-center rounded-[4px] px-2"
                style={{
                  width: `${Math.max(share * 100, 4)}%`,
                  background: sequentialColor(1 - i / Math.max(stages.length - 1, 1)),
                }}
              >
                <span className="figure text-[11px] font-semibold text-ground">
                  {fmt(s.value)}
                </span>
              </div>
            </div>
            <div className="w-14 shrink-0 text-right sm:w-24">
              <div className="figure text-[11px] text-ink">{(share * 100).toFixed(0)}%</div>
              {i > 0 && drop > 0.005 && (
                <div className="figure text-[10px] text-aggrieved">
                  −{(drop * 100).toFixed(0)}%
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function HeatGrid({
  cells,
}: {
  cells: { label: string; t: number; value: string; title: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
      {cells.map((c) => {
        const bg = sequentialColor(c.t);
        const ink = c.t > 0.5 ? '#ffffff' : '#0b0b0b';
        return (
          <div
            key={c.label}
            className="rounded-[4px] px-2.5 py-2"
            style={{ background: bg }}
            title={c.title}
          >
            <div className="truncate text-[10px] font-medium" style={{ color: ink, opacity: 0.78 }}>
              {c.label}
            </div>
            <div className="figure text-sm font-semibold tabular-nums" style={{ color: ink }}>
              {c.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
