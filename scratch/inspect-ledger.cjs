const path = require('path');
const { Pool } = require(path.resolve(__dirname, '../apps/web/node_modules/pg'));

const pool = new Pool({
  connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
});

async function inspect() {
  const tables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'popolive' 
      AND (table_name LIKE '%wallet%' 
        OR table_name LIKE '%coin%' 
        OR table_name LIKE '%point%' 
        OR table_name LIKE '%ledger%' 
        OR table_name LIKE '%transaction%' 
        OR table_name LIKE '%gift%')
    ORDER BY table_name;
  `);

  console.log('--- TABLES ---');
  for (const row of tables.rows) {
    console.log(row.table_name);
  }

  for (const row of tables.rows) {
    const cols = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'popolive' AND table_name = $1
      ORDER BY ordinal_position;
    `, [row.table_name]);
    console.log(`\n--- COLUMNS FOR ${row.table_name} ---`);
    console.log(cols.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));
  }

  await pool.end();
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
