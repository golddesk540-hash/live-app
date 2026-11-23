/**
 * ============================================================================
 * POPO LIVE — PHASE B7 PROMPT 4 OF 4: PK RESULT & FINAL VERIFICATION SUITE
 * Master Plan Reference: POPO-LIVE-BACKEND-REALTIME-PLAN.pdf (Section 7, B7, page 4)
 *
 * Full End-to-End Verification of all 24 PK Result & Lifecycle Requirements:
 * 1. Host A starts PK invitation.
 * 2. Host B receives invitation.
 * 3. Host B accepts invitation.
 * 4. PK 1v1 session is created in PostgreSQL pk_battles.
 * 5. Both hosts are associated correctly.
 * 6. PK session starts with valid status & timer.
 * 7. Actual scores retrieved from PostgreSQL.
 * 8. Gift contributions recorded in pk_score_events & pk_gift_transactions.
 * 9. PK ends via POST /api/pk/battle/[battleId]/result.
 * 10. Final score is calculated server-side from PostgreSQL records.
 * 11. Winner is determined according to product rules (higher score wins).
 * 12. Result is saved in PostgreSQL table pk_battle_results.
 * 13. Repeated end request does not create duplicate result (isAlreadyFinalized: true).
 * 14. Completed PK rejects new contributions (BATTLE_ALREADY_ENDED).
 * 15. Mobile displays the saved result (matches Dart PkBattleResult model).
 * 16. Web displays the same result (matches PKResultScreen web props).
 * 17. Refresh preserves the result (idempotent GET).
 * 18. Invalid session is rejected (HTTP 404 BATTLE_NOT_FOUND).
 * 19. Unauthorized host cannot end the PK (HTTP 403 FORBIDDEN).
 * 20. 4-host PK creation is rejected (HTTP 403 BATTLE_TYPE_LOCKED).
 * 21. 4-host API access is rejected (HTTP 400 UNSUPPORTED_BATTLE_TYPE).
 * 22. Public PK type page displays 1v1 only.
 * 23. No 4-host label exists on public list.
 * 24. Draw / Tie handling verified (equal scores produce result_type: 'draw').
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

// 1. Load Environment Configuration
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
const inviteSendRoute = require(path.resolve(__dirname, 'apps/web/app/api/pk/invitation/send/route.ts'));
const inviteStatusRoute = require(path.resolve(__dirname, 'apps/web/app/api/pk/invitation/status/route.ts'));
const inviteRespondRoute = require(path.resolve(__dirname, 'apps/web/app/api/pk/invitation/respond/route.ts'));
const scoreRoute = require(path.resolve(__dirname, 'apps/web/app/api/pk/battle/[battleId]/score/route.ts'));
const scoreTimerRoute = require(path.resolve(__dirname, 'apps/web/app/api/pk/battle/[battleId]/score-timer/route.ts'));
const sendGiftRoute = require(path.resolve(__dirname, 'apps/web/app/api/pk/battle/[battleId]/gifts/send/route.ts'));
const resultRoute = require(path.resolve(__dirname, 'apps/web/app/api/pk/battle/[battleId]/result/route.ts'));
const battleTypesRoute = require(path.resolve(__dirname, 'apps/web/app/api/pk/battle-types/route.ts'));
const battleTypesSelectRoute = require(path.resolve(__dirname, 'apps/web/app/api/pk/battle-types/select/route.ts'));

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
  console.log('POPO LIVE — PHASE B7 PROMPT 4 OF 4 FINAL VERIFICATION SUITE');
  console.log('PK RESULT, WINNER/LOSER PERSISTENCE, MOBILE/WEB INTEGRATION & QA');
  console.log('================================================================\n');

  const testHostAId = '00000000-0000-0000-0000-000000088201';
  const testHostBId = '00000000-0000-0000-0000-000000088202';
  const unauthorizedUserId = '00000000-0000-0000-0000-000000088299';
  const testViewerId = '00000000-0000-0000-0000-000000099001';

  // Seed / reset clean test state
  await pool.query(
    `INSERT INTO popolive.users (id, poppo_id, nickname, email, password_hash, role, status, is_face_verified, go_live_eligible, in_pk_battle, pk_invites_enabled)
     VALUES ($1, '88201', 'Host A Sara', 'hosta@popolive.com', 'hash', 'user', 'active', true, true, false, true)
     ON CONFLICT (id) DO UPDATE SET in_pk_battle = false, pk_invites_enabled = true, status = 'active'`,
    [testHostAId]
  );
  await pool.query(
    `INSERT INTO popolive.users (id, poppo_id, nickname, email, password_hash, role, status, is_face_verified, go_live_eligible, in_pk_battle, pk_invites_enabled)
     VALUES ($1, '88202', 'Host B Ayesha', 'hostb@popolive.com', 'hash', 'user', 'active', true, true, false, true)
     ON CONFLICT (id) DO UPDATE SET in_pk_battle = false, pk_invites_enabled = true, status = 'active'`,
    [testHostBId]
  );
  await pool.query(
    `INSERT INTO popolive.users (id, poppo_id, nickname, email, password_hash, role, status)
     VALUES ($1, '88299', 'Unauthorized User', 'unauth@popolive.com', 'hash', 'user', 'active')
     ON CONFLICT (id) DO UPDATE SET status = 'active'`,
    [unauthorizedUserId]
  );
  await pool.query(
    `INSERT INTO popolive.users (id, poppo_id, nickname, email, password_hash, role, status)
     VALUES ($1, '99001', 'Test PK Viewer', 'viewer@popolive.com', 'hash', 'user', 'active')
     ON CONFLICT (id) DO UPDATE SET status = 'active'`,
    [testViewerId]
  );

  // Setup test live rooms for both hosts
  await pool.query(
    `INSERT INTO popolive.live_rooms (id, room_number, host_id, title, status, is_live, in_pk_battle)
     VALUES (gen_random_uuid(), '88201', $1, 'Sara Live Broadcast', 'live', true, false)
     ON CONFLICT (room_number) DO UPDATE SET status = 'live', is_live = true, in_pk_battle = false`,
    [testHostAId]
  );
  await pool.query(
    `INSERT INTO popolive.live_rooms (id, room_number, host_id, title, status, is_live, in_pk_battle)
     VALUES (gen_random_uuid(), '88202', $1, 'Ayesha Live Broadcast', 'live', true, false)
     ON CONFLICT (room_number) DO UPDATE SET status = 'live', is_live = true, in_pk_battle = false`,
    [testHostBId]
  );

  // Setup viewer wallet with sufficient coins
  await pool.query(
    `INSERT INTO popolive.user_wallets (wallet_id, user_id, coins, diamond_points)
     VALUES (gen_random_uuid(), $1, 10000, 0)
     ON CONFLICT (user_id) DO UPDATE SET coins = 10000`,
    [testViewerId]
  );

  // Clean any lingering pending invitations between Host A and Host B
  await pool.query(
    `UPDATE popolive.pk_invitations SET status = 'cancelled'
     WHERE (sender_host_id = $1 AND receiver_host_id = $2) OR (sender_host_id = $2 AND receiver_host_id = $1)`,
    [testHostAId, testHostBId]
  );

  let activeInvitationId = null;
  let activeBattleId = null;

  console.log('--- TEST 1: Host A Starts PK Invitation ---');
  {
    const req = new NextRequest('http://localhost:3000/api/pk/invitation/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderHostId: testHostAId,
        senderRoomNumber: '88201',
        receiverHostId: testHostBId,
        battleType: '1v1',
      }),
    });

    const res = await inviteSendRoute.POST(req);
    const data = await res.json();

    assert(res.status === 200, 'POST /api/pk/invitation/send returns HTTP 200');
    assert(data.success === true, 'Invitation response has success: true');
    assert(data.invitation && data.invitation.id, 'Invitation ID is generated');
    assert(data.invitation.senderHostId === testHostAId, 'Sender host ID matches Host A');
    assert(data.invitation.receiverHostId === testHostBId, 'Receiver host ID matches Host B');
    assert(data.invitation.status === 'pending', 'Invitation status is pending');
    activeInvitationId = data.invitation.id;
  }

  console.log('\n--- TEST 2: Host B Receives Invitation ---');
  {
    const req = new NextRequest(`http://localhost:3000/api/pk/invitation/status?receiverHostId=${testHostBId}&invitationId=${activeInvitationId}`);
    const res = await inviteStatusRoute.GET(req);
    const data = await res.json();

    assert(res.status === 200, 'GET /api/pk/invitation/status returns HTTP 200');
    assert(data.success === true, 'Status response has success: true');
    assert(data.hasActiveInvitation === true, 'Host B has an active pending invitation');
    assert(data.invitation.id === activeInvitationId, 'Invitation ID matches sent invitation');
  }

  console.log('\n--- TEST 3: Host B Accepts Invitation ---');
  {
    const req = new NextRequest('http://localhost:3000/api/pk/invitation/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invitationId: activeInvitationId,
        action: 'accept',
        receiverHostId: testHostBId,
      }),
    });

    const res = await inviteRespondRoute.POST(req);
    const data = await res.json();

    assert(res.status === 200, 'POST /api/pk/invitation/respond (accept) returns HTTP 200');
    assert(data.success === true, 'Accept response has success: true');
    assert(data.action === 'accepted', 'Action is confirmed as accepted');
    assert(data.battle && data.battle.id, 'Battle session is returned');
    activeBattleId = data.battle.id;
  }

  console.log('\n--- TEST 4 & 5: PK 1v1 Session Created & Hosts Associated Correctly ---');
  {
    const battleRows = (await pool.query(
      `SELECT * FROM popolive.pk_battles WHERE id = $1`,
      [activeBattleId]
    )).rows;

    assert(battleRows.length === 1, 'PK Battle record exists in popolive.pk_battles');
    const battle = battleRows[0];
    assert(battle.battle_type === '1v1', 'Battle type is strictly 1v1');
    assert(battle.host_a_id === testHostAId, 'host_a_id matches Host A');
    assert(battle.host_b_id === testHostBId, 'host_b_id matches Host B');
    assert(battle.status === 'confirmed' || battle.status === 'active', 'Battle status is confirmed/active');
    assert(battle.invitation_id === activeInvitationId, 'Battle links to invitation_id');

    // Update status to active with a fresh timer for test
    await pool.query(
      `UPDATE popolive.pk_battles
       SET status = 'active', timer_status = 'normal', duration_seconds = 300, remaining_seconds = 300,
           expires_at = NOW() + INTERVAL '5 minutes'
       WHERE id = $1`,
      [activeBattleId]
    );
  }

  console.log('\n--- TEST 6 & 7: PK Starts & Actual Scores Retrieved ---');
  {
    const req = new NextRequest(`http://localhost:3000/api/pk/battle/${activeBattleId}/score`);
    const res = await scoreRoute.GET(req, { params: { battleId: activeBattleId } });
    const data = await res.json();

    assert(res.status === 200, 'GET /api/pk/battle/[battleId]/score returns HTTP 200');
    assert(data.success === true, 'Score retrieval returns success: true');
    assert(data.hostA.score === 0, 'Initial score for Host A is 0');
    assert(data.hostB.score === 0, 'Initial score for Host B is 0');
    assert(data.leadingSide === 'tie', 'Initial leading side is tie');
  }

  console.log('\n--- TEST 8: Gift Contributions Recorded for Host A & Host B ---');
  {
    // Gift 1: Send 10x crown (500 coins) to Host A
    const reqGiftA = new NextRequest(`http://localhost:3000/api/pk/battle/${activeBattleId}/gifts/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: testViewerId,
        senderName: 'Test PK Viewer',
        receiverSide: 'host_a',
        giftId: 'crown', // 50 coins * 10 = 500 coins
        quantity: 10,
        idempotencyKey: `final_qa_gift_a_${Date.now()}`,
      }),
    });
    const resGiftA = await sendGiftRoute.POST(reqGiftA, { params: { battleId: activeBattleId } });
    const dataGiftA = await resGiftA.json();
    assert(resGiftA.status === 200 && dataGiftA.success === true, 'Host A gift (500 coins) succeeded');

    // Gift 2: Send 4x crown (200 coins) to Host B
    const reqGiftB = new NextRequest(`http://localhost:3000/api/pk/battle/${activeBattleId}/gifts/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: testViewerId,
        senderName: 'Test PK Viewer',
        receiverSide: 'host_b',
        giftId: 'crown', // 50 coins * 4 = 200 coins
        quantity: 4,
        idempotencyKey: `final_qa_gift_b_${Date.now()}`,
      }),
    });
    const resGiftB = await sendGiftRoute.POST(reqGiftB, { params: { battleId: activeBattleId } });
    const dataGiftB = await resGiftB.json();
    assert(resGiftB.status === 200 && dataGiftB.success === true, 'Host B gift (200 coins) succeeded');

    // Verify scores in PostgreSQL: Host A = 500, Host B = 200
    const bCheck = (await pool.query(`SELECT host_a_score, host_b_score, leading_host_id FROM popolive.pk_battles WHERE id = $1`, [activeBattleId])).rows[0];
    assert(parseInt(bCheck.host_a_score, 10) === 500, 'PostgreSQL host_a_score is 500');
    assert(parseInt(bCheck.host_b_score, 10) === 200, 'PostgreSQL host_b_score is 200');
    assert(bCheck.leading_host_id === testHostAId, 'Host A is leading');
  }

  console.log('\n--- TEST 9, 10, 11 & 12: PK Ends, Final Score Calculated, Winner Determined & Saved in PostgreSQL ---');
  let finalResultId = null;
  {
    const reqEnd = new NextRequest(`http://localhost:3000/api/pk/battle/${activeBattleId}/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostId: testHostAId, // Authorized Host A ending the battle
        action: 'end_battle',
        reason: 'timer_expired',
      }),
    });

    const resEnd = await resultRoute.POST(reqEnd, { params: { battleId: activeBattleId } });
    const dataEnd = await resEnd.json();

    assert(resEnd.status === 200, 'POST /api/pk/battle/[battleId]/result returns HTTP 200');
    assert(dataEnd.success === true, 'Result response has success: true');
    assert(dataEnd.isCalculated === true, 'isCalculated is true');
    assert(dataEnd.isAlreadyFinalized === false, 'isAlreadyFinalized is false on first finalize');

    const result = dataEnd.result;
    assert(result.hostAScore === 500, 'Final score A is 500');
    assert(result.hostBScore === 200, 'Final score B is 200');
    assert(result.resultType === 'winner_declared', 'Result type is winner_declared');
    assert(result.winnerHostId === testHostAId, 'Host A is determined winner (500 > 200)');
    assert(result.winnerScore === 500, 'Winner score is 500');
    assert(result.loserHostId === testHostBId, 'Host B is determined loser');
    assert(result.loserScore === 200, 'Loser score is 200');
    assert(result.scoreDiff === 300, 'Score difference is 300 (500 - 200)');
    assert(result.giftContributions && result.giftContributions.totalCoins === 700, 'Gift contribution total coins is 700 (500 + 200)');
    finalResultId = result.id;

    // Verify in PostgreSQL pk_battle_results
    const dbResults = (await pool.query(
      `SELECT * FROM popolive.pk_battle_results WHERE battle_id = $1`,
      [activeBattleId]
    )).rows;
    assert(dbResults.length === 1, 'Exactly ONE record saved in popolive.pk_battle_results');
    assert(dbResults[0].winner_host_id === testHostAId, 'PostgreSQL pk_battle_results winner_host_id is Host A');

    // Verify in PostgreSQL pk_battles
    const dbBattle = (await pool.query(
      `SELECT status, winner_host_id, result_id, result_type FROM popolive.pk_battles WHERE id = $1`,
      [activeBattleId]
    )).rows[0];
    assert(dbBattle.status === 'completed', 'pk_battles status updated to completed');
    assert(dbBattle.winner_host_id === testHostAId, 'pk_battles winner_host_id updated to Host A');
    assert(dbBattle.result_id === finalResultId, 'pk_battles result_id references saved result');
  }

  console.log('\n--- TEST 13: Repeated End Request Does NOT Create Duplicate Result ---');
  {
    const reqRepeat = new NextRequest(`http://localhost:3000/api/pk/battle/${activeBattleId}/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostId: testHostBId, // Host B calls end
        action: 'end_battle',
      }),
    });

    const resRepeat = await resultRoute.POST(reqRepeat, { params: { battleId: activeBattleId } });
    const dataRepeat = await resRepeat.json();

    assert(resRepeat.status === 200, 'Repeated end request returns HTTP 200');
    assert(dataRepeat.isAlreadyFinalized === true, 'Response flags isAlreadyFinalized: true');
    assert(dataRepeat.result.id === finalResultId, 'Returns the exact same saved result ID');

    // Verify in PostgreSQL that still only ONE record exists
    const countRes = (await pool.query(
      `SELECT COUNT(*) FROM popolive.pk_battle_results WHERE battle_id = $1`,
      [activeBattleId]
    )).rows[0];
    assert(parseInt(countRes.count, 10) === 1, 'PostgreSQL pk_battle_results still contains exactly 1 row (no duplicate)');
  }

  console.log('\n--- TEST 14: Completed PK Rejects New Contributions ---');
  {
    const reqLateGift = new NextRequest(`http://localhost:3000/api/pk/battle/${activeBattleId}/gifts/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId: testViewerId,
        senderName: 'Test Viewer',
        receiverSide: 'host_a',
        giftId: 'rose',
        quantity: 1,
      }),
    });

    const resLateGift = await sendGiftRoute.POST(reqLateGift, { params: { battleId: activeBattleId } });
    const dataLateGift = await resLateGift.json();

    assert(resLateGift.status === 400, 'POST /gifts/send on completed battle returns HTTP 400');
    assert(dataLateGift.code === 'BATTLE_ALREADY_ENDED', 'Error code is BATTLE_ALREADY_ENDED');

    // Verify scores in PostgreSQL remain unchanged
    const bCheck = (await pool.query(`SELECT host_a_score, host_b_score FROM popolive.pk_battles WHERE id = $1`, [activeBattleId])).rows[0];
    assert(parseInt(bCheck.host_a_score, 10) === 500, 'host_a_score remains 500 (no late increments)');
  }

  console.log('\n--- TEST 15 & 16: Mobile & Web Display Saved Result ---');
  {
    const reqGet = new NextRequest(`http://localhost:3000/api/pk/battle/${activeBattleId}/result`);
    const resGet = await resultRoute.GET(reqGet, { params: { battleId: activeBattleId } });
    const dataGet = await resGet.json();

    assert(resGet.status === 200, 'GET /api/pk/battle/[battleId]/result returns HTTP 200');
    assert(dataGet.success === true, 'Response contains success: true');
    assert(dataGet.isCalculated === true, 'isCalculated is true');

    const res = dataGet.result;
    // Mobile PkBattleResult parser compatibility checks:
    assert(typeof res.id === 'string' && res.id.length > 0, 'result.id is string');
    assert(typeof res.battleId === 'string' && res.battleId === activeBattleId, 'result.battleId matches');
    assert(typeof res.hostAScore === 'number' && res.hostAScore === 500, 'hostAScore is numeric 500');
    assert(typeof res.hostBScore === 'number' && res.hostBScore === 200, 'hostBScore is numeric 200');
    assert(res.winnerHostId === testHostAId, 'winnerHostId is Host A');
    assert(res.loserHostId === testHostBId, 'loserHostId is Host B');
    assert(res.scoreDiff === 300, 'scoreDiff is 300');

    // Web PKResultScreen props compatibility checks:
    assert(res.hostANickname && res.hostBNickname, 'hostANickname and hostBNickname are present for web display');
    assert(res.winnerNickname && res.loserNickname, 'winnerNickname and loserNickname are present for web display');
    assert(res.giftContributions && typeof res.giftContributions.totalCoins === 'number', 'giftContributions is present for web display');
  }

  console.log('\n--- TEST 17: Refresh Preserves Result ---');
  {
    const reqGet2 = new NextRequest(`http://localhost:3000/api/pk/battle/${activeBattleId}/result`);
    const resGet2 = await resultRoute.GET(reqGet2, { params: { battleId: activeBattleId } });
    const dataGet2 = await resGet2.json();

    assert(resGet2.status === 200, 'Subsequent GET /result returns HTTP 200');
    assert(dataGet2.result.id === finalResultId, 'Result ID matches exactly after refresh');
    assert(dataGet2.result.winnerScore === 500, 'Winner score remains 500 after refresh');
  }

  console.log('\n--- TEST 18: Invalid Session is Rejected ---');
  {
    const nonExistentBattleId = '00000000-0000-0000-0000-000000000999';
    const reqInvalid = new NextRequest(`http://localhost:3000/api/pk/battle/${nonExistentBattleId}/result`);
    const resInvalid = await resultRoute.GET(reqInvalid, { params: { battleId: nonExistentBattleId } });
    const dataInvalid = await resInvalid.json();

    assert(resInvalid.status === 404, 'GET /result for non-existent battle returns HTTP 404');
    assert(dataInvalid.code === 'BATTLE_NOT_FOUND', 'Error code is BATTLE_NOT_FOUND');
  }

  console.log('\n--- TEST 19: Unauthorized Host Cannot End the PK ---');
  {
    // Create another active battle between Host A and Host B
    const battleToTestAuth = '00000000-0000-0000-0000-000000000888';
    await pool.query(
      `INSERT INTO popolive.pk_battles (
         id, battle_type, status, host_a_id, host_b_id, host_a_room, host_b_room,
         host_a_nickname, host_b_nickname,
         host_a_score, host_b_score, duration_seconds, remaining_seconds, expires_at
       ) VALUES (
         $1, '1v1', 'active', $2, $3, '88201', '88202',
         'Sara Live', 'Ayesha',
         10, 10, 300, 200, NOW() + INTERVAL '3 minutes'
       ) ON CONFLICT (id) DO UPDATE SET status = 'active'`,
      [battleToTestAuth, testHostAId, testHostBId]
    );

    // Random unauthorized user tries to call end
    const reqUnauth = new NextRequest(`http://localhost:3000/api/pk/battle/${battleToTestAuth}/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callerId: unauthorizedUserId,
        action: 'end_battle',
      }),
    });

    const resUnauth = await resultRoute.POST(reqUnauth, { params: { battleId: battleToTestAuth } });
    const dataUnauth = await resUnauth.json();

    assert(resUnauth.status === 403, 'POST /result by unauthorized user returns HTTP 403');
    assert(dataUnauth.code === 'FORBIDDEN', 'Error code is FORBIDDEN');

    // Clean up
    await pool.query(`DELETE FROM popolive.pk_battles WHERE id = $1`, [battleToTestAuth]);
  }

  console.log('\n--- TEST 20 & 21: 4-Host PK Creation & API Access Rejected ---');
  {
    // 20. 4-Host PK Selection / Creation rejected
    const reqSelect4Host = new NextRequest('http://localhost:3000/api/pk/battle-types/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomNumber: '88201',
        battleType: '4_host',
      }),
    });

    const resSelect4Host = await battleTypesSelectRoute.POST(reqSelect4Host);
    const dataSelect4Host = await resSelect4Host.json();

    assert(resSelect4Host.status === 403 || resSelect4Host.status === 400, 'Selecting 4_host returns HTTP 400/403');
    assert(dataSelect4Host.success === false, '4_host selection is rejected');

    // 21. Attempt to finalize a 4-host battle
    const battle4HostId = '00000000-0000-0000-0000-000000000444';
    await pool.query(
      `INSERT INTO popolive.pk_battles (
         id, battle_type, status, host_a_id, host_b_id, host_a_room, host_b_room,
         host_a_nickname, host_b_nickname,
         host_a_score, host_b_score
       ) VALUES (
         $1, '4_host', 'active', $2, $3, '88201', '88202',
         'Sara Live', 'Ayesha',
         0, 0
       ) ON CONFLICT (id) DO UPDATE SET battle_type = '4_host', status = 'active'`,
      [battle4HostId, testHostAId, testHostBId]
    );

    const reqEnd4Host = new NextRequest(`http://localhost:3000/api/pk/battle/${battle4HostId}/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostId: testHostAId, action: 'end_battle' }),
    });

    const resEnd4Host = await resultRoute.POST(reqEnd4Host, { params: { battleId: battle4HostId } });
    const dataEnd4Host = await resEnd4Host.json();

    assert(resEnd4Host.status === 400, 'POST /result on 4_host battle returns HTTP 400');
    assert(dataEnd4Host.code === 'UNSUPPORTED_BATTLE_TYPE', 'Error code is UNSUPPORTED_BATTLE_TYPE');

    await pool.query(`DELETE FROM popolive.pk_battles WHERE id = $1`, [battle4HostId]);
  }

  console.log('\n--- TEST 22 & 23: Public PK Type Page Displays 1v1 Only & No 4-Host Label Exists ---');
  {
    const reqTypes = new NextRequest('http://localhost:3000/api/pk/battle-types');
    const resTypes = await battleTypesRoute.GET(reqTypes);
    const dataTypes = await resTypes.json();

    assert(resTypes.status === 200, 'GET /api/pk/battle-types returns HTTP 200');
    assert(dataTypes.success === true, 'Response has success: true');
    assert(dataTypes.defaultType === '1v1', 'Default battle type is strictly 1v1');
    assert(dataTypes.featureFlags.pk1v1Enabled === true, 'pk1v1Enabled feature flag is true');
    assert(dataTypes.featureFlags.pk4hostEnabled === false, 'pk4hostEnabled feature flag is false');

    const types = dataTypes.battleTypes;
    assert(types.length === 1, `Public battle types list contains exactly 1 type (received: ${types.length})`);
    assert(types[0].id === '1v1', 'The only displayed public battle type is 1v1');

    const has4Host = types.some((t) => t.id === '4_host' || t.name.includes('4-Host') || t.name.includes('4 میزبان'));
    assert(has4Host === false, '4-Host is completely absent from the public list (no public label exists)');
  }

  console.log('\n--- TEST 24: Tie / Draw Handling Verified ---');
  {
    const tieBattleId = '00000000-0000-0000-0000-000000000777';
    await pool.query(
      `INSERT INTO popolive.pk_battles (
         id, battle_type, status, host_a_id, host_b_id, host_a_room, host_b_room,
         host_a_nickname, host_b_nickname, host_a_score, host_b_score,
         duration_seconds, remaining_seconds, expires_at
       ) VALUES (
         $1, '1v1', 'active', $2, $3, '88201', '88202',
         'Sara Live', 'Ayesha', 250, 250,
         300, 0, NOW() - INTERVAL '1 minute'
       ) ON CONFLICT (id) DO UPDATE SET
         status = 'active', host_a_score = 250, host_b_score = 250`,
      [tieBattleId, testHostAId, testHostBId]
    );

    const reqTie = new NextRequest(`http://localhost:3000/api/pk/battle/${tieBattleId}/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostId: testHostAId, action: 'end_battle' }),
    });

    const resTie = await resultRoute.POST(reqTie, { params: { battleId: tieBattleId } });
    const dataTie = await resTie.json();

    assert(resTie.status === 200, 'Finalizing tied battle returns HTTP 200');
    const result = dataTie.result;
    assert(result.resultType === 'draw', 'Result type is draw');
    assert(result.winnerHostId === null, 'winnerHostId is null on draw');
    assert(result.loserHostId === null, 'loserHostId is null on draw');
    assert(result.scoreDiff === 0, 'scoreDiff is 0 on draw');
    assert(result.hostAScore === 250 && result.hostBScore === 250, 'Both host scores are equal (250)');

    // Verify in PostgreSQL pk_battle_results
    const dbTie = (await pool.query(`SELECT * FROM popolive.pk_battle_results WHERE battle_id = $1`, [tieBattleId])).rows[0];
    assert(dbTie.result_type === 'draw', 'PostgreSQL pk_battle_results result_type is draw');
    assert(dbTie.winner_host_id === null, 'PostgreSQL pk_battle_results winner_host_id is null');

    // Clean up
    await pool.query(`DELETE FROM popolive.pk_battle_results WHERE battle_id = $1`, [tieBattleId]);
    await pool.query(`DELETE FROM popolive.pk_battles WHERE id = $1`, [tieBattleId]);
  }

  await pool.end();

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passedChecks}/${totalChecks} CHECKS PASSED`);
  if (failedChecks === 0) {
    console.log('STATUS: ALL PHASE B7 REQUIREMENTS VERIFIED SUCCESSFULLY!');
    console.log('================================================================\n');
    process.exit(0);
  } else {
    console.error(`STATUS: ${failedChecks} CHECKS FAILED!`);
    console.log('================================================================\n');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
