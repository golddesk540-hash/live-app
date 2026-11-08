const assert = require('assert');
const { Pool } = require('pg');

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING POPO LIVE PHASE 3 - PROMPT 03.2 TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function record(name, pass, detail = '') {
    if (pass) {
      console.log(`✅ [PASS] ${name} ${detail ? '(' + detail + ')' : ''}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${detail ? '(' + detail + ')' : ''}`);
      failed++;
    }
  }

  // 1. Database check
  const pool = new Pool({
    connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  });

  let demoUserId = null;
  let demoRoomId = null;
  let demoRoomNumber = null;

  try {
    const userRes = await pool.query("SELECT id, poppo_id, email, nickname FROM popolive.users WHERE status = 'active' LIMIT 1");
    demoUserId = userRes.rows[0]?.id;

    const roomRes = await pool.query("SELECT id, room_number, title, is_live, is_pk FROM popolive.live_rooms WHERE is_live = true LIMIT 1");
    demoRoomId = roomRes.rows[0]?.id;
    demoRoomNumber = roomRes.rows[0]?.room_number;

    record('PostgreSQL Connection & Schema Validation', true, `Found user: ${demoUserId?.substring(0, 8)}..., room: ${demoRoomNumber}`);
  } catch (err) {
    record('PostgreSQL Connection & Schema Validation', false, err.message);
  }

  // Create active session for authenticated testing
  const authSessionToken = 'test_disc_tabs_token_' + Date.now();
  if (demoUserId) {
    await pool.query(`
      INSERT INTO popolive.sessions (
        user_id, session_token, device_type, browser_name, os_name, location, expires_at, is_revoked
      ) VALUES (
        $1, $2, 'desktop', 'Chrome', 'Windows 11', 'Islamabad, Pakistan', CURRENT_TIMESTAMP + INTERVAL '7 days', false
      )
    `, [demoUserId, authSessionToken]);
  }

  // Obtain signed consent cookie
  const consentRes = await fetch(`${BASE_URL}/api/consent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'accept',
      termsAccepted: true,
      privacyAccepted: true,
      isAdultConfirmed: true,
      anonymousSessionId: 'tabs_test_anon_' + Date.now(),
    }),
  });
  const termsRaw = consentRes.headers.get('set-cookie')?.split(';')[0];
  const termsCookie = termsRaw || '';

  // 2. Test Explore API
  try {
    const res = await fetch(`${BASE_URL}/api/discovery/explore`);
    const data = await res.json();
    const ok = res.status === 200 && data.success === true && Array.isArray(data.rooms) && data.rooms.length > 0;
    const room = data.rooms[0];
    const hasFields = room && room.roomId && room.coverUrl && room.host && room.flagEmoji && room.viewersFormatted;
    record('Explore API GET /api/discovery/explore', ok && hasFields, `${data.rooms.length} rooms returned, sample: ${room?.title?.substring(0, 20)}...`);
  } catch (e) {
    record('Explore API GET /api/discovery/explore', false, e.message);
  }

  // 3. Test Following API (Guest Access)
  try {
    const res = await fetch(`${BASE_URL}/api/discovery/following`, {
      headers: { Cookie: termsCookie },
    });
    const data = await res.json();
    const ok = res.status === 200 && data.success === true && data.authenticated === false;
    record('Following API (Guest Access) returns login prompt & suggestions', ok, data.message || '');
  } catch (e) {
    record('Following API (Guest Access)', false, e.message);
  }

  // 4. Test Following API (Authenticated Access)
  try {
    const res = await fetch(`${BASE_URL}/api/discovery/following`, {
      headers: {
        Cookie: `poppo_session=${authSessionToken}; ${termsCookie}`,
      },
    });
    const data = await res.json();
    const ok = res.status === 200 && data.success === true && data.authenticated === true;
    record('Following API (Authenticated Access)', ok, `Total followed: ${data.totalFollowed}, Live followed: ${data.liveRooms?.length}`);
  } catch (e) {
    record('Following API (Authenticated Access)', false, e.message);
  }

  // 5. Test New Broadcasters API
  try {
    const res = await fetch(`${BASE_URL}/api/discovery/new`);
    const data = await res.json();
    const ok = res.status === 200 && data.success === true && Array.isArray(data.creators) && data.creators.length > 0;
    const first = data.creators[0];
    const hasProps = first && first.nickname && first.poppoId && first.joinedFormatted && typeof first.isLive === 'boolean';
    record('New Creators API GET /api/discovery/new', ok && hasProps, `${data.creators.length} creators, sample: ${first?.nickname} (${first?.joinedFormatted})`);
  } catch (e) {
    record('New Creators API GET /api/discovery/new', false, e.message);
  }

  // 6. Test New Broadcasters with Filter (Live Only)
  try {
    const res = await fetch(`${BASE_URL}/api/discovery/new?filter=live`);
    const data = await res.json();
    const ok = res.status === 200 && data.success === true && Array.isArray(data.creators);
    const allLive = data.creators.every(c => c.isLive === true);
    record('New Creators Filter (Live Only) accurately verifies broadcasting status', ok && allLive, `Confirmed live: ${data.creators.length}`);
  } catch (e) {
    record('New Creators Filter (Live Only)', false, e.message);
  }

  // 7. Test PK Battles API
  try {
    const res = await fetch(`${BASE_URL}/api/discovery/pk`);
    const data = await res.json();
    const ok = res.status === 200 && data.success === true && Array.isArray(data.battles) && data.battles.length > 0;
    const battle = data.battles[0];
    const hasHosts = battle && battle.hostA && battle.hostB && battle.title && battle.status;
    record('PK Battles API GET /api/discovery/pk', ok && hasHosts, `${data.battles.length} battles, counts: Active=${data.counts?.active}, Upcoming=${data.counts?.upcoming}, Completed=${data.counts?.completed}`);
  } catch (e) {
    record('PK Battles API GET /api/discovery/pk', false, e.message);
  }

  // 8. Test PK Battles Status Filter (Upcoming / Completed)
  try {
    const res = await fetch(`${BASE_URL}/api/discovery/pk?status=upcoming`);
    const data = await res.json();
    const ok = res.status === 200 && data.success === true && Array.isArray(data.battles);
    const allUpcoming = data.battles.every(b => b.status === 'upcoming');
    record('PK Battles Status Filtering (Upcoming)', ok && allUpcoming, `Returned ${data.battles.length} scheduled matches`);
  } catch (e) {
    record('PK Battles Status Filtering', false, e.message);
  }

  // 9. Test Room Detail API (Existing Live Room)
  try {
    const res = await fetch(`${BASE_URL}/api/discovery/rooms/${demoRoomId}`);
    const data = await res.json();
    const ok = res.status === 200 && data.success === true && data.room && data.isAvailable === true;
    record('Room Detail API GET /api/discovery/rooms/:roomId (Active Room)', ok, `Room #${data.room?.roomNumber}, Host: ${data.room?.host?.nickname}, Viewers: ${data.room?.viewersFormatted}`);
  } catch (e) {
    record('Room Detail API (Active Room)', false, e.message);
  }

  // 10. Test Room Detail API (Deleted or Non-Existent Room)
  try {
    const res = await fetch(`${BASE_URL}/api/discovery/rooms/00000000-0000-0000-0000-000000000000`);
    const data = await res.json();
    const ok = res.status === 404 && data.success === false && data.isAvailable === false;
    record('Deleted / Non-Existent Room Handling (Returns 404 & isAvailable:false)', ok, data.error || '');
  } catch (e) {
    record('Deleted / Non-Existent Room Handling', false, e.message);
  }

  // 11. Test Web Routes HTML Generation
  const routesToTest = [
    { path: '/live', label: 'Main Discovery Route (/live)' },
    { path: '/live/explore', label: 'Explore Tab Route (/live/explore)' },
    { path: '/live/following', label: 'Following Tab Route (/live/following)' },
    { path: '/live/new', label: 'New Creators Tab Route (/live/new)' },
    { path: '/live/pk', label: 'PK Battles Tab Route (/live/pk)' },
    { path: `/live/room/${demoRoomId}`, label: `Live Stream Preview Route (/live/room/${demoRoomId})` },
  ];

  for (const r of routesToTest) {
    try {
      const res = await fetch(`${BASE_URL}${r.path}`);
      const text = await res.text();
      const ok = res.status === 200 && text.length > 500 && (text.includes('Live') || text.includes('Popo') || text.includes('Connecting'));
      record(`HTML SSR Render: ${r.label}`, ok, `Status ${res.status}, ${text.length} bytes`);
    } catch (e) {
      record(`HTML SSR Render: ${r.label}`, false, e.message);
    }
  }

  // 12. Backward Compatibility with Prompt 03.1 /api/live/discovery
  try {
    const res = await fetch(`${BASE_URL}/api/live/discovery?tab=pk`);
    const data = await res.json();
    const ok = res.status === 200 && data.success === true && Array.isArray(data.rooms);
    record('Backwards Compatibility with Prompt 03.1 API (/api/live/discovery)', ok, `${data.rooms?.length} rooms returned`);
  } catch (e) {
    record('Backwards Compatibility', false, e.message);
  }

  await pool.end();

  console.log('\n======================================================');
  console.log(`📊 FINAL RESULTS: ${passed} PASSED | ${failed} FAILED (Total: ${passed + failed})`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
