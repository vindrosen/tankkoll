"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Calendar, Droplets, Fuel, Gauge as GaugeIcon, Leaf, Plus, Route } from "lucide-react";
import { Card, CardTitle } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { Gauge } from "@/components/Gauge";
import { PageHeader } from "@/components/PageHeader";
import { RecentRefuelings } from "@/components/RecentRefuelings";
import { PeriodSelect } from "@/components/PeriodSelect";
import { ConsumptionChart } from "@/components/charts/ConsumptionChart";
import {
  consumptionSeries,
  currentMonthSummary,
  enrichRefuelings,
  gaugeAverage,
} from "@/lib/calculations";
import { currencySuffix, formatCurrency, formatDate, formatNumber } from "@/lib/format";
import {
  useActiveVehicle,
  useAppStore,
  useVehicleRefuelings,
} from "@/store/useAppStore";

export default function DashboardView() {
  const hydrated = useAppStore((s) => s.hydrated);
  const currency = useAppStore((s) => s.settings.currency);
  const vehicle = useActiveVehicle();
  const refuelings = useVehicleRefuelings(vehicle?.id);
  const [months, setMonths] = useState(6);

  const enriched = useMemo(() => enrichRefuelings(refuelings), [refuelings]);
  const gauge = useMemo(() => gaugeAverage(enriched), [enriched]);
  const monthSummary = useMemo(() => currentMonthSummary(enriched), [enriched]);
  const series = useMemo(
    () => consumptionSeries(enriched, months),
    [enriched, months],
  );
  const latest = enriched.at(-1);
  const recent = useMemo(() => [...enriched].reverse().slice(0, 5), [enriched]);
  const suffix = currencySuffix(currency);

  if (!hydrated) {
    return (
      <div aria-busy="true" className="space-y-4">
        <div className="h-9 w-40 animate-pulse rounded-lg bg-card" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-64 animate-pulse rounded-2xl bg-card" />
          <div className="h-64 animate-pulse rounded-2xl bg-card" />
          <div className="h-64 animate-pulse rounded-2xl bg-card" />
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <>
        <PageHeader title="Översikt" />
        <EmptyState
          image="bilar"
          title="Välkommen till TankKoll!"
          body="Börja med att lägga till din bil – sedan kan du logga tankningar och följa din verkliga förbrukning."
          ctaHref="/bilar"
          ctaLabel="Lägg till din bil"
        />
      </>
    );
  }

  return (
    <>
      <PageHeader title="Översikt" showNewRefueling />

      {enriched.length === 0 ? (
        <EmptyState
          image="tankningar"
          title="Inga tankningar ännu"
          body="Logga din första tankning så börjar TankKoll räkna ut förbrukning, kostnader och trender åt dig."
          ctaHref="/tankning"
          ctaLabel="Logga första tankningen"
        />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardTitle>Genomsnittlig förbrukning</CardTitle>
              <Gauge value={gauge} sublabel="Senaste 5 tankningarna" />
            </Card>

            <Card>
              <CardTitle>Senaste tankningen</CardTitle>
              {latest && (
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-3">
                    <Calendar size={16} className="text-ink-faint" aria-hidden />
                    {formatDate(latest.date)}
                  </li>
                  <li className="flex items-center gap-3">
                    <Droplets size={16} className="text-ink-faint" aria-hidden />
                    {formatNumber(latest.liters, 1)} liter
                  </li>
                  <li className="flex items-center gap-3">
                    <Route size={16} className="text-ink-faint" aria-hidden />
                    {latest.distance !== undefined
                      ? `${formatNumber(latest.distance)} km`
                      : "Första tankningen"}
                  </li>
                  <li className="flex items-center gap-3">
                    <GaugeIcon size={16} className="text-ink-faint" aria-hidden />
                    {latest.consumption !== undefined
                      ? `${formatNumber(latest.consumption, 2)} l/100 km`
                      : "–"}
                  </li>
                  {latest.costPerMil !== undefined && (
                    <li className="flex items-center gap-3 font-medium text-success">
                      <Leaf size={16} aria-hidden />
                      {formatNumber(latest.costPerMil, 2)} {suffix}/mil
                    </li>
                  )}
                </ul>
              )}
            </Card>

            <Card>
              <CardTitle>Denna månad</CardTitle>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-ink-faint">Körda kilometer</dt>
                  <dd className="text-lg font-bold">
                    {formatNumber(monthSummary.distance)} km
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-faint">Förbrukning</dt>
                  <dd className="text-lg font-bold">
                    {monthSummary.avgConsumption !== undefined
                      ? `${formatNumber(monthSummary.avgConsumption, 2)} l/100 km`
                      : "–"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-faint">Kostnad</dt>
                  <dd className="text-lg font-bold">
                    {formatCurrency(monthSummary.cost, currency)}
                  </dd>
                </div>
              </dl>
            </Card>
          </div>

          <Card>
            <div className="mb-2 flex items-center justify-between">
              <CardTitle>Förbrukning över tid</CardTitle>
              <PeriodSelect value={months} onChange={setMonths} />
            </div>
            {series.length >= 2 ? (
              <ConsumptionChart data={series} />
            ) : (
              <p className="py-10 text-center text-sm text-ink-muted">
                Minst två tankningar med mätarställning behövs för att rita grafen.
              </p>
            )}
          </Card>

          <Card>
            <div className="mb-2 flex items-center justify-between">
              <CardTitle>Senaste tankningar</CardTitle>
              <Link
                href="/tankningar"
                className="text-xs font-medium text-primary hover:underline"
              >
                Visa alla
              </Link>
            </div>
            <RecentRefuelings refuelings={recent} currency={currency} />
          </Card>

          <Link
            href="/tankning"
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-deep sm:hidden"
          >
            <Plus size={16} aria-hidden />
            Ny tankning
          </Link>
        </div>
      )}
    </>
  );
}
