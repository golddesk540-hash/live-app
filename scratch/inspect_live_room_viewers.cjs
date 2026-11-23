const path = require('path');
const { Pool } = require(path.resolve(__dirname, '../apps/web/node_modules/pg'));
const pool = new Pool({
  connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  options: '-c search_path=popolive,public',
});

async function main() {
  const cols = await pool.query(`
    SELECT column_name, data_type, is_nullable, column_default 
    FROM information_schema.columns 
    WHERE table_schema = 'popolive' AND table_name = 'live_room_viewers' 
    ORDER BY ordinal_position;
  `);
  console.log('Columns of popolive.live_room_viewers:');
  for (const c of cols.rows) {
    console.log(` - ${c.column_name}: ${c.data_type} (nullable: ${c.is_nullable}, default: ${c.column_default})`);
  }

  const indexes = await pool.query(`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE schemaname = 'popolive' AND tablename = 'live_room_viewers';
  `);
  console.log('\nIndexes of popolive.live_room_viewers:');
  for (const idx of indexes.rows) {
    console.log(` - ${idx.indexname}: ${idx.indexdef}`);
  }

  const sampleRows = await pool.query(`
    SELECT * FROM popolive.live_room_viewers LIMIT 5;
  `);
  console.log('\nSample rows:');
  console.log(sampleRows.rows);

  await pool.end();
}

main().catch(console.error);
