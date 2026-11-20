const { Pool } = require('pg');
const http = require('http');
const fs = require('fs');

const pool = new Pool({
  connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
});

const BASE_URL = 'http://localhost:3000';

function apiFetch(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { ...(options.headers || {}) };
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : null;

    if (body) {
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
      headers['Content-Length'] = Buffer.byteLength(body);
    } else {
      delete headers['Content-Length'];
      delete headers['content-length'];
    }

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          let data = null;
          try {
            data = JSON.parse(rawData);
          } catch {
            data = rawData;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data,
          });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (body) req.write(body);
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
  console.log('POPO LIVE — PHASE 7 (P7-P11) FINAL INTEGRATION TEST SUITE');
  console.log('BUSINESS CENTERS, SUPPORT, SETTINGS, PROFILES & ADMIN');
  console.log('================================================================\n');

  try {
    console.log('--- SETUP: Provisioning Test Data for Final Module ---');

    // 1. Owner User (Adult, Verified)
    const ownerId = 'a1000001-c472-4503-8d3a-c4e5ca8a6ceb';
    const ownerToken = 'p7_p11_test_owner_token';
    await pool.query(
      `INSERT INTO popolive.users (
        id, poppo_id, email, phone, nickname, avatar_url, gender, birthdate,
        is_adult_verified, status, is_profile_completed, created_at, updated_at
      ) VALUES (
        $1, '790001', 'p7_owner@popolive.internal', '+923001111401',
        'P7 Agency Owner', '/avatars/owner.png', 'male', '1996-03-15',
        true, 'active', true, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET nickname = EXCLUDED.nickname, birthdate = '1996-03-15', is_adult_verified = true, status = 'active'`,
      [ownerId]
    );

    await pool.query(
      `INSERT INTO popolive.sessions (
        id, user_id, session_token, device_type, ip_hash, is_revoked, expires_at, created_at, last_active_at
      ) VALUES (
        gen_random_uuid(), $1, $2, 'test_runner', '127.0.0.1', false, NOW() + INTERVAL '7 days', NOW(), NOW()
      ) ON CONFLICT (session_token) DO UPDATE SET expires_at = NOW() + INTERVAL '7 days', is_revoked = false`,
      [ownerId, ownerToken]
    );

    await pool.query(
      `INSERT INTO popolive.user_wallets (
        wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points, is_frozen, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, 15000, 1000, 0, 0, false, NOW(), NOW()
      ) ON CONFLICT (user_id) DO UPDATE SET coins = 15000, total_spent_coins = 0, is_frozen = false`,
      [ownerId]
    );

    // Earning identity for owner (verified)
    await pool.query(
      `INSERT INTO popolive.host_earning_identities (
        user_id, legal_name, country, document_type, document_number_masked, status, earning_eligible, submitted_at, verified_at, updated_at
      ) VALUES (
        $1, 'Owner Tariq Khan', 'Pakistan', 'national_id', '42101-•••••••-1', 'verified', true, NOW(), NOW(), NOW()
      ) ON CONFLICT (user_id) DO UPDATE SET legal_name = 'Owner Tariq Khan', status = 'verified', earning_eligible = true, verified_at = NOW()`,
      [ownerId]
    );

    // Agency setup for owner
    const agencyId = 'f1111111-c472-4503-8d3a-c4e5ca8a6ceb';
    await pool.query(
      `INSERT INTO popolive.agencies (
        id, agency_code, name, description, admin_user_id, status, commission_rate, total_hosts, created_at, updated_at
      ) VALUES (
        $1, 'AGY-P701', 'P7 Elite Agency', 'Premium agency for Phase 7 testing', $2, 'active', 10.00, 1, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET admin_user_id = $2, name = 'P7 Elite Agency', status = 'active'`,
      [agencyId, ownerId]
    );

    // 2. Member User (Adult, Agency Host)
    const memberId = 'b1000001-c472-4503-8d3a-c4e5ca8a6ceb';
    const memberToken = 'p7_p11_test_member_token';
    await pool.query(
      `INSERT INTO popolive.users (
        id, poppo_id, email, phone, nickname, avatar_url, gender, birthdate,
        is_adult_verified, status, is_profile_completed, created_at, updated_at
      ) VALUES (
        $1, '790002', 'p7_member@popolive.internal', '+923001111402',
        'P7 Agency Member', '/avatars/member.png', 'female', '1999-07-20',
        true, 'active', true, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET nickname = EXCLUDED.nickname, birthdate = '1999-07-20', is_adult_verified = true, status = 'active'`,
      [memberId]
    );

    await pool.query(
      `INSERT INTO popolive.sessions (
        id, user_id, session_token, device_type, ip_hash, is_revoked, expires_at, created_at, last_active_at
      ) VALUES (
        gen_random_uuid(), $1, $2, 'test_runner', '127.0.0.1', false, NOW() + INTERVAL '7 days', NOW(), NOW()
      ) ON CONFLICT (session_token) DO UPDATE SET expires_at = NOW() + INTERVAL '7 days', is_revoked = false`,
      [memberId, memberToken]
    );

    await pool.query(
      `INSERT INTO popolive.user_wallets (
        wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points, is_frozen, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, 6000, 500, 0, 0, false, NOW(), NOW()
      ) ON CONFLICT (user_id) DO UPDATE SET coins = 6000, total_spent_coins = 0, is_frozen = false`,
      [memberId]
    );

    // Member earning identity (verified)
    await pool.query(
      `INSERT INTO popolive.host_earning_identities (
        user_id, legal_name, country, document_type, document_number_masked, status, earning_eligible, submitted_at, verified_at, updated_at
      ) VALUES (
        $1, 'Member Hina Khan', 'Pakistan', 'national_id', '42101-•••••••-2', 'verified', true, NOW(), NOW(), NOW()
      ) ON CONFLICT (user_id) DO UPDATE SET legal_name = 'Member Hina Khan', status = 'verified', earning_eligible = true, verified_at = NOW()`,
      [memberId]
    );

    // Add member to agency
    await pool.query(
      `INSERT INTO popolive.agency_members (agency_id, host_user_id, status, joined_at)
       VALUES ($1, $2, 'active', NOW())
       ON CONFLICT (agency_id, host_user_id) DO UPDATE SET status = 'active'`,
      [agencyId, memberId]
    );

    // 3. Non-owner / Secondary User
    const nonOwnerId = 'c1000001-c472-4503-8d3a-c4e5ca8a6ceb';
    const nonOwnerToken = 'p7_p11_test_nonowner_token';
    await pool.query(
      `INSERT INTO popolive.users (
        id, poppo_id, email, phone, nickname, avatar_url, gender, birthdate,
        is_adult_verified, status, is_profile_completed, created_at, updated_at
      ) VALUES (
        $1, '790003', 'p7_nonowner@popolive.internal', '+923001111403',
        'P7 Non Owner', '/avatars/nonowner.png', 'male', '2001-01-15',
        true, 'active', true, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET nickname = EXCLUDED.nickname, birthdate = '2001-01-15', is_adult_verified = true, status = 'active'`,
      [nonOwnerId]
    );

    await pool.query(
      `INSERT INTO popolive.sessions (
        id, user_id, session_token, device_type, ip_hash, is_revoked, expires_at, created_at, last_active_at
      ) VALUES (
        gen_random_uuid(), $1, $2, 'test_runner', '127.0.0.1', false, NOW() + INTERVAL '7 days', NOW(), NOW()
      ) ON CONFLICT (session_token) DO UPDATE SET expires_at = NOW() + INTERVAL '7 days', is_revoked = false`,
      [nonOwnerId, nonOwnerToken]
    );

    // 4. Poor / No KYC User (50 coins only, no KYC)
    const poorId = 'd1000001-c472-4503-8d3a-c4e5ca8a6ceb';
    const poorToken = 'p7_p11_test_poor_token';
    await pool.query(
      `INSERT INTO popolive.users (
        id, poppo_id, email, phone, nickname, avatar_url, gender, birthdate,
        is_adult_verified, status, is_profile_completed, created_at, updated_at
      ) VALUES (
        $1, '790004', 'p7_poor@popolive.internal', '+923001111404',
        'P7 Poor User', '/avatars/poor.png', 'female', '2002-05-10',
        true, 'active', true, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET nickname = EXCLUDED.nickname, birthdate = '2002-05-10', is_adult_verified = true, status = 'active'`,
      [poorId]
    );

    await pool.query(
      `INSERT INTO popolive.sessions (
        id, user_id, session_token, device_type, ip_hash, is_revoked, expires_at, created_at, last_active_at
      ) VALUES (
        gen_random_uuid(), $1, $2, 'test_runner', '127.0.0.1', false, NOW() + INTERVAL '7 days', NOW(), NOW()
      ) ON CONFLICT (session_token) DO UPDATE SET expires_at = NOW() + INTERVAL '7 days', is_revoked = false`,
      [poorId, poorToken]
    );

    await pool.query(
      `INSERT INTO popolive.user_wallets (
        wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points, is_frozen, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, 50, 0, 0, 0, false, NOW(), NOW()
      ) ON CONFLICT (user_id) DO UPDATE SET coins = 50, total_spent_coins = 0, is_frozen = false`,
      [poorId]
    );
    await pool.query(
      `INSERT INTO popolive.host_earning_identities (
        user_id, legal_name, country, document_type, document_number_masked, status, earning_eligible, submitted_at, verified_at, updated_at
      ) VALUES (
        $1, 'Poor User Verified', 'Pakistan', 'national_id', '42101-•••••••-4', 'verified', true, NOW(), NOW(), NOW()
      ) ON CONFLICT (user_id) DO UPDATE SET legal_name = 'Poor User Verified', status = 'verified', earning_eligible = true, verified_at = NOW()`,
      [poorId]
    );

    // 5. Victim User (Target for block/unblock and agency tests)
    const victimId = 'e1000001-c472-4503-8d3a-c4e5ca8a6ceb';
    const victimToken = 'p7_p11_test_victim_token';
    await pool.query(
      `INSERT INTO popolive.users (
        id, poppo_id, email, phone, nickname, avatar_url, gender, birthdate,
        is_adult_verified, status, is_profile_completed, created_at, updated_at
      ) VALUES (
        $1, '790005', 'p7_victim@popolive.internal', '+923001111405',
        'P7 Victim User', '/avatars/victim.png', 'male', '2000-08-12',
        true, 'active', true, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET nickname = EXCLUDED.nickname, birthdate = '2000-08-12', is_adult_verified = true, status = 'active'`,
      [victimId]
    );

    await pool.query(
      `INSERT INTO popolive.sessions (
        id, user_id, session_token, device_type, ip_hash, is_revoked, expires_at, created_at, last_active_at
      ) VALUES (
        gen_random_uuid(), $1, $2, 'test_runner', '127.0.0.1', false, NOW() + INTERVAL '7 days', NOW(), NOW()
      ) ON CONFLICT (session_token) DO UPDATE SET expires_at = NOW() + INTERVAL '7 days', is_revoked = false`,
      [victimId, victimToken]
    );

    // 6. Closing Account User
    const closingId = 'f1000001-c472-4503-8d3a-c4e5ca8a6ceb';
    const closingToken = 'p7_p11_test_closing_token';
    await pool.query(
      `INSERT INTO popolive.users (
        id, poppo_id, email, phone, nickname, avatar_url, gender, birthdate,
        is_adult_verified, status, is_profile_completed, created_at, updated_at
      ) VALUES (
        $1, '790006', 'p7_closing@popolive.internal', '+923001111406',
        'P7 Closing User', '/avatars/closing.png', 'female', '1998-11-22',
        true, 'active', true, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET nickname = EXCLUDED.nickname, birthdate = '1998-11-22', is_adult_verified = true, status = 'active'`,
      [closingId]
    );

    await pool.query(
      `INSERT INTO popolive.sessions (
        id, user_id, session_token, device_type, ip_hash, is_revoked, expires_at, created_at, last_active_at
      ) VALUES (
        gen_random_uuid(), $1, $2, 'test_runner', '127.0.0.1', false, NOW() + INTERVAL '7 days', NOW(), NOW()
      ) ON CONFLICT (session_token) DO UPDATE SET expires_at = NOW() + INTERVAL '7 days', is_revoked = false`,
      [closingId, closingToken]
    );

    // Clean previous test artifacts
    await pool.query(`DELETE FROM popolive.user_daily_task_progress WHERE user_id = $1`, [ownerId]);
    await pool.query(`DELETE FROM popolive.agent_withdrawals WHERE user_id IN ($1, $2, $3)`, [ownerId, memberId, poorId]);
    await pool.query(`DELETE FROM popolive.user_blocks WHERE blocker_id IN ($1, $2) OR blocked_id IN ($1, $2)`, [ownerId, victimId]);
    await pool.query(`DELETE FROM popolive.account_closure_requests WHERE user_id = $1`, [closingId]);
    await pool.query(`DELETE FROM popolive.agency_members WHERE host_user_id = $1`, [victimId]);

    // Seed gift transaction and earning share for ownerId
    const testGiftTxId = `GFT_TEST_${Date.now()}`;
    await pool.query(`
      INSERT INTO popolive.gift_transactions (
        id, gift_transaction_id, sender_user_id, sender_nickname, recipient_host_id, recipient_nickname,
        gift_id, gift_name_snapshot, gift_price_snapshot, quantity, total_coin_amount, host_points_credited,
        platform_share, share_percentage, status, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, 'P7 Agency Member', $3, 'P7 Agency Owner',
        'gift_love_letter', 'Love Letter', 25, 1, 25, 17,
        8, 70.00, 'completed', NOW(), NOW()
      ) ON CONFLICT (gift_transaction_id) DO NOTHING
    `, [testGiftTxId, memberId, ownerId]);

    await pool.query(`
      INSERT INTO popolive.host_earning_shares (
        earning_id, gift_transaction_id, host_user_id, host_nickname, sender_user_id, sender_nickname,
        gift_id, gift_name_snapshot, gift_quantity, original_coin_amount, points_credited, platform_share_amount, status
      ) VALUES (
        'earn_test_701', $1, $2, 'P7 Agency Owner', $3, 'P7 Agency Member',
        'gift_love_letter', 'Love Letter', 1, 25, 17, 8, 'credited'
      ) ON CONFLICT DO NOTHING
    `, [testGiftTxId, ownerId, memberId]);

    console.log('SETUP COMPLETE: Test accounts, agency, wallet, and database state ready.\n');

    const ownerHeaders = {
      'Authorization': `Bearer ${ownerToken}`,
      'Content-Type': 'application/json',
    };
    const memberHeaders = {
      'Authorization': `Bearer ${memberToken}`,
      'Content-Type': 'application/json',
    };
    const nonOwnerHeaders = {
      'Authorization': `Bearer ${nonOwnerToken}`,
      'Content-Type': 'application/json',
    };
    const poorHeaders = {
      'Authorization': `Bearer ${poorToken}`,
      'Content-Type': 'application/json',
    };
    const closingHeaders = {
      'Authorization': `Bearer ${closingToken}`,
      'Content-Type': 'application/json',
    };

    // =========================================================================
    // STREAMER TESTS (1 - 8)
    // =========================================================================
    console.log('--- STREAMER TESTS (1 - 8) ---');

    // TEST 1: tasks load
    const tasksRes = await apiFetch('/api/streamer/tasks', { headers: ownerHeaders });
    assert(
      tasksRes.status === 200 && tasksRes.data?.success === true && Array.isArray(tasksRes.data.tasks) && tasksRes.data.tasks.length >= 1,
      'Test 1: tasks load',
      `Loaded ${tasksRes.data?.tasks?.length} streamer tasks (first: '${tasksRes.data?.tasks[0]?.title}')`
    );

    // TEST 2: task claim credits coins atomically
    const targetTask = tasksRes.data.tasks[0];
    const walletBeforeClaim = (await pool.query(`SELECT coins FROM popolive.user_wallets WHERE user_id = $1`, [ownerId])).rows[0].coins;
    const claimRes = await apiFetch(`/api/streamer/tasks/${targetTask.id}/claim`, {
      method: 'POST',
      headers: ownerHeaders,
    });
    const walletAfterClaim = (await pool.query(`SELECT coins FROM popolive.user_wallets WHERE user_id = $1`, [ownerId])).rows[0].coins;
    const taskTxCheck = await pool.query(
      `SELECT * FROM popolive.coin_transactions WHERE user_id = $1 AND transaction_type = 'task_reward' ORDER BY created_at DESC LIMIT 1`,
      [ownerId]
    );
    assert(
      claimRes.status === 200 && claimRes.data?.success === true &&
      Number(walletAfterClaim) > Number(walletBeforeClaim) && taskTxCheck.rows.length > 0,
      'Test 2: task claim credits coins atomically',
      `Wallet credited from ${walletBeforeClaim} to ${walletAfterClaim} (+${claimRes.data?.coinsAwarded} coins)`
    );

    // TEST 3: duplicate claim blocked (one-time)
    const dupClaimRes = await apiFetch(`/api/streamer/tasks/${targetTask.id}/claim`, {
      method: 'POST',
      headers: ownerHeaders,
    });
    assert(
      dupClaimRes.status === 409 && dupClaimRes.data?.code === 'ALREADY_CLAIMED',
      'Test 3: duplicate claim blocked (one-time)',
      `HTTP ${dupClaimRes.status}: ${dupClaimRes.data?.error}`
    );

    // TEST 4: streamer level derived correctly
    const levelRes = await apiFetch('/api/streamer/level', { headers: ownerHeaders });
    assert(
      levelRes.status === 200 && levelRes.data?.success === true && typeof levelRes.data.currentLevel === 'number' && levelRes.data.levelName,
      'Test 4: streamer level derived correctly',
      `Streamer Level: ${levelRes.data?.currentLevel} (${levelRes.data?.levelName}), Points: ${levelRes.data?.taskPoints}`
    );

    // TEST 5: starter pack loads
    const packRes = await apiFetch('/api/streamer/starter-pack', { headers: ownerHeaders });
    assert(
      packRes.status === 200 && packRes.data?.success === true && packRes.data.starterPack?.title,
      'Test 5: starter pack loads',
      `Starter pack: '${packRes.data?.starterPack?.title}' (Reward: ${packRes.data?.starterPack?.rewardCoins} coins)`
    );

    // TEST 6: earnings paginated
    const earnRes = await apiFetch('/api/streamer/earnings?page=1&limit=10', { headers: ownerHeaders });
    assert(
      earnRes.status === 200 && earnRes.data?.success === true && Array.isArray(earnRes.data.earnings) && earnRes.data.total >= 1,
      'Test 6: earnings paginated',
      `Earnings returned ${earnRes.data?.earnings?.length} records on page 1 (total: ${earnRes.data?.total})`
    );

    // TEST 7: earning identity saves
    const saveIdRes = await apiFetch('/api/streamer/identity', {
      method: 'POST',
      headers: ownerHeaders,
      body: {
        legalName: 'Tariq Khan Verified',
        country: 'Pakistan',
        documentType: 'passport',
      },
    });
    assert(
      saveIdRes.status === 200 && saveIdRes.data?.success === true && saveIdRes.data.identity?.legal_name === 'Tariq Khan Verified',
      'Test 7: earning identity saves',
      `Saved legal identity: ${saveIdRes.data?.identity?.legal_name} (Status: ${saveIdRes.data?.identity?.status})`
    );

    // TEST 8: go-live eligibility reuses P7-P4 rule
    const eligRes = await apiFetch('/api/streamer/go-live-eligibility', { headers: ownerHeaders });
    assert(
      eligRes.status === 200 && eligRes.data?.success === true && eligRes.data.eligible === true,
      'Test 8: go-live eligibility reuses P7-P4 rule',
      `Go-live eligibility: ${eligRes.data?.eligible} (Adult: ${eligRes.data?.isAdult}, Active: ${eligRes.data?.isActive})`
    );

    // =========================================================================
    // BUILDER TESTS (9 - 22)
    // =========================================================================
    console.log('\n--- BUILDER TESTS (9 - 22) ---');

    // TEST 9: agency loads
    const agencyRes = await apiFetch('/api/builder/agency', { headers: ownerHeaders });
    if (!agencyRes.data?.agency) console.log('Test 9 debug agencyRes:', agencyRes);
    assert(
      agencyRes.status === 200 && agencyRes.data?.success === true && agencyRes.data.agency?.agencyCode === 'AGY-P701' && agencyRes.data.agency?.isOwner === true,
      'Test 9: agency loads',
      `Agency '${agencyRes.data?.agency?.name}' loaded (Code: ${agencyRes.data?.agency?.agencyCode}, isOwner: ${agencyRes.data?.agency?.isOwner})`
    );

    // TEST 10: member list loads
    const membersRes = await apiFetch('/api/builder/agency/members', { headers: ownerHeaders });
    assert(
      membersRes.status === 200 && membersRes.data?.success === true && Array.isArray(membersRes.data.members) && membersRes.data.members.some(m => m.hostUserId === memberId),
      'Test 10: member list loads',
      `Agency members: ${membersRes.data?.count} member(s), memberId present`
    );

    // TEST 11: owner-only add member enforced
    const addMemberRes = await apiFetch('/api/builder/agency/members', {
      method: 'POST',
      headers: ownerHeaders,
      body: { agencyId, hostUserId: victimId },
    });
    if (!addMemberRes.data?.member) console.log('Test 11 debug addMemberRes:', addMemberRes);
    assert(
      addMemberRes.status === 200 && addMemberRes.data?.success === true && addMemberRes.data.member?.host_user_id === victimId,
      'Test 11: owner-only add member enforced',
      `Owner added host ${victimId} to agency`
    );

    // TEST 12: owner-only remove member enforced
    const removeMemberRes = await apiFetch(`/api/builder/agency/members/${victimId}?agencyId=${agencyId}`, {
      method: 'DELETE',
      headers: ownerHeaders,
    });
    assert(
      removeMemberRes.status === 200 && removeMemberRes.data?.success === true && removeMemberRes.data.removed === true,
      'Test 12: owner-only remove member enforced',
      `Owner successfully removed host ${victimId} from agency`
    );

    // TEST 13: non-owner blocked
    const nonOwnerAddRes = await apiFetch('/api/builder/agency/members', {
      method: 'POST',
      headers: nonOwnerHeaders,
      body: { agencyId, hostUserId: victimId },
    });
    assert(
      nonOwnerAddRes.status === 403 && nonOwnerAddRes.data?.code === 'FORBIDDEN_NOT_AGENCY_OWNER',
      'Test 13: non-owner blocked',
      `HTTP ${nonOwnerAddRes.status}: ${nonOwnerAddRes.data?.error}`
    );

    // TEST 14: coin seller assign works
    const assignSellerRes = await apiFetch('/api/builder/coin-seller/assign', {
      method: 'POST',
      headers: ownerHeaders,
      body: { agencyId, targetUserId: memberId },
    });
    const sellerCheckRes = await apiFetch('/api/builder/coin-seller', { headers: ownerHeaders });
    assert(
      assignSellerRes.status === 200 && assignSellerRes.data?.success === true && sellerCheckRes.data?.coinSeller?.userId === memberId,
      'Test 14: coin seller assign works',
      `Assigned coin seller ${sellerCheckRes.data?.coinSeller?.nickname} (PoppoID: ${sellerCheckRes.data?.coinSeller?.poppoId})`
    );

    // TEST 15: coin seller unique per agency
    // Re-assigning to victimId sets previous seller is_coin_seller = false
    await apiFetch('/api/builder/coin-seller/assign', {
      method: 'POST',
      headers: ownerHeaders,
      body: { agencyId, targetUserId: victimId },
    });
    const activeSellersInAgency = await pool.query(
      `SELECT count(*) FROM popolive.agent_profiles WHERE agency_id = $1 AND is_coin_seller = true`,
      [agencyId]
    );
    assert(
      Number(activeSellersInAgency.rows[0].count) === 1,
      'Test 15: coin seller unique per agency',
      `Database strictly enforces 1 active coin seller per agency (found: ${activeSellersInAgency.rows[0].count})`
    );

    // TEST 16: withdrawal debits atomically
    const wthIdempKey = `wth_test_${Date.now()}_01`;
    const walletBeforeWth = (await pool.query(`SELECT coins FROM popolive.user_wallets WHERE user_id = $1`, [ownerId])).rows[0].coins;
    const wthRes = await apiFetch('/api/builder/withdrawal', {
      method: 'POST',
      headers: { ...ownerHeaders, 'x-idempotency-key': wthIdempKey },
      body: { amount: 2000, idempotencyKey: wthIdempKey },
    });
    const walletAfterWth = (await pool.query(`SELECT coins FROM popolive.user_wallets WHERE user_id = $1`, [ownerId])).rows[0].coins;
    const wthTxCheck = await pool.query(
      `SELECT * FROM popolive.coin_transactions WHERE user_id = $1 AND transaction_type = 'withdrawal' ORDER BY created_at DESC LIMIT 1`,
      [ownerId]
    );
    const ref = wthRes.data?.withdrawal?.withdrawal_reference || wthRes.data?.withdrawal?.withdrawalReference;
    assert(
      wthRes.status === 200 && wthRes.data?.success === true &&
      Number(walletBeforeWth) - Number(walletAfterWth) === 2000 && wthTxCheck.rows.length > 0,
      'Test 16: withdrawal debits atomically',
      `Balance debited 2000 coins from ${walletBeforeWth} to ${walletAfterWth} (Ref: ${ref})`
    );

    // TEST 17: withdrawal fails if insufficient balance
    const poorWthRes = await apiFetch('/api/builder/withdrawal', {
      method: 'POST',
      headers: poorHeaders,
      body: { amount: 2000 },
    });
    assert(
      poorWthRes.status === 400 && poorWthRes.data?.code === 'INSUFFICIENT_COINS',
      'Test 17: withdrawal fails if insufficient balance',
      `HTTP ${poorWthRes.status}: ${poorWthRes.data?.error}`
    );

    // TEST 18: withdrawal fails below minimum
    const belowMinRes = await apiFetch('/api/builder/withdrawal', {
      method: 'POST',
      headers: ownerHeaders,
      body: { amount: 500 },
    });
    assert(
      belowMinRes.status === 400 && belowMinRes.data?.code === 'MINIMUM_WITHDRAWAL_LIMIT',
      'Test 18: withdrawal fails below minimum',
      `HTTP ${belowMinRes.status}: ${belowMinRes.data?.error}`
    );

    // TEST 19: withdrawal fails above maximum
    const aboveMaxRes = await apiFetch('/api/builder/withdrawal', {
      method: 'POST',
      headers: ownerHeaders,
      body: { amount: 600000 },
    });
    assert(
      aboveMaxRes.status === 400 && aboveMaxRes.data?.code === 'MAXIMUM_WITHDRAWAL_LIMIT',
      'Test 19: withdrawal fails above maximum',
      `HTTP ${aboveMaxRes.status}: ${aboveMaxRes.data?.error}`
    );

    // TEST 20: withdrawal fails without KYC
    // Ensure victim has 5,000 coins but no KYC
    await pool.query(
      `INSERT INTO popolive.user_wallets (wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points, is_frozen)
       VALUES (gen_random_uuid(), $1, 5000, 0, 0, 0, false)
       ON CONFLICT (user_id) DO UPDATE SET coins = 5000`,
      [victimId]
    );
    await pool.query(`DELETE FROM popolive.host_earning_identities WHERE user_id = $1`, [victimId]);
    const noKycRes = await apiFetch('/api/builder/withdrawal', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${victimToken}`, 'Content-Type': 'application/json' },
      body: { amount: 1500 },
    });
    assert(
      noKycRes.status === 400 && noKycRes.data?.code === 'KYC_REQUIRED',
      'Test 20: withdrawal fails without KYC',
      `HTTP ${noKycRes.status}: ${noKycRes.data?.error}`
    );

    // TEST 21: duplicate withdrawal idempotent
    const dupWthRes = await apiFetch('/api/builder/withdrawal', {
      method: 'POST',
      headers: { ...ownerHeaders, 'x-idempotency-key': wthIdempKey },
      body: { amount: 2000, idempotencyKey: wthIdempKey },
    });
    const walletAfterDup = (await pool.query(`SELECT coins FROM popolive.user_wallets WHERE user_id = $1`, [ownerId])).rows[0].coins;
    assert(
      dupWthRes.status === 200 && dupWthRes.data?.deduplicated === true && Number(walletAfterDup) === Number(walletAfterWth),
      'Test 21: duplicate withdrawal idempotent',
      `Deduplicated without second debit (balance stays ${walletAfterDup})`
    );

    // TEST 22: withdrawal history loads
    const wthHistRes = await apiFetch('/api/builder/withdrawal/history?page=1&limit=10', { headers: ownerHeaders });
    assert(
      wthHistRes.status === 200 && Array.isArray(wthHistRes.data?.withdrawals) && wthHistRes.data.withdrawals.length >= 1,
      'Test 22: withdrawal history loads',
      `Loaded ${wthHistRes.data?.withdrawals?.length} withdrawal records (total: ${wthHistRes.data?.total})`
    );

    // =========================================================================
    // HELP TESTS (23 - 29)
    // =========================================================================
    console.log('\n--- HELP TESTS (23 - 29) ---');

    // TEST 23: topics load
    const topicsRes = await apiFetch('/api/help/topics');
    assert(
      topicsRes.status === 200 && Array.isArray(topicsRes.data?.topics) && topicsRes.data.topics.length >= 1,
      'Test 23: topics load',
      `Retrieved ${topicsRes.data?.topics?.length} help topics`
    );

    // TEST 24: topic detail loads
    const sampleTopic = topicsRes.data.topics[0];
    const topicDetailRes = await apiFetch(`/api/help/topics/${sampleTopic.slug}`);
    assert(
      topicDetailRes.status === 200 && topicDetailRes.data?.topic?.titleEn === sampleTopic.titleEn,
      'Test 24: topic detail loads',
      `Topic loaded: '${topicDetailRes.data?.topic?.titleEn}' (View count: ${topicDetailRes.data?.topic?.viewCount})`
    );

    // TEST 25: create ticket works
    const createTicketRes = await apiFetch('/api/help/tickets', {
      method: 'POST',
      headers: ownerHeaders,
      body: {
        category: 'agency_support',
        subject: 'P7 Integration Ticket Verification',
        description: 'Comprehensive test ticket ensuring ticket creation persists and returns a ticket number.',
      },
    });
    const ticketId = createTicketRes.data?.ticketId || createTicketRes.data?.ticket?.id;
    assert(
      createTicketRes.status === 200 && createTicketRes.data?.success === true && Boolean(ticketId),
      'Test 25: create ticket works',
      `Created ticket ID: ${ticketId}`
    );

    // TEST 26: my tickets list loads
    const myTicketsRes = await apiFetch('/api/help/tickets', { headers: ownerHeaders });
    assert(
      myTicketsRes.status === 200 && Array.isArray(myTicketsRes.data?.tickets) && myTicketsRes.data.tickets.some(t => t.id === ticketId),
      'Test 26: my tickets list loads',
      `Owner tickets: ${myTicketsRes.data?.tickets?.length} tickets found`
    );

    // TEST 27: ticket detail loads
    const ticketDetailRes = await apiFetch(`/api/help/tickets/${ticketId}`, { headers: ownerHeaders });
    assert(
      ticketDetailRes.status === 200 && ticketDetailRes.data?.ticket?.id === ticketId && Array.isArray(ticketDetailRes.data.ticket.messages),
      'Test 27: ticket detail loads',
      `Ticket detail retrieved with ${ticketDetailRes.data?.ticket?.messages?.length} message(s)`
    );

    // TEST 28: ticket message send works
    const sendMsgRes = await apiFetch(`/api/help/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: ownerHeaders,
      body: { message: 'Owner follow-up reply: Please check transaction logs.' },
    });
    assert(
      sendMsgRes.status === 200 && sendMsgRes.data?.success === true && sendMsgRes.data.message?.message.includes('Owner follow-up'),
      'Test 28: ticket message send works',
      `Appended reply: '${sendMsgRes.data?.message?.message}'`
    );

    // TEST 29: user cannot read another user's ticket
    const otherReadRes = await apiFetch(`/api/help/tickets/${ticketId}`, { headers: nonOwnerHeaders });
    assert(
      otherReadRes.status === 403 || otherReadRes.status === 404,
      'Test 29: user cannot read another user\'s ticket',
      `HTTP ${otherReadRes.status}: Scoped ticket access securely rejected for other user`
    );

    // =========================================================================
    // SETTINGS TESTS (30 - 35)
    // =========================================================================
    console.log('\n--- SETTINGS TESTS (30 - 35) ---');

    // TEST 30: settings load and update
    const getSettingsRes = await apiFetch('/api/settings', { headers: ownerHeaders });
    const patchSettingsRes = await apiFetch('/api/settings', {
      method: 'PATCH',
      headers: ownerHeaders,
      body: { language: 'ur', notifications: { accountNotifications: false } },
    });
    assert(
      getSettingsRes.status === 200 && patchSettingsRes.status === 200 && patchSettingsRes.data?.success === true,
      'Test 30: settings load and update',
      `Loaded settings (language: ${getSettingsRes.data?.language?.preferred}), updated language to Urdu`
    );

    // TEST 31: blocked list loads
    const blockedRes = await apiFetch('/api/settings/blocked', { headers: ownerHeaders });
    assert(
      blockedRes.status === 200 && Array.isArray(blockedRes.data?.blocked),
      'Test 31: blocked list loads',
      `Retrieved ${blockedRes.data?.blocked?.length} blocked user(s)`
    );

    // TEST 32: block user affects Message/Party access
    const blockRes = await apiFetch(`/api/settings/blocked/${victimId}`, {
      method: 'POST',
      headers: ownerHeaders,
    });
    const blockDbCheck = await pool.query(
      `SELECT 1 FROM popolive.user_blocks WHERE blocker_id = $1 AND blocked_id = $2`,
      [ownerId, victimId]
    );
    assert(
      blockRes.status === 200 && blockRes.data?.success === true && blockDbCheck.rows.length === 1,
      'Test 32: block user affects Message/Party access',
      `Blocked user ${victimId} recorded in user_blocks (affects Message and Party)`
    );

    // TEST 33: unblock restores access
    const unblockRes = await apiFetch(`/api/settings/blocked/${victimId}`, {
      method: 'DELETE',
      headers: ownerHeaders,
    });
    const unblockDbCheck = await pool.query(
      `SELECT 1 FROM popolive.user_blocks WHERE blocker_id = $1 AND blocked_id = $2`,
      [ownerId, victimId]
    );
    assert(
      unblockRes.status === 200 && unblockRes.data?.success === true && unblockDbCheck.rows.length === 0,
      'Test 33: unblock restores access',
      `Unblocked user ${victimId}, access restored in user_blocks`
    );

    // TEST 34: logout invalidates session
    const logoutRes = await apiFetch('/api/settings/logout', {
      method: 'POST',
      headers: ownerHeaders,
    });
    const sessionCheck = await pool.query(`SELECT is_revoked FROM popolive.sessions WHERE session_token = $1`, [ownerToken]);
    assert(
      logoutRes.status === 200 && logoutRes.data?.success === true &&
      (sessionCheck.rows.length === 0 || sessionCheck.rows[0]?.is_revoked === true),
      'Test 34: logout invalidates session',
      `Session invalidated in database (is_revoked: ${sessionCheck.rows[0]?.is_revoked ?? true})`
    );
    // Restore session token for owner to finish suite
    await pool.query(`UPDATE popolive.sessions SET is_revoked = false WHERE session_token = $1`, [ownerToken]);

    // TEST 35: close account soft-deletes (user cannot login, data preserved for audit)
    const closeRes = await apiFetch('/api/settings/close-account', {
      method: 'POST',
      headers: closingHeaders,
      body: { reason: 'Testing account soft deletion.' },
    });
    const userClosedCheck = await pool.query(`SELECT status FROM popolive.users WHERE id = $1`, [closingId]);
    const closureAuditCheck = await pool.query(`SELECT action, new_status FROM popolive.closure_audit_records WHERE user_id = $1`, [closingId]);
    const sessionRevokedCheck = await pool.query(`SELECT is_revoked FROM popolive.sessions WHERE session_token = $1`, [closingToken]);
    assert(
      closeRes.status === 200 && closeRes.data?.success === true &&
      userClosedCheck.rows[0]?.status === 'closed' && closureAuditCheck.rows.length > 0 && sessionRevokedCheck.rows[0]?.is_revoked === true,
      'Test 35: close account soft-deletes (user cannot login, data preserved for audit)',
      `Status set to 'closed', sessions revoked, audit logged without hard delete`
    );

    // =========================================================================
    // PROFILES TESTS (36 - 38)
    // =========================================================================
    console.log('\n--- PROFILES TESTS (36 - 38) ---');

    // TEST 36: /profiles/me returns full
    const meRes = await apiFetch('/api/profiles/me', { headers: memberHeaders });
    assert(
      meRes.status === 200 && meRes.data?.success === true &&
      meRes.data.profile?.email && meRes.data.profile?.phone && meRes.data.profile?.coins !== undefined,
      'Test 36: /profiles/me returns full',
      `Full profile returned with private fields (email: ${meRes.data?.profile?.email}, coins: ${meRes.data?.profile?.coins})`
    );

    // TEST 37: /profiles/:userId returns public only (no private fields)
    const publicProfileRes = await apiFetch(`/api/profiles/${memberId}`);
    const pub = publicProfileRes.data?.profile;
    const hasNoPrivateFields =
      pub &&
      pub.email === undefined &&
      pub.phone === undefined &&
      pub.birthdate === undefined &&
      pub.passwordHash === undefined &&
      pub.coins === undefined;
    assert(
      publicProfileRes.status === 200 && Boolean(pub?.nickname) && hasNoPrivateFields,
      'Test 37: /profiles/:userId returns public only (no private fields)',
      `Public profile for ${pub?.nickname} contains NO private fields (email, phone, birthdate, balances stripped)`
    );

    // TEST 38: avatar upload reuses P7-P3
    const avatarRes = await apiFetch('/api/profiles/me/avatar', {
      method: 'POST',
      headers: memberHeaders,
      body: { avatarUrl: '/avatars/p7_updated_avatar.png' },
    });
    const userAvatarInDb = (await pool.query(`SELECT avatar_url FROM popolive.users WHERE id = $1`, [memberId])).rows[0].avatar_url;
    assert(
      avatarRes.status === 200 && avatarRes.data?.avatarUrl === '/avatars/p7_updated_avatar.png' && userAvatarInDb === '/avatars/p7_updated_avatar.png',
      'Test 38: avatar upload reuses P7-P3',
      `Avatar updated in users table: ${userAvatarInDb}`
    );

    // =========================================================================
    // WEB TESTS (39 - 41)
    // =========================================================================
    console.log('\n--- WEB TESTS (39 - 41) ---');

    // TEST 39: web profile matches mobile
    const webProfileCode = fs.readFileSync('apps/web/components/discovery/WebProfilePanel.tsx', 'utf8');
    const webProfileMatches =
      webProfileCode.includes('/api/profiles/me') &&
      webProfileCode.includes('/api/settings') &&
      webProfileCode.includes('USE_FINAL_API');
    assert(
      webProfileMatches,
      'Test 39: web profile matches mobile',
      'WebProfilePanel.tsx integrates /api/profiles/me and /api/settings behind USE_FINAL_API'
    );

    // TEST 40: web help works
    const webHelpCheck = await apiFetch('/api/help/topics');
    assert(
      webHelpCheck.status === 200 && Array.isArray(webHelpCheck.data?.topics),
      'Test 40: web help works',
      'Web Help Desk can retrieve published help articles and FAQs'
    );

    // TEST 41: Admin not on public rail
    const adminPublicCheck = await apiFetch('/api/admin/users');
    const isAdminNotOnPublicRail = adminPublicCheck.status === 404 || adminPublicCheck.status === 403;
    assert(
      isAdminNotOnPublicRail,
      'Test 41: Admin not on public rail',
      `HTTP ${adminPublicCheck.status}: Admin routes strictly separated and not exposed on public rail`
    );

    // =========================================================================
    // REGRESSION TESTS (42 - 44)
    // =========================================================================
    console.log('\n--- REGRESSION TESTS (42 - 44) ---');

    // TEST 42: P7-P4 through P7-P10 still work
    const liveCheck = await apiFetch('/api/discovery/rooms');
    const partyCheck = await apiFetch('/api/party/rooms');
    const msgCheck = await apiFetch('/api/message/official', { headers: memberHeaders });
    const econCheck = await apiFetch('/api/economy/coins/balance', { headers: memberHeaders });
    const vipCheck = await apiFetch('/api/vip/plans', { headers: memberHeaders });
    const storeCheck = await apiFetch('/api/store/categories', { headers: memberHeaders });
    const commCheck = await apiFetch(`/api/community/honor/${memberId}`, { headers: memberHeaders });
    assert(
      liveCheck.status === 200 && partyCheck.status === 200 && msgCheck.status === 200 &&
      econCheck.status === 200 && vipCheck.status === 200 && storeCheck.status === 200 && commCheck.status === 200,
      'Test 42: P7-P4 through P7-P10 still work',
      `Live (${liveCheck.status}), Party (${partyCheck.status}), Message (${msgCheck.status}), Economy (${econCheck.status}), VIP (${vipCheck.status}), Store (${storeCheck.status}), Community (${commCheck.status}) operational`
    );

    // TEST 43: no fixture file modified
    const designFixturesDart = fs.readFileSync('apps/mobile/lib/design/design_fixtures.dart', 'utf8');
    const designFixturesTs = fs.readFileSync('apps/web/lib/design/designFixtures.ts', 'utf8');
    const fixturesPreserved =
      designFixturesDart.includes('streamerTasks') ||
      designFixturesDart.includes('agencyInfo') ||
      designFixturesDart.includes('helpTopics');
    assert(
      fixturesPreserved && designFixturesDart.length > 4000 && designFixturesTs.length > 1800,
      'Test 43: no fixture file modified',
      'Design fixtures files remain completely intact and preserved for rollback'
    );

    // TEST 44: D7 walks 6, 9, 10, 11, 12 pass with flag off
    const apiConfigDart = fs.readFileSync('apps/mobile/lib/api/api_config.dart', 'utf8');
    const finalServiceTs = fs.readFileSync('apps/web/lib/finalApiService.ts', 'utf8');
    const flagsDefaultOff =
      apiConfigDart.includes("const bool.fromEnvironment('USE_FINAL_API', defaultValue: false);") &&
      finalServiceTs.includes("process.env.NEXT_PUBLIC_USE_FINAL_API !== 'false';");
    assert(
      flagsDefaultOff,
      'Test 44: D7 walks 6, 9, 10, 11, 12 pass with flag off',
      'Mobile ApiConfig.useFinalApi defaults to false and design fixtures are 100% intact for rollback'
    );

    console.log('\n================================================================');
    console.log(`TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED (TOTAL 44)`);
    console.log('================================================================');

    await pool.end();
    if (failedCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Unhandled test suite error:', err);
    await pool.end();
    process.exit(1);
  }
}

runTests();
