"use client";

import { useMemo, useState } from "react";
import { Card, CardTitle } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { StatTile } from "@/components/StatTile";
import { Tabs } from "@/components/Tabs";
import { WltpBadge } from "@/components/WltpBadge";
import { MonthlyBarChart } from "@/components/charts/MonthlyBarChart";
import { PriceChart } from "@/components/charts/PriceChart";
import {
  computeStats,
  enrichRefuelings,
  monthlyAggregates,
  priceSeries,
} from "@/lib/calculations";
import { currencySuffix, formatCurrency, formatNumber } from "@/lib/format";
import {
  useActiveVehicle,
  useAppStore,
  useVehicleRefuelings,
} from "@/store/useAppStore";

type TabId = "oversikt" | "kostnader" | "jamforelse";

export default function StatisticsPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const currency = useAppStore((s) => s.settings.currency);
  const vehicles = useAppStore((s) => s.vehicles);
  const allRefuelings = useAppStore((s) => s.refuelings);
  const vehicle = useActiveVehicle();
  const refuelings = useVehicleRefuelings(vehicle?.id);
  const [tab, setTab] = useState<TabId>("oversikt");

  const enriched = useMemo(() => enrichRefuelings(refuelings), [refuelings]);
  const stats = useMemo(() => computeStats(enriched), [enriched]);
  const monthly = useMemo(() => monthlyAggregates(enriched, 12), [enriched]);
  const prices = useMemo(() => priceSeries(enriched, 12), [enriched]);
  const suffix = currencySuffix(currency);

  const comparisons = useMemo(
    () =>
      vehicles.map((v) => {
        const vEnriched = enrichRefuelings(
          allRefuelings.filter((r) => r.vehicleId === v.id),
        );
        return { vehicle: v, actual: computeStats(vEnriched).avgConsumption };
      }),
    [vehicles, allRefuelings],
  );

  if (!hydrated) {
    return <div aria-busy="true" className="h-96 animate-pulse rounded-2xl bg-card" />;
  }

  if (enriched.filter((r) => r.consumption !== undefined).length === 0 && tab !== "jamforelse") {
    return (
      <>
        <PageHeader title="Statistik" />
        <EmptyState
          image="tankningar"
          title="Ingen statistik ännu"
          body="Logga minst två tankningar med mätarställning så börjar statistiken byggas upp."
          ctaHref="/tankning"
          ctaLabel="Logga tankning"
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Statistik" />
      <Tabs<TabId>
        tabs={[
          { id: "oversikt", label: "Översikt" },
          { id: "kostnader", label: "Kostnader" },
          { id: "jamforelse", label: "Jämförelse" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "oversikt" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatTile
              label="Genomsnittlig förbrukning"
              value={stats.avgConsumption !== undefined ? formatNumber(stats.avgConsumption, 2) : "–"}
              unit="l/100 km"
            />
            <StatTile
              label="Lägsta förbrukning"
              value={stats.minConsumption !== undefined ? formatNumber(stats.minConsumption, 2) : "–"}
              unit="l/100 km"
            />
            <StatTile
              label="Högsta förbrukning"
              value={stats.maxConsumption !== undefined ? formatNumber(stats.maxConsumption, 2) : "–"}
              unit="l/100 km"
            />
            <StatTile
              label="Körda kilometer"
              value={formatNumber(stats.totalDistance)}
              unit="km"
            />
            <StatTile
              label="Totalt bränsle"
              value={formatNumber(stats.totalLiters, 1)}
              unit="liter"
            />
            <StatTile
              label="Total kostnad"
              value={formatNumber(stats.totalCost)}
              unit={suffix}
            />
          </div>
          <Card>
            <CardTitle>Förbrukning per månad (12 månader)</CardTitle>
            <MonthlyBarChart
              data={monthly}
              dataKey="avgConsumption"
              unit="l/100 km"
              decimals={2}
              ariaLabel="Stapeldiagram över genomsnittlig förbrukning per månad"
            />
          </Card>
          <Card>
            <CardTitle>Körsträcka per månad</CardTitle>
            <MonthlyBarChart
              data={monthly}
              dataKey="distance"
              unit="km"
              ariaLabel="Stapeldiagram över körsträcka per månad"
            />
          </Card>
        </div>
      )}

      {tab === "kostnader" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatTile
              label="Snittpris per liter"
              value={stats.avgPricePerLiter !== undefined ? formatNumber(stats.avgPricePerLiter, 2) : "–"}
              unit={`${suffix}/liter`}
            />
            <StatTile
              label="Kostnad per mil"
              value={stats.costPerMil !== undefined ? formatNumber(stats.costPerMil, 2) : "–"}
              unit={`${suffix}/mil`}
            />
            <StatTile
              label="Kostnad per km"
              value={stats.costPerKm !== undefined ? formatNumber(stats.costPerKm, 2) : "–"}
              unit={`${suffix}/km`}
            />
          </div>
          <Card>
            <CardTitle>Bränslekostnad per månad</CardTitle>
            <MonthlyBarChart
              data={monthly}
              dataKey="cost"
              unit={suffix}
              ariaLabel="Stapeldiagram över bränslekostnad per månad"
            />
          </Card>
          <Card>
            <CardTitle>Bränslepris över tid</CardTitle>
            {prices.length >= 2 ? (
              <PriceChart data={prices} currencySuffix={suffix} />
            ) : (
              <p className="py-10 text-center text-sm text-ink-muted">
                Ange pris per liter på minst två tankningar för att se prisutvecklingen.
              </p>
            )}
          </Card>
        </div>
      )}

      {tab === "jamforelse" && (
        <div className="space-y-4">
          {comparisons.map(({ vehicle: v, actual }) => (
            <Card key={v.id}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-bold">{v.name}</h2>
                  {v.registrationNumber && (
                    <p className="text-xs text-ink-muted">{v.registrationNumber}</p>
                  )}
                </div>
                {v.wltpConsumption !== undefined && actual !== undefined ? (
                  <WltpBadge actual={actual} official={v.wltpConsumption} />
                ) : (
                  <p className="text-xs text-ink-faint">
                    {v.wltpConsumption === undefined
                      ? "Ange WLTP-förbrukning under Bilar för att jämföra"
                      : "Logga tankningar för att jämföra"}
                  </p>
                )}
              </div>
              {v.wltpConsumption !== undefined && actual !== undefined && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-card-raised p-4">
                    <p className="text-xs text-ink-muted">Din förbrukning</p>
                    <p className="mt-1 text-xl font-bold">
                      {formatNumber(actual, 2)}{" "}
                      <span className="text-sm font-normal text-ink-faint">l/100 km</span>
                    </p>
                  </div>
                  <div className="rounded-xl bg-card-raised p-4">
                    <p className="text-xs text-ink-muted">WLTP (fabriksuppgift)</p>
                    <p className="mt-1 text-xl font-bold">
                      {formatNumber(v.wltpConsumption, 2)}{" "}
                      <span className="text-sm font-normal text-ink-faint">l/100 km</span>
                    </p>
                  </div>
                </div>
              )}
            </Card>
          ))}
          {comparisons.length === 0 && (
            <EmptyState
              image="bilar"
              title="Inga bilar att jämföra"
              body="Lägg till en bil med WLTP-förbrukning för att jämföra mot din verkliga förbrukning."
              ctaHref="/bilar"
              ctaLabel="Lägg till bil"
            />
          )}
        </div>
      )}
    </>
  );
}
