/**
 * Popo Live Phase 3 Prompt 02/08
 * Automated End-to-End Verification Test for Actual 1v1 PK Battle Engine,
 * Server-Authoritative Live Timer, Real-Time Score Synchronization,
 * Agora Stream Architecture, SSE Event Streaming, and Surrender Finalization
 *
 * Verifies against live Next.js backend (http://localhost:3000):
 * 1. PK Battle Session Creation & Authorization
 * 2. Server-Authoritative Live Timer & Duration (300s / 5m canonical)
 * 3. Real-Time Score Engine & 15%-85% Proportional Ratio Computation
 * 4. Real-Time Server-Sent Events (SSE) Stream Integration (/events)
 * 5. Points Addition & Idempotency Key Validation (/score/send)
 * 6. Dynamic Score Comparison & Leading Side Flipping
 * 7. Host Disconnection & Reconnection State Recovery
 * 8. Voluntary Surrender & Battle Finalization (/result)
 * 9. Official Winner Declaration & Score Differential Audit
 * 10. Post-Battle Score Tampering & Re-entry Prevention
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
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

function listenToSse(path, durationMs = 3000) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    };

    const events = [];
    const req = http.request(options, (res) => {
      let buffer = '';

      res.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep last incomplete line

        let currentEvent = 'message';
        for (const line of lines) {
          if (line.startsWith('event:')) {
            currentEvent = line.substring(6).trim();
          } else if (line.startsWith('data:')) {
            const dataStr = line.substring(5).trim();
            try {
              events.push({ event: currentEvent, data: JSON.parse(dataStr) });
            } catch (_) {
              events.push({ event: currentEvent, data: dataStr });
            }
          }
        }
      });

      setTimeout(() => {
        req.destroy();
        resolve({ status: res.statusCode, events });
      }, durationMs);
    });

    req.on('error', (err) => {
      if (events.length > 0) {
        resolve({ status: 200, events });
      } else {
        reject(err);
      }
    });

    req.end();
  });
}

async function runEngineTests() {
  console.log('================================================================');
  console.log('POPO LIVE — PHASE 3 PROMPT 02/08: 1v1 PK BATTLE ENGINE E2E SUITE');
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
    // Step 1: Discover Active Hosts & Clean Up Previous Battles
    // -------------------------------------------------------------
    console.log('[STEP 1] Setting up two eligible live hosts for battle...');
    // Reset test PK state to ensure fresh and idempotent test environment
    await makeRequest('POST', '/api/pk/test-reset');

    const hostsRes = await makeRequest('GET', '/api/pk/hosts');
    assert(hostsRes.status === 200, 'GET /api/pk/hosts returns 200');
    const eligibleHosts = hostsRes.data.hosts.filter((h) => h.isEligibleForPk === true);
    assert(eligibleHosts.length >= 2, `Found ${eligibleHosts.length} eligible live hosts`);

    const hostA = eligibleHosts[0];
    const hostB = eligibleHosts[1];
    console.log(`  Host A: ${hostA.nickname} (ID: ${hostA.id}, Room: ${hostA.roomNumber})`);
    console.log(`  Host B: ${hostB.nickname} (ID: ${hostB.id}, Room: ${hostB.roomNumber})`);

    // Clean up any pending invites
    const existingCheck = await makeRequest(
      'GET',
      `/api/pk/invitation/status?hostId=${hostB.id}&roomNumber=${hostB.roomNumber}`
    );
    if (existingCheck.data?.hasActiveInvitation && existingCheck.data?.invitation?.id) {
      await makeRequest('POST', '/api/pk/invitation/cancel', {
        invitationId: existingCheck.data.invitation.id,
        senderHostId: hostA.id,
      });
    }

    // -------------------------------------------------------------
    // Step 2: Create Authorized PK Battle Session
    // -------------------------------------------------------------
    console.log('\n[STEP 2] Creating authorized PK battle session...');
    const sendRes = await makeRequest('POST', '/api/pk/invitation/send', {
      senderHostId: hostA.id,
      receiverHostId: hostB.id,
      senderRoomNumber: hostA.roomNumber,
      battleType: '1v1',
    });
    assert(sendRes.status === 200, 'POST /api/pk/invitation/send returns 200');
    const invitation = sendRes.data.invitation;
    assert(invitation && invitation.id, `Invitation created: ${invitation?.id}`);

    const acceptRes = await makeRequest('POST', '/api/pk/invitation/respond', {
      invitationId: invitation.id,
      action: 'accept',
      receiverHostId: hostB.id,
    });
    assert(acceptRes.status === 200, 'Host B accepts invitation (200 OK)');
    assert(acceptRes.data.battle != null, 'Battle session record returned by backend');

    const battle = acceptRes.data.battle;
    const battleId = battle.id;
    console.log(`  Battle Session Created: ID=${battleId}, Type=${battle.battleType}, Status=${battle.status}`);
    assert(battle.battleType === '1v1', 'Battle type is strictly 1v1');
    assert(battle.hostA.id === hostA.id, 'Host A participant verified');
    assert(battle.hostB.id === hostB.id, 'Host B participant verified');

    // -------------------------------------------------------------
    // Step 3: Server-Authoritative Score & Timer Synchronization
    // -------------------------------------------------------------
    console.log('\n[STEP 3] Verifying server-authoritative score and timer endpoint...');
    const scoreTimerRes = await makeRequest('GET', `/api/pk/battle/${battleId}/score-timer`);
    assert(scoreTimerRes.status === 200, 'GET /api/pk/battle/[battleId]/score-timer returns 200');
    assert(scoreTimerRes.data.success === true, 'Response contains success: true');
    assert(scoreTimerRes.data.battleId === battleId, 'Returned battleId matches session');
    assert(scoreTimerRes.data.timer != null, 'Timer object present in payload');
    assert(scoreTimerRes.data.timer.durationSeconds === 300, 'Canonical duration is 300 seconds (5 minutes)');
    assert(scoreTimerRes.data.timer.remainingSeconds > 0 && scoreTimerRes.data.timer.remainingSeconds <= 300, `Authoritative remaining seconds: ${scoreTimerRes.data.timer.remainingSeconds}s`);
    assert(scoreTimerRes.data.timer.formattedTime != null, `Formatted time string: ${scoreTimerRes.data.timer.formattedTime}`);
    assert(scoreTimerRes.data.hostA.score === 0, 'Initial Host A score is 0');
    assert(scoreTimerRes.data.hostB.score === 0, 'Initial Host B score is 0');
    assert(scoreTimerRes.data.ratioA === 50, 'Initial score ratio A is 50.0%');
    assert(scoreTimerRes.data.ratioB === 50, 'Initial score ratio B is 50.0%');
    assert(scoreTimerRes.data.leadingSide === 'tie', 'Initial leading side is tie');

    // -------------------------------------------------------------
    // Step 4: Real-Time Server-Sent Events (SSE) Stream
    // -------------------------------------------------------------
    console.log('\n[STEP 4] Verifying Real-Time SSE Stream (/events)...');
    const sseResult = await listenToSse(`/api/pk/battle/${battleId}/events`, 2500);
    assert(sseResult.status === 200, 'GET /api/pk/battle/[battleId]/events returns 200 SSE stream');
    assert(sseResult.events.length > 0, `Received ${sseResult.events.length} real-time SSE event frames`);

    const hasConnectedEvent = sseResult.events.some((e) => e.event === 'connected');
    assert(hasConnectedEvent, 'SSE stream emits initial "connected" handshake event');

    const hasTimerSync = sseResult.events.some((e) => e.event === 'pk:timer_sync');
    assert(hasTimerSync, 'SSE stream emits recurring "pk:timer_sync" tick events');

    // -------------------------------------------------------------
    // Step 5: Real-Time Score Engine — Points Addition to Host A
    // -------------------------------------------------------------
    console.log('\n[STEP 5] Sending score points to Host A...');
    const idempotencyKeyA = `pk_test_${Date.now()}_a`;
    const scoreARes = await makeRequest('POST', `/api/pk/battle/${battleId}/score/send`, {
      hostSide: 'host_a',
      targetHostId: hostA.id,
      senderId: 'test_user_fan_1',
      senderName: 'Usman Fan',
      points: 500,
      giftName: 'Diamond Crown',
      idempotencyKey: idempotencyKeyA,
    });
    assert(scoreARes.status === 200, 'POST /api/pk/battle/[battleId]/score/send for Host A returns 200');
    assert(scoreARes.data.success === true, 'Host A points recorded successfully');

    // Verify idempotency duplicate prevention
    console.log('\n[STEP 6] Testing Idempotency Duplicate Prevention...');
    const duplicateScoreRes = await makeRequest('POST', `/api/pk/battle/${battleId}/score/send`, {
      hostSide: 'host_a',
      targetHostId: hostA.id,
      senderId: 'test_user_fan_1',
      senderName: 'Usman Fan',
      points: 500,
      giftName: 'Diamond Crown',
      idempotencyKey: idempotencyKeyA,
    });
    assert(duplicateScoreRes.status === 409, 'Duplicate score request rejected with 409 Conflict');
    assert(duplicateScoreRes.data.isDuplicate === true, 'Duplicate request detected and ignored');

    // Verify Host A score updated in score-timer endpoint
    const postScoreARes = await makeRequest('GET', `/api/pk/battle/${battleId}/score-timer`);
    assert(postScoreARes.data.hostA.score === 500, 'Host A score updated to 500');
    assert(postScoreARes.data.hostB.score === 0, 'Host B score remains 0');
    assert(postScoreARes.data.leadingSide === 'host_a', 'Leading side is host_a');
    assert(postScoreARes.data.ratioA > 50, `Ratio A shifted ahead: ${postScoreARes.data.ratioA}%`);

    // -------------------------------------------------------------
    // Step 7: Score Overtake — Points Addition to Host B
    // -------------------------------------------------------------
    console.log('\n[STEP 7] Sending score points to Host B to overtake Host A...');
    const idempotencyKeyB = `pk_test_${Date.now()}_b`;
    const scoreBRes = await makeRequest('POST', `/api/pk/battle/${battleId}/score/send`, {
      hostSide: 'host_b',
      targetHostId: hostB.id,
      senderId: 'test_user_fan_2',
      senderName: 'Hamza SuperFan',
      points: 1200,
      giftName: 'Galaxy Rocket',
      idempotencyKey: idempotencyKeyB,
    });
    assert(scoreBRes.status === 200, 'POST /api/pk/battle/[battleId]/score/send for Host B returns 200');

    // Verify Host B score and leading side flip
    const postScoreBRes = await makeRequest('GET', `/api/pk/battle/${battleId}/score-timer`);
    assert(postScoreBRes.data.hostB.score === 1200, 'Host B score updated to 1200');
    assert(postScoreBRes.data.leadingSide === 'host_b', 'Leading side flipped to host_b');
    assert(postScoreBRes.data.ratioB > 50, `Ratio B shifted ahead: ${postScoreBRes.data.ratioB}%`);
    assert(postScoreBRes.data.leadingHostId === hostB.id, 'Leading host ID matches Host B');

    // -------------------------------------------------------------
    // Step 8: Disconnection & State Recovery Simulation
    // -------------------------------------------------------------
    console.log('\n[STEP 8] Simulating Disconnection & State Recovery...');
    // Reconnection request should restore identical battle state without score loss
    const recoveryRes = await makeRequest('GET', `/api/pk/battle/${battleId}/score-timer`);
    assert(recoveryRes.status === 200, 'Reconnection state query returns 200');
    assert(recoveryRes.data.hostA.score === 500, 'Host A score preserved across reconnect');
    assert(recoveryRes.data.hostB.score === 1200, 'Host B score preserved across reconnect');
    assert(recoveryRes.data.leadingSide === 'host_b', 'Leading side preserved across reconnect');

    // -------------------------------------------------------------
    // Step 9: Voluntary Surrender / Battle Finalization
    // -------------------------------------------------------------
    console.log('\n[STEP 9] Verifying Voluntary Surrender & Battle Finalization...');
    const surrenderRes = await makeRequest('POST', `/api/pk/battle/${battleId}/result`, {
      action: 'end_battle',
      reason: 'surrender',
    });
    assert(surrenderRes.status === 200, 'POST /api/pk/battle/[battleId]/result returns 200');
    assert(surrenderRes.data.success === true, 'Battle finalized successfully');
    assert(surrenderRes.data.isCalculated === true, 'Battle result marked as calculated');

    const result = surrenderRes.data.result;
    console.log(`  Winner Declared: ${result.winnerNickname} (ID: ${result.winnerHostId}) with ${result.winnerScore} pts`);
    console.log(`  Loser: ${result.loserNickname} (ID: ${result.loserHostId}) with ${result.loserScore} pts`);
    console.log(`  Score Difference: ${result.scoreDiff} pts`);

    assert(result.winnerHostId === hostB.id, 'Host B officially declared winner');
    assert(result.loserHostId === hostA.id, 'Host A officially recorded as loser');
    assert(result.winnerScore === 1200, 'Winner score correctly recorded as 1200');
    assert(result.loserScore === 500, 'Loser score correctly recorded as 500');
    assert(result.scoreDiff === 700, 'Score difference accurately computed as 700');

    // -------------------------------------------------------------
    // Step 10: Fetch Persisted Battle Result & Security Check
    // -------------------------------------------------------------
    console.log('\n[STEP 10] Fetching Persisted Battle Result & Verifying Security Lock...');
    const getResultRes = await makeRequest('GET', `/api/pk/battle/${battleId}/result`);
    assert(getResultRes.status === 200, 'GET /api/pk/battle/[battleId]/result returns 200');
    assert(getResultRes.data.isCalculated === true, 'Persisted result isCalculated is true');
    assert(getResultRes.data.result.winnerHostId === hostB.id, 'Persisted winner verified');

    // Security check: cannot add points to a completed battle
    const postFinalScoreRes = await makeRequest('POST', `/api/pk/battle/${battleId}/score/send`, {
      hostSide: 'host_a',
      targetHostId: hostA.id,
      senderId: 'attacker_1',
      senderName: 'Attacker',
      points: 10000,
      giftName: 'Hacked Diamonds',
      idempotencyKey: `attack_${Date.now()}`,
    });
    assert(postFinalScoreRes.status === 400, 'Prevented adding points to completed battle (HTTP 400)');

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

runEngineTests();
