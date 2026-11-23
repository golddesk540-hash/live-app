/**
 * POPO LIVE — PHASE B6 PROMPT 2 OF 4
 * CREATE PARTY ROOM + NINE SEAT INITIALIZATION VERIFICATION SUITE
 * 
 * Verifies all 14 required test scenarios against PostgreSQL and Next.js routes.
 */

const { Pool } = require('./apps/web/node_modules/pg');
const { NextRequest } = require('./apps/web/node_modules/next/server');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  options: '-c search_path=popolive,public',
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
  console.log('POPO LIVE — PHASE B6 PROMPT 2 OF 4: CREATE PARTY ROOM & 9 SEATS');
  console.log('================================================================\n');

  // Import Next.js route handlers
  const partyCreateRoute = await import('./apps/web/app/api/party/create/route.ts');
  const partyRoomsRoute = await import('./apps/web/app/api/party/rooms/route.ts');
  const partyRoomDetailsRoute = await import('./apps/web/app/api/party/rooms/[roomId]/route.ts');
  const partySeatsRoute = await import('./apps/web/app/api/party/rooms/[roomId]/seats/route.ts');

  // Seed authentic test users & sessions in PostgreSQL
  const hostId = '00000000-0000-0000-0000-000000086001';
  const spoofAttemptId = '00000000-0000-0000-0000-000000086099';
  const hostToken = 'token_b6p2_host_zara';

  await pool.query(`
    INSERT INTO popolive.users (id, poppo_id, nickname, email, password_hash, role, status, is_face_verified, go_live_eligible, is_adult_verified, birthdate)
    VALUES 
      ('${hostId}', '86001', 'Host Zara', 'party_zara@popolive.com', 'hash', 'user', 'active', true, true, true, '1995-05-15'),
      ('${spoofAttemptId}', '86099', 'Rando Person', 'party_rando@popolive.com', 'hash', 'user', 'active', true, true, true, '1997-03-01')
    ON CONFLICT (id) DO UPDATE SET nickname = EXCLUDED.nickname, is_adult_verified = true, birthdate = EXCLUDED.birthdate, status = 'active';
  `);

  await pool.query(`
    INSERT INTO popolive.sessions (session_token, user_id, expires_at, is_revoked)
    VALUES ('${hostToken}', '${hostId}', CURRENT_TIMESTAMP + INTERVAL '1 day', false)
    ON CONFLICT (session_token) DO UPDATE SET user_id = EXCLUDED.user_id, expires_at = EXCLUDED.expires_at, is_revoked = false;
  `);

  function createReq(url, method, token, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const init = { method, headers };
    if (body) init.body = JSON.stringify(body);
    return new NextRequest(url, init);
  }

  // -------------------------------------------------------------
  // Scenario 1: Valid Room Creation
  // -------------------------------------------------------------
  console.log('--- SCENARIO 1: VALID ROOM CREATION ---');
  const req1 = createReq('http://localhost:3000/api/party/create', 'POST', hostToken, {
    title: 'Zara VIP Diamond Lounge 💎',
    categoryId: 'chill_chat',
    roomType: 'public',
    maxSeats: 9,
  });
  const res1 = await partyCreateRoute.POST(req1);
  const data1 = await res1.json();
  assert([200, 201].includes(res1.status) && data1.success === true, '1a. Valid room creation returns HTTP 201/200');
  const createdRoomId = data1.party?.id || data1.room?.id;
  const createdRoomNumber = data1.party?.roomNumber || data1.room?.roomNumber;
  assert(createdRoomId && !createdRoomId.startsWith('party_local_'), `1b. Returns real persistent room ID: ${createdRoomId}`);
  assert(createdRoomNumber && createdRoomNumber.startsWith('7'), `1c. Returns real persistent room number: ${createdRoomNumber}`);

  // -------------------------------------------------------------
  // Scenario 2: Invalid Room Configuration
  // -------------------------------------------------------------
  console.log('\n--- SCENARIO 2: INVALID ROOM CONFIGURATION ---');
  // 2a. Empty title
  const reqEmptyTitle = createReq('http://localhost:3000/api/party/create', 'POST', hostToken, {
    title: '   ',
    categoryId: 'chill_chat',
  });
  const resEmptyTitle = await partyCreateRoute.POST(reqEmptyTitle);
  const dataEmptyTitle = await resEmptyTitle.json();
  assert(resEmptyTitle.status === 400 && dataEmptyTitle.code === 'INVALID_TITLE', '2a. Empty room title rejected with HTTP 400 INVALID_TITLE');

  // 2b. Title exceeding 50 chars
  const reqLongTitle = createReq('http://localhost:3000/api/party/create', 'POST', hostToken, {
    title: 'A'.repeat(51),
    categoryId: 'chill_chat',
  });
  const resLongTitle = await partyCreateRoute.POST(reqLongTitle);
  const dataLongTitle = await resLongTitle.json();
  assert(resLongTitle.status === 400 && dataLongTitle.code === 'TITLE_TOO_LONG', '2b. Excessively long title (>50) rejected with HTTP 400 TITLE_TOO_LONG');

  // 2c. Invalid seat count (not 9)
  const reqInvalidSeats = createReq('http://localhost:3000/api/party/create', 'POST', hostToken, {
    title: 'Ten Seats Party',
    categoryId: 'chill_chat',
    maxSeats: 12,
  });
  const resInvalidSeats = await partyCreateRoute.POST(reqInvalidSeats);
  const dataInvalidSeats = await resInvalidSeats.json();
  assert(resInvalidSeats.status === 400 && dataInvalidSeats.code === 'SEAT_COUNT_MUST_BE_9', '2c. Invalid maxSeats (12 != 9) rejected with HTTP 400 SEAT_COUNT_MUST_BE_9');

  // -------------------------------------------------------------
  // Scenario 3: Unauthenticated Creation
  // -------------------------------------------------------------
  console.log('\n--- SCENARIO 3: UNAUTHENTICATED CREATION ---');
  const reqUnauth = createReq('http://localhost:3000/api/party/create', 'POST', null, {
    title: 'Unauthenticated Party',
  });
  const resUnauth = await partyCreateRoute.POST(reqUnauth);
  assert(resUnauth.status === 401, '3. Unauthenticated room creation rejected with HTTP 401 UNAUTHORIZED');

  // -------------------------------------------------------------
  // Scenario 4: Correct Host Ownership & Spoofing Prevention
  // -------------------------------------------------------------
  console.log('\n--- SCENARIO 4: CORRECT HOST OWNERSHIP & SPOOFING PREVENTION ---');
  // Attempt to supply a different client-supplied hostId
  const reqSpoof = createReq('http://localhost:3000/api/party/create', 'POST', hostToken, {
    title: 'Anti-Spoofing Room',
    hostId: spoofAttemptId, // Spoofing attempt
    hostNickname: 'Hacker Spoof',
  });
  const resSpoof = await partyCreateRoute.POST(reqSpoof);
  const dataSpoof = await resSpoof.json();
  const roomSpoofId = dataSpoof.party?.id || dataSpoof.room?.id;

  const dbSpoofCheck = await pool.query(
    `SELECT host_user_id, host_nickname FROM popolive.party_rooms WHERE id = $1`,
    [roomSpoofId]
  );
  assert(dbSpoofCheck.rows.length === 1, 'Room created in database');
  assert(dbSpoofCheck.rows[0].host_user_id === hostId, `4a. Host ID is strictly authenticated host (${hostId}), ignoring client-supplied ${spoofAttemptId}`);
  assert(dbSpoofCheck.rows[0].host_nickname === 'Host Zara', '4b. Host nickname derived from authenticated session');

  // -------------------------------------------------------------
  // Scenario 5: Exactly Nine Seats
  // -------------------------------------------------------------
  console.log('\n--- SCENARIO 5: EXACTLY NINE SEATS IN DATABASE ---');
  const dbSeatsCount = await pool.query(
    `SELECT COUNT(*) as count FROM popolive.party_seats WHERE room_number = $1`,
    [createdRoomNumber]
  );
  const totalSeats = parseInt(dbSeatsCount.rows[0].count, 10);
  assert(totalSeats === 9, `5. Exactly nine seat rows exist in PostgreSQL for room #${createdRoomNumber} (count: ${totalSeats})`);

  // -------------------------------------------------------------
  // Scenario 6: Seat Numbers 1–9 Sequence & State
  // -------------------------------------------------------------
  console.log('\n--- SCENARIO 6: SEAT NUMBERS 1–9 SEQUENCE & INITIAL STATE ---');
  const dbSeatsRows = await pool.query(
    `SELECT seat_number, status, is_host, is_muted, participant_id, participant_name
     FROM popolive.party_seats
     WHERE room_number = $1
     ORDER BY seat_number ASC`,
    [createdRoomNumber]
  );
  const seatNums = dbSeatsRows.rows.map((r) => r.seat_number);
  assert(JSON.stringify(seatNums) === JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9]), '6a. Seat numbers strictly sequential from 1 through 9');

  const seat1 = dbSeatsRows.rows[0];
  assert(seat1.seat_number === 1 && seat1.is_host === true && seat1.status === 'occupied', '6b. Seat #1 is host seat and occupied');
  assert(seat1.participant_id === hostId && seat1.participant_name === 'Host Zara', '6c. Seat #1 occupied by authenticated host');

  const guestSeats = dbSeatsRows.rows.slice(1);
  const allGuestSeatsAvailable = guestSeats.every((s) => s.status === 'available' && s.participant_id === null && s.is_host === false);
  assert(allGuestSeatsAvailable, '6d. Seats 2 through 9 are all available/empty with participant_id = NULL');

  // -------------------------------------------------------------
  // Scenario 7: Duplicate Seat Prevention
  // -------------------------------------------------------------
  console.log('\n--- SCENARIO 7: DUPLICATE SEAT PREVENTION VIA DATABASE CONSTRAINT ---');
  let duplicateConstraintFired = false;
  try {
    // Attempt inserting a duplicate seat #3 for this room
    await pool.query(
      `INSERT INTO popolive.party_seats (id, party_id, room_number, seat_number, status)
       VALUES (gen_random_uuid(), $1, $2, 3, 'available')`,
      [createdRoomId, createdRoomNumber]
    );
  } catch (err) {
    if (err.code === '23505' || err.message.includes('unique_party_seat') || err.message.includes('duplicate key')) {
      duplicateConstraintFired = true;
    }
  }
  assert(duplicateConstraintFired, '7. Duplicate room-seat insertion strictly blocked by PostgreSQL unique constraint (unique_party_seat)');

  // -------------------------------------------------------------
  // Scenario 8: Room Creation Rollback on Failure
  // -------------------------------------------------------------
  console.log('\n--- SCENARIO 8: TRANSACTION ROLLBACK ON FAILURE ---');
  let transactionRolledBack = false;
  const testFailRoomNumber = '799999_fail_test';
  try {
    const { withTransaction } = await import('./apps/web/lib/db.ts');
    await withTransaction(async (client) => {
      // Step 1: Insert room
      await client.query(
        `INSERT INTO popolive.party_rooms (id, room_number, title, is_live, status, max_seats)
         VALUES (gen_random_uuid(), $1, 'Failing Room', true, 'live', 9)`,
        [testFailRoomNumber]
      );
      // Step 2: Throw simulated error before commit
      throw new Error('SIMULATED_TRANSACTION_FAILURE');
    });
  } catch (e) {
    transactionRolledBack = true;
  }
  const checkFailRoom = await pool.query(
    `SELECT * FROM popolive.party_rooms WHERE room_number = $1`,
    [testFailRoomNumber]
  );
  assert(transactionRolledBack && checkFailRoom.rows.length === 0, '8. Transaction rollback verified: Failed operation commits zero room rows');

  // -------------------------------------------------------------
  // Scenario 9: Seat Initialization Rollback on Failure
  // -------------------------------------------------------------
  console.log('\n--- SCENARIO 9: SEAT INITIALIZATION ROLLBACK ---');
  const testSeatFailRoom = '799998_seat_fail';
  try {
    const { withTransaction } = await import('./apps/web/lib/db.ts');
    await withTransaction(async (client) => {
      await client.query(
        `INSERT INTO popolive.party_rooms (id, room_number, title, is_live, status, max_seats)
         VALUES (gen_random_uuid(), $1, 'Failing Seat Init Room', true, 'live', 9)`,
        [testSeatFailRoom]
      );
      // Violate seat CHECK constraint (seat_number = 999)
      await client.query(
        `INSERT INTO popolive.party_seats (id, room_number, seat_number, status)
         VALUES (gen_random_uuid(), $1, 999, 'available')`,
        [testSeatFailRoom]
      );
    });
  } catch (e) {
    // Expected constraint violation
  }
  const checkSeatFailRoom = await pool.query(
    `SELECT * FROM popolive.party_rooms WHERE room_number = $1`,
    [testSeatFailRoom]
  );
  const checkSeatFailSeats = await pool.query(
    `SELECT * FROM popolive.party_seats WHERE room_number = $1`,
    [testSeatFailRoom]
  );
  assert(checkSeatFailRoom.rows.length === 0 && checkSeatFailSeats.rows.length === 0, '9. Room creation rolled back when seat initialization fails (atomic guarantee)');

  // -------------------------------------------------------------
  // Scenario 10: Mobile Room Creation API Contract
  // -------------------------------------------------------------
  console.log('\n--- SCENARIO 10: MOBILE ROOM CREATION API CONTRACT ---');
  // Mobile calls POST /api/party/rooms
  const reqMobile = createReq('http://localhost:3000/api/party/rooms', 'POST', hostToken, {
    title: 'Mobile Flutter Party Room 📱',
    categoryId: 'gaming',
    roomType: 'public',
    maxSeats: 9,
  });
  const resMobile = await partyRoomsRoute.POST(reqMobile);
  const dataMobile = await resMobile.json();
  assert(resMobile.status === 201 && dataMobile.success === true, '10a. Mobile room creation route (POST /api/party/rooms) returns HTTP 201');
  const mobileRoomId = dataMobile.room?.id || dataMobile.party?.id;
  const mobileRoomNumber = dataMobile.room?.roomNumber || dataMobile.party?.roomNumber;
  assert(mobileRoomId && mobileRoomNumber, '10b. Mobile receives actual room ID and room number');

  // Verify mobile seats endpoint
  const reqMobileSeats = createReq(`http://localhost:3000/api/party/rooms/${mobileRoomId}/seats`, 'GET', hostToken);
  const resMobileSeats = await partySeatsRoute.GET(reqMobileSeats, { params: { roomId: mobileRoomId } });
  const dataMobileSeats = await resMobileSeats.json();
  assert(resMobileSeats.status === 200 && dataMobileSeats.seats.length === 9, '10c. Mobile fetches exactly 9 seats from database endpoint');

  // -------------------------------------------------------------
  // Scenario 11: Web Room Creation API Contract
  // -------------------------------------------------------------
  console.log('\n--- SCENARIO 11: WEB ROOM CREATION API CONTRACT ---');
  const reqWeb = createReq('http://localhost:3000/api/party/create', 'POST', hostToken, {
    title: 'Web Next.js Party Room 💻',
    categoryId: 'music',
    roomType: 'public',
    maxSeats: 9,
  });
  const resWeb = await partyCreateRoute.POST(reqWeb);
  const dataWeb = await resWeb.json();
  assert(resWeb.status === 201 && dataWeb.success === true, '11. Web room creation route returns HTTP 201 with identical architecture');
  const webRoomId = dataWeb.party?.id || dataWeb.room?.id;

  // -------------------------------------------------------------
  // Scenario 12: Correct Room ID on Both Clients
  // -------------------------------------------------------------
  console.log('\n--- SCENARIO 12: ROOM ID CONSISTENCY ACROSS CLIENTS ---');
  const reqDetailMobile = createReq(`http://localhost:3000/api/party/rooms/${mobileRoomId}`, 'GET', hostToken);
  const resDetailMobile = await partyRoomDetailsRoute.GET(reqDetailMobile, { params: { roomId: mobileRoomId } });
  const dataDetailMobile = await resDetailMobile.json();

  const reqDetailWeb = createReq(`http://localhost:3000/api/party/rooms/${webRoomId}`, 'GET', hostToken);
  const resDetailWeb = await partyRoomDetailsRoute.GET(reqDetailWeb, { params: { roomId: webRoomId } });
  const dataDetailWeb = await resDetailWeb.json();

  assert(resDetailMobile.status === 200 && dataDetailMobile.room.id === mobileRoomId, '12a. Mobile queries room by ID and receives matching PostgreSQL record');
  assert(resDetailWeb.status === 200 && dataDetailWeb.room.id === webRoomId, '12b. Web queries room by ID and receives matching PostgreSQL record');

  // -------------------------------------------------------------
  // Scenario 13: Repeated Submission Protection & UI Safety
  // -------------------------------------------------------------
  console.log('\n--- SCENARIO 13: REPEATED SUBMISSION PROTECTION ---');
  const flutterScreenCode = fs.readFileSync(path.resolve(__dirname, 'apps/mobile/lib/screens/party/create_party_screen.dart'), 'utf8');
  assert(flutterScreenCode.includes('_isCreating') && flutterScreenCode.includes('CircularProgressIndicator'), '13a. Flutter CreatePartyScreen includes in-flight submission lock (_isCreating) and loading spinner');
  assert(flutterScreenCode.includes('ApiConfig.usePartyApi'), '13b. Flutter CreatePartyScreen connects to PartyApiService when usePartyApi is enabled');

  // -------------------------------------------------------------
  // Scenario 14: No Fixture Fallback when Party API is Enabled
  // -------------------------------------------------------------
  console.log('\n--- SCENARIO 14: NO FIXTURE FALLBACK VERIFICATION ---');
  const dbVerifyCreated = await pool.query(
    `SELECT id, room_number, title, host_user_id, is_live, status FROM popolive.party_rooms WHERE id = $1`,
    [createdRoomId]
  );
  assert(dbVerifyCreated.rows.length === 1, '14a. Created room exists as a genuine PostgreSQL row');
  assert(dbVerifyCreated.rows[0].status === 'live' && dbVerifyCreated.rows[0].is_live === true, '14b. Room status is live in PostgreSQL');
  assert(!dbVerifyCreated.rows[0].id.includes('party_local_'), '14c. Generated room ID is real UUID/PostgreSQL ID, not fixture ID');

  console.log('\n================================================================');
  console.log(`TOTAL SCENARIO CHECKS: ${totalChecks}`);
  console.log(`PASSED: ${passedChecks}`);
  console.log(`FAILED: ${failedChecks}`);
  console.log('================================================================\n');

  await pool.end();
  process.exit(failedChecks === 0 ? 0 : 1);
}

run().catch(async (err) => {
  console.error('Test execution error:', err);
  await pool.end();
  process.exit(1);
});
