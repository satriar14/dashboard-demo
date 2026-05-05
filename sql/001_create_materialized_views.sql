-- ============================================================================
-- MATERIALIZED VIEWS untuk Dashboard SIGAP Kalteng
-- ============================================================================
-- Tujuan: Mempercepat loading dashboard dari ~10 detik menjadi <1 detik
-- 
-- Masalah saat ini:
--   1. v_data_transaksi_kendaraan adalah regular VIEW dengan complex CTEs, 
--      JOINs, window functions → setiap query harus recompute dari awal
--   2. Semua kolom numerik disimpan sebagai VARCHAR, sehingga setiap query
--      harus melakukan CAST dan REPLACE berulang kali
--   3. Dashboard menjalankan 10+ query ke view ini secara berturutan
--
-- Solusi: 
--   1. MATERIALIZED VIEW utama yang pre-compute semua kolom numerik
--   2. MATERIALIZED VIEW summary untuk KPI stats (agregasi siap pakai)
--   3. Indexes pada kolom filter yang sering digunakan
-- ============================================================================

-- ============================================================================
-- STEP 1: Materialized View utama - pre-compute semua data
-- ============================================================================
-- View ini menggantikan v_data_transaksi_kendaraan untuk semua query dashboard.
-- Kolom numerik sudah di-cast ke NUMERIC, tidak perlu REPLACE/CAST lagi.
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_kendaraan CASCADE;

CREATE MATERIALIZED VIEW mv_dashboard_kendaraan AS
SELECT
    -- Identifikasi
    source_name,
    nopol,
    paid_on,
    masa_pajak_mulai,
    masa_pajak_sampai_raw,
    masa_pajak_sampai,
    
    -- Wilayah
    kabupaten_id,
    nama_kabupaten,
    nama_kabkota,
    nama_kec,
    nama_kel,
    upt_id,
    upt_nama,
    
    -- Detail Kendaraan
    jenis_kendaraan,
    merk_kendaraan,
    tipe_kendaraan,
    cc,
    nomor_rangka,
    nomor_mesin,
    tahun_buat,
    warna_plat,
    warna_plat_id,
    bbm,
    fungsi_id,
    fungsi,
    kode,
    kode_jenken,
    
    -- Pemilik
    nama_pemilik,
    nik,
    no_hp,
    
    -- ========================================
    -- Kolom Numerik (pre-computed dari VARCHAR)
    -- ========================================
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
    
    -- ========================================
    -- Kolom Turunan (pre-computed)
    -- ========================================
    
    -- Total Potensi PKB (untuk KPI card)
    (COALESCE(NULLIF(REPLACE(pokok_pkb, ',', ''), '')::numeric, 0) +
     COALESCE(NULLIF(REPLACE(pokok_bbnkb, ',', ''), '')::numeric, 0) +
     COALESCE(NULLIF(REPLACE(tunggakan_pokok_pkb, ',', ''), '')::numeric, 0) +
     COALESCE(NULLIF(REPLACE(tunggakan_pokok_bbnkb, ',', ''), '')::numeric, 0) +
     COALESCE(NULLIF(REPLACE(opsen_pokok_pkb, ',', ''), '')::numeric, 0) +
     COALESCE(NULLIF(REPLACE(opsen_tunggakan_pokok_pkb, ',', ''), '')::numeric, 0) +
     COALESCE(NULLIF(REPLACE(opsen_pokok_bbnkb, ',', ''), '')::numeric, 0) +
     COALESCE(NULLIF(REPLACE(opsen_tunggakan_pokok_bbnkb, ',', ''), '')::numeric, 0)
    ) AS total_potensi_pkb,
    
    -- Total Potensi SWDKLLJ (untuk KPI card)
    (COALESCE(NULLIF(REPLACE(pokok_swdkllj, ',', ''), '')::numeric, 0) +
     COALESCE(NULLIF(REPLACE(tunggakan_pokok_swdkllj, ',', ''), '')::numeric, 0) +
     COALESCE(NULLIF(REPLACE(denda_swdkllj, ',', ''), '')::numeric, 0) +
     COALESCE(NULLIF(REPLACE(tunggakan_denda_swdkllj, ',', ''), '')::numeric, 0)
    ) AS total_potensi_swdkllj,
    
    -- Total Tunggakan/Denda (untuk KPI card & chart tunggakan)
    (COALESCE(NULLIF(REPLACE(tunggakan_pokok_pkb, ',', ''), '')::numeric, 0) +
     COALESCE(NULLIF(REPLACE(tunggakan_pokok_bbnkb, ',', ''), '')::numeric, 0) +
     COALESCE(NULLIF(REPLACE(opsen_tunggakan_pokok_pkb, ',', ''), '')::numeric, 0) +
     COALESCE(NULLIF(REPLACE(opsen_tunggakan_pokok_bbnkb, ',', ''), '')::numeric, 0) +
     COALESCE(NULLIF(REPLACE(tunggakan_pokok_swdkllj, ',', ''), '')::numeric, 0) +
     COALESCE(NULLIF(REPLACE(denda_swdkllj, ',', ''), '')::numeric, 0) +
     COALESCE(NULLIF(REPLACE(tunggakan_denda_swdkllj, ',', ''), '')::numeric, 0)
    ) AS total_denda,
    
    -- Hari tunggakan & turunan dari view asli
    hari_tunggakan,
    jumlah_penunggak_kecamatan,
    rata_tunggakan_kecamatan,
    
    -- AI/ML Fields
    segment,
    ai_recommendation,
    segment_wilayah,
    segment_perilaku,
    strategi_perilaku,
    
    -- Pre-computed date parts untuk filter cepat
    LEFT(COALESCE(paid_on::text, masa_pajak_sampai::text), 4) AS tahun_pajak,
    SUBSTRING(COALESCE(paid_on::text, masa_pajak_sampai::text), 6, 2) AS bulan_pajak,
    SUBSTRING(COALESCE(paid_on::text, masa_pajak_sampai::text), 9, 2) AS hari_pajak,
    
    -- Distribusi kategori hari tunggakan (pre-computed untuk chart)
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

