// E2E Verification Script for Phase 2 Prompt 06/10: Real-Time Live Chat, User Safety, Report, Block & Mute System
// Tests multi-device flow: Host (Device A), Viewer 1 (Device B), Viewer 2 (Device C)
// Verifies live chat synchronization, local/global mutes, blocklists, abuse reports, and rules acceptance.

const crypto = require('crypto');

const BASE_URL = 'http://localhost:3000';

function generateConsentCookie() {
  const payload = {
    consentId: 'consent_' + Date.now(),
    anonymousSessionId: 'anon_' + Date.now(),
    termsVersion: 'v4.2.0',
    privacyVersion: 'v4.2.0',
    status: 'accepted',
    timestamp: Date.now(),
  };
  const SECRET_KEY = process.env.CONSENT_SECRET_KEY || 'poppo-live-secure-consent-salt-2026-v4';
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(data).digest('base64url');
  return `${data}.${signature}`;
}

const sampleBase64Jpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

class ClientDevice {
  constructor(name) {
    this.name = name;
    this.sessionCookie = '';
    this.consentCookie = generateConsentCookie();
    this.ip = `192.168.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 200) + 1}`;
    this.user = null;
  }

  async request(path, options = {}) {
    const url = `${BASE_URL}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-Forwarded-For': this.ip,
      ...(options.headers || {}),
    };

    const cookieParts = [];
    if (this.consentCookie) cookieParts.push(`poppo_terms_consent=${this.consentCookie}`);
    if (this.sessionCookie) cookieParts.push(`poppo_session=${this.sessionCookie}`);
    if (cookieParts.length > 0 && !headers['Cookie']) {
      headers['Cookie'] = cookieParts.join('; ');
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const match = setCookie.match(/poppo_session=([^;]+)/);
      if (match) {
        this.sessionCookie = match[1];
      }
    }

    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
    return { status: res.status, ok: res.ok, data: json, headers: res.headers };
  }

  async registerUser(prefix, gender = 'female') {
    const email = `${prefix}_${Date.now()}_${Math.floor(Math.random() * 9000)}@testpopo.com`;
    const nickname = `${prefix}_${Math.floor(Math.random() * 9000 + 1000)}`;
    const regRes = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        nickname,
        email,
        password: 'SecurePassword123!',
        isAdultConfirmed: true,
        gender,
        country: 'PK',
      }),
    });
    if (regRes.status === 200 || regRes.status === 201) {
      this.user = regRes.data?.user || { id: regRes.data?.userId, nickname };
      return true;
    }
    return false;
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('POPO LIVE — PHASE 2 PROMPT 06/10: LIVE CHAT & SAFETY E2E');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  const deviceA_Host = new ClientDevice('Host_Device_A');
  const deviceB_Viewer1 = new ClientDevice('Viewer1_Device_B');
  const deviceC_Viewer2 = new ClientDevice('Viewer2_Device_C');

  // -------------------------------------------------------------
  // Test 1: User Provisioning for 3 Devices
  // -------------------------------------------------------------
  console.log('--- Test 1: Provisioning 3 Distinct User Accounts ---');
  const hostOk = await deviceA_Host.registerUser('HostZara', 'female');
  assert(hostOk, 'Device A registered as Broadcaster');

  const viewer1Ok = await deviceB_Viewer1.registerUser('ViewerAli', 'male');
  assert(viewer1Ok, 'Device B registered as Viewer 1');

  const viewer2Ok = await deviceC_Viewer2.registerUser('ViewerTroll', 'male');
  assert(viewer2Ok, 'Device C registered as Viewer 2 (Target)');

  const hostUserId = deviceA_Host.user?.id;
  const viewer1UserId = deviceB_Viewer1.user?.id;
  const viewer2UserId = deviceC_Viewer2.user?.id;

  assert(Boolean(hostUserId && viewer1UserId && viewer2UserId), 'All 3 user IDs successfully acquired');

  // -------------------------------------------------------------
  // Test 2: Host Gates & Broadcast Launch
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Host Completes Gates & Starts Live Stream ---');
  await deviceA_Host.request('/api/live/gates/face-verify', {
    method: 'POST',
    body: JSON.stringify({ simulateFailure: false, imageSnapshot: sampleBase64Jpeg }),
  });

  const coverRes = await deviceA_Host.request('/api/live/gates/cover-upload', {
    method: 'POST',
    body: JSON.stringify({ imageBase64: sampleBase64Jpeg, aspectRatio: '3:4' }),
  });
  const coverUrl = coverRes.data?.coverUrl || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7';

  await deviceA_Host.request('/api/live/gates/verify-eligibility', {
    method: 'PUT',
    body: JSON.stringify({ wealthLevel: 5 }),
  });

  const broadcastRes = await deviceA_Host.request('/api/live/studio/start', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Chat & Moderation Verification Stream 🛡️',
      category: 'Chat',
      coverUrl,
    }),
  });

  assert(broadcastRes.status === 200, 'Host stream launched successfully (200)');
  const roomId = broadcastRes.data?.room?.id;
  assert(Boolean(roomId), `Active Room ID: ${roomId}`);

  // Viewers join room
  await deviceB_Viewer1.request('/api/live/viewer/join', {
    method: 'POST',
    body: JSON.stringify({ roomId }),
  });
  await deviceC_Viewer2.request('/api/live/viewer/join', {
    method: 'POST',
    body: JSON.stringify({ roomId }),
  });

  // -------------------------------------------------------------
  // Test 3: Live Chat Sending & Timeline Synchronization
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Live Chat Sending & Timeline Synchronization ---');
  // Message 1 from Viewer 1
  const msg1Res = await deviceB_Viewer1.request('/api/live/chat/send', {
    method: 'POST',
    body: JSON.stringify({
      roomId,
      text: 'Hello from Viewer 1! Amazing stream ❤️',
      emoji: '❤️',
    }),
  });
  assert(msg1Res.status === 200 || msg1Res.status === 201, 'Viewer 1 sent chat message');

  // Message 2 from Viewer 2
  const msg2Res = await deviceC_Viewer2.request('/api/live/chat/send', {
    method: 'POST',
    body: JSON.stringify({
      roomId,
      text: 'Hello everyone from Viewer 2! 👋',
      emoji: '👋',
    }),
  });
  assert(msg2Res.status === 200 || msg2Res.status === 201, 'Viewer 2 sent chat message');

  // Message 3 from Host
  const hostMsgRes = await deviceA_Host.request('/api/live/chat/send', {
    method: 'POST',
    body: JSON.stringify({
      roomId,
      text: 'Welcome to the live room everyone! Enjoy and be respectful 💕',
      emoji: '💕',
      senderRole: 'host',
    }),
  });
  assert(hostMsgRes.status === 200 || hostMsgRes.status === 201, 'Host sent broadcast chat message');

  // Fetch timeline
  const feedRes = await deviceB_Viewer1.request(`/api/live/chat/messages?roomId=${roomId}`);
  assert(feedRes.status === 200, 'Live chat messages feed fetched successfully');
  const feedMessages = feedRes.data?.messages || [];
  assert(feedMessages.length >= 3, `Feed contains ${feedMessages.length} messages (expected >= 3)`);

  const hasViewer1 = feedMessages.some(m => m.messageText?.includes('Viewer 1') || m.text?.includes('Viewer 1'));
  const hasViewer2 = feedMessages.some(m => m.messageText?.includes('Viewer 2') || m.text?.includes('Viewer 2'));
  const hasHost = feedMessages.some(m => m.senderRole === 'host' || m.messageText?.includes('respectful'));
  assert(hasViewer1 && hasViewer2 && hasHost, 'All 3 participants messages synchronized in room timeline');

  // -------------------------------------------------------------
  // Test 4: Chat Message Validation & Bounds
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Chat Validation & Bounds ---');
  // Empty message
  const emptyRes = await deviceB_Viewer1.request('/api/live/chat/send', {
    method: 'POST',
    body: JSON.stringify({ roomId, text: '   ' }),
  });
  assert(emptyRes.status === 400, 'Empty chat message rejected with 400 Bad Request');

  // Exceeding 300 characters
  const longText = 'A'.repeat(305);
  const longRes = await deviceB_Viewer1.request('/api/live/chat/send', {
    method: 'POST',
    body: JSON.stringify({ roomId, text: longText }),
  });
  assert(longRes.status === 400, 'Exceeding 300-char message rejected with 400 Bad Request');

  // -------------------------------------------------------------
  // Test 5: Viewer Mute System (Local Scope)
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Viewer Mute System (Local Scope) ---');
  // Viewer 1 mutes Viewer 2 locally
  const muteViewerLocal = await deviceB_Viewer1.request('/api/live/safety/mute', {
    method: 'POST',
    body: JSON.stringify({
      roomId,
      targetUserId: viewer2UserId,
      targetNickname: 'ViewerTroll',
      muteType: 'viewer_local',
      requesterRole: 'viewer',
    }),
  });
  assert(muteViewerLocal.status === 200 && muteViewerLocal.data.muted === true, 'Viewer 1 muted Viewer 2 locally');

  // Verify Viewer 1 query reflects muted user
  const viewerMutes = await deviceB_Viewer1.request(`/api/live/safety/mute?roomId=${roomId}`);
  assert(viewerMutes.status === 200, 'Viewer 1 fetched active room mutes');
  const mutedIds = viewerMutes.data?.mutedUserIds || [];
  assert(mutedIds.includes(viewer2UserId), 'Viewer 2 is confirmed in Viewer 1 muted list');

  // Viewer 1 attempts to mute the Host (Forbidden)
  const muteHostRes = await deviceB_Viewer1.request('/api/live/safety/mute', {
    method: 'POST',
    body: JSON.stringify({
      roomId,
      targetUserId: hostUserId,
      targetNickname: 'HostZara',
      muteType: 'viewer_local',
      requesterRole: 'viewer',
    }),
  });
  assert(muteHostRes.status === 403, 'Viewer attempting to mute Room Host is rejected with 403 Forbidden');

  // Viewer 1 unmutes Viewer 2
  const unmuteLocalRes = await deviceB_Viewer1.request(
    `/api/live/safety/mute?roomId=${roomId}&targetUserId=${viewer2UserId}&muteType=viewer_local`,
    { method: 'DELETE' }
  );
  assert(unmuteLocalRes.status === 200 && unmuteLocalRes.data.muted === false, 'Viewer 1 unmuted Viewer 2 locally');

  // -------------------------------------------------------------
  // Test 6: Host Moderation Mute System (Room-Wide Scope)
  // -------------------------------------------------------------
  console.log('\n--- Test 6: Host Moderation Mute System (Room-Wide Scope) ---');
  // Viewer 1 attempts unauthorized room_global mute (Forbidden)
  const unauthGlobalMute = await deviceB_Viewer1.request('/api/live/safety/mute', {
    method: 'POST',
    body: JSON.stringify({
      roomId,
      targetUserId: viewer2UserId,
      muteType: 'room_global',
      requesterRole: 'viewer',
    }),
  });
  assert(unauthGlobalMute.status === 403, 'Unauthorized viewer attempting room_global mute is rejected with 403');

  // Host executes room_global mute on Viewer 2
  const hostGlobalMute = await deviceA_Host.request('/api/live/safety/mute', {
    method: 'POST',
    body: JSON.stringify({
      roomId,
      targetUserId: viewer2UserId,
      targetNickname: 'ViewerTroll',
      muteType: 'room_global',
      requesterRole: 'host',
    }),
  });
  assert(hostGlobalMute.status === 200 && hostGlobalMute.data.muted === true, 'Host executed room_global mute on Viewer 2');

  // Unmute room_global
  const hostUnmuteGlobal = await deviceA_Host.request(
    `/api/live/safety/mute?roomId=${roomId}&targetUserId=${viewer2UserId}&muteType=room_global`,
    { method: 'DELETE' }
  );
  assert(hostUnmuteGlobal.status === 200 && hostUnmuteGlobal.data.muted === false, 'Host unmuted Viewer 2 room-wide');

  // -------------------------------------------------------------
  // Test 7: User Block System
  // -------------------------------------------------------------
  console.log('\n--- Test 7: User Block & Blacklist System ---');
  // Viewer 1 blocks Viewer 2
  const blockRes = await deviceB_Viewer1.request('/api/live/safety/block', {
    method: 'POST',
    body: JSON.stringify({
      targetUserId: viewer2UserId,
      targetNickname: 'ViewerTroll',
      roomId,
    }),
  });
  assert(blockRes.status === 200 && blockRes.data.blocked === true, 'Viewer 1 blocked Viewer 2');

  // Verify blocked list
  const blocklistRes = await deviceB_Viewer1.request('/api/live/safety/block');
  assert(blocklistRes.status === 200, 'Viewer 1 fetched user blacklist');
  const blockedIds = blocklistRes.data?.blockedUserIds || [];
  assert(blockedIds.includes(viewer2UserId), 'Viewer 2 ID confirmed present in user blacklist');

  // Viewer 1 unblocks Viewer 2
  const unblockRes = await deviceB_Viewer1.request(`/api/live/safety/block?targetUserId=${viewer2UserId}`, {
    method: 'DELETE',
  });
  assert(unblockRes.status === 200 && unblockRes.data.blocked === false, 'Viewer 1 unblocked Viewer 2');

  // -------------------------------------------------------------
  // Test 8: User Report System
  // -------------------------------------------------------------
  console.log('\n--- Test 8: User Safety Report System ---');
  // Viewer 1 submits legitimate abuse report with valid reason
  const reportRes = await deviceB_Viewer1.request('/api/live/safety/report', {
    method: 'POST',
    body: JSON.stringify({
      roomId,
      reportedUserId: viewer2UserId,
      reportedNickname: 'ViewerTroll',
      reason: 'harassment_bullying',
      description: 'Used abusive language in live chat',
    }),
  });
  assert(reportRes.status === 200 && reportRes.data.success === true, 'Abuse report submitted successfully');
  const reportId = reportRes.data.reportId || reportRes.data.reportCode;
  assert(Boolean(reportId), `Report tracking code generated: ${reportId}`);

  // Disallow self-reporting
  const selfReportRes = await deviceB_Viewer1.request('/api/live/safety/report', {
    method: 'POST',
    body: JSON.stringify({
      roomId,
      reportedUserId: viewer1UserId,
      reason: 'spam',
    }),
  });
  assert(selfReportRes.status === 400, 'Self-reporting rejected with 400 Bad Request');

  // Invalid report reason
  const invalidReasonRes = await deviceB_Viewer1.request('/api/live/safety/report', {
    method: 'POST',
    body: JSON.stringify({
      roomId,
      reportedUserId: viewer2UserId,
      reason: 'fake_unsupported_reason_xyz',
    }),
  });
  assert(invalidReasonRes.status === 400, 'Invalid report reason rejected with 400 Bad Request');

  // Duplicate report rate-limiting
  const dupReportRes = await deviceB_Viewer1.request('/api/live/safety/report', {
    method: 'POST',
    body: JSON.stringify({
      roomId,
      reportedUserId: viewer2UserId,
      reason: 'harassment_bullying',
    }),
  });
  assert(dupReportRes.status === 429, 'Duplicate report rejected with 429 Too Many Requests');

  // -------------------------------------------------------------
  // Test 9: Live Community Rules & Acceptance
  // -------------------------------------------------------------
  console.log('\n--- Test 9: Live Community Rules & Policy Acceptance ---');
  // Fetch canonical rules
  const rulesRes = await deviceB_Viewer1.request('/api/live/rules');
  assert(rulesRes.status === 200 && rulesRes.data.success === true, 'Canonical live rules retrieved (200)');
  const rulesList = rulesRes.data?.rules || [];
  assert(rulesList.length >= 4, `Retrieved ${rulesList.length} canonical community rules (expected >= 4)`);

  // Check acceptance status
  const rulesStatusRes = await deviceB_Viewer1.request('/api/live/rules/status');
  assert(rulesStatusRes.status === 200, 'Live rules status retrieved');

  // Accept community rules
  const acceptRulesRes = await deviceB_Viewer1.request('/api/live/rules/accept', {
    method: 'POST',
    body: JSON.stringify({
      policyVersion: rulesRes.data?.policyVersion || 'v1.0',
      acknowledgedCheckbox: true,
    }),
  });
  assert(acceptRulesRes.status === 200 && acceptRulesRes.data.success === true, 'Live rules accepted successfully');

  // -------------------------------------------------------------
  // Test 10: Clean Host Stream Termination
  // -------------------------------------------------------------
  console.log('\n--- Test 10: Graceful Broadcast End ---');
  const endRes = await deviceA_Host.request('/api/live/studio/end', {
    method: 'POST',
    body: JSON.stringify({ roomId }),
  });
  assert(endRes.status === 200, 'Host ended broadcast successfully');

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
