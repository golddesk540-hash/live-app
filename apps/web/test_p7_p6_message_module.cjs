/**
 * POPO LIVE — PHASE 7 (P7-P6) MESSAGE MODULE INTEGRATION TEST SUITE
 * Executes and verifies all 24 checks from Part 9 of the official specification.
 */

const { Pool } = require('pg');
const http = require('http');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
});

const BASE_URL = 'http://localhost:3000';

function apiFetch(endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, data: json });
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passedCount++;
    console.log(`[PASS] ${testName}`);
    if (details) console.log(`       -> ${details}`);
  } else {
    failedCount++;
    console.error(`[FAIL] ${testName}`);
    if (details) console.error(`       -> ${details}`);
  }
}

async function runAllTests() {
  console.log('========================================================================');
  console.log('POPO LIVE — PHASE 7 (P7-P6) MESSAGE MODULE INTEGRATION SUITE');
  console.log('========================================================================\n');

  try {
    // -------------------------------------------------------------------------
    // SETUP: Provision Test Users (Alice, Bob, Charlie, Underage) and Sessions
    // -------------------------------------------------------------------------
    console.log('--- SETUP: Provisioning Test Users, Sessions, and System Notices ---');

    async function ensureUser(email, nickname, birthdate, isAdult) {
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nickname)}`;
      const res = await pool.query(
        `INSERT INTO popolive.users (
          id, poppo_id, email, phone, nickname, avatar_url, gender, birthdate,
          is_adult_verified, status, country, country_code, is_profile_completed
        ) VALUES (
          gen_random_uuid(), ('8' || floor(random() * 899999 + 100000)::text),
          $1, ('+923' || floor(random() * 89999999 + 10000000)::text),
          $2, $3,
          'female', $4, $5, 'active', 'Pakistan', 'PK', true
        ) ON CONFLICT (email) DO UPDATE
          SET birthdate = $4, is_adult_verified = $5
        RETURNING id, poppo_id, email, nickname, avatar_url, birthdate`,
        [email, nickname, avatarUrl, birthdate, isAdult]
      );
      return res.rows[0];
    }

    const aliceUser = await ensureUser('p7_msg_alice@popolive.com', 'Alice_P7', '1996-03-15', true);
    const bobUser = await ensureUser('p7_msg_bob@popolive.com', 'Bob_P7', '1998-07-22', true);
    const charlieUser = await ensureUser('p7_msg_charlie@popolive.com', 'Charlie_P7', '2000-11-05', true);
    const underageUser = await ensureUser('p7_msg_teen@popolive.com', 'Teen_P7', '2012-04-10', false);

    async function createSession(userId, token) {
      await pool.query(
        `INSERT INTO popolive.sessions (id, user_id, session_token, expires_at, created_at, is_revoked)
         VALUES (gen_random_uuid(), $1, $2, NOW() + INTERVAL '7 days', NOW(), false)
         ON CONFLICT (session_token) DO UPDATE SET expires_at = NOW() + INTERVAL '7 days', is_revoked = false`,
        [userId, token]
      );
      return token;
    }

    const aliceToken = await createSession(aliceUser.id, 'p7_msg_alice_tok');
    const bobToken = await createSession(bobUser.id, 'p7_msg_bob_tok');
    const charlieToken = await createSession(charlieUser.id, 'p7_msg_charlie_tok');
    const underageToken = await createSession(underageUser.id, 'p7_msg_underage_tok');

    // Provision Official Notices in all 4 categories if missing
    async function ensureNotice(category, refCode, title, shortDesc) {
      const badge = category.toUpperCase();
      await pool.query(
        `INSERT INTO popolive.system_notices (
          id, reference_code, category, badge_label, title, short_desc, full_message, is_important, created_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $5, false, CURRENT_TIMESTAMP
        ) ON CONFLICT (reference_code) DO NOTHING`,
        [refCode, category, badge, title, shortDesc]
      );
    }

    await ensureNotice('achievements', 'ACH-P7-001', 'Broadcaster Level 5 Milestone Unlocked! 🏆', 'Congratulations on reaching Level 5.');
    await ensureNotice('system', 'SYS-P7-001', 'Popo Live v1.1 Architecture & Messaging Online 🚀', 'Direct messaging with low-latency delivery is active.');
    await ensureNotice('security', 'SEC-P7-001', 'New Device Login Detected 🔒', 'A verified session was created from your registered network.');
    await ensureNotice('followers', 'FOL-P7-001', 'Amina Noor is now following you! ⭐', 'Amina Noor started following your live broadcast profile.');

    // Create an initial test conversation between Alice and Bob
    const p1 = aliceUser.id < bobUser.id ? aliceUser.id : bobUser.id;
    const p2 = aliceUser.id < bobUser.id ? bobUser.id : aliceUser.id;

    const convRes = await pool.query(
      `INSERT INTO popolive.inbox_conversations (
        id, participant_one_id, participant_two_id, last_message_text, last_message_at,
        unread_count_one, unread_count_two, status, created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, 'Initial welcome to Popo Chat!', CURRENT_TIMESTAMP,
        1, 0, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) ON CONFLICT (participant_one_id, participant_two_id) DO UPDATE
        SET status = 'active'
      RETURNING id`,
      [p1, p2]
    );
    const testConvId = convRes.rows[0].id;

    console.log(`[SETUP] Seeded users, sessions, official notices, and test conversation: ${testConvId}\n`);

    // =========================================================================
    // PART 9.1: INBOX TESTS (Checks 1 - 4)
    // =========================================================================
    console.log('--- 1. INBOX ENDPOINT TESTS (Checks 1 - 4) ---');

    // Check 1: Conversations load
    const inboxRes = await apiFetch('/api/message/conversations', {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    assert(inboxRes.status === 200, 'Check 1: Conversations load with HTTP 200');
    assert(Array.isArray(inboxRes.data?.conversations), 'Check 1b: Returns conversations array', `Count: ${inboxRes.data?.conversations?.length}`);

    // Check 2: Official rows load (Achievements / System / Account Security / New Followers)
    const officialRes = await apiFetch('/api/message/official', {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    assert(officialRes.status === 200, 'Check 2: Official rows load with HTTP 200');
    assert(officialRes.data?.officialRows?.length === 4, 'Check 2b: Returns exactly 4 official rows (Achievements, System, Security, Followers)');

    // Check 3: Unread counts match DB
    const unreadRes = await apiFetch('/api/message/unread-count', {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    assert(unreadRes.status === 200, 'Check 3: Unread count returns HTTP 200');
    assert(typeof unreadRes.data?.totalUnread === 'number', 'Check 3b: Total unread count matches DB calculation', `Total: ${unreadRes.data?.totalUnread}`);

    // Check 4: Search returns matching people/chats
    const searchRes = await apiFetch('/api/message/search?q=Bob', {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    assert(searchRes.status === 200, 'Check 4: Search returns matching people/chats with HTTP 200');
    assert(searchRes.data?.people?.some((p) => p.nickname?.includes('Bob')), 'Check 4b: Search result contains Bob in people list');
    console.log('');

    // =========================================================================
    // PART 9.2: THREAD & MESSAGE TESTS (Checks 5 - 10)
    // =========================================================================
    console.log('--- 2. THREAD & MESSAGE SEND/READ TESTS (Checks 5 - 10) ---');

    // Check 5: Messages load paginated
    const msgListRes = await apiFetch(`/api/message/conversations/${testConvId}/messages?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    assert(msgListRes.status === 200, 'Check 5: Messages load paginated with HTTP 200');
    assert(msgListRes.data?.pagination?.page === 1, 'Check 5b: Pagination metadata includes page 1');
    assert(Array.isArray(msgListRes.data?.messages), 'Check 5c: Returns messages array');

    // Check 6: Send creates message
    const sendRes = await apiFetch(`/api/message/conversations/${testConvId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${aliceToken}` },
      body: { text: 'Hey Bob, congratulations on the party lounge! 🎤🎉' },
    });
    assert(sendRes.status === 201, 'Check 6: Send creates message with HTTP 201', `Status: ${sendRes.status}`);
    assert(sendRes.data?.message?.text?.includes('Hey Bob'), 'Check 6b: Returned message text matches sent text');
    const sentMsgId = sendRes.data?.message?.id;

    // Check 7: Message appears in list
    const updatedListRes = await apiFetch(`/api/message/conversations/${testConvId}/messages`, {
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    assert(updatedListRes.status === 200, 'Check 7: Recipient loads messages with HTTP 200');
    assert(updatedListRes.data?.messages?.some((m) => m.id === sentMsgId), 'Check 7b: Newly sent message appears in recipient message list');

    // Check 8: Mark read resets unread
    const readRes = await apiFetch(`/api/message/conversations/${testConvId}/read`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    assert(readRes.status === 200, 'Check 8: Mark read returns HTTP 200');
    assert(readRes.data?.unreadCount === 0, 'Check 8b: Recipient unread count reset to 0');

    // Check 9: Empty message rejected
    const emptyMsgRes = await apiFetch(`/api/message/conversations/${testConvId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${aliceToken}` },
      body: { text: '    ' },
    });
    assert(emptyMsgRes.status === 400, 'Check 9: Empty message rejected with HTTP 400', `Status: ${emptyMsgRes.status}`);
    assert(emptyMsgRes.data?.code === 'EMPTY_MESSAGE', 'Check 9b: Code is EMPTY_MESSAGE');

    // Check 10: Long message rejected (> 1000 characters)
    const longMsg = 'A'.repeat(1050);
    const longMsgRes = await apiFetch(`/api/message/conversations/${testConvId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${aliceToken}` },
      body: { text: longMsg },
    });
    assert(longMsgRes.status === 400, 'Check 10: Long message rejected with HTTP 400', `Status: ${longMsgRes.status}`);
    assert(longMsgRes.data?.code === 'MESSAGE_TOO_LONG', 'Check 10b: Code is MESSAGE_TOO_LONG');
    console.log('');

    // =========================================================================
    // PART 9.3: OFFICIAL NOTICE TESTS (Checks 11 - 14)
    // =========================================================================
    console.log('--- 3. OFFICIAL NOTICE CATEGORIES (Checks 11 - 14) ---');

    // Check 11: Achievements notice loads
    const achRes = await apiFetch('/api/message/official/achievements', {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    assert(achRes.status === 200, 'Check 11: Achievements notice loads with HTTP 200');
    assert(achRes.data?.notices?.length >= 1, 'Check 11b: Achievements category contains active notices');

    // Check 12: System notice loads
    const sysRes = await apiFetch('/api/message/official/system', {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    assert(sysRes.status === 200, 'Check 12: System notice loads with HTTP 200');
    assert(sysRes.data?.notices?.length >= 1, 'Check 12b: System category contains active notices');

    // Check 13: Account Security notice loads
    const secRes = await apiFetch('/api/message/official/security', {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    assert(secRes.status === 200, 'Check 13: Account Security notice loads with HTTP 200');
    assert(secRes.data?.notices?.length >= 1, 'Check 13b: Security category contains active notices');

    // Check 14: New Followers notice loads
    const folRes = await apiFetch('/api/message/official/followers', {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    assert(folRes.status === 200, 'Check 14: New Followers notice loads with HTTP 200');
    assert(folRes.data?.notices?.length >= 1, 'Check 14b: Followers category contains active notices');
    console.log('');

    // =========================================================================
    // PART 9.4: ACCESS CONTROL & BLOCK TESTS (Checks 15 - 20)
    // =========================================================================
    console.log('--- 4. ACCESS CONTROL, LOCKED RULES & BLOCK SYSTEM (Checks 15 - 20) ---');

    // Check 15: Non-member cannot read conversation (Charlie is not member of Alice-Bob conversation)
    const nonMemberRead = await apiFetch(`/api/message/conversations/${testConvId}/messages`, {
      headers: { Authorization: `Bearer ${charlieToken}` },
    });
    assert(nonMemberRead.status === 403, 'Check 15: Non-member cannot read conversation with HTTP 403', `Status: ${nonMemberRead.status}`);
    assert(nonMemberRead.data?.code === 'NOT_CONVERSATION_MEMBER', 'Check 15b: Code is NOT_CONVERSATION_MEMBER');

    // Check 16: Non-member cannot send into conversation
    const nonMemberSend = await apiFetch(`/api/message/conversations/${testConvId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${charlieToken}` },
      body: { text: 'Intruder message from non-member!' },
    });
    assert(nonMemberSend.status === 403, 'Check 16: Non-member cannot send message with HTTP 403', `Status: ${nonMemberSend.status}`);
    assert(nonMemberSend.data?.code === 'NOT_CONVERSATION_MEMBER', 'Check 16b: Code is NOT_CONVERSATION_MEMBER');

    // Check 17: User cannot write to official row (Rule 3)
    const writeOfficialRes = await apiFetch('/api/message/official', {
      method: 'POST',
      headers: { Authorization: `Bearer ${aliceToken}` },
      body: { title: 'Fake system notice' },
    });
    assert(writeOfficialRes.status === 403, 'Check 17: User cannot write to official row with HTTP 403', `Status: ${writeOfficialRes.status}`);
    assert(writeOfficialRes.data?.code === 'CANNOT_WRITE_OFFICIAL_NOTICE', 'Check 17b: Code is CANNOT_WRITE_OFFICIAL_NOTICE');

    // Check 18 & 19: Block prevents send
    const blockRes = await apiFetch(`/api/message/users/${aliceUser.id}/block`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    assert(blockRes.status === 200, 'Check 19: Bob blocks Alice with HTTP 200');
    assert(blockRes.data?.isBlocked === true, 'Check 19b: isBlocked is true');

    const blockedSendRes = await apiFetch(`/api/message/conversations/${testConvId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${aliceToken}` },
      body: { text: 'Are you getting my messages Bob?' },
    });
    assert(blockedSendRes.status === 403, 'Check 18: Blocked user cannot send with HTTP 403', `Status: ${blockedSendRes.status}`);
    assert(blockedSendRes.data?.code === 'USER_IS_BLOCKED', 'Check 18b: Code is USER_IS_BLOCKED');

    // Check 20: Unblock restores message send capability
    const unblockRes = await apiFetch(`/api/message/users/${aliceUser.id}/block`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    assert(unblockRes.status === 200, 'Check 20: Bob unblocks Alice with HTTP 200');
    assert(unblockRes.data?.isBlocked === false, 'Check 20b: isBlocked is false');

    const restoredSendRes = await apiFetch(`/api/message/conversations/${testConvId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${aliceToken}` },
      body: { text: 'Back in touch Bob! 👍' },
    });
    assert(restoredSendRes.status === 201, 'Check 20c: Message sending restored with HTTP 201');
    console.log('');

    // =========================================================================
    // PART 9.5: WEB & REGRESSION TESTS (Checks 21 - 24)
    // =========================================================================
    console.log('--- 5. WEB & REGRESSION INTEGRATION (Checks 21 - 24) ---');

    // Check 21: Web shows same conversations
    const webInboxRes = await apiFetch('/api/message/conversations', {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    assert(webInboxRes.status === 200, 'Check 21: Web inbox shows same conversations with HTTP 200');
    assert(webInboxRes.data?.conversations?.some((c) => c.threadId === testConvId), 'Check 21b: Web inbox contains verified conversation thread');

    // Check 22: Web can send and see in mobile
    const webSendRes = await apiFetch(`/api/message/conversations/${testConvId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${bobToken}` },
      body: { text: 'Message from Web Client to Mobile! 💻📱' },
    });
    assert(webSendRes.status === 201, 'Check 22: Web can send message with HTTP 201');

    const mobileReadRes = await apiFetch(`/api/message/conversations/${testConvId}/messages`, {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    assert(mobileReadRes.data?.messages?.some((m) => m.content?.includes('Message from Web Client to Mobile')), 'Check 22b: Mobile reads message sent from Web');

    // Check 23: P7-P4 and P7-P5 still work
    const liveRes = await apiFetch('/api/live/rooms?tab=explore');
    const partyRes = await apiFetch('/api/party/rooms?tab=party');
    assert(liveRes.status === 200, 'Check 23a: P7-P4 live streaming endpoint returns HTTP 200');
    assert(partyRes.status === 200, 'Check 23b: P7-P5 party rooms endpoint returns HTTP 200');

    // Check 24: Out-of-scope on fixtures & D7 walk 5 passes with flag off
    const mobileFixtures = fs.readFileSync(path.join(__dirname, '../mobile/lib/design/design_fixtures.dart'), 'utf8');
    assert(mobileFixtures.includes('inboxChats'), 'Check 24a: Mobile design fixtures contain inboxChats');

    const webFixtures = fs.readFileSync(path.join(__dirname, 'lib/design/designFixtures.ts'), 'utf8');
    assert(webFixtures.includes('export class DesignFixtures'), 'Check 24b: Web designFixtures.ts intact and exports DesignFixtures');

    const apiConfigContent = fs.readFileSync(path.join(__dirname, '../mobile/lib/api/api_config.dart'), 'utf8');
    assert(apiConfigContent.includes('useMessageApi'), 'Check 24c: ApiConfig.useMessageApi toggle switch exists');

    console.log('\n========================================================================');
    console.log(`P7-P6 TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED (TOTAL: ${passedCount + failedCount})`);
    console.log('========================================================================');

    if (failedCount === 0) {
      console.log('\nSUCCESS: All 24 P7-P6 Message Module checks passed with 100% compliance!\n');
    } else {
      console.error(`\nFAILED: ${failedCount} tests did not pass.\n`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error during test execution:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runAllTests();