FROM v_data_transaksi_kendaraan;


-- ============================================================================
-- STEP 2: Indexes untuk filter yang sering digunakan dashboard
-- ============================================================================

-- Filter lokasi (paling sering digunakan)
CREATE INDEX idx_mv_dashboard_kabkota ON mv_dashboard_kendaraan (nama_kabkota);
CREATE INDEX idx_mv_dashboard_kec ON mv_dashboard_kendaraan (nama_kec);
CREATE INDEX idx_mv_dashboard_kel ON mv_dashboard_kendaraan (nama_kel);

-- Filter kendaraan
CREATE INDEX idx_mv_dashboard_jenis ON mv_dashboard_kendaraan (jenis_kendaraan);
CREATE INDEX idx_mv_dashboard_warna_plat ON mv_dashboard_kendaraan (warna_plat);

-- Filter waktu (pre-computed)
CREATE INDEX idx_mv_dashboard_tahun ON mv_dashboard_kendaraan (tahun_pajak);
CREATE INDEX idx_mv_dashboard_bulan ON mv_dashboard_kendaraan (tahun_pajak, bulan_pajak);

-- Filter tunggakan  
CREATE INDEX idx_mv_dashboard_tunggakan ON mv_dashboard_kendaraan (total_denda) WHERE total_denda > 0;
CREATE INDEX idx_mv_dashboard_hari_tunggakan ON mv_dashboard_kendaraan (hari_tunggakan);

-- Search (nopol, nama_pemilik)
CREATE INDEX idx_mv_dashboard_nopol ON mv_dashboard_kendaraan (nopol);
CREATE INDEX idx_mv_dashboard_nopol_lower ON mv_dashboard_kendaraan (LOWER(nopol));
CREATE INDEX idx_mv_dashboard_pemilik_lower ON mv_dashboard_kendaraan (LOWER(nama_pemilik));

-- Segment/AI fields
CREATE INDEX idx_mv_dashboard_segment_perilaku ON mv_dashboard_kendaraan (segment_perilaku);

-- Tahun buat (untuk chart arrears by production year)
CREATE INDEX idx_mv_dashboard_tahun_buat ON mv_dashboard_kendaraan (tahun_buat);

-- Composite index untuk query summary per kecamatan (sangat sering)
CREATE INDEX idx_mv_dashboard_kabkota_kec ON mv_dashboard_kendaraan (nama_kabkota, nama_kec);


