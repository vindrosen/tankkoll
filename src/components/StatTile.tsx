import { Card } from "./Card";

interface StatTileProps {
  label: string;
  value: string;
  unit?: string;
}

export function StatTile({ label, value, unit }: StatTileProps) {
  return (
    <Card className="p-4">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      {unit && <p className="text-xs text-ink-faint">{unit}</p>}
    </Card>
  );
}
