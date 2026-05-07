
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.columns 
      WHERE column_name IN ('durasi_tunggakan_days', 'treatment_kebijakan_amnesti')
      GROUP BY table_name
      HAVING COUNT(DISTINCT column_name) = 2;
    `);
    console.log('Tables/Views with the new columns:');
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkSchema();
