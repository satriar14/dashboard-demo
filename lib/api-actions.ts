"use server";

import { CityData, DetailedData, ArrearsByYear, ArrearsByLocation, HeatmapPoint } from "./data";
import { getDashboardData } from "./dashboard-data";
import { getCoords } from "./coordinates";

export type DashboardFilters = {
  city: string;
  year: string;
  month: string;
  day: string;
  golongan: string;
  search: string;
  kecamatan: string;
  desa: string;
  jenis: string;
};

function applyFilters(data: DetailedData[], filters: DashboardFilters) {
  const filtered = data.filter(item => {
    // City Filter
    if (filters.city !== 'Semua' && item.kabupaten !== filters.city) return false;

    // Kecamatan Filter
    if (filters.kecamatan && filters.kecamatan !== 'Semua' && item.kecamatan !== filters.kecamatan) return false;

    // Desa Filter
    if (filters.desa && filters.desa !== 'Semua' && item.desa_kelurahan !== filters.desa) return false;

    // Jenis Filter
    if (filters.jenis && filters.jenis !== 'Semua' && item.jenis_kendaraan !== filters.jenis) return false;

    // Date Filters (based on date property)
    if (item.date) {
      const dateObj = new Date(item.date);
      const year = dateObj.getFullYear().toString();
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const day = dateObj.getDate().toString();

      if (filters.year !== 'Semua' && year !== filters.year) return false;
      if (filters.month !== 'Semua' && month !== filters.month) return false;
      if (filters.day !== 'Semua' && day !== filters.day) return false;
    } else if (filters.year !== 'Semua' || filters.month !== 'Semua' || filters.day !== 'Semua') {
      return false;
    }

    // Golongan (warna_plat) Filter
    if (filters.golongan !== 'Semua' && item.warna_plat !== filters.golongan) return false;

    // Search Filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      const match = 
        item.nopol.toLowerCase().includes(search) || 
        item.pemilik.toLowerCase().includes(search) || 
        (item.samsat || '').toLowerCase().includes(search);
      if (!match) return false;
    }

    return true;
  });

  return filtered;
}

export async function getDashboardStats(filters: DashboardFilters) {
  const data = await getDashboardData();
  const filtered = applyFilters(data, filters);

  const totalPotensiVal = filtered.reduce((acc, curr) => acc + (curr.pokok + (curr.opsen || 0)), 0);
  const totalTunggakanVal = filtered.reduce((acc, curr) => acc + (curr.denda || 0), 0);
  
  // Calculate average delay
  const lateItems = filtered.filter(item => item.denda > 0 && item.masa_pajak_sampai);
  const now = new Date();
  let totalDelay = 0;
  lateItems.forEach(item => {
    const due = new Date(item.masa_pajak_sampai!);
    if (due < now) {
      totalDelay += Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    }
  });
  const avgDelay = lateItems.length > 0 ? Math.round(totalDelay / lateItems.length) : 0;

  const totalPotensi = totalPotensiVal / 1000000;
  const totalTunggakan = totalTunggakanVal / 1000000;
  
  const kepatuhan = totalPotensiVal > 0 
    ? (((totalPotensiVal - totalTunggakanVal) / totalPotensiVal) * 100).toFixed(1) 
    : "0";

  const complianceDist = [
    { name: "Sangat Patuh", value: filtered.filter(item => item.denda === 0).length },
    { name: "Kurang Patuh", value: filtered.filter(item => item.denda > 0 && (!item.masa_pajak_sampai || (now.getTime() - new Date(item.masa_pajak_sampai).getTime()) < 30 * 24 * 60 * 60 * 1000)).length },
    { name: "Tidak Patuh", value: filtered.filter(item => item.denda > 0 && item.masa_pajak_sampai && (now.getTime() - new Date(item.masa_pajak_sampai).getTime()) >= 30 * 24 * 60 * 60 * 1000).length }
  ];

  return {
    totalPotensi,
    totalTunggakan,
    avgDelay,
    kepatuhan,
    complianceDist
  };
}

