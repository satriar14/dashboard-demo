const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    // Test 1: KPI Stats (the most critical query)
    console.log('=== Test 1: KPI Stats ===');
    let start = Date.now();
    const kpi = await pool.query(`
      SELECT 
        SUM(total_potensi_pkb) as total_potensi_pkb_val,
        SUM(total_potensi_swdkllj) as total_potensi_swdkllj_val,
        SUM(total_denda) as total_tunggakan_val,
        AVG(CASE WHEN hari_tunggakan > 0 THEN hari_tunggakan ELSE NULL END) as avg_delay_val,
        COUNT(*) as total_count,
        COUNT(CASE WHEN hari_tunggakan <= 0 THEN 1 END) as patuh_count
      FROM mv_dashboard_kendaraan
    `);
    console.log(`  ✅ ${Date.now() - start}ms`, JSON.stringify(kpi.rows[0]));

    // Test 2: Compliance labels
    console.log('\n=== Test 2: Compliance Labels ===');
    start = Date.now();
    const labels = await pool.query(`
      SELECT COALESCE(segment_perilaku, 'Unlabelled') as name, COUNT(*)::int as value
      FROM mv_dashboard_kendaraan
      GROUP BY name ORDER BY value DESC
    `);
    console.log(`  ✅ ${Date.now() - start}ms`, JSON.stringify(labels.rows));

    // Test 3: Arrears distribution (uses pre-computed kategori_tunggakan)
    console.log('\n=== Test 3: Arrears Distribution ===');
    start = Date.now();
    const dist = await pool.query(`
      SELECT kategori_tunggakan as category, kategori_tunggakan_order as sort_order, COUNT(*)::int as value
      FROM mv_dashboard_kendaraan
      GROUP BY category, sort_order ORDER BY sort_order ASC
    `);
    console.log(`  ✅ ${Date.now() - start}ms`, JSON.stringify(dist.rows));

    // Test 4: Bapenda Summary (uses SQL_POTENSI_BAPENDA formula)
    console.log('\n=== Test 4: Bapenda Summary ===');
    start = Date.now();
    const bapenda = await pool.query(`
      SELECT nama_kabkota as name,
        SUM(
          (pokok_pkb_num + tunggakan_pokok_pkb_num +
           (pokok_pkb_num * CASE WHEN masa_pajak_sampai < CURRENT_DATE 
            THEN LEAST(0.24, (GREATEST(0, (EXTRACT(YEAR FROM age(CURRENT_DATE, masa_pajak_sampai)) * 12 + EXTRACT(MONTH FROM age(CURRENT_DATE, masa_pajak_sampai)))) + 1) * 0.01)
            ELSE 0 END) +
           opsen_pokok_pkb_num) / 1000000
        ) as value
      FROM mv_dashboard_kendaraan
      GROUP BY name ORDER BY value DESC LIMIT 5
    `);
    console.log(`  ✅ ${Date.now() - start}ms`, JSON.stringify(bapenda.rows));

    // Test 5: JR Summary
    console.log('\n=== Test 5: JR Summary ===');
    start = Date.now();
    const jr = await pool.query(`
      SELECT nama_kabkota as name,
        SUM((CASE WHEN kode_jenken = 'B' THEN 35000 WHEN kode_jenken = 'C' THEN 83000 ELSE pokok_swdkllj_num END +
             tunggakan_pokok_swdkllj_num + tunggakan_denda_swdkllj_num) / 1000000) as value
      FROM mv_dashboard_kendaraan
      GROUP BY name ORDER BY value DESC LIMIT 5
    `);
    console.log(`  ✅ ${Date.now() - start}ms`, JSON.stringify(jr.rows));

    // Test 6: Transactions
    console.log('\n=== Test 6: Transactions ===');
    start = Date.now();
    const tx = await pool.query(`
      SELECT nopol, upt_nama, paid_on, masa_pajak_sampai,
        pokok_pkb_num as pokok, total_denda as denda, opsen_pokok_pkb_num as opsen,
        nama_pemilik, nama_kabkota, nama_kec, nama_kel,
        pokok_bbnkb_num as pokok_bbnkb, opsen_pokok_bbnkb_num as opsen_pokok_bbnkb,
        pokok_swdkllj_num as pokok_swdkllj, denda_swdkllj_num as denda_swdkllj
      FROM mv_dashboard_kendaraan
      ORDER BY COALESCE(paid_on::text, masa_pajak_sampai::text) DESC NULLS LAST
      LIMIT 5
    `);
    console.log(`  ✅ ${Date.now() - start}ms rows:`, tx.rows.length);

    // Test 7: Heatmap
    console.log('\n=== Test 7: Heatmap ===');
    start = Date.now();
    const heatmap = await pool.query(`
      SELECT COALESCE(nama_kec, 'N/A') as group_name, nama_kabkota as parent_name,
        MAX(COALESCE(jumlah_penunggak_kecamatan, 0)) as count,
        SUM(total_denda / 1000000) as total_value
      FROM mv_dashboard_kendaraan
      WHERE total_denda > 0
      GROUP BY group_name, parent_name
    `);
    console.log(`  ✅ ${Date.now() - start}ms rows:`, heatmap.rows.length);

    // Test 8: Year Options
    console.log('\n=== Test 8: Year Options ===');
    start = Date.now();
    const years = await pool.query(`
      SELECT DISTINCT tahun_pajak as year FROM mv_dashboard_kendaraan 
      WHERE tahun_pajak IS NOT NULL ORDER BY year DESC
    `);
    console.log(`  ✅ ${Date.now() - start}ms`, years.rows.map(r => r.year));

    // Test 9: Forecast data
    console.log('\n=== Test 9: Forecast ===');
    start = Date.now();
    const forecast = await pool.query(`
      SELECT COALESCE(paid_on::text, masa_pajak_sampai::text) as raw_date,
        SUM(pokok_pkb_num / 1000000) as total_val
      FROM mv_dashboard_kendaraan
      WHERE COALESCE(paid_on::text, masa_pajak_sampai::text) IS NOT NULL
      GROUP BY COALESCE(paid_on::text, masa_pajak_sampai::text)
    `);
    console.log(`  ✅ ${Date.now() - start}ms rows:`, forecast.rows.length);

    // Test 10: Risk time series (total_denda)
    console.log('\n=== Test 10: Risk Time Series ===');
    start = Date.now();
    const risk = await pool.query(`
      SELECT COALESCE(paid_on::text, masa_pajak_sampai::text) as raw_date,
        SUM(total_denda / 1000000) as value
      FROM mv_dashboard_kendaraan
      WHERE COALESCE(paid_on::text, masa_pajak_sampai::text) IS NOT NULL
      GROUP BY raw_date ORDER BY raw_date ASC
    `);
    console.log(`  ✅ ${Date.now() - start}ms rows:`, risk.rows.length);

    console.log('\n✅ ALL TESTS PASSED!');
  } catch(e) {
    console.error('❌ FAILED:', e.message);
  } finally {
    pool.end();
  }
})();
