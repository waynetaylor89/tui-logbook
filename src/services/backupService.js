const LAST_BACKUP_KEY = "last-backup";
const LAST_BACKUP_META_KEY = "last-backup-meta";
const AUTO_BACKUP_TYPE = "automatic";

const byteLength = (value) => new Blob([String(value || "")]).size;

export const createAutomaticBackup = (state, reason = "unknown") => {
  try {
    const snapshot = {
      createdAt: new Date().toISOString(),
      reason,
      type: AUTO_BACKUP_TYPE,
      state,
    };

    const serialized = JSON.stringify(snapshot);
    localStorage.setItem(LAST_BACKUP_KEY, serialized);

    const movementCount = Object.values(state?.history || {}).flat().length;
    const meta = {
      lastBackupAt: snapshot.createdAt,
      backupType: AUTO_BACKUP_TYPE,
      format: "snapshot",
      movementCount,
      sizeBytes: byteLength(serialized),
      reason,
    };

    localStorage.setItem(LAST_BACKUP_META_KEY, JSON.stringify(meta));
    return meta;
  } catch (_error) {
    return null;
  }
};

export const markManualBackup = ({ format, movementCount, sizeBytes }) => {
  const meta = {
    lastBackupAt: new Date().toISOString(),
    backupType: "manual",
    format,
    movementCount,
    sizeBytes,
    reason: "manual",
  };

  localStorage.setItem(LAST_BACKUP_META_KEY, JSON.stringify(meta));
  return meta;
};

export const getBackupMeta = () => {
  try {
    const raw = localStorage.getItem(LAST_BACKUP_META_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
};

export const getLastAutomaticBackup = () => {
  try {
    const raw = localStorage.getItem(LAST_BACKUP_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
};

export const getRecoveryCandidates = () => {
  const legacy = localStorage.getItem("aircraft-logbook-history");
  const autoBackup = localStorage.getItem(LAST_BACKUP_KEY);

  return {
    hasLegacy: Boolean(legacy),
    hasAutomaticBackup: Boolean(autoBackup),
  };
};

export const shouldShowBackupReminder = (movementCount, remindersEnabled = true) => {
  if (!remindersEnabled) return false;
  if (!movementCount || movementCount < 20) return false;
  return movementCount % 20 === 0;
};
