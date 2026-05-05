import { DashboardFilters } from "./api-actions";

// Materialized view table name - switch between MV and original view here
export const MV_TABLE = 'mv_dashboard_kendaraan';

export function getFilterClause(filters: DashboardFilters): { text: string; values: any[] } {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  if (filters.city !== 'Semua') {
    conditions.push(`nama_kabkota = $${paramIdx++}`);
    values.push(filters.city);
  }

  if (filters.kecamatan && filters.kecamatan !== 'Semua') {
    conditions.push(`nama_kec = $${paramIdx++}`);
    values.push(filters.kecamatan);
  }

  if (filters.desa && filters.desa !== 'Semua') {
    conditions.push(`nama_kel = $${paramIdx++}`);
    values.push(filters.desa);
  }

  if (filters.jenis && filters.jenis !== 'Semua') {
    conditions.push(`jenis_kendaraan = $${paramIdx++}`);
    values.push(filters.jenis);
  }

  // Date Filters - uses pre-computed columns from materialized view
  if (filters.year !== 'Semua') {
    conditions.push(`tahun_pajak = $${paramIdx++}`);
    values.push(filters.year);
  }

  if (filters.month !== 'Semua') {
    conditions.push(`bulan_pajak = $${paramIdx++}`);
    values.push(filters.month);
  }

  if (filters.day !== 'Semua') {
    conditions.push(`hari_pajak = $${paramIdx++}`);
    values.push(filters.day);
  }

  if (filters.golongan !== 'Semua') {
    conditions.push(`warna_plat = $${paramIdx++}`);
    values.push(filters.golongan);
  }

  if (filters.search) {
    const searchVal = `%${filters.search.toLowerCase()}%`;
    conditions.push(`(
      LOWER(nopol) LIKE $${paramIdx} OR 
      LOWER(nama_pemilik) LIKE $${paramIdx} OR 
      LOWER(upt_nama) LIKE $${paramIdx}
    )`);
    values.push(searchVal);
    paramIdx++;
  }

  const queryText = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  return { text: queryText, values };
}

// For MV: columns are already numeric with _num suffix, no CAST needed
export const SQL_NUMERIC_CAST = (col: string) => `${col}_num`;

// Calculate delay in months/days for fines
export const SQL_MONTHS_DELAYED = `GREATEST(0, (EXTRACT(YEAR FROM age(CURRENT_DATE, masa_pajak_sampai)) * 12 + EXTRACT(MONTH FROM age(CURRENT_DATE, masa_pajak_sampai))))`;
export const SQL_DAYS_DELAYED = `GREATEST(0, (CURRENT_DATE - masa_pajak_sampai))`;

// Bapenda Denda Rate: 1% per month + 1% (max 24%)
export const SQL_BAPENDA_DENDA_RATE = `
  CASE 
    WHEN masa_pajak_sampai < CURRENT_DATE 
    THEN LEAST(0.24, (${SQL_MONTHS_DELAYED} + 1) * 0.01)
    ELSE 0 
  END
`;

// JR Denda Rate: 1-90 days = 25%; 91-180 = 50%; 181-270 = 75%; >270 = 100%
export const SQL_JR_DENDA_RATE = `
  CASE 
    WHEN ${SQL_DAYS_DELAYED} <= 0 THEN 0
    WHEN ${SQL_DAYS_DELAYED} <= 90 THEN 0.25
    WHEN ${SQL_DAYS_DELAYED} <= 180 THEN 0.50
    WHEN ${SQL_DAYS_DELAYED} <= 270 THEN 0.75
    ELSE 1.0
  END
`;

// Formula for Jasa Raharja (JR) Potensi
export const SQL_JR_POKOK = `
  CASE 
    WHEN kode_jenken = 'B' THEN 35000
    WHEN kode_jenken = 'C' THEN 83000
    WHEN kode_jenken = 'D' THEN 143000
    WHEN kode_jenken = 'E' THEN 153000
    WHEN kode_jenken = 'F' THEN 163000
    WHEN kode_jenken = 'G' THEN 276000
    WHEN kode_jenken = 'H' THEN 476000
    ELSE pokok_swdkllj_num
  END
`;

export const SQL_POTENSI_JR = `
  (${SQL_JR_POKOK} +
   (${SQL_JR_POKOK} * ${SQL_JR_DENDA_RATE}) +
   tunggakan_pokok_swdkllj_num +
   tunggakan_denda_swdkllj_num)
`;

// Formula for Bapenda Potensi (PKB & BBNKB)
export const SQL_DENDA_PKB = `(pokok_pkb_num * ${SQL_BAPENDA_DENDA_RATE})`;
export const SQL_DENDA_TUNGGAKAN_PKB = `(tunggakan_pokok_pkb_num * ${SQL_BAPENDA_DENDA_RATE})`;
export const SQL_DENDA_BBNKB = `(pokok_bbnkb_num * ${SQL_BAPENDA_DENDA_RATE})`;
export const SQL_DENDA_TUNGGAKAN_BBNKB = `(tunggakan_pokok_bbnkb_num * ${SQL_BAPENDA_DENDA_RATE})`;

export const SQL_POTENSI_BAPENDA = `
  (pokok_pkb_num + 
   tunggakan_pokok_pkb_num + 
   ${SQL_DENDA_PKB} + 
   ${SQL_DENDA_TUNGGAKAN_PKB} + 
   opsen_pokok_pkb_num + 
   opsen_tunggakan_pokok_pkb_num + 
   (opsen_pokok_pkb_num * ${SQL_BAPENDA_DENDA_RATE}) + 
   (opsen_tunggakan_pokok_pkb_num * ${SQL_BAPENDA_DENDA_RATE}) + 
   pokok_bbnkb_num + 
   tunggakan_pokok_bbnkb_num + 
   opsen_pokok_bbnkb_num + 
   opsen_tunggakan_pokok_bbnkb_num + 
   (opsen_pokok_bbnkb_num * ${SQL_BAPENDA_DENDA_RATE}) + 
   (opsen_tunggakan_pokok_bbnkb_num * ${SQL_BAPENDA_DENDA_RATE}) + 
   ${SQL_DENDA_BBNKB} + 
   ${SQL_DENDA_TUNGGAKAN_BBNKB})
`;

export const SQL_TOTAL_DENDA = `total_denda`;

