import type { Vehicle } from "../types";

/**
 * Looks up vehicle facts from a registration number. The MVP ships a
 * manual provider (always null → user types everything). A future
 * API-backed provider implements this interface and replaces the
 * export in ManualVehicleProvider.ts — the vehicle form already calls
 * lookup() on registration-number blur.
 */
export interface VehicleInfoProvider {
  lookup(registrationNumber: string): Promise<Partial<Vehicle> | null>;
}
