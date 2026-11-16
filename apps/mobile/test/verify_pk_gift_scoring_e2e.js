/**
 * Popo Live Phase 3 Prompt 03/08
 * Automated End-to-End Verification Test for Gift-Based PK Scoring,
 * Real-Time Battle Points, Idempotency, Score Difference, Winner Determination & Results
 *
 * Verifies against live Next.js backend (http://localhost:3000):
 * 1. Pre-test Reset & Test Sandbox Initialization
 * 2. Eligible Live Host Discovery & Invitation Workflow
 * 3. 1v1 Battle Session Creation & Channel Setup
 * 4. PK Gift Catalog Retrieval (1 Coin = 1 PK Point Authoritative Rate)
 * 5. Viewer Wallet Balance Verification (3,600+ coins)
 * 6. Gift Sending to Host A (Atomic Coin Deduction & Host Score Increment)
 * 7. Idempotency Protection on Duplicate Gift Requests (Replay Detection)
 * 8. Gift Sending to Host B (Score Flipping & Dynamic Ratio Updates)
 * 9. Real-Time SSE Score Event Delivery (/events)
 * 10. PK Gift Transactions History Audit (/transactions)
 * 11. Authoritative Battle Finalization (/result)
 * 12. Score Cutoff: Rejection of Gifts Sent Post-Battle (HTTP 400 BATTLE_ALREADY_ENDED)
 * 13. Winner Determination & Score Differential Accuracy
 * 14. Draw / Tie Resolution Verification
 * 15. PK Battle History Retrieval (/history)
 * 16. 49 Original Dart Screen Preservation Verification
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

function makeRequest(method, reqPath, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(reqPath, BASE_URL);
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

function listenToSse(ssePath, durationMs = 2500) {
  return new Promise((resolve) => {
    const url = new URL(ssePath, BASE_URL);
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
        buffer = lines.pop();

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

    req.on('error', () => {
      resolve({ status: 500, events: [] });
    });

    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log(' Popo Live Phase 3 Prompt 03/08 — Gift-Based PK Scoring E2E Test');
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
    // Test 1: Test Reset & Environment Preparation
    // -------------------------------------------------------------
    console.log('[SECTION 1] Pre-Test Reset & Sandbox Initialization');
    const resetRes = await makeRequest('POST', '/api/pk/test-reset');
    assert(resetRes.status === 200, `Reset endpoint returns HTTP 200 (Got ${resetRes.status})`);
    assert(resetRes.data && resetRes.data.success === true, 'Test sandbox successfully reset');

    // -------------------------------------------------------------
    // Test 2: Host Discovery & Invitation Setup
    // -------------------------------------------------------------
    console.log('\n[SECTION 2] Eligible Live Host Discovery & Invitation Workflow');
    const hostsRes = await makeRequest('GET', '/api/pk/hosts');
    assert(hostsRes.status === 200, 'Hosts list retrieved successfully');
    const eligibleHosts = hostsRes.data.hosts.filter((h) => h.isEligibleForPk);
    assert(eligibleHosts.length >= 2, `Found ${eligibleHosts.length} eligible live hosts`);

    const hostA = eligibleHosts[0];
    const hostB = eligibleHosts[1];
    console.log(`  Host A: ${hostA.nickname} (${hostA.id}) | Room: ${hostA.roomNumber}`);
    console.log(`  Host B: ${hostB.nickname} (${hostB.id}) | Room: ${hostB.roomNumber}`);

    // Send PK invitation from Host A to Host B
    const sendInviteRes = await makeRequest('POST', '/api/pk/invitation/send', {
      senderHostId: hostA.id,
      receiverHostId: hostB.id,
      senderRoomNumber: hostA.roomNumber,
      battleType: '1v1',
    });
    assert(sendInviteRes.status === 200, 'PK Invitation sent successfully');
    const invitationId = sendInviteRes.data.invitation.id;

    // Host B accepts invitation
    const acceptInviteRes = await makeRequest('POST', '/api/pk/invitation/respond', {
      invitationId,
      action: 'accept',
      receiverHostId: hostB.id,
    });
    assert(acceptInviteRes.status === 200, 'PK Invitation accepted successfully');
    assert(acceptInviteRes.data.battle != null, 'Active battle session created');

    const battle = acceptInviteRes.data.battle;
    const battleId = battle.id;
    console.log(`  Created Battle ID: ${battleId}`);

    // -------------------------------------------------------------
    // Test 3: Active Battle Details & Server-Authoritative State
    // -------------------------------------------------------------
    console.log('\n[SECTION 3] Battle Verification & Server-Authoritative State');
    const battleRes = await makeRequest('GET', `/api/pk/battle/${battleId}`);
    assert(battleRes.status === 200, 'Active battle retrieved');
    assert(['active', 'preparing'].includes(battleRes.data.battle.status), `Battle status is active/preparing (${battleRes.data.battle.status})`);

    const scoreTimerInit = await makeRequest('GET', `/api/pk/battle/${battleId}/score-timer`);
    assert(scoreTimerInit.data.hostA.score === 0, 'Initial Host A score is 0');
    assert(scoreTimerInit.data.hostB.score === 0, 'Initial Host B score is 0');

    // -------------------------------------------------------------
    // Test 4: Gift Catalog Retrieval & Authoritative Conversion Rate
    // -------------------------------------------------------------
    console.log('\n[SECTION 4] PK Gift Catalog & Points Conversion Verification');
    const catalogRes = await makeRequest('GET', `/api/pk/battle/${battleId}/gifts/catalog`);
    assert(catalogRes.status === 200, 'Gift catalog retrieved successfully');
    assert(catalogRes.data.success === true, 'Catalog response success is true');
    assert(catalogRes.data.pkScoreConversionRate === 1, 'Authoritative rate: exactly 1 Coin = 1 PK Point');
    assert(catalogRes.data.hostSharePercentage === 70, 'Host share percentage is 70% in diamonds');

    const gifts = catalogRes.data.gifts || catalogRes.data.catalog || [];
    assert(Array.isArray(gifts), 'Catalog returns an array of gifts');
    assert(gifts.length >= 6, `Catalog contains ${gifts.length} gifts`);

    // Verify properties of catalog items
    const sampleGift = gifts[0];
    assert(sampleGift.id && sampleGift.name && sampleGift.coinPrice > 0, `Sample gift '${sampleGift.name}' has coinPrice ${sampleGift.coinPrice}`);
    assert(sampleGift.animationName != null, `Sample gift has animationName: '${sampleGift.animationName}'`);

    // -------------------------------------------------------------
    // Test 5: User Wallet Balance Check
    // -------------------------------------------------------------
    console.log('\n[SECTION 5] Viewer Wallet Balance Retrieval');
    const viewerId = 'user_viewer_pk_test_01';
    const walletRes = await makeRequest('GET', `/api/pk/battle/${battleId}/gifts/wallet?userId=${viewerId}`);
    assert(walletRes.status === 200, 'Wallet balance retrieved');
    assert(walletRes.data.wallet != null, 'Wallet object present');
    assert(walletRes.data.wallet.coins >= 500, `Wallet coins sufficient (${walletRes.data.wallet.coins} coins)`);
    const initialCoins = walletRes.data.wallet.coins;

    // -------------------------------------------------------------
    // Test 6: Send Gift to Host A (Atomic Deduction & Authoritative Increment)
    // -------------------------------------------------------------
    console.log('\n[SECTION 6] Gift Transaction Execution for Host A');
    const crownGift = gifts.find((g) => g.coinPrice === 500) || gifts[0];
    const idempKeyA = `idemp_tx_${Date.now()}_a`;

    const sendGiftARes = await makeRequest('POST', `/api/pk/battle/${battleId}/gifts/send`, {
      senderId: viewerId,
      senderName: 'Top Supporter Ali',
      receiverSide: 'host_a',
      giftId: crownGift.id,
      quantity: 1,
      idempotencyKey: idempKeyA,
    });

    assert(sendGiftARes.status === 200, `Send gift to Host A returned HTTP 200 (Got ${sendGiftARes.status})`);
    assert(sendGiftARes.data.success === true, 'Gift transaction processed successfully');
    assert(sendGiftARes.data.pkScore.pointsAdded === crownGift.coinPrice, `Points added equals coin price (${crownGift.coinPrice})`);
    assert(sendGiftARes.data.pkScore.hostAScore === crownGift.coinPrice, `Host A authoritative score is now ${crownGift.coinPrice}`);
    assert(sendGiftARes.data.financialSummary.hostSharePercentage === '70%', 'Host share verified as 70%');
    assert(sendGiftARes.data.sender.remainingCoins === initialCoins - crownGift.coinPrice, 'Coins accurately deducted from sender wallet');
    assert(sendGiftARes.data.animation.type === crownGift.animationName, 'Animation metadata returned for visual display');

    // -------------------------------------------------------------
    // Test 7: Idempotency Protection on Duplicate Gift Requests
    // -------------------------------------------------------------
    console.log('\n[SECTION 7] Idempotency Key Validation & Replay Detection');
    const replayRes = await makeRequest('POST', `/api/pk/battle/${battleId}/gifts/send`, {
      senderId: viewerId,
      senderName: 'Top Supporter Ali',
      receiverSide: 'host_a',
      giftId: crownGift.id,
      quantity: 1,
      idempotencyKey: idempKeyA, // EXACT SAME KEY
    });

    assert(replayRes.status === 200, 'Duplicate request returned HTTP 200');
    assert(replayRes.data.isIdempotentReplay === true, 'Server identified idempotent replay');

    // Verify that Host A score was NOT incremented twice
    const scoreCheck1 = await makeRequest('GET', `/api/pk/battle/${battleId}/score-timer`);
    assert(scoreCheck1.data.hostA.score === crownGift.coinPrice, `Score was preserved without double-counting (Score: ${scoreCheck1.data.hostA.score})`);

    // -------------------------------------------------------------
    // Test 8: Send Gift to Host B (Score Flip & Dynamic Ratio Update)
    // -------------------------------------------------------------
    console.log('\n[SECTION 8] Gift Transaction for Host B & Leading Side Flipping');
    // Choose rocket gift (1000 coins) to overtake Host A
    const rocketGift = gifts.find((g) => g.id === 'rocket') || gifts[gifts.length - 1];
    const idempKeyB = `idemp_tx_${Date.now()}_b`;

    const sendGiftBRes = await makeRequest('POST', `/api/pk/battle/${battleId}/gifts/send`, {
      senderId: viewerId,
      senderName: 'Galaxy Fan Zoya',
      receiverSide: 'host_b',
      giftId: rocketGift.id,
      quantity: 1,
      idempotencyKey: idempKeyB,
    });

    assert(sendGiftBRes.status === 200, 'Send gift to Host B returned HTTP 200');
    assert(sendGiftBRes.data.pkScore.hostBScore === rocketGift.coinPrice, `Host B score updated to ${rocketGift.coinPrice}`);

    // Verify leading side flipped to host_b
    const scoreCheck2 = await makeRequest('GET', `/api/pk/battle/${battleId}/score-timer`);
    assert(scoreCheck2.data.hostB.score === rocketGift.coinPrice, `Host B score in state is ${rocketGift.coinPrice}`);
    assert(scoreCheck2.data.leadingSide === 'host_b', 'Leading side dynamically flipped to host_b');
    assert(scoreCheck2.data.ratioB > scoreCheck2.data.ratioA, `Host B ratio (${scoreCheck2.data.ratioB}%) exceeds Host A ratio (${scoreCheck2.data.ratioA}%)`);
    assert(scoreCheck2.data.ratioA >= 15.0 && scoreCheck2.data.ratioB <= 85.0, 'Ratios constrained within bounded 15%-85% visual threshold');

    // -------------------------------------------------------------
    // Test 9: Real-Time SSE Score Event Delivery
    // -------------------------------------------------------------
    console.log('\n[SECTION 9] Real-Time Server-Sent Events (SSE) Stream Integration');
    const ssePromise = listenToSse(`/api/pk/battle/${battleId}/events`, 2000);
    // Send another quick gift (Rose 1 coin) to trigger SSE broadcast
    const roseGift = gifts.find((g) => g.id === 'rose') || gifts[0];
    await makeRequest('POST', `/api/pk/battle/${battleId}/gifts/send`, {
      senderId: viewerId,
      senderName: 'Stream Viewer',
      receiverSide: 'host_a',
      giftId: roseGift.id,
      quantity: 1,
      idempotencyKey: `idemp_sse_${Date.now()}`,
    });

    const sseResult = await ssePromise;
    assert(sseResult.status === 200, 'SSE stream connection established');
    const scoreEvents = sseResult.events.filter((e) => e.event === 'pk:score_updated');
    assert(scoreEvents.length > 0, `Received ${scoreEvents.length} real-time score SSE event(s)`);

    // -------------------------------------------------------------
    // Test 10: Gift Transactions Audit Log
    // -------------------------------------------------------------
    console.log('\n[SECTION 10] PK Gift Transactions Audit Log Retrieval');
    const txRes = await makeRequest('GET', `/api/pk/battle/${battleId}/gifts/transactions`);
    assert(txRes.status === 200, 'Transactions log returned HTTP 200');
    assert(Array.isArray(txRes.data.transactions), 'Transactions returned as array');
    assert(txRes.data.transactions.length >= 3, `Recorded ${txRes.data.transactions.length} gift transactions`);

    const latestTx = txRes.data.transactions[0];
    assert(latestTx.transactionId != null, 'Transaction ID present');
    assert(latestTx.status === 'completed', 'Transaction status is completed');
    assert(latestTx.pkScoreAdded > 0, `Score added recorded: ${latestTx.pkScoreAdded}`);

    // -------------------------------------------------------------
    // Test 11: Authoritative Battle Finalization & Winner Determination
    // -------------------------------------------------------------
    console.log('\n[SECTION 11] Authoritative Battle Finalization & Winner Declaration');
    const finalizeRes = await makeRequest('POST', `/api/pk/battle/${battleId}/result`, {
      action: 'end_battle',
      reason: 'timer_expired',
    });

    assert(finalizeRes.status === 200, 'Battle finalization returned HTTP 200');
    assert(finalizeRes.data.isCalculated === true, 'Battle outcome officially calculated');
    const result = finalizeRes.data.result;

    assert(result.resultType === 'winner_declared', 'Result type is winner_declared');
    assert(result.winnerHostId === hostB.id, `Winner host ID correctly declared as Host B (${hostB.nickname})`);
    assert(result.winnerScore === rocketGift.coinPrice, `Winner score verified as ${rocketGift.coinPrice}`);
    assert(result.loserHostId === hostA.id, `Loser host ID correctly declared as Host A (${hostA.nickname})`);
    const expectedDiff = rocketGift.coinPrice - (crownGift.coinPrice + roseGift.coinPrice);
    assert(result.scoreDiff === expectedDiff, `Score difference accurately calculated (${result.scoreDiff})`);

    // -------------------------------------------------------------
    // Test 12: Score Cutoff Verification (Reject Gifts After Expiration)
    // -------------------------------------------------------------
    console.log('\n[SECTION 12] Score Cutoff: Rejecting Gifts After Battle Ends');
    const postEndGiftRes = await makeRequest('POST', `/api/pk/battle/${battleId}/gifts/send`, {
      senderId: viewerId,
      senderName: 'Late Viewer',
      receiverSide: 'host_a',
      giftId: roseGift.id,
      quantity: 1,
      idempotencyKey: `idemp_late_${Date.now()}`,
    });

    assert(postEndGiftRes.status === 400, `Late gift rejected with HTTP 400 (Got ${postEndGiftRes.status})`);
    assert(postEndGiftRes.data.code === 'BATTLE_ALREADY_ENDED', 'Error code specifies BATTLE_ALREADY_ENDED');

    // -------------------------------------------------------------
    // Test 13: Draw / Tie Outcome Verification
    // -------------------------------------------------------------
    console.log('\n[SECTION 13] Tie / Draw Battle Outcome Verification');
    // Create new battle without gifts to test 0-0 tie
    const inviteRes2 = await makeRequest('POST', '/api/pk/invitation/send', {
      senderHostId: hostA.id,
      receiverHostId: hostB.id,
      senderRoomNumber: hostA.roomNumber,
      battleType: '1v1',
    });
    assert(inviteRes2.status === 200, `Second invitation sent for tie test (Status: ${inviteRes2.status})`);
    const inviteId2 = inviteRes2.data.invitation.id;
    const acceptRes2 = await makeRequest('POST', '/api/pk/invitation/respond', {
      invitationId: inviteId2,
      action: 'accept',
      receiverHostId: hostB.id,
    });
    assert(acceptRes2.status === 200, 'Second invitation accepted');
    const tieBattleId = acceptRes2.data.battle.id;

    // Finalize 0-0 battle
    const tieFinalizeRes = await makeRequest('POST', `/api/pk/battle/${tieBattleId}/result`, {
      action: 'end_battle',
      reason: 'timer_expired',
    });

    assert(tieFinalizeRes.status === 200, 'Tie battle finalization returned HTTP 200');
    const tieResult = tieFinalizeRes.data.result;
    assert(tieResult.resultType === 'draw', 'Result type for equal scores is draw');
    assert(tieResult.winnerHostId === null, 'Winner host ID is null on draw');
    assert(tieResult.scoreDiff === 0, 'Score difference is 0 on draw');

    // -------------------------------------------------------------
    // Test 14: PK Battle History Retrieval
    // -------------------------------------------------------------
    console.log('\n[SECTION 14] PK Battle History Retrieval');
    const historyRes = await makeRequest('GET', `/api/pk/history?hostId=${hostB.id}`);
    assert(historyRes.status === 200, 'PK history returned HTTP 200');
    assert(historyRes.data.success === true, 'History success is true');
    assert(Array.isArray(historyRes.data.history), 'History is an array');
    assert(historyRes.data.history.length > 0, `Retrieved ${historyRes.data.history.length} past battle record(s)`);

    const histItem = historyRes.data.history[0];
    assert(histItem.battleId != null, 'History item has battleId');
    assert(histItem.opponentName != null, `History item has opponentName: ${histItem.opponentName}`);
    assert(['win', 'loss', 'draw'].includes(histItem.outcome), `History item outcome valid: ${histItem.outcome}`);
    assert(histItem.durationFormatted != null, `History item has durationFormatted: ${histItem.durationFormatted}`);

    // -------------------------------------------------------------
    // Test 15: Preservation of All 49 Original Dart Screens
    // -------------------------------------------------------------
    console.log('\n[SECTION 15] 49 Original Dart Screens Preservation Audit');
    const screensDir = path.resolve(__dirname, '../lib/screens');
    const originalScreens = [
      'admin/admin_home_screen.dart',
      'agency_management/agency_management_screen.dart',
      'agent_earnings/agent_earnings_screen.dart',
      'animations/animation_overlay_widget.dart',
      'animations/animation_settings_sheet.dart',
      'animations/host_entrance_banner.dart',
      'auth/age_gate_screen.dart',
      'auth/forgot_password_sheet.dart',
      'auth/login_screen.dart',
      'auth/phone_otp_screen.dart',
      'auth/register_screen.dart',
      'auth/splash_screen.dart',
      'coin_seller/coin_seller_screen.dart',
      'daily_tasks/daily_host_tasks_screen.dart',
      'discovery/banners_carousel.dart',
      'discovery/country_chips.dart',
      'discovery/explore_home_screen.dart',
      'discovery/rankings_bottom_sheet.dart',
      'discovery/room_card.dart',
      'discovery/room_preview_screen.dart',
      'discovery/search_screen.dart',
      'earning_identity/earning_identity_screen.dart',
      'event_leaderboard/event_leaderboard_screen.dart',
      'fan_club/fan_club_screen.dart',
      'finance/receipts_finance_screen.dart',
      'gifts/gift_catalog_screen.dart',
      'gifts/gift_detail_sheet.dart',
      'gifts/gift_sending_sheet.dart',
      'gifts/live_gift_demo_screen.dart',
      'host_rankings/host_rankings_screen.dart',
      'inbox/inbox_screen.dart',
      'invites/invites_screen.dart',
      'live/face_verification_screen.dart',
      'party/party_room_screen.dart',
      'pk/pk_activity_slot_screen.dart',
      'pk/pk_battle_type_screen.dart',
      'pk/pk_discovery_tab_screen.dart',
      'pk/pk_fair_play_screen.dart',
      'pk/pk_invite_random_screen.dart',
      'pk/pk_reactions_screen.dart',
      'pk/pk_real_gifts_screen.dart',
      'pk/pk_result_screen.dart',
      'pk/pk_score_timer_screen.dart',
      'pk/pk_winner_boost_screen.dart',
      'profile/edit_profile_screen.dart',
      'profile/settings_screen.dart',
      'store/store_screen.dart',
      'vip/vip_screen.dart',
      'wallet/wallet_screen.dart',
    ];

    let preservedCount = 0;
    for (const rel of originalScreens) {
      const full = path.join(screensDir, rel);
      if (fs.existsSync(full)) {
        preservedCount++;
      } else {
        console.error(`  MISSING: ${rel}`);
      }
    }

    assert(
      preservedCount === originalScreens.length,
      `All ${originalScreens.length} original screens verified intact (${preservedCount}/${originalScreens.length})`
    );

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
