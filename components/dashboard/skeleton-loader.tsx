"use client";

// ─── Shimmer base ────────────────────────────────────────────────────────────
function Shimmer({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-slate-100 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.6s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent ${className}`}
      style={style}
    />
  );
}

// ─── KPI Card Skeleton ────────────────────────────────────────────────────────
export function KPICardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <Shimmer className="h-3 w-28 rounded-full" />
        <Shimmer className="h-9 w-9 rounded-xl" />
      </div>
      <Shimmer className="h-8 w-36 rounded-lg" />
      <div className="flex items-center gap-2">
        <Shimmer className="h-3 w-10 rounded-full" />
        <Shimmer className="h-3 w-20 rounded-full" />
      </div>
    </div>
  );
}

// ─── Chart Card Skeleton ──────────────────────────────────────────────────────
export function ChartCardSkeleton({ height = "h-64" }: { height?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <Shimmer className="h-3 w-40 rounded-full" />
        <Shimmer className="h-4 w-4 rounded" />
      </div>
      <div className={`p-5 ${height} flex flex-col justify-end gap-2`}>
        {/* Simulated bar chart skeleton */}
        <div className="flex items-end gap-2 h-full">
          {[60, 85, 45, 70, 55, 90, 40, 75, 65, 50].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end">
              <Shimmer className="w-full rounded-t-md" style={{ height: `${h}%` } as any} />
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <Shimmer key={i} className="flex-1 h-2 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Heatmap Skeleton ─────────────────────────────────────────────────────────
export function HeatmapSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <Shimmer className="h-3 w-56 rounded-full" />
        <Shimmer className="h-3 w-28 rounded-full" />
      </div>
      <div className="h-[550px] relative bg-slate-50 flex items-center justify-center">
        {/* Map background suggestion */}
        <div className="absolute inset-0 opacity-30">
          <div className="h-full w-full grid grid-cols-6 grid-rows-4 gap-1 p-4">
            {Array.from({ length: 24 }).map((_, i) => (
              <Shimmer key={i} className="rounded-md opacity-60" />
            ))}
          </div>
        </div>
        {/* Center label */}
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin" />
          <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">Memuat Peta...</p>
        </div>
        {/* Legend skeleton */}
        <div className="absolute bottom-6 left-6 bg-white/90 p-4 rounded-2xl border border-slate-200 shadow space-y-3 w-44">
          <Shimmer className="h-3 w-28 rounded-full" />
          <Shimmer className="h-2.5 w-40 rounded-full" />
          <div className="flex justify-between">
            <Shimmer className="h-2 w-10 rounded-full" />
            <Shimmer className="h-2 w-10 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Table Row Skeleton ───────────────────────────────────────────────────────
export function TableRowSkeleton() {
  return (
    <tr>
      <td className="px-4 py-3"><Shimmer className="h-3 w-20 rounded-full" /></td>
      <td className="px-4 py-3"><Shimmer className="h-3 w-28 rounded-full" /></td>
      <td className="px-4 py-3"><Shimmer className="h-3 w-32 rounded-full" /></td>
      <td className="px-4 py-3"><Shimmer className="h-3 w-16 rounded-full" /></td>
      <td className="px-4 py-3"><Shimmer className="h-3 w-20 rounded-full" /></td>
      <td className="px-4 py-3"><Shimmer className="h-5 w-16 rounded-full" /></td>
      <td className="px-4 py-3"><Shimmer className="h-3 w-24 rounded-full" /></td>
    </tr>
  );
}

export function TableSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <Shimmer className="h-3 w-40 rounded-full" />
        <div className="flex gap-2">
          <Shimmer className="h-8 w-20 rounded-lg" />
          <Shimmer className="h-8 w-20 rounded-lg" />
        </div>
      </div>
      {/* Table header */}
      <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 grid grid-cols-7 gap-4">
        {['w-16','w-24','w-28','w-12','w-16','w-14','w-20'].map((w, i) => (
          <Shimmer key={i} className={`h-2.5 ${w} rounded-full`} />
        ))}
      </div>
      {/* Rows */}
      <table className="w-full">
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
