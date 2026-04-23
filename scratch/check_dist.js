const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkDist() {
  try {
    const res = await pool.query(`
      SELECT 
        MIN(hari_tunggakan) as min_val,
        MAX(hari_tunggakan) as max_val,
        AVG(hari_tunggakan) as avg_val,
        COUNT(*) as total_count,
        COUNT(CASE WHEN hari_tunggakan < 0 THEN 1 END) as early_count,
        COUNT(CASE WHEN hari_tunggakan = 0 THEN 1 END) as on_time_count,
        COUNT(CASE WHEN hari_tunggakan > 0 THEN 1 END) as late_count
      FROM v_data_transaksi_kendaraan
      WHERE hari_tunggakan IS NOT NULL
    `);
    console.log('Distribution of hari_tunggakan:', res.rows[0]);

    const res2 = await pool.query(`
      SELECT 
        WIDTH_BUCKET(hari_tunggakan, -100, 500, 10) as bucket,
        MIN(hari_tunggakan) as range_start,
        MAX(hari_tunggakan) as range_end,
        COUNT(*) as count
      FROM v_data_transaksi_kendaraan
      WHERE hari_tunggakan IS NOT NULL
      GROUP BY bucket
      ORDER BY bucket
    `);
    console.log('Buckets:', res2.rows);

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkDist();
