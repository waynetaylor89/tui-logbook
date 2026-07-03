import { ADMIN_USERNAME } from "../../constants/appConstants.js";

export const createAuthSlice = (set, get) => ({
  users: {},
  currentUser: "Wayne",
  hasHydrated: false,

  setUsers: (users) => set({ users }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setHasHydrated: (value) => set({ hasHydrated: value }),

  listUsernames: () => Object.keys(get().users).filter(Boolean),

  deleteUser: (username) => {
    if (!username || username === ADMIN_USERNAME) return;
    const users = get().users;
    const history = get().history;
    const updatedUsers = { ...users };
    delete updatedUsers[username];
    const updatedHistory = { ...history };
    delete updatedHistory[username];
    set({ users: updatedUsers, history: updatedHistory });
  },

  resetUserPassword: async () => false,

  updateNotificationPreferences: (username, preferences) => {
    const users = get().users;
    if (!users[username]) return false;
    set({
      users: {
        ...users,
        [username]: {
          ...users[username],
          notificationPreferences: {
            ...users[username].notificationPreferences,
            ...preferences,
          },
        },
      },
    });
    return true;
  },

  getNotificationPreferences: (username) => {
    const users = get().users;
    if (!users[username]) return { enabled: true, periodDays: 7 };
    return users[username].notificationPreferences || { enabled: true, periodDays: 7 };
  },

  toggleDarkMode: (username) => {
    const users = get().users;
    if (!users[username]) return false;
    set({
      users: {
        ...users,
        [username]: {
          ...users[username],
          darkMode: !users[username].darkMode,
        },
      },
    });
    return true;
  },

  getDarkMode: (username) => {
    const users = get().users;
    if (!users[username]) return false;
    return users[username].darkMode || false;
  },

  isAdmin: (username) => {
    return username === ADMIN_USERNAME;
  },
});
