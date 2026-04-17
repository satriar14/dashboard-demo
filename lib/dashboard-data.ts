import { DetailedData } from './data';
import { pool } from './db';

// Permanent in-memory cache — data is static, parse once and reuse forever
let cachedData: DetailedData[] | null = null;

interface DbRow {
  nomor_polisi: string | null;
  upt_nama: string | null;
  paid_on: string | null;
  masa_pajak_sampai: string | null;
  pokok_pkb: string | null;
  tunggakan_pokok_pkb: string | null;
  pokok_bbnkb: string | null;
  tunggakan_pokok_bbnkb: string | null;
  opsen_pokok_pkb: string | null;
  opsen_tunggakan_pokok_pkb: string | null;
  opsen_pokok_bbnkb: string | null;
  opsen_tunggakan_pokok_bbnkb: string | null;
  pokok_swdkllj: string | null;
  tunggakan_pokok_swdkllj: string | null;
  denda_swdkllj: string | null;
  tunggakan_denda_swdkllj: string | null;
  nama_pemilik: string | null;
  alamat: string | null;
  jenis_kendaraan: string | null;
  merk_kendaraan: string | null;
  tipe_kendaraan: string | null;
  tahun_buat: string | null;
  bbm: string | null;
  warna_plat: string | null;
  nomor_mesin: string | null;
  nomor_rangka: string | null;
  nik: string | null;
  no_hp: string | null;
  nama_kabkota: string | null;
  nama_kec: string | null;
  nama_kel: string | null;
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
        nomor_polisi, upt_nama, paid_on, masa_pajak_sampai,
        pokok_pkb, tunggakan_pokok_pkb, pokok_bbnkb, tunggakan_pokok_bbnkb,
        opsen_pokok_pkb, opsen_tunggakan_pokok_pkb, opsen_pokok_bbnkb, opsen_tunggakan_pokok_bbnkb,
        pokok_swdkllj, tunggakan_pokok_swdkllj, denda_swdkllj, tunggakan_denda_swdkllj,
        nama_pemilik, alamat, jenis_kendaraan, merk_kendaraan, tipe_kendaraan,
        tahun_buat, bbm, warna_plat, nomor_mesin, nomor_rangka, nik, no_hp,
        nama_kabkota, nama_kec, nama_kel
      FROM data_kendaraan_pajak
    `);
    console.timeEnd('[Dashboard] DB Query');

    console.time('[Dashboard] Data mapping');
    const mappedData: DetailedData[] = rows.map((row, i) => {
      const nopol = row.nomor_polisi || '';
      const paidOn = row.paid_on || '';
      const masaPajak = row.masa_pajak_sampai || '';
      const kabupaten = row.nama_kabkota || 'N/A';

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
        alamat: row.alamat || '',
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
