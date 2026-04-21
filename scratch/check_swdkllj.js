const { Pool } = require('pg');

async function checkTunggakanSwdkllj() {
  const pool = new Pool({
    connectionString: "postgres://fpsdev:FPSDev+2024!@117.53.46.30:5440/sigap_kalteng",
  });

  try {
    const res = await pool.query(`
      SELECT 
        pokok_swdkllj, tunggakan_pokok_swdkllj, denda_swdkllj, tunggakan_denda_swdkllj
      FROM data_kendaraan_pajak_new
      WHERE tunggakan_pokok_swdkllj != '0' OR tunggakan_denda_swdkllj != '0'
      LIMIT 10
    `);
    
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkTunggakanSwdkllj();
