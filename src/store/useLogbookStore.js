import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createAuthSlice } from "./slices/authSlice.js";
import { createFleetSlice } from "./slices/fleetSlice.js";
import { createMovementsSlice } from "./slices/movementsSlice.js";
import { createShiftSlice } from "./slices/shiftSlice.js";
import { createFlightsSlice } from "./slices/flightsSlice.js";
import { createAircraftSlice } from "./slices/aircraftSlice.js";
import { createTimelineSlice } from "./slices/timelineSlice.js";
import { mergeImportedHistory } from "./importedHistory.js";
import { createAutomaticBackup, getBackupMeta } from "../services/backupService.js";
import { deepMerge, safeMigrateState } from "../services/migrationService.js";
import { normalizeMovementHistory } from "../utils/movementTimestamps.js";

const STORE_VERSION = 11;

const cloneStateOnly = (state = {}) => {
  const cloned = {};
  Object.entries(state).forEach(([key, value]) => {
    if (typeof value === "function") return;
    cloned[key] = value;
  });
  return cloned;
};

const useLogbookStore = create(
  persist(
    (set, get) => ({
      ...createFleetSlice(set, get),
      ...createMovementsSlice(set, get),
      ...createShiftSlice(set, get),
      ...createFlightsSlice(set, get),
      ...createAircraftSlice(set, get),
      ...createTimelineSlice(set, get),
      ...createAuthSlice(set, get),
      backupMeta: getBackupMeta(),
      backupRemindersEnabled: true,
      recoveryPromptIgnored: false,
      setBackupRemindersEnabled: (enabled) => set({ backupRemindersEnabled: Boolean(enabled) }),
      setRecoveryPromptIgnored: (ignored) => set({ recoveryPromptIgnored: Boolean(ignored) }),
      createAutomaticBackup: (reason = "unknown") => {
        const snapshot = cloneStateOnly(get());
        const meta = createAutomaticBackup(snapshot, reason);
        if (meta) {
          set({ backupMeta: meta });
        }
        return meta;
      },
      refreshBackupMeta: () => {
        set({ backupMeta: getBackupMeta() });
        return get().backupMeta;
      },
    }),
    {
      name: "logbook-storage",
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        fleet: state.fleet,
        flights: state.flights,
        liveFlightsMeta: state.liveFlightsMeta,
        dailyImportHistory: state.dailyImportHistory,
        fr24ImportHistory: state.fr24ImportHistory,
        history: state.history,
        shiftJobs: state.shiftJobs,
        smartSuggestionMemory: state.smartSuggestionMemory,
        aircraftProfiles: state.aircraftProfiles,
        timelineEvents: state.timelineEvents,
        profile: state.profile,
        users: state.users,
        currentUser: state.currentUser,
        backupMeta: state.backupMeta,
        backupRemindersEnabled: state.backupRemindersEnabled,
        recoveryPromptIgnored: state.recoveryPromptIgnored,
      }),
      migrate: (persistedState, version) => safeMigrateState(persistedState, version, (rawState, currentVersion) => {
        const state = rawState;
        if (!persistedState) return persistedState;

        if (currentVersion < 2) {
          return {
            ...state,
            history: mergeImportedHistory(state.history || {}),
            shiftJobs: state.shiftJobs || [],
          };
        }

        if (currentVersion < 3) {
          return {
            ...state,
            shiftJobs: state.shiftJobs || [],
          };
        }

        if (currentVersion < 4) {
          const migrated = { ...state };
          if (Array.isArray(state.flights)) {
            migrated.flights = state.flights;
          }
          if (!Array.isArray(state.dailyImportHistory)) {
            migrated.dailyImportHistory = [];
          }
          return migrated;
        }

        if (currentVersion < 5) {
          return {
            ...state,
            aircraftProfiles: Array.isArray(state.aircraftProfiles)
              ? state.aircraftProfiles
              : [],
          };
        }

        if (currentVersion < 6) {
          return {
            ...state,
            smartSuggestionMemory:
              state.smartSuggestionMemory && typeof state.smartSuggestionMemory === "object"
                ? state.smartSuggestionMemory
                : {},
          };
        }

        if (currentVersion < 7) {
          return {
            ...state,
            timelineEvents: Array.isArray(state.timelineEvents)
              ? state.timelineEvents
              : [],
          };
        }

        if (currentVersion < 8) {
          return {
            ...state,
            fr24ImportHistory: Array.isArray(state.fr24ImportHistory)
              ? state.fr24ImportHistory
              : [],
          };
        }

        if (currentVersion < 9) {
          return {
            ...state,
            liveFlightsMeta:
              state.liveFlightsMeta && typeof state.liveFlightsMeta === "object"
                ? state.liveFlightsMeta
                : {
                    status: "Idle",
                    refreshing: false,
                    lastUpdated: "",
                    importedFlights: 0,
                    tuiFlights: 0,
                    fromCache: false,
                    error: "",
                  },
          };
        }

        if (currentVersion < 10) {
          return {
            ...state,
            users: state.users && typeof state.users === "object" ? state.users : {},
            backupMeta: state.backupMeta || null,
            backupRemindersEnabled: state.backupRemindersEnabled !== false,
            recoveryPromptIgnored: Boolean(state.recoveryPromptIgnored),
          };
        }

        if (currentVersion < 11) {
          return {
            ...state,
            history: normalizeMovementHistory(state.history || {}),
          };
        }

        return state;
      }),
      merge: (persistedState, currentState) => {
        const merged = deepMerge(currentState, persistedState);
        return {
          ...merged,
          history: normalizeMovementHistory(merged.history || {}),
        };
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHistory(state.history || {}, { allowReset: true });
          state.setHasHydrated(true);
          state.refreshBackupMeta();
        }
      },
    }
  )
);

export default useLogbookStore;