import { getLastAutomaticBackup } from "./backupService.js";

export const findRecoverableState = () => {
  const autoBackup = getLastAutomaticBackup();
  if (autoBackup?.state?.history && Object.keys(autoBackup.state.history).length > 0) {
    return {
      source: "automatic-backup",
      state: autoBackup.state,
    };
  }

  const legacyRaw = localStorage.getItem("aircraft-logbook-history");
  if (legacyRaw) {
    try {
      const parsed = JSON.parse(legacyRaw);
      const history = Array.isArray(parsed) ? { wayne: parsed } : parsed;
      if (history && Object.keys(history).length > 0) {
        return {
          source: "legacy-local-storage",
          state: { history },
        };
      }
    } catch (_error) {
      return null;
    }
  }

  return null;
};
