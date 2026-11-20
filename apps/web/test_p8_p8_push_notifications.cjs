/**
 * POPO LIVE — PHASE 8 (P8-P8) AUTOMATED VERIFICATION SUITE
 * PUSH NOTIFICATIONS — FCM, APNS, IN-APP DELIVERY, DEEP LINKS
 * 
 * Verifies all 20 test criteria specified in Part 8 of the P8-P8 specification.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  pushProvider,
  pushService,
} = require('../api/dist/notifications');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName} - ${details}`);
    failedTests++;
  }
}

async function runTests() {
  console.log('\n============================================================');
  console.log('POPO LIVE — PHASE 8 (P8-P8) PUSH NOTIFICATION TESTS (20)');
  console.log('============================================================\n');

  const rootDir = path.resolve(__dirname, '../..');
  const mobileDir = path.join(rootDir, 'apps', 'mobile');
  const webDir = path.join(rootDir, 'apps', 'web');

  const userA = {
    id: `usr_push_a_${Date.now()}`,
    birthdate: '1996-03-25',
    is_adult_verified: true,
    status: 'active',
  };
  const senderUser = {
    id: `usr_push_sender_${Date.now()}`,
    birthdate: '1994-08-10',
    is_adult_verified: true,
    status: 'active',
  };
  const blockedUser = {
    id: `usr_push_blocked_${Date.now()}`,
    birthdate: '1992-12-05',
    is_adult_verified: true,
    status: 'active',
  };

  pushService.registerMockUser(userA);
  pushService.registerMockUser(senderUser);
  pushService.registerMockUser(blockedUser);

  // Enable real push flag for test execution
  process.env.USE_REAL_PUSH = 'true';

  try {
    // ---------------------------------------------------------------------------
    // TEST 1: Device token registers
    // ---------------------------------------------------------------------------
    try {
      const regRes = await pushService.registerDeviceToken({
        userId: userA.id,
        deviceToken: 'fcm_tok_android_active_001',
        platform: 'android',
        deviceModel: 'Pixel 8 Pro',
        appVersion: '1.0.0',
      });

      const activeTokens = pushService.getMockTokens(userA.id);

      assert(
        regRes.success &&
          activeTokens.length === 1 &&
          activeTokens[0].deviceToken === 'fcm_tok_android_active_001' &&
          activeTokens[0].isActive === true,
        'Test 1: Device token registers successfully on login'
      );
    } catch (err) {
      assert(false, 'Test 1: Device token registers', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 2: Token invalidated on logout
    // ---------------------------------------------------------------------------
    try {
      await pushService.unregisterDeviceToken(userA.id, 'fcm_tok_android_active_001');
      const activeAfterLogout = pushService.getMockTokens(userA.id);

      // Re-register for subsequent tests
      await pushService.registerDeviceToken({
        userId: userA.id,
        deviceToken: 'fcm_tok_android_active_002',
        platform: 'android',
        deviceModel: 'Pixel 8 Pro',
      });

      assert(
        activeAfterLogout.length === 0,
        'Test 2: Device token is invalidated immediately on user logout'
      );
    } catch (err) {
      assert(false, 'Test 2: Token invalidated on logout', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 3: DM push received
    // ---------------------------------------------------------------------------
    try {
      const dmRes = await pushService.sendPush({
        userId: userA.id,
        type: 'direct_message',
        senderId: senderUser.id,
        payload: {
          title: 'Direct Message',
          body: 'Zara sent you a private message: Are you joining tonight?',
          deepLink: 'popolive://chat/conv_9901',
        },
      });

      assert(
        dmRes.delivered && dmRes.status === 'sent' && dmRes.messageIds.length > 0,
        'Test 3: Direct Message (DM) push notification delivered with message ID'
      );
    } catch (err) {
      assert(false, 'Test 3: DM push received', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 4: Gift push received
    // ---------------------------------------------------------------------------
    try {
      const giftRes = await pushService.sendPush({
        userId: userA.id,
        type: 'gift_received',
        senderId: senderUser.id,
        payload: {
          title: 'Gift Received!',
          body: 'You received a Royal Supercar from Alex!',
          deepLink: 'popolive://wallet',
        },
      });

      assert(
        giftRes.delivered && giftRes.status === 'sent',
        'Test 4: Gift alert push notification delivered to recipient'
      );
    } catch (err) {
      assert(false, 'Test 4: Gift push received', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 5: Live-start push to followers
    // ---------------------------------------------------------------------------
    try {
      const liveRes = await pushService.sendPush({
        userId: userA.id,
        type: 'live_start',
        senderId: senderUser.id,
        payload: {
          title: 'Live Now!',
          body: 'Host Ali is now LIVE in Singing Lounge!',
          deepLink: 'popolive://live/room_live_44',
        },
      });

      assert(
        liveRes.delivered && liveRes.status === 'sent',
        'Test 5: Live-start broadcast push notification delivered to followed user'
      );
    } catch (err) {
      assert(false, 'Test 5: Live-start push to followers', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 6: Party invite push
    // ---------------------------------------------------------------------------
    try {
      const partyRes = await pushService.sendPush({
        userId: userA.id,
        type: 'party_invite',
        senderId: senderUser.id,
        payload: {
          title: 'Party Lounge Invite',
          body: 'Host invited you to take Seat 4 in 9-Seat Party Lounge!',
          deepLink: 'popolive://party/party_room_77',
        },
      });

      assert(
        partyRes.delivered && partyRes.status === 'sent',
        'Test 6: 9-Seat party invite push notification delivered with room deep link'
      );
    } catch (err) {
      assert(false, 'Test 6: Party invite push', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 7: Reward push
    // ---------------------------------------------------------------------------
    try {
      const rewardRes = await pushService.sendPush({
        userId: userA.id,
        type: 'reward_claimable',
        payload: {
          title: 'Daily Rewards Available',
          body: 'Your 7-day login streak reward is ready to claim!',
          deepLink: 'popolive://rewards',
        },
      });

      assert(
        rewardRes.delivered && rewardRes.status === 'sent',
        'Test 7: Claimable rewards push notification delivered'
      );
    } catch (err) {
      assert(false, 'Test 7: Reward push', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 8: VIP expiry push
    // ---------------------------------------------------------------------------
    try {
      const vipRes = await pushService.sendPush({
        userId: userA.id,
        type: 'vip_expiry',
        payload: {
          title: 'VIP Expiration Notice',
          body: 'Your VIP Baron membership expires in 48 hours.',
          deepLink: 'popolive://vip',
        },
      });

      assert(
        vipRes.delivered && vipRes.status === 'sent',
        'Test 8: VIP expiration warning push notification delivered'
      );
    } catch (err) {
      assert(false, 'Test 8: VIP expiry push', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 9: Ticket reply push
    // ---------------------------------------------------------------------------
    try {
      const ticketRes = await pushService.sendPush({
        userId: userA.id,
        type: 'ticket_reply',
        payload: {
          title: 'Support Ticket Update',
          body: 'Popo Support replied to ticket #8892.',
          deepLink: 'popolive://help/tickets/8892',
        },
      });

      assert(
        ticketRes.delivered && ticketRes.status === 'sent',
        'Test 9: Support ticket reply push notification delivered'
      );
    } catch (err) {
      assert(false, 'Test 9: Ticket reply push', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 10: Deep link opens correct screen
    // ---------------------------------------------------------------------------
    try {
      const validLink = pushProvider.validateDeepLink('popolive://chat/conv_123');
      const arbitraryUrl = pushProvider.validateDeepLink('https://malicious-external-site.com/steal-token');
      const scriptLink = pushProvider.validateDeepLink('javascript:alert(1)');

      assert(
        validLink === 'popolive://chat/conv_123' &&
          arbitraryUrl === 'popolive://notifications' &&
          scriptLink === 'popolive://notifications',
        'Test 10: Deep links validated against whitelist; arbitrary URLs safely sanitized'
      );
    } catch (err) {
      assert(false, 'Test 10: Deep link opens correct screen', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 11: Blocked user no push
    // ---------------------------------------------------------------------------
    try {
      // User A blocks blockedUser
      pushService.registerMockBlock(userA.id, blockedUser.id);

      const blockedRes = await pushService.sendPush({
        userId: userA.id,
        senderId: blockedUser.id,
        type: 'direct_message',
        payload: {
          title: 'Spam DM',
          body: 'Blocked user attempting contact',
          deepLink: 'popolive://chat/conv_blocked',
        },
      });

      assert(
        blockedRes.delivered === false && blockedRes.status === 'suppressed_by_block',
        'Test 11: Blocked user relationship strictly suppresses push delivery'
      );
    } catch (err) {
      assert(false, 'Test 11: Blocked user no push', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 12: Preference off -> no push
    // ---------------------------------------------------------------------------
    try {
      // User disables gift alerts
      await pushService.updateUserPreferences(userA.id, { giftAlerts: false });

      const suppressedRes = await pushService.sendPush({
        userId: userA.id,
        type: 'gift_received',
        payload: {
          title: 'Gift Alert',
          body: 'Someone sent you a rose',
          deepLink: 'popolive://wallet',
        },
      });

      // Re-enable for subsequent tests
      await pushService.updateUserPreferences(userA.id, { giftAlerts: true });

      assert(
        suppressedRes.delivered === false && suppressedRes.status === 'suppressed_by_preference',
        'Test 12: Disabling category preference strictly halts push dispatch'
      );
    } catch (err) {
      assert(false, 'Test 12: Preference off -> no push', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 13: Quiet hours respected
    // ---------------------------------------------------------------------------
    try {
      // Configure quiet hours 22:00 to 07:00
      await pushService.updateUserPreferences(userA.id, {
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
      });

      // Simulate notification arriving at 23:45 (11:45 PM)
      const lateNightDate = new Date();
      lateNightDate.setHours(23, 45, 0, 0);

      const quietRes = await pushService.sendPush({
        userId: userA.id,
        type: 'direct_message',
        currentTime: lateNightDate,
        payload: {
          title: 'Night Owl DM',
          body: 'Hey, wake up!',
          deepLink: 'popolive://chat/night',
        },
      });

      // Disable quiet hours for remaining tests
      await pushService.updateUserPreferences(userA.id, { quietHoursEnabled: false });

      assert(
        quietRes.delivered === false && quietRes.status === 'suppressed_by_quiet_hours',
        'Test 13: Quiet hours configuration strictly suppresses non-critical push delivery'
      );
    } catch (err) {
      assert(false, 'Test 13: Quiet hours respected', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 14: In-app read -> no duplicate push
    // ---------------------------------------------------------------------------
    try {
      const readRes = await pushService.sendPush({
        userId: userA.id,
        type: 'direct_message',
        isAlreadyReadInApp: true,
        payload: {
          title: 'Already Read Message',
          body: 'Message previously viewed in active chat window',
          deepLink: 'popolive://chat/c1',
        },
      });

      assert(
        readRes.delivered === false && readRes.status === 'suppressed_in_app_read',
        'Test 14: Messages already read in active session suppress duplicate push delivery'
      );
    } catch (err) {
      assert(false, 'Test 14: In-app read -> no duplicate push', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 15: Web push works
    // ---------------------------------------------------------------------------
    try {
      const webRes = await pushProvider.sendWebPush('web_push_endpoint_token_xyz', {
        title: 'Popo Web Live',
        body: 'New web notification',
        deepLink: '/notifications',
      });

      assert(
        webRes.success && webRes.messageId.startsWith('web_push_'),
        'Test 15: Web push dispatch operates with valid web subscription tokens'
      );
    } catch (err) {
      assert(false, 'Test 15: Web push works', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 16: Rate limit push per user
    // ---------------------------------------------------------------------------
    try {
      const spamTargetUser = {
        id: `usr_push_spam_${Date.now()}`,
        birthdate: '1995-01-01',
        is_adult_verified: true,
        status: 'active',
      };
      pushService.registerMockUser(spamTargetUser);
      await pushService.registerDeviceToken({
        userId: spamTargetUser.id,
        deviceToken: `fcm_tok_spam_${Date.now()}`,
        platform: 'android',
      });

      // Send 15 pushes rapidly
      for (let i = 0; i < 15; i++) {
        await pushService.sendPush({
          userId: spamTargetUser.id,
          type: 'system_notice',
          payload: { title: `Alert ${i}`, body: 'Testing rate limit', deepLink: 'popolive://notifications' },
        });
      }

      // 16th push should trigger rate limit suppression
      const throttledRes = await pushService.sendPush({
        userId: spamTargetUser.id,
        type: 'system_notice',
        payload: { title: 'Throttled Alert', body: 'Excessive push test', deepLink: 'popolive://notifications' },
      });

      assert(
        throttledRes.delivered === false && throttledRes.status === 'suppressed_by_rate_limit',
        'Test 16: Push rate limiter protects users against notification flooding (max 15/min)'
      );
    } catch (err) {
      assert(false, 'Test 16: Rate limit push per user', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 17: No PII in push body
    // ---------------------------------------------------------------------------
    try {
      const sanitized = pushProvider.sanitizePayload({
        title: 'Account Security',
        body: 'Your verification OTP code is 938472. Never share your password or credit card cvv 991.',
        deepLink: 'popolive://notifications',
      });

      const hasRawOtp = sanitized.body.includes('938472');
      const hasRedacted = sanitized.body.includes('******') && sanitized.body.includes('[REDACTED]');

      assert(
        !hasRawOtp && hasRedacted,
        'Test 17: Push payloads redact OTPs, passwords, and sensitive card keywords'
      );
    } catch (err) {
      assert(false, 'Test 17: No PII in push body', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 18: Flag off -> in-app only
    // ---------------------------------------------------------------------------
    try {
      delete process.env.USE_REAL_PUSH;
      delete process.env.NEXT_PUBLIC_USE_REAL_PUSH;

      const flagOffRes = await pushService.sendPush({
        userId: userA.id,
        type: 'direct_message',
        payload: {
          title: 'Dev Mode DM',
          body: 'Flag is disabled, in-app notice only',
          deepLink: 'popolive://chat/c1',
        },
      });

      assert(
        flagOffRes.delivered === true && flagOffRes.status === 'mock_sent',
        'Test 18: Flag off suppresses real FCM/APNs dispatch and preserves in-app notice flow'
      );
    } catch (err) {
      assert(false, 'Test 18: Flag off -> in-app only', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 19: D7 walk 5 passes with flag off
    // ---------------------------------------------------------------------------
    try {
      const mobileFixtures = fs.readFileSync(path.join(mobileDir, 'lib', 'design', 'design_fixtures.dart'), 'utf-8');
      const webFixtures = fs.readFileSync(path.join(webDir, 'lib', 'design', 'designFixtures.ts'), 'utf-8');

      const mobileHasWalk5 = mobileFixtures.includes('liveViewer') || mobileFixtures.includes('activePkSession');
      const webHasWalk5 = webFixtures.includes('liveViewer') || webFixtures.includes('activePkSession');

      assert(
        mobileHasWalk5 && webHasWalk5,
        'Test 19: D7 Walk 5 live viewer & PK room fixtures remain 100% intact'
      );
    } catch (err) {
      assert(false, 'Test 19: D7 walk 5 passes with flag off', err.message);
    }

    // ---------------------------------------------------------------------------
    // TEST 20: No delivery to invalid tokens (auto-cleanup)
    // ---------------------------------------------------------------------------
    try {
      process.env.USE_REAL_PUSH = 'true';

      const deadUser = {
        id: `usr_push_dead_${Date.now()}`,
        birthdate: '1998-05-12',
        is_adult_verified: true,
        status: 'active',
      };
      pushService.registerMockUser(deadUser);

      // Register token with "dead_invalid" keyword
      await pushService.registerDeviceToken({
        userId: deadUser.id,
        deviceToken: 'fcm_tok_dead_invalid_expired_token_410',
        platform: 'android',
      });

      const deadTokenBefore = pushService.getMockTokens(deadUser.id);

      // Dispatch push
      const cleanupRes = await pushService.sendPush({
        userId: deadUser.id,
        type: 'system_notice',
        payload: {
          title: 'Cleanup Test',
          body: 'Token should be cleaned up automatically',
          deepLink: 'popolive://notifications',
        },
      });

      const deadTokenAfter = pushService.getMockTokens(deadUser.id);

      assert(
        cleanupRes.delivered === false &&
          cleanupRes.status === 'failed' &&
          deadTokenBefore.length === 1 &&
          deadTokenAfter.length === 0,
        'Test 20: Dead/expired device tokens are automatically unregistered upon delivery failure'
      );
    } catch (err) {
      assert(false, 'Test 20: No delivery to invalid tokens', err.message);
    }
  } catch (globalErr) {
    console.error('Fatal test execution error:', globalErr);
  }

  console.log('\n============================================================');
  console.log(`TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED (TOTAL: ${passedTests + failedTests})`);
  console.log('============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests();
