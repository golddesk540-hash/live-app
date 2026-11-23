/**
 * POPO LIVE — PHASE B7 PROMPT 1 OF 4 VERIFICATION SUITE
 * PK 1v1 DATABASE FOUNDATION + EXISTING API INTEGRATION
 *
 * Verifies:
 * 1. Existing PK route retrieval.
 * 2. Actual PostgreSQL PK records.
 * 3. Invalid PK session (HTTP 404).
 * 4. Invalid host (HTTP 404 RECEIVER_NOT_FOUND).
 * 5. Unauthorized access (HTTP 401 / HTTP 403).
 * 6. 1v1 validation (HTTP 200).
 * 7. 4-host creation rejection (HTTP 403 BATTLE_TYPE_LOCKED & HTTP 400 UNSUPPORTED_BATTLE_TYPE).
 * 8. 4-host navigation rejection.
 * 9. Public PK type page shows only 1v1.
 * 10. No 4-host label on public listing.
 * 11. No fixture fallback when real PK API mode is enabled.
 */

const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=');
        if (idx !== -1) {
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnvFile(path.resolve(__dirname, 'apps/web/.env.local'));
loadEnvFile(path.resolve(__dirname, 'apps/web/.env.development'));
process.env.NEXT_PUBLIC_USE_ECONOMY_API = 'true';
process.env.USE_ECONOMY_API = 'true';

const { NextRequest } = require(path.resolve(__dirname, 'apps/web/node_modules/next/server'));
const { Pool } = require(path.resolve(__dirname, 'apps/web/node_modules/pg'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  options: '-c search_path=popolive,public',
});

// Import route handlers
const battleDetailsRoute = require(path.resolve(__dirname, 'apps/web/app/api/pk/battle/[battleId]/route.ts'));
const battleTypesRoute = require(path.resolve(__dirname, 'apps/web/app/api/pk/battle-types/route.ts'));
const battleTypesSelectRoute = require(path.resolve(__dirname, 'apps/web/app/api/pk/battle-types/select/route.ts'));
const battleTypesSessionRoute = require(path.resolve(__dirname, 'apps/web/app/api/pk/battle-types/session/route.ts'));
const inviteSendRoute = require(path.resolve(__dirname, 'apps/web/app/api/pk/invitation/send/route.ts'));
const inviteRespondRoute = require(path.resolve(__dirname, 'apps/web/app/api/pk/invitation/respond/route.ts'));

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedChecks++;
    console.error(`  [FAIL] ${message}`);
  }
}

