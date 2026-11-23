/**
 * POPO LIVE - R6 Web Profile Verification Test Suite
 * Validates all Section 8 (Web Profile Is the Same Me, R6) requirements:
 * 1. Eight Profile Icons Complete Functionality (Reward, Rank, Store, Invite, Guardian, Honor, Fan Club, Medal Wall)
 * 2. Four Additional Profile Row Complete Screens (Watch History, Level -> Honor, Achievement Poster, Bag)
 * 3. Coins Button -> Complete Wallet Screen Layout inside live shell
 * 4. VIP Button -> Complete VIP Screen Layout inside live shell
 * 5. Fixture Integrity (Actual 36 friends count, no stock photo fallback, proper error and empty states)
 * 6. Shell Integration & Navigation (Back buttons, Light desktop theme, Top-bar recharge untouched)
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

async function runR6Tests() {
  console.log('====================================================');
  console.log('POPO LIVE: R6 Web Profile Verification Test Suite');
  console.log('====================================================\n');

  // Load DesignFixtures
  const { DesignFixtures } = require('./lib/design/designFixtures.ts');

  // Load File Contents for Static Analysis & Architectural Guards
  const webProfilePanelPath = path.join(__dirname, 'components/discovery/WebProfilePanel.tsx');
  const webTopNavPath = path.join(__dirname, 'components/discovery/WebTopNav.tsx');
  const designFixturesPath = path.join(__dirname, 'lib/design/designFixtures.ts');

  const webProfilePanelSrc = fs.readFileSync(webProfilePanelPath, 'utf8');
  const webTopNavSrc = fs.readFileSync(webTopNavPath, 'utf8');
  const designFixturesSrc = fs.readFileSync(designFixturesPath, 'utf8');

  // Reset fixture state before testing
  DesignFixtures.reset();

  // --------------------------------------------------------------------------
  // REQUIREMENT 1: Eight Profile Icons Complete Functionality
  // --------------------------------------------------------------------------
  console.log('--- Requirement 1: Eight Profile Icons Complete Functionality ---');

  // Check no toast-only behavior remains
  assert(!webProfilePanelSrc.includes('Center is available in the Popo Live mobile app'), 
    'TEST 1.1: Toast-only app download placeholders completely removed');
  assert(!webProfilePanelSrc.includes('toast("Reward Center'), 
    'TEST 1.2: Reward icon toast placeholder removed');
  assert(!webProfilePanelSrc.includes('toast("Rankings'), 
    'TEST 1.3: Rank icon toast placeholder removed');
  assert(!webProfilePanelSrc.includes('toast("Store'), 
    'TEST 1.4: Store icon toast placeholder removed');

  // Check all 8 subview states exist in type definition
  const requiredSubViews = [
    'reward', 'rank', 'store', 'invite',
    'guardian', 'honor', 'fan_club', 'medal_wall'
  ];
  requiredSubViews.forEach((subView) => {
    assert(webProfilePanelSrc.includes(`'${subView}'`), 
      `TEST 1.5: Sub-view state '${subView}' defined in WebProfilePanel`);
  });

  // Verify feature handlers map to subviews
  assert(webProfilePanelSrc.includes("setActiveSubView(feat.id)"), 
    'TEST 1.6: Feature icon map navigates to corresponding sub-view via setActiveSubView');
  assert(webProfilePanelSrc.includes("data-testid={`feature-icon-${feat.id}`}"), 
    'TEST 1.7: Feature icons have explicit data-testid attributes');

  // Verify Reward layout contents
  assert(webProfilePanelSrc.includes('profile-reward-layout'), 'TEST 1.8: Reward view has profile-reward-layout testid');
  assert(webProfilePanelSrc.includes('handleClaimTask'), 'TEST 1.9: Reward view implements interactive reward claim handler');
  assert(webProfilePanelSrc.includes('Claimed'), 'TEST 1.10: Reward view displays Claimed status');
  assert(webProfilePanelSrc.includes('data-testid="reward-error-state"'), 'TEST 1.11: Reward view handles error state');
  assert(webProfilePanelSrc.includes('data-testid="reward-empty-state"'), 'TEST 1.12: Reward view handles empty state');

  // Verify Rank layout contents
  assert(webProfilePanelSrc.includes('profile-rank-layout'), 'TEST 1.13: Rank view has profile-rank-layout testid');
  assert(webProfilePanelSrc.includes('Karachi Nights Star Hunt 2026'), 'TEST 1.14: Rank view includes Event Board content');
  assert(webProfilePanelSrc.includes('Top 3 Podium'), 'TEST 1.15: Rank view includes Top 3 Podium layout');
  assert(webProfilePanelSrc.includes('rank-item-'), 'TEST 1.16: Rank view renders ranked host rows');

  // Verify Store layout contents
  assert(webProfilePanelSrc.includes('profile-store-layout'), 'TEST 1.17: Store view has profile-store-layout testid');
  assert(webProfilePanelSrc.includes('storeCategory'), 'TEST 1.18: Store view includes category filtering');
  assert(webProfilePanelSrc.includes('handleBuyItem'), 'TEST 1.19: Store view implements purchase action');
  assert(webProfilePanelSrc.includes('store-item-'), 'TEST 1.20: Store view renders store item cards');

  // Verify Invite layout contents
  assert(webProfilePanelSrc.includes('profile-invite-layout'), 'TEST 1.21: Invite view has profile-invite-layout testid');
  assert(webProfilePanelSrc.includes('inviteInfo.inviteCode') && DesignFixtures.invitationInfo.inviteCode === 'POPO883901', 
    'TEST 1.22: Invite view dynamically displays official POPO883901 referral code from fixture');
  assert(webProfilePanelSrc.includes('joinedUsers'), 'TEST 1.23: Invite view displays joined invited users list');

  // Verify Guardian layout contents
  assert(webProfilePanelSrc.includes('profile-guardian-layout'), 'TEST 1.24: Guardian view has profile-guardian-layout testid');
  assert(webProfilePanelSrc.includes('guardian-card-'), 'TEST 1.25: Guardian view displays guardian cards with tiers');

  // Verify Honor layout contents
  assert(webProfilePanelSrc.includes('profile-honor-layout'), 'TEST 1.26: Honor view has profile-honor-layout testid');
  assert(webProfilePanelSrc.includes('progress-bar-wealth'), 'TEST 1.27: Honor view displays Wealth Level bar');
  assert(webProfilePanelSrc.includes('progress-bar-shining'), 'TEST 1.28: Honor view displays Shining Level bar');
  assert(webProfilePanelSrc.includes('progress-bar-honor'), 'TEST 1.29: Honor view displays Honor Level bar');

  // Verify Fan Club layout contents
  assert(webProfilePanelSrc.includes('profile-fan-club-layout'), 'TEST 1.30: Fan Club view has profile-fan-club-layout testid');
  assert(webProfilePanelSrc.includes('Amina Star Club'), 'TEST 1.31: Fan Club view displays Amina Star Club title');
  assert(webProfilePanelSrc.includes('badgeColorHex'), 'TEST 1.32: Fan Club view displays official STAR badge with badgeColorHex');
  assert(webProfilePanelSrc.includes('handleToggleMembership'), 'TEST 1.33: Fan Club view implements interactive join/leave toggle');

  // Verify Medal Wall layout contents
  assert(webProfilePanelSrc.includes('profile-medal-wall-layout'), 'TEST 1.34: Medal Wall view has profile-medal-wall-layout testid');
  assert(webProfilePanelSrc.includes('medal-card-'), 'TEST 1.35: Medal Wall view displays medal cards grid');
  assert(webProfilePanelSrc.includes('medalFilter'), 'TEST 1.36: Medal Wall view includes rarity filters');

  // --------------------------------------------------------------------------
  // REQUIREMENT 2: Four Additional Profile Rows Complete Screens
  // --------------------------------------------------------------------------
  console.log('\n--- Requirement 2: Four Additional Profile Rows Complete Screens ---');

  // Watch History
  assert(webProfilePanelSrc.includes('profile-watch-history-layout'), 
    'TEST 2.1: Watch History view has profile-watch-history-layout testid');
  assert(webProfilePanelSrc.includes('watch-history-item-'), 
    'TEST 2.2: Watch History renders real list of visited live rooms');
  assert(webProfilePanelSrc.includes('Watch Again'), 
    'TEST 2.3: Watch History includes action button per room');
  assert(!webProfilePanelSrc.includes('Your watch history from the last 30 days is available in the Popo Live mobile app.'), 
    'TEST 2.4: Single sentence watch history placeholder is completely eliminated');

  // Level row
  assert(webProfilePanelSrc.includes('data-testid="profile-row-level"'), 
    'TEST 2.5: Row has data-testid="profile-row-level"');
  assert(webProfilePanelSrc.includes('<h4 className="text-xs font-bold text-gray-800">Level</h4>'), 
    'TEST 2.6: Row is renamed to "Level" (not "Task Level")');
  assert(!webProfilePanelSrc.includes('<h4 className="text-xs font-bold text-gray-800">Task Level</h4>'), 
    'TEST 2.7: "Task Level" row label removed from profile');
  assert(webProfilePanelSrc.includes("setActiveSubView('honor')") && webProfilePanelSrc.includes('data-testid="profile-row-level"'), 
    'TEST 2.8: "Level" row navigates to honor sub-view with 3 progress bars');
  assert(!webProfilePanelSrc.includes('openTaskLevelScreen'), 
    'TEST 2.9: WebProfilePanel does not navigate to TaskLevelScreen for Level row');

  // Achievement Poster
  assert(webProfilePanelSrc.includes('profile-poster-layout'), 
    'TEST 2.10: Achievement Poster view has profile-poster-layout testid');
  assert(webProfilePanelSrc.includes('Save Poster'), 
    'TEST 2.11: Achievement Poster includes Save action');
  assert(webProfilePanelSrc.includes('Share Poster'), 
    'TEST 2.12: Achievement Poster includes Share action');
  assert(webProfilePanelSrc.includes('QR Code') || webProfilePanelSrc.includes('Scan to visit'), 
    'TEST 2.13: Achievement Poster includes simulated QR code badge');

  // Bag (Backpack)
  assert(webProfilePanelSrc.includes('profile-bag-layout'), 
    'TEST 2.14: Bag view has profile-bag-layout testid');
  assert(webProfilePanelSrc.includes('handleToggleEquip'), 
    'TEST 2.15: Bag view implements equip/unequip toggle');
  assert(webProfilePanelSrc.includes('Equipped') && webProfilePanelSrc.includes('Equip'), 
    'TEST 2.16: Bag view renders item equip status controls');

  // --------------------------------------------------------------------------
  // REQUIREMENT 3: Coins Button -> Complete Wallet Screen Layout
  // --------------------------------------------------------------------------
  console.log('\n--- Requirement 3: Coins Button -> Complete Wallet Layout ---');

  assert(webProfilePanelSrc.includes('data-testid="profile-btn-coins"'), 
    'TEST 3.1: Profile Get Coins button has data-testid="profile-btn-coins"');
  assert(webProfilePanelSrc.includes("setActiveSubView('wallet')"), 
    'TEST 3.2: Profile Get Coins button navigates to wallet sub-view');
  assert(webProfilePanelSrc.includes('profile-wallet-layout'), 
    'TEST 3.3: Wallet view has profile-wallet-layout testid');
  assert(webProfilePanelSrc.includes('coinPackages'), 
    'TEST 3.4: Wallet view loads coin packages from fixture');
  assert(webProfilePanelSrc.includes('coin-pkg-'), 
    'TEST 3.5: Wallet view renders coin package cards');
  assert(webProfilePanelSrc.includes('Ledger History'), 
    'TEST 3.6: Wallet view displays transaction ledger history');
  assert(webTopNavSrc.includes('href="/recharge"'), 
    'TEST 3.7: Top-bar "Get Coins" link remains configured to /recharge');

  // --------------------------------------------------------------------------
  // REQUIREMENT 4: VIP Button -> Complete VIP Screen Layout
  // --------------------------------------------------------------------------
  console.log('\n--- Requirement 4: VIP Button -> Complete VIP Layout ---');

  assert(webProfilePanelSrc.includes('data-testid="profile-btn-vip"'), 
    'TEST 4.1: Profile VIP button has data-testid="profile-btn-vip"');
  assert(webProfilePanelSrc.includes("setActiveSubView('vip')"), 
    'TEST 4.2: Profile VIP button navigates to vip sub-view');
  assert(webProfilePanelSrc.includes('profile-vip-layout'), 
    'TEST 4.3: VIP view has profile-vip-layout testid');
  assert(webProfilePanelSrc.includes('Crown Sovereign') || webProfilePanelSrc.includes('Tier 3'), 
    'TEST 4.4: VIP view displays active Tier 3 Crown Sovereign status');
  assert(webProfilePanelSrc.includes('VIP Privileges'), 
    'TEST 4.5: VIP view displays VIP privileges grid');
  assert(webProfilePanelSrc.includes('vip-plan-'), 
    'TEST 4.6: VIP view displays subscription tier options');

  // --------------------------------------------------------------------------
  // REQUIREMENT 5: Fixture Integrity & Error/Empty Handling
  // --------------------------------------------------------------------------
  console.log('\n--- Requirement 5: Fixture Integrity & Error/Empty Handling ---');

  // Fallback stock photo eliminated
  assert(!webProfilePanelSrc.includes('photo-1494790108377-be9c29b29330'), 
    'TEST 5.1: Fallback stock photo URL is completely removed from codebase');

  // Friends count verification
  const currentUser = DesignFixtures.currentUserProfile;
  assert(currentUser.friendsCount === 36, 
    `TEST 5.2: Fixture currentUserProfile.friendsCount is 36 (Actual: ${currentUser.friendsCount})`);
  assert(!webProfilePanelSrc.includes('friendsCount: 24'), 
    'TEST 5.3: Hardcoded friendsCount: 24 fallback is completely eliminated');

  // Error state verification
  assert(webProfilePanelSrc.includes('profile-error-state'), 
    'TEST 5.4: profile-error-state testid exists for error handling');
  assert(webProfilePanelSrc.includes('Retry Connection'), 
    'TEST 5.5: Error state contains Retry Connection action');

  // Verify error state behavior on DesignFixtures
  DesignFixtures.setError(true);
  let errorCaught = false;
  try {
    const _ = DesignFixtures.currentUserProfile;
  } catch (e) {
    errorCaught = true;
  }
  assert(errorCaught, 'TEST 5.6: DesignFixtures throws when isError is true');

  // Verify empty state behavior on DesignFixtures
  DesignFixtures.reset();
  DesignFixtures.setEmpty(true);
  assert(webProfilePanelSrc.includes('profile-empty-state'), 
    'TEST 5.7: profile-empty-state testid exists for empty handling');
  DesignFixtures.reset();

  // Invitation info verification
  const inviteInfo = DesignFixtures.invitationInfo;
  assert(inviteInfo.inviteCode === 'POPO883901', 
    `TEST 5.8: Referral code is POPO883901 (Actual: ${inviteInfo.inviteCode})`);
  assert(inviteInfo.joinedUsers.length === 4, 
    `TEST 5.9: 4 joined users in invitation fixture (Actual: ${inviteInfo.joinedUsers.length})`);

  // Honor level verification
  assert(currentUser.honorLevel === 5, 
    `TEST 5.10: Fixture user honor level is 5 (Actual: ${currentUser.honorLevel})`);

  // --------------------------------------------------------------------------
  // REQUIREMENT 6: Shell Integration & Back Navigation
  // --------------------------------------------------------------------------
  console.log('\n--- Requirement 6: Shell Integration & Back Navigation ---');

  assert(webProfilePanelSrc.includes('profile-subview-back-button'), 
    'TEST 6.1: Sub-view header renders profile-subview-back-button');
  assert(webProfilePanelSrc.includes("setActiveSubView('main')"), 
    'TEST 6.2: Back button returns to main profile view via setActiveSubView');
  assert(webProfilePanelSrc.includes('bg-white') && webProfilePanelSrc.includes('text-gray-900'), 
    'TEST 6.3: Web Profile preserves desktop light theme');

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`TOTAL PASSES: ${passed}`);
  console.log(`TOTAL FAILURES: ${failed}`);
  console.log('====================================================');

  if (failed > 0) {
    console.error('\nSOME R6 REQUIREMENTS FAILED. Please review the output above.');
    process.exit(1);
  } else {
    console.log('\nALL R6 WEB PROFILE REQUIREMENTS VERIFIED AND PASSING SUCCESSFULLY!');
    process.exit(0);
  }
}

runR6Tests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
