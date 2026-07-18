import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocalStorageAdapter, STORAGE_KEY } from "@/lib/storage/LocalStorageAdapter";
import { EMPTY_DATA, type Refueling, type Vehicle } from "@/lib/types";

function makeStorageStub() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    _map: map,
  };
}

const vehicle: Vehicle = {
  id: "v1",
  name: "Volkswagen Golf",
  fuelType: "bensin",
  createdAt: "2024-01-01T00:00:00.000Z",
};

const refueling: Refueling = {
  id: "r1",
  vehicleId: "v1",
  date: "2024-07-17",
  liters: 42.8,
  odometer: 125460,
  createdAt: "2024-07-17T00:00:00.000Z",
};

let stub: ReturnType<typeof makeStorageStub>;

beforeEach(() => {
  stub = makeStorageStub();
  vi.stubGlobal("localStorage", stub);
});

describe("LocalStorageAdapter", () => {
  it("returns EMPTY_DATA when nothing is stored", async () => {
    const adapter = new LocalStorageAdapter();
    expect(await adapter.load()).toEqual(EMPTY_DATA);
  });

  it("returns EMPTY_DATA and warns on corrupt JSON", async () => {
    stub.setItem(STORAGE_KEY, "{not json");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const adapter = new LocalStorageAdapter();
    expect(await adapter.load()).toEqual(EMPTY_DATA);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("persists vehicles and refuelings across instances", async () => {
    const a = new LocalStorageAdapter();
    await a.saveVehicle(vehicle);
    await a.saveRefueling(refueling);
    const b = new LocalStorageAdapter();
    const data = await b.load();
    expect(data.vehicles).toEqual([vehicle]);
    expect(data.refuelings).toEqual([refueling]);
  });

  it("updates an existing entity by id instead of duplicating", async () => {
    const a = new LocalStorageAdapter();
    await a.saveVehicle(vehicle);
    await a.saveVehicle({ ...vehicle, name: "Golfen" });
    const data = await a.load();
    expect(data.vehicles).toHaveLength(1);
    expect(data.vehicles[0].name).toBe("Golfen");
  });

  it("cascades vehicle deletion to its refuelings", async () => {
    const a = new LocalStorageAdapter();
    await a.saveVehicle(vehicle);
    await a.saveRefueling(refueling);
    await a.saveRefueling({ ...refueling, id: "r2", vehicleId: "v2" });
    await a.deleteVehicle("v1");
    const data = await a.load();
    expect(data.vehicles).toEqual([]);
    expect(data.refuelings.map((r) => r.id)).toEqual(["r2"]);
  });

  it("deletes a single refueling", async () => {
    const a = new LocalStorageAdapter();
    await a.saveRefueling(refueling);
    await a.deleteRefueling("r1");
    expect((await a.load()).refuelings).toEqual([]);
  });

  it("replaceAll swaps the whole document", async () => {
    const a = new LocalStorageAdapter();
    await a.saveVehicle(vehicle);
    await a.replaceAll(EMPTY_DATA);
    expect(await a.load()).toEqual(EMPTY_DATA);
  });
});
