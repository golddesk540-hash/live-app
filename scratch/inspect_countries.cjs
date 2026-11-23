const path = require('path');
const { Pool } = require(path.resolve(__dirname, '../apps/web/node_modules/pg'));
const pool = new Pool({
  connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  options: '-c search_path=popolive,public',
});

async function main() {
  const byCountry = await pool.query(`
    SELECT country, country_code, COUNT(*)::int as count 
    FROM popolive.live_rooms 
    WHERE is_live = true AND status = 'live' 
    GROUP BY country, country_code 
    ORDER BY count DESC;
  `);
  console.log('Active live rooms by country:', byCountry.rows);

  const usersByCountry = await pool.query(`
    SELECT country, country_code, COUNT(*)::int as count 
    FROM popolive.users 
    WHERE status = 'active'
    GROUP BY country, country_code 
    ORDER BY count DESC;
  `);
  console.log('\nActive users by country:', usersByCountry.rows);

  await pool.end();
}

main().catch(console.error);
