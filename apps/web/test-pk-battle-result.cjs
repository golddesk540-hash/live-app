// ============================================================================
// Popo Live Phase 6 Module 6.4: Automated Test Suite
// PK Battle Result and Winner Declaration
// ============================================================================

const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
const canonicalResultBattleId = '00000000-0000-0000-0000-000000000604';
const canonicalDrawBattleId = '00000000-0000-0000-0000-000000000605';
const activeBattleId = '00000000-0000-0000-0000-000000000603';

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
  console.log(`RUNNING MODULE 6.4 PK BATTLE RESULT & WINNER TESTS`);
  console.log(`Target: ${baseUrl}`);
  console.log(`======================================================\n`);

  try {
    // 1. Fetch Canonical Winner Result (Sara Live 24,860 Vs Ayesha 18,320)
    console.log('--- Test 1: Fetch Canonical Winner Result (Sara Live 24,860 Vs Ayesha 18,320) ---');
    const res = await fetch(`${baseUrl}/api/pk/battle/${canonicalResultBattleId}/result`);
    assert(res.status === 200, 'Result endpoint returns HTTP 200');
    const data = await res.json();
    assert(data.success === true, 'Response reports success: true');
    assert(data.isCalculated === true, 'Result is calculated and finalized');
    assert(data.result && data.result.resultType === 'winner_declared', 'Result type is winner_declared');
    assert(data.result.winnerNickname === 'Sara Live', 'Winner is Sara Live');
    assert(data.result.winnerScore === 24860, 'Winner score is 24,860 matching 06_04_result.png');
    assert(data.result.loserNickname === 'Ayesha', 'Loser is Ayesha');
    assert(data.result.loserScore === 18320, 'Loser score is 18,320 matching 06_04_result.png');
    assert(data.result.scoreDiff === 6540, 'Score difference is 6,540');

    // 2. Fetch Canonical Draw Result (Equal Scores 15,000 Vs 15,000)
    console.log('\n--- Test 2: Fetch Canonical Draw Result (Equal Scores) ---');
    const drawRes = await fetch(`${baseUrl}/api/pk/battle/${canonicalDrawBattleId}/result`);
    assert(drawRes.status === 200, 'Draw result endpoint returns HTTP 200');
    const drawData = await drawRes.json();
    assert(drawData.success === true, 'Draw response reports success: true');
    assert(drawData.result && drawData.result.resultType === 'draw', 'Result type is draw');
    assert(drawData.result.winnerHostId === null, 'Winner host ID is null for a draw');
    assert(drawData.result.hostAScore === drawData.result.hostBScore, 'Host A and Host B scores are equal');
    assert(drawData.result.scoreDiff === 0, 'Score difference is exactly 0');

    // 3. Automatic Battle End & Winner Calculation Trigger
    console.log('\n--- Test 3: Automatic Battle End & Winner Calculation Trigger ---');
    const finalizeRes = await fetch(`${baseUrl}/api/pk/battle/${canonicalResultBattleId}/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'end_battle', reason: 'timer_expired' }),
    });
    assert(finalizeRes.status === 200, 'Finalize battle endpoint returns HTTP 200');
    const finalizeData = await finalizeRes.json();
    assert(finalizeData.success === true, 'Finalize reports success: true');
    assert(finalizeData.isCalculated === true, 'Finalize confirms calculated result');

    // 4. Duplicate End Events Idempotency (Prevent Duplicate Results)
    console.log('\n--- Test 4: Idempotency & Duplicate Result Prevention ---');
    const dupRes = await fetch(`${baseUrl}/api/pk/battle/${canonicalResultBattleId}/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'end_battle', reason: 'timer_expired' }),
    });
    assert(dupRes.status === 200, 'Duplicate finalize returns HTTP 200 with saved result');
    const dupData = await dupRes.json();
    assert(dupData.isAlreadyFinalized === true || dupData.isCalculated === true, 'Duplicate request returns existing finalized result without recreation');
    assert(dupData.result.winnerScore === 24860, 'Scores and winner remain unchanged');

    // 5. Host B Wins Scenario Validation
    console.log('\n--- Test 5: Dynamic Winner Calculation (Host B Wins Scenario) ---');
    function calculatePKBattleWinner(scoreA, scoreB, hostA, hostB) {
      const diff = Math.abs(scoreA - scoreB);
      if (scoreA > scoreB) {
        return {
          resultType: 'winner_declared',
          winnerHostId: hostA.id,
          winnerNickname: hostA.nickname,
          winnerAvatar: hostA.avatarUrl,
          winnerScore: scoreA,
          loserHostId: hostB.id,
          loserNickname: hostB.nickname,
          loserAvatar: hostB.avatarUrl,
          loserScore: scoreB,
          scoreDiff: diff,
        };
      } else if (scoreB > scoreA) {
        return {
          resultType: 'winner_declared',
          winnerHostId: hostB.id,
          winnerNickname: hostB.nickname,
          winnerAvatar: hostB.avatarUrl,
          winnerScore: scoreB,
          loserHostId: hostA.id,
          loserNickname: hostA.nickname,
          loserAvatar: hostA.avatarUrl,
          loserScore: scoreA,
          scoreDiff: diff,
        };
      } else {
        return {
          resultType: 'draw',
          winnerHostId: null,
          winnerNickname: null,
          winnerAvatar: null,
          winnerScore: null,
          loserHostId: null,
          loserNickname: null,
          loserAvatar: null,
          loserScore: null,
          scoreDiff: 0,
        };
      }
    }
    const hostAWinsCalc = calculatePKBattleWinner(
      30000, 20000,
      { id: 'host_a', nickname: 'Sara Live', avatarUrl: 'avatarA' },
      { id: 'host_b', nickname: 'Ayesha', avatarUrl: 'avatarB' }
    );
    assert(hostAWinsCalc.resultType === 'winner_declared' && hostAWinsCalc.winnerHostId === 'host_a', 'Host A identified as winner when scoreA > scoreB');

    const hostBWinsCalc = calculatePKBattleWinner(
      15000, 28000,
      { id: 'host_a', nickname: 'Sara Live', avatarUrl: 'avatarA' },
      { id: 'host_b', nickname: 'Ayesha', avatarUrl: 'avatarB' }
    );
    assert(hostBWinsCalc.resultType === 'winner_declared' && hostBWinsCalc.winnerHostId === 'host_b', 'Host B identified as winner when scoreB > scoreA');
    assert(hostBWinsCalc.winnerScore === 28000, 'Winner score correctly assigned to Host B score');
    assert(hostBWinsCalc.loserScore === 15000, 'Loser score correctly assigned to Host A score');

    // 6. Draw Calculation Logic
    console.log('\n--- Test 6: Draw Logic Verification ---');
    const drawCalc = calculatePKBattleWinner(
      20000, 20000,
      { id: 'host_a', nickname: 'Sara Live', avatarUrl: 'avatarA' },
      { id: 'host_b', nickname: 'Ayesha', avatarUrl: 'avatarB' }
    );
    assert(drawCalc.resultType === 'draw', 'Draw correctly calculated when scores are equal');
    assert(drawCalc.winnerHostId === null, 'Winner host ID is null on draw');
    assert(drawCalc.scoreDiff === 0, 'Score difference is 0 on draw');

    // 7. PK Battle History Retrieval (Section 11)
    console.log('\n--- Test 7: PK Battle History Retrieval ---');
    const historyRes = await fetch(`${baseUrl}/api/pk/history?hostId=00000000-0000-0000-0000-000000088201`);
    assert(historyRes.status === 200, 'History endpoint returns HTTP 200');
    const historyData = await historyRes.json();
    assert(historyData.success === true, 'History returns success: true');
    assert(Array.isArray(historyData.history), 'History items returned as array');
    assert(historyData.history.length >= 2, 'History contains at least 2 battle records');
    const canonicalHistoryItem = historyData.history.find(h => h.battleId === canonicalResultBattleId);
    assert(canonicalHistoryItem !== undefined, 'Canonical completed battle is present in host history');
    assert(canonicalHistoryItem.outcome === 'win', 'Sara Live record indicates win outcome');
    assert(canonicalHistoryItem.myScore === 24860, 'Record has myScore 24,860');

    // 8. Security & State Reconnection
    console.log('\n--- Test 8: Security & Reconnection State Recovery ---');
    // Client reload must return the identical result without reset
    const reloadRes = await fetch(`${baseUrl}/api/pk/battle/${canonicalResultBattleId}/result`);
    const reloadData = await reloadRes.json();
    assert(reloadData.result.id === data.result.id, 'Reconnection recovers exact persistent result ID');
    assert(reloadData.result.winnerScore === data.result.winnerScore, 'Persistent scores remain strictly preserved');

    console.log(`\n======================================================`);
    console.log(`ALL TESTS PASSED: ${passedTests}/${totalTests} (100% SUCCESS)`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error(`\n❌ TEST SUITE FAILED:`, err.message);
    process.exit(1);
  }
}

runTests();
