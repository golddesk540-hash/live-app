const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.join('C:', 'Users', 'HP', '.gemini', 'antigravity', 'brain', 'd49e7e92-2cbf-4a82-b7ce-920366fb716f', 'screenshots', 'd6_p5');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('Obtaining consent cookie...');
  let termsValue = '';
  try {
    const consentRes = await fetch('http://localhost:3000/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'accept',
        termsAccepted: true,
        privacyAccepted: true,
        isAdultConfirmed: true,
        anonymousSessionId: 'disc_shot_p5_' + Date.now(),
      }),
    });
    const termsRaw = consentRes.headers.get('set-cookie')?.split(';')[0];
    termsValue = termsRaw ? termsRaw.substring('poppo_terms_consent='.length) : '';
  } catch (e) {
    console.warn('Consent fetch failed:', e.message);
  }

  console.log('Launching browser with Edge executable:', edgePath);
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--allow-running-insecure-content',
      '--window-size=1440,1000',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 960 });

    if (termsValue) {
      await page.setCookie({
        name: 'poppo_terms_consent',
        value: termsValue,
        domain: 'localhost',
        path: '/',
      });
    }

    // -------------------------------------------------------------------------
    // TEST 1: Open Live Room 001 (Amina Noor) & Capture Full Desktop Viewer
    // -------------------------------------------------------------------------
    console.log('1. Navigating to /live/room/room_001...');
    await page.goto('http://localhost:3000/live/room/room_001', { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(2000);

    const shot1 = path.join(outDir, '01_web_live_viewer_desktop.png');
    await page.screenshot({ path: shot1, fullPage: false });
    console.log('✓ Captured 01_web_live_viewer_desktop.png');

    // -------------------------------------------------------------------------
    // TEST 2: Send a Chat Message in the Live Chat Panel
    // -------------------------------------------------------------------------
    console.log('2. Testing chat message composer...');
    const chatInputSelector = 'input[placeholder="Say something in live chat..."]';
    await page.waitForSelector(chatInputSelector, { timeout: 10000 });
    await page.click(chatInputSelector);
    await page.type(chatInputSelector, "Amina's acoustic vocals are legendary tonight! 🎶👏❤️");
    await delay(300);
    // Press Enter to submit
    await page.keyboard.press('Enter');
    await delay(1200);

    const shot2 = path.join(outDir, '02_web_live_viewer_chat_sent.png');
    await page.screenshot({ path: shot2, fullPage: false });
    console.log('✓ Captured 02_web_live_viewer_chat_sent.png');

    // -------------------------------------------------------------------------
    // TEST 3: Toggle Host Follow Button
    // -------------------------------------------------------------------------
    console.log('3. Testing host follow interaction...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const follow = btns.find((b) => b.textContent && b.textContent.includes('+ Follow'));
      if (follow) follow.click();
    });
    await delay(800);

    const shot3 = path.join(outDir, '03_web_live_viewer_follow_toggle.png');
    await page.screenshot({ path: shot3, fullPage: false });
    console.log('✓ Captured 03_web_live_viewer_follow_toggle.png');

    // -------------------------------------------------------------------------
    // TEST 4: Open Gift Selection Sheet
    // -------------------------------------------------------------------------
    console.log('4. Opening Gift Selection Sheet...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const gift = btns.find((b) => b.title === 'Open Gift Sheet' || (b.textContent && b.textContent.includes('Gift')));
      if (gift) gift.click();
    });
    await delay(1200);

    const shot4 = path.join(outDir, '04_web_live_viewer_gift_sheet_open.png');
    await page.screenshot({ path: shot4, fullPage: false });
    console.log('✓ Captured 04_web_live_viewer_gift_sheet_open.png');

    // -------------------------------------------------------------------------
    // TEST 5: Select "Super Sports Car" (1,500 coins)
    // -------------------------------------------------------------------------
    console.log('5. Selecting gift Super Sports Car...');
    await page.evaluate(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      const car = divs.find((d) => d.textContent && d.textContent.includes('Super Sports Car'));
      if (car) car.click();
    });
    await delay(600);

    const shot5 = path.join(outDir, '05_web_live_viewer_gift_selected_price.png');
    await page.screenshot({ path: shot5, fullPage: false });
    console.log('✓ Captured 05_web_live_viewer_gift_selected_price.png');

    // -------------------------------------------------------------------------
    // TEST 6: Send Gift Successfully & Verify Balance Update & Overlay
    // -------------------------------------------------------------------------
    console.log('6. Sending gift successfully...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const send = btns.find((b) => b.textContent && b.textContent.includes('Send Gift'));
      if (send) send.click();
    });
    await delay(1500);

    const shot6 = path.join(outDir, '06_web_live_viewer_gift_sent_success.png');
    await page.screenshot({ path: shot6, fullPage: false });
    console.log('✓ Captured 06_web_live_viewer_gift_sent_success.png');

    // -------------------------------------------------------------------------
    // TEST 7: Test Insufficient Balance Handling (Select Luxury Yacht x5 = 250,000 Coins)
    // -------------------------------------------------------------------------
    console.log('7. Testing Insufficient Balance handling (250,000 coins > balance)...');
    // If gift sheet closed after sending, re-open it
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const gift = btns.find((b) => b.title === 'Open Gift Sheet' || (b.textContent && b.textContent.includes('Gift')));
      if (gift) gift.click();
    });
    await delay(800);

    // Select Luxury Yacht (50,000 coins) via data-gift-id
    await page.waitForSelector('[data-gift-id="gift_08"]', { timeout: 5000 });
    await page.click('[data-gift-id="gift_08"]');
    await delay(500);

    // Click multiplier x5
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const x5Btn = btns.find((b) => b.textContent && b.textContent.trim() === 'x5');
      if (x5Btn) x5Btn.click();
    });
    await delay(600);

    const shot7 = path.join(outDir, '07_web_live_viewer_insufficient_balance.png');
    await page.screenshot({ path: shot7, fullPage: false });
    console.log('✓ Captured 07_web_live_viewer_insufficient_balance.png');

    // -------------------------------------------------------------------------
    // TEST 8: Open Get Coins Modal from Gift Sheet
    // -------------------------------------------------------------------------
    console.log('8. Opening Get Coins modal...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const getCoinsBtn = btns.find((b) => b.textContent && b.textContent.includes('Get Coins'));
      if (getCoinsBtn) getCoinsBtn.click();
    });
    await delay(1000);

    const shot8 = path.join(outDir, '08_web_live_viewer_get_coins_modal.png');
    await page.screenshot({ path: shot8, fullPage: false });
    console.log('✓ Captured 08_web_live_viewer_get_coins_modal.png');

    // Close Get Coins modal
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const closeBtn = btns.find((b) => b.querySelector('svg.lucide-x'));
      if (closeBtn) closeBtn.click();
    });
    await delay(500);

    // Close Gift sheet
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const closeBtns = btns.filter((b) => b.querySelector('svg.lucide-x'));
      if (closeBtns.length > 0) closeBtns[0].click();
    });
    await delay(500);

    // -------------------------------------------------------------------------
    // TEST 9: Close Viewer & Return to Live Discovery
    // -------------------------------------------------------------------------
    console.log('9. Closing viewer and returning to Live Discovery...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const exitBtn = btns.find((b) => b.title === 'Return to Live Discovery' || (b.textContent && b.textContent.includes('Live Discovery')));
      if (exitBtn) exitBtn.click();
    });
    await delay(2500);

    const shot9 = path.join(outDir, '09_web_live_viewer_close_and_return_to_discovery.png');
    await page.screenshot({ path: shot9, fullPage: false });
    console.log('✓ Captured 09_web_live_viewer_close_and_return_to_discovery.png');

    // -------------------------------------------------------------------------
    // TEST 10: Open Second Room (room_002 - Sana Ali) to confirm multi-room routing
    // -------------------------------------------------------------------------
    console.log('10. Navigating to room_002 (Sana Ali)...');
    await page.goto('http://localhost:3000/live/room/room_002', { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(2500);

    const shot10 = path.join(outDir, '10_web_live_viewer_second_room_sana_ali.png');
    await page.screenshot({ path: shot10, fullPage: false });
    console.log('✓ Captured 10_web_live_viewer_second_room_sana_ali.png');

    // -------------------------------------------------------------------------
    // TEST 11: Tablet Viewport (768 x 1024)
    // -------------------------------------------------------------------------
    console.log('11. Testing Tablet Viewport (768x1024)...');
    await page.setViewport({ width: 768, height: 1024 });
    await page.goto('http://localhost:3000/live/room/room_001', { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(2000);

    const shot11 = path.join(outDir, '11_web_live_viewer_tablet_view.png');
    await page.screenshot({ path: shot11, fullPage: false });
    console.log('✓ Captured 11_web_live_viewer_tablet_view.png');

    // -------------------------------------------------------------------------
    // TEST 12: Mobile Viewport (390 x 844)
    // -------------------------------------------------------------------------
    console.log('12. Testing Mobile Viewport (390x844)...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await delay(1500);

    const shot12 = path.join(outDir, '12_web_live_viewer_mobile_view.png');
    await page.screenshot({ path: shot12, fullPage: false });
    console.log('✓ Captured 12_web_live_viewer_mobile_view.png');

    // -------------------------------------------------------------------------
    // TEST 13: Mobile Viewport with Gift Sheet Drawer Open
    // -------------------------------------------------------------------------
    console.log('13. Testing Mobile Gift Sheet Drawer...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const gift = btns.find((b) => b.title === 'Open Gift Sheet' || (b.textContent && b.textContent.includes('Gift')));
      if (gift) gift.click();
    });
    await delay(1000);

    const shot13 = path.join(outDir, '13_web_live_viewer_mobile_gift_sheet.png');
    await page.screenshot({ path: shot13, fullPage: false });
    console.log('✓ Captured 13_web_live_viewer_mobile_gift_sheet.png');

    console.log('All 13 test screenshots captured successfully!');
  } catch (err) {
    console.error('Error during test execution:', err);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
