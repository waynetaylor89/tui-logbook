export const createMovementsSlice = (set, get) => ({
  history: {},
  setHistory: (history, options = {}) => {
    const next = history && typeof history === "object" ? history : {};
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
    set({
      history: { ...history, [currentUser]: [entry, ...userHistory] },
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
    set({
      history: {
        ...history,
        [targetUser]: userHistory.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                ...updates,
                updatedAt: new Date().toISOString(),
                updatedBy: editor,
              }
            : entry
        ),
      },
    });
    get().createAutomaticBackup?.("edit-movement");
  },
});
