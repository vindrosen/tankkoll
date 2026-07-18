"use client";

const OPTIONS = [
  { months: 3, label: "3 månader" },
  { months: 6, label: "6 månader" },
  { months: 12, label: "12 månader" },
];

interface PeriodSelectProps {
  value: number;
  onChange(months: number): void;
}

export function PeriodSelect({ value, onChange }: PeriodSelectProps) {
  return (
    <label className="text-xs text-ink-muted">
      <span className="sr-only">Välj tidsperiod</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-lg border border-line bg-card-raised px-2 py-1.5 text-xs text-ink"
      >
        {OPTIONS.map((o) => (
          <option key={o.months} value={o.months}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
