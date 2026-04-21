"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList
} from 'recharts';
import { motion } from "framer-motion";
import { ChartCardSkeleton } from "./skeleton-loader";
import { getArrearsByProdYear, getArrearsByLocation, DashboardFilters } from "@/lib/api-actions";
import { COLORS, formatNumber } from "@/lib/data";

interface ArrearsTrendsContainerProps {
  filters: DashboardFilters;
}

export function ArrearsTrendsContainer({ filters }: ArrearsTrendsContainerProps) {
  const [arrearsByYearData, setArrearsByYearData] = useState<any[]>([]);
  const [arrearsByLocationData, setArrearsByLocationData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [yRes, lRes] = await Promise.all([
          getArrearsByProdYear(filters),
          getArrearsByLocation(filters)
        ]);
        setArrearsByYearData(yRes);
        setArrearsByLocationData(lRes);
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
                  <Bar dataKey="tunggak" fill={COLORS.primary} radius={[6, 6, 0, 0]} barSize={24}>
                    <LabelList dataKey="tunggak" position="top" style={{ fontSize: '10px', fontWeight: 'bold', fill: '#4f46e5' }} offset={10} formatter={(v: any) => formatNumber(Number(v))} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic text-center uppercase tracking-wide">Data berdasarkan 12 tahun produksi terakhir</p>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
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
                  <Bar dataKey="jumlah_kendaraan" fill={COLORS.danger} radius={[0, 4, 4, 0]} barSize={16} opacity={0.9}>
                    <LabelList dataKey="jumlah_kendaraan" position="right" style={{ fontSize: '9px', fontWeight: 'bold', fill: '#f43f5e' }} offset={10} formatter={(v: any) => formatNumber(Number(v))} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 italic text-center uppercase tracking-wide">Wilayah dengan jumlah tunggakan tertinggi</p>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
