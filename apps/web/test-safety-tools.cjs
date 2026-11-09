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
  console.log('POPO LIVE — MODULE 4.6: SAFETY TOOLS AUTOMATED TESTS');
  console.log('====================================================\n');

  // TEST GROUP 1: REPORT API VALIDATION
  console.log('Test Group 1: Safety Report API & Bounds');
  try {
    // 1.1 Empty reason rejected
    const emptyRes = await request(`${BASE_URL}/api/live/safety/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { roomId: '880219', reason: '' },
    });
    assert(emptyRes.status === 400, 'Empty report reason rejected with status 400 Bad Request');
    assert(emptyRes.data && emptyRes.data.success === false, 'Returns success: false for empty report');

    // 1.2 Invalid reason rejected
    const invalidRes = await request(`${BASE_URL}/api/live/safety/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { roomId: '880219', reason: 'nonexistent_reason' },
    });
    assert(invalidRes.status === 400, 'Invalid report reason rejected with 400 Bad Request');

    // 1.3 Valid submission with description
    const reporterId = `test-user-${Date.now()}`;
    const validRes = await request(`${BASE_URL}/api/live/safety/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        roomId: '880219',
        reporterId,
        reportedUserId: 'demo-target-123',
        reportedNickname: 'OffenderUser',
        reason: 'harassment_bullying',
        description: 'Host was using abusive language in room 880219',
      },
    });

    assert(validRes.status === 200, 'Valid report accepted with HTTP 200 OK');
    assert(validRes.data && validRes.data.success === true, 'Response contains success: true');
    assert(validRes.data.reportId && validRes.data.reportId.startsWith('RPT-'), 'Generated unique Report ID format RPT-XXXXXX');
    assert(validRes.data.status === 'pending_investigation', 'Report assigned status pending_investigation');

    // 1.4 Duplicate report prevention (cooldown)
    const dupRes = await request(`${BASE_URL}/api/live/safety/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        roomId: '880219',
        reporterId,
        reportedUserId: 'demo-target-123',
        reason: 'harassment_bullying',
      },
    });
    assert(dupRes.status === 429, 'Duplicate report throttled with HTTP 429 Too Many Requests');
  } catch (err) {
    assert(false, `Report API test exception: ${err.message}`);
  }

  // TEST GROUP 2: ALL 6 REPORT REASONS
  console.log('\nTest Group 2: All 6 Required Report Reasons');
  const reasons = [
    'harassment_bullying',
    'inappropriate_content',
    'spam',
    'impersonation',
    'hate_speech',
    'other',
  ];

  for (const r of reasons) {
    try {
      const res = await request(`${BASE_URL}/api/live/safety/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          roomId: '880219',
          reporterId: `user-${r}-${Date.now()}`,
          reportedUserId: `target-${r}`,
          reason: r,
        },
      });
      assert(res.status === 200 && res.data.success === true, `Reason "${r}" accepted successfully`);
    } catch (err) {
      assert(false, `Reason "${r}" failed: ${err.message}`);
    }
  }

  // TEST GROUP 3: BLOCK API & BLACKLIST
  console.log('\nTest Group 3: User Block & Blacklist Integration');
  const testBlockTargetId = `target-block-${Date.now()}`;
  try {
    // 3.1 Block user
    const blockRes = await request(`${BASE_URL}/api/live/safety/block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        targetUserId: testBlockTargetId,
        targetNickname: 'Troublemaker_99',
        roomId: '880219',
      },
    });
    assert(blockRes.status === 200, 'POST /api/live/safety/block returns HTTP 200');
    assert(blockRes.data.blocked === true, 'Response blocked is true');

    // 3.2 Fetch blocklist
    const listRes = await request(`${BASE_URL}/api/live/safety/block`);
    assert(listRes.status === 200, 'GET /api/live/safety/block returns HTTP 200');
    assert(Array.isArray(listRes.data.blockedUserIds), 'BlockedUserIds is an array');

    // 3.3 Unblock user
    const unblockRes = await request(`${BASE_URL}/api/live/safety/block?targetUserId=${testBlockTargetId}`, {
      method: 'DELETE',
    });
    assert(unblockRes.status === 200, 'DELETE /api/live/safety/block returns HTTP 200');
    assert(unblockRes.data.blocked === false, 'User unblocked successfully');
  } catch (err) {
    assert(false, `Block API test exception: ${err.message}`);
  }

  // TEST GROUP 4: MUTE API & PERMISSIONS
  console.log('\nTest Group 4: Mute API & Permission Controls');
  const testMuteTargetId = `target-mute-${Date.now()}`;
  try {
    // 4.1 Viewer chat mute
    const muteRes = await request(`${BASE_URL}/api/live/safety/mute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        roomId: '880219',
        targetUserId: testMuteTargetId,
        targetNickname: 'NoisyUser',
        muteType: 'viewer_local',
        requesterRole: 'viewer',
      },
    });
    assert(muteRes.status === 200, 'Viewer chat mute accepted with HTTP 200');
    assert(muteRes.data.muted === true, 'Muted state is true');

    // 4.2 Permission enforcement: Viewer trying room_global mute -> 403
    const forbiddenRes = await request(`${BASE_URL}/api/live/safety/mute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        roomId: '880219',
        targetUserId: 'participant-x',
        muteType: 'room_global',
        requesterRole: 'viewer',
      },
    });
    assert(forbiddenRes.status === 403, 'Viewer room-wide mute rejected with HTTP 403 Forbidden');

    // 4.3 Permission enforcement: Viewer trying to mute room host -> 403
    const hostMuteRes = await request(`${BASE_URL}/api/live/safety/mute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        roomId: '880219',
        targetUserId: 'demo-host-zara',
        targetNickname: 'Zara Live',
        requesterRole: 'viewer',
      },
    });
    assert(hostMuteRes.status === 403, 'Viewer attempting to mute room host rejected with HTTP 403 Forbidden');

    // 4.4 Unmute participant
    const unmuteRes = await request(`${BASE_URL}/api/live/safety/mute?roomId=880219&targetUserId=${testMuteTargetId}`, {
      method: 'DELETE',
    });
    assert(unmuteRes.status === 200, 'DELETE /api/live/safety/mute returns HTTP 200');
    assert(unmuteRes.data.muted === false, 'Participant unmuted successfully');
  } catch (err) {
    assert(false, `Mute API test exception: ${err.message}`);
  }

  // TEST GROUP 5: BROWSER UI VERIFICATION (EDGE)
  console.log('\nTest Group 5: Browser UI Verification (04_06_safety_tools.png Parity)');
  let browser = null;
  try {
    browser = await puppeteer.launch({
      executablePath: EDGE_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 375, height: 667 });

    await page.goto(`${BASE_URL}/live/safety?preview=demo`, { waitUntil: 'networkidle0', timeout: 15000 });

    const content = await page.content();
    assert(content.includes('Safety Tools'), 'Heading "Safety Tools" rendered');
    assert(content.includes('Report'), 'Option "Report" rendered');
    assert(content.includes('Block'), 'Option "Block" rendered');
    assert(content.includes('Mute Chat'), 'Option "Mute Chat" rendered');
    assert(content.includes('Cancel'), 'Cancel button rendered');
    assert(content.includes('4.6 Safety Tools'), 'Bottom banner "4.6 Safety Tools" rendered');

    // Test Opening Report Dialog
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const repBtn = buttons.find(b => b.textContent && b.textContent.includes('Report'));
      if (repBtn) repBtn.click();
    });
    await new Promise(r => setTimeout(r, 600));

    const repContent = await page.content();
    assert(repContent.includes('Report User'), 'Report User dialog opened');
    assert(repContent.includes('Harassment or bullying'), 'Reason 1 Harassment present');
    assert(repContent.includes('Inappropriate content'), 'Reason 2 Inappropriate content present');
    assert(repContent.includes('Spam'), 'Reason 3 Spam present');
    assert(repContent.includes('Fake account or impersonation'), 'Reason 4 Impersonation present');
    assert(repContent.includes('Hate or abusive language'), 'Reason 5 Hate speech present');
    assert(repContent.includes('Other'), 'Reason 6 Other present');

    // Select a reason and submit report
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const reasonBtn = buttons.find(b => b.textContent && b.textContent.includes('Harassment or bullying'));
      if (reasonBtn) reasonBtn.click();
    });
    await new Promise(r => setTimeout(r, 300));

    // Submit report
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const subBtn = buttons.find(b => b.textContent && b.textContent.includes('Submit Report'));
      if (subBtn) subBtn.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    const successContent = await page.content();
    assert(successContent.includes('Report Submitted') || successContent.includes('RPT-'), 'Report submission confirmed with Report ID');

  } catch (err) {
    assert(false, `Browser UI test exception: ${err.message}`);
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
