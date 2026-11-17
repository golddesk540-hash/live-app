/**
 * W3 VERIFICATION SUITE — MAKE PROFILE A THIN WEB ACCOUNT
 *
 * Verifies:
 * 1. Profile page contains basic identity: Nickname, Avatar, User ID, Copy User ID action, Country.
 * 2. Profile page contains Edit Profile link to /profile/edit.
 * 3. Profile page contains Two Additional Actions:
 *    - Get Coins -> /recharge
 *    - Get the App -> /download
 * 4. Profile page contains Account Actions:
 *    - Log Out (calls /api/auth/logout)
 *    - Close Account -> /account/close
 * 5. ALL 22 Mobile-only modules are absent for ALL users (viewers, hosts, agents, etc.):
 *    - Wallet (/wallet)
 *    - VIP (/vip)
 *    - Store (/store)
 *    - Finance (/finance)
 *    - Inbox (/inbox)
 *    - System Notices (/system-notices)
 *    - Square (/square)
 *    - Create Post (/square/create)
 *    - Fan Club (/fan-club)
 *    - Invites (/invites)
 *    - Earning Identity (/earning-identity)
 *    - Daily Host Tasks (/daily-tasks)
 *    - Task Level (/task-level)
 *    - Admin (/admin)
 *    - Withdrawals (/withdrawals)
 *    - Coin Seller (/coin-seller)
 *    - Agent Earnings (/agent-earnings)
 *    - Agency Management (/agency-management)
 *    - Event Leaderboard (/event-leaderboard)
 *    - Host Rankings (/host-rankings)
 *    - New Host Pack (/new-host-pack)
 *    - Video Call (/video-call)
 * 6. Profile renders identical thin structure regardless of user role (normal vs host).
 * 7. Settings page (apps/web/app/settings/page.tsx):
 *    - Retains: Language, Log Out, Profile Edit (/profile/edit), Active Sessions (/user-id).
 *    - Removed: Blacklist link (/settings/blacklist).
 * 8. Live Room Viewer Report and Block remain operational in SafetyToolsScreen.tsx.
 * 9. Account close page (/account/close) preserves confirmation steps and backend deletion call.
 * 10. Flutter mobile codebase is 100% untouched.
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

async function runW3Verification() {
  console.log('======================================================================');
  console.log('🧪 RUNNING W3 PROFILE & SETTINGS SEPARATION AUDIT SUITE');
  console.log('======================================================================\n');

  const profilePath = path.join(__dirname, 'app', 'profile', 'page.tsx');
  const profileContent = fs.readFileSync(profilePath, 'utf8');

  const settingsPath = path.join(__dirname, 'app', 'settings', 'page.tsx');
  const settingsContent = fs.readFileSync(settingsPath, 'utf8');

  const accountClosePath = path.join(__dirname, 'app', 'account', 'close', 'page.tsx');
  const accountCloseContent = fs.readFileSync(accountClosePath, 'utf8');

  const safetyToolsPath = path.join(__dirname, 'components', 'live', 'SafetyToolsScreen.tsx');
  const safetyToolsContent = fs.readFileSync(safetyToolsPath, 'utf8');

  // -------------------------------------------------------------------------
  // SECTION 1: Basic User Identity on Web Profile
  // -------------------------------------------------------------------------
  console.log('--- SECTION 1: Basic User Identity on Web Profile ---');
  assert(profileContent.includes('user.nickname'), 'Profile displays Nickname');
  assert(profileContent.includes('user.avatarUrl'), 'Profile displays Profile Avatar');
  assert(profileContent.includes('user.poppoId'), 'Profile displays User ID (Poppo ID)');
  assert(
    profileContent.includes('handleCopyUserId') && profileContent.includes('navigator.clipboard'),
    'Profile has operational Copy User ID action'
  );
  assert(profileContent.includes('user.country'), 'Profile displays user country');
  assert(
    profileContent.includes('Active & 18+ Verified'),
    'Profile displays Active & 18+ Verified status'
  );

  // -------------------------------------------------------------------------
  // SECTION 2: Edit Profile Options
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 2: Edit Profile Options ---');
  assert(
    profileContent.includes('/profile/edit'),
    'Profile contains Edit Profile link to /profile/edit'
  );
  const editProfilePath = path.join(__dirname, 'app', 'profile', 'edit', 'page.tsx');
  const editProfileContent = fs.readFileSync(editProfilePath, 'utf8');
  assert(
    editProfileContent.includes('nickname') && editProfileContent.includes('/api/profile/check-nickname'),
    'Edit Profile supports editing Nickname with live validation'
  );
  assert(
    editProfileContent.includes('/api/profile/avatar') && editProfileContent.includes('handleFileChange'),
    'Edit Profile supports uploading and cropping Profile Photo'
  );
  assert(
    editProfileContent.includes('COUNTRIES_LIST') && editProfileContent.includes('selectedCountry'),
    'Edit Profile supports editing Country'
  );

  // -------------------------------------------------------------------------
  // SECTION 3: Two Additional Actions (Get Coins & Get the App)
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 3: Two Additional Actions ---');
  assert(
    profileContent.includes('href="/recharge"'),
    'Profile contains Get Coins action linking to /recharge'
  );
  assert(
    profileContent.includes('href="/download"'),
    'Profile contains Get the App action linking to /download'
  );

  // -------------------------------------------------------------------------
  // SECTION 4: Account Actions (Log Out & Close Account)
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 4: Account Actions ---');
  assert(
    profileContent.includes('/api/auth/logout') && profileContent.includes('handleLogout'),
    'Profile contains functional Log Out action calling /api/auth/logout'
  );
  assert(
    profileContent.includes('href="/account/close"'),
    'Profile contains Close Account action linking to /account/close'
  );

  // -------------------------------------------------------------------------
  // SECTION 5: Removal of ALL 22 Mobile-Only Modules from Web Profile
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 5: Absence of ALL 22 Mobile-Only Modules from Web Profile ---');
  const mobileModules = [
    { name: 'Wallet', pattern: /href=["']\/wallet["']/ },
    { name: 'VIP', pattern: /href=["']\/vip["']/ },
    { name: 'Store', pattern: /href=["']\/store/ },
    { name: 'Finance', pattern: /href=["']\/finance/ },
    { name: 'Inbox', pattern: /href=["']\/inbox["']/ },
    { name: 'System Notices', pattern: /href=["']\/system-notices["']/ },
    { name: 'Square', pattern: /href=["']\/square["']/ },
    { name: 'Create Post', pattern: /href=["']\/square\/create["']/ },
    { name: 'Fan Club', pattern: /href=["']\/fan-club["']/ },
    { name: 'Invites', pattern: /href=["']\/invites["']/ },
    { name: 'Earning Identity', pattern: /href=["']\/earning-identity["']/ },
    { name: 'Daily Host Tasks', pattern: /href=["']\/daily-tasks["']/ },
    { name: 'Task Level', pattern: /href=["']\/task-level["']/ },
    { name: 'Admin', pattern: /href=["']\/admin["']/ },
    { name: 'Withdrawals', pattern: /href=["']\/withdrawals["']/ },
    { name: 'Coin Seller', pattern: /href=["']\/coin-seller["']/ },
    { name: 'Agent Earnings', pattern: /href=["']\/agent-earnings["']/ },
    { name: 'Agency Management', pattern: /href=["']\/agency-management["']/ },
    { name: 'Event Leaderboard', pattern: /href=["']\/event-leaderboard["']/ },
    { name: 'Host Rankings', pattern: /href=["']\/host-rankings["']/ },
    { name: 'New Host Pack', pattern: /href=["']\/new-host-pack["']/ },
    { name: 'Video Call', pattern: /href=["']\/video-call["']/ },
  ];

  mobileModules.forEach((mod) => {
    assert(!mod.pattern.test(profileContent), `Mobile module "${mod.name}" is absent from web profile`);
  });

  // Verify creator tabs (fake stream posts, broadcast setup, 9-seat party rooms) are absent
  assert(!profileContent.includes('activeTab'), 'Mobile creator tabs state is absent');
  assert(!profileContent.includes('9-Seat Audio Party Room'), '9-Seat audio party room card is absent');
  assert(!profileContent.includes('Ready to Broadcast'), 'Ready to broadcast card is absent');

  // -------------------------------------------------------------------------
  // SECTION 6: Role Neutrality (Normal User vs Host)
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 6: Role Neutrality ---');
  assert(
    !profileContent.includes("user.role === 'host'") &&
    !profileContent.includes("user.is_agent") &&
    !profileContent.includes("user.role === 'admin'"),
    'No role conditional logic bypasses the thin profile for hosts, agents or admins'
  );

  // -------------------------------------------------------------------------
  // SECTION 7: Settings Page Cleanup
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 7: Settings Page Verification ---');
  assert(settingsContent.includes('handleLanguageSelect'), 'Settings retains Language selection');
  assert(settingsContent.includes('handleLogout'), 'Settings retains Log Out action');
  assert(settingsContent.includes('href="/profile/edit"'), 'Settings retains Profile Edit link');
  assert(settingsContent.includes('href="/user-id"'), 'Settings retains Active Sessions link');
  assert(
    !settingsContent.includes('href="/settings/blacklist"'),
    'Link to /settings/blacklist is completely REMOVED from settings page'
  );

  // -------------------------------------------------------------------------
  // SECTION 8: Live Room Viewer Report & Block Functional Preservation
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 8: Live Room Viewer Report & Block Safety ---');
  assert(
    safetyToolsContent.includes('/api/live/safety/report'),
    'Viewer room SafetyToolsScreen preserves /api/live/safety/report'
  );
  assert(
    safetyToolsContent.includes('/api/live/safety/block'),
    'Viewer room SafetyToolsScreen preserves /api/live/safety/block'
  );
  assert(
    safetyToolsContent.includes('REPORT_REASONS'),
    'Viewer room preserves standard safety report reasons'
  );

  // -------------------------------------------------------------------------
  // SECTION 9: Account Close Workflow Preservation
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 9: Account Close Workflow Preservation ---');
  assert(
    accountCloseContent.includes('/api/account/closure/request'),
    'Account Close page preserves backend deletion request endpoint'
  );
  assert(
    accountCloseContent.includes('CLOSURE_REASONS'),
    'Account Close page preserves user closure reasons'
  );
  assert(
    accountCloseContent.includes('acknowledged'),
    'Account Close page preserves user confirmation acknowledgment step'
  );

  // -------------------------------------------------------------------------
  // SECTION 10: Mobile Codebase & Database Intact
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 10: Strict Preservation Boundaries ---');
  const gitDiffMobile = execSync('git diff --name-only apps/mobile', { encoding: 'utf8' }).trim();
  assert(gitDiffMobile === '', 'Mobile Flutter codebase is 100% untouched');

  const gitDiffDb = execSync('git diff --name-only apps/web/data/migrations', { encoding: 'utf8' }).trim();
  assert(gitDiffDb === '', 'Database migrations and schema are 100% untouched');

  // Summary
  console.log('\n======================================================================');
  console.log(`TOTAL AUDIT ASSERTIONS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('======================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runW3Verification();
