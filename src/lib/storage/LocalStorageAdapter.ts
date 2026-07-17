import { EMPTY_DATA, type AppData, type Refueling, type Settings, type Vehicle } from "../types";
import type { StorageAdapter } from "./StorageAdapter";

export const STORAGE_KEY = "tankkoll:v1";

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const index = list.findIndex((x) => x.id === item.id);
  if (index === -1) return [...list, item];
  return list.map((x, i) => (i === index ? item : x));
}

export class LocalStorageAdapter implements StorageAdapter {
  private read(): AppData {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return structuredClone(EMPTY_DATA);
    try {
      const parsed = JSON.parse(raw) as AppData;
      if (parsed?.version !== 1 || !Array.isArray(parsed.vehicles)) {
        throw new Error("unexpected shape");
      }
      return parsed;
    } catch (error) {
      console.warn("TankKoll: kunde inte läsa sparad data, börjar om.", error);
      return structuredClone(EMPTY_DATA);
    }
  }

  private write(data: AppData): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  async load(): Promise<AppData> {
    return this.read();
  }

  async saveVehicle(vehicle: Vehicle): Promise<void> {
    const data = this.read();
    this.write({ ...data, vehicles: upsert(data.vehicles, vehicle) });
  }

  async deleteVehicle(id: string): Promise<void> {
    const data = this.read();
    this.write({
      ...data,
      vehicles: data.vehicles.filter((v) => v.id !== id),
      refuelings: data.refuelings.filter((r) => r.vehicleId !== id),
    });
  }

  async saveRefueling(refueling: Refueling): Promise<void> {
    const data = this.read();
    this.write({ ...data, refuelings: upsert(data.refuelings, refueling) });
  }

  async deleteRefueling(id: string): Promise<void> {
    const data = this.read();
    this.write({ ...data, refuelings: data.refuelings.filter((r) => r.id !== id) });
  }

  async saveSettings(settings: Settings): Promise<void> {
    const data = this.read();
    this.write({ ...data, settings });
  }

  async replaceAll(data: AppData): Promise<void> {
    this.write(data);
  }
}
