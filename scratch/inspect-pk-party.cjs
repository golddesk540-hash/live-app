const path = require('path');
const { Pool } = require(path.resolve(__dirname, '../apps/web/node_modules/pg'));

const pool = new Pool({
  connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
});

async function main() {
  const res = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'popolive' 
      AND (table_name LIKE '%pk%' 
        OR table_name LIKE '%party%' 
        OR table_name LIKE '%seat%')
    ORDER BY table_name;
  `);
  console.log('--- PK and PARTY TABLES ---');
  console.log(res.rows.map(r => r.table_name));

  for (const t of res.rows.map(r => r.table_name)) {
    const cols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'popolive' AND table_name = $1
      ORDER BY ordinal_position;
    `, [t]);
    console.log(`\nTable: ${t}`);
    console.log(cols.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));
  }

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
