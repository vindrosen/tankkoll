import { wltpDiffPercent } from "@/lib/calculations";
import { formatNumber } from "@/lib/format";

interface WltpBadgeProps {
  actual: number;
  official: number;
}

/** Colored comparison badge: green at or below WLTP, red above. */
export function WltpBadge({ actual, official }: WltpBadgeProps) {
  const diff = wltpDiffPercent(actual, official);
  const above = diff > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-bold ${
        above ? "bg-danger/15 text-danger" : "bg-success/15 text-success"
      }`}
    >
      {above ? "+" : ""}
      {formatNumber(diff)} %
      <span className="sr-only">
        {above ? "högre än" : "lägre än eller lika med"} fabriksuppgiften
      </span>
    </span>
  );
}
