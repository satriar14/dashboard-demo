"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Activity } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList 
} from 'recharts';
import { motion } from "framer-motion";
import { ChartCardSkeleton } from "./skeleton-loader";
import { getBapendaSummary, getJRSummary, DashboardFilters } from "@/lib/api-actions";
import { formatNumberShort, formatCurrencyShort } from "@/lib/data";

interface RegionalSummaryContainerProps {
  filters: DashboardFilters;
}

export function RegionalSummaryContainer({ filters }: RegionalSummaryContainerProps) {
  const [bapendaData, setBapendaData] = useState<any[]>([]);
  const [jrData, setJRData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [bRes, jRes] = await Promise.all([
          getBapendaSummary(filters),
          getJRSummary(filters)
        ]);
        setBapendaData(bRes);
        setJRData(jRes);
      } catch (error) {
        console.error("Failed to fetch regional summary:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [filters]);

  if (isLoading) {
    return (
      <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCardSkeleton height="h-80" />
        <ChartCardSkeleton height="h-80" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
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
  );
}
