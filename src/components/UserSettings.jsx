import { useState } from "react";

const UserSettings = ({ 
  notificationPreferences,
  onUpdateNotificationPreferences,
  darkMode,
  onToggleDarkMode,
  onExportCsv,
  onExportJson,
  onAnalyzeImport,
  onImportConfirmed,
  onImportCancel,
  importPreview,
  importError,
  backupMeta,
  movementCount,
  backupRemindersEnabled,
  onToggleBackupReminders,
  selectedAirline = "TUI Airways",
  showOtherAirlines = false,
  onSetShowOtherAirlines
}) => {
  const [message, setMessage] = useState("");
  const [notificationEnabled, setNotificationEnabled] = useState(notificationPreferences?.enabled ?? true);
  const [notificationPeriod, setNotificationPeriod] = useState(notificationPreferences?.periodDays ?? 7);
  const [importFileName, setImportFileName] = useState("");

  const handleNotificationPreferencesSave = () => {
    const success = onUpdateNotificationPreferences({
      enabled: notificationEnabled,
      periodDays: notificationPeriod,
    });
    if (success) {
      setMessage("Notification preferences updated successfully.");
    } else {
      setMessage("Failed to update notification preferences.");
    }
  };

  const handleImportSelection = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    await onAnalyzeImport?.(file);
    event.target.value = "";
  };

  const handleCsvImportSelection = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    await onAnalyzeImport?.(file);
    event.target.value = "";
  };

  return (
    <div className="space-y-4">
      <div className="ops-panel mx-auto max-w-3xl rounded-2xl p-6">
        <h1 className="mb-6 text-3xl font-semibold text-slate-100">Settings</h1>
        
        <div className="mb-6">
          <h2 className="mb-4 text-xl font-semibold text-slate-100">Notification Preferences</h2>
          
          <div className="mb-4 rounded-xl border border-slate-700 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-slate-100">Inactivity Notifications</h3>
                <p className="text-sm text-slate-400">Get notified when you have not logged movements for a while</p>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={notificationEnabled}
                  onChange={(e) => setNotificationEnabled(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-slate-300">Enabled</span>
              </label>
            </div>
            
            {notificationEnabled && (
              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Notify after (days):
                </label>
                <select
                  value={notificationPeriod}
                  onChange={(e) => setNotificationPeriod(parseInt(e.target.value))}
                  className="w-full rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2 text-slate-100 focus:outline-none"
                >
                  <option value={3}>3 days</option>
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={30}>30 days</option>
                </select>
              </div>
            )}
            
            <button
              onClick={handleNotificationPreferencesSave}
              className="mt-4 w-full rounded-md bg-sky-600 px-4 py-2 text-white hover:bg-sky-500"
            >
              Save Notification Preferences
            </button>
          </div>

        </div>

        <div className="mb-6">
          <h2 className="mb-4 text-xl font-semibold text-slate-100">Backup and Recovery</h2>

          <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
            <div className="grid gap-2 text-sm text-slate-300">
              <div>Last Backup: {backupMeta?.lastBackupAt ? new Date(backupMeta.lastBackupAt).toLocaleString() : "Never"}</div>
              <div>Backup Type: {backupMeta?.backupType || "N/A"}</div>
              <div>Backup Format: {backupMeta?.format || "N/A"}</div>
              <div>Movement Count: {backupMeta?.movementCount ?? movementCount ?? 0}</div>
              <div>Backup Size: {backupMeta?.sizeBytes ? `${backupMeta.sizeBytes} bytes` : "N/A"}</div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button onClick={onExportCsv} className="rounded-md bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-500">Export CSV</button>
              <button onClick={onExportJson} className="rounded-md bg-sky-600 px-3 py-2 text-white hover:bg-sky-500">Export Full Backup</button>
              <label className="cursor-pointer rounded-md bg-cyan-700 px-3 py-2 text-center text-white hover:bg-cyan-600">
                Restore JSON Backup
                <input type="file" accept=".json,application/json" className="hidden" onChange={handleImportSelection} />
              </label>
            </div>

            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <label className="cursor-pointer rounded-md bg-cyan-600 px-3 py-2 text-center text-white hover:bg-cyan-500 sm:col-span-3">
                Import CSV
                <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvImportSelection} />
              </label>
            </div>

            <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-300">
              <div className="font-medium text-slate-100">Import Logbook</div>
              <div className="mt-1">Supports CSV and JSON.</div>
              {importFileName && <div className="mt-2">Selected file: {importFileName}</div>}
              {importPreview && (
                <div className="mt-2">
                  <div>{importPreview.found} movements found</div>
                  <div>{importPreview.newCount} new</div>
                  <div>{importPreview.duplicateCount} duplicate</div>
                  <div className="mt-2 flex gap-2">
                    <button onClick={onImportCancel} className="rounded bg-slate-700 px-3 py-1.5 text-white">Cancel</button>
                    <button onClick={onImportConfirmed} className="rounded bg-emerald-600 px-3 py-1.5 text-white">Import</button>
                  </div>
                </div>
              )}
              {importError && <div className="mt-2 text-rose-300">{importError}</div>}
            </div>

            <label className="mt-4 flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-slate-200">
              <span>Backup reminders every 20 movements</span>
              <input
                type="checkbox"
                checked={backupRemindersEnabled}
                onChange={(e) => onToggleBackupReminders?.(e.target.checked)}
              />
            </label>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="mb-4 text-xl font-semibold text-slate-100">TUI Operations Mode</h2>

          <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
            <div className="mb-3">
              <h3 className="font-medium text-slate-100">Default Airline</h3>
              <p className="text-sm text-slate-400">{selectedAirline || "TUI Airways"}</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-slate-100">Show Other Airlines</h3>
                <p className="text-sm text-slate-400">When OFF, non-TUI flights are hidden by default.</p>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showOtherAirlines}
                  onChange={(e) => onSetShowOtherAirlines?.(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-slate-300">Enabled</span>
              </label>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="mb-4 text-xl font-semibold text-slate-100">Appearance</h2>
          
          <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-slate-100">Dark Mode</h3>
                <p className="text-sm text-slate-400">Switch between light and dark theme</p>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={onToggleDarkMode}
                  className="mr-2"
                />
                <span className="text-sm text-slate-300">Enable</span>
              </label>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-4 rounded-md p-3 ${
            message.includes("success") || message.includes("successfully")
              ? "bg-emerald-500/20 text-emerald-200"
              : "bg-rose-500/20 text-rose-200"
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSettings;
