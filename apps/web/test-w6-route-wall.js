/**
 * W6 VERIFICATION SUITE — THE ROUTE WALL: BLOCK MOBILE-ONLY WEB URLS
 *
 * Verifies:
 * 1. Mobile-only routes redirect with HTTP 307 (permanent: false) to /download?from=app
 *    - Host and Live Studio routes
 *    - Party, PK and Near routes
 *    - Gifts and Wallet routes
 *    - Social and Communication routes
 *    - Rankings and Host Tasks routes
 *    - Agency and Financial Management routes
 *    - Settings Blacklist routes
 * 2. Special route redirect: /design-system and wildcards redirect to / (HTTP 307)
 * 3. Public website routes are NEVER blocked or redirected to /download:
 *    - Public pages: /, /news, /about, /contact, /agency, /policies, /community-guidelines
 *    - Download, Recharge & Finance: /download, /recharge, /finance, /receipts
 *    - Auth: /login, /signup, /forgot-password, /reset-password, /complete-profile
 *    - Live Discovery & Watch: /live, /live/explore, /live/following, /live/new, /live/room/880219, /live/chat, /live/quality, /live/safety, /live/rules, /live/watch
 *    - Account: /profile, /profile/edit, /settings, /account, /help, /search
 *    - Staff/Admin: protected under W5 (redirect to /login for logged-out users, NEVER /download)
 *    - API routes: /api/discovery/explore, /api/auth/session
 * 4. Download page banner verification:
 *    - /download?from=app displays "This part of Popo Live is in the Android and iOS app."
 *    - /download without param does not display the banner
 * 5. Preservation of mobile app, database, and backend integrity.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

const baseUrl = 'http://localhost:3000';

async function fetchRoute(urlPath) {
  try {
    const res = await fetch(`${baseUrl}${urlPath}`, {
      redirect: 'manual',
    });
    return {
      status: res.status,
      location: res.headers.get('location'),
      text: await res.text(),
    };
  } catch (err) {
    return {
      status: 0,
      error: err.message,
    };
  }
}

async function runW6Verification() {
  console.log('======================================================================');
  console.log('🧪 RUNNING W6 ROUTE WALL SEPARATION AUDIT SUITE');
  console.log('======================================================================\n');

  // ---------------------------------------------------------------------------
  // 1. MOBILE-ONLY ROUTE REDIRECTS (Expected: HTTP 307 -> /download?from=app)
  // ---------------------------------------------------------------------------
  console.log('--- 1. MOBILE-ONLY ROUTES REDIRECT TO /download?from=app ---');

  const mobileOnlyRoutes = [
    // 1. Host and Live Studio
    '/go-live',
    '/live/setup',
    '/live/setup/audio',
    '/live/pre-live',
    '/live/studio',
    '/live/studio/room-123',
    '/live/web-studio',
    '/live/web-watch',
    '/live/center',
    '/live/end-screen',
    '/live/host-rules',
    '/live/cost-guard',

    // 2. Party, PK and Near
    '/live/party',
    '/live/pk',
    '/live/near',
    '/near',
    '/party',
    '/party/voice-room-99',
    '/pk',
    '/pk/match-456',

    // 3. Gifts and Wallet
    '/gifts',
    '/gifts/catalog',
    '/wallet',
    '/wallet/history',
    '/topup',
    '/topup/coins',
    '/vip',
    '/vip/tiers',
    '/store',
    '/store/items',
    '/recognition',
    '/recognition/badges',
    '/earnings',
    '/earnings/summary',
    '/animations',
    '/animations/effects',

    // 4. Social and Communication
    '/inbox',
    '/inbox/chat-789',
    '/system-notices',
    '/system-notices/alerts',
    '/notifications',
    '/notifications/unread',
    '/square',
    '/square/post-1',
    '/fan-club',
    '/fan-club/club-2',
    '/invites',
    '/invites/referrals',
    '/create',
    '/create/moment',
    '/video-call',
    '/video-call/call-3',
    '/user/user-123',

    // 5. Rankings and Host Tasks
    '/ranking',
    '/ranking/daily',
    '/daily-tasks',
    '/daily-tasks/progress',
    '/task-level',
    '/task-level/details',
    '/new-host-pack',
    '/new-host-pack/claim',
    '/host-rankings',
    '/host-rankings/weekly',
    '/event-leaderboard',
    '/event-leaderboard/season1',
    '/earning-identity',
    '/earning-identity/verify',

    // 6. Agency and Financial Management
    '/agency-management',
    '/agency-management/hosts',
    '/agent-earnings',
    '/agent-earnings/report',
    '/coin-seller',
    '/coin-seller/inventory',
    '/withdrawals',
    '/withdrawals/payouts',

    // 7. Settings and Development
    '/settings/blacklist',
    '/settings/blacklist/manage',
  ];

  for (const route of mobileOnlyRoutes) {
    const res = await fetchRoute(route);
    assert(
      res.status === 307 && res.location === '/download?from=app',
      `Mobile route "${route}" redirects with HTTP 307 to /download?from=app (status: ${res.status}, location: ${res.location})`
    );
  }

  // ---------------------------------------------------------------------------
  // 2. SPECIAL DESIGN SYSTEM REDIRECT (Expected: HTTP 307 -> /)
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. SPECIAL REDIRECT: DESIGN SYSTEM REDIRECTS TO / ---');

  const designSystemRoutes = ['/design-system', '/design-system/components'];
  for (const route of designSystemRoutes) {
    const res = await fetchRoute(route);
    assert(
      res.status === 307 && res.location === '/',
      `Design system route "${route}" redirects with HTTP 307 to / (status: ${res.status}, location: ${res.location})`
    );
  }

  // ---------------------------------------------------------------------------
  // 3. PUBLIC WEBSITE ROUTES (Must NOT redirect to /download)
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. PUBLIC WEBSITE ROUTES ARE PRESERVED ---');

  const publicRoutes = [
    '/',
    '/news',
    '/about',
    '/contact',
    '/agency',
    '/policies',
    '/community-guidelines',
    '/download',
    '/recharge',
    '/finance',
    '/receipts',
    '/receipts/rcpt-demo?preview=demo',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/complete-profile',
    '/live',
    '/live/explore',
    '/live/following',
    '/live/new',
    '/live/room/880219',
    '/live/chat',
    '/live/quality',
    '/live/safety',
    '/live/rules',
    '/live/watch',
    '/search',
    '/profile',
    '/profile/edit',
    '/settings',
    '/account',
    '/help',
  ];

  for (const route of publicRoutes) {
    const res = await fetchRoute(route);
    const isRedirectedToDownload = res.location && res.location.includes('/download');
    assert(
      !isRedirectedToDownload && res.status !== 404 && res.status !== 500,
      `Public route "${route}" is NOT redirected to download (status: ${res.status}, location: ${res.location || 'none'})`
    );
  }

  // Staff and Admin routes under W5 must redirect to /login when unauthenticated, NEVER to /download
  console.log('\n--- 4. ADMIN AND STAFF ROUTES REDIRECT TO /login, NOT /download ---');
  const adminRoutes = ['/admin', '/admin/gifts', '/admin/finance', '/staff'];
  for (const route of adminRoutes) {
    const res = await fetchRoute(route);
    assert(
      res.status === 307 && res.location === '/login',
      `Staff/Admin route "${route}" redirects to /login for unauthenticated users (status: ${res.status}, location: ${res.location})`
    );
  }

  // API routes must respond normally and never redirect
  console.log('\n--- 5. API ROUTES ARE ACCESSIBLE AND NOT REDIRECTED ---');
  const apiRoutes = ['/api/discovery/explore', '/api/auth/session'];
  for (const route of apiRoutes) {
    const res = await fetchRoute(route);
    assert(
      res.status === 200,
      `API route "${route}" returns HTTP 200 JSON directly without redirect (status: ${res.status})`
    );
  }

  // ---------------------------------------------------------------------------
  // 6. DOWNLOAD PAGE BANNER (?from=app) VERIFICATION
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. DOWNLOAD PAGE BANNER & STORE BUTTONS AUDIT ---');

  const dlWithParam = await fetchRoute('/download?from=app');
  assert(dlWithParam.status === 200, 'GET /download?from=app returns HTTP 200');
  assert(
    dlWithParam.text.includes('This part of Popo Live is in the Android and iOS app.'),
    'Banner "This part of Popo Live is in the Android and iOS app." is present in /download?from=app'
  );
  assert(
    dlWithParam.text.includes('data-testid="from-app-notice"'),
    'data-testid="from-app-notice" container is present'
  );
  assert(
    dlWithParam.text.includes('Google Play') || dlWithParam.text.includes('Android'),
    'Google Play download button is rendered'
  );
  assert(
    dlWithParam.text.includes('App Store') || dlWithParam.text.includes('Apple'),
    'Apple App Store download button is rendered'
  );

  // Download page without ?from=app must not render the banner
  const dlWithoutParam = await fetchRoute('/download');
  assert(dlWithoutParam.status === 200, 'GET /download returns HTTP 200');
  assert(
    !dlWithoutParam.text.includes('data-testid="from-app-notice"'),
    'Banner is NOT rendered when ?from=app query parameter is absent'
  );

  // ---------------------------------------------------------------------------
  // 7. CONFIG & CODE INTEGRITY AUDIT
  // ---------------------------------------------------------------------------
  console.log('\n--- 7. NEXT.CONFIG.MJS AUDIT ---');
  const configPath = path.join(__dirname, 'next.config.mjs');
  const configContent = fs.readFileSync(configPath, 'utf8');

  assert(
    configContent.includes('async redirects()'),
    'next.config.mjs exports async redirects()'
  );
  assert(
    !configContent.includes('permanent: true'),
    'All redirects correctly use permanent: false (HTTP 307 temporary redirects)'
  );
  assert(
    configContent.includes("destination: '/download?from=app'"),
    'Mobile-only rules point to destination /download?from=app'
  );
  assert(
    configContent.includes("source: '/design-system'") && configContent.includes("destination: '/'"),
    'Design system rules correctly point to destination /'
  );

  // ---------------------------------------------------------------------------
  // 8. MOBILE APP & DATABASE INTEGRITY
  // ---------------------------------------------------------------------------
  console.log('\n--- 8. PRESERVATION AUDIT (FLUTTER & DATABASE) ---');
  const gitStatus = execSync('git status --porcelain', { cwd: path.join(__dirname, '../..'), encoding: 'utf8' });
  const touchedMobile = gitStatus.split('\n').some((line) => line.includes('apps/mobile/'));
  const touchedBackendMigrations = gitStatus.split('\n').some((line) => line.includes('backend/prisma/migrations/'));

  assert(!touchedMobile, 'apps/mobile Flutter codebase is completely untouched');
  assert(!touchedBackendMigrations, 'backend/prisma/migrations database schema is completely untouched');

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`📊 W6 AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runW6Verification().catch((err) => {
  console.error('Fatal error during W6 verification:', err);
  process.exit(1);
});
