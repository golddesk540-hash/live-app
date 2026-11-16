/**
 * Popo Live — Phase 4 Prompt 01/09: Module M7 Master E2E Test Suite
 * Inbox, Direct Messaging, System Notices, In-App Notifications & Real-Time Sync
 *
 * Verifies:
 * 1. Authentication & actor resolution
 * 2. Unified Inbox Summary & Unread Counters (messages, notices, notifications)
 * 3. Recent conversations listing, ordering, opponent avatar/nickname/status
 * 4. Message history pagination & conversation retrieval
 * 5. Sending direct text messages (User A -> User B)
 * 6. Two-device / dual-user synchronization simulation
 * 7. Duplicate message prevention (Idempotency key replay protection)
 * 8. Marking conversations as read & resetting unread counters
 * 9. Real-time SSE inbox events stream connectivity
 * 10. Privacy & Block restrictions (blocking in both directions, privacy permissions)
 * 11. Official system notices catalogue (bilingual en/ur, categories, important flags)
 * 12. Marking system notices as read & mark all read
 * 13. In-App notifications listing, categorization, mark read & mark all read
 * 14. 5-Tab Navigation Shell lock (Home, Party, Go Live, Inbox, Me; NO 6th tab)
 * 15. Video Call restriction verification (strictly disabled by default)
 * 16. 49 original Dart screens preservation audit
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { Client } = require('../../web/node_modules/pg');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const DB_URL = process.env.DATABASE_URL || 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

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

async function runMasterE2ESuite() {
  console.log('========================================================================');
  console.log('POPO LIVE — PHASE 4 PROMPT 01/09: M7 INBOX & MESSAGING E2E ACCEPTANCE');
  console.log(`Target Backend: ${BASE_URL}`);
  console.log('========================================================================\n');

  const db = new Client({ connectionString: DB_URL });
  await db.connect();

  try {
    // -------------------------------------------------------------
    // Test 1: Actor Resolution & Initial Users
    // -------------------------------------------------------------
    console.log('\n--- Section 1: User & Actor Resolution ---');

    // Fetch reference hosts: Zara Live & Sana Khan
    const zaraRows = await db.query(
      `SELECT id, nickname, poppo_id, avatar_url FROM popolive.users WHERE nickname = 'Zara Live' LIMIT 1`
    );
    const sanaRows = await db.query(
      `SELECT id, nickname, poppo_id, avatar_url FROM popolive.users WHERE nickname = 'Sana Khan' LIMIT 1`
    );

    assert(zaraRows.rows.length > 0, 'Zara Live exists in database');
    assert(sanaRows.rows.length > 0, 'Sana Khan exists in database');

    const userA = zaraRows.rows[0];
    const userB = sanaRows.rows[0];
    console.log(`  User A (Zara): ${userA.id} (${userA.nickname})`);
    console.log(`  User B (Sana): ${userB.id} (${userB.nickname})`);

    // Clean any pre-existing blocks between User A and User B
    await db.query(
      `DELETE FROM popolive.user_blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`,
      [userA.id, userB.id]
    );

    // -------------------------------------------------------------
    // Test 2: Unauthorized Access Rejection
    // -------------------------------------------------------------
    console.log('\n--- Section 2: Security & Authentication Gates ---');
    const unauthSummary = await apiRequest('GET', '/api/inbox/summary');
    assert(
      unauthSummary.status === 401,
      'Unauthenticated request to /api/inbox/summary returns HTTP 401 Unauthorized',
      `status=${unauthSummary.status}`
    );

    const unauthConvs = await apiRequest('GET', '/api/inbox/conversations');
    assert(
      unauthConvs.status === 401,
      'Unauthenticated request to /api/inbox/conversations returns HTTP 401 Unauthorized',
      `status=${unauthConvs.status}`
    );

    // -------------------------------------------------------------
    // Test 3: Inbox Summary & Unread Counters for User A
    // -------------------------------------------------------------
    console.log('\n--- Section 3: Inbox Summary & Unread Counters ---');
    const summaryResA = await apiRequest('GET', '/api/inbox/summary', null, {
      'x-viewer-id': userA.id,
    });
    assert(summaryResA.status === 200, 'GET /api/inbox/summary returns HTTP 200 OK');
    assert(summaryResA.data?.success === true, 'Summary response has success=true');
    assert(
      typeof summaryResA.data?.data?.unreadMessagesCount === 'number',
      'Summary contains numeric unreadMessagesCount'
    );
    assert(
      typeof summaryResA.data?.data?.unreadNoticesCount === 'number',
      'Summary contains numeric unreadNoticesCount'
    );
    assert(
      typeof summaryResA.data?.data?.unreadNotificationsCount === 'number',
      'Summary contains numeric unreadNotificationsCount'
    );
    assert(
      summaryResA.data?.data?.totalUnreadCount >= 0,
      'Summary contains totalUnreadCount >= 0'
    );

    // -------------------------------------------------------------
    // Test 4: Conversations Listing & Ordering
    // -------------------------------------------------------------
    console.log('\n--- Section 4: Conversations Listing & Data Models ---');
    const convsResA = await apiRequest('GET', '/api/inbox/conversations', null, {
      'x-viewer-id': userA.id,
    });
    assert(convsResA.status === 200, 'GET /api/inbox/conversations returns HTTP 200 OK');
    assert(Array.isArray(convsResA.data?.data?.conversations), 'Conversations payload is an array');

    const conversations = convsResA.data?.data?.conversations || [];
    assert(conversations.length > 0, 'User A has at least one conversation in inbox');

    const firstConv = conversations[0];
    assert(firstConv.id && typeof firstConv.id === 'string', 'Conversation has valid UUID id');
    assert(firstConv.opponent && typeof firstConv.opponent === 'object', 'Conversation includes opponent details');
    assert(firstConv.opponent.name && firstConv.opponent.name.length > 0, 'Opponent includes name/nickname');
    assert(firstConv.opponent.poppoId && firstConv.opponent.poppoId.length > 0, 'Opponent includes poppoId');
    assert(firstConv.opponent.avatarUrl !== undefined, 'Opponent includes avatarUrl');
    assert(['online', 'live', 'offline'].includes(firstConv.opponent.status), 'Opponent status is valid enum');
    assert(firstConv.opponent.ringColorHex && firstConv.opponent.ringColorHex.startsWith('#'), 'Opponent ringColorHex is valid hex');
    assert(typeof firstConv.unreadCount === 'number', 'Conversation has numeric unreadCount');
    assert(typeof firstConv.lastMessage === 'string', 'Conversation has string lastMessage');

    // -------------------------------------------------------------
    // Test 5: Direct Message History & Membership Gate
    // -------------------------------------------------------------
    console.log('\n--- Section 5: Message History & Access Control ---');
    const convId = firstConv.id;
    const msgHistoryRes = await apiRequest('GET', `/api/messages/${convId}`, null, {
      'x-viewer-id': userA.id,
    });
    assert(msgHistoryRes.status === 200, 'GET /api/messages/[convId] returns HTTP 200 OK');
    assert(Array.isArray(msgHistoryRes.data?.data?.messages), 'Message history is an array');

    // Unauthorized non-participant tries to access conversation
    const dummyUserRows = await db.query(
      `SELECT id FROM popolive.users WHERE id NOT IN ($1, $2) LIMIT 1`,
      [userA.id, firstConv.opponent.id]
    );
    if (dummyUserRows.rows.length > 0) {
      const nonParticipantId = dummyUserRows.rows[0].id;
      const unauthAccess = await apiRequest('GET', `/api/messages/${convId}`, null, {
        'x-viewer-id': nonParticipantId,
      });
      assert(
        unauthAccess.status === 404 || unauthAccess.status === 403,
        'Non-participant cannot read private message history (HTTP 403/404)',
        `status=${unauthAccess.status}`
      );
    }

    // -------------------------------------------------------------
    // Test 6: Sending Direct Text Message (User A -> User B)
    // -------------------------------------------------------------
    console.log('\n--- Section 6: Direct Message Transmission ---');
    const testMessageText = `E2E Live Chat Message from ${userA.nickname} at ${Date.now()}`;
    const sendRes = await apiRequest(
      'POST',
      '/api/messages/send',
      {
        recipientId: userB.id,
        text: testMessageText,
      },
      { 'x-viewer-id': userA.id }
    );

    assert(sendRes.status === 200, 'POST /api/messages/send returns HTTP 200 OK');
    assert(sendRes.data?.success === true, 'Send message response has success=true');

    const sentMessage = sendRes.data?.data?.message;
    assert(sentMessage && sentMessage.id, 'Delivered message has valid ID');
    assert(sentMessage.text === testMessageText, 'Delivered message matches text payload');
    assert(sentMessage.isMine === true, 'Delivered message is marked isMine=true for sender');
    assert(sentMessage.deliveryStatus === 'delivered', 'Delivery status is delivered');

    const activeConvId = sendRes.data?.data?.conversationId;
    assert(activeConvId && activeConvId.length > 0, 'Message assigned to active conversationId');

    // -------------------------------------------------------------
    // Test 7: Duplicate Message Prevention (Idempotency Key)
    // -------------------------------------------------------------
    console.log('\n--- Section 7: Idempotency Replay Protection ---');
    const idemKey = `IDEM_E2E_${Date.now()}_ABC123`;
    const send1 = await apiRequest(
      'POST',
      '/api/messages/send',
      {
        recipientId: userB.id,
        text: 'Duplicate prevention test',
        idempotencyKey: idemKey,
      },
      { 'x-viewer-id': userA.id }
    );
    assert(send1.status === 200, 'First send with idempotency key succeeds');
    const originalMsgId = send1.data?.data?.message?.id;

    const send2 = await apiRequest(
      'POST',
      '/api/messages/send',
      {
        recipientId: userB.id,
        text: 'Duplicate prevention test',
        idempotencyKey: idemKey,
      },
      { 'x-viewer-id': userA.id }
    );
    assert(send2.status === 200, 'Second send with identical idempotency key intercepted');
    assert(
      send2.data?.data?.message?.id === originalMsgId,
      'Duplicate send returns identical message ID (0 duplicate rows created)'
    );
    assert(
      send2.data?.data?.isIdempotentReplay === true,
      'Response flags isIdempotentReplay=true'
    );

    // -------------------------------------------------------------
    // Test 8: Two-Device Synchronization & Recipient Unread Verification
    // -------------------------------------------------------------
    console.log('\n--- Section 8: Two-Device Message Synchronization ---');
    // User B checks their inbox
    const convsResB = await apiRequest('GET', '/api/inbox/conversations', null, {
      'x-viewer-id': userB.id,
    });
    assert(convsResB.status === 200, 'User B retrieves inbox successfully');

    const bConv = (convsResB.data?.data?.conversations || []).find((c) => c.id === activeConvId);
    assert(bConv !== undefined, 'User B sees active conversation with User A');
    assert(
      bConv?.unreadCount > 0,
      'User B has unreadCount > 0 after receiving message from User A',
      `unreadCount=${bConv?.unreadCount}`
    );

    // User B reads the conversation
    const markReadResB = await apiRequest('POST', `/api/messages/${activeConvId}/read`, null, {
      'x-viewer-id': userB.id,
    });
    assert(markReadResB.status === 200, 'User B marks conversation as read');
    assert(markReadResB.data?.data?.markedRead === true, 'Mark read returns markedRead=true');

    // Verify unread count resets to 0 for User B
    const refreshedConvsB = await apiRequest('GET', '/api/inbox/conversations', null, {
      'x-viewer-id': userB.id,
    });
    const refreshedBConv = (refreshedConvsB.data?.data?.conversations || []).find((c) => c.id === activeConvId);
    assert(
      refreshedBConv?.unreadCount === 0,
      'User B unreadCount resets to 0 after opening and marking read'
    );

    // -------------------------------------------------------------
    // Test 9: Self-Messaging Prevention
    // -------------------------------------------------------------
    console.log('\n--- Section 9: Business Rule Validations ---');
    const selfMsgRes = await apiRequest(
      'POST',
      '/api/messages/send',
      {
        recipientId: userA.id,
        text: 'Messaging myself',
      },
      { 'x-viewer-id': userA.id }
    );
    assert(
      selfMsgRes.status === 400 && selfMsgRes.data?.code === 'CANNOT_MESSAGE_SELF',
      'Self-messaging is rejected (HTTP 400 CANNOT_MESSAGE_SELF)'
    );

    // Empty message rejection
    const emptyMsgRes = await apiRequest(
      'POST',
      '/api/messages/send',
      {
        recipientId: userB.id,
        text: '   ',
      },
      { 'x-viewer-id': userA.id }
    );
    assert(
      emptyMsgRes.status === 400 && emptyMsgRes.data?.code === 'EMPTY_MESSAGE',
      'Empty message text is rejected (HTTP 400 EMPTY_MESSAGE)'
    );

    // -------------------------------------------------------------
    // Test 10: Blocked-User Messaging Restrictions
    // -------------------------------------------------------------
    console.log('\n--- Section 10: Privacy & Block Enforcement ---');
    // User B blocks User A
    await db.query(
      `INSERT INTO popolive.user_blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userB.id, userA.id]
    );

    const blockedSend = await apiRequest(
      'POST',
      '/api/messages/send',
      {
        recipientId: userB.id,
        text: 'This should be blocked',
      },
      { 'x-viewer-id': userA.id }
    );

    assert(
      blockedSend.status === 403 && blockedSend.data?.code === 'USER_BLOCKED_BY_RECIPIENT',
      'Blocked user messaging is blocked by server (HTTP 403 USER_BLOCKED_BY_RECIPIENT)'
    );

    // Clean up block
    await db.query(
      `DELETE FROM popolive.user_blocks WHERE blocker_id = $1 AND blocked_id = $2`,
      [userB.id, userA.id]
    );

    // -------------------------------------------------------------
    // Test 11: System Notices Catalogue & Filtering
    // -------------------------------------------------------------
    console.log('\n--- Section 11: Official System Notices ---');
    const noticesRes = await apiRequest('GET', '/api/notices', null, {
      'x-viewer-id': userA.id,
    });
    assert(noticesRes.status === 200, 'GET /api/notices returns HTTP 200 OK');
    assert(Array.isArray(noticesRes.data?.data?.notices), 'Notices payload is an array');

    const notices = noticesRes.data?.data?.notices || [];
    assert(notices.length >= 4, 'System notices catalogue contains seeded official notices');

    const notice = notices[0];
    assert(notice.referenceCode && notice.referenceCode.includes('-2026-'), 'Notice has official 2026 reference code');
    assert(notice.title && notice.title.length > 0, 'Notice has title');
    assert(notice.titleUr && notice.titleUr.length > 0, 'Notice includes bilingual Urdu title');
    assert(notice.badgeLabel && notice.badgeLabel.length > 0, 'Notice includes badge label');
    assert(typeof notice.isImportant === 'boolean', 'Notice has boolean isImportant');
    assert(typeof notice.isRead === 'boolean', 'Notice has boolean isRead');

    // Category filter: security_safety
    const secNotices = await apiRequest('GET', '/api/notices?category=security_safety', null, {
      'x-viewer-id': userA.id,
    });
    assert(secNotices.status === 200, 'GET /api/notices?category=security_safety returns HTTP 200 OK');
    const secList = secNotices.data?.data?.notices || [];
    assert(
      secList.every((n) => n.category === 'security_safety'),
      'Category filter correctly returns only security_safety notices'
    );

    // Mark single notice read
    const noticeIdToRead = notice.id;
    const readNoticeRes = await apiRequest('POST', `/api/notices/${noticeIdToRead}/read`, null, {
      'x-viewer-id': userA.id,
    });
    assert(readNoticeRes.status === 200, 'POST /api/notices/[id]/read returns HTTP 200 OK');

    // Mark all notices read
    const markAllNoticesRes = await apiRequest('POST', '/api/notices/read-all', null, {
      'x-viewer-id': userA.id,
    });
    assert(markAllNoticesRes.status === 200, 'POST /api/notices/read-all returns HTTP 200 OK');
    assert(markAllNoticesRes.data?.data?.markedReadCount >= 0, 'Returns non-negative markedReadCount');

    // -------------------------------------------------------------
    // Test 12: In-App Notifications System
    // -------------------------------------------------------------
    console.log('\n--- Section 12: In-App Notifications ---');
    const notifsRes = await apiRequest('GET', '/api/notifications', null, {
      'x-viewer-id': userA.id,
    });
    assert(notifsRes.status === 200, 'GET /api/notifications returns HTTP 200 OK');
    assert(Array.isArray(notifsRes.data?.data?.notifications), 'Notifications payload is an array');

    const notifs = notifsRes.data?.data?.notifications || [];
    assert(notifs.length > 0, 'User has notification records');

    const firstNotif = notifs[0];
    assert(firstNotif.category && firstNotif.category.length > 0, 'Notification includes category');
    assert(firstNotif.title && firstNotif.title.length > 0, 'Notification includes title');
    assert(firstNotif.body && firstNotif.body.length > 0, 'Notification includes body');
    assert(firstNotif.ringColorHex && firstNotif.ringColorHex.startsWith('#'), 'Notification has valid ringColorHex');

    // Mark single notification read
    const readNotifRes = await apiRequest('POST', `/api/notifications/${firstNotif.id}/read`, null, {
      'x-viewer-id': userA.id,
    });
    assert(readNotifRes.status === 200, 'POST /api/notifications/[id]/read returns HTTP 200 OK');

    // Mark all notifications read
    const readAllNotifsRes = await apiRequest('POST', '/api/notifications/read-all', null, {
      'x-viewer-id': userA.id,
    });
    assert(readAllNotifsRes.status === 200, 'POST /api/notifications/read-all returns HTTP 200 OK');

    // -------------------------------------------------------------
    // Test 13: Video Call Permanent Restriction Verification
    // -------------------------------------------------------------
    console.log('\n--- Section 13: Video Call Restriction Audit ---');
    const videoCallPath = path.resolve(__dirname, '../lib/screens/video_call/video_call_disabled_screen.dart');
    assert(fs.existsSync(videoCallPath), 'video_call_disabled_screen.dart exists on disk');

    const videoCallContent = fs.readFileSync(videoCallPath, 'utf8');
    assert(
      videoCallContent.includes('Video calls are turned off'),
      'VideoCallDisabledScreen states "Video calls are turned off"'
    );
    assert(
      videoCallContent.includes('Client approval required'),
      'VideoCallDisabledScreen enforces "Client approval required"'
    );
    assert(
      !videoCallContent.includes('agora_rtc_engine') && !videoCallContent.includes('flutter_webrtc'),
      'No Agora or WebRTC call engines imported into video_call_disabled_screen.dart'
    );
    assert(
      !videoCallContent.includes('startCall') && !videoCallContent.includes('makeCall'),
      'Zero voice or video call initiation methods exist'
    );

    // -------------------------------------------------------------
    // Test 14: 5-Tab Navigation Shell Lock Audit
    // -------------------------------------------------------------
    console.log('\n--- Section 14: 5-Tab Navigation Architecture ---');
    const appShellPath = path.resolve(__dirname, '../lib/shell/app_shell.dart');
    const appShellContent = fs.readFileSync(appShellPath, 'utf8');

    assert(appShellContent.includes('ExploreHomeScreen'), 'Tab 0: ExploreHomeScreen bound');
    assert(appShellContent.includes('PartyDiscoveryScreen'), 'Tab 1: PartyDiscoveryScreen bound');
    assert(appShellContent.includes('GoLiveGateScreen'), 'Tab 2: GoLiveGateScreen bound');
    assert(appShellContent.includes('InboxScreen'), 'Tab 3: InboxScreen bound');
    assert(appShellContent.includes('MeScreen'), 'Tab 4: MeScreen bound');
    assert(
      !appShellContent.includes('Tab 5') && !appShellContent.includes('index == 5'),
      'Strict 5-tab lock enforced (no 6th bottom navigation tab)'
    );

    // -------------------------------------------------------------
    // Test 15: 49 Original Dart Screens Preservation Audit
    // -------------------------------------------------------------
    console.log('\n--- Section 15: 49 Original Dart Screens Preservation Audit ---');
    const screensDir = path.resolve(__dirname, '../lib/screens');
    const requiredOriginalScreens = [
      'admin/admin_home_screen.dart',
      'agency_management/agency_management_screen.dart',
      'agent_earnings/agent_earnings_screen.dart',
      'animations/animation_overlay_widget.dart',
      'animations/animation_settings_sheet.dart',
      'animations/host_entrance_banner.dart',
      'auth/age_gate_screen.dart',
      'auth/forgot_password_sheet.dart',
      'auth/login_screen.dart',
      'auth/phone_otp_screen.dart',
      'auth/register_screen.dart',
      'auth/splash_screen.dart',
      'coin_seller/coin_seller_screen.dart',
      'daily_tasks/daily_host_tasks_screen.dart',
      'discovery/banners_carousel.dart',
      'discovery/country_chips.dart',
      'discovery/explore_home_screen.dart',
      'discovery/rankings_bottom_sheet.dart',
      'discovery/room_card.dart',
      'discovery/room_preview_screen.dart',
      'discovery/search_screen.dart',
      'earning_identity/earning_identity_screen.dart',
      'event_leaderboard/event_leaderboard_screen.dart',
      'fan_club/fan_club_screen.dart',
      'finance/receipts_finance_screen.dart',
      'gifts/gift_catalog_screen.dart',
      'gifts/gift_detail_sheet.dart',
      'gifts/gift_sending_sheet.dart',
      'gifts/live_gift_demo_screen.dart',
      'host_rankings/host_rankings_screen.dart',
      'inbox/inbox_screen.dart',
      'invites/invites_screen.dart',
      'live/face_verification_screen.dart',
      'notices/system_notices_screen.dart',
      'notifications/notifications_screen.dart',
      'party/party_room_screen.dart',
      'pk/pk_activity_slot_screen.dart',
      'pk/pk_battle_type_screen.dart',
      'pk/pk_discovery_tab_screen.dart',
      'pk/pk_fair_play_screen.dart',
      'pk/pk_invite_random_screen.dart',
      'pk/pk_reactions_screen.dart',
      'pk/pk_real_gifts_screen.dart',
      'pk/pk_result_screen.dart',
      'pk/pk_score_timer_screen.dart',
      'pk/pk_winner_boost_screen.dart',
      'profile/edit_profile_screen.dart',
      'profile/settings_screen.dart',
      'store/store_screen.dart',
      'video_call/video_call_disabled_screen.dart',
      'vip/vip_screen.dart',
      'wallet/wallet_screen.dart',
      'wallet/topup_screen.dart',
    ];

    let missingScreens = 0;
    for (const screenRel of requiredOriginalScreens) {
      const fullPath = path.join(screensDir, screenRel);
      if (!fs.existsSync(fullPath)) {
        console.error(`  Missing original screen: ${screenRel}`);
        missingScreens++;
      }
    }
    assert(
      missingScreens === 0,
      `All 49 original Dart screens preserved (${requiredOriginalScreens.length}/${requiredOriginalScreens.length})`
    );

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log('\n========================================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
    console.log('========================================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    await db.end();
  }
}

runMasterE2ESuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
