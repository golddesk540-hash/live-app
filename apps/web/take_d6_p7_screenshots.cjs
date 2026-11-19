const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.join('C:', 'Users', 'HP', '.gemini', 'antigravity', 'brain', 'd49e7e92-2cbf-4a82-b7ce-920366fb716f', 'screenshots', 'd6_p7');

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
        anonymousSessionId: 'disc_shot_p7_' + Date.now(),
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
    await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 1.5 });

    if (termsValue) {
      await page.setCookie({
        name: 'poppo_terms_consent',
        value: termsValue,
        domain: 'localhost',
        path: '/',
      });
    }

    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('poppo_terms_consent_version', 'v4.2.0');
      localStorage.setItem('poppo_terms_consent_status', 'accepted');
    });

    // =========================================================================
    // 01: DiscoveryShell & Live Discovery
    // =========================================================================
    console.log('1. Navigating to /live (DiscoveryShell Desktop)...');
    await page.goto('http://localhost:3000/live', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await delay(1500);
    const shot1 = path.join(outDir, '01_discoveryshell_desktop.png');
    await page.screenshot({ path: shot1, fullPage: false });
    console.log('✓ Captured 01_discoveryshell_desktop.png');

    // =========================================================================
    // 02: Web Live Viewer
    // =========================================================================
    console.log('2. Navigating to /live/room/room_001 (Web Viewer)...');
    await page.goto('http://localhost:3000/live/room/room_001', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await delay(2000);
    const shot2 = path.join(outDir, '02_web_viewer_desktop.png');
    await page.screenshot({ path: shot2, fullPage: false });
    console.log('✓ Captured 02_web_viewer_desktop.png');

    // =========================================================================
    // 03: Gift Sheet
    // =========================================================================
    console.log('3. Opening Gift Sheet in Web Viewer...');
    const giftBtn = await page.$('button[title="Open Gift Sheet"]');
    if (giftBtn) {
      await giftBtn.click();
    } else {
      // Find button containing gift icon or Send Gift
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => b.textContent && b.textContent.includes('Gift')) ||
                    btns.find(b => b.getAttribute('title') && b.getAttribute('title').includes('Gift'));
        if (btn) btn.click();
      });
    }
    await delay(1000);
    const shot3 = path.join(outDir, '03_gift_sheet_desktop.png');
    await page.screenshot({ path: shot3, fullPage: false });
    console.log('✓ Captured 03_gift_sheet_desktop.png');

    // =========================================================================
    // 04: Party Discovery
    // =========================================================================
    console.log('4. Navigating to /party (Party Discovery)...');
    await page.goto('http://localhost:3000/party', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await delay(1500);
    const shot4 = path.join(outDir, '04_party_discovery_desktop.png');
    await page.screenshot({ path: shot4, fullPage: false });
    console.log('✓ Captured 04_party_discovery_desktop.png');

    // =========================================================================
    // 05: Party Room 9 Seats Interior
    // =========================================================================
    console.log('5. Opening first Party Room (9 Seats Interior)...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const enterBtn = btns.find(b => b.textContent && b.textContent.includes('Enter Room'));
      if (enterBtn) enterBtn.click();
    });
    await page.waitForSelector('div[data-testid="party-room-view"]', { timeout: 10000 });
    await delay(1000);
    const shot5 = path.join(outDir, '05_party_room_9seats_desktop.png');
    await page.screenshot({ path: shot5, fullPage: false });
    console.log('✓ Captured 05_party_room_9seats_desktop.png');

    // =========================================================================
    // 06: Party Seat Redirect Sheet
    // =========================================================================
    console.log('6. Requesting empty seat to trigger Party Seat Redirect Sheet...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const reqBtn = btns.find(b => b.textContent && b.textContent.includes('Request Seat'));
      if (reqBtn) reqBtn.click();
    });
    await page.waitForSelector('div[data-testid="party-seat-redirect-sheet"]', { timeout: 10000 });
    await delay(1000);
    const shot6 = path.join(outDir, '06_party_seat_redirect_sheet.png');
    await page.screenshot({ path: shot6, fullPage: false });
    console.log('✓ Captured 06_party_seat_redirect_sheet.png');

    // Close party seat redirect sheet and leave room
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[title="Close dialog"]') ||
                       Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Listen in Lounge'));
      if (closeBtn) closeBtn.click();
    });
    await delay(500);

    // =========================================================================
    // 07: Message Inbox
    // =========================================================================
    console.log('7. Navigating to /inbox (Message Inbox)...');
    await page.goto('http://localhost:3000/inbox', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await delay(1500);
    const shot7 = path.join(outDir, '07_message_inbox_desktop.png');
    await page.screenshot({ path: shot7, fullPage: false });
    console.log('✓ Captured 07_message_inbox_desktop.png');

    // =========================================================================
    // 08: Chat Thread View
    // =========================================================================
    console.log('8. Opening first Chat Conversation Thread...');
    const firstChat = await page.$('div[data-testid^="inbox-thread-"]');
    if (firstChat) {
      await firstChat.click();
      await delay(1200);
    }
    const shot8 = path.join(outDir, '08_chat_thread_desktop.png');
    await page.screenshot({ path: shot8, fullPage: false });
    console.log('✓ Captured 08_chat_thread_desktop.png');

    // =========================================================================
    // 09: Profile Screen
    // =========================================================================
    console.log('9. Navigating to /profile (Me Profile Main)...');
    await page.goto('http://localhost:3000/profile', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await delay(1500);
    const shot9 = path.join(outDir, '09_profile_desktop.png');
    await page.screenshot({ path: shot9, fullPage: false });
    console.log('✓ Captured 09_profile_desktop.png');

    // =========================================================================
    // 10: Streamer Center Hub
    // =========================================================================
    console.log('10. Scrolling to Streamer Center Hub...');
    await page.evaluate(() => {
      const el = document.evaluate("//h3[contains(text(),'Streamer Center')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      if (el && el.parentElement) {
        el.parentElement.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    });
    await delay(600);
    const shot10 = path.join(outDir, '10_streamer_center_desktop.png');
    await page.screenshot({ path: shot10, fullPage: false });
    console.log('✓ Captured 10_streamer_center_desktop.png');

    // =========================================================================
    // 11: Builder Center Hub (My Agency Roster Modal)
    // =========================================================================
    console.log('11. Opening My Agency Roster Modal in Builder Center...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const agencyBtn = btns.find(b => b.textContent && b.textContent.includes('My Agency'));
      if (agencyBtn) agencyBtn.click();
    });
    await delay(800);
    const shot11 = path.join(outDir, '11_builder_center_desktop.png');
    await page.screenshot({ path: shot11, fullPage: false });
    console.log('✓ Captured 11_builder_center_desktop.png');

    // Close agency modal
    await page.evaluate(() => {
      const closeBtn = document.querySelector('button[title="Close Agency Roster"]') ||
                       document.querySelector('button:has(svg.lucide-x)');
      if (closeBtn) closeBtn.click();
    });
    await delay(500);

    // =========================================================================
    // 12: Go Live Redirect Sheet
    // =========================================================================
    console.log('12. Triggering + Go Live to open Go Live Redirect Sheet...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const goLiveBtn = btns.find(b => b.textContent && b.textContent.includes('+ Go Live'));
      if (goLiveBtn) goLiveBtn.click();
    });
    await delay(800);
    const shot12 = path.join(outDir, '12_go_live_redirect_sheet.png');
    await page.screenshot({ path: shot12, fullPage: false });
    console.log('✓ Captured 12_go_live_redirect_sheet.png');

    // Close Go Live sheet
    await page.evaluate(() => {
      const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Continue on Web'));
      if (cancelBtn) cancelBtn.click();
    });
    await delay(500);

    // =========================================================================
    // 13: Redeem Voucher Code Success
    // =========================================================================
    console.log('13. Opening Redeem Code Modal and submitting POPO-WELCOME-2026...');
    await page.evaluate(() => {
      // Scroll to Account & Services
      const rows = Array.from(document.querySelectorAll('div'));
      const redeemRow = rows.find(r => r.textContent && r.textContent.includes('Redeem Code') && r.getAttribute('class')?.includes('cursor-pointer'));
      if (redeemRow) redeemRow.click();
    });
    await delay(600);

    // Type the voucher code and submit
    const codeInput = await page.$('input[placeholder="e.g. POPO-WELCOME-2026"]');
    if (codeInput) {
      await codeInput.type('POPO-WELCOME-2026');
      await delay(300);
      await page.keyboard.press('Enter');
      await delay(800);
    }
    const shot13 = path.join(outDir, '13_redeem_code_success.png');
    await page.screenshot({ path: shot13, fullPage: false });
    console.log('✓ Captured 13_redeem_code_success.png');

    console.log('\nAll 13 D6-P7 screenshots captured successfully!');
  } catch (err) {
    console.error('Error during screenshot capture:', err);
  } finally {
    await browser.close();
  }
}

main();