-- ============================================================================
-- STEP 3: Materialized View untuk KPI Summary
-- ============================================================================
-- Pre-aggregated stats untuk 5 KPI card di dashboard.
-- Query ke view ini akan instant (<10ms) karena hasilnya sudah diagregasi.
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_kpi_summary CASCADE;

CREATE MATERIALIZED VIEW mv_dashboard_kpi_summary AS
SELECT
    -- Dimensi filter (untuk di-filter oleh dashboard)
    COALESCE(nama_kabkota, 'ALL') AS nama_kabkota,
    COALESCE(nama_kec, 'ALL') AS nama_kec,
    COALESCE(nama_kel, 'ALL') AS nama_kel,
    COALESCE(jenis_kendaraan, 'ALL') AS jenis_kendaraan,
    COALESCE(warna_plat, 'ALL') AS warna_plat,
    COALESCE(tahun_pajak, 'ALL') AS tahun_pajak,
    COALESCE(bulan_pajak, 'ALL') AS bulan_pajak,
    
    -- KPI Values
    SUM(total_potensi_pkb) AS total_potensi_pkb,
    SUM(total_potensi_swdkllj) AS total_potensi_swdkllj,
    SUM(total_denda) AS total_tunggakan,
    AVG(CASE WHEN hari_tunggakan > 0 THEN hari_tunggakan ELSE NULL END) AS avg_delay,
    COUNT(*) AS total_count,
    COUNT(CASE WHEN hari_tunggakan <= 0 THEN 1 END) AS patuh_count
    
FROM mv_dashboard_kendaraan
GROUP BY GROUPING SETS (
    -- Grand total (tanpa filter)
    (),
    -- Per kabupaten/kota
    (nama_kabkota),
    -- Per kabupaten + kecamatan
    (nama_kabkota, nama_kec),
    -- Per kabupaten + kecamatan + kelurahan 
    (nama_kabkota, nama_kec, nama_kel),
    -- Per tahun
    (tahun_pajak),
    -- Per kabupaten + tahun
    (nama_kabkota, tahun_pajak),
    -- Per jenis kendaraan
    (jenis_kendaraan),
    -- Per warna plat (golongan)
    (warna_plat)
);

CREATE INDEX idx_mv_kpi_kabkota ON mv_dashboard_kpi_summary (nama_kabkota);
CREATE INDEX idx_mv_kpi_kec ON mv_dashboard_kpi_summary (nama_kabkota, nama_kec);
CREATE INDEX idx_mv_kpi_tahun ON mv_dashboard_kpi_summary (tahun_pajak);
CREATE INDEX idx_mv_kpi_composite ON mv_dashboard_kpi_summary (nama_kabkota, nama_kec, nama_kel, tahun_pajak, warna_plat);


-- ============================================================================
-- STEP 4: Materialized View untuk Summary per Kecamatan (Chart)
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_summary_kecamatan CASCADE;

CREATE MATERIALIZED VIEW mv_dashboard_summary_kecamatan AS
SELECT
    COALESCE(nama_kabkota, 'ALL') AS nama_kabkota,
    COALESCE(nama_kec, 'N/A') AS nama_kec,
    COALESCE(tahun_pajak, 'ALL') AS tahun_pajak,
    COALESCE(warna_plat, 'ALL') AS warna_plat,
    
    SUM(pokok_pkb_num / 1000000) AS pkb_juta,
    SUM(total_denda / 1000000) AS tunggakan_juta,
    SUM((pokok_pkb_num + opsen_pokok_pkb_num) / 1000000) AS potensi_juta,
    AVG(CASE WHEN hari_tunggakan > 0 THEN hari_tunggakan ELSE NULL END) AS avg_delay,
    COUNT(*) AS total_kendaraan

FROM mv_dashboard_kendaraan
GROUP BY GROUPING SETS (
    (nama_kabkota, nama_kec),
    (nama_kabkota, nama_kec, tahun_pajak),
    (nama_kabkota, nama_kec, warna_plat)
);

CREATE INDEX idx_mv_sum_kec_kabkota ON mv_dashboard_summary_kecamatan (nama_kabkota);


-- ============================================================================
-- STEP 5: Materialized View untuk Distribusi Tunggakan (Chart)
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_arrears_dist CASCADE;

