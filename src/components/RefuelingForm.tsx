"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { useToast } from "@/components/Toast";
import { currencySuffix, formatNumber, todayISO } from "@/lib/format";
import {
  useActiveVehicle,
  useAppStore,
  useVehicleRefuelings,
} from "@/store/useAppStore";

function parseDecimal(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

const inputClass =
  "w-full rounded-xl border border-line bg-card-raised px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40";

export function RefuelingForm() {
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get("id") ?? undefined;

  const hydrated = useAppStore((s) => s.hydrated);
  const currency = useAppStore((s) => s.settings.currency);
  const addRefueling = useAppStore((s) => s.addRefueling);
  const updateRefueling = useAppStore((s) => s.updateRefueling);
  const allRefuelings = useAppStore((s) => s.refuelings);
  const vehicle = useActiveVehicle();
  const editing = editId ? allRefuelings.find((r) => r.id === editId) : undefined;
  const vehicleId = editing?.vehicleId ?? vehicle?.id;
  const vehicleRefuelings = useVehicleRefuelings(vehicleId);
  const show = useToast((s) => s.show);

  const [regnr, setRegnr] = useState<string>();
  const [liters, setLiters] = useState<string>();
  const [odometer, setOdometer] = useState<string>();
  const [price, setPrice] = useState<string>();
  const [date, setDate] = useState<string>();
  const [notes, setNotes] = useState<string>();
  const [error, setError] = useState<string>();

  // Uncontrolled-until-touched: fall back to the edited entry / defaults.
  const values = {
    regnr: regnr ?? vehicle?.registrationNumber ?? "",
    liters: liters ?? (editing ? String(editing.liters) : ""),
    odometer: odometer ?? (editing ? String(editing.odometer) : ""),
    price:
      price ??
      (editing?.pricePerLiter !== undefined ? String(editing.pricePerLiter) : ""),
    date: date ?? editing?.date ?? todayISO(),
    notes: notes ?? editing?.notes ?? "",
  };

  const litersNum = parseDecimal(values.liters);
  const odometerNum = parseDecimal(values.odometer);

  const preview = useMemo(() => {
    if (litersNum === undefined || odometerNum === undefined) return undefined;
    const others = vehicleRefuelings.filter((r) => r.id !== editId);
    const below = others.filter((r) => r.odometer < odometerNum);
    const maxOdometer = others.reduce((m, r) => Math.max(m, r.odometer), 0);
    const previous = below.at(-1)
      ? Math.max(...below.map((r) => r.odometer))
      : undefined;
    const distance = previous !== undefined ? odometerNum - previous : undefined;
    return {
      distance,
      consumption:
        distance !== undefined && distance > 0
          ? (litersNum / distance) * 100
          : undefined,
      belowLatest: others.length > 0 && odometerNum <= maxOdometer,
    };
  }, [litersNum, odometerNum, vehicleRefuelings, editId]);

  if (!hydrated) {
    return <div aria-busy="true" className="h-96 animate-pulse rounded-2xl bg-card" />;
  }

  if (!vehicleId) {
    router.replace("/bilar");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (litersNum === undefined || litersNum <= 0) {
      setError("Ange hur många liter du tankade.");
      return;
    }
    if (odometerNum === undefined || odometerNum <= 0) {
      setError("Ange bilens mätarställning i km.");
      return;
    }
    const priceNum = parseDecimal(values.price);
    const payload = {
      vehicleId: vehicleId as string,
      date: values.date,
      liters: litersNum,
      odometer: odometerNum,
      pricePerLiter: priceNum !== undefined && priceNum > 0 ? priceNum : undefined,
      notes: values.notes.trim() || undefined,
    };
    if (editing) {
      await updateRefueling({ ...editing, ...payload });
      show("Tankningen uppdaterad");
      router.push("/tankningar/");
    } else {
      await addRefueling(payload);
      show("Tankningen sparad");
      router.push("/");
    }
  }

  const suffix = currencySuffix(currency);

  return (
    <>
      <PageHeader title={editing ? "Redigera tankning" : "Ny tankning"} />
      <Card className="mx-auto max-w-xl">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label htmlFor="regnr" className="mb-1.5 block text-sm text-ink-muted">
              Registreringsnummer (valfritt)
            </label>
            <input
              id="regnr"
              type="text"
              autoComplete="off"
              value={values.regnr}
              onChange={(e) => setRegnr(e.target.value.toUpperCase())}
              className={inputClass}
              placeholder="ABC123"
            />
          </div>

          <div>
            <label htmlFor="liters" className="mb-1.5 block text-sm text-ink-muted">
              Tankade liter
            </label>
            <div className="relative">
              <input
                id="liters"
                type="text"
                inputMode="decimal"
                required
                value={values.liters}
                onChange={(e) => setLiters(e.target.value)}
                className={inputClass}
                placeholder="42,8"
              />
              <span aria-hidden className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-faint">
                liter
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="odometer" className="mb-1.5 block text-sm text-ink-muted">
              Mätarställning
            </label>
            <div className="relative">
              <input
                id="odometer"
                type="text"
                inputMode="numeric"
                required
                value={values.odometer}
                onChange={(e) => setOdometer(e.target.value)}
                className={inputClass}
                placeholder="125460"
              />
              <span aria-hidden className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-faint">
                km
              </span>
            </div>
            {preview?.belowLatest && (
              <p className="mt-2 flex items-center gap-2 text-xs text-warning">
                <AlertTriangle size={14} aria-hidden />
                Mätarställningen är lägre än senaste tankningens – kontrollera siffran.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="price" className="mb-1.5 block text-sm text-ink-muted">
              Pris per liter (valfritt)
            </label>
            <div className="relative">
              <input
                id="price"
                type="text"
                inputMode="decimal"
                value={values.price}
                onChange={(e) => setPrice(e.target.value)}
                className={inputClass}
                placeholder="18,90"
              />
              <span aria-hidden className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-faint">
                {suffix}
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="date" className="mb-1.5 block text-sm text-ink-muted">
              Datum
            </label>
            <input
              id="date"
              type="date"
              required
              value={values.date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="notes" className="mb-1.5 block text-sm text-ink-muted">
              Anteckningar (valfritt)
            </label>
            <textarea
              id="notes"
              rows={2}
              value={values.notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
              placeholder="T.ex. motorvägskörning, taklast …"
            />
          </div>

          {preview?.distance !== undefined && preview.consumption !== undefined && (
            <p className="rounded-xl bg-primary/10 px-4 py-3 text-sm">
              <span className="font-semibold">{formatNumber(preview.distance)} km</span>
              {" sedan förra tankningen · "}
              <span className="font-semibold">
                {formatNumber(preview.consumption, 2)} l/100 km
              </span>
            </p>
          )}

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary-deep"
          >
            {editing ? "Spara ändringar" : "Spara tankning"}
          </button>
        </form>
      </Card>
    </>
  );
}
