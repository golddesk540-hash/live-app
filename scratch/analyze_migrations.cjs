const fs = require('fs');
const path = require('path');
const { Pool } = require(path.resolve(__dirname, '../apps/web/node_modules/pg'));

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

const migrationsDir = path.resolve(__dirname, '../apps/web/data/migrations');

async function analyze() {
  const client = await pool.connect();
  try {
    await client.query('SET search_path TO popolive, public;');

    // Get all tables in popolive schema
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'popolive' 
      ORDER BY table_name;
    `);
    const existingTables = new Set(tablesRes.rows.map(r => r.table_name));

    // Get all views in popolive
    const viewsRes = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'popolive' 
      ORDER BY table_name;
    `);
    const existingViews = new Set(viewsRes.rows.map(r => r.table_name));

    // Check migration files 001 to 061
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && /^\d{3}_/.test(f))
      .sort();

    console.log(`Found ${files.length} SQL migration files in ${migrationsDir}.\n`);

    const inventory = [];

    for (const file of files) {
      const match = file.match(/^(\d{3})_(.*)\.sql$/);
      if (!match) continue;
      const num = parseInt(match[1], 10);
      const name = match[2];
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Extract purpose from comments or name
      const firstLines = sql.split('\n').slice(0, 10);
      const commentLines = firstLines.filter(l => l.trim().startsWith('--'));
      const purpose = commentLines.length > 0 
        ? commentLines[0].replace(/^--\s*/, '').trim() 
        : name.replace(/_/g, ' ');

      // Extract tables created
      const createTableMatches = [...sql.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:popolive\.)?([a-zA-Z0-9_]+)/gi)];
      const createdTables = createTableMatches.map(m => m[1]);

      // Check if created tables exist
      const tablesExist = createdTables.length > 0
        ? createdTables.every(t => existingTables.has(t))
        : null;

      // Extract alter table
      const alterTableMatches = [...sql.matchAll(/ALTER\s+TABLE\s+(?:ONLY\s+)?(?:popolive\.)?([a-zA-Z0-9_]+)/gi)];
      const alteredTables = [...new Set(alterTableMatches.map(m => m[1]))];

      inventory.push({
        num: match[1],
        file,
        purpose,
        createdTables,
        alteredTables,
        tablesExist,
        sqlLength: sql.length
      });
    }

    console.log('Migration Inventory Summary:');
    let allCreatedExist = true;
    for (const item of inventory) {
      const status = item.createdTables.length > 0 
        ? (item.tablesExist ? 'TABLES_EXIST' : 'TABLES_MISSING') 
        : (item.alteredTables.length > 0 ? `ALTERS: ${item.alteredTables.join(', ')}` : 'SCHEMA_OPS');
      console.log(`[${item.num}] ${item.file} -> ${status} (${item.createdTables.length} tables, ${item.alteredTables.length} alters)`);
      if (item.createdTables.length > 0 && !item.tablesExist) {
        allCreatedExist = false;
        console.log(`    Missing tables:`, item.createdTables.filter(t => !existingTables.has(t)));
      }
    }

    console.log(`\nTotal existing tables in popolive: ${existingTables.size}`);
    console.log(`All created tables exist: ${allCreatedExist}`);

  } finally {
    client.release();
    await pool.end();
  }
}

analyze().catch(err => {
  console.error('Analysis failed:', err);
  process.exit(1);
});
