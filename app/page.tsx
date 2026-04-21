"use client";

import { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Activity, 
  LayoutDashboard,
  Loader2
} from 'lucide-react';
import { SearchableSelect } from "@/components/dashboard/searchable-select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { KpiStatsContainer } from "@/components/dashboard/kpi-stats-container";
import { ChartsGrid } from "@/components/dashboard/charts-grid";
import { TransactionsContainer } from "@/components/dashboard/transactions-container";

import { 
  getKabupatenOptions,
  getKecamatanOptions,
  getDesaOptions,
  getJenisKendaraanOptions,
  getYearOptions,
  getGolonganOptions,
  DashboardFilters
} from "@/lib/api-actions";

export default function DashboardPage() {
  const [selectedCity, setSelectedCity] = useState('Semua');
  const [selectedKecamatan, setSelectedKecamatan] = useState('Semua');
  const [selectedDesa, setSelectedDesa] = useState('Semua');
  const [selectedJenis, setSelectedJenis] = useState('Semua');
  const [selectedGolongan, setSelectedGolongan] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedYear, setSelectedYear] = useState('Semua');
  const [selectedMonth, setSelectedMonth] = useState('Semua');
  const [selectedDay, setSelectedDay] = useState('Semua');

  const [kabupatenOptions, setKabupatenOptions] = useState<string[]>([]);
  const [kecamatanOptions, setKecamatanOptions] = useState<string[]>([]);
  const [desaOptions, setDesaOptions] = useState<string[]>([]);
  const [jenisOptions, setJenisOptions] = useState<string[]>([]);
  const [yearOptions, setYearOptions] = useState<string[]>([]);
  const [golonganOptions, setGolonganOptions] = useState<string[]>([]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initial fetch for options
  useEffect(() => {
    getKabupatenOptions().then(setKabupatenOptions);
    getJenisKendaraanOptions().then(setJenisOptions);
    getYearOptions().then(setYearOptions);
    getGolonganOptions().then(setGolonganOptions);
  }, []);

  // Cascading filters logic
  useEffect(() => {
    if (selectedCity !== 'Semua') {
      getKecamatanOptions(selectedCity).then(setKecamatanOptions);
    } else {
      setKecamatanOptions([]);
    }
    setSelectedKecamatan('Semua');
    setSelectedDesa('Semua');
  }, [selectedCity]);

  useEffect(() => {
    if (selectedKecamatan !== 'Semua') {
      getDesaOptions(selectedKecamatan).then(setDesaOptions);
    } else {
      setDesaOptions([]);
    }
    setSelectedDesa('Semua');
  }, [selectedKecamatan]);

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

  const currentFilters: DashboardFilters = useMemo(() => ({
    city: selectedCity,
    year: selectedYear,
    month: selectedMonth,
    day: selectedDay,
    golongan: selectedGolongan,
    search: searchQuery,
    kecamatan: selectedKecamatan,
    desa: selectedDesa,
    jenis: selectedJenis
  }), [selectedCity, selectedYear, selectedMonth, selectedDay, selectedGolongan, searchQuery, selectedKecamatan, selectedDesa, selectedJenis]);

  // Visual refresh indicator
  useEffect(() => {
    setIsRefreshing(true);
    const timer = setTimeout(() => setIsRefreshing(false), 800);
    return () => clearTimeout(timer);
  }, [currentFilters]);

  const resetFilters = () => {
    setSelectedCity('Semua');
    setSelectedKecamatan('Semua');
    setSelectedDesa('Semua');
    setSelectedJenis('Semua');
    setSelectedGolongan('Semua');
    setSearchQuery('');
    setSelectedYear('Semua');
    setSelectedMonth('Semua');
    setSelectedDay('Semua');
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] text-slate-900 selection:bg-indigo-100 pb-20">
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
              <LayoutDashboard size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">SADAR <span className="text-indigo-600">Analytics</span></h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[13px] font-bold uppercase tracking-wider">
                {isRefreshing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                )}
                {isRefreshing ? 'Refreshing Data...' : 'Live Operational'}
             </div>
             <Separator orientation="vertical" className="h-6" />
             <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600">
                <Activity size={20} />
             </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 space-y-10">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Ringkasan</h2>
            <p className="text-slate-500 font-medium">Sistem Analitik Data untuk Aksi Responsif Pajak Kendaraan (SADAR) - Kalimantan Tengah</p>
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Kabupaten</label>
            <SearchableSelect 
              value={selectedCity} 
              onValueChange={setSelectedCity}
              options={['Semua Kabupaten', ...kabupatenOptions].map(k => ({ label: k, value: k === 'Semua Kabupaten' ? 'Semua' : k }))}
              placeholder="Kabupaten"
              width="w-[180px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Kecamatan</label>
            <SearchableSelect 
              value={selectedKecamatan} 
              onValueChange={setSelectedKecamatan}
              disabled={selectedCity === 'Semua'}
              options={['Semua Kecamatan', ...kecamatanOptions].map(k => ({ label: k, value: k === 'Semua Kecamatan' ? 'Semua' : k }))}
              placeholder="Kecamatan"
              width="w-[180px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Desa / Kelurahan</label>
            <SearchableSelect 
              value={selectedDesa} 
              onValueChange={setSelectedDesa}
              disabled={selectedKecamatan === 'Semua'}
              options={['Semua Desa', ...desaOptions].map(d => ({ label: d, value: d === 'Semua Desa' ? 'Semua' : d }))}
              placeholder="Desa"
              width="w-[180px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Jenis</label>
            <SearchableSelect 
              value={selectedJenis} 
              onValueChange={setSelectedJenis}
              options={['Semua', ...jenisOptions]}
              placeholder="Jenis"
              width="w-[120px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Golongan</label>
            <SearchableSelect 
              value={selectedGolongan} 
              onValueChange={setSelectedGolongan}
              options={['Semua', ...golonganOptions]}
              placeholder="Golongan"
              width="w-[120px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Tahun</label>
            <SearchableSelect 
              value={selectedYear} 
              onValueChange={setSelectedYear}
              options={['Semua', ...yearOptions]}
              placeholder="Tahun"
              width="w-[100px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Bulan</label>
            <SearchableSelect 
              value={selectedMonth} 
              onValueChange={setSelectedMonth}
              options={[{ label: 'Semua', value: 'Semua' }, ...months]}
              placeholder="Bulan"
              width="w-[110px]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Tanggal</label>
            <SearchableSelect 
              value={selectedDay} 
              onValueChange={setSelectedDay}
              options={['Semua', ...Array.from({ length: 31 }, (_, i) => (i + 1).toString())]}
              placeholder="Tgl"
              width="w-[80px]"
            />
          </div>

          {(selectedCity !== 'Semua' || selectedKecamatan !== 'Semua' || selectedDesa !== 'Semua' || selectedJenis !== 'Semua' || selectedGolongan !== 'Semua' || searchQuery !== '' || selectedYear !== 'Semua' || selectedMonth !== 'Semua' || selectedDay !== 'Semua') && (
            <Button 
              variant="link" 
              onClick={resetFilters}
              className="text-xs font-bold text-rose-500 h-10 ml-auto"
            >
              Reset Filter
            </Button>
          )}
        </div>

        <div className={`h-0.5 w-full rounded-full overflow-hidden transition-opacity duration-300 ${isRefreshing ? 'opacity-100' : 'opacity-0'}`}>
          <div className="h-full bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 animate-[shimmer_1.2s_ease-in-out_infinite] w-1/3" />
        </div>

        {/* 1. KPI Cards */}
        <KpiStatsContainer filters={currentFilters} />

        {/* 2. Charts & Visualizations */}
        <ChartsGrid filters={currentFilters} />

        {/* 3. Detailed Data Table */}
        <section>
          <div className="flex items-center gap-4 mb-6">
             <h3 className="text-lg font-bold text-slate-900 tracking-tight">Analisis Detail</h3>
             <Separator className="flex-1" />
          </div>
          <TransactionsContainer filters={currentFilters} />
        </section>

      </main>

      <footer className="container mx-auto px-6 py-10 mt-10 border-t border-slate-200/60 text-slate-400">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
           <p className="text-[13px] font-bold uppercase tracking-widest">© 2025 BAPENDA KALIMANTAN TENGAH</p>
           <div className="flex gap-8 text-[13px] font-bold uppercase tracking-widest">
              <a href="#" className="hover:text-indigo-600 transition-colors">Documentation</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Security</a>
           </div>
        </div>
      </footer>
    </div>
  );
}

