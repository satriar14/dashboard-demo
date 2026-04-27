"use server";

import { CityData, DetailedData, ArrearsByYear, ArrearsByLocation, HeatmapPoint, ArrearsDaysDist } from "./data";
import { getCoords } from "./coordinates";
import { serialQuery } from "./db";
import { 
  getFilterClause, 
  SQL_NUMERIC_CAST, 
  SQL_TOTAL_DENDA,
  SQL_POTENSI_BAPENDA,
  SQL_POTENSI_JR
} from "./sql-utils";

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

export async function getDashboardStats(filters: DashboardFilters) {
  const { text: filterClause, values } = getFilterClause(filters);
  const now = new Date().toISOString();

  const statsQuery = `
    SELECT 
      SUM(
        ${SQL_NUMERIC_CAST('pokok_pkb')} +
        ${SQL_NUMERIC_CAST('pokok_bbnkb')} +
        ${SQL_NUMERIC_CAST('tunggakan_pokok_pkb')} +
        ${SQL_NUMERIC_CAST('tunggakan_pokok_bbnkb')} +
        ${SQL_NUMERIC_CAST('opsen_pokok_pkb')} +
        ${SQL_NUMERIC_CAST('opsen_tunggakan_pokok_pkb')} +
        ${SQL_NUMERIC_CAST('opsen_pokok_bbnkb')} +
        ${SQL_NUMERIC_CAST('opsen_tunggakan_pokok_bbnkb')}
      ) as total_potensi_pkb_val,
      SUM(
        ${SQL_NUMERIC_CAST('pokok_swdkllj')} +
        ${SQL_NUMERIC_CAST('tunggakan_pokok_swdkllj')} +
        ${SQL_NUMERIC_CAST('denda_swdkllj')} +
        ${SQL_NUMERIC_CAST('tunggakan_denda_swdkllj')}
      ) as total_potensi_swdkllj_val,
      SUM(${SQL_TOTAL_DENDA}) as total_tunggakan_val,
      AVG(
        CASE 
          WHEN ${SQL_TOTAL_DENDA} > 0 AND masa_pajak_sampai IS NOT NULL AND masa_pajak_sampai::date < $${values.length + 1}::date
          THEN ($${values.length + 1}::date - masa_pajak_sampai::date)
          ELSE NULL 
        END
      ) as avg_delay_val
    FROM v_data_transaksi_kendaraan
    ${filterClause}
  `;

  const labelsQuery = `
    SELECT 
      COALESCE(segment_perilaku, 'Unlabelled') as name,
      COUNT(*)::int as value
    FROM v_data_transaksi_kendaraan
    ${filterClause}
    GROUP BY name
    ORDER BY value DESC
  `;

  const { rows: statsRows } = await serialQuery(statsQuery, [...values, now]);
  const { rows: labelRows } = await serialQuery(labelsQuery, values);

  const row = statsRows[0];
  const totalPotensiPkbVal = parseFloat(row.total_potensi_pkb_val || 0);
  const totalPotensiSwdklljVal = parseFloat(row.total_potensi_swdkllj_val || 0);
  const totalTunggakanVal = parseFloat(row.total_tunggakan_val || 0);
  
  const totalPotensiPkb = totalPotensiPkbVal / 1000000;
  const totalPotensiSwdkllj = totalPotensiSwdklljVal / 1000000;
  const totalTunggakan = totalTunggakanVal / 1000000;
  
  const combinedPotensi = totalPotensiPkbVal + totalPotensiSwdklljVal;
  const kepatuhan = combinedPotensi > 0 
    ? (((combinedPotensi - totalTunggakanVal) / combinedPotensi) * 100).toFixed(1) 
    : "0";

  return {
    totalPotensiPkb,
    totalPotensiSwdkllj,
    totalTunggakan,
    avgDelay: Math.round(parseFloat(row.avg_delay_val || 0)),
    kepatuhan,
    complianceDist: labelRows
  };
}

