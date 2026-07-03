import { useState } from "react";

export default function RecordsPanel({
  paginatedHistory,
  deleteEntry,
  editEntry,
  searchTerm,
  setSearchTerm,
  activeTab,
  setActiveTab,
  tuiAircraftTypes,
  totalPages,
  currentPage,
  setCurrentPage,
  exportLogbook,
  stats,
}) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({
    aircraft: "",
    movementType: "",
    fromStand: "",
    toStand: "",
    date: "",
    time: "",
    notes: "",
  });

  const startEditing = (item) => {
    setEditingId(item.id);
    setDraft({
      aircraft: item.aircraft || "",
      movementType: item.movementType || "",
      fromStand: item.fromStand || "",
      toStand: item.toStand || "",
      date: item.date || "",
      time: item.time || "",
      notes: item.notes || "",
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEdit = (item) => {
    const ok = editEntry(item.id, {
      aircraft: draft.aircraft.trim(),
      movementType: draft.movementType.trim(),
      fromStand: draft.fromStand.trim().toUpperCase(),
      toStand: draft.toStand.trim().toUpperCase(),
      date: draft.date.trim(),
      time: draft.time.trim(),
      notes: draft.notes.trim(),
    });
    if (ok) setEditingId(null);
  };

  return (
    <div className="ops-panel rounded-2xl p-4">

      <div className="flex flex-col gap-4 mb-4">

  <div className="flex justify-between items-center flex-wrap gap-3">
  <h2 className="text-2xl font-semibold text-slate-100">
    Movement Records
  </h2>
  <button
    onClick={exportLogbook}
    className="rounded-xl border border-emerald-400/50 bg-emerald-500/20 px-4 py-2 font-semibold text-emerald-200"
  >
    Export CSV
  </button>
</div>

        {/* Aircraft Type Tabs */}
        <div className="flex gap-2 flex-wrap">

          <button
            onClick={() => {
              setActiveTab("ALL");
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl font-semibold ${
              activeTab === "ALL"
                ? "bg-sky-500/20 text-sky-100 border border-sky-400/50"
                : "border border-slate-700 bg-slate-900/50 text-slate-300"
            }`}
          >
            All
          </button>

          {tuiAircraftTypes.map((type) => (
            <button
              key={type}
              onClick={() => {
                setActiveTab(type);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl font-semibold ${
                activeTab === type
                  ? "bg-sky-500/20 text-sky-100 border border-sky-400/50"
                  : "border border-slate-700 bg-slate-900/50 text-slate-300"
              }`}
            >
              {type}
            </button>
          ))}

        </div>

        {/* Search */}
        <input
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search records..."
          className="w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-slate-100 placeholder:text-slate-500"
        />

      </div>

      {/* Records */}
      <div className="space-y-3 max-h-[700px] overflow-y-auto">

        {paginatedHistory.length === 0 && (
          <div className="py-10 text-center text-slate-500">
            No movement records found.
          </div>
        )}

        {paginatedHistory.map((item) => {
          const editedLabel =
            item.updatedAt && item.updatedBy
              ? `Edited by ${item.updatedBy} on ${new Date(item.updatedAt).toLocaleString()}`
              : null;

          return (
            <div
              key={item.id}
              className="rounded-xl border border-slate-700 bg-slate-900/50 p-4"
            >

              <div className="grid grid-cols-[minmax(0,1fr)_minmax(180px,280px)_auto] items-start gap-4">

                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-100">
                    {item.aircraft}
                  </div>

                  <div className="mt-1 text-sm font-medium text-sky-300">
                    {item.movementType}
                  </div>
                </div>

                <div className="flex min-h-[52px] items-center justify-center pt-1 text-center text-sm text-slate-300">
                  {(item.date || item.time) ? (
                    <div className="rounded-lg border border-slate-700/80 bg-slate-950/60 px-4 py-2 leading-tight">
                      <div>{item.date || ""}</div>
                      {item.time && <div className="text-xs text-slate-400">{item.time}</div>}
                    </div>
                  ) : null}
                </div>

                <div className="min-w-[96px] text-right">
                  <div className="text-sm text-slate-400">
                    Stand Move
                  </div>

                  <div className="font-semibold text-slate-200">
                    {item.fromStand} → {item.toStand}
                  </div>
                </div>

              </div>

              {item.notes && (
                <div className="mt-3 rounded-lg border border-slate-700 bg-slate-950/70 p-3 text-sm text-slate-300">
                  {item.notes}
                </div>
              )}

              {item.createdBy && (
                <div className="mt-3 text-sm text-slate-400">
                  Logged by: {item.createdBy}
                </div>
              )}

              {editedLabel && (
                <div className="mt-1 inline-block rounded bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-200">
                  {editedLabel}
                </div>
              )}

              {editingId === item.id ? (
                <div className="mt-3 space-y-2">
                  <input
                    value={draft.aircraft}
                    onChange={(e) => setDraft((prev) => ({ ...prev, aircraft: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                    placeholder="Aircraft"
                  />
                  <input
                    value={draft.movementType}
                    onChange={(e) => setDraft((prev) => ({ ...prev, movementType: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                    placeholder="Movement type"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={draft.fromStand}
                      onChange={(e) => setDraft((prev) => ({ ...prev, fromStand: e.target.value }))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                      placeholder="From stand"
                    />
                    <input
                      value={draft.toStand}
                      onChange={(e) => setDraft((prev) => ({ ...prev, toStand: e.target.value }))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                      placeholder="To stand"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={draft.date}
                      onChange={(e) => setDraft((prev) => ({ ...prev, date: e.target.value }))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                      placeholder="Date"
                    />
                    <input
                      value={draft.time}
                      onChange={(e) => setDraft((prev) => ({ ...prev, time: e.target.value }))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                      placeholder="Time"
                    />
                  </div>
                  <textarea
                    value={draft.notes}
                    onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))}
                    className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
                    rows={2}
                    placeholder="Notes"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => saveEdit(item)}
                      className="rounded-lg bg-sky-600 py-2 font-semibold text-white"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="rounded-lg bg-slate-700 py-2 font-semibold text-slate-100"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => startEditing(item)}
                    className="rounded-lg bg-amber-500 py-2 font-semibold text-slate-950"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteEntry(item.id)}
                    className="rounded-lg bg-rose-600 py-2 font-semibold text-white"
                  >
                    Delete
                  </button>
                </div>
              )}

            </div>
          );
        })}

      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-4 flex-wrap">

        <button
          onClick={() =>
            setCurrentPage((prev) =>
              Math.max(prev - 1, 1)
            )
          }
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-slate-200"
        >
          Previous
        </button>

        {Array.from(
          { length: totalPages },
          (_, i) => i + 1
        ).map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-4 py-2 rounded-xl font-semibold ${
              currentPage === page
                ? "bg-sky-500/20 text-sky-100 border border-sky-400/50"
                : "bg-slate-900 border border-slate-700 text-slate-200"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() =>
            setCurrentPage((prev) =>
              Math.min(prev + 1, totalPages)
            )
          }
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-slate-200"
        >
          Next
        </button>

      </div>

    </div>
  );
}