"use client";

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CityData, formatNumber } from "@/lib/data";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeatmapChartProps {
  data: CityData[];
}

export function HeatmapChart({ data }: HeatmapChartProps) {
  const metrics = [
    { key: 'potensi', label: 'Potensi', color: 'bg-indigo-600' },
    { key: 'pkb', label: 'Pokok PKB', color: 'bg-indigo-600' },
    { key: 'tunggakan', label: 'Tunggakan', color: 'bg-rose-600' },
    { key: 'keterlambatan', label: 'Keterlambatan', color: 'bg-amber-600' },
  ];

  const normalizedData = useMemo(() => {
    return data.map(city => {
      const cityMax = Math.max(...data.map(c => c.potensi));
      const tunggakanMax = Math.max(...data.map(c => c.tunggakan));
      const keterlambatanMax = Math.max(...data.map(c => c.keterlambatan));

      return {
        ...city,
        intensities: {
          potensi: (city.potensi / cityMax) * 100,
          pkb: (city.pkb / cityMax) * 100,
          tunggakan: (city.tunggakan / tunggakanMax) * 100,
          keterlambatan: (city.keterlambatan / keterlambatanMax) * 100,
        }
      };
    });
  }, [data]);

  return (
    <Card className="h-full border-slate-200/60 shadow-sm overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Heatmap Intensitas Kinerja</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mt-4">
          <div className="grid grid-cols-[120px_1fr] border-b border-slate-100 pb-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Samsat / Loket</div>
            <div className="grid grid-cols-4 gap-1 px-2">
              {metrics.map(m => (
                <div key={m.key} className="text-[9px] font-bold text-slate-400 uppercase text-center truncate px-1">
                  {m.label}
                </div>
              ))}
            </div>
          </div>
          
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {normalizedData.map((city, idx) => (
              <div key={city.name} className={`grid grid-cols-[120px_1fr] items-center p-1.5 hover:bg-slate-50 transition-colors ${idx !== normalizedData.length - 1 ? 'border-b border-slate-50' : ''}`}>
                <div className="text-[10px] font-bold text-slate-600 truncate uppercase pr-2">
                  {city.name}
                </div>
                <div className="grid grid-cols-4 gap-1 px-2">
                  <TooltipProvider>
                    {metrics.map(metric => {
                      const value = city[metric.key as keyof CityData];
                      const intensity = city.intensities[metric.key as keyof typeof city.intensities];
                      
                      return (
                        <Tooltip key={metric.key}>
                          <TooltipTrigger>
                            <div 
                              className={`h-8 rounded-sm transition-transform hover:scale-105 cursor-pointer ${metric.color}`}
                              style={{ 
                                opacity: Math.max(0.1, intensity / 100) 
                              }}
                            />
                          </TooltipTrigger>
                          <TooltipContent className="bg-slate-900 text-white border-0 py-2 px-3 shadow-2xl rounded-xl">
                            <div className="space-y-1">
                              <p className="text-[13px] uppercase font-bold text-slate-400">{city.name}</p>
                              <p className="text-[13px] font-bold">{metric.label}: <span className="text-indigo-400">{formatNumber(value as number)}</span></p>
                              <p className="text-[13px] text-slate-500 italic">Intensitas {Math.round(intensity)}% terhadap Max</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </TooltipProvider>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                 <div className="w-2 h-2 rounded-full bg-indigo-600 opacity-10" />
                 <span className="text-[9px] font-bold text-slate-400 uppercase">Low</span>
              </div>
              <div className="flex items-center gap-1.5">
                 <div className="w-2 h-2 rounded-full bg-indigo-600" />
                 <span className="text-[9px] font-bold text-slate-400 uppercase">High Intensity</span>
              </div>
           </div>
           <p className="text-[9px] text-slate-400 italic">Normalized per category</p>
        </div>
      </CardContent>
    </Card>
  );
}
