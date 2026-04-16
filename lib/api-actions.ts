"use server";

import { query } from "./db";
import { CityData, DetailedData, ArrearsByYear, ArrearsByLocation } from "./data";

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

function buildWhereClause(filters: DashboardFilters) {
  let whereClause = "WHERE 1=1";
  const params: any[] = [];

  if (filters.city !== 'Semua') {
    params.push(filters.city);
    whereClause += ` AND kabupaten = $${params.length}`;
  }

  if (filters.kecamatan && filters.kecamatan !== 'Semua') {
    params.push(filters.kecamatan);
    whereClause += ` AND kecamatan = $${params.length}`;
  }

  if (filters.desa && filters.desa !== 'Semua') {
    params.push(filters.desa);
    whereClause += ` AND desa_kelurahan = $${params.length}`;
  }

  if (filters.jenis && filters.jenis !== 'Semua') {
    params.push(filters.jenis);
    whereClause += ` AND kode_jenis_kendaraan = $${params.length}`;
  }

  if (filters.year !== 'Semua') {
    params.push(filters.year);
    whereClause += ` AND EXTRACT(YEAR FROM COALESCE(tanggal_transaksi, paid_on)) = $${params.length}`;
  }

  if (filters.month !== 'Semua') {
    params.push(filters.month);
    whereClause += ` AND LPAD(EXTRACT(MONTH FROM COALESCE(tanggal_transaksi, paid_on))::text, 2, '0') = $${params.length}`;
  }

  if (filters.day !== 'Semua') {
    params.push(filters.day);
    whereClause += ` AND EXTRACT(DAY FROM COALESCE(tanggal_transaksi, paid_on)) = $${params.length}`;
  }

  if (filters.golongan !== 'Semua') {
    params.push(filters.golongan);
    whereClause += ` AND warna_plat = $${params.length}`;
  }

  if (filters.search) {
    params.push(`%${filters.search}%`);
    const p = params.length;
    whereClause += ` AND (nopol ILIKE $${p} OR nama_pemilik ILIKE $${p} OR nama_upt ILIKE $${p})`;
  }

  return { whereClause, params };
}

export async function getDashboardStats(filters: DashboardFilters) {
  try {
    const { whereClause, params } = buildWhereClause(filters);

    const statsQuery = `
      SELECT 
        SUM(COALESCE(pokok_pkb, 0) + COALESCE(opsen_pokok_pkb, 0)) as total_potensi,
        SUM(
          COALESCE(tunggakan_pokok_pkb, 0) + 
          COALESCE(tunggakan_pokok_bbnkb, 0) + 
          COALESCE(opsen_tunggakan_pokok_pkb, 0) + 
          COALESCE(opsen_tunggakan_pokok_bbnkb, 0) + 
          COALESCE(denda_swdkllj, 0) + 
          COALESCE(tunggakan_denda_swdkllj, 0)
        ) as total_tunggakan,
        COALESCE(AVG(CASE WHEN (
          COALESCE(tunggakan_pokok_pkb, 0) + 
          COALESCE(tunggakan_pokok_bbnkb, 0) + 
          COALESCE(opsen_tunggakan_pokok_pkb, 0) + 
          COALESCE(opsen_tunggakan_pokok_bbnkb, 0) + 
          COALESCE(denda_swdkllj, 0) + 
          COALESCE(tunggakan_denda_swdkllj, 0)
        ) > 0 AND masa_pajak_sampai < CURRENT_DATE
        THEN DATE_PART('day', CURRENT_DATE - masa_pajak_sampai)
        END), 0) as avg_delay
      FROM v_kendaraan_transaksi_clean
      ${whereClause}
    `;

    const res = await query(statsQuery, params);
    const row = res.rows[0];

    const totalPotensiVal = Number(row.total_potensi || 0);
    const totalTunggakanVal = Number(row.total_tunggakan || 0);
    
    const totalPotensi = totalPotensiVal / 1000000;
    const totalTunggakan = totalTunggakanVal / 1000000;
    
    const kepatuhan = totalPotensiVal > 0 
      ? (((totalPotensiVal - totalTunggakanVal) / totalPotensiVal) * 100).toFixed(1) 
      : "0";

    return {
      totalPotensi,
      totalTunggakan,
      avgDelay: Math.round(Number(row.avg_delay || 0)),
      kepatuhan
    };
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    throw error;
  }
}

