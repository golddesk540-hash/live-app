/**
 * ============================================================================
 * POPO LIVE — PHASE B5 PROMPT 1 OF 4: REAL WALLET BALANCE & COIN PACKAGES
 * Master Plan Reference: POPO-LIVE-BACKEND-REALTIME-PLAN.pdf (Phase B5, page 4)
 *
 * Automated verification of all 15 wallet balance & coin package requirements:
 * 1. Authenticated wallet balance retrieval (real PostgreSQL user_wallets).
 * 2. Unauthenticated wallet request rejected (HTTP 401 UNAUTHORIZED).
 * 3. Expired session rejected (HTTP 401 UNAUTHORIZED).
 * 4. Correct wallet ownership: User A cannot read User B's private wallet (HTTP 403).
 * 5. Missing wallet record initialized safely (0 coins, 0 points per finance_rules).
 * 6. Coin package retrieval: all 6 seeded packages returned from coin_packages.
 * 7. Package ordering: strictly display_order ASC (1 through 6).
 * 8. Package price and quantity integrity (pkg_100: 100 coins $0.99; pkg_1000: 1000+100 bonus = 1100 coins $9.99).
 * 9. Mobile wallet loading: client service maps balance & packages accurately.
 * 10. Web wallet loading: /api/wallet/balance and package routes compliant with web components.
 * 11. Cross-client balance consistency: /api/wallet/balance, /api/economy/coins/balance, /api/economy/points/balance.
 * 12. Database connection failure: produces visible HTTP 500 error, never fake zero balances.
 * 13. Empty package response handling: returns empty list [] without fixture fallback.
 * 14. No fixture fallback when enabled: ApiConfig.useEconomyApi = true does not swallow errors.
 * 15. Fixture mode preserved when disabled: ApiConfig.useEconomyApi = false preserves design fixtures.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=');
        if (idx !== -1) {
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnvFile(path.resolve(__dirname, 'apps/web/.env.local'));
loadEnvFile(path.resolve(__dirname, 'apps/web/.env.development'));
process.env.NEXT_PUBLIC_USE_ECONOMY_API = 'true';
process.env.USE_ECONOMY_API = 'true';

const { NextRequest } = require(path.resolve(__dirname, 'apps/web/node_modules/next/server'));
const { Pool } = require(path.resolve(__dirname, 'apps/web/node_modules/pg'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  options: '-c search_path=popolive,public',
});

let testsPassed = 0;
let testsFailed = 0;
const cleanupUserIds = [];
const cleanupSessionTokens = [];

function check(condition, desc) {
  if (condition) {
    console.log(`  [PASS] ${desc}`);
    testsPassed++;
  } else {
    console.error(`  [FAIL] ${desc}`);
    testsFailed++;
  }
}

function makeReq(url, method = 'GET', body = null, sessionToken = null, extraHeaders = {}) {
  const headers = new Headers();
  if (body) headers.set('content-type', 'application/json');
  if (sessionToken) {
    headers.set('cookie', `poppo_session=${sessionToken}`);
    headers.set('authorization', `Bearer ${sessionToken}`);
  }
  for (const [k, v] of Object.entries(extraHeaders)) {
    headers.set(k, v);
  }
  const init = {
    method,
    headers,
  };
  if (body) init.body = JSON.stringify(body);
  return new NextRequest(url, init);
}

async function createTestUser(role = 'user', nickname = 'Wallet User', initialCoins = 0, initialPoints = 0) {
  const poppoId = String(Math.floor(1000000 + Math.random() * 9000000));
  const phone = `+923${Math.floor(100000000 + Math.random() * 900000000)}`;
  const email = `wallet_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@test.com`;

  const { hashPassword } = await import('./apps/web/lib/auth.ts');
  const passwordHash = await hashPassword('WalletPass123!');

  const userRes = await pool.query(
    `INSERT INTO popolive.users (
      poppo_id, phone, email, password_hash, nickname, avatar_url,
      gender, birthdate, is_adult_verified, country, country_code,
      status, role, is_profile_completed, wealth_level, host_level
    ) VALUES (
      $1, $2, $3, $4, $5, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      'female', '1998-05-15', true, 'Pakistan', 'PK',
      'active', $6, true, 2, 2
    ) RETURNING id, poppo_id, nickname`,
    [poppoId, phone, email, passwordHash, nickname, role]
  );

  const user = userRes.rows[0];
  cleanupUserIds.push(user.id);

  // If initial coins or points requested, insert or update user_wallets
  if (initialCoins > 0 || initialPoints > 0) {
    await pool.query(
      `INSERT INTO popolive.user_wallets (
        user_id, coins, diamond_points, total_spent_coins, total_received_points, is_frozen
      ) VALUES ($1, $2, $3, 0, $3, false)
      ON CONFLICT (user_id) DO UPDATE SET coins = $2, diamond_points = $3`,
      [user.id, initialCoins, initialPoints]
    );
  }

  // Create session token
  const token = `tok_b5_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO popolive.sessions (
      session_token, user_id, expires_at, created_at, is_revoked
    ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, false)`,
    [token, user.id, expiresAt]
  );
  cleanupSessionTokens.push(token);

  return { user, token };
}

async function runAllTests() {
  console.log('================================================================');
  console.log('POPO LIVE — B5 PROMPT 1/4 VERIFICATION: WALLET & COIN PACKAGES');
  console.log('================================================================\n');

  try {
    // Import API route handlers and services
    const walletBalanceRoute = await import('./apps/web/app/api/wallet/balance/route.ts');
    const coinsBalanceRoute = await import('./apps/web/app/api/economy/coins/balance/route.ts');
    const pointsBalanceRoute = await import('./apps/web/app/api/economy/points/balance/route.ts');
    const economyPackagesRoute = await import('./apps/web/app/api/economy/coins/packages/route.ts');
    const walletPackagesRoute = await import('./apps/web/app/api/wallet/packages/route.ts');
    const topupPackagesRoute = await import('./apps/web/app/api/topup/packages/route.ts');
    const economyService = await import('./apps/web/lib/economyApiService.ts');

    // ------------------------------------------------------------------------
    // Scenario 1: Authenticated wallet balance retrieval
    // ------------------------------------------------------------------------
    console.log('[Scenario 1: Authenticated wallet balance retrieval]');
    const userA = await createTestUser('user', 'Alice Wallet', 5250, 1800);

    const req1 = makeReq('http://localhost:3000/api/wallet/balance?fresh=true', 'GET', null, userA.token);
    const res1 = await walletBalanceRoute.GET(req1);
    const json1 = await res1.json();

    check(res1.status === 200, 'GET /api/wallet/balance returns HTTP 200');
    check(json1.success === true, 'Response success is true');
    check(json1.coins === 5250, `Coins balance matches PostgreSQL user_wallets (expected 5250, got ${json1.coins})`);
    check(json1.points === 1800, `Points balance matches PostgreSQL user_wallets (expected 1800, got ${json1.points})`);
    check(json1.diamondPoints === 1800, 'diamondPoints matches points');
    check(json1.userId === userA.user.id, `userId matches authenticated session user (${userA.user.id})`);
    check(json1.wallet && json1.wallet.coins === 5250, 'Nested wallet object contains expected coins balance');
    check(json1.wallet && json1.wallet.points === 1800, 'Nested wallet object contains expected points balance');

    // ------------------------------------------------------------------------
    // Scenario 2: Unauthenticated wallet request (HTTP 401)
    // ------------------------------------------------------------------------
    console.log('\n[Scenario 2: Unauthenticated wallet request (HTTP 401)]');
    const req2 = makeReq('http://localhost:3000/api/wallet/balance', 'GET', null, null);
    const res2 = await walletBalanceRoute.GET(req2);
    const json2 = await res2.json();

    check(res2.status === 401, `Unauthenticated request returned HTTP 401 (got ${res2.status})`);
    check(json2.success === false, 'success is false');
    check(json2.code === 'UNAUTHORIZED', 'Error code is UNAUTHORIZED');

    // ------------------------------------------------------------------------
    // Scenario 3: Expired session (HTTP 401)
    // ------------------------------------------------------------------------
    console.log('\n[Scenario 3: Expired session (HTTP 401)]');
    const expiredToken = `tok_expired_${Date.now()}`;
    await pool.query(
      `INSERT INTO popolive.sessions (
        session_token, user_id, expires_at, created_at, is_revoked
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, false)`,
      [expiredToken, userA.user.id, new Date(Date.now() - 3600 * 1000)] // 1 hour in the past
    );
    cleanupSessionTokens.push(expiredToken);

    const req3 = makeReq('http://localhost:3000/api/wallet/balance', 'GET', null, expiredToken);
    const res3 = await walletBalanceRoute.GET(req3);
    const json3 = await res3.json();

    check(res3.status === 401, `Expired session request returned HTTP 401 (got ${res3.status})`);
    check(json3.success === false, 'success is false');

    // ------------------------------------------------------------------------
    // Scenario 4: Correct wallet ownership (User A cannot view User B's wallet)
    // ------------------------------------------------------------------------
    console.log('\n[Scenario 4: Correct wallet ownership (User A cannot view User B)]');
    const userB = await createTestUser('user', 'Bob Wallet', 99000, 45000);

    // User A attempts to view User B's wallet by supplying ?userId=userB.id
    const req4 = makeReq(
      `http://localhost:3000/api/wallet/balance?userId=${userB.user.id}`,
      'GET',
      null,
      userA.token
    );
    const res4 = await walletBalanceRoute.GET(req4);
    const json4 = await res4.json();

    check(res4.status === 403, `Access to another user's wallet returned HTTP 403 Forbidden (got ${res4.status})`);
    check(json4.code === 'PRIVATE_WALLET_ACCESS_DENIED', 'Error code is PRIVATE_WALLET_ACCESS_DENIED');
    check(json4.success === false, 'success is false');

    // Verify User B can access their own wallet
    const req4b = makeReq('http://localhost:3000/api/wallet/balance?fresh=true', 'GET', null, userB.token);
    const res4b = await walletBalanceRoute.GET(req4b);
    const json4b = await res4b.json();
    check(res4b.status === 200, 'User B can access own wallet (HTTP 200)');
    check(json4b.coins === 99000, `User B sees own coins (expected 99000, got ${json4b.coins})`);
    check(json4b.points === 45000, `User B sees own points (expected 45000, got ${json4b.points})`);

    // ------------------------------------------------------------------------
    // Scenario 5: Missing wallet record initialization (safe defaults)
    // ------------------------------------------------------------------------
    console.log('\n[Scenario 5: Missing wallet record initialization]');
    // Create User C with NO user_wallets record
    const userC = await createTestUser('user', 'Charlie Newcomer', 0, 0);
    // Explicitly delete any wallet record if one was created
    await pool.query('DELETE FROM popolive.user_wallets WHERE user_id = $1', [userC.user.id]);

    const req5 = makeReq('http://localhost:3000/api/wallet/balance?fresh=true', 'GET', null, userC.token);
    const res5 = await walletBalanceRoute.GET(req5);
    const json5 = await res5.json();

    check(res5.status === 200, `Missing wallet initialized safely with HTTP 200 (got ${res5.status})`);
    check(json5.success === true, 'Response success is true');
    check(json5.coins === 0, `Initial coins initialized to 0 per finance rules (got ${json5.coins})`);
    check(json5.points === 0, `Initial points initialized to 0 per finance rules (got ${json5.points})`);
    check(Boolean(json5.walletId), `Valid walletId generated (${json5.walletId})`);

    // Verify record exists in PostgreSQL now
    const dbWallet = await pool.query('SELECT * FROM popolive.user_wallets WHERE user_id = $1', [userC.user.id]);
    check(dbWallet.rows.length === 1, 'Wallet record persisted in PostgreSQL popolive.user_wallets');
    check(Number(dbWallet.rows[0].coins) === 0, 'DB coins column is 0');
    check(Number(dbWallet.rows[0].diamond_points) === 0, 'DB diamond_points column is 0');

    // ------------------------------------------------------------------------
    // Scenario 6: Coin package retrieval (all 6 seeded packages returned)
    // ------------------------------------------------------------------------
    console.log('\n[Scenario 6: Coin package retrieval (all 6 seeded packages)]');
    const req6 = makeReq('http://localhost:3000/api/economy/coins/packages', 'GET');
    const res6 = await economyPackagesRoute.GET(req6);
    const json6 = await res6.json();

    check(res6.status === 200, 'GET /api/economy/coins/packages returns HTTP 200');
    check(json6.success === true, 'Response success is true');
    check(Array.isArray(json6.packages), 'packages is an array');
    check(json6.packages.length === 6, `All 6 seeded packages returned (expected 6, got ${json6.packages.length})`);
    check(json6.isReadOnly === true, 'isReadOnly flag indicates display-only catalog');

    // Also verify /api/wallet/packages route
    const req6b = makeReq('http://localhost:3000/api/wallet/packages', 'GET');
    const res6b = await walletPackagesRoute.GET(req6b);
    const json6b = await res6b.json();
    check(res6b.status === 200, 'GET /api/wallet/packages returns HTTP 200');
    check(json6b.packages.length === 6, 'GET /api/wallet/packages returns all 6 packages');

    // Also verify /api/topup/packages route
    const req6c = makeReq('http://localhost:3000/api/topup/packages', 'GET');
    const res6c = await topupPackagesRoute.GET(req6c);
    const json6c = await res6c.json();
    check(res6c.status === 200, 'GET /api/topup/packages returns HTTP 200');
    check(json6c.packages.length === 6, 'GET /api/topup/packages returns all 6 packages');

    // ------------------------------------------------------------------------
    // Scenario 7: Package ordering (display_order ASC 1 to 6)
    // ------------------------------------------------------------------------
    console.log('\n[Scenario 7: Package ordering (display_order ASC 1 to 6)]');
    const pkgs = json6.packages;
    let properlyOrdered = true;
    for (let i = 0; i < pkgs.length; i++) {
      if (pkgs[i].displayOrder !== i + 1) {
        properlyOrdered = false;
        break;
      }
    }
    check(properlyOrdered, 'Packages are ordered strictly by displayOrder 1, 2, 3, 4, 5, 6');
    check(pkgs[0].packageId === 'pkg_100', `First package is pkg_100 (got ${pkgs[0].packageId})`);
    check(pkgs[5].packageId === 'pkg_10000', `Sixth package is pkg_10000 (got ${pkgs[5].packageId})`);

    // ------------------------------------------------------------------------
    // Scenario 8: Package price and quantity integrity
    // ------------------------------------------------------------------------
    console.log('\n[Scenario 8: Package price and quantity integrity]');
    const p100 = pkgs.find((p) => p.packageId === 'pkg_100');
    const p1000 = pkgs.find((p) => p.packageId === 'pkg_1000');
    const p5000 = pkgs.find((p) => p.packageId === 'pkg_5000');

    check(p100 && p100.baseCoins === 100, 'pkg_100: baseCoins is 100');
    check(p100 && p100.bonusCoins === 0, 'pkg_100: bonusCoins is 0');
    check(p100 && p100.totalCoins === 100, 'pkg_100: totalCoins is 100');
    check(p100 && Number(p100.priceAmount) === 0.99, 'pkg_100: price is $0.99');
    check(p100 && p100.currency === 'USD', 'pkg_100: currency is USD');

    check(p1000 && p1000.baseCoins === 1000, 'pkg_1000: baseCoins is 1000');
    check(p1000 && p1000.bonusCoins === 100, 'pkg_1000: bonusCoins is 100');
    check(p1000 && p1000.totalCoins === 1100, 'pkg_1000: totalCoins is 1100');
    check(p1000 && Number(p1000.priceAmount) === 9.99, 'pkg_1000: price is $9.99');

    check(p5000 && p5000.baseCoins === 5000, 'pkg_5000: baseCoins is 5000');
    check(p5000 && p5000.bonusCoins === 600, 'pkg_5000: bonusCoins is 600 (from PostgreSQL seed)');
    check(p5000 && p5000.totalCoins === 5600, 'pkg_5000: totalCoins is 5600');
    check(p5000 && Number(p5000.priceAmount) === 49.99, 'pkg_5000: price is $49.99');

    // ------------------------------------------------------------------------
    // Scenario 9: Mobile wallet loading (mapping and structure compatibility)
    // ------------------------------------------------------------------------
    console.log('\n[Scenario 9: Mobile wallet loading]');
    // Check fields expected by Flutter WalletScreen & CoinPackagesScreen
    check(typeof json1.coins === 'number', 'Mobile balance field "coins" is numeric');
    check(typeof json1.points === 'number', 'Mobile balance field "points" is numeric');
    check(typeof json1.isFrozen === 'boolean', 'Mobile balance field "isFrozen" is boolean');
    check(typeof pkgs[0].totalCoins === 'number', 'Mobile package field "totalCoins" is numeric');
    check(typeof pkgs[0].priceAmount === 'number', 'Mobile package field "priceAmount" is numeric');
    check(typeof pkgs[0].bonusCoins === 'number', 'Mobile package field "bonusCoins" is numeric');
    check(typeof pkgs[0].badgeText !== 'undefined', 'Mobile package field "badgeText" is defined');

    // ------------------------------------------------------------------------
    // Scenario 10: Web wallet loading (WalletScreen & TopupRechargeScreen compliance)
    // ------------------------------------------------------------------------
    console.log('\n[Scenario 10: Web wallet loading]');
    check(json1.wallet !== undefined, 'Top-level contains "wallet" object for Web WalletScreen.tsx');
    check(json1.wallet.coins === 5250, 'wallet.coins present for Web components');
    check(json1.wallet.points === 1800, 'wallet.points present for Web components');
    check(json1.wallet.currencySeparationNotice.includes('strictly separate'), 'wallet.currencySeparationNotice present');

    // ------------------------------------------------------------------------
    // Scenario 11: Cross-client balance consistency
    // ------------------------------------------------------------------------
    console.log('\n[Scenario 11: Cross-client balance consistency]');
    const req11Coins = makeReq('http://localhost:3000/api/economy/coins/balance', 'GET', null, userA.token);
    const res11Coins = await coinsBalanceRoute.GET(req11Coins);
    const json11Coins = await res11Coins.json();

    const req11Points = makeReq('http://localhost:3000/api/economy/points/balance', 'GET', null, userA.token);
    const res11Points = await pointsBalanceRoute.GET(req11Points);
    const json11Points = await res11Points.json();

    check(res11Coins.status === 200, 'GET /api/economy/coins/balance returns HTTP 200');
    check(json11Coins.coins === json1.coins, `Coins consistency: /api/economy/coins/balance (${json11Coins.coins}) === /api/wallet/balance (${json1.coins})`);

    check(res11Points.status === 200, 'GET /api/economy/points/balance returns HTTP 200');
    check(json11Points.points === json1.points, `Points consistency: /api/economy/points/balance (${json11Points.points}) === /api/wallet/balance (${json1.points})`);

    // ------------------------------------------------------------------------
    // Scenario 12: Database connection failure handling (HTTP 500, never fake zero)
    // ------------------------------------------------------------------------
    console.log('\n[Scenario 12: Database connection failure handling]');
    // Simulate database failure by passing a non-existent or corrupted table call / broken client
    let failedCleanly = false;
    try {
      await economyService.getOrCreateUserWallet('invalid-user-format', {
        query: () => Promise.reject(new Error('DATABASE_CONNECTION_LOST: connection terminated unexpectedly')),
      });
    } catch (err) {
      if (err.message.includes('DATABASE_CONNECTION_LOST')) {
        failedCleanly = true;
      }
    }
    check(failedCleanly, 'Database query failure throws exception rather than returning fake zero balance');

    // Test route level error catching produces HTTP 500 when database fails
    const mockErrorReq = makeReq('http://localhost:3000/api/wallet/balance?fresh=true', 'GET', null, userA.token);
    const dbMod = await import('./apps/web/lib/db.ts');
    const dbPool = dbMod.getDbPool();
    const originalConnect = dbPool.connect;
    dbPool.connect = async () => {
      throw new Error('FATAL_POSTGRES_DISCONNECT: Database connection failed.');
    };

    const res12 = await walletBalanceRoute.GET(mockErrorReq);
    const json12 = await res12.json();

    // Restore pool connection immediately
    dbPool.connect = originalConnect;

    check(res12.status === 500, `Database failure returns HTTP 500 (got ${res12.status})`);
    check(json12.success === false, 'success is false');
    check(json12.coins === undefined, 'No fake coins balance returned on 500 error');
    check(json12.points === undefined, 'No fake points balance returned on 500 error');

    // ------------------------------------------------------------------------
    // Scenario 13: Empty package response handling (empty list [], not fixtures)
    // ------------------------------------------------------------------------
    console.log('\n[Scenario 13: Empty package response handling]');
    // Temporarily deactivate active packages in PostgreSQL to test real empty catalog response
    await pool.query('UPDATE popolive.coin_packages SET is_active = false WHERE is_active = true');

    const req13 = makeReq('http://localhost:3000/api/economy/coins/packages', 'GET');
    const res13 = await economyPackagesRoute.GET(req13);
    const json13 = await res13.json();

    // Re-activate official 6 packages immediately
    await pool.query(
      "UPDATE popolive.coin_packages SET is_active = true WHERE package_id IN ('pkg_100', 'pkg_500', 'pkg_1000', 'pkg_2000', 'pkg_5000', 'pkg_10000')"
    );

    check(res13.status === 200, 'HTTP 200 returned for empty package catalog');
    check(json13.success === true, 'success is true');
    check(Array.isArray(json13.packages), 'packages is array');
    check(json13.packages.length === 0, 'Returns strictly empty list [] without fixture fallback');

    // ------------------------------------------------------------------------
    // Scenario 14: No fixture fallback when enabled
    // ------------------------------------------------------------------------
    console.log('\n[Scenario 14: No fixture fallback when enabled]');
    // Inspect apps/mobile/lib/api/api_config.dart to verify useEconomyApi is true
    const apiConfigContent = fs.readFileSync(path.resolve(__dirname, 'apps/mobile/lib/api/api_config.dart'), 'utf8');
    const mobileEconomyFlagMatch = apiConfigContent.match(/static bool useEconomyApi = const bool\.fromEnvironment\('USE_ECONOMY_API', defaultValue: (true|false)\);/);
    check(mobileEconomyFlagMatch && mobileEconomyFlagMatch[1] === 'true', 'apps/mobile/lib/api/api_config.dart has useEconomyApi defaultValue: true');

    // Inspect apps/web/.env.local to verify NEXT_PUBLIC_USE_ECONOMY_API is true
    const envLocalContent = fs.readFileSync(path.resolve(__dirname, 'apps/web/.env.local'), 'utf8');
    check(envLocalContent.includes('NEXT_PUBLIC_USE_ECONOMY_API=true'), 'apps/web/.env.local has NEXT_PUBLIC_USE_ECONOMY_API=true');
    check(envLocalContent.includes('USE_ECONOMY_API=true'), 'apps/web/.env.local has USE_ECONOMY_API=true');

    // Inspect wallet_screen.dart to verify live packages are rendered when ApiConfig.useEconomyApi is true
    const walletScreenContent = fs.readFileSync(path.resolve(__dirname, 'apps/mobile/lib/screens/wallet/wallet_screen.dart'), 'utf8');
    check(walletScreenContent.includes('if (ApiConfig.useEconomyApi) {'), 'wallet_screen.dart checks ApiConfig.useEconomyApi in _buildCoinPackagesSection');
    check(walletScreenContent.includes('packages = _liveCoinPackages;'), 'wallet_screen.dart uses _liveCoinPackages when ApiConfig.useEconomyApi is true');
    check(walletScreenContent.includes('throw Exception(coinBalData[\'error\']'), 'wallet_screen.dart raises Exception on error rather than falling back to fixtures');

    // ------------------------------------------------------------------------
    // Scenario 15: Fixture mode preserved when disabled
    // ------------------------------------------------------------------------
    console.log('\n[Scenario 15: Fixture mode preserved when disabled]');
    check(walletScreenContent.includes('packages = DesignFixtures.coinPackages;'), 'wallet_screen.dart preserves DesignFixtures.coinPackages fallback when flag is false');
    check(walletScreenContent.includes('_loadFromFixtures();'), 'wallet_screen.dart preserves _loadFromFixtures() when flag is false');

    const walletScreenWeb = fs.readFileSync(path.resolve(__dirname, 'apps/web/components/wallet/WalletScreen.tsx'), 'utf8');
    check(walletScreenWeb.includes('if (USE_ECONOMY_API) {'), 'WalletScreen.tsx cleanly checks USE_ECONOMY_API');

    console.log('\n================================================================');
    console.log(`B5 PROMPT 1/4 TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
    console.log('================================================================');

    if (testsFailed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during test execution:', err);
    process.exit(1);
  } finally {
    // Cleanup created test records
    if (cleanupSessionTokens.length > 0) {
      await pool.query('DELETE FROM popolive.sessions WHERE session_token = ANY($1)', [cleanupSessionTokens]);
    }
    if (cleanupUserIds.length > 0) {
      await pool.query('DELETE FROM popolive.user_wallets WHERE user_id = ANY($1)', [cleanupUserIds]);
      await pool.query('DELETE FROM popolive.users WHERE id = ANY($1)', [cleanupUserIds]);
    }
    await pool.end();
    process.exit(testsFailed > 0 ? 1 : 0);
  }
}

runAllTests();
