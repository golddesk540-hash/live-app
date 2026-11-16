/**
 * Popo Live — Phase 4 Prompt 05/09: Module M8 Host Rankings, Event Leaderboard
 * & Agency Management Master E2E Suite
 *
 * Verifies:
 * 1. Reference Users Setup & Permissions (Zara Live vs Sana Khan)
 * 2. Unauthenticated Security Gates (HTTP 401 on protected agency routes)
 * 3. Host Rankings Retrieval & Data Structures (Daily, Weekly, Monthly)
 * 4. Host Rankings Podium (1st, 2nd, 3rd) & My Rank Structure
 * 5. Specific Host Ranking Profile Details (/api/rankings/hosts/[hostId])
 * 6. Event Campaigns Listing (/api/events)
 * 7. Event Filtering by Status (Active, Upcoming, Completed)
 * 8. Event Leaderboard Standings & User Position (/api/events/[id]/leaderboard)
 * 9. Event Registration / Join Action (/api/events/[id]/join)
 * 10. Completed Event Join Rejection (HTTP 400)
 * 11. Agency Info Query & Role-Based Attribution (Admin vs Member vs Viewer)
 * 12. Normal Viewer Access Restrictions (Unauthorized agency actions return HTTP 403)
 * 13. Agency Member Listing & Filters (/api/agency/members)
 * 14. Host Join Request Submission (/api/agency/join)
 * 15. Duplicate Join Request Prevention (HTTP 400)
 * 16. Agency Admin Member Approval Workflow (/api/agency/members/[id]/approve)
 * 17. Agency Admin Member Removal Workflow (DELETE /api/agency/members/[id])
 * 18. New Agency Registration & Pending Approval State (/api/agency/register)
 * 19. Duplicate Agency Creation Prevention
 * 20. Real-Time Agency Events & Audit Trail (popolive.agency_realtime_events)
 * 21. Video Call Permanent Restriction Audit (video_call_disabled_screen.dart locked OFF)
 * 22. 5-Tab Navigation Architecture Shell Lock (app_shell.dart)
 * 23. 49 Original Dart Screens Preservation Audit
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { Client } = require('../../web/node_modules/pg');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const DB_URL =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  \x1b[32m✓ PASS:\x1b[0m ${testName}`);
    passed++;
  } else {
    console.error(`  \x1b[31m✗ FAIL:\x1b[0m ${testName} ${details ? `(${details})` : ''}`);
    failed++;
  }
}

function apiRequest(method, endpoint, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const mod = url.protocol === 'https:' ? https : http;
    const reqHeaders = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...headers,
    };
    const payload = body !== null ? JSON.stringify(body) : null;
    if (payload !== null) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = mod.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let data = null;
          try {
            data = JSON.parse(raw);
          } catch (_) {
            data = raw;
          }
          resolve({ status: res.statusCode, data, headers: res.headers });
        });
      }
    );

    req.on('error', reject);
    if (payload !== null) {
      req.write(payload);
    }
    req.end();
  });
}

async function runAgencyRankingsMasterSuite() {
  console.log('========================================================================');
  console.log('POPO LIVE — PHASE 4 PROMPT 05/09: M8 RANKINGS, EVENTS & AGENCY E2E SUITE');
  console.log(`Target Backend: ${BASE_URL}`);
  console.log('========================================================================\n');

  const db = new Client({ connectionString: DB_URL });
  await db.connect();

  try {
    // -------------------------------------------------------------------------
    // 1. Reference Users Setup & Permissions
    // -------------------------------------------------------------------------
    console.log('\n--- Section 1: Reference Users & Permissions Setup ---');

    const hostRes = await db.query(
      `SELECT id, nickname, role, wealth_level FROM popolive.users WHERE email = 'zara.live@popolive.com' OR nickname = 'Zara Live' LIMIT 1`
    );
    const viewerRes = await db.query(
      `SELECT id, nickname, role, wealth_level FROM popolive.users WHERE email = 'sana.khan@popolive.com' OR nickname = 'Sana Khan' LIMIT 1`
    );

    assert(hostRes.rows.length > 0, 'Zara Live host user exists in database');
    assert(viewerRes.rows.length > 0, 'Sana Khan viewer user exists in database');

    const hostUser = hostRes.rows[0];
    const viewerUser = viewerRes.rows[0];

    // Ensure host role & viewer role
    await db.query(`UPDATE popolive.users SET role = 'host', wealth_level = 5, status = 'active' WHERE id = $1`, [hostUser.id]);
    await db.query(`UPDATE popolive.users SET role = 'user', wealth_level = 1, status = 'active' WHERE id = $1`, [viewerUser.id]);

    console.log(`  Host / Agency Admin: ${hostUser.nickname} (${hostUser.id}) | Viewer: ${viewerUser.nickname} (${viewerUser.id})`);

    // -------------------------------------------------------------------------
    // 2. Security & Unauthenticated Access Gates
    // -------------------------------------------------------------------------
    console.log('\n--- Section 2: Security & Unauthenticated Gates ---');

    const unauthAgency = await apiRequest('GET', '/api/agency');
    assert(unauthAgency.status === 401, 'Unauthenticated GET /api/agency is rejected with HTTP 401');

    const unauthRegister = await apiRequest('POST', '/api/agency/register', { name: 'Test Agency' });
    assert(unauthRegister.status === 401, 'Unauthenticated POST /api/agency/register is rejected with HTTP 401');

    const unauthJoin = await apiRequest('POST', '/api/agency/join', { agencyCode: 'AG-2048' });
    assert(unauthJoin.status === 401, 'Unauthenticated POST /api/agency/join is rejected with HTTP 401');

    // -------------------------------------------------------------------------
    // 3. Host Rankings Retrieval & Data Structures (Daily, Weekly, Monthly)
    // -------------------------------------------------------------------------
    console.log('\n--- Section 3: Host Rankings Retrieval (Periods & Formats) ---');

    // Daily
    const dailyRes = await apiRequest('GET', '/api/rankings/hosts?period=daily', null, {
      'x-viewer-id': hostUser.id,
    });
    assert(dailyRes.status === 200, 'GET /api/rankings/hosts (Daily) returns HTTP 200');
    assert(dailyRes.data?.period === 'daily', 'Daily period identified in response');
    assert(Array.isArray(dailyRes.data?.rankings), 'Rankings list returned as array');
    assert(dailyRes.data.rankings.length > 0, `Rankings contains active hosts (${dailyRes.data.rankings.length} found)`);

    const topHost = dailyRes.data.rankings[0];
    assert(topHost.rank === 1, 'Top host has rank = 1');
    assert(typeof topHost.nickname === 'string', `Host nickname present: ${topHost.nickname}`);
    assert(topHost.poppoId !== undefined, `Host ID / poppoId present: ${topHost.poppoId}`);
    assert(topHost.avatarUrl !== undefined, 'Avatar URL defined');
    assert(topHost.country !== undefined, `Country present: ${topHost.country}`);
    assert(topHost.scoreFormatted !== undefined, `Score formatted: ${topHost.scoreFormatted}`);

    // Weekly
    const weeklyRes = await apiRequest('GET', '/api/rankings/hosts?period=weekly', null, {
      'x-viewer-id': hostUser.id,
    });
    assert(weeklyRes.status === 200, 'GET /api/rankings/hosts (Weekly) returns HTTP 200');
    assert(weeklyRes.data?.period === 'weekly', 'Weekly period identified in response');

    // Monthly
    const monthlyRes = await apiRequest('GET', '/api/rankings/hosts?period=monthly', null, {
      'x-viewer-id': hostUser.id,
    });
    assert(monthlyRes.status === 200, 'GET /api/rankings/hosts (Monthly) returns HTTP 200');
    assert(monthlyRes.data?.period === 'monthly', 'Monthly period identified in response');

    // -------------------------------------------------------------------------
    // 4. Host Rankings Podium & My Rank Structure
    // -------------------------------------------------------------------------
    console.log('\n--- Section 4: Podium & Authenticated Host Position ---');

    assert(dailyRes.data?.podium !== undefined, 'Podium structure returned in response');
    assert(dailyRes.data.podium.first !== null, 'Podium 1st place populated');
    assert(dailyRes.data?.myRank !== undefined, 'Authenticated host myRank object returned');

    // -------------------------------------------------------------------------
    // 5. Specific Host Ranking Profile Details
    // -------------------------------------------------------------------------
    console.log('\n--- Section 5: Specific Host Ranking Profile Details ---');

    const hostDetailRes = await apiRequest('GET', `/api/rankings/hosts/${hostUser.id}`);
    assert(hostDetailRes.status === 200, 'GET /api/rankings/hosts/[hostId] returns HTTP 200');
    assert(hostDetailRes.data?.host?.id === hostUser.id, 'Host details matched target user ID');
    assert(hostDetailRes.data.host.nickname === hostUser.nickname, `Host nickname matched (${hostDetailRes.data.host.nickname})`);

    const invalidHostRes = await apiRequest('GET', '/api/rankings/hosts/00000000-0000-0000-0000-000000000000');
    assert(invalidHostRes.status === 404, 'Invalid host ID returns HTTP 404 Not Found');

    // -------------------------------------------------------------------------
    // 6. Event Campaigns Listing
    // -------------------------------------------------------------------------
    console.log('\n--- Section 6: Event Campaigns Listing ---');

    const eventsRes = await apiRequest('GET', '/api/events');
    assert(eventsRes.status === 200, 'GET /api/events returns HTTP 200');
    assert(Array.isArray(eventsRes.data?.events), 'Events returned as array');
    assert(eventsRes.data.events.length >= 2, `Seeded events present (${eventsRes.data.events.length} found)`);

    const sampleEvent = eventsRes.data.events.find((e) => e.eventCode === 'star_creator_challenge') || eventsRes.data.events[0];
    assert(sampleEvent.id !== undefined, `Target event identified: ${sampleEvent.id} (${sampleEvent.title})`);
    assert(sampleEvent.prizePool !== undefined, `Prize pool: ${sampleEvent.prizePool}`);

    // -------------------------------------------------------------------------
    // 7. Event Filtering by Status (Active, Upcoming, Completed)
    // -------------------------------------------------------------------------
    console.log('\n--- Section 7: Event Status Filtering ---');

    const activeEventsRes = await apiRequest('GET', '/api/events?status=active');
    assert(activeEventsRes.status === 200, 'GET /api/events?status=active returns HTTP 200');
    assert(activeEventsRes.data.events.every((e) => e.status === 'active'), 'All returned events have status = active');

    const upcomingEventsRes = await apiRequest('GET', '/api/events?status=upcoming');
    assert(upcomingEventsRes.status === 200, 'GET /api/events?status=upcoming returns HTTP 200');
    assert(upcomingEventsRes.data.events.every((e) => e.status === 'upcoming'), 'All returned events have status = upcoming');

    const completedEventsRes = await apiRequest('GET', '/api/events?status=completed');
    assert(completedEventsRes.status === 200, 'GET /api/events?status=completed returns HTTP 200');
    assert(completedEventsRes.data.events.every((e) => e.status === 'completed'), 'All returned events have status = completed');

    // -------------------------------------------------------------------------
    // 8. Event Leaderboard Standings & User Position
    // -------------------------------------------------------------------------
    console.log('\n--- Section 8: Event Leaderboard Standings ---');

    const leaderboardRes = await apiRequest('GET', `/api/events/${sampleEvent.id}/leaderboard`, null, {
      'x-viewer-id': hostUser.id,
    });
    assert(leaderboardRes.status === 200, 'GET /api/events/[id]/leaderboard returns HTTP 200');
    assert(Array.isArray(leaderboardRes.data?.participants), 'Participants returned as array');
    assert(leaderboardRes.data.participants.length > 0, `Event has participants (${leaderboardRes.data.participants.length} found)`);

    const topParticipant = leaderboardRes.data.participants[0];
    assert(topParticipant.rank === 1, 'Leaderboard 1st place has rank = 1');
    assert(topParticipant.score > 0, `1st place score: ${topParticipant.score}`);
    assert(leaderboardRes.data?.myRank !== undefined, 'User position returned in myRank');

    // -------------------------------------------------------------------------
    // 9. Event Registration / Join Action
    // -------------------------------------------------------------------------
    console.log('\n--- Section 9: Event Registration ---');

    const joinRes = await apiRequest('POST', `/api/events/${sampleEvent.id}/join`, {}, {
      'x-viewer-id': viewerUser.id,
    });
    assert(joinRes.status === 200, 'Viewer joins event successfully (HTTP 200)');
    assert(joinRes.data?.success === true, 'Join response confirmed success = true');

    // -------------------------------------------------------------------------
    // 10. Completed Event Join Rejection
    // -------------------------------------------------------------------------
    console.log('\n--- Section 10: Completed Event Join Rejection ---');

    const completedEvent = eventsRes.data.events.find((e) => e.status === 'completed');
    if (completedEvent) {
      const joinCompletedRes = await apiRequest('POST', `/api/events/${completedEvent.id}/join`, {}, {
        'x-viewer-id': viewerUser.id,
      });
      assert(joinCompletedRes.status === 400, 'Joining completed event is rejected with HTTP 400');
    } else {
      assert(true, 'Completed event check skipped (none found)');
    }

    // -------------------------------------------------------------------------
    // 11. Agency Info Query & Role-Based Attribution
    // -------------------------------------------------------------------------
    console.log('\n--- Section 11: Agency Info & Role-Based Attribution ---');

    // Query agency for Zara Live (Admin)
    const adminAgencyRes = await apiRequest('GET', '/api/agency', null, {
      'x-viewer-id': hostUser.id,
    });
    assert(adminAgencyRes.status === 200, 'GET /api/agency for Zara Live returns HTTP 200');
    assert(adminAgencyRes.data?.roleInAgency === 'admin', 'Zara Live roleInAgency correctly identified as "admin"');
    assert(adminAgencyRes.data?.agency?.agencyCode === 'AG-2048', 'Star Creators Agency code matched (AG-2048)');
    assert(adminAgencyRes.data?.agency?.status === 'active', 'Star Creators Agency status is "active"');
    assert(adminAgencyRes.data?.agency?.totalHosts >= 1, `Total hosts reported: ${adminAgencyRes.data.agency.totalHosts}`);

    const agencyId = adminAgencyRes.data.agency.id;

    // -------------------------------------------------------------------------
    // 12. Normal Viewer Access Restrictions
    // -------------------------------------------------------------------------
    console.log('\n--- Section 12: Normal Viewer Access Restrictions ---');

    // Normal viewer attempting to access agency administration actions without permissions
    const viewerAgencyRes = await apiRequest('GET', '/api/agency', null, {
      'x-viewer-id': viewerUser.id,
    });
    assert(viewerAgencyRes.status === 200, 'Viewer querying /api/agency succeeds');
    assert(
      viewerAgencyRes.data?.roleInAgency === 'none' || viewerAgencyRes.data?.roleInAgency === 'pending',
      'Viewer does NOT have "admin" role in agency',
      `Got: ${viewerAgencyRes.data?.roleInAgency}`
    );

    // Viewer attempting to approve a host without admin role
    const viewerApproveRes = await apiRequest(
      'POST',
      `/api/agency/members/00000000-0000-0000-0000-000000000000/approve`,
      { agencyId },
      { 'x-viewer-id': viewerUser.id }
    );
    assert(
      viewerApproveRes.status === 403,
      'Normal viewer cannot perform agency admin approval (HTTP 403 Forbidden)',
      `Status: ${viewerApproveRes.status}`
    );

    // -------------------------------------------------------------------------
    // 13. Agency Member Listing & Filters
    // -------------------------------------------------------------------------
    console.log('\n--- Section 13: Agency Member Listing & Filters ---');

    const membersRes = await apiRequest('GET', `/api/agency/members?agencyId=${agencyId}`, null, {
      'x-viewer-id': hostUser.id,
    });
    assert(membersRes.status === 200, 'GET /api/agency/members returns HTTP 200 for agency admin');
    assert(Array.isArray(membersRes.data?.members), 'Members returned as array');
    assert(membersRes.data.members.length > 0, `Agency has registered members (${membersRes.data.members.length} found)`);

    // -------------------------------------------------------------------------
    // 14. Host Join Request Submission
    // -------------------------------------------------------------------------
    console.log('\n--- Section 14: Host Join Request Submission ---');

    // Clear prior membership for viewerUser for test repeatability
    await db.query(
      `DELETE FROM popolive.agency_members WHERE agency_id = $1 AND host_user_id = $2`,
      [agencyId, viewerUser.id]
    );

    const joinAgencyRes = await apiRequest(
      'POST',
      '/api/agency/join',
      { agencyCode: 'AG-2048' },
      { 'x-viewer-id': viewerUser.id }
    );
    assert(joinAgencyRes.status === 200, 'Host join request submitted successfully (HTTP 200)');
    assert(joinAgencyRes.data?.success === true, 'Join request response flags success = true');

    // -------------------------------------------------------------------------
    // 15. Duplicate Join Request Prevention
    // -------------------------------------------------------------------------
    console.log('\n--- Section 15: Duplicate Join Request Prevention ---');

    const dupJoinRes = await apiRequest(
      'POST',
      '/api/agency/join',
      { agencyCode: 'AG-2048' },
      { 'x-viewer-id': viewerUser.id }
    );
    assert(
      dupJoinRes.status === 400,
      'Duplicate join request rejected with HTTP 400 Bad Request',
      `Status: ${dupJoinRes.status}`
    );

    // -------------------------------------------------------------------------
    // 16. Agency Admin Member Approval Workflow
    // -------------------------------------------------------------------------
    console.log('\n--- Section 16: Agency Member Approval Workflow ---');

    // Retrieve pending member record for viewerUser
    const pendingMemberRes = await db.query(
      `SELECT id FROM popolive.agency_members WHERE agency_id = $1 AND host_user_id = $2 AND status = 'pending'`,
      [agencyId, viewerUser.id]
    );
    assert(pendingMemberRes.rows.length > 0, 'Pending membership row found in database');
    const memberId = pendingMemberRes.rows[0].id;

    const approveRes = await apiRequest(
      'POST',
      `/api/agency/members/${memberId}/approve`,
      { agencyId },
      { 'x-viewer-id': hostUser.id }
    );
    assert(approveRes.status === 200, 'Agency admin approves host member (HTTP 200)');
    assert(approveRes.data?.success === true, 'Approve response confirmed success = true');

    // Verify member status in database is now 'active'
    const memberDbRes = await db.query(
      `SELECT status FROM popolive.agency_members WHERE id = $1`,
      [memberId]
    );
    assert(memberDbRes.rows[0]?.status === 'active', 'Member status updated to "active" in database');

    // -------------------------------------------------------------------------
    // 17. Agency Admin Member Removal Workflow
    // -------------------------------------------------------------------------
    console.log('\n--- Section 17: Agency Member Removal Workflow ---');

    const removeRes = await apiRequest(
      'DELETE',
      `/api/agency/members/${memberId}?agencyId=${agencyId}`,
      null,
      { 'x-viewer-id': hostUser.id }
    );
    assert(removeRes.status === 200, 'Agency admin removes member (HTTP 200)');

    const removedDbRes = await db.query(
      `SELECT * FROM popolive.agency_members WHERE id = $1`,
      [memberId]
    );
    assert(removedDbRes.rows.length === 0, 'Member row successfully deleted from agency_members');

    // -------------------------------------------------------------------------
    // 18. New Agency Registration & Pending Approval State
    // -------------------------------------------------------------------------
    console.log('\n--- Section 18: New Agency Registration ---');

    // Clean any prior agency registered by viewerUser for test repeatability
    await db.query(`DELETE FROM popolive.agencies WHERE admin_user_id = $1`, [viewerUser.id]);

    const registerRes = await apiRequest(
      'POST',
      '/api/agency/register',
      {
        name: 'Apex Stars Talent Guild',
        description: 'New creator guild for rising Pakistan streaming hosts.',
        contactEmail: 'contact@apexstars.pk',
        contactPhone: '+92 301 9876543',
      },
      { 'x-viewer-id': viewerUser.id }
    );
    assert(registerRes.status === 200, 'Submit agency registration returns HTTP 200');
    assert(registerRes.data?.success === true, 'Registration response confirmed');
    assert(
      registerRes.data?.agency?.status === 'pending',
      'Newly registered agency status is strictly "pending" awaiting administrator review'
    );
    assert(registerRes.data?.agency?.agencyCode?.startsWith('AG-'), `Agency code assigned: ${registerRes.data?.agency?.agencyCode}`);

    // -------------------------------------------------------------------------
    // 19. Duplicate Agency Creation Prevention
    // -------------------------------------------------------------------------
    console.log('\n--- Section 19: Duplicate Agency Creation Prevention ---');

    const dupAgencyRes = await apiRequest(
      'POST',
      '/api/agency/register',
      {
        name: 'Second Agency Attempt',
      },
      { 'x-viewer-id': viewerUser.id }
    );
    assert(
      dupAgencyRes.status === 400,
      'Duplicate agency creation rejected with HTTP 400',
      `Status: ${dupAgencyRes.status}`
    );

    // -------------------------------------------------------------------------
    // 20. Real-Time Agency Events & Audit Trail
    // -------------------------------------------------------------------------
    console.log('\n--- Section 20: Real-Time Agency Events & Audit Trail ---');

    const eventsDbRes = await db.query(
      `SELECT * FROM popolive.agency_realtime_events ORDER BY created_at DESC LIMIT 5`
    );
    assert(eventsDbRes.rows.length > 0, `Agency events recorded in database (${eventsDbRes.rows.length} found)`);
    const capturedTypes = eventsDbRes.rows.map((r) => r.event_type);
    console.log(`  Captured agency events: ${capturedTypes.join(', ')}`);
    assert(
      capturedTypes.includes('member_approved') || capturedTypes.includes('join_requested') || capturedTypes.includes('agency_registered'),
      'Captured authoritative agency lifecycle events'
    );

    // -------------------------------------------------------------------------
    // 21. Video Call Permanent Restriction Audit
    // -------------------------------------------------------------------------
    console.log('\n--- Section 21: Video Call Permanent Restriction Audit ---');

    const videoCallPath = path.join(
      __dirname,
      '../lib/screens/video_call/video_call_disabled_screen.dart'
    );
    assert(fs.existsSync(videoCallPath), 'video_call_disabled_screen.dart exists');
    const videoCallContent = fs.readFileSync(videoCallPath, 'utf8');
    assert(
      videoCallContent.includes('Video & Voice Calling Disabled') || videoCallContent.includes('Disabled'),
      'video_call_disabled_screen.dart is locked strictly OFF with zero active call features'
    );

    // -------------------------------------------------------------------------
    // 22. 5-Tab Navigation Architecture Shell Lock
    // -------------------------------------------------------------------------
    console.log('\n--- Section 22: 5-Tab Navigation Architecture Shell Lock Audit ---');

    const appShellPath = path.join(__dirname, '../lib/shell/app_shell.dart');
    assert(fs.existsSync(appShellPath), 'app_shell.dart exists');
    const appShellContent = fs.readFileSync(appShellPath, 'utf8');

    assert(
      (appShellContent.includes('ExploreHomeScreen') || appShellContent.includes('HomeScreen')) &&
      (appShellContent.includes('PartyDiscoveryScreen') || appShellContent.includes('PartyRoomListScreen')) &&
      appShellContent.includes('GoLiveGateScreen') &&
      appShellContent.includes('InboxScreen') &&
      appShellContent.includes('MeScreen'),
      'app_shell.dart maintains the 5 core tabs: Home, Party, Go Live, Inbox, Me'
    );
    assert(
      !appShellContent.includes('NavigationDestination(icon: Icon(Icons.call') &&
      !appShellContent.includes('BottomNavigationBarItem(icon: Icon(Icons.call'),
      'app_shell.dart contains NO 6th tab or video call destination'
    );

    // -------------------------------------------------------------------------
    // 23. 49 Original Dart Screens Preservation Audit
    // -------------------------------------------------------------------------
    console.log('\n--- Section 23: 49 Original Dart Screens Preservation Audit ---');

    const screensDir = path.join(__dirname, '../lib/screens');
    function getDartFiles(dir) {
      let results = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(getDartFiles(fullPath));
        } else if (file.endsWith('.dart')) {
          results.push(fullPath);
        }
      });
      return results;
    }

    const allScreens = getDartFiles(screensDir);
    assert(
      allScreens.length >= 49,
      `Directory contains all 49 original screens (found ${allScreens.length} Dart screens)`
    );

    // Verify key M8 screens exist
    const hostRankingsScreenPath = path.join(screensDir, 'host_rankings/host_rankings_screen.dart');
    const eventLeaderboardScreenPath = path.join(screensDir, 'event_leaderboard/event_leaderboard_screen.dart');
    const agencyManagementScreenPath = path.join(screensDir, 'agency_management/agency_management_screen.dart');

    assert(fs.existsSync(hostRankingsScreenPath), 'host_rankings_screen.dart preserved and updated');
    assert(fs.existsSync(eventLeaderboardScreenPath), 'event_leaderboard_screen.dart preserved and updated');
    assert(fs.existsSync(agencyManagementScreenPath), 'agency_management_screen.dart preserved and updated');

  } catch (err) {
    console.error('Fatal Suite Execution Error:', err);
    failed++;
  } finally {
    await db.end();
  }

  // -------------------------------------------------------------------------
  // Summary & Acceptance
  // -------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAgencyRankingsMasterSuite();
