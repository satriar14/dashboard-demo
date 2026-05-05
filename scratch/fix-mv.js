const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL, statement_timeout: 120000 });

(async () => {
  const client = await pool.connect();
  try {
    console.log('Dropping old MV...');
    await client.query('DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_kendaraan CASCADE');
    
    console.log('Creating fixed MV with proper date extraction...');
    const start = Date.now();
    
    // paid_on is DD/MM/YYYY HH:MM format (varchar)
    // masa_pajak_sampai is already date type in the original view
    // We need to extract year/month/day from the resolved date
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
        
        -- FIXED: Proper date extraction using resolved date (masa_pajak_sampai is already date, paid_on is varchar)
        -- Use COALESCE of: parsed paid_on date -> masa_pajak_sampai (already date)
        EXTRACT(YEAR FROM COALESCE(
          CASE 
            WHEN paid_on ~ '^\\d{2}/\\d{2}/\\d{4}' THEN to_timestamp(paid_on, 'DD/MM/YYYY HH24:MI')::date
            WHEN paid_on ~ '^\\d{4}-\\d{2}-\\d{2}' THEN to_date(paid_on, 'YYYY-MM-DD')
            ELSE NULL
          END,
          masa_pajak_sampai
        ))::text AS tahun_pajak,
        
        LPAD(EXTRACT(MONTH FROM COALESCE(
          CASE 
            WHEN paid_on ~ '^\\d{2}/\\d{2}/\\d{4}' THEN to_timestamp(paid_on, 'DD/MM/YYYY HH24:MI')::date
            WHEN paid_on ~ '^\\d{4}-\\d{2}-\\d{2}' THEN to_date(paid_on, 'YYYY-MM-DD')
            ELSE NULL
          END,
          masa_pajak_sampai
        ))::text, 2, '0') AS bulan_pajak,
        
        LPAD(EXTRACT(DAY FROM COALESCE(
          CASE 
            WHEN paid_on ~ '^\\d{2}/\\d{2}/\\d{4}' THEN to_timestamp(paid_on, 'DD/MM/YYYY HH24:MI')::date
            WHEN paid_on ~ '^\\d{4}-\\d{2}-\\d{2}' THEN to_date(paid_on, 'YYYY-MM-DD')
            ELSE NULL
          END,
          masa_pajak_sampai
        ))::text, 2, '0') AS hari_pajak,
        
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
    console.log(`MV created in ${Date.now() - start}ms`);

    // Create indexes
    console.log('Creating indexes...');
    const idxStart = Date.now();
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
    for (const idx of indexes) await client.query(idx);
    console.log(`Indexes created in ${Date.now() - idxStart}ms`);

    // Verify date extraction
    const check = await client.query(`
      SELECT DISTINCT tahun_pajak as year 
      FROM mv_dashboard_kendaraan 
      WHERE tahun_pajak IS NOT NULL 
      ORDER BY year DESC LIMIT 10
    `);
    console.log('\nYear options:', check.rows.map(r => r.year));

    const count = await client.query('SELECT COUNT(*) FROM mv_dashboard_kendaraan');
    console.log('Row count:', count.rows[0].count);

    console.log('\n✅ MV recreated successfully!');
  } catch(e) {
    console.error('❌ Error:', e.message);
  } finally {
    client.release();
    pool.end();
  }
})();
