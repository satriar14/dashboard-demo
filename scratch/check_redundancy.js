const { Pool } = require('pg');

async function checkPopulated() {
  const pool = new Pool({
    connectionString: "postgres://fpsdev:FPSDev+2024!@117.53.46.30:5440/sigap_kalteng",
  });

  try {
    const res = await pool.query(`
      SELECT 
        nopol, nomor_polisi,
        merk_kendaraan, merek_kendaraan,
        tipe, tipe_1, tipe_kendaraan,
        bbm, bahan_bakar,
        tahun_buat, thn_buat,
        kecamatan, nama_kec
      FROM data_kendaraan_pajak_new
      LIMIT 10
    `);
    
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkPopulated();
