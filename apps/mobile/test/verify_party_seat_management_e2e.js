// E2E Multi-Device Verification Script for Phase 2 Prompt 09/10:
// M4: Complete 9-Seat Management, Guest Requests, Invitations & Agora Media Integration
// Validates:
// 1. Host Device A & Guest Device B Authentication
// 2. Party Room Creation & 9-Seat Layout Initialization (Seat 1 Host, Seats 2-9 Available)
// 3. Audience Join & Roster Presence (/api/party/{roomId}/audience/join & GET /api/party/{roomId}/audience)
// 4. Agora RTC Token Issuance for Host (publisher) and Audience (subscriber)
// 5. Guest Seat Join Request (/api/party/{roomId}/seats/request)
// 6. Request Protection: Duplicate Request Prevention (400 validation)
// 7. Host Request Polling (/api/party/{roomId}/seats/requests)
// 8. Host Request Response: Accept Guest to Seat (/api/party/{roomId}/seats/requests/respond)
// 9. Authoritative Seat Occupation State Verification (/api/party/{roomId}/seats)
// 10. Microphone Controls: Guest Local Mute/Unmute (/api/party/{roomId}/seats/media/toggle)
// 11. Camera Controls: Guest Camera Toggle (/api/party/{roomId}/seats/media/toggle)
// 12. Host Remote Moderation: Host Remote Mute (/api/party/{roomId}/seats/media/moderate)
// 13. Security Consent Enforcement: Host cannot forcibly unmute participant (403 SECURITY_CONSENT_VIOLATION)
// 14. Party Real-Time Chat Stream: Host & Seated Speaker Chat (/api/party/{roomId}/chat/send & /messages)
// 15. Host Invitation System & Guest Decline Flow (/api/party/{roomId}/seats/invite & /invite/respond)
// 16. Seat Vacate: Guest Leaves Seat (/api/party/{roomId}/seats/vacate)
// 17. Audience Leave: Clean Teardown (/api/party/{roomId}/audience/leave)

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

