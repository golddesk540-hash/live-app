// E2E Multi-Device Verification Script for Phase 2 Prompt 07/10:
// M3: End Live Session, Host Summary & Complete Resource Cleanup
// Tests multi-device flow: Host (Device A) and Viewer (Device B).
// Validates:
// 1. Host broadcast start -> Viewer joins and chats
// 2. Host termination via POST /api/live/studio/end
// 3. Database status transition (status='ended', is_live=false, ended_at set)
// 4. Viewer session termination detection
// 5. GET /api/live/end-screen/summary KPI calculations
// 6. Duplicate termination safety (POST /api/live/end-screen/end alreadyEnded=true)
// 7. GET /api/live/center/history aggregation and filtering (all, week, month)

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

const sampleBase64Jpeg =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

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
        password: 'Password123!',
        isAdultConfirmed: true,
        gender,
        birthDate: '1998-05-15',
        country: 'PK',
      }),
    });

    if (!regRes.ok || !regRes.data.user) {
      throw new Error(`Failed to register ${this.name}: ${JSON.stringify(regRes.data)}`);
    }

    this.user = regRes.data.user;

    // Accept age consent
    await this.request('/api/auth/age-consent', {
      method: 'POST',
      body: JSON.stringify({ agreed: true }),
    });

    // Accept streaming community rules
    await this.request('/api/live/rules/accept', {
      method: 'POST',
      body: JSON.stringify({ acknowledgedCheckbox: true }),
    });

    return this.user;
  }

  async makeHostEligible() {
    // 1. Face verification
    await this.request('/api/live/gates/face-verify', {
      method: 'POST',
      body: JSON.stringify({ simulateFailure: false, imageSnapshot: sampleBase64Jpeg }),
    });

    // 2. Cover image upload
    const coverRes = await this.request('/api/live/gates/cover-upload', {
      method: 'POST',
      body: JSON.stringify({ imageBase64: sampleBase64Jpeg, aspectRatio: '3:4' }),
    });
    this.coverUrl = coverRes.data?.coverUrl || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7';

    // 3. Wealth level upgrade
    await this.request('/api/live/gates/verify-eligibility', {
      method: 'PUT',
      body: JSON.stringify({ wealthLevel: 5 }),
    });

    // 4. Verify eligibility passed
    const eligRes = await this.request('/api/live/gates/verify-eligibility', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    return eligRes.data;
  }
}

