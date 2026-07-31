import MovementForm from "../components/MovementForm.jsx";

export default function MovementsPage({
  currentUserHistoryLength,
  movementDate,
  setMovementDate,
  aircraft,
  setAircraft,
  movementType,
  setMovementType,
  fromStand,
  setFromStand,
  toStand,
  setToStand,
  notes,
  setNotes,
  movementTypes,
  airportStands,
  filteredAircraftOptions,
  showAircraftSuggestions,
  setShowAircraftSuggestions,
  handleAddLogEntry,
  successMessage,
  clearSuccessMessage,
}) {
  return (
    <div className="space-y-4">
      <div className="ops-panel rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold text-slate-100">
              Aircraft Movements
            </h2>
            <div className="text-sm text-slate-400">Log and dispatch stand movements.</div>
          </div>
          <div className="ops-pill rounded-xl px-3 py-1.5 text-sm text-slate-300">
            {currentUserHistoryLength} records
          </div>
        </div>
      </div>
      <MovementForm
        movementDate={movementDate}
        setMovementDate={setMovementDate}
        aircraft={aircraft}
        setAircraft={setAircraft}
        movementType={movementType}
        setMovementType={setMovementType}
        fromStand={fromStand}
        setFromStand={setFromStand}
        toStand={toStand}
        setToStand={setToStand}
        notes={notes}
        setNotes={setNotes}
        movementTypes={movementTypes}
        airportStands={airportStands}
        filteredAircraftOptions={filteredAircraftOptions}
        showAircraftSuggestions={showAircraftSuggestions}
        setShowAircraftSuggestions={setShowAircraftSuggestions}
        addLogEntry={handleAddLogEntry}
        successMessage={successMessage}
        clearSuccessMessage={clearSuccessMessage}
      />
    </div>
  );
}
