// ============================================================================
// Popo Live Phase 6 Module 6.5: Automated Test Suite
// PK Winner Boost System
// ============================================================================

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
const canonicalWinnerBattleId = '00000000-0000-0000-0000-000000000604';
const canonicalDrawBattleId = '00000000-0000-0000-0000-000000000605';
const winnerUserId = '00000000-0000-0000-0000-000000088201'; // Sara Live

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
  console.log(`RUNNING MODULE 6.5 PK WINNER BOOST SYSTEM TESTS`);
  console.log(`Target: ${baseUrl}`);
  console.log(`Battle ID: ${canonicalWinnerBattleId}`);
  console.log(`======================================================\n`);

  try {
    // 1. Fetch Canonical Winner Boost State
    console.log('--- Test 1: Fetch Authoritative Winner Boost State ---');
    const res = await fetch(`${baseUrl}/api/pk/boost/${canonicalWinnerBattleId}`);
    assert(res.status === 200, 'Boost endpoint returns HTTP 200');
    const data = await res.json();
    assert(data.success === true, 'Response reports success: true');
    assert(data.hasBoost === true, 'Boost exists for canonical winner battle');
    assert(data.boost.winnerUserId === winnerUserId, 'Winner ID matches Sara Live');
    assert(data.boost.boostTitle === 'Winner Boost Active', 'Boost title is Winner Boost Active');
    assert(data.boost.multiplierPercentage === 20, 'Multiplier is +20%');
    assert(data.boost.status === 'active', 'Boost status is active');
    assert(typeof data.boost.remainingSeconds === 'number', 'Remaining seconds is numeric');
    assert(/^\d{2}:\d{2}$/.test(data.boost.formattedCountdown), 'Formatted countdown matches MM:SS format');

    // 2. User Active Boost Query (Profile / Stream Lookup)
    console.log('\n--- Test 2: User Active Boost Query ---');
    const userBoostRes = await fetch(`${baseUrl}/api/pk/boost/user/${winnerUserId}`);
    assert(userBoostRes.status === 200, 'User boost endpoint returns HTTP 200');
    const userBoostData = await userBoostRes.json();
    assert(userBoostData.success === true, 'User boost lookup reports success');
    assert(userBoostData.hasActiveBoost === true, 'User has active boost confirmed');
    assert(userBoostData.boost.winnerNickname === 'Sara Live', 'Boost nickname is Sara Live');

    // 3. Draw Rule: Draw Battles Must NOT Activate a Winner Boost
    console.log('\n--- Test 3: Draw Rule (Draw battles reject winner boost) ---');
    const drawBoostRes = await fetch(`${baseUrl}/api/pk/boost/${canonicalDrawBattleId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ durationMinutes: 30 }),
    });
    assert(drawBoostRes.status === 400, 'Boost activation for draw battle rejected with HTTP 400 Bad Request');
    const drawBoostData = await drawBoostRes.json();
    assert(drawBoostData.success === false, 'Draw activation returns success: false');
    assert(drawBoostData.error.includes('draw'), 'Error message clearly specifies draw reason');

    // 4. Duplicate Activation Idempotency
    console.log('\n--- Test 4: Idempotency & Duplicate Activation Prevention ---');
    const dupRes = await fetch(`${baseUrl}/api/pk/boost/${canonicalWinnerBattleId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ durationMinutes: 30 }),
    });
    assert(dupRes.status === 200, 'Duplicate request returns HTTP 200 without error');
    const dupData = await dupRes.json();
    assert(dupData.isDuplicate === true, 'Response flags duplicate request (isDuplicate: true)');
    assert(dupData.boost.winnerUserId === winnerUserId, 'Existing boost preserved without re-activation');

    // 5. Security: Unverified Battles Cannot Activate Boosts
    console.log('\n--- Test 5: Security: Unverified Battle Rejection ---');
    const fakeBattleId = '00000000-0000-0000-0000-000000000999';
    const fakeRes = await fetch(`${baseUrl}/api/pk/boost/${fakeBattleId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ durationMinutes: 30 }),
    });
    assert(fakeRes.status === 400, 'Unverified battle rejected with HTTP 400 Bad Request');

    // 6. Admin Control: List Winner Boost Records
    console.log('\n--- Test 6: Admin Controls: List Winner Boost Records ---');
    const adminListRes = await fetch(`${baseUrl}/api/pk/boost/admin`);
    assert(adminListRes.status === 200, 'Admin list endpoint returns HTTP 200');
    const adminListData = await adminListRes.json();
    assert(adminListData.success === true, 'Admin list reports success: true');
    assert(Array.isArray(adminListData.boosts), 'Boosts returned as array');
    assert(adminListData.totalCount >= 1, 'Total boosts count is at least 1');

    // 7. Admin Control: Cancel Active Boost & Audit Log
    console.log('\n--- Test 7: Admin Control: Cancel Active Boost ---');
    const boostToCancelId = data.boost.id;
    const cancelRes = await fetch(`${baseUrl}/api/pk/boost/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'cancel',
        boostId: boostToCancelId,
        adminId: 'admin_test_01',
        reason: 'Automated test cancellation',
      }),
    });
    assert(cancelRes.status === 200, 'Cancel boost returns HTTP 200');
    const cancelData = await cancelRes.json();
    assert(cancelData.success === true && cancelData.newStatus === 'cancelled', 'Boost marked as cancelled');

    // 8. Re-activate Boost via Admin Control
    console.log('\n--- Test 8: Admin Control: Reactivate Approved Boost ---');
    const activateRes = await fetch(`${baseUrl}/api/pk/boost/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'activate',
        boostId: boostToCancelId,
        adminId: 'admin_test_01',
        reason: 'Restoring canonical active boost',
      }),
    });
    assert(activateRes.status === 200, 'Reactivate boost returns HTTP 200');
    const activateData = await activateRes.json();
    assert(activateData.success === true && activateData.newStatus === 'active', 'Boost restored to active status');

    // 9. Reconnection & Expiry Precision
    console.log('\n--- Test 9: Reconnection & Expiry Precision ---');
    const recheckRes = await fetch(`${baseUrl}/api/pk/boost/${canonicalWinnerBattleId}`);
    const recheckData = await recheckRes.json();
    assert(recheckData.boost.status === 'active', 'Boost verified active on reconnection');
    assert(recheckData.boost.remainingSeconds > 0, 'Remaining time is positive');

    console.log(`\n======================================================`);
    console.log(`ALL TESTS PASSED: ${passedTests}/${totalTests} (100% SUCCESS)`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error(`\n❌ TEST SUITE FAILED:`, err.message);
    process.exit(1);
  }
}

runTests();
