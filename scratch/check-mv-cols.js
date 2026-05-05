const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    // Check MV columns
    const cols = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'mv_dashboard_kendaraan' ORDER BY ordinal_position"
    );
    console.log('=== MV Columns ===');
    cols.rows.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));

    // Test the queries that are likely failing
    console.log('\n=== Testing Bapenda query (uses SQL_POTENSI_BAPENDA) ===');
    try {
      await pool.query("SELECT pokok_pkb FROM mv_dashboard_kendaraan LIMIT 1");
      console.log('  pokok_pkb: EXISTS');
    } catch(e) {
      console.log('  pokok_pkb: MISSING -', e.message);
    }

    // Check if dashboard-data columns exist
    const testCols = ['pokok_pkb', 'tunggakan_pokok_pkb', 'pokok_bbnkb', 'opsen_pokok_pkb', 
                       'pokok_swdkllj', 'denda_swdkllj', 'tunggakan_denda_swdkllj',
                       'pokok_pkb_num', 'total_denda', 'total_potensi_pkb'];
    console.log('\n=== Column existence test ===');
    for (const col of testCols) {
      try {
        await pool.query(`SELECT ${col} FROM mv_dashboard_kendaraan LIMIT 1`);
        console.log(`  ${col}: ✅ EXISTS`);
      } catch(e) {
        console.log(`  ${col}: ❌ MISSING`);
      }
    }
  } catch(e) {
    console.error(e.message);
  } finally {
    pool.end();
  }
})();
