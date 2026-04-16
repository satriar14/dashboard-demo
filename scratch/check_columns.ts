import { Pool } from 'pg';

const pool = new Pool({
  host: '117.53.46.30',
  port: 5440,
  database: 'sigap_kalteng',
  user: 'fpsdev',
  password: 'FPSDev+2024!',
});

async function verifyFilters() {
  try {
    // 1. warna_plat (golongan filter)
    const r1 = await pool.query(`
      SELECT DISTINCT warna_plat, COUNT(*) as cnt
      FROM v_kendaraan_transaksi_clean
      GROUP BY warna_plat ORDER BY cnt DESC
    `);
    console.log('== warna_plat (golongan) ==');
    console.log(JSON.stringify(r1.rows, null, 2));

    // 2. kode_jenis_kendaraan
    const r2 = await pool.query(`
      SELECT DISTINCT kode_jenis_kendaraan, COUNT(*) as cnt
      FROM v_kendaraan_transaksi_clean
      GROUP BY kode_jenis_kendaraan ORDER BY cnt DESC
    `);
    console.log('== kode_jenis_kendaraan ==');
    console.log(JSON.stringify(r2.rows, null, 2));

    // 3. Month distribution via paid_on
    const r3 = await pool.query(`
      SELECT 
        LPAD(EXTRACT(MONTH FROM COALESCE(tanggal_transaksi, paid_on))::text, 2, '0') as bulan,
        COUNT(*) as cnt
      FROM v_kendaraan_transaksi_clean
      GROUP BY 1 ORDER BY 1
    `);
    console.log('== Month distribution (COALESCE) ==');
    console.log(JSON.stringify(r3.rows, null, 2));

    // 4. Test a combined filter: year=2025, month=10
    const r4 = await pool.query(`
      SELECT COUNT(*) as cnt
      FROM v_kendaraan_transaksi_clean
      WHERE EXTRACT(YEAR FROM COALESCE(tanggal_transaksi, paid_on)) = 2025
        AND LPAD(EXTRACT(MONTH FROM COALESCE(tanggal_transaksi, paid_on))::text, 2, '0') = '10'
    `);
    console.log('== Count with year=2025 AND month=10 ==');
    console.log(JSON.stringify(r4.rows[0], null, 2));

    await pool.end();
    process.exit(0);
  } catch (err: any) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
}

verifyFilters();
