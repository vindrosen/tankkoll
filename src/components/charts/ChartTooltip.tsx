"use client";

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  rows?: { text: string }[];
}

export function ChartTooltipFrame({ active, label, rows }: ChartTooltipProps) {
  if (!active || !rows?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-card-raised px-3 py-2 text-xs shadow-lg">
      {label && <p className="font-semibold text-ink">{label}</p>}
      {rows.map((row, i) => (
        <p key={i} className="mt-0.5 text-ink-muted">
          {row.text}
        </p>
      ))}
    </div>
  );
}
