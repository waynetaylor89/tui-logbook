import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
// Login screen removed — assume `currentUser` is always available.
import UserSettings from "./components/UserSettings.jsx";
import AppShell from "./layouts/AppShell.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { useToast, ToastContainer } from "./components/Toast.jsx";
import { LoadingOverlay } from "./components/Spinner.jsx";
import { exportLogbookCSV } from "./utils/exportCSV.js";
import { requestNotificationPermission, checkAndNotifyInactivity, checkAndNotifyUpcomingInactivity } from "./utils/notifications.js";
import { AIRPORT, AIRPORT_STANDS, MOVEMENT_TYPES, TUI_AIRCRAFT_TYPES } from "./config/logbookConfig.js";
import useLogbookStore from "./store/useLogbookStore.js";
import { useMovementForm } from "./hooks/useMovementForm.js";
import { useMovementFilters } from "./hooks/useMovementFilters.js";

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
      aircraftCounts[entry.aircraft] = (aircraftCounts[entry.aircraft] || 0) + 1;
      standCounts[entry.fromStand] = (standCounts[entry.fromStand] || 0) + 1;
      standCounts[entry.toStand] = (standCounts[entry.toStand] || 0) + 1;
      userMovements[entry.createdBy] = (userMovements[entry.createdBy] || 0) + 1;

      // Today's stats
      if (entry.date === today) {
        aircraftToday.add(entry.aircraft);
        if (entry.movementType === "Tow" || entry.movementType === "Power Move") {
          arrivalsToday++;
        }
        if (entry.movementType === "Tow" || entry.movementType === "Power Move") {
          departuresToday++;
        }
      }

      // Monthly stats
      if (entry.date.startsWith(thisMonth)) {
        monthlyMovements++;
      }
    });

    // Calculate logging streak
    const uniqueDates = [...new Set(data.map(entry => entry.date))].sort().reverse();
    let currentStreak = 0;
    let checkDate = new Date();
    
    for (const dateStr of uniqueDates) {
      const entryDate = new Date(dateStr);
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
      date: movementForm.movementDate,
      time: new Date().toLocaleTimeString(),
    };

    addLogEntryToHistory(entry);
    movementForm.resetForm();
    addToast("Movement added successfully.", "success");
  };

  const exportLogbook = () => {
    const exportData = isAdmin(currentUser) ? allHistory : filters.filteredHistory;
    exportLogbookCSV(exportData);
  };

  // Assume `currentUser` is always available — skip login screen.

  if (!hasHydrated) {
    return <LoadingOverlay message="Loading logbook..." />;
  }
  if (!currentUser) {
    return <LoadingOverlay message="Loading user..." />;
  }

  return (
    <ErrorBoundary>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
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
            />
          }
        />
      </Route>
    </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}