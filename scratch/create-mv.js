const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, statement_timeout: 120000 });

(async () => {
  const client = await pool.connect();
  try {
    console.log('=== Creating Materialized Views ===\n');
    
    // Step 1: Create main materialized view
    console.log('[1/6] Creating mv_dashboard_kendaraan...');
    let start = Date.now();
    
    await client.query('DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_kendaraan CASCADE');
    
    await client.query(`
      CREATE MATERIALIZED VIEW mv_dashboard_kendaraan AS
      SELECT
        source_name, nopol, paid_on, masa_pajak_mulai, masa_pajak_sampai_raw, masa_pajak_sampai,
        kabupaten_id, nama_kabupaten, nama_kabkota, nama_kec, nama_kel, upt_id, upt_nama,
        jenis_kendaraan, merk_kendaraan, tipe_kendaraan, cc, nomor_rangka, nomor_mesin,
        tahun_buat, warna_plat, warna_plat_id, bbm, fungsi_id, fungsi, kode, kode_jenken,
        nama_pemilik, nik, no_hp,
        id_layanan, nama_layanan,
        
        -- Pre-computed numeric columns
        COALESCE(NULLIF(REPLACE(pokok_pkb, ',', ''), '')::numeric, 0) AS pokok_pkb_num,
        COALESCE(NULLIF(REPLACE(pokok_bbnkb, ',', ''), '')::numeric, 0) AS pokok_bbnkb_num,
        COALESCE(NULLIF(REPLACE(tunggakan_pokok_pkb, ',', ''), '')::numeric, 0) AS tunggakan_pokok_pkb_num,
        COALESCE(NULLIF(REPLACE(tunggakan_pokok_bbnkb, ',', ''), '')::numeric, 0) AS tunggakan_pokok_bbnkb_num,
        COALESCE(NULLIF(REPLACE(opsen_pokok_pkb, ',', ''), '')::numeric, 0) AS opsen_pokok_pkb_num,
        COALESCE(NULLIF(REPLACE(opsen_tunggakan_pokok_pkb, ',', ''), '')::numeric, 0) AS opsen_tunggakan_pokok_pkb_num,
        COALESCE(NULLIF(REPLACE(opsen_pokok_bbnkb, ',', ''), '')::numeric, 0) AS opsen_pokok_bbnkb_num,
        COALESCE(NULLIF(REPLACE(opsen_tunggakan_pokok_bbnkb, ',', ''), '')::numeric, 0) AS opsen_tunggakan_pokok_bbnkb_num,
        COALESCE(NULLIF(REPLACE(pokok_swdkllj, ',', ''), '')::numeric, 0) AS pokok_swdkllj_num,
        COALESCE(NULLIF(REPLACE(tunggakan_pokok_swdkllj, ',', ''), '')::numeric, 0) AS tunggakan_pokok_swdkllj_num,
        COALESCE(NULLIF(REPLACE(denda_swdkllj, ',', ''), '')::numeric, 0) AS denda_swdkllj_num,
        COALESCE(NULLIF(REPLACE(tunggakan_denda_swdkllj, ',', ''), '')::numeric, 0) AS tunggakan_denda_swdkllj_num,
        
        -- Pre-computed totals
        (COALESCE(NULLIF(REPLACE(pokok_pkb, ',', ''), '')::numeric, 0) +
         COALESCE(NULLIF(REPLACE(pokok_bbnkb, ',', ''), '')::numeric, 0) +
         COALESCE(NULLIF(REPLACE(tunggakan_pokok_pkb, ',', ''), '')::numeric, 0) +
         COALESCE(NULLIF(REPLACE(tunggakan_pokok_bbnkb, ',', ''), '')::numeric, 0) +
         COALESCE(NULLIF(REPLACE(opsen_pokok_pkb, ',', ''), '')::numeric, 0) +
         COALESCE(NULLIF(REPLACE(opsen_tunggakan_pokok_pkb, ',', ''), '')::numeric, 0) +
         COALESCE(NULLIF(REPLACE(opsen_pokok_bbnkb, ',', ''), '')::numeric, 0) +
         COALESCE(NULLIF(REPLACE(opsen_tunggakan_pokok_bbnkb, ',', ''), '')::numeric, 0)
        ) AS total_potensi_pkb,
        
        (COALESCE(NULLIF(REPLACE(pokok_swdkllj, ',', ''), '')::numeric, 0) +
         COALESCE(NULLIF(REPLACE(tunggakan_pokok_swdkllj, ',', ''), '')::numeric, 0) +
         COALESCE(NULLIF(REPLACE(denda_swdkllj, ',', ''), '')::numeric, 0) +
         COALESCE(NULLIF(REPLACE(tunggakan_denda_swdkllj, ',', ''), '')::numeric, 0)
        ) AS total_potensi_swdkllj,
        
        (COALESCE(NULLIF(REPLACE(tunggakan_pokok_pkb, ',', ''), '')::numeric, 0) +
         COALESCE(NULLIF(REPLACE(tunggakan_pokok_bbnkb, ',', ''), '')::numeric, 0) +
         COALESCE(NULLIF(REPLACE(opsen_tunggakan_pokok_pkb, ',', ''), '')::numeric, 0) +
         COALESCE(NULLIF(REPLACE(opsen_tunggakan_pokok_bbnkb, ',', ''), '')::numeric, 0) +
         COALESCE(NULLIF(REPLACE(tunggakan_pokok_swdkllj, ',', ''), '')::numeric, 0) +
         COALESCE(NULLIF(REPLACE(denda_swdkllj, ',', ''), '')::numeric, 0) +
         COALESCE(NULLIF(REPLACE(tunggakan_denda_swdkllj, ',', ''), '')::numeric, 0)
        ) AS total_denda,
        
        hari_tunggakan,
        jumlah_penunggak_kecamatan,
        rata_tunggakan_kecamatan,
        segment, ai_recommendation, segment_wilayah, segment_perilaku, strategi_perilaku,
        
        -- Pre-computed date parts
        LEFT(COALESCE(paid_on::text, masa_pajak_sampai::text), 4) AS tahun_pajak,
        SUBSTRING(COALESCE(paid_on::text, masa_pajak_sampai::text), 6, 2) AS bulan_pajak,
        SUBSTRING(COALESCE(paid_on::text, masa_pajak_sampai::text), 9, 2) AS hari_pajak,
        
        -- Pre-computed arrears category
        CASE 
            WHEN hari_tunggakan < -90 THEN '> 90 Hari Awal'
            WHEN hari_tunggakan < -30 THEN '31 - 90 Hari Awal'
            WHEN hari_tunggakan < 0 THEN '1 - 30 Hari Awal'
            WHEN hari_tunggakan = 0 THEN 'Tepat Waktu'
            WHEN hari_tunggakan <= 365 THEN '1 Tahun Terlambat'
            WHEN hari_tunggakan <= 730 THEN '2 Tahun Terlambat'
            WHEN hari_tunggakan <= 1095 THEN '3 Tahun Terlambat'
            WHEN hari_tunggakan <= 1460 THEN '4 Tahun Terlambat'
            ELSE '> 4 Tahun Terlambat'
        END AS kategori_tunggakan,
        CASE 
            WHEN hari_tunggakan < -90 THEN 1
            WHEN hari_tunggakan < -30 THEN 2
            WHEN hari_tunggakan < 0 THEN 3
            WHEN hari_tunggakan = 0 THEN 4
            WHEN hari_tunggakan <= 365 THEN 5
            WHEN hari_tunggakan <= 730 THEN 6
            WHEN hari_tunggakan <= 1095 THEN 7
            WHEN hari_tunggakan <= 1460 THEN 8
            ELSE 9
        END AS kategori_tunggakan_order
        
      FROM v_data_transaksi_kendaraan
    `);
    console.log(`  Done in ${Date.now() - start}ms`);
    
    // Step 2: Create indexes
    console.log('[2/6] Creating indexes...');
    start = Date.now();
    
    const indexes = [
      'CREATE INDEX idx_mv_dash_kabkota ON mv_dashboard_kendaraan (nama_kabkota)',
      'CREATE INDEX idx_mv_dash_kec ON mv_dashboard_kendaraan (nama_kec)',
      'CREATE INDEX idx_mv_dash_kel ON mv_dashboard_kendaraan (nama_kel)',
      'CREATE INDEX idx_mv_dash_jenis ON mv_dashboard_kendaraan (jenis_kendaraan)',
      'CREATE INDEX idx_mv_dash_warna_plat ON mv_dashboard_kendaraan (warna_plat)',
      'CREATE INDEX idx_mv_dash_tahun ON mv_dashboard_kendaraan (tahun_pajak)',
      'CREATE INDEX idx_mv_dash_bulan ON mv_dashboard_kendaraan (tahun_pajak, bulan_pajak)',
      'CREATE INDEX idx_mv_dash_tunggakan ON mv_dashboard_kendaraan (total_denda) WHERE total_denda > 0',
      'CREATE INDEX idx_mv_dash_hari_tung ON mv_dashboard_kendaraan (hari_tunggakan)',
      'CREATE INDEX idx_mv_dash_nopol ON mv_dashboard_kendaraan (nopol)',
      'CREATE INDEX idx_mv_dash_nopol_lower ON mv_dashboard_kendaraan (LOWER(nopol))',
      'CREATE INDEX idx_mv_dash_pemilik_lower ON mv_dashboard_kendaraan (LOWER(nama_pemilik))',
      'CREATE INDEX idx_mv_dash_segment ON mv_dashboard_kendaraan (segment_perilaku)',
      'CREATE INDEX idx_mv_dash_tahun_buat ON mv_dashboard_kendaraan (tahun_buat)',
      'CREATE INDEX idx_mv_dash_kabkota_kec ON mv_dashboard_kendaraan (nama_kabkota, nama_kec)',
      'CREATE INDEX idx_mv_dash_paid_on ON mv_dashboard_kendaraan (paid_on)',
    ];
    
    for (const idx of indexes) {
      await client.query(idx);
    }
    console.log(`  Done in ${Date.now() - start}ms (${indexes.length} indexes)`);
    
    // Step 3: Verify
    console.log('[3/6] Verifying...');
    start = Date.now();
    
    const count = await client.query('SELECT COUNT(*) FROM mv_dashboard_kendaraan');
    console.log(`  Row count: ${count.rows[0].count}`);
    
    // Step 4: Benchmark - KPI stats on materialized view
    console.log('[4/6] Benchmarking KPI stats on MV...');
    start = Date.now();
    
    const kpiResult = await client.query(`
      SELECT 
        SUM(total_potensi_pkb) as total_potensi_pkb_val,
        SUM(total_potensi_swdkllj) as total_potensi_swdkllj_val,
        SUM(total_denda) as total_tunggakan_val,
        AVG(CASE WHEN hari_tunggakan > 0 THEN hari_tunggakan ELSE NULL END) as avg_delay_val,
        COUNT(*) as total_count,
        COUNT(CASE WHEN hari_tunggakan <= 0 THEN 1 END) as patuh_count
      FROM mv_dashboard_kendaraan
    `);
    console.log(`  KPI Stats on MV: ${Date.now() - start}ms`);
    console.log('  Results:', JSON.stringify(kpiResult.rows[0], null, 2));
    
    // Step 5: Benchmark - same query on original view
    console.log('[5/6] Benchmarking KPI stats on original view...');
    start = Date.now();
    
    await client.query(`
      SELECT 
        SUM(COALESCE(NULLIF(REPLACE(pokok_pkb, ',', ''), '')::numeric, 0) +
            COALESCE(NULLIF(REPLACE(pokok_bbnkb, ',', ''), '')::numeric, 0) +
            COALESCE(NULLIF(REPLACE(tunggakan_pokok_pkb, ',', ''), '')::numeric, 0) +
            COALESCE(NULLIF(REPLACE(tunggakan_pokok_bbnkb, ',', ''), '')::numeric, 0) +
            COALESCE(NULLIF(REPLACE(opsen_pokok_pkb, ',', ''), '')::numeric, 0) +
            COALESCE(NULLIF(REPLACE(opsen_tunggakan_pokok_pkb, ',', ''), '')::numeric, 0) +
            COALESCE(NULLIF(REPLACE(opsen_pokok_bbnkb, ',', ''), '')::numeric, 0) +
            COALESCE(NULLIF(REPLACE(opsen_tunggakan_pokok_bbnkb, ',', ''), '')::numeric, 0)
        ) as total_potensi_pkb_val
      FROM v_data_transaksi_kendaraan
    `);
    console.log(`  KPI Stats on original VIEW: ${Date.now() - start}ms`);
    
    // Step 6: Show summary
    console.log('\n[6/6] Summary');
    
    const mvSize = await client.query(`
      SELECT pg_size_pretty(pg_total_relation_size('mv_dashboard_kendaraan')) as size
    `);
    console.log(`  MV total size (data + indexes): ${mvSize.rows[0].size}`);
    
    console.log('\n✅ Materialized views created successfully!');
    console.log('   To refresh: REFRESH MATERIALIZED VIEW mv_dashboard_kendaraan;');
    
  } catch (e) {
    console.error('❌ Error:', e.message);
    console.error(e.stack);
  } finally {
    client.release();
    pool.end();
  }
})();
