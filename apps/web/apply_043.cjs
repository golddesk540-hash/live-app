const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

async function applyMigration043() {
  const client = await pool.connect();
  try {
    console.log('Connecting to database...');
    console.log('Executing Migration 043: PK Battle Fair Play & Anti-Cheat Security System...');

    const sqlPath = path.join(__dirname, 'data', 'migrations', '043_pk_fair_play_security.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await client.query('SET search_path TO popolive, public;');
    await client.query(sql);

    console.log('Validating tables & canonical rules...');
    const rules = await client.query(`
      SELECT id, title, title_ur, display_order 
      FROM popolive.pk_fair_play_rules 
      ORDER BY display_order ASC;
    `);
    console.log('Fair Play Rules:', rules.rows);

    console.log('Validating security config...');
    const config = await client.query(`
      SELECT config_key, config_val 
      FROM popolive.pk_security_config;
    `);
    console.log('Security Config:', config.rows);

    console.log('Migration 043 applied successfully!');
  } catch (err) {
    console.error('Migration 043 error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration043();
