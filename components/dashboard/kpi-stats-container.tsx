"use client";

import { useState, useEffect } from 'react';
import { DollarSign, AlertCircle, Activity, Clock } from 'lucide-react';
import { KPICard } from "./kpi-card";
import { KPICardSkeleton } from "./skeleton-loader";
import { getDashboardStats, DashboardFilters } from "@/lib/api-actions";
import { formatNumber, formatCurrencyShort } from "@/lib/data";

interface KpiStatsContainerProps {
  filters: DashboardFilters;
}

export function KpiStatsContainer({ filters }: KpiStatsContainerProps) {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setIsLoading(true);
      try {
        const data = await getDashboardStats(filters);
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch KPI stats:", error);
      } finally {
        setIsLoading(true); // Artificial delay or just keep it true for a frame
        setTimeout(() => setIsLoading(false), 50); // Optional: ensure smooth skeleton transition
      }
    }
    fetchStats();
  }, [filters]);

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
        <KPICardSkeleton />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      <KPICard 
        title="Total Potensi PKB" 
        value={formatCurrencyShort(stats.totalPotensiPkb)} 
        trend={12} 
        icon={DollarSign} 
        iconColor="indigo" 
        delay={0.1} 
      />
      <KPICard 
        title="Total Potensi SWDKLLJ" 
        value={formatCurrencyShort(stats.totalPotensiSwdkllj)} 
        trend={8} 
        icon={DollarSign} 
        iconColor="blue" 
        delay={0.15} 
      />
      <KPICard 
        title="Total Tunggakan" 
        value={formatCurrencyShort(stats.totalTunggakan)} 
        trend={-4} 
        icon={AlertCircle} 
        iconColor="rose" 
        delay={0.2} 
      />
      <KPICard 
        title="Kepatuhan" 
        value={`${formatNumber(parseFloat(stats.kepatuhan), 1)}%`} 
        trend={2} 
        icon={Activity} 
        iconColor="emerald" 
        delay={0.3} 
      />
      <KPICard 
        title="Rata-rata Terlambat" 
        value={`${formatNumber(stats.avgDelay)} Hari`} 
        trend={-8} 
        icon={Clock} 
        iconColor="amber" 
        delay={0.4} 
      />
    </div>
  );
}
