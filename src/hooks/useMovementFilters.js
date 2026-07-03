import { useState, useMemo } from "react";
import { getEntryCreatedAtTimestamp } from "../utils/movementTimestamps.js";

export const useMovementFilters = (currentUserHistory) => {
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const filteredHistory = useMemo(() => {
    return currentUserHistory.filter((entry) => {
      const searchable = `
        ${entry.aircraft}
        ${entry.fromStand}
        ${entry.toStand}
        ${entry.notes}
        ${entry.date}
        ${entry.time}
      `.toLowerCase();
      return searchable.includes(searchTerm.toLowerCase());
    });
  }, [currentUserHistory, searchTerm]);

  const typeFilteredHistory = useMemo(() => {
    let filtered = filteredHistory;
    
    if (activeTab !== "ALL") {
      filtered = filtered.filter(entry => {
        const aircraftType = entry.aircraft.split(' - ')[1];
        return aircraftType === activeTab;
      });
    }
    
    return [...filtered].sort((left, right) => {
      const leftTimestamp = getEntryCreatedAtTimestamp(left) || 0;
      const rightTimestamp = getEntryCreatedAtTimestamp(right) || 0;
      return rightTimestamp - leftTimestamp;
    });
  }, [activeTab, filteredHistory]);

  const totalPages = Math.max(1, Math.ceil(typeFilteredHistory.length / recordsPerPage));
  const paginatedHistory = typeFilteredHistory.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  // Reset page when filters change
  const resetPage = () => setCurrentPage(1);

  return {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    filteredHistory,
    typeFilteredHistory,
    paginatedHistory,
    totalPages,
    resetPage,
  };
};
