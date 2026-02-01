import { useMemo } from 'react';
import { TemporalHeatmapData } from '@/types/transaction';
import { cn } from '@/lib/utils';

interface TemporalHeatmapProps {
  data: TemporalHeatmapData[];
  className?: string;
}

export function TemporalHeatmap({ data, className }: TemporalHeatmapProps) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const maxIntensity = useMemo(() => {
    return Math.max(...data.map(d => d.intensity), 0.1);
  }, [data]);

  const getCell = (day: number, hour: number) => {
    return data.find(d => d.day === day && d.hour === hour);
  };

  const getColor = (intensity: number) => {
    const normalized = intensity / maxIntensity;
    if (normalized === 0) return 'bg-secondary/30';
    if (normalized < 0.25) return 'bg-cyan-900/50';
    if (normalized < 0.5) return 'bg-cyan-700/60';
    if (normalized < 0.75) return 'bg-cyan-500/70';
    return 'bg-cyan-400/90';
  };

  return (
    <div className={cn("glass-panel p-4 rounded-lg", className)}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-3 h-3 rounded-full bg-cyan-500" />
        <span className="text-sm font-medium text-foreground">Temporal Density Heatmap</span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[400px]">
          {/* Hour labels */}
          <div className="flex mb-1">
            <div className="w-10" /> {/* Spacer for day labels */}
            {hours.filter((_, i) => i % 4 === 0).map(hour => (
              <div 
                key={hour} 
                className="flex-1 text-[9px] text-muted-foreground text-center"
                style={{ minWidth: '12px' }}
              >
                {hour}:00
              </div>
            ))}
          </div>

          {/* Grid */}
          {days.map((day, dayIdx) => (
            <div key={day} className="flex items-center mb-0.5">
              <div className="w-10 text-[10px] text-muted-foreground pr-2 text-right">
                {day}
              </div>
              <div className="flex flex-1 gap-0.5">
                {hours.map(hour => {
                  const cell = getCell(dayIdx, hour);
                  return (
                    <div
                      key={`${day}-${hour}`}
                      className={cn(
                        "flex-1 h-3 rounded-[2px] transition-all hover:ring-1 hover:ring-primary/50",
                        getColor(cell?.intensity || 0)
                      )}
                      title={`${day} ${hour}:00 - ${cell?.txCount || 0} transactions`}
                      style={{ minWidth: '8px' }}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="flex items-center justify-end mt-3 gap-2">
            <span className="text-[9px] text-muted-foreground">Less</span>
            <div className="flex gap-0.5">
              <div className="w-3 h-3 rounded-[2px] bg-secondary/30" />
              <div className="w-3 h-3 rounded-[2px] bg-cyan-900/50" />
              <div className="w-3 h-3 rounded-[2px] bg-cyan-700/60" />
              <div className="w-3 h-3 rounded-[2px] bg-cyan-500/70" />
              <div className="w-3 h-3 rounded-[2px] bg-cyan-400/90" />
            </div>
            <span className="text-[9px] text-muted-foreground">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
