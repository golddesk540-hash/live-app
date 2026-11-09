const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

async function applyMigration() {
  console.log('Connecting to database for Migration 031...');
  const client = await pool.connect();
  try {
    const sqlPath = path.join(__dirname, 'data', 'migrations', '031_party_themes.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing Migration 031: Party Themes...');
    await client.query(sql);

    // Validate party_themes
    const themesRes = await client.query(`
      SELECT id, name, accent_color, display_order FROM popolive.party_themes ORDER BY display_order ASC;
    `);
    console.log('Party Themes seeded count:', themesRes.rows.length);
    console.log('Themes preview:', themesRes.rows.map(r => `${r.name} (${r.id})`));

    // Validate party_room_themes
    const roomThemeRes = await client.query(`
      SELECT room_id, theme_id, updated_by, updated_at FROM popolive.party_room_themes WHERE room_id = '7001';
    `);
    console.log('Active Room Theme for 7001:', roomThemeRes.rows);

    console.log('Migration 031 applied successfully!');
  } catch (err) {
    console.error('Migration 031 failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration();
