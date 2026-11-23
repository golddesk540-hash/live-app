const path = require('path');
const { Pool } = require(path.resolve(__dirname, '../apps/web/node_modules/pg'));
const pool = new Pool({
  connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  options: '-c search_path=popolive,public',
});

async function main() {
  const tables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'popolive' 
    ORDER BY table_name;
  `);
  console.log('Tables in popolive schema:');
  for (const row of tables.rows) {
    if (row.table_name.includes('view') || row.table_name.includes('pres') || row.table_name.includes('room') || row.table_name.includes('live')) {
      console.log(` - ${row.table_name}`);
    }
  }

  // Also print all tables just in case
  console.log('\nAll tables:');
  console.log(tables.rows.map(r => r.table_name).join(', '));

  await pool.end();
}

main().catch(console.error);
