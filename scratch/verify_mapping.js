const { Pool } = require('pg');

async function verifyRaw() {
  const pool = new Pool({
    connectionString: "postgres://fpsdev:FPSDev+2024!@117.53.46.30:5440/sigap_kalteng",
  });

  try {
    const res = await pool.query(`
      SELECT 
        nomor_polisi, upt_nama, paid_on, masa_pajak_sampai,
        pokok_pkb, tunggakan_pokok_pkb, pokok_bbnkb, tunggakan_pokok_bbnkb,
        opsen_pokok_pkb, opsen_tunggakan_pokok_pkb, opsen_pokok_bbnkb, opsen_tunggakan_pokok_bbnkb,
        pokok_swdkllj, denda_swdkllj, tunggakan_denda_swdkllj,
        nama_pemilik, alamat, jenis_kendaraan, merk_kendaraan, tipe_kendaraan,
        tahun_buat, bbm, warna_plat, nomor_mesin, nomor_rangka, nik, no_hp,
        nama_kabkota, nama_kec, nama_kel
      FROM data_kendaraan_pajak_new
      LIMIT 1
    `);
    
    const row = res.rows[0];
    console.log('Raw Row:', JSON.stringify(row, null, 2));

    const parseNum = (val) => val ? parseFloat(val.replace(/,/g, '')) || 0 : 0;
    
    const mapped = {
      nopol: row.nomor_polisi,
      pokok: parseNum(row.pokok_pkb),
      tunggakan_pkb: parseNum(row.tunggakan_pokok_pkb),
      denda_swdkllj: parseNum(row.denda_swdkllj),
      kabupaten: row.nama_kabkota,
      kecamatan: row.nama_kec
    };
    
    console.log('Mapped Sample:', JSON.stringify(mapped, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

verifyRaw();
