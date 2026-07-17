"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/Card";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/components/Toast";
import { VehicleForm, type VehicleFormValues } from "@/components/VehicleForm";
import { WltpBadge } from "@/components/WltpBadge";
import { computeStats, enrichRefuelings } from "@/lib/calculations";
import { formatNumber } from "@/lib/format";
import { FUEL_TYPE_LABELS, type Vehicle } from "@/lib/types";
import { useAppStore } from "@/store/useAppStore";

export default function VehiclesPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const vehicles = useAppStore((s) => s.vehicles);
  const refuelings = useAppStore((s) => s.refuelings);
  const settings = useAppStore((s) => s.settings);
  const addVehicle = useAppStore((s) => s.addVehicle);
  const updateVehicle = useAppStore((s) => s.updateVehicle);
  const deleteVehicle = useAppStore((s) => s.deleteVehicle);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const show = useToast((s) => s.show);

  const [mode, setMode] = useState<"list" | "new" | `edit:${string}`>("list");
  const [pendingDelete, setPendingDelete] = useState<Vehicle>();

  const actuals = useMemo(() => {
    const map = new Map<string, number | undefined>();
    for (const v of vehicles) {
      map.set(
        v.id,
        computeStats(enrichRefuelings(refuelings.filter((r) => r.vehicleId === v.id)))
          .avgConsumption,
      );
    }
    return map;
  }, [vehicles, refuelings]);

  if (!hydrated) {
    return <div aria-busy="true" className="h-96 animate-pulse rounded-2xl bg-card" />;
  }

  const editingVehicle =
    mode.startsWith("edit:") ? vehicles.find((v) => v.id === mode.slice(5)) : undefined;

  async function handleSave(values: VehicleFormValues) {
    if (editingVehicle) {
      await updateVehicle({ ...editingVehicle, ...values });
      show("Bilen uppdaterad");
    } else {
      await addVehicle(values);
      show("Bilen tillagd");
    }
    setMode("list");
  }

  if (mode !== "list") {
    return (
      <>
        <PageHeader title="Bilar" />
        <div className="mx-auto max-w-2xl">
          <VehicleForm
            initial={editingVehicle}
            onSave={(v) => void handleSave(v)}
            onCancel={() => setMode("list")}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Bilar">
        <button
          type="button"
          onClick={() => setMode("new")}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-deep"
        >
          <Plus size={16} aria-hidden />
          Lägg till bil
        </button>
      </PageHeader>

      {vehicles.length === 0 ? (
        <EmptyState
          image="bilar"
          title="Inga bilar ännu"
          body="Lägg till din första bil för att börja logga tankningar och följa förbrukningen."
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {vehicles.map((v) => {
            const isActive = (settings.activeVehicleId ?? vehicles[0]?.id) === v.id;
            const actual = actuals.get(v.id);
            return (
              <li key={v.id}>
                <Card className="h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-bold">{v.name}</h2>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {[v.manufacturer, v.model].filter(Boolean).join(" ") ||
                          FUEL_TYPE_LABELS[v.fuelType]}
                      </p>
                    </div>
                    {v.registrationNumber && (
                      <span className="rounded-lg border border-line bg-card-raised px-2.5 py-1 font-mono text-xs font-semibold">
                        {v.registrationNumber}
                      </span>
                    )}
                  </div>

                  {v.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.imageUrl}
                      alt={`Bild på ${v.name}`}
                      className="mt-3 h-36 w-full rounded-xl object-cover"
                      loading="lazy"
                    />
                  )}

                  <dl className="mt-4 space-y-2 text-sm">
                    {v.year !== undefined && (
                      <div className="flex justify-between">
                        <dt className="text-ink-muted">Årsmodell</dt>
                        <dd className="font-medium">{v.year}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-ink-muted">Drivmedel</dt>
                      <dd className="font-medium">{FUEL_TYPE_LABELS[v.fuelType]}</dd>
                    </div>
                    {v.wltpConsumption !== undefined && (
                      <div className="flex justify-between">
                        <dt className="text-ink-muted">WLTP-förbrukning</dt>
                        <dd className="font-medium">
                          {formatNumber(v.wltpConsumption, 1)} l/100 km
                        </dd>
                      </div>
                    )}
                    {v.tankSize !== undefined && (
                      <div className="flex justify-between">
                        <dt className="text-ink-muted">Tankvolym</dt>
                        <dd className="font-medium">{formatNumber(v.tankSize)} liter</dd>
                      </div>
                    )}
                  </dl>

                  {v.wltpConsumption !== undefined && actual !== undefined && (
                    <div className="mt-4 flex items-center justify-between rounded-xl bg-card-raised p-4">
                      <div className="text-sm">
                        <p className="text-xs text-ink-muted">Din förbrukning vs WLTP</p>
                        <p className="mt-0.5 font-semibold">
                          {formatNumber(actual, 2)} vs {formatNumber(v.wltpConsumption, 1)}{" "}
                          l/100 km
                        </p>
                      </div>
                      <WltpBadge actual={actual} official={v.wltpConsumption} />
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between gap-2">
                    {isActive ? (
                      <span className="rounded-lg bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
                        Aktiv bil
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          void updateSettings({ activeVehicleId: v.id });
                          show(`${v.name} är nu aktiv bil`);
                        }}
                        className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-card-raised hover:text-ink"
                      >
                        Använd denna bil
                      </button>
                    )}
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setMode(`edit:${v.id}`)}
                        aria-label={`Redigera ${v.name}`}
                        className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-card-raised hover:text-ink"
                      >
                        <Pencil size={16} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(v)}
                        aria-label={`Ta bort ${v.name}`}
                        className="rounded-lg p-2 text-ink-faint transition-colors hover:bg-card-raised hover:text-danger"
                      >
                        <Trash2 size={16} aria-hidden />
                      </button>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== undefined}
        title={`Ta bort ${pendingDelete?.name}?`}
        body="Alla tankningar för bilen tas också bort. Detta går inte att ångra."
        confirmLabel="Ta bort bilen"
        danger
        onCancel={() => setPendingDelete(undefined)}
        onConfirm={() => {
          if (pendingDelete) {
            void deleteVehicle(pendingDelete.id);
            show("Bilen borttagen");
          }
          setPendingDelete(undefined);
        }}
      />
    </>
  );
}
