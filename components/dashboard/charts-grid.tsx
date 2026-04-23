"use client";

import { DashboardFilters } from "@/lib/api-actions";
import { MapChartsContainer } from "./map-charts-container";
import { RegionalSummaryContainer } from "./regional-summary-container";
import { ComplianceSectionContainer } from "./compliance-section-container";
import { RegionalComparisonContainer } from "./regional-comparison-container";
import { ArrearsTrendsContainer } from "./arrears-trends-container";
import { ForecastingContainer } from "./forecasting-container";
import { Separator } from "@/components/ui/separator";

interface ChartsGridProps {
  filters: DashboardFilters;
}

export function ChartsGrid({ filters }: ChartsGridProps) {
  return (
    <div className="space-y-10">
      {/* 1. Maps Section */}
      <section>
        <div className="flex items-center gap-4 mb-6">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Visualisasi Geografis</h3>
          <Separator className="flex-1" />
        </div>
        <MapChartsContainer filters={filters} />
      </section>

      {/* 2. Main Analytics Section */}
      <section>
        <div className="flex items-center gap-4 mb-6">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Analisis Kepatuhan & Perbandingan</h3>
          <Separator className="flex-1" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ComplianceSectionContainer filters={filters} />
          <RegionalComparisonContainer filters={filters} />
        </div>
      </section>

      {/* 3. Trends & Arrears Section */}
      <section>
        <div className="flex items-center gap-4 mb-6">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Tren & Penunggakan</h3>
          <Separator className="flex-1" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ArrearsTrendsContainer filters={filters} />
        </div>
      </section>

      {/* 4. Forecasting Section */}
      <section>
        <div className="flex items-center gap-4 mb-6">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Prediksi & Proyeksi</h3>
          <Separator className="flex-1" />
        </div>
        <ForecastingContainer filters={filters} />
      </section>

      {/* 5. Regional Contribution Section */}
      {/* <section>
        <div className="flex items-center gap-4 mb-6">
           <h3 className="text-lg font-bold text-slate-900 tracking-tight">Kontribusi Wilayah</h3>
           <Separator className="flex-1" />
        </div>
        <RegionalSummaryContainer filters={filters} />
      </section> */}
    </div>
  );
}


