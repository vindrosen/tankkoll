"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { EnrichedRefueling } from "@/lib/calculations";
import { currencySuffix, formatDate, formatNumber } from "@/lib/format";

interface RecentRefuelingsProps {
  refuelings: EnrichedRefueling[];
  currency: string;
}

function dash(value: number | undefined, decimals: number): string {
  return value === undefined ? "–" : formatNumber(value, decimals);
}

export function RecentRefuelings({ refuelings, currency }: RecentRefuelingsProps) {
  const suffix = currencySuffix(currency);
  return (
    <>
      {/* Desktop table */}
      <table className="hidden w-full text-sm sm:table">
        <thead>
          <tr className="text-left text-xs text-ink-faint">
            <th className="pb-2 font-medium">Datum</th>
            <th className="pb-2 font-medium">Liter</th>
            <th className="pb-2 font-medium">Km</th>
            <th className="pb-2 font-medium">l/100 km</th>
            <th className="pb-2 font-medium">{suffix}/mil</th>
            <th className="pb-2 font-medium">Pris/l</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {refuelings.map((r) => (
            <tr key={r.id} className="border-t border-line">
              <td className="py-3">{formatDate(r.date)}</td>
              <td className="py-3">{formatNumber(r.liters, 1)}</td>
              <td className="py-3">{dash(r.distance, 0)}</td>
              <td className="py-3 font-semibold">{dash(r.consumption, 2)}</td>
              <td className="py-3">{dash(r.costPerMil, 2)}</td>
              <td className="py-3">
                {r.pricePerLiter !== undefined
                  ? `${formatNumber(r.pricePerLiter, 2)} ${suffix}`
                  : "–"}
              </td>
              <td className="py-3 text-right">
                <Link
                  href={`/tankning/?id=${r.id}`}
                  aria-label={`Redigera tankningen ${formatDate(r.date)}`}
                  className="inline-flex rounded-lg p-1 text-ink-faint transition-colors hover:bg-card-raised hover:text-ink"
                >
                  <ChevronRight size={16} aria-hidden />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile cards */}
      <ul className="space-y-3 sm:hidden">
        {refuelings.map((r) => (
          <li key={r.id}>
            <Link
              href={`/tankning/?id=${r.id}`}
              className="flex items-center justify-between rounded-xl border border-line bg-card-raised/50 px-4 py-3 transition-colors hover:bg-card-raised"
            >
              <span>
                <span className="block text-sm font-semibold">{formatDate(r.date)}</span>
                <span className="mt-0.5 block text-xs text-ink-muted">
                  {formatNumber(r.liters, 1)} liter
                  {r.distance !== undefined && ` · ${formatNumber(r.distance)} km`}
                </span>
              </span>
              <span className="text-right">
                <span className="block text-base font-bold">
                  {dash(r.consumption, 2)}
                </span>
                <span className="block text-xs text-ink-muted">l/100 km</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