export async function getCitySummary(filters: DashboardFilters): Promise<CityData[]> {
  try {
    const { whereClause, params } = buildWhereClause(filters);

    const cityQuery = `
      SELECT 
        kabupaten as name,
        SUM(COALESCE(pokok_pkb, 0)) as pkb,
        SUM(
          COALESCE(tunggakan_pokok_pkb, 0) + 
          COALESCE(tunggakan_pokok_bbnkb, 0) + 
          COALESCE(opsen_tunggakan_pokok_pkb, 0) + 
          COALESCE(opsen_tunggakan_pokok_bbnkb, 0) + 
          COALESCE(denda_swdkllj, 0) + 
          COALESCE(tunggakan_denda_swdkllj, 0)
        ) as tunggakan,
        SUM(COALESCE(pokok_pkb, 0) + COALESCE(opsen_pokok_pkb, 0)) as potensi,
        COALESCE(AVG(CASE WHEN (
          COALESCE(tunggakan_pokok_pkb, 0) + 
          COALESCE(tunggakan_pokok_bbnkb, 0) + 
          COALESCE(opsen_tunggakan_pokok_pkb, 0) + 
          COALESCE(opsen_tunggakan_pokok_bbnkb, 0) + 
          COALESCE(denda_swdkllj, 0) + 
          COALESCE(tunggakan_denda_swdkllj, 0)
        ) > 0 AND masa_pajak_sampai < CURRENT_DATE
        THEN DATE_PART('day', CURRENT_DATE - masa_pajak_sampai)
        END), 0) as keterlambatan
      FROM v_kendaraan_transaksi_clean
      ${whereClause}
      GROUP BY kabupaten
      ORDER BY potensi DESC
    `;

    const res = await query(cityQuery, params);
    return res.rows.map(row => ({
      name: row.name || "N/A",
      pkb: Number(row.pkb || 0) / 1000000,
      tunggakan: Number(row.tunggakan || 0) / 1000000,
      potensi: Number(row.potensi || 0) / 1000000,
      keterlambatan: Math.round(Number(row.keterlambatan || 0)),
      golongan: "All"
    }));
  } catch (error) {
    console.error("Error in getCitySummary:", error);
    throw error;
  }
}

