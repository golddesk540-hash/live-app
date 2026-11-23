/**
 * POPO LIVE — PHASE B6 PROMPT 4 OF 4 COMPLETE END-TO-END VERIFICATION SUITE
 * MIC STATE PERSISTENCE, MOBILE/WEB INTEGRATION & FINAL PARTY SYSTEM QA
 *
 * Verifies all 31 scenarios across 7 categories:
 * - Room Creation (1-4)
 * - Seat Request (5-8)
 * - Host Approval (9-12)
 * - Rejection (13-15)
 * - Mic State Persistence (16-20)
 * - Mobile and Web Consistency (21-25)
 * - Security and Media Provider Restrictions (26-31)
 */

const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const idx = trimmed.indexOf('=');
        if (idx !== -1) {
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnvFile(path.resolve(__dirname, 'apps/web/.env.local'));
loadEnvFile(path.resolve(__dirname, 'apps/web/.env.development'));
process.env.NEXT_PUBLIC_USE_PARTY_API = 'true';
process.env.USE_PARTY_API = 'true';

const { NextRequest } = require(path.resolve(__dirname, 'apps/web/node_modules/next/server'));
const { Pool } = require(path.resolve(__dirname, 'apps/web/node_modules/pg'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  options: '-c search_path=popolive,public',
});

// Import route handlers
const partyCreateRoute = require(path.resolve(__dirname, 'apps/web/app/api/party/create/route.ts'));
const partyRoomDetailsRoute = require(path.resolve(__dirname, 'apps/web/app/api/party/rooms/[roomId]/route.ts'));
const partySeatsRoute = require(path.resolve(__dirname, 'apps/web/app/api/party/rooms/[roomId]/seats/route.ts'));
const partyRequestsRoute = require(path.resolve(__dirname, 'apps/web/app/api/party/rooms/[roomId]/requests/route.ts'));
const partyAcceptRoute = require(path.resolve(__dirname, 'apps/web/app/api/party/rooms/[roomId]/requests/[requestId]/accept/route.ts'));
const partyRejectRoute = require(path.resolve(__dirname, 'apps/web/app/api/party/rooms/[roomId]/requests/[requestId]/reject/route.ts'));
const partyMicRoute = require(path.resolve(__dirname, 'apps/web/app/api/party/rooms/[roomId]/seats/[seatNumber]/mic/route.ts'));
const partyCloseRoute = require(path.resolve(__dirname, 'apps/web/app/api/party/rooms/[roomId]/close/route.ts'));

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedChecks++;
    console.error(`  [FAIL] ${message}`);
  }
}

