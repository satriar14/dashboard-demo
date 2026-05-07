const { Pool } = require('pg');
// In production, we use environment variables set in Vercel UI
// For this local test, we use .env.local
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1, // small pool
  connectionTimeoutMillis: 5000,
});

async function test() {
  console.log('Testing connection to:', process.env.DATABASE_URL?.split('@')[1]);
  try {
    const start = Date.now();
    const res = await pool.query('SELECT COUNT(*) FROM mv_dashboard_kendaraan');
    console.log('Success! Count:', res.rows[0].count);
    console.log('Time:', Date.now() - start, 'ms');
  } catch (err) {
    console.error('Connection failed:', err.message);
    if (err.message.includes('getaddrinfo ENOTFOUND')) {
      console.error('HINT: The DB host is not reachable. Is it a local host or a public IP?');
    }
  } finally {
    await pool.end();
  }
}

test();
