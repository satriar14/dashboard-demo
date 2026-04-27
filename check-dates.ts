import { pool } from './lib/db';

async function checkDates() {
  const { rows } = await pool.query('SELECT paid_on, masa_pajak_sampai FROM v_data_transaksi_kendaraan WHERE paid_on IS NOT NULL LIMIT 5');
  console.log(rows);
  process.exit(0);
}

checkDates();
