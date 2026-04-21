const { Pool } = require('pg');

async function benchmark() {
  const pool = new Pool({
    connectionString: "postgres://fpsdev:FPSDev+2024!@117.53.46.30:5440/sigap_kalteng",
  });

  try {
    console.time('Full Fetch (approx)');
    const resAll = await pool.query('SELECT * FROM data_kendaraan_pajak_new LIMIT 10000'); // only 10k for test
    console.timeEnd('Full Fetch (approx)');

    console.time('SQL Aggregation (Stats)');
    const resStats = await pool.query(`
      SELECT 
        SUM(NULLIF(pokok_pkb, '')::numeric) as total_pokok,
        SUM(NULLIF(opsen_pokok_pkb, '')::numeric) as total_opsen,
        SUM(
          COALESCE(NULLIF(tunggakan_pokok_pkb, '')::numeric, 0) +
          COALESCE(NULLIF(tunggakan_pokok_bbnkb, '')::numeric, 0) +
          COALESCE(NULLIF(opsen_tunggakan_pokok_pkb, '')::numeric, 0) +
          COALESCE(NULLIF(opsen_tunggakan_pokok_bbnkb, '')::numeric, 0) +
          COALESCE(NULLIF(tunggakan_pokok_swdkllj, '')::numeric, 0) +
          COALESCE(NULLIF(denda_swdkllj, '')::numeric, 0) +
          COALESCE(NULLIF(tunggakan_denda_swdkllj, '')::numeric, 0)
        ) as total_denda
      FROM data_kendaraan_pajak_new
    `);
    console.timeEnd('SQL Aggregation (Stats)');
    console.log('Stats Result:', resStats.rows[0]);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

benchmark();
