"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList, Cell
} from 'recharts';
import { motion } from "framer-motion";
import { ChartCardSkeleton } from "./skeleton-loader";
import { getArrearsByProdYear, getArrearsByLocation, getArrearsDaysDistribution, DashboardFilters } from "@/lib/api-actions";
import { COLORS, formatNumber, ArrearsDaysDist } from "@/lib/data";

interface ArrearsTrendsContainerProps {
  filters: DashboardFilters;
}

export function ArrearsTrendsContainer({ filters }: ArrearsTrendsContainerProps) {
  const [arrearsByYearData, setArrearsByYearData] = useState<any[]>([]);
  const [arrearsDaysDist, setArrearsDaysDist] = useState<ArrearsDaysDist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Sequentialize queries to prevent shared memory pressure
        const yRes = await getArrearsByProdYear(filters);
        const dRes = await getArrearsDaysDistribution(filters);
        
        setArrearsByYearData(yRes);
        setArrearsDaysDist(dRes);
      } catch (error) {
        console.error("Failed to fetch arrears trends data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [filters]);

  const sortedArrearsByYear = useMemo(() => {
    return [...arrearsByYearData]
      .sort((a, b) => parseInt(a.tahun_buat) - parseInt(b.tahun_buat))
      .slice(-12);
  }, [arrearsByYearData]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    );
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
        <Card className="h-full border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Tunggakan Per Tahun Produksi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 mt-4 min-w-0 overflow-hidden">
              {!isLoading && sortedArrearsByYear.length > 0 && (
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
                    <Bar dataKey="tunggak" fill={COLORS.primary} radius={[6, 6, 0, 0]} barSize={24}>
                      <LabelList dataKey="tunggak" position="top" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#4f46e5' }} offset={10} formatter={(v: any) => formatNumber(Number(v))} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic text-center uppercase tracking-wide">Data berdasarkan 12 tahun produksi terakhir</p>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
        <Card className="h-full border-slate-200/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Analisis Ketepatan Waktu & Tunggakan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 mt-4 min-w-0 overflow-hidden">
              {!isLoading && arrearsDaysDist.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={arrearsDaysDist} margin={{ top: 20, right: 30, left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="0" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fontWeight: '600', fill: '#64748b' }} 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }} 
                      contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px' }}
                      formatter={(v: any) => [`${formatNumber(Number(v))} Kendaraan`, 'Jumlah']}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={24}>
                      {arrearsDaysDist.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.sort_order <= 4 ? '#10b981' : COLORS.danger} 
                        />
                      ))}
                      <LabelList dataKey="value" position="top" style={{ fontSize: '9px', fontWeight: 'bold', fill: '#64748b' }} offset={10} formatter={(v: any) => formatNumber(Number(v))} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic text-center uppercase tracking-wide">Distribusi berdasarkan hari tunggakan (negatif = awal, positif = tahun terlambat)</p>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
