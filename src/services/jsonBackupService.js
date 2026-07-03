export const STORE_SCHEMA_VERSION = 1;

export const createBackupPayload = (storeState = {}) => ({
  appName: "TUI LOGBOOK V2",
  appVersion: "2.0.0",
  schemaVersion: STORE_SCHEMA_VERSION,
  exportedAt: new Date().toISOString(),
  backupType: "full-zustand-store",
  deviceTime: new Date().toString(),
  data: storeState,
});

export const validateBackupPayload = (payload) => {
  if (!payload || typeof payload !== "object") {
    return { valid: false, error: "Backup file is empty or invalid." };
  }

  const required = ["appName", "appVersion", "schemaVersion", "exportedAt", "backupType", "deviceTime", "data"];
  const missing = required.filter((key) => !(key in payload));
  if (missing.length > 0) {
    return { valid: false, error: `Backup missing required fields: ${missing.join(", ")}` };
  }

  if (typeof payload.data !== "object" || payload.data === null) {
    return { valid: false, error: "Backup data payload is invalid." };
  }

  return { valid: true };
};

export const getJsonBackupFilename = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `TUI_Logbook_Backup_${y}-${m}-${d}_${hh}-${mm}.json`;
};

export const downloadJsonBackup = (payload, filename) => {
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