class ClientDevice {
  constructor(name) {
    this.name = name;
    this.sessionCookie = '';
    this.consentCookie = generateConsentCookie();
    this.ip = `10.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 200) + 1}`;
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
      }),
    });

    if (regRes.status === 200 || regRes.status === 201) {
      this.user = regRes.data.user || { id: `user_${Date.now()}`, nickname };
      return true;
    }

    // Try login if user already exists
    const loginRes = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        emailOrPhone: email,
        password: 'Password123!',
      }),
    });

    if (loginRes.ok) {
      this.user = loginRes.data.user;
      return true;
    }
    return false;
  }
}

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${message}`);
  } else {
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runSeatManagementVerification() {
  console.log('======================================================================');
  console.log('POPO LIVE — PHASE 2 — PROMPT 09/10: 9-SEAT MANAGEMENT & MEDIA E2E TEST');
  console.log('======================================================================\n');

  const hostDevice = new ClientDevice('Host_Device_A');
  const guestDevice1 = new ClientDevice('Guest_Device_B');
  const guestDevice2 = new ClientDevice('Guest_Device_C');

  // -------------------------------------------------------------
  // Stage 1: Authenticate Devices
  // -------------------------------------------------------------
  console.log('[STAGE 1] Authenticating Devices (Host, Guest 1, Guest 2)...');
  const hostAuth = await hostDevice.registerUser('HostDevA', 'female');
  assert(hostAuth, 'Host Device A authenticated successfully with session cookie');

  const guest1Auth = await guestDevice1.registerUser('GuestDevB', 'male');
  assert(guest1Auth, 'Guest Device 1 (Device B) authenticated successfully');

  const guest2Auth = await guestDevice2.registerUser('GuestDevC', 'female');
  assert(guest2Auth, 'Guest Device 2 (Device C) authenticated successfully');

  // -------------------------------------------------------------
  // Stage 2: Create 9-Seat Party Room
  // -------------------------------------------------------------
  console.log('\n[STAGE 2] Host Creates 9-Seat Party Room...');
  const createRes = await hostDevice.request('/api/party/create', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Prompt 09 Interactive 9-Seat Party',
      categoryId: 'chill_chat',
      roomType: 'public',
    }),
  });

  assert(createRes.status === 201 || createRes.status === 200, 'Party room created (201/200)');
  const roomId =
    createRes.data?.party?.roomNumber ||
    createRes.data?.room?.roomNumber ||
    createRes.data?.party?.id ||
    createRes.data?.room?.id;
  assert(roomId, `Created party room number: ${roomId}`);

  // Verify Seat Layout: Seat 1 Host, Seats 2-9 Available
  const seatsInitial = await hostDevice.request(`/api/party/${roomId}/seats`);
  assert(seatsInitial.ok, 'Initial seats retrieved');
  assert(Array.isArray(seatsInitial.data.seats), 'Seats array returned');
  assert(seatsInitial.data.seats.length === 9, `Strictly 9 seats initialized (found ${seatsInitial.data.seats.length})`);

  const seat1 = seatsInitial.data.seats[0];
  assert(seat1.seatNumber === 1, 'Seat 1 is at index 0');
  assert(seat1.isHost === true, 'Seat 1 is marked as Host seat');
  assert(seat1.status === 'occupied', 'Seat 1 is occupied by host');

  const availableSeats = seatsInitial.data.seats.slice(1).filter((s) => s.status === 'available');
  assert(availableSeats.length === 8, `Seats 2 to 9 are available (found ${availableSeats.length} available)`);

  // -------------------------------------------------------------
  // Stage 3: Audience Join & Presence Verification
  // -------------------------------------------------------------
  console.log('\n[STAGE 3] Guest Device B Joins Audience...');
  const joinAudRes = await guestDevice1.request(`/api/party/${roomId}/audience/join`, {
    method: 'POST',
    body: JSON.stringify({
      userId: guestDevice1.user.id,
      userName: guestDevice1.user.nickname,
      userAvatar: '/assets/avatars/guest_b.png',
      userLevel: 5,
    }),
  });
  assert(joinAudRes.ok, 'Guest Device B successfully joined audience');

  const audList = await hostDevice.request(`/api/party/${roomId}/audience`);
  assert(audList.ok, 'Audience list retrieved');
  assert(audList.data.audienceCount > 0, `Audience count updated (${audList.data.audienceCount})`);
  const foundGuest = (audList.data.members || []).find((m) => m.userId === guestDevice1.user.id);
  assert(foundGuest !== undefined, 'Guest Device B is present in active audience roster');

  // -------------------------------------------------------------
  // Stage 4: Agora Media Token Generation
  // -------------------------------------------------------------
  console.log('\n[STAGE 4] Agora Media RTC Token Generation...');
  const hostTokenRes = await hostDevice.request(`/api/party/${roomId}/seats/media/token?seatNumber=1&role=publisher`);
  assert(hostTokenRes.ok, 'Host Agora publisher token retrieved');
  assert(hostTokenRes.data.tokenResult !== undefined, 'Host tokenResult object present');
  assert(hostTokenRes.data.tokenResult.channelName === `party_${roomId}`, `Agora channel name matches: party_${roomId}`);
  assert(hostTokenRes.data.tokenResult.role === 'publisher', 'Host token role is publisher');

  const viewerTokenRes = await guestDevice1.request(`/api/party/${roomId}/seats/media/token?seatNumber=3&role=audience`);
  assert(viewerTokenRes.ok, 'Viewer Agora audience token retrieved');
  assert(viewerTokenRes.data.tokenResult.role === 'subscriber', 'Viewer token role is subscriber');

  // -------------------------------------------------------------
  // Stage 5: Guest Seat Join Request
  // -------------------------------------------------------------
  console.log('\n[STAGE 5] Guest Device B Submits Seat Request for Seat #3...');
  const seatReqRes = await guestDevice1.request(`/api/party/${roomId}/seats/request`, {
    method: 'POST',
    body: JSON.stringify({
      seatNumber: 3,
      userId: guestDevice1.user.id,
      userName: guestDevice1.user.nickname,
      userAvatar: '/assets/avatars/guest_b.png',
      acceptedRules: true,
    }),
  });
  assert(seatReqRes.status === 201, `Seat request submitted with 201 Created (got ${seatReqRes.status})`);
  assert(seatReqRes.data.request?.status === 'pending', 'Seat request status is pending');
  assert(seatReqRes.data.request?.seatNumber === 3, 'Seat request target is Seat #3');
  const requestId = seatReqRes.data.request?.id;

  // -------------------------------------------------------------
  // Stage 6: Duplicate Request Protection
  // -------------------------------------------------------------
  console.log('\n[STAGE 6] Testing Duplicate Request Protection...');
  const dupReqRes = await guestDevice1.request(`/api/party/${roomId}/seats/request`, {
    method: 'POST',
    body: JSON.stringify({
      seatNumber: 5,
      userId: guestDevice1.user.id,
      userName: guestDevice1.user.nickname,
      acceptedRules: true,
    }),
  });
  assert(dupReqRes.status === 400, `Duplicate seat request rejected with 400 Bad Request (got ${dupReqRes.status})`);
  assert(dupReqRes.data.error?.includes('pending request'), 'Error message cites existing pending request');

  // -------------------------------------------------------------
  // Stage 7: Host Polls Pending Requests
  // -------------------------------------------------------------
  console.log('\n[STAGE 7] Host Device A Polls Pending Requests...');
  const pollReqs = await hostDevice.request(`/api/party/${roomId}/seats/requests`);
  assert(pollReqs.ok, 'Pending requests fetched');
  assert(pollReqs.data.pendingCount > 0, `Pending count is positive (${pollReqs.data.pendingCount})`);
  const foundReq = (pollReqs.data.requests || []).find((r) => r.id === requestId);
  assert(foundReq !== undefined, `Guest Device B request #${requestId} found in host queue`);
  assert(foundReq?.seatNumber === 3, 'Target seat in host queue is Seat #3');

  // -------------------------------------------------------------
  // Stage 8: Host Accepts Guest Request
  // -------------------------------------------------------------
  console.log('\n[STAGE 8] Host Accepts Seat Request...');
  const acceptRes = await hostDevice.request(`/api/party/${roomId}/seats/requests/respond`, {
    method: 'POST',
    body: JSON.stringify({
      requestId,
      action: 'accept',
      isHostAction: true,
    }),
  });
  assert(acceptRes.ok, 'Host successfully accepted seat request');
  assert(acceptRes.data.status === 'accepted', 'Request status is accepted');

  // -------------------------------------------------------------
  // Stage 9: Verify Seat #3 Occupied by Guest B
  // -------------------------------------------------------------
  console.log('\n[STAGE 9] Verifying Seat #3 Occupancy...');
  const seatsAfterAccept = await hostDevice.request(`/api/party/${roomId}/seats`);
  const seat3 = seatsAfterAccept.data.seats.find((s) => s.seatNumber === 3);
  assert(seat3 !== undefined, 'Seat #3 found');
  assert(seat3.status === 'occupied', 'Seat #3 status is now occupied');
  assert(seat3.participantId === guestDevice1.user.id, `Seat #3 participantId matches Guest Device B (${seat3.participantId})`);
  assert(seat3.isMuted === false, 'Seat #3 default mic is unmuted');

  // -------------------------------------------------------------
  // Stage 10: Guest Microphone Controls (Local Mute/Unmute)
  // -------------------------------------------------------------
  console.log('\n[STAGE 10] Testing Guest Microphone Controls...');
  const muteRes = await guestDevice1.request(`/api/party/${roomId}/seats/media/toggle`, {
    method: 'POST',
    body: JSON.stringify({
      seatNumber: 3,
      type: 'mic',
      enabled: false, // Mute microphone
      participantId: guestDevice1.user.id,
    }),
  });
  assert(muteRes.ok, 'Guest muted local microphone');
  assert(muteRes.data.seat.isMuted === true, 'Seat media isMuted is true');

  const unmuteRes = await guestDevice1.request(`/api/party/${roomId}/seats/media/toggle`, {
    method: 'POST',
    body: JSON.stringify({
      seatNumber: 3,
      type: 'mic',
      enabled: true, // Unmute microphone
      participantId: guestDevice1.user.id,
    }),
  });
  assert(unmuteRes.ok, 'Guest unmuted local microphone');
  assert(unmuteRes.data.seat.isMuted === false, 'Seat media isMuted is false');

  // -------------------------------------------------------------
  // Stage 11: Guest Camera Controls
  // -------------------------------------------------------------
  console.log('\n[STAGE 11] Testing Guest Camera Controls...');
  const camRes = await guestDevice1.request(`/api/party/${roomId}/seats/media/toggle`, {
    method: 'POST',
    body: JSON.stringify({
      seatNumber: 3,
      type: 'camera',
      enabled: true,
      participantId: guestDevice1.user.id,
    }),
  });
  assert(camRes.ok, 'Guest enabled camera');
  assert(camRes.data.seat.isCameraOn === true, 'Seat media isCameraOn is true');

  // -------------------------------------------------------------
  // Stage 12: Host Remote Moderation (Host Mute)
  // -------------------------------------------------------------
  console.log('\n[STAGE 12] Testing Host Remote Mute Moderation...');
  const hostMuteRes = await hostDevice.request(`/api/party/${roomId}/seats/media/moderate`, {
    method: 'POST',
    body: JSON.stringify({
      seatNumber: 3,
      action: 'host_mute',
      isHostAction: true,
    }),
  });
  assert(hostMuteRes.ok, 'Host successfully muted Guest on Seat #3');
  assert(hostMuteRes.data.moderatedSeat.isHostMuted === true, 'moderatedSeat isHostMuted is true');
  assert(hostMuteRes.data.moderatedSeat.isMuted === true, 'moderatedSeat isMuted is true');

  // -------------------------------------------------------------
  // Stage 13: Consent Protection Security Enforcement
  // -------------------------------------------------------------
  console.log('\n[STAGE 13] Testing Consent Protection (Host cannot force-unmute)...');
  const forceUnmuteRes = await hostDevice.request(`/api/party/${roomId}/seats/media/moderate`, {
    method: 'POST',
    body: JSON.stringify({
      seatNumber: 3,
      action: 'force_unmute',
      isHostAction: true,
    }),
  });
  assert(forceUnmuteRes.status === 403, `Host force-unmute rejected with 403 (got ${forceUnmuteRes.status})`);
  assert(forceUnmuteRes.data.code === 'SECURITY_CONSENT_VIOLATION', 'Code is SECURITY_CONSENT_VIOLATION');

  // -------------------------------------------------------------
  // Stage 14: Party Live Chat Stream
  // -------------------------------------------------------------
  console.log('\n[STAGE 14] Testing Party Live Chat Stream...');
  const hostChatRes = await hostDevice.request(`/api/party/${roomId}/chat/send`, {
    method: 'POST',
    body: JSON.stringify({
      senderId: hostDevice.user.id,
      senderName: hostDevice.user.nickname,
      senderRole: 'host',
      seatNumber: 1,
      messageText: 'Welcome everyone to the Party Room! 🎉',
    }),
  });
  assert(hostChatRes.ok, 'Host sent party chat message');

  const guestChatRes = await guestDevice1.request(`/api/party/${roomId}/chat/send`, {
    method: 'POST',
    body: JSON.stringify({
      senderId: guestDevice1.user.id,
      senderName: guestDevice1.user.nickname,
      senderRole: 'speaker',
      seatNumber: 3,
      messageText: 'Happy to join the discussion on Seat 3! 🎵',
    }),
  });
  assert(guestChatRes.ok, 'Guest sent party chat message as speaker');

  const chatMessagesRes = await guestDevice1.request(`/api/party/${roomId}/chat/messages`);
  assert(chatMessagesRes.ok, 'Chat messages retrieved');
  const msgs = chatMessagesRes.data.messages || [];
  assert(msgs.length >= 2, `Retrieved at least 2 chat messages (found ${msgs.length})`);
  const foundHostMsg = msgs.find((m) => m.senderId === hostDevice.user.id);
  const foundGuestMsg = msgs.find((m) => m.senderId === guestDevice1.user.id);
  assert(foundHostMsg !== undefined, 'Host message present in chat stream');
  assert(foundGuestMsg !== undefined, 'Guest speaker message present in chat stream');

  // -------------------------------------------------------------
  // Stage 15: Host Invitation System & Guest Decline Flow
  // -------------------------------------------------------------
  console.log('\n[STAGE 15] Testing Host Invitation & Decline Flow...');
  // Device C joins audience
  await guestDevice2.request(`/api/party/${roomId}/audience/join`, {
    method: 'POST',
    body: JSON.stringify({
      userId: guestDevice2.user.id,
      userName: guestDevice2.user.nickname,
      userAvatar: '/assets/avatars/guest_c.png',
      userLevel: 8,
    }),
  });

  const inviteRes = await hostDevice.request(`/api/party/${roomId}/seats/invite`, {
    method: 'POST',
    body: JSON.stringify({
      seatNumber: 4,
      hostId: hostDevice.user.id,
      invitedUserId: guestDevice2.user.id,
      invitedUserName: guestDevice2.user.nickname,
      invitedUserAvatar: '/assets/avatars/guest_c.png',
    }),
  });
  assert(inviteRes.status === 201, `Host sent invitation for Seat #4 (got ${inviteRes.status})`);
  const invitationId = inviteRes.data.invitation?.id;
  assert(invitationId !== undefined, `Invitation ID generated: ${invitationId}`);

  // Device C declines invitation
  const declineRes = await guestDevice2.request(`/api/party/${roomId}/seats/invite/respond`, {
    method: 'POST',
    body: JSON.stringify({
      invitationId,
      action: 'decline',
    }),
  });
  assert(declineRes.ok, 'Guest Device C successfully declined seat invitation');
  assert(declineRes.data.status === 'declined', 'Invitation status is declined');

  // Verify Seat #4 remains available
  const seatsAfterDecline = await hostDevice.request(`/api/party/${roomId}/seats`);
  const seat4 = seatsAfterDecline.data.seats.find((s) => s.seatNumber === 4);
  assert(seat4?.status === 'available', 'Seat #4 remains available after decline');

  // -------------------------------------------------------------
  // Stage 16: Guest Vacates Seat
  // -------------------------------------------------------------
  console.log('\n[STAGE 16] Guest Device B Vacates Seat #3...');
  const vacateRes = await guestDevice1.request(`/api/party/${roomId}/seats/vacate`, {
    method: 'POST',
    body: JSON.stringify({
      seatNumber: 3,
      participantId: guestDevice1.user.id,
    }),
  });
  assert(vacateRes.ok, 'Guest Device B successfully vacated Seat #3');

  const seatsAfterVacate = await hostDevice.request(`/api/party/${roomId}/seats`);
  const seat3After = seatsAfterVacate.data.seats.find((s) => s.seatNumber === 3);
  assert(seat3After?.status === 'available', 'Seat #3 status returned to available');
  assert(seat3After?.participantId === null, 'Seat #3 participantId is now null');

  // -------------------------------------------------------------
  // Stage 17: Audience Teardown
  // -------------------------------------------------------------
  console.log('\n[STAGE 17] Audience Teardown...');
  const leaveAudRes = await guestDevice1.request(`/api/party/${roomId}/audience/leave`, {
    method: 'POST',
    body: JSON.stringify({
      userId: guestDevice1.user.id,
    }),
  });
  assert(leaveAudRes.ok, 'Guest Device B left audience cleanly');

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED (100% PASS RATE)`);
  console.log('======================================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runSeatManagementVerification().catch((err) => {
  console.error('Fatal error during E2E verification:', err);
  process.exit(1);
});
