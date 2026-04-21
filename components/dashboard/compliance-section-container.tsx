"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MoreVertical } from "lucide-react";
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer 
} from 'recharts';
import { motion } from "framer-motion";
import { ChartCardSkeleton } from "./skeleton-loader";
import { getDashboardStats, DashboardFilters } from "@/lib/api-actions";
import { formatNumber } from "@/lib/data";

interface ComplianceSectionContainerProps {
  filters: DashboardFilters;
}

export function ComplianceSectionContainer({ filters }: ComplianceSectionContainerProps) {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const stats = await getDashboardStats(filters);
        setData(stats.complianceDist);
      } catch (error) {
        console.error("Failed to fetch compliance data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [filters]);

  // Dynamic color selection based on label content
  const getColor = (name: string, index: number) => {
    const label = name.toLowerCase();
    
    // Explicit mappings for common labels with premium colors
    if (label.includes('patuh') || label.includes('loyal') || label.includes('highly')) return '#6366f1'; // Indigo Premium
    if (label.includes('kurang') || label.includes('risk') || label.includes('at risk')) return '#f59e0b'; // Vibrant Amber
    if (label.includes('tidak') || label.includes('critical') || label.includes('danger')) return '#f43f5e'; // Deep Rose/Red
    if (label.includes('unlabelled') || label.includes('lainnya')) return '#94a3b8'; // Cool Slate
    
    // Vibrant Fallback Palette for other dynamic labels
    const palette = [
      '#8b5cf6', // Violet
      '#06b6d4', // Cyan
      '#ec4899', // Pink
      '#10b981', // Emerald
      '#f97316', // Orange
      '#3b82f6'  // Blue
    ];
    return palette[index % palette.length];
  };

  if (isLoading) {
    return <ChartCardSkeleton />;
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
      <Card className="h-full border-slate-200/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Kepatuhan Pembayaran</CardTitle>
            <p className="text-[10px] text-slate-400 mt-1 uppercase">Segmentasi: Customer Labelling AI</p>
          </div>
          <MoreVertical className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="h-64 mt-4 min-w-0 overflow-hidden">
            {!isLoading && data.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={data} 
                  innerRadius={70} 
                  outerRadius={90} 
                  paddingAngle={8} 
                  dataKey="value"
                  labelLine={false}
                  animationBegin={0}
                  animationDuration={1000}
                >
                  {data.map((item, i) => (
                    <Cell key={i} fill={getColor(item.name, i)} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(v: any) => formatNumber(Number(v))}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', fontSize: '14px' }} 
                />
              </PieChart>
            </ResponsiveContainer>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
            {data.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColor(item.name, i) }}></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase">{item.name}</span>
                <span className="text-[10px] font-medium text-slate-400">({formatNumber(item.value)})</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
