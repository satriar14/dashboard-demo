const fs = require('fs');
const filePath = 'lib/api-actions.ts';
let content = fs.readFileSync(filePath, 'utf-8');
const count = (content.match(/v_data_transaksi_kendaraan/g) || []).length;
content = content.replaceAll('v_data_transaksi_kendaraan', '${MV_TABLE}');
fs.writeFileSync(filePath, content, 'utf-8');
console.log('Replaced ' + count + ' occurrences');
// Verify
const verify = fs.readFileSync(filePath, 'utf-8');
console.log('File length after:', verify.length);
console.log('MV_TABLE occurrences:', (verify.match(/MV_TABLE/g) || []).length);
