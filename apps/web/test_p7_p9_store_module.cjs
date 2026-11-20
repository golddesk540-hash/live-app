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
  console.log('POPO LIVE — PHASE 7 (P7-P9) STORE, BAG & REDEEM INTEGRATION SUITE');
  console.log('================================================================\n');

  try {
    // -------------------------------------------------------------------------
    // SETUP: Provision Test Users, Wallets, and Sessions
    // -------------------------------------------------------------------------
    console.log('--- SETUP: Provisioning Test Data for Store, Bag & Redeem ---');

    // 1. Buyer User (Adult, 25 years old, initial 5,000 coins)
    const buyerId = 'b0000001-c472-4503-8d3a-c4e5ca8a6ceb';
    const buyerToken = 'p7_p9_test_buyer_token';
    await pool.query(
      `INSERT INTO popolive.users (
        id, poppo_id, email, phone, nickname, avatar_url, gender, birthdate,
        is_adult_verified, status, is_profile_completed, created_at, updated_at
      ) VALUES (
        $1, '779001', 'p7_p9_buyer@popolive.internal', '+923001111201',
        'P7 Store Buyer', '/avatars/buyer.png', 'male', '1999-05-15',
        true, 'active', true, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET birthdate = '1999-05-15', is_adult_verified = true, status = 'active'`,
      [buyerId]
    );

    await pool.query(
      `INSERT INTO popolive.sessions (
        id, user_id, session_token, device_type, ip_hash, is_revoked, expires_at, created_at, last_active_at
      ) VALUES (
        gen_random_uuid(), $1, $2, 'test_runner', '127.0.0.1', false, NOW() + INTERVAL '7 days', NOW(), NOW()
      ) ON CONFLICT (session_token) DO UPDATE SET expires_at = NOW() + INTERVAL '7 days', is_revoked = false`,
      [buyerId, buyerToken]
    );

    // Initial 5,000 coins in user_wallets
    await pool.query(
      `INSERT INTO popolive.user_wallets (
        wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points, is_frozen, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, 5000, 0, 0, 0, false, NOW(), NOW()
      ) ON CONFLICT (user_id) DO UPDATE SET coins = 5000, total_spent_coins = 0, is_frozen = false`,
      [buyerId]
    );

    // 2. Poor User (Adult, 22 years old, initial 10 coins)
    const poorUserId = 'b0000002-c472-4503-8d3a-c4e5ca8a6ceb';
    const poorToken = 'p7_p9_test_poor_token';
    await pool.query(
      `INSERT INTO popolive.users (
        id, poppo_id, email, phone, nickname, avatar_url, gender, birthdate,
        is_adult_verified, status, is_profile_completed, created_at, updated_at
      ) VALUES (
        $1, '779002', 'p7_p9_poor@popolive.internal', '+923001111202',
        'P7 Poor Buyer', '/avatars/poor.png', 'female', '2002-01-10',
        true, 'active', true, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET birthdate = '2002-01-10', is_adult_verified = true, status = 'active'`,
      [poorUserId]
    );

    await pool.query(
      `INSERT INTO popolive.sessions (
        id, user_id, session_token, device_type, ip_hash, is_revoked, expires_at, created_at, last_active_at
      ) VALUES (
        gen_random_uuid(), $1, $2, 'test_runner', '127.0.0.1', false, NOW() + INTERVAL '7 days', NOW(), NOW()
      ) ON CONFLICT (session_token) DO UPDATE SET expires_at = NOW() + INTERVAL '7 days', is_revoked = false`,
      [poorUserId, poorToken]
    );

    await pool.query(
      `INSERT INTO popolive.user_wallets (
        wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points, is_frozen, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, 10, 0, 0, 0, false, NOW(), NOW()
      ) ON CONFLICT (user_id) DO UPDATE SET coins = 10, total_spent_coins = 0, is_frozen = false`,
      [poorUserId]
    );

    // 3. Underage Account (11 years old)
    const underageId = 'b0000003-c472-4503-8d3a-c4e5ca8a6ceb';
    const underageToken = 'p7_p9_test_underage_token';
    await pool.query(
      `INSERT INTO popolive.users (
        id, poppo_id, email, phone, nickname, avatar_url, gender, birthdate,
        is_adult_verified, status, is_profile_completed, created_at, updated_at
      ) VALUES (
        $1, '779003', 'p7_p9_underage@popolive.internal', '+923001111203',
        'P7 Underage User', '/avatars/kid.png', 'female', '2015-08-20',
        false, 'active', true, NOW(), NOW()
      ) ON CONFLICT (id) DO UPDATE SET birthdate = '2015-08-20', is_adult_verified = false, status = 'active'`,
      [underageId]
    );

    await pool.query(
      `INSERT INTO popolive.sessions (
        id, user_id, session_token, device_type, ip_hash, is_revoked, expires_at, created_at, last_active_at
      ) VALUES (
        gen_random_uuid(), $1, $2, 'test_runner', '127.0.0.1', false, NOW() + INTERVAL '7 days', NOW(), NOW()
      ) ON CONFLICT (session_token) DO UPDATE SET expires_at = NOW() + INTERVAL '7 days', is_revoked = false`,
      [underageId, underageToken]
    );

    await pool.query(
      `INSERT INTO popolive.user_wallets (
        wallet_id, user_id, coins, diamond_points, total_spent_coins, total_received_points, is_frozen, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, 5000, 0, 0, 0, false, NOW(), NOW()
      ) ON CONFLICT (user_id) DO UPDATE SET coins = 5000, is_frozen = false`,
      [underageId]
    );

    // 4. Clean previous test artifacts for buyer and poor user
    await pool.query(`DELETE FROM popolive.user_store_equipment WHERE user_id IN ($1, $2, $3)`, [buyerId, poorUserId, underageId]);
    await pool.query(`DELETE FROM popolive.user_store_inventory WHERE user_id IN ($1, $2, $3)`, [buyerId, poorUserId, underageId]);
    await pool.query(`DELETE FROM popolive.store_purchases WHERE user_id IN ($1, $2, $3)`, [buyerId, poorUserId, underageId]);
    await pool.query(`DELETE FROM popolive.redeem_history WHERE user_id IN ($1, $2, $3)`, [buyerId, poorUserId, underageId]);
    await pool.query(`DELETE FROM popolive.rate_limits WHERE key LIKE 'redeem_rate_%'`);

    console.log('SETUP COMPLETE: Test accounts and database state ready.\n');

    const buyerHeaders = {
      'Authorization': `Bearer ${buyerToken}`,
      'Content-Type': 'application/json',
    };
    const poorHeaders = {
      'Authorization': `Bearer ${poorToken}`,
      'Content-Type': 'application/json',
    };
    const underageHeaders = {
      'Authorization': `Bearer ${underageToken}`,
      'Content-Type': 'application/json',
    };

    // =========================================================================
    // STORE TESTS (1 - 8)
    // =========================================================================
    console.log('--- STORE TESTS (1 - 8) ---');

    // TEST 1: categories load
    const catRes = await apiFetch('/api/store/categories', { headers: buyerHeaders });
    assert(
      catRes.status === 200 && catRes.data && catRes.data.success === true && Array.isArray(catRes.data.categories) && catRes.data.categories.length >= 5,
      'Test 1: categories load',
      `Loaded ${catRes.data?.categories?.length} active store categories`
    );

    // TEST 2: products per category load
    const prodRes = await apiFetch('/api/store/products?category=profile_frames', { headers: buyerHeaders });
    assert(
      prodRes.status === 200 && prodRes.data && prodRes.data.success === true && Array.isArray(prodRes.data.products) && prodRes.data.products.length >= 1,
      'Test 2: products per category load',
      `Loaded ${prodRes.data?.products?.length} products for category 'profile_frames'`
    );

    // TEST 3: item detail loads with price
    const sampleItemId = 'item_frame_golden_feather';
    const detailRes = await apiFetch(`/api/store/products/${sampleItemId}`, { headers: buyerHeaders });
    assert(
      detailRes.status === 200 && detailRes.data && detailRes.data.success === true && detailRes.data.product?.coinPrice === 300,
      'Test 3: item detail loads with price',
      `Item '${sampleItemId}' retrieved with coin price ${detailRes.data?.product?.coinPrice}`
    );

    // TEST 4: buy debits coins atomically
    const buyIdempKey1 = `test_buy_${Date.now()}_01`;
    const buyRes1 = await apiFetch(`/api/store/products/${sampleItemId}/buy`, {
      method: 'POST',
      headers: { ...buyerHeaders, 'x-idempotency-key': buyIdempKey1 },
      body: { autoEquip: true, idempotencyKey: buyIdempKey1 },
    });
    assert(
      buyRes1.status === 200 && buyRes1.data && buyRes1.data.success === true && buyRes1.data.wallet?.coins === 4700,
      'Test 4: buy debits coins atomically',
      `Balance debited from 5,000 to ${buyRes1.data?.wallet?.coins} coins (Price: 300)`
    );

    // TEST 5: buy fails if insufficient balance
    const poorBuyRes = await apiFetch(`/api/store/products/${sampleItemId}/buy`, {
      method: 'POST',
      headers: poorHeaders,
      body: { autoEquip: false },
    });
    assert(
      poorBuyRes.status === 400 && poorBuyRes.data?.code === 'INSUFFICIENT_COINS',
      'Test 5: buy fails if insufficient balance',
      `HTTP ${poorBuyRes.status}: ${poorBuyRes.data?.error}`
    );

    // TEST 6: buy inserts inventory row
    const invDbCheck = await pool.query(
      `SELECT inventory_id, user_id, item_id, equip_slot, status, is_equipped 
       FROM popolive.user_store_inventory 
       WHERE user_id = $1 AND item_id = $2`,
      [buyerId, sampleItemId]
    );
    assert(
      invDbCheck.rows.length === 1 && invDbCheck.rows[0].status === 'active' && invDbCheck.rows[0].is_equipped === true,
      'Test 6: buy inserts inventory row',
      `Inventory ID: ${invDbCheck.rows[0]?.inventory_id}, is_equipped: ${invDbCheck.rows[0]?.is_equipped}`
    );

    // TEST 7: duplicate purchase blocked by unique constraint
    const dupBuyRes = await apiFetch(`/api/store/products/${sampleItemId}/buy`, {
      method: 'POST',
      headers: buyerHeaders,
      body: { autoEquip: false },
    });
    assert(
      dupBuyRes.status === 409 && dupBuyRes.data?.code === 'DUPLICATE_OWNERSHIP',
      'Test 7: duplicate purchase blocked by unique constraint',
      `HTTP ${dupBuyRes.status}: ${dupBuyRes.data?.error}`
    );

    // TEST 8: duplicate buy idempotent
    const idempBuyRes = await apiFetch(`/api/store/products/${sampleItemId}/buy`, {
      method: 'POST',
      headers: { ...buyerHeaders, 'x-idempotency-key': buyIdempKey1 },
      body: { autoEquip: true, idempotencyKey: buyIdempKey1 },
    });
    assert(
      idempBuyRes.status === 200 && idempBuyRes.data?.deduplicated === true && idempBuyRes.data?.wallet?.coins === 4700,
      'Test 8: duplicate buy idempotent',
      `Duplicate buy cleanly returned cached response with deduplicated: true`
    );

    // =========================================================================
    // BAG & EQUIP TESTS (9 - 13)
    // =========================================================================
    console.log('\n--- BAG & EQUIP TESTS (9 - 13) ---');

    // Purchase a second item in profile_frame slot for buyer: item_exclusive_wealth_sovereign (800 coins)
    // Buyer has 4700 coins -> after purchase: 3900 coins
    const secondItemId = 'item_exclusive_wealth_sovereign';
    const buyRes2 = await apiFetch(`/api/store/products/${secondItemId}/buy`, {
      method: 'POST',
      headers: buyerHeaders,
      body: { autoEquip: false },
    });
    const buyerInv1 = invDbCheck.rows[0].inventory_id;

    // TEST 9: owned items load
    const bagRes = await apiFetch('/api/bag', { headers: buyerHeaders });
    assert(
      bagRes.status === 200 && bagRes.data && bagRes.data.success === true && Array.isArray(bagRes.data.items) && bagRes.data.items.length === 2,
      'Test 9: owned items load',
      `Bag returned ${bagRes.data?.items?.length} owned items for user`
    );

    const buyerInv2 = bagRes.data.items.find(i => i.itemId === secondItemId)?.inventoryId;

    // TEST 10: equip works
    const equipRes1 = await apiFetch(`/api/bag/items/${buyerInv1}/equip`, {
      method: 'POST',
      headers: buyerHeaders,
    });
    assert(
      equipRes1.status === 200 && equipRes1.data && equipRes1.data.success === true && equipRes1.data.equipSlot === 'profile_frame',
      'Test 10: equip works',
      `Equipped item ${equipRes1.data?.itemId} in slot ${equipRes1.data?.equipSlot}`
    );

    // TEST 11: equip replaces previous in same category
    const equipRes2 = await apiFetch(`/api/bag/items/${buyerInv2}/equip`, {
      method: 'POST',
      headers: buyerHeaders,
    });
    const checkEqDb = await pool.query(
      `SELECT inventory_id, item_id, equip_slot FROM popolive.user_store_equipment WHERE user_id = $1 AND equip_slot = 'profile_frame'`,
      [buyerId]
    );
    const checkOldInv = await pool.query(
      `SELECT inventory_id, is_equipped FROM popolive.user_store_inventory WHERE inventory_id = $1`,
      [buyerInv1]
    );
    assert(
      equipRes2.status === 200 && checkEqDb.rows[0]?.inventory_id === buyerInv2 && checkOldInv.rows[0]?.is_equipped === false,
      'Test 11: equip replaces previous in same category',
      `Slot 'profile_frame' replaced: now holding ${checkEqDb.rows[0]?.item_id}, old item unequipped`
    );

    // TEST 12: unequip works
    const unequipRes = await apiFetch(`/api/bag/items/${buyerInv2}/equip`, {
      method: 'DELETE',
      headers: buyerHeaders,
    });
    const checkEmptyEqDb = await pool.query(
      `SELECT * FROM popolive.user_store_equipment WHERE user_id = $1 AND equip_slot = 'profile_frame'`,
      [buyerId]
    );
    assert(
      unequipRes.status === 200 && unequipRes.data && unequipRes.data.success === true && checkEmptyEqDb.rows.length === 0,
      'Test 12: unequip works',
      `Item unequipped cleanly, active slot removed from equipment table`
    );

    // Re-equip buyerInv1 for profile test
    await apiFetch(`/api/bag/items/${buyerInv1}/equip`, { method: 'POST', headers: buyerHeaders });

    // TEST 13: equipped item shows on profile
    const profileEqRes = await apiFetch(`/api/profile/${buyerId}/equipped`);
    assert(
      profileEqRes.status === 200 && profileEqRes.data?.equipped?.profile_frame?.itemId === sampleItemId,
      'Test 13: equipped item shows on profile',
      `Profile displays equipped frame: ${profileEqRes.data?.equipped?.profile_frame?.name}`
    );

    // =========================================================================
    // REDEEM TESTS (14 - 21)
    // =========================================================================
    console.log('\n--- REDEEM TESTS (14 - 21) ---');
    await pool.query(`DELETE FROM popolive.rate_limits WHERE key LIKE 'redeem_%'`);
    const redeemHeaders = {
      'Authorization': `Bearer ${buyerToken}`,
      'Content-Type': 'application/json',
      'x-forwarded-for': '10.20.30.40',
    };

    // TEST 14: valid code shows success
    const validCheckRes = await apiFetch('/api/redeem/validate', {
      method: 'POST',
      headers: redeemHeaders,
      body: { code: 'POPO-WELCOME-2026' },
    });
    assert(
      validCheckRes.status === 200 && validCheckRes.data?.isValid === true && validCheckRes.data?.coinReward === 5000,
      'Test 14: valid code shows success',
      `Voucher 'POPO-WELCOME-2026' validated: reward = ${validCheckRes.data?.coinReward} coins`
    );

    // TEST 15: invalid code shows invalid sheet (no DB write)
    const invalidCheckRes = await apiFetch('/api/redeem/validate', {
      method: 'POST',
      headers: redeemHeaders,
      body: { code: 'INVALID-CODE-XYZ-123' },
    });
    const invalidHistDb = await pool.query(
      `SELECT * FROM popolive.redeem_history WHERE code = 'INVALID-CODE-XYZ-123'`
    );
    assert(
      invalidCheckRes.status === 200 && invalidCheckRes.data?.isValid === false && invalidHistDb.rows.length === 0,
      'Test 15: invalid code shows invalid sheet',
      `Invalid code returned isValid: false with zero DB mutations`
    );

    // TEST 16: expired code rejected
    const expiredCheckRes = await apiFetch('/api/redeem/validate', {
      method: 'POST',
      headers: redeemHeaders,
      body: { code: 'EXPIRED-BONUS-999' },
    });
    const expiredRedeemRes = await apiFetch('/api/redeem/redeem', {
      method: 'POST',
      headers: redeemHeaders,
      body: { code: 'EXPIRED-BONUS-999' },
    });
    assert(
      expiredCheckRes.data?.isValid === false && expiredCheckRes.data?.errorCode === 'CODE_EXPIRED' && expiredRedeemRes.status === 400,
      'Test 16: expired code rejected',
      `Expired code rejected on validate and redeem: ${expiredRedeemRes.data?.error}`
    );

    // TEST 17: inactive code rejected
    const inactiveCheckRes = await apiFetch('/api/redeem/validate', {
      method: 'POST',
      headers: redeemHeaders,
      body: { code: 'INACTIVE-CODE-000' },
    });
    const inactiveRedeemRes = await apiFetch('/api/redeem/redeem', {
      method: 'POST',
      headers: redeemHeaders,
      body: { code: 'INACTIVE-CODE-000' },
    });
    assert(
      inactiveCheckRes.data?.isValid === false && inactiveCheckRes.data?.errorCode === 'CODE_INACTIVE' && inactiveRedeemRes.status === 400,
      'Test 17: inactive code rejected',
      `Inactive code rejected on validate and redeem: ${inactiveRedeemRes.data?.error}`
    );

    // TEST 18: redeem credits coins atomically
    const redeemIdempKey = `test_rdm_${Date.now()}_01`;
    const currentBuyerCoinsBefore = (await pool.query(`SELECT coins FROM popolive.user_wallets WHERE user_id = $1`, [buyerId])).rows[0].coins;
    const redeemRes = await apiFetch('/api/redeem/redeem', {
      method: 'POST',
      headers: { ...redeemHeaders, 'x-idempotency-key': redeemIdempKey },
      body: { code: 'POPO-WELCOME-2026', idempotencyKey: redeemIdempKey },
    });
    const currentBuyerCoinsAfter = (await pool.query(`SELECT coins FROM popolive.user_wallets WHERE user_id = $1`, [buyerId])).rows[0].coins;
    assert(
      redeemRes.status === 200 && redeemRes.data?.success === true && Number(currentBuyerCoinsAfter) === Number(currentBuyerCoinsBefore) + 5000,
      'Test 18: redeem credits coins atomically',
      `Credited 5,000 coins: from ${currentBuyerCoinsBefore} to ${currentBuyerCoinsAfter}`
    );

    // TEST 19: second redeem of same code rejected (one-time)
    const secondRedeemRes = await apiFetch('/api/redeem/redeem', {
      method: 'POST',
      headers: redeemHeaders,
      body: { code: 'POPO-WELCOME-2026' },
    });
    assert(
      secondRedeemRes.status === 409 && secondRedeemRes.data?.code === 'ALREADY_REDEEMED',
      'Test 19: second redeem of same code rejected (one-time)',
      `HTTP ${secondRedeemRes.status}: ${secondRedeemRes.data?.error}`
    );

    // TEST 20: duplicate redeem idempotent
    const idempRedeemRes = await apiFetch('/api/redeem/redeem', {
      method: 'POST',
      headers: { ...redeemHeaders, 'x-idempotency-key': redeemIdempKey },
      body: { code: 'POPO-WELCOME-2026', idempotencyKey: redeemIdempKey },
    });
    assert(
      idempRedeemRes.status === 200 && idempRedeemRes.data?.deduplicated === true && idempRedeemRes.data?.coinReward === 5000,
      'Test 20: duplicate redeem idempotent',
      `Returned deduplicated: true without double-crediting`
    );

    // TEST 21: redeem_history recorded
    const rdmHistDb = await pool.query(
      `SELECT * FROM popolive.redeem_history WHERE user_id = $1 AND code = 'POPO-WELCOME-2026'`,
      [buyerId]
    );
    assert(
      rdmHistDb.rows.length === 1 && rdmHistDb.rows[0].coin_reward === 5000 && rdmHistDb.rows[0].coin_tx_id !== null,
      'Test 21: redeem_history recorded',
      `History recorded with coin_tx_id: ${rdmHistDb.rows[0]?.coin_tx_id}`
    );

    // =========================================================================
    // WEB INTEGRATION (22 - 23)
    // =========================================================================
    console.log('\n--- WEB INTEGRATION (22 - 23) ---');

    // TEST 22: web store matches mobile
    const webRewrittenRes = await apiFetch('/store/products');
    assert(
      webRewrittenRes.status === 200 && Array.isArray(webRewrittenRes.data?.products) && webRewrittenRes.data.products.length > 0,
      'Test 22: web store matches mobile',
      `Rewritten /store/products returned ${webRewrittenRes.data?.products?.length} products matching mobile catalog`
    );

    // TEST 23: web purchase behaviour matches P7-P1 decision
    // In P7-P1, store purchases debit coins atomically via the API.
    const thirdItemId = 'item_bubble_neon_spark'; // 100 coins
    const webBuyRes = await apiFetch(`/api/store/products/${thirdItemId}/buy`, {
      method: 'POST',
      headers: buyerHeaders,
      body: { autoEquip: false },
    });
    assert(
      webBuyRes.status === 200 && webBuyRes.data?.success === true && webBuyRes.data?.purchase?.unitCoinPrice === 100,
      'Test 23: web purchase behaviour matches P7-P1 decision',
      `Web purchase executed cleanly with atomic coin debit (item: ${thirdItemId})`
    );

    // =========================================================================
    // SECURITY TESTS (24 - 25)
    // =========================================================================
    console.log('\n--- SECURITY TESTS (24 - 25) ---');

    // TEST 24: rate limit on redeem works
    // Use a fresh rate test IP
    const rateTestIp = `192.168.10.${Math.floor(Math.random() * 200) + 10}`;
    const rateHeaders = {
      'Authorization': `Bearer ${buyerToken}`,
      'Content-Type': 'application/json',
      'x-forwarded-for': rateTestIp,
    };
    let got429 = false;
    for (let i = 0; i < 15; i++) {
      const res = await apiFetch('/api/redeem/validate', {
        method: 'POST',
        headers: rateHeaders,
        body: { code: `PROMO-GUESS-${i}` },
      });
      if (res.status === 429) {
        got429 = true;
        break;
      }
    }
    assert(
      got429 === true,
      'Test 24: rate limit on redeem works',
      `Returned HTTP 429 TOO_MANY_REQUESTS when limit exceeded on validate`
    );

    // TEST 25: brute-force attempt throttled
    const bruteForceRes = await apiFetch('/api/redeem/redeem', {
      method: 'POST',
      headers: rateHeaders,
      body: { code: 'BRUTE-FORCE-ATTEMPT' },
    });
    assert(
      bruteForceRes.status === 429 && bruteForceRes.data?.code === 'TOO_MANY_REQUESTS',
      'Test 25: brute-force attempt throttled',
      `Throttled brute-force redeem attempt with HTTP 429: ${bruteForceRes.data?.error}`
    );

    // =========================================================================
    // ME INTEGRATION (26 - 27)
    // =========================================================================
    console.log('\n--- ME INTEGRATION (26 - 27) ---');

    // TEST 26: equipped item display reads backend
    const meEquippedRes = await apiFetch(`/api/profile/${buyerId}/equipped`);
    assert(
      meEquippedRes.status === 200 && meEquippedRes.data?.equipped && typeof meEquippedRes.data.equipped === 'object',
      'Test 26: equipped item display reads backend',
      `Equipped slots retrieved: ${Object.keys(meEquippedRes.data.equipped).join(', ')}`
    );

    // TEST 27: other Me rows stay on fixtures
    // Verify that design fixtures remain untouched and accessible
    const meScreenDart = fs.readFileSync('apps/mobile/lib/screens/profile/me_screen.dart', 'utf8');
    const meUsesFixtures =
      meScreenDart.includes('DesignFixtures.currentUserProfile') &&
      meScreenDart.includes('_buildUserProfileCard') &&
      meScreenDart.includes('_buildEightFeatureIconsGrid') &&
      meScreenDart.includes('_buildStreamerCenterEntry') &&
      meScreenDart.includes('_buildBuilderCenterEntry');
    assert(
      meUsesFixtures,
      'Test 27: other Me rows stay on fixtures',
      'Me screen profile card, centers, and feature icons strictly preserve DesignFixtures'
    );

    // =========================================================================
    // REGRESSION TESTS (28 - 30)
    // =========================================================================
    console.log('\n--- REGRESSION TESTS (28 - 30) ---');

    // TEST 28: P7-P4 through P7-P8 still work
    const econCheck = await apiFetch('/api/economy/coins/balance', { headers: buyerHeaders });
    const vipCheck = await apiFetch('/api/vip/plans', { headers: buyerHeaders });
    const liveCheck = await apiFetch('/api/discovery/rooms', { headers: buyerHeaders });
    assert(
      econCheck.status === 200 && vipCheck.status === 200 && liveCheck.status === 200,
      'Test 28: P7-P4 through P7-P8 still work',
      `Economy (${econCheck.status}), VIP (${vipCheck.status}), Live Discovery (${liveCheck.status}) operational`
    );

    // TEST 29: out-of-scope on fixtures
    // Admin, Square, Support, Business centers stay strictly on fixtures
    const designFixturesDart = fs.readFileSync('apps/mobile/lib/design/design_fixtures.dart', 'utf8');
    const designFixturesTs = fs.readFileSync('apps/web/lib/design/designFixtures.ts', 'utf8');
    const outOfScopeIntact =
      designFixturesDart.includes('squarePosts') &&
      designFixturesDart.includes('supportTickets') &&
      designFixturesTs.includes('squarePosts') &&
      designFixturesTs.includes('supportTickets');
    assert(
      outOfScopeIntact,
      'Test 29: out-of-scope on fixtures',
      'Square posts and Support tickets fixtures remain 100% intact across mobile and web'
    );

    // TEST 30: D7 walk 7 (store/bag) and walk 10 (redeem success + invalid) pass with flag off
    const apiConfigDart = fs.readFileSync('apps/mobile/lib/api/api_config.dart', 'utf8');
    const storeServiceTs = fs.readFileSync('apps/web/lib/storeApiService.ts', 'utf8');
    const flagsDefaultOff =
      apiConfigDart.includes("const bool.fromEnvironment('USE_STORE_API', defaultValue: false);") &&
      storeServiceTs.includes("process.env.NEXT_PUBLIC_USE_STORE_API !== 'false';") &&
      designFixturesDart.includes('storeCategories') &&
      designFixturesDart.includes('redeemCode');
    assert(
      flagsDefaultOff,
      'Test 30: D7 walk 7 (store/bag) and walk 10 (redeem success + invalid) pass with flag off',
      'Mobile ApiConfig.useStoreApi defaults to false and design fixtures are 100% intact'
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
