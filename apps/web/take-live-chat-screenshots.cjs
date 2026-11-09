const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f';

async function capture() {
  console.log('Launching Edge for Module 4.5 Live Chat Screenshots...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
  });

  const page = await browser.newPage();

  // 1. Mobile 1:1 view matching 04_05_live_chat.png
  await page.setViewport({ width: 375, height: 667, deviceScaleFactor: 2 });
  await page.goto(`${BASE_URL}/live/chat?preview=demo`, { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 1200));

  const shot1 = path.join(ARTIFACT_DIR, '01_mobile_live_chat_1to1.png');
  await page.screenshot({ path: shot1, fullPage: false });
  console.log('Saved:', shot1);

  // 2. Audience Tab
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const audBtn = buttons.find(b => b.textContent && b.textContent.trim() === 'Audience');
    if (audBtn) audBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  const shot2 = path.join(ARTIFACT_DIR, '02_mobile_live_chat_audience_tab.png');
  await page.screenshot({ path: shot2, fullPage: false });
  console.log('Saved:', shot2);

  // 3. Top Fans Tab
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const fansBtn = buttons.find(b => b.textContent && b.textContent.trim() === 'Top Fans');
    if (fansBtn) fansBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  const shot3 = path.join(ARTIFACT_DIR, '03_mobile_live_chat_top_fans_tab.png');
  await page.screenshot({ path: shot3, fullPage: false });
  console.log('Saved:', shot3);

  // 4. Emoji Palette
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const chatBtn = buttons.find(b => b.textContent && b.textContent.trim() === 'Chat');
    if (chatBtn) chatBtn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Click Smiley button to open emoji picker
  await page.click('button[aria-label="Insert Emoji"]');
  await new Promise(r => setTimeout(r, 500));

  const shot4 = path.join(ARTIFACT_DIR, '04_mobile_live_chat_emoji_palette.png');
  await page.screenshot({ path: shot4, fullPage: false });
  console.log('Saved:', shot4);

  // 5. Message Sent
  const inputSelector = 'input[placeholder="Say something..."]';
  await page.type(inputSelector, 'Love the music vibe tonight! 💕');
  await new Promise(r => setTimeout(r, 400));
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1000));

  const shot5 = path.join(ARTIFACT_DIR, '05_mobile_live_chat_message_sent.png');
  await page.screenshot({ path: shot5, fullPage: false });
  console.log('Saved:', shot5);

  // 6. Desktop View
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await page.goto(`${BASE_URL}/live/chat?preview=demo`, { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 1000));

  const shot6 = path.join(ARTIFACT_DIR, '06_desktop_live_chat_view.png');
  await page.screenshot({ path: shot6, fullPage: false });
  console.log('Saved:', shot6);

  await browser.close();
  console.log('All screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
