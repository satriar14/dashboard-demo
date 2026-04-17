const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function findTables() {
  try {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    console.log('Tables:', res.rows.map(r => r.table_name));
    
    const columns = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'data_kendaraan_pajak' ORDER BY column_name");
    console.log('Columns in data_kendaraan_pajak:');
    columns.rows.forEach(c => console.log(`- ${c.column_name} (${c.data_type})`));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}

findTables();
