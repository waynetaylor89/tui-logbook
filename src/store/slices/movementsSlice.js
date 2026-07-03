import { normalizeMovementEntry, normalizeMovementHistory } from "../../utils/movementTimestamps.js";

export const createMovementsSlice = (set, get) => ({
  history: {},
  setHistory: (history, options = {}) => {
    const next = normalizeMovementHistory(history, { defaultCreatedAt: options.defaultCreatedAt });
    const isEmpty = Object.keys(next).length === 0;
    if (isEmpty && !options.allowReset) {
      return false;
    }
    set({ history: next });
    get().createAutomaticBackup?.("set-history");
    return true;
  },
  addLogEntry: (entry) => {
    const history = get().history;
    const currentUser = get().currentUser;
    const userHistory = history[currentUser] || [];
    const normalizedEntry = normalizeMovementEntry(entry, {
      defaultCreatedAt: new Date().toISOString(),
    });
    set({
      history: { ...history, [currentUser]: [normalizedEntry, ...userHistory] },
    });
    get().createAutomaticBackup?.("add-movement");
  },
  deleteEntry: (id, owner) => {
    const history = get().history;
    const targetUser = owner || get().currentUser;
    const userHistory = history[targetUser] || [];
    set({
      history: {
        ...history,
        [targetUser]: userHistory.filter((entry) => entry.id !== id),
      },
    });
    get().createAutomaticBackup?.("delete-movement");
  },
  updateEntry: (id, owner, updates) => {
    const history = get().history;
    const targetUser = owner || get().currentUser;
    const userHistory = history[targetUser] || [];
    const editor = get().currentUser;
    const updateStamp = new Date().toISOString();
    set({
      history: {
        ...history,
        [targetUser]: userHistory.map((entry) =>
          entry.id === id
            ? normalizeMovementEntry(
                {
                  ...entry,
                  ...updates,
                  updatedAt: updateStamp,
                  updatedBy: editor,
                },
                { defaultCreatedAt: entry.createdAt || updateStamp }
              )
            : entry
        ),
      },
    });
    get().createAutomaticBackup?.("edit-movement");
  },
});
