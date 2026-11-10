const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
});

async function resetTimer() {
  await pool.query(
    "UPDATE popolive.pk_winner_boosts SET expires_at = NOW() + INTERVAL '1799 seconds', status = 'active' WHERE battle_id = '00000000-0000-0000-0000-000000000604'"
  );
  console.log('Timer reset to 29:59');
  await pool.end();
}

resetTimer();
