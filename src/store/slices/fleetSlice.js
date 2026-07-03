import { initialFleet } from "../fleetData.js";

export const createFleetSlice = (set, get) => ({
  fleet: initialFleet,
  setFleet: (fleet) => {
    set({ fleet });
    get().createAutomaticBackup?.("fleet-change");
  },
  addAircraftToFleet: (newReg, newType) => {
    const newAircraft = `${newReg.toUpperCase()} - ${newType}`;
    const fleet = get().fleet;
    if (!fleet.includes(newAircraft)) {
      set({ fleet: [...fleet, newAircraft].sort() });
      get().createAutomaticBackup?.("fleet-change");
    }
  },
  resetFleet: () => {
    set({ fleet: initialFleet });
    get().createAutomaticBackup?.("fleet-change");
  },
});
