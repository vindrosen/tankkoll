"use client";

import { formatNumber } from "@/lib/format";

const GAUGE_MAX = 15;
const START_ANGLE = -120;
const SWEEP = 240;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, from: number, to: number) {
  const start = polar(cx, cy, r, from);
  const end = polar(cx, cy, r, to);
  const largeArc = to - from > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

interface GaugeProps {
  /** Average consumption in L/100 km, undefined when no data yet */
  value?: number;
  sublabel: string;
}

export function Gauge({ value, sublabel }: GaugeProps) {
  const clamped = Math.max(0, Math.min(value ?? 0, GAUGE_MAX));
  const valueAngle = START_ANGLE + (SWEEP * clamped) / GAUGE_MAX;
  const label =
    value !== undefined
      ? `Genomsnittlig förbrukning ${formatNumber(value, 2)} liter per 100 kilometer`
      : "Ingen förbrukningsdata ännu";

  return (
    <div role="img" aria-label={label} className="relative mx-auto w-full max-w-60">
      <svg viewBox="0 0 200 190" className="w-full">
        <defs>
          <linearGradient id="gauge-gradient" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="55%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        <path
          d={arcPath(100, 100, 84, START_ANGLE, START_ANGLE + SWEEP)}
          fill="none"
          stroke="var(--line)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {value !== undefined && clamped > 0 && (
          <path
            d={arcPath(100, 100, 84, START_ANGLE, valueAngle)}
            fill="none"
            stroke="url(#gauge-gradient)"
            strokeWidth="12"
            strokeLinecap="round"
          />
        )}
        <text
          x="100"
          y="98"
          textAnchor="middle"
          className="fill-[var(--ink)]"
          fontSize="44"
          fontWeight="800"
        >
          {value !== undefined ? formatNumber(value, 2) : "–"}
        </text>
        <text x="100" y="122" textAnchor="middle" className="fill-[var(--ink-muted)]" fontSize="14">
          l/100 km
        </text>
        <text x="30" y="182" textAnchor="middle" className="fill-[var(--ink-faint)]" fontSize="12">
          0
        </text>
        <text x="170" y="182" textAnchor="middle" className="fill-[var(--ink-faint)]" fontSize="12">
          {GAUGE_MAX}
        </text>
      </svg>
      <p className="mt-1 text-center text-xs text-ink-muted">{sublabel}</p>
    </div>
  );
}