export async function getCitySummary(filters: DashboardFilters): Promise<CityData[]> {
  const data = await getDashboardData();
  const filtered = applyFilters(data, filters);

  const summaryMap: Record<string, CityData> = {};

  filtered.forEach(item => {
    // Group by kecamatan instead of kabupaten
    const groupName = item.kecamatan || item.kabupaten || 'N/A';
    if (!summaryMap[groupName]) {
      summaryMap[groupName] = {
        name: groupName,
        pkb: 0,
        tunggakan: 0,
        potensi: 0,
        keterlambatan: 0,
        golongan: "All"
      };
    }
    
    summaryMap[groupName].pkb += (item.pokok / 1000000);
    summaryMap[groupName].tunggakan += (item.denda / 1000000);
    summaryMap[groupName].potensi += ((item.pokok + (item.opsen || 0)) / 1000000);
    
    // For delay, we average it later
    const due = item.masa_pajak_sampai ? new Date(item.masa_pajak_sampai) : null;
    if (due && due < new Date() && item.denda > 0) {
      summaryMap[groupName].keterlambatan += Math.floor((new Date().getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    }
  });

  // Calculate actual averages for delay
  const result = Object.values(summaryMap);
  result.forEach(group => {
    const groupItems = filtered.filter(it => (it.kecamatan || it.kabupaten) === group.name && it.denda > 0);
    if (groupItems.length > 0) {
      group.keterlambatan = Math.round(group.keterlambatan / groupItems.length);
    }
  });

  return result.sort((a, b) => b.potensi - a.potensi);
}

export async function getTransactions(filters: DashboardFilters, page: number = 1): Promise<DetailedData[]> {
  const data = await getDashboardData();
  const filtered = applyFilters(data, filters);

  const limit = 20;
  const offset = (page - 1) * limit;

  // Sorting by date desc
  const sorted = filtered.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  return sorted.slice(offset, offset + limit);
}

export async function getTotalTransactions(filters: DashboardFilters): Promise<number> {
  const data = await getDashboardData();
  const filtered = applyFilters(data, filters);
  return filtered.length;
}

export async function getKabupatenOptions() {
  const data = await getDashboardData();
  const unique = Array.from(new Set(data.map(item => item.kabupaten).filter(Boolean)));
  return unique.sort() as string[];
}

export async function getKecamatanOptions(kabupaten: string) {
  if (!kabupaten || kabupaten === 'Semua') return [];
  const data = await getDashboardData();
  const unique = Array.from(new Set(
    data.filter(item => item.kabupaten === kabupaten)
        .map(item => item.kecamatan)
        .filter(Boolean)
  ));
  return unique.sort() as string[];
}

export async function getDesaOptions(kecamatan: string) {
  if (!kecamatan || kecamatan === 'Semua') return [];
  const data = await getDashboardData();
  const unique = Array.from(new Set(
    data.filter(item => item.kecamatan === kecamatan)
        .map(item => item.desa_kelurahan)
        .filter(Boolean)
  ));
  return unique.sort() as string[];
}

export async function getJenisKendaraanOptions() {
  const data = await getDashboardData();
  const unique = Array.from(new Set(data.map(item => item.jenis_kendaraan).filter(Boolean)));
  return unique.sort() as string[];
}

export async function getYearOptions() {
  const data = await getDashboardData();
  const years = data.map(item => {
    if (!item.date) return null;
    return new Date(item.date).getFullYear().toString();
  }).filter(Boolean);
  
  const unique = Array.from(new Set(years));
  return unique.sort((a, b) => Number(b) - Number(a)) as string[];
}

export async function getGolonganOptions() {
  const data = await getDashboardData();
  const unique = Array.from(new Set(
    data.map(item => item.warna_plat)
        .filter(Boolean)
        .filter(v => v !== '1' && v !== '2' && v !== '')
  ));
  return unique.sort() as string[];
}

export async function getArrearsByProdYear(filters: DashboardFilters): Promise<ArrearsByYear[]> {
  const data = await getDashboardData();
  const filtered = applyFilters(data, filters);
  
  const arrearsMap: Record<string, number> = {};

  filtered.forEach(item => {
    const isArrears = item.denda > 0 || (item.denda_swdkllj && item.denda_swdkllj > 0 && (item.nopol || '').length < 6);
    if (isArrears && item.tahun_buat) {
      arrearsMap[item.tahun_buat] = (arrearsMap[item.tahun_buat] || 0) + 1;
    }
  });

  return Object.entries(arrearsMap).map(([year, count]) => ({
    tahun_buat: year,
    tunggak: count
  })).sort((a, b) => Number(b.tahun_buat) - Number(a.tahun_buat));
}

export async function getArrearsByLocation(filters: DashboardFilters): Promise<ArrearsByLocation[]> {
  const data = await getDashboardData();
  const filtered = applyFilters(data, filters);
  
  // Pivot to kecamatan by default for more detail
  let groupKey: 'kabupaten' | 'kecamatan' | 'desa_kelurahan' = 'kecamatan';
  
  if (filters.city !== 'Semua') {
    if (filters.kecamatan !== 'Semua') {
      groupKey = 'desa_kelurahan';
    }
  }

  const map: Record<string, number> = {};

  filtered.forEach(item => {
    const isArrears = item.denda > 0 || (item.denda_swdkllj && item.denda_swdkllj > 0);
    if (isArrears) {
      // Fallback to kabupaten if kecamatan is missing
      const name = item[groupKey] || item['kecamatan'] || item['kabupaten'] || 'TIDAK TERIDENTIFIKASI';
      map[name] = (map[name] || 0) + 1;
    }
  });

  return Object.entries(map).map(([name, count]) => ({
    name,
    jumlah_kendaraan: count
  })).sort((a, b) => b.jumlah_kendaraan - a.jumlah_kendaraan).slice(0, 10);
}

export async function getHeatmapData(filters: DashboardFilters): Promise<HeatmapPoint[]> {
  const data = await getDashboardData();
  const filtered = applyFilters(data, filters);
  
  // Always group by Kecamatan to provide the "detail" requested
  const groupKey = 'kecamatan';
  const parentKey = 'kabupaten';

  const map: Record<string, { value: number, parent?: string }> = {};

  filtered.forEach(item => {
    const isArrears = item.denda > 0 || (item.denda_swdkllj && item.denda_swdkllj > 0);
    if (isArrears) {
      const name = item[groupKey] || item[parentKey] || 'TIDAK TERIDENTIFIKASI';
      if (!map[name]) {
        map[name] = { value: 0, parent: item[parentKey] };
      }
      map[name].value += (item.denda / 1000000); // in millions
    }
  });

  return Object.entries(map).map(([name, info]) => {
    // Attempt to get coordinates for the specific name (kecamatan)
    // Fallback to parent (kabupaten) coords if kecamatan not found
    const coords = getCoords(name, info.parent);
    return {
      name: name,
      lat: coords.lat,
      lng: coords.lng,
      value: info.value
    };
  });
}

export async function getForecastData(filters: DashboardFilters) {
  const data = await getDashboardData();
  const filtered = applyFilters(data, filters);
  
  const monthMap: Record<string, number> = {};
  
  filtered.forEach(item => {
    if (item.date) {
      const d = new Date(item.date);
      const monthKey = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      const sortKey = d.getFullYear() * 100 + d.getMonth();
      
      const compositeKey = `${sortKey}|${monthKey}`;
      monthMap[compositeKey] = (monthMap[compositeKey] || 0) + (item.pokok / 1000000);
    }
  });

  const sortedMonths = Object.keys(monthMap).sort().map(k => {
    const [sort, name] = k.split('|');
    return { name, value: monthMap[k], sort: parseInt(sort) };
  });

  if (sortedMonths.length === 0) return [];

  const n = sortedMonths.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  
  sortedMonths.forEach((d, i) => {
    sumX += i;
    sumY += d.value;
    sumXY += i * d.value;
    sumXX += i * i;
  });

  const m = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) : 0;
  const c = (sumY - m * sumX) / n;

  const result: any[] = sortedMonths.map(d => ({
    x: d.name,
    real: Math.round(d.value * 1000) / 1000,
    forecast: null
  }));

  const lastIndex = n - 1;
  const lastValue = sortedMonths[lastIndex].value;
  result[lastIndex].forecast = Math.round(lastValue * 1000) / 1000;

  const lastSort = sortedMonths[lastIndex].sort;
  for (let i = 1; i <= 3; i++) {
    const projectedValue = m * (lastIndex + i) + c;
    const lastYear = Math.floor(lastSort / 100);
    const lastMonth = lastSort % 100;
    const projDate = new Date(lastYear, lastMonth + i, 1);
    const projName = projDate.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    
    result.push({
      x: projName,
      real: null,
      forecast: Math.round(Math.max(0, projectedValue) * 1000) / 1000
    });
  }

  return result;
}

export async function getKecamatanForecastSeries(filters: DashboardFilters) {
  const data = await getDashboardData();
  const filtered = applyFilters(data, filters);
  
  const kecamatanList = Array.from(new Set(filtered.map(it => it.kecamatan).filter(Boolean))).sort();
  
  const pivot: Record<string, Record<string, number>> = {};
  
  filtered.forEach(item => {
    if (item.date && item.kecamatan) {
      const d = new Date(item.date);
      const monthKey = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      const sortKey = d.getFullYear() * 100 + d.getMonth();
      const compositeMonthKey = `${sortKey}|${monthKey}`;
      
      if (!pivot[compositeMonthKey]) pivot[compositeMonthKey] = {};
      pivot[compositeMonthKey][item.kecamatan!] = (pivot[compositeMonthKey][item.kecamatan!] || 0) + (item.pokok / 1000000);
    }
  });

  const sortedMonthKeys = Object.keys(pivot).sort();
  if (sortedMonthKeys.length === 0) return { data: [], kecamatanList: [] };

  const forecasts: Record<string, { m: number, c: number, n: number }> = {};
  
  kecamatanList.forEach(kec => {
    const values = sortedMonthKeys.map(k => pivot[k][kec] || 0);
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    values.forEach((v, i) => {
      sumX += i;
      sumY += v;
      sumXY += i * v;
      sumXX += i * i;
    });
    const divisor = (n * sumXX - sumX * sumX);
    const m = divisor !== 0 ? (n * sumXY - sumX * sumY) / divisor : 0;
    const c = (sumY - m * sumX) / n;
    forecasts[kec] = { m, c, n };
  });

  const result: any[] = sortedMonthKeys.map((k, index) => {
    const [_, monthName] = k.split('|');
    const entry: any = { x: monthName, isForecast: false };
    kecamatanList.forEach(kec => {
      entry[kec] = Math.round((pivot[k][kec] || 0) * 1000) / 1000;
    });
    return entry;
  });

  const lastIndex = sortedMonthKeys.length - 1;
  const lastSortKey = parseInt(sortedMonthKeys[lastIndex].split('|')[0]);
  const lastYear = Math.floor(lastSortKey / 100);
  const lastMonth = lastSortKey % 100;

  for (let i = 1; i <= 3; i++) {
    const projDate = new Date(lastYear, lastMonth + i, 1);
    const projMonthName = projDate.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    const entry: any = { x: projMonthName, isForecast: true };
    
    kecamatanList.forEach(kec => {
      const { m, c } = forecasts[kec];
      const projectedValue = m * (lastIndex + i) + c;
      entry[kec] = Math.round(Math.max(0, projectedValue) * 1000) / 1000;
    });
    result.push(entry);
  }

  return {
    data: result,
    kecamatanList
  };
}

export async function getPaymentHeatmapData(filters: DashboardFilters): Promise<HeatmapPoint[]> {
  const data = await getDashboardData();
  const filtered = applyFilters(data, filters);

  const map: Record<string, { count: number; totalPkb: number; uptNama: string }> = {};

  filtered.forEach(item => {
    const uptKey = (item.samsat || item.kabupaten || 'TIDAK DIKETAHUI').toUpperCase();
    if (!map[uptKey]) {
      map[uptKey] = { count: 0, totalPkb: 0, uptNama: item.samsat || item.kabupaten || uptKey };
    }
    map[uptKey].count += 1;
    map[uptKey].totalPkb += item.pokok / 1000000;
  });

  return Object.entries(map).map(([key, info]) => {
    const coords = getCoords(info.uptNama);
    return {
      name: info.uptNama,
      lat: coords.lat,
      lng: coords.lng,
      value: Math.round(info.totalPkb * 100) / 100
    };
  }).filter(p => p.value > 0);
}
