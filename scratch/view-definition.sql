 WITH base AS (
         SELECT pp.source_name,
            k.nopol,
            pp.paid_on,
            pp.masa_pajak_mulai,
            pp.masa_pajak_sampai AS masa_pajak_sampai_raw,
            pp.warna_plat,
            pp.bbm,
            pp.id_layanan,
            pp.kabupaten_id,
            pp.nama_kabupaten,
            pp.nama_kabkota,
            pp.nama_kec,
            pp.nama_kel,
            pp.nama_layanan,
            pp.upt_id,
            pp.upt_nama,
            pp.pokok_pkb,
            pp.pokok_bbnkb,
            pp.tunggakan_pokok_pkb,
            pp.tunggakan_pokok_bbnkb,
            pp.opsen_pokok_pkb,
            pp.opsen_tunggakan_pokok_pkb,
            pp.opsen_pokok_bbnkb,
            pp.opsen_tunggakan_pokok_bbnkb,
            pp.pokok_swdkllj,
            pp.tunggakan_pokok_swdkllj,
            pp.denda_swdkllj,
            pp.tunggakan_denda_swdkllj,
            pp.jenis_kendaraan,
            pp.merk_kendaraan,
            pp.tipe_kendaraan,
            pp.cc,
            pp.nomor_rangka,
            pp.nomor_mesin,
            pp.tahun_buat,
            pp.warna_plat_id,
            pp.fungsi_id,
            pp.fungsi,
            pp.kode,
            pp.nama_pemilik,
            pp.nik,
            pp.no_hp,
            pp.kode_jenken,
                CASE
                    WHEN pp.masa_pajak_sampai::text ~ '^\d{4}-\d{2}-\d{2}$'::text THEN to_date(pp.masa_pajak_sampai::text, 'YYYY-MM-DD'::text)
                    WHEN pp.masa_pajak_sampai::text ~ '^\d{2}/\d{2}/\d{4}'::text THEN to_timestamp(pp.masa_pajak_sampai::text, 'DD/MM/YYYY HH24:MI'::text)::date
                    ELSE NULL::date
                END AS masa_pajak_sampai,
                CASE
                    WHEN pp.paid_on IS NOT NULL AND pp.masa_pajak_mulai IS NOT NULL THEN
                    CASE
                        WHEN pp.paid_on::text ~ '^\d{4}-\d{2}-\d{2}$'::text THEN to_date(pp.paid_on::text, 'YYYY-MM-DD'::text)
                        WHEN pp.paid_on::text ~ '^\d{2}/\d{2}/\d{4}'::text THEN to_timestamp(pp.paid_on::text, 'DD/MM/YYYY HH24:MI'::text)::date
                        ELSE NULL::date
                    END -
                    CASE
                        WHEN pp.masa_pajak_mulai::text ~ '^\d{4}-\d{2}-\d{2}$'::text THEN to_date(pp.masa_pajak_mulai::text, 'YYYY-MM-DD'::text)
                        WHEN pp.masa_pajak_mulai::text ~ '^\d{2}/\d{2}/\d{4}'::text THEN to_timestamp(pp.masa_pajak_mulai::text, 'DD/MM/YYYY HH24:MI'::text)::date
                        ELSE NULL::date
                    END
                    ELSE NULL::integer
                END AS hari_tunggakan
           FROM master.kendaraan k
             LEFT JOIN transaction.pembayaran_pajak_new pp ON k.nopol::text = pp.nomor_polisi::text
        ), enhanced AS (
         SELECT base.source_name,
            base.nopol,
            base.paid_on,
            base.masa_pajak_mulai,
            base.masa_pajak_sampai_raw,
            base.warna_plat,
            base.bbm,
            base.id_layanan,
            base.kabupaten_id,
            base.nama_kabupaten,
            base.nama_kabkota,
            base.nama_kec,
            base.nama_kel,
            base.nama_layanan,
            base.upt_id,
            base.upt_nama,
            base.pokok_pkb,
            base.pokok_bbnkb,
            base.tunggakan_pokok_pkb,
            base.tunggakan_pokok_bbnkb,
            base.opsen_pokok_pkb,
            base.opsen_tunggakan_pokok_pkb,
            base.opsen_pokok_bbnkb,
            base.opsen_tunggakan_pokok_bbnkb,
            base.pokok_swdkllj,
            base.tunggakan_pokok_swdkllj,
            base.denda_swdkllj,
            base.tunggakan_denda_swdkllj,
            base.jenis_kendaraan,
            base.merk_kendaraan,
            base.tipe_kendaraan,
            base.cc,
            base.nomor_rangka,
            base.nomor_mesin,
            base.tahun_buat,
            base.warna_plat_id,
            base.fungsi_id,
            base.fungsi,
            base.kode,
            base.nama_pemilik,
            base.nik,
            base.no_hp,
            base.kode_jenken,
            base.masa_pajak_sampai,
            base.hari_tunggakan,
            count(*) OVER (PARTITION BY base.nama_kec) AS jumlah_penunggak_kecamatan,
            avg(base.hari_tunggakan) OVER (PARTITION BY base.nama_kec) AS rata_tunggakan_kecamatan
           FROM base
        ), ranked AS (
         SELECT enhanced_1.source_name,
            enhanced_1.nopol,
            enhanced_1.paid_on,
            enhanced_1.masa_pajak_mulai,
            enhanced_1.masa_pajak_sampai_raw,
            enhanced_1.warna_plat,
            enhanced_1.bbm,
            enhanced_1.id_layanan,
            enhanced_1.kabupaten_id,
            enhanced_1.nama_kabupaten,
            enhanced_1.nama_kabkota,
            enhanced_1.nama_kec,
            enhanced_1.nama_kel,
            enhanced_1.nama_layanan,
            enhanced_1.upt_id,
            enhanced_1.upt_nama,
            enhanced_1.pokok_pkb,
            enhanced_1.pokok_bbnkb,
            enhanced_1.tunggakan_pokok_pkb,
            enhanced_1.tunggakan_pokok_bbnkb,
            enhanced_1.opsen_pokok_pkb,
            enhanced_1.opsen_tunggakan_pokok_pkb,
            enhanced_1.opsen_pokok_bbnkb,
            enhanced_1.opsen_tunggakan_pokok_bbnkb,
            enhanced_1.pokok_swdkllj,
            enhanced_1.tunggakan_pokok_swdkllj,
            enhanced_1.denda_swdkllj,
            enhanced_1.tunggakan_denda_swdkllj,
            enhanced_1.jenis_kendaraan,
            enhanced_1.merk_kendaraan,
            enhanced_1.tipe_kendaraan,
            enhanced_1.cc,
            enhanced_1.nomor_rangka,
            enhanced_1.nomor_mesin,
            enhanced_1.tahun_buat,
            enhanced_1.warna_plat_id,
            enhanced_1.fungsi_id,
            enhanced_1.fungsi,
            enhanced_1.kode,
            enhanced_1.nama_pemilik,
            enhanced_1.nik,
            enhanced_1.no_hp,
            enhanced_1.kode_jenken,
            enhanced_1.masa_pajak_sampai,
            enhanced_1.hari_tunggakan,
            enhanced_1.jumlah_penunggak_kecamatan,
            enhanced_1.rata_tunggakan_kecamatan,
            dense_rank() OVER (ORDER BY enhanced_1.jumlah_penunggak_kecamatan DESC) AS rank_kecamatan
           FROM enhanced enhanced_1
        )
 SELECT source_name,
    nopol,
    paid_on,
    masa_pajak_mulai,
    masa_pajak_sampai_raw,
    warna_plat,
    bbm,
    id_layanan,
    kabupaten_id,
    nama_kabupaten,
    nama_kabkota,
    nama_kec,
    nama_kel,
    nama_layanan,
    upt_id,
    upt_nama,
    pokok_pkb,
    pokok_bbnkb,
    tunggakan_pokok_pkb,
    tunggakan_pokok_bbnkb,
    opsen_pokok_pkb,
    opsen_tunggakan_pokok_pkb,
    opsen_pokok_bbnkb,
    opsen_tunggakan_pokok_bbnkb,
    pokok_swdkllj,
    tunggakan_pokok_swdkllj,
    denda_swdkllj,
    tunggakan_denda_swdkllj,
    jenis_kendaraan,
    merk_kendaraan,
    tipe_kendaraan,
    cc,
    nomor_rangka,
    nomor_mesin,
    tahun_buat,
    warna_plat_id,
    fungsi_id,
    fungsi,
    kode,
    nama_pemilik,
    nik,
    no_hp,
    kode_jenken,
    masa_pajak_sampai,
    hari_tunggakan,
    jumlah_penunggak_kecamatan,
    rata_tunggakan_kecamatan,
        CASE
            WHEN hari_tunggakan <= 0 THEN 100
            WHEN hari_tunggakan >= 1 AND hari_tunggakan <= 365 THEN 70
            WHEN hari_tunggakan >= 366 AND hari_tunggakan <= 1095 THEN 40
            ELSE 10
        END +
        CASE
            WHEN jumlah_penunggak_kecamatan > 500 THEN '-30'::integer
            WHEN jumlah_penunggak_kecamatan > 200 THEN '-20'::integer
            WHEN jumlah_penunggak_kecamatan > 100 THEN '-10'::integer
            ELSE 0
        END +
        CASE
            WHEN rata_tunggakan_kecamatan > 1000::numeric THEN '-30'::integer
            WHEN rata_tunggakan_kecamatan > 500::numeric THEN '-20'::integer
            WHEN rata_tunggakan_kecamatan > 100::numeric THEN '-10'::integer
            ELSE 0
        END AS score_ml,
        CASE
            WHEN hari_tunggakan <= 0 THEN 'Loyal'::text
            WHEN hari_tunggakan >= 1 AND hari_tunggakan <= 365 THEN 'At Risk'::text
            WHEN hari_tunggakan >= 366 AND hari_tunggakan <= 1095 THEN 'High Risk'::text
            ELSE 'Churn'::text
        END AS segment,
        CASE
            WHEN hari_tunggakan <= 0 THEN 'Reward customer loyal'::text
            WHEN hari_tunggakan >= 1 AND hari_tunggakan <= 365 AND jumlah_penunggak_kecamatan > 200 THEN 'Deploy SAMSAT keliling MASSAL di kecamatan '::text || nama_kec::text
            WHEN hari_tunggakan >= 1 AND hari_tunggakan <= 365 THEN 'SAMSAT keliling + edukasi di kecamatan '::text || nama_kec::text
            WHEN hari_tunggakan >= 366 AND hari_tunggakan <= 1095 AND rata_tunggakan_kecamatan > 500::numeric THEN 'Tambah titik layanan + penagihan intensif di kecamatan '::text || nama_kec::text
            WHEN hari_tunggakan > 1095 AND jumlah_penunggak_kecamatan > 200 THEN 'Sweeping massal prioritas tinggi di kecamatan '::text || nama_kec::text
            WHEN hari_tunggakan > 1095 THEN 'Sweeping bertahap di kecamatan '::text || nama_kec::text
            ELSE 'unknown'::text
        END AS ai_recommendation,
        CASE
            WHEN nama_kabupaten::text = ANY (ARRAY['PALANGKA RAYA'::character varying, 'SAMPIT'::character varying, 'KOTAWARINGIN BARAT'::character varying, 'KOTAWARINGIN TIMUR'::character varying, 'KAPUAS'::character varying]::text[]) THEN 'Pusat Urban'::text
            WHEN nama_kabupaten::text = ANY (ARRAY['KOTAWARINGIN TIMUR'::character varying, 'KOTAWARINGIN BARAT'::character varying, 'BARITO UTARA'::character varying, 'BARITO TIMUR'::character varying]::text[]) THEN 'Hub Industri'::text
            WHEN nama_kabupaten::text = ANY (ARRAY['KATINGAN'::character varying, 'SERUYAN'::character varying, 'MURUNG RAYA'::character varying, 'KAPUAS'::character varying, 'PULANG PISAU'::character varying, 'GUNUNG MAS'::character varying]::text[]) THEN 'Hinterland'::text
            ELSE 'Unknown'::text
        END AS segment_wilayah,
        CASE
            WHEN hari_tunggakan <= 0 THEN 'Patuh'::text
            WHEN hari_tunggakan >= 1 AND hari_tunggakan <= 90 THEN 'Lupa/Sibuk'::text
            WHEN hari_tunggakan >= 91 AND hari_tunggakan <= 365 THEN 'Potensi Lalai'::text
            WHEN hari_tunggakan > 365 THEN 'Tidak Patuh Kronis'::text
            ELSE 'Unknown'::text
        END AS segment_perilaku,
        CASE
            WHEN hari_tunggakan <= 0 THEN 'Berikan reward / sertifikat WP Taat'::text
            WHEN hari_tunggakan >= 1 AND hari_tunggakan <= 90 THEN 'Kirim reminder (WA/SMS/Notifikasi)'::text
            WHEN hari_tunggakan >= 91 AND hari_tunggakan <= 365 THEN 'Follow-up aktif + edukasi + penawaran keringanan'::text
            WHEN hari_tunggakan > 365 THEN 'Penagihan intensif / sweeping / enforcement'::text
            ELSE 'unknown'::text
        END AS strategi_perilaku
   FROM enhanced
  WHERE nama_kabupaten::text = 'PALANGKA RAYA'::text OR nama_kabupaten IS NULL;