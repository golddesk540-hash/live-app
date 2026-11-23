/**
 * ============================================================================
 * POPO LIVE — PHASE B4 PROMPT 4 OF 4: LIVE ROOM CHAT & MESSAGE PERSISTENCE
 * Master Plan Reference: POPO-LIVE-BACKEND-REALTIME-PLAN.pdf (Phase B4, page 4)
 *
 * Automated verification of all 15 live chat requirements:
 * 1. Valid authenticated user sends chat message.
 * 2. Message is persisted to PostgreSQL (popolive.live_room_chat_messages).
 * 3. Unauthenticated send attempt is rejected (HTTP 401 UNAUTHORIZED).
 * 4. Non-existent room is rejected (HTTP 404 ROOM_NOT_FOUND).
 * 5. Ended room rejects new messages (HTTP 400 ROOM_ENDED).
 * 6. Sender identity is strictly server-derived from authenticated session.
 * 7. Empty message text is rejected (HTTP 400 EMPTY_MESSAGE).
 * 8. Message exceeding 500 characters is rejected (HTTP 400 MESSAGE_TOO_LONG).
 * 9. Fetch chat history returns messages in chronological order (created_at ASC).
 * 10. Chat history includes sender details (nickname, avatar, role, levels).
 * 11. Cursor pagination with ?after returns only messages newer than timestamp.
 * 12. Empty chat room returns strictly empty list [] (NO fake fixture messages).
 * 13. Messages survive reload/refresh (persisted in database).
 * 14. Mobile and Web share identical chat records across both endpoint conventions.
 * 15. Ended rooms allow reading past chat history.
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
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
process.env.NEXT_PUBLIC_USE_LIVE_API = 'true';
process.env.USE_LIVE_API = 'true';

const { NextRequest } = require(path.resolve(__dirname, 'apps/web/node_modules/next/server'));
const { Pool } = require(path.resolve(__dirname, 'apps/web/node_modules/pg'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  options: '-c search_path=popolive,public',
});

let testsPassed = 0;
let testsFailed = 0;
const cleanupUserIds = [];
const cleanupRoomIds = [];
const cleanupSessionTokens = [];

function check(condition, desc) {
  if (condition) {
    console.log(`  [PASS] ${desc}`);
    testsPassed++;
  } else {
    console.error(`  [FAIL] ${desc}`);
    testsFailed++;
  }
}

function makeReq(url, method = 'GET', body = null, sessionToken = null) {
  const headers = new Headers();
  if (body) headers.set('content-type', 'application/json');
  if (sessionToken) {
    headers.set('cookie', `poppo_session=${sessionToken}`);
    headers.set('authorization', `Bearer ${sessionToken}`);
  }
  const init = {
    method,
    headers,
  };
  if (body) init.body = JSON.stringify(body);
  return new NextRequest(url, init);
}

async function createTestUser(role = 'user', nickname = 'Chat User') {
  const poppoId = String(Math.floor(1000000 + Math.random() * 9000000));
  const phone = `+923${Math.floor(100000000 + Math.random() * 900000000)}`;
  const email = `chatuser_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@test.com`;

  const { hashPassword } = await import('./apps/web/lib/auth.ts');
  const passwordHash = await hashPassword('TestPassword123!');

  const userRes = await pool.query(
    `INSERT INTO popolive.users (
      poppo_id, phone, email, password_hash, nickname, avatar_url,
      gender, birthdate, is_adult_verified, country, country_code,
      status, role, is_profile_completed, wealth_level, host_level
    ) VALUES (
      $1, $2, $3, $4, $5, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      'female', '1998-05-15', true, 'Pakistan', 'PK',
      'active', $6, true, 4, 3
    ) RETURNING id, poppo_id, nickname`,
    [poppoId, phone, email, passwordHash, nickname, role]
  );

  const user = userRes.rows[0];
  cleanupUserIds.push(user.id);

  // Create session
  const token = `tok_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO popolive.sessions (
      user_id, session_token, expires_at, device_type, browser_name, os_name, location, last_active_at, is_revoked
    ) VALUES ($1, $2, $3, 'mobile', 'Flutter', 'Android', 'Pakistan', CURRENT_TIMESTAMP, false)`,
    [user.id, token, expiresAt]
  );
  cleanupSessionTokens.push(token);

  return { user, token };
}

async function createTestRoom(hostId, isLive = true, status = 'live') {
  const roomNumber = String(Math.floor(1000000 + Math.random() * 9000000));
  const roomRes = await pool.query(
    `INSERT INTO popolive.live_rooms (
      room_number, host_id, title, cover_url, category, country, country_code,
      flag_emoji, is_live, status, viewer_count, peak_viewer_count, started_at
    ) VALUES (
      $1, $2, 'Chat Test Broadcast', '/assets/viewer/sample_cover.png', 'Live Chat', 'Pakistan', 'PK',
      '🇵🇰', $3, $4, 0, 0, CURRENT_TIMESTAMP
    ) RETURNING id, room_number, title, host_id, status, is_live, viewer_count`,
    [roomNumber, hostId, isLive, status]
  );

  const room = roomRes.rows[0];
  cleanupRoomIds.push(room.id);
  return room;
}

async function runB4LiveChatSuite() {
  console.log('======================================================================');
  console.log('POPO LIVE: B4 PROMPT 4 LIVE CHAT & MESSAGE PERSISTENCE VERIFICATION');
  console.log('======================================================================\n');

  // Verify DB connectivity
  const dbCheck = await pool.query('SELECT NOW() as now');
  check(Boolean(dbCheck.rows[0].now), 'Database connected to local PostgreSQL (popolive schema)');

  // Verify migration 064 live_room_chat_messages table exists
  const tableCheck = await pool.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'popolive' AND table_name = 'live_room_chat_messages'`
  );
  check(tableCheck.rows.length === 1, 'Table popolive.live_room_chat_messages verified in PostgreSQL');

  // Import API handlers and chat services
  const { GET: roomChatGet, POST: roomChatPost } = await import('./apps/web/app/api/live/rooms/[roomId]/chat/route.ts');
  const { GET: liveChatMessagesGet } = await import('./apps/web/app/api/live/chat/messages/route.ts');
  const { POST: liveChatSendPost } = await import('./apps/web/app/api/live/chat/send/route.ts');
  const { USE_LIVE_API } = await import('./apps/web/lib/clientFlags.ts');

  check(USE_LIVE_API === true, 'Flag Discipline: USE_LIVE_API is ON');

  // Setup test users and test rooms
  console.log('\n--- Setting Up Test Entities in PostgreSQL ---');
  const host = await createTestUser('host', 'Host Zara');
  const viewer1 = await createTestUser('user', 'Viewer Sana');
  const viewer2 = await createTestUser('user', 'Viewer Bilal');

  const activeRoom = await createTestRoom(host.user.id, true, 'live');
  const endedRoom = await createTestRoom(host.user.id, false, 'ended');

  console.log(`Active Room Created: ${activeRoom.id} (${activeRoom.room_number})`);
  console.log(`Ended Room Created: ${endedRoom.id} (${endedRoom.room_number})`);

  // ============================================================================
  // Test 1: Valid authenticated user sends chat message
  // ============================================================================
  console.log('\n--- 1. Valid Authenticated User Sends Chat Message ---');
  let firstMsgId = null;
  let firstMsgCreatedAt = null;
  {
    const req = makeReq(
      `http://localhost:3000/api/live/rooms/${activeRoom.id}/chat`,
      'POST',
      { content: 'Hello everyone from Lahore! 🎵' },
      viewer1.token
    );
    const res = await roomChatPost(req, { params: { roomId: activeRoom.id } });
    const data = await res.json();

    check(res.status === 201, 'Send message returns HTTP 201 Created');
    check(data.success === true, 'Response contains success: true');
    check(Boolean(data.message?.id), 'Response contains generated message ID');
    check(data.message.senderId === viewer1.user.id, 'Sender ID matches authenticated user ID');
    check(data.message.senderNickname === 'Viewer Sana', 'Sender nickname matches user nickname');
    check(data.message.content === 'Hello everyone from Lahore! 🎵', 'Content matches submitted text');
    check(data.message.senderRole === 'viewer', 'Sender role is correctly identified as viewer');
    check(Boolean(data.message.createdAt), 'Valid createdAt timestamp is returned');

    firstMsgId = data.message.id;
    firstMsgCreatedAt = data.message.createdAt;
  }

  // ============================================================================
  // Test 2: Message is persisted to PostgreSQL (popolive.live_room_chat_messages)
  // ============================================================================
  console.log('\n--- 2. Message is Persisted to PostgreSQL ---');
  {
    const dbRows = await pool.query(
      `SELECT id, room_id, sender_id, sender_nickname, content, sender_role, created_at, is_deleted
       FROM popolive.live_room_chat_messages
       WHERE id = $1`,
      [firstMsgId]
    );

    check(dbRows.rows.length === 1, 'Message row found in popolive.live_room_chat_messages');
    const row = dbRows.rows[0];
    check(row.room_id === activeRoom.id, 'Persisted room_id matches active room UUID');
    check(row.sender_id === viewer1.user.id, 'Persisted sender_id matches viewer UUID');
    check(row.content === 'Hello everyone from Lahore! 🎵', 'Persisted content matches');
    check(row.is_deleted === false, 'Persisted is_deleted is false');
  }

  // ============================================================================
  // Test 3: Unauthenticated send attempt is rejected (HTTP 401 UNAUTHORIZED)
  // ============================================================================
  console.log('\n--- 3. Unauthenticated Send Attempt Rejected (401) ---');
  {
    const unauthReq = makeReq(
      `http://localhost:3000/api/live/rooms/${activeRoom.id}/chat`,
      'POST',
      { content: 'Hacker message without session' }
    );
    const unauthRes = await roomChatPost(unauthReq, { params: { roomId: activeRoom.id } });
    const unauthData = await unauthRes.json();

    check(unauthRes.status === 401, 'Unauthenticated request returns HTTP 401');
    check(unauthData.code === 'UNAUTHORIZED', 'Response contains code: UNAUTHORIZED');
    check(unauthData.success === false, 'success is false');
  }

  // ============================================================================
  // Test 4: Non-existent room is rejected (HTTP 404 ROOM_NOT_FOUND)
  // ============================================================================
  console.log('\n--- 4. Non-Existent Room Rejected (404) ---');
  {
    const fakeRoomId = '00000000-0000-0000-0000-000000000000';
    const fakeReq = makeReq(
      `http://localhost:3000/api/live/rooms/${fakeRoomId}/chat`,
      'POST',
      { content: 'Message for ghost room' },
      viewer1.token
    );
    const fakeRes = await roomChatPost(fakeReq, { params: { roomId: fakeRoomId } });
    const fakeData = await fakeRes.json();

    check(fakeRes.status === 404, 'Non-existent room returns HTTP 404');
    check(fakeData.code === 'ROOM_NOT_FOUND', 'Response code is ROOM_NOT_FOUND');
  }

  // ============================================================================
  // Test 5: Ended room rejects new messages (HTTP 400 ROOM_ENDED)
  // ============================================================================
  console.log('\n--- 5. Ended Room Rejects New Messages (400 ROOM_ENDED) ---');
  {
    const endedReq = makeReq(
      `http://localhost:3000/api/live/rooms/${endedRoom.id}/chat`,
      'POST',
      { content: 'Message to closed stream' },
      viewer1.token
    );
    const endedRes = await roomChatPost(endedReq, { params: { roomId: endedRoom.id } });
    const endedData = await endedRes.json();

    check(endedRes.status === 400, 'Posting to ended room returns HTTP 400');
    check(endedData.code === 'ROOM_ENDED', 'Response code is ROOM_ENDED');

    // Verify no row was inserted into ended room
    const countCheck = await pool.query(
      'SELECT count(*) FROM popolive.live_room_chat_messages WHERE room_id = $1',
      [endedRoom.id]
    );
    check(Number(countCheck.rows[0].count) === 0, 'Zero messages inserted into ended room');
  }

  // ============================================================================
  // Test 6: Sender identity is strictly server-derived from authenticated session
  // ============================================================================
  console.log('\n--- 6. Sender Identity Strictly Server-Derived ---');
  {
    // Attacker sends payload spoofing another senderId or role
    const spoofReq = makeReq(
      `http://localhost:3000/api/live/rooms/${activeRoom.id}/chat`,
      'POST',
      {
        content: 'Spoofed sender attempt',
        senderId: '00000000-0000-0000-0000-999999999999',
        senderNickname: 'Fake Admin',
        senderRole: 'admin',
      },
      viewer2.token
    );
    const spoofRes = await roomChatPost(spoofReq, { params: { roomId: activeRoom.id } });
    const spoofData = await spoofRes.json();

    check(spoofRes.status === 201, 'Request accepted under actual session');
    check(spoofData.message.senderId === viewer2.user.id, 'Sender ID is strictly viewer2 ID (spoofed ID ignored)');
    check(spoofData.message.senderNickname === 'Viewer Bilal', 'Sender nickname is strictly from DB session');
    check(spoofData.message.senderRole === 'viewer', 'Role is strictly viewer (spoofed admin ignored)');
  }

  // ============================================================================
  // Test 7: Empty message text is rejected (HTTP 400 EMPTY_MESSAGE)
  // ============================================================================
  console.log('\n--- 7. Empty Message Rejected (400 EMPTY_MESSAGE) ---');
  {
    const emptyReq = makeReq(
      `http://localhost:3000/api/live/rooms/${activeRoom.id}/chat`,
      'POST',
      { content: '    ' },
      viewer1.token
    );
    const emptyRes = await roomChatPost(emptyReq, { params: { roomId: activeRoom.id } });
    const emptyData = await emptyRes.json();

    check(emptyRes.status === 400, 'Whitespace-only message returns HTTP 400');
    check(emptyData.code === 'EMPTY_MESSAGE', 'Response code is EMPTY_MESSAGE');
  }

  // ============================================================================
  // Test 8: Message exceeding 500 characters is rejected (HTTP 400 MESSAGE_TOO_LONG)
  // ============================================================================
  console.log('\n--- 8. Message Exceeding 500 Characters Rejected ---');
  {
    const longText = 'A'.repeat(501);
    const longReq = makeReq(
      `http://localhost:3000/api/live/rooms/${activeRoom.id}/chat`,
      'POST',
      { content: longText },
      viewer1.token
    );
    const longRes = await roomChatPost(longReq, { params: { roomId: activeRoom.id } });
    const longData = await longRes.json();

    check(longRes.status === 400, '501-character message returns HTTP 400');
    check(longData.code === 'MESSAGE_TOO_LONG', 'Response code is MESSAGE_TOO_LONG');
  }

  // ============================================================================
  // Test 9: Fetch chat history returns messages in chronological order (ASC)
  // ============================================================================
  console.log('\n--- 9. Fetch Chat History Returns Messages in Chronological Order ---');
  let thirdMsgId = null;
  {
    // Post third message from Host
    const hostMsgReq = makeReq(
      `http://localhost:3000/api/live/rooms/${activeRoom.id}/chat`,
      'POST',
      { content: 'Welcome to the live show! ❤️' },
      host.token
    );
    const hostMsgRes = await roomChatPost(hostMsgReq, { params: { roomId: activeRoom.id } });
    const hostMsgData = await hostMsgRes.json();
    thirdMsgId = hostMsgData.message.id;
    check(hostMsgData.message.senderRole === 'host', 'Host message senderRole is correctly identified as host');

    // Fetch history
    const historyReq = makeReq(`http://localhost:3000/api/live/rooms/${activeRoom.id}/chat`, 'GET');
    const historyRes = await roomChatGet(historyReq, { params: { roomId: activeRoom.id } });
    const historyData = await historyRes.json();

    check(historyRes.status === 200, 'GET /chat returns HTTP 200');
    check(historyData.success === true, 'GET /chat returns success: true');
    check(Array.isArray(historyData.messages), 'messages is an array');
    check(historyData.messages.length === 3, 'Exactly 3 messages returned');

    // Verify ordering is chronological ASC
    const t1 = new Date(historyData.messages[0].createdAt).getTime();
    const t2 = new Date(historyData.messages[1].createdAt).getTime();
    const t3 = new Date(historyData.messages[2].createdAt).getTime();
    check(t1 <= t2 && t2 <= t3, 'Messages are strictly sorted by createdAt ASC');
    check(historyData.messages[0].id === firstMsgId, 'Oldest message is first in array');
    check(historyData.messages[2].id === thirdMsgId, 'Newest message is last in array');
  }

  // ============================================================================
  // Test 10: Chat history includes sender details
  // ============================================================================
  console.log('\n--- 10. Chat History Includes Sender Details ---');
  {
    const historyReq = makeReq(`http://localhost:3000/api/live/rooms/${activeRoom.id}/chat`, 'GET');
    const historyRes = await roomChatGet(historyReq, { params: { roomId: activeRoom.id } });
    const historyData = await historyRes.json();

    const m = historyData.messages[0];
    check(Boolean(m.senderNickname), 'Sender nickname is populated');
    check(Boolean(m.senderAvatarUrl), 'Sender avatar is populated');
    check(typeof m.wealthLevel === 'number', 'Sender wealth level is a number');
    check(typeof m.hostLevel === 'number', 'Sender host level is a number');
  }

  // ============================================================================
  // Test 11: Cursor pagination with ?after returns only messages newer than timestamp
  // ============================================================================
  console.log('\n--- 11. Cursor Pagination with ?after ---');
  {
    const afterReq = makeReq(
      `http://localhost:3000/api/live/rooms/${activeRoom.id}/chat?after=${encodeURIComponent(firstMsgCreatedAt)}`,
      'GET'
    );
    const afterRes = await roomChatGet(afterReq, { params: { roomId: activeRoom.id } });
    const afterData = await afterRes.json();

    check(afterRes.status === 200, 'GET with ?after returns HTTP 200');
    check(afterData.messages.length === 2, 'Only the 2 newer messages returned (first excluded)');
    check(!afterData.messages.some((x) => x.id === firstMsgId), 'First message is excluded');
  }

  // ============================================================================
  // Test 12: Empty chat room returns strictly empty list [] (NO fake fixture messages)
  // ============================================================================
  console.log('\n--- 12. Empty Chat Room Returns Strictly Empty List [] ---');
  {
    const cleanRoom = await createTestRoom(host.user.id, true, 'live');
    const cleanReq = makeReq(`http://localhost:3000/api/live/rooms/${cleanRoom.id}/chat`, 'GET');
    const cleanRes = await roomChatGet(cleanReq, { params: { roomId: cleanRoom.id } });
    const cleanData = await cleanRes.json();

    check(cleanRes.status === 200, 'GET /chat on empty room returns HTTP 200');
    check(Array.isArray(cleanData.messages), 'messages is an array');
    check(cleanData.messages.length === 0, 'messages array is strictly EMPTY [] (no mock fixture messages)');
    check(cleanData.totalCount === 0, 'totalCount is 0');
  }

  // ============================================================================
  // Test 13: Messages survive reload/refresh (persisted in database)
  // ============================================================================
  console.log('\n--- 13. Messages Survive Reload / Refresh ---');
  {
    // Query directly from PostgreSQL again
    const directQuery = await pool.query(
      `SELECT count(*) FROM popolive.live_room_chat_messages WHERE room_id = $1`,
      [activeRoom.id]
    );
    check(Number(directQuery.rows[0].count) === 3, 'PostgreSQL maintains all 3 messages across sessions');

    // Repeated GET simulates page refresh
    const refreshReq = makeReq(`http://localhost:3000/api/live/rooms/${activeRoom.id}/chat`, 'GET');
    const refreshRes = await roomChatGet(refreshReq, { params: { roomId: activeRoom.id } });
    const refreshData = await refreshRes.json();
    check(refreshData.messages.length === 3, 'Chat history re-loads identically after page refresh');
  }

  // ============================================================================
  // Test 14: Mobile and Web share identical chat records across both endpoints
  // ============================================================================
  console.log('\n--- 14. Mobile and Web Interoperability ---');
  {
    // Mobile sends message via /api/live/chat/send
    const mobileSendReq = makeReq(
      `http://localhost:3000/api/live/chat/send`,
      'POST',
      { roomId: activeRoom.id, text: 'Message sent from Mobile Flutter client 📱' },
      viewer1.token
    );
    const mobileSendRes = await liveChatSendPost(mobileSendReq);
    const mobileSendData = await mobileSendRes.json();

    check(mobileSendRes.status === 201, 'Mobile route /api/live/chat/send returns HTTP 201');
    check(mobileSendData.success === true, 'Mobile send succeeds');
    const mobileMsgId = mobileSendData.message.id;

    // Web reads via /api/live/rooms/[roomId]/chat
    const webReadReq = makeReq(`http://localhost:3000/api/live/rooms/${activeRoom.id}/chat`, 'GET');
    const webReadRes = await roomChatGet(webReadReq, { params: { roomId: activeRoom.id } });
    const webReadData = await webReadRes.json();

    const foundMobileMsgOnWeb = webReadData.messages.find((m) => m.id === mobileMsgId);
    check(Boolean(foundMobileMsgOnWeb), 'Message sent from Mobile is instantly visible on Web route');
    check(foundMobileMsgOnWeb?.content.includes('Mobile Flutter client'), 'Message content matches on Web');

    // Web reads via /api/live/chat/messages
    const webAliasReq = makeReq(`http://localhost:3000/api/live/chat/messages?roomId=${activeRoom.id}`, 'GET');
    const webAliasRes = await liveChatMessagesGet(webAliasReq);
    const webAliasData = await webAliasRes.json();

    check(webAliasRes.status === 200, 'GET /api/live/chat/messages returns HTTP 200');
    const foundOnAlias = webAliasData.messages.find((m) => m.id === mobileMsgId);
    check(Boolean(foundOnAlias), 'Message visible on /api/live/chat/messages route');
  }

  // ============================================================================
  // Test 15: Ended rooms allow reading past chat history
  // ============================================================================
  console.log('\n--- 15. Ended Rooms Allow Reading Past Chat History ---');
  {
    // End active room
    await pool.query(
      `UPDATE popolive.live_rooms SET is_live = false, status = 'ended', ended_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [activeRoom.id]
    );

    // Read chat history of ended room
    const endedReadReq = makeReq(`http://localhost:3000/api/live/rooms/${activeRoom.id}/chat`, 'GET');
    const endedReadRes = await roomChatGet(endedReadReq, { params: { roomId: activeRoom.id } });
    const endedReadData = await endedReadRes.json();

    check(endedReadRes.status === 200, 'GET chat history on ended room returns HTTP 200');
    check(endedReadData.success === true, 'Ended room chat history returns success: true');
    check(endedReadData.messages.length === 4, 'All 4 archived messages are retrievable from ended room');

    // Attempting to POST new chat message to now-ended room fails
    const postEndedReq = makeReq(
      `http://localhost:3000/api/live/rooms/${activeRoom.id}/chat`,
      'POST',
      { content: 'Late message after room ended' },
      viewer1.token
    );
    const postEndedRes = await roomChatPost(postEndedReq, { params: { roomId: activeRoom.id } });
    const postEndedData = await postEndedRes.json();

    check(postEndedRes.status === 400, 'POSTing to now-ended room returns HTTP 400');
    check(postEndedData.code === 'ROOM_ENDED', 'Error code is ROOM_ENDED');
  }

  // Clean up fixtures
  console.log('\n--- Cleaning Up Test Fixtures ---');
  if (cleanupRoomIds.length > 0) {
    await pool.query('DELETE FROM popolive.live_room_chat_messages WHERE room_id = ANY($1)', [cleanupRoomIds]);
    await pool.query('DELETE FROM popolive.live_room_messages WHERE room_id = ANY($1::text[])', [cleanupRoomIds.map(String)]);
    await pool.query('DELETE FROM popolive.live_room_viewers WHERE room_id = ANY($1)', [cleanupRoomIds]);
    await pool.query('DELETE FROM popolive.live_rooms WHERE id = ANY($1)', [cleanupRoomIds]);
    console.log(`Cleaned up ${cleanupRoomIds.length} test rooms and their chat messages.`);
  }
  if (cleanupUserIds.length > 0) {
    await pool.query('DELETE FROM popolive.sessions WHERE user_id = ANY($1)', [cleanupUserIds]);
    await pool.query('DELETE FROM popolive.users WHERE id = ANY($1)', [cleanupUserIds]);
    console.log(`Cleaned up ${cleanupUserIds.length} test users.`);
  }

  // ============================================================================
  // Summary
  // ============================================================================
  console.log('\n======================================================================');
  console.log(`B4 PROMPT 4 VERIFICATION COMPLETE: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('======================================================================\n');

  await pool.end();

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runB4LiveChatSuite().catch((err) => {
  console.error('Fatal error during test suite execution:', err);
  pool.end();
  process.exit(1);
});
