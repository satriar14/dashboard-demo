export const formatNumber = (num: number, decimals: number = 0) => {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

export const formatCurrencyShort = (numInMillions: number) => {
  if (numInMillions >= 1000000) {
    return `Rp ${formatNumber(numInMillions / 1000000, 2)} T`;
  }
  if (numInMillions >= 1000) {
    return `Rp ${formatNumber(numInMillions / 1000, 2)} M`;
  }
  if (numInMillions >= 1) {
    return `Rp ${formatNumber(numInMillions, 1)} Jt`;
  }
  if (numInMillions === 0) return "Rp 0";
  return `Rp ${formatNumber(numInMillions * 1000000, 0)}`;
};

export const formatNumberShort = (numInMillions: number) => {
  if (numInMillions >= 1000000) {
    return `${formatNumber(numInMillions / 1000000, 2)} T`;
  }
  if (numInMillions >= 1000) {
    return `${formatNumber(numInMillions / 1000, 2)} M`;
  }
  if (numInMillions >= 1) {
    return `${formatNumber(numInMillions, 1)} Jt`;
  }
  if (numInMillions === 0) return "0";
  return formatNumber(numInMillions * 1000000, 0);
};

export type CityData = {
  name: string;
  pkb: number;
  tunggakan: number;
  keterlambatan: number;
  potensi: number;
  golongan: string;
};

export type DetailedData = {
  id: string;
  samsat: string;
  nopol: string;
  pemilik: string;
  alamat: string;
  pokok: number;
  denda: number;
  opsen: number;
  status: 'Critical' | 'Review' | 'Lunas' | 'Tertunggak';
  date: string;
  // Detail Kendaraan
  merek?: string;
  tipe?: string;
  tahun_buat?: string;
  bahan_bakar?: string;
  jenis_kendaraan?: string;
  warna_plat?: string;
  nomor_mesin?: string;
  nomor_rangka?: string;
  nik?: string;
  no_hp?: string;
  cc?: string;
  fungsi?: string;
  // Detail Pajak Tambahan
  bbnkb?: number;
  opsen_bbnkb?: number;
  swdkllj?: number;
  denda_swdkllj?: number;
  // Detail Alamat
  kecamatan?: string;
  desa_kelurahan?: string;
  kabupaten?: string;
  masa_pajak_sampai?: string;
  // AI & Labelling
  ai_reminder?: string;
  customer_labelling?: string;
  next_best_action?: string;
};

export type ArrearsByYear = {
  tahun_buat: string;
  tunggak: number;
};

export type ArrearsByLocation = {
  name: string;
  jumlah_kendaraan: number;
};

export const RAW_CITY_DATA: CityData[] = [
  { name: "PALANGKA RAYA", pkb: 83860, tunggakan: 3694, potensi: 87555, keterlambatan: 514, golongan: "All" },
  { name: "KOTAWARINGIN TIMUR", pkb: 68610, tunggakan: 2866, potensi: 71476, keterlambatan: 398, golongan: "All" },
  { name: "KOTAWARINGIN BARAT", pkb: 41033, tunggakan: 2176, potensi: 43209, keterlambatan: 258, golongan: "All" },
  { name: "KAPUAS", pkb: 21400, tunggakan: 799, potensi: 22199, keterlambatan: 174, golongan: "All" },
  { name: "SERUYAN", pkb: 14972, tunggakan: 559, potensi: 15531, keterlambatan: 74, golongan: "All" },
  { name: "KATINGAN", pkb: 13740, tunggakan: 607, potensi: 14347, keterlambatan: 105, golongan: "All" },
  { name: "LAMANDAU", pkb: 13535, tunggakan: 536, potensi: 14071, keterlambatan: 84, golongan: "All" },
  { name: "BARITO UTARA", pkb: 13532, tunggakan: 451, potensi: 13983, keterlambatan: 129, golongan: "All" },
  { name: "GUNUNG MAS", pkb: 12623, tunggakan: 573, potensi: 13195, keterlambatan: 77, golongan: "All" },
  { name: "PULANG PISAU", pkb: 9026, tunggakan: 354, potensi: 9379, keterlambatan: 71, golongan: "All" },
  { name: "BARITO TIMUR", pkb: 7803, tunggakan: 154, potensi: 7958, keterlambatan: 51, golongan: "All" },
  { name: "SUKAMARA", pkb: 7545, tunggakan: 271, potensi: 7816, keterlambatan: 44, golongan: "All" },
  { name: "BARITO SELATAN", pkb: 7410, tunggakan: 203, potensi: 7613, keterlambatan: 55, golongan: "All" },
  { name: "MURUNG RAYA", pkb: 7371, tunggakan: 199, potensi: 7570, keterlambatan: 41, golongan: "All" }
];

export const RAW_DETAILED_DATA: DetailedData[] = [
  { id: "SG2", samsat: "PALANGKA RAYA", nopol: "KH8439AD", pemilik: "CV. KALIMANTAN MAKMUR", alamat: "JL. GARUDA NO. 85 B RT. 004 RW. 023 KEL. PALANGKA ...", pokok: 1157400, denda: 0, opsen: 763900, status: "Lunas", date: "2025-01-23" },
  { id: "SG3", samsat: "PALANGKA RAYA", nopol: "KH3705YH", pemilik: "SITI SARSIDAH", alamat: "JL. PERINTIS RAYA BLOK I NO. 06 RT. 006 RW. 015 KE...", pokok: 129300, denda: 0, opsen: 85400, status: "Lunas", date: "2025-01-20" },
  { id: "SG4", samsat: "KOTAWARINGIN BARAT", nopol: "KH3089GN", pemilik: "NURHADI, S.KOM", alamat: "JL. A. YANI NO. 25 RT/RW 017/006KEL. BARU, KEC. AR...", pokok: 104900, denda: 0, opsen: 69300, status: "Lunas", date: "2025-01-24" },
  { id: "SG5", samsat: "KOTAWARINGIN TIMUR", nopol: "KH5232QH", pemilik: "JEMMY JUMRIANOOR", alamat: "JL. PANGERAN ANTASARI NO. 63 RT. 022/004 KEC. MB K...", pokok: 150100, denda: 0, opsen: 99100, status: "Lunas", date: "2025-01-07" },
  { id: "SG6", samsat: "KOTAWARINGIN BARAT", nopol: "KH1255GT", pemilik: "MAHENDRA PASARIBU", alamat: "JL. HEND SUDIRMAN RT. 011 RW. 000 KEL.SIDOREJO KEC...", pokok: 2430000, denda: 0, opsen: 1603800, status: "Lunas", date: "2025-01-20" },
  { id: "SG7", samsat: "PALANGKA RAYA", nopol: "KH3685TU", pemilik: "YAN ALWIN", alamat: "JL. LESTARI NO.41 RT 05/09 KEC.JEKAN RAYA PALANGKA...", pokok: 93200, denda: 0, opsen: 61500, status: "Lunas", date: "2025-01-14" },
  { id: "SG8", samsat: "PALANGKA RAYA", nopol: "KH2712YS", pemilik: "FETTY MANDA SARI", alamat: "JL. GARUDA VII NO. 2 RT. 003 RW. 025 KEL. PALANGKA...", pokok: 132900, denda: 0, opsen: 87800, status: "Lunas", date: "2025-01-07" },
  { id: "SG9", samsat: "KOTAWARINGIN TIMUR", nopol: "KH6532LW", pemilik: "N G A M A R", alamat: "JL.SIMPANG SEBABI RT.009 RW.001 KEL.SEBABI TELAWAN...", pokok: 123000, denda: 24000, opsen: 81200, status: "Review", date: "2025-01-13" },
  { id: "SG10", samsat: "BARITO UTARA", nopol: "KH5630EO", pemilik: "TIHEN", alamat: "JL.ARDI.M RT.007 RW.0 KEL.LAHEI II KEC.LAHEI BARIT...", pokok: 122100, denda: 0, opsen: 80600, status: "Lunas", date: "2025-01-22" },
  { id: "SG11", samsat: "BARITO UTARA", nopol: "KH4008EJ", pemilik: "WILDAWATI", alamat: "JL. MERANTI RT 009/ KEL.LANJAS KEC.TEWEH TENGAH,KA...", pokok: 99500, denda: 0, opsen: 65700, status: "Lunas", date: "2025-01-30" },
  { id: "SG12", samsat: "SUKAMARA", nopol: "KH3942SJ", pemilik: "KUSNO", alamat: "DS.PEMPANING RT.001/000 KEC.BALAI RIAM KAB.SUKAMAR...", pokok: 104900, denda: 0, opsen: 69300, status: "Lunas", date: "2025-01-30" },
  { id: "SG13", samsat: "KOTAWARINGIN TIMUR", nopol: "KH1175FO", pemilik: "SATRIA WANI", alamat: "JL.MUCHRAN ALI NO.64 RT.006/002 KEC. BAAMANG SAMPI...", pokok: 1794000, denda: 0, opsen: 1184100, status: "Lunas", date: "2025-01-24" },
  { id: "SG14", samsat: "KOTAWARINGIN TIMUR", nopol: "KH8826LA", pemilik: "SETYO HARTONO", alamat: "JL.JAMBU RT.003/002 KEL.AGUNG MULYA KEC.TELAGA ANT...", pokok: 2628700, denda: 80000, opsen: 1735000, status: "Review", date: "2025-01-31" },
  { id: "SG15", samsat: "PALANGKA RAYA", nopol: "KH1122AA", pemilik: "BUDI SANTOSO", alamat: "JL. TAMBUN BUNGAI NO. 10", pokok: 450000, denda: 0, opsen: 250000, status: "Lunas", date: "2024-12-15" },
  { id: "SG16", samsat: "KOTAWARINGIN TIMUR", nopol: "KH3344BB", pemilik: "ANWAR SADAT", alamat: "JL. JEND SUDIRMAN KM 6", pokok: 890000, denda: 45000, opsen: 560000, status: "Tertunggak", date: "2025-02-05" },
  { id: "SG17", samsat: "KAPUAS", nopol: "KH5566CC", pemilik: "DIANA PUSPITA", alamat: "JL. AHMAD YANI NO. 45", pokok: 1200000, denda: 0, opsen: 800000, status: "Lunas", date: "2024-11-20" }
];

export const getRiskData = () => {
  return RAW_CITY_DATA.map(city => ({
    name: city.name,
    impact: Math.round((city.tunggakan / city.potensi) * 100),
    probability: Math.min(Math.round((city.keterlambatan / 30) * 100), 100),
    tunggakan: city.tunggakan,
    keterlambatan: city.keterlambatan
  }));
};

export const forecastData = [
  { "x": "Jan 25", "real": 34978, "forecast": null },
  { "x": "Feb 25", "real": 32675, "forecast": null },
  { "x": "Mar 25", "real": 41256, "forecast": null },
  { "x": "Apr 25", "real": 36934, "forecast": null },
  { "x": "May 25", "real": 37124, "forecast": null },
  { "x": "Jun 25", "real": 39002, "forecast": null },
  { "x": "Jul 25", "real": 60146, "forecast": null },
  { "x": "Aug 25", "real": 49733, "forecast": null },
  { "x": "Sep 25", "real": 57041, "forecast": null },
  { "x": "Oct 25", "real": 42847, "forecast": null },
  { "x": "Nov 25", "real": 43733, "forecast": null },
  { "x": "Dec 25", "real": 60352, "forecast": 60352 },
  { "x": "Proj 1", "real": null, "forecast": 76971 },
  { "x": "Proj 2", "real": null, "forecast": 93590 },
  { "x": "Proj 3", "real": null, "forecast": 110209 }
];


export const COLORS = {
  primary: '#4f46e5',
  secondary: '#6366f1',
  success: '#10b981',
  danger: '#f43f5e',
  warning: '#f59e0b',
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    400: '#94a3b8',
    500: '#64748b',
    900: '#0f172a'
  }
};

export const CHART_PALETTE = ['#818cf8', '#a5b4fc', '#c7d2fe'];

export interface HeatmapPoint {
  name: string;
  lat: number;
  lng: number;
  value: number;
  count?: number;
}
