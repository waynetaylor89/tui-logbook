import { useEffect, useMemo, useState } from "react";
import FleetManager from "../components/FleetManager.jsx";
import { DailyTrendChart } from "../components/Charts.jsx";

export default function HomePage({
  isAdmin,
  userSummary,
  stats,
  history,
  lastEntryTimestamp,
  newReg,
  setNewReg,
  newType,
  setNewType,
  tuiAircraftTypes,
  handleAddAircraftToFleet,
  handleResetFleet,
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const elapsed = useMemo(() => {
    if (!lastEntryTimestamp) return null;

    const totalSeconds = Math.max(0, Math.floor((now - lastEntryTimestamp) / 1000));
    const days = Math.floor(totalSeconds / 86400);

    return {
      days,
      lastEntryLabel: new Date(lastEntryTimestamp).toLocaleString(),
    };
  }, [lastEntryTimestamp, now]);

  return (
    <div className="space-y-5 relative">
      <div
        aria-label="update-test-overlay"
        className="fixed right-4 top-4 z-[1000] h-16 w-16 rounded-sm border-2 border-red-200 bg-red-600 shadow-[0_0_20px_rgba(220,38,38,0.7)]"
      />
      <section className="rounded-2xl border border-cyan-900/60 bg-slate-900/80 p-4 sm:p-5 shadow-lg space-y-4">
        <div className="rounded-xl border border-cyan-800/60 bg-slate-950/70 px-4 py-3">
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Countdown Since Last Entry Into System</div>
          {elapsed ? (
            <>
              <div className="mt-2 text-2xl sm:text-3xl font-bold text-cyan-100">
                {elapsed.days} day{elapsed.days === 1 ? "" : "s"}
              </div>
              <div className="mt-1 text-sm text-slate-300">Last entry: {elapsed.lastEntryLabel}</div>
            </>
          ) : (
            <div className="mt-2 text-sm text-slate-300">No entries found yet.</div>
          )}
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-sm text-slate-300">Visual insights from your data</div>
        </div>

        {isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DailyTrendChart history={history} days={7} />
            <DailyTrendChart history={history} days={30} />
          </div>
        )}
      </section>

      {isAdmin && userSummary.length > 0 && (
        <section className="bg-slate-900/80 rounded-2xl shadow-lg p-4 sm:p-5 border border-cyan-900/60">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-cyan-100">User Movement Summary</h3>
              <div className="text-sm text-slate-300">Ranked by total movements logged.</div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 font-medium text-slate-400">User</th>
                  <th className="px-4 py-3 font-medium text-slate-400">Movements</th>
                </tr>
              </thead>
              <tbody>
                {userSummary.map((row) => (
                  <tr key={row.username} className="border-t border-cyan-900/50">
                    <td className="px-4 py-3">{row.username}</td>
                    <td className="px-4 py-3 font-semibold text-cyan-100">{row.movements}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="grid lg:grid-cols-3 gap-4">
        <FleetManager
          newReg={newReg}
          setNewReg={setNewReg}
          newType={newType}
          setNewType={setNewType}
          tuiAircraftTypes={tuiAircraftTypes}
          addAircraftToFleet={handleAddAircraftToFleet}
          resetFleet={handleResetFleet}
        />
        <div className="hidden lg:block"></div>
      </section>
    </div>
  );
}
