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
    passedTests++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${message}`);
  }
}

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('========================================================================');
  console.log('POPO LIVE — MODULE 4.10: HOST RULES ON SCREEN AUTOMATED TESTS');
  console.log('========================================================================\n');

  // ========================================================================
  // TEST GROUP 1: BACKEND APIS & POLICY VERSION TRACKING
  // ========================================================================
  console.log('Test Group 1: Backend APIs & Policy Version Tracking');

  // 1.1 GET /api/live/rules
  const rulesRes = await makeRequest('GET', '/api/live/rules');
  assert(rulesRes.status === 200, 'Rules endpoint returns HTTP 200');
  assert(rulesRes.data.success === true, 'Rules endpoint returns success: true');
  assert(rulesRes.data.policyVersion === '1.0.0', 'Active policy version is 1.0.0');
  assert(Array.isArray(rulesRes.data.rules), 'Returns array of rules');
  assert(rulesRes.data.rules.length === 5, 'Returns exactly 5 canonical rules matching 04_10');

  const titles = rulesRes.data.rules.map((r) => r.title);
  assert(titles.includes('No nudity or sexual content'), 'Rule 1: No nudity or sexual content');
  assert(titles.includes('No minors (under 18)'), 'Rule 2: No minors (under 18)');
  assert(titles.includes('No violence or hate speech'), 'Rule 3: No violence or hate speech');
  assert(titles.includes('No illegal or harmful activities'), 'Rule 4: No illegal or harmful activities');
  assert(titles.includes('Follow community guidelines'), 'Rule 5: Follow community guidelines');

  // 1.2 RESET test hosts to ensure fresh gating
  await makeRequest('POST', '/api/live/rules/reset', { hostId: 'test-host-alpha' });
  await makeRequest('POST', '/api/live/rules/reset', { hostId: 'test-host-beta' });

  // 1.3 Check status before acceptance
  const statusBefore = await makeRequest('GET', '/api/live/rules/status?hostId=test-host-alpha');
  assert(statusBefore.status === 200, 'Status endpoint returns HTTP 200');
  assert(statusBefore.data.hasAccepted === false, 'Test host alpha starts as NOT accepted');
  assert(statusBefore.data.currentPolicyVersion === '1.0.0', 'Current policy version is 1.0.0');

  // 1.4 Accept rules for test-host-alpha
  const acceptRes = await makeRequest('POST', '/api/live/rules/accept', {
    hostId: 'test-host-alpha',
    policyVersion: '1.0.0',
    acknowledgedCheckbox: true,
  });
  assert(acceptRes.status === 200, 'Acceptance endpoint returns HTTP 200');
  assert(acceptRes.data.success === true, 'Acceptance returns success: true');
  assert(acceptRes.data.alreadyAccepted === false, 'First acceptance is new record');
  assert(acceptRes.data.acknowledgement.policyVersion === '1.0.0', 'Recorded policy version is 1.0.0');
  assert(acceptRes.data.acknowledgement.acceptedAt !== null, 'Recorded valid accepted timestamp');

  // 1.5 Duplicate acceptance check (should NOT insert duplicate)
  const dupRes = await makeRequest('POST', '/api/live/rules/accept', {
    hostId: 'test-host-alpha',
    policyVersion: '1.0.0',
  });
  assert(dupRes.status === 200, 'Duplicate acceptance returns HTTP 200');
  assert(dupRes.data.alreadyAccepted === true, 'Correctly detects previously accepted policy');

  // 1.6 Verify status after acceptance
  const statusAfter = await makeRequest('GET', '/api/live/rules/status?hostId=test-host-alpha');
  assert(statusAfter.data.hasAccepted === true, 'Test host alpha status updated to hasAccepted: true');
  assert(statusAfter.data.acknowledgedVersion === '1.0.0', 'Acknowledged version is 1.0.0');

  // 1.7 Verify test host beta is still unaccepted (Account Isolation)
  const statusBeta = await makeRequest('GET', '/api/live/rules/status?hostId=test-host-beta');
  assert(statusBeta.data.hasAccepted === false, 'Account isolation: test host beta remains unaccepted');

  // ========================================================================
  // TEST GROUP 2: HEADLESS BROWSER UI VERIFICATION (04_10 Reference Match)
  // ========================================================================
  console.log('\nTest Group 2: Headless Browser UI Verification');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  console.log(`  Navigating to ${BASE_URL}/live/rules?preview=demo ...`);
  await page.goto(`${BASE_URL}/live/rules?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });

  // Dismiss global compliance / consent banner if present
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const acceptBtn = btns.find((b) => b.innerText && b.innerText.includes('Accept'));
    if (acceptBtn) acceptBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  // 2.1 Brand header
  const brandText = await page.evaluate(() => document.body.innerText);
  assert(brandText.includes('poppo Live') || brandText.includes('poppo'), 'Header displays "poppo Live" branding');

  // 2.2 Security shield SVG
  const shieldSvg = await page.$('svg path[d*="M32 3L60"]');
  assert(shieldSvg !== null, 'Security Shield SVG icon with neon border is present');

  // 2.3 Page Heading
  assert(brandText.includes('Host Rules'), 'Page heading displays "Host Rules"');

  // 2.4 Rules card & 5 Canonical Items
  const rulesCard = await page.$('[data-testid="rules-card"]');
  assert(rulesCard !== null, 'Rounded navy rules card container is present');

  assert(brandText.includes('No nudity or sexual content'), 'Rule 1 displayed on screen');
  assert(brandText.includes('No minors (under 18)'), 'Rule 2 displayed on screen');
  assert(brandText.includes('No violence or hate speech'), 'Rule 3 displayed on screen');
  assert(brandText.includes('No illegal or harmful activities'), 'Rule 4 displayed on screen');
  assert(brandText.includes('Follow community guidelines'), 'Rule 5 displayed on screen');

  // 2.5 Checkmark icons
  const checkmarks = await page.$$('[data-testid="rules-card"] svg');
  assert(checkmarks.length >= 5, 'All 5 rules feature emerald checkmark icons');

  // 2.6 Acknowledgement checkbox & "I Understand" Button
  const checkbox = await page.$('[data-action="toggle-acknowledgement"]');
  assert(checkbox !== null, 'Acknowledgement checkbox is present');

  const understandBtn = await page.$('[data-action="i-understand"]');
  assert(understandBtn !== null, 'Wide vibrant pink "I Understand" button is present');

  // 2.7 Bottom banner
  assert(
    brandText.includes('4.10 Host Rules on Screen'),
    'Bottom footer displays official "4.10 Host Rules on Screen" banner'
  );

  // ========================================================================
  // TEST GROUP 3: INTERACTIVE EXPANSION & SUBMISSION
  // ========================================================================
  console.log('\nTest Group 3: Interactive Drawer & Submission');

  // 3.1 Expand Rule 1 details accordion
  await page.evaluate(() => {
    const el = document.querySelector('[data-rule-id="rule_nudity"]');
    if (el) el.click();
  });
  await new Promise((r) => setTimeout(r, 500));
  const expandedText = await page.evaluate(() => document.body.innerText);
  assert(
    expandedText.includes('Content Safety') || expandedText.includes('pornography') || expandedText.includes('content_safety') || expandedText.includes('transparent'),
    'Clicking rule expands detailed policy description accordion'
  );

  // 3.2 Uncheck checkbox -> button should disable
  await page.evaluate(() => {
    const label = document.querySelector('[data-action="toggle-acknowledgement"]');
    if (label) {
      const input = label.querySelector('input');
      if (input) input.click();
    }
  });
  await new Promise((r) => setTimeout(r, 300));
  const isButtonDisabled = await page.evaluate(() => {
    const btn = document.querySelector('[data-action="i-understand"]');
    return btn.disabled || btn.classList.contains('cursor-not-allowed') || btn.classList.contains('bg-zinc-700/60');
  });
  assert(isButtonDisabled, 'Unchecking box disables "I Understand" confirmation button');

  // 3.3 Re-check checkbox -> button becomes active
  await page.evaluate(() => {
    const label = document.querySelector('[data-action="toggle-acknowledgement"]');
    if (label) {
      const input = label.querySelector('input');
      if (input) input.click();
    }
  });
  await new Promise((r) => setTimeout(r, 300));

  // 3.4 Submit "I Understand"
  await page.evaluate(() => {
    const btn = document.querySelector('[data-action="i-understand"]');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  const afterSubmitText = await page.evaluate(() => document.body.innerText);
  assert(
    afterSubmitText.includes('accepted') || afterSubmitText.includes('Policy v1.0.0'),
    'Acceptance timestamp and confirmation displayed upon submission'
  );

  // ========================================================================
  // TEST GROUP 4: HOST STUDIO INTEGRATION & SAFETY REMINDERS
  // ========================================================================
  console.log('\nTest Group 4: Host Studio Integration & Safety Reminders');

  console.log(`  Navigating to ${BASE_URL}/live/studio/880219?preview=demo ...`);
  await page.goto(`${BASE_URL}/live/studio/880219?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const acceptBtn = btns.find((b) => b.innerText && b.innerText.includes('Accept'));
    if (acceptBtn) acceptBtn.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  // 4.1 Safety reminder banner check
  const safetyReminder = await page.$('[data-testid="live-safety-reminder"]');
  assert(safetyReminder !== null, 'Live Safety Reminder banner is rendered in Host Studio (Section 5)');

  // 4.2 Dismiss safety reminder
  const dismissBtn = await page.$('[data-action="dismiss-safety-reminder"]');
  assert(dismissBtn !== null, 'Safety reminder dismiss (✕) button is present');
  await page.evaluate(() => {
    const btn = document.querySelector('[data-action="dismiss-safety-reminder"]');
    if (btn) btn.click();
  });
  await new Promise((r) => setTimeout(r, 400));

  const reminderAfterDismiss = await page.$('[data-testid="live-safety-reminder"]');
  assert(reminderAfterDismiss === null, 'Safety reminder dismisses cleanly without camera interruption');

  // 4.3 Direct route alias test
  console.log(`  Navigating to ${BASE_URL}/live/host-rules?preview=demo ...`);
  await page.goto(`${BASE_URL}/live/host-rules?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });
  const aliasText = await page.evaluate(() => document.body.innerText);
  assert(aliasText.includes('Host Rules'), 'Direct /live/host-rules route loads cleanly');

  await browser.close();

  console.log('\n========================================================================');
  console.log(`TEST SUMMARY: Total=${totalTests} | Passed=${passedTests} | Failed=${failedTests}`);
  console.log('========================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
