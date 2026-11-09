const http = require('http');
const https = require('https');

const BASE_URL = (process.env.TEST_URL || 'http://localhost:3000').trim();

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      rejectUnauthorized: false,
    };

    if (body) {
      const data = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failCount++;
  }
}

async function runTests() {
  console.log('==================================================');
  console.log('POPO LIVE: Phase 5 Module 5.10 Test Suite');
  console.log(`Target: ${BASE_URL}`);
  console.log('==================================================\n');

  const testUserId = `test_viewer_${Date.now()}`;
  let customRuleId = null;

  try {
    // 1. GET /api/party/7001/rules
    const r1 = await request('GET', '/api/party/7001/rules');
    assert(r1.status === 200, 'TEST 01: GET /api/party/7001/rules returns 200 OK');
    assert(r1.body?.success === true, 'TEST 02: Returns success: true');
    assert(r1.body?.policyVersion === 'v1.0', 'TEST 03: Returns active policyVersion: "v1.0"');

    // 2. Canonical 5 Rules verification
    const rules = r1.body?.rules || [];
    assert(rules.length >= 5, `TEST 04: Contains at least 5 rules (Found ${rules.length})`);

    const titles = rules.map((r) => r.title);
    assert(titles.includes('Be respectful to everyone'), 'TEST 05: Rule 1: "Be respectful to everyone" exists');
    assert(titles.includes('No hate or abusive content'), 'TEST 06: Rule 2: "No hate or abusive content" exists');
    assert(titles.includes('No inappropriate content'), 'TEST 07: Rule 3: "No inappropriate content" exists');
    assert(titles.includes('No spam or promotion'), 'TEST 08: Rule 4: "No spam or promotion" exists');
    assert(titles.includes('Follow Popo Live guidelines'), 'TEST 09: Rule 5: "Follow Popo Live guidelines" exists');

    // 3. Icons verification
    const icons = rules.map((r) => r.icon);
    assert(icons.includes('respect'), 'TEST 10: Rule icon "respect" is present');
    assert(icons.includes('hate_speech'), 'TEST 11: Rule icon "hate_speech" is present');
    assert(icons.includes('inappropriate'), 'TEST 12: Rule icon "inappropriate" is present');
    assert(icons.includes('spam'), 'TEST 13: Rule icon "spam" is present');
    assert(icons.includes('guidelines'), 'TEST 14: Rule icon "guidelines" is present');

    // 4. Initial Acceptance status check for new user
    const r2 = await request('GET', `/api/party/7001/rules?userId=${testUserId}`);
    assert(r2.status === 200, 'TEST 15: GET rules for new user returns 200 OK');
    assert(r2.body?.hasAccepted === false, 'TEST 16: New user hasAccepted is false initially');

    // 5. Accept Rules Validation: missing userId
    const r3 = await request('POST', '/api/party/7001/rules/accept', {});
    assert(r3.status === 400, 'TEST 17: Accept rules rejects missing userId (400 Bad Request)');

    // 6. Accept Rules: valid user acceptance
    const r4 = await request('POST', '/api/party/7001/rules/accept', {
      userId: testUserId,
      policyVersion: 'v1.0',
    });
    assert(r4.status === 200, 'TEST 18: POST /api/party/7001/rules/accept returns 200 OK');
    assert(r4.body?.success === true, 'TEST 19: Accept response returns success: true');
    assert(Boolean(r4.body?.acceptedAt), 'TEST 20: Accept response records valid acceptedAt timestamp');

    // 7. Verify acceptance persisted
    const r5 = await request('GET', `/api/party/7001/rules?userId=${testUserId}`);
    assert(r5.body?.hasAccepted === true, 'TEST 21: GET rules shows hasAccepted: true after acceptance');
    assert(r5.body?.acceptedAt !== null, 'TEST 22: GET rules returns persisted acceptedAt timestamp');

    // 8. Re-acceptance idempotency (no duplicate errors)
    const r6 = await request('POST', '/api/party/7001/rules/accept', {
      userId: testUserId,
      policyVersion: 'v1.0',
    });
    assert(r6.status === 200, 'TEST 23: Re-acceptance is idempotent (200 OK)');

    // 9. Host Management: Add custom guideline
    const r7 = await request('POST', '/api/party/7001/rules', {
      title: 'Mute microphone when someone is singing',
      description: 'Host custom room guideline for karaoke sessions.',
      isHostAction: true,
      hostId: 'host_maria_7001',
    });
    assert(r7.status === 200, 'TEST 24: Host creates custom party guideline (200 OK)');
    assert(r7.body?.rule?.isMandatory === false, 'TEST 25: Custom guideline has isMandatory: false');
    customRuleId = r7.body?.rule?.id;
    assert(Boolean(customRuleId), 'TEST 26: Custom rule returns generated rule ID');

    // 10. Platform Protection: Cannot delete mandatory platform rule
    const r8 = await request('DELETE', '/api/party/7001/rules?ruleId=rule_respect');
    assert(r8.status === 403, 'TEST 27: Rejects deleting mandatory platform rule (403 Forbidden)');

    // 11. Host deletes custom rule
    if (customRuleId) {
      const r9 = await request('DELETE', `/api/party/7001/rules?ruleId=${customRuleId}`);
      assert(r9.status === 200, 'TEST 28: Host successfully deletes custom guideline (200 OK)');
    } else {
      assert(false, 'TEST 28: Skipped custom rule deletion (no ID)');
    }

    // 12. Safety Tools: Report party rule violation
    const r10 = await request('POST', '/api/party/7001/rules/report', {
      reporterId: testUserId,
      reportedUserId: 'abusive_user_999',
      ruleId: 'rule_hate_speech',
      reason: 'User posted abusive messages in chat.',
    });
    assert(r10.status === 200, 'TEST 29: Safety Tools report violation returns 200 OK');
    assert(Boolean(r10.body?.violationId), 'TEST 30: Violation recorded with UUID');

    // 13. Access Control: Audience join with requireRulesCheck
    const unacceptedUser = `unaccepted_${Date.now()}`;
    const r11 = await request('POST', '/api/party/7001/audience/join', {
      userId: unacceptedUser,
      userName: 'Unaccepted User',
      requireRulesCheck: true,
    });
    assert(r11.status === 403, 'TEST 31: Audience join rejects unaccepted user when requireRulesCheck is true (403)');
    assert(r11.body?.code === 'RULES_ACCEPTANCE_REQUIRED', 'TEST 32: Returns RULES_ACCEPTANCE_REQUIRED error code');

    // 14. Access Control: Audience join with acceptedRules flag
    const r12 = await request('POST', '/api/party/7001/audience/join', {
      userId: unacceptedUser,
      userName: 'Accepted User',
      acceptedRules: true,
    });
    assert(r12.status === 200, 'TEST 33: Audience join succeeds with acceptedRules: true');

    // 15. Web UI Pages Loading
    const r13 = await request('GET', '/party/rules?preview=demo');
    assert(r13.status === 200, 'TEST 34: GET /party/rules loads successfully (200 OK)');

    const r14 = await request('GET', '/party/room/7001/rules');
    assert(r14.status === 200, 'TEST 35: GET /party/room/7001/rules loads successfully (200 OK)');

    // 16. UI Content checks
    const html = typeof r13.body === 'string' ? r13.body : JSON.stringify(r13.body);
    assert(
      html.includes('Party Rules') || html.includes('05_10 Party Rules'),
      'TEST 36: UI HTML contains Party Rules branding and elements'
    );
  } catch (err) {
    console.error('Test suite execution error:', err);
    failCount++;
  }

  console.log('\n==================================================');
  console.log(`TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('==================================================');

  if (failCount > 0) {
    process.exit(1);
  }
}

runTests();