export async function getCitySummary(filters: DashboardFilters): Promise<CityData[]> {
  const { text: filterClause, values } = getFilterClause(filters);
  const now = new Date().toISOString();

  // Group by kecamatan for city summary
  const query = `
    SELECT 
      COALESCE(nama_kec, nama_kabkota, 'N/A') as group_name,
      SUM(${SQL_NUMERIC_CAST('pokok_pkb')} / 1000000) as pkb,
      SUM(${SQL_TOTAL_DENDA} / 1000000) as tunggakan,
      SUM((${SQL_NUMERIC_CAST('pokok_pkb')} + ${SQL_NUMERIC_CAST('opsen_pokok_pkb')}) / 1000000) as potensi,
      AVG(
        CASE 
          WHEN ${SQL_TOTAL_DENDA} > 0 AND masa_pajak_sampai IS NOT NULL AND masa_pajak_sampai::date < $${values.length + 1}::date
          THEN ($${values.length + 1}::date - masa_pajak_sampai::date)
          ELSE NULL 
        END
      ) as avg_delay
    FROM v_data_transaksi_kendaraan
    ${filterClause}
    GROUP BY group_name
    ORDER BY potensi DESC
  `;

  const { rows } = await serialQuery(query, [...values, now]);

  return rows.map(row => ({
    name: row.group_name,
    pkb: parseFloat(row.pkb || 0),
    tunggakan: parseFloat(row.tunggakan || 0),
    potensi: parseFloat(row.potensi || 0),
    keterlambatan: Math.round(parseFloat(row.avg_delay || 0)),
    golongan: "All"
  }));
}

export async function getKabupatenSummary(filters: DashboardFilters): Promise<CityData[]> {
  const { text: filterClause, values } = getFilterClause(filters);

  const query = `
    SELECT 
      COALESCE(nama_kabkota, 'N/A') as group_name,
      SUM(${SQL_NUMERIC_CAST('pokok_pkb')} / 1000000) as pkb,
      SUM(${SQL_TOTAL_DENDA} / 1000000) as tunggakan,
      SUM((${SQL_NUMERIC_CAST('pokok_pkb')} + ${SQL_NUMERIC_CAST('opsen_pokok_pkb')}) / 1000000) as potensi
    FROM v_data_transaksi_kendaraan
    ${filterClause}
    GROUP BY group_name
    ORDER BY potensi DESC
  `;

  const { rows } = await serialQuery(query, values);

  return rows.map(row => ({
    name: row.group_name,
    pkb: parseFloat(row.pkb || 0),
    tunggakan: parseFloat(row.tunggakan || 0),
    potensi: parseFloat(row.potensi || 0),
    keterlambatan: 0,
    golongan: "All"
  }));
}

