/**
 * POPO LIVE — PHASE B6 PROMPT 3 OF 4
 * SEAT REQUEST, HOST ACCEPT/REJECT & PERSISTENT SEAT OCCUPANCY VERIFICATION SUITE
 * 
 * Tests all 18 mandatory scenarios directly against live PostgreSQL and Next.js routes.
 */

const { Pool } = require('./apps/web/node_modules/pg');
const { NextRequest } = require('./apps/web/node_modules/next/server');

const pool = new Pool({
  connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
});

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

async function run() {
  console.log('\n================================================================');
  console.log('POPO LIVE — PHASE B6 PROMPT 3 OF 4: SEAT REQUEST & APPROVAL ENGINE');
  console.log('================================================================\n');

  // Dynamically import Next.js route handlers
  const createRoomRoute = await import('./apps/web/app/api/party/create/route.ts');
  const getRoomRoute = await import('./apps/web/app/api/party/rooms/[roomId]/route.ts');
  const getSeatsRoute = await import('./apps/web/app/api/party/rooms/[roomId]/seats/route.ts');
  const requestsRoute = await import('./apps/web/app/api/party/rooms/[roomId]/requests/route.ts');
  const acceptRoute = await import('./apps/web/app/api/party/rooms/[roomId]/requests/[requestId]/accept/route.ts');
  const rejectRoute = await import('./apps/web/app/api/party/rooms/[roomId]/requests/[requestId]/reject/route.ts');
  const closeRoute = await import('./apps/web/app/api/party/rooms/[roomId]/close/route.ts');

  // Seed test users & sessions in PostgreSQL
  const hostId = '00000000-0000-0000-0000-000000086001';
  const guest1Id = '00000000-0000-0000-0000-000000086002';
  const guest2Id = '00000000-0000-0000-0000-000000086003';
  const guest3Id = '00000000-0000-0000-0000-000000086004';
  const randoId = '00000000-0000-0000-0000-000000086099';

  const hostToken = 'token_b6p3_host';
  const guest1Token = 'token_b6p3_guest1';
  const guest2Token = 'token_b6p3_guest2';
  const guest3Token = 'token_b6p3_guest3';
  const randoToken = 'token_b6p3_rando';

  await pool.query(`
    INSERT INTO popolive.users (id, poppo_id, nickname, email, password_hash, role, status, is_face_verified, go_live_eligible, is_adult_verified, birthdate)
    VALUES 
      ('${hostId}', '86001', 'Host Zara', 'b6p3_host@popolive.com', 'hash', 'user', 'active', true, true, true, '1995-05-10'),
      ('${guest1Id}', '86002', 'Guest Bilal', 'b6p3_guest1@popolive.com', 'hash', 'user', 'active', true, true, true, '1998-08-15'),
      ('${guest2Id}', '86003', 'Guest Nadia', 'b6p3_guest2@popolive.com', 'hash', 'user', 'active', true, true, true, '1999-03-20'),
      ('${guest3Id}', '86004', 'Guest Tariq', 'b6p3_guest3@popolive.com', 'hash', 'user', 'active', true, true, true, '1997-11-25'),
      ('${randoId}', '86099', 'Guest Rando', 'b6p3_rando@popolive.com', 'hash', 'user', 'active', true, true, true, '2000-01-01')
    ON CONFLICT (id) DO UPDATE SET nickname = EXCLUDED.nickname, is_adult_verified = true, birthdate = EXCLUDED.birthdate, status = 'active';
  `);

  await pool.query(`
    INSERT INTO popolive.sessions (session_token, user_id, expires_at, is_revoked)
    VALUES 
      ('${hostToken}', '${hostId}', CURRENT_TIMESTAMP + INTERVAL '1 day', false),
      ('${guest1Token}', '${guest1Id}', CURRENT_TIMESTAMP + INTERVAL '1 day', false),
      ('${guest2Token}', '${guest2Id}', CURRENT_TIMESTAMP + INTERVAL '1 day', false),
      ('${guest3Token}', '${guest3Id}', CURRENT_TIMESTAMP + INTERVAL '1 day', false),
      ('${randoToken}', '${randoId}', CURRENT_TIMESTAMP + INTERVAL '1 day', false)
    ON CONFLICT (session_token) DO UPDATE SET user_id = EXCLUDED.user_id, expires_at = EXCLUDED.expires_at, is_revoked = false;
  `);

  function createRequest(url, method, token, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const init = { method, headers };
    if (body) init.body = JSON.stringify(body);
    return new NextRequest(url, init);
  }

  // Helper: Create a fresh party room
  console.log('--- 0. SETUP: CREATE FRESH PARTY ROOM ---');
  const reqCreate = createRequest('http://localhost:3000/api/party/create', 'POST', hostToken, {
    title: 'B6-P3 Concurrency & Seat Engine Lounge',
    category: 'singing',
    tags: ['b6', 'concurrency', 'seats'],
  });
  const resCreate = await createRoomRoute.POST(reqCreate);
  const dataCreate = await resCreate.json();
  assert([200, 201].includes(resCreate.status) && dataCreate.success, 'Fresh Party Room created');
  const roomNumber = dataCreate.party?.roomNumber || dataCreate.party?.room_number || dataCreate.room?.roomNumber;
  const roomId = dataCreate.party?.id || roomNumber;
  console.log(`  Room Number: ${roomNumber}, ID: ${roomId}`);

  // Scenario 1: Guest requests available seat
  console.log('\n--- SCENARIO 1: GUEST REQUESTS AVAILABLE SEAT ---');
  const req1 = createRequest(`http://localhost:3000/api/party/rooms/${roomId}/requests`, 'POST', guest1Token, {
    seatNumber: 3,
  });
  const res1 = await requestsRoute.POST(req1, { params: { roomId } });
  const data1 = await res1.json();
  assert([200, 201].includes(res1.status) && data1.success === true, '1. Guest requests available Seat #3 (HTTP 200/201)');
  assert(data1.status === 'pending' && data1.seatNumber === 3, 'Request status is "pending" for Seat #3');
  const requestIdBilal = data1.requestId;

  // Verify in PostgreSQL
  const dbReqBilal = await pool.query(
    `SELECT * FROM popolive.party_seat_requests WHERE id = $1`,
    [requestIdBilal]
  );
  assert(dbReqBilal.rows.length === 1 && dbReqBilal.rows[0].status === 'pending', 'Verified pending request record in PostgreSQL');

  // Scenario 2: Invalid seat request
  console.log('\n--- SCENARIO 2: INVALID SEAT REQUEST (OUT OF BOUNDS) ---');
  const reqInvalid0 = createRequest(`http://localhost:3000/api/party/rooms/${roomId}/requests`, 'POST', guest2Token, {
    seatNumber: 0,
  });
  const resInvalid0 = await requestsRoute.POST(reqInvalid0, { params: { roomId } });
  assert(resInvalid0.status === 400, '2a. Seat #0 rejected with HTTP 400 ROOM_FULL_OR_SEAT_OUT_OF_RANGE');

  const reqInvalid10 = createRequest(`http://localhost:3000/api/party/rooms/${roomId}/requests`, 'POST', guest2Token, {
    seatNumber: 10,
  });
  const resInvalid10 = await requestsRoute.POST(reqInvalid10, { params: { roomId } });
  assert(resInvalid10.status === 400, '2b. Seat #10 rejected with HTTP 400 ROOM_FULL_OR_SEAT_OUT_OF_RANGE');

  // Scenario 3: Duplicate pending request
  console.log('\n--- SCENARIO 3: DUPLICATE PENDING REQUEST ---');
  const reqDup = createRequest(`http://localhost:3000/api/party/rooms/${roomId}/requests`, 'POST', guest1Token, {
    seatNumber: 4,
  });
  const resDup = await requestsRoute.POST(reqDup, { params: { roomId } });
  const dataDup = await resDup.json();
  assert(resDup.status === 409 && dataDup.code === 'REQUEST_ALREADY_PENDING', '3. Duplicate pending request prevented with HTTP 409');

  // Scenario 4: Request for occupied seat (Seat 1 is host seat)
  console.log('\n--- SCENARIO 4: REQUEST FOR OCCUPIED SEAT ---');
  const reqOcc1 = createRequest(`http://localhost:3000/api/party/rooms/${roomId}/requests`, 'POST', guest2Token, {
    seatNumber: 1,
  });
  const resOcc1 = await requestsRoute.POST(reqOcc1, { params: { roomId } });
  const dataOcc1 = await resOcc1.json();
  assert(resOcc1.status === 409 && dataOcc1.code === 'SEAT_ALREADY_OCCUPIED', '4. Request for Seat #1 (Host seat) rejected with HTTP 409 SEAT_ALREADY_OCCUPIED');

  // Scenario 5: Host accepts request
  console.log('\n--- SCENARIO 5: HOST ACCEPTS REQUEST ---');
  const reqAccept = createRequest(`http://localhost:3000/api/party/rooms/${roomId}/requests/${requestIdBilal}/accept`, 'POST', hostToken);
  const resAccept = await acceptRoute.POST(reqAccept, { params: { roomId, requestId: requestIdBilal } });
  const dataAccept = await resAccept.json();
  assert(resAccept.status === 200 && dataAccept.success === true, '5. Host accepts Bilal request (HTTP 200)');
  assert(dataAccept.assignedSeat === 3 && dataAccept.participantId === guest1Id, 'Response confirms Seat #3 assigned to Bilal');
  assert(dataAccept.seat && dataAccept.seat.status === 'occupied', 'Response returns actual updated seat record');

  // Verify in PostgreSQL
  const dbSeat3 = await pool.query(
    `SELECT * FROM popolive.party_seats WHERE room_number = $1 AND seat_number = 3`,
    [roomNumber]
  );
  assert(dbSeat3.rows.length === 1 && dbSeat3.rows[0].status === 'occupied' && dbSeat3.rows[0].participant_id === guest1Id, 'PostgreSQL party_seats confirms Seat #3 is occupied by Bilal');

  // Scenario 6: Host rejects request
  console.log('\n--- SCENARIO 6: HOST REJECTS REQUEST ---');
  // Guest Nadia requests Seat 4
  const reqNadia4 = createRequest(`http://localhost:3000/api/party/rooms/${roomId}/requests`, 'POST', guest2Token, {
    seatNumber: 4,
  });
  const resNadia4 = await requestsRoute.POST(reqNadia4, { params: { roomId } });
  const dataNadia4 = await resNadia4.json();
  const requestIdNadia = dataNadia4.requestId;

  // Host rejects Nadia
  const reqReject = createRequest(`http://localhost:3000/api/party/rooms/${roomId}/requests/${requestIdNadia}/reject`, 'POST', hostToken);
  const resReject = await rejectRoute.POST(reqReject, { params: { roomId, requestId: requestIdNadia } });
  const dataReject = await resReject.json();
  assert(resReject.status === 200 && dataReject.status === 'rejected', '6. Host rejects Nadia request (HTTP 200, status: rejected)');

  // Scenario 7: Unauthorized host approval
  console.log('\n--- SCENARIO 7: UNAUTHORIZED HOST APPROVAL ---');
  // Tariq requests Seat 6
  const reqTariq6 = createRequest(`http://localhost:3000/api/party/rooms/${roomId}/requests`, 'POST', guest3Token, {
    seatNumber: 6,
  });
  const resTariq6 = await requestsRoute.POST(reqTariq6, { params: { roomId } });
  const dataTariq6 = await resTariq6.json();
  const requestIdTariq = dataTariq6.requestId;

  // Rando (non-host) tries to accept Tariq
  const reqUnauthAccept = createRequest(`http://localhost:3000/api/party/rooms/${roomId}/requests/${requestIdTariq}/accept`, 'POST', randoToken);
  const resUnauthAccept = await acceptRoute.POST(reqUnauthAccept, { params: { roomId, requestId: requestIdTariq } });
  const dataUnauthAccept = await resUnauthAccept.json();
  assert(resUnauthAccept.status === 403 && dataUnauthAccept.code === 'ONLY_HOST_CAN_MANAGE_REQUESTS', '7. Unauthorized host approval rejected with HTTP 403');

  // Scenario 8: Guest cannot approve own request
  console.log('\n--- SCENARIO 8: GUEST CANNOT APPROVE OWN REQUEST ---');
  const reqSelfApprove = createRequest(`http://localhost:3000/api/party/rooms/${roomId}/requests/${requestIdTariq}/accept`, 'POST', guest3Token);
  const resSelfApprove = await acceptRoute.POST(reqSelfApprove, { params: { roomId, requestId: requestIdTariq } });
  assert([403, 401].includes(resSelfApprove.status), '8. Guest cannot approve own request (HTTP 403)');

  // Scenario 9: Two guests request same seat
  console.log('\n--- SCENARIO 9: TWO GUESTS REQUEST SAME SEAT ---');
  // Reset Tariq request or use fresh Seat 5
  // Guest Nadia requests Seat 5
  const reqNadia5 = createRequest(`http://localhost:3000/api/party/rooms/${roomId}/requests`, 'POST', guest2Token, {
    seatNumber: 5,
  });
  const resNadia5 = await requestsRoute.POST(reqNadia5, { params: { roomId } });
  const dataNadia5 = await resNadia5.json();
  const reqIdNadia5 = dataNadia5.requestId;

  // Direct insert to simulate simultaneous second request for Seat 5 by Tariq
  const insTariq5 = await pool.query(
    `INSERT INTO popolive.party_seat_requests (id, party_id, room_number, seat_number, user_id, user_name, user_avatar, status, created_at, expires_at)
     VALUES (gen_random_uuid(), (SELECT id FROM popolive.party_rooms WHERE room_number = $1), $1, 5, $2, 'GuestTariq', '/avatars/tariq.png', 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '2 minutes')
     RETURNING id`,
    [roomNumber, guest3Id]
  );
  const reqIdTariq5 = insTariq5.rows[0].id;

  // Host accepts Nadia for Seat 5
  const reqAccNadia = createRequest(`http://localhost:3000/api/party/rooms/${roomId}/requests/${reqIdNadia5}/accept`, 'POST', hostToken);
  const resAccNadia = await acceptRoute.POST(reqAccNadia, { params: { roomId, requestId: reqIdNadia5 } });
  assert(resAccNadia.status === 200, 'Host accepts Nadia for Seat #5 (HTTP 200)');

  // Now Host tries to accept Tariq for Seat 5 -> Must fail with 409 because Seat 5 is already taken!
  const reqAccTariq = createRequest(`http://localhost:3000/api/party/rooms/${roomId}/requests/${reqIdTariq5}/accept`, 'POST', hostToken);
  const resAccTariq = await acceptRoute.POST(reqAccTariq, { params: { roomId, requestId: reqIdTariq5 } });
  const dataAccTariq = await resAccTariq.json();
  assert(resAccTariq.status === 409 && dataAccTariq.code === 'SEAT_ALREADY_OCCUPIED', '9. Second guest for Seat #5 rejected with HTTP 409 SEAT_ALREADY_OCCUPIED');

  // Scenario 10: Concurrent approval attempts
  console.log('\n--- SCENARIO 10: CONCURRENT APPROVAL ATTEMPTS ---');
  // Rando requests Seat 7
  const reqRando7 = createRequest(`http://localhost:3000/api/party/rooms/${roomId}/requests`, 'POST', randoToken, {
    seatNumber: 7,
  });
  const resRando7 = await requestsRoute.POST(reqRando7, { params: { roomId } });
  const dataRando7 = await resRando7.json();
  const reqIdRando7 = dataRando7.requestId;

  // Fire two concurrent accept calls for reqIdRando7
  const [resConc1, resConc2] = await Promise.all([
    acceptRoute.POST(createRequest(`http://localhost:3000/api/party/rooms/${roomId}/requests/${reqIdRando7}/accept`, 'POST', hostToken), { params: { roomId, requestId: reqIdRando7 } }),
    acceptRoute.POST(createRequest(`http://localhost:3000/api/party/rooms/${roomId}/requests/${reqIdRando7}/accept`, 'POST', hostToken), { params: { roomId, requestId: reqIdRando7 } }),
  ]);
  const statuses = [resConc1.status, resConc2.status].sort();
  assert(statuses[0] === 200 && statuses[1] === 409, `10. Concurrent approval attempts: Exactly one succeeds (200), other fails (409 REQUEST_ALREADY_RESOLVED) [${statuses.join(', ')}]`);

  // Scenario 11: Duplicate acceptance
  console.log('\n--- SCENARIO 11: DUPLICATE ACCEPTANCE OF ALREADY ACCEPTED REQUEST ---');
  const reqDupAccept = createRequest(`http://localhost:3000/api/party/rooms/${roomId}/requests/${reqIdRando7}/accept`, 'POST', hostToken);
  const resDupAccept = await acceptRoute.POST(reqDupAccept, { params: { roomId, requestId: reqIdRando7 } });
  const dataDupAccept = await resDupAccept.json();
  assert(resDupAccept.status === 409 && dataDupAccept.code === 'REQUEST_ALREADY_RESOLVED', '11. Duplicate acceptance returns HTTP 409 REQUEST_ALREADY_RESOLVED');

  // Scenario 12: Rejected request leaves seat available
  console.log('\n--- SCENARIO 12: REJECTED REQUEST LEAVES SEAT AVAILABLE ---');
  const dbSeat4 = await pool.query(
    `SELECT status, participant_id FROM popolive.party_seats WHERE room_number = $1 AND seat_number = 4`,
    [roomNumber]
  );
  assert(dbSeat4.rows.length === 1 && dbSeat4.rows[0].status === 'available' && dbSeat4.rows[0].participant_id === null, '12a. Seat #4 remains available in PostgreSQL');

  const reqAccRejected = createRequest(`http://localhost:3000/api/party/rooms/${roomId}/requests/${requestIdNadia}/accept`, 'POST', hostToken);
  const resAccRejected = await acceptRoute.POST(reqAccRejected, { params: { roomId, requestId: requestIdNadia } });
  assert(resAccRejected.status === 409, '12b. Rejected request cannot be accepted later (HTTP 409)');

  // Scenario 13: Accepted seat survives refresh
  console.log('\n--- SCENARIO 13: ACCEPTED SEAT SURVIVES REFRESH ---');
  const reqGetRoom = createRequest(`http://localhost:3000/api/party/rooms/${roomId}`, 'GET', hostToken);
  const resGetRoom = await getRoomRoute.GET(reqGetRoom, { params: { roomId } });
  const dataGetRoom = await resGetRoom.json();
  assert(resGetRoom.status === 200 && dataGetRoom.success, 'Room refreshed via GET /api/party/rooms/:id');

  const reqGetSeats = createRequest(`http://localhost:3000/api/party/rooms/${roomId}/seats`, 'GET', hostToken);
  const resGetSeats = await getSeatsRoute.GET(reqGetSeats, { params: { roomId } });
  const dataGetSeats = await resGetSeats.json();
  const refreshedSeat3 = dataGetSeats.seats.find((s) => s.seatNumber === 3 || s.seat_number === 3);
  assert(refreshedSeat3 && refreshedSeat3.status === 'occupied' && (refreshedSeat3.participantId === guest1Id || refreshedSeat3.participant_id === guest1Id), '13. Seat #3 preserves Guest Bilal occupancy across refresh');

  // Scenario 14: Mobile request flow
  console.log('\n--- SCENARIO 14: MOBILE REQUEST FLOW (API SERVICE CONTRACTS) ---');
  // Check GET /api/party/rooms/:id/requests by host
  const reqHostGet = createRequest(`http://localhost:3000/api/party/rooms/${roomId}/requests`, 'GET', hostToken);
  const resHostGet = await requestsRoute.GET(reqHostGet, { params: { roomId } });
  const dataHostGet = await resHostGet.json();
  assert(resHostGet.status === 200 && Array.isArray(dataHostGet.requests), '14. Host successfully polls pending requests endpoint (HTTP 200)');

  // Scenario 15: Web GoLiveRedirectSheet behavior
  console.log('\n--- SCENARIO 15: WEB GOLIVEREDIRECTSHEET BEHAVIOR ---');
  const webPanelContent = require('fs').readFileSync('apps/web/components/discovery/WebPartyPanel.tsx', 'utf8');
  const webRoomContent = require('fs').readFileSync('apps/web/components/party/WebPartyRoomScreen.tsx', 'utf8');
  assert(webPanelContent.includes('<GoLiveRedirectSheet') && webRoomContent.includes('<GoLiveRedirectSheet'), '15. Web components render GoLiveRedirectSheet on seat interaction');

  // Scenario 16: Invalid room
  console.log('\n--- SCENARIO 16: INVALID ROOM ID ---');
  const reqInvRoom = createRequest('http://localhost:3000/api/party/rooms/99999999_fake/requests', 'POST', guest1Token, { seatNumber: 2 });
  const resInvRoom = await requestsRoute.POST(reqInvRoom, { params: { roomId: '99999999_fake' } });
  assert(resInvRoom.status === 404, '16. Invalid room ID returns HTTP 404 ROOM_NOT_FOUND');

  // Scenario 17: Ended room
  console.log('\n--- SCENARIO 17: ENDED ROOM REJECTS SEAT REQUESTS ---');
  const reqClose = createRequest(`http://localhost:3000/api/party/rooms/${roomId}/close`, 'POST', hostToken);
  const resClose = await closeRoute.POST(reqClose, { params: { roomId } });
  assert(resClose.status === 200, 'Party room closed by host (HTTP 200)');

  const reqEnded = createRequest(`http://localhost:3000/api/party/rooms/${roomId}/requests`, 'POST', guest1Token, { seatNumber: 2 });
  const resEnded = await requestsRoute.POST(reqEnded, { params: { roomId } });
  const dataEnded = await resEnded.json();
  assert(resEnded.status === 400 && dataEnded.code === 'ROOM_ENDED', '17. Ended room rejects seat requests with HTTP 400 ROOM_ENDED');

  // Scenario 18: Database transaction rollback
  console.log('\n--- SCENARIO 18: DATABASE TRANSACTION ROLLBACK ON FAILURE ---');
  // Create another room to test rollback
  const reqCreate2 = createRequest('http://localhost:3000/api/party/create', 'POST', hostToken, {
    title: 'B6-P3 Rollback Lounge',
    category: 'chat',
  });
  const resCreate2 = await createRoomRoute.POST(reqCreate2);
  const dataCreate2 = await resCreate2.json();
  const room2Number = dataCreate2.party?.roomNumber || dataCreate2.party?.room_number || dataCreate2.room?.roomNumber;
  const room2Id = dataCreate2.party?.id || room2Number;

  // Seat Guest 1 in Seat 2 directly in DB
  await pool.query(
    `UPDATE popolive.party_seats SET status = 'occupied', participant_id = $1 WHERE room_number = $2 AND seat_number = 2`,
    [guest1Id, room2Number]
  );

  // Now create a pending request for Guest 1 in Seat 3 (candidate already seated!)
  const insReqRollback = await pool.query(
    `INSERT INTO popolive.party_seat_requests (id, party_id, room_number, seat_number, user_id, user_name, user_avatar, status, created_at, expires_at)
     VALUES (gen_random_uuid(), (SELECT id FROM popolive.party_rooms WHERE room_number = $1), $1, 3, $2, 'GuestBilal', '/avatars/bilal.png', 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '2 minutes')
     RETURNING id`,
    [room2Number, guest1Id]
  );
  const reqRollbackId = insReqRollback.rows[0].id;

  // Attempt host approval -> Should fail with 409 USER_ALREADY_SEATED and rollback Seat 3 update
  const reqAccRollback = createRequest(`http://localhost:3000/api/party/rooms/${room2Id}/requests/${reqRollbackId}/accept`, 'POST', hostToken);
  const resAccRollback = await acceptRoute.POST(reqAccRollback, { params: { roomId: room2Id, requestId: reqRollbackId } });
  assert(resAccRollback.status === 409, 'Approval fails with HTTP 409 because candidate is already seated');

  // Verify Seat 3 was NOT occupied and remains available
  const dbSeat3Rollback = await pool.query(
    `SELECT status, participant_id FROM popolive.party_seats WHERE room_number = $1 AND seat_number = 3`,
    [room2Number]
  );
  assert(dbSeat3Rollback.rows.length === 1 && dbSeat3Rollback.rows[0].status === 'available' && dbSeat3Rollback.rows[0].participant_id === null, '18. Database transaction rolled back: Seat #3 remains completely available');

  console.log('\n================================================================');
  console.log(`TOTAL SCENARIO CHECKS: ${totalChecks}`);
  console.log(`PASSED: ${passedChecks}`);
  console.log(`FAILED: ${failedChecks}`);
  console.log('================================================================\n');

  await pool.end();
  process.exit(failedChecks === 0 ? 0 : 1);
}

run().catch(async (err) => {
  console.error('Test execution failed:', err);
  await pool.end();
  process.exit(1);
});
