import { useState } from "react";
import RecordsPanel from "../components/RecordsPanel.jsx";
import { NoRecordsEmpty, NoResultsEmpty } from "../components/EmptyState.jsx";
import AdvancedSearch from "../components/AdvancedSearch.jsx";
import ExportOptions from "../components/ExportOptions.jsx";

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

  const displayHistory = isAdvancedSearchActive ? searchResults : paginatedHistory;
  const displayTotal = isAdvancedSearchActive ? searchResults.length : currentUserHistoryLength;

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
          totalPages={Math.ceil(displayHistory.length / 10)}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
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
