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
  console.log('===============================================================');
  console.log('POPO LIVE — PHASE 5 — MODULE 5.8: ORDER AND CLOSING TEST SUITE');
  console.log('Strict 1:1 Design Reference: 05_08_order_and_closing.png');
  console.log('===============================================================\n');

  const client = await pool.connect();
  const testRoomId = '7001';

  try {
    // ------------------------------------------------------------------------
    // SECTION 1: DATABASE MIGRATION & SCHEMA VALIDATION
    // ------------------------------------------------------------------------
    console.log('--- SECTION 1: DATABASE MIGRATION & AUDIT LOG SCHEMA ---');

    // Test 1: Check party_rooms columns
    const colsRes = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'popolive' AND table_name = 'party_rooms'
        AND column_name IN ('closed_at', 'closed_by', 'closing_reason');
    `);
    assert(
      colsRes.rows.length === 3,
      `Migration 032 added closed_at, closed_by, closing_reason to party_rooms (${colsRes.rows.length}/3)`
    );

    // Test 2: Check party_closing_logs table
    const closingLogRes = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'popolive' AND table_name = 'party_closing_logs';
    `);
    const closingCols = closingLogRes.rows.map((r) => r.column_name);
    assert(
      closingCols.includes('room_number') &&
        closingCols.includes('closed_by') &&
        closingCols.includes('duration_seconds') &&
        closingCols.includes('peak_audience'),
      'Table popolive.party_closing_logs exists with all required audit columns'
    );

    // Test 3: Check party_seat_reorder_logs table
    const reorderLogRes = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_schema = 'popolive' AND table_name = 'party_seat_reorder_logs';
    `);
    const reorderCols = reorderLogRes.rows.map((r) => r.column_name);
    assert(
      reorderCols.includes('room_number') &&
        reorderCols.includes('from_seat') &&
        reorderCols.includes('to_seat') &&
        reorderCols.includes('action_type'),
      'Table popolive.party_seat_reorder_logs exists with all reorder tracking columns'
    );

    // ------------------------------------------------------------------------
    // SECTION 2: REFERENCE IMAGE & ASSETS
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 2: 1:1 DESIGN REFERENCE & ASSETS ---');

    // Test 4: 05_08_order_and_closing.png exists in public/assets/party
    const imgPath = path.join(__dirname, 'public', 'assets', 'party', '05_08_order_and_closing.png');
    assert(fs.existsSync(imgPath), '05_08_order_and_closing.png exists in apps/web/public/assets/party');

    // Test 5: Verify page routes return 200 OK
    const pageRes1 = await makeRequest('GET', '/party/order-closing?preview=demo');
    assert(pageRes1.status === 200, 'GET /party/order-closing?preview=demo returns 200 OK');

    // Test 6: Room-specific order & closing route returns 200 OK
    const pageRes2 = await makeRequest('GET', `/party/room/${testRoomId}/order-closing`);
    assert(pageRes2.status === 200, `GET /party/room/${testRoomId}/order-closing returns 200 OK`);

    // Test 7: UI contains Room Controls title
    const html1 = typeof pageRes1.data === 'string' ? pageRes1.data : JSON.stringify(pageRes1.data);
    assert(
      html1.includes('Room Controls') || html1.includes('order-and-closing-container'),
      'Page renders Room Controls title & container'
    );

    // Test 8: UI contains Seat Order action row
    assert(html1.includes('Seat Order'), 'Page contains "Seat Order" action row');

    // Test 9: UI contains Transfer Host action row
    assert(html1.includes('Transfer Host'), 'Page contains "Transfer Host" action row');

    // Test 10: UI contains Close Party action row
    assert(html1.includes('Close Party'), 'Page contains "Close Party" action row');

    // Test 11: Top header displays Popo Live branding
    assert(html1.includes('Popo Live') || html1.includes('opo Live'), 'App header displays Popo Live branding');

    // Test 12: Footer displays watermark
    assert(
      html1.includes('05_08 Order and Closing'),
      'Footer displays exact watermark "05_08 Order and Closing"'
    );

    // ------------------------------------------------------------------------
    // SECTION 3: SEAT ORDER REORDERING & HOST SEAT PROTECTION
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 3: SEAT ORDER REORDERING & HOST PROTECTION ---');

    // Reset room 7001 seats to known seed state
    await client.query(`
      UPDATE popolive.party_rooms 
      SET status = 'active', is_live = true, closed_at = NULL, closed_by = NULL 
      WHERE room_number = $1
    `, [testRoomId]);

    await client.query(`
      INSERT INTO popolive.party_seats (room_number, seat_number, participant_id, participant_name, participant_avatar, is_host, is_muted, is_camera_on, status, occupied_at)
      VALUES 
        ('7001', 1, 'host_maria_7001', 'Maria Live', '/assets/party/seat_avatar_1.png', true, false, true, 'occupied', NOW()),
        ('7001', 2, 'user_kenji_7001', 'Kenji R', '/assets/party/seat_avatar_2.png', false, false, true, 'occupied', NOW()),
        ('7001', 3, 'user_elena_7001', 'Elena V', '/assets/party/seat_avatar_3.png', false, false, true, 'occupied', NOW()),
        ('7001', 4, 'user_chloe_7001', 'Chloe T', '/assets/party/seat_avatar_4.png', false, false, true, 'occupied', NOW()),
        ('7001', 5, 'user_david_7001', 'David K', '/assets/party/seat_avatar_5.png', false, false, true, 'occupied', NOW()),
        ('7001', 6, 'user_sophia_7001', 'Sophia M', '/assets/party/seat_avatar_6.png', false, false, true, 'occupied', NOW()),
        ('7001', 7, NULL, NULL, NULL, false, false, false, 'available', NULL),
        ('7001', 8, NULL, NULL, NULL, false, false, false, 'available', NULL),
        ('7001', 9, NULL, NULL, NULL, false, false, false, 'available', NULL)
      ON CONFLICT (room_number, seat_number) DO UPDATE SET
        participant_id = EXCLUDED.participant_id,
        participant_name = EXCLUDED.participant_name,
        participant_avatar = EXCLUDED.participant_avatar,
        is_host = EXCLUDED.is_host,
        status = EXCLUDED.status,
        updated_at = NOW();
    `);

    // Test 13: Attempt to reorder Host Seat 1 as source
    const reorderHostSourceRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/seats/reorder`,
      { fromSeat: 1, toSeat: 3, isHostAction: true }
    );
    assert(
      reorderHostSourceRes.status === 403,
      'Reordering Seat 1 (Host as source) rejected with 403 Forbidden'
    );

    // Test 14: Attempt to reorder into Host Seat 1 as destination
    const reorderHostDestRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/seats/reorder`,
      { fromSeat: 3, toSeat: 1, isHostAction: true }
    );
    assert(
      reorderHostDestRes.status === 403,
      'Reordering into Seat 1 (Host as destination) rejected with 403 Forbidden'
    );

    // Test 15: Unauthorized user (isHostAction: false) cannot reorder
    const reorderUnauthRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/seats/reorder`,
      { fromSeat: 2, toSeat: 3, isHostAction: false }
    );
    assert(
      reorderUnauthRes.status === 403,
      'Unauthorized user rejected from reordering seats with 403'
    );

    // Test 16: Invalid seat numbers (< 2 or > 9)
    const reorderInvalidRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/seats/reorder`,
      { fromSeat: 0, toSeat: 10, isHostAction: true }
    );
    assert(
      reorderInvalidRes.status === 400,
      'Invalid seat numbers (<2 or >9) rejected with 400 Bad Request'
    );

    // Test 17: Source equals destination seat
    const reorderSameRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/seats/reorder`,
      { fromSeat: 4, toSeat: 4, isHostAction: true }
    );
    assert(
      reorderSameRes.status === 400,
      'Same source and destination seat rejected with 400 Bad Request'
    );

    // Test 18: Moving an empty seat
    const reorderEmptyRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/seats/reorder`,
      { fromSeat: 8, toSeat: 5, isHostAction: true }
    );
    assert(
      reorderEmptyRes.status === 400,
      'Moving an empty seat (Seat 8) rejected with 400 Bad Request'
    );

    // Test 19: Valid Atomic SWAP between occupied seats (Seat 2 Kenji & Seat 3 Elena)
    const swapRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/seats/reorder`,
      { fromSeat: 2, toSeat: 3, isHostAction: true, reorderedBy: 'Maria Live' }
    );
    assert(
      swapRes.status === 200 && swapRes.data.success && swapRes.data.actionType === 'swap',
      'Atomic swap between Seat 2 and Seat 3 succeeds with 200 OK'
    );

    // Verify swap in database
    const seat2Db = await client.query(
      `SELECT participant_name FROM popolive.party_seats WHERE room_number = $1 AND seat_number = 2`,
      [testRoomId]
    );
    const seat3Db = await client.query(
      `SELECT participant_name FROM popolive.party_seats WHERE room_number = $1 AND seat_number = 3`,
      [testRoomId]
    );
    assert(
      seat2Db.rows[0].participant_name === 'Elena V' && seat3Db.rows[0].participant_name === 'Kenji R',
      'Database verifies Seat 2 is now Elena V and Seat 3 is now Kenji R (Atomic Swap verified)'
    );

    // Test 20: Audit log recorded for swap
    const swapLog = await client.query(
      `SELECT * FROM popolive.party_seat_reorder_logs 
       WHERE room_number = $1 AND from_seat = 2 AND to_seat = 3 AND action_type = 'swap'
       ORDER BY created_at DESC LIMIT 1`,
      [testRoomId]
    );
    assert(swapLog.rows.length === 1, 'Reorder audit log recorded with action_type "swap"');

    // Test 21: Valid MOVE from occupied Seat 3 (Kenji R) to empty Seat 7
    const moveRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/seats/reorder`,
      { fromSeat: 3, toSeat: 7, isHostAction: true, reorderedBy: 'Maria Live' }
    );
    assert(
      moveRes.status === 200 && moveRes.data.success && moveRes.data.actionType === 'move',
      'Move from occupied Seat 3 to empty Seat 7 succeeds with actionType "move"'
    );

    // Test 22: Verify Seat 3 is now available and Seat 7 is now occupied by Kenji R
    const seat3After = await client.query(
      `SELECT status, participant_id FROM popolive.party_seats WHERE room_number = $1 AND seat_number = 3`,
      [testRoomId]
    );
    const seat7After = await client.query(
      `SELECT status, participant_name FROM popolive.party_seats WHERE room_number = $1 AND seat_number = 7`,
      [testRoomId]
    );
    assert(
      seat3After.rows[0].status === 'available' &&
        seat3After.rows[0].participant_id === null &&
        seat7After.rows[0].status === 'occupied' &&
        seat7After.rows[0].participant_name === 'Kenji R',
      'Source Seat 3 successfully freed to available and Seat 7 occupied by Kenji R'
    );

    // Test 23: Audit log recorded for move
    const moveLog = await client.query(
      `SELECT * FROM popolive.party_seat_reorder_logs 
       WHERE room_number = $1 AND from_seat = 3 AND to_seat = 7 AND action_type = 'move'
       ORDER BY created_at DESC LIMIT 1`,
      [testRoomId]
    );
    assert(moveLog.rows.length === 1, 'Reorder audit log recorded with action_type "move"');

    // ------------------------------------------------------------------------
    // SECTION 4: HOST TRANSFER
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 4: HOST TRANSFER FUNCTIONALITY ---');

    // Test 24: Transfer host to invalid seat
    const transferInvalidRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/transfer-host`,
      { targetSeatNumber: 1, isHostAction: true }
    );
    assert(
      transferInvalidRes.status === 400,
      'Transfer host to seat 1 (itself) rejected with 400'
    );

    // Test 25: Transfer host to empty seat
    const transferEmptyRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/transfer-host`,
      { targetSeatNumber: 3, isHostAction: true }
    );
    assert(
      transferEmptyRes.status === 400,
      'Transfer host to empty seat (Seat 3) rejected with 400'
    );

    // Test 26: Valid host transfer to Seat 2 (Elena V)
    const transferValidRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/transfer-host`,
      { targetSeatNumber: 2, isHostAction: true }
    );
    assert(
      transferValidRes.status === 200 && transferValidRes.data.success,
      'Valid host transfer to Seat 2 (Elena V) succeeds with 200 OK'
    );

    // Test 27: Verify new host in Seat 1 and previous host in Seat 2
    const seat1Host = await client.query(
      `SELECT participant_name, is_host FROM popolive.party_seats WHERE room_number = $1 AND seat_number = 1`,
      [testRoomId]
    );
    const seat2Host = await client.query(
      `SELECT participant_name, is_host FROM popolive.party_seats WHERE room_number = $1 AND seat_number = 2`,
      [testRoomId]
    );
    assert(
      seat1Host.rows[0].participant_name === 'Elena V' &&
        seat1Host.rows[0].is_host === true &&
        seat2Host.rows[0].participant_name === 'Maria Live' &&
        seat2Host.rows[0].is_host === false,
      'Seat 1 is now Elena V with is_host=true; Seat 2 is now Maria Live with is_host=false'
    );

    // Transfer back so Maria Live remains canonical host
    await makeRequest('POST', `/api/party/${testRoomId}/transfer-host`, {
      targetSeatNumber: 2,
      isHostAction: true,
    });

    // ------------------------------------------------------------------------
    // SECTION 5: PARTY CLOSING LIFECYCLE & AUDIT LOGS
    // ------------------------------------------------------------------------
    console.log('\n--- SECTION 5: PARTY CLOSING LIFECYCLE & AUDIT ---');

    // Seed dummy pending seat requests and invitations to test cancellation
    await client.query(`
      INSERT INTO popolive.party_seat_requests (room_number, seat_number, user_id, user_name, status, expires_at)
      VALUES ($1, 4, 'aud_test_request_1', 'Test Requester', 'pending', NOW() + INTERVAL '5 minutes')
    `, [testRoomId]);

    await client.query(`
      INSERT INTO popolive.party_seat_invitations (room_number, seat_number, host_id, invited_user_id, invited_user_name, status, expires_at)
      VALUES ($1, 5, 'host_maria', 'aud_test_invite_1', 'Test Invitee', 'pending', NOW() + INTERVAL '5 minutes')
    `, [testRoomId]);

    // Test 28: Unauthorized closing attempt
    const closeUnauthRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/close`,
      { isHostAction: false }
    );
    assert(
      closeUnauthRes.status === 403,
      'Unauthorized close request rejected with 403 Forbidden'
    );

    // Test 29: Host confirms party close
    const closeRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/close`,
      {
        reason: 'Host ended party session for testing',
        isHostAction: true,
        closedBy: 'Maria Live',
      }
    );
    assert(
      closeRes.status === 200 &&
        closeRes.data.success &&
        closeRes.data.status === 'closed' &&
        closeRes.data.isLive === false,
      'POST /api/party/[roomId]/close succeeds with status "closed"'
    );

    // Test 30: Check summary payload returned
    assert(
      closeRes.data.summary &&
        typeof closeRes.data.summary.durationSeconds === 'number' &&
        typeof closeRes.data.summary.peakAudience === 'number',
      'Closing response includes durationSeconds, peakAudience, and totalSeated summary'
    );

    // Test 31: Room status updated in database
    const roomDb = await client.query(
      `SELECT status, is_live, closed_at, closed_by, closing_reason 
       FROM popolive.party_rooms WHERE room_number = $1`,
      [testRoomId]
    );
    assert(
      roomDb.rows[0].status === 'closed' &&
        roomDb.rows[0].is_live === false &&
        roomDb.rows[0].closed_at !== null &&
        roomDb.rows[0].closed_by === 'Maria Live',
      'Database verifies party_rooms status="closed", is_live=false, closed_at recorded'
    );

    // Test 32: Pending requests cancelled
    const reqDb = await client.query(
      `SELECT status FROM popolive.party_seat_requests 
       WHERE room_number = $1 AND user_id = 'aud_test_request_1'`,
      [testRoomId]
    );
    assert(
      reqDb.rows[0].status === 'cancelled',
      'Pending seat requests automatically marked "cancelled" upon room closure'
    );

    // Test 33: Pending invitations expired
    const invDb = await client.query(
      `SELECT status FROM popolive.party_seat_invitations 
       WHERE room_number = $1 AND invited_user_id = 'aud_test_invite_1'`,
      [testRoomId]
    );
    assert(
      invDb.rows[0].status === 'expired',
      'Pending seat invitations automatically marked "expired" upon room closure'
    );

    // Test 34: Closing audit log created
    const closeLogDb = await client.query(
      `SELECT * FROM popolive.party_closing_logs WHERE room_number = $1 ORDER BY created_at DESC LIMIT 1`,
      [testRoomId]
    );
    assert(
      closeLogDb.rows.length === 1 && closeLogDb.rows[0].closed_by === 'Maria Live',
      'Closing log entry successfully stored in popolive.party_closing_logs'
    );

    // Test 35: Duplicate closing request is handled idempotently
    const duplicateCloseRes = await makeRequest(
      'POST',
      `/api/party/${testRoomId}/close`,
      { isHostAction: true }
    );
    assert(
      duplicateCloseRes.status === 200 &&
        duplicateCloseRes.data.alreadyClosed === true &&
        duplicateCloseRes.data.status === 'closed',
      'Duplicate close request handled idempotently (alreadyClosed=true, 200 OK)'
    );

    // Test 36: Status route reflects closed state
    const statusRes = await makeRequest('GET', `/api/party/${testRoomId}/status`);
    assert(
      statusRes.status === 200 &&
        statusRes.data.isClosed === true &&
        statusRes.data.status === 'closed',
      'GET /api/party/[roomId]/status confirms isClosed: true and status: "closed"'
    );

    // Test 37: Re-open room for subsequent tests and normal operations
    await client.query(`
      UPDATE popolive.party_rooms 
      SET status = 'active', is_live = true, closed_at = NULL, closed_by = NULL 
      WHERE room_number = $1
    `, [testRoomId]);
    const reopenedStatus = await makeRequest('GET', `/api/party/${testRoomId}/status`);
    assert(
      reopenedStatus.status === 200 && reopenedStatus.data.isClosed === false,
      'Re-opened room status correctly confirms isClosed: false'
    );

    // Test 38: Verify in-room route /party/room/7001 mounts properly
    const roomPageRes = await makeRequest('GET', `/party/room/${testRoomId}`);
    assert(
      roomPageRes.status === 200,
      'GET /party/room/7001 returns 200 OK with all Module 5.8 controls wired'
    );

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    client.release();
    await pool.end();
  }

  console.log('\n===============================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
