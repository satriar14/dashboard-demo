-- ============================================================================
-- CREATE NEW MATERIALIZED VIEW FROM sftp_source_data
-- ============================================================================

DROP MATERIALIZED VIEW IF EXISTS mv_dashboard_kendaraan_v2 CASCADE;

CREATE MATERIALIZED VIEW mv_dashboard_kendaraan_v2 AS
SELECT
    -- Identifikasi
    nopol,
    vehicle_id,
    batch_id,
    
    -- Tanggal
    tanggal_transaksi AS paid_on,
    sd_notice AS masa_pajak_sampai,
    loaded_at,
    source_period,
    
    -- Wilayah & UPT
    kabupaten_id,
    kode_upt,
    nama_upt,
    kecamatan AS nama_kec,
    kelurahan AS nama_kel,
    alamat,
    
    -- Pemilik
    nama AS nama_pemilik,
    ktp AS nik,
    no_hp,
    has_phone,
    
    -- Detail Kendaraan
    kode_jenken,
    jenis_kendaraan,
    merek_kendaraan,
    tipe AS tipe_kendaraan,
    cyl AS cc,
    rangka AS nomor_rangka,
    mesin AS nomor_mesin,
    bahan_bakar AS bbm,
    thn_buat AS tahun_buat,
    warna_plat,
    kd_guna AS fungsi,
    kd_jrm,
    usia_kendaraan,
    
    -- Pembayaran / Pajak
    est_pkb_per_kendaraan,
    durasi_tunggakan_days,
    has_payment_history,
    
    -- Segmentasi & AI Treatment
    segmen_nama AS segment,
    segmen_kepatuhan AS segment_perilaku,
    segmen_warna,
    treatment_aksi_utama AS ai_recommendation,
    treatment_kanal_utama,
    treatment_kebijakan_amnesti,
    treatment_perkiraan_konversi

FROM sftp_source_data;

-- Indexes for performance
CREATE UNIQUE INDEX idx_mv_v2_nopol ON mv_dashboard_kendaraan_v2 (nopol);
CREATE INDEX idx_mv_v2_kabupaten_id ON mv_dashboard_kendaraan_v2 (kabupaten_id);
CREATE INDEX idx_mv_v2_segment ON mv_dashboard_kendaraan_v2 (segment);
CREATE INDEX idx_mv_v2_paid_on ON mv_dashboard_kendaraan_v2 (paid_on);
