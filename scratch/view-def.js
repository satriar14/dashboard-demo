const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const viewDef = await pool.query(
      "SELECT pg_get_viewdef('v_data_transaksi_kendaraan', true) as def"
    );
    fs.writeFileSync('scratch/view-definition.sql', viewDef.rows[0].def);
    console.log('Written to scratch/view-definition.sql');
    console.log('Length:', viewDef.rows[0].def.length, 'chars');

    // Also check query execution time for KPI stats query
    console.log('\n=== TIMING: KPI Stats Query ===');
    const start = Date.now();
    await pool.query(`
      SELECT 
        SUM(COALESCE(NULLIF(REPLACE(pokok_pkb, ',', ''), '')::numeric, 0) +
            COALESCE(NULLIF(REPLACE(pokok_bbnkb, ',', ''), '')::numeric, 0) +
            COALESCE(NULLIF(REPLACE(tunggakan_pokok_pkb, ',', ''), '')::numeric, 0) +
            COALESCE(NULLIF(REPLACE(tunggakan_pokok_bbnkb, ',', ''), '')::numeric, 0) +
            COALESCE(NULLIF(REPLACE(opsen_pokok_pkb, ',', ''), '')::numeric, 0) +
            COALESCE(NULLIF(REPLACE(opsen_tunggakan_pokok_pkb, ',', ''), '')::numeric, 0) +
            COALESCE(NULLIF(REPLACE(opsen_pokok_bbnkb, ',', ''), '')::numeric, 0) +
            COALESCE(NULLIF(REPLACE(opsen_tunggakan_pokok_bbnkb, ',', ''), '')::numeric, 0)
        ) as total_potensi_pkb_val,
        SUM(COALESCE(NULLIF(REPLACE(pokok_swdkllj, ',', ''), '')::numeric, 0) +
            COALESCE(NULLIF(REPLACE(tunggakan_pokok_swdkllj, ',', ''), '')::numeric, 0) +
            COALESCE(NULLIF(REPLACE(denda_swdkllj, ',', ''), '')::numeric, 0) +
            COALESCE(NULLIF(REPLACE(tunggakan_denda_swdkllj, ',', ''), '')::numeric, 0)
        ) as total_potensi_swdkllj_val,
        SUM(COALESCE(NULLIF(REPLACE(tunggakan_pokok_pkb, ',', ''), '')::numeric, 0) +
            COALESCE(NULLIF(REPLACE(tunggakan_pokok_bbnkb, ',', ''), '')::numeric, 0) +
            COALESCE(NULLIF(REPLACE(opsen_tunggakan_pokok_pkb, ',', ''), '')::numeric, 0) +
            COALESCE(NULLIF(REPLACE(opsen_tunggakan_pokok_bbnkb, ',', ''), '')::numeric, 0) +
            COALESCE(NULLIF(REPLACE(tunggakan_pokok_swdkllj, ',', ''), '')::numeric, 0) +
            COALESCE(NULLIF(REPLACE(denda_swdkllj, ',', ''), '')::numeric, 0) +
            COALESCE(NULLIF(REPLACE(tunggakan_denda_swdkllj, ',', ''), '')::numeric, 0)
        ) as total_tunggakan_val,
        AVG(CASE WHEN hari_tunggakan > 0 THEN hari_tunggakan ELSE NULL END) as avg_delay_val,
        COUNT(*) as total_count,
        COUNT(CASE WHEN hari_tunggakan <= 0 THEN 1 END) as patuh_count
      FROM v_data_transaksi_kendaraan
    `);
    console.log('KPI Stats query took:', Date.now() - start, 'ms');

    // Time a simple count
    const start2 = Date.now();
    await pool.query('SELECT COUNT(*) FROM v_data_transaksi_kendaraan');
    console.log('Simple COUNT(*) took:', Date.now() - start2, 'ms');

    // Check base table
    const start3 = Date.now();
    const baseInfo = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name");
    console.log('\n=== BASE TABLES ===');
    baseInfo.rows.forEach(r => console.log('  ', r.table_name));
    console.log('Base table query took:', Date.now() - start3, 'ms');

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    pool.end();
  }
})();
