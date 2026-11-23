const path = require('path');
const { Pool } = require(path.resolve(__dirname, '../apps/web/node_modules/pg'));

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

async function inspect() {
  const client = await pool.connect();
  try {
    const schemas = await client.query('SELECT schema_name FROM information_schema.schemata ORDER BY schema_name;');
    console.log('=== SCHEMAS ===');
    console.log(schemas.rows.map(r => r.schema_name));

    const tables = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema IN ('popolive', 'public') 
      ORDER BY table_schema, table_name;
    `);
    console.log('\n=== TABLES ===');
    console.table(tables.rows);

    // Check if migration tracking table exists
    const migCheck = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('migrations', '_migrations', 'schema_migrations', 'knex_migrations');
    `);
    console.log('\n=== MIGRATION TABLES ===');
    console.table(migCheck.rows);

    if (migCheck.rows.length > 0) {
      for (const row of migCheck.rows) {
        const rows = await client.query(`SELECT * FROM ${row.table_schema}.${row.table_name};`);
        console.log(`Contents of ${row.table_schema}.${row.table_name}:`, rows.rows);
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

inspect().catch(err => {
  console.error('Inspection error:', err);
  process.exit(1);
});
