import { describe, expect, it } from "vitest";
import type { Refueling } from "@/lib/types";
import {
  consumptionSeries,
  computeStats,
  currentMonthSummary,
  enrichRefuelings,
  gaugeAverage,
  monthlyAggregates,
  priceSeries,
  wltpDiffPercent,
} from "@/lib/calculations";

let seq = 0;
function ref(partial: Partial<Refueling>): Refueling {
  seq += 1;
  return {
    id: `r${seq}`,
    vehicleId: "v1",
    date: "2024-07-17",
    liters: 40,
    odometer: 10000,
    createdAt: "2024-07-17T12:00:00.000Z",
    ...partial,
  };
}

describe("enrichRefuelings", () => {
  it("computes the mockup's figures: 42.8 L over 698 km at 18.90 kr/L", () => {
    const list = [
      ref({ odometer: 124762, date: "2024-07-04" }),
      ref({ odometer: 125460, date: "2024-07-17", liters: 42.8, pricePerLiter: 18.9 }),
    ];
    const [, latest] = enrichRefuelings(list);
    expect(latest.distance).toBe(698);
    expect(latest.consumption).toBeCloseTo(6.13, 2);
    expect(latest.kmPerLiter).toBeCloseTo(16.31, 2);
    expect(latest.cost).toBeCloseTo(808.92, 2);
    expect(latest.costPerKm).toBeCloseTo(1.159, 3);
    expect(latest.costPerMil).toBeCloseTo(11.59, 2);
  });

  it("treats the first (lowest odometer) entry as a baseline without distance", () => {
    const [first] = enrichRefuelings([ref({ odometer: 1000 }), ref({ odometer: 2000 })]);
    expect(first.distance).toBeUndefined();
    expect(first.consumption).toBeUndefined();
    expect(first.costPerKm).toBeUndefined();
  });

  it("sorts by odometer regardless of input order", () => {
    const enriched = enrichRefuelings([
      ref({ odometer: 3000, liters: 50 }),
      ref({ odometer: 1000 }),
      ref({ odometer: 2000, liters: 40 }),
    ]);
    expect(enriched.map((r) => r.odometer)).toEqual([1000, 2000, 3000]);
    expect(enriched[1].distance).toBe(1000);
    expect(enriched[1].consumption).toBeCloseTo(4.0, 5);
    expect(enriched[2].distance).toBe(1000);
    expect(enriched[2].consumption).toBeCloseTo(5.0, 5);
  });

  it("omits cost fields when price is missing (not zero)", () => {
    const [, second] = enrichRefuelings([
      ref({ odometer: 1000 }),
      ref({ odometer: 1500, pricePerLiter: undefined }),
    ]);
    expect(second.cost).toBeUndefined();
    expect(second.costPerKm).toBeUndefined();
  });

  it("skips consumption for non-positive distances (duplicate odometer)", () => {
    const enriched = enrichRefuelings([
      ref({ odometer: 1000 }),
      ref({ odometer: 1000, liters: 30 }),
    ]);
    expect(enriched[1].distance).toBeUndefined();
    expect(enriched[1].consumption).toBeUndefined();
  });

  it("returns empty array for no refuelings", () => {
    expect(enrichRefuelings([])).toEqual([]);
  });
});

describe("computeStats", () => {
  const enriched = enrichRefuelings([
    ref({ odometer: 1000, liters: 10, pricePerLiter: 20 }),
    ref({ odometer: 1500, liters: 30, pricePerLiter: 20 }), // 6.0 L/100km, 600 kr
    ref({ odometer: 2000, liters: 20, pricePerLiter: 10 }), // 4.0 L/100km, 200 kr
  ]);
  const stats = computeStats(enriched);

  it("counts entries and sums totals over all entries", () => {
    expect(stats.count).toBe(3);
    expect(stats.totalLiters).toBe(60);
    expect(stats.totalDistance).toBe(1000);
    // baseline cost included in money spent: 10*20 + 30*20 + 20*10 = 1000
    expect(stats.totalCost).toBe(1000);
  });

  it("weights average consumption by distance, not per-entry mean", () => {
    // (30+20) liters over 1000 km = 5.0 — not mean(6,4) which happens to agree,
    // so verify with asymmetric distances too below.
    expect(stats.avgConsumption).toBeCloseTo(5.0, 5);
    expect(stats.minConsumption).toBeCloseTo(4.0, 5);
    expect(stats.maxConsumption).toBeCloseTo(6.0, 5);
  });

  it("weights avg price per liter by liters", () => {
    // (10*20 + 30*20 + 20*10) / 60 = 16.67
    expect(stats.avgPricePerLiter).toBeCloseTo(16.667, 3);
  });

  it("computes cost per km from entries that have both cost and distance", () => {
    // (600 + 200) / 1000 = 0.8 kr/km, 8 kr/mil
    expect(stats.costPerKm).toBeCloseTo(0.8, 5);
    expect(stats.costPerMil).toBeCloseTo(8.0, 5);
  });

  it("handles the asymmetric-distance weighting case", () => {
    const s = computeStats(
      enrichRefuelings([
        ref({ odometer: 0, liters: 1 }),
        ref({ odometer: 100, liters: 10 }), // 10 L/100km over 100 km
        ref({ odometer: 1000, liters: 45 }), // 5 L/100km over 900 km
      ]),
    );
    // (10+45)/1000*100 = 5.5, not mean(10,5)=7.5
    expect(s.avgConsumption).toBeCloseTo(5.5, 5);
  });

  it("returns undefined aggregates when nothing is computable", () => {
    const s = computeStats(enrichRefuelings([ref({ odometer: 500 })]));
    expect(s.count).toBe(1);
    expect(s.avgConsumption).toBeUndefined();
    expect(s.costPerKm).toBeUndefined();
    expect(s.avgPricePerLiter).toBeUndefined();
  });
});

