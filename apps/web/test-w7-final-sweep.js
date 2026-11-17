/**
 * W7 VERIFICATION SUITE — FINAL WEBSITE SWEEP: REMOVE ALL MOBILE-ONLY PUBLIC DOORS
 *
 * Verifies all 7 official search categories across public website components:
 * 1. Download APK / AppGallery: No public APK / AppGallery buttons or file links.
 * 2. Near / GPS: No Near tab or GPS discovery controls. NEAR_FEATURE_ENABLED is false.
 * 3. Video Call: No public links or buttons to /video-call. Route is walled (HTTP 307).
 * 4. Agency and Financial Modules: No public links to /withdrawals, /coin-seller, /agent-earnings, /agency-management.
 *    Public /agency and /recharge remain fully accessible.
 * 5. Go Live: No public /go-live or /live/setup links. Host setup is walled.
 * 6. LIVE Gift Button: live-room-open-gift-btn absent, GiftSendingPanel absent, LiveGiftAnimationOverlay preserved.
 * 7. Stay-Off Features: 4-Host PK locked, lucky gifts absent, second-level agent commission absent.
 * 8. Public Navigation: Header, Footer, DiscoveryShell, ViewerRoomScreen, Profile, Settings, Download, Homepage.
 * 9. English & Urdu bilingual localization integrity.
 * 10. Strict preservation: Flutter mobile app and database migrations 100% untouched.
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

async function runW7Verification() {
  console.log('======================================================================');
  console.log('🧪 RUNNING W7 FINAL WEBSITE SWEEP AUDIT SUITE');
  console.log('======================================================================\n');

  const rootDir = path.join(__dirname, '../..');
  const webDir = path.join(rootDir, 'apps/web');

  // List of public website components and pages to audit
  const publicFiles = [
    'apps/web/app/page.tsx',
    'apps/web/app/profile/page.tsx',
    'apps/web/app/settings/page.tsx',
    'apps/web/app/download/page.tsx',
    'apps/web/app/agency/page.tsx',
    'apps/web/app/recharge/page.tsx',
    'apps/web/components/poppo/PoppoHeader.tsx',
    'apps/web/components/poppo/PoppoFooter.tsx',
    'apps/web/components/discovery/DiscoveryShell.tsx',
    'apps/web/components/discovery/LiveRoomCard.tsx',
    'apps/web/components/discovery/FollowingUserCard.tsx',
    'apps/web/components/live/ViewerRoomScreen.tsx',
  ];

  // Read all public files content
  const publicContents = publicFiles.map((relPath) => ({
    path: relPath,
    content: fs.readFileSync(path.join(rootDir, relPath), 'utf8'),
  }));

  // ---------------------------------------------------------------------------
  // 1. SEARCH 1: DOWNLOAD APK / APPGALLERY AUDIT
  // ---------------------------------------------------------------------------
  console.log('--- 1. SEARCH 1: DOWNLOAD APK / APPGALLERY AUDIT ---');

  const footerContent = fs.readFileSync(path.join(webDir, 'components/poppo/PoppoFooter.tsx'), 'utf8');
  assert(!footerContent.includes('AppGallery'), 'PoppoFooter contains no AppGallery link or badge');
  assert(!footerContent.includes('Android APK'), 'PoppoFooter contains no Android APK button or badge');
  assert(!footerContent.includes('Huawei'), 'PoppoFooter contains no Huawei badge');
  assert(footerContent.includes('App Store'), 'PoppoFooter retains official Apple App Store badge');
  assert(footerContent.includes('Google Play'), 'PoppoFooter retains official Google Play Store badge');

  const homeContent = fs.readFileSync(path.join(webDir, 'app/page.tsx'), 'utf8');
  assert(!homeContent.includes('AppGallery'), 'Homepage hero contains no AppGallery button');
  assert(!homeContent.includes('.apk'), 'Homepage hero contains no .apk direct link');
  assert(homeContent.includes('App Store'), 'Homepage hero retains Apple App Store');
  assert(homeContent.includes('Google Play'), 'Homepage hero retains Google Play');

  const downloadContent = fs.readFileSync(path.join(webDir, 'app/download/page.tsx'), 'utf8');
  assert(!downloadContent.includes('download-apk-btn'), 'Download page has no download-apk-btn');
  assert(downloadContent.includes('Direct APK downloads are intentionally disabled'), 'Download page FAQ explains no direct APKs');

  // ---------------------------------------------------------------------------
  // 2. SEARCH 2: NEAR / GPS AUDIT
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. SEARCH 2: NEAR / GPS AUDIT ---');

  const featureFlagsContent = fs.readFileSync(path.join(webDir, 'lib/featureFlags.ts'), 'utf8');
  assert(
    featureFlagsContent.includes('NEAR_FEATURE_ENABLED: false') || featureFlagsContent.includes('NEAR_FEATURE_ENABLED = false'),
    'NEAR_FEATURE_ENABLED is strictly false in lib/featureFlags.ts'
  );

  const discoveryContent = fs.readFileSync(path.join(webDir, 'components/discovery/DiscoveryShell.tsx'), 'utf8');
  assert(!discoveryContent.includes("'near'"), 'DiscoveryShell tabs type does not include "near"');
  assert(!discoveryContent.includes('NearScreen'), 'DiscoveryShell does not import or render NearScreen');

  // Verify /live/near and /near are redirected
  const nearRes1 = await fetchRoute('/live/near');
  assert(nearRes1.status === 307 && nearRes1.location === '/download?from=app', '/live/near redirects to /download?from=app');
  const nearRes2 = await fetchRoute('/near');
  assert(nearRes2.status === 307 && nearRes2.location === '/download?from=app', '/near redirects to /download?from=app');

  // ---------------------------------------------------------------------------
  // 3. SEARCH 3: VIDEO CALL AUDIT
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. SEARCH 3: VIDEO CALL AUDIT ---');

  for (const item of publicContents) {
    const hasVideoCallLink = /href=["']\/video-call["']/.test(item.content);
    assert(!hasVideoCallLink, `${item.path} contains no public links to /video-call`);
  }

  const vcRes = await fetchRoute('/video-call');
  assert(vcRes.status === 307 && vcRes.location === '/download?from=app', '/video-call route is walled and redirects to /download?from=app');

  // ---------------------------------------------------------------------------
  // 4. SEARCH 4: AGENCY & FINANCIAL MODULE AUDIT
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. SEARCH 4: AGENCY & FINANCIAL MODULE AUDIT ---');

  for (const item of publicContents) {
    const hasWithdrawals = /href=["']\/withdrawals["']/.test(item.content);
    const hasCoinSeller = /href=["']\/coin-seller["']/.test(item.content);
    const hasAgentEarnings = /href=["']\/agent-earnings["']/.test(item.content);
    const hasAgencyManagement = /href=["']\/agency-management["']/.test(item.content);

    assert(!hasWithdrawals, `${item.path} contains no public links to /withdrawals`);
    assert(!hasCoinSeller, `${item.path} contains no public links to /coin-seller`);
    assert(!hasAgentEarnings, `${item.path} contains no public links to /agent-earnings`);
    assert(!hasAgencyManagement, `${item.path} contains no public links to /agency-management`);
  }

  // Public Agency Partnership and Recharge remain open
  const agencyRes = await fetchRoute('/agency');
  assert(agencyRes.status === 200, 'Public Agency Partnership page /agency returns HTTP 200');
  const rechargeRes = await fetchRoute('/recharge');
  assert(rechargeRes.status === 200, 'Public Coin Recharge page /recharge returns HTTP 200');

  // ---------------------------------------------------------------------------
  // 5. SEARCH 5: GO LIVE AUDIT
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. SEARCH 5: GO LIVE AUDIT ---');

  for (const item of publicContents) {
    const hasGoLiveLink = /href=["']\/go-live["']/.test(item.content);
    const hasLiveSetupLink = /href=["']\/live\/setup["']/.test(item.content);
    assert(!hasGoLiveLink, `${item.path} contains no links to /go-live`);
    assert(!hasLiveSetupLink, `${item.path} contains no links to /live/setup`);
  }

  const goLiveRes = await fetchRoute('/go-live');
  assert(goLiveRes.status === 307 && goLiveRes.location === '/download?from=app', '/go-live redirects to /download?from=app');
  const liveSetupRes = await fetchRoute('/live/setup');
  assert(liveSetupRes.status === 307 && liveSetupRes.location === '/download?from=app', '/live/setup redirects to /download?from=app');

  // ---------------------------------------------------------------------------
  // 6. SEARCH 6: LIVE GIFT BUTTON AUDIT
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. SEARCH 6: LIVE GIFT BUTTON AUDIT ---');

  const viewerRoomContent = fs.readFileSync(path.join(webDir, 'components/live/ViewerRoomScreen.tsx'), 'utf8');
  assert(!viewerRoomContent.includes('live-room-open-gift-btn'), 'live-room-open-gift-btn is absent from ViewerRoomScreen');
  assert(!viewerRoomContent.includes('GiftSendingPanel'), 'GiftSendingPanel is neither imported nor rendered in ViewerRoomScreen');
  assert(!viewerRoomContent.includes('showGiftPanel'), 'showGiftPanel state is absent from ViewerRoomScreen');
  assert(viewerRoomContent.includes('LiveGiftAnimationOverlay'), 'LiveGiftAnimationOverlay is preserved for mobile gift broadcasts');

  // ---------------------------------------------------------------------------
  // 7. SEARCH 7: STAY-OFF FEATURES AUDIT
  // ---------------------------------------------------------------------------
  console.log('\n--- 7. SEARCH 7: STAY-OFF FEATURES AUDIT ---');

  const pkApiContent = fs.readFileSync(path.join(webDir, 'app/api/pk/battle-types/select/route.ts'), 'utf8');
  assert(
    pkApiContent.includes('4-Host PK Battle is currently locked') || pkApiContent.includes('4-Host PK Battle is currently disabled'),
    '4-Host PK Battle is strictly locked/disabled in backend route guard'
  );

  const pkLibContent = fs.readFileSync(path.join(webDir, 'lib/pk.ts'), 'utf8');
  assert(
    pkLibContent.includes("isEnabled: false") && pkLibContent.includes("isLocked: true"),
    '4-Host PK format is flagged isEnabled: false and isLocked: true in pk.ts configuration'
  );

  // Check lucky gift and second level agent commission are absent in public website and web libraries
  const webFiles = fs.readdirSync(path.join(webDir, 'lib')).map((f) => path.join(webDir, 'lib', f));
  let luckyFound = false;
  let secondLevelFound = false;
  for (const f of webFiles) {
    if (fs.statSync(f).isFile()) {
      const c = fs.readFileSync(f, 'utf8');
      if (/lucky.?gift/i.test(c)) luckyFound = true;
      if (/second.?level.?(commission|agent)/i.test(c)) secondLevelFound = true;
    }
  }

  assert(!luckyFound, 'Lucky Gifts feature remains 100% disabled / absent');
  assert(!secondLevelFound, 'Second-level agent commission remains 100% disabled / absent');

  // ---------------------------------------------------------------------------
  // 8. PUBLIC NAVIGATION COMPONENT AUDIT
  // ---------------------------------------------------------------------------
  console.log('\n--- 8. PUBLIC NAVIGATION COMPONENT AUDIT ---');

  const headerContent = fs.readFileSync(path.join(webDir, 'components/poppo/PoppoHeader.tsx'), 'utf8');
  assert(!headerContent.includes('href="/admin"'), 'PoppoHeader has no public link to /admin');
  assert(!headerContent.includes('href="/wallet"'), 'PoppoHeader has no public link to /wallet');
  assert(!headerContent.includes('href="/inbox"'), 'PoppoHeader has no public link to /inbox');
  assert(!headerContent.includes('href="/square"'), 'PoppoHeader has no public link to /square');

  const profileContent = fs.readFileSync(path.join(webDir, 'app/profile/page.tsx'), 'utf8');
  assert(profileContent.includes('/recharge'), 'Profile page retains Get Coins -> /recharge');
  assert(profileContent.includes('/download'), 'Profile page retains Get the App -> /download');
  assert(!profileContent.includes('/wallet'), 'Profile page contains no wallet link');
  assert(!profileContent.includes('/admin'), 'Profile page contains no admin link');

  const settingsContent = fs.readFileSync(path.join(webDir, 'app/settings/page.tsx'), 'utf8');
  assert(!settingsContent.includes('/settings/blacklist'), 'Settings page contains no blacklist link');

  // ---------------------------------------------------------------------------
  // 9. ENGLISH & URDU LOCALIZATION INTEGRITY
  // ---------------------------------------------------------------------------
  console.log('\n--- 9. ENGLISH & URDU LOCALIZATION INTEGRITY ---');

  assert(headerContent.includes("lang === 'ur' ? 'اردو' : 'English'"), 'PoppoHeader supports EN/UR language toggle');
  assert(footerContent.includes("isUr"), 'PoppoFooter supports Urdu translations');
  assert(discoveryContent.includes("label_ur: 'دریافت'"), 'DiscoveryShell provides Urdu navigation labels');
  assert(downloadContent.includes("isUr"), 'Download page provides full Urdu bilingual support');

  // ---------------------------------------------------------------------------
  // 10. STRICT PRESERVATION AUDIT (FLUTTER & DATABASE)
  // ---------------------------------------------------------------------------
  console.log('\n--- 10. STRICT PRESERVATION AUDIT (FLUTTER & DATABASE) ---');

  const gitStatus = execSync('git status --porcelain', { cwd: rootDir, encoding: 'utf8' });
  const touchedMobile = gitStatus.split('\n').some((line) => line.includes('apps/mobile/'));
  const touchedBackendMigrations = gitStatus.split('\n').some((line) => line.includes('backend/prisma/migrations/'));
  const touchedApiRoutes = gitStatus.split('\n').some((line) => line.includes('apps/web/app/api/'));

  assert(!touchedMobile, 'apps/mobile Flutter codebase is completely untouched');
  assert(!touchedBackendMigrations, 'backend/prisma/migrations database schema is completely untouched');
  assert(!touchedApiRoutes, 'apps/web/app/api backend endpoints are completely untouched');

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`📊 W7 AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runW7Verification().catch((err) => {
  console.error('Fatal error during W7 verification:', err);
  process.exit(1);
});
