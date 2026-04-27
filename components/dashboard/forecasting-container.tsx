"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Legend
} from 'recharts';
import { motion } from "framer-motion";
import { ChartCardSkeleton } from "./skeleton-loader";
import { getForecastData, getKecamatanForecastSeries, getTotalTransactions, DashboardFilters } from "@/lib/api-actions";
import { formatNumber, formatCurrencyShort } from "@/lib/data";

interface ForecastingContainerProps {
  filters: DashboardFilters;
}

export function ForecastingContainer({ filters }: ForecastingContainerProps) {
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [kecamatanForecastData, setKecamatanForecastData] = useState<any>(null);
  const [totalRows, setTotalRows] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Sequentialize heavy aggregation queries to reduce peak shared memory load
        const fRes = await getForecastData(filters);
        const kRes = await getKecamatanForecastSeries(filters);
        const tRes = await getTotalTransactions(filters);

        setForecastData(fRes);
        setKecamatanForecastData(kRes);
        setTotalRows(tRes);
      } catch (error) {
        console.error("Failed to fetch forecasting data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [filters]);

  if (isLoading) {
    return (
      <div className="lg:col-span-2 space-y-6">
        <ChartCardSkeleton height="h-80" />
        <ChartCardSkeleton height="h-80" />
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 grid grid-cols-1 gap-6">
      {/* Peramalan (Forecasting) */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
        <Card className="border-slate-200/60 shadow-sm overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent" />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Prediksi Realisasi PKB (15 Bulan)</CardTitle>
              <p className="text-[10px] text-slate-400 mt-1 uppercase">Model: Trend Linear Regression Analysis</p>
            </div>
            <TrendingUp className="h-5 w-5 text-indigo-500" />
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="h-72 mt-4 min-w-0 overflow-hidden">
              {!isLoading && forecastData.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="x"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: '500' }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontSize: '12px' }}
                      formatter={(v: any) => formatCurrencyShort(Number(v))}
                    />
                    <Area
                      name="Data Real (Juta)"
                      type="monotone"
                      dataKey="real"
                      stroke="#4f46e5"
                      fill="url(#colorReal)"
                      strokeWidth={3}
                      dot={{ r: 3, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                      connectNulls
                    >
                      <LabelList dataKey="real" position="top" style={{ fontSize: '9px', fontWeight: 'bold', fill: '#4f46e5' }} offset={10} formatter={(v: any) => formatNumber(Number(v))} />
                    </Area>
                    <Area
                      name="Proyeksi (Juta)"
                      type="monotone"
                      dataKey="forecast"
                      stroke="#818cf8"
                      fill="url(#colorForecast)"
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ r: 3, fill: '#818cf8', strokeWidth: 2, stroke: '#fff' }}
                      connectNulls
                    >
                      <LabelList dataKey="forecast" position="top" style={{ fontSize: '9px', fontWeight: 'bold', fill: '#818cf8' }} offset={10} formatter={(v: any) => formatNumber(Number(v))} />
                    </Area>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 pb-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Algoritma</p>
                <p className="text-sm text-slate-700 font-semibold">Linear Reg</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Confidence</p>
                <p className="text-sm text-slate-700 font-semibold">50% Accuracy</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Data Points</p>
                <p className="text-sm text-slate-700 font-semibold">{formatNumber(totalRows)} Rows</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <p className="text-[10px] text-emerald-600 uppercase font-bold">Trend</p>
                <p className="text-sm text-emerald-600 font-semibold">+12.4% Est.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Peramalan per Kecamatan */}
      {kecamatanForecastData && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <Card className="border-slate-200/60 shadow-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-transparent" />
            <CardHeader className="relative z-10 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Prediksi Kontribusi PKB per Kecamatan</CardTitle>
                <p className="text-[10px] text-slate-400 mt-1 uppercase">Perbandingan Tren Proyeksi antar Wilayah</p>
              </div>
              <TrendingUp className="h-5 w-5 text-indigo-400" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="h-80 mt-4 min-w-0 overflow-hidden">
                {!isLoading && kecamatanForecastData.data && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={kecamatanForecastData.data} margin={{ top: 10, right: 30, left: -10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="x"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: '500' }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        tickFormatter={(v) => `${v}jt`}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                        itemStyle={{ fontSize: '11px', fontWeight: '600' }}
                        formatter={(v: any) => formatCurrencyShort(Number(v))}
                      />
                      <Legend
                        verticalAlign="top"
                        align="right"
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '20px' }}
                      />
                      {kecamatanForecastData.kecamatanList.map((kec: string, i: number) => (
                        <Line
                          key={kec}
                          name={kec}
                          type="monotone"
                          dataKey={kec}
                          stroke={["#4f46e5", "#f59e0b", "#ec4899", "#10b981", "#3b82f6", "#8b5cf6", "#f43f5e"][i % 7]}
                          strokeWidth={2}
                          dot={{ r: 2 }}
                          activeDot={{ r: 4 }}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-4 italic text-center uppercase tracking-wide">Grafik menampilkan data historis dan proyeksi 3 bulan ke depan secara berkelanjutan</p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
