import PropTypes from "prop-types";
import { memo } from "react";
import { AVIATION_COLORS } from "../config/logbookConfig.js";

const Header = memo(function Header({ fleetCount, currentUser, isAdmin, onLogout, darkMode }) {
  return (
    <div className={`rounded-2xl shadow-lg p-4 sm:p-5 border ${darkMode ? 'bg-slate-800/95 border-slate-700' : 'bg-white/95 border-slate-100'} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-1">Airport Operations Interface</div>
        <h1 className="text-2xl font-bold truncate" style={{ color: AVIATION_COLORS.primary }}>
          TUI Aircraft Logbook
        </h1>

        <div className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {fleetCount} aircraft loaded
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:justify-end">
        <div className={`text-sm font-medium rounded-full px-3 py-1 border ${darkMode ? 'text-slate-200 border-slate-600 bg-slate-700/60' : 'text-slate-700 border-slate-200 bg-slate-50'}`}>
          Operator: {currentUser} {isAdmin && "(Admin)"}
        </div>
        <div className={`text-sm font-medium rounded-full px-3 py-1 border ${darkMode ? 'text-slate-200 border-slate-600 bg-slate-700/60' : 'text-slate-700 border-slate-200 bg-slate-50'}`}>
          {new Date().toLocaleTimeString()}
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            className="text-white px-3 py-1 rounded hover:opacity-90 text-sm"
            style={{ backgroundColor: AVIATION_COLORS.danger }}
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
});

Header.propTypes = {
  fleetCount: PropTypes.number.isRequired,
  currentUser: PropTypes.string.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  onLogout: PropTypes.func,
  darkMode: PropTypes.bool,
};

export default Header;