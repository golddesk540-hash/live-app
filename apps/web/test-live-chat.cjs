const puppeteer = require('puppeteer-core');
const http = require('http');

const BASE_URL = 'http://localhost:3000';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failedTests++;
  }
}

async function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = http.request({
      hostname: u.hostname,
      port: u.port || 80,
      path: u.pathname + u.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, text: data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('POPO LIVE — MODULE 4.5: LIVE CHAT AUTOMATED TESTS');
  console.log('====================================================\n');

  // TEST 1: GET /api/live/chat/messages
  console.log('Test Group 1: Live Chat Message Feed API');
  try {
    const res = await request(`${BASE_URL}/api/live/chat/messages?roomId=880219&preview=demo`);
    assert(res.status === 200, 'GET /api/live/chat/messages returns 200 OK');
    assert(res.data && res.data.success === true, 'Response contains success: true');
    assert(Array.isArray(res.data.messages), 'Messages field is an array');
    assert(res.data.messages.length >= 6, `Returns at least 6 initial reference messages (got ${res.data.messages.length})`);

    const nicknames = res.data.messages.map(m => m.senderNickname);
    assert(nicknames.includes('Sana'), 'Includes reference message from Sana');
    assert(nicknames.includes('Rizwan'), 'Includes reference message from Rizwan');
    assert(nicknames.includes('Mehak'), 'Includes reference message from Mehak');
    assert(nicknames.includes('Khan G'), 'Includes reference message from Khan G');
    assert(nicknames.includes('Ayesha'), 'Includes reference message from Ayesha');
    assert(nicknames.includes('Bilal'), 'Includes reference message from Bilal');
  } catch (err) {
    assert(false, `GET /api/live/chat/messages exception: ${err.message}`);
  }

  // TEST 2: POST /api/live/chat/send valid message
  console.log('\nTest Group 2: Send Message API Validation');
  let testMsgText = `Test greeting ${Date.now()}`;
  try {
    const res = await request(`${BASE_URL}/api/live/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        roomId: '880219',
        text: testMsgText,
        senderNickname: 'Test_Viewer_45',
        senderRole: 'viewer',
        emoji: '🔥',
      },
    });

    assert(res.status === 200, 'POST /api/live/chat/send returns 200 OK');
    assert(res.data && res.data.success === true, 'Response success is true');
    assert(res.data.message && res.data.message.messageText === testMsgText, 'Message text persisted properly');
    assert(res.data.message.senderNickname === 'Test_Viewer_45', 'Sender nickname saved');
    assert(res.data.message.emoji === '🔥', 'Emoji saved properly');
  } catch (err) {
    assert(false, `POST /api/live/chat/send exception: ${err.message}`);
  }

  // TEST 3: Validation - Reject Empty Message
  console.log('\nTest Group 3: Input Validation & Bounds');
  try {
    const res = await request(`${BASE_URL}/api/live/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { roomId: '880219', text: '   ' },
    });
    assert(res.status === 400, 'Empty message rejected with status 400 Bad Request');
    assert(res.data && res.data.success === false, 'Returns success: false for empty message');
  } catch (err) {
    assert(false, `Empty message test exception: ${err.message}`);
  }

  // TEST 4: Validation - Reject >300 characters
  try {
    const longText = 'a'.repeat(305);
    const res = await request(`${BASE_URL}/api/live/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { roomId: '880219', text: longText },
    });
    assert(res.status === 400, 'Overlong message (>300 chars) rejected with status 400');
    assert(res.data && res.data.error.includes('300'), 'Error message specifies 300 characters limit');
  } catch (err) {
    assert(false, `Overlong message test exception: ${err.message}`);
  }

  // TEST 5: Rate Limiting (Anti-Spam)
  console.log('\nTest Group 4: Rate Limiting & Anti-Spam Security');
  try {
    let spamCount = 0;
    const spamSenderId = `spammer-${Date.now()}`;
    for (let i = 0; i < 7; i++) {
      const res = await request(`${BASE_URL}/api/live/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { roomId: '880219', text: `Spam #${i}`, senderId: spamSenderId },
      });
      if (res.status === 429) spamCount++;
    }
    assert(spamCount > 0, `Anti-spam rate limit triggered with status 429 (caught ${spamCount} rejections)`);
  } catch (err) {
    assert(false, `Rate limiting test exception: ${err.message}`);
  }

  // TEST 6: Audience API
  console.log('\nTest Group 5: Audience & Top Fans APIs');
  try {
    const res = await request(`${BASE_URL}/api/live/chat/audience?roomId=880219`);
    assert(res.status === 200, 'GET /api/live/chat/audience returns 200 OK');
    assert(Array.isArray(res.data.audience), 'Audience is an array');
    assert(res.data.totalCount === 7600, 'Total audience count is 7600 (7.6K)');
  } catch (err) {
    assert(false, `Audience API exception: ${err.message}`);
  }

  // TEST 7: Top Fans API
  try {
    const res = await request(`${BASE_URL}/api/live/chat/top-fans?roomId=880219`);
    assert(res.status === 200, 'GET /api/live/chat/top-fans returns 200 OK');
    assert(Array.isArray(res.data.topFans), 'Top fans is an array');
    assert(res.data.topFans[0].rank === 1, 'Top fan #1 has rank 1');
  } catch (err) {
    assert(false, `Top Fans API exception: ${err.message}`);
  }

  // TEST 8: Headless Browser UI Verification
  console.log('\nTest Group 6: Live Chat Browser UI Verification');
  let browser = null;
  try {
    browser = await puppeteer.launch({
      executablePath: EDGE_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    page.on('response', res => {
      if (res.status() >= 400) console.log('  [BAD STATUS]', res.status(), res.url());
    });
    page.on('console', msg => console.log('  [BROWSER LOG]', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('  [BROWSER ERROR]', err.message));
    await page.setViewport({ width: 375, height: 667 });

    await page.goto(`${BASE_URL}/live/chat?preview=demo`, { waitUntil: 'networkidle0', timeout: 15000 });

    // Check Header & Logo
    const pageContent = await page.content();
    assert(pageContent.includes('poppo'), 'Header displays "poppo" branding');
    assert(pageContent.includes('Live'), 'Header displays "Live" branding');

    // Check Tabs
    assert(pageContent.includes('Chat'), 'Tab "Chat" rendered');
    assert(pageContent.includes('Audience'), 'Tab "Audience" rendered');
    assert(pageContent.includes('Top Fans'), 'Tab "Top Fans" rendered');

    // Check Reference Comments
    assert(pageContent.includes('Sana:'), 'Reference comment from Sana present');
    assert(pageContent.includes('So beautiful'), 'Comment text "So beautiful" present');
    assert(pageContent.includes('Rizwan:'), 'Reference comment from Rizwan present');
    assert(pageContent.includes('Mehak:'), 'Reference comment from Mehak present');
    assert(pageContent.includes('Khan G:'), 'Reference comment from Khan G present');
    assert(pageContent.includes('Ayesha:'), 'Reference comment from Ayesha present');
    assert(pageContent.includes('Bilal:'), 'Reference comment from Bilal present');

    // Check Bottom Banner
    assert(pageContent.includes('4.5 Live Chat'), 'Bottom banner "4.5 Live Chat" rendered');

    // Interactive Test: Type in input and send message
    const inputSelector = 'input[placeholder="Say something..."]';
    await page.waitForSelector(inputSelector);
    const testChatText = 'Awesome show tonight!';
    await page.type(inputSelector, testChatText);

    // Verify send button appears and submit
    const submitBtn = await page.$('button[type="submit"]');
    assert(submitBtn !== null, 'Send button appears when text is entered');
    await page.keyboard.press('Enter');

    // Wait for message to render in feed
    await page.waitForFunction((text) => document.body.innerText.includes(text), { timeout: 5000 }, testChatText);
    const updatedContent = await page.content();
    assert(updatedContent.includes(testChatText), 'Sent message renders live in the chat message feed');

    // Test Audience Tab
    const audienceBtn = (await page.$$('button')).find(async (b) => {
      const text = await (await b.getProperty('innerText')).jsonValue();
      return text.trim() === 'Audience';
    });
    // Click Audience tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const audBtn = buttons.find(b => b.textContent && b.textContent.trim() === 'Audience');
      if (audBtn) audBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    const audienceContent = await page.content();
    assert(audienceContent.includes('7.6K') || audienceContent.includes('Viewers Online'), 'Audience tab displays viewers count');

    // Test Top Fans Tab
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const fansBtn = buttons.find(b => b.textContent && b.textContent.trim() === 'Top Fans');
      if (fansBtn) fansBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));
    const fansContent = await page.content();
    assert(fansContent.includes('Top Supporters Leaderboard') || fansContent.includes('coins'), 'Top Fans tab displays supporters leaderboard');

  } catch (err) {
    assert(false, `Browser UI testing error: ${err.message}`);
  } finally {
    if (browser) await browser.close();
  }

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${totalTests}`);
  console.log(`PASSED:      ${passedTests}`);
  console.log(`FAILED:      ${failedTests}`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
