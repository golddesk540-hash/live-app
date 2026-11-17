/**
 * W5 VERIFICATION SUITE — ADMIN STAYS ON WEB, ONLY STAFF CAN OPEN IT
 *
 * Verifies:
 * 1. TEST A — Logged-out access to /admin, /admin/gifts, /admin/finance, /staff redirects to /login.
 * 2. TEST B — Normal member access to /admin, /admin/gifts, /admin/finance, /staff redirects to /login.
 * 3. TEST C — Authorized Staff member access to /admin, /admin/gifts, /admin/finance, /staff returns HTTP 200.
 * 4. TEST D — Authorized Admin member access to /admin, /admin/gifts, /admin/finance, /staff returns HTTP 200.
 * 5. TEST E — Invalid or expired session token redirects to /login.
 * 6. Public navigation: Admin link absent from header, footer, LIVE navigation, and profile.
 * 7. Preservation: Flutter mobile codebase and database migrations are 100% untouched.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');
const { Pool } = require('pg');

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

async function fetchRoute(urlPath, cookieHeader = '') {
  const headers = {};
  if (cookieHeader) headers['Cookie'] = cookieHeader;

  // Use redirect: 'manual' to capture 307 / 302 redirects
  const res = await fetch(`${baseUrl}${urlPath}`, {
    headers,
    redirect: 'manual',
  });

  return {
    status: res.status,
    location: res.headers.get('location'),
  };
}

async function runW5Verification() {
  console.log('======================================================================');
  console.log('🧪 RUNNING W5 ADMIN & STAFF AUTHORIZATION AUDIT SUITE');
  console.log('======================================================================\n');

  // Database connection for test user and session generation
  const pool = new Pool({
    connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  });

  try {
    // -------------------------------------------------------------------------
    // SECTION 1: Code Structure Inspection
    // -------------------------------------------------------------------------
    console.log('--- SECTION 1: Layout & Auth Verification ---');
    const adminLayoutPath = path.join(__dirname, 'app', 'admin', 'layout.tsx');
    assert(fs.existsSync(adminLayoutPath), 'apps/web/app/admin/layout.tsx exists');
    const adminLayoutContent = fs.readFileSync(adminLayoutPath, 'utf8');

    assert(
      adminLayoutContent.includes('validateSessionToken') && adminLayoutContent.includes('isStaffMember'),
      'Admin layout reuses validateSessionToken and isStaffMember from lib/auth'
    );
    assert(
      adminLayoutContent.includes("redirect('/login')"),
      'Admin layout redirects unauthorized users to /login'
    );
    assert(
      adminLayoutContent.includes("export const dynamic = 'force-dynamic'"),
      'Admin layout is dynamically evaluated (force-dynamic)'
    );

    const staffLayoutPath = path.join(__dirname, 'app', 'staff', 'layout.tsx');
    assert(fs.existsSync(staffLayoutPath), 'apps/web/app/staff/layout.tsx exists');
    const staffLayoutContent = fs.readFileSync(staffLayoutPath, 'utf8');

    assert(
      staffLayoutContent.includes('validateSessionToken') && staffLayoutContent.includes('isStaffMember'),
      'Staff layout reuses validateSessionToken and isStaffMember from lib/auth'
    );
    assert(
      staffLayoutContent.includes("redirect('/login')"),
      'Staff layout redirects unauthorized users to /login'
    );

    // -------------------------------------------------------------------------
    // SECTION 2: TEST A — LOGGED OUT
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 2: TEST A — LOGGED-OUT VISITORS ---');
    const adminRes = await fetchRoute('/admin');
    assert(
      adminRes.status === 307 && adminRes.location === '/login',
      'Logged out GET /admin redirects to /login (Status 307)'
    );

    const giftsRes = await fetchRoute('/admin/gifts');
    assert(
      giftsRes.status === 307 && giftsRes.location === '/login',
      'Logged out GET /admin/gifts redirects to /login (Status 307)'
    );

    const financeRes = await fetchRoute('/admin/finance');
    assert(
      financeRes.status === 307 && financeRes.location === '/login',
      'Logged out GET /admin/finance redirects to /login (Status 307)'
    );

    const staffRes = await fetchRoute('/staff');
    assert(
      staffRes.status === 307 && staffRes.location === '/login',
      'Logged out GET /staff redirects to /login (Status 307)'
    );

    // -------------------------------------------------------------------------
    // SECTION 3: TEST B — NORMAL MEMBER
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 3: TEST B — NORMAL USER ACCOUNT ---');
    const normalUserId = crypto.randomUUID();
    const normalPoppoId = String(Math.floor(1000000 + Math.random() * 9000000));
    const normalToken = 'token_normal_' + crypto.randomBytes(16).toString('hex');
    const expiresFuture = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Insert normal user (role='user', is_staff=false)
    await pool.query(
      `INSERT INTO popolive.users (id, poppo_id, email, nickname, avatar_url, gender, status, is_adult_verified, role, is_staff)
       VALUES ($1, $2, $3, $4, '/avatars/default.png', 'male', 'active', true, 'user', false)
       ON CONFLICT (id) DO UPDATE SET role = 'user', is_staff = false`,
      [normalUserId, normalPoppoId, `user_${normalPoppoId}@test.com`, 'NormalUser']
    );

    // Insert valid session for normal user
    await pool.query(
      `INSERT INTO popolive.sessions (user_id, session_token, expires_at, is_revoked)
       VALUES ($1, $2, $3, false)`,
      [normalUserId, normalToken, expiresFuture]
    );

    const normalCookie = `poppo_session=${normalToken}`;

    const normalAdminRes = await fetchRoute('/admin', normalCookie);
    assert(
      normalAdminRes.status === 307 && normalAdminRes.location === '/login',
      'Normal user GET /admin redirects to /login (Access Denied)'
    );

    const normalGiftsRes = await fetchRoute('/admin/gifts', normalCookie);
    assert(
      normalGiftsRes.status === 307 && normalGiftsRes.location === '/login',
      'Normal user GET /admin/gifts redirects to /login (Access Denied)'
    );

    const normalFinanceRes = await fetchRoute('/admin/finance', normalCookie);
    assert(
      normalFinanceRes.status === 307 && normalFinanceRes.location === '/login',
      'Normal user GET /admin/finance redirects to /login (Access Denied)'
    );

    const normalStaffRes = await fetchRoute('/staff', normalCookie);
    assert(
      normalStaffRes.status === 307 && normalStaffRes.location === '/login',
      'Normal user GET /staff redirects to /login (Access Denied)'
    );

    // -------------------------------------------------------------------------
    // SECTION 4: TEST C — AUTHORIZED STAFF MEMBER
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 4: TEST C — AUTHORIZED STAFF ACCOUNT ---');
    const staffUserId = crypto.randomUUID();
    const staffPoppoId = String(Math.floor(1000000 + Math.random() * 9000000));
    const staffToken = 'token_staff_' + crypto.randomBytes(16).toString('hex');

    // Insert staff user (role='staff', is_staff=true)
    await pool.query(
      `INSERT INTO popolive.users (id, poppo_id, email, nickname, avatar_url, gender, status, is_adult_verified, role, is_staff)
       VALUES ($1, $2, $3, $4, '/avatars/default.png', 'female', 'active', true, 'staff', true)
       ON CONFLICT (id) DO UPDATE SET role = 'staff', is_staff = true`,
      [staffUserId, staffPoppoId, `staff_${staffPoppoId}@test.com`, 'StaffUser']
    );

    await pool.query(
      `INSERT INTO popolive.sessions (user_id, session_token, expires_at, is_revoked)
       VALUES ($1, $2, $3, false)`,
      [staffUserId, staffToken, expiresFuture]
    );

    const staffCookie = `poppo_session=${staffToken}`;

    const authStaffAdmin = await fetchRoute('/admin', staffCookie);
    assert(
      authStaffAdmin.status === 200,
      'Authorized Staff GET /admin returns HTTP 200 (Access Granted)'
    );

    const authStaffGifts = await fetchRoute('/admin/gifts', staffCookie);
    assert(
      authStaffGifts.status === 200,
      'Authorized Staff GET /admin/gifts returns HTTP 200 (Access Granted)'
    );

    const authStaffFinance = await fetchRoute('/admin/finance', staffCookie);
    assert(
      authStaffFinance.status === 200,
      'Authorized Staff GET /admin/finance returns HTTP 200 (Access Granted)'
    );

    const authStaffStaff = await fetchRoute('/staff', staffCookie);
    assert(
      authStaffStaff.status === 200,
      'Authorized Staff GET /staff returns HTTP 200 (Access Granted)'
    );

    // -------------------------------------------------------------------------
    // SECTION 5: TEST D — AUTHORIZED ADMIN ACCOUNT
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 5: TEST D — AUTHORIZED ADMIN ACCOUNT ---');
    const adminUserId = crypto.randomUUID();
    const adminPoppoId = String(Math.floor(1000000 + Math.random() * 9000000));
    const adminToken = 'token_admin_' + crypto.randomBytes(16).toString('hex');

    // Insert admin user (role='admin')
    await pool.query(
      `INSERT INTO popolive.users (id, poppo_id, email, nickname, avatar_url, gender, status, is_adult_verified, role, is_staff)
       VALUES ($1, $2, $3, $4, '/avatars/default.png', 'male', 'active', true, 'admin', true)
       ON CONFLICT (id) DO UPDATE SET role = 'admin', is_staff = true`,
      [adminUserId, adminPoppoId, `admin_${adminPoppoId}@test.com`, 'SuperAdmin']
    );

    await pool.query(
      `INSERT INTO popolive.sessions (user_id, session_token, expires_at, is_revoked)
       VALUES ($1, $2, $3, false)`,
      [adminUserId, adminToken, expiresFuture]
    );

    const adminCookie = `poppo_session=${adminToken}`;

    const authAdminAdmin = await fetchRoute('/admin', adminCookie);
    assert(
      authAdminAdmin.status === 200,
      'Authorized Admin GET /admin returns HTTP 200 (Access Granted)'
    );

    const authAdminGifts = await fetchRoute('/admin/gifts', adminCookie);
    assert(
      authAdminGifts.status === 200,
      'Authorized Admin GET /admin/gifts returns HTTP 200 (Access Granted)'
    );

    const authAdminFinance = await fetchRoute('/admin/finance', adminCookie);
    assert(
      authAdminFinance.status === 200,
      'Authorized Admin GET /admin/finance returns HTTP 200 (Access Granted)'
    );

    const authAdminStaff = await fetchRoute('/staff', adminCookie);
    assert(
      authAdminStaff.status === 200,
      'Authorized Admin GET /staff returns HTTP 200 (Access Granted)'
    );

    // -------------------------------------------------------------------------
    // SECTION 6: TEST E — INVALID AND EXPIRED SESSIONS
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 6: TEST E — INVALID & EXPIRED SESSIONS ---');
    const invalidCookie = 'poppo_session=invalid_fake_token_random_string_9999';
    const invalidAdmin = await fetchRoute('/admin', invalidCookie);
    assert(
      invalidAdmin.status === 307 && invalidAdmin.location === '/login',
      'Invalid session token GET /admin redirects to /login'
    );

    const expiredToken = 'token_expired_' + crypto.randomBytes(16).toString('hex');
    const expiresPast = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
    await pool.query(
      `INSERT INTO popolive.sessions (user_id, session_token, expires_at, is_revoked)
       VALUES ($1, $2, $3, false)`,
      [adminUserId, expiredToken, expiresPast]
    );

    const expiredCookie = `poppo_session=${expiredToken}`;
    const expiredAdmin = await fetchRoute('/admin', expiredCookie);
    assert(
      expiredAdmin.status === 307 && expiredAdmin.location === '/login',
      'Expired session token GET /admin redirects to /login'
    );

    // Clean up test data
    await pool.query('DELETE FROM popolive.sessions WHERE user_id IN ($1, $2, $3)', [normalUserId, staffUserId, adminUserId]);
    await pool.query('DELETE FROM popolive.users WHERE id IN ($1, $2, $3)', [normalUserId, staffUserId, adminUserId]);

    // -------------------------------------------------------------------------
    // SECTION 7: Public Navigation Audit
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 7: Public Navigation Security ---');
    const headerPath = path.join(__dirname, 'components', 'layout', 'Header.tsx');
    const headerContent = fs.readFileSync(headerPath, 'utf8');
    assert(!headerContent.includes('href="/admin"'), 'Public Header contains no Admin links');

    const footerPath = path.join(__dirname, 'components', 'layout', 'Footer.tsx');
    const footerContent = fs.readFileSync(footerPath, 'utf8');
    assert(!footerContent.includes('href="/admin"'), 'Public Footer contains no Admin links');

    const profilePath = path.join(__dirname, 'app', 'profile', 'page.tsx');
    const profileContent = fs.readFileSync(profilePath, 'utf8');
    assert(!profileContent.includes('href="/admin"'), 'Public Profile contains no Admin links');

    const discoveryPath = path.join(__dirname, 'components', 'discovery', 'DiscoveryShell.tsx');
    const discoveryContent = fs.readFileSync(discoveryPath, 'utf8');
    assert(!discoveryContent.includes('href="/admin"'), 'LIVE Discovery contains no Admin links');

    // -------------------------------------------------------------------------
    // SECTION 8: Strict Preservation Boundaries
    // -------------------------------------------------------------------------
    console.log('\n--- SECTION 8: Strict Preservation Boundaries ---');
    const gitDiffMobile = execSync('git diff --name-only apps/mobile', { encoding: 'utf8' }).trim();
    assert(gitDiffMobile === '', 'Mobile Flutter codebase is 100% untouched');

    const gitDiffDb = execSync('git diff --name-only apps/web/data/migrations', { encoding: 'utf8' }).trim();
    assert(gitDiffDb === '', 'Database migrations and schema are 100% untouched');

  } finally {
    await pool.end();
  }

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

runW5Verification().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
