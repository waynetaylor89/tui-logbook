const PRE_MIGRATION_BACKUP_KEY = "pre-migration-backup";
const LEGACY_HISTORY_KEY = "aircraft-logbook-history";
const LEGACY_MIGRATION_FLAG = "legacyMigrationCompleted";

const isObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

export const deepMerge = (baseValue, incomingValue) => {
  if (Array.isArray(baseValue) && Array.isArray(incomingValue)) {
    return incomingValue.length > 0 ? incomingValue : baseValue;
  }

  if (isObject(baseValue) && isObject(incomingValue)) {
    const keys = new Set([...Object.keys(baseValue), ...Object.keys(incomingValue)]);
    const merged = {};
    keys.forEach((key) => {
      merged[key] = deepMerge(baseValue[key], incomingValue[key]);
    });
    return merged;
  }

  if (incomingValue === undefined || incomingValue === null || incomingValue === "") {
    return baseValue;
  }

  return incomingValue;
};

export const savePreMigrationBackup = (persistedState, fromVersion) => {
  try {
    const payload = {
      backedUpAt: new Date().toISOString(),
      fromVersion,
      data: persistedState,
    };
    localStorage.setItem(PRE_MIGRATION_BACKUP_KEY, JSON.stringify(payload));
  } catch (_error) {
    // Best effort backup.
  }
};

export const restorePreMigrationBackup = () => {
  try {
    const raw = localStorage.getItem(PRE_MIGRATION_BACKUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.data || null;
  } catch (_error) {
    return null;
  }
};

const normalizeLegacyHistory = (legacyRaw) => {
  if (!legacyRaw) return {};

  if (Array.isArray(legacyRaw)) {
    return { wayne: legacyRaw };
  }

  if (isObject(legacyRaw)) {
    return legacyRaw;
  }

  return {};
};

export const applyLegacyHistoryBridge = (persistedState = {}) => {
  try {
    const alreadyMigrated = localStorage.getItem(LEGACY_MIGRATION_FLAG) === "true";
    if (alreadyMigrated) {
      return persistedState;
    }

    const currentHistory = persistedState?.history;
    const currentHasData = Boolean(
      currentHistory &&
        isObject(currentHistory) &&
        Object.values(currentHistory).some((entries) => Array.isArray(entries) && entries.length > 0)
    );

    if (currentHasData) {
      localStorage.setItem(LEGACY_MIGRATION_FLAG, "true");
      return persistedState;
    }

    const legacyRaw = localStorage.getItem(LEGACY_HISTORY_KEY);
    if (!legacyRaw) {
      return persistedState;
    }

    const legacyParsed = JSON.parse(legacyRaw);
    const legacyHistory = normalizeLegacyHistory(legacyParsed);
    const legacyHasData = Object.values(legacyHistory).some((entries) => Array.isArray(entries) && entries.length > 0);

    if (!legacyHasData) {
      localStorage.setItem(LEGACY_MIGRATION_FLAG, "true");
      return persistedState;
    }

    localStorage.setItem(LEGACY_MIGRATION_FLAG, "true");
    return {
      ...persistedState,
      history: legacyHistory,
    };
  } catch (_error) {
    return persistedState;
  }
};

export const safeMigrateState = (persistedState, fromVersion, migrateFn) => {
  savePreMigrationBackup(persistedState, fromVersion);
  try {
    const migrated = migrateFn(persistedState, fromVersion);
    return applyLegacyHistoryBridge(migrated || persistedState);
  } catch (_error) {
    const restored = restorePreMigrationBackup();
    return applyLegacyHistoryBridge(restored || persistedState);
  }
};

export const hasLegacyMigrationCompleted = () => localStorage.getItem(LEGACY_MIGRATION_FLAG) === "true";