export async function getTransactions(filters: DashboardFilters, page: number = 1): Promise<DetailedData[]> {
  const { whereClause, params } = buildWhereClause(filters);

  const limit = 20;
  const offset = (page - 1) * limit;

  const transQuery = `
    SELECT 
      nopol as id,
      COALESCE(nama_upt, kabupaten) as samsat,
      nopol,
      nama_pemilik as pemilik,
      alamat,
      pokok_pkb as pokok,
      (
        COALESCE(tunggakan_pokok_pkb, 0) + 
        COALESCE(tunggakan_pokok_bbnkb, 0) + 
        COALESCE(opsen_tunggakan_pokok_pkb, 0) + 
        COALESCE(opsen_tunggakan_pokok_bbnkb, 0) + 
        COALESCE(denda_swdkllj, 0) + 
        COALESCE(tunggakan_denda_swdkllj, 0)
      ) as denda,
      opsen_pokok_pkb as opsen,
      CASE WHEN (
        COALESCE(tunggakan_pokok_pkb, 0) + 
        COALESCE(tunggakan_pokok_bbnkb, 0) + 
        COALESCE(opsen_tunggakan_pokok_pkb, 0) + 
        COALESCE(opsen_tunggakan_pokok_bbnkb, 0) + 
        COALESCE(denda_swdkllj, 0) + 
        COALESCE(tunggakan_denda_swdkllj, 0)
      ) > 0 THEN 'Tertunggak' ELSE 'Lunas' END as status,
      COALESCE(tanggal_transaksi, paid_on)::text as date,
      merek,
      tipe,
      tahun_buat::text,
      bahan_bakar,
      jenis_kendaraan,
      warna_plat,
      nomor_mesin,
      nomor_rangka,
      nik,
      no_hp,
      pokok_bbnkb as bbnkb,
      opsen_pokok_bbnkb as opsen_bbnkb,
      pokok_swdkllj as swdkllj,
      denda_swdkllj,
      kecamatan,
      desa_kelurahan,
      kabupaten,
      masa_pajak_sampai::text
    FROM v_kendaraan_transaksi_clean
    ${whereClause}
    ORDER BY COALESCE(tanggal_transaksi, paid_on) DESC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const res = await query(transQuery, params);
  return res.rows.map(row => ({
    ...row,
    pokok: Number(row.pokok),
    denda: Number(row.denda),
    opsen: Number(row.opsen),
    bbnkb: Number(row.bbnkb || 0),
    opsen_bbnkb: Number(row.opsen_bbnkb || 0),
    swdkllj: Number(row.swdkllj || 0),
    denda_swdkllj: Number(row.denda_swdkllj || 0)
  }));
}

export async function getTotalTransactions(filters: DashboardFilters): Promise<number> {
  const { whereClause, params } = buildWhereClause(filters);
  const res = await query(
    `SELECT COUNT(*) as total FROM v_kendaraan_transaksi_clean ${whereClause}`,
    params
  );
  return Number(res.rows[0].total || 0);
}

export async function getKabupatenOptions() {
  const res = await query(`SELECT DISTINCT kabupaten FROM v_kendaraan_transaksi_clean WHERE kabupaten IS NOT NULL ORDER BY kabupaten ASC`);
  return res.rows.map(r => r.kabupaten);
}

export async function getKecamatanOptions(kabupaten: string) {
  if (!kabupaten || kabupaten === 'Semua') return [];
  const res = await query(
    `SELECT DISTINCT kecamatan FROM v_kendaraan_transaksi_clean WHERE kabupaten = $1 AND kecamatan IS NOT NULL ORDER BY kecamatan ASC`,
    [kabupaten]
  );
  return res.rows.map(r => r.kecamatan);
}

export async function getDesaOptions(kecamatan: string) {
  if (!kecamatan || kecamatan === 'Semua') return [];
  const res = await query(
    `SELECT DISTINCT desa_kelurahan FROM v_kendaraan_transaksi_clean WHERE kecamatan = $1 AND desa_kelurahan IS NOT NULL ORDER BY desa_kelurahan ASC`,
    [kecamatan]
  );
  return res.rows.map(r => r.desa_kelurahan);
}

export async function getJenisKendaraanOptions() {
  const res = await query(`SELECT DISTINCT kode_jenis_kendaraan FROM v_kendaraan_transaksi_clean WHERE kode_jenis_kendaraan IS NOT NULL ORDER BY kode_jenis_kendaraan ASC`);
  return res.rows.map(r => r.kode_jenis_kendaraan);
}

export async function getYearOptions() {
  const res = await query(`
    SELECT DISTINCT EXTRACT(YEAR FROM COALESCE(tanggal_transaksi, paid_on))::text as tahun
    FROM v_kendaraan_transaksi_clean
    WHERE COALESCE(tanggal_transaksi, paid_on) IS NOT NULL
    ORDER BY tahun DESC
  `);
  return res.rows.map(r => r.tahun);
}

export async function getGolonganOptions() {
  const res = await query(`
    SELECT DISTINCT warna_plat
    FROM v_kendaraan_transaksi_clean 
    WHERE warna_plat IS NOT NULL AND warna_plat != '' AND warna_plat NOT IN ('1','2')
    ORDER BY warna_plat ASC
  `);
  return res.rows.map(r => r.warna_plat as string);
}

export async function getArrearsByProdYear(filters: DashboardFilters): Promise<ArrearsByYear[]> {
  const { whereClause, params } = buildWhereClause(filters);
  
  // Base query with specific arrears conditions provided by user
  const arrearsQuery = `
    SELECT 
      tahun_buat::text, 
      COUNT(*) as tunggak
    FROM v_kendaraan_transaksi_clean
    ${whereClause}
    AND (
      COALESCE(tunggakan_pokok_pkb, 0) > 0 OR 
      (COALESCE(tunggakan_denda_swdkllj, 0) > 0 AND length(nopol) < 6)
    )
    GROUP BY tahun_buat
    ORDER BY tahun_buat DESC
  `;

  const res = await query(arrearsQuery, params);
  return res.rows.map(row => ({
    tahun_buat: row.tahun_buat || "N/A",
    tunggak: Number(row.tunggak || 0)
  }));
}

export async function getArrearsByLocation(filters: DashboardFilters): Promise<ArrearsByLocation[]> {
  const { whereClause, params } = buildWhereClause(filters);
  
  // Determine grouping based on filter depth
  let groupCol = "kabupaten";
  if (filters.city !== 'Semua') {
    if (filters.kecamatan === 'Semua') {
      groupCol = "kecamatan";
    } else {
      groupCol = "desa_kelurahan";
    }
  }

  const locationQuery = `
    SELECT 
      ${groupCol} as name, 
      COUNT(*) as jumlah_kendaraan
    FROM v_kendaraan_transaksi_clean
    ${whereClause}
    AND (
      COALESCE(tunggakan_pokok_pkb, 0) > 0 OR 
      COALESCE(tunggakan_denda_swdkllj, 0) > 0
    )
    GROUP BY ${groupCol}
    ORDER BY jumlah_kendaraan DESC
    LIMIT 10
  `;

  const res = await query(locationQuery, params);
  return res.rows.map(row => ({
    name: row.name || "TIDAK TERIDENTIFIKASI",
    jumlah_kendaraan: Number(row.jumlah_kendaraan || 0)
  }));
}
