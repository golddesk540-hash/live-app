const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.join('C:', 'Users', 'HP', '.gemini', 'antigravity', 'brain', 'd49e7e92-2cbf-4a82-b7ce-920366fb716f', 'screenshots', 'd6_p4');

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
        anonymousSessionId: 'disc_shot_p4_' + Date.now(),
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
    // 1. PARTY PANEL TESTS
    // =========================================================================
    console.log('Capturing 01_party_discovery_desktop.png...');
    await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1.5 });
    await page.goto('http://localhost:3000/party', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await delay(1200);
    await page.screenshot({ path: path.join(outDir, '01_party_discovery_desktop.png') });

    // Open first party room interior (9-seat audio stage)
    console.log('Capturing 02_party_room_9seats_interior.png...');
    const partyCard = await page.$('div[data-testid^="party-card-"]');
    if (partyCard) {
      await partyCard.click();
      await delay(1000);
      await page.screenshot({ path: path.join(outDir, '02_party_room_9seats_interior.png') });

      // Request seat and toggle mic
      console.log('Capturing 03_party_seat_request_and_mic.png...');
      const requestSeatBtn = await page.$('button[type="button"]');
      const allBtns = await page.$$('button');
      for (const btn of allBtns) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Request Seat')) {
          await btn.click();
          break;
        }
      }
      await delay(500);
      await page.screenshot({ path: path.join(outDir, '03_party_seat_request_and_mic.png') });

      // Close party room
      const closeRoomBtn = await page.$('button[title="Close Party Room"]');
      if (closeRoomBtn) {
        await closeRoomBtn.click();
        await delay(500);
      }
    }

    // Party Creation Modal
    console.log('Capturing 04_party_create_lounge_modal.png...');
    const createLoungeBtn = await page.$('button[data-testid="party-create-btn"]');
    if (createLoungeBtn) {
      await createLoungeBtn.click();
      await delay(600);
      await page.screenshot({ path: path.join(outDir, '04_party_create_lounge_modal.png') });
      await page.keyboard.press('Escape');
      await delay(400);
    }

    // =========================================================================
    // 2. FOLLOWING PANEL TESTS
    // =========================================================================
    console.log('Capturing 05_following_broadcasters_desktop.png...');
    await page.goto('http://localhost:3000/following', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await delay(1200);
    await page.screenshot({ path: path.join(outDir, '05_following_broadcasters_desktop.png') });

    // Open profile preview modal
    console.log('Capturing 06_following_profile_modal.png...');
    const followingRow = await page.$('div[data-testid^="following-row-"]');
    if (followingRow) {
      await followingRow.click();
      await delay(600);
      await page.screenshot({ path: path.join(outDir, '06_following_profile_modal.png') });
      await page.keyboard.press('Escape');
      await delay(400);
    }

    // =========================================================================
    // 3. MESSAGE PANEL TESTS
    // =========================================================================
    console.log('Capturing 07_message_inbox_desktop.png...');
    await page.goto('http://localhost:3000/inbox', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await delay(1200);
    await page.screenshot({ path: path.join(outDir, '07_message_inbox_desktop.png') });

    // Open Official Notice Screen (Achievements)
    console.log('Capturing 08_official_notice_achievements.png...');
    const noticeButtons = await page.$$('div');
    for (const div of noticeButtons) {
      const text = await page.evaluate(el => el.textContent, div);
      if (text && text.includes('Achievements') && text.includes('Million Diamond')) {
        await div.click();
        break;
      }
    }
    await delay(800);
    await page.screenshot({ path: path.join(outDir, '08_official_notice_achievements.png') });

    // Go back to inbox & open individual chat thread
    console.log('Capturing 09_individual_chat_thread.png...');
    const backBtn = await page.$('button[title="Back to Inbox"]');
    if (backBtn) await backBtn.click();
    await delay(600);

    const firstChatThread = await page.$('div[data-testid^="inbox-thread-"]');
    if (firstChatThread) {
      await firstChatThread.click();
      await delay(800);

      // Send a quick fixture test message
      const composerInput = await page.$('input[placeholder="Write a message..."]');
      if (composerInput) {
        await composerInput.type('Sounds great! Counting down the hours 🎶✨');
        const sendBtn = await page.$('button[title="Send Message"]');
        if (sendBtn) await sendBtn.click();
        await delay(500);
      }
      await page.screenshot({ path: path.join(outDir, '09_individual_chat_thread.png') });
    }

    // =========================================================================
    // 4. PROFILE PANEL TESTS
    // =========================================================================
    console.log('Capturing 10_profile_desktop.png...');
    await page.goto('http://localhost:3000/profile', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await delay(1200);
    await page.screenshot({ path: path.join(outDir, '10_profile_desktop.png') });

    // Copy ID Interaction
    console.log('Capturing 11_profile_copy_id_toast.png...');
    const copyIdBtn = await page.$('button[title="Copy User ID"]');
    if (copyIdBtn) {
      await copyIdBtn.click();
      await delay(400);
      await page.screenshot({ path: path.join(outDir, '11_profile_copy_id_toast.png') });
    }

    // =========================================================================
    // 5. RESPONSIVE MOBILE VIEWPORTS (390x844)
    // =========================================================================
    console.log('Capturing 12_party_mobile_view.png...');
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:3000/party', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await delay(1000);
    await page.screenshot({ path: path.join(outDir, '12_party_mobile_view.png') });

    console.log('Capturing 13_message_mobile_view.png...');
    await page.goto('http://localhost:3000/inbox', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await delay(1000);
    await page.screenshot({ path: path.join(outDir, '13_message_mobile_view.png') });

    console.log('Capturing 14_profile_mobile_view.png...');
    await page.goto('http://localhost:3000/profile', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await delay(1000);
    await page.screenshot({ path: path.join(outDir, '14_profile_mobile_view.png') });

    console.log('All 14 D6-P4 screenshots captured successfully in:', outDir);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('D6-P4 Screenshot script failed:', err);
  process.exit(1);
});