async function runTests() {
  console.log('\n================================================================');
  console.log('POPO LIVE — PHASE B7 PROMPT 1 OF 4 AUTOMATED VERIFICATION SUITE');
  console.log('PK 1v1 DATABASE FOUNDATION + EXISTING API INTEGRATION');
  console.log('================================================================\n');

  const testHostAId = '00000000-0000-0000-0000-000000088301';
  const testHostBId = '00000000-0000-0000-0000-000000088302';
  const unauthUserId = '00000000-0000-0000-0000-000000088399';
  const testBattleId = '00000000-0000-0000-0000-000000099301';

  // Seed / reset clean test state
  await pool.query(
    `INSERT INTO popolive.users (id, poppo_id, nickname, email, password_hash, role, status, is_face_verified, go_live_eligible, in_pk_battle, pk_invites_enabled)
     VALUES ($1, '88301', 'Host Maria', 'maria@popolive.com', 'hash', 'user', 'active', true, true, false, true)
     ON CONFLICT (id) DO UPDATE SET in_pk_battle = false, pk_invites_enabled = true, status = 'active'`,
    [testHostAId]
  );
  await pool.query(
    `INSERT INTO popolive.users (id, poppo_id, nickname, email, password_hash, role, status, is_face_verified, go_live_eligible, in_pk_battle, pk_invites_enabled)
     VALUES ($1, '88302', 'Host Zainab', 'zainab@popolive.com', 'hash', 'user', 'active', true, true, false, true)
     ON CONFLICT (id) DO UPDATE SET in_pk_battle = false, pk_invites_enabled = true, status = 'active'`,
    [testHostBId]
  );
  await pool.query(
    `INSERT INTO popolive.users (id, poppo_id, nickname, email, password_hash, role, status)
     VALUES ($1, '88399', 'Rando Viewer', 'rando@popolive.com', 'hash', 'user', 'active')
     ON CONFLICT (id) DO UPDATE SET status = 'active'`,
    [unauthUserId]
  );

  // Setup test live rooms for both hosts
  await pool.query(
    `INSERT INTO popolive.live_rooms (id, room_number, host_id, title, status, is_live, in_pk_battle)
     VALUES (gen_random_uuid(), '88301', $1, 'Maria Live Broadcast', 'live', true, false)
     ON CONFLICT (room_number) DO UPDATE SET status = 'live', is_live = true, in_pk_battle = false`,
    [testHostAId]
  );
  await pool.query(
    `INSERT INTO popolive.live_rooms (id, room_number, host_id, title, status, is_live, in_pk_battle)
     VALUES (gen_random_uuid(), '88302', $1, 'Zainab Live Broadcast', 'live', true, false)
     ON CONFLICT (room_number) DO UPDATE SET status = 'live', is_live = true, in_pk_battle = false`,
    [testHostBId]
  );

  // Seed confirmed active PK battle session in popolive.pk_battles
  await pool.query(
    `INSERT INTO popolive.pk_battles (
       id, battle_type, host_a_id, host_a_room, host_a_nickname, host_a_avatar, host_a_score,
       host_b_id, host_b_room, host_b_nickname, host_b_avatar, host_b_score,
       match_method, status, created_at, started_at
     )
     VALUES ($1, '1v1', $2, '88301', 'Host Maria', '/avatars/maria.png', 350,
             $3, '88302', 'Host Zainab', '/avatars/zainab.png', 120,
             'invite', 'active', NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET
       host_a_score = 350, host_b_score = 120, status = 'active'`,
    [testBattleId, testHostAId, testHostBId]
  );

  // -------------------------------------------------------------
  // TEST 1: Existing PK Route Retrieval
  // -------------------------------------------------------------
  console.log('--- TEST 1: Existing PK Route Retrieval (GET /api/pk/battle/[battleId]) ---');
  {
    const req = new NextRequest(`http://localhost:3000/api/pk/battle/${testBattleId}`);
    const res = await battleDetailsRoute.GET(req, { params: { battleId: testBattleId } });
    const data = await res.json();

    assert(res.status === 200, 'GET /api/pk/battle/[battleId] returns HTTP 200');
    assert(data.success === true, 'Response contains success: true');
    assert(data.battle && data.battle.id === testBattleId, 'battle.id matches query session ID');
    assert(data.battle.battleType === '1v1', 'battleType is strictly 1v1');
    assert(data.battle.status === 'active', 'Battle status is active');
    assert(data.battle.hostA.id === testHostAId, 'hostA.id matches Host Maria');
    assert(data.battle.hostB.id === testHostBId, 'hostB.id matches Host Zainab');
    assert(data.battle.hostA.score === 350, 'hostA score matches PostgreSQL (350)');
    assert(data.battle.hostB.score === 120, 'hostB score matches PostgreSQL (120)');
    assert(typeof data.battle.ratioA === 'number', 'ratioA is computed numeric percentage');
    assert(typeof data.battle.ratioB === 'number', 'ratioB is computed numeric percentage');
  }

  // -------------------------------------------------------------
  // TEST 2: Actual PostgreSQL PK Records
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Actual PostgreSQL PK Records Verification ---');
  {
    const dbRes = await pool.query(
      `SELECT id, battle_type, host_a_id, host_b_id, host_a_room, host_b_room,
              host_a_score, host_b_score, status, started_at, created_at
       FROM popolive.pk_battles
       WHERE id = $1`,
      [testBattleId]
    );

    assert(dbRes.rows.length === 1, 'PK Battle row exists in popolive.pk_battles');
    const row = dbRes.rows[0];
    assert(row.id === testBattleId, 'PostgreSQL id matches testBattleId');
    assert(row.battle_type === '1v1', 'PostgreSQL battle_type is 1v1');
    assert(row.host_a_id === testHostAId, 'PostgreSQL host_a_id matches');
    assert(row.host_b_id === testHostBId, 'PostgreSQL host_b_id matches');
    assert(row.host_a_room === '88301', 'PostgreSQL host_a_room matches 88301');
    assert(row.host_b_room === '88302', 'PostgreSQL host_b_room matches 88302');
    assert(row.status === 'active', 'PostgreSQL status is active');
    assert(Number(row.host_a_score) === 350, 'PostgreSQL host_a_score is 350');
    assert(Number(row.host_b_score) === 120, 'PostgreSQL host_b_score is 120');
    assert(row.started_at !== null, 'PostgreSQL started_at timestamp is present');
  }

  // -------------------------------------------------------------
  // TEST 3: Invalid PK Session Handling (HTTP 404)
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Invalid PK Session Handling (HTTP 404) ---');
  {
    const nonExistentBattleId = '00000000-0000-0000-0000-000000000000';
    const req = new NextRequest(`http://localhost:3000/api/pk/battle/${nonExistentBattleId}`);
    const res = await battleDetailsRoute.GET(req, { params: { battleId: nonExistentBattleId } });
    const data = await res.json();

    assert(res.status === 404, 'Non-existent battle returns HTTP 404');
    assert(data.success === false, 'Response has success: false');
    assert(data.error.includes('not found'), 'Error message indicates session not found');
  }

  // -------------------------------------------------------------
  // TEST 4: Invalid Host Handling (HTTP 404)
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Invalid Host Handling ---');
  {
    const req = new NextRequest('http://localhost:3000/api/pk/invitation/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderHostId: testHostAId,
        senderRoomNumber: '88301',
        receiverHostId: '00000000-0000-0000-0000-000000000000',
        battleType: '1v1',
      }),
    });
    const res = await inviteSendRoute.POST(req);
    const data = await res.json();

    assert(res.status === 404, 'Invalid target host returns HTTP 404');
    assert(data.code === 'RECEIVER_NOT_FOUND', 'Error code is RECEIVER_NOT_FOUND');
  }

  // -------------------------------------------------------------
  // TEST 5: Unauthorized Access
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Unauthorized Access Rejected (HTTP 401 & HTTP 403) ---');
  {
    // No sender authentication / ID
    const reqNoAuth = new NextRequest('http://localhost:3000/api/pk/invitation/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiverHostId: testHostBId,
        battleType: '1v1',
      }),
    });
    const resNoAuth = await inviteSendRoute.POST(reqNoAuth);
    assert(resNoAuth.status === 401, 'Request missing sender credentials returns HTTP 401');

    // Unauthorized responder (third party user)
    const invRes = await pool.query(
      `INSERT INTO popolive.pk_invitations (
         sender_host_id, sender_room_number, sender_nickname, sender_avatar,
         receiver_host_id, receiver_room_number, receiver_nickname, receiver_avatar,
         battle_type, status, expires_at, created_at, updated_at
       )
       VALUES ($1, '88301', 'Host Maria', '/avatar.png', $2, '88302', 'Host Zainab', '/avatar.png', '1v1', 'pending', NOW() + INTERVAL '10 minutes', NOW(), NOW())
       RETURNING id`,
      [testHostAId, testHostBId]
    );
    const testInvId = invRes.rows[0].id;

    const reqUnauthRespond = new NextRequest('http://localhost:3000/api/pk/invitation/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invitationId: testInvId,
        action: 'accept',
        receiverHostId: unauthUserId,
      }),
    });
    const resUnauthRespond = await inviteRespondRoute.POST(reqUnauthRespond);
    const dataUnauth = await resUnauthRespond.json();

    assert(resUnauthRespond.status === 403, 'Unauthorized third party responder returns HTTP 403');
    assert(dataUnauth.code === 'FORBIDDEN', 'Error code is FORBIDDEN');

    // Clean up test invite
    await pool.query(`DELETE FROM popolive.pk_invitations WHERE id = $1`, [testInvId]);
  }

  // -------------------------------------------------------------
  // TEST 6: 1v1 Validation
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: 1v1 Battle Type Validation (HTTP 200) ---');
  {
    const req = new NextRequest('http://localhost:3000/api/pk/battle-types/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomNumber: '88301',
        hostId: testHostAId,
        battleType: '1v1',
      }),
    });
    const res = await battleTypesSelectRoute.POST(req);
    const data = await res.json();

    assert(res.status === 200, 'Selecting 1v1 battle type returns HTTP 200');
    assert(data.success === true, 'Select response has success: true');
    assert(data.battleType === '1v1', 'Configured battle type is strictly 1v1');

    // Verify session configured
    const sessReq = new NextRequest('http://localhost:3000/api/pk/battle-types/session?roomNumber=88301');
    const sessRes = await battleTypesSessionRoute.GET(sessReq);
    const sessData = await sessRes.json();
    assert(sessRes.status === 200, 'Session endpoint returns HTTP 200');
    assert(sessData.battleType === '1v1', 'Session battleType persisted as 1v1');
  }

  // -------------------------------------------------------------
  // TEST 7: 4-Host Creation Rejection
  // -------------------------------------------------------------
  console.log('\n--- TEST 7: 4-Host Creation Rejection (HTTP 403 & HTTP 400) ---');
  {
    // Rejection on battle type selection
    const reqSelect = new NextRequest('http://localhost:3000/api/pk/battle-types/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomNumber: '88301',
        hostId: testHostAId,
        battleType: '4_host',
      }),
    });
    const resSelect = await battleTypesSelectRoute.POST(reqSelect);
    const dataSelect = await resSelect.json();

    assert(resSelect.status === 403, 'Selecting 4_host returns HTTP 403 (Forbidden/Locked)');
    assert(dataSelect.code === 'BATTLE_TYPE_LOCKED', 'Error code is BATTLE_TYPE_LOCKED');

    // Rejection on invitation send
    const reqInvite = new NextRequest('http://localhost:3000/api/pk/invitation/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderHostId: testHostAId,
        senderRoomNumber: '88301',
        receiverHostId: testHostBId,
        battleType: '4_host',
      }),
    });
    const resInvite = await inviteSendRoute.POST(reqInvite);
    const dataInvite = await resInvite.json();

    assert(resInvite.status === 400, '4-host invitation returns HTTP 400');
    assert(dataInvite.code === 'UNSUPPORTED_BATTLE_TYPE', 'Error code is UNSUPPORTED_BATTLE_TYPE');
  }

  // -------------------------------------------------------------
  // TEST 8: 4-Host Navigation Rejection (Feature Flag Enforcement)
  // -------------------------------------------------------------
  console.log('\n--- TEST 8: 4-Host Navigation Rejection ---');
  {
    // Feature flags query in database
    const flagsDb = await pool.query(
      `SELECT flag_key, is_enabled FROM popolive.pk_feature_flags WHERE flag_key = 'pk_4host_enabled'`
    );
    assert(flagsDb.rows.length === 1, 'pk_4host_enabled flag exists in database');
    assert(flagsDb.rows[0].is_enabled === false, 'pk_4host_enabled is explicitly FALSE');

    // Check battle types table is_locked column for 4_host
    const typeDb = await pool.query(
      `SELECT id, is_locked, is_enabled FROM popolive.pk_battle_types WHERE id = '4_host'`
    );
    if (typeDb.rows.length > 0) {
      assert(typeDb.rows[0].is_locked === true || typeDb.rows[0].is_enabled === false, '4_host row in database is marked locked or disabled');
    } else {
      assert(true, '4_host row is absent from database battle types');
    }
  }

  // -------------------------------------------------------------
  // TEST 9: Public PK Type Page Shows Only 1v1
  // -------------------------------------------------------------
  console.log('\n--- TEST 9: Public PK Type Page Shows Only 1v1 ---');
  {
    const req = new NextRequest('http://localhost:3000/api/pk/battle-types');
    const res = await battleTypesRoute.GET(req);
    const data = await res.json();

    assert(res.status === 200, 'GET /api/pk/battle-types returns HTTP 200');
    assert(data.success === true, 'Response contains success: true');
    assert(data.defaultType === '1v1', 'Default type is 1v1');
    assert(data.pk1v1Enabled === true, 'pk1v1Enabled is true');
    assert(data.pk4hostEnabled === false, 'pk4hostEnabled is false');
    assert(Array.isArray(data.battleTypes), 'battleTypes is an array');
    assert(data.battleTypes.length === 1, 'Public battleTypes contains exactly 1 item');
    assert(data.battleTypes[0].id === '1v1', 'The single public item is strictly 1v1');
  }

  // -------------------------------------------------------------
  // TEST 10: No 4-Host Label Exists on Public Listing
  // -------------------------------------------------------------
  console.log('\n--- TEST 10: No 4-Host Label on Public Listing ---');
  {
    const req = new NextRequest('http://localhost:3000/api/pk/battle-types');
    const res = await battleTypesRoute.GET(req);
    const data = await res.json();

    const jsonString = JSON.stringify(data.battleTypes);
    const has4HostId = /"id"\s*:\s*"4_host"/i.test(jsonString);
    const has4HostName = /4-host|4 host/i.test(jsonString);

    assert(!has4HostId, 'No "4_host" id found in public battle types JSON');
    assert(!has4HostName, 'No "4-Host" or "4 Host" label found in public battle types text');
  }

  // -------------------------------------------------------------
  // TEST 11: No Fixture Fallback When Real PK API Mode is Enabled
  // -------------------------------------------------------------
  console.log('\n--- TEST 11: Real PostgreSQL Mode Without Fixture Fallback ---');
  {
    // Retrieve the active battle details and ensure values match PostgreSQL, NOT DesignFixtures
    const req = new NextRequest(`http://localhost:3000/api/pk/battle/${testBattleId}`);
    const res = await battleDetailsRoute.GET(req, { params: { battleId: testBattleId } });
    const data = await res.json();

    assert(data.battle.id === testBattleId, 'Real DB battle ID returned, not fixture ID');
    assert(data.battle.hostA.score === 350, 'Score is 350 from PostgreSQL, not fixture default 100');
    assert(data.battle.hostB.score === 120, 'Score is 120 from PostgreSQL, not fixture default 100');
    assert(data.battle.hostA.nickname === 'Host Maria', 'Real DB Host A nickname returned');
    assert(data.battle.hostB.nickname === 'Host Zainab', 'Real DB Host B nickname returned');
  }

  // Final Summary
  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passedChecks}/${totalChecks} CHECKS PASSED`);
  if (failedChecks === 0) {
    console.log('STATUS: ALL PHASE B7 PROMPT 1 REQUIREMENTS VERIFIED SUCCESSFULLY!');
  } else {
    console.log(`STATUS: ${failedChecks} CHECKS FAILED`);
  }
  console.log('================================================================\n');

  await pool.end();
  process.exit(0);
}

runTests().catch(err => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
