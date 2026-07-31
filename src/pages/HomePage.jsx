import { useEffect, useMemo, useState } from "react";
import FleetManager from "../components/FleetManager.jsx";
import { DailyTrendChart } from "../components/Charts.jsx";
import { getAircraftTypeCountdowns } from "../utils/dateUtils.js";

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
  const [trainingState, setTrainingState] = useState({
    "787-800": false,
    "787-900": false,
  });

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const countdownSections = useMemo(() => {
    if (!lastEntryTimestamp) {
      return getAircraftTypeCountdowns(history, now);
    }

    return getAircraftTypeCountdowns(history, now);
  }, [history, lastEntryTimestamp, now]);

  const latestLabel = useMemo(() => {
    const latestEntry = countdownSections.find((section) => section.lastEntryLabel);
    return latestEntry?.lastEntryLabel || "No entries found yet.";
  }, [countdownSections]);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-cyan-900/60 bg-slate-900/80 p-4 sm:p-5 shadow-lg space-y-4">
        <div className="rounded-xl border border-cyan-800/60 bg-slate-950/70 px-4 py-3">
          <div className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">Countdown Since Last Entry Into System</div>
          {countdownSections.length > 0 ? (
            <>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {countdownSections.map((section) => {
                  const isTrainingSection = section.key === "737" || section.key === "787-800" || section.key === "787-900";
                  const isTrained = trainingState[section.key] || false;

                  return (
                    <div key={section.key} className="rounded-lg border border-cyan-800/50 bg-slate-900/70 p-3">
                      <div className="text-[10px] uppercase tracking-[0.25em] text-cyan-400/70">{section.label}</div>
                      <div className="mt-1 text-xl font-semibold text-cyan-100">
                        {section.days} {section.days === 1 ? "day" : "days"}
                      </div>
                      {section.isExpired && (
                        <div className="mt-2 inline-flex rounded-full border border-red-400/50 bg-red-500/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-300">
                          Expired
                        </div>
                      )}
                      {isTrainingSection && (
                        <div className={section.isExpired ? "mt-2 rounded-md border border-cyan-800/40 bg-slate-950/60 p-2" : "mt-3 rounded-md border border-cyan-800/40 bg-slate-950/60 p-2"}>
                          <div className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/70">
                            {section.key === "737"
                              ? section.isExpired
                                ? "Expired"
                                : "Active"
                              : section.isExpired
                                ? isTrained
                                  ? "Re-trained"
                                  : "Expired"
                                : isTrained
                                  ? "Trained"
                                  : "Not trained"}
                          </div>
                          <label className="mt-2 flex items-center gap-2 text-sm text-slate-300">
                            <input
                              type="checkbox"
                              checked={isTrained}
                              onChange={() =>
                                setTrainingState((current) => ({
                                  ...current,
                                  [section.key]: !current[section.key],
                                }))
                              }
                              className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
                            />
                            <span>{section.key === "737" ? "Retrained" : "Trained"}</span>
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 text-sm text-slate-300">Last entry: {latestLabel}</div>
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