describe("gaugeAverage", () => {
  it("averages the last five consumption values", () => {
    const list: Refueling[] = [ref({ odometer: 0, liters: 10 })];
    // six segments of 100 km with liters 4,5,6,7,8,9 → consumption 4..9
    [4, 5, 6, 7, 8, 9].forEach((l, i) =>
      list.push(ref({ odometer: (i + 1) * 100, liters: l })),
    );
    // last five: 5,6,7,8,9 → 7
    expect(gaugeAverage(enrichRefuelings(list))).toBeCloseTo(7.0, 5);
  });

  it("averages what exists when fewer than five", () => {
    const enriched = enrichRefuelings([
      ref({ odometer: 0 }),
      ref({ odometer: 100, liters: 6 }),
    ]);
    expect(gaugeAverage(enriched)).toBeCloseTo(6.0, 5);
  });

  it("returns undefined with no consumption data", () => {
    expect(gaugeAverage(enrichRefuelings([ref({})]))).toBeUndefined();
  });
});

describe("monthlyAggregates", () => {
  const now = new Date("2024-07-17T12:00:00");
  const enriched = enrichRefuelings([
    ref({ odometer: 1000, date: "2024-05-10", liters: 10, pricePerLiter: 18 }),
    ref({ odometer: 1500, date: "2024-06-10", liters: 30, pricePerLiter: 19 }),
    ref({ odometer: 2100, date: "2024-07-10", liters: 36, pricePerLiter: 20 }),
  ]);

  it("zero-fills a full window of calendar months ending now", () => {
    const aggs = monthlyAggregates(enriched, 6, now);
    expect(aggs).toHaveLength(6);
    expect(aggs[0].month).toBe("2024-02");
    expect(aggs[5].month).toBe("2024-07");
    expect(aggs[0].cost).toBe(0);
    expect(aggs[0].distance).toBe(0);
    expect(aggs[0].avgConsumption).toBeUndefined();
  });

  it("aggregates cost, distance, liters and consumption per month", () => {
    const aggs = monthlyAggregates(enriched, 6, now);
    const june = aggs.find((a) => a.month === "2024-06")!;
    expect(june.cost).toBeCloseTo(570, 5); // 30*19
    expect(june.distance).toBe(500);
    expect(june.liters).toBe(30);
    expect(june.avgConsumption).toBeCloseTo(6.0, 5);
    expect(june.avgPrice).toBeCloseTo(19, 5);
    const july = aggs.find((a) => a.month === "2024-07")!;
    expect(july.distance).toBe(600);
    expect(july.avgConsumption).toBeCloseTo(6.0, 5);
  });
});

describe("currentMonthSummary", () => {
  it("summarizes only the current calendar month", () => {
    const now = new Date("2024-07-17T12:00:00");
    const enriched = enrichRefuelings([
      ref({ odometer: 1000, date: "2024-06-28", liters: 20, pricePerLiter: 19 }),
      ref({ odometer: 1676, date: "2024-07-04", liters: 40, pricePerLiter: 18.7 }),
      ref({ odometer: 2352, date: "2024-07-17", liters: 40, pricePerLiter: 18.9 }),
    ]);
    const summary = currentMonthSummary(enriched, now);
    expect(summary.distance).toBe(1352);
    expect(summary.cost).toBeCloseTo(40 * 18.7 + 40 * 18.9, 5);
    expect(summary.avgConsumption).toBeCloseTo((80 / 1352) * 100, 4);
  });
});

describe("series", () => {
  const now = new Date("2024-07-17T12:00:00");
  const enriched = enrichRefuelings([
    ref({ odometer: 1000, date: "2023-12-10", liters: 10, pricePerLiter: 17 }),
    ref({ odometer: 1500, date: "2024-06-10", liters: 30, pricePerLiter: 19 }),
    ref({ odometer: 2000, date: "2024-07-10", liters: 25, pricePerLiter: 20 }),
  ]);

  it("consumptionSeries includes only entries with consumption inside the window", () => {
    const series = consumptionSeries(enriched, 6, now);
    expect(series).toEqual([
      { date: "2024-06-10", consumption: 6 },
      { date: "2024-07-10", consumption: 5 },
    ]);
  });

  it("priceSeries includes entries with price inside the window", () => {
    const series = priceSeries(enriched, 6, now);
    expect(series).toEqual([
      { date: "2024-06-10", price: 19 },
      { date: "2024-07-10", price: 20 },
    ]);
  });
});

describe("wltpDiffPercent", () => {
  it("matches the mockup: 5.89 actual vs 5.4 official = +9 %", () => {
    expect(wltpDiffPercent(5.89, 5.4)).toBe(9);
  });

  it("is negative when actual beats official", () => {
    expect(wltpDiffPercent(5.0, 5.4)).toBe(-7);
  });

  it("is zero when equal", () => {
    expect(wltpDiffPercent(5.4, 5.4)).toBe(0);
  });
});
