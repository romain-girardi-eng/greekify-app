import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface HeatmapProps {
  data: { date: string; count: number }[];
  weeks?: number;
}

export function Heatmap({ data, weeks = 20 }: HeatmapProps) {
  const { grid, maxCount, months } = useMemo(() => {
    const today = new Date();
    const totalDays = weeks * 7;
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - totalDays + 1);

    // Adjust to start from Sunday
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    // Create data map for quick lookup
    const dataMap = new Map(data.map((d) => [d.date, d.count]));

    // Build grid
    const grid: { date: string; count: number; dayOfWeek: number }[][] = [];
    const months: { label: string; weekIndex: number }[] = [];
    let currentDate = new Date(startDate);
    let currentWeek: { date: string; count: number; dayOfWeek: number }[] = [];
    let lastMonth = -1;
    let maxCount = 0;

    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const count = dataMap.get(dateStr) || 0;
      const dayOfWeek = currentDate.getDay();
      const month = currentDate.getMonth();

      if (month !== lastMonth && currentWeek.length === 0) {
        months.push({
          label: currentDate.toLocaleDateString('fr-FR', { month: 'short' }),
          weekIndex: grid.length,
        });
        lastMonth = month;
      }

      if (count > maxCount) maxCount = count;

      currentWeek.push({ date: dateStr, count, dayOfWeek });

      if (dayOfWeek === 6) {
        // Saturday - end of week
        grid.push(currentWeek);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Push remaining days
    if (currentWeek.length > 0) {
      grid.push(currentWeek);
    }

    return { grid, maxCount, months };
  }, [data, weeks]);

  const getColor = (count: number): string => {
    if (count === 0) return 'bg-white/[0.04]';
    const intensity = Math.min(count / Math.max(maxCount, 1), 1);
    if (intensity < 0.25) return 'bg-emerald-900/60';
    if (intensity < 0.5) return 'bg-emerald-700/70';
    if (intensity < 0.75) return 'bg-emerald-500/80';
    return 'bg-emerald-400';
  };

  const dayLabels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  return (
    <div className="space-y-2">
      {/* Month labels */}
      <div className="flex text-xs text-slate-500 ml-6">
        {months.map((month, i) => (
          <span
            key={i}
            className="flex-shrink-0"
            style={{
              marginLeft: i === 0 ? 0 : `${(month.weekIndex - (months[i - 1]?.weekIndex || 0)) * 14 - 20}px`,
            }}
          >
            {month.label}
          </span>
        ))}
      </div>

      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] text-[10px] text-slate-500 pr-1">
          {dayLabels.map((day, i) => (
            <div key={i} className="h-[12px] flex items-center">
              {i % 2 === 1 ? day : ''}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-[3px] overflow-x-auto">
          {grid.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                const day = week.find((d) => d.dayOfWeek === dayOfWeek);
                if (!day) {
                  return (
                    <div
                      key={dayOfWeek}
                      className="w-[12px] h-[12px] rounded-sm bg-transparent"
                    />
                  );
                }
                return (
                  <motion.div
                    key={day.date}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: weekIndex * 0.01 }}
                    className={`w-[12px] h-[12px] rounded-sm ${getColor(day.count)} cursor-pointer transition-all hover:ring-1 hover:ring-white/30`}
                    title={`${day.date}: ${day.count} cartes`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 text-xs text-slate-500">
        <span>Moins</span>
        <div className="flex gap-[2px]">
          <div className="w-[10px] h-[10px] rounded-sm bg-white/[0.04]" />
          <div className="w-[10px] h-[10px] rounded-sm bg-emerald-900/60" />
          <div className="w-[10px] h-[10px] rounded-sm bg-emerald-700/70" />
          <div className="w-[10px] h-[10px] rounded-sm bg-emerald-500/80" />
          <div className="w-[10px] h-[10px] rounded-sm bg-emerald-400" />
        </div>
        <span>Plus</span>
      </div>
    </div>
  );
}
