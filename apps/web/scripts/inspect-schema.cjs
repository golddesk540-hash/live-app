const { Pool } = require('../node_modules/pg');
const pool = new Pool({
  connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive'
});

async function main() {
  const tables = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'popolive' 
    ORDER BY table_name
  `);
  console.log('Tables:', tables.rows.map(r => r.table_name));

  // Check columns of users
  const userCols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'popolive' AND table_name = 'users'
    ORDER BY ordinal_position
  `);
  console.log('\nUsers columns:');
  console.log(userCols.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));

  // Check wallet tables
  const walletTables = tables.rows.filter(r => r.table_name.includes('wallet') || r.table_name.includes('coin') || r.table_name.includes('balance'));
  console.log('\nWallet/Coin tables:', walletTables.map(r => r.table_name));

  for (const t of walletTables) {
    const cols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'popolive' AND table_name = $1
    `, [t.table_name]);
    console.log(`  ${t.table_name}:`, cols.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
  }

  // Check recognition tables
  const recogTables = tables.rows.filter(r => r.table_name.includes('recognition') || r.table_name.includes('level') || r.table_name.includes('honor') || r.table_name.includes('wealth'));
  console.log('\nRecognition/Level tables:', recogTables.map(r => r.table_name));

  for (const t of recogTables) {
    const cols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'popolive' AND table_name = $1
    `, [t.table_name]);
    console.log(`  ${t.table_name}:`, cols.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
  }

  // Check social/relation/visitor tables
  const socialTables = tables.rows.filter(r => r.table_name.includes('relation') || r.table_name.includes('follow') || r.table_name.includes('friend') || r.table_name.includes('visitor'));
  console.log('\nSocial/Visitor tables:', socialTables.map(r => r.table_name));

  for (const t of socialTables) {
    const cols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'popolive' AND table_name = $1
    `, [t.table_name]);
    console.log(`  ${t.table_name}:`, cols.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
  }

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
