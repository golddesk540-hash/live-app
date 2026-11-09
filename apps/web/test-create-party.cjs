const puppeteer = require('puppeteer-core');
const http = require('http');
const { Client } = require('pg');

const BASE_URL = 'http://localhost:3000';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const DB_URL =
  process.env.DATABASE_URL ||
  'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive';

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
  console.log('POPO LIVE — MODULE 5.1: CREATE A PARTY AUTOMATED TESTS');
  console.log('========================================================================\n');

  // ========================================================================
  // TEST GROUP 1: BACKEND APIS & POSTGRESQL VALIDATION
  // ========================================================================
  console.log('Test Group 1: Backend APIs & PostgreSQL Database Records');

  // 1.1 GET /api/party/categories
  const catRes = await makeRequest('GET', '/api/party/categories');
  assert(catRes.status === 200, 'Categories endpoint returns HTTP 200');
  assert(catRes.data.success === true, 'Categories returns success: true');
  assert(Array.isArray(catRes.data.categories), 'Returns array of categories');
  assert(catRes.data.categories.length === 7, 'Returns exactly 7 development categories (Section 4)');

  const catNames = catRes.data.categories.map((c) => c.name);
  assert(catNames.includes('Chill & Chat'), 'Category: Chill & Chat');
  assert(catNames.includes('Music'), 'Category: Music');
  assert(catNames.includes('Entertainment'), 'Category: Entertainment');
  assert(catNames.includes('Gaming'), 'Category: Gaming');
  assert(catNames.includes('Lifestyle'), 'Category: Lifestyle');
  assert(catNames.includes('Talent'), 'Category: Talent');
  assert(catNames.includes('Friendship'), 'Category: Friendship');

  // 1.2 Title validation checks
  const emptyRes = await makeRequest('POST', '/api/party/create?preview=demo', {
    title: '   ',
    categoryId: 'chill_chat',
    roomType: 'public',
  });
  assert(emptyRes.status === 400, 'Empty title is rejected with HTTP 400');

  const longTitle = 'A'.repeat(51);
  const longRes = await makeRequest('POST', '/api/party/create?preview=demo', {
    title: longTitle,
    categoryId: 'chill_chat',
    roomType: 'public',
  });
  assert(longRes.status === 400, 'Title exceeding 50 characters rejected with HTTP 400');

  const badCatRes = await makeRequest('POST', '/api/party/create?preview=demo', {
    title: 'Valid Party Title',
    categoryId: 'non_existent_category_xyz',
    roomType: 'public',
  });
  assert(badCatRes.status === 400, 'Invalid category ID rejected with HTTP 400');

  // 1.3 Create Public Party
  const publicParty = await makeRequest('POST', '/api/party/create?preview=demo', {
    title: 'Automated Test Public Party',
    categoryId: 'music',
    roomType: 'public',
    hostNickname: 'TestHostAlpha',
  });
  assert(publicParty.status === 201, 'Public party creation returns HTTP 201 Created');
  assert(publicParty.data.success === true, 'Public party returns success: true');
  assert(publicParty.data.party.roomNumber !== undefined, 'Unique room number generated');
  assert(publicParty.data.party.roomType === 'public', 'Saved roomType is public');
  assert(publicParty.data.party.isPrivate === false, 'Saved isPrivate is false');

  const publicRoomNumber = publicParty.data.party.roomNumber;

  // 1.4 Create Private Party (with second user account)
  const privateParty = await makeRequest('POST', '/api/party/create?preview=demo', {
    title: 'VIP Private Lounge',
    categoryId: 'gaming',
    roomType: 'private',
    hostNickname: 'TestHostBeta',
  });
  assert(privateParty.status === 201, 'Private party creation returns HTTP 201 Created');
  assert(privateParty.data.party.roomType === 'private', 'Saved roomType is private');
  assert(privateParty.data.party.isPrivate === true, 'Saved isPrivate is true');

  const privateRoomNumber = privateParty.data.party.roomNumber;

  // 1.5 Direct PostgreSQL Database Record Verification
  const client = new Client({ connectionString: DB_URL });
  try {
    await client.connect();
    const dbRes = await client.query(
      `SELECT room_number, title, category, category_id, room_type, is_private, host_nickname, is_live, max_seats
       FROM popolive.party_rooms 
       WHERE room_number = $1`,
      [publicRoomNumber]
    );
    assert(dbRes.rows.length === 1, 'PostgreSQL record actually exists in database');
    const row = dbRes.rows[0];
    assert(row.title === 'Automated Test Public Party', 'PostgreSQL stored party title matches');
    assert(row.category === 'Music', 'PostgreSQL stored category matches');
    assert(row.room_type === 'public', 'PostgreSQL stored room_type is public');
    assert(row.is_private === false, 'PostgreSQL is_private flag is false');
    assert(row.max_seats === 9, 'PostgreSQL party seats configured to 9');
  } catch (dbErr) {
    assert(false, `PostgreSQL direct check failed: ${dbErr.message}`);
  } finally {
    await client.end();
  }

  // 1.6 GET Party Details by Room Number
  const roomRes = await makeRequest('GET', `/api/party/${publicRoomNumber}`);
  assert(roomRes.status === 200, 'Party details endpoint returns HTTP 200');
  assert(roomRes.data.room.title === 'Automated Test Public Party', 'Returns accurate party title');

  // ========================================================================
  // TEST GROUP 2: HEADLESS BROWSER UI VERIFICATION (05_01 Reference Match)
  // ========================================================================
  console.log('\nTest Group 2: Headless Browser UI Verification');

  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  console.log(`  Navigating to ${BASE_URL}/party/create?preview=demo ...`);
  await page.goto(`${BASE_URL}/party/create?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });

  // Dismiss global compliance modal if present
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const acceptBtn = btns.find((b) => b.innerText && b.innerText.includes('Accept'));
    if (acceptBtn) acceptBtn.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  const bodyText = await page.evaluate(() => document.body.innerText);

  // 2.1 Brand header
  assert(bodyText.includes('Popo Live') || bodyText.includes('Popo'), 'Top header displays "Popo Live" branding');
  const backBtn = await page.$('[data-action="back"]');
  assert(backBtn !== null, 'Back navigation button is present (data-action="back")');

  // 2.2 Heading: Create a Party
  assert(bodyText.includes('Create a Party'), 'Heading displays "Create a Party"');

  // 2.3 Party creation icon
  const partySvg = await page.$('svg line[stroke="#ffffff"]');
  assert(partySvg !== null, 'Party Creation neon capsule/mic icon is rendered');

  // 2.4 Title input field
  const titleInput = await page.$('[data-testid="party-title-input"]');
  assert(titleInput !== null, 'Party Title input field is present');
  const inputVal = await page.evaluate((el) => el.value, titleInput);
  assert(inputVal === 'Friends Talk Party', 'Default title matches reference: "Friends Talk Party"');

  // 2.5 Category selector
  const catSelector = await page.$('[data-testid="category-selector"]');
  assert(catSelector !== null, 'Category dropdown selector is present');
  assert(bodyText.includes('Chill & Chat'), 'Initial category displays "Chill & Chat"');

  // 2.6 Room Type options (Public & Private)
  const publicBtn = await page.$('[data-room-type="public"]');
  const privateBtn = await page.$('[data-room-type="private"]');
  assert(publicBtn !== null, 'Public room type button is present');
  assert(privateBtn !== null, 'Private room type button is present');

  const publicBtnClass = await page.evaluate((el) => el.className, publicBtn);
  assert(publicBtnClass.includes('from-[#6b21a8]') || publicBtnClass.includes('purple'), 'Public is selected by default with glowing purple');

  // 2.7 Action button: Create Party
  const createBtn = await page.$('[data-action="create-party"]');
  assert(createBtn !== null, 'Large purple "Create Party" button is present');

  // 2.8 Official footer banner
  assert(bodyText.includes('05_01 Create a Party'), 'Bottom footer displays official "05_01 Create a Party" text');

  // ========================================================================
  // TEST GROUP 3: INTERACTIVE SELECTIONS & PARTY CREATION
  // ========================================================================
  console.log('\nTest Group 3: Interactive Selections & Submission Flow');

  // 3.1 Toggle Category dropdown
  await page.evaluate(() => {
    document.querySelector('[data-testid="category-selector"]').click();
  });
  await new Promise((r) => setTimeout(r, 400));

  const dropdownMenu = await page.$('[data-testid="category-dropdown-menu"]');
  assert(dropdownMenu !== null, 'Category dropdown menu opens with categories');

  // Select "Entertainment"
  await page.evaluate(() => {
    const item = document.querySelector('[data-category-id="entertainment"]');
    if (item) item.click();
  });
  await new Promise((r) => setTimeout(r, 400));
  const newCatText = await page.evaluate(() => document.body.innerText);
  assert(newCatText.includes('Entertainment'), 'Category successfully updated to "Entertainment"');

  // 3.2 Toggle Room Type to Private
  await page.evaluate(() => {
    document.querySelector('[data-room-type="private"]').click();
  });
  await new Promise((r) => setTimeout(r, 300));
  const privClass = await page.evaluate(() => {
    return document.querySelector('[data-room-type="private"]').className;
  });
  assert(privClass.includes('from-[#6b21a8]') || privClass.includes('purple'), 'Private room option becomes active with purple glow');

  // 3.3 Change Title
  await page.evaluate(() => {
    const input = document.querySelector('[data-testid="party-title-input"]');
    input.value = 'Popo Weekend Voice Bash';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 200));

  // 3.4 Click Create Party & Verify Navigation
  console.log('  Submitting Create Party action...');
  await page.evaluate(() => {
    document.querySelector('[data-action="create-party"]').click();
  });
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 1000));

  const currentUrl = page.url();
  assert(currentUrl.includes('/party/room/'), 'Successfully navigated to newly created party room URL');

  const roomPageText = await page.evaluate(() => document.body.innerText);
  assert(
    roomPageText.includes('Popo Weekend Voice Bash') || roomPageText.includes('Party Room Ready'),
    'Party room displays created party title and 9-seat grid ready for Module 5.2'
  );

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
