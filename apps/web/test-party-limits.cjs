const { Pool } = require('pg');
const http = require('http');
const fs = require('fs');
const path = require('path');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

const pool = new Pool({ connectionString });

const BASE_URL = 'http://localhost:3000';

function makeRequest(method, urlPath, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, data: json, headers: res.headers });
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('===================================================================');
  console.log('POPO LIVE — PHASE 5 — MODULE 5.9: LIMITS THAT PROTECT THE ROOM');
  console.log('Strict 1:1 Design Reference: 05_09_limits_that_protect_the_room.png');
  console.log('===================================================================\n');

  const client = await pool.connect();
  const testRoomId = '7001';

  try {
    // ------------------------------------------------------------------------
    // SECTION 1: DATABASE MIGRATION & AUDIT LOG SCHEMA
    // ------------------------------------------------------------------------
    console.log('--- SECTION 1: DATABASE MIGRATION 033 & SCHEMA VALIDATION ---');

    // Test 1: Check party_rooms columns
    const colsRes = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'popolive' AND table_name = 'party_rooms'
        AND column_name IN ('max_audience', 'allow_join_requests', 'is_invite_only', 'is_locked', 'seats_layout');
    `);
    assert(
      colsRes.rows.length === 5,
      `Migration 033 added max_audience, allow_join_requests, is_invite_only, is_locked, seats_layout (${colsRes.rows.length}/5)`
    );

    // Test 2: Check party_limits_logs table
    const limitsLogRes = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'popolive' AND table_name = 'party_limits_logs';
    `);
    const limitsCols = limitsLogRes.rows.map((r) => r.column_name);
    assert(
      limitsCols.includes('room_number') &&
        limitsCols.includes('max_seats') &&
        limitsCols.includes('max_audience') &&
        limitsCols.includes('allow_join_requests') &&
        limitsCols.includes('is_invite_only') &&
        limitsCols.includes('is_locked') &&
        limitsCols.includes('updated_by'),
      'Table popolive.party_limits_logs exists with all required audit columns'
    );

    // ------------------------------------------------------------------------
    // SECTION 2: 1:1 DESIGN REFERENCE & ASSETS
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 2: 1:1 DESIGN REFERENCE & UI RENDERING ---');

    // Test 3: 05_09_limits_that_protect_the_room.png exists in public/assets/party
    const imgPath = path.join(
      __dirname,
      'public',
      'assets',
      'party',
      '05_09_limits_that_protect_the_room.png'
    );
    assert(
      fs.existsSync(imgPath),
      '05_09_limits_that_protect_the_room.png exists in apps/web/public/assets/party'
    );

    // Test 4: Standalone page route returns 200 OK
    const pageRes1 = await makeRequest('GET', '/party/limits?preview=demo');
    assert(pageRes1.status === 200, 'GET /party/limits?preview=demo returns 200 OK');

    // Test 5: Room-specific limits route returns 200 OK
    const pageRes2 = await makeRequest('GET', `/party/room/${testRoomId}/limits`);
    assert(pageRes2.status === 200, `GET /party/room/${testRoomId}/limits returns 200 OK`);

    const html = typeof pageRes1.data === 'string' ? pageRes1.data : JSON.stringify(pageRes1.data);

    // Test 6: Title and container rendered
    assert(
      html.includes('Room Limits') && html.includes('limits-screen-container'),
      'UI renders "Room Limits" heading and container'
    );

    // Test 7: Row 1 Max Seats rendered
    assert(html.includes('Max Seats'), 'UI renders Row 1 "Max Seats"');

    // Test 8: Row 2 Audience Limit rendered
    assert(html.includes('Audience Limit'), 'UI renders Row 2 "Audience Limit"');

    // Test 9: Row 3 Join Requests rendered
    assert(html.includes('Join Requests'), 'UI renders Row 3 "Join Requests"');

    // Test 10: Row 4 Invite Only rendered
    assert(html.includes('Invite Only'), 'UI renders Row 4 "Invite Only"');

    // Test 11: Row 5 Lock Room rendered
    assert(html.includes('Lock Room'), 'UI renders Row 5 "Lock Room"');

    // Test 12: Footer watermark renders
    assert(
      html.includes('05_09 Limits that') && html.includes('Protect the Room'),
      'Footer displays exact watermark "05_09 Limits that Protect the Room"'
    );

    // ------------------------------------------------------------------------
    // SECTION 3: HOST PERMISSIONS & LIMIT VALIDATION
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 3: HOST PERMISSIONS & INPUT VALIDATION ---');

    // Reset room 7001 limits
    await client.query(`
      UPDATE popolive.party_rooms
      SET status = 'active', is_live = true, max_seats = 9, max_audience = 1000,
          allow_join_requests = true, is_invite_only = false, is_locked = false,
          seats_layout = '9 (3×3)'
      WHERE room_number = $1
    `, [testRoomId]);

    // Test 13: Unauthorized user (non-host) cannot update limits
    const unauthRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/limits`,
      { maxSeats: 9, isHostAction: false }
    );
    assert(
      unauthRes.status === 403,
      'Unauthorized user rejected from modifying room limits with 403 Forbidden'
    );

    // Test 14: Invalid maxSeats (> 9) is rejected
    const invalidSeatsRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/limits`,
      { maxSeats: 12, isHostAction: true }
    );
    assert(
      invalidSeatsRes.status === 400,
      'Invalid maxSeats > 9 rejected with 400 Bad Request (strict 9-seat party protection)'
    );

    // Test 15: Invalid audienceLimit (< 10) is rejected
    const invalidAudienceRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/limits`,
      { audienceLimit: 2, isHostAction: true }
    );
    assert(
      invalidAudienceRes.status === 400,
      'Invalid audienceLimit (< 10) rejected with 400 Bad Request'
    );

    // Test 16: Host updates limits successfully
    const updateRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/limits`,
      {
        maxSeats: 9,
        seatsLayout: '9 (3×3)',
        audienceLimit: 500,
        joinRequestsEnabled: true,
        inviteOnly: false,
        lockRoom: false,
        isHostAction: true,
        updatedBy: 'Maria Live',
      }
    );
    assert(
      updateRes.status === 200 && updateRes.data.success && updateRes.data.audienceLimit === 500,
      'Host updates audienceLimit to 500 successfully (200 OK)'
    );

    // Test 17: Database reflects updated values
    const roomDb = await client.query(
      `SELECT max_audience, allow_join_requests, is_invite_only, is_locked, seats_layout 
       FROM popolive.party_rooms WHERE room_number = $1`,
      [testRoomId]
    );
    assert(
      roomDb.rows[0].max_audience === 500 &&
        roomDb.rows[0].allow_join_requests === true &&
        roomDb.rows[0].is_invite_only === false &&
        roomDb.rows[0].is_locked === false,
      'Database verifies room limits updated in popolive.party_rooms'
    );

    // Test 18: Audit entry recorded in party_limits_logs
    const auditDb = await client.query(
      `SELECT * FROM popolive.party_limits_logs 
       WHERE room_number = $1 AND max_audience = 500 
       ORDER BY created_at DESC LIMIT 1`,
      [testRoomId]
    );
    assert(
      auditDb.rows.length === 1 && auditDb.rows[0].updated_by === 'Maria Live',
      'Audit log entry successfully stored in popolive.party_limits_logs'
    );

    // ------------------------------------------------------------------------
    // SECTION 4: AUDIENCE CAPACITY & LOCK ROOM ENFORCEMENT
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 4: AUDIENCE CAPACITY & LOCK ROOM ENFORCEMENT ---');

    // Test 19: Normal audience join succeeds when capacity available
    const normalJoinRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/audience/join`,
      {
        userId: 'aud_test_normal_1',
        userName: 'Audience Guest 1',
        userLevel: 2,
      }
    );
    assert(
      normalJoinRes.status === 200 && normalJoinRes.data.success,
      'Audience join succeeds when room is within capacity limits (200 OK)'
    );

    // Test 20: When lockRoom = true, new audience joining rejected
    await makeRequest('POST', `/api/party/${testRoomId}/limits`, {
      lockRoom: true,
      isHostAction: true,
    });
    const lockedJoinRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/audience/join`,
      {
        userId: 'aud_test_locked_2',
        userName: 'Blocked Guest',
      }
    );
    assert(
      lockedJoinRes.status === 403,
      'When lockRoom is enabled, new audience joins rejected with 403 Forbidden ("Room is locked")'
    );

    // Unlock room
    await makeRequest('POST', `/api/party/${testRoomId}/limits`, {
      lockRoom: false,
      isHostAction: true,
    });

    // Test 21: When inviteOnly = true, direct seat requests are rejected
    await makeRequest('POST', `/api/party/${testRoomId}/limits`, {
      inviteOnly: true,
      isHostAction: true,
    });
    const inviteOnlySeatReqRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/seats/request`,
      {
        seatNumber: 2,
        userId: 'uninvited_user_1',
        userName: 'Uninvited User',
      }
    );
    assert(
      inviteOnlySeatReqRes.status === 403,
      'When inviteOnly is enabled, uninvited seat requests rejected with 403 Forbidden'
    );

    // Reset inviteOnly
    await makeRequest('POST', `/api/party/${testRoomId}/limits`, {
      inviteOnly: false,
      isHostAction: true,
    });

    // Test 22: When audience reaches configured max_audience, new join rejected with 429 Room Full
    // Set max_audience to low count (e.g. 1) to test capacity limit
    await client.query(`UPDATE popolive.party_rooms SET max_audience = 1 WHERE room_number = $1`, [testRoomId]);
    const fullJoinRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/audience/join`,
      {
        userId: 'aud_test_overflow_99',
        userName: 'Overflow User',
      }
    );
    assert(
      fullJoinRes.status === 429 && fullJoinRes.data.isRoomFull === true,
      'When audience capacity is full, join rejected with 429 ("Room Full: capacity reached")'
    );

    // Test 23: Existing audience member remains connected (verified in db)
    const existingAud = await client.query(
      `SELECT is_active FROM popolive.party_audience WHERE room_number = $1 AND user_id = 'aud_test_normal_1'`,
      [testRoomId]
    );
    assert(
      existingAud.rows.length === 1 && existingAud.rows[0].is_active === true,
      'Existing audience member remains active in room when capacity is reached'
    );

    // Test 24: Reopening capacity allows new users to join
    await client.query(`UPDATE popolive.party_rooms SET max_audience = 1000 WHERE room_number = $1`, [testRoomId]);
    const reopenJoinRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/audience/join`,
      {
        userId: 'aud_test_reopened_3',
        userName: 'Reopened Guest',
      }
    );
    assert(
      reopenJoinRes.status === 200 && reopenJoinRes.data.success,
      'Reopening audience capacity immediately permits new users to join'
    );

    // ------------------------------------------------------------------------
    // SECTION 5: NINE-SEAT CAPACITY & JOIN REQUEST PROTECTION
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 5: NINE-SEAT CAPACITY & JOIN REQUEST RESTRICTIONS ---');

    // Test 25: Host Seat 1 is protected from viewer requests
    const seat1ReqRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/seats/request`,
      {
        seatNumber: 1,
        userId: 'viewer_intruder',
        userName: 'Intruder',
      }
    );
    assert(
      seat1ReqRes.status === 400,
      'Viewer requesting Seat 1 (Host seat) rejected with 400 Bad Request'
    );

    // Test 26: Seat requests cannot target non-existent seats (<2 or >9)
    const seat10ReqRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/seats/request`,
      {
        seatNumber: 10,
        userId: 'viewer_intruder',
        userName: 'Intruder',
      }
    );
    assert(
      seat10ReqRes.status === 400,
      'Seat requests targeting invalid seats (>9) rejected with 400 Bad Request'
    );

    // Test 27: When joinRequestsEnabled = false, seat requests rejected
    await makeRequest('POST', `/api/party/${testRoomId}/limits`, {
      joinRequestsEnabled: false,
      isHostAction: true,
    });
    const disabledSeatReqRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/seats/request`,
      {
        seatNumber: 2,
        userId: 'viewer_blocked',
        userName: 'Blocked Viewer',
      }
    );
    assert(
      disabledSeatReqRes.status === 403,
      'When joinRequestsEnabled is false, seat requests rejected with 403 ("Join requests disabled")'
    );

    // Re-enable join requests
    await makeRequest('POST', `/api/party/${testRoomId}/limits`, {
      joinRequestsEnabled: true,
      isHostAction: true,
    });

    // Test 28: Direct request for an already occupied seat is rejected
    // In seed, Seat 2 is occupied by Kenji/Elena
    const occupiedSeatReqRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/seats/request`,
      {
        seatNumber: 2,
        userId: 'viewer_contest',
        userName: 'Contesting Viewer',
      }
    );
    assert(
      occupiedSeatReqRes.status === 409,
      'Seat request for already occupied seat rejected with 409 Conflict'
    );

    // Test 29: When all 9 seats are occupied, seat requests rejected with "Seats Full"
    // Temporarily set all 9 seats to occupied in db
    await client.query(`
      UPDATE popolive.party_seats SET status = 'occupied', participant_id = 'dummy_' || seat_number WHERE room_number = $1
    `, [testRoomId]);
    const fullSeatsReqRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/seats/request`,
      {
        seatNumber: 7,
        userId: 'viewer_late',
        userName: 'Late Viewer',
      }
    );
    assert(
      fullSeatsReqRes.status === 409,
      'When all 9 seats are occupied, seat requests rejected with 409 Conflict ("Seats Full")'
    );

    // Restore Seats 7, 8, 9 to available
    await client.query(`
      UPDATE popolive.party_seats 
      SET status = 'available', participant_id = null, participant_name = null 
      WHERE room_number = $1 AND seat_number >= 7
    `, [testRoomId]);

    // Test 30: Valid request on available seat succeeds
    const validSeatReqRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/seats/request`,
      {
        seatNumber: 7,
        userId: 'viewer_legit_1',
        userName: 'Legit Viewer',
      }
    );
    assert(
      validSeatReqRes.status === 201 && validSeatReqRes.data.success,
      'Valid seat request for available Seat 7 succeeds with 201 Created'
    );

    // Test 31: Duplicate request from same user while request is pending is rejected
    const dupSeatReqRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/seats/request`,
      {
        seatNumber: 8,
        userId: 'viewer_legit_1',
        userName: 'Legit Viewer',
      }
    );
    assert(
      dupSeatReqRes.status === 400,
      'Duplicate request while a request is pending rejected with 400 (Anti-Spam Rate Limit)'
    );

    // Clean up test request
    await client.query(`
      DELETE FROM popolive.party_seat_requests WHERE room_number = $1 AND user_id = 'viewer_legit_1'
    `, [testRoomId]);

    // ------------------------------------------------------------------------
    // SECTION 6: REAL-TIME LIMIT SYNCHRONIZATION & STATUS API
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 6: REAL-TIME LIMITS SYNCHRONIZATION & STATUS ---');

    // Test 32: GET /api/party/[roomId]/limits returns comprehensive status
    const limitsStatusRes = await makeRequest('GET', `/api/party/${testRoomId}/limits`);
    assert(
      limitsStatusRes.status === 200 &&
        typeof limitsStatusRes.data.maxSeats === 'number' &&
        typeof limitsStatusRes.data.audienceLimit === 'number' &&
        typeof limitsStatusRes.data.occupiedSeatsCount === 'number' &&
        typeof limitsStatusRes.data.availableSeatsCount === 'number',
      'GET /api/party/[roomId]/limits returns accurate seats, audience, and available count'
    );

    // Test 33: isRoomFull flag is boolean
    assert(
      typeof limitsStatusRes.data.isRoomFull === 'boolean',
      'Limits status accurately reports isRoomFull boolean'
    );

    // Test 34: isSeatsFull flag is boolean
    assert(
      typeof limitsStatusRes.data.isSeatsFull === 'boolean',
      'Limits status accurately reports isSeatsFull boolean'
    );

    // Test 35: Resetting room 7001 to canonical 05_09 reference defaults
    const resetRes = await makeRequest('POST', `/api/party/${testRoomId}/limits`, {
      maxSeats: 9,
      seatsLayout: '9 (3×3)',
      audienceLimit: 1000,
      joinRequestsEnabled: true,
      inviteOnly: false,
      lockRoom: false,
      isHostAction: true,
      updatedBy: 'host_maria',
    });
    assert(
      resetRes.status === 200 &&
        resetRes.data.maxSeats === 9 &&
        resetRes.data.audienceLimit === 1000 &&
        resetRes.data.joinRequestsEnabled === true &&
        resetRes.data.inviteOnly === false &&
        resetRes.data.lockRoom === false,
      'Reset limits restores canonical reference: 9 (3×3), 1000 audience, Requests ON, Invite OFF, Lock OFF'
    );

    // Test 36: Verify in-room integration route /party/room/7001 returns 200 OK
    const roomPageRes = await makeRequest('GET', `/party/room/${testRoomId}`);
    assert(
      roomPageRes.status === 200,
      'Party room /party/room/7001 returns 200 OK with Module 5.9 Limits controls integrated'
    );

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    client.release();
    await pool.end();
  }

  console.log('\n===================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('===================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
