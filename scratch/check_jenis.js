const { Pool } = require('pg');

async function checkJenis() {
  const pool = new Pool({
    connectionString: "postgres://fpsdev:FPSDev+2024!@117.53.46.30:5440/sigap_kalteng",
  });

  try {
    const res = await pool.query(`
      SELECT 
        jenis_kendaraan, tipe, tipe_kendaraan
      FROM data_kendaraan_pajak
      LIMIT 10
    `);
    
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkJenis();