export async function getTransactions(filters: DashboardFilters, page: number = 1): Promise<DetailedData[]> {
  const { text: filterClause, values } = getFilterClause(filters);
  const limit = 20;
  const offset = (page - 1) * limit;

  const query = `
    SELECT 
      nopol, upt_nama, paid_on, masa_pajak_sampai,
      ${SQL_NUMERIC_CAST('pokok_pkb')} as pokok,
      ${SQL_TOTAL_DENDA} as denda,
      ${SQL_NUMERIC_CAST('opsen_pokok_pkb')} as opsen,
      nama_pemilik, jenis_kendaraan, merk_kendaraan, tipe_kendaraan, cc, fungsi,
      tahun_buat, bbm, warna_plat, nomor_mesin, nomor_rangka, nik, no_hp,
      nama_kabkota, nama_kec, nama_kel,
      pokok_bbnkb, opsen_pokok_bbnkb, pokok_swdkllj, denda_swdkllj,
      ai_recommendation as ai_reminder, segment_perilaku as customer_labelling, strategi_perilaku as next_best_action
    FROM v_data_transaksi_kendaraan
    ${filterClause}
    ORDER BY COALESCE(paid_on::text, masa_pajak_sampai::text) DESC NULLS LAST
    LIMIT $${values.length + 1} OFFSET $${values.length + 2}
  `;

  const { rows } = await serialQuery(query, [...values, limit, offset]);

  return rows.map((row, i) => {
    const nopol = row.nopol || '';
    return {
      id: (nopol || 'ID') + '-' + (offset + i),
      samsat: row.upt_nama || row.nama_kabkota || 'N/A',
      nopol,
      pemilik: row.nama_pemilik || '',
      alamat: [row.nama_kel, row.nama_kec, row.nama_kabkota].filter(Boolean).join(', '),
      pokok: parseFloat(row.pokok || 0),
      denda: parseFloat(row.denda || 0),
      opsen: parseFloat(row.opsen || 0),
      status: parseFloat(row.denda || 0) > 0 ? 'Tertunggak' : 'Lunas',
      date: row.paid_on || row.masa_pajak_sampai || '',

      // Detail Kendaraan
      merek: row.merk_kendaraan || '',
      tipe: row.tipe_kendaraan || '',
      tahun_buat: row.tahun_buat || '',
      bahan_bakar: row.bbm || '',
      jenis_kendaraan: row.jenis_kendaraan || '',
      warna_plat: row.warna_plat || '',
      nomor_mesin: row.nomor_mesin || '',
      nomor_rangka: row.nomor_rangka || '',
      nik: row.nik || '',
      no_hp: row.no_hp || '',
      cc: row.cc || '',
      fungsi: row.fungsi || '',

      // Detail Pajak
      bbnkb: parseFloat(row.pokok_bbnkb || 0),
      opsen_bbnkb: parseFloat(row.opsen_pokok_bbnkb || 0),
      swdkllj: parseFloat(row.pokok_swdkllj || 0),
      denda_swdkllj: parseFloat(row.denda_swdkllj || 0),

      // Detail Alamat
      kecamatan: row.nama_kec || '',
      desa_kelurahan: row.nama_kel || '',
      kabupaten: row.nama_kabkota || 'N/A',
      masa_pajak_sampai: row.masa_pajak_sampai || '',

      // AI Fields
      ai_reminder: row.ai_reminder || '',
      customer_labelling: row.customer_labelling || '',
      next_best_action: row.next_best_action || '',
    };
  });
}

export async function getTotalTransactions(filters: DashboardFilters): Promise<number> {
  const { text: filterClause, values } = getFilterClause(filters);
  const query = `SELECT COUNT(*) FROM v_data_transaksi_kendaraan ${filterClause}`;
  const { rows } = await serialQuery(query, values);
  return parseInt(rows[0].count);
}

export async function getKabupatenOptions() {
  const query = `SELECT DISTINCT nama_kabkota FROM v_data_transaksi_kendaraan WHERE nama_kabkota IS NOT NULL ORDER BY nama_kabkota`;
  const { rows } = await serialQuery(query);
  return rows.map(r => r.nama_kabkota);
}

export async function getKecamatanOptions(kabupaten: string) {
  if (!kabupaten || kabupaten === 'Semua') return [];
  const query = `SELECT DISTINCT nama_kec FROM v_data_transaksi_kendaraan WHERE nama_kabkota = $1 AND nama_kec IS NOT NULL ORDER BY nama_kec`;
  const { rows } = await serialQuery(query, [kabupaten]);
  return rows.map(r => r.nama_kec);
}

export async function getDesaOptions(kecamatan: string) {
  if (!kecamatan || kecamatan === 'Semua') return [];
  const query = `SELECT DISTINCT nama_kel FROM v_data_transaksi_kendaraan WHERE nama_kec = $1 AND nama_kel IS NOT NULL ORDER BY nama_kel`;
  const { rows } = await serialQuery(query, [kecamatan]);
  return rows.map(r => r.nama_kel);
}

