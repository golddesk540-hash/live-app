const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity\\brain\\d49e7e92-2cbf-4a82-b7ce-920366fb716f';

async function capture() {
  console.log('Launching Edge for Module 4.6 Safety Tools Screenshots...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
  });

  const page = await browser.newPage();

  // 1. Mobile 1:1 view matching 04_06_safety_tools.png
  await page.setViewport({ width: 375, height: 667, deviceScaleFactor: 2 });
  await page.goto(`${BASE_URL}/live/safety?preview=demo`, { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 1200));

  const shot1 = path.join(ARTIFACT_DIR, '01_mobile_safety_tools_1to1.png');
  await page.screenshot({ path: shot1, fullPage: false });
  console.log('Saved:', shot1);

  // 2. Report Form Modal with 6 reasons
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const repBtn = buttons.find(b => b.textContent && b.textContent.includes('Report'));
    if (repBtn) repBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  const shot2 = path.join(ARTIFACT_DIR, '02_mobile_safety_report_form_modal.png');
  await page.screenshot({ path: shot2, fullPage: false });
  console.log('Saved:', shot2);

  // 3. Select Reason & Submit Report -> Success Screen
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const reasonBtn = buttons.find(b => b.textContent && b.textContent.includes('Harassment or bullying'));
    if (reasonBtn) reasonBtn.click();
  });
  await new Promise(r => setTimeout(r, 300));

  // Type in description
  const textarea = await page.$('textarea');
  if (textarea) await textarea.type('Streamer exhibited disrespectful language.');
  await new Promise(r => setTimeout(r, 300));

  // Click Submit
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const subBtn = buttons.find(b => b.textContent && b.textContent.includes('Submit Report'));
    if (subBtn) subBtn.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  const shot3 = path.join(ARTIFACT_DIR, '03_mobile_safety_report_submitted_success.png');
  await page.screenshot({ path: shot3, fullPage: false });
  console.log('Saved:', shot3);

  // 4. Block Confirmation Dialog
  await page.goto(`${BASE_URL}/live/safety?preview=demo`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const blkBtn = buttons.find(b => b.textContent && b.textContent.includes('Block'));
    if (blkBtn) blkBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  const shot4 = path.join(ARTIFACT_DIR, '04_mobile_safety_block_confirmation_dialog.png');
  await page.screenshot({ path: shot4, fullPage: false });
  console.log('Saved:', shot4);

  // 5. Mute Participant Drawer
  await page.goto(`${BASE_URL}/live/safety?preview=demo`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const muteBtn = buttons.find(b => b.textContent && b.textContent.includes('Mute Chat'));
    if (muteBtn) muteBtn.click();
  });
  await new Promise(r => setTimeout(r, 800));

  const shot5 = path.join(ARTIFACT_DIR, '05_mobile_safety_mute_participants_drawer.png');
  await page.screenshot({ path: shot5, fullPage: false });
  console.log('Saved:', shot5);

  // 6. Desktop View
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await page.goto(`${BASE_URL}/live/safety?preview=demo`, { waitUntil: 'networkidle0', timeout: 15000 });
  await new Promise(r => setTimeout(r, 1000));

  const shot6 = path.join(ARTIFACT_DIR, '06_desktop_safety_tools_view.png');
  await page.screenshot({ path: shot6, fullPage: false });
  console.log('Saved:', shot6);

  await browser.close();
  console.log('All safety tools screenshots captured successfully!');
}

capture().catch(err => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
