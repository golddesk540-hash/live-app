const http = require('http');
const https = require('https');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
console.log('==================================================');
console.log('POPO LIVE: Phase 6 Module 6.2 Test Suite');
console.log(`Target: ${BASE_URL}`);
console.log('==================================================\n');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passedTests++;
    console.log(`[PASS] TEST ${String(passedTests + failedTests).padStart(2, '0')}: ${testName}`);
  } else {
    failedTests++;
    console.error(`[FAIL] TEST ${String(passedTests + failedTests).padStart(2, '0')}: ${testName}`);
    if (details) console.error(`       Details: ${details}`);
  }
}

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const reqHeaders = { ...headers };
    let payload = null;
    if (body) {
      payload = typeof body === 'string' ? body : JSON.stringify(body);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const options = {
      method,
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      headers: reqHeaders,
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json,
        });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  try {
    // 0. Reset PK test state
    await request('POST', '/api/pk/test-reset');

    // ----------------------------------------------------
    // 1. GET /api/pk/hosts: Live Hosts Catalog & Search
    // ----------------------------------------------------
    const hostsRes = await request('GET', '/api/pk/hosts');
    assert(hostsRes.statusCode === 200, 'GET /api/pk/hosts returns 200 OK');
    assert(hostsRes.json?.success === true, 'Returns success: true');
    assert(Array.isArray(hostsRes.json?.hosts), 'Returns array of hosts');
    assert(hostsRes.json?.hosts.length >= 3, `Returns at least 3 live hosts (Found: ${hostsRes.json?.hosts.length})`);

    const hosts = hostsRes.json?.hosts || [];
    const sara = hosts.find((h) => h.poppoId === '88201' || h.nickname.includes('Sara'));
    const ayesha = hosts.find((h) => h.poppoId === '88202' || h.nickname.includes('Ayesha'));
    const zoya = hosts.find((h) => h.poppoId === '88203' || h.nickname.includes('Zoya'));

    assert(Boolean(sara), 'Canonical host Sara Live exists in catalog');
    assert(Boolean(ayesha), 'Canonical host Ayesha exists in catalog');
    assert(Boolean(zoya), 'Canonical host Zoya exists in catalog');

    if (sara) {
      assert(sara.isLive === true, 'Sara Live is live streaming');
      assert(sara.isOnline === true, 'Sara Live is online');
      assert(sara.viewerCount > 0, `Sara Live has viewers (${sara.viewerCount})`);
      assert(sara.countryCode === 'PK', `Sara Live country is Pakistan (${sara.countryCode})`);
      assert(sara.isEligibleForPk === true, 'Sara Live is eligible for PK battle');
    }

    // Search filter test
    const searchRes = await request('GET', '/api/pk/hosts?search=Ayesha');
    assert(searchRes.statusCode === 200, 'Host search query returns 200 OK');
    const filtered = searchRes.json?.hosts || [];
    assert(filtered.some((h) => h.nickname.includes('Ayesha')), 'Search finds host by nickname "Ayesha"');

    const searchIdRes = await request('GET', '/api/pk/hosts?search=88203');
    const filteredId = searchIdRes.json?.hosts || [];
    assert(filteredId.some((h) => h.poppoId === '88203'), 'Search finds host by ID "88203" (Zoya)');

    // ----------------------------------------------------
    // 2. Self-Invitation Check & Security
    // ----------------------------------------------------
    const selfInviteRes = await request('POST', '/api/pk/invitation/send', {
      senderHostId: '00000000-0000-0000-0000-000000088201',
      receiverHostId: '00000000-0000-0000-0000-000000088201',
      battleType: '1v1',
    });
    assert(selfInviteRes.statusCode === 400, 'Rejects self-invitation with 400 Bad Request');
    assert(selfInviteRes.json?.code === 'CANNOT_INVITE_SELF', 'Returns error code CANNOT_INVITE_SELF');

    // Missing receiver
    const missingReceiverRes = await request('POST', '/api/pk/invitation/send', {
      senderHostId: '00000000-0000-0000-0000-000000088201',
    });
    assert(missingReceiverRes.statusCode === 400, 'Rejects missing receiverHostId with 400');

    // ----------------------------------------------------
    // 3. Flow 1: Host A Invites Host B -> Host B Rejects
    // ----------------------------------------------------
    const inviteRejectRes = await request('POST', '/api/pk/invitation/send', {
      senderHostId: '00000000-0000-0000-0000-000000088201', // Sara
      receiverHostId: '00000000-0000-0000-0000-000000088203', // Zoya
      battleType: '1v1',
    });
    assert(inviteRejectRes.statusCode === 200, 'POST /api/pk/invitation/send returns 200 OK');
    assert(inviteRejectRes.json?.success === true, 'Invitation created successfully');
    const rejectInviteId = inviteRejectRes.json?.invitation?.id;
    assert(Boolean(rejectInviteId), `Invitation ID generated: ${rejectInviteId}`);
    assert(inviteRejectRes.json?.invitation?.status === 'pending', 'Invitation status is pending');
    assert(inviteRejectRes.json?.invitation?.secondsRemaining > 0, 'Expiry countdown is positive');

    // Duplicate invitation prevention
    const duplicateRes = await request('POST', '/api/pk/invitation/send', {
      senderHostId: '00000000-0000-0000-0000-000000088201',
      receiverHostId: '00000000-0000-0000-0000-000000088203',
      battleType: '1v1',
    });
    assert(duplicateRes.statusCode === 429, 'Blocks duplicate pending invitation with 429');
    assert(duplicateRes.json?.code === 'DUPLICATE_INVITATION', 'Returns DUPLICATE_INVITATION code');

    // Receiver rejects invitation
    const rejectRes = await request('POST', '/api/pk/invitation/respond', {
      invitationId: rejectInviteId,
      receiverHostId: '00000000-0000-0000-0000-000000088203',
      action: 'reject',
      reason: 'busy_streaming',
    });
    assert(rejectRes.statusCode === 200, 'POST /api/pk/invitation/respond (reject) returns 200 OK');
    assert(rejectRes.json?.action === 'rejected', 'Invitation action marked rejected');

    // Verify status via GET /api/pk/invitation/status
    const statusReject = await request('GET', `/api/pk/invitation/status?invitationId=${rejectInviteId}`);
    assert(statusReject.statusCode === 200, 'GET invitation status returns 200 OK');
    assert(statusReject.json?.invitation?.status === 'rejected', 'Status verified as rejected');

    // ----------------------------------------------------
    // 4. Flow 2: Host A Invites Host B -> Host A Cancels
    // ----------------------------------------------------
    const inviteCancelRes = await request('POST', '/api/pk/invitation/send', {
      senderHostId: '00000000-0000-0000-0000-000000088201',
      receiverHostId: '00000000-0000-0000-0000-000000088203',
      battleType: '1v1',
    });
    assert(inviteCancelRes.statusCode === 200, 'Second invitation sent after rejection');
    const cancelInviteId = inviteCancelRes.json?.invitation?.id;

    // Sender cancels invitation
    const cancelRes = await request('POST', '/api/pk/invitation/cancel', {
      invitationId: cancelInviteId,
      senderHostId: '00000000-0000-0000-0000-000000088201',
    });
    assert(cancelRes.statusCode === 200, 'POST /api/pk/invitation/cancel returns 200 OK');
    assert(cancelRes.json?.status === 'cancelled', 'Invitation marked cancelled');

    const statusCancel = await request('GET', `/api/pk/invitation/status?invitationId=${cancelInviteId}`);
    assert(statusCancel.json?.invitation?.status === 'cancelled', 'Status verified as cancelled');

    // ----------------------------------------------------
    // 5. Flow 3: Host A Invites Host B -> Host B Accepts -> Confirmed Battle
    // ----------------------------------------------------
    const inviteAcceptRes = await request('POST', '/api/pk/invitation/send', {
      senderHostId: '00000000-0000-0000-0000-000000088201', // Sara
      receiverHostId: '00000000-0000-0000-0000-000000088202', // Ayesha
      battleType: '1v1',
    });
    assert(inviteAcceptRes.statusCode === 200, 'Invitation from Sara to Ayesha sent');
    const acceptInviteId = inviteAcceptRes.json?.invitation?.id;

    // Ayesha accepts invitation
    const acceptRes = await request('POST', '/api/pk/invitation/respond', {
      invitationId: acceptInviteId,
      receiverHostId: '00000000-0000-0000-0000-000000088202',
      action: 'accept',
    });
    assert(acceptRes.statusCode === 200, 'POST /api/pk/invitation/respond (accept) returns 200 OK');
    assert(acceptRes.json?.action === 'accepted', 'Invitation marked accepted');
    assert(Boolean(acceptRes.json?.battle?.id), 'Confirmed PK battle created with ID');
    assert(acceptRes.json?.battle?.status === 'confirmed', 'PK battle status is confirmed');
    assert(acceptRes.json?.battle?.hostA?.nickname.includes('Sara'), 'Host A is Sara');
    assert(acceptRes.json?.battle?.hostB?.nickname.includes('Ayesha'), 'Host B is Ayesha');

    const battleId = acceptRes.json?.battle?.id;

    // Query battle details endpoint
    const battleDetails = await request('GET', `/api/pk/battle/${battleId}`);
    assert(battleDetails.statusCode === 200, 'GET /api/pk/battle/[battleId] returns 200 OK');
    assert(battleDetails.json?.battle?.id === battleId, 'Battle details ID matches');
    assert(battleDetails.json?.battle?.matchMethod === 'invite', 'Match method is invite');

    // ----------------------------------------------------
    // 6. Flow 4: Random Matchmaking
    // ----------------------------------------------------
    // Start search for Host 1 (Zoya)
    const random1Res = await request('POST', '/api/pk/matchmaking/start', {
      hostId: '00000000-0000-0000-0000-000000088203', // Zoya
      roomNumber: '7004',
      battleType: '1v1',
    });
    assert(random1Res.statusCode === 200, 'POST /api/pk/matchmaking/start returns 200 OK');
    assert(random1Res.json?.status === 'finding_opponent', 'First host is in finding_opponent status');

    // Check matchmaking status
    const statusRandom1 = await request('GET', '/api/pk/matchmaking/status?hostId=00000000-0000-0000-0000-000000088203');
    assert(statusRandom1.statusCode === 200, 'GET /api/pk/matchmaking/status returns 200 OK');
    assert(statusRandom1.json?.status === 'finding_opponent', 'Matchmaking status is finding_opponent');

    // Cancel matchmaking test
    const cancelRandomRes = await request('POST', '/api/pk/matchmaking/cancel', {
      hostId: '00000000-0000-0000-0000-000000088203',
    });
    assert(cancelRandomRes.statusCode === 200, 'POST /api/pk/matchmaking/cancel returns 200 OK');
    assert(cancelRandomRes.json?.status === 'match_cancelled', 'Matchmaking marked match_cancelled');

    // ----------------------------------------------------
    // 7. Web UI Route & Localization
    // ----------------------------------------------------
    const uiRes = await request('GET', '/pk/start?preview=demo');
    assert(uiRes.statusCode === 200, 'GET /pk/start loads web UI with 200 OK');
    assert(uiRes.data.includes('PK Battle'), 'Web UI contains "PK Battle" title');
    assert(uiRes.data.includes('data-tab="invite"'), 'Web UI contains Invite tab segment');
    assert(uiRes.data.includes('data-tab="random"'), 'Web UI contains Random tab segment');
    assert(uiRes.data.includes('data-input="host-search"'), 'Web UI contains search input');
    assert(uiRes.data.includes('6.2-invite-random'), 'Web UI contains 6.2 watermark badge');

    const roomUiRes = await request('GET', '/pk/room/7001/start?preview=demo');
    assert(roomUiRes.statusCode === 200, 'GET /pk/room/7001/start loads with 200 OK');

    console.log('\n==================================================');
    console.log(`TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('==================================================\n');

    if (failedTests > 0) process.exit(1);
  } catch (err) {
    console.error('Test execution exception:', err);
    process.exit(1);
  }
}

runTests();
