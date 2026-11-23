const fs = require('fs');
const path = require('path');
const { Pool } = require(path.resolve(__dirname, '../apps/web/node_modules/pg'));

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });
const migrationsDir = path.resolve(__dirname, '../apps/web/data/migrations');

async function dryRun() {
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql') && /^\d{3}_/.test(f))
    .sort();

  console.log(`Starting dry-run simulation of ${files.length} migrations in transaction...`);

  const results = [];

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    const client = await pool.connect();
    try {
      await client.query('SET search_path TO popolive, public;');
      await client.query('BEGIN;');
      await client.query(sql);
      await client.query('ROLLBACK;');
      results.push({ file, success: true });
      console.log(`[PASS] ${file}`);
    } catch (err) {
      await client.query('ROLLBACK;');
      results.push({ file, success: false, error: err.message });
      console.error(`[FAIL] ${file}: ${err.message}`);
    } finally {
      client.release();
    }
  }

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\nDry run completed: ${passed} passed, ${failed} failed.`);
  await pool.end();
}

dryRun().catch(err => {
  console.error('Dry run execution error:', err);
  process.exit(1);
});
