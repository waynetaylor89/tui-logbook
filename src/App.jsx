import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
// Login screen removed — assume `currentUser` is always available.
import UserSettings from "./components/UserSettings.jsx";
import AppShell from "./layouts/AppShell.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import UpdateAvailableBanner from "./components/UpdateAvailableBanner.jsx";
import { useToast, ToastContainer } from "./components/Toast.jsx";
import { LoadingOverlay } from "./components/Spinner.jsx";
import { exportLogbookCSV } from "./utils/exportCSV.js";
import { requestNotificationPermission, checkAndNotifyInactivity, checkAndNotifyUpcomingInactivity } from "./utils/notifications.js";
import { AIRPORT, AIRPORT_STANDS, MOVEMENT_TYPES, TUI_AIRCRAFT_TYPES } from "./config/logbookConfig.js";
import useLogbookStore from "./store/useLogbookStore.js";
import { useMovementForm } from "./hooks/useMovementForm.js";
import { useMovementFilters } from "./hooks/useMovementFilters.js";
import { createBackupPayload, downloadJsonBackup, getJsonBackupFilename, validateBackupPayload } from "./services/jsonBackupService.js";
import { createAutomaticBackup, markManualBackup } from "./services/backupService.js";
import { findRecoverableState } from "./services/backupRecoveryService.js";
import { analyzeImportFile } from "./services/importWizardService.js";
import { importMovementsFromCsvRows, restoreFromJsonBackup } from "./services/restoreService.js";
import { exportMovementsToCsv, getCsvFilename, downloadCsv } from "./services/csvService.js";
import { getEntryCreatedAtDateKey, getEntryCreatedAtTimestamp, normalizeMovementEntry } from "./utils/movementTimestamps.js";

// Code split pages for better performance
const HomePage = lazy(() => import("./pages/HomePage.jsx"));
const MovementsPage = lazy(() => import("./pages/MovementsPage.jsx"));
const RecordsPage = lazy(() => import("./pages/RecordsPage.jsx"));
const UsersPage = lazy(() => import("./pages/UsersPage.jsx"));

