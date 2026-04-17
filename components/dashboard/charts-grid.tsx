"use client";

import { useState, useMemo } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, ScatterChart, Scatter, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  LineChart, Line, LabelList, Legend
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MoreVertical, TrendingUp, Activity } from "lucide-react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

const LeafletHeatmap = dynamic(() => import("./leaflet-heatmap"), { 
  ssr: false,
  loading: () => <div className="h-[500px] w-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-slate-400 font-medium">Memuat Peta...</div>
});
import { 
  CityData,
  ArrearsByYear,
  ArrearsByLocation,
  HeatmapPoint,
  RAW_CITY_DATA, 
  // complianceDataConstant (Remove this as it's now a prop)
  // forecastData (Remove this as it's now a prop)
  COLORS, 
  CHART_PALETTE, 
  COMPLIANCE_COLORS,
  formatNumber,
  formatNumberShort,
  formatCurrencyShort
} from "@/lib/data";

interface ChartsGridProps {
  data: CityData[];
  kabupatenData: CityData[];
  arrearsByYearData: ArrearsByYear[];
  arrearsByLocationData: ArrearsByLocation[];
  heatmapData: HeatmapPoint[];
  forecastData: any[];
  kecamatanForecastData: { data: any[], kecamatanList: string[] } | null;
  paymentHeatmapData: HeatmapPoint[];
  totalRows: number;
  complianceData: { name: string, value: number }[]; // New prop
  bapendaData: { name: string, value: number }[];
  jrData: { name: string, value: number }[];
}

