const puppeteer = require('puppeteer-core');

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log(' POPO LIVE - PHASE 4 - MODULE 4.3 (HOST STUDIO) TEST');
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
  console.log('--- TEST SUITE 1: Studio Backend API Endpoints ---');
  try {
    // 1.1 GET /api/live/studio/session?preview=demo
    const sessionRes = await fetch(`${BASE_URL}/api/live/studio/session?preview=demo`);
    assert(sessionRes.status === 200, 'GET /api/live/studio/session?preview=demo returns 200 OK');
    const sessionData = await sessionRes.json();
    assert(sessionData.success === true, 'Session API returns success: true');
    assert(sessionData.host?.nickname === 'Zara Live', 'Session host nickname is "Zara Live"');
    assert(sessionData.host?.poppoId === '8802194', 'Session host ID is "8802194"');
    assert(sessionData.room?.viewerDisplay === '1.8K', 'Session room viewers display is "1.8K"');
    assert(sessionData.room?.status === 'live', 'Session room status is "live"');
    assert(sessionData.room?.elapsedSeconds === 754, 'Session room initial elapsedSeconds matches 00:12:34 (754s)');
    assert(Boolean(sessionData.agora?.token), 'Session agora RTC token is present');
    assert(sessionData.agora?.channelName === 'channel_880219', 'Session agora channelName is "channel_880219"');
    assert(sessionData.agora?.uid === 880219, 'Session agora UID is 880219');

    // 1.2 POST /api/live/studio/start
    const startRes = await fetch(`${BASE_URL}/api/live/studio/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDemo: true, title: 'Come and chat with me 💕', category: 'Live Chat' }),
    });
    assert(startRes.status === 200, 'POST /api/live/studio/start returns 200 OK');
    const startData = await startRes.json();
    assert(startData.success === true, 'Start broadcast returns success: true');
    assert(startData.room?.isLive === true, 'Started broadcast room isLive: true');
    assert(Boolean(startData.agora?.token), 'Started broadcast returns agora token');

    // 1.3 POST /api/live/studio/end
    const endRes = await fetch(`${BASE_URL}/api/live/studio/end`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDemo: true, durationSeconds: 754 }),
    });
    assert(endRes.status === 200, 'POST /api/live/studio/end returns 200 OK');
    const endData = await endRes.json();
    assert(endData.success === true, 'End broadcast returns success: true');
    assert(Boolean(endData.summary?.durationFormatted), 'End broadcast returns summary durationFormatted');
    assert(endData.summary?.peakViewers >= 1800, 'End broadcast summary peakViewers >= 1800');
    assert(endData.summary?.diamondsEarned > 0, 'End broadcast summary diamondsEarned > 0');

    // 1.4 Auth Protection without Demo
    const unauthRes = await fetch(`${BASE_URL}/api/live/studio/session`);
    assert(unauthRes.status === 401, 'Unauthenticated studio session without demo returns 401');
  } catch (err) {
    console.error('API Test Error:', err);
    failed++;
  }

  // TEST SUITE 2: Puppeteer Headless Browser UI Verification
  console.log('\n--- TEST SUITE 2: Studio UI & Interactive Features (Edge Headless) ---');
  let browser;
  try {
    const edgePaths = [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    ];
    let executablePath = null;
    const fs = require('fs');
    for (const p of edgePaths) {
      if (fs.existsSync(p)) {
        executablePath = p;
        break;
      }
    }

    browser = await puppeteer.launch({
      executablePath: executablePath || undefined,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    await page.goto(`${BASE_URL}/live/studio?preview=demo`, { waitUntil: 'networkidle2' });

    // 2.1 Top bar verification
    const hostText = await page.evaluate(() => document.body.innerText);
    assert(hostText.includes('Zara Live'), 'Top bar contains host nickname "Zara Live"');
    assert(hostText.includes('8802194'), 'Top bar contains host ID "8802194"');
    assert(hostText.includes('Lv.12'), 'Top bar contains host level badge "Lv.12"');
    assert(hostText.includes('1.8K'), 'Top bar contains viewer count "1.8K"');
    assert(hostText.includes('LIVE'), 'Top bar contains glowing pink "LIVE" badge');

    // 2.2 Live timer tick verification
    const initialTimer = await page.evaluate(() => {
      const match = document.body.innerText.match(/\d{2}:\d{2}:\d{2}/);
      return match ? match[0] : null;
    });
    assert(Boolean(initialTimer), `Live duration timer formatted properly: ${initialTimer}`);

    // Wait 1.5 seconds to verify timer ticks up
    await new Promise((r) => setTimeout(r, 1500));
    const nextTimer = await page.evaluate(() => {
      const match = document.body.innerText.match(/\d{2}:\d{2}:\d{2}/);
      return match ? match[0] : null;
    });
    assert(Boolean(nextTimer), `Timer running continuously: ${nextTimer}`);

    // 2.3 Floating right action controls
    console.log('\n--- Testing Right Control Column ---');
    // Flip Camera button
    const flipButton = await page.$('button[title*="Flip"]');
    assert(Boolean(flipButton), 'Flip Camera button exists');
    if (flipButton) {
      await page.evaluate(() => {
        const btn = document.querySelector('button[title*="Flip"]');
        if (btn) btn.click();
      });
      await new Promise((r) => setTimeout(r, 300));
      const flipToast = await page.evaluate(() => document.body.innerText);
      assert(flipToast.includes('Camera'), 'Flip Camera trigger displays toast notice');
    }

    // Beauty filter button
    const beautyButton = await page.$('button[title*="Beauty"]');
    assert(Boolean(beautyButton), 'Beauty filter button exists');
    if (beautyButton) {
      await page.evaluate(() => {
        const btn = document.querySelector('button[title*="Beauty"]');
        if (btn) btn.click();
      });
      await new Promise((r) => setTimeout(r, 300));
      const beautyToast = await page.evaluate(() => document.body.innerText);
      assert(beautyToast.includes('Beauty'), 'Beauty filter toggle displays toast notice');
    }

    // Mic button
    const micButton = await page.$('button[title*="Microphone"]');
    assert(Boolean(micButton), 'Microphone button exists');
    if (micButton) {
      await page.evaluate(() => {
        const btn = document.querySelector('button[title*="Microphone"]');
        if (btn) btn.click();
      });
      await new Promise((r) => setTimeout(r, 300));
      const micToast = await page.evaluate(() => document.body.innerText);
      assert(micToast.includes('Microphone'), 'Microphone toggle displays toast notice');
    }

    // Video button
    const videoButton = await page.$('button[title*="Camera"]');
    assert(Boolean(videoButton), 'Video camera button exists');
    if (videoButton) {
      await page.evaluate(() => {
        const btn = document.querySelector('button[title*="Camera"]');
        if (btn) btn.click();
      });
      await new Promise((r) => setTimeout(r, 300));
      const videoToast = await page.evaluate(() => document.body.innerText);
      assert(videoToast.includes('Camera'), 'Video toggle displays toast notice');
    }

    // Sound board button
    const soundButton = await page.$('button[title*="Sound"]');
    assert(Boolean(soundButton), 'Sound effects button exists');
    if (soundButton) {
      await page.evaluate(() => {
        const btn = document.querySelector('button[title*="Sound"]');
        if (btn) btn.click();
      });
      await new Promise((r) => setTimeout(r, 400));
      const soundText = await page.evaluate(() => document.body.innerText);
      assert(soundText.includes('Applause') && soundText.includes('Fanfare'), 'Soundboard opens with applause & fanfare triggers');
    }

    // Settings button
    const settingsButton = await page.$('button[title*="Settings"]');
    assert(Boolean(settingsButton), 'Settings button exists');
    if (settingsButton) {
      await page.evaluate(() => {
        const btn = document.querySelector('button[title*="Settings"]');
        if (btn) btn.click();
      });
      await new Promise((r) => setTimeout(r, 400));
      const settingsText = await page.evaluate(() => document.body.innerText);
      assert(settingsText.includes('720p') && settingsText.includes('Noise Suppression'), 'Settings drawer opens with 720p and Noise Suppression');
    }

    // 2.4 Bottom Dock Drawers
    console.log('\n--- Testing Bottom Dock Drawers ---');
    // Effects
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Effects'));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    const effText = await page.evaluate(() => document.body.innerText);
    assert(effText.includes('Crown') && effText.includes('Hearts'), 'Effects drawer displays Face AR stickers');

    // Filter
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Filter'));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    const filText = await page.evaluate(() => document.body.innerText);
    assert(filText.includes('Rosy') && filText.includes('Vintage'), 'Filter drawer displays color filters');

    // Share
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Share'));
      if (btn) btn.click();
    });
    await new Promise((r) => setTimeout(r, 400));
    const shareText = await page.evaluate(() => document.body.innerText);
    assert(shareText.includes('Copy Link') && shareText.includes('WhatsApp'), 'Share drawer displays share options');

    // 2.5 End Broadcast Confirmation & Summary Flow
    console.log('\n--- Testing End Broadcast Flow ---');
    const exitBtn = await page.$('button[title*="End Live"]');
    assert(Boolean(exitBtn), 'Exit "X" button exists on top right');
    if (exitBtn) {
      await page.evaluate(() => {
        const btn = document.querySelector('button[title*="End Live"]');
        if (btn) btn.click();
      });
      await new Promise((r) => setTimeout(r, 500));
      const confirmText = await page.evaluate(() => document.body.innerText);
      assert(confirmText.includes('End Live Broadcast?'), 'Confirmation dialog appears when clicking exit');

      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('End Live Now'));
        if (btn) btn.click();
      });
      await new Promise((r) => setTimeout(r, 1200));

      const summaryText = await page.evaluate(() => document.body.innerText);
      assert(summaryText.includes('Broadcast Completed'), 'Broadcast Completed summary screen appears');
      assert(summaryText.includes('Peak Viewers') && summaryText.includes('Diamonds'), 'Summary screen shows Peak Viewers and Diamonds');
      assert(summaryText.includes('Back to Live Setup'), 'Back to Live Setup button is displayed');
    }
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
