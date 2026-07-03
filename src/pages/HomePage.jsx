import FleetManager from "../components/FleetManager.jsx";
import { MovementStatsChart, DailyTrendChart } from "../components/Charts.jsx";

export default function HomePage({
  isAdmin,
  userSummary,
  stats,
  history,
  newReg,
  setNewReg,
  newType,
  setNewType,
  tuiAircraftTypes,
  handleAddAircraftToFleet,
  handleResetFleet,
}) {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-cyan-900/60 bg-slate-900/80 p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-2xl font-bold text-cyan-100">Analytics Dashboard</h2>
            <div className="text-sm text-slate-300">Visual insights from your data</div>
          </div>

        <MovementStatsChart stats={stats} />

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
