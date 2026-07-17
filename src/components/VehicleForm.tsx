"use client";

import { useState } from "react";
import { Card } from "@/components/Card";
import { FUEL_TYPE_LABELS, type FuelType, type Vehicle } from "@/lib/types";
import { vehicleInfoProvider } from "@/lib/vehicle-info/ManualVehicleProvider";

const inputClass =
  "w-full rounded-xl border border-line bg-card-raised px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40";

function parseDecimal(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

export interface VehicleFormValues {
  name: string;
  registrationNumber?: string;
  fuelType: FuelType;
  manufacturer?: string;
  model?: string;
  year?: number;
  tankSize?: number;
  wltpConsumption?: number;
  imageUrl?: string;
}

interface VehicleFormProps {
  initial?: Vehicle;
  onSave(values: VehicleFormValues): void;
  onCancel(): void;
}

export function VehicleForm({ initial, onSave, onCancel }: VehicleFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [regnr, setRegnr] = useState(initial?.registrationNumber ?? "");
  const [fuelType, setFuelType] = useState<FuelType>(initial?.fuelType ?? "bensin");
  const [manufacturer, setManufacturer] = useState(initial?.manufacturer ?? "");
  const [model, setModel] = useState(initial?.model ?? "");
  const [year, setYear] = useState(initial?.year !== undefined ? String(initial.year) : "");
  const [tankSize, setTankSize] = useState(
    initial?.tankSize !== undefined ? String(initial.tankSize) : "",
  );
  const [wltp, setWltp] = useState(
    initial?.wltpConsumption !== undefined ? String(initial.wltpConsumption) : "",
  );
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [error, setError] = useState<string>();

  async function handleRegnrBlur() {
    if (!regnr.trim()) return;
    const info = await vehicleInfoProvider.lookup(regnr.trim());
    if (!info) return;
    if (info.name && !name) setName(info.name);
    if (info.manufacturer && !manufacturer) setManufacturer(info.manufacturer);
    if (info.model && !model) setModel(info.model);
    if (info.year && !year) setYear(String(info.year));
    if (info.fuelType) setFuelType(info.fuelType);
    if (info.wltpConsumption && !wltp) setWltp(String(info.wltpConsumption));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Ge bilen ett namn, t.ex. ”Volkswagen Golf”.");
      return;
    }
    onSave({
      name: name.trim(),
      registrationNumber: regnr.trim().toUpperCase() || undefined,
      fuelType,
      manufacturer: manufacturer.trim() || undefined,
      model: model.trim() || undefined,
      year: parseDecimal(year),
      tankSize: parseDecimal(tankSize),
      wltpConsumption: parseDecimal(wltp),
      imageUrl: imageUrl.trim() || undefined,
    });
  }

  return (
    <Card>
      <h2 className="mb-4 text-lg font-bold">
        {initial ? "Redigera bil" : "Lägg till bil"}
      </h2>
      <form onSubmit={handleSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="v-name" className="mb-1.5 block text-sm text-ink-muted">
            Namn
          </label>
          <input
            id="v-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Volkswagen Golf"
          />
        </div>
        <div>
          <label htmlFor="v-regnr" className="mb-1.5 block text-sm text-ink-muted">
            Registreringsnummer
          </label>
          <input
            id="v-regnr"
            type="text"
            value={regnr}
            onChange={(e) => setRegnr(e.target.value.toUpperCase())}
            onBlur={handleRegnrBlur}
            className={inputClass}
            placeholder="ABC123"
          />
        </div>
        <div>
          <label htmlFor="v-fuel" className="mb-1.5 block text-sm text-ink-muted">
            Drivmedel
          </label>
          <select
            id="v-fuel"
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value as FuelType)}
            className={inputClass}
          >
            {Object.entries(FUEL_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="v-manufacturer" className="mb-1.5 block text-sm text-ink-muted">
            Tillverkare
          </label>
          <input
            id="v-manufacturer"
            type="text"
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            className={inputClass}
            placeholder="Volkswagen"
          />
        </div>
        <div>
          <label htmlFor="v-model" className="mb-1.5 block text-sm text-ink-muted">
            Modell
          </label>
          <input
            id="v-model"
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className={inputClass}
            placeholder="Golf 1,5 TSI"
          />
        </div>
        <div>
          <label htmlFor="v-year" className="mb-1.5 block text-sm text-ink-muted">
            Årsmodell
          </label>
          <input
            id="v-year"
            type="text"
            inputMode="numeric"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className={inputClass}
            placeholder="2020"
          />
        </div>
        <div>
          <label htmlFor="v-tank" className="mb-1.5 block text-sm text-ink-muted">
            Tankvolym (liter)
          </label>
          <input
            id="v-tank"
            type="text"
            inputMode="decimal"
            value={tankSize}
            onChange={(e) => setTankSize(e.target.value)}
            className={inputClass}
            placeholder="50"
          />
        </div>
        <div>
          <label htmlFor="v-wltp" className="mb-1.5 block text-sm text-ink-muted">
            WLTP-förbrukning (l/100 km)
          </label>
          <input
            id="v-wltp"
            type="text"
            inputMode="decimal"
            value={wltp}
            onChange={(e) => setWltp(e.target.value)}
            className={inputClass}
            placeholder="5,4"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="v-image" className="mb-1.5 block text-sm text-ink-muted">
            Bild-URL (valfritt)
          </label>
          <input
            id="v-image"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className={inputClass}
            placeholder="https://…"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger sm:col-span-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 sm:col-span-2">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-deep"
          >
            {initial ? "Spara ändringar" : "Lägg till bil"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-3 text-sm font-medium text-ink-muted transition-colors hover:bg-card-raised hover:text-ink"
          >
            Avbryt
          </button>
        </div>
      </form>
    </Card>
  );
}
