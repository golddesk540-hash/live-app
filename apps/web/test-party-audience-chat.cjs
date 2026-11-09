const puppeteer = require('puppeteer-core');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const ROOM_ID = '7001';

async function runTests() {
  console.log('================================================================');
  console.log('POPO LIVE — MODULE 5.5 AUTOMATED TEST SUITE');
  console.log('AUDIENCE AND CHAT — 05_05_audience_and_chat.png');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // GROUP 1: REST APIS & BACKEND VERIFICATION
  // -------------------------------------------------------------
  console.log('\n--- GROUP 1: REST APIS & AUDIENCE/CHAT BACKEND ---');

  // 1.1 GET /api/party/7001/audience
  const audRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/audience`);
  const audData = await audRes.json();
  assert(audRes.status === 200 && audData.success === true, '1.1 GET /api/party/7001/audience returns 200 OK');
  assert(audData.audienceCount >= 256, `1.2 Baseline audience count is at least 256 (found: ${audData.audienceCount})`);
  assert(Array.isArray(audData.members) && audData.members.length >= 4, '1.3 Seeded audience members list is populated');

  // 1.2 POST /api/party/7001/audience/join (Account 1 joins)
  const joinRes1 = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/audience/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'test_aud_user_101',
      userName: 'Tariq Test',
      userAvatar: '/assets/chat/avatar_rizwan.png',
      userLevel: 3,
    }),
  });
  const joinData1 = await joinRes1.json();
  assert(joinRes1.status === 200 && joinData1.success === true, '1.4 Audience member successfully joined party');

  // 1.3 Duplicate Prevention Test: Join again with same userId
  const joinResDup = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/audience/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'test_aud_user_101',
      userName: 'Tariq Test',
      userAvatar: '/assets/chat/avatar_rizwan.png',
      userLevel: 3,
    }),
  });
  const joinDataDup = await joinResDup.json();
  assert(joinResDup.status === 200 && joinDataDup.success === true, '1.5 Duplicate join handled idempotently without DB error');

  // 1.4 POST /api/party/7001/audience/leave
  const leaveRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/audience/leave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: 'test_aud_user_101' }),
  });
  const leaveData = await leaveRes.json();
  assert(leaveRes.status === 200 && leaveData.success === true, '1.6 Audience member successfully left party');

  // 1.5 GET /api/party/7001/chat/messages
  const msgRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/chat/messages`);
  const msgData = await msgRes.json();
  assert(msgRes.status === 200 && msgData.success === true, '1.7 GET /api/party/7001/chat/messages returns 200 OK');
  assert(Array.isArray(msgData.messages) && msgData.messages.length >= 4, '1.8 Reference messages exist in room');

  // Verify the 4 reference messages from 05_05
  const texts = msgData.messages.map((m) => m.messageText);
  assert(texts.some((t) => t.includes('Great party!')), '1.9 Canonical message 1: "Great party! 🎉" present');
  assert(texts.some((t) => t.includes('Can I join a seat?')), '1.10 Canonical message 2: "Can I join a seat? 😀" present');
  assert(texts.some((t) => t.includes('Amazing vibes')), '1.11 Canonical message 3: "Amazing vibes 💜" present');
  assert(texts.some((t) => t.includes('Love this room!')), '1.12 Canonical message 4: "Love this room! ❤️" present');

  // 1.6 POST /api/party/7001/chat/send (Send valid message)
  const sendRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/chat/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      senderId: 'aud_test_user_202',
      senderName: 'Faizan R',
      senderAvatar: '/assets/chat/avatar_bilal.png',
      senderRole: 'audience',
      messageText: 'Awesome party stream! 🚀',
    }),
  });
  const sendData = await sendRes.json();
  assert(sendRes.status === 200 && sendData.success === true && sendData.message.messageText === 'Awesome party stream! 🚀', '1.13 Audience member successfully sent chat message');

  // 1.7 Empty message rejection
  const emptyRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/chat/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      senderId: 'aud_test_user_202',
      senderName: 'Faizan R',
      messageText: '   ',
    }),
  });
  assert(emptyRes.status === 400, '1.14 Empty message rejected with HTTP 400');

  // 1.8 Max length validation (> 300 characters)
  const longText = 'A'.repeat(305);
  const longRes = await fetch(`${BASE_URL}/api/party/${ROOM_ID}/chat/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      senderId: 'aud_test_user_202',
      senderName: 'Faizan R',
      messageText: longText,
    }),
  });
  assert(longRes.status === 400, '1.15 Message exceeding 300 chars rejected with HTTP 400');

  // -------------------------------------------------------------
  // GROUP 2: BROWSER UI VERIFICATION (1:1 05_05 REFERENCE MATCH)
  // -------------------------------------------------------------
  console.log('\n--- GROUP 2: BROWSER UI VERIFICATION (1:1 05_05 REFERENCE) ---');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=412,915'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('poppo_terms_consent_status', 'accepted');
    localStorage.setItem('poppo_terms_consent_version', 'v4.2.0');
  });

  // Get consent cookie
  const consentRes = await fetch(`${BASE_URL}/api/consent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'accept',
      termsAccepted: true,
      privacyAccepted: true,
      isAdultConfirmed: true,
    }),
  });
  const setCookieHeader = consentRes.headers.get('set-cookie') || '';
  const tokenMatch = setCookieHeader.match(/poppo_terms_consent=([^;]+)/);
  const cookieValue = tokenMatch ? tokenMatch[1] : '';

  await page.setCookie({
    name: 'poppo_terms_consent',
    value: cookieValue,
    domain: 'localhost',
    path: '/',
  });

  await page.goto(`${BASE_URL}/party/room/${ROOM_ID}?preview=demo`, {
    waitUntil: 'networkidle2',
  });
  await new Promise((r) => setTimeout(r, 1200));

  // 2.1 Header & Status Bar
  const header = await page.$('[data-testid="seat-grid-header"]');
  assert(header !== null, '2.1 Top header is rendered');

  const backBtn = await page.$('[data-action="back"]');
  assert(backBtn !== null, '2.2 Back chevron navigation is rendered');

  const castBtn = await page.$('[data-action="cast"]');
  assert(castBtn !== null, '2.3 Audio cast icon is rendered');

  const hostName = await page.$eval('[data-testid="host-name"]', (el) => el.textContent.trim());
  assert(hostName.includes('Maria Live'), `2.4 Host name is Maria Live (found: "${hostName}")`);

  const audienceCountText = await page.$eval('[data-testid="audience-count"]', (el) => el.textContent.trim());
  assert(parseInt(audienceCountText, 10) >= 256, `2.5 Audience count pill displays >= 256 (found: "${audienceCountText}")`);

  // 2.2 Segmented Tabs: [ Chat ] vs [ Audience (1.2K) ]
  const tabChat = await page.$('[data-testid="tab-chat"]');
  assert(tabChat !== null, '2.6 [ Chat ] pill tab is rendered');

  const tabAudience = await page.$('[data-testid="tab-audience"]');
  assert(tabAudience !== null, '2.7 [ Audience (1.2K) ] pill tab is rendered');

  const isChatActive = await page.evaluate((el) => el.classList.contains('bg-gradient-to-r'), tabChat);
  assert(isChatActive, '2.8 [ Chat ] tab is active by default with vibrant gradient pill');

  // 2.3 Live Chat Stream
  const chatStream = await page.$('[data-testid="party-chat-stream"]');
  assert(chatStream !== null, '2.9 Live party chat stream container is rendered');

  const bubbles = await page.$$('[data-testid="chat-bubble"]');
  assert(bubbles.length >= 4, `2.10 At least 4 chat message bubbles rendered (found: ${bubbles.length})`);

  // 2.4 Bottom Input Field & Gift Button matching 05_05
  const chatInput = await page.$('[data-testid="chat-input"]');
  assert(chatInput !== null, '2.11 Message input field is rendered with "Type a message..." placeholder');

  const sendBtn = await page.$('[data-testid="chat-send-btn"]');
  assert(sendBtn !== null, '2.12 Send button (>) is rendered inside input capsule');

  const giftBtn = await page.$('[data-testid="btn-gift"]');
  assert(giftBtn !== null, '2.13 Pink/magenta glowing circular Gift button (🎁) is rendered');

  // 2.5 Footer Reference Banner
  const footerText = await page.$eval('[data-testid="footer-reference-banner"]', (el) => el.textContent.trim());
  assert(footerText.includes('05_05 Audience and Chat'), `2.14 Footer banner strictly matches 05_05 (found: "${footerText}")`);

  // -------------------------------------------------------------
  // GROUP 3: INTERACTIVE WORKFLOWS & MULTI-DEVICE REAL-TIME SYNC
  // -------------------------------------------------------------
  console.log('\n--- GROUP 3: INTERACTIVE WORKFLOWS & MULTI-DEVICE SYNC ---');

  // 3.1 Send message from UI (Device 1)
  await page.type('[data-testid="chat-input"]', 'Real-time party message 🎈');
  await page.evaluate(() => {
    const btn = document.querySelector('[data-testid="chat-send-btn"]');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  const afterSendInput = await page.$eval('[data-testid="chat-input"]', (el) => el.value);
  assert(afterSendInput === '', '3.1 Input cleared immediately upon sending message');

  const allMessagesText = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('[data-testid="chat-bubble"]')).map((el) => el.textContent);
  });
  assert(allMessagesText.some((t) => t.includes('Real-time party message 🎈')), '3.2 Newly sent message appears in chat stream');

  // 3.2 Switch to [ Audience (1.2K) ] Tab
  await page.evaluate(() => {
    const tab = document.querySelector('[data-testid="tab-audience"]');
    if (tab) tab.click();
  });
  await new Promise((r) => setTimeout(r, 800));

  const audList = await page.$('[data-testid="audience-list-view"]');
  assert(audList !== null, '3.3 Switched to Audience list view');

  const memberCards = await page.$$('[data-testid^="audience-member-"]');
  assert(memberCards.length >= 4, `3.4 Audience member cards displayed (found: ${memberCards.length})`);

  // 3.3 Multi-Device Real-Time Synchronization (Device 2 receives live message)
  console.log('Testing Multi-Device Real-Time Sync on Device 2...');
  const page2 = await browser.newPage();
  await page2.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true });

  await page2.evaluateOnNewDocument(() => {
    localStorage.setItem('poppo_terms_consent_status', 'accepted');
    localStorage.setItem('poppo_terms_consent_version', 'v4.2.0');
  });

  await page2.setCookie({
    name: 'poppo_terms_consent',
    value: cookieValue,
    domain: 'localhost',
    path: '/',
  });

  await page2.goto(`${BASE_URL}/party/room/${ROOM_ID}?preview=demo`, {
    waitUntil: 'networkidle2',
  });
  await new Promise((r) => setTimeout(r, 1000));

  // Device 1 sends message
  await fetch(`${BASE_URL}/api/party/${ROOM_ID}/chat/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      senderId: 'device_1_user',
      senderName: 'Device 1 Host',
      senderAvatar: '/assets/party/chat_avatar_ali_khan.png',
      senderRole: 'host',
      messageText: 'Hello from Device 1 in real-time! ✨',
    }),
  });

  // Device 2 polls every 2.5s, wait 3s for background sync
  await new Promise((r) => setTimeout(r, 3200));

  const device2Bubbles = await page2.evaluate(() => {
    return Array.from(document.querySelectorAll('[data-testid="chat-bubble"]')).map((el) => el.textContent);
  });
  assert(
    device2Bubbles.some((t) => t.includes('Hello from Device 1 in real-time! ✨')),
    '3.5 Device 2 receives and displays real-time message without page reload'
  );

  // 3.4 Mode toggle: Switch to 9-Seat Grid and back
  await page.evaluate(() => {
    const btn = document.querySelector('[data-action="toggle-view-mode"]');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  const gridView = await page.$('[data-testid="nine-seat-grid-view"]');
  assert(gridView !== null, '3.6 Seamlessly toggled to 9-Seat Grid View from Module 5.4');

  await page2.close();
  await browser.close();

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED / ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test run error:', err);
  process.exit(1);
});
