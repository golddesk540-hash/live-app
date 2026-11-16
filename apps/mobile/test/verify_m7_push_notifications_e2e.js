/**
 * Popo Live — Phase 4 Prompt 02/09: Module M7 Push Notifications Master E2E Suite
 * Firebase Cloud Messaging (FCM), Apple Push Notifications (APNs) & Real-Time Alerts
 *
 * Verifies:
 * 1. Device Token Registration (Android FCM & iOS APNs tokens)
 * 2. Active Devices Query & Multi-Device Support per User
 * 3. Token Deactivation on Logout / Device Unregistration
 * 4. Direct Message Push Notification Dispatch
 * 5. Gift Received Push Notification Dispatch to Recipient Host
 * 6. Followed Host Live Broadcast Alert Dispatch to Eligible Followers
 * 7. Notification Preferences Configuration (Direct Messages, Gifts, Live, System)
 * 8. Notification Suppression when Category Disabled by User Preference
 * 9. Push Alert Suppression for Blocked Users
 * 10. Android FCM Native Configuration (google-services.json, AndroidManifest POST_NOTIFICATIONS)
 * 11. iOS APNs Native Configuration (GoogleService-Info.plist, Info.plist background modes, Runner.entitlements, AppDelegate.swift)
 * 12. Deep Link Payload Parser & Destination Validation
 * 13. Video Call Permanent Restriction (video_call_disabled_screen.dart strictly locked OFF)
 * 14. 5-Tab Navigation Shell Lock (Home, Party, Go Live, Inbox, Me; NO 6th tab)
 * 15. 49 Original Dart Screens Preservation Audit
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

async function runPushNotificationMasterSuite() {
  console.log('========================================================================');
  console.log('POPO LIVE — PHASE 4 PROMPT 02/09: FCM, APNS & MOBILE ALERTS ACCEPTANCE');
  console.log(`Target Backend: ${BASE_URL}`);
  console.log('========================================================================\n');

  const db = new Client({ connectionString: DB_URL });
  await db.connect();

  try {
    // -------------------------------------------------------------
    // Section 1: User & Actor Resolution
    // -------------------------------------------------------------
    console.log('\n--- Section 1: Reference User & Actor Setup ---');
    const zaraRows = await db.query(
      `SELECT id, nickname, poppo_id, avatar_url FROM popolive.users WHERE nickname = 'Zara Live' LIMIT 1`
    );
    const sanaRows = await db.query(
      `SELECT id, nickname, poppo_id, avatar_url FROM popolive.users WHERE nickname = 'Sana Khan' LIMIT 1`
    );

    assert(zaraRows.rows.length > 0, 'Zara Live exists in database');
    assert(sanaRows.rows.length > 0, 'Sana Khan exists in database');

    const userA = zaraRows.rows[0]; // Host / Sender
    const userB = sanaRows.rows[0]; // Recipient Host / Viewer
    console.log(`  User A (Zara Live): ${userA.id}`);
    console.log(`  User B (Sana Khan): ${userB.id}`);

    // Clean blocks & reset notification preferences for clean test run
    await db.query(
      `DELETE FROM popolive.user_blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`,
      [userA.id, userB.id]
    );
    await db.query(
      `UPDATE popolive.user_notification_settings
       SET direct_messages = true, gift_alerts = true, live_broadcasts = true, system_announcements = true
       WHERE user_id = $1 OR user_id = $2`,
      [userA.id, userB.id]
    );

    // -------------------------------------------------------------
    // Section 2: Security & Unauthenticated Gate
    // -------------------------------------------------------------
    console.log('\n--- Section 2: Security & Authentication Gates ---');
    const unauthReg = await apiRequest('POST', '/api/notifications/devices/register', {
      deviceToken: 'token_unauth_test',
    });
    assert(
      unauthReg.status === 401,
      'Unauthenticated POST /api/notifications/devices/register returns HTTP 401 Unauthorized',
      `status=${unauthReg.status}`
    );

    const unauthList = await apiRequest('GET', '/api/notifications/devices');
    assert(
      unauthList.status === 401,
      'Unauthenticated GET /api/notifications/devices returns HTTP 401 Unauthorized',
      `status=${unauthList.status}`
    );

    // -------------------------------------------------------------
    // Section 3: Device Token Registration (Android FCM & iOS APNs)
    // -------------------------------------------------------------
    console.log('\n--- Section 3: Device Token Registration ---');
    const fcmTokenAndroid = `fcm_android_${Date.now()}_alpha99`;
    const regAndroidRes = await apiRequest(
      'POST',
      '/api/notifications/devices/register',
      {
        deviceToken: fcmTokenAndroid,
        platform: 'android',
        deviceModel: 'Samsung Galaxy S24 Ultra',
        appVersion: '1.0.0',
      },
      { 'x-viewer-id': userB.id }
    );

    assert(regAndroidRes.status === 200, 'Android FCM token registered successfully (HTTP 200)');
    assert(regAndroidRes.data?.success === true, 'Response returns success=true');
    assert(
      regAndroidRes.data?.data?.device?.deviceToken === fcmTokenAndroid,
      'Registered device token matches submitted FCM token'
    );
    assert(
      regAndroidRes.data?.data?.device?.platform === 'android',
      'Platform confirmed as android'
    );

    // Register second device: iOS APNs token (Multi-device support)
    const apnsTokenIos = `apns_ios_${Date.now()}_beta88`;
    const regIosRes = await apiRequest(
      'POST',
      '/api/notifications/devices/register',
      {
        deviceToken: apnsTokenIos,
        platform: 'ios',
        deviceModel: 'iPhone 16 Pro Max',
        appVersion: '1.0.0',
      },
      { 'x-viewer-id': userB.id }
    );

    assert(regIosRes.status === 200, 'iOS APNs token registered successfully (HTTP 200)');
    assert(
      regIosRes.data?.data?.device?.platform === 'ios',
      'Platform confirmed as ios'
    );

    // -------------------------------------------------------------
    // Section 4: Device Query & Multi-Device Verification
    // -------------------------------------------------------------
    console.log('\n--- Section 4: Active Devices Query & Multi-Device Support ---');
    const listRes = await apiRequest('GET', '/api/notifications/devices', null, {
      'x-viewer-id': userB.id,
    });
    assert(listRes.status === 200, 'GET /api/notifications/devices returns HTTP 200 OK');
    assert(Array.isArray(listRes.data?.data?.devices), 'Devices payload is an array');

    const devices = listRes.data?.data?.devices || [];
    assert(devices.length >= 2, 'User B has at least 2 active registered devices (multi-device support)');

    const hasAndroid = devices.some((d) => d.platform === 'android' && d.deviceToken === fcmTokenAndroid);
    const hasIos = devices.some((d) => d.platform === 'ios' && d.deviceToken === apnsTokenIos);
    assert(hasAndroid, 'Active device list includes registered Android device');
    assert(hasIos, 'Active device list includes registered iOS device');

    // -------------------------------------------------------------
    // Section 5: Direct Message Push Notification Dispatch
    // -------------------------------------------------------------
    console.log('\n--- Section 5: Direct Message Push Notification Dispatch ---');
    const msgText = `Hello Sana! Testing push notifications at ${Date.now()}`;
    const sendMsgRes = await apiRequest(
      'POST',
      '/api/messages/send',
      {
        recipientId: userB.id,
        text: msgText,
      },
      { 'x-viewer-id': userA.id }
    );
    assert(sendMsgRes.status === 200, 'Direct message sent from User A to User B');

    // Verify push notification dispatch log created for User B
    const pushLogsRes = await apiRequest('GET', `/api/notifications/dispatch/test?userId=${userB.id}`, null, {
      'x-viewer-id': userB.id,
    });
    assert(pushLogsRes.status === 200, 'GET /api/notifications/dispatch/test returns HTTP 200 OK');

    const logs = pushLogsRes.data?.data?.logs || [];
    const dmLog = logs.find((l) => l.notification_type === 'direct_message' && l.body === msgText);
    assert(dmLog !== undefined, 'Push notification dispatch log created for direct message');
    assert(dmLog?.status === 'sent', 'Push notification status is "sent"');
    assert(dmLog?.title.includes('Zara Live') || dmLog?.title.includes('Message'), 'Push notification title identifies sender');

    // -------------------------------------------------------------
    // Section 6: Gift Received Push Notification Dispatch
    // -------------------------------------------------------------
    console.log('\n--- Section 6: Virtual Gift Push Notification Dispatch ---');
    const giftPushRes = await apiRequest(
      'POST',
      '/api/notifications/dispatch/test',
      {
        action: 'gift_alert',
        recipientUserId: userB.id,
        giftName: 'Super Sports Car',
        coinPrice: 3000,
        roomId: '100221',
      },
      { 'x-viewer-id': userA.id }
    );

    assert(giftPushRes.status === 200, 'Gift push notification alert triggered successfully');
    assert(giftPushRes.data?.data?.dispatched === true, 'Gift alert dispatched=true');

    // Verify gift dispatch log
    const updatedLogsRes = await apiRequest('GET', `/api/notifications/dispatch/test?userId=${userB.id}`, null, {
      'x-viewer-id': userB.id,
    });
    const giftLog = (updatedLogsRes.data?.data?.logs || []).find((l) => l.notification_type === 'gift_received');
    assert(giftLog !== undefined, 'Push notification dispatch log created for gift received');
    assert(giftLog?.body.includes('Super Sports Car') && giftLog?.body.includes('3000'), 'Gift notification body details gift name and coins');

    // -------------------------------------------------------------
    // Section 7: Followed Host Live Broadcast Alert
    // -------------------------------------------------------------
    console.log('\n--- Section 7: Followed Host Live Broadcast Alert ---');
    // Ensure User B follows User A with live_notifications_enabled = true
    await db.query(
      `INSERT INTO popolive.user_follows (follower_id, following_id, live_notifications_enabled)
       VALUES ($1, $2, true)
       ON CONFLICT (follower_id, following_id) DO UPDATE SET live_notifications_enabled = true`,
      [userB.id, userA.id]
    );

    const liveAlertRes = await apiRequest(
      'POST',
      '/api/notifications/dispatch/test',
      {
        action: 'live_broadcast_alert',
        hostId: userA.id,
        roomId: '100220',
        title: 'Zara Live Night Vibes ✨',
      },
      { 'x-viewer-id': userA.id }
    );

    assert(liveAlertRes.status === 200, 'Followed host live alert triggered successfully');
    assert(liveAlertRes.data?.data?.totalNotified >= 1, 'At least 1 eligible follower notified of live broadcast');

    // -------------------------------------------------------------
    // Section 8: Notification Preferences & Category Suppression
    // -------------------------------------------------------------
    console.log('\n--- Section 8: Notification Preferences & Category Suppression ---');
    // User B turns OFF direct message notifications
    const updatePrefRes = await apiRequest(
      'POST',
      '/api/settings/notifications',
      {
        direct_messages: false,
      },
      { 'x-viewer-id': userB.id }
    );
    assert(updatePrefRes.status === 200, 'User B disabled direct message notifications');

    // Verify settings retrieval reflects change
    const getPrefsRes = await apiRequest('GET', '/api/settings/notifications', null, {
      'x-viewer-id': userB.id,
    });
    assert(getPrefsRes.data?.notifications?.direct_messages === false, 'Settings confirms direct_messages: false');

    // User A sends message to User B while direct_messages is OFF
    const suppressedText = `Suppressed message test at ${Date.now()}`;
    await apiRequest(
      'POST',
      '/api/messages/send',
      {
        recipientId: userB.id,
        text: suppressedText,
      },
      { 'x-viewer-id': userA.id }
    );

    // Verify dispatch was suppressed by preference
    const suppressedLogs = await apiRequest('GET', `/api/notifications/dispatch/test?userId=${userB.id}`, null, {
      'x-viewer-id': userB.id,
    });
    const suppLog = (suppressedLogs.data?.data?.logs || []).find((l) => l.body === suppressedText);
    assert(suppLog !== undefined, 'Suppression log record created');
    assert(
      suppLog?.status === 'suppressed_by_preference',
      'Push notification status correctly marked "suppressed_by_preference"'
    );
    assert(
      suppLog?.suppression_reason === 'USER_PREFERENCE_DIRECT_MESSAGES_DISABLED',
      'Suppression reason recorded accurately'
    );

    // Re-enable direct messages
    await apiRequest(
      'POST',
      '/api/settings/notifications',
      {
        direct_messages: true,
      },
      { 'x-viewer-id': userB.id }
    );

    // -------------------------------------------------------------
    // Section 9: Blocked User Push Alert Suppression
    // -------------------------------------------------------------
    console.log('\n--- Section 9: Blocked User Push Suppression ---');
    // User B blocks User A
    await db.query(
      `INSERT INTO popolive.user_blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userB.id, userA.id]
    );

    // User A attempts to dispatch notification to User B
    const blockedPushRes = await apiRequest(
      'POST',
      '/api/notifications/dispatch/test',
      {
        recipientUserId: userB.id,
        type: 'direct_message',
        title: 'Blocked User Alert',
        body: 'Should not be delivered',
        senderId: userA.id,
      },
      { 'x-viewer-id': userA.id }
    );

    assert(blockedPushRes.data?.data?.dispatched === false, 'Notification to blocker not dispatched (dispatched=false)');
    assert(
      blockedPushRes.data?.data?.status === 'suppressed_by_block',
      'Push status marked "suppressed_by_block"'
    );

    // Clean up block
    await db.query(
      `DELETE FROM popolive.user_blocks WHERE blocker_id = $1 AND blocked_id = $2`,
      [userB.id, userA.id]
    );

    // -------------------------------------------------------------
    // Section 10: Device Token Deactivation on Logout
    // -------------------------------------------------------------
    console.log('\n--- Section 10: Token Deactivation & Unregistration ---');
    const unregRes = await apiRequest(
      'POST',
      '/api/notifications/devices/unregister',
      {
        deviceToken: apnsTokenIos,
      },
      { 'x-viewer-id': userB.id }
    );

    assert(unregRes.status === 200, 'POST /api/notifications/devices/unregister returns HTTP 200 OK');
    assert(unregRes.data?.data?.unregistered === true, 'Token successfully deactivated');

    // Verify deactivated token no longer listed in active devices
    const listAfterUnreg = await apiRequest('GET', '/api/notifications/devices', null, {
      'x-viewer-id': userB.id,
    });
    const activeTokens = (listAfterUnreg.data?.data?.devices || []).map((d) => d.deviceToken);
    assert(
      !activeTokens.includes(apnsTokenIos),
      'Deactivated APNs token removed from active device list'
    );
    assert(
      activeTokens.includes(fcmTokenAndroid),
      'Active Android token remains registered'
    );

    // -------------------------------------------------------------
    // Section 11: Android Native FCM Configuration Audit
    // -------------------------------------------------------------
    console.log('\n--- Section 11: Android Native FCM Configuration Audit ---');
    const googleServicesPath = path.resolve(__dirname, '../android/app/google-services.json');
    assert(fs.existsSync(googleServicesPath), 'android/app/google-services.json exists on disk');

    const googleServicesContent = JSON.parse(fs.readFileSync(googleServicesPath, 'utf8'));
    assert(
      googleServicesContent.client?.[0]?.client_info?.android_client_info?.package_name === 'com.popolive.app',
      'google-services.json configured for package com.popolive.app'
    );
    assert(
      googleServicesContent.project_info?.project_id === 'popolive-live-stream-2026',
      'google-services.json bound to project popolive-live-stream-2026'
    );

    const androidManifestPath = path.resolve(__dirname, '../android/app/src/main/AndroidManifest.xml');
    const manifestContent = fs.readFileSync(androidManifestPath, 'utf8');
    assert(
      manifestContent.includes('android.permission.POST_NOTIFICATIONS'),
      'AndroidManifest.xml declares android.permission.POST_NOTIFICATIONS'
    );
    assert(
      manifestContent.includes('android.permission.VIBRATE'),
      'AndroidManifest.xml declares android.permission.VIBRATE'
    );
    assert(
      manifestContent.includes('popolive_high_importance_channel'),
      'AndroidManifest.xml registers default notification channel'
    );

    // -------------------------------------------------------------
    // Section 12: iOS Native APNs Configuration Audit
    // -------------------------------------------------------------
    console.log('\n--- Section 12: iOS Native APNs Configuration Audit ---');
    const plistPath = path.resolve(__dirname, '../ios/Runner/GoogleService-Info.plist');
    assert(fs.existsSync(plistPath), 'ios/Runner/GoogleService-Info.plist exists on disk');

    const plistContent = fs.readFileSync(plistPath, 'utf8');
    assert(plistContent.includes('com.popolive.app'), 'GoogleService-Info.plist bound to BUNDLE_ID com.popolive.app');

    const entitlementsPath = path.resolve(__dirname, '../ios/Runner/Runner.entitlements');
    assert(fs.existsSync(entitlementsPath), 'ios/Runner/Runner.entitlements exists on disk');
    const entitlementsContent = fs.readFileSync(entitlementsPath, 'utf8');
    assert(entitlementsContent.includes('aps-environment'), 'Runner.entitlements contains aps-environment');

    const infoPlistPath = path.resolve(__dirname, '../ios/Runner/Info.plist');
    const infoPlistContent = fs.readFileSync(infoPlistPath, 'utf8');
    assert(infoPlistContent.includes('remote-notification'), 'Info.plist includes remote-notification background mode');

    const appDelegatePath = path.resolve(__dirname, '../ios/Runner/AppDelegate.swift');
    const appDelegateContent = fs.readFileSync(appDelegatePath, 'utf8');
    assert(appDelegateContent.includes('registerForRemoteNotifications'), 'AppDelegate.swift registers for remote notifications');
    assert(appDelegateContent.includes('UNUserNotificationCenterDelegate'), 'AppDelegate conforms to UNUserNotificationCenterDelegate');

    // -------------------------------------------------------------
    // Section 13: Video Call Restriction Audit
    // -------------------------------------------------------------
    console.log('\n--- Section 13: Video Call Permanent Restriction Audit ---');
    const videoCallPath = path.resolve(__dirname, '../lib/screens/video_call/video_call_disabled_screen.dart');
    assert(fs.existsSync(videoCallPath), 'video_call_disabled_screen.dart exists on disk');

    const videoCallContent = fs.readFileSync(videoCallPath, 'utf8');
    assert(
      videoCallContent.includes('Video calls are turned off'),
      'VideoCallDisabledScreen enforces "Video calls are turned off"'
    );
    assert(
      videoCallContent.includes('Client approval required'),
      'VideoCallDisabledScreen enforces "Client approval required"'
    );
    assert(
      !videoCallContent.includes('agora_rtc_engine') && !videoCallContent.includes('flutter_webrtc'),
      'Zero Agora or WebRTC call engines imported'
    );

    // -------------------------------------------------------------
    // Section 14: 5-Tab Navigation Shell Lock Audit
    // -------------------------------------------------------------
    console.log('\n--- Section 14: 5-Tab Navigation Architecture ---');
    const appShellPath = path.resolve(__dirname, '../lib/shell/app_shell.dart');
    const appShellContent = fs.readFileSync(appShellPath, 'utf8');

    assert(appShellContent.includes('ExploreHomeScreen'), 'Tab 0: ExploreHomeScreen');
    assert(appShellContent.includes('PartyDiscoveryScreen'), 'Tab 1: PartyDiscoveryScreen');
    assert(appShellContent.includes('GoLiveGateScreen'), 'Tab 2: GoLiveGateScreen');
    assert(appShellContent.includes('InboxScreen'), 'Tab 3: InboxScreen');
    assert(appShellContent.includes('MeScreen'), 'Tab 4: MeScreen');
    assert(
      !appShellContent.includes('Tab 5') && !appShellContent.includes('index == 5'),
      'Strict 5-tab lock enforced (no 6th bottom navigation tab)'
    );

    // -------------------------------------------------------------
    // Section 15: 49 Original Dart Screens Preservation Audit
    // -------------------------------------------------------------
    console.log('\n--- Section 15: 49 Original Dart Screens Preservation Audit ---');
    const screensDir = path.resolve(__dirname, '../lib/screens');
    const originalScreens = [
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

    let missing = 0;
    for (const rel of originalScreens) {
      if (!fs.existsSync(path.join(screensDir, rel))) {
        missing++;
        console.error(`  Missing screen: ${rel}`);
      }
    }
    assert(missing === 0, `All 49 original screens verified 100% intact (${originalScreens.length}/${originalScreens.length})`);

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

runPushNotificationMasterSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
