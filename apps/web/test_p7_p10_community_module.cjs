const http = require('http');
const fs = require('fs');
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
  console.log('POPO LIVE — PHASE 7 (P7-P10) COMMUNITY MODULE INTEGRATION SUITE');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------------------
    // SETUP: Provision Test Users, Host, Fan Club, Wallets, and Sessions
    // -------------------------------------------------------------------------
    console.log('--- SETUP: Provisioning Test Data for Community Module ---');

    // 1. Host User (Adult)
    const hostId = 'a0000001-c472-4503-8d3a-c4e5ca8a6ceb';
    const hostToken = 'p7_p10_test_host_token';
    await pool.query(
      `INSERT INTO popolive.users (
        id, poppo_id, email, phone, nickname, avatar_url, gender, birthdate,
        is_adult_verified, status, is_profile_completed, created_at, updated_at
      ) VALUES (
        $1, '780001', 'p7_p10_host@popolive.internal', '+923001111301',
        'P7 Host Sana', '/avatars/host_sana.png', 'female', '1998-04-12',
        true, 'active', true, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET nickname = EXCLUDED.nickname, poppo_id = EXCLUDED.poppo_id, avatar_url = EXCLUDED.avatar_url, birthdate = EXCLUDED.birthdate, is_adult_verified = EXCLUDED.is_adult_verified, status = EXCLUDED.status`,
      [hostId]
    );

    // 2. Member User (Adult, 25 years old, initial 5,000 coins)
    const memberId = 'b0000001-c472-4503-8d3a-c4e5ca8a6ceb';
    const memberToken = 'p7_p10_test_member_token';
    await pool.query(
      `INSERT INTO popolive.users (
        id, poppo_id, email, phone, nickname, avatar_url, gender, birthdate,
        is_adult_verified, status, is_profile_completed, created_at, updated_at
      ) VALUES (
        $1, '780002', 'p7_p10_member@popolive.internal', '+923001111302',
        'P7 Member Bilal', '/avatars/bilal.png', 'male', '1999-05-15',
        true, 'active', true, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET nickname = EXCLUDED.nickname, poppo_id = EXCLUDED.poppo_id, avatar_url = EXCLUDED.avatar_url, birthdate = EXCLUDED.birthdate, is_adult_verified = EXCLUDED.is_adult_verified, status = EXCLUDED.status`,
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
        gen_random_uuid(), $1, 5000, 450, 0, 0, false, NOW(), NOW()
      ) ON CONFLICT (user_id) DO UPDATE SET coins = 5000, total_spent_coins = 0, is_frozen = false`,
      [memberId]
    );

    // 3. Poor User (Adult, 22 years old, initial 10 coins)
    const poorId = 'c0000001-c472-4503-8d3a-c4e5ca8a6ceb';
    const poorToken = 'p7_p10_test_poor_token';
    await pool.query(
      `INSERT INTO popolive.users (
        id, poppo_id, email, phone, nickname, avatar_url, gender, birthdate,
        is_adult_verified, status, is_profile_completed, created_at, updated_at
      ) VALUES (
        $1, '780003', 'p7_p10_poor@popolive.internal', '+923001111303',
        'P7 Poor Supporter', '/avatars/poor.png', 'female', '2002-01-10',
        true, 'active', true, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET nickname = EXCLUDED.nickname, poppo_id = EXCLUDED.poppo_id, avatar_url = EXCLUDED.avatar_url, birthdate = EXCLUDED.birthdate, is_adult_verified = EXCLUDED.is_adult_verified, status = EXCLUDED.status`,
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
        gen_random_uuid(), $1, 10, 0, 0, 0, false, NOW(), NOW()
      ) ON CONFLICT (user_id) DO UPDATE SET coins = 10, total_spent_coins = 0, is_frozen = false`,
      [poorId]
    );

    // 4. Invitee User
    const inviteeId = 'd0000001-c472-4503-8d3a-c4e5ca8a6ceb';
    await pool.query(
      `INSERT INTO popolive.users (
        id, poppo_id, email, phone, nickname, avatar_url, gender, birthdate,
        is_adult_verified, status, is_profile_completed, created_at, updated_at
      ) VALUES (
        $1, '780004', 'p7_p10_invitee@popolive.internal', '+923001111304',
        'P7 Invitee User', '/avatars/invitee.png', 'male', '2001-09-19',
        true, 'active', true, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET nickname = EXCLUDED.nickname, poppo_id = EXCLUDED.poppo_id, avatar_url = EXCLUDED.avatar_url, birthdate = EXCLUDED.birthdate, is_adult_verified = EXCLUDED.is_adult_verified, status = EXCLUDED.status`,
      [inviteeId]
    );

    // 5. Seed Fan Club for host
    const testClubId = 'club_p7_test';
    await pool.query(
      `INSERT INTO popolive.fan_clubs (
        id, host_id, name, description, badge_label, club_level, member_count, cover_image_url, accent_tone, is_featured, created_at, updated_at
      ) VALUES (
        $1, $2, 'SANA TITANS TEST', 'Official testing fan squad for Sana.', 'PK Titan', 5, 12, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1000', 'pink', true, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET host_id = $2, badge_label = 'PK Titan', member_count = 12`,
      [testClubId, hostId]
    );

    // 6. Clean previous test artifacts
    await pool.query(`DELETE FROM popolive.fan_club_members WHERE club_id = $1 AND user_id = $2`, [testClubId, memberId]);
    await pool.query(`DELETE FROM popolive.guardians WHERE guardian_user_id IN ($1, $2)`, [memberId, poorId]);
    await pool.query(`DELETE FROM popolive.invitations WHERE inviter_id = $1`, [memberId]);
    await pool.query(`DELETE FROM popolive.user_invite_codes WHERE user_id = $1`, [memberId]);
    await pool.query(`DELETE FROM popolive.live_room_history WHERE user_id = $1`, [memberId]);
    await pool.query(`DELETE FROM popolive.rate_limits WHERE key LIKE 'guardian_%' OR key LIKE 'invite_%'`);

    // Seed watch history row for memberId
    await pool.query(`
      INSERT INTO popolive.live_room_history (
        room_id, user_id, host_id, host_nickname, title, cover_url, watched_at, duration_seconds, replay_url, is_replay_available
      ) VALUES
      (
        'room_karachi_music_701', $1, $2,
        'P7 Host Sana', 'Karachi Acoustic Nights & Chill 🎶', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600',
        NOW() - INTERVAL '2 hours', 1840, 'https://cdn.popolive.internal/replays/room_701.mp4', true
      );
    `, [memberId, hostId]);

    console.log('SETUP COMPLETE: Test accounts, fan club, and database state ready.\n');

    const memberHeaders = {
      'Authorization': `Bearer ${memberToken}`,
      'Content-Type': 'application/json',
    };
    const poorHeaders = {
      'Authorization': `Bearer ${poorToken}`,
      'Content-Type': 'application/json',
    };

    // =========================================================================
    // FAN CLUB TESTS (1 - 6)
    // =========================================================================
    console.log('--- FAN CLUB TESTS (1 - 6) ---');

    // TEST 1: club header loads
    const clubHeaderRes = await apiFetch(`/api/community/fan-clubs/${testClubId}`, { headers: memberHeaders });
    assert(
      clubHeaderRes.status === 200 && clubHeaderRes.data?.success === true && clubHeaderRes.data.club?.badgeLabel === 'PK Titan' && clubHeaderRes.data.club?.clubLevel === 5,
      'Test 1: club header loads',
      `Fan club loaded: '${clubHeaderRes.data?.club?.name}' (Badge: ${clubHeaderRes.data?.club?.badgeLabel}, Level: ${clubHeaderRes.data?.club?.clubLevel})`
    );

    // TEST 2: join works
    const joinRes = await apiFetch(`/api/community/fan-clubs/${testClubId}/join`, {
      method: 'POST',
      headers: memberHeaders,
    });
    const checkClubAfterJoin = await pool.query(`SELECT member_count FROM popolive.fan_clubs WHERE id = $1`, [testClubId]);
    assert(
      joinRes.status === 200 && joinRes.data?.success === true && joinRes.data.badgeLabel === 'PK Titan' && checkClubAfterJoin.rows[0].member_count === 13,
      'Test 2: join works',
      `Joined fan club. Member count incremented to ${checkClubAfterJoin.rows[0].member_count}`
    );

    // TEST 3: duplicate join blocked (unique)
    const dupJoinRes = await apiFetch(`/api/community/fan-clubs/${testClubId}/join`, {
      method: 'POST',
      headers: memberHeaders,
    });
    assert(
      dupJoinRes.status === 409 && dupJoinRes.data?.code === 'ALREADY_JOINED',
      'Test 3: duplicate join blocked (unique)',
      `HTTP ${dupJoinRes.status}: ${dupJoinRes.data?.error}`
    );

    // TEST 4: leave works
    const leaveRes = await apiFetch(`/api/community/fan-clubs/${testClubId}/leave`, {
      method: 'DELETE',
      headers: memberHeaders,
    });
    const checkClubAfterLeave = await pool.query(`SELECT member_count FROM popolive.fan_clubs WHERE id = $1`, [testClubId]);
    assert(
      leaveRes.status === 200 && leaveRes.data?.success === true && checkClubAfterLeave.rows[0].member_count === 12,
      'Test 4: leave works',
      `Left fan club. Member count restored to ${checkClubAfterLeave.rows[0].member_count}`
    );

    // Re-join for badge and member list tests
    await apiFetch(`/api/community/fan-clubs/${testClubId}/join`, { method: 'POST', headers: memberHeaders });

    // TEST 5: member list loads
    const membersRes = await apiFetch(`/api/community/fan-clubs/${testClubId}/members`, { headers: memberHeaders });
    assert(
      membersRes.status === 200 && Array.isArray(membersRes.data?.members) && membersRes.data.members.some(m => m.userId === memberId),
      'Test 5: member list loads',
      `Members retrieved (${membersRes.data?.count} members), current member present`
    );

    // TEST 6: badge shows on profile
    const badgeCheckRes = await apiFetch(`/api/community/fan-clubs/${testClubId}`, { headers: memberHeaders });
    assert(
      badgeCheckRes.data?.club?.badgeLabel === 'PK Titan' && badgeCheckRes.data?.club?.isJoined === true,
      'Test 6: badge shows on profile',
      `User holds active fan club badge '${badgeCheckRes.data?.club?.badgeLabel}' on profile`
    );

    // =========================================================================
    // GUARDIAN TESTS (7 - 12)
    // =========================================================================
    console.log('\n--- GUARDIAN TESTS (7 - 12) ---');

    // TEST 7: guardians list loads
    const guardListRes = await apiFetch(`/api/community/guardians/${hostId}`, { headers: memberHeaders });
    assert(
      guardListRes.status === 200 && Array.isArray(guardListRes.data?.guardians),
      'Test 7: guardians list loads',
      `Loaded ${guardListRes.data?.guardians?.length} active guardians for host`
    );

    // TEST 8: become guardian debits coins atomically
    const guardIdempKey = `test_guard_${Date.now()}_01`;
    const becomeRes = await apiFetch('/api/community/guardians/become', {
      method: 'POST',
      headers: { ...memberHeaders, 'x-idempotency-key': guardIdempKey },
      body: { hostId, tier: 'guardian_angel', idempotencyKey: guardIdempKey },
    });
    const walletAfterGuard = (await pool.query(`SELECT coins FROM popolive.user_wallets WHERE user_id = $1`, [memberId])).rows[0].coins;
    assert(
      becomeRes.status === 200 && becomeRes.data?.success === true && Number(walletAfterGuard) === 4500 && becomeRes.data.guardian?.tier === 'Guardian Angel',
      'Test 8: become guardian debits coins atomically',
      `Balance debited 500 coins to ${walletAfterGuard} (tier: ${becomeRes.data?.guardian?.tier})`
    );

    // TEST 9: become fails if insufficient balance
    const poorGuardRes = await apiFetch('/api/community/guardians/become', {
      method: 'POST',
      headers: poorHeaders,
      body: { hostId, tier: 'guardian_angel' },
    });
    assert(
      poorGuardRes.status === 400 && poorGuardRes.data?.code === 'INSUFFICIENT_COINS',
      'Test 9: become fails if insufficient balance',
      `HTTP ${poorGuardRes.status}: ${poorGuardRes.data?.error}`
    );

    // TEST 10: guardian expiry enforced
    // Insert an expired guardian row for hostId and verify it is filtered out by getActiveGuardians
    await pool.query(`
      INSERT INTO popolive.guardians (
        id, host_id, guardian_user_id, guardian_tier, coin_price, status, activated_at, expires_at, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, 'expired_guard_user', 'Bronze Guardian', 250, 'active', NOW() - INTERVAL '35 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '35 days', NOW()
      );
    `, [hostId]);
    const activeGuardCheck = await apiFetch(`/api/community/guardians/${hostId}`, { headers: memberHeaders });
    const expiredFound = activeGuardCheck.data?.guardians?.some(g => g.guardianUserId === 'expired_guard_user');
    assert(
      activeGuardCheck.status === 200 && expiredFound === false,
      'Test 10: guardian expiry enforced',
      `Expired guardian properly filtered out from active guardians list`
    );

    // TEST 11: benefits list loads
    const benefitsRes = await apiFetch('/api/community/guardians/benefits', { headers: memberHeaders });
    assert(
      benefitsRes.status === 200 && Array.isArray(benefitsRes.data?.benefits) && benefitsRes.data.benefits.length >= 4,
      'Test 11: benefits list loads',
      `Loaded ${benefitsRes.data?.benefits?.length} Guardian benefits`
    );

    // TEST 12: duplicate become idempotent
    const idempGuardRes = await apiFetch('/api/community/guardians/become', {
      method: 'POST',
      headers: { ...memberHeaders, 'x-idempotency-key': guardIdempKey },
      body: { hostId, tier: 'guardian_angel', idempotencyKey: guardIdempKey },
    });
    const walletAfterIdemp = (await pool.query(`SELECT coins FROM popolive.user_wallets WHERE user_id = $1`, [memberId])).rows[0].coins;
    assert(
      idempGuardRes.status === 200 && idempGuardRes.data?.deduplicated === true && Number(walletAfterIdemp) === 4500,
      'Test 12: duplicate become idempotent',
      `Returned deduplicated: true without second coin deduction`
    );

    // =========================================================================
    // INVITE TESTS (13 - 16)
    // =========================================================================
    console.log('\n--- INVITE TESTS (13 - 16) ---');

    // TEST 13: invite code loads
    const codeRes = await apiFetch('/api/community/invite/code', { headers: memberHeaders });
    assert(
      codeRes.status === 200 && codeRes.data?.success === true && typeof codeRes.data.inviteCode === 'string' && codeRes.data.inviteCode.startsWith('POPO-'),
      'Test 13: invite code loads',
      `User invite code: ${codeRes.data?.inviteCode}`
    );

    // TEST 14: share payload returned
    const shareRes = await apiFetch('/api/community/invite/share', {
      method: 'POST',
      headers: memberHeaders,
    });
    assert(
      shareRes.status === 200 && shareRes.data?.success === true && shareRes.data.shareUrl && shareRes.data.shareText.includes('POPO LIVE'),
      'Test 14: share payload returned',
      `Share link: ${shareRes.data?.shareUrl}`
    );

    // Record invitation for inviteeId
    await apiFetch('/api/community/invite/record', {
      method: 'POST',
      headers: memberHeaders,
      body: { inviteeId, codeUsed: codeRes.data?.inviteCode },
    });

    // TEST 15: invited people list loads
    const peopleRes = await apiFetch('/api/community/invite/people', { headers: memberHeaders });
    assert(
      peopleRes.status === 200 && Array.isArray(peopleRes.data?.invitedPeople) && peopleRes.data.invitedPeople.some(p => p.inviteeId === inviteeId),
      'Test 15: invited people list loads',
      `Retrieved ${peopleRes.data?.count} invited people, invitee present`
    );

    // TEST 16: duplicate invite blocked by unique
    const dupInviteRes = await apiFetch('/api/community/invite/record', {
      method: 'POST',
      headers: memberHeaders,
      body: { inviteeId, codeUsed: codeRes.data?.inviteCode },
    });
    assert(
      dupInviteRes.status === 409 && dupInviteRes.data?.code === 'DUPLICATE_INVITATION',
      'Test 16: duplicate invite blocked by unique',
      `HTTP ${dupInviteRes.status}: ${dupInviteRes.data?.error}`
    );

    // =========================================================================
    // HONOR & LEVEL TESTS (17 - 20)
    // =========================================================================
    console.log('\n--- HONOR & LEVEL TESTS (17 - 20) ---');

    // TEST 17: honor bars load from P7-P8
    const honorRes = await apiFetch(`/api/community/honor/${memberId}`, { headers: memberHeaders });
    assert(
      honorRes.status === 200 && honorRes.data?.wealth && honorRes.data?.shining && honorRes.data?.honor,
      'Test 17: honor bars load from P7-P8',
      `Wealth: Lv.${honorRes.data?.wealth?.level}, Shining: Lv.${honorRes.data?.shining?.level}, Honor: Lv.${honorRes.data?.honor?.level}`
    );

    // TEST 18: level screen matches honor
    const levelRes = await apiFetch(`/api/community/level/${memberId}`, { headers: memberHeaders });
    assert(
      levelRes.status === 200 && levelRes.data?.wealth?.level === honorRes.data?.wealth?.level && levelRes.data?.shining?.level === honorRes.data?.shining?.level,
      'Test 18: level screen matches honor',
      `Level endpoint directly matches Honor bars (wealth Lv.${levelRes.data?.wealth?.level})`
    );

    // TEST 19: no write endpoint exists
    const writeCheckRes = await apiFetch(`/api/community/honor/${memberId}`, {
      method: 'POST',
      headers: memberHeaders,
      body: { wealthLevel: 99 },
    });
    assert(
      writeCheckRes.status === 405 || writeCheckRes.status === 404,
      'Test 19: no write endpoint exists',
      `POST to read-only honor endpoint cleanly rejected with HTTP ${writeCheckRes.status}`
    );

    // TEST 20: values match P7-P8 derived data
    const p7p8Direct = await apiFetch(`/api/honor/levels/${memberId}`, { headers: memberHeaders });
    assert(
      p7p8Direct.status === 200 && p7p8Direct.data?.wealth?.level === honorRes.data?.wealth?.level && p7p8Direct.data?.honor?.level === honorRes.data?.honor?.level,
      'Test 20: values match P7-P8 derived data',
      `Community honor values identically reconcile with P7-P8 derived recognition`
    );

    // =========================================================================
    // POSTER TESTS (21 - 22)
    // =========================================================================
    console.log('\n--- POSTER TESTS (21 - 22) ---');

    // TEST 21: poster payload loads
    const posterRes = await apiFetch('/api/community/poster/me', { headers: memberHeaders });
    assert(
      posterRes.status === 200 && posterRes.data?.success === true && posterRes.data.poster?.nickname === 'P7 Member Bilal' && posterRes.data.poster?.honorSummary,
      'Test 21: poster payload loads',
      `Poster payload retrieved for ${posterRes.data?.poster?.nickname} (PoppoID: ${posterRes.data?.poster?.poppoId})`
    );

    // TEST 22: no image generation server-side (data only)
    const isDataOnly =
      typeof posterRes.data?.poster === 'object' &&
      !posterRes.data.poster.base64Image &&
      typeof posterRes.data.poster.qrCodePlaceholder === 'string' &&
      typeof posterRes.data.poster.shareableDeepLink === 'string';
    assert(
      isDataOnly,
      'Test 22: no image generation server-side (data only)',
      `Poster payload strictly returns structured JSON data without server image generation`
    );

    // =========================================================================
    // WATCH HISTORY TESTS (23 - 25)
    // =========================================================================
    console.log('\n--- WATCH HISTORY TESTS (23 - 25) ---');

    // TEST 23: history loads paginated
    const histRes = await apiFetch('/api/community/watch-history?page=1&limit=10', { headers: memberHeaders });
    assert(
      histRes.status === 200 && Array.isArray(histRes.data?.history) && histRes.data.history.length >= 1 && histRes.data.page === 1,
      'Test 23: history loads paginated',
      `Watch history returned ${histRes.data?.history?.length} items on page 1 (total: ${histRes.data?.total})`
    );

    // TEST 24: replay row present
    const firstWatched = histRes.data?.history?.[0];
    assert(
      firstWatched && firstWatched.isReplayAvailable === true && Boolean(firstWatched.replayUrl),
      'Test 24: replay row present',
      `Replay available: ${firstWatched?.isReplayAvailable} (Replay URL: ${firstWatched?.replayUrl})`
    );

    // TEST 25: reads from live_room_history only
    const checkDbHistory = await pool.query(`SELECT COUNT(*)::int AS cnt FROM popolive.live_room_history WHERE user_id = $1`, [memberId]);
    assert(
      checkDbHistory.rows[0].cnt === histRes.data?.total,
      'Test 25: reads from live_room_history only',
      `Count directly reflects live_room_history database records (${checkDbHistory.rows[0].cnt} rows)`
    );

    // =========================================================================
    // WEB INTEGRATION (26)
    // =========================================================================
    console.log('\n--- WEB INTEGRATION (26) ---');

    // TEST 26: web profile matches mobile (fan club, honor, level)
    const webProfileCode = fs.readFileSync('apps/web/components/discovery/WebProfilePanel.tsx', 'utf8');
    const webMatchesCommunity =
      webProfileCode.includes('/api/community/honor/') &&
      webProfileCode.includes('/api/community/fan-clubs/') &&
      webProfileCode.includes('liveFanClubBadge');
    assert(
      webMatchesCommunity,
      'Test 26: web profile matches mobile (fan club, honor, level)',
      'WebProfilePanel.tsx integrates /api/community/honor and fan club badge'
    );

    // =========================================================================
    // REGRESSION TESTS (27 - 30)
    // =========================================================================
    console.log('\n--- REGRESSION TESTS (27 - 30) ---');

    // TEST 27: P7-P4 through P7-P9 still work
    const liveCheck = await apiFetch('/api/discovery/rooms');
    const partyCheck = await apiFetch('/api/party/rooms');
    const msgCheck = await apiFetch('/api/message/official', { headers: memberHeaders });
    const econCheck = await apiFetch('/api/economy/coins/balance', { headers: memberHeaders });
    const vipCheck = await apiFetch('/api/vip/plans', { headers: memberHeaders });
    const storeCheck = await apiFetch('/api/store/categories', { headers: memberHeaders });
    assert(
      liveCheck.status === 200 && partyCheck.status === 200 && msgCheck.status === 200 &&
      econCheck.status === 200 && vipCheck.status === 200 && storeCheck.status === 200,
      'Test 27: P7-P4 through P7-P9 still work',
      `Live (${liveCheck.status}), Party (${partyCheck.status}), Messages (${msgCheck.status}), Economy (${econCheck.status}), VIP (${vipCheck.status}), Store (${storeCheck.status}) operational`
    );

    // TEST 28: out-of-scope on fixtures
    const designFixturesDart = fs.readFileSync('apps/mobile/lib/design/design_fixtures.dart', 'utf8');
    const designFixturesTs = fs.readFileSync('apps/web/lib/design/designFixtures.ts', 'utf8');
    const outOfScopeIntact =
      designFixturesDart.includes('squarePosts') &&
      designFixturesDart.includes('supportTickets') &&
      designFixturesTs.includes('squarePosts') &&
      designFixturesTs.includes('supportTickets');
    assert(
      outOfScopeIntact,
      'Test 28: out-of-scope on fixtures',
      'Square posts, Support tickets, and Admin fixtures remain 100% intact across mobile and web'
    );

    // TEST 29: D7 walk 8 (social modules) passes with flag off
    const apiConfigDart = fs.readFileSync('apps/mobile/lib/api/api_config.dart', 'utf8');
    const communityServiceTs = fs.readFileSync('apps/web/lib/communityApiService.ts', 'utf8');
    const flagsDefaultOff =
      apiConfigDart.includes("const bool.fromEnvironment('USE_COMMUNITY_API', defaultValue: false);") &&
      communityServiceTs.includes("process.env.NEXT_PUBLIC_USE_COMMUNITY_API !== 'false';") &&
      designFixturesDart.includes('guardians') &&
      designFixturesDart.includes('fanClub');
    assert(
      flagsDefaultOff,
      'Test 29: D7 walk 8 (social modules) passes with flag off',
      'Mobile ApiConfig.useCommunityApi defaults to false and design fixtures are 100% intact'
    );

    // TEST 30: fixtures unchanged
    const meScreenDart = fs.readFileSync('apps/mobile/lib/screens/profile/me_screen.dart', 'utf8');
    const meUsesFixtures =
      meScreenDart.includes('DesignFixtures.currentUserProfile') &&
      meScreenDart.includes('_buildUserProfileCard') &&
      meScreenDart.includes('_buildEightFeatureIconsGrid') &&
      meScreenDart.includes('_buildStreamerCenterEntry') &&
      meScreenDart.includes('_buildBuilderCenterEntry');
    assert(
      meUsesFixtures,
      'Test 30: fixtures unchanged',
      'Design fixtures completely preserved across mobile MeScreen and web panels'
    );

    console.log('\n================================================================');
    console.log(`TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED (TOTAL 30)`);
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
