"use client";

import { create } from "zustand";
import { useMemo } from "react";
import {
  DEFAULT_SETTINGS,
  type AppData,
  type Refueling,
  type Settings,
  type Vehicle,
} from "@/lib/types";
import type { StorageAdapter } from "@/lib/storage/StorageAdapter";
import { LocalStorageAdapter } from "@/lib/storage/LocalStorageAdapter";

/** Swap point for a future REST backend. */
export const storage: StorageAdapter = new LocalStorageAdapter();

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export interface AppState {
  hydrated: boolean;
  vehicles: Vehicle[];
  refuelings: Refueling[];
  settings: Settings;
  hydrate(): Promise<void>;
  addVehicle(v: Omit<Vehicle, "id" | "createdAt">): Promise<Vehicle>;
  updateVehicle(v: Vehicle): Promise<void>;
  deleteVehicle(id: string): Promise<void>;
  addRefueling(r: Omit<Refueling, "id" | "createdAt">): Promise<Refueling>;
  updateRefueling(r: Refueling): Promise<void>;
  deleteRefueling(id: string): Promise<void>;
  updateSettings(patch: Partial<Settings>): Promise<void>;
  importData(data: AppData): Promise<void>;
  resetAll(): Promise<void>;
}

export const useAppStore = create<AppState>()((set, get) => ({
  hydrated: false,
  vehicles: [],
  refuelings: [],
  settings: { ...DEFAULT_SETTINGS },

  async hydrate() {
    const data = await storage.load();
    set({
      hydrated: true,
      vehicles: data.vehicles,
      refuelings: data.refuelings,
      settings: data.settings,
    });
  },

  async addVehicle(input) {
    const vehicle: Vehicle = {
      ...input,
      id: newId(),
      createdAt: new Date().toISOString(),
    };
    await storage.saveVehicle(vehicle);
    set((s) => ({ vehicles: [...s.vehicles, vehicle] }));
    if (!get().settings.activeVehicleId) {
      await get().updateSettings({ activeVehicleId: vehicle.id });
    }
    return vehicle;
  },

  async updateVehicle(vehicle) {
    await storage.saveVehicle(vehicle);
    set((s) => ({
      vehicles: s.vehicles.map((v) => (v.id === vehicle.id ? vehicle : v)),
    }));
  },

  async deleteVehicle(id) {
    await storage.deleteVehicle(id);
    set((s) => ({
      vehicles: s.vehicles.filter((v) => v.id !== id),
      refuelings: s.refuelings.filter((r) => r.vehicleId !== id),
    }));
    const { settings, vehicles } = get();
    if (settings.activeVehicleId === id) {
      await get().updateSettings({ activeVehicleId: vehicles[0]?.id });
    }
  },

  async addRefueling(input) {
    const refueling: Refueling = {
      ...input,
      id: newId(),
      createdAt: new Date().toISOString(),
    };
    await storage.saveRefueling(refueling);
    set((s) => ({ refuelings: [...s.refuelings, refueling] }));
    return refueling;
  },

  async updateRefueling(refueling) {
    await storage.saveRefueling(refueling);
    set((s) => ({
      refuelings: s.refuelings.map((r) => (r.id === refueling.id ? refueling : r)),
    }));
  },

  async deleteRefueling(id) {
    await storage.deleteRefueling(id);
    set((s) => ({ refuelings: s.refuelings.filter((r) => r.id !== id) }));
  },

  async updateSettings(patch) {
    const settings: Settings = { ...get().settings, ...patch };
    // undefined values must actually clear the key
    if ("activeVehicleId" in patch && patch.activeVehicleId === undefined) {
      delete settings.activeVehicleId;
    }
    await storage.saveSettings(settings);
    set({ settings });
  },

  async importData(data) {
    await storage.replaceAll(data);
    set({
      vehicles: data.vehicles,
      refuelings: data.refuelings,
      settings: data.settings,
    });
  },

  async resetAll() {
    const empty: AppData = {
      version: 1,
      vehicles: [],
      refuelings: [],
      settings: { ...DEFAULT_SETTINGS },
    };
    await storage.replaceAll(empty);
    set({ vehicles: [], refuelings: [], settings: { ...DEFAULT_SETTINGS } });
  },
}));

/** Active vehicle: explicit selection, else the first one. */
export function useActiveVehicle(): Vehicle | undefined {
  const vehicles = useAppStore((s) => s.vehicles);
  const activeId = useAppStore((s) => s.settings.activeVehicleId);
  return useMemo(
    () => vehicles.find((v) => v.id === activeId) ?? vehicles[0],
    [vehicles, activeId],
  );
}

/**
 * Raw refuelings for one vehicle. Selects the raw array and memoizes the
 * filtered result — a filtering selector would return a fresh array every
 * render and loop forever (zustand selector trap).
 */
export function useVehicleRefuelings(vehicleId?: string): Refueling[] {
  const refuelings = useAppStore((s) => s.refuelings);
  return useMemo(
    () => (vehicleId ? refuelings.filter((r) => r.vehicleId === vehicleId) : []),
    [refuelings, vehicleId],
  );
}
