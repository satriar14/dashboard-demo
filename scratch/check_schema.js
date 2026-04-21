const { Pool } = require('pg');

async function checkSchema() {
  const pool = new Pool({
    connectionString: "postgres://fpsdev:FPSDev+2024!@117.53.46.30:5440/sigap_kalteng",
  });

  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'data_kendaraan_pajak_new'
      ORDER BY ordinal_position;
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkSchema();
