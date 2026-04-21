"use client";

import { useState, useEffect } from 'react';
import dynamic from "next/dynamic";
import { HeatmapSkeleton } from "./skeleton-loader";
import { getHeatmapData, getPaymentHeatmapData, DashboardFilters } from "@/lib/api-actions";
import { motion } from "framer-motion";

const LeafletHeatmap = dynamic(() => import("./leaflet-heatmap"), { 
  ssr: false,
  loading: () => <div className="h-[500px] w-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center text-slate-400 font-medium">Memuat Peta...</div>
});

interface MapChartsContainerProps {
  filters: DashboardFilters;
}

export function MapChartsContainer({ filters }: MapChartsContainerProps) {
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [paymentHeatmapData, setPaymentHeatmapData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Sequentialize heavy map queries to reduce peak load
        const hRes = await getHeatmapData(filters);
        const pRes = await getPaymentHeatmapData(filters);
        
        setHeatmapData(hRes);
        setPaymentHeatmapData(pRes);
      } catch (error) {
        console.error("Failed to fetch map data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [filters]);

  if (isLoading) {
    return (
      <div className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HeatmapSkeleton />
        <HeatmapSkeleton />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6"
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
  );
}
