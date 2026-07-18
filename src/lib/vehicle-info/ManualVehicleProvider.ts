import type { VehicleInfoProvider } from "./VehicleInfoProvider";

class ManualVehicleProvider implements VehicleInfoProvider {
  async lookup(): Promise<null> {
    return null;
  }
}

/** Active provider. Swap this export when a registration-number API exists. */
export const vehicleInfoProvider: VehicleInfoProvider = new ManualVehicleProvider();
