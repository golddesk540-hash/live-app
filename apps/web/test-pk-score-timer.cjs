// ============================================================================
// Popo Live Phase 6 Module 6.3: Automated Test Suite
// Real-time PK Battle Score and Timer
// ============================================================================

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
const canonicalBattleId = '00000000-0000-0000-0000-000000000603';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log(`\n======================================================`);
  console.log(`RUNNING MODULE 6.3 PK BATTLE SCORE & TIMER TESTS`);
  console.log(`Target: ${baseUrl}`);
  console.log(`Battle ID: ${canonicalBattleId}`);
  console.log(`======================================================\n`);

  try {
    // 1. Fetch Score & Timer State
    console.log('--- Test 1: Fetch Authoritative Score & Timer State ---');
    const stateRes = await fetch(`${baseUrl}/api/pk/battle/${canonicalBattleId}/score-timer`);
    assert(stateRes.status === 200, 'Score-Timer endpoint returns HTTP 200');
    const state = await stateRes.json();
    assert(state.success === true, 'Response reports success: true');
    assert(state.battleId === canonicalBattleId, 'Battle ID matches canonical ID');
    assert(state.battleType === '1v1', 'Battle format is 1v1');
    assert(state.hostA && state.hostA.nickname === 'Sara Live', 'Host A is Sara Live');
    assert(state.hostB && state.hostB.nickname === 'Ayesha', 'Host B is Ayesha');
    assert(typeof state.hostA.score === 'number', 'Host A score is numeric');
    assert(typeof state.hostB.score === 'number', 'Host B score is numeric');
    assert(typeof state.timer.remainingSeconds === 'number', 'Remaining seconds is numeric');
    assert(/^\d{2}:\d{2}$/.test(state.timer.formattedTime), 'Formatted time is MM:SS format');
    assert(['normal', 'warning_60s', 'warning_10s', 'time_expired'].includes(state.timer.status), 'Timer status is valid visual state');
    assert(typeof state.ratioA === 'number' && typeof state.ratioB === 'number', 'Score ratios are numeric');
    assert(Math.round(state.ratioA + state.ratioB) === 100, 'Ratios sum to 100%');

    // 2. Score Progression & Valid Score Event Submission
    console.log('\n--- Test 2: Valid Score Event Submission (Host A) ---');
    const initialScoreA = state.hostA.score;
    const testKeyA = `test_key_a_${Date.now()}_${Math.random()}`;
    const scoreResA = await fetch(`${baseUrl}/api/pk/battle/${canonicalBattleId}/score/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostSide: 'host_a',
        targetHostId: state.hostA.id,
        senderId: 'user_tester_99',
        senderName: 'Test Viewer A',
        points: 100,
        giftName: 'Rose',
        idempotencyKey: testKeyA,
      }),
    });
    assert(scoreResA.status === 200, 'Score send endpoint returns HTTP 200');
    const scoreDataA = await scoreResA.json();
    assert(scoreDataA.success === true, 'Score addition reports success: true');
    assert(scoreDataA.scoreA === initialScoreA + 100, `Score A incremented by 100 (${initialScoreA} -> ${scoreDataA.scoreA})`);

    console.log('\n--- Test 3: Valid Score Event Submission (Host B) ---');
    const initialScoreB = state.hostB.score;
    const testKeyB = `test_key_b_${Date.now()}_${Math.random()}`;
    const scoreResB = await fetch(`${baseUrl}/api/pk/battle/${canonicalBattleId}/score/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostSide: 'host_b',
        targetHostId: state.hostB.id,
        senderId: 'user_tester_99',
        senderName: 'Test Viewer B',
        points: 500,
        giftName: 'Diamond Star',
        idempotencyKey: testKeyB,
      }),
    });
    assert(scoreResB.status === 200, 'Host B score send returns HTTP 200');
    const scoreDataB = await scoreResB.json();
    assert(scoreDataB.success === true, 'Host B score addition reports success: true');
    assert(scoreDataB.scoreB === initialScoreB + 500, `Score B incremented by 500 (${initialScoreB} -> ${scoreDataB.scoreB})`);

    // 3. Strict Deduplication (Idempotency Key Check)
    console.log('\n--- Test 4: Deduplication & Duplicate Event Rejection ---');
    const dupRes = await fetch(`${baseUrl}/api/pk/battle/${canonicalBattleId}/score/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostSide: 'host_a',
        targetHostId: state.hostA.id,
        senderId: 'user_tester_99',
        senderName: 'Test Viewer A',
        points: 100,
        giftName: 'Rose',
        idempotencyKey: testKeyA, // EXACT duplicate key
      }),
    });
    assert(dupRes.status === 409, 'Duplicate transaction rejected with HTTP 409 Conflict');
    const dupData = await dupRes.json();
    assert(dupData.isDuplicate === true, 'Response flags duplicate: isDuplicate = true');

    // 4. Input Validation & Security Rejections
    console.log('\n--- Test 5: Input Validation & Security Checks ---');
    // A: Negative Points
    const negRes = await fetch(`${baseUrl}/api/pk/battle/${canonicalBattleId}/score/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostSide: 'host_a',
        targetHostId: state.hostA.id,
        senderId: 'user_tester_99',
        senderName: 'Attacker',
        points: -500,
        idempotencyKey: `neg_${Date.now()}`,
      }),
    });
    assert(negRes.status === 400, 'Negative points rejected with HTTP 400 Bad Request');

    // B: Zero Points
    const zeroRes = await fetch(`${baseUrl}/api/pk/battle/${canonicalBattleId}/score/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostSide: 'host_a',
        targetHostId: state.hostA.id,
        senderId: 'user_tester_99',
        senderName: 'Attacker',
        points: 0,
        idempotencyKey: `zero_${Date.now()}`,
      }),
    });
    assert(zeroRes.status === 400, 'Zero points rejected with HTTP 400 Bad Request');

    // C: Invalid Host Side
    const sideRes = await fetch(`${baseUrl}/api/pk/battle/${canonicalBattleId}/score/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostSide: 'host_invalid',
        targetHostId: state.hostA.id,
        senderId: 'user_tester_99',
        senderName: 'Attacker',
        points: 100,
        idempotencyKey: `side_${Date.now()}`,
      }),
    });
    assert(sideRes.status === 400, 'Invalid host side rejected with HTTP 400 Bad Request');

    // D: Mismatched Target Host ID
    const mismatchRes = await fetch(`${baseUrl}/api/pk/battle/${canonicalBattleId}/score/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostSide: 'host_a',
        targetHostId: '00000000-0000-0000-0000-000000088202', // Host B's ID on Host A's side!
        senderId: 'user_tester_99',
        senderName: 'Attacker',
        points: 100,
        idempotencyKey: `mismatch_${Date.now()}`,
      }),
    });
    assert(mismatchRes.status === 400, 'Mismatched target host ID rejected with HTTP 400');

    // 5. Live Comments
    console.log('\n--- Test 6: PK Battle Comments & Audience Interaction ---');
    const commentRes = await fetch(`${baseUrl}/api/pk/battle/${canonicalBattleId}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user_tester_99',
        userName: 'Hamza',
        content: 'Amazing comeback! 🔥',
      }),
    });
    assert(commentRes.status === 200, 'Post comment returns HTTP 200');
    const commentData = await commentRes.json();
    assert(commentData.success === true, 'Comment successfully stored in database');
    assert(commentData.comment.content === 'Amazing comeback! 🔥', 'Comment text matches payload');

    const getCommentsRes = await fetch(`${baseUrl}/api/pk/battle/${canonicalBattleId}/comment`);
    assert(getCommentsRes.status === 200, 'Get comments returns HTTP 200');
    const getCommentsData = await getCommentsRes.json();
    assert(Array.isArray(getCommentsData.comments), 'Comments list returned as array');
    assert(getCommentsData.comments.some(c => c.content === 'Amazing comeback! 🔥'), 'Newly posted comment is present in feed');

    // 6. Reconnection State Recovery
    console.log('\n--- Test 7: Reconnection & Authoritative State Recovery ---');
    const reconnectRes = await fetch(`${baseUrl}/api/pk/battle/${canonicalBattleId}/score-timer`);
    assert(reconnectRes.status === 200, 'Reconnection state query returns HTTP 200');
    const reconData = await reconnectRes.json();
    assert(reconData.hostA.score === scoreDataA.scoreA, 'Reconnected state maintains exact Host A score');
    assert(reconData.hostB.score === scoreDataB.scoreB, 'Reconnected state maintains exact Host B score');
    assert(typeof reconData.timer.remainingSeconds === 'number', 'Authoritative timer preserved on reconnect');

    // 7. Timer Remaining Time Calculation & Proportional Ratio Math
    console.log('\n--- Test 8: Timer Format & Dynamic Ratio Boundaries ---');
    const totalScore = reconData.hostA.score + reconData.hostB.score;
    assert(totalScore > 0, 'Total score is positive');
    assert(reconData.ratioA >= 15 && reconData.ratioA <= 85, 'Ratio A is within 15-85% clamp boundary');
    assert(reconData.ratioB >= 15 && reconData.ratioB <= 85, 'Ratio B is within 15-85% clamp boundary');
    assert(reconData.ratioA > reconData.ratioB === (reconData.hostA.score > reconData.hostB.score), 'Leading ratio matches leading score');

    console.log(`\n======================================================`);
    console.log(`ALL TESTS PASSED: ${passedTests}/${totalTests} (100% SUCCESS)`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error(`\n❌ TEST SUITE FAILED:`, err.message);
    process.exit(1);
  }
}

runTests();
