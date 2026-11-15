// E2E Verification Script for Phase 2 Prompt 05/10: Actual Live Viewer Experience & Video Playback
// Tests two-device flow: Host (Device A) broadcasts -> Viewer (Device B) joins, subscribes, chats, leaves, and room persists until host ends.

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

// Client session manager for multi-client testing (Host Device A vs Viewer Device B)
class ClientDevice {
  constructor(name) {
    this.name = name;
    this.sessionCookie = '';
    this.consentCookie = generateConsentCookie();
    this.ip = `192.168.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 200) + 1}`;
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
}

async function runTests() {
  console.log('================================================================');
  console.log('POPO LIVE — PHASE 2 PROMPT 05/10: VIEWER ROOM & PLAYBACK E2E');
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
  const deviceB_Viewer = new ClientDevice('Viewer_Device_B');
  const unauthClient = new ClientDevice('Unauth_Device');

  // -------------------------------------------------------------
  // Test 1: Unauthorized Access Guard
  // -------------------------------------------------------------
  console.log('--- Test 1: Unauthorized Access Guard ---');
  const unauthStart = await unauthClient.request('/api/live/studio/start', {
    method: 'POST',
    body: JSON.stringify({ title: 'Unauthorized Stream' }),
  });
  assert(unauthStart.status === 401, 'POST /api/live/studio/start without session returns 401 Unauthorized');

  const unauthSession = await unauthClient.request('/api/live/viewer/session?roomId=non-existent-room-999');
  assert(unauthSession.status === 404, 'GET /api/live/viewer/session for nonexistent room returns 404');

  // -------------------------------------------------------------
  // Test 2: Provision Host (Device A) & Start Live Stream
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Host (Device A) Registration & Broadcast Start ---');
  const hostEmail = `host_viewer_e2e_${Date.now()}@testpopo.com`;
  const hostReg = await deviceA_Host.request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      nickname: 'Broadcaster_' + Math.floor(Math.random() * 9000 + 1000),
      email: hostEmail,
      password: 'HostPassword123!',
      isAdultConfirmed: true,
      gender: 'female',
      country: 'PK',
    }),
  });
  assert(hostReg.status === 200 || hostReg.status === 201, `Host registered successfully (${hostReg.status})`);
  assert(deviceA_Host.sessionCookie.length > 0, 'Host acquired session cookie');

  // Complete host gates: face verification + cover upload + wealth level
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

  const eligibilityCheck = await deviceA_Host.request('/api/live/gates/verify-eligibility', {
    method: 'POST',
    body: JSON.stringify({}),
  });
  assert(eligibilityCheck.status === 200 && eligibilityCheck.data?.eligible === true, 'Host passed all 3 Go-Live gates');

  // Host starts stream
  const broadcastStart = await deviceA_Host.request('/api/live/studio/start', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Audience Interaction Test Stream 🌟',
      category: 'Chat',
      coverUrl,
    }),
  });

  assert(broadcastStart.status === 200, `Host broadcast started successfully (${broadcastStart.status})`);
  const roomId = broadcastStart.data?.room?.id;
  assert(Boolean(roomId), `Active Room ID acquired: ${roomId}`);
  const hostAgora = broadcastStart.data?.agora;
  assert(hostAgora?.role === 'publisher', 'Host Agora role is strictly publisher');

  // -------------------------------------------------------------
  // Test 3: Provision Viewer (Device B)
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Viewer (Device B) Registration ---');
  const viewerEmail = `viewer_${Date.now()}@testpopo.com`;
  const viewerReg = await deviceB_Viewer.request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      nickname: 'ViewerFan_' + Math.floor(Math.random() * 9000 + 1000),
      email: viewerEmail,
      password: 'ViewerPassword123!',
      isAdultConfirmed: true,
      gender: 'male',
      country: 'PK',
    }),
  });
  assert(viewerReg.status === 200 || viewerReg.status === 201, `Viewer registered successfully (${viewerReg.status})`);
  assert(deviceB_Viewer.sessionCookie.length > 0, 'Viewer acquired session cookie');

  // -------------------------------------------------------------
  // Test 4: Viewer Joins Room (POST /api/live/viewer/join)
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Viewer Joins Live Room ---');
  const viewerJoinRes = await deviceB_Viewer.request('/api/live/viewer/join', {
    method: 'POST',
    body: JSON.stringify({ roomId }),
  });
  assert(viewerJoinRes.status === 200, `Viewer joined room (${viewerJoinRes.status})`);
  assert(typeof viewerJoinRes.data.viewerCount === 'number', `Viewer count returned: ${viewerJoinRes.data.viewerCount}`);
  assert(viewerJoinRes.data.viewerCount >= 1, 'Viewer count correctly incremented >= 1');

  // -------------------------------------------------------------
  // Test 5: Viewer Fetches Room Session & Agora Subscriber Token
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Viewer Session Acquisition & Role Check ---');
  const viewerSessionRes = await deviceB_Viewer.request(`/api/live/viewer/session?roomId=${roomId}`);
  assert(viewerSessionRes.status === 200, `Viewer session retrieved (${viewerSessionRes.status})`);
  assert(viewerSessionRes.data.room?.id === roomId, 'Session room ID matches');
  assert(viewerSessionRes.data.room?.status === 'live', 'Room status is verified live');
  assert(viewerSessionRes.data.agora?.role === 'subscriber', 'Agora role is strictly subscriber (cannot publish)');
  assert(Boolean(viewerSessionRes.data.agora?.token), 'Viewer received valid Agora subscriber token');
  assert(Boolean(viewerSessionRes.data.host?.nickname), `Host details present: ${viewerSessionRes.data.host?.nickname}`);

  // -------------------------------------------------------------
  // Test 6: Live Chat Messaging (Send & Receive)
  // -------------------------------------------------------------
  console.log('\n--- Test 6: Live Chat Messaging ---');
  const testMessageText = 'Hello Host! Greetings from Karachi 👋';
  const chatSendRes = await deviceB_Viewer.request('/api/live/chat/send', {
    method: 'POST',
    body: JSON.stringify({
      roomId,
      text: testMessageText,
      emoji: '👋',
    }),
  });
  assert(chatSendRes.status === 200 || chatSendRes.status === 201, `Chat message sent (${chatSendRes.status})`);

  const chatMessagesRes = await deviceB_Viewer.request(`/api/live/chat/messages?roomId=${roomId}`);
  assert(chatMessagesRes.status === 200, `Chat messages fetched (${chatMessagesRes.status})`);
  const messages = chatMessagesRes.data.messages || [];
  const foundMsg = messages.find(
    m => m.messageText === testMessageText || m.fullText?.includes('Karachi') || m.text === testMessageText
  );
  assert(Boolean(foundMsg), 'Live chat message confirmed in room message feed');

  // -------------------------------------------------------------
  // Test 7: Viewer Leaves Room (POST /api/live/viewer/leave)
  // -------------------------------------------------------------
  console.log('\n--- Test 7: Viewer Leaves Room (Broadcast Remains Live) ---');
  const viewerLeaveRes = await deviceB_Viewer.request('/api/live/viewer/leave', {
    method: 'POST',
    body: JSON.stringify({ roomId }),
  });
  assert(viewerLeaveRes.status === 200, `Viewer left room (${viewerLeaveRes.status})`);

  // Verify host session is still LIVE after viewer leaves
  const hostCheckSession = await deviceA_Host.request(`/api/live/studio/session?roomId=${roomId}`);
  assert(hostCheckSession.status === 200, 'Host broadcast is still running after viewer left');
  assert(hostCheckSession.data.room?.status === 'live', 'Host room status remains live');

  // -------------------------------------------------------------
  // Test 8: Host Terminates Stream (POST /api/live/studio/end)
  // -------------------------------------------------------------
  console.log('\n--- Test 8: Host Terminates Live Broadcast ---');
  const endStreamRes = await deviceA_Host.request('/api/live/studio/end', {
    method: 'POST',
    body: JSON.stringify({ roomId }),
  });
  assert(endStreamRes.status === 200, `Host ended stream successfully (${endStreamRes.status})`);

  // Verify viewer sees ended room status
  const closedSessionRes = await deviceB_Viewer.request(`/api/live/viewer/session?roomId=${roomId}`);
  assert(
    closedSessionRes.status === 404 || closedSessionRes.data?.room?.status === 'ended' || closedSessionRes.data?.room?.isLive === false,
    'Viewer session correctly reflects ended stream'
  );

  // -------------------------------------------------------------
  // Final Summary
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
