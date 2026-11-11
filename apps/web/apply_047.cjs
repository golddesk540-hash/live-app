const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const dbUrl =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

async function main() {
  const pool = new Pool({ connectionString: dbUrl });
  const sqlPath = path.join(__dirname, 'data', 'migrations', '047_real_time_gift_sending.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Executing Migration 047: Module 7.3 Real-Time Gift Sending System...');
  await pool.query(sql);

  const rules = await pool.query(
    `SELECT rule_key, rule_value FROM popolive.finance_rules WHERE rule_key LIKE '%gift%' ORDER BY rule_key`
  );
  console.table(rules.rows);

  const rooms = await pool.query(
    `SELECT room_number, status, is_live, host_id FROM popolive.live_rooms WHERE room_number IN ('880219', '990703', '7002', '7003')`
  );
  console.table(rooms.rows);

  console.log('Migration 047 applied successfully!');
  await pool.end();
}

main().catch((err) => {
  console.error('Migration 047 failed:', err);
  process.exit(1);
});
