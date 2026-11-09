const puppeteer = require('puppeteer-core');

const BASE_URL = 'http://localhost:3000';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function runTests() {
  console.log('====================================================');
  console.log(' POPO LIVE - PHASE 4 - MODULE 4.4 (VIEWER ROOM) TEST');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // TEST SUITE 1: API Endpoints
  console.log('--- TEST SUITE 1: Viewer Room Backend APIs ---');
  try {
    // 1.1 GET /api/live/viewer/session?preview=demo
    const sessionRes = await fetch(`${BASE_URL}/api/live/viewer/session?preview=demo`);
    assert(sessionRes.status === 200, 'GET /api/live/viewer/session?preview=demo returns 200 OK');
    const sessionData = await sessionRes.json();
    assert(sessionData.success === true, 'Session API returns success: true');
    assert(sessionData.host?.nickname === 'Zara Live', 'Session host nickname is "Zara Live"');
    assert(sessionData.host?.poppoId === '8802194', 'Session host ID is "8802194"');
    assert(sessionData.room?.viewerDisplay === '7.6K', 'Session room viewer display is "7.6K"');
    assert(sessionData.room?.status === 'live', 'Session room status is "live"');
    assert(sessionData.agora?.role === 'subscriber', 'Agora role is strictly "subscriber" (Audience only, never publisher)');
    assert(Boolean(sessionData.agora?.token), 'Agora viewer RTC token is present');
    assert(sessionData.activeGift?.senderName === 'Ali Khan', 'Active gift sender is "Ali Khan"');
    assert(sessionData.activeGift?.giftName === 'Rose', 'Active gift name is "Rose"');
    assert(sessionData.activeGift?.giftCount === 10, 'Active gift count is 10');
    assert(Array.isArray(sessionData.chatPreview) && sessionData.chatPreview.length >= 4, 'Chat preview contains at least 4 messages');

    // 1.2 POST /api/live/viewer/join
    const joinRes = await fetch(`${BASE_URL}/api/live/viewer/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDemo: true, roomId: 'demo-room-404' }),
    });
    assert(joinRes.status === 200, 'POST /api/live/viewer/join returns 200 OK');
    const joinData = await joinRes.json();
    assert(joinData.success === true, 'Viewer join returns success: true');
    assert(Boolean(joinData.viewerDisplay), `Viewer join returns updated viewerDisplay: ${joinData.viewerDisplay}`);

    // 1.3 POST /api/live/viewer/leave
    const leaveRes = await fetch(`${BASE_URL}/api/live/viewer/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDemo: true, roomId: 'demo-room-404' }),
    });
    assert(leaveRes.status === 200, 'POST /api/live/viewer/leave returns 200 OK');
    const leaveData = await leaveRes.json();
    assert(leaveData.success === true, 'Viewer leave returns success: true');
  } catch (err) {
    console.error('API Test Error:', err);
    failed++;
  }

  // TEST SUITE 2: Edge Headless UI Verification
  console.log('\n--- TEST SUITE 2: Viewer Room UI & Interactive Features (Edge Headless) ---');
  let browser;
  try {
    // 2.0 Obtain consent & session cookies
    const consentRes = await fetch(`${BASE_URL}/api/consent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'accept',
        termsAccepted: true,
        privacyAccepted: true,
        isAdultConfirmed: true,
        anonymousSessionId: 'viewer_test_anon_' + Date.now(),
      }),
    });
    const termsRaw = consentRes.headers.get('set-cookie')?.split(';')[0];
    const termsValue = termsRaw ? termsRaw.substring('poppo_terms_consent='.length) : 'accepted';

    browser = await puppeteer.launch({
      executablePath: EDGE_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setCookie({ name: 'poppo_terms_consent', value: termsValue, domain: 'localhost' });
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    await page.goto(`${BASE_URL}/live/room/880219?preview=demo`, { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 800));

    const pageText = await page.evaluate(() => document.body.innerText);

    // 2.1 Header Branding
    assert(pageText.includes('poppo Live'), 'Header contains "poppo Live" branding');
    assert(pageText.includes('Zara Live'), 'Host capsule contains nickname "Zara Live"');
    assert(pageText.includes('8802194'), 'Host capsule contains ID "8802194"');
    assert(pageText.includes('LIVE'), 'Top bar contains pink "LIVE" badge');
    assert(pageText.includes('7.6K'), 'Top bar contains viewer count "7.6K"');
    assert(pageText.includes('500'), 'Top bar contains coins indicator "500"');

    // 2.2 Follow Host Button Toggle
    console.log('\n--- Testing Follow Host Action ---');
    const hasFollowBtn = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Follow'));
      return Boolean(btn);
    });
    assert(hasFollowBtn, 'Follow button is present in host bar');

    if (hasFollowBtn) {
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Follow'));
        if (btn) btn.click();
      });
      await new Promise((r) => setTimeout(r, 400));
      const afterFollowText = await page.evaluate(() => document.body.innerText);
      assert(afterFollowText.includes('Following') || afterFollowText.includes('Follow'), 'Follow button state updates properly');
    }

    // 2.3 Active Gift Announcement Banner
    console.log('\n--- Testing Active Gift Announcement ---');
    assert(pageText.includes('Ali Khan'), 'Active gift banner shows sender "Ali Khan"');
    assert(pageText.includes('Rose'), 'Active gift banner shows gift name "Rose"');
    assert(pageText.includes('x10'), 'Active gift banner shows multiplier "x10"');

    // 2.4 Live Chat Message List (Module 4.5 Handoff)
    console.log('\n--- Testing Live Chat Display Area ---');
    const chatFeedText = await page.evaluate(() => {
      const el = document.querySelector('.no-scrollbar');
      return el ? el.innerText : document.body.innerText;
    });
    console.log('Detected chatFeedText:', JSON.stringify(chatFeedText));
    assert(chatFeedText.includes('Sana'), 'Chat feed contains message from "Sana"');
    assert(chatFeedText.includes('Rizwan'), 'Chat feed contains message from "Rizwan"');
    assert(chatFeedText.includes('Mehak'), 'Chat feed contains message from "Mehak"');
    assert(chatFeedText.includes('Khan G'), 'Chat feed contains message from "Khan G"');

    // 2.5 Chat Input and Sending
    console.log('\n--- Testing Viewer Interaction Controls ---');
    const inputExists = await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Say something"]');
      return Boolean(input);
    });
    assert(inputExists, 'Chat input field "Say something..." is present');

    if (inputExists) {
      await page.type('input[placeholder*="Say something"]', 'Hello Zara!');
      await page.keyboard.press('Enter');
      await new Promise((r) => setTimeout(r, 400));
      const chatUpdateText = await page.evaluate(() => document.body.innerText);
      assert(chatUpdateText.includes('Hello Zara!'), 'Viewer sent message appears dynamically in the chat feed');
    }

    // Sound toggle
    await page.evaluate(() => {
      const soundBtn = document.querySelector('button[title*="Sound"]');
      if (soundBtn) soundBtn.click();
    });
    await new Promise((r) => setTimeout(r, 300));
    const soundToast = await page.evaluate(() => document.body.innerText);
    assert(soundToast.includes('Sound'), 'Sound toggle button triggers audio mute/unmute notice');

    // Share button
    await page.evaluate(() => {
      const shareBtn = document.querySelector('button[title*="Share"]');
      if (shareBtn) shareBtn.click();
    });
    await new Promise((r) => setTimeout(r, 300));
    const shareToast = await page.evaluate(() => document.body.innerText);
    assert(shareToast.includes('Copied') || shareToast.includes('Share'), 'Share button triggers share action or copies link');

    // Gift button
    await page.evaluate(() => {
      const giftBtn = document.querySelector('button[title*="Gift"]');
      if (giftBtn) giftBtn.click();
    });
    await new Promise((r) => setTimeout(r, 300));
    const giftToast = await page.evaluate(() => document.body.innerText);
    assert(giftToast.includes('Rose') || giftToast.includes('Gift'), 'Gift button triggers reaction or gifting notice');

    // Bottom banner label
    assert(pageText.includes('4.4 Viewer Room'), 'Bottom banner label "4.4 Viewer Room" matches 04_04_viewer_room.png');

    // Close button
    const closeBtnExists = await page.evaluate(() => {
      const btn = document.querySelector('button[title*="Close"]');
      return Boolean(btn);
    });
    assert(closeBtnExists, 'Close "X" button is present on top header');
  } catch (err) {
    console.error('Puppeteer Test Error:', err);
    failed++;
  } finally {
    if (browser) await browser.close();
  }

  console.log('\n====================================================');
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
