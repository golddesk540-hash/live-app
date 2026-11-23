const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  options: '-c search_path=popolive,public',
});

async function inspectResults() {
  const resultCols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'popolive' AND table_name = 'pk_battle_results' 
    ORDER BY ordinal_position
  `);
  console.log('=== pk_battle_results COLUMNS ===');
  console.log(resultCols.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));

  const resultSample = await pool.query(`SELECT * FROM popolive.pk_battle_results LIMIT 2`);
  console.log('=== pk_battle_results SAMPLE ===', resultSample.rows);

  const historyCols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'popolive' AND table_name = 'pk_battle_history' 
    ORDER BY ordinal_position
  `);
  if (historyCols.rows.length > 0) {
    console.log('=== pk_battle_history COLUMNS ===');
    console.log(historyCols.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
  } else {
    console.log('pk_battle_history table does not exist or has different name');
  }

  const indexes = await pool.query(`
    SELECT tablename, indexname, indexdef 
    FROM pg_indexes 
    WHERE schemaname = 'popolive' AND tablename = 'pk_battle_results'
  `);
  console.log('=== pk_battle_results INDEXES ===');
  for (const r of indexes.rows) {
    console.log(`${r.indexname}: ${r.indexdef}`);
  }

  await pool.end();
}
inspectResults().catch(console.error);
