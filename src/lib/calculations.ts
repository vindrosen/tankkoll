import type { Refueling } from "./types";

/**
 * A refueling with values derived from its predecessor (sorted by odometer).
 * Derived values are never persisted — always recomputed from the raw list.
 */
export interface EnrichedRefueling extends Refueling {
  /** km since the previous refueling (undefined for the baseline entry) */
  distance?: number;
  /** L/100 km */
  consumption?: number;
  kmPerLiter?: number;
  /** liters × pricePerLiter */
  cost?: number;
  costPerKm?: number;
  /** cost per mil (10 km) */
  costPerMil?: number;
}

export interface VehicleStats {
  count: number;
  totalDistance: number;
  totalLiters: number;
  totalCost: number;
  avgConsumption?: number;
  minConsumption?: number;
  maxConsumption?: number;
  avgPricePerLiter?: number;
  costPerKm?: number;
  costPerMil?: number;
}

export interface MonthlyAgg {
  /** 'YYYY-MM' */
  month: string;
  /** Short Swedish month label, e.g. 'jun' */
  label: string;
  cost: number;
  distance: number;
  liters: number;
  avgConsumption?: number;
  avgPrice?: number;
}

export function enrichRefuelings(refuelings: Refueling[]): EnrichedRefueling[] {
  const sorted = [...refuelings].sort((a, b) => a.odometer - b.odometer);
  return sorted.map((r, i) => {
    const enriched: EnrichedRefueling = { ...r };
    if (r.pricePerLiter !== undefined) {
      enriched.cost = r.liters * r.pricePerLiter;
    }
    if (i === 0) return enriched;
    const distance = r.odometer - sorted[i - 1].odometer;
    if (distance <= 0) return enriched;
    enriched.distance = distance;
    enriched.consumption = (r.liters / distance) * 100;
    enriched.kmPerLiter = distance / r.liters;
    if (enriched.cost !== undefined) {
      enriched.costPerKm = enriched.cost / distance;
      enriched.costPerMil = enriched.costPerKm * 10;
    }
    return enriched;
  });
}

export function computeStats(enriched: EnrichedRefueling[]): VehicleStats {
  const withDistance = enriched.filter((r) => r.distance !== undefined);
  const withPrice = enriched.filter((r) => r.pricePerLiter !== undefined);
  const withCostAndDistance = withDistance.filter((r) => r.cost !== undefined);

  const totalDistance = withDistance.reduce((sum, r) => sum + (r.distance ?? 0), 0);
  const litersOverDistance = withDistance.reduce((sum, r) => sum + r.liters, 0);
  const costOverDistance = withCostAndDistance.reduce((sum, r) => sum + (r.cost ?? 0), 0);
  const totalLiters = enriched.reduce((sum, r) => sum + r.liters, 0);
  const pricedLiters = withPrice.reduce((sum, r) => sum + r.liters, 0);
  const consumptions = withDistance
    .map((r) => r.consumption)
    .filter((c): c is number => c !== undefined);

  const costPerKm =
    totalDistance > 0 && withCostAndDistance.length > 0
      ? costOverDistance / totalDistance
      : undefined;

  return {
    count: enriched.length,
    totalDistance,
    totalLiters,
    totalCost: enriched.reduce((sum, r) => sum + (r.cost ?? 0), 0),
    avgConsumption:
      totalDistance > 0 ? (litersOverDistance / totalDistance) * 100 : undefined,
    minConsumption: consumptions.length ? Math.min(...consumptions) : undefined,
    maxConsumption: consumptions.length ? Math.max(...consumptions) : undefined,
    avgPricePerLiter:
      pricedLiters > 0
        ? withPrice.reduce((sum, r) => sum + r.liters * (r.pricePerLiter ?? 0), 0) /
          pricedLiters
        : undefined,
    costPerKm,
    costPerMil: costPerKm !== undefined ? costPerKm * 10 : undefined,
  };
}

export function gaugeAverage(
  enriched: EnrichedRefueling[],
  n = 5,
): number | undefined {
  const consumptions = enriched
    .map((r) => r.consumption)
    .filter((c): c is number => c !== undefined)
    .slice(-n);
  if (!consumptions.length) return undefined;
  return consumptions.reduce((sum, c) => sum + c, 0) / consumptions.length;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

const monthLabelFormatter = new Intl.DateTimeFormat("sv-SE", { month: "short" });

export function monthlyAggregates(
  enriched: EnrichedRefueling[],
  months: number,
  now: Date = new Date(),
): MonthlyAgg[] {
  const buckets = new Map<string, EnrichedRefueling[]>();
  for (const r of enriched) {
    const key = r.date.slice(0, 7);
    const list = buckets.get(key) ?? [];
    list.push(r);
    buckets.set(key, list);
  }

  const result: MonthlyAgg[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(d);
    const list = buckets.get(key) ?? [];
    const withDistance = list.filter((r) => r.distance !== undefined);
    const distance = withDistance.reduce((sum, r) => sum + (r.distance ?? 0), 0);
    const litersOverDistance = withDistance.reduce((sum, r) => sum + r.liters, 0);
    const withPrice = list.filter((r) => r.pricePerLiter !== undefined);
    const pricedLiters = withPrice.reduce((sum, r) => sum + r.liters, 0);
    result.push({
      month: key,
      label: monthLabelFormatter.format(d).replace(".", ""),
      cost: list.reduce((sum, r) => sum + (r.cost ?? 0), 0),
      distance,
      liters: list.reduce((sum, r) => sum + r.liters, 0),
      avgConsumption:
        distance > 0 ? (litersOverDistance / distance) * 100 : undefined,
      avgPrice:
        pricedLiters > 0
          ? withPrice.reduce((sum, r) => sum + r.liters * (r.pricePerLiter ?? 0), 0) /
            pricedLiters
          : undefined,
    });
  }
  return result;
}

export function currentMonthSummary(
  enriched: EnrichedRefueling[],
  now: Date = new Date(),
): { distance: number; cost: number; avgConsumption?: number } {
  const [agg] = monthlyAggregates(enriched, 1, now);
  return {
    distance: agg.distance,
    cost: agg.cost,
    avgConsumption: agg.avgConsumption,
  };
}

function windowStart(months: number, now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
}

export function consumptionSeries(
  enriched: EnrichedRefueling[],
  months: number,
  now: Date = new Date(),
): { date: string; consumption: number }[] {
  const start = windowStart(months, now);
  return enriched
    .filter((r) => r.consumption !== undefined && new Date(r.date) >= start)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({ date: r.date, consumption: r.consumption as number }));
}

export function priceSeries(
  enriched: EnrichedRefueling[],
  months: number,
  now: Date = new Date(),
): { date: string; price: number }[] {
  const start = windowStart(months, now);
  return enriched
    .filter((r) => r.pricePerLiter !== undefined && new Date(r.date) >= start)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({ date: r.date, price: r.pricePerLiter as number }));
}

/** Percentage difference between actual and official WLTP consumption, rounded. */
export function wltpDiffPercent(actual: number, official: number): number {
  return Math.round(((actual - official) / official) * 100);
}
