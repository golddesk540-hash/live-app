const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

async function applyMigration040() {
  const client = await pool.connect();
  try {
    console.log('Connecting to database...');
    console.log('Executing Migration 040: PK Discovery Tab System...');

    const sqlPath = path.join(__dirname, 'data', 'migrations', '040_pk_discovery.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query('SET search_path TO popolive, public;');
    await client.query(sql);

    console.log('Validating columns in pk_battles...');
    const battleCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'popolive' 
        AND table_name = 'pk_battles'
        AND column_name IN ('is_featured', 'featured_order', 'featured_at', 'viewer_count');
    `);
    console.log('pk_battles discovery columns:', battleCols.rows.map(r => r.column_name));

    console.log('Validating active battles seeded for discovery...');
    const battles = await client.query(`
      SELECT id, host_a_nickname, host_b_nickname, viewer_count, is_featured, featured_order, status
      FROM popolive.pk_battles
      WHERE status = 'active'
      ORDER BY is_featured DESC, featured_order ASC;
    `);
    console.log('Active Discovery Battles:', battles.rows);

    console.log('Validating available hosts...');
    const hosts = await client.query(`
      SELECT u.poppo_id, u.nickname, u.in_pk_battle, lr.viewer_count, lr.is_live
      FROM popolive.users u
      JOIN popolive.live_rooms lr ON lr.host_id = u.id
      WHERE u.poppo_id IN ('88209', '88210', '88211', '88212');
    `);
    console.log('Available Hosts:', hosts.rows);

    console.log('Migration 040 applied successfully!');
  } catch (err) {
    console.error('Migration 040 error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration040();
