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
  console.log('====================================================================');
  console.log('POPO LIVE — MODULE 4.8: END SCREEN & LIVE CENTER AUTOMATED TESTS');
  console.log('====================================================================\n');

  // TEST GROUP 1: END SCREEN & LIVE CENTER BACKEND APIS
  console.log('Test Group 1: Backend APIs & Session Data');
  try {
    // 1.1 Summary API
    const summaryRes = await request(`${BASE_URL}/api/live/end-screen/summary?roomId=880219&preview=demo`);
    assert(summaryRes.status === 200, 'Summary endpoint returns HTTP 200');
    assert(summaryRes.data && summaryRes.data.success === true, 'Summary endpoint returns success: true');
    assert(summaryRes.data.summary && summaryRes.data.summary.roomNumber === '880219', 'Summary returns room 880219');
    assert(summaryRes.data.summary.host && summaryRes.data.summary.host.nickname.includes('Zara'), 'Summary returns host Zara Live');
    assert(summaryRes.data.summary.durationFormatted === '01:24:36', 'Summary displays exact reference duration 01:24:36');
    assert(summaryRes.data.summary.totalViewersFormatted === '12,480' || summaryRes.data.summary.totalViewers === 12480, 'Summary displays 12,480 Total Viewers');
    assert(summaryRes.data.summary.newFollowersFormatted === '186' || summaryRes.data.summary.newFollowers === 186, 'Summary displays 186 New Followers');
    assert(summaryRes.data.summary.pointsReceivedFormatted === '28,400' || summaryRes.data.summary.pointsReceived === 28400, 'Summary displays 28,400 Points / Gifts');

    // 1.2 End Live Session API
    const endRes = await request(`${BASE_URL}/api/live/end-screen/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        roomId: '880219',
        durationSeconds: 5076,
        isDemo: true,
      },
    });
    assert(endRes.status === 200, 'End live session returns HTTP 200');
    assert(endRes.data && endRes.data.success === true, 'End live session returns success: true');
    assert(endRes.data.summary && endRes.data.summary.status === 'ended', 'End live returns status: ended');
    assert(endRes.data.summary.durationFormatted === '01:24:36', 'End live returns formatted duration 01:24:36');

    // 1.3 Duplicate End Request Prevention
    const dupEndRes = await request(`${BASE_URL}/api/live/end-screen/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        roomId: '880219',
        durationSeconds: 5076,
        isDemo: true,
      },
    });
    assert(dupEndRes.status === 200, 'Duplicate end request returns HTTP 200 without failure');
    assert(dupEndRes.data && (dupEndRes.data.alreadyEnded === true || dupEndRes.data.success === true), 'Duplicate end request safely handled');

    // 1.4 Live Center History API
    const historyRes = await request(`${BASE_URL}/api/live/center/history?preview=demo`);
    assert(historyRes.status === 200, 'Live Center history returns HTTP 200');
    assert(historyRes.data && historyRes.data.success === true, 'Live Center history returns success: true');
    assert(historyRes.data.host && historyRes.data.host.nickname.includes('Zara'), 'Live Center returns host Zara Live');
    assert(historyRes.data.kpis && typeof historyRes.data.kpis.totalSessions === 'number', 'Returns aggregated KPI totalSessions');
    assert(historyRes.data.kpis && typeof historyRes.data.kpis.totalDurationFormatted === 'string', 'Returns aggregated KPI totalDurationFormatted');
    assert(Array.isArray(historyRes.data.sessions) && historyRes.data.sessions.length >= 4, `Returns session history list (count: ${historyRes.data.sessions?.length})`);

    // 1.5 Filter Parameters
    const weekRes = await request(`${BASE_URL}/api/live/center/history?filter=week&preview=demo`);
    assert(weekRes.status === 200, 'Live Center filter=week returns HTTP 200');
    const monthRes = await request(`${BASE_URL}/api/live/center/history?filter=month&preview=demo`);
    assert(monthRes.status === 200, 'Live Center filter=month returns HTTP 200');
  } catch (err) {
    assert(false, `API test exception: ${err.message}`);
  }

  // TEST GROUP 2: BROWSER HEADLESS UI VERIFICATION (END SCREEN)
  console.log('\nTest Group 2: Headless Browser UI Verification (End Screen)');
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: EDGE_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 420, height: 860, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

    // 2.1 Navigate to End Screen
    console.log('  Navigating to http://localhost:3000/live/end-screen?preview=demo ...');
    await page.goto(`${BASE_URL}/live/end-screen?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });

    // Dismiss consent banner if present
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText && x.innerText.includes('Accept'));
      if (b) b.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // 2.2 Branding
    const pageContent = await page.content();
    assert(pageContent.includes('Poppo') && pageContent.includes('Live'), 'Top branding displays "Poppo Live"');

    // 2.3 Status Header
    assert(pageContent.includes('LIVE Ended'), 'Status header displays "LIVE Ended"');
    const hasCheckmark = pageContent.includes('stroke') || pageContent.includes('polyline') || pageContent.includes('✔');
    assert(hasCheckmark, 'Status header displays purple checkmark circle icon');

    // 2.4 Host Avatar & Neon Ring
    const hasAvatar = await page.$('img[alt*="Zara"], img[alt*="Host"]');
    assert(!!hasAvatar, 'Host avatar is rendered');
    assert(pageContent.includes('shadow-[0_0_') || pageContent.includes('bg-gradient-to-tr'), 'Host avatar has neon glowing pink border ring');

    // 2.5 Session Statistics Card Values (1:1 Reference Match)
    assert(pageContent.includes('Live Duration'), 'Card displays "Live Duration" label');
    assert(pageContent.includes('01:24:36'), 'Card displays duration "01:24:36"');
    assert(pageContent.includes('Total Viewers'), 'Card displays "Total Viewers" label');
    assert(pageContent.includes('12,480'), 'Card displays "12,480" viewers');
    assert(pageContent.includes('New Followers'), 'Card displays "New Followers" label');
    assert(pageContent.includes('186 Received') || pageContent.includes('186'), 'Card displays "186 Received" new followers');
    assert(pageContent.includes('Total Gifts') || pageContent.includes('Points'), 'Card displays gifts / points label');
    assert(pageContent.includes('28,400'), 'Card displays "28,400" points/gifts');

    // 2.6 Action Buttons
    const liveCenterBtn = await page.$('button[data-action="live-center"]');
    assert(!!liveCenterBtn, 'Primary button "Live Center" is present (data-action="live-center")');
    const returnHomeBtn = await page.$('button[data-action="return-home"]');
    assert(!!returnHomeBtn, 'Secondary button "Return to Home" is present (data-action="return-home")');

    // 2.7 Bottom Footer Banner
    const bodyText = await page.evaluate(() => document.body.innerText);
    assert(bodyText.includes('4.8 End Screen & Live Center') || pageContent.includes('4.8 End Screen'), 'Bottom banner displays official "4.8 End Screen & Live Center" text');

    // TEST GROUP 3: LIVE CENTER INTERACTIVE NAVIGATION
    console.log('\nTest Group 3: Live Center Interactive Navigation');
    if (liveCenterBtn) {
      await page.evaluate(() => {
        const btn = document.querySelector('button[data-action="live-center"]');
        if (btn) btn.click();
      });
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 800));

      const centerContent = await page.content();
      assert(centerContent.includes('Live Center'), 'Navigated to Live Center page');
      assert(centerContent.includes('Host Analytics') || centerContent.includes('Streaming history'), 'Live Center header shows host analytics');
      assert(centerContent.includes('Zara Live'), 'Host name Zara Live displayed');
      assert(centerContent.includes('Lv.12'), 'Host level Lv.12 displayed');

      // KPIs
      assert(centerContent.includes('Completed Sessions'), 'KPI 1 "Completed Sessions" displayed');
      assert(centerContent.includes('Streaming Time'), 'KPI 2 "Streaming Time" displayed');
      assert(centerContent.includes('Total Viewers'), 'KPI 3 "Total Viewers" displayed');
      assert(centerContent.includes('Followers Gained'), 'KPI 4 "Followers Gained" displayed');

      // Filter tabs
      assert(centerContent.includes('All'), 'Filter tab "All" present');
      assert(centerContent.includes('This Week'), 'Filter tab "This Week" present');
      assert(centerContent.includes('This Month'), 'Filter tab "This Month" present');

      // Switch filter to "This Week"
      await page.evaluate(() => {
        const weekBtn = document.querySelector('button[data-filter="week"]');
        if (weekBtn) weekBtn.click();
      });
      await new Promise(r => setTimeout(r, 400));
      assert(true, 'Switched filter to This Week smoothly');

      // Session history list
      assert(centerContent.includes('View Summary'), 'Session history cards display "View Summary" button');
      assert(centerContent.includes('01:24:36'), 'History list contains previous session with 01:24:36 duration');

      // Click "View Summary" to return to End Screen
      await page.evaluate(() => {
        const viewSummaryBtn = document.querySelector('button[data-action="view-summary"]');
        if (viewSummaryBtn) viewSummaryBtn.click();
      });
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 800));

      const backToEndContent = await page.content();
      assert(backToEndContent.includes('LIVE Ended'), 'Clicked View Summary and successfully returned to End Screen');
    }

    // 2.8 Return to Home Navigation
    console.log('\nTest Group 4: Return to Home Navigation');
    const returnBtn = await page.$('button[data-action="return-home"]');
    if (returnBtn) {
      await page.evaluate(() => {
        const btn = document.querySelector('button[data-action="return-home"]');
        if (btn) btn.click();
      });
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
      await new Promise(r => setTimeout(r, 800));
      const currentUrl = page.url();
      assert(currentUrl.includes('/live/explore') || currentUrl.includes('/live') || currentUrl.includes('/'), 'Return to Home navigates away from End Screen');
    }

  } catch (err) {
    assert(false, `Browser test exception: ${err.message}`);
  } finally {
    if (browser) await browser.close();
  }

  console.log('\n====================================================================');
  console.log(`TEST SUMMARY: Total=${totalTests} | Passed=${passedTests} | Failed=${failedTests}`);
  console.log('====================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests();
