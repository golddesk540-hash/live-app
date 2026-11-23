const fs = require('fs');
const path = require('path');

const migrationsDir = path.resolve(__dirname, '../apps/web/data/migrations');

const files = fs.readdirSync(migrationsDir)
  .filter(f => f.endsWith('.sql') && /^\d{3}_/.test(f))
  .sort();

console.log(`Analyzing ${files.length} migration files...\n`);

const destructivePatterns = [
  /\bDROP\s+TABLE\b/i,
  /\bDROP\s+COLUMN\b/i,
  /\bTRUNCATE\b/i,
  /\bDELETE\s+FROM\b/i,
];

const nonIdempotentPatterns = [
  /\bCREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS)/i,
  /\bCREATE\s+(?:UNIQUE\s+)?INDEX\s+(?!IF\s+NOT\s+EXISTS)/i,
  /\bALTER\s+TABLE\s+[^\n]+\s+ADD\s+COLUMN\s+(?!IF\s+NOT\s+EXISTS)/i,
  /\bCREATE\s+TYPE\s+[^\n]+\s+AS\s+ENUM/i,
];

for (const file of files) {
  const filePath = path.join(migrationsDir, file);
  const sql = fs.readFileSync(filePath, 'utf8');

  // Strip single-line comments for syntax checks
  const cleanSql = sql.replace(/--.*$/gm, '');

  const destructives = [];
  for (const p of destructivePatterns) {
    const matches = cleanSql.match(p);
    if (matches) destructives.push(matches[0]);
  }

  const nonIdempotents = [];
  for (const p of nonIdempotentPatterns) {
    const matches = cleanSql.match(p);
    if (matches) nonIdempotents.push(matches[0]);
  }

  const hasInsert = /\bINSERT\s+INTO\b/i.test(cleanSql);
  const hasOnConflict = /\bON\s+CONFLICT\b/i.test(cleanSql);

  const flags = [];
  if (destructives.length > 0) flags.push(`DESTRUCTIVE: ${destructives.join(', ')}`);
  if (nonIdempotents.length > 0) flags.push(`NON_IDEMPOTENT: ${nonIdempotents.join(', ')}`);
  if (hasInsert && !hasOnConflict) flags.push(`INSERT_WITHOUT_ON_CONFLICT`);

  if (flags.length > 0) {
    console.log(`${file}:`);
    flags.forEach(f => console.log(`   -> ${f}`));
  }
}
