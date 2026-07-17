"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/Card";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/components/Toast";
import { enrichRefuelings } from "@/lib/calculations";
import { currencySuffix, formatDate, formatNumber } from "@/lib/format";
import {
  useActiveVehicle,
  useAppStore,
  useVehicleRefuelings,
} from "@/store/useAppStore";

export default function RefuelingsPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const currency = useAppStore((s) => s.settings.currency);
  const deleteRefueling = useAppStore((s) => s.deleteRefueling);
  const vehicle = useActiveVehicle();
  const refuelings = useVehicleRefuelings(vehicle?.id);
  const show = useToast((s) => s.show);
  const [pendingDelete, setPendingDelete] = useState<string>();

  const enriched = useMemo(
    () => [...enrichRefuelings(refuelings)].reverse(),
    [refuelings],
  );
  const suffix = currencySuffix(currency);

  if (!hydrated) {
    return <div aria-busy="true" className="h-96 animate-pulse rounded-2xl bg-card" />;
  }

  return (
    <>
      <PageHeader title="Tankningar" showNewRefueling />

      {enriched.length === 0 ? (
        <EmptyState
          image="tankningar"
          title="Inga tankningar ännu"
          body={
            vehicle
              ? "När du loggar tankningar visas hela historiken här."
              : "Lägg till en bil först, sedan kan du logga tankningar."
          }
          ctaHref={vehicle ? "/tankning" : "/bilar"}
          ctaLabel={vehicle ? "Logga första tankningen" : "Lägg till bil"}
        />
      ) : (
        <ul className="space-y-3">
          {enriched.map((r) => (
            <li key={r.id}>
              <Card className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{formatDate(r.date)}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {formatNumber(r.liters, 1)} liter
                    {r.distance !== undefined && ` · ${formatNumber(r.distance)} km`}
                    {r.pricePerLiter !== undefined &&
                      ` · ${formatNumber(r.pricePerLiter, 2)} ${suffix}/l`}
                  </p>
                  {r.notes && (
                    <p className="mt-1 truncate text-xs text-ink-faint">{r.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 sm:gap-3">
                  <div className="mr-2 text-right">
                    <p className="text-base font-bold">
                      {r.consumption !== undefined
                        ? formatNumber(r.consumption, 2)
                        : "–"}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {r.costPerMil !== undefined
                        ? `${formatNumber(r.costPerMil, 2)} ${suffix}/mil`
                        : "l/100 km"}
                    </p>
                  </div>
                  <Link
                    href={`/tankning/?id=${r.id}`}
                    aria-label={`Redigera tankningen ${formatDate(r.date)}`}
                    className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-card-raised hover:text-ink"
                  >
                    <Pencil size={16} aria-hidden />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(r.id)}
                    aria-label={`Ta bort tankningen ${formatDate(r.date)}`}
                    className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-card-raised hover:text-danger"
                  >
                    <Trash2 size={16} aria-hidden />
                  </button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== undefined}
        title="Ta bort tankningen?"
        body="Tankningen tas bort permanent. Detta går inte att ångra."
        confirmLabel="Ta bort"
        danger
        onCancel={() => setPendingDelete(undefined)}
        onConfirm={() => {
          if (pendingDelete) {
            void deleteRefueling(pendingDelete);
            show("Tankningen borttagen");
          }
          setPendingDelete(undefined);
        }}
      />
    </>
  );
}
