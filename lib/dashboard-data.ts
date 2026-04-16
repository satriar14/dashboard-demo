import path from 'path';
import fs from 'fs/promises';
import { DetailedData } from './data';

// Simple in-memory cache
let cachedData: DetailedData[] | null = null;
let lastReadTime = 0;
const CACHE_TTL = 30000; // 30 seconds

export async function getDashboardData(): Promise<DetailedData[]> {
  const now = Date.now();
  if (cachedData && (now - lastReadTime < CACHE_TTL)) {
    return cachedData;
  }

  try {
    const filePath = path.join(process.cwd(), 'DATA_PALANGKARAYA.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const rawData: any[] = JSON.parse(fileContent);

    const mappedData = rawData.map((row, index) => {
      // JSON dates are already strings: "2025-10-20 10:34:13"
      const masaPajak = row.masa_pajak_sampai ? row.masa_pajak_sampai.split(' ')[0] : '';
      const paidOn = row.paid_on ? row.paid_on.split(' ')[0] : '';
      
      // Calculate denda total for table display
      const dendaTotal = (
        Number(row.tunggakan_pokok_pkb || 0) +
        Number(row.tunggakan_pokok_bbnkb || 0) +
        Number(row.opsen_tunggakan_pokok_pkb || 0) +
        Number(row.opsen_tunggakan_pokok_bbnkb || 0) +
        Number(row.denda_swdkllj || 0) +
        Number(row.tunggakan_denda_swdkllj || 0)
      );

      return {
        id: (row.nomor_polisi || 'row') + '-' + index,
        samsat: row.upt_nama || row.nama_kabkota || 'N/A',
        nopol: row.nomor_polisi || '',
        pemilik: row.nama_pemilik || '',
        alamat: row.ALAMAT || '',
        pokok: Number(row.pokok_pkb || 0),
        denda: dendaTotal,
        opsen: Number(row.opsen_pokok_pkb || 0),
        status: dendaTotal > 0 ? 'Tertunggak' : 'Lunas',
        date: paidOn || masaPajak,
        
        // Detail Kendaraan
        merek: row.merk_kendaraan,
        tipe: row.tipe_kendaraan,
        tahun_buat: String(row.tahun_buat || ''),
        bahan_bakar: row.bbm,
        jenis_kendaraan: row.jenis_kendaraan,
        warna_plat: row.warna_plat,
        nomor_mesin: row.nomor_mesin,
        nomor_rangka: row.nomor_rangka,
        nik: row.nik,
        no_hp: row.no_hp,
        
        // Detail Pajak Tambahan
        bbnkb: Number(row.pokok_bbnkb || 0),
        opsen_bbnkb: Number(row.opsen_pokok_bbnkb || 0),
        swdkllj: Number(row.pokok_swdkllj || 0),
        denda_swdkllj: Number(row.denda_swdkllj || 0),
        
        // Detail Alamat
        kecamatan: row.nama_kec,
        desa_kelurahan: row.nama_kel,
        kabupaten: row.kabupaten_id,
        masa_pajak_sampai: masaPajak
      } as DetailedData;
    });

    cachedData = mappedData;
    lastReadTime = now;
    return mappedData;
  } catch (error: any) {
    console.error("Error in getDashboardData:", error);
    throw error;
  }
}