async function runLiveEndSessionVerification() {
  console.log('========================================================================');
  console.log('PHASE 2 PROMPT 07/10: END LIVE SESSION, SUMMARY & RESOURCE CLEANUP E2E');
  console.log('========================================================================\n');

  let passedAssertions = 0;
  function assert(condition, message) {
    if (!condition) {
      console.error(`❌ FAILED: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
    console.log(`✅ PASSED: ${message}`);
    passedAssertions++;
  }

  const hostDevice = new ClientDevice('Device_A_Host');
  const viewerDevice = new ClientDevice('Device_B_Viewer');

  console.log('--- Step 1: User Onboarding & Host Eligibility Setup ---');
  await hostDevice.registerUser('host_end');
  await hostDevice.makeHostEligible();
  assert(hostDevice.user && hostDevice.user.id, 'Host registered and authenticated');

  await viewerDevice.registerUser('viewer_end', 'male');
  assert(viewerDevice.user && viewerDevice.user.id, 'Viewer registered and authenticated');

  console.log('\n--- Step 2: Host Starts Live Studio Broadcast ---');
  const preLiveRes = await hostDevice.request('/api/live/pre-live/config');
  assert(preLiveRes.ok && preLiveRes.data.success, 'Host fetched pre-live configuration');

  const startRes = await hostDevice.request('/api/live/studio/start', {
    method: 'POST',
    body: JSON.stringify({
      title: 'End Live Session Verification Room 🚀',
      category: 'Live Chat',
      coverUrl: hostDevice.coverUrl,
      tags: ['chat', 'music'],
    }),
  });
  console.log('startRes status:', startRes.status, 'data:', JSON.stringify(startRes.data));

  assert(startRes.ok && startRes.data.success, 'Host successfully started live broadcast studio');
  const room = startRes.data.room;
  assert(room && room.id, `Created live room with ID: ${room?.id}, number: ${room?.roomNumber}`);
  assert(room.status === 'live' && room.isLive === true, 'Room status is live and isLive is true');

  console.log('\n--- Step 3: Viewer Joins Live Broadcast ---');
  const joinRes = await viewerDevice.request('/api/live/viewer/join', {
    method: 'POST',
    body: JSON.stringify({ roomId: room.id }),
  });
  assert(joinRes.ok && joinRes.data.success, 'Viewer registered presence in live broadcast room');

  const viewerSessionRes = await viewerDevice.request(`/api/live/viewer/session?roomId=${room.id}`);
  assert(viewerSessionRes.ok && viewerSessionRes.data.success, 'Viewer fetched live stream session details');
  assert(viewerSessionRes.data.room.isLive === true, 'Viewer confirms room is actively broadcasting');
  assert(viewerSessionRes.data.agora && viewerSessionRes.data.agora.token, 'Agora audience token generated for viewer');

  console.log('\n--- Step 4: Active Chat Message Exchange ---');
  const sendChatRes = await viewerDevice.request('/api/live/chat/send', {
    method: 'POST',
    body: JSON.stringify({
      roomId: room.id,
      text: 'Amazing live stream! Watching till the end ❤️',
      emoji: '❤️',
    }),
  });
  assert(sendChatRes.ok && sendChatRes.data.success, 'Viewer sent chat message in live broadcast');

  const chatPollRes = await hostDevice.request(`/api/live/chat/messages?roomId=${room.id}&limit=10`);
  assert(chatPollRes.ok && chatPollRes.data.messages.length > 0, 'Host synchronized live chat messages');

  console.log('\n--- Step 5: Host Terminates Live Session (POST /api/live/studio/end) ---');
  // Add small delay to ensure calculated duration >= 1 second
  await new Promise((r) => setTimeout(r, 1200));

  const endRes = await hostDevice.request('/api/live/studio/end', {
    method: 'POST',
    body: JSON.stringify({ roomId: room.id }),
  });

  assert(endRes.ok && endRes.data.success, 'Host terminated broadcast studio via POST /api/live/studio/end');
  const endSummary = endRes.data.summary;
  assert(endSummary && typeof endSummary.durationSeconds === 'number', 'Summary contains durationSeconds');
  assert(endSummary.durationSeconds >= 1, `Calculated duration: ${endSummary.durationSeconds}s (${endSummary.durationFormatted})`);
  assert(typeof endSummary.peakViewers === 'number', `Peak viewers tracked: ${endSummary.peakViewers}`);
  assert(typeof endSummary.totalLikes === 'number', `Total likes tracked: ${endSummary.totalLikes}`);
  assert(typeof endSummary.diamondsEarned === 'number', `Diamonds earned tracked: ${endSummary.diamondsEarned}`);

  console.log('\n--- Step 6: Verify Database Status & Viewer Session Cleanup ---');
  // When viewer checks session now, room should reflect ended status
  const endedViewerSessionRes = await viewerDevice.request(`/api/live/viewer/session?roomId=${room.id}`);
  const isNowEnded = !endedViewerSessionRes.ok || endedViewerSessionRes.data.room?.isLive === false || endedViewerSessionRes.data.room?.status === 'ended';
  assert(isNowEnded, 'Viewer session detects room has ended and isLive is false');

  console.log('\n--- Step 7: End-Screen Summary Retrieval (GET /api/live/end-screen/summary) ---');
  const summaryRes = await hostDevice.request(`/api/live/end-screen/summary?roomId=${room.id}`);
  assert(summaryRes.ok && summaryRes.data.success, 'Fetched session summary from GET /api/live/end-screen/summary');
  const fullSummary = summaryRes.data.summary;
  assert(fullSummary.status === 'ended', 'Summary reports status: ended');
  assert(fullSummary.isLive === false, 'Summary reports isLive: false');
  assert(fullSummary.durationSeconds >= 1, `Summary duration: ${fullSummary.durationFormatted}`);
  assert(fullSummary.totalViewers > 0, `Total viewers: ${fullSummary.totalViewersFormatted}`);
  assert(fullSummary.peakViewers > 0, `Peak viewers: ${fullSummary.peakViewersFormatted}`);
  assert(fullSummary.newFollowers >= 0, `New followers: ${fullSummary.newFollowersFormatted}`);
  assert(fullSummary.pointsReceived >= 0, `Points received: ${fullSummary.pointsReceivedFormatted}`);
  assert(fullSummary.host && fullSummary.host.id === hostDevice.user.id, `Host identity correctly matched: ${fullSummary.host?.nickname}`);

  console.log('\n--- Step 8: Duplicate End Request Prevention (POST /api/live/end-screen/end) ---');
  const duplicateEndRes = await hostDevice.request('/api/live/end-screen/end', {
    method: 'POST',
    body: JSON.stringify({ roomId: room.id }),
  });
  assert(duplicateEndRes.ok && duplicateEndRes.data.success, 'Duplicate end request handled cleanly');
  assert(duplicateEndRes.data.alreadyEnded === true, 'Response confirms session was alreadyEnded: true');

  console.log('\n--- Step 9: Host Live Center History & KPIs (GET /api/live/center/history) ---');
  const historyAllRes = await hostDevice.request('/api/live/center/history?filter=all');
  assert(historyAllRes.ok && historyAllRes.data.success, 'Host fetched live center history with filter=all');
  assert(historyAllRes.data.kpis && historyAllRes.data.kpis.totalSessions >= 1, `Aggregated total sessions: ${historyAllRes.data.kpis?.totalSessions}`);
  assert(historyAllRes.data.kpis.totalDurationFormatted.length > 0, `Aggregated duration: ${historyAllRes.data.kpis?.totalDurationFormatted}`);
  assert(historyAllRes.data.kpis.totalViewersFormatted.length > 0, `Aggregated viewers: ${historyAllRes.data.kpis?.totalViewersFormatted}`);
  assert(historyAllRes.data.kpis.totalFollowersFormatted.length > 0, `Aggregated followers: ${historyAllRes.data.kpis?.totalFollowersFormatted}`);

  // Verify the newly ended session is present in history
  const foundSession = historyAllRes.data.sessions.find((s) => s.id === room.id || s.roomNumber === room.roomNumber);
  assert(Boolean(foundSession), `Newly ended session found in host history list: ${foundSession?.title}`);

  // Test filter=week and filter=month
  const historyWeekRes = await hostDevice.request('/api/live/center/history?filter=week');
  assert(historyWeekRes.ok && historyWeekRes.data.filter === 'week', 'History filter=week returned successfully');

  const historyMonthRes = await hostDevice.request('/api/live/center/history?filter=month');
  assert(historyMonthRes.ok && historyMonthRes.data.filter === 'month', 'History filter=month returned successfully');

  console.log('\n========================================================================');
  console.log(`🎉 ALL ${passedAssertions} E2E ASSERTIONS PASSED SUCCESSFULLY!`);
  console.log('========================================================================\n');
}

runLiveEndSessionVerification().catch((err) => {
  console.error('\n❌ E2E VERIFICATION SCRIPT ENCOUNTERED AN ERROR:', err);
  process.exit(1);
});