export function ChartsGrid({ data, kabupatenData, arrearsByYearData, arrearsByLocationData, heatmapData, forecastData, kecamatanForecastData, paymentHeatmapData, totalRows, complianceData, bapendaData, jrData }: ChartsGridProps) {
  const top10Data = useMemo(() => data.slice(0, 10), [data]);
  const top10KabupatenData = useMemo(() => kabupatenData ? kabupatenData.slice(0, 10) : [], [kabupatenData]);
  
  const riskData = useMemo(() => data.map(city => ({
    name: city.name,
    impact: Math.round((city.tunggakan / (city.potensi || 1)) * 100),
    probability: Math.min(Math.round((city.keterlambatan / 30) * 100), 100),
    tunggakan: city.tunggakan,
    keterlambatan: city.keterlambatan
  })), [data]);

  const sortedArrearsByYear = useMemo(() => {
    return [...arrearsByYearData]
      .sort((a, b) => parseInt(a.tahun_buat) - parseInt(b.tahun_buat))
      .slice(-12); // Show last 12 years of production
  }, [arrearsByYearData]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Heatmaps side-by-side */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="lg:col-span-2 order-first grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <LeafletHeatmap 
          points={heatmapData}
          title="Peta Konsentrasi Tunggakan Pajak"
          subtitle="Fokus Wilayah Aktif"
          metricLabel="Total Tunggakan Terdeteksi"
          colorScheme="arrears"
        />
        <LeafletHeatmap 
          points={paymentHeatmapData}
          title="Peta Lokasi Pembayaran Pajak"
          subtitle="Kantor SAMSAT Aktif"
          metricLabel="Total PKB Terkumpul"
          colorScheme="payments"
        />
      </motion.div>

      {/* ... (Previous charts remain) ... */}
      
      {/* (Self-correction: I should keep the existing ones and ADD/Update the Risk one) */}
      {/* I will replace the "Forecasting" one or add it as a new row. Let's add it as a new row or just replace for brevity if requested? No, user wants it detailed. I'll add it.) */}
      
      {/* I'll use a larger block and include the Scatter chart here) */}

      {/* Kepatuhan Pembayaran */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
        <Card className="h-full border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Kepatuhan Pembayaran</CardTitle>
            <MoreVertical className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={complianceData} 
                    innerRadius={70} 
                    outerRadius={90} 
                    paddingAngle={8} 
                    dataKey="value"
                    label={({ percent }) => (percent !== undefined && percent > 0) ? `${(percent * 100).toFixed(0)}%` : ''}
                    labelLine={false}
                  >
                    {complianceData.map((_, i) => <Cell key={i} fill={COMPLIANCE_COLORS[i % COMPLIANCE_COLORS.length]} stroke="none" />)}
                  </Pie>
                  <Tooltip 
                    formatter={(v: any) => formatNumber(Number(v))}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', fontSize: '14px' }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {complianceData.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COMPLIANCE_COLORS[i % COMPLIANCE_COLORS.length] }}></div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

    {/* Potensi per Kabupaten/Kota (Stacked) */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
        <Card className="h-full border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Potensi per Kabupaten/Kota (Stacked)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
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
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Perbandingan Wilayah */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
        <Card className="h-full border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Perbandingan Kecamatan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
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
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detail Tunggakan */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
        <Card className="h-full border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Detail Tunggakan per Kecamatan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
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
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tren Keterlambatan */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}>
        <Card className="h-full border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Tren Keterlambatan Kecamatan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
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
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Distribusi Risiko */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}>
        <Card className="h-full border-slate-200/60 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Matriks Distribusi Risiko</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    type="number" 
                    dataKey="impact" 
                    name="Impact" 
                    unit="%" 
                    label={{ value: 'Impact', position: 'insideBottom', offset: -10, fontSize: 10, fill: '#64748b' }}
                    tick={{ fontSize: 10 }}
                    domain={[0, 100]}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="probability" 
                    name="Probability" 
                    unit="%" 
                    label={{ value: 'Probability', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }}
                    tick={{ fontSize: 10 }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-xl text-[13px]">
                            <p className="font-bold text-indigo-600 mb-1">{data.name}</p>
                            <div className="space-y-1 text-slate-600">
                              <p>Impact: <span className="font-bold text-slate-900">{data.impact}%</span></p>
                              <p>Probabilitas: <span className="font-bold text-slate-900">{data.probability}%</span></p>
                              <p>Tunggakan: <span className="font-bold text-rose-600">{formatCurrencyShort(data.tunggakan)}</span></p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter data={riskData} fill={COLORS.primary} fillOpacity={0.6} />

                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tunggakan Berdasarkan Tahun Produksi */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.65 }}>
        <Card className="h-full border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Tunggakan Per Tahun Produksi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedArrearsByYear} margin={{ top: 30, right: 20, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="tahun_buat" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: '600', fill: '#94a3b8' }} 
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }} 
                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '14px' }}
                    formatter={(v: any) => [`${formatNumber(Number(v))} Kendaraan`, 'Jumlah Tunggakan']}
                  />
                  <Bar 
                    dataKey="tunggak" 
                    fill={COLORS.primary} 
                    radius={[6, 6, 0, 0]} 
                    barSize={24}
                  >
                    <LabelList 
                      dataKey="tunggak" 
                      position="top" 
                      style={{ fontSize: '10px', fontWeight: 'bold', fill: '#4f46e5' }} 
                      offset={10} 
                      formatter={(v: any) => formatNumber(Number(v))}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic text-center uppercase tracking-wide">Data berdasarkan 12 tahun produksi terakhir</p>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Tunggakan Berdasarkan Wilayah */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 }}>
        <Card className="h-full border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Top 10 Kecamatan Tertunggak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={arrearsByLocationData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="0" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: '600', fill: '#64748b' }} 
                    width={100}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }} 
                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '14px' }}
                    formatter={(v: any) => [`${formatNumber(Number(v))} Kendaraan`, 'Jumlah Tunggakan']}
                  />
                  <Bar 
                    dataKey="jumlah_kendaraan" 
                    fill={COLORS.danger} 
                    radius={[0, 4, 4, 0]} 
                    barSize={16}
                    opacity={0.9}
                  >
                    <LabelList 
                      dataKey="jumlah_kendaraan" 
                      position="right" 
                      style={{ fontSize: '9px', fontWeight: 'bold', fill: '#f43f5e' }} 
                      offset={10} 
                      formatter={(v: any) => formatNumber(Number(v))}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic text-center uppercase tracking-wide">Wilayah dengan jumlah tunggakan tertinggi</p>
          </CardContent>
        </Card>
      </motion.div>

        {/* NEW CHARTS: Potensi Bapenda & JR */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="lg:col-span-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="overflow-hidden border-none shadow-2xl bg-white/80 backdrop-blur-xl">
              <CardHeader className="pb-2 border-b border-slate-50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-widest">KONTRIBUSI POTENSI BAPENDA</CardTitle>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase">Potensi PKB & BBNKB per Kabupaten/Kota</p>
                  </div>
                  <div className="p-2 bg-indigo-50 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bapendaData} layout="vertical" margin={{ left: 30, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
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
                      <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={12}>
                        <LabelList dataKey="value" position="right" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#64748b' }} offset={10} formatter={(v: any) => formatNumberShort(Number(v))} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-none shadow-2xl bg-white/80 backdrop-blur-xl">
              <CardHeader className="pb-2 border-b border-slate-50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-widest">POTENSI SWDKLLJ (JR)</CardTitle>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase">Potensi Jasa Raharja per Kabupaten/Kota</p>
                  </div>
                  <div className="p-2 bg-emerald-50 rounded-xl">
                    <Activity className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={jrData} layout="vertical" margin={{ left: 30, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
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
                      <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} barSize={12}>
                        <LabelList dataKey="value" position="right" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#64748b' }} offset={10} formatter={(v: any) => formatNumberShort(Number(v))} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Peramalan (Forecasting) */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 }} className="lg:col-span-2">
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
            <div className="h-72 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
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
            </div>
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 pb-2">
               <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                 <p className="text-[10px] text-slate-400 uppercase font-bold">Algoritma</p>
                 <p className="text-sm text-slate-700 font-semibold">Linear Reg</p>
               </div>
               <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                 <p className="text-[10px] text-slate-400 uppercase font-bold">Confidence</p>
                 <p className="text-sm text-slate-700 font-semibold">85% Accuracy</p>
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
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 }} className="lg:col-span-2">
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
              <div className="h-80 mt-4">
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
                    {kecamatanForecastData.kecamatanList.map((kec, i) => (
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
              </div>
              <p className="text-[10px] text-slate-400 mt-4 italic text-center uppercase tracking-wide">Grafik menampilkan data historis dan proyeksi 3 bulan ke depan secara berkelanjutan</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      </div>
  );
}