export async function getJenisKendaraanOptions() {
  const query = `SELECT DISTINCT jenis_kendaraan FROM v_data_transaksi_kendaraan WHERE jenis_kendaraan IS NOT NULL ORDER BY jenis_kendaraan`;
  const { rows } = await serialQuery(query);
  return rows.map(r => r.jenis_kendaraan);
}

export async function getYearOptions() {
  const query = `
    SELECT DISTINCT LEFT(COALESCE(paid_on::text, masa_pajak_sampai::text), 4) as year 
    FROM v_data_transaksi_kendaraan 
    WHERE COALESCE(paid_on::text, masa_pajak_sampai::text) IS NOT NULL 
    ORDER BY year DESC
  `;
  const { rows } = await serialQuery(query);
  return rows.map(r => r.year);
}

export async function getGolonganOptions() {
  const query = `SELECT DISTINCT warna_plat FROM v_data_transaksi_kendaraan WHERE warna_plat IS NOT NULL AND warna_plat != '' ORDER BY warna_plat`;
  const { rows } = await serialQuery(query);
  return rows.map(r => r.warna_plat);
}

export async function getArrearsByProdYear(filters: DashboardFilters): Promise<ArrearsByYear[]> {
  const { text: filterClause, values } = getFilterClause(filters);
  
  const query = `
    SELECT 
      tahun_buat,
      COUNT(*) as tunggak
    FROM v_data_transaksi_kendaraan
    ${filterClause} ${filterClause ? 'AND' : 'WHERE'} ${SQL_TOTAL_DENDA} > 0 AND tahun_buat IS NOT NULL
    GROUP BY tahun_buat
    ORDER BY tahun_buat DESC
  `;

  const { rows } = await serialQuery(query, values);

  return rows.map(row => ({
    tahun_buat: row.tahun_buat,
    tunggak: parseInt(row.tunggak)
  }));
}

export async function getArrearsByLocation(filters: DashboardFilters): Promise<ArrearsByLocation[]> {
  const { text: filterClause, values } = getFilterClause(filters);
  
  // Pivot logic
  let groupCol = 'nama_kec';
  if (filters.city !== 'Semua' && filters.kecamatan !== 'Semua') {
    groupCol = 'nama_kel';
  }

  const query = `
    SELECT 
      COALESCE(${groupCol}, 'TIDAK TERIDENTIFIKASI') as group_name,
      COUNT(*) as jumlah_kendaraan
    FROM v_data_transaksi_kendaraan
    ${filterClause} ${filterClause ? 'AND' : 'WHERE'} ${SQL_TOTAL_DENDA} > 0
    GROUP BY group_name
    ORDER BY jumlah_kendaraan DESC
    LIMIT 10
  `;

  const { rows } = await serialQuery(query, values);

  return rows.map(row => ({
    name: row.group_name,
    jumlah_kendaraan: parseInt(row.jumlah_kendaraan)
  }));
}

export async function getHeatmapData(filters: DashboardFilters): Promise<HeatmapPoint[]> {
  const { text: filterClause, values } = getFilterClause(filters);

  const query = `
    SELECT 
      COALESCE(nama_kec, 'TIDAK TERIDENTIFIKASI') as group_name,
      nama_kabkota as parent_name,
      SUM(${SQL_TOTAL_DENDA} / 1000000) as total_value
    FROM v_data_transaksi_kendaraan
    ${filterClause} ${filterClause ? 'AND' : 'WHERE'} ${SQL_TOTAL_DENDA} > 0
    GROUP BY group_name, parent_name
  `;

  const { rows } = await serialQuery(query, values);

  return rows.map(row => {
    const coords = getCoords(row.group_name, row.parent_name);
    return {
      name: row.group_name,
      lat: coords.lat,
      lng: coords.lng,
      value: parseFloat(row.total_value || 0)
    };
  });
}

