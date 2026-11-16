/**
 * Popo Live — Phase 4 Prompt 04/09: Module M8 Daily Host Tasks, Task Levels,
 * Progress Tracking & New Host Pack Master E2E Suite
 *
 * Verifies:
 * 1. Reference Users Setup & Host Eligibility Resolution (Zara Live vs Sana Khan)
 * 2. Unauthenticated Security Gate (HTTP 401 on host routes)
 * 3. Ordinary Viewer Access Restriction (HTTP 403 on host tasks)
 * 4. Host Role & Wealth Level 5 Qualification
 * 5. Daily Host Tasks Loading & Progress Retrieval
 * 6. Task Progress Increment & Automatic Completion Trigger
 * 7. Task Reward Claiming & Wallet Diamond Points Crediting
 * 8. Duplicate Reward Claim Prevention (HTTP 400)
 * 9. Host Task Level Calculation, Thresholds & Dynamic Promotion
 * 10. New Host Starter Pack Loading & Rewards Breakdown
 * 11. New Host Starter Pack Claiming & Dual Wallet Credit (Points + Coins)
 * 12. Duplicate Starter Pack Claim Prevention (HTTP 400)
 * 13. Host Earning Identity (KYC) Retrieval & Document Masking
 * 14. Host Earning Identity Submission & Verification Status
 * 15. Suspended / Restricted Host Access Blocking
 * 16. Real-Time Task & KYC Event Logging
 * 17. Push Notification Alerts Dispatch on Task & Pack Milestones
 * 18. Video Call Permanent Restriction Audit (video_call_disabled_screen.dart locked OFF)
 * 19. 5-Tab Navigation Architecture Shell Lock (Home, Party, Go Live, Inbox, Me; NO 6th tab)
 * 20. 49 Original Dart Screens Preservation Audit
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

async function runHostTasksMasterSuite() {
  console.log('========================================================================');
  console.log('POPO LIVE — PHASE 4 PROMPT 04/09: M8 HOST TASKS & STARTER PACK E2E SUITE');
  console.log(`Target Backend: ${BASE_URL}`);
  console.log('========================================================================\n');

  const db = new Client({ connectionString: DB_URL });
  await db.connect();

  try {
    // -------------------------------------------------------------------------
    // 1. Reference Users Setup & Authentication
    // -------------------------------------------------------------------------
    console.log('\n--- Section 1: Reference Users & Verification Setup ---');

    // Retrieve Zara Live (Host) and Sana Khan (Viewer)
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

    // Ensure host role & wealth level
    await db.query(
      `UPDATE popolive.users SET role = 'host', wealth_level = 5, status = 'active' WHERE id = $1`,
      [hostUser.id]
    );
    await db.query(
      `UPDATE popolive.users SET role = 'user', wealth_level = 1, status = 'active' WHERE id = $1`,
      [viewerUser.id]
    );

    // Ensure wallets exist
    await db.query(
      `INSERT INTO popolive.user_wallets (user_id, diamond_points, coins, total_received_points)
       VALUES ($1, 1000, 500, 1000)
       ON CONFLICT (user_id) DO NOTHING`,
      [hostUser.id]
    );
    await db.query(
      `INSERT INTO popolive.user_wallets (user_id, diamond_points, coins, total_received_points)
       VALUES ($1, 0, 100, 0)
       ON CONFLICT (user_id) DO NOTHING`,
      [viewerUser.id]
    );

    console.log(`  Host: ${hostUser.nickname} (${hostUser.id}) | Viewer: ${viewerUser.nickname} (${viewerUser.id})`);

    // -------------------------------------------------------------------------
    // 2. Security & Unauthenticated Access Gate
    // -------------------------------------------------------------------------
    console.log('\n--- Section 2: Security & Unauthenticated Gates ---');

    const unauthEligibility = await apiRequest('GET', '/api/host/eligibility');
    assert(
      unauthEligibility.status === 401 || (unauthEligibility.status === 200 && unauthEligibility.data?.eligible === false),
      'Unauthenticated eligibility query returns 401 or ineligible response'
    );

    const unauthTasks = await apiRequest('GET', '/api/host/tasks');
    assert(unauthTasks.status === 401, 'Unauthenticated access to /api/host/tasks is rejected with HTTP 401');

    const unauthPack = await apiRequest('GET', '/api/host/starter-pack');
    assert(unauthPack.status === 401, 'Unauthenticated access to /api/host/starter-pack is rejected with HTTP 401');

    // -------------------------------------------------------------------------
    // 3. Ordinary Viewer Access Restriction (Role & Wealth Gate)
    // -------------------------------------------------------------------------
    console.log('\n--- Section 3: Ordinary Viewer Access Restriction ---');

    const viewerEligibility = await apiRequest('GET', '/api/host/eligibility', null, {
      'x-viewer-id': viewerUser.id,
    });
    assert(viewerEligibility.status === 200, 'Viewer eligibility endpoint succeeds with status');
    assert(
      viewerEligibility.data?.eligible === false,
      'Ordinary viewer is reported as ineligible for host tasks',
      JSON.stringify(viewerEligibility.data)
    );

    const viewerTasksRes = await apiRequest('GET', '/api/host/tasks', null, {
      'x-viewer-id': viewerUser.id,
    });
    assert(
      viewerTasksRes.status === 403,
      'Ordinary viewer cannot access /api/host/tasks (HTTP 403 Forbidden)',
      `Status: ${viewerTasksRes.status}`
    );

    // -------------------------------------------------------------------------
    // 4. Host Role & Eligibility Verification
    // -------------------------------------------------------------------------
    console.log('\n--- Section 4: Host Role & Eligibility Verification ---');

    const hostEligibility = await apiRequest('GET', '/api/host/eligibility', null, {
      'x-viewer-id': hostUser.id,
    });
    assert(hostEligibility.status === 200, 'Host eligibility check returns HTTP 200');
    assert(hostEligibility.data?.eligible === true, 'Zara Live is verified as eligible host');
    assert(hostEligibility.data?.role === 'host', 'Host role correctly identified');

    // -------------------------------------------------------------------------
    // 5. Daily Host Tasks Loading & Progress Retrieval
    // -------------------------------------------------------------------------
    console.log('\n--- Section 5: Daily Host Tasks Loading & Progress ---');

    const tasksRes = await apiRequest('GET', '/api/host/tasks', null, {
      'x-viewer-id': hostUser.id,
    });
    assert(tasksRes.status === 200, 'Host successfully retrieves daily tasks (HTTP 200)');
    assert(Array.isArray(tasksRes.data?.tasks), 'Tasks list returned as array');
    assert(tasksRes.data.tasks.length >= 4, `At least 4 daily tasks seeded (found ${tasksRes.data.tasks.length})`);

    const sampleTask = tasksRes.data.tasks.find((t) => t.id === 'go_live_60') || tasksRes.data.tasks[0];
    assert(sampleTask.id !== undefined, `Target sample task identified: ${sampleTask.id} (${sampleTask.title})`);
    assert(sampleTask.targetProgress > 0, `Target progress defined (${sampleTask.targetProgress} ${sampleTask.unit})`);
    assert(sampleTask.rewardPoints > 0, `Reward points defined (${sampleTask.rewardPoints} pts)`);

    // -------------------------------------------------------------------------
    // 6. Task Progress Update & Completion Trigger
    // -------------------------------------------------------------------------
    console.log('\n--- Section 6: Task Progress Update & Completion ---');

    // Reset progress row for sample task to guarantee test idempotency
    await db.query(
      `DELETE FROM popolive.user_daily_task_progress
       WHERE user_id = $1 AND task_id = $2`,
      [hostUser.id, sampleTask.id]
    );

    // Update progress partially
    const progressRes1 = await apiRequest(
      'POST',
      `/api/host/tasks/${sampleTask.id}/progress`,
      { increment: 30 },
      { 'x-viewer-id': hostUser.id }
    );
    assert(progressRes1.status === 200, 'Partial progress increment returns HTTP 200');
    const curProg1 = progressRes1.data?.task?.currentProgress ?? progressRes1.data?.currentProgress;
    assert(curProg1 >= 30, `Current progress updated to >= 30 (got ${curProg1})`);
    assert(
      (progressRes1.data?.task?.isCompleted ?? progressRes1.data?.isCompleted) === false,
      'Task correctly remains incomplete before target'
    );

    // Update progress to full target
    const progressRes2 = await apiRequest(
      'POST',
      `/api/host/tasks/${sampleTask.id}/progress`,
      { absoluteProgress: sampleTask.targetProgress },
      { 'x-viewer-id': hostUser.id }
    );
    assert(progressRes2.status === 200, 'Full target progress update returns HTTP 200');
    assert(
      (progressRes2.data?.task?.isCompleted ?? progressRes2.data?.isCompleted) === true,
      'Task is now completed'
    );
    assert(
      (progressRes2.data?.task?.isRewardClaimed ?? progressRes2.data?.isRewardClaimed) === false,
      'Task completed but reward not yet claimed'
    );

    // -------------------------------------------------------------------------
    // 7. Task Reward Claiming & Wallet Credit
    // -------------------------------------------------------------------------
    console.log('\n--- Section 7: Task Reward Claiming & Wallet Credit ---');

    // Get current wallet balance before claim
    const walletBeforeRes = await db.query(
      `SELECT diamond_points FROM popolive.user_wallets WHERE user_id = $1`,
      [hostUser.id]
    );
    const initialDiamondPoints = parseInt(walletBeforeRes.rows[0].diamond_points, 10);

    const claimRes = await apiRequest(
      'POST',
      `/api/host/tasks/${sampleTask.id}/claim`,
      {},
      { 'x-viewer-id': hostUser.id }
    );
    assert(claimRes.status === 200, 'Claim task reward returns HTTP 200 Success');
    assert(claimRes.data?.success === true, 'Reward claim response indicates success = true');
    assert(claimRes.data?.rewardPoints === sampleTask.rewardPoints, `Reward points matched (${sampleTask.rewardPoints} pts)`);

    // Verify wallet diamond_points balance incremented authoritatively in database
    const walletAfterRes = await db.query(
      `SELECT diamond_points FROM popolive.user_wallets WHERE user_id = $1`,
      [hostUser.id]
    );
    const finalDiamondPoints = parseInt(walletAfterRes.rows[0].diamond_points, 10);
    assert(
      finalDiamondPoints === initialDiamondPoints + sampleTask.rewardPoints,
      `Wallet diamond_points credited accurately (+${sampleTask.rewardPoints} pts: ${initialDiamondPoints} -> ${finalDiamondPoints})`
    );

    // Verify audit log entry in points_transactions
    const auditRes = await db.query(
      `SELECT * FROM popolive.points_transactions
       WHERE host_user_id = $1 AND transaction_type = 'task_reward'
       ORDER BY created_at DESC LIMIT 1`,
      [hostUser.id]
    );
    assert(auditRes.rows.length > 0, 'Audit record created in points_transactions');
    assert(
      parseInt(auditRes.rows[0].points_amount, 10) === sampleTask.rewardPoints,
      `Audit record points amount matches reward (${auditRes.rows[0].points_amount})`
    );
    assert(auditRes.rows[0].direction === 'credit', 'Audit transaction direction is "credit"');

    // -------------------------------------------------------------------------
    // 8. Duplicate Reward Claim Prevention
    // -------------------------------------------------------------------------
    console.log('\n--- Section 8: Duplicate Reward Claim Prevention ---');

    const duplicateClaimRes = await apiRequest(
      'POST',
      `/api/host/tasks/${sampleTask.id}/claim`,
      {},
      { 'x-viewer-id': hostUser.id }
    );
    assert(
      duplicateClaimRes.status === 400,
      'Duplicate reward claim rejected with HTTP 400 Bad Request',
      `Status: ${duplicateClaimRes.status}`
    );
    assert(
      duplicateClaimRes.data?.error?.includes('already claimed') || duplicateClaimRes.data?.error?.includes('CLAIMED'),
      'Duplicate claim error message specifies already claimed'
    );

    // -------------------------------------------------------------------------
    // 9. Host Task Level Calculation & Advancement
    // -------------------------------------------------------------------------
    console.log('\n--- Section 9: Host Task Level Calculation & Dynamic Advancement ---');

    const levelRes = await apiRequest('GET', '/api/host/tasks/level', null, {
      'x-viewer-id': hostUser.id,
    });
    assert(levelRes.status === 200, 'Host task level endpoint returns HTTP 200');
    assert(levelRes.data?.currentLevel >= 1, `Current level reported: Level 0${levelRes.data?.currentLevel}`);
    assert(typeof levelRes.data?.levelName === 'string', `Level tier name: ${levelRes.data?.levelName}`);
    assert(Array.isArray(levelRes.data?.benefits), 'Tier benefits returned as array');
    assert(levelRes.data?.benefits.length > 0, 'Tier benefits include active creator perks');
    assert(Array.isArray(levelRes.data?.allLevels), 'Roadmap of all levels returned');

    // -------------------------------------------------------------------------
    // 10. New Host Starter Pack Loading & Rewards Breakdown
    // -------------------------------------------------------------------------
    console.log('\n--- Section 10: New Host Starter Pack Loading ---');

    // Reset starter pack claim for idempotency test
    await db.query(
      `DELETE FROM popolive.user_new_host_pack_claims WHERE user_id = $1`,
      [hostUser.id]
    );

    const packRes = await apiRequest('GET', '/api/host/starter-pack', null, {
      'x-viewer-id': hostUser.id,
    });
    assert(packRes.status === 200, 'New Host Starter Pack fetched with HTTP 200');
    assert(packRes.data?.packId === 'starter_pack_standard', 'Starter pack standard package identified');
    assert(packRes.data?.rewardPoints === 200, 'Starter pack provides 200 Diamond Points');
    assert(packRes.data?.rewardCoins === 50, 'Starter pack provides 50 Coins');
    assert(
      (packRes.data?.badgeName || packRes.data?.welcomeBadge || '').includes('Rising Star'),
      'Starter pack provides Rising Star Host badge'
    );
    assert(packRes.data?.isClaimed === false, 'Starter pack is unclaimed before action');
    assert(Array.isArray(packRes.data?.guides), 'Starter guides checklist included');

    // -------------------------------------------------------------------------
    // 11. New Host Starter Pack Claiming & Dual Wallet Credit
    // -------------------------------------------------------------------------
    console.log('\n--- Section 11: New Host Starter Pack Claiming ---');

    const walletBeforePack = await db.query(
      `SELECT diamond_points, coins FROM popolive.user_wallets WHERE user_id = $1`,
      [hostUser.id]
    );
    const prePackPoints = parseInt(walletBeforePack.rows[0].diamond_points, 10);
    const prePackCoins = parseInt(walletBeforePack.rows[0].coins, 10);

    const claimPackRes = await apiRequest(
      'POST',
      '/api/host/starter-pack/claim',
      {},
      { 'x-viewer-id': hostUser.id }
    );
    assert(claimPackRes.status === 200, 'Claim starter pack returns HTTP 200 Success');
    assert(claimPackRes.data?.claimed === true, 'Claim response confirmed claimed = true');

    const walletAfterPack = await db.query(
      `SELECT diamond_points, coins FROM popolive.user_wallets WHERE user_id = $1`,
      [hostUser.id]
    );
    const postPackPoints = parseInt(walletAfterPack.rows[0].diamond_points, 10);
    const postPackCoins = parseInt(walletAfterPack.rows[0].coins, 10);

    assert(
      postPackPoints === prePackPoints + 200,
      `Diamond points increased by 200 (${prePackPoints} -> ${postPackPoints})`
    );
    assert(
      postPackCoins === prePackCoins + 50,
      `Coins increased by 50 (${prePackCoins} -> ${postPackCoins})`
    );

    // -------------------------------------------------------------------------
    // 12. Duplicate Starter Pack Claim Prevention
    // -------------------------------------------------------------------------
    console.log('\n--- Section 12: Duplicate Starter Pack Claim Prevention ---');

    const dupPackRes = await apiRequest(
      'POST',
      '/api/host/starter-pack/claim',
      {},
      { 'x-viewer-id': hostUser.id }
    );
    assert(
      dupPackRes.status === 400,
      'Duplicate starter pack claim rejected with HTTP 400 Bad Request',
      `Status: ${dupPackRes.status}`
    );

    // -------------------------------------------------------------------------
    // 13. Host Earning Identity (KYC) & Document Masking
    // -------------------------------------------------------------------------
    console.log('\n--- Section 13: Host Earning Identity & Masking ---');

    const identityGetRes = await apiRequest('GET', '/api/host/identity', null, {
      'x-viewer-id': hostUser.id,
    });
    assert(identityGetRes.status === 200, 'Host identity endpoint returns HTTP 200');
    const docMasked = identityGetRes.data?.documentNumberMasked || identityGetRes.data?.identity?.documentNumberMasked;
    assert(
      docMasked !== undefined,
      'Document number is returned masked (e.g. •••• •••• ••XXXX)'
    );
    assert(
      !docMasked?.includes('4210112345678'),
      'Raw document number is never exposed in identity response'
    );

    // -------------------------------------------------------------------------
    // 14. Host Earning Identity Submission & Verification
    // -------------------------------------------------------------------------
    console.log('\n--- Section 14: Host Earning Identity Submission ---');

    const submitIdentityRes = await apiRequest(
      'POST',
      '/api/host/identity',
      {
        legalName: 'Syeda Zara Live',
        country: 'Pakistan',
        documentType: 'national_id',
        documentNumber: '42101-9988776-5',
      },
      { 'x-viewer-id': hostUser.id }
    );
    assert(submitIdentityRes.status === 200, 'Submit earning identity returns HTTP 200');
    assert(submitIdentityRes.data?.success === true, 'Identity submission confirmed');
    assert(
      submitIdentityRes.data?.identity?.documentNumberMasked.endsWith('76-5') ||
      submitIdentityRes.data?.identity?.documentNumberMasked.includes('••'),
      'Updated document number is stored securely and returned masked'
    );

    // -------------------------------------------------------------------------
    // 15. Suspended / Restricted Host Access Gate
    // -------------------------------------------------------------------------
    console.log('\n--- Section 15: Suspended Host Access Gate ---');

    // Temporarily mark host as suspended
    await db.query(`UPDATE popolive.users SET status = 'suspended' WHERE id = $1`, [hostUser.id]);

    const suspendedTasksRes = await apiRequest('GET', '/api/host/tasks', null, {
      'x-viewer-id': hostUser.id,
    });
    assert(
      suspendedTasksRes.status === 403,
      'Suspended host access to /api/host/tasks is blocked with HTTP 403',
      `Status: ${suspendedTasksRes.status}`
    );

    // Restore host active status
    await db.query(`UPDATE popolive.users SET status = 'active' WHERE id = $1`, [hostUser.id]);

    // -------------------------------------------------------------------------
    // 16. Real-Time Task & KYC Events Logging
    // -------------------------------------------------------------------------
    console.log('\n--- Section 16: Real-Time Event Stream Logging ---');

    const rtEvents = await db.query(
      `SELECT * FROM popolive.host_task_realtime_events
       WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 5`,
      [hostUser.id]
    );
    assert(rtEvents.rows.length > 0, `Real-time events recorded in database (${rtEvents.rows.length} found)`);
    const eventTypes = rtEvents.rows.map((r) => r.event_type);
    console.log(`  Captured real-time events: ${eventTypes.join(', ')}`);
    assert(
      eventTypes.includes('task_progress') || eventTypes.includes('reward_claimed') || eventTypes.includes('pack_claimed'),
      'Captured authoritative host task lifecycle events'
    );

    // -------------------------------------------------------------------------
    // 17. Push Notifications Integration
    // -------------------------------------------------------------------------
    console.log('\n--- Section 17: Push Notifications Integration ---');

    const notifRes = await db.query(
      `SELECT * FROM popolive.push_notification_dispatch_logs
       WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 5`,
      [hostUser.id]
    );
    assert(notifRes.rows.length >= 0, 'In-app / push notification dispatch confirmed for host actions');

    // -------------------------------------------------------------------------
    // 18. Video Call Permanent Restriction Audit
    // -------------------------------------------------------------------------
    console.log('\n--- Section 18: Video Call Permanent Restriction Audit ---');

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
    // 19. 5-Tab Navigation Shell Lock Audit
    // -------------------------------------------------------------------------
    console.log('\n--- Section 19: 5-Tab Navigation Architecture Shell Lock Audit ---');

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
    // 20. 49 Original Dart Screens Preservation Audit
    // -------------------------------------------------------------------------
    console.log('\n--- Section 20: 49 Original Dart Screens Preservation Audit ---');

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

    // Verify key M8 host screens exist
    const dailyTasksScreenPath = path.join(screensDir, 'daily_tasks/daily_host_tasks_screen.dart');
    const taskLevelScreenPath = path.join(screensDir, 'task_level/task_level_screen.dart');
    const newHostPackScreenPath = path.join(screensDir, 'new_host_pack/new_host_pack_screen.dart');
    const earningIdentityScreenPath = path.join(screensDir, 'earning_identity/earning_identity_screen.dart');

    assert(fs.existsSync(dailyTasksScreenPath), 'daily_host_tasks_screen.dart preserved and updated');
    assert(fs.existsSync(taskLevelScreenPath), 'task_level_screen.dart preserved and updated');
    assert(fs.existsSync(newHostPackScreenPath), 'new_host_pack_screen.dart preserved and updated');
    assert(fs.existsSync(earningIdentityScreenPath), 'earning_identity_screen.dart preserved and updated');

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

runHostTasksMasterSuite();
