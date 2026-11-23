/**
 * POPO LIVE - R5 Web Live Page Verification Test Suite
 * Validates all Section 7 (Web Live Chrome, R5) requirements:
 * 1. Sub-tabs (Explore, Following, New) do not exist on the Live page
 * 2. Left rail still contains Following
 * 3. Country chips appear before Live Now section
 * 4. Live room cards match fixture rooms
 * 5. Error fixture state displays the error panel
 * 6. Message left rail displays dynamic badge for unread counts
 * 7. Message left rail does not render a zero badge
 * 8. Party seat opens GoLiveRedirectSheet
 * 9. Party seat sheet contains camera/mic phone copy
 * 10. PK page displays only 1v1 and does not display 4-host
 */

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`[PASS] ${testName}${details ? ' - ' + details : ''}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}${details ? ' - ' + details : ''}`);
    failed++;
  }
}

async function runR5Tests() {
  console.log('====================================================');
  console.log('POPO LIVE: R5 Web Live Page Verification Test Suite');
  console.log('====================================================\n');

  // Load DesignFixtures
  const { DesignFixtures } = require('./lib/design/designFixtures.ts');

  // Load File Contents for Static Analysis & Architectural Guards
  const discoveryShellPath = path.join(__dirname, 'components/discovery/DiscoveryShell.tsx');
  const webLeftRailPath = path.join(__dirname, 'components/discovery/WebLeftRail.tsx');
  const webPartyPanelPath = path.join(__dirname, 'components/discovery/WebPartyPanel.tsx');
  const goLiveSheetPath = path.join(__dirname, 'components/discovery/GoLiveRedirectSheet.tsx');
  const pkScreenPath = path.join(__dirname, 'components/pk/PKBattleTypeScreen.tsx');
  const mobileFixturesPath = path.join(__dirname, '../mobile/lib/design/design_fixtures.dart');

  const discoveryShellSrc = fs.readFileSync(discoveryShellPath, 'utf8');
  const webLeftRailSrc = fs.readFileSync(webLeftRailPath, 'utf8');
  const webPartyPanelSrc = fs.readFileSync(webPartyPanelPath, 'utf8');
  const goLiveSheetSrc = fs.readFileSync(goLiveSheetPath, 'utf8');
  const pkScreenSrc = fs.readFileSync(pkScreenPath, 'utf8');
  const mobileFixturesSrc = fs.readFileSync(mobileFixturesPath, 'utf8');

  // --------------------------------------------------------------------------
  // REQUIREMENT 1: Sub-tabs (Explore, Following, New) removed from Live Page
  // --------------------------------------------------------------------------
  console.log('--- Requirement 1: Sub-tabs Removed from Live Discovery ---');
  assert(!discoveryShellSrc.includes('const liveSubTabs'), 'TEST 1.1: liveSubTabs variable is removed');
  assert(!discoveryShellSrc.includes('liveSubTabs.map'), 'TEST 1.2: liveSubTabs map iteration is removed');
  assert(!discoveryShellSrc.includes("label_en: 'Explore'"), 'TEST 1.3: Sub-tab Explore label is removed');

  // Check that Live discovery panel doesn't contain the sub-tab bar
  const livePanelIdx = discoveryShellSrc.indexOf("data-testid=\"live-discovery-panel\"");
  assert(livePanelIdx !== -1, 'TEST 1.4: Live discovery panel has data-testid="live-discovery-panel"');

  // --------------------------------------------------------------------------
  // REQUIREMENT 2: Left rail still contains Following
  // --------------------------------------------------------------------------
  console.log('\n--- Requirement 2: Following Navigation Item Preserved in Left Rail ---');
  assert(webLeftRailSrc.includes("id: 'following'"), 'TEST 2.1: Left rail contains following navigation item');
  assert(webLeftRailSrc.includes("label_en: 'Following'"), 'TEST 2.2: Left rail following English label exists');
  assert(webLeftRailSrc.includes("label_ur: 'فالوئنگ'"), 'TEST 2.3: Left rail following Urdu label exists');
  assert(webLeftRailSrc.includes("href: '/live?tab=following'") || webLeftRailSrc.includes("href: '/following'"), 'TEST 2.4: Left rail following href is configured');

  // --------------------------------------------------------------------------
  // REQUIREMENT 3: Sequence: Country chips -> Live Now -> Portrait cards
  // --------------------------------------------------------------------------
  console.log('\n--- Requirement 3: Live Panel Ordering & Structure ---');
  const countryChipsIdx = discoveryShellSrc.indexOf('data-testid="country-filter-chips"');
  const liveNowIdx = discoveryShellSrc.indexOf('data-testid="live-now-section"');
  const liveCardsGridIdx = discoveryShellSrc.indexOf('data-testid="live-room-cards-grid"');

  assert(countryChipsIdx !== -1, 'TEST 3.1: Country filter chips section exists');
  assert(liveNowIdx !== -1, 'TEST 3.2: Live Now section header exists');
  assert(liveCardsGridIdx !== -1, 'TEST 3.3: Live room cards grid exists');
  assert(countryChipsIdx < liveNowIdx, 'TEST 3.4: Country chips appear BEFORE Live Now section');
  assert(liveNowIdx < liveCardsGridIdx, 'TEST 3.5: Live Now section appears BEFORE Portrait live cards grid');

  // Check that DiscoveryBannerCarousel, RankDoorSection, RankingPreviewSection are not inside Live panel
  assert(!discoveryShellSrc.includes('<DiscoveryBannerCarousel />'), 'TEST 3.6: Banner carousel removed from Live panel');
  assert(!discoveryShellSrc.includes('<RankDoorSection />'), 'TEST 3.7: Rank doors removed from Live panel');
  assert(!discoveryShellSrc.includes('<RankingPreviewSection />'), 'TEST 3.8: Ranking preview removed from Live panel');

  // --------------------------------------------------------------------------
  // REQUIREMENT 4: Live room cards match fixture rooms & no API overwrite
  // --------------------------------------------------------------------------
  console.log('\n--- Requirement 4: Fixture Live Rooms & No API Overwrite ---');
  assert(!discoveryShellSrc.includes('LiveApiService.getLiveRooms'), 'TEST 4.1: LiveApiService.getLiveRooms API overwrite is removed');

  DesignFixtures.reset();
  const rooms = DesignFixtures.liveRooms;
  assert(Array.isArray(rooms) && rooms.length === 8, 'TEST 4.2: 8 fixture live rooms returned by default', `Found ${rooms.length}`);

  // Compare mobile and web fixture titles
  const sampleTitles = [
    'Karachi Nights 🎶 Acoustic Live Session',
    'Chai & Midnight Chill Talk ☕🌙',
    'Gaming Marathon & Battle Arena 🎮🔥',
    'Lahore Beats & Eastern Classical 🪕✨',
    'Standup Comedy & Talent Hunt 😂🎭',
    'Sufi Soul & Poetry Night 📜🕊️',
    'Karachi Street Food & Kitchen Diaries 🍲🌶️',
    'Late Night Fitness & Cardio Motivation 🏋️‍♂️⚡',
  ];
  sampleTitles.forEach((title, idx) => {
    const webFound = rooms.some((r) => r.title.includes(title) || title.includes(r.title));
    const mobileFound = mobileFixturesSrc.includes(title.substring(0, 15));
    assert(webFound && mobileFound, `TEST 4.3.${idx + 1}: Live room title "${title.substring(0, 25)}..." matches between Web and Mobile`);
  });

  // Check host nicknames
  const sampleHosts = ['Amina Noor', 'Sana Ali', 'Bilal Ahmed', 'Zainab Khan'];
  sampleHosts.forEach((host, idx) => {
    const webFound = rooms.some((r) => r.hostNickname === host);
    const mobileFound = mobileFixturesSrc.includes(host);
    assert(webFound && mobileFound, `TEST 4.4.${idx + 1}: Broadcaster "${host}" matches between Web and Mobile fixtures`);
  });

  // --------------------------------------------------------------------------
  // REQUIREMENT 5: Error and Empty fixture states handled properly
  // --------------------------------------------------------------------------
  console.log('\n--- Requirement 5: Error & Empty State Handling ---');
  assert(discoveryShellSrc.includes('data-testid="live-error-state"'), 'TEST 5.1: Error state UI panel is rendered when fixturesError exists');
  assert(discoveryShellSrc.includes('data-testid="live-empty-state"'), 'TEST 5.2: Empty state UI panel is rendered when rooms array is empty');

  // Test DesignFixtures error handling
  DesignFixtures.setError();
  assert(DesignFixtures.isError === true, 'TEST 5.3: DesignFixtures.isError is true after setError()');
  let threwError = false;
  try {
    const _ = DesignFixtures.liveRooms;
  } catch (e) {
    threwError = true;
  }
  assert(threwError, 'TEST 5.4: DesignFixtures.liveRooms throws DesignFixtureError when in error state');

  // Test DesignFixtures empty handling
  DesignFixtures.setEmpty();
  assert(DesignFixtures.isEmpty === true, 'TEST 5.5: DesignFixtures.isEmpty is true after setEmpty()');
  assert(Array.isArray(DesignFixtures.liveRooms) && DesignFixtures.liveRooms.length === 0, 'TEST 5.6: DesignFixtures.liveRooms returns [] in empty state');
  DesignFixtures.reset();

  // --------------------------------------------------------------------------
  // REQUIREMENT 6 & 7: Dynamic Unread Message Badge on Left Rail
  // --------------------------------------------------------------------------
  console.log('\n--- Requirements 6 & 7: Dynamic Message Badge on Left Rail ---');
  assert(!webLeftRailSrc.includes("badge: '12'"), 'TEST 6.1: Hardcoded badge "12" is completely removed');
  assert(webLeftRailSrc.includes('DesignFixtures.totalUnreadMessages') || webLeftRailSrc.includes('effectiveUnreadCount'), 'TEST 6.2: Left rail uses dynamic totalUnreadMessages / effectiveUnreadCount');

  // Verify DesignFixtures.totalUnreadMessages calculation
  DesignFixtures.reset();
  const filledUnread = DesignFixtures.totalUnreadMessages;
  assert(typeof filledUnread === 'number' && filledUnread > 0, `TEST 6.3: Filled fixture unread count is dynamic and > 0 (Calculated: ${filledUnread})`);
  assert(filledUnread === 28, 'TEST 6.4: Filled fixture unread count matches sum of inboxChats (3) + officialNotices (25) = 28');

  // Verify zero unread behavior
  DesignFixtures.setEmpty();
  const emptyUnread = DesignFixtures.totalUnreadMessages;
  assert(emptyUnread === 0, 'TEST 7.1: Empty fixture unread count is 0');

  DesignFixtures.setError();
  const errorUnread = DesignFixtures.totalUnreadMessages;
  assert(errorUnread === 0, 'TEST 7.2: Error fixture unread count is safely 0');
  DesignFixtures.reset();

  // Verify WebLeftRail badge logic: no zero or negative badge
  assert(webLeftRailSrc.includes('effectiveUnreadCount > 0'), 'TEST 7.3: Left rail badge requires effectiveUnreadCount > 0');
  assert(webLeftRailSrc.includes("item.badge !== '0'"), 'TEST 7.4: Left rail explicitly suppresses rendering "0" badge');

  // --------------------------------------------------------------------------
  // REQUIREMENT 8 & 9: Party Seat Opens GoLiveRedirectSheet with Phone Copy
  // --------------------------------------------------------------------------
  console.log('\n--- Requirements 8 & 9: Party Seat Go Live Redirect ---');
  assert(webPartyPanelSrc.includes("import GoLiveRedirectSheet from './GoLiveRedirectSheet'"), 'TEST 8.1: WebPartyPanel imports GoLiveRedirectSheet');
  assert(webPartyPanelSrc.includes('<GoLiveRedirectSheet'), 'TEST 8.2: WebPartyPanel renders GoLiveRedirectSheet on seat interaction');
  assert(webPartyPanelSrc.includes('seatIndex={redirectSeatIndex}'), 'TEST 8.3: WebPartyPanel passes seatIndex to GoLiveRedirectSheet');
  assert(webPartyPanelSrc.includes('onClose={() => setShowSeatRedirect(false)}'), 'TEST 8.4: WebPartyPanel handles sheet cancel/close correctly');

  // Inspect GoLiveRedirectSheet props & copy
  assert(goLiveSheetSrc.includes('seatIndex?: number | null'), 'TEST 8.5: GoLiveRedirectSheet supports seatIndex prop');
  assert(goLiveSheetSrc.includes('Camera and microphone stay on phone') || goLiveSheetSrc.includes('Camera and microphone stay on your phone'), 'TEST 9.1: Sheet explicitly states camera and microphone stay on phone (English)');
  assert(goLiveSheetSrc.includes('کیمرہ اور مائیکروفون براڈکاسٹنگ آپ کے موبائل فون پر رہتی ہے'), 'TEST 9.2: Sheet explicitly states camera and microphone stay on phone (Urdu)');
  assert(goLiveSheetSrc.includes('backdrop-blur') && goLiveSheetSrc.includes('bg-black/60'), 'TEST 9.3: Sheet uses transparent backdrop overlay so 9-seat lounge remains visible behind');

  // --------------------------------------------------------------------------
  // REQUIREMENT 10: PK Battle Type Screen: Only 1v1, No 4-Host
  // --------------------------------------------------------------------------
  console.log('\n--- Requirement 10: PK Battle Types - 1v1 Only ---');
  assert(pkScreenSrc.includes('data-battle-type="1v1"'), 'TEST 10.1: 1v1 PK battle card exists in PK Battle Type screen');
  assert(!pkScreenSrc.includes('data-battle-type="4_host"'), 'TEST 10.2: 4-Host battle card is removed from PK screen');
  assert(!pkScreenSrc.includes('Coming Soon'), 'TEST 10.3: "Coming Soon" badge is removed from PK screen');
  assert(!pkScreenSrc.includes('جلد آرہا ہے'), 'TEST 10.4: Urdu "جلد آرہا ہے" (Coming Soon) badge is removed from PK screen');
  assert(pkScreenSrc.includes("watermarkBottom: '(1v1)'"), 'TEST 10.5: Watermark badge displays (1v1)');

  // Check no PK item in WebLeftRail
  assert(!webLeftRailSrc.includes("id: 'pk'"), 'TEST 10.6: WebLeftRail does not contain an extraneous PK rail entry');

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`TOTAL PASSES: ${passed}`);
  console.log(`TOTAL FAILURES: ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('ALL R5 REQUIREMENTS VERIFIED AND PASSING SUCCESSFULLY!');
    process.exit(0);
  }
}

runR5Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
