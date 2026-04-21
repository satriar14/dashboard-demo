import { DetailedData } from './data';
import { pool } from './db';

// Permanent in-memory cache — data is static, parse once and reuse forever
let cachedData: DetailedData[] | null = null;

interface DbRow {
  // Identifikasi Kendaraan
  nopol: string | null;
  nomor_polisi: string | null;
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
  ai_reminder: string | null;
  customer_labelling: string | null;
  next_best_action: string | null;
}

export async function getDashboardData(): Promise<DetailedData[]> {
  // Return cached data if available (permanent cache for static data)
  if (cachedData) {
    return cachedData;
  }

  try {
    console.time('[Dashboard] DB Query');
    const { rows } = await pool.query<DbRow>(`
      SELECT 
        nopol, nomor_polisi, id_layanan, nama_layanan,
        kabupaten_id, nama_kabupaten, upt_id, upt_nama,
        paid_on, masa_pajak_mulai, masa_pajak_sampai,
        pokok_pkb, tunggakan_pokok_pkb, pokok_bbnkb, tunggakan_pokok_bbnkb,
        opsen_pokok_pkb, opsen_tunggakan_pokok_pkb, opsen_pokok_bbnkb, opsen_tunggakan_pokok_bbnkb,
        pokok_swdkllj, tunggakan_pokok_swdkllj, denda_swdkllj, tunggakan_denda_swdkllj,
        kode_jenken, jenis_kendaraan, merk_kendaraan, tipe_kendaraan, cc,
        nomor_rangka, nomor_mesin, bbm, tahun_buat,
        warna_plat_id, warna_plat, fungsi_id, fungsi,
        nama_pemilik, nik, no_hp,
        nama_kabkota, nama_kec, nama_kel,
        ai_reminder, customer_labelling, next_best_action
      FROM v_data_transaksi_kendaraan
    `);
    console.timeEnd('[Dashboard] DB Query');

    console.time('[Dashboard] Data mapping');
    const mappedData: DetailedData[] = rows.map((row, i) => {
      // nopol is the primary plate number; nomor_polisi is the full formatted one
      const nopol = row.nopol || row.nomor_polisi || '';
      const paidOn = row.paid_on || '';
      const masaPajak = row.masa_pajak_sampai || '';
      const kabupaten = row.nama_kabkota || row.nama_kabupaten || 'N/A';

      // Helper to parse numeric strings
      const parseNum = (val: string | null) => val ? parseFloat(val.replace(/,/g, '')) || 0 : 0;

      const tunggakanPkb = parseNum(row.tunggakan_pokok_pkb);
      const tunggakanBbnkb = parseNum(row.tunggakan_pokok_bbnkb);
      const opsenTunggakanPkb = parseNum(row.opsen_tunggakan_pokok_pkb);
      const opsenTunggakanBbnkb = parseNum(row.opsen_tunggakan_pokok_bbnkb);
      const tunggakanPokokSwdkllj = parseNum(row.tunggakan_pokok_swdkllj);
      const dendaSwdkllj = parseNum(row.denda_swdkllj);
      const tunggakanDendaSwdkllj = parseNum(row.tunggakan_denda_swdkllj);

      // Calculate denda total from all tunggakan + denda fields
      const dendaTotal = (
        tunggakanPkb +
        tunggakanBbnkb +
        opsenTunggakanPkb +
        opsenTunggakanBbnkb +
        tunggakanPokokSwdkllj +
        dendaSwdkllj +
        tunggakanDendaSwdkllj
      );

      return {
        id: (nopol || 'ID') + '-' + i,
        samsat: row.upt_nama || kabupaten,
        nopol,
        pemilik: row.nama_pemilik || '',
        alamat: '',  // tidak ada kolom alamat di view baru; gunakan kec+kel
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
        denda_swdkllj: dendaSwdkllj,

        // Detail Alamat
        kecamatan: row.nama_kec || '',
        desa_kelurahan: row.nama_kel || '',
        kabupaten,
        masa_pajak_sampai: masaPajak,

        // AI Fields
        ai_reminder: row.ai_reminder || '',
        customer_labelling: row.customer_labelling || '',
        next_best_action: row.next_best_action || '',
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
