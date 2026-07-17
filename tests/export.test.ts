import { describe, expect, it } from "vitest";
import { parseImport, toCSV, toJSON } from "@/lib/export";
import { enrichRefuelings } from "@/lib/calculations";
import { EMPTY_DATA, type AppData, type Vehicle } from "@/lib/types";

const vehicle: Vehicle = {
  id: "v1",
  name: "Volkswagen Golf",
  registrationNumber: "ABC123",
  fuelType: "bensin",
  createdAt: "2024-01-01T00:00:00.000Z",
};

const data: AppData = {
  version: 1,
  vehicles: [vehicle],
  refuelings: [
    {
      id: "r1",
      vehicleId: "v1",
      date: "2024-07-04",
      liters: 39.2,
      odometer: 124762,
      pricePerLiter: 18.7,
      createdAt: "2024-07-04T00:00:00.000Z",
    },
    {
      id: "r2",
      vehicleId: "v1",
      date: "2024-07-17",
      liters: 42.8,
      odometer: 125460,
      pricePerLiter: 18.9,
      createdAt: "2024-07-17T00:00:00.000Z",
    },
  ],
  settings: { currency: "SEK", theme: "dark", activeVehicleId: "v1" },
};

describe("JSON export/import", () => {
  it("round-trips app data", () => {
    expect(parseImport(toJSON(data))).toEqual(data);
  });

  it("rejects invalid JSON with a Swedish message", () => {
    expect(() => parseImport("hejsan")).toThrow(/inte.*giltig/i);
  });

  it("rejects a valid-JSON but wrong-shape document", () => {
    expect(() => parseImport(JSON.stringify({ foo: 1 }))).toThrow(/inte.*giltig/i);
  });

  it("rejects refuelings missing required numeric fields", () => {
    const bad = JSON.parse(toJSON(data));
    delete bad.refuelings[0].odometer;
    expect(() => parseImport(JSON.stringify(bad))).toThrow(/inte.*giltig/i);
  });

  it("accepts an empty export", () => {
    expect(parseImport(toJSON(EMPTY_DATA))).toEqual(EMPTY_DATA);
  });
});

describe("CSV export", () => {
  it("produces semicolon-separated rows with header and CRLF", () => {
    const csv = toCSV(enrichRefuelings(data.refuelings), data.vehicles);
    const lines = csv.split("\r\n").filter(Boolean);
    expect(lines[0]).toBe(
      "datum;fordon;regnr;liter;matarstallning;stracka_km;forbrukning_l_100km;pris_per_liter;kostnad",
    );
    expect(lines).toHaveLength(3);
    // second data row is the enriched 2024-07-17 entry
    expect(lines[2]).toBe(
      "2024-07-17;Volkswagen Golf;ABC123;42.8;125460;698;6.13;18.9;808.92",
    );
  });

  it("leaves unknown fields empty for baseline entries", () => {
    const csv = toCSV(enrichRefuelings([data.refuelings[0]]), data.vehicles);
    const lines = csv.split("\r\n").filter(Boolean);
    expect(lines[1]).toBe("2024-07-04;Volkswagen Golf;ABC123;39.2;124762;;;18.7;733.04");
  });
});