export async function getForecastData(filters: DashboardFilters) {
  const { text: filterClause, values } = getFilterClause(filters);

  const query = `
    SELECT 
      COALESCE(paid_on::text, masa_pajak_sampai::text) as raw_date,
      SUM(${SQL_NUMERIC_CAST('pokok_pkb')} / 1000000) as total_val
    FROM v_data_transaksi_kendaraan
    ${filterClause} ${filterClause ? 'AND' : 'WHERE'} COALESCE(paid_on::text, masa_pajak_sampai::text) IS NOT NULL
    GROUP BY COALESCE(paid_on::text, masa_pajak_sampai::text)
  `;

  const { rows } = await serialQuery(query, values);

  const monthlyData: Record<string, number> = {};

  rows.forEach(row => {
    const rawDate = row.raw_date;
    if (!rawDate) return;
    
    let year = NaN, month = NaN;
    if (rawDate.includes('/')) {
      const parts = rawDate.split('/');
      if (parts.length >= 3) {
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
      }
    } else if (rawDate.includes('-')) {
      const parts = rawDate.split('-');
      if (parts.length >= 2) {
        if (parts[0].length === 4) {
          year = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10);
        } else {
          month = parseInt(parts[1], 10);
          year = parseInt(parts[2], 10);
        }
      }
    }

    if (!isNaN(year) && !isNaN(month)) {
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + parseFloat(row.total_val || 0);
    }
  });

  const sortedMonths = Object.entries(monthlyData)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, val]) => {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      const name = date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      return { name, value: val, sort: parseInt(year) * 100 + parseInt(month) };
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
    const projDate = new Date(lastYear, lastMonth + i - 1, 1);
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
  const { text: filterClause, values } = getFilterClause(filters);

  // Get aggregated data by date and kecamatan
  const query = `
    SELECT 
      COALESCE(paid_on::text, masa_pajak_sampai::text) as raw_date,
      nama_kec as kecamatan,
      SUM(${SQL_NUMERIC_CAST('pokok_pkb')} / 1000000) as total_val
    FROM v_data_transaksi_kendaraan
    ${filterClause} ${filterClause ? 'AND' : 'WHERE'} COALESCE(paid_on::text, masa_pajak_sampai::text) IS NOT NULL AND nama_kec IS NOT NULL
    GROUP BY COALESCE(paid_on::text, masa_pajak_sampai::text), nama_kec
  `;

  const { rows } = await serialQuery(query, values);
  
  const pivot: Record<string, Record<string, number>> = {};
  const kecamatanSet = new Set<string>();

  rows.forEach(row => {
    const rawDate = row.raw_date;
    if (!rawDate) return;
    
    let year = NaN, month = NaN;
    if (rawDate.includes('/')) {
      const parts = rawDate.split('/');
      if (parts.length >= 3) {
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
      }
    } else if (rawDate.includes('-')) {
      const parts = rawDate.split('-');
      if (parts.length >= 2) {
        if (parts[0].length === 4) {
          year = parseInt(parts[0], 10);
          month = parseInt(parts[1], 10);
        } else {
          month = parseInt(parts[1], 10);
          year = parseInt(parts[2], 10);
        }
      }
    }

    if (!isNaN(year) && !isNaN(month)) {
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
      if (!pivot[monthKey]) pivot[monthKey] = {};
      pivot[monthKey][row.kecamatan] = (pivot[monthKey][row.kecamatan] || 0) + parseFloat(row.total_val || 0);
      kecamatanSet.add(row.kecamatan);
    }
  });

  const kecamatanList = Array.from(kecamatanSet).sort();
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
    const [year, month] = k.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const monthName = date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    const entry: any = { x: monthName, isForecast: false };
    kecamatanList.forEach(kec => {
      entry[kec] = Math.round((pivot[k][kec] || 0) * 1000) / 1000;
    });
    return entry;
  });

  const lastIndex = sortedMonthKeys.length - 1;
  const lastMonthKey = sortedMonthKeys[lastIndex];
  const lastYear = parseInt(lastMonthKey.split('-')[0]);
  const lastMonth = parseInt(lastMonthKey.split('-')[1]);

  for (let i = 1; i <= 3; i++) {
    const projDate = new Date(lastYear, lastMonth + i - 1, 1);
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
  const { text: filterClause, values } = getFilterClause(filters);

  const query = `
    SELECT 
      COALESCE(upt_nama, nama_kabkota, 'TIDAK DIKETAHUI') as group_name,
      COUNT(*) as count,
      SUM(${SQL_NUMERIC_CAST('pokok_pkb')} / 1000000) as total_pkb
    FROM v_data_transaksi_kendaraan
    ${filterClause}
    GROUP BY group_name
    HAVING SUM(${SQL_NUMERIC_CAST('pokok_pkb')}) > 0
  `;

  const { rows } = await serialQuery(query, values);

  return rows.map(row => {
    const coords = getCoords(row.group_name);
    return {
      name: row.group_name,
      lat: coords.lat,
      lng: coords.lng,
      value: Math.round(parseFloat(row.total_pkb || 0) * 100) / 100,
      count: parseInt(row.count)
    };
  });
}
export async function getBapendaSummary(filters: DashboardFilters) {
  const { text: filterClause, values } = getFilterClause(filters);
  const query = `
    SELECT 
      nama_kabkota as name,
      SUM(${SQL_POTENSI_BAPENDA} / 1000000) as value
    FROM v_data_transaksi_kendaraan
    ${filterClause}
    GROUP BY name
    ORDER BY value DESC
    LIMIT 10
  `;
  const { rows } = await serialQuery(query, values);
  return rows.map(r => ({ name: r.name, value: parseFloat(r.value || 0) }));
}

