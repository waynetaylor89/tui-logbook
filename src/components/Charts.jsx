import { useMemo } from "react";

const BAR_COLORS = {
  sky: "#38bdf8",
  blue: "#60a5fa",
  indigo: "#818cf8",
  purple: "#a78bfa",
  pink: "#f472b6",
};

const SimpleBarChart = ({ data, title, color = "sky" }) => {
  const maxValue = Math.max(...data.map(item => item.value), 1);
  const barColor = BAR_COLORS[color] || BAR_COLORS.sky;
  
  return (
    <div className="rounded-xl p-4 border border-cyan-900/60 bg-slate-950/65 shadow-[0_0_20px_rgba(6,182,212,0.08)]">
      <h3 className="text-sm font-medium text-cyan-100 mb-3">{title}</h3>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-24 text-xs text-slate-300 truncate" title={item.label}>
              {item.label}
            </div>
            <div className="flex-1 bg-slate-800 rounded-full h-4 relative overflow-hidden border border-cyan-900/40">
              <div 
                className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                style={{
                  backgroundColor: barColor,
                  boxShadow: `0 0 10px ${barColor}`,
                  width: `${(item.value / maxValue) * 100}%`,
                }}
              />
            </div>
            <div className="text-xs font-medium text-cyan-100 w-8 text-right">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SimplePieChart = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="rounded-xl p-4 border border-cyan-900/60 bg-slate-950/65 shadow-[0_0_20px_rgba(6,182,212,0.08)]">
      <h3 className="text-sm font-medium text-cyan-100 mb-3">{title}</h3>
      <div className="space-y-2">
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          const colors = ["sky", "blue", "indigo", "purple", "pink"];
          const color = colors[index % colors.length];
          const dotColor = BAR_COLORS[color] || BAR_COLORS.sky;
          
          return (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: dotColor }} />
              <div className="flex-1 text-xs text-slate-300">{item.label}</div>
              <div className="text-xs font-medium text-cyan-100">
                {item.value} ({percentage.toFixed(1)}%)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SimpleLineChart = ({ data, title }) => {
  const maxValue = Math.max(...data.map(item => item.value), 1);
  
  return (
    <div className="rounded-xl p-4 border border-cyan-900/60 bg-slate-950/65 shadow-[0_0_20px_rgba(6,182,212,0.08)]">
      <h3 className="text-sm font-medium text-cyan-100 mb-3">{title}</h3>
      <div className="h-24 flex items-end gap-1">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div 
              className="w-full rounded-t transition-all duration-500"
              style={{
                backgroundColor: BAR_COLORS.sky,
                boxShadow: "0 0 10px rgba(56, 189, 248, 0.55)",
                height: `${(item.value / maxValue) * 100}%`,
              }}
              title={`${item.label}: ${item.value}`}
            />
            <div className="text-xs text-slate-400 mt-1 truncate w-full text-center">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const MovementStatsChart = ({ stats }) => {
  const movementTypeData = useMemo(() => {
    const types = {};
    stats.topAircraft?.forEach(item => {
      const type = item[0].split(' - ')[1] || 'Unknown';
      types[type] = (types[type] || 0) + item[1];
    });
    return Object.entries(types).slice(0, 5).map(([type, count]) => ({
      label: type,
      value: count
    }));
  }, [stats.topAircraft]);

  const standData = useMemo(() => {
    return stats.topStands?.slice(0, 5).map(([stand, count]) => ({
      label: stand,
      value: count
    })) || [];
  }, [stats.topStands]);

  const userData = useMemo(() => {
    return stats.topUsers?.slice(0, 5).map(([user, count]) => ({
      label: user,
      value: count
    })) || [];
  }, [stats.topUsers]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <SimpleBarChart 
        data={movementTypeData} 
        title="Aircraft Types" 
        color="blue" 
      />
      <SimpleBarChart 
        data={standData} 
        title="Most Used Stands" 
        color="indigo" 
      />
      <SimpleBarChart 
        data={userData} 
        title="Top Users" 
        color="purple" 
      />
    </div>
  );
};

export const DailyTrendChart = ({ history, days = 7 }) => {
  const trendData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      
      const count = Object.values(history).flat().filter(
        entry => entry.date === dateStr
      ).length;
      
      data.push({
        label: date.toLocaleDateString('en', { weekday: 'short' }),
        value: count
      });
    }
    
    return data;
  }, [history, days]);

  return (
    <SimpleLineChart 
      data={trendData} 
      title={`Movement Trend (${days} days)`} 
    />
  );
};

export default {
  SimpleBarChart,
  SimplePieChart,
  SimpleLineChart,
  MovementStatsChart,
  DailyTrendChart
};
