const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function inspect() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'v_data_transaksi_kendaraan'
      ORDER BY ordinal_position
    `);
    console.log('Columns in v_data_transaksi_kendaraan:');
    res.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });

    const res2 = await pool.query(`
      SELECT hari_tunggakan FROM v_data_transaksi_kendaraan LIMIT 5
    `).catch(e => ({ error: e.message }));
    
    if (res2.error) {
      console.log('hari_tunggakan column check:', res2.error);
    } else {
      console.log('hari_tunggakan column exists. Sample data:', res2.rows);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

inspect();
