const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
const { Pool } = require('pg');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.join('d:', 'popo live', 'docs', 'screenshots', 'phase2_prompt8');

async function main() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const pool = new Pool({
    connectionString: 'postgresql://nordleads:local-platform-password@127.0.0.1:55432/nordleads?schema=popolive',
  });

  // Get or use existing demo user
  let uRows = await pool.query("SELECT id, poppo_id, email FROM popolive.users WHERE poppo_id = '88992211' OR email = 'sara.streamer@popolive.com' LIMIT 1");
  let userId;
  let poppoId;
  let email;

  if (uRows.rows.length === 0) {
    const uIns = await pool.query(`
      INSERT INTO popolive.users (
        poppo_id, email, nickname, avatar_url, gender, birthdate, country, country_code,
        bio, host_level, wealth_level, is_profile_completed, is_adult_verified, status, preferred_language
      ) VALUES (
        '88992299', 'sara.streamer@popolive.com', 'Sara Khan', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
        'female', '1998-08-15', 'Pakistan', 'PK', 'Daily Streamer', 12, 8, true, true, 'active', 'en'
      ) RETURNING id, poppo_id, email
    `);
    userId = uIns.rows[0].id;
    poppoId = uIns.rows[0].poppo_id;
    email = uIns.rows[0].email;
  } else {
    userId = uRows.rows[0].id;
    poppoId = uRows.rows[0].poppo_id;
    email = uRows.rows[0].email;
  }

  // Ensure active session for Sara Khan
  const token = 'demo_help_session_token_' + Date.now();
  await pool.query(`
    INSERT INTO popolive.sessions (user_id, session_token, expires_at)
    VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '7 days')
  `, [userId, token]);

  // Ensure at least one ticket with reply exists for demo
  const ticketNum = 'TK-20261108-8821';
  let tRows = await pool.query('SELECT id FROM popolive.support_tickets WHERE ticket_number = $1', [ticketNum]);
  let ticketId;

  if (tRows.rows.length === 0) {
    const tIns = await pool.query(`
      INSERT INTO popolive.support_tickets (
        ticket_number, user_id, full_name, email, poppo_id, category, subject, description, status, priority
      ) VALUES (
        $1, $2, 'Sara Khan', $3, $4, 'payments_recharge',
        'Delayed Coin Delivery for 100,000 Coins Package',
        'Payment of $10.00 succeeded on my Visa card (ref: 4429) but the coins have not reflected in my wallet after 20 minutes.',
        'in_progress', 'high'
      ) RETURNING id
    `, [ticketNum, userId, email, poppoId]);
    ticketId = tIns.rows[0].id;

    // Add user message
    await pool.query(`
      INSERT INTO popolive.ticket_replies (ticket_id, sender_id, sender_type, sender_name, message)
      VALUES ($1, $2, 'user', 'Sara Khan', 'Payment of $10.00 succeeded on my Visa card (ref: 4429) but the coins have not reflected in my wallet after 20 minutes.')
    `, [ticketId, userId]);

    // Add official support reply
    await pool.query(`
      INSERT INTO popolive.ticket_replies (ticket_id, sender_type, sender_name, message)
      VALUES ($1, 'support', 'Popo Support Specialist', 'Hello Sara, thank you for contacting Popo Live Support. We have verified your transaction reference 4429 with our payment processor. The gateway batch settlement is currently updating and your 100,000 coins will reflect in your wallet shortly. Please let us know if you need any further assistance!')
    `, [ticketId]);
  } else {
    ticketId = tRows.rows[0].id;
  }

  await pool.end();

  // Obtain signed consent cookie from API
  const consentRes = await fetch('http://localhost:3000/api/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'accept',
      termsAccepted: true,
      privacyAccepted: true,
      isAdultConfirmed: true,
      anonymousSessionId: 'help_screenshot_anon_' + Date.now(),
    }),
  });
  const termsRaw = consentRes.headers.get('set-cookie')?.split(';')[0];
  const termsValue = termsRaw ? termsRaw.substring('poppo_terms_consent='.length) : '';

  console.log('Launching browser for screenshot capture...');
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Set cookies for session & terms consent
  await page.setCookie(
    { name: 'poppo_session', value: token, domain: 'localhost', path: '/' },
    { name: 'poppo_terms_consent', value: termsValue, domain: 'localhost', path: '/' }
  );

  // 1. Mobile Help Center (matches 02_08_help_feedback.png)
  console.log('Capturing 01_mobile_help_center.png...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000/help', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(outDir, '01_mobile_help_center.png') });

  // 2. Desktop Help Center
  console.log('Capturing 02_desktop_help_center.png...');
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:3000/help', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, '02_desktop_help_center.png') });

  // 3. Mobile Contact Support / Submit Ticket
  console.log('Capturing 03_mobile_contact_ticket.png...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:3000/help/contact', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, '03_mobile_contact_ticket.png') });

  // 4. Mobile My Tickets List
  console.log('Capturing 04_mobile_my_tickets.png...');
  await page.goto('http://localhost:3000/help/my-tickets', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, '04_mobile_my_tickets.png') });

  // 5. Mobile Ticket Details with Conversation Replies
  console.log('Capturing 05_mobile_ticket_detail.png...');
  await page.goto(`http://localhost:3000/help/ticket/${ticketId}`, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, '05_mobile_ticket_detail.png') });

  // 6. Mobile Feedback Page
  console.log('Capturing 06_mobile_feedback.png...');
  await page.goto('http://localhost:3000/feedback', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, '06_mobile_feedback.png') });

  // 7. Mobile Report a Problem Page
  console.log('Capturing 07_mobile_report_problem.png...');
  await page.goto('http://localhost:3000/help/report-problem', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(outDir, '07_mobile_report_problem.png') });

  await browser.close();
  console.log('🎉 All 7 screenshots captured successfully in:', outDir);
}

main().catch((err) => {
  console.error('Screenshot script error:', err);
  process.exit(1);
});
