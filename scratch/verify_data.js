const { getDashboardData } = require('../lib/dashboard-data');

async function verify() {
  process.env.DATABASE_URL = "postgres://fpsdev:FPSDev+2024!@117.53.46.30:5440/sigap_kalteng";
  try {
    const data = await getDashboardData();
    console.log(`Successfully fetched ${data.length} records.`);
    if (data.length > 0) {
      console.log('Sample record:', JSON.stringify(data[0], null, 2));
    }
  } catch (err) {
    console.error('Verification failed:', err);
  }
}

verify();
