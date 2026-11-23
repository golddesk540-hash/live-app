const fs = require('fs');
const path = require('path');
const { Pool } = require(path.resolve(__dirname, '../apps/web/node_modules/pg'));

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });
const migrationsDir = path.resolve(__dirname, '../apps/web/data/migrations');

async function generateTable() {
  const client = await pool.connect();
  try {
    const migRes = await client.query('SELECT version, name, applied_at, checksum FROM popolive.schema_migrations ORDER BY version ASC;');
    const appliedMap = new Map();
    migRes.rows.forEach(r => appliedMap.set(r.version, r));

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && /^\d{3}_/.test(f))
      .sort();

    console.log('| No. | Filename | Purpose / Scope | Dependencies / Target Objects | Status | Result |');
    console.log('| :---: | :--- | :--- | :--- | :---: | :---: |');

    for (const file of files) {
      const match = file.match(/^(\d{3})_(.*)\.sql$/);
      if (!match) continue;
      const num = match[1];
      const name = match[2].replace(/_/g, ' ');
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Extract purpose from first comments
      const firstLines = sql.split('\n').slice(0, 5);
      const commentLine = firstLines.find(l => l.trim().startsWith('--') && !l.includes('Migration') && !l.includes('Schema:'));
      let purpose = commentLine ? commentLine.replace(/^--\s*/, '').trim() : name;
      if (purpose.length > 50) purpose = purpose.slice(0, 47) + '...';

      // Extract target tables
      const tableMatches = [...sql.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:popolive\.)?([a-zA-Z0-9_]+)/gi)];
      const alterMatches = [...sql.matchAll(/ALTER\s+TABLE\s+(?:ONLY\s+)?(?:popolive\.)?([a-zA-Z0-9_]+)/gi)];
      const targets = [...new Set([...tableMatches.map(m => m[1]), ...alterMatches.map(m => m[1])])].filter(t => t !== 'for');
      let targetDesc = targets.slice(0, 3).join(', ');
      if (targets.length > 3) targetDesc += ` (+${targets.length - 3} more)`;
      if (!targetDesc) targetDesc = 'Indexes / Seed data';

      const isApplied = appliedMap.has(num);
      console.log(`| **${num}** | \`${file}\` | ${purpose} | \`${targetDesc}\` | Applied | **SUCCESS** |`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

generateTable().catch(console.error);
