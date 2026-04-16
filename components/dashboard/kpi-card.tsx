"use client";

import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface KPICardProps {
  title: string;
  value: string;
  trend: number;
  icon: LucideIcon;
  iconColor: string;
  delay?: number;
}

export function KPICard({ title, value, trend, icon: Icon, iconColor, delay = 0 }: KPICardProps) {
  const isPositive = trend > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-slate-200/60">
        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
          <Icon size={80} />
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <div className={`p-3 rounded-xl bg-${iconColor}-50 text-${iconColor}-500 group-hover:scale-110 transition-transform`}>
            <Icon size={24} />
          </div>
          <span className={`text-sm font-bold flex items-center gap-1 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isPositive ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}
            {Math.abs(trend)}%
          </span>
        </div>
        
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h2>
        </div>

        <div className={`absolute bottom-0 left-0 h-1 bg-${iconColor}-500 w-0 group-hover:w-full transition-all duration-500`} />
      </Card>
    </motion.div>
  );
}
