import type { EnrichedRefueling } from "./calculations";
import { DEFAULT_SETTINGS, type AppData, type Refueling, type Vehicle } from "./types";

const IMPORT_ERROR = "Filen är inte en giltig TankKoll-export.";

export function toJSON(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

function isVehicle(v: unknown): v is Vehicle {
  if (typeof v !== "object" || v === null) return false;
  const x = v as Record<string, unknown>;
  return typeof x.id === "string" && typeof x.name === "string" && typeof x.fuelType === "string";
}

function isRefueling(r: unknown): r is Refueling {
  if (typeof r !== "object" || r === null) return false;
  const x = r as Record<string, unknown>;
  return (
    typeof x.id === "string" &&
    typeof x.vehicleId === "string" &&
    typeof x.date === "string" &&
    typeof x.liters === "number" &&
    typeof x.odometer === "number"
  );
}

export function parseImport(json: string): AppData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error(IMPORT_ERROR);
  }
  if (typeof parsed !== "object" || parsed === null) throw new Error(IMPORT_ERROR);
  const doc = parsed as Record<string, unknown>;
  if (doc.version !== 1 || !Array.isArray(doc.vehicles) || !Array.isArray(doc.refuelings)) {
    throw new Error(IMPORT_ERROR);
  }
  if (!doc.vehicles.every(isVehicle) || !doc.refuelings.every(isRefueling)) {
    throw new Error(IMPORT_ERROR);
  }
  const settings =
    typeof doc.settings === "object" && doc.settings !== null
      ? { ...DEFAULT_SETTINGS, ...(doc.settings as object) }
      : { ...DEFAULT_SETTINGS };
  return {
    version: 1,
    vehicles: doc.vehicles,
    refuelings: doc.refuelings,
    settings,
  };
}

function csvNumber(n: number | undefined, decimals?: number): string {
  if (n === undefined) return "";
  if (decimals === undefined) return String(n);
  return String(Number(n.toFixed(decimals)));
}

/**
 * Semicolon-separated (Swedish Excel convention), CRLF line endings.
 */
export function toCSV(refuelings: EnrichedRefueling[], vehicles: Vehicle[]): string {
  const header =
    "datum;fordon;regnr;liter;matarstallning;stracka_km;forbrukning_l_100km;pris_per_liter;kostnad";
  const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
  const rows = refuelings.map((r) => {
    const vehicle = vehicleById.get(r.vehicleId);
    return [
      r.date,
      vehicle?.name ?? "",
      vehicle?.registrationNumber ?? "",
      csvNumber(r.liters),
      csvNumber(r.odometer),
      csvNumber(r.distance),
      csvNumber(r.consumption, 2),
      csvNumber(r.pricePerLiter),
      csvNumber(r.cost, 2),
    ].join(";");
  });
  return [header, ...rows].join("\r\n") + "\r\n";
}
