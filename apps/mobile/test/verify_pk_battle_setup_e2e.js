/**
 * Popo Live Phase 3 Prompt 01/08
 * Automated End-to-End Verification Test for 1v1 PK Battle Setup & Invitation System
 *
 * Verifies against live Next.js backend (http://localhost:3000):
 * 1. PK Battle Types API: 1v1 enabled, 4-host disabled (strict 1v1 enforcement)
 * 2. PK Eligible Hosts Discovery: GET /api/pk/hosts, search filtering, and host exclusion
 * 3. PK Invitation Workflow:
 *    a. Send invitation (POST /api/pk/invitation/send)
 *    b. Self-invitation rejection (400)
 *    c. Duplicate invitation rejection (429)
 *    d. Check invitation status (GET /api/pk/invitation/status)
 *    e. Cancel outgoing invitation (POST /api/pk/invitation/cancel)
 *    f. Reject incoming invitation (POST /api/pk/invitation/respond action='reject')
 *    g. Accept incoming invitation (POST /api/pk/invitation/respond action='accept')
 * 4. PK Battle Record Verification: GET /api/pk/battle/[battleId]
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('POPO LIVE — PHASE 3 PROMPT 01/08: 1v1 PK BATTLE E2E TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: PK Battle Types & Strict 1v1 Policy
    // -------------------------------------------------------------
    console.log('[TEST 1] Verifying PK Battle Types & Strict 1v1 Policy...');
    const typesRes = await makeRequest('GET', '/api/pk/battle-types');
    assert(typesRes.status === 200, 'GET /api/pk/battle-types returns 200 OK');
    assert(typesRes.data.success === true, 'Response contains success: true');
    assert(typesRes.data.featureFlags?.pk1v1Enabled === true, 'featureFlags.pk1v1Enabled is strictly true');
    assert(typesRes.data.featureFlags?.pk4hostEnabled === false, 'featureFlags.pk4hostEnabled is strictly false (4-host locked)');
    assert(typesRes.data.defaultType === '1v1', 'defaultType is 1v1');
    assert(typesRes.data.battleTypes[0].id === '1v1' && typesRes.data.battleTypes[0].isEnabled === true, '1v1 battle type is active and enabled');
    assert(typesRes.data.battleTypes[1].id === '4_host' && typesRes.data.battleTypes[1].isLocked === true, '4-host battle type is locked and disabled');

    // -------------------------------------------------------------
    // Test 2: Eligible Hosts Discovery
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Verifying Eligible Live Opponents Discovery...');
    const hostsRes = await makeRequest('GET', '/api/pk/hosts');
    assert(hostsRes.status === 200, 'GET /api/pk/hosts returns 200 OK');
    assert(hostsRes.data.success === true, 'Response contains success: true');
    assert(Array.isArray(hostsRes.data.hosts), 'Hosts is returned as an array');
    assert(hostsRes.data.hosts.length >= 2, `At least 2 active hosts available (found: ${hostsRes.data.hosts.length})`);

    // Pick two eligible hosts (Sara Live and Ayesha)
    const eligibleHosts = hostsRes.data.hosts.filter(h => h.isEligibleForPk === true);
    assert(eligibleHosts.length >= 2, `At least 2 PK-eligible hosts available (found: ${eligibleHosts.length})`);

    const hostA = eligibleHosts[0];
    const hostB = eligibleHosts[1];
    console.log(`  Host A: ${hostA.nickname} (ID: ${hostA.id}, Room: ${hostA.roomNumber})`);
    console.log(`  Host B: ${hostB.nickname} (ID: ${hostB.id}, Room: ${hostB.roomNumber})`);

    // Verify search filter
    const searchRes = await makeRequest('GET', `/api/pk/hosts?search=${encodeURIComponent(hostA.nickname)}`);
    assert(searchRes.status === 200, 'GET /api/pk/hosts with search query returns 200');
    assert(searchRes.data.hosts.some(h => h.id === hostA.id), `Search returns matched host (${hostA.nickname})`);

    // Verify host exclusion
    const excludeRes = await makeRequest('GET', `/api/pk/hosts?excludeHostId=${hostA.id}`);
    assert(excludeRes.status === 200, 'GET /api/pk/hosts with excludeHostId returns 200');
    assert(!excludeRes.data.hosts.some(h => h.id === hostA.id), 'Excludes current host from opponent pool');

    // -------------------------------------------------------------
    // Test 3: Self-Invitation Prevention
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Verifying Self-Invitation Prevention...');
    const selfInviteRes = await makeRequest('POST', '/api/pk/invitation/send', {
      senderHostId: hostA.id,
      receiverHostId: hostA.id,
      senderRoomNumber: hostA.roomNumber,
      battleType: '1v1',
    });
    assert(selfInviteRes.status === 400, 'Self-invitation correctly rejected with 400 Bad Request');
    assert(selfInviteRes.data.success === false, 'Self-invitation contains success: false');
    assert(selfInviteRes.data.code === 'CANNOT_INVITE_SELF', 'Error code is CANNOT_INVITE_SELF');

    // -------------------------------------------------------------
    // Test 4: Missing Receiver Validation
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Verifying Missing Receiver Validation...');
    const missingReceiverRes = await makeRequest('POST', '/api/pk/invitation/send', {
      senderHostId: hostA.id,
      senderRoomNumber: hostA.roomNumber,
      battleType: '1v1',
    });
    assert(missingReceiverRes.status === 400, 'Missing receiver correctly rejected with 400 Bad Request');
    assert(missingReceiverRes.data.code === 'RECEIVER_REQUIRED', 'Error code is RECEIVER_REQUIRED');

    // Clean up any pending invites between hostA and hostB first
    const existingCheck = await makeRequest('GET', `/api/pk/invitation/status?hostId=${hostB.id}&roomNumber=${hostB.roomNumber}`);
    if (existingCheck.data?.hasActiveInvitation && existingCheck.data?.invitation?.id) {
      await makeRequest('POST', '/api/pk/invitation/cancel', {
        invitationId: existingCheck.data.invitation.id,
        senderHostId: hostA.id,
      });
    }

    // -------------------------------------------------------------
    // Test 5: Outgoing Invitation Send & Status Checking
    // -------------------------------------------------------------
    console.log('\n[TEST 5] Verifying Sending 1v1 PK Invitation from Host A to Host B...');
    const sendRes = await makeRequest('POST', '/api/pk/invitation/send', {
      senderHostId: hostA.id,
      receiverHostId: hostB.id,
      senderRoomNumber: hostA.roomNumber,
      battleType: '1v1',
    });
    assert(sendRes.status === 200, 'POST /api/pk/invitation/send returns 200 OK');
    assert(sendRes.data.success === true, 'Invitation sent successfully');
    const invitation1 = sendRes.data.invitation;
    assert(invitation1 != null && invitation1.id != null, `Invitation created with ID: ${invitation1?.id}`);
    assert(invitation1.status === 'pending', 'Invitation status is pending');
    assert(invitation1.battleType === '1v1', 'Invitation battle type is 1v1');
    assert(invitation1.secondsRemaining === 30, 'Initial countdown starts at 30 seconds');

    // -------------------------------------------------------------
    // Test 6: Duplicate Pending Invitation Prevention
    // -------------------------------------------------------------
    console.log('\n[TEST 6] Verifying Duplicate Pending Invitation Prevention...');
    const duplicateRes = await makeRequest('POST', '/api/pk/invitation/send', {
      senderHostId: hostA.id,
      receiverHostId: hostB.id,
      senderRoomNumber: hostA.roomNumber,
      battleType: '1v1',
    });
    assert(duplicateRes.status === 429, 'Duplicate invitation correctly rejected with 429 Too Many Requests');
    assert(duplicateRes.data.code === 'DUPLICATE_INVITATION', 'Error code is DUPLICATE_INVITATION');

    // -------------------------------------------------------------
    // Test 7: Polling Invitation Status
    // -------------------------------------------------------------
    console.log('\n[TEST 7] Verifying Invitation Status Polling...');
    const statusByIdRes = await makeRequest('GET', `/api/pk/invitation/status?invitationId=${invitation1.id}`);
    assert(statusByIdRes.status === 200, 'GET /api/pk/invitation/status by ID returns 200');
    assert(statusByIdRes.data.invitation.status === 'pending', 'Status remains pending');
    assert(statusByIdRes.data.invitation.secondsRemaining > 0, `Seconds remaining: ${statusByIdRes.data.invitation.secondsRemaining}s`);

    // Check status via receiver host info
    const statusByHostRes = await makeRequest('GET', `/api/pk/invitation/status?hostId=${hostB.id}&roomNumber=${hostB.roomNumber}`);
    assert(statusByHostRes.status === 200, 'GET /api/pk/invitation/status by receiver host returns 200');
    assert(statusByHostRes.data.hasActiveInvitation === true, 'Receiver detects active pending incoming invitation');
    assert(statusByHostRes.data.invitation.senderNickname === hostA.nickname, 'Receiver sees correct sender nickname');

    // -------------------------------------------------------------
    // Test 8: Cancel Outgoing Invitation
    // -------------------------------------------------------------
    console.log('\n[TEST 8] Verifying Cancelling Outgoing Invitation...');
    const cancelRes = await makeRequest('POST', '/api/pk/invitation/cancel', {
      invitationId: invitation1.id,
      senderHostId: hostA.id,
    });
    assert(cancelRes.status === 200, 'POST /api/pk/invitation/cancel returns 200 OK');
    assert(cancelRes.data.success === true, 'Invitation cancelled successfully');
    assert(cancelRes.data.status === 'cancelled', 'Status returned is cancelled');

    // Verify cancelled status in DB
    const statusCancelled = await makeRequest('GET', `/api/pk/invitation/status?invitationId=${invitation1.id}`);
    assert(statusCancelled.data.invitation.status === 'cancelled', 'Status reflects cancelled in database');

    // -------------------------------------------------------------
    // Test 9: Reject Incoming Invitation Flow
    // -------------------------------------------------------------
    console.log('\n[TEST 9] Verifying Invitation Rejection Flow...');
    const send2Res = await makeRequest('POST', '/api/pk/invitation/send', {
      senderHostId: hostA.id,
      receiverHostId: hostB.id,
      senderRoomNumber: hostA.roomNumber,
      battleType: '1v1',
    });
    assert(send2Res.status === 200, 'Second invitation sent for rejection test');
    const invitation2 = send2Res.data.invitation;

    const rejectRes = await makeRequest('POST', '/api/pk/invitation/respond', {
      invitationId: invitation2.id,
      action: 'reject',
      receiverHostId: hostB.id,
      reason: 'Host is busy streaming solo right now',
    });
    assert(rejectRes.status === 200, 'POST /api/pk/invitation/respond action=reject returns 200');
    assert(rejectRes.data.success === true, 'Rejection recorded successfully');
    assert(rejectRes.data.action === 'rejected', 'Action recorded as rejected');

    // Verify rejection status in database
    const statusRejected = await makeRequest('GET', `/api/pk/invitation/status?invitationId=${invitation2.id}`);
    assert(statusRejected.data.invitation.status === 'rejected', 'Status reflects rejected in database');

    // -------------------------------------------------------------
    // Test 10: Accept Incoming Invitation & Confirm 1v1 Battle
    // -------------------------------------------------------------
    console.log('\n[TEST 10] Verifying Invitation Acceptance & Battle Session Creation...');
    const send3Res = await makeRequest('POST', '/api/pk/invitation/send', {
      senderHostId: hostA.id,
      receiverHostId: hostB.id,
      senderRoomNumber: hostA.roomNumber,
      battleType: '1v1',
    });
    assert(send3Res.status === 200, 'Third invitation sent for acceptance test');
    const invitation3 = send3Res.data.invitation;

    const acceptRes = await makeRequest('POST', '/api/pk/invitation/respond', {
      invitationId: invitation3.id,
      action: 'accept',
      receiverHostId: hostB.id,
    });
    assert(acceptRes.status === 200, 'POST /api/pk/invitation/respond action=accept returns 200');
    assert(acceptRes.data.success === true, 'Acceptance creates confirmed battle');
    assert(acceptRes.data.battle != null, 'Battle session object returned');

    const battle = acceptRes.data.battle;
    console.log(`  Battle Created: ID=${battle.id}, Type=${battle.battleType}, Status=${battle.status}`);
    assert(battle.battleType === '1v1', 'Battle type is strictly 1v1');
    assert(battle.status === 'confirmed' || battle.status === 'preparing' || battle.status === 'active', 'Battle status is confirmed/preparing');
    assert(battle.hostA?.id === hostA.id, 'Host A participant is correctly assigned');
    assert(battle.hostB?.id === hostB.id, 'Host B participant is correctly assigned');

    // -------------------------------------------------------------
    // Test 11: Fetch Battle by ID
    // -------------------------------------------------------------
    console.log('\n[TEST 11] Verifying GET /api/pk/battle/[battleId]...');
    const battleDetailRes = await makeRequest('GET', `/api/pk/battle/${battle.id}`);
    assert(battleDetailRes.status === 200, 'GET /api/pk/battle/[battleId] returns 200 OK');
    assert(battleDetailRes.data.success === true, 'Battle detail contains success: true');
    assert(battleDetailRes.data.battle.id === battle.id, 'Battle ID matches requested battle');
    assert(battleDetailRes.data.battle.hostA != null, 'Host A participant details present');
    assert(battleDetailRes.data.battle.hostB != null, 'Host B participant details present');
    assert(battleDetailRes.data.battle.battleType === '1v1', 'Persisted battle type is 1v1');

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`E2E TEST RUN COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Unhandled test runner exception:', err);
    process.exit(1);
  }
}

runTests();