CREATE MATERIALIZED VIEW mv_dashboard_arrears_dist AS
SELECT
    COALESCE(nama_kabkota, 'ALL') AS nama_kabkota,
    COALESCE(nama_kec, 'ALL') AS nama_kec,
    COALESCE(tahun_pajak, 'ALL') AS tahun_pajak,
    COALESCE(warna_plat, 'ALL') AS warna_plat,
    kategori_tunggakan AS category,
    kategori_tunggakan_order AS sort_order,
    COUNT(*)::int AS value

FROM mv_dashboard_kendaraan
GROUP BY GROUPING SETS (
    (kategori_tunggakan, kategori_tunggakan_order),
    (nama_kabkota, kategori_tunggakan, kategori_tunggakan_order),
    (nama_kabkota, nama_kec, kategori_tunggakan, kategori_tunggakan_order)
)
ORDER BY kategori_tunggakan_order;

CREATE INDEX idx_mv_arrears_kabkota ON mv_dashboard_arrears_dist (nama_kabkota);


-- ============================================================================
-- STEP 6: Materialized View untuk Compliance Distribution (Pie Chart)
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_compliance CASCADE;

CREATE MATERIALIZED VIEW mv_dashboard_compliance AS
SELECT
    COALESCE(nama_kabkota, 'ALL') AS nama_kabkota,
    COALESCE(nama_kec, 'ALL') AS nama_kec,
    COALESCE(tahun_pajak, 'ALL') AS tahun_pajak,
    COALESCE(warna_plat, 'ALL') AS warna_plat,
    COALESCE(segment_perilaku, 'Unlabelled') AS name,
    COUNT(*)::int AS value

FROM mv_dashboard_kendaraan
GROUP BY GROUPING SETS (
    (segment_perilaku),
    (nama_kabkota, segment_perilaku),
    (nama_kabkota, nama_kec, segment_perilaku)
)
ORDER BY value DESC;

CREATE INDEX idx_mv_compliance_kabkota ON mv_dashboard_compliance (nama_kabkota);


-- ============================================================================
-- STEP 7: Fungsi untuk refresh semua materialized views
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_dashboard_views()
RETURNS void AS $$
BEGIN
    RAISE NOTICE 'Refreshing mv_dashboard_kendaraan...';
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_kendaraan;
    
    RAISE NOTICE 'Refreshing mv_dashboard_kpi_summary...';
    REFRESH MATERIALIZED VIEW mv_dashboard_kpi_summary;
    
    RAISE NOTICE 'Refreshing mv_dashboard_summary_kecamatan...';
    REFRESH MATERIALIZED VIEW mv_dashboard_summary_kecamatan;
    
    RAISE NOTICE 'Refreshing mv_dashboard_arrears_dist...';
    REFRESH MATERIALIZED VIEW mv_dashboard_arrears_dist;
    
    RAISE NOTICE 'Refreshing mv_dashboard_compliance...';
    REFRESH MATERIALIZED VIEW mv_dashboard_compliance;
    
    RAISE NOTICE 'All dashboard views refreshed successfully!';
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- STEP 8: Unique index untuk CONCURRENTLY refresh pada view utama
-- ============================================================================
-- Diperlukan agar REFRESH MATERIALIZED VIEW CONCURRENTLY bisa berjalan
-- (tidak block read saat refresh)

CREATE UNIQUE INDEX idx_mv_dashboard_unique ON mv_dashboard_kendaraan (nopol, COALESCE(paid_on, ''), COALESCE(masa_pajak_sampai::text, ''));


-- ============================================================================
-- Cara Penggunaan:
-- ============================================================================
-- 
-- 1. Jalankan SQL ini sekali untuk membuat semua materialized views
--    (waktu pembuatan ~30-60 detik tergantung server)
--
-- 2. Dashboard akan query ke mv_dashboard_kendaraan (bukan v_data_transaksi_kendaraan)
--
-- 3. Untuk refresh data (misal setiap malam / setiap ada data baru):
--    SELECT refresh_dashboard_views();
--    
--    Atau refresh individual:
--    REFRESH MATERIALIZED VIEW mv_dashboard_kendaraan;
--    REFRESH MATERIALIZED VIEW mv_dashboard_kpi_summary;
--
-- 4. Estimasi peningkatan performa:
--    - KPI Stats: ~10 detik → <100ms
--    - City Summary: ~8 detik → <200ms 
--    - Heatmap: ~12 detik → <500ms
--    - Transaction list: ~6 detik → <300ms
-- ============================================================================
