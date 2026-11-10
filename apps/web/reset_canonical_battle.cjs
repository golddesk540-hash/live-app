const { Pool } = require('pg');
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
});

async function resetCanonicalBattle() {
  await pool.query(`
    UPDATE popolive.pk_battles
    SET status = 'active',
        timer_status = 'running',
        started_at = NOW() - INTERVAL '2 seconds',
        expires_at = NOW() + INTERVAL '298 seconds',
        duration_seconds = 300,
        remaining_seconds = 298,
        host_a_score = 12430,
        host_b_score = 9870,
        leading_host_id = '00000000-0000-0000-0000-000000088201'
    WHERE id = '00000000-0000-0000-0000-000000000603';
  `);
  console.log('✅ Canonical Battle 6.3 reset to 04:58 remaining with active status!');
  await pool.end();
}

resetCanonicalBattle();
