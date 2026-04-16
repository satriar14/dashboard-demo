const fs = require('fs');

const templates = JSON.parse(fs.readFileSync('./DATA_PALANGKARAYA.json', 'utf8'));
const kecamatanList = ["JEKAN RAYA", "PAHANDUT", "SEBANGAU", "BUKIT BATU", "RAKUMPIT"];
const kelurahanMap = {
    "JEKAN RAYA": ["BUKIT TUNGGAL", "MENTENG", "PALANGKA"],
    "PAHANDUT": ["PAHANDUT SEBERANG", "PANARUNG", "LANGKAI"],
    "SEBANGAU": ["KERENG BANGKIRAI", "SABARU"],
    "BUKIT BATU": ["TANGKILING", "BANTURUNG"],
    "RAKUMPIT": ["PETUK BARUNAI", "PAGER"]
};
const jenisList = ["SEPEDA MOTOR", "MINIBUS", "PICK UP", "JEEP", "TRUCK"];

const newData = [];

for (let i = 0; i < 100; i++) {
    const template = templates[i % templates.length];
    const item = { ...template };
    
    // Randomize Nopol
    const randomNopol = "KH" + (1000 + Math.floor(Math.random() * 8999)) + (String.fromCharCode(65 + Math.floor(Math.random() * 26))) + (String.fromCharCode(65 + Math.floor(Math.random() * 26)));
    item.nomor_polisi = randomNopol;
    item.NOPOL = randomNopol;
    item.nik = "NIK-" + (100000000000 + Math.floor(Math.random() * 900000000000));
    
    // Randomize Location
    const kec = kecamatanList[Math.floor(Math.random() * kecamatanList.length)];
    const kels = kelurahanMap[kec];
    const kel = kels[Math.floor(Math.random() * kels.length)];
    item.nama_kec = kec;
    item.nama_kel = kel;
    item.KELURAHAN = kel;
    
    // Randomize Dates (Last 3 years: 2023-2025)
    const year = 2023 + Math.floor(Math.random() * 3);
    const month = 1 + Math.floor(Math.random() * 12);
    const day = 1 + Math.floor(Math.random() * 28);
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} 10:00:00`;
    item.paid_on = dateStr;
    item["TANGGAL TRANSAKSI"] = dateStr;
    
    // Randomize Values
    const isTunggakan = Math.random() > 0.7; // 30% chance of arrears
    item.pokok_pkb = 100000 + Math.floor(Math.random() * 5000000);
    item.tunggakan_pokok_pkb = isTunggakan ? Math.floor(item.pokok_pkb * (0.5 + Math.random())) : 0;
    item.denda_swdkllj = isTunggakan ? 35000 : 0;
    
    // Randomize Vehicle
    item.jenis_kendaraan = jenisList[Math.floor(Math.random() * jenisList.length)];
    item.tahun_buat = 2010 + Math.floor(Math.random() * 15);
    
    newData.push(item);
}

fs.writeFileSync('./DATA_PALANGKARAYA.json', JSON.stringify(newData, null, 4));
console.log('Successfully generated 100 data points.');
