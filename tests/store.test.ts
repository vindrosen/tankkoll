import { beforeEach, describe, expect, it, vi } from "vitest";

function makeStorageStub() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
  };
}

beforeEach(() => {
  vi.stubGlobal("localStorage", makeStorageStub());
  vi.resetModules();
});

async function freshStore() {
  const { useAppStore } = await import("@/store/useAppStore");
  useAppStore.setState({
    hydrated: false,
    vehicles: [],
    refuelings: [],
    settings: { currency: "SEK", theme: "dark" },
  });
  await useAppStore.getState().hydrate();
  return useAppStore;
}

describe("useAppStore", () => {
  it("hydrates empty state", async () => {
    const store = await freshStore();
    expect(store.getState().hydrated).toBe(true);
    expect(store.getState().vehicles).toEqual([]);
  });

  it("adds a vehicle, makes the first one active, persists through the adapter", async () => {
    const store = await freshStore();
    const v = await store.getState().addVehicle({ name: "Golf", fuelType: "bensin" });
    expect(store.getState().vehicles).toHaveLength(1);
    expect(store.getState().settings.activeVehicleId).toBe(v.id);

    // A second store instance sees the persisted data.
    vi.resetModules();
    const { useAppStore: second } = await import("@/store/useAppStore");
    await second.getState().hydrate();
    expect(second.getState().vehicles).toHaveLength(1);
  });

  it("cascade-deletes refuelings and clears active pointer with the vehicle", async () => {
    const store = await freshStore();
    const v = await store.getState().addVehicle({ name: "Golf", fuelType: "bensin" });
    await store.getState().addRefueling({
      vehicleId: v.id,
      date: "2024-07-17",
      liters: 42.8,
      odometer: 125460,
    });
    await store.getState().deleteVehicle(v.id);
    const s = store.getState();
    expect(s.vehicles).toEqual([]);
    expect(s.refuelings).toEqual([]);
    expect(s.settings.activeVehicleId).toBeUndefined();
  });

  it("updates and deletes refuelings", async () => {
    const store = await freshStore();
    const v = await store.getState().addVehicle({ name: "Golf", fuelType: "bensin" });
    const r = await store.getState().addRefueling({
      vehicleId: v.id,
      date: "2024-07-17",
      liters: 42.8,
      odometer: 125460,
    });
    await store.getState().updateRefueling({ ...r, liters: 40 });
    expect(store.getState().refuelings[0].liters).toBe(40);
    await store.getState().deleteRefueling(r.id);
    expect(store.getState().refuelings).toEqual([]);
  });

  it("resetAll wipes everything", async () => {
    const store = await freshStore();
    await store.getState().addVehicle({ name: "Golf", fuelType: "bensin" });
    await store.getState().resetAll();
    expect(store.getState().vehicles).toEqual([]);
    expect(store.getState().settings.activeVehicleId).toBeUndefined();
  });
});

describe("format helpers", () => {
  it("formats sv-SE numbers, currency, dates", async () => {
    const { formatNumber, formatCurrency, formatDate } = await import("@/lib/format");
    expect(formatNumber(5.89, 2)).toBe("5,89");
    // sv-SE uses non-breaking space as thousands separator
    expect(formatCurrency(1566, "SEK").replace(/ /g, " ")).toBe("1 566 kr");
    expect(formatDate("2024-07-17")).toBe("17 juli 2024");
  });
});
