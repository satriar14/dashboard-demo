/**
 * Pre-process kendaraan_transaksi.csv → data_kendaraan.json
 * Run once: node scripts/convert-csv.mjs
 * The output JSON is read by dashboard-data.ts for fast native parsing.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const CSV_PATH = path.join(ROOT, 'kendaraan_transaksi.csv');
const JSON_PATH = path.join(ROOT, 'data_kendaraan.json');

console.log('Reading CSV...');
const content = fs.readFileSync(CSV_PATH, 'utf-8');
const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);

console.log(`Total lines (including header): ${lines.length}`);

function parseCSVLine(line, delimiter = ';') {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === delimiter && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += char; }
  }
  result.push(current.trim());
  return result;
}

// Parse header
const headers = parseCSVLine(lines[0]);
const headerIndex = {};
headers.forEach((h, i) => { headerIndex[h.trim()] = i; });

const getVal = (fields, key) => {
  const idx = headerIndex[key];
  if (idx === undefined || idx >= fields.length) return '';
  return (fields[idx] || '').trim();
};

const getNum = (fields, key) => {
  const val = getVal(fields, key);
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

console.log('Converting rows...');
const data = [];
let skipped = 0;

for (let i = 1; i < lines.length; i++) {
  if (i % 50000 === 0) console.log(`  Processing row ${i}/${lines.length - 1}...`);

  const fields = parseCSVLine(lines[i]);
  if (fields.length < 5) { skipped++; continue; }

  const nopol = getVal(fields, 'nomor_polisi');
  if (!nopol) { skipped++; continue; }

  let paidOn = getVal(fields, 'paid_on');
  let masaPajak = getVal(fields, 'masa_pajak_sampai');
  if (paidOn) paidOn = paidOn.split(' ')[0];
  if (masaPajak) masaPajak = masaPajak.split(' ')[0];

  const kabupaten = getVal(fields, 'nama_kabkota') || getVal(fields, 'kabupaten_id') || 'N/A';

  // Output in the exact raw format expected by dashboard-data.ts
  const row = {
    nomor_polisi: nopol,
    upt_nama: getVal(fields, 'upt_nama') || getVal(fields, 'NAMA_UPT') || kabupaten,
    paid_on: paidOn,
    masa_pajak_sampai: masaPajak,
    pokok_pkb: getNum(fields, 'pokok_pkb'),
    tunggakan_pokok_pkb: getNum(fields, 'tunggakan_pokok_pkb'),
    pokok_bbnkb: getNum(fields, 'pokok_bbnkb'),
    tunggakan_pokok_bbnkb: getNum(fields, 'tunggakan_pokok_bbnkb'),
    opsen_pokok_pkb: getNum(fields, 'opsen_pokok_pkb'),
    opsen_tunggakan_pokok_pkb: getNum(fields, 'opsen_tunggakan_pokok_pkb'),
    opsen_pokok_bbnkb: getNum(fields, 'opsen_pokok_bbnkb'),
    opsen_tunggakan_pokok_bbnkb: getNum(fields, 'opsen_tunggakan_pokok_bbnkb'),
    pokok_swdkllj: getNum(fields, 'pokok_swdkllj'),
    denda_swdkllj: getNum(fields, 'denda_swdkllj'),
    tunggakan_denda_swdkllj: getNum(fields, 'tunggakan_denda_swdkllj'),
    nama_pemilik: getVal(fields, 'nama_pemilik') || getVal(fields, 'NAMA') || '',
    ALAMAT: getVal(fields, 'ALAMAT') || '',
    jenis_kendaraan: getVal(fields, 'jenis_kendaraan') || getVal(fields, 'JENIS KENDARAAN'),
    merk_kendaraan: getVal(fields, 'merk_kendaraan') || getVal(fields, 'MEREK KENDARAAN'),
    tipe_kendaraan: getVal(fields, 'tipe_kendaraan') || getVal(fields, 'TIPE'),
    tahun_buat: getVal(fields, 'tahun_buat') || getVal(fields, 'THN_BUAT'),
    bbm: getVal(fields, 'bbm') || getVal(fields, 'BAHAN BAKAR'),
    warna_plat: getVal(fields, 'warna_plat') || getVal(fields, 'WARNA_PLAT'),
    nomor_mesin: getVal(fields, 'nomor_mesin') || getVal(fields, 'MESIN'),
    nomor_rangka: getVal(fields, 'nomor_rangka') || getVal(fields, 'RANGKA'),
    nik: getVal(fields, 'nik') || getVal(fields, 'KTP'),
    no_hp: getVal(fields, 'no_hp') || getVal(fields, 'NO_HP'),
    nama_kabkota: kabupaten,
    nama_kec: getVal(fields, 'nama_kec') || getVal(fields, 'KECAMATAN'),
    nama_kel: getVal(fields, 'nama_kel'),
  };

  // Remove empty string values and zero numbers to reduce file size
  const compact = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === '' || v === 0) continue;
    compact[k] = v;
  }

  data.push(compact);
}

console.log(`\nConverted: ${data.length} rows`);
console.log(`Skipped: ${skipped} rows`);

console.log('Writing JSON...');
fs.writeFileSync(JSON_PATH, JSON.stringify(data));

const stats = fs.statSync(JSON_PATH);
console.log(`Output: ${JSON_PATH}`);
console.log(`Size: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
console.log('Done!');