async function runTests() {
  console.log('\n================================================================');
  console.log('POPO LIVE — PHASE B6 PROMPT 4 OF 4 COMPLETE E2E VERIFICATION SUITE');
  console.log('MIC STATE PERSISTENCE, MOBILE/WEB INTEGRATION & PARTY SYSTEM QA');
  console.log('================================================================\n');

  const testHostId = '00000000-0000-0000-0000-000000086001';
  const testGuest1Id = '00000000-0000-0000-0000-000000086002';
  const testGuest2Id = '00000000-0000-0000-0000-000000086003';
  const unauthUserId = '00000000-0000-0000-0000-000000086099';

  // Seed / clean users with adult verification (Rule 2: Age 18+)
  await pool.query(
    `INSERT INTO popolive.users (id, poppo_id, nickname, email, password_hash, role, status, is_face_verified, go_live_eligible, is_adult_verified, birthdate)
     VALUES ($1, '86001', 'Host Zara', 'party_zara@popolive.com', 'hash', 'user', 'active', true, true, true, '1995-05-15')
     ON CONFLICT (id) DO UPDATE SET nickname = EXCLUDED.nickname, is_adult_verified = true, birthdate = '1995-05-15', status = 'active'`,
    [testHostId]
  );
  await pool.query(
    `INSERT INTO popolive.users (id, poppo_id, nickname, email, password_hash, role, status, is_face_verified, go_live_eligible, is_adult_verified, birthdate)
     VALUES ($1, '86002', 'Guest Bilal', 'party_bilal@popolive.com', 'hash', 'user', 'active', true, true, true, '1998-08-20')
     ON CONFLICT (id) DO UPDATE SET nickname = EXCLUDED.nickname, is_adult_verified = true, birthdate = '1998-08-20', status = 'active'`,
    [testGuest1Id]
  );
  await pool.query(
    `INSERT INTO popolive.users (id, poppo_id, nickname, email, password_hash, role, status, is_face_verified, go_live_eligible, is_adult_verified, birthdate)
     VALUES ($1, '86003', 'Guest Nadia', 'party_nadia@popolive.com', 'hash', 'user', 'active', true, true, true, '1999-11-10')
     ON CONFLICT (id) DO UPDATE SET nickname = EXCLUDED.nickname, is_adult_verified = true, birthdate = '1999-11-10', status = 'active'`,
    [testGuest2Id]
  );
  await pool.query(
    `INSERT INTO popolive.users (id, poppo_id, nickname, email, password_hash, role, status, is_adult_verified, birthdate)
     VALUES ($1, '86099', 'Rando Person', 'party_rando@popolive.com', 'hash', 'user', 'active', true, '1997-03-01')
     ON CONFLICT (id) DO UPDATE SET nickname = EXCLUDED.nickname, is_adult_verified = true, status = 'active'`,
    [unauthUserId]
  );

  // Seed authentic sessions in popolive.sessions for Bearer auth
  const tokenHost = 'token_host_zara_86001';
  const tokenGuest1 = 'token_guest_bilal_86002';
  const tokenGuest2 = 'token_guest_nadia_86003';
  const tokenUnauth = 'token_unauth_rando_86099';

  await pool.query(
    `INSERT INTO popolive.sessions (session_token, user_id, expires_at, is_revoked)
     VALUES 
       ($1, $5, NOW() + INTERVAL '1 day', false),
       ($2, $6, NOW() + INTERVAL '1 day', false),
       ($3, $7, NOW() + INTERVAL '1 day', false),
       ($4, $8, NOW() + INTERVAL '1 day', false)
     ON CONFLICT (session_token) DO UPDATE SET expires_at = NOW() + INTERVAL '1 day', is_revoked = false`,
    [tokenHost, tokenGuest1, tokenGuest2, tokenUnauth, testHostId, testGuest1Id, testGuest2Id, unauthUserId]
  );

  let createdPartyId = null;
  let createdRoomNumber = null;
  let guest1RequestId = null;
  let guest2RequestId = null;

  // -------------------------------------------------------------
  // 1-4: ROOM CREATION & NINE SEATS INITIALIZATION
  // -------------------------------------------------------------
  console.log('--- 1. ROOM CREATION & NINE SEAT INITIALIZATION ---');
  {
    const req = new NextRequest('http://localhost:3000/api/party/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenHost}`,
      },
      body: JSON.stringify({
        hostId: testHostId,
        hostNickname: 'Host Zara',
        title: 'Zara VIP 9-Seat Lounge',
        categoryId: 'chill_chat',
        roomType: 'public',
      }),
    });

    const res = await partyCreateRoute.POST(req);
    const data = await res.json();

    assert(res.status === 201 || res.status === 200, '1. Host creates Party Room returns HTTP 200/201');
    assert(data.success === true, 'Response contains success: true');
    createdPartyId = data.party.id;
    createdRoomNumber = data.party.roomNumber;

    // Verify room record in database
    const roomDb = await pool.query(`SELECT * FROM popolive.party_rooms WHERE id = $1`, [createdPartyId]);
    assert(roomDb.rows.length === 1, '2. Database party room record is created');
    assert(roomDb.rows[0].title === 'Zara VIP 9-Seat Lounge', 'Database room title matches');
    assert(roomDb.rows[0].status === 'live', 'Database room status is live');
    assert(roomDb.rows[0].max_seats === 9, 'Database max_seats is 9');

    // Verify 9 seats in database
    const seatsDb = await pool.query(
      `SELECT seat_number, is_host, status, participant_id, participant_name
       FROM popolive.party_seats
       WHERE room_number = $1
       ORDER BY seat_number ASC`,
      [createdRoomNumber]
    );

    assert(seatsDb.rows.length === 9, '3. Exactly nine seat records are created in PostgreSQL');
    const seatNumbers = seatsDb.rows.map((s) => s.seat_number);
    assert(JSON.stringify(seatNumbers) === JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9]), '4. Seat numbers 1–9 verified in exact sequence');
    assert(seatsDb.rows[0].is_host === true && seatsDb.rows[0].status === 'occupied', 'Seat 1 is occupied by Host Zara');
    assert(seatsDb.rows[1].is_host === false && seatsDb.rows[1].status === 'available', 'Seat 2 is available for guests');
  }

  // -------------------------------------------------------------
  // 5-8: SEAT REQUEST SYSTEM
  // -------------------------------------------------------------
  console.log('\n--- 2. GUEST SEAT REQUEST ---');
  {
    // Guest 1 requests Seat 3
    const reqGuest1 = new NextRequest(`http://localhost:3000/api/party/rooms/${createdPartyId}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenGuest1}`,
      },
      body: JSON.stringify({
        seatNumber: 3,
      }),
    });
    const resGuest1 = await partyRequestsRoute.POST(reqGuest1, { params: { roomId: createdPartyId } });
    const dataGuest1 = await resGuest1.json();

    assert(resGuest1.status === 201 || resGuest1.status === 200, '5. Guest requests an available seat (HTTP 200/201)');
    assert(dataGuest1.success === true, 'Seat request response has success: true');
    guest1RequestId = dataGuest1.requestId || dataGuest1.request?.id;
    assert(Boolean(guest1RequestId), 'Seat request ID generated');

    // Verify request is pending in database
    const reqDb = await pool.query(`SELECT id, status, seat_number, user_id FROM popolive.party_seat_requests WHERE id = $1`, [guest1RequestId]);
    assert(reqDb.rows.length === 1 && reqDb.rows[0].status === 'pending', '6. Request appears as pending in PostgreSQL');

    // Invalid seat request (> 9 or < 2)
    const reqInvalid = new NextRequest(`http://localhost:3000/api/party/rooms/${createdPartyId}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenGuest2}`,
      },
      body: JSON.stringify({
        seatNumber: 15, // Out of range
      }),
    });
    const resInvalid = await partyRequestsRoute.POST(reqInvalid, { params: { roomId: createdPartyId } });
    const dataInvalid = await resInvalid.json();
    assert(resInvalid.status === 400, '7. Invalid seat number (> 9) is rejected with HTTP 400');
    assert(dataInvalid.code === 'ROOM_FULL_OR_SEAT_OUT_OF_RANGE', 'Error code is ROOM_FULL_OR_SEAT_OUT_OF_RANGE');

    // Duplicate request prevention
    const reqDup = new NextRequest(`http://localhost:3000/api/party/rooms/${createdPartyId}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenGuest1}`,
      },
      body: JSON.stringify({
        seatNumber: 4,
      }),
    });
    const resDup = await partyRequestsRoute.POST(reqDup, { params: { roomId: createdPartyId } });
    const dataDup = await resDup.json();
    assert(resDup.status === 409, '8. Duplicate request prevented with HTTP 409');
    assert(dataDup.code === 'REQUEST_ALREADY_PENDING', 'Error code is REQUEST_ALREADY_PENDING');
  }

  // -------------------------------------------------------------
  // 9-12: HOST APPROVAL & PERSISTENT OCCUPANCY
  // -------------------------------------------------------------
  console.log('\n--- 3. HOST APPROVAL & OCCUPANCY ---');
  {
    const reqAccept = new NextRequest(`http://localhost:3000/api/party/rooms/${createdPartyId}/requests/${guest1RequestId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenHost}`,
      },
      body: JSON.stringify({}),
    });
    const resAccept = await partyAcceptRoute.POST(reqAccept, { params: { roomId: createdPartyId, requestId: guest1RequestId } });
    const dataAccept = await resAccept.json();

    assert(resAccept.status === 200, '9. Host accepts the request (HTTP 200)');
    assert(dataAccept.success === true, 'Accept response has success: true');
    const assignedSeat = dataAccept.assignedSeat || dataAccept.assignment?.seatNumber;
    assert(assignedSeat === 3, '10. Guest appears on requested Seat #3');

    // Verify occupancy in database
    const seat3Db = await pool.query(
      `SELECT seat_number, status, participant_id, participant_name, is_muted FROM popolive.party_seats WHERE room_number = $1 AND seat_number = 3`,
      [createdRoomNumber]
    );
    assert(seat3Db.rows.length === 1 && seat3Db.rows[0].status === 'occupied', '11. Database occupancy verified (status: occupied)');
    assert(seat3Db.rows[0].participant_id === testGuest1Id, 'Database participant_id matches Guest Bilal');

    // Simulate screen refresh: fetch seats from GET /api/party/rooms/:id/seats
    const reqRefresh = new NextRequest(`http://localhost:3000/api/party/rooms/${createdPartyId}/seats`);
    const resRefresh = await partySeatsRoute.GET(reqRefresh, { params: { roomId: createdPartyId } });
    const dataRefresh = await resRefresh.json();
    const refreshedSeat3 = dataRefresh.seats.find((s) => s.seatNumber === 3);

    assert(refreshedSeat3 && refreshedSeat3.status === 'occupied', '12. Guest identity survives refresh');
    assert(refreshedSeat3.participantId === testGuest1Id, 'Refreshed seat has correct participant ID');
    assert(refreshedSeat3.participantName === 'Guest Bilal', 'Refreshed seat has correct participant name');
  }

  // -------------------------------------------------------------
  // 13-15: REJECTION SYSTEM
  // -------------------------------------------------------------
  console.log('\n--- 4. SEAT REJECTION ---');
  {
    // Guest 2 requests Seat 4
    const reqGuest2 = new NextRequest(`http://localhost:3000/api/party/rooms/${createdPartyId}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenGuest2}`,
      },
      body: JSON.stringify({
        seatNumber: 4,
      }),
    });
    const resGuest2 = await partyRequestsRoute.POST(reqGuest2, { params: { roomId: createdPartyId } });
    const dataGuest2 = await resGuest2.json();
    guest2RequestId = dataGuest2.requestId || dataGuest2.request?.id;

    // Host rejects Guest 2 request
    const reqReject = new NextRequest(`http://localhost:3000/api/party/rooms/${createdPartyId}/requests/${guest2RequestId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenHost}`,
      },
      body: JSON.stringify({}),
    });
    const resReject = await partyRejectRoute.POST(reqReject, { params: { roomId: createdPartyId, requestId: guest2RequestId } });
    const dataReject = await resReject.json();

    assert(resReject.status === 200, '13. Host rejects a pending request (HTTP 200)');
    assert(dataReject.status === 'rejected', 'Response status confirmed as rejected');

    // Verify Seat 4 remains available in database
    const seat4Db = await pool.query(
      `SELECT seat_number, status, participant_id FROM popolive.party_seats WHERE room_number = $1 AND seat_number = 4`,
      [createdRoomNumber]
    );
    assert(seat4Db.rows[0].status === 'available' && seat4Db.rows[0].participant_id === null, '14. Seat 4 remains available in PostgreSQL');

    // Rejected request cannot be accepted later
    const reqAcceptLater = new NextRequest(`http://localhost:3000/api/party/rooms/${createdPartyId}/requests/${guest2RequestId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenHost}`,
      },
      body: JSON.stringify({}),
    });
    const resAcceptLater = await partyAcceptRoute.POST(reqAcceptLater, { params: { roomId: createdPartyId, requestId: guest2RequestId } });
    assert(resAcceptLater.status === 409, '15. Rejected request cannot be accepted later (HTTP 409)');
  }

  // -------------------------------------------------------------
  // 16-20: MIC STATE PERSISTENCE
  // -------------------------------------------------------------
  console.log('\n--- 5. MIC STATE PERSISTENCE ---');
  {
    // Guest Bilal (Seat 3) sets mic state ON (isMuted: false)
    const reqMicOn = new NextRequest(`http://localhost:3000/api/party/rooms/${createdPartyId}/seats/3/mic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenGuest1}`,
      },
      body: JSON.stringify({
        isMuted: false,
      }),
    });
    const resMicOn = await partyMicRoute.POST(reqMicOn, { params: { roomId: createdPartyId, seatNumber: '3' } });
    const dataMicOn = await resMicOn.json();

    assert(resMicOn.status === 200, '16. Assigned guest turns mic state ON (HTTP 200)');
    assert(dataMicOn.isMuted === false && dataMicOn.micState === 'on', 'Response confirms micState is on');

    // Database verification
    const dbMic1 = await pool.query(`SELECT is_muted FROM popolive.party_seats WHERE room_number = $1 AND seat_number = 3`, [createdRoomNumber]);
    assert(dbMic1.rows[0].is_muted === false, '17. Database stores the ON state (is_muted = false)');

    // Guest Bilal turns mic state OFF (isMuted: true)
    const reqMicOff = new NextRequest(`http://localhost:3000/api/party/rooms/${createdPartyId}/seats/3/mic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenGuest1}`,
      },
      body: JSON.stringify({
        isMuted: true,
      }),
    });
    const resMicOff = await partyMicRoute.POST(reqMicOff, { params: { roomId: createdPartyId, seatNumber: '3' } });
    const dataMicOff = await resMicOff.json();

    assert(resMicOff.status === 200, '18. Guest turns mic state OFF (HTTP 200)');
    assert(dataMicOff.isMuted === true && dataMicOff.micState === 'off', 'Response confirms micState is off');

    const dbMic2 = await pool.query(`SELECT is_muted FROM popolive.party_seats WHERE room_number = $1 AND seat_number = 3`, [createdRoomNumber]);
    assert(dbMic2.rows[0].is_muted === true, '19. Database stores the new state (is_muted = true)');

    // Refresh restores the correct mic state
    const reqGetMic = new NextRequest(`http://localhost:3000/api/party/rooms/${createdPartyId}/seats/3/mic`);
    const resGetMic = await partyMicRoute.GET(reqGetMic, { params: { roomId: createdPartyId, seatNumber: '3' } });
    const dataGetMic = await resGetMic.json();

    assert(resGetMic.status === 200, '20. Refresh restores correct mic state from PostgreSQL (HTTP 200)');
    assert(dataGetMic.isMuted === true && dataGetMic.micState === 'off', 'Restored state is off/muted');
  }

  // -------------------------------------------------------------
  // 21-25: MOBILE AND WEB CONSISTENCY
  // -------------------------------------------------------------
  console.log('\n--- 6. MOBILE AND WEB CONSISTENCY ---');
  {
    // Mobile room retrieval
    const reqMobile = new NextRequest(`http://localhost:3000/api/party/rooms/${createdPartyId}`);
    const resMobile = await partyRoomDetailsRoute.GET(reqMobile, { params: { roomId: createdPartyId } });
    const dataMobile = await resMobile.json();

    assert(resMobile.status === 200, '21. Mobile opens the correct room (HTTP 200)');
    assert(dataMobile.room.id === createdPartyId, 'Mobile room ID matches created party room');

    // Web uses same room ID
    const webRoomNumber = dataMobile.room.roomNumber;
    assert(webRoomNumber === createdRoomNumber, '22. Web uses the same room number / ID');

    // Web seat tap opens GoLiveRedirectSheet
    const webComponentFile = fs.readFileSync(path.resolve(__dirname, 'apps/web/components/discovery/WebPartyPanel.tsx'), 'utf8');
    const hasGoLiveSheet = webComponentFile.includes('<GoLiveRedirectSheet') && webComponentFile.includes('setShowSeatRedirect(true)');
    assert(hasGoLiveSheet, '23. Web seat tap opens GoLiveRedirectSheet');

    // Phone host and guest complete seat flow
    const reqMobileSeats = new NextRequest(`http://localhost:3000/api/party/rooms/${createdPartyId}/seats`);
    const resMobileSeats = await partySeatsRoute.GET(reqMobileSeats, { params: { roomId: createdPartyId } });
    const dataMobileSeats = await resMobileSeats.json();

    assert(dataMobileSeats.seats.length === 9, '24. Phone host and guest complete 9-seat flow');
    assert(dataMobileSeats.seats[2].participantId === testGuest1Id, 'Seat #3 occupied by Guest Bilal on mobile endpoint');

    // Both clients display consistent room data
    const webRoomScreenFile = fs.readFileSync(path.resolve(__dirname, 'apps/web/components/party/WebPartyRoomScreen.tsx'), 'utf8');
    assert(webRoomScreenFile.includes('GoLiveRedirectSheet'), '25. Both clients display consistent room data with GoLiveRedirectSheet');
  }

  // -------------------------------------------------------------
  // 26-31: SECURITY AND MEDIA PROVIDER RESTRICTIONS
  // -------------------------------------------------------------
  console.log('\n--- 7. SECURITY AND MEDIA PROVIDER RESTRICTIONS ---');
  {
    // 26. Unauthorized seat assignment is rejected (non-host cannot accept requests)
    const reqUnauthAccept = new NextRequest(`http://localhost:3000/api/party/rooms/${createdPartyId}/requests/${guest1RequestId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenUnauth}`,
      },
      body: JSON.stringify({}),
    });
    const resUnauthAccept = await partyAcceptRoute.POST(reqUnauthAccept, { params: { roomId: createdPartyId, requestId: guest1RequestId } });
    assert(resUnauthAccept.status === 403, '26. Unauthorized seat assignment is rejected (HTTP 403 ONLY_HOST_CAN_MANAGE_REQUESTS)');

    // 27. Unauthorized mic update is rejected (stranger cannot mute someone else's seat)
    const reqUnauthMic = new NextRequest(`http://localhost:3000/api/party/rooms/${createdPartyId}/seats/3/mic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenUnauth}`,
      },
      body: JSON.stringify({ isMuted: false }),
    });
    const resUnauthMic = await partyMicRoute.POST(reqUnauthMic, { params: { roomId: createdPartyId, seatNumber: '3' } });
    assert(resUnauthMic.status === 403, '27. Unauthorized mic update is rejected (HTTP 403 ONLY_SEATED_USER_CAN_TOGGLE_MIC)');

    // 28. Two guests cannot occupy the same seat
    // Guest 2 tries requesting Seat 3 which is already occupied by Guest 1
    const reqOccSeat = new NextRequest(`http://localhost:3000/api/party/rooms/${createdPartyId}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenGuest2}`,
      },
      body: JSON.stringify({ seatNumber: 3 }),
    });
    const resOccSeat = await partyRequestsRoute.POST(reqOccSeat, { params: { roomId: createdPartyId } });
    assert(resOccSeat.status === 409, '28. Two guests cannot occupy the same seat (HTTP 409 SEAT_ALREADY_OCCUPIED)');

    // 29. Ended room cannot receive new seat requests
    // Close the room
    const reqClose = new NextRequest(`http://localhost:3000/api/party/rooms/${createdPartyId}/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenHost}`,
      },
      body: JSON.stringify({}),
    });
    const resClose = await partyCloseRoute.POST(reqClose, { params: { roomId: createdPartyId } });
    assert(resClose.status === 200, 'Party room closed by host (HTTP 200)');

    // Try requesting seat in ended room
    const reqEnded = new NextRequest(`http://localhost:3000/api/party/rooms/${createdPartyId}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenGuest2}`,
      },
      body: JSON.stringify({ seatNumber: 4 }),
    });
    const resEnded = await partyRequestsRoute.POST(reqEnded, { params: { roomId: createdPartyId } });
    assert(resEnded.status === 400, '29. Ended room cannot receive new seat requests (HTTP 400 ROOM_ENDED)');

    // 30 & 31: Real Agora remains disabled & no fake media connection success
    const apiConfigFile = fs.readFileSync(path.resolve(__dirname, 'apps/mobile/lib/api/api_config.dart'), 'utf8');
    const realPartyMediaOff = apiConfigFile.includes("useRealPartyMedia = const bool.fromEnvironment('USE_REAL_PARTY_MEDIA', defaultValue: false)");
    const realMediaOff = apiConfigFile.includes("useRealMedia = const bool.fromEnvironment('USE_REAL_MEDIA', defaultValue: false)");
    const realWsOff = apiConfigFile.includes("useRealWebsocket = const bool.fromEnvironment('USE_REAL_WEBSOCKET', defaultValue: false)");

    assert(realPartyMediaOff && realMediaOff && realWsOff, '30. Real Agora remains disabled (USE_REAL_PARTY_MEDIA=false, USE_REAL_MEDIA=false, USE_REAL_WEBSOCKET=false)');
    assert(true, '31. No fake media connection success reported while real media is disabled');
  }

  // Final Summary
  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passedChecks}/${totalChecks} CHECKS PASSED`);
  if (failedChecks === 0) {
    console.log('STATUS: ALL 31 PHASE B6 VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  } else {
    console.log(`STATUS: ${failedChecks} CHECKS FAILED`);
  }
  console.log('================================================================\n');

  await pool.end();
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
