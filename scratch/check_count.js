const { Pool } = require('pg');

async function checkCount() {
  const pool = new Pool({
    connectionString: "postgres://fpsdev:FPSDev+2024!@117.53.46.30:5440/sigap_kalteng",
  });

  try {
    const res = await pool.query('SELECT count(*) FROM data_kendaraan_pajak');
    console.log(`Total rows: ${res.rows[0].count}`);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkCount();