export async function getJRSummary(filters: DashboardFilters) {
  const { text: filterClause, values } = getFilterClause(filters);
  const query = `
    SELECT 
      nama_kabkota as name,
      SUM(${SQL_POTENSI_JR} / 1000000) as value
    FROM v_data_transaksi_kendaraan
    ${filterClause}
    GROUP BY name
    ORDER BY value DESC
    LIMIT 10
  `;
  const { rows } = await serialQuery(query, values);
  return rows.map(r => ({ name: r.name, value: parseFloat(r.value || 0) }));
}

export async function getArrearsDaysDistribution(filters: DashboardFilters): Promise<ArrearsDaysDist[]> {
  const { text: filterClause, values } = getFilterClause(filters);
  
  const query = `
    SELECT 
      CASE 
        WHEN hari_tunggakan < -90 THEN '> 90 Hari Awal'
        WHEN hari_tunggakan < -30 THEN '31 - 90 Hari Awal'
        WHEN hari_tunggakan < 0 THEN '1 - 30 Hari Awal'
        WHEN hari_tunggakan = 0 THEN 'Tepat Waktu'
        WHEN hari_tunggakan <= 365 THEN '1 Tahun Terlambat'
        WHEN hari_tunggakan <= 730 THEN '2 Tahun Terlambat'
        WHEN hari_tunggakan <= 1095 THEN '3 Tahun Terlambat'
        WHEN hari_tunggakan <= 1460 THEN '4 Tahun Terlambat'
        ELSE '> 4 Tahun Terlambat'
      END as category,
      CASE 
        WHEN hari_tunggakan < -90 THEN 1
        WHEN hari_tunggakan < -30 THEN 2
        WHEN hari_tunggakan < 0 THEN 3
        WHEN hari_tunggakan = 0 THEN 4
        WHEN hari_tunggakan <= 365 THEN 5
        WHEN hari_tunggakan <= 730 THEN 6
        WHEN hari_tunggakan <= 1095 THEN 7
        WHEN hari_tunggakan <= 1460 THEN 8
        ELSE 9
      END as sort_order,
      COUNT(*)::int as value
    FROM v_data_transaksi_kendaraan
    ${filterClause}
    GROUP BY category, sort_order
    ORDER BY sort_order ASC
  `;

  const { rows } = await serialQuery(query, values);

  return rows.map(row => ({
    category: row.category,
    value: row.value,
    sort_order: row.sort_order
  }));
}
