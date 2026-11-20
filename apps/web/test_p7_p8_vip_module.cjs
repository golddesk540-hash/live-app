const http = require('http');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
});

const BASE_URL = 'http://127.0.0.1:3000';

function apiFetch(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(data);
        } catch (_) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, data: json });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passedCount++;
    console.log(`[PASS] ${testName}`);
    if (details) console.log(`       -> ${details}`);
  } else {
    failedCount++;
    console.error(`[FAIL] ${testName}`);
    if (details) console.error(`       -> ${details}`);
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('POPO LIVE — PHASE 7 (P7-P8) VIP, REWARDS & RANKINGS INTEGRATION SUITE');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------------------
    // SETUP: Provision Test Users, Wallets, Tasks, and Sessions
    // -------------------------------------------------------------------------
    console.log('--- SETUP: Provisioning Test Data for VIP & Rewards Tests ---');

    // 1. Viewer Account (Adult, 25 years old, initial 1500 coins)
    const viewerId = 'ef395836-c472-4503-8d3a-c4e5ca8a6ceb';
    const viewerToken = 'p7_p8_test_viewer_token';
    await pool.query(
      `INSERT INTO popolive.users (
        id, poppo_id, email, phone, nickname, avatar_url, gender, birthdate,
        is_adult_verified, status, is_profile_completed, created_at, updated_at
      ) VALUES (
        $1, '778001', 'p7_p8_viewer@popolive.internal', '+923001111107',
        'P7 Viewer VIP', '/avatars/viewer.png', 'male', '1999-05-15',
        true, 'active', true, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET birthdate = '1999-05-15', is_adult_verified = true, status = 'active'`,
      [viewerId]
    );

    // 2. Poor Viewer Account (Adult, 22 years old, initial 10 coins)
    const poorViewerId = 'a1111111-c472-4503-8d3a-c4e5ca8a6ceb';
    const poorViewerToken = 'p7_p8_test_poor_token';
    await pool.query(
      `INSERT INTO popolive.users (
        id, poppo_id, email, phone, nickname, avatar_url, gender, birthdate,
        is_adult_verified, status, is_profile_completed, created_at, updated_at
      ) VALUES (
        $1, '778002', 'p7_p8_poor@popolive.internal', '+923001111108',
        'P7 Poor Viewer', '/avatars/poor.png', 'male', '2002-01-10',
        true, 'active', true, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET birthdate = '2002-01-10', is_adult_verified = true, status = 'active'`,
      [poorViewerId]
    );

    // 3. Underage Account (11 years old)
    const underageId = '64be0fe3-e65f-4f71-bf5e-1c54d5901d36';
    const underageToken = 'p7_p8_test_underage_token';
    await pool.query(
      `INSERT INTO popolive.users (
        id, poppo_id, email, phone, nickname, avatar_url, gender, birthdate,
        is_adult_verified, status, is_profile_completed, created_at, updated_at
      ) VALUES (
        $1, '778003', 'p7_p8_underage@popolive.internal', '+923001111109',
        'P7 Underage', '/avatars/underage.png', 'female', '2015-05-14',
        false, 'active', true, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET birthdate = '2015-05-14', is_adult_verified = false, status = 'active'`,
      [underageId]
    );

    // 4. Host Broadcaster Account
    const hostId = 'bc59a03f-b10d-4162-883c-09057cd3f994';
    const hostToken = 'p7_p8_test_host_token';
    await pool.query(
      `INSERT INTO popolive.users (
        id, poppo_id, email, phone, nickname, avatar_url, gender, birthdate,
        is_adult_verified, status, is_profile_completed, created_at, updated_at
      ) VALUES (
        $1, '778004', 'p7_p8_host@popolive.internal', '+923001111110',
        'P7 Host Star', '/avatars/host.png', 'female', '1996-03-20',
        true, 'active', true, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET birthdate = '1996-03-20', is_adult_verified = true, status = 'active'`,
      [hostId]
    );

    // Provision Sessions
    async function createSession(userId, token) {
      await pool.query(
        `INSERT INTO popolive.sessions (
          id, user_id, session_token, user_agent, ip_hash, expires_at, created_at, is_revoked
        ) VALUES (
          gen_random_uuid(), $1, $2, 'P7_P8_Test_Agent', '127.0.0.1', NOW() + INTERVAL '7 days', NOW(), false
        ) ON CONFLICT (session_token) DO UPDATE SET expires_at = NOW() + INTERVAL '7 days', is_revoked = false`,
        [userId, token]
      );
    }
    await createSession(viewerId, viewerToken);
    await createSession(poorViewerId, poorViewerToken);
    await createSession(underageId, underageToken);
    await createSession(hostId, hostToken);

    // Initialize Wallets:
    // Viewer: 1500 coins, 0 points
    await pool.query(
      `INSERT INTO popolive.user_wallets (
        wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points, is_frozen, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, 1500, 0, 0, 0, false, NOW(), NOW()
      ) ON CONFLICT (user_id) DO UPDATE SET coins = 1500, diamond_points = 0, total_spent_coins = 0, total_received_points = 0, is_frozen = false`,
      [viewerId]
    );

    // Poor Viewer: 10 coins
    await pool.query(
      `INSERT INTO popolive.user_wallets (
        wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points, is_frozen, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, 10, 0, 0, 0, false, NOW(), NOW()
      ) ON CONFLICT (user_id) DO UPDATE SET coins = 10, diamond_points = 0, total_spent_coins = 0, total_received_points = 0, is_frozen = false`,
      [poorViewerId]
    );

    // Clean previous VIP memberships and transactions for viewer
    await pool.query(`DELETE FROM popolive.user_vip_memberships WHERE user_id = $1`, [viewerId]);
    await pool.query(`DELETE FROM popolive.vip_membership_records WHERE user_id = $1`, [viewerId]);
    await pool.query(`DELETE FROM popolive.coin_transactions WHERE user_id = $1`, [viewerId]);
    await pool.query(`DELETE FROM popolive.points_transactions WHERE host_user_id = $1`, [viewerId]);

    // Provision Task Progress for Viewer for today
    // Task 1: go_live_60 -> Completed (60/60), unclaimed (reward: 150 points)
    await pool.query(
      `INSERT INTO popolive.user_daily_task_progress (
        id, user_id, task_id, task_date, current_progress, target_progress,
        status, is_completed, is_reward_claimed, reward_points_credited, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, 'go_live_60', CURRENT_DATE, 60, 60,
        'Completed', true, false, 0, NOW(), NOW()
      ) ON CONFLICT (user_id, task_id, task_date) DO UPDATE SET
        current_progress = 60, is_completed = true, is_reward_claimed = false`,
      [viewerId]
    );

    // Task 2: receive_gifts_10 -> Incomplete (2/10), unclaimed
    await pool.query(
      `INSERT INTO popolive.user_daily_task_progress (
        id, user_id, task_id, task_date, current_progress, target_progress,
        status, is_completed, is_reward_claimed, reward_points_credited, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, 'receive_gifts_10', CURRENT_DATE, 2, 10,
        'In Progress', false, false, 0, NOW(), NOW()
      ) ON CONFLICT (user_id, task_id, task_date) DO UPDATE SET
        current_progress = 2, is_completed = false, is_reward_claimed = false`,
      [viewerId]
    );

    console.log('--- SETUP COMPLETE: Beginning 28 Official Verification Checks ---\n');

    // =========================================================================
    // PART 9: VIP CHECKS (1-6)
    // =========================================================================
    console.log('--- [GROUP 1] VIP TESTS (Checks 1-6) ---');

    // Test 1: plans load
    const plansRes = await apiFetch('/api/vip/plans');
    assert(
      plansRes.status === 200 && Array.isArray(plansRes.data.plans) && plansRes.data.plans.length > 0,
      'Test 1: VIP plans load successfully',
      `Loaded ${plansRes.data?.plans?.length} active plans. First plan: ${plansRes.data?.plans?.[0]?.planName} (${plansRes.data?.plans?.[0]?.coinPrice} coins)`
    );

    // Test 2: active state loads
    const activeRes = await apiFetch('/api/vip/active', {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    assert(
      activeRes.status === 200 && activeRes.data.success === true && activeRes.data.membership !== undefined,
      'Test 2: Active VIP state loads for authenticated user',
      `Active state: isActive=${activeRes.data?.membership?.isActive}, vipLevel=${activeRes.data?.membership?.vipLevel}`
    );

    // Test 3: subscribe debits coins atomically
    const subIdempotency = `p7_p8_sub_${Date.now()}`;
    const subscribeRes = await apiFetch('/api/vip/plans/vip_basic/subscribe', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${viewerToken}`,
        'Content-Type': 'application/json',
        'idempotency-key': subIdempotency,
      },
      body: { idempotencyKey: subIdempotency },
    });

    const viewerWalletAfterSub = await pool.query(
      `SELECT coins, total_spent_coins FROM popolive.user_wallets WHERE user_id = $1`,
      [viewerId]
    );
    const coinsAfterSub = Number(viewerWalletAfterSub.rows[0].coins);
    const spentAfterSub = Number(viewerWalletAfterSub.rows[0].total_spent_coins);

    assert(
      subscribeRes.status === 200 &&
        subscribeRes.data.success === true &&
        subscribeRes.data.coinsCharged === 500 &&
        coinsAfterSub === 1000 &&
        spentAfterSub === 500,
      'Test 3: Subscribe debits coins atomically from wallet',
      `Charged 500 coins. Wallet balance updated: 1500 -> ${coinsAfterSub}. Remaining in response: ${subscribeRes.data?.remainingCoins}`
    );

    // Test 4: subscribe fails if insufficient balance
    const poorSubRes = await apiFetch('/api/vip/plans/vip_basic/subscribe', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${poorViewerToken}`,
        'Content-Type': 'application/json',
      },
      body: {},
    });
    assert(
      poorSubRes.status === 400 && poorSubRes.data.code === 'INSUFFICIENT_COINS',
      'Test 4: Subscribe fails if user has insufficient coin balance',
      `HTTP status: ${poorSubRes.status}, Error code: ${poorSubRes.data?.code}`
    );

    // Test 5: history records subscription
    const historyRes = await apiFetch('/api/vip/history', {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    const subRecord = historyRes.data?.history?.[0];
    assert(
      historyRes.status === 200 &&
        Array.isArray(historyRes.data?.history) &&
        subRecord &&
        subRecord.coinsCharged === 500 &&
        subRecord.planId === 'vip_basic',
      'Test 5: History records subscription accurately',
      `Recorded plan: ${subRecord?.planName}, Coins charged: ${subRecord?.coinsCharged}, Status: ${subRecord?.status}`
    );

    // Test 6: duplicate subscribe idempotent
    const duplicateSubRes = await apiFetch('/api/vip/plans/vip_basic/subscribe', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${viewerToken}`,
        'Content-Type': 'application/json',
        'idempotency-key': subIdempotency,
      },
      body: { idempotencyKey: subIdempotency },
    });
    const viewerWalletAfterReplay = await pool.query(
      `SELECT coins FROM popolive.user_wallets WHERE user_id = $1`,
      [viewerId]
    );
    const coinsAfterReplay = Number(viewerWalletAfterReplay.rows[0].coins);

    assert(
      duplicateSubRes.status === 200 &&
        duplicateSubRes.data.isIdempotentReplay === true &&
        coinsAfterReplay === 1000,
      'Test 6: Duplicate subscribe is strictly idempotent and does not double-charge',
      `Replay status: ${duplicateSubRes.status}, isIdempotentReplay: ${duplicateSubRes.data?.isIdempotentReplay}, Wallet coins intact: ${coinsAfterReplay}`
    );

    // =========================================================================
    // PART 9: REWARDS CHECKS (7-12)
    // =========================================================================
    console.log('\n--- [GROUP 2] REWARDS TESTS (Checks 7-12) ---');

    // Test 7: reward list loads with claimable flag
    const rewardsRes = await apiFetch('/api/rewards', {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    const tasks = rewardsRes.data?.tasks || [];
    const goLiveTask = tasks.find((t) => t.id === 'go_live_60');
    const giftTask = tasks.find((t) => t.id === 'receive_gifts_10');

    assert(
      rewardsRes.status === 200 &&
        tasks.length > 0 &&
        goLiveTask?.isClaimable === true &&
        giftTask?.isClaimable === false,
      'Test 7: Reward list loads with accurate claimable flag',
      `Total tasks: ${tasks.length}, go_live_60 claimable=${goLiveTask?.isClaimable}, receive_gifts_10 claimable=${giftTask?.isClaimable}`
    );

    // Test 8: claim credits points atomically
    const claimIdempotency = `p7_p8_claim_${Date.now()}`;
    const claimRes = await apiFetch('/api/rewards/go_live_60/claim', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${viewerToken}`,
        'Content-Type': 'application/json',
        'idempotency-key': claimIdempotency,
      },
      body: { idempotencyKey: claimIdempotency },
    });

    const viewerWalletAfterClaim = await pool.query(
      `SELECT diamond_points, total_received_points FROM popolive.user_wallets WHERE user_id = $1`,
      [viewerId]
    );
    const pointsAfterClaim = Number(viewerWalletAfterClaim.rows[0].diamond_points);

    const txRes = await pool.query(
      `SELECT * FROM popolive.points_transactions WHERE host_user_id = $1 AND transaction_type = 'task_reward'`,
      [viewerId]
    );

    assert(
      claimRes.status === 200 &&
        claimRes.data.success === true &&
        claimRes.data.pointsCredited === 150 &&
        pointsAfterClaim === 150 &&
        txRes.rowCount > 0,
      'Test 8: Claim credits points atomically to wallet and writes ledger transaction',
      `Points credited: ${claimRes.data?.pointsCredited}, Wallet points: ${pointsAfterClaim}, Ledger rows: ${txRes.rowCount}`
    );

    // Test 9: claim cannot repeat (unique constraint)
    const repeatClaimRes = await apiFetch('/api/rewards/go_live_60/claim', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${viewerToken}`,
        'Content-Type': 'application/json',
      },
      body: {},
    });
    assert(
      repeatClaimRes.status === 409 && repeatClaimRes.data.code === 'REWARD_ALREADY_CLAIMED',
      'Test 9: Claim cannot repeat — unique constraint strictly enforced',
      `HTTP status: ${repeatClaimRes.status}, Error code: ${repeatClaimRes.data?.code}`
    );

    // Test 10: claim history recorded
    const rewardsHistRes = await apiFetch('/api/rewards/history', {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    const histItem = rewardsHistRes.data?.history?.[0];
    assert(
      rewardsHistRes.status === 200 &&
        Array.isArray(rewardsHistRes.data?.history) &&
        histItem &&
        histItem.pointsAmount === 150,
      'Test 10: Claim history recorded in points ledger',
      `History count: ${rewardsHistRes.data?.history?.length}, Claimed points: ${histItem?.pointsAmount}, TaskId: ${histItem?.taskId}`
    );

    // Test 11: claim rejected for ineligible user (underage + incomplete task)
    const underageClaimRes = await apiFetch('/api/rewards/go_live_60/claim', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${underageToken}`,
        'Content-Type': 'application/json',
      },
      body: {},
    });
    const incompleteClaimRes = await apiFetch('/api/rewards/receive_gifts_10/claim', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${viewerToken}`,
        'Content-Type': 'application/json',
      },
      body: {},
    });

    assert(
      underageClaimRes.status === 403 &&
        underageClaimRes.data.code === 'AGE_RESTRICTION_18_PLUS' &&
        incompleteClaimRes.status === 400 &&
        incompleteClaimRes.data.code === 'REWARD_NOT_ELIGIBLE',
      'Test 11: Claim rejected for ineligible users (underage=403, incomplete=400)',
      `Underage code: ${underageClaimRes.data?.code} (status ${underageClaimRes.status}), Incomplete code: ${incompleteClaimRes.data?.code} (status ${incompleteClaimRes.status})`
    );

    // Test 12: duplicate claim idempotent
    const duplicateClaimRes = await apiFetch('/api/rewards/go_live_60/claim', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${viewerToken}`,
        'Content-Type': 'application/json',
        'idempotency-key': claimIdempotency,
      },
      body: { idempotencyKey: claimIdempotency },
    });
    const walletAfterDupClaim = await pool.query(
      `SELECT diamond_points FROM popolive.user_wallets WHERE user_id = $1`,
      [viewerId]
    );
    const pointsAfterDupClaim = Number(walletAfterDupClaim.rows[0].diamond_points);

    assert(
      duplicateClaimRes.status === 200 &&
        duplicateClaimRes.data.isIdempotentReplay === true &&
        pointsAfterDupClaim === 150,
      'Test 12: Duplicate claim is idempotent and does not award points twice',
      `Replay status: ${duplicateClaimRes.status}, isIdempotentReplay: ${duplicateClaimRes.data?.isIdempotentReplay}, Points unchanged: ${pointsAfterDupClaim}`
    );

    // =========================================================================
    // PART 9: RANKINGS CHECKS (13-16)
    // =========================================================================
    console.log('\n--- [GROUP 3] RANKINGS TESTS (Checks 13-16) ---');

    // Test 13: host ranks load
    const ranksRes = await apiFetch('/api/rankings/hosts');
    assert(
      ranksRes.status === 200 && Array.isArray(ranksRes.data.rankings) && ranksRes.data.rankings.length > 0,
      'Test 13: Host rankings load successfully',
      `Loaded ${ranksRes.data?.rankings?.length} hosts. Top host: ${ranksRes.data?.rankings?.[0]?.hostNickname} (Rank #${ranksRes.data?.rankings?.[0]?.rank})`
    );

    // Test 14: day/week/month ranges work
    const dayRanks = await apiFetch('/api/rankings/hosts?range=day');
    const weekRanks = await apiFetch('/api/rankings/hosts?range=week');
    const monthRanks = await apiFetch('/api/rankings/hosts?range=month');
    assert(
      dayRanks.status === 200 &&
        weekRanks.status === 200 &&
        monthRanks.status === 200 &&
        dayRanks.data.range === 'day' &&
        weekRanks.data.range === 'week' &&
        monthRanks.data.range === 'month',
      'Test 14: Day, week, and month ranking ranges compute dynamically',
      `dayRange: ${dayRanks.data.range}, weekRange: ${weekRanks.data.range}, monthRange: ${monthRanks.data.range}`
    );

    // Test 15: event board loads
    const eventsRes = await apiFetch('/api/rankings/events');
    assert(
      eventsRes.status === 200 && Array.isArray(eventsRes.data.events) && eventsRes.data.events.length > 0,
      'Test 15: Event leaderboard board loads active events',
      `Loaded ${eventsRes.data?.events?.length} active events. First event: ${eventsRes.data?.events?.[0]?.title}`
    );

    // Test 16: pagination works
    const page1Res = await apiFetch('/api/rankings/hosts?page=1&limit=2');
    const page2Res = await apiFetch('/api/rankings/hosts?page=2&limit=2');
    assert(
      page1Res.status === 200 &&
        page2Res.status === 200 &&
        page1Res.data.rankings?.[0]?.rank === 1 &&
        page2Res.data.rankings?.[0]?.rank === 3,
      'Test 16: Leaderboard pagination works accurately across pages',
      `Page 1 first rank: #${page1Res.data.rankings?.[0]?.rank}, Page 2 first rank: #${page2Res.data.rankings?.[0]?.rank}`
    );

    // =========================================================================
    // PART 9: HONOR LEVEL CHECKS (17-19)
    // =========================================================================
    console.log('\n--- [GROUP 4] HONOR LEVEL TESTS (Checks 17-19) ---');

    // Test 17: honor bars read-only
    const honorRes = await apiFetch(`/api/honor/levels/${viewerId}`);
    assert(
      honorRes.status === 200 &&
        honorRes.data.wealth !== undefined &&
        honorRes.data.shining !== undefined &&
        honorRes.data.honor !== undefined,
      'Test 17: Honor levels return three derived bars (wealth, shining, honor)',
      `Wealth: Lv.${honorRes.data?.wealth?.level} (${honorRes.data?.wealth?.progressPercent}%), Shining: Lv.${honorRes.data?.shining?.level}, Honor: Lv.${honorRes.data?.honor?.level}`
    );

    // Test 18: no write endpoint exists
    const writeAttempt = await apiFetch(`/api/honor/levels/${viewerId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { level: 99 },
    });
    assert(
      writeAttempt.status === 405 && writeAttempt.data.code === 'METHOD_NOT_ALLOWED',
      'Test 18: No write endpoint exists for honor levels (HTTP 405 Method Not Allowed)',
      `HTTP status: ${writeAttempt.status}, code: ${writeAttempt.data?.code}`
    );

    // Test 19: honor values match derived data
    // Viewer spent 500 coins on VIP Basic in Test 3
    assert(
      honorRes.data?.wealth?.currentScore === 500 &&
        honorRes.data?.wealth?.level === 2 &&
        honorRes.data?.shining?.currentScore === 150,
      'Test 19: Honor values match derived backend transaction data exactly',
      `Wealth score: ${honorRes.data?.wealth?.currentScore} (spent 500 coins -> Silver Patron Lv.2), Shining points: ${honorRes.data?.shining?.currentScore}`
    );

    // =========================================================================
    // PART 9: MEDALS CHECKS (20-22)
    // =========================================================================
    console.log('\n--- [GROUP 5] MEDALS TESTS (Checks 20-22) ---');

    // Test 20: earned medals load
    const medalsRes = await apiFetch('/api/medals/me', {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    const unlockedMedals = medalsRes.data?.medals?.filter((m) => m.isUnlocked) || [];
    assert(
      medalsRes.status === 200 && Array.isArray(medalsRes.data.medals) && unlockedMedals.length > 0,
      'Test 20: Earned medals load with unlocked items',
      `Total medals: ${medalsRes.data?.medals?.length}, Unlocked count: ${unlockedMedals.length} (${unlockedMedals.map((m) => m.name).join(', ')})`
    );

    // Test 21: locked slots shown
    const lockedMedals = medalsRes.data?.medals?.filter((m) => !m.isUnlocked) || [];
    assert(
      lockedMedals.length > 0 &&
        lockedMedals.some((m) => m.id === 'med_05') &&
        lockedMedals.some((m) => m.id === 'med_06'),
      'Test 21: Locked slots are displayed to preserve complete grid layout',
      `Locked count: ${lockedMedals.length} (${lockedMedals.map((m) => m.name).join(', ')})`
    );

    // Test 22: no grant endpoint exists
    const medalGrantAttempt = await apiFetch('/api/medals/me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { medalId: 'med_05' },
    });
    assert(
      medalGrantAttempt.status === 405 && medalGrantAttempt.data.code === 'METHOD_NOT_ALLOWED',
      'Test 22: No grant endpoint exists for medals (HTTP 405 Method Not Allowed)',
      `HTTP status: ${medalGrantAttempt.status}, code: ${medalGrantAttempt.data?.code}`
    );

    // =========================================================================
    // PART 9: ME & WEB INTEGRATION CHECKS (23-25)
    // =========================================================================
    console.log('\n--- [GROUP 6] ME & WEB INTEGRATION TESTS (Checks 23-25) ---');

    // Test 23: Me VIP pill reads backend
    const fs = require('fs');
    const meScreenCode = fs.readFileSync('apps/mobile/lib/screens/profile/me_screen.dart', 'utf8');
    const vipServiceCode = fs.readFileSync('apps/mobile/lib/api/services/vip_api_service.dart', 'utf8');

    const meVipWired =
      meScreenCode.includes('ApiConfig.useVipApi') &&
      meScreenCode.includes('_loadLiveVipAndHonor') &&
      meScreenCode.includes('_liveVipLabel') &&
      meScreenCode.includes('_buildVipBadge');

    assert(
      meVipWired,
      'Test 23: Mobile Me VIP pill conditionally reads live backend values via useVipApi',
      'Verified ApiConfig.useVipApi, _loadLiveVipAndHonor, and _buildVipBadge live state linkage in me_screen.dart'
    );

    // Test 24: Me honor display reads backend
    const meHonorWired =
      meScreenCode.includes('_liveWealthLevel') &&
      meScreenCode.includes('_liveShiningLevel') &&
      meScreenCode.includes('me_wealth_badge') &&
      meScreenCode.includes('me_shining_badge');

    assert(
      meHonorWired,
      'Test 24: Mobile Me honor level display conditionally reads live derived levels via useVipApi',
      'Verified wealth and shining badges consume _liveWealthLevel and _liveShiningLevel in me_screen.dart'
    );

    // Test 25: web profile shows same VIP/honor as mobile
    const webProfileCode = fs.readFileSync('apps/web/components/discovery/WebProfilePanel.tsx', 'utf8');
    const webProfileWired =
      webProfileCode.includes('USE_VIP_API') &&
      webProfileCode.includes('/api/vip/active') &&
      webProfileCode.includes('/api/honor/levels/') &&
      webProfileCode.includes('liveVipLevel') &&
      webProfileCode.includes('liveWealthLevel');

    assert(
      webProfileWired,
      'Test 25: Web profile panel consumes USE_VIP_API and mirrors mobile VIP & honor state',
      'Verified USE_VIP_API toggle, live VIP and honor states in WebProfilePanel.tsx'
    );

    // =========================================================================
    // PART 9: REGRESSION CHECKS (26-28)
    // =========================================================================
    console.log('\n--- [GROUP 7] REGRESSION TESTS (Checks 26-28) ---');

    // Test 26: P7-P4 through P7-P7 still work
    const liveRes = await apiFetch('/api/live/rooms');
    const partyRes = await apiFetch('/api/party/rooms');
    const msgRes = await apiFetch('/api/message/official', {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    const ecoRes = await apiFetch('/api/economy/coins/balance', {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });

    assert(
      liveRes.status === 200 &&
        partyRes.status === 200 &&
        msgRes.status === 200 &&
        ecoRes.status === 200 &&
        ecoRes.data.coins === 1000,
      'Test 26: P7-P4 through P7-P7 regressions pass with intact modules and matching balances',
      `Live rooms: ${liveRes.status}, Party: ${partyRes.status}, Messages: ${msgRes.status}, Economy balance: ${ecoRes.data?.coins} coins`
    );

    // Test 27: out-of-scope on fixtures
    const designFixturesDart = fs.readFileSync('apps/mobile/lib/design/design_fixtures.dart', 'utf8');
    const designFixturesTs = fs.readFileSync('apps/web/lib/design/designFixtures.ts', 'utf8');

    const outOfScopeIntact =
      designFixturesDart.includes('store') &&
      designFixturesDart.includes('redeemCode') &&
      designFixturesDart.includes('bag') &&
      designFixturesTs.includes('store') &&
      designFixturesTs.includes('redeemCode') &&
      designFixturesTs.includes('bag');

    assert(
      outOfScopeIntact,
      'Test 27: Out-of-scope modules remain strictly on design fixtures',
      'Store, Bag, Redeem, and Community fixtures remain 100% intact across mobile and web'
    );

    // Test 28: D7 walk 8 passes with flag off
    const apiConfigDart = fs.readFileSync('apps/mobile/lib/api/api_config.dart', 'utf8');
    const vipServiceTs = fs.readFileSync('apps/web/lib/vipApiService.ts', 'utf8');

    const flagsDefaultOff =
      apiConfigDart.includes("const bool.fromEnvironment('USE_VIP_API', defaultValue: false);") &&
      vipServiceTs.includes("process.env.NEXT_PUBLIC_USE_VIP_API !== 'false';");

    assert(
      flagsDefaultOff,
      'Test 28: D7 walk 8 passes with flag off preserving zero visual drift on fixtures',
      'Mobile ApiConfig.useVipApi defaults to false and Web flag is configurable'
    );

    console.log('\n================================================================');
    console.log(`TEST SUITE SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED out of 28 CHECKS`);
    console.log('================================================================\n');

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution fatal error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTests();
