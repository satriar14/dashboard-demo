import { getPaymentHeatmapData } from './lib/api-actions';
import { pool } from './lib/db';

async function test() {
  const filters = {
    city: 'Semua',
    year: 'Semua',
    month: 'Semua',
    day: 'Semua',
    golongan: 'Semua',
    search: '',
    kecamatan: 'Semua',
    desa: 'Semua',
    jenis: 'Semua'
  };
  
  const data = await getPaymentHeatmapData(filters);
  console.log(data);
  process.exit(0);
}

test();
