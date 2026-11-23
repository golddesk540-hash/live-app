const path = require('path');
const { Pool } = require(path.resolve(__dirname, '../apps/web/node_modules/pg'));
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
});

async function check() {
  const tables = ['users', 'sessions', 'otp_verifications'];
  for (const t of tables) {
    console.log('\n========================================');
    console.log('TABLE: popolive.' + t);
    console.log('========================================');
    const cols = await pool.query(
      'SELECT column_name, data_type, is_nullable, column_default ' +
      'FROM information_schema.columns ' +
      'WHERE table_schema = $1 AND table_name = $2 ' +
      'ORDER BY ordinal_position',
      ['popolive', t]
    );
    console.log('--- COLUMNS ---');
    cols.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type} (nullable: ${r.is_nullable}, default: ${r.column_default})`));

    const constraints = await pool.query(
      'SELECT tc.constraint_name, tc.constraint_type, kcu.column_name ' +
      'FROM information_schema.table_constraints tc ' +
      'JOIN information_schema.key_column_usage kcu ' +
      '  ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema ' +
      'WHERE tc.table_schema = $1 AND tc.table_name = $2',
      ['popolive', t]
    );
    console.log('--- CONSTRAINTS ---');
    constraints.rows.forEach(r => console.log(`  ${r.constraint_name} (${r.constraint_type}) on ${r.column_name}`));

    const indexes = await pool.query(
      'SELECT indexname, indexdef ' +
      'FROM pg_indexes ' +
      'WHERE schemaname = $1 AND tablename = $2',
      ['popolive', t]
    );
    console.log('--- INDEXES ---');
    indexes.rows.forEach(r => console.log(`  ${r.indexname}: ${r.indexdef}`));
  }
  await pool.end();
}

check().catch(console.error);
