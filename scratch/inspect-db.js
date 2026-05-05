const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    // List all tables and views
    const tables = await pool.query(
      "SELECT table_name, table_type FROM information_schema.tables WHERE table_schema='public' ORDER BY table_type, table_name"
    );
    console.log('=== TABLES & VIEWS ===');
    tables.rows.forEach(r => console.log(`  ${r.table_type}: ${r.table_name}`));

    // Get view definition
    try {
      const viewDef = await pool.query(
        "SELECT pg_get_viewdef('v_data_transaksi_kendaraan', true) as def"
      );
      console.log('\n=== VIEW DEFINITION: v_data_transaksi_kendaraan ===');
      console.log(viewDef.rows[0].def);
    } catch (e) {
      console.log('\nView v_data_transaksi_kendaraan not found or error:', e.message);
    }

    // Get columns of the view
    const cols = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'v_data_transaksi_kendaraan' ORDER BY ordinal_position"
    );
    console.log('\n=== COLUMNS of v_data_transaksi_kendaraan ===');
    cols.rows.forEach(c => console.log(`  ${c.column_name} (${c.data_type})`));

    // Check row count
    const count = await pool.query("SELECT COUNT(*) FROM v_data_transaksi_kendaraan");
    console.log('\n=== ROW COUNT ===');
    console.log('  Total rows:', count.rows[0].count);

    // Check indexes on base table
    const indexes = await pool.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      ORDER BY tablename, indexname
    `);
    console.log('\n=== INDEXES ===');
    indexes.rows.forEach(r => console.log(`  ${r.indexname}: ${r.indexdef}`));

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    pool.end();
  }
})();
