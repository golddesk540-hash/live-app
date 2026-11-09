const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function main() {
  let envDbUrl = process.env.DATABASE_URL;
  if (!envDbUrl) {
    const envLocal = path.join(__dirname, '..', '..', '.env.local');
    const envProd = path.join(__dirname, '..', '..', '.env.production');
    const envFile = fs.existsSync(envLocal) ? envLocal : (fs.existsSync(envProd) ? envProd : null);
    if (envFile) {
      const lines = fs.readFileSync(envFile, 'utf8').split('\n');
      for (const line of lines) {
        if (line.startsWith('DATABASE_URL=')) {
          envDbUrl = line.substring('DATABASE_URL='.length).trim();
          break;
        }
      }
    }
  }
  const defaultLocalUrl = 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';
  const connectionString = envDbUrl || defaultLocalUrl;
  const pool = new Pool({ connectionString });

  console.log('Connecting to PostgreSQL to apply Migration 016...');
  const sql = fs.readFileSync(path.join(__dirname, '016_staff_test_rooms_and_roles.sql'), 'utf8');
  await pool.query(sql);
  console.log('Migration 016 applied successfully.');

  const bcrypt = require('bcryptjs');
  const staffHash = bcrypt.hashSync('StaffPass123!', 10);
  await pool.query(
    "UPDATE popolive.users SET password_hash = $1, is_staff = true, role = 'staff' WHERE email = 'staff@popolive.com'",
    [staffHash]
  );
  console.log('Updated staff@popolive.com password hash.');

  const res = await pool.query("SELECT test_room_id, title, status, environment FROM popolive.test_rooms ORDER BY test_room_id ASC");
  console.log('Seeded Test Rooms:', res.rows);

  const staffUsers = await pool.query("SELECT nickname, email, role, is_staff FROM popolive.users WHERE is_staff = true");
  console.log('Authorized Staff Users:', staffUsers.rows);

  await pool.end();
}

main().catch(err => {
  console.error('Migration 016 error:', err);
  process.exit(1);
});
