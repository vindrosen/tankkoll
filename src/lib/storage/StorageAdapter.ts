import type { AppData, Refueling, Settings, Vehicle } from "../types";

/**
 * All persistence goes through this interface. The MVP ships a
 * LocalStorage implementation; a future REST backend implements the
 * same contract and is swapped in via the `storage` singleton in
 * src/store/useAppStore.ts — no other code may touch persistence.
 */
export interface StorageAdapter {
  load(): Promise<AppData>;
  saveVehicle(vehicle: Vehicle): Promise<void>;
  /** Also removes the vehicle's refuelings. */
  deleteVehicle(id: string): Promise<void>;
  saveRefueling(refueling: Refueling): Promise<void>;
  deleteRefueling(id: string): Promise<void>;
  saveSettings(settings: Settings): Promise<void>;
  /** Used by import and reset. */
  replaceAll(data: AppData): Promise<void>;
}
