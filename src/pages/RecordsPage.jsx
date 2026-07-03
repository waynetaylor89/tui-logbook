import { useState } from "react";
import RecordsPanel from "../components/RecordsPanel.jsx";
import { NoRecordsEmpty, NoResultsEmpty } from "../components/EmptyState.jsx";
import AdvancedSearch from "../components/AdvancedSearch.jsx";
import ExportOptions from "../components/ExportOptions.jsx";

const DEFAULT_DATE_TEXT = "01.01.2026";

const parseRecordDateValue = (dateValue, timeValue = "") => {
  const rawDate = String(dateValue || "").trim();
  const rawTime = String(timeValue || "").trim();
  const dateToUse = rawDate || DEFAULT_DATE_TEXT;

  let year;
  let month;
  let day;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateToUse)) {
    [year, month, day] = dateToUse.split("-").map(Number);
  } else {
    const dottedMatch = dateToUse.match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{2}|\d{4}))?$/);
    if (!dottedMatch) {
      return new Date(2026, 0, 1).getTime();
    }

    day = Number(dottedMatch[1]);
    month = Number(dottedMatch[2]);
    if (!dottedMatch[3]) {
      year = 2026;
    } else if (dottedMatch[3].length === 2) {
      year = 2000 + Number(dottedMatch[3]);
    } else {
      year = Number(dottedMatch[3]);
    }
  }

  const timeMatch = rawTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  const hours = timeMatch ? Number(timeMatch[1]) : 0;
  const minutes = timeMatch ? Number(timeMatch[2]) : 0;
  const seconds = timeMatch ? Number(timeMatch[3] || 0) : 0;

  return new Date(year, month - 1, day, hours, minutes, seconds).getTime();
};

export default function RecordsPage({
  currentUserHistoryLength,
  paginatedHistory,
  handleDeleteEntry,
  handleEditEntry,
  searchTerm,
  setSearchTerm,
  activeTab,
  setActiveTab,
  tuiAircraftTypes,
  totalPages,
  currentPage,
  setCurrentPage,
  typeFilteredHistory,
  exportLogbook,
  stats,
  history,
  fleet,
  onImportCsv,
}) {
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isAdvancedSearchActive, setIsAdvancedSearchActive] = useState(false);
  const [dateSortDirection, setDateSortDirection] = useState("desc");

  const handleAdvancedSearch = (results) => {
    setSearchResults(results);
    setIsAdvancedSearchActive(true);
    setCurrentPage(1);
  };

  const handleClearAdvancedSearch = () => {
    setSearchResults([]);
    setIsAdvancedSearchActive(false);
    setSearchTerm("");
  };

  const baseHistory = isAdvancedSearchActive ? searchResults : typeFilteredHistory;
  const sortedHistory = [...baseHistory].sort((left, right) => {
    const leftTime = parseRecordDateValue(left.date, left.time);
    const rightTime = parseRecordDateValue(right.date, right.time);
    return dateSortDirection === "asc" ? leftTime - rightTime : rightTime - leftTime;
  });

  const displayTotal = sortedHistory.length;
  const displayTotalPages = Math.max(1, Math.ceil(displayTotal / 10));
  const displayHistory = sortedHistory.slice((currentPage - 1) * 10, currentPage * 10);

  return (
    <div className="space-y-4">
      <div className="ops-panel rounded-2xl p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-semibold text-slate-100 flex items-center gap-2">
              Movement Records
            </h2>
            <div className="text-sm text-slate-400">Review and update all logged stand movements.</div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className="rounded-xl border border-sky-400/40 bg-sky-500/15 px-3 py-1 text-sm text-sky-200 hover:bg-sky-500/25"
            >
              {showAdvancedSearch ? 'Hide' : 'Show'} Advanced Search
            </button>
            <div className="ops-pill rounded-xl px-3 py-1.5 text-sm text-slate-300">
              {displayTotal} records total
              {isAdvancedSearchActive && ' (filtered)'}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Search Panel */}
      {showAdvancedSearch && (
        <AdvancedSearch
          history={history}
          fleet={fleet}
          onSearchResults={handleAdvancedSearch}
          onClearSearch={handleClearAdvancedSearch}
        />
      )}
      
      {/* Show empty state when no records */}
      {displayHistory.length === 0 ? (
        isAdvancedSearchActive ? (
          <NoResultsEmpty 
            searchTerm="Advanced Search"
            onClearSearch={handleClearAdvancedSearch}
          />
        ) : searchTerm ? (
          <NoResultsEmpty 
            searchTerm={searchTerm}
            onClearSearch={() => setSearchTerm("")}
          />
        ) : (
          <NoRecordsEmpty 
            onAddMovement={() => window.location.href = "/movements"}
          />
        )
      ) : (
        <RecordsPanel
          paginatedHistory={displayHistory}
          deleteEntry={handleDeleteEntry}
          editEntry={handleEditEntry}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tuiAircraftTypes={tuiAircraftTypes}
          totalPages={displayTotalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          dateSortDirection={dateSortDirection}
          setDateSortDirection={setDateSortDirection}
          typeFilteredHistory={typeFilteredHistory}
          exportLogbook={exportLogbook}
          stats={stats}
        />
      )}
      
      {/* Export Options */}
      <ExportOptions 
        data={displayHistory}
        title="Movement Records"
        onImportCsv={onImportCsv}
        onExportComplete={(type) => {
          console.log(`Export completed: ${type}`);
        }}
      />
    </div>
  );
}
