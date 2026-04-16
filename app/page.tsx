"use client";

import { useState, useMemo } from 'react';
import { 
  Search, 
  Filter as FilterIcon, 
  Download, 
  Activity, 
  DollarSign, 
  AlertCircle, 
  Clock,
  LayoutDashboard
} from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { KPICard } from "@/components/dashboard/kpi-card";
import { ChartsGrid } from "@/components/dashboard/charts-grid";
import { TransactionTable } from "@/components/dashboard/transaction-table";
import { 
  RAW_CITY_DATA, 
  RAW_DETAILED_DATA,
  formatNumber
} from "@/lib/data";

export default function DashboardPage() {
  const [selectedCity, setSelectedCity] = useState('Semua');
  const [selectedGolongan, setSelectedGolongan] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Date Filters
  const [selectedYear, setSelectedYear] = useState('Semua');
  const [selectedMonth, setSelectedMonth] = useState('Semua');
  const [selectedDay, setSelectedDay] = useState('Semua');

  const months = [
    { value: "01", label: "Januari" },
    { value: "02", label: "Februari" },
    { value: "03", label: "Maret" },
    { value: "04", label: "April" },
    { value: "05", label: "Mei" },
    { value: "06", label: "Juni" },
    { value: "07", label: "Juli" },
    { value: "08", label: "Agustus" },
    { value: "09", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ];

  const filteredDetailedData = useMemo(() => {
    return RAW_DETAILED_DATA.filter(item => {
      const cityMatch = selectedCity === 'Semua' || item.samsat.toLowerCase() === selectedCity.toLowerCase();
      const searchMatch = 
        item.nopol.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.pemilik.toLowerCase().includes(searchQuery.toLowerCase());
      
      const [year, month, day] = item.date.split('-');
      const yearMatch = selectedYear === 'Semua' || year === selectedYear;
      const monthMatch = selectedMonth === 'Semua' || month === selectedMonth;
      const dayMatch = selectedDay === 'Semua' || parseInt(day).toString() === selectedDay;

      return cityMatch && searchMatch && yearMatch && monthMatch && dayMatch;
    });
  }, [selectedCity, searchQuery, selectedYear, selectedMonth, selectedDay]);

  const filteredCityData = useMemo(() => {
    return RAW_CITY_DATA.filter(item => {
      const cityMatch = selectedCity === 'Semua' || item.name.toLowerCase() === selectedCity.toLowerCase();
      const golMatch = selectedGolongan === 'Semua' || item.golongan.toLowerCase() === selectedGolongan.toLowerCase();
      return cityMatch && golMatch;
    });
  }, [selectedCity, selectedGolongan]);

  const stats = useMemo(() => {
    const isDateFiltered = selectedYear !== 'Semua' || selectedMonth !== 'Semua' || selectedDay !== 'Semua';

    if (isDateFiltered) {
      // derive stats from detailed data for real-time filter feel
      const totalPotensiVal = filteredDetailedData.reduce((acc, curr) => acc + (curr.pokok + curr.opsen), 0);
      const totalTunggakanVal = filteredDetailedData.reduce((acc, curr) => acc + (curr.status === 'Tertunggak' ? (curr.pokok + curr.opsen) : 0), 0);
      
      return { 
        totalPotensi: totalPotensiVal / 1000000, 
        totalTunggakan: totalTunggakanVal / 1000000, 
        avgDelay: 12, // Placeholder for date-specific delay
        kepatuhan: totalPotensiVal > 0 ? (((totalPotensiVal - totalTunggakanVal) / totalPotensiVal) * 100).toFixed(1) : "0"
      };
    }

    const totalPotensi = filteredCityData.reduce((acc, curr) => acc + curr.potensi, 0);
    const totalTunggakan = filteredCityData.reduce((acc, curr) => acc + curr.tunggakan, 0);
    const avgDelay = filteredCityData.length > 0 
      ? Math.round(filteredCityData.reduce((acc, curr) => acc + curr.keterlambatan, 0) / filteredCityData.length) 
      : 0;
    const kepatuhan = totalPotensi > 0 ? (((totalPotensi - totalTunggakan) / totalPotensi) * 100).toFixed(1) : "0";

    return { totalPotensi, totalTunggakan, avgDelay, kepatuhan };
  }, [filteredCityData, filteredDetailedData, selectedYear, selectedMonth, selectedDay]);

  const resetFilters = () => {
    setSelectedCity('Semua');
    setSelectedGolongan('Semua');
    setSearchQuery('');
    setSelectedYear('Semua');
    setSelectedMonth('Semua');
    setSelectedDay('Semua');
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 selection:bg-indigo-100 pb-20">
      {/* Top Navigation / Branding */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
              <LayoutDashboard size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">SIGAP <span className="text-indigo-600">Analytics</span></h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Live Operational
             </div>
             <Separator orientation="vertical" className="h-6" />
             <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600">
                <Activity size={20} />
             </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 space-y-10">
        
        {/* Hero Section & Search */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Ringkasan</h2>
            <p className="text-slate-500 font-medium">Monitoring Unit Pelaksana Teknis Pendapatan Daerah Kalimantan Tengah</p>
          </div>
          <div className="flex w-full lg:w-auto gap-3">
            <div className="relative flex-1 lg:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input 
                placeholder="Cari NOPOL atau Pemilik..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-white border-slate-200 rounded-xl focus-visible:ring-indigo-500 transition-all shadow-sm"
              />
            </div>
            <Button className="h-11 px-5 rounded-xl bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm border" variant="ghost">
              <Download size={18} className="mr-2" /> Export
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-5 p-5 bg-white border border-slate-200/60 rounded-2xl shadow-sm">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Samsat / Loket</label>
            <Select value={selectedCity} onValueChange={(value) => value && setSelectedCity(value)}>
              <SelectTrigger className="w-[160px] h-10 border-slate-200 rounded-lg text-xs font-semibold bg-slate-50/50">
                <SelectValue placeholder="Loket" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua">Semua Loket</SelectItem>
                <SelectItem value="PALANGKA RAYA">Samsat Palangka Raya</SelectItem>
                <SelectItem value="KOTAWARINGIN TIMUR">Samsat Sampit</SelectItem>
                <SelectItem value="KAPUAS">Samsat Kapuas</SelectItem>
                <SelectItem value="KOTAWARINGIN BARAT">Samsat Pangkalan Bun</SelectItem>
                <SelectItem value="KATINGAN">Samsat Kasongan</SelectItem>
                <SelectItem value="BARITO SELATAN">Samsat Buntok</SelectItem>
                <SelectItem value="SUKAMARA">Samsat Sukamara</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Tahun</label>
            <Select value={selectedYear} onValueChange={(value) => value && setSelectedYear(value)}>
              <SelectTrigger className="w-[100px] h-10 border-slate-200 rounded-lg text-xs font-semibold bg-slate-50/50">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua">Semua</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Bulan</label>
            <Select value={selectedMonth} onValueChange={(value) => value && setSelectedMonth(value)}>
              <SelectTrigger className="w-[130px] h-10 border-slate-200 rounded-lg text-xs font-semibold bg-slate-50/50">
                <SelectValue placeholder="Bulan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua">Semua</SelectItem>
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Tanggal</label>
            <Select value={selectedDay} onValueChange={(value) => value && setSelectedDay(value)}>
              <SelectTrigger className="w-[90px] h-10 border-slate-200 rounded-lg text-xs font-semibold bg-slate-50/50">
                <SelectValue placeholder="Tgl" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua">Semua</SelectItem>
                {Array.from({ length: 31 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Golongan</label>
            <Select value={selectedGolongan} onValueChange={(value) => value && setSelectedGolongan(value)}>
              <SelectTrigger className="w-[140px] h-10 border-slate-200 rounded-lg text-xs font-semibold bg-slate-50/50">
                <SelectValue placeholder="Golongan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua">Semua</SelectItem>
                <SelectItem value="B">Pribadi (B)</SelectItem>
                <SelectItem value="DP">Dinas (DP)</SelectItem>
                <SelectItem value="U">Umum (U)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(selectedCity !== 'Semua' || selectedGolongan !== 'Semua' || searchQuery !== '' || selectedYear !== 'Semua' || selectedMonth !== 'Semua' || selectedDay !== 'Semua') && (
            <Button 
              variant="link" 
              onClick={resetFilters}
              className="text-xs font-bold text-rose-500 h-10 ml-auto"
            >
              Reset Filter
            </Button>
          )}
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard title="Total Potensi" value={`Rp ${formatNumber(stats.totalPotensi)}jt`} trend={12} icon={DollarSign} iconColor="indigo" delay={0.1} />
          <KPICard title="Total Tunggakan" value={`Rp ${formatNumber(stats.totalTunggakan)}jt`} trend={-4} icon={AlertCircle} iconColor="rose" delay={0.2} />
          <KPICard title="Kepatuhan" value={`${stats.kepatuhan}%`} trend={2} icon={Activity} iconColor="emerald" delay={0.3} />
          <KPICard title="Rata-rata Terlambat" value={`${formatNumber(stats.avgDelay)} Hari`} trend={-8} icon={Clock} iconColor="amber" delay={0.4} />
        </div>

        {/* Charts Section */}
        <section>
          <div className="flex items-center gap-4 mb-6">
             <h3 className="text-lg font-bold text-slate-900 tracking-tight">Visualisasi Data</h3>
             <Separator className="flex-1" />
          </div>
          <ChartsGrid data={filteredCityData} />
        </section>

        {/* Table Section */}
        <section>
          <div className="flex items-center gap-4 mb-6">
             <h3 className="text-lg font-bold text-slate-900 tracking-tight">Analisis Detail</h3>
             <Separator className="flex-1" />
          </div>
          <TransactionTable data={filteredDetailedData} />
        </section>

      </main>

      <footer className="container mx-auto px-6 py-10 mt-10 border-t border-slate-200/60 text-slate-400">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
           <p className="text-xs font-bold uppercase tracking-widest">© 2025 BAPENDA KALIMANTAN TENGAH</p>
           <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest">
              <a href="#" className="hover:text-indigo-600 transition-colors">Documentation</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Security</a>
           </div>
        </div>
      </footer>
    </div>
  );
}
