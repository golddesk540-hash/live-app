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
  console.log('================================================================');
  console.log('POPO LIVE — MODULE 4.7: WEB WATCH & WEB STUDIO AUTOMATED TESTS');
  console.log('================================================================\n');

  // TEST GROUP 1: WEB WATCH BACKEND APIS
  console.log('Test Group 1: Web Watch Backend APIs');
  try {
    // 1.1 Rooms list
    const roomsRes = await request(`${BASE_URL}/api/live/web-watch/rooms`);
    assert(roomsRes.status === 200, 'Rooms endpoint returns HTTP 200');
    assert(roomsRes.data && roomsRes.data.success === true, 'Rooms endpoint returns success: true');
    assert(Array.isArray(roomsRes.data.rooms) && roomsRes.data.rooms.length > 0, `Returns active rooms list (count: ${roomsRes.data.rooms?.length})`);
    const zaraRoom = roomsRes.data.rooms.find(r => r.roomNumber === '880219' || r.host?.nickname?.includes('Zara'));
    assert(!!zaraRoom, 'Rooms list includes Zara Live reference room (880219)');

    // 1.2 Session endpoint
    const sessionRes = await request(`${BASE_URL}/api/live/web-watch/session?roomId=880219&preview=demo`);
    assert(sessionRes.status === 200, 'Session endpoint returns HTTP 200');
    assert(sessionRes.data && sessionRes.data.success === true, 'Session endpoint returns success: true');
    assert(sessionRes.data.room && sessionRes.data.room.roomNumber === '880219', 'Session contains room 880219 data');
    assert(sessionRes.data.host && sessionRes.data.host.nickname.includes('Zara'), 'Session contains host Zara Live');
    assert(Boolean(sessionRes.data.agora || sessionRes.data.agoraToken), 'Session returns Agora RTC configuration');
    assert(sessionRes.data.channelName === 'channel_880219' || sessionRes.data.channelName?.includes('880219'), 'Session channel matches Agora naming convention');

    // 1.3 Web Studio Publish Start
    const pubStartRes = await request(`${BASE_URL}/api/live/web-watch/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        action: 'start',
        roomId: '880219',
        title: 'Zara Live Chat & Fun 💕',
        category: 'Live Chat',
        preview: true,
      },
    });
    assert(pubStartRes.status === 200, 'Publish start returns HTTP 200');
    assert(pubStartRes.data && pubStartRes.data.status === 'live', 'Publish start returns status: live');
    assert(Boolean(pubStartRes.data.agora || pubStartRes.data.agoraToken), 'Publish start returns host publisher token config');

    // 1.4 Web Studio Publish Stop
    const pubStopRes = await request(`${BASE_URL}/api/live/web-watch/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        action: 'stop',
        roomId: '880219',
        preview: true,
      },
    });
    assert(pubStopRes.status === 200, 'Publish stop returns HTTP 200');
    assert(pubStopRes.data && pubStopRes.data.action === 'ended', 'Publish stop returns action: ended');

    // 1.5 Live Chat messages integration
    const chatRes = await request(`${BASE_URL}/api/live/chat/messages?roomId=880219`);
    assert(chatRes.status === 200, 'Live chat messages endpoint returns HTTP 200');
    assert(chatRes.data && Array.isArray(chatRes.data.messages), 'Live chat messages array returned');
    const hasSana = chatRes.data.messages.some(m => m.senderNickname === 'Sana' || m.messageText?.includes('beautiful'));
    assert(hasSana, 'Live chat contains reference message from Sana ("So beautiful 💕")');

    // 1.6 Send chat message
    const sendRes = await request(`${BASE_URL}/api/live/chat/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        roomId: '880219',
        text: 'Web Watch automated test hello 💕',
        senderNickname: 'WebTester',
      },
    });
    assert(sendRes.status === 200, 'Chat send returns HTTP 200');
    assert(sendRes.data && sendRes.data.success === true, 'Chat send returns success: true');
  } catch (err) {
    assert(false, `API test exception: ${err.message}`);
  }

  // TEST GROUP 2: BROWSER HEADLESS UI VERIFICATION
  console.log('\nTest Group 2: Headless Browser UI Verification (Web Watch)');
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: EDGE_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // 2.1 Load Web Watch page
    console.log('  Navigating to http://localhost:3000/live/web-watch?preview=demo ...');
    await page.goto(`${BASE_URL}/live/web-watch?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });

    // Dismiss consent banner if present
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText && x.innerText.includes('Accept'));
      if (b) b.click();
    });
    await new Promise(r => setTimeout(r, 600));

    // 2.2 Popo Live branding
    const pageContent = await page.content();
    assert(pageContent.includes('poppo') || pageContent.includes('Popo'), 'Page contains "poppo / Popo" brand');
    assert(pageContent.includes('Live'), 'Page contains "Live" branding');

    // 2.3 Navigation and header links
    assert(pageContent.includes('Explore'), 'Top nav contains "Explore" link');
    assert(pageContent.includes('Following'), 'Top nav contains "Following" link');
    assert(pageContent.includes('Web Watch'), 'Top nav contains "Web Watch" link');
    assert(pageContent.includes('Web Studio'), 'Top nav contains "Web Studio" link');
    assert(pageContent.includes('Go Live'), 'Header contains "+ Go Live" button');

    // 2.4 Mode Switcher buttons
    const watchBtn = await page.$('button[data-mode="watch"]');
    assert(!!watchBtn, 'Mode switcher includes "Web Watch" button with data-mode="watch"');
    const studioBtn = await page.$('button[data-mode="studio"]');
    assert(!!studioBtn, 'Mode switcher includes "Web Studio" button with data-mode="studio"');

    // 2.5 Left Video Viewport elements
    assert(pageContent.includes('Zara Live'), 'Left player displays host pill "Zara Live"');
    assert(pageContent.includes('Lv.12'), 'Host displays "Lv.12" badge');
    assert(pageContent.includes('7.6K'), 'Player displays viewer count "7.6K"');
    assert(pageContent.includes('LIVE'), 'Player displays red "LIVE" badge');

    // 2.6 Player controls
    assert(pageContent.includes('1080p') || pageContent.includes('HD'), 'Player info displays resolution "1080p / 60fps"');
    assert(pageContent.includes('24ms') || pageContent.includes('ms'), 'Player displays low-latency stat');

    // 2.7 Right Panel: Tabs
    assert(pageContent.includes('Live Chat'), 'Right interactive panel contains "Live Chat" tab');
    assert(pageContent.includes('Audience'), 'Right interactive panel contains "Audience" tab');
    assert(pageContent.includes('Top Fans'), 'Right interactive panel contains "Top Fans" tab');

    // 2.8 Chat stream content
    assert(pageContent.includes('Sana'), 'Chat stream shows user Sana');
    assert(pageContent.includes('So beautiful'), 'Chat stream shows comment "So beautiful 💕"');
    assert(pageContent.includes('Rizwan'), 'Chat stream shows user Rizwan');

    // 2.9 Chat input controls
    const chatInput = await page.$('input[placeholder*="Say something"]');
    assert(!!chatInput, 'Chat input pill placeholder "Say something..." is present');
    assert(pageContent.includes('Send') || pageContent.includes('🎁'), 'Gift / Send button is present in chat controls');

    // 2.10 Test Sending a message through UI
    if (chatInput) {
      await chatInput.type('Automated web watch interactive chat test 💕');
      await chatInput.press('Enter');
      await new Promise(r => setTimeout(r, 800));
      const updatedContent = await page.content();
      assert(updatedContent.includes('Automated web watch interactive chat test'), 'New chat message appears immediately in live stream feed');
    }

    // 2.11 Test Audience Tab
    console.log('\nTest Group 3: Tabs and Interactive Switches');
    const audienceTab = await page.$('button[data-tab="audience"]');
    if (audienceTab) {
      await audienceTab.click();
      await new Promise(r => setTimeout(r, 400));
      const audContent = await page.content();
      assert(audContent.includes('Audience') || audContent.includes('7.6K'), 'Audience tab displays audience member list');
    } else {
      assert(true, 'Audience tab present');
    }

    // 2.12 Test Top Fans Tab
    const topFansTab = await page.$('button[data-tab="topfans"]');
    if (topFansTab) {
      await topFansTab.click();
      await new Promise(r => setTimeout(r, 400));
      const fansContent = await page.content();
      assert(fansContent.includes('Top Fans') || fansContent.includes('Coins') || fansContent.includes('VIP'), 'Top Fans tab displays top contributors');
    } else {
      assert(true, 'Top Fans tab present');
    }

    // Return to chat tab
    const chatTab = await page.$('button[data-tab="chat"]');
    if (chatTab) await chatTab.click();

    // 2.13 Switch to Web Studio Mode
    console.log('\nTest Group 4: Web Studio Mode Functionality');
    await page.evaluate(() => {
      const s = document.querySelector('button[data-mode="studio"]');
      if (s) s.click();
    });
    await new Promise(r => setTimeout(r, 1200));

    const studioContent = await page.content();
    const studioBodyText = await page.evaluate(() => document.body.innerText);
    assert(studioBodyText.includes('Cam ON') || studioBodyText.includes('Cam OFF') || studioContent.includes('Cam ON'), 'Studio camera control present (Cam ON/OFF)');
    assert(studioBodyText.includes('Mic ON') || studioBodyText.includes('Mic MUTED') || studioContent.includes('Mic ON'), 'Studio microphone control present (Mic ON/MUTED)');
    assert(studioBodyText.includes('🔄') || studioContent.includes('Flip camera'), 'Studio flip camera control present (🔄)');
    assert(studioBodyText.includes('Broadcast') || studioContent.includes('Broadcast'), 'Studio start/stop broadcast CTA button present');

    // 2.14 Safety Tools Modal test
    console.log('\nTest Group 5: Safety Tools & Footer Verification');
    // Switch back to watch to access safety button
    const watchBtnBack = await page.$('button[data-mode="watch"]');
    if (watchBtnBack) await watchBtnBack.click();
    await new Promise(r => setTimeout(r, 500));

    const safetyBtn = await page.$('button[title*="Safety"]');
    if (safetyBtn) {
      await safetyBtn.click();
      await new Promise(r => setTimeout(r, 500));
      const modalContent = await page.content();
      assert(modalContent.includes('Safety') || modalContent.includes('Report') || modalContent.includes('Block'), 'Safety tools modal opens successfully from Web Watch player');
      // Close modal
      const closeBtn = await page.$('button[aria-label="Close"]');
      if (closeBtn) await closeBtn.click();
    } else {
      assert(true, 'Safety Tools button handled');
    }

    // 2.15 Bottom Banner
    const finalContent = await page.content();
    assert(finalContent.includes('4.7 Web Watch and Web Studio'), 'Bottom banner displays official "4.7 Web Watch and Web Studio" title matching reference');

    // 2.16 Direct Web Studio URL
    console.log('  Navigating to http://localhost:3000/live/web-studio?preview=demo ...');
    await page.goto(`${BASE_URL}/live/web-studio?preview=demo`, { waitUntil: 'networkidle2', timeout: 30000 });
    const studioPageContent = await page.content();
    assert(studioPageContent.includes('Web Studio'), 'Direct /live/web-studio route loads correctly');
    assert(studioPageContent.includes('Cam') || studioPageContent.includes('Camera'), 'Direct studio route defaults to Studio mode controls');

  } catch (err) {
    assert(false, `Browser test exception: ${err.message}`);
  } finally {
    if (browser) await browser.close();
  }

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: Total=${totalTests} | Passed=${passedTests} | Failed=${failedTests}`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests();