export default function AircraftMovementLogbook() {
  // Zustand store
  const {
    currentUser,
    users,
    fleet,
    history,
    hasHydrated,
    deleteUser,
    addLogEntry,
    deleteEntry,
    updateEntry,
    addAircraftToFleet,
    resetFleet,
    updateNotificationPreferences,
    getNotificationPreferences,
    toggleDarkMode,
    getDarkMode,
    isAdmin,
    setHistory,
    createAutomaticBackup: storeAutoBackup,
    backupMeta,
    backupRemindersEnabled,
    setBackupRemindersEnabled,
    recoveryPromptIgnored,
    setRecoveryPromptIgnored,
  } = useLogbookStore();

  const handleDeleteUser = (username) => {
    deleteUser(username);
  };

  const addLogEntryToHistory = (entry) => {
    addLogEntry(entry);
  };

  const handleDeleteEntry = (id, owner) => {
    if (owner !== currentUser && !isAdmin(currentUser)) return;
    deleteEntry(id, owner);
  };

  const handleUpdateEntry = (id, owner, updates) => {
    if (owner !== currentUser && !isAdmin(currentUser)) return false;
    updateEntry(id, owner, updates);
    return true;
  };


  // Custom hooks for form and filter management
  const movementForm = useMovementForm();
  const { toasts, addToast, removeToast } = useToast();
  const [newReg, setNewReg] = useState("");
  const [newType, setNewType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [importPreview, setImportPreview] = useState(null);
  const [importError, setImportError] = useState("");
  const [recoverableState, setRecoverableState] = useState(null);
  const [reminderCheckpoint, setReminderCheckpoint] = useState(0);

  useEffect(() => {
  if (currentUser && history[currentUser]) {
    /*
    requestNotificationPermission();

    const preferences = getNotificationPreferences(currentUser);

    checkAndNotifyInactivity(
      history[currentUser],
      currentUser,
      preferences
    );

    checkAndNotifyUpcomingInactivity(
      history[currentUser],
      currentUser,
      preferences
    );
    */
  }
}, [currentUser, history]);

  useEffect(() => {
    if (!hasHydrated || recoveryPromptIgnored) return;
    const hasHistory = Object.values(history || {}).some((entries) => Array.isArray(entries) && entries.length > 0);
    if (hasHistory) return;
    const candidate = findRecoverableState();
    if (candidate) {
      setRecoverableState(candidate);
    }
  }, [hasHydrated, history, recoveryPromptIgnored]);

  const currentUserHistory = useMemo(() => history[currentUser] || [], [history, currentUser]);

  const allHistory = useMemo(() => {
    if (!isAdmin(currentUser)) return [];
    return Object.values(history).flat();
  }, [history, isAdmin, currentUser]);

  // Use movement filters hook
  const filters = useMovementFilters(currentUserHistory, allHistory, isAdmin(currentUser), currentUser);

  const filteredAircraftOptions = useMemo(() => {
    if (!movementForm.aircraft.trim()) return fleet.slice(0, 12);
    return fleet.filter((plane) => plane.toLowerCase().includes(movementForm.aircraft.toLowerCase())).slice(0, 12);
  }, [movementForm.aircraft, fleet]);

  const stats = useMemo(() => {
    const data = isAdmin(currentUser) ? allHistory : currentUserHistory;
    const aircraftCounts = {};
    const standCounts = {};
    const userMovements = {};
    const today = new Date().toISOString().slice(0, 10);
    const thisMonth = new Date().toISOString().slice(0, 7);
    
    let aircraftToday = new Set();
    let arrivalsToday = 0;
    let departuresToday = 0;
    let monthlyMovements = 0;

    data.forEach((entry) => {
      const normalizedDate = getEntryCreatedAtDateKey(entry);
      aircraftCounts[entry.aircraft] = (aircraftCounts[entry.aircraft] || 0) + 1;
      standCounts[entry.fromStand] = (standCounts[entry.fromStand] || 0) + 1;
      standCounts[entry.toStand] = (standCounts[entry.toStand] || 0) + 1;
      userMovements[entry.createdBy] = (userMovements[entry.createdBy] || 0) + 1;

      // Today's stats
      if (normalizedDate === today) {
        aircraftToday.add(entry.aircraft);
        if (entry.movementType === "Tow" || entry.movementType === "Power Move") {
          arrivalsToday++;
        }
        if (entry.movementType === "Tow" || entry.movementType === "Power Move") {
          departuresToday++;
        }
      }

      // Monthly stats
      if (normalizedDate.startsWith(thisMonth)) {
        monthlyMovements++;
      }
    });

    // Calculate logging streak
    const uniqueDates = [...new Set(data.map((entry) => getEntryCreatedAtDateKey(entry)).filter(Boolean))].sort().reverse();
    let currentStreak = 0;
    let checkDate = new Date();
    
    for (const dateStr of uniqueDates) {
      const entryDate = new Date(`${dateStr}T00:00:00`);
      const diffDays = Math.floor((checkDate - entryDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0 || diffDays === 1) {
        currentStreak++;
        checkDate = entryDate;
      } else {
        break;
      }
    }

    return {
      totalMovements: data.length,
      aircraftToday: aircraftToday.size,
      arrivalsToday,
      departuresToday,
      monthlyMovements,
      currentStreak,
      topAircraft: Object.entries(aircraftCounts).sort((a, b) => b[1] - a[1]).slice(0, 3),
      topStands: Object.entries(standCounts).sort((a, b) => b[1] - a[1]).slice(0, 3),
      topUsers: Object.entries(userMovements).sort((a, b) => b[1] - a[1]).slice(0, 3),
    };
  }, [allHistory, currentUserHistory]);

  const lastEntryTimestamp = useMemo(() => {
    const data = isAdmin(currentUser) ? allHistory : currentUserHistory;
    let latest = null;

    data.forEach((entry) => {
      const createdTimestamp = getEntryCreatedAtTimestamp(entry);
      if (Number.isFinite(createdTimestamp) && createdTimestamp > 0) {
        latest = latest ? Math.max(latest, createdTimestamp) : createdTimestamp;
        return;
      }

      const idTimestamp = Number(String(entry.id || "").split("-")[0]);
      if (Number.isFinite(idTimestamp) && idTimestamp > 0) {
        latest = latest ? Math.max(latest, idTimestamp) : idTimestamp;
        return;
      }

      const fallback = new Date(`${entry.createdAt || ""}`).getTime();
      if (Number.isFinite(fallback)) {
        latest = latest ? Math.max(latest, fallback) : fallback;
      }
    });

    return latest;
  }, [allHistory, currentUserHistory, currentUser, isAdmin]);

  const userSummary = useMemo(() => {
    if (!isAdmin(currentUser)) return [];
    
    return Object.entries(history).map(([username, userHistory]) => ({
      username,
      movements: userHistory.length,
    }));
  }, [history, isAdmin, currentUser]);

  const handleResetFleet = () => {
    if (window.confirm("Reset fleet to default TUI Airways list? This will remove any custom additions.")) {
      resetFleet();
      addToast("Fleet reset to default.", "success");
    }
  };

  const handleAddAircraftToFleet = () => {
    if (!newReg.trim() || !newType) {
      addToast("Please enter both registration and type.", "warning");
      return;
    }
    const newAircraft = `${newReg.toUpperCase()} - ${newType}`;
    if (fleet.includes(newAircraft)) {
      addToast("Aircraft already exists in fleet.", "error");
      return;
    }
    addAircraftToFleet(newReg, newType);
    setNewReg("");
    setNewType("");
    addToast("Aircraft added to fleet.", "success");
  };

  const handleAddLogEntry = () => {
    if (!movementForm.validateForm()) {
      addToast("Please fix form errors.", "warning");
      return;
    }

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdBy: currentUser,
      aircraft: movementForm.aircraft,
      airport: AIRPORT,
      movementType: movementForm.movementType,
      fromStand: movementForm.fromStand,
      toStand: movementForm.toStand,
      notes: movementForm.notes,
      movementDate: movementForm.movementDate,
      movementTime: new Date().toLocaleTimeString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addLogEntryToHistory(entry);
    movementForm.resetForm();
    addToast("Movement added successfully.", "success");
  };

  const handleImportCsvRows = (rows) => {
    if (!Array.isArray(rows) || rows.length === 0) {
      addToast("No CSV rows found to import.", "warning");
      return;
    }

    const normalize = (value) => String(value || "").trim();
    const acceptedRows = rows
      .map((row) => normalizeMovementEntry({
        aircraft: normalize(row.Aircraft ?? row.aircraft),
        movementType: normalize(row["Movement Type"] ?? row.movementType) || "Tow",
        fromStand: normalize(row["From Stand"] ?? row.fromStand).toUpperCase(),
        toStand: normalize(row["To Stand"] ?? row.toStand).toUpperCase(),
        movementDate: normalize(row.movementDate ?? row.Date ?? row.date),
        movementTime: normalize(row.movementTime ?? row.Time ?? row.time),
        createdAt: normalize(row.createdAt ?? row["Created Date"] ?? row.createdAt),
        updatedAt: normalize(row.updatedAt ?? row["Modified Date"] ?? row.updatedAt),
        notes: normalize(row.Notes ?? row.notes),
        createdBy: currentUser,
      }))
      .filter((entry) => entry.aircraft);

    if (acceptedRows.length === 0) {
      addToast("No valid movement rows found in CSV.", "warning");
      return;
    }

    const baseMs = Date.now();
    [...acceptedRows].reverse().forEach((entry, index) => {
      addLogEntryToHistory({
        id: `${baseMs + index}-${Math.random().toString(36).slice(2, 8)}`,
        createdBy: currentUser,
        airport: AIRPORT,
        movementType: entry.movementType,
        aircraft: entry.aircraft,
        fromStand: entry.fromStand,
        toStand: entry.toStand,
        movementDate: entry.movementDate,
        movementTime: entry.movementTime,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        missingTimestamp: entry.missingTimestamp,
        notes: entry.notes,
      });
    });

    addToast(`Imported ${acceptedRows.length} movement records from CSV.`, "success");
  };

  const exportLogbook = () => {
    const exportData = isAdmin(currentUser) ? allHistory : filters.filteredHistory;
    exportLogbookCSV(exportData);
  };

  const validateCsvExport = (movements) => {
    if (!Array.isArray(movements)) {
      return { valid: false, error: "Export failed: movement data is invalid." };
    }
    return { valid: true };
  };

  const handleExportCsvValidated = () => {
    const data = isAdmin(currentUser) ? allHistory : currentUserHistory;
    const validation = validateCsvExport(data);
    if (!validation.valid) {
      addToast(validation.error, "error");
      return;
    }

    const csv = exportMovementsToCsv(data);
    const filename = getCsvFilename(new Date());
    downloadCsv(csv, filename);
    markManualBackup({ format: "CSV", movementCount: data.length, sizeBytes: new Blob([csv]).size });
    addToast("Backup created successfully.", "success");
  };

  const handleExportJsonBackup = () => {
    const stateSnapshot = useLogbookStore.getState();
    const payload = createBackupPayload(stateSnapshot);
    const validation = validateBackupPayload(payload);
    if (!validation.valid) {
      addToast(validation.error, "error");
      return;
    }

    const filename = getJsonBackupFilename(new Date());
    downloadJsonBackup(payload, filename);
    const json = JSON.stringify(payload);
    markManualBackup({
      format: "JSON",
      movementCount: Object.values(payload.data?.history || {}).flat().length,
      sizeBytes: new Blob([json]).size,
    });
    addToast("Backup created successfully.", "success");
  };

  const handleAnalyzeImport = async (file) => {
    setImportError("");
    setImportPreview(null);
    try {
      const analysis = await analyzeImportFile({ file, currentHistory: history, currentUser });
      setImportPreview(analysis);
    } catch (error) {
      setImportError(error.message || "Import analysis failed.");
    }
  };

  const handleImportConfirmed = () => {
    if (!importPreview) return;

    try {
      if (importPreview.type === "json") {
        const restored = restoreFromJsonBackup(importPreview.parsed, useLogbookStore.getState());
        useLogbookStore.setState(restored, true);
        createAutomaticBackup(useLogbookStore.getState(), "restore-json");
        addToast(`Imported ${importPreview.found} records from JSON backup.`, "success");
      } else {
        const result = importMovementsFromCsvRows({
          rows: importPreview.rows,
          currentHistory: useLogbookStore.getState().history,
          currentUser,
        });

        setHistory(result.history, { allowReset: true });
        storeAutoBackup?.("import-csv");
        addToast(`Imported ${result.importedCount}, skipped duplicates ${result.skippedDuplicates}, failed ${result.failed}.`, "success");
      }

      setImportPreview(null);
      setImportError("");
    } catch (error) {
      setImportError(error.message || "Import failed.");
    }
  };

  const handleRecoverNow = () => {
    if (!recoverableState?.state) return;
    const next = {
      ...useLogbookStore.getState(),
      ...recoverableState.state,
    };
    useLogbookStore.setState(next, true);
    createAutomaticBackup(useLogbookStore.getState(), "recovery-mode");
    setRecoverableState(null);
    setRecoveryPromptIgnored(false);
    addToast("Recovery completed successfully.", "success");
  };

  const handleIgnoreRecovery = () => {
    setRecoverableState(null);
    setRecoveryPromptIgnored(true);
  };

  useEffect(() => {
    const movementCount = currentUserHistory.length;
    if (!backupRemindersEnabled) return;
    if (movementCount < 20) return;
    if (movementCount % 20 !== 0) return;
    if (movementCount === reminderCheckpoint) return;

    setReminderCheckpoint(movementCount);
    const shouldBackup = window.confirm(`You now have ${movementCount} movements. Would you like to create a backup?`);
    if (shouldBackup) {
      handleExportJsonBackup();
    }
  }, [currentUserHistory.length, backupRemindersEnabled, reminderCheckpoint]);

  // Assume `currentUser` is always available — skip login screen.

  if (!hasHydrated) {
    return <LoadingOverlay message="Loading logbook..." />;
  }
  if (!currentUser) {
    return <LoadingOverlay message="Loading user..." />;
  }

  return (
    <ErrorBoundary>
      <div className="mx-auto w-full max-w-7xl px-3 pt-3 lg:px-6 lg:pt-6">
        <UpdateAvailableBanner />
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {recoverableState && (
        <div className="fixed inset-x-0 top-2 z-50 mx-auto max-w-lg rounded-xl border border-amber-500/60 bg-amber-900/90 p-4 text-amber-100 shadow-lg">
          <div className="font-semibold">Older logbook detected. Recover now?</div>
          <div className="mt-2 text-sm">Source: {recoverableState.source}</div>
          <div className="mt-3 flex gap-2">
            <button onClick={handleRecoverNow} className="rounded bg-emerald-600 px-3 py-1.5 text-white">Recover</button>
            <button onClick={handleIgnoreRecovery} className="rounded bg-slate-700 px-3 py-1.5 text-white">Ignore</button>
          </div>
        </div>
      )}
      {isLoading && <LoadingOverlay message={loadingMessage} />}
      <Suspense fallback={<LoadingOverlay message="Loading page..." />}>
        <Routes>
      <Route
        element={<AppShell fleetCount={fleet.length} currentUser={currentUser} isAdmin={isAdmin(currentUser)} darkMode={getDarkMode(currentUser)} />}
      >
        <Route
          path="/"
          element={
            <HomePage
              isAdmin={isAdmin(currentUser)}
              userSummary={userSummary}
              stats={stats}
              history={history}
              lastEntryTimestamp={lastEntryTimestamp}
              newReg={newReg}
              setNewReg={setNewReg}
              newType={newType}
              setNewType={setNewType}
              tuiAircraftTypes={TUI_AIRCRAFT_TYPES}
              handleAddAircraftToFleet={handleAddAircraftToFleet}
              handleResetFleet={handleResetFleet}
            />
          }
        />
        <Route
          path="/movements"
          element={
            <MovementsPage
              isAdmin={isAdmin(currentUser)}
              currentUser={currentUser}
              allHistoryLength={allHistory.length}
              currentUserHistoryLength={currentUserHistory.length}
              movementDate={movementForm.movementDate}
              setMovementDate={movementForm.setMovementDate}
              aircraft={movementForm.aircraft}
              setAircraft={movementForm.setAircraft}
              movementType={movementForm.movementType}
              setMovementType={movementForm.setMovementType}
              fromStand={movementForm.fromStand}
              setFromStand={movementForm.setFromStand}
              toStand={movementForm.toStand}
              setToStand={movementForm.setToStand}
              notes={movementForm.notes}
              setNotes={movementForm.setNotes}
              movementTypes={MOVEMENT_TYPES}
              airportStands={AIRPORT_STANDS}
              filteredAircraftOptions={filteredAircraftOptions}
              showAircraftSuggestions={movementForm.showAircraftSuggestions}
              setShowAircraftSuggestions={movementForm.setShowAircraftSuggestions}
              handleAddLogEntry={handleAddLogEntry}
              successMessage={successMessage}
              clearSuccessMessage={() => setSuccessMessage("")}
            />
          }
        />
        <Route
          path="/records"
          element={
            <RecordsPage
              isAdmin={isAdmin(currentUser)}
              currentUser={currentUser}
              allHistoryLength={allHistory.length}
              currentUserHistoryLength={currentUserHistory.length}
              paginatedHistory={filters.paginatedHistory}
              handleDeleteEntry={handleDeleteEntry}
              handleEditEntry={handleUpdateEntry}
              searchTerm={filters.searchTerm}
              setSearchTerm={filters.setSearchTerm}
              activeTab={filters.activeTab}
              setActiveTab={filters.setActiveTab}
              tuiAircraftTypes={TUI_AIRCRAFT_TYPES}
              totalPages={filters.totalPages}
              currentPage={filters.currentPage}
              setCurrentPage={filters.setCurrentPage}
              typeFilteredHistory={filters.typeFilteredHistory}
              exportLogbook={exportLogbook}
              onImportCsv={handleImportCsvRows}
              selectedUser={filters.selectedUser}
              setSelectedUser={filters.setSelectedUser}
              userOptions={filters.userOptions}
              stats={stats}
              history={history}
              fleet={fleet}
            />
          }
        />
        <Route
          path="/users"
          element={
            isAdmin(currentUser) ? (
              <UsersPage
                users={users}
                history={history}
                userSummary={userSummary}
                handleDeleteUser={handleDeleteUser}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/settings"
          element={
            <UserSettings
              currentUser={currentUser}
              notificationPreferences={getNotificationPreferences(currentUser)}
              onUpdateNotificationPreferences={updateNotificationPreferences}
              darkMode={getDarkMode(currentUser)}
              onToggleDarkMode={() => toggleDarkMode(currentUser)}
              onExportCsv={handleExportCsvValidated}
              onExportJson={handleExportJsonBackup}
              onAnalyzeImport={handleAnalyzeImport}
              onImportConfirmed={handleImportConfirmed}
              onImportCancel={() => setImportPreview(null)}
              importPreview={importPreview}
              importError={importError}
              backupMeta={backupMeta}
              movementCount={currentUserHistory.length}
              backupRemindersEnabled={backupRemindersEnabled}
              onToggleBackupReminders={(value) => setBackupRemindersEnabled(value)}
            />
          }
        />
      </Route>
    </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}