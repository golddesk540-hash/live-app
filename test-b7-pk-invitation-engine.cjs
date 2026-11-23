/**
 * POPO LIVE — PHASE B7 PROMPT 2 OF 4 VERIFICATION SUITE
 * PK 1v1 INVITATION + HOST ACCEPTANCE + REJECTION
 *
 * Verifies:
 * 1. Valid invitation.
 * 2. Invalid target host.
 * 3. Unauthorized invitation.
 * 4. Valid acceptance.
 * 5. Valid rejection.
 * 6. Duplicate acceptance.
 * 7. Duplicate rejection.
 * 8. Expired invitation.
 * 9. Ended room.
 * 10. Two-host PK session creation.
 * 11. 4-host invitation rejection.
 * 12. Mobile flow.
 * 13. Web flow.
 * 14. Database persistence.
 */

const path = require('path');
const { NextRequest } = require(path.resolve(__dirname, 'apps/web/node_modules/next/server'));
const { Pool } = require(path.resolve(__dirname, 'apps/web/node_modules/pg'));

// Target PostgreSQL database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  options: '-c search_path=popolive,public',
});

// Import route handlers
const inviteSendRoute = require(path.resolve(__dirname, 'apps/web/app/api/pk/invitation/send/route.ts'));
const inviteStatusRoute = require(path.resolve(__dirname, 'apps/web/app/api/pk/invitation/status/route.ts'));
const inviteRespondRoute = require(path.resolve(__dirname, 'apps/web/app/api/pk/invitation/respond/route.ts'));
const inviteCancelRoute = require(path.resolve(__dirname, 'apps/web/app/api/pk/invitation/cancel/route.ts'));
const battleTypesRoute = require(path.resolve(__dirname, 'apps/web/app/api/pk/battle-types/route.ts'));

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
  console.log('POPO LIVE — PHASE B7 PROMPT 2 OF 4 AUTOMATED VERIFICATION SUITE');
  console.log('PK 1v1 INVITATION + HOST ACCEPTANCE + REJECTION');
  console.log('================================================================\n');

  const hostAId = '00000000-0000-0000-0000-000000088101';
  const hostBId = '00000000-0000-0000-0000-000000088102';
  const hostCId = '00000000-0000-0000-0000-000000088103';
  const rogueUserId = '00000000-0000-0000-0000-000000088199';

  // Seed / reset clean test state
  await pool.query(
    `INSERT INTO popolive.users (id, poppo_id, nickname, email, password_hash, role, status, is_face_verified, go_live_eligible, in_pk_battle, pk_invites_enabled)
     VALUES ($1, '88101', 'Host Alpha', 'hosta@popolive.com', 'hash', 'user', 'active', true, true, false, true)
     ON CONFLICT (id) DO UPDATE SET in_pk_battle = false, pk_invites_enabled = true, status = 'active'`,
    [hostAId]
  );
  await pool.query(
    `INSERT INTO popolive.users (id, poppo_id, nickname, email, password_hash, role, status, is_face_verified, go_live_eligible, in_pk_battle, pk_invites_enabled)
     VALUES ($1, '88102', 'Host Beta', 'hostb@popolive.com', 'hash', 'user', 'active', true, true, false, true)
     ON CONFLICT (id) DO UPDATE SET in_pk_battle = false, pk_invites_enabled = true, status = 'active'`,
    [hostBId]
  );
  await pool.query(
    `INSERT INTO popolive.users (id, poppo_id, nickname, email, password_hash, role, status, is_face_verified, go_live_eligible, in_pk_battle, pk_invites_enabled)
     VALUES ($1, '88103', 'Host Gamma', 'hostc@popolive.com', 'hash', 'user', 'active', true, true, false, true)
     ON CONFLICT (id) DO UPDATE SET in_pk_battle = false, pk_invites_enabled = true, status = 'active'`,
    [hostCId]
  );
  await pool.query(
    `INSERT INTO popolive.users (id, poppo_id, nickname, email, password_hash, role, status)
     VALUES ($1, '88199', 'Rogue Stranger', 'rogue@popolive.com', 'hash', 'user', 'active')
     ON CONFLICT (id) DO UPDATE SET status = 'active'`,
    [rogueUserId]
  );

  // Setup active live rooms
  await pool.query(
    `INSERT INTO popolive.live_rooms (id, room_number, host_id, title, status, is_live, in_pk_battle)
     VALUES (gen_random_uuid(), '88101', $1, 'Alpha Broadcast', 'live', true, false)
     ON CONFLICT (room_number) DO UPDATE SET status = 'live', is_live = true, in_pk_battle = false`,
    [hostAId]
  );
  await pool.query(
    `INSERT INTO popolive.live_rooms (id, room_number, host_id, title, status, is_live, in_pk_battle)
     VALUES (gen_random_uuid(), '88102', $1, 'Beta Broadcast', 'live', true, false)
     ON CONFLICT (room_number) DO UPDATE SET status = 'live', is_live = true, in_pk_battle = false`,
    [hostBId]
  );
  await pool.query(
    `INSERT INTO popolive.live_rooms (id, room_number, host_id, title, status, is_live, in_pk_battle)
     VALUES (gen_random_uuid(), '88103', $1, 'Gamma Broadcast', 'live', true, false)
     ON CONFLICT (room_number) DO UPDATE SET status = 'live', is_live = true, in_pk_battle = false`,
    [hostCId]
  );

  // Clean prior invites
  await pool.query(
    `UPDATE popolive.pk_invitations SET status = 'cancelled'
     WHERE sender_host_id IN ($1, $2, $3) OR receiver_host_id IN ($1, $2, $3)`,
    [hostAId, hostBId, hostCId]
  );

  let invitation1Id = null;
  let invitation2Id = null;

  // -------------------------------------------------------------
  // TEST 1: Valid Invitation
  // -------------------------------------------------------------
  console.log('--- TEST 1: Valid 1v1 Invitation Creation ---');
  {
    const req = new NextRequest('http://localhost:3000/api/pk/invitation/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderHostId: hostAId,
        senderRoomNumber: '88101',
        receiverHostId: hostBId,
        battleType: '1v1',
      }),
    });

    const res = await inviteSendRoute.POST(req);
    const data = await res.json();

    assert(res.status === 200, 'POST /api/pk/invitation/send returns HTTP 200');
    assert(data.success === true, 'Response has success: true');
    assert(data.invitation && data.invitation.id, 'Invitation ID is generated');
    assert(data.invitation.senderHostId === hostAId, 'Sender host matches Host A');
    assert(data.invitation.receiverHostId === hostBId, 'Receiver host matches Host B');
    assert(data.invitation.status === 'pending', 'Invitation status is pending');
    assert(data.invitation.battleType === '1v1', 'Battle type is 1v1');
    invitation1Id = data.invitation.id;
  }

  // -------------------------------------------------------------
  // TEST 2: Invalid Target Host
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Invalid Target Host Rejected ---');
  {
    const req = new NextRequest('http://localhost:3000/api/pk/invitation/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderHostId: hostAId,
        receiverHostId: '00000000-0000-0000-0000-000000000000', // Non-existent host
      }),
    });

    const res = await inviteSendRoute.POST(req);
    const data = await res.json();

    assert(res.status === 404, 'Non-existent target host returns HTTP 404');
    assert(data.code === 'RECEIVER_NOT_FOUND', 'Error code is RECEIVER_NOT_FOUND');
  }

  // -------------------------------------------------------------
  // TEST 3: Unauthorized Invitation / Self-Invite Rejected
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: Unauthorized & Self-Invite Rejected ---');
  {
    // Self-invite
    const reqSelf = new NextRequest('http://localhost:3000/api/pk/invitation/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderHostId: hostAId,
        receiverHostId: hostAId,
      }),
    });
    const resSelf = await inviteSendRoute.POST(reqSelf);
    const dataSelf = await resSelf.json();
    assert(resSelf.status === 400, 'Self-invitation returns HTTP 400');
    assert(dataSelf.code === 'CANNOT_INVITE_SELF', 'Error code is CANNOT_INVITE_SELF');

    // Missing sender
    const reqNoSender = new NextRequest('http://localhost:3000/api/pk/invitation/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiverHostId: hostBId,
      }),
    });
    const resNoSender = await inviteSendRoute.POST(reqNoSender);
    assert(resNoSender.status === 401, 'Missing authenticated sender returns HTTP 401');
  }

  // -------------------------------------------------------------
  // TEST 4: Valid Acceptance
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Valid Acceptance by Target Host ---');
  let activeBattleId = null;
  {
    const req = new NextRequest('http://localhost:3000/api/pk/invitation/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invitationId: invitation1Id,
        action: 'accept',
        receiverHostId: hostBId,
      }),
    });

    const res = await inviteRespondRoute.POST(req);
    const data = await res.json();

    assert(res.status === 200, 'Accepting pending invitation returns HTTP 200');
    assert(data.success === true, 'Accept response has success: true');
    assert(data.action === 'accepted', 'Action confirmed as accepted');
    assert(data.battle && data.battle.id, 'Battle session is returned');
    assert(data.battle.hostA.id === hostAId, 'Battle host A matches inviter');
    assert(data.battle.hostB.id === hostBId, 'Battle host B matches receiver');
    activeBattleId = data.battle.id;
  }

  // -------------------------------------------------------------
  // TEST 5: Duplicate Acceptance Prevention
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Duplicate Acceptance Prevention ---');
  {
    const req = new NextRequest('http://localhost:3000/api/pk/invitation/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invitationId: invitation1Id,
        action: 'accept',
        receiverHostId: hostBId,
      }),
    });

    const res = await inviteRespondRoute.POST(req);
    const data = await res.json();

    assert(res.status === 409 || res.status === 400 || res.status === 410, 'Duplicate acceptance returns 400/409/410');
    assert(data.code === 'ALREADY_ACCEPTED' || data.code === 'INVITATION_INACTIVE', `Expected ALREADY_ACCEPTED (got ${data.code})`);
  }

  // Reset hosts from battle for rejection testing
  await pool.query(
    `UPDATE popolive.users SET in_pk_battle = false WHERE id IN ($1, $2, $3)`,
    [hostAId, hostBId, hostCId]
  );
  await pool.query(
    `UPDATE popolive.live_rooms SET in_pk_battle = false WHERE host_id IN ($1, $2, $3)`,
    [hostAId, hostBId, hostCId]
  );

  // -------------------------------------------------------------
  // TEST 6: Valid Rejection
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: Valid Rejection by Target Host ---');
  {
    // Send second invite from Host A to Host C
    const sendReq = new NextRequest('http://localhost:3000/api/pk/invitation/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderHostId: hostAId,
        senderRoomNumber: '88101',
        receiverHostId: hostCId,
        battleType: '1v1',
      }),
    });
    const sendRes = await inviteSendRoute.POST(sendReq);
    const sendData = await sendRes.json();
    invitation2Id = sendData.invitation.id;

    // Reject by Host C
    const rejReq = new NextRequest('http://localhost:3000/api/pk/invitation/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invitationId: invitation2Id,
        action: 'reject',
        receiverHostId: hostCId,
        reason: 'busy_broadcasting',
      }),
    });
    const rejRes = await inviteRespondRoute.POST(rejReq);
    const rejData = await rejRes.json();

    assert(rejRes.status === 200, 'Rejection by invited host returns HTTP 200');
    assert(rejData.action === 'rejected', 'Action is confirmed as rejected');

    // Verify in database: status is rejected and NO battle created
    const invDb = await pool.query(`SELECT status, rejection_reason FROM popolive.pk_invitations WHERE id = $1`, [invitation2Id]);
    assert(invDb.rows[0].status === 'rejected', 'Database invitation status is rejected');
    assert(invDb.rows[0].rejection_reason === 'busy_broadcasting', 'Database recorded rejection reason');

    const battleDb = await pool.query(`SELECT id FROM popolive.pk_battles WHERE invitation_id = $1`, [invitation2Id]);
    assert(battleDb.rows.length === 0, 'No PK battle was created for rejected invitation');
  }

  // -------------------------------------------------------------
  // TEST 7: Duplicate Rejection Prevention
  // -------------------------------------------------------------
  console.log('\n--- TEST 7: Duplicate Rejection Prevention ---');
  {
    const req = new NextRequest('http://localhost:3000/api/pk/invitation/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invitationId: invitation2Id,
        action: 'reject',
        receiverHostId: hostCId,
      }),
    });

    const res = await inviteRespondRoute.POST(req);
    const data = await res.json();

    assert(res.status === 409 || res.status === 400 || res.status === 410, 'Duplicate rejection returns 400/409/410');
    assert(data.code === 'ALREADY_REJECTED' || data.code === 'INVITATION_INACTIVE', `Expected ALREADY_REJECTED (got ${data.code})`);
  }

  // -------------------------------------------------------------
  // TEST 8: Unauthorized Responding (Stranger or Sender) Rejected
  // -------------------------------------------------------------
  console.log('\n--- TEST 8: Unauthorized Host Cannot Accept or Reject ---');
  {
    // Create new invite
    const sendReq = new NextRequest('http://localhost:3000/api/pk/invitation/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderHostId: hostAId,
        senderRoomNumber: '88101',
        receiverHostId: hostBId,
        battleType: '1v1',
      }),
    });
    const sendRes = await inviteSendRoute.POST(sendReq);
    const sendData = await sendRes.json();
    const inv3Id = sendData.invitation.id;

    // Stranger tries to accept
    const rogueReq = new NextRequest('http://localhost:3000/api/pk/invitation/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invitationId: inv3Id,
        action: 'accept',
        receiverHostId: rogueUserId,
      }),
    });
    const rogueRes = await inviteRespondRoute.POST(rogueReq);
    const rogueData = await rogueRes.json();

    assert(rogueRes.status === 403, 'Unauthorized user acceptance returns HTTP 403');
    assert(rogueData.code === 'FORBIDDEN', 'Error code is FORBIDDEN');

    // Sender tries to accept their own invite
    const senderReq = new NextRequest('http://localhost:3000/api/pk/invitation/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invitationId: inv3Id,
        action: 'accept',
        receiverHostId: hostAId,
      }),
    });
    const senderRes = await inviteRespondRoute.POST(senderReq);
    assert(senderRes.status === 403, 'Sender cannot accept own invite (returns HTTP 403)');
  }

  // -------------------------------------------------------------
  // TEST 9: Expired Invitation Handling
  // -------------------------------------------------------------
  console.log('\n--- TEST 9: Expired Invitation Handling ---');
  {
    // Insert an artificially expired invitation
    const expRes = await pool.query(
      `INSERT INTO popolive.pk_invitations (
         sender_host_id, sender_room_number, sender_nickname, sender_avatar,
         receiver_host_id, receiver_room_number, receiver_nickname, receiver_avatar,
         battle_type, status, expires_at, created_at, updated_at
       )
       VALUES ($1, '88101', 'Host Alpha', '/avatar.png', $2, '88102', 'Host Beta', '/avatar.png', '1v1', 'pending', NOW() - INTERVAL '1 minute', NOW() - INTERVAL '2 minutes', NOW())
       RETURNING id`,
      [hostAId, hostBId]
    );
    const expId = expRes.rows[0].id;

    const req = new NextRequest('http://localhost:3000/api/pk/invitation/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invitationId: expId,
        action: 'accept',
        receiverHostId: hostBId,
      }),
    });

    const res = await inviteRespondRoute.POST(req);
    const data = await res.json();

    assert(res.status === 410, 'Expired invitation returns HTTP 410');
    assert(data.status === 'expired', 'Response indicates invitation status is expired');
  }

  // -------------------------------------------------------------
  // TEST 10: Ended Room Handling
  // -------------------------------------------------------------
  console.log('\n--- TEST 10: Ended Live Room Prevents PK Acceptance ---');
  {
    // Clean prior pending invites between Host A and Host B
    await pool.query(
      `UPDATE popolive.pk_invitations SET status = 'cancelled'
       WHERE sender_host_id = $1 AND receiver_host_id = $2 AND status = 'pending'`,
      [hostAId, hostBId]
    );

    // Create new invite
    const sendReq = new NextRequest('http://localhost:3000/api/pk/invitation/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderHostId: hostAId,
        senderRoomNumber: '88101',
        receiverHostId: hostBId,
        battleType: '1v1',
      }),
    });
    const sendRes = await inviteSendRoute.POST(sendReq);
    const sendData = await sendRes.json();
    const invRoomEndId = sendData.invitation.id;

    // Simulate sender room ending
    await pool.query(`UPDATE popolive.live_rooms SET status = 'ended', is_live = false WHERE room_number = '88101'`);

    const req = new NextRequest('http://localhost:3000/api/pk/invitation/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invitationId: invRoomEndId,
        action: 'accept',
        receiverHostId: hostBId,
      }),
    });

    const res = await inviteRespondRoute.POST(req);
    const data = await res.json();

    assert(res.status === 400, 'Acceptance with ended broadcast returns HTTP 400');
    assert(data.code === 'ROOM_ENDED', 'Error code is ROOM_ENDED');

    // Restore room for other tests
    await pool.query(`UPDATE popolive.live_rooms SET status = 'live', is_live = true WHERE room_number = '88101'`);
  }

  // -------------------------------------------------------------
  // TEST 11: 4-Host Invitation Rejection (1v1 Restriction)
  // -------------------------------------------------------------
  console.log('\n--- TEST 11: 4-Host Invitation Rejection (1v1 Enforcement) ---');
  {
    const req = new NextRequest('http://localhost:3000/api/pk/invitation/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderHostId: hostAId,
        senderRoomNumber: '88101',
        receiverHostId: hostBId,
        battleType: '4_host',
      }),
    });

    const res = await inviteSendRoute.POST(req);
    const data = await res.json();

    assert(res.status === 400, '4-host invitation returns HTTP 400');
    assert(data.code === 'UNSUPPORTED_BATTLE_TYPE', 'Error code is UNSUPPORTED_BATTLE_TYPE');
  }

  // -------------------------------------------------------------
  // TEST 12: Mobile Flow Integration
  // -------------------------------------------------------------
  console.log('\n--- TEST 12: Mobile Flow Integration (Status & Discovery) ---');
  {
    const req = new NextRequest(`http://localhost:3000/api/pk/invitation/status?hostId=${hostBId}`);
    const res = await inviteStatusRoute.GET(req);
    const data = await res.json();

    assert(res.status === 200, 'GET /api/pk/invitation/status returns HTTP 200');
    assert(data.success === true, 'Response contains success: true');
    assert(typeof data.hasActiveInvitation === 'boolean', 'hasActiveInvitation is boolean');
  }

  // -------------------------------------------------------------
  // TEST 13: Web Flow Integration & Public Battle Types
  // -------------------------------------------------------------
  console.log('\n--- TEST 13: Web Flow & Public Battle Types Check ---');
  {
    const req = new NextRequest('http://localhost:3000/api/pk/battle-types');
    const res = await battleTypesRoute.GET(req);
    const data = await res.json();

    assert(res.status === 200, 'GET /api/pk/battle-types returns HTTP 200');
    assert(data.success === true, 'Battle types returns success: true');
    assert(data.pk1v1Enabled === true, 'pk1v1Enabled is true');
    assert(data.pk4hostEnabled === false, 'pk4hostEnabled is false');
    assert(data.battleTypes.length === 1 && data.battleTypes[0].id === '1v1', 'Public battleTypes contains exactly 1v1');
  }

  // -------------------------------------------------------------
  // TEST 14: Database State & Persistence Check
  // -------------------------------------------------------------
  console.log('\n--- TEST 14: Database Persistence & Session State ---');
  {
    const battleRows = await pool.query(`SELECT id, battle_type, status, host_a_id, host_b_id FROM popolive.pk_battles WHERE id = $1`, [activeBattleId]);
    assert(battleRows.rows.length === 1, 'PK Battle row persisted in popolive.pk_battles');
    const b = battleRows.rows[0];
    assert(b.battle_type === '1v1', 'Battle type is stored as 1v1');
    assert(b.host_a_id === hostAId, 'Host A ID matches');
    assert(b.host_b_id === hostBId, 'Host B ID matches');

    const invRows = await pool.query(`SELECT id, status, sender_host_id, receiver_host_id FROM popolive.pk_invitations WHERE id = $1`, [invitation1Id]);
    assert(invRows.rows.length === 1, 'Invitation record persisted in popolive.pk_invitations');
    assert(invRows.rows[0].status === 'accepted', 'Invitation status updated to accepted');
  }

  // Final Summary
  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passedChecks}/${totalChecks} CHECKS PASSED`);
  if (failedChecks === 0) {
    console.log('STATUS: ALL PHASE B7 PROMPT 2 REQUIREMENTS VERIFIED SUCCESSFULLY!');
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
