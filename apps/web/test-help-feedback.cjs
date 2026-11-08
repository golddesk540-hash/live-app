const http = require('http');

const BASE_URL = 'http://localhost:3000';

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.url || (BASE_URL + options.path));
    const reqOptions = {
      method: options.method || 'GET',
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          json,
        });
      });
    });

    req.on('error', reject);

    if (body) {
      if (typeof body === 'string') {
        req.write(body);
      } else if (Buffer.isBuffer(body)) {
        req.write(body);
      } else {
        req.setHeader('Content-Type', 'application/json');
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(message);
  } else {
    console.log(`✅ [PASS] ${message}`);
  }
}

async function runTests() {
  console.log('=======================================================');
  console.log('🧪 RUNNING POPO LIVE PHASE 2 PROMPT 08 TEST SUITE');
  console.log('=======================================================\n');

  let passed = 0;

  // 1. Check HTTP Status of Pages
  console.log('--- TEST GROUP 1: FRONTEND PAGES STATUS CODES ---');
  const pages = ['/help', '/help/contact', '/help/my-tickets', '/help/report-problem', '/feedback'];
  for (const page of pages) {
    const res = await request({ path: page });
    assert(res.statusCode === 200, `Page ${page} returns HTTP 200 OK`);
    passed++;
  }

  // 2. Help Categories API
  console.log('\n--- TEST GROUP 2: HELP CATEGORIES API ---');
  const catRes = await request({ path: '/api/help/categories' });
  assert(catRes.statusCode === 200, 'GET /api/help/categories returns 200');
  assert(Array.isArray(catRes.json?.categories), 'Categories array returned');
  assert(catRes.json.categories.length >= 9, `All 9 categories present (found ${catRes.json.categories.length})`);
  passed += 3;

  // 3. Help FAQs API
  console.log('\n--- TEST GROUP 3: HELP FAQS API & FILTERING ---');
  const faqRes = await request({ path: '/api/help/faqs' });
  assert(faqRes.statusCode === 200, 'GET /api/help/faqs returns 200');
  assert(faqRes.json?.faqs?.length >= 10, `Seeded FAQs returned (found ${faqRes.json?.faqs?.length})`);
  const firstFaq = faqRes.json.faqs[0];
  assert(firstFaq.question_en && firstFaq.question_ur, 'FAQs have bilingual English and Urdu questions');

  // Filter by category
  const filteredFaqRes = await request({ path: `/api/help/faqs?category=${firstFaq.category}` });
  assert(filteredFaqRes.json?.faqs?.every(f => f.category === firstFaq.category), 'Filtering FAQs by category works');
  passed += 4;

  // 4. Rate FAQ Helpful
  console.log('\n--- TEST GROUP 4: FAQ RATING API ---');
  const initialHelpful = firstFaq.helpful_count || 0;
  const rateRes = await request(
    { path: `/api/help/faqs/${firstFaq.id}/rating`, method: 'POST' },
    { isHelpful: true }
  );
  assert(rateRes.statusCode === 200, 'POST /api/help/faqs/:faqId/rating returns 200');
  assert(rateRes.json?.helpfulCount >= initialHelpful, 'Helpful count incremented/recorded');
  passed += 2;

  // 5. Help Search API
  console.log('\n--- TEST GROUP 5: HELP SEARCH API ---');
  const searchRes = await request({ path: '/api/help/search?q=account' });
  assert(searchRes.statusCode === 200, 'GET /api/help/search returns 200');
  assert(searchRes.json?.faqs?.length > 0 || searchRes.json?.articles?.length > 0, 'Search returned matching results');

  // Empty state search
  const emptySearchRes = await request({ path: '/api/help/search?q=xyznonexistentterm999' });
  assert(emptySearchRes.json?.totalResults === 0, 'Non-matching query returns 0 results for empty state');
  passed += 3;

  // 6. Test User Authentication Setup (Terms Consent + Register dedicated test user)
  console.log('\n--- TEST GROUP 6: AUTHENTICATION & SECURITY ENFORCEMENT ---');
  // Terms consent
  const consentRes = await request(
    { path: '/api/consent', method: 'POST' },
    {
      action: 'accept',
      termsAccepted: true,
      privacyAccepted: true,
      isAdultConfirmed: true,
      anonymousSessionId: 'help_test_anon_' + Date.now(),
    }
  );
  const termsCookie = consentRes.headers['set-cookie']?.find(c => c.startsWith('poppo_terms_consent='))?.split(';')[0];
  assert(Boolean(termsCookie), 'Terms gate consent token obtained');

  // Register user
  const now = Date.now();
  const testEmail = `help_user_${now}@popolive.com`;
  const regRes = await request(
    {
      path: '/api/auth/register',
      method: 'POST',
      headers: { Cookie: termsCookie },
    },
    {
      email: testEmail,
      password: 'StrongPassword123!',
      nickname: 'HelpTester_' + String(now).slice(-4),
      isAdultConfirmed: true,
    }
  );
  assert(regRes.statusCode === 200, 'Test user registered successfully');
  const authCookie = regRes.headers['set-cookie']?.find(c => c.startsWith('poppo_session='))?.split(';')[0];
  assert(Boolean(authCookie), 'Session token cookie obtained');

  const authCookieHeader = `${termsCookie}; ${authCookie}`;
  const testUser = regRes.json?.user;

  // Unauthorized check on /api/help/tickets/me without session
  const unauthRes = await request({ path: '/api/help/tickets/me' });
  assert(unauthRes.statusCode === 401, 'Unauthorized GET /api/help/tickets/me rejected with 401');
  passed += 4;

  // 7. Submit Support Ticket
  console.log('\n--- TEST GROUP 7: SUBMIT SUPPORT TICKET API ---');
  // Validation checks
  const invalidTicket1 = await request(
    { path: '/api/help/tickets', method: 'POST' },
    { fullName: '', email: 'bademail', subject: 'hi' }
  );
  assert(invalidTicket1.statusCode === 400, 'Validation: empty name & bad email rejected with 400');

  // Valid ticket submission
  const validTicketPayload = {
    fullName: testUser.nickname,
    email: testUser.email,
    poppoId: testUser.poppoId,
    category: 'payments_recharge',
    subject: 'Coin Recharge Did Not Reflect in Wallet',
    description: 'I recharged 100,000 coins via credit card but my wallet balance still shows previous amount.',
  };

  const createTicketRes = await request(
    {
      path: '/api/help/tickets',
      method: 'POST',
      headers: { Cookie: authCookieHeader },
    },
    validTicketPayload
  );

  assert(createTicketRes.statusCode === 200, 'Valid support ticket creation returns 200 OK');
  assert(createTicketRes.json?.ticketNumber?.startsWith('TK-'), `Ticket number generated with proper format: ${createTicketRes.json?.ticketNumber}`);
  const createdTicketId = createTicketRes.json?.ticketId;
  assert(Boolean(createdTicketId), 'Ticket ID returned');
  passed += 4;

  // 8. Fetch My Tickets
  console.log('\n--- TEST GROUP 8: MY SUPPORT TICKETS ---');
  const myTicketsRes = await request({
    path: '/api/help/tickets/me',
    headers: { Cookie: authCookieHeader },
  });
  assert(myTicketsRes.statusCode === 200, 'Authenticated GET /api/help/tickets/me returns 200');
  assert(myTicketsRes.json?.tickets?.length > 0, `User tickets list retrieved (count: ${myTicketsRes.json?.tickets?.length})`);
  const foundTicket = myTicketsRes.json?.tickets?.find(t => t.id === createdTicketId);
  assert(Boolean(foundTicket), 'Newly created ticket found in user tickets list');
  passed += 3;

  // 9. Fetch Ticket Details and Thread Replies
  console.log('\n--- TEST GROUP 9: TICKET DETAILS & REPLIES ---');
  const ticketDetailRes = await request({
    path: `/api/help/tickets/${createdTicketId}`,
    headers: { Cookie: authCookieHeader },
  });
  assert(ticketDetailRes.statusCode === 200, 'GET /api/help/tickets/:id returns 200');
  assert(ticketDetailRes.json?.ticket?.ticket_number === createTicketRes.json.ticketNumber, 'Ticket details match');
  assert(ticketDetailRes.json?.replies?.length >= 1, 'Initial description present as first thread message');

  // Post a user reply
  const replyRes = await request(
    {
      path: `/api/help/tickets/${createdTicketId}/replies`,
      method: 'POST',
      headers: { Cookie: authCookieHeader },
    },
    { message: 'Attaching my bank statement reference: TXN-99882211.' }
  );
  assert(replyRes.statusCode === 200, 'POST reply to ticket returns 200 OK');
  assert(replyRes.json?.reply?.message.includes('TXN-99882211'), 'Reply successfully saved in conversation thread');
  passed += 5;

  // 10. Close Ticket & Verify Reply Guard
  console.log('\n--- TEST GROUP 10: TICKET CLOSURE & REPLY GUARD ---');
  const closeRes = await request(
    {
      path: `/api/help/tickets/${createdTicketId}`,
      method: 'PATCH',
      headers: { Cookie: authCookieHeader },
    },
    { action: 'close' }
  );
  assert(closeRes.statusCode === 200, 'PATCH close ticket returns 200 OK');
  assert(closeRes.json?.status === 'closed', 'Ticket status marked as closed');

  // Verify that new replies to closed ticket are rejected
  const closedReplyRes = await request(
    {
      path: `/api/help/tickets/${createdTicketId}/replies`,
      method: 'POST',
      headers: { Cookie: authCookieHeader },
    },
    { message: 'Trying to reply to closed ticket' }
  );
  assert(closedReplyRes.statusCode === 400, 'Replying to closed ticket correctly blocked with 400');
  passed += 3;

  // 11. User Feedback System
  console.log('\n--- TEST GROUP 11: USER FEEDBACK SYSTEM ---');
  const invalidFeedback = await request(
    { path: '/api/help/feedback', method: 'POST' },
    { feedbackType: 'general_feedback', subject: 'ok', message: '', rating: 0 }
  );
  assert(invalidFeedback.statusCode === 400, 'Invalid feedback (empty message, rating 0) rejected with 400');

  const validFeedback = await request(
    {
      path: '/api/help/feedback',
      method: 'POST',
      headers: { Cookie: authCookieHeader },
    },
    {
      feedbackType: 'feature_request',
      subject: 'Add Dark Mode Accent Options',
      message: 'It would be amazing if we could select custom neon accent colors in addition to Poppo pink.',
      rating: 5,
      isAnonymous: false,
    }
  );
  assert(validFeedback.statusCode === 200, 'Valid feedback submission returns 200 OK');
  assert(validFeedback.json?.feedbackNumber?.startsWith('FB-'), `Feedback reference generated: ${validFeedback.json?.feedbackNumber}`);
  passed += 3;

  // 12. Report a Technical Problem
  console.log('\n--- TEST GROUP 12: TECHNICAL PROBLEM REPORTING ---');
  const validReport = await request(
    {
      path: '/api/help/report-problem',
      method: 'POST',
      headers: { Cookie: authCookieHeader },
    },
    {
      category: 'broken_pages',
      pageOrFeature: '/live/room/9922',
      description: 'Stream player controls stutter when switching video bitrate to 1080p.',
      browserInfo: 'Google Chrome 124.0 on Windows 11',
      deviceType: 'desktop',
    }
  );
  assert(validReport.statusCode === 200, 'Technical problem report returns 200 OK');
  assert(validReport.json?.reportNumber?.startsWith('TR-'), `Report reference generated: ${validReport.json?.reportNumber}`);
  passed += 2;

  console.log('\n=======================================================');
  console.log(`🎉 ALL ${passed} AUTOMATED VERIFICATION TESTS PASSED SUCCESSFULLY!`);
  console.log('=======================================================');
}

runTests().catch((err) => {
  console.error('\n❌ Test suite failed with exception:', err);
  process.exit(1);
});
