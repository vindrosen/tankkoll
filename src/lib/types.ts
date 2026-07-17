export type FuelType = "bensin" | "diesel" | "etanol" | "el-hybrid" | "annat";

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  bensin: "Bensin",
  diesel: "Diesel",
  etanol: "Etanol (E85)",
  "el-hybrid": "Elhybrid",
  annat: "Annat",
};

export interface Vehicle {
  id: string;
  name: string;
  registrationNumber?: string;
  fuelType: FuelType;
  manufacturer?: string;
  model?: string;
  year?: number;
  /** Tank volume in liters */
  tankSize?: number;
  /** Official WLTP consumption, L/100 km */
  wltpConsumption?: number;
  imageUrl?: string;
  createdAt: string;
}

export interface Refueling {
  id: string;
  vehicleId: string;
  /** ISO date (yyyy-mm-dd) */
  date: string;
  liters: number;
  /** Odometer reading in km */
  odometer: number;
  pricePerLiter?: number;
  notes?: string;
  createdAt: string;
}

export interface Settings {
  currency: string;
  theme: "dark" | "light";
  activeVehicleId?: string;
}

export interface AppData {
  version: 1;
  vehicles: Vehicle[];
  refuelings: Refueling[];
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = { currency: "SEK", theme: "dark" };

export const EMPTY_DATA: AppData = {
  version: 1,
  vehicles: [],
  refuelings: [],
  settings: DEFAULT_SETTINGS,
};
