"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, AreaChart, Area, ScatterChart, Scatter
} from 'recharts';
import { motion } from "framer-motion";
import { ChartCardSkeleton } from "./skeleton-loader";
import { getCitySummary, getKabupatenSummary, getRiskTimeSeries, DashboardFilters } from "@/lib/api-actions";
import { COLORS, CHART_PALETTE, formatNumber, formatNumberShort, formatCurrencyShort } from "@/lib/data";

interface RegionalComparisonContainerProps {
  filters: DashboardFilters;
}

export function RegionalComparisonContainer({ filters }: RegionalComparisonContainerProps) {
  const [cityData, setCityData] = useState<any[]>([]);
  const [kabupatenData, setKabupatenData] = useState<any[]>([]);
  const [riskTrendData, setRiskTrendData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Sequentialize queries to prevent shared memory pressure
        const cRes = await getCitySummary(filters);
        const kRes = await getKabupatenSummary(filters);
        const rRes = await getRiskTimeSeries(filters);
        
        setCityData(cRes);
        setKabupatenData(kRes);
        setRiskTrendData(rRes);
      } catch (error) {
        console.error("Failed to fetch regional comparison data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [filters]);

  const top10Data = useMemo(() => cityData.slice(0, 10), [cityData]);
  const top10KabupatenData = useMemo(() => kabupatenData.slice(0, 10), [kabupatenData]);

  const riskData = useMemo(() => cityData.map(city => ({
    name: city.name,
    impact: Math.round((city.tunggakan / (city.potensi || 1)) * 100),
    probability: Math.min(Math.round((city.keterlambatan / 30) * 100), 100),
    tunggakan: city.tunggakan,
    keterlambatan: city.keterlambatan
  })), [cityData]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    );
  }

  return (
    <>
      {/* Potensi per Kabupaten/Kota (Stacked) */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
        <Card className="h-full border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Potensi per Kabupaten/Kota (Stacked)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 mt-4 min-w-0 overflow-hidden">
              {!isLoading && top10KabupatenData.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top10KabupatenData} margin={{ top: 40, right: 20, left: 10, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      interval={0} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fontWeight: '600', fill: '#94a3b8' }} 
                      angle={-45}
                      textAnchor="end"
                      dy={10} 
                    />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }} 
                      contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '14px' }}
                      formatter={(v: any) => formatCurrencyShort(Number(v))}
                    />
                    <Bar name="Pokok PKB" dataKey="pkb" stackId="a" fill={CHART_PALETTE[0]} barSize={24} />
                    <Bar name="Tunggakan" dataKey="tunggakan" stackId="a" fill={CHART_PALETTE[1]} radius={[4, 4, 0, 0]} barSize={24}>
                      <LabelList dataKey="potensi" position="top" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#64748b' }} offset={10} formatter={(v: any) => formatNumberShort(Number(v))} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Perbandingan Kecamatan */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
        <Card className="h-full border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Perbandingan Kecamatan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 mt-4 min-w-0 overflow-hidden">
              {!isLoading && top10Data.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top10Data} layout="vertical" margin={{ left: 40, right: 40, bottom: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      interval={0} 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: '600', fill: '#64748b' }} 
                      width={130} 
                    />
                    <Tooltip 
                      formatter={(v: any) => formatCurrencyShort(Number(v))} 
                      contentStyle={{ borderRadius: '10px', border: 'none', fontSize: '14px' }} 
                    />
                    <Bar dataKey="pkb" fill={COLORS.secondary} radius={[0, 6, 6, 0]} barSize={12}>
                      <LabelList dataKey="pkb" position="right" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#64748b' }} offset={10} formatter={(v: any) => formatNumberShort(Number(v))} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detail Tunggakan */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
        <Card className="h-full border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Detail Tunggakan per Kecamatan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 mt-4 min-w-0 overflow-hidden">
              {!isLoading && top10Data.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top10Data} margin={{ top: 40, right: 20, left: 10, bottom: 60 }}>
                    <XAxis 
                      dataKey="name" 
                      interval={0} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fontWeight: '600', fill: '#94a3b8' }} 
                      angle={-45}
                      textAnchor="end"
                      dy={10} 
                    />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }} 
                      formatter={(v: any) => formatCurrencyShort(Number(v))}
                      contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '14px' }}
                    />
                    <Bar dataKey="tunggakan" fill={COLORS.danger} radius={[6, 6, 0, 0]} barSize={24} opacity={0.8}>
                      <LabelList dataKey="tunggakan" position="top" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#f43f5e' }} offset={10} formatter={(v: any) => formatNumber(Number(v))} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tren Keterlambatan */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
        <Card className="h-full border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Tren Keterlambatan Kecamatan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 mt-4 min-w-0 overflow-hidden">
              {!isLoading && top10Data.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={top10Data} margin={{ top: 30, right: 20, left: 10, bottom: 60 }}>
                    <defs>
                      <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.warning} stopOpacity={0.1}/>
                        <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="name" 
                      interval={0} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fontWeight: '600', fill: '#94a3b8' }} 
                      angle={-45}
                      textAnchor="end"
                      dy={10} 
                    />
                    <Tooltip 
                      formatter={(v: any) => formatNumber(Number(v))}
                      contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '14px' }}
                    />
                    <Area type="monotone" dataKey="keterlambatan" stroke={COLORS.warning} fill="url(#colorAcc)" strokeWidth={4}>
                      <LabelList dataKey="keterlambatan" position="top" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#f59e0b' }} offset={10} formatter={(v: any) => formatNumber(Number(v))} />
                    </Area>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
        <Card className="h-full border-slate-200/60 shadow-sm overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-50/30 to-transparent" />
          <CardHeader className="relative z-10 flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Tren Risiko Nominal (Time Series)</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="h-64 mt-4 min-w-0 overflow-hidden">
              {!isLoading && riskTrendData.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={riskTrendData} margin={{ top: 20, right: 30, left: -20, bottom: 20 }}>
                    <defs>
                      <linearGradient id="colorRiskTrend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.danger} stopOpacity={0.15}/>
                        <stop offset="95%" stopColor={COLORS.danger} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="x" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: '500' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickFormatter={(v) => `${v}jt`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                      itemStyle={{ fontSize: '12px', color: COLORS.danger, fontWeight: 'bold' }}
                      formatter={(v: any) => formatCurrencyShort(Number(v))}
                    />
                    <Area 
                      name="Nominal Risiko"
                      type="monotone" 
                      dataKey="value" 
                      stroke={COLORS.danger} 
                      fill="url(#colorRiskTrend)" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: COLORS.danger, strokeWidth: 2, stroke: '#fff' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
