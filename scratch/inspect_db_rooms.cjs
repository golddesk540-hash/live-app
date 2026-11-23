const path = require('path');
const { Pool } = require(path.resolve(__dirname, '../apps/web/node_modules/pg'));
const pool = new Pool({
  connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive'
});

async function run() {
  const cols = await pool.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'popolive' AND table_name = 'live_rooms'
    ORDER BY ordinal_position
  `);
  console.log('--- live_rooms columns ---');
  console.log(cols.rows);

  const indexes = await pool.query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'popolive' AND tablename = 'live_rooms'
  `);
  console.log('--- live_rooms indexes ---');
  console.log(indexes.rows);

  const rowCount = await pool.query(`SELECT COUNT(*)::int as count FROM popolive.live_rooms`);
  console.log('--- live_rooms count ---', rowCount.rows[0]);

  const sample = await pool.query(`SELECT * FROM popolive.live_rooms LIMIT 2`);
  console.log('--- sample rooms ---', sample.rows);

  await pool.end();
}

run().catch(console.error);
