import { DetailedData } from './data';
import { serialQuery } from './db';

// Permanent in-memory cache — data is static, parse once and reuse forever
let cachedData: DetailedData[] | null = null;

interface DbRow {
  // Identifikasi Kendaraan
  nopol: string | null;
  id_layanan: string | null;
  nama_layanan: string | null;
  // Wilayah
  kabupaten_id: string | null;
  nama_kabupaten: string | null;
  upt_id: string | null;
  upt_nama: string | null;
  // Tanggal
  paid_on: string | null;
  masa_pajak_mulai: string | null;
  masa_pajak_sampai: string | null;
  // Pajak PKB
  pokok_pkb: string | null;
  tunggakan_pokok_pkb: string | null;
  // Pajak BBNKB
  pokok_bbnkb: string | null;
  tunggakan_pokok_bbnkb: string | null;
  // Opsen PKB
  opsen_pokok_pkb: string | null;
  opsen_tunggakan_pokok_pkb: string | null;
  // Opsen BBNKB
  opsen_pokok_bbnkb: string | null;
  opsen_tunggakan_pokok_bbnkb: string | null;
  // SWDKLLJ
  pokok_swdkllj: string | null;
  tunggakan_pokok_swdkllj: string | null;
  denda_swdkllj: string | null;
  tunggakan_denda_swdkllj: string | null;
  // Pre-computed total
  total_denda: string | null;
  // Detail Kendaraan
  kode_jenken: string | null;
  jenis_kendaraan: string | null;
  merk_kendaraan: string | null;
  tipe_kendaraan: string | null;
  cc: string | null;
  nomor_rangka: string | null;
  nomor_mesin: string | null;
  bbm: string | null;
  tahun_buat: string | null;
  warna_plat_id: string | null;
  warna_plat: string | null;
  fungsi_id: string | null;
  fungsi: string | null;
  // Pemilik
  nama_pemilik: string | null;
  nik: string | null;
  no_hp: string | null;
  // Alamat
  nama_kabkota: string | null;
  nama_kec: string | null;
  nama_kel: string | null;
  // AI Fields
  ai_recommendation: string | null;
  segment_perilaku: string | null;
  strategi_perilaku: string | null;
}

export async function getDashboardData(): Promise<DetailedData[]> {
  // Return cached data if available (permanent cache for static data)
  if (cachedData) {
    return cachedData;
  }

  try {
    console.time('[Dashboard] DB Query');
    const { rows } = await serialQuery<DbRow>(`
      SELECT 
        nopol, id_layanan, nama_layanan,
        kabupaten_id, nama_kabupaten, upt_id, upt_nama,
        paid_on, masa_pajak_mulai, masa_pajak_sampai,
        pokok_pkb_num as pokok_pkb, tunggakan_pokok_pkb_num as tunggakan_pokok_pkb, 
        pokok_bbnkb_num as pokok_bbnkb, tunggakan_pokok_bbnkb_num as tunggakan_pokok_bbnkb,
        opsen_pokok_pkb_num as opsen_pokok_pkb, opsen_tunggakan_pokok_pkb_num as opsen_tunggakan_pokok_pkb, 
        opsen_pokok_bbnkb_num as opsen_pokok_bbnkb, opsen_tunggakan_pokok_bbnkb_num as opsen_tunggakan_pokok_bbnkb,
        pokok_swdkllj_num as pokok_swdkllj, tunggakan_pokok_swdkllj_num as tunggakan_pokok_swdkllj, 
        denda_swdkllj_num as denda_swdkllj, tunggakan_denda_swdkllj_num as tunggakan_denda_swdkllj,
        total_denda,
        kode_jenken, jenis_kendaraan, merk_kendaraan, tipe_kendaraan, cc,
        nomor_rangka, nomor_mesin, bbm, tahun_buat,
        warna_plat_id, warna_plat, fungsi_id, fungsi,
        nama_pemilik, nik, no_hp,
        nama_kabkota, nama_kec, nama_kel,
        ai_recommendation, segment_perilaku, strategi_perilaku
      FROM mv_dashboard_kendaraan
    `);
    console.timeEnd('[Dashboard] DB Query');

    console.time('[Dashboard] Data mapping');
    const mappedData: DetailedData[] = rows.map((row, i) => {
      // nopol is the primary plate number; nomor_polisi is the full formatted one
      const nopol = row.nopol || '';
      const paidOn = row.paid_on || '';
      const masaPajak = row.masa_pajak_sampai || '';
      const kabupaten = row.nama_kabkota || row.nama_kabupaten || 'N/A';

      // MV columns are already numeric, just parse them
      const parseNum = (val: string | null) => val ? parseFloat(String(val).replace(/,/g, '')) || 0 : 0;

      // Use pre-computed total_denda from MV
      const dendaTotal = parseFloat(String(row.total_denda || 0));

      return {
        id: (nopol || 'ID') + '-' + i,
        samsat: row.upt_nama || kabupaten,
        nopol,
        pemilik: row.nama_pemilik || '',
        alamat: [row.nama_kel, row.nama_kec, kabupaten].filter(Boolean).join(', '),
        pokok: parseNum(row.pokok_pkb),
        denda: dendaTotal,
        opsen: parseNum(row.opsen_pokok_pkb),
        status: dendaTotal > 0 ? 'Tertunggak' : 'Lunas',
        date: paidOn || masaPajak,

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
        bbnkb: parseNum(row.pokok_bbnkb),
        opsen_bbnkb: parseNum(row.opsen_pokok_bbnkb),
        swdkllj: parseNum(row.pokok_swdkllj),
        denda_swdkllj: parseNum(row.denda_swdkllj),

        // Detail Alamat
        kecamatan: row.nama_kec || '',
        desa_kelurahan: row.nama_kel || '',
        kabupaten,
        masa_pajak_sampai: masaPajak,

        // AI Fields
        ai_reminder: row.ai_recommendation || '',
        customer_labelling: row.segment_perilaku || '',
        next_best_action: row.strategi_perilaku || '',
      };
    });
    console.timeEnd('[Dashboard] Data mapping');

    cachedData = mappedData;
    console.log(`[Dashboard] Loaded ${mappedData.length} records from database`);
    return mappedData;
  } catch (error: any) {
    console.error("Error in getDashboardData:", error);
    throw error;
  }
}
